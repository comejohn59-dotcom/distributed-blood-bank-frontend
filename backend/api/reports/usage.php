<?php
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../utils/auth.php';
require_once __DIR__ . '/../../utils/response.php';

// Only admin and blood bank staff can access usage reports
if (!Auth::isAdmin() && !Auth::isBloodBank()) {
    sendError('Unauthorized access.');
}

header('Content-Type: application/json');

try {
    $db = Database::getConnection();
    $current_user = Auth::getCurrentUser();
    
    // Get parameters
    $blood_bank_id = isset($_GET['blood_bank_id']) ? (int)$_GET['blood_bank_id'] : null;
    $blood_group = isset($_GET['blood_group']) ? $_GET['blood_group'] : null;
    $start_date = isset($_GET['start_date']) ? $_GET['start_date'] : date('Y-m-01', strtotime('-1 month'));
    $end_date = isset($_GET['end_date']) ? $_GET['end_date'] : date('Y-m-d');
    $group_by = isset($_GET['group_by']) ? $_GET['group_by'] : 'daily'; // daily, weekly, monthly
    
    // Blood bank staff can only see their own usage
    if (Auth::isBloodBank() && !Auth::isAdmin()) {
        $blood_bank_id = $current_user['blood_bank_id'];
    }
    
    // Build WHERE clause
    $whereClause = "WHERE 1=1";
    $params = [];
    $types = '';
    
    if ($blood_bank_id) {
        $whereClause .= " AND blood_bank_id = ?";
        $params[] = $blood_bank_id;
        $types .= 'i';
    }
    
    if ($blood_group) {
        $whereClause .= " AND blood_group = ?";
        $params[] = $blood_group;
        $types .= 's';
    }
    
    if ($start_date) {
        $whereClause .= " AND usage_date >= ?";
        $params[] = $start_date;
        $types .= 's';
    }
    
    if ($end_date) {
        $whereClause .= " AND usage_date <= ?";
        $params[] = $end_date;
        $types .= 's';
    }
    
    // Determine grouping format
    switch ($group_by) {
        case 'weekly':
            $groupFormat = "DATE_FORMAT(usage_date, '%Y-%u')";
            $labelFormat = "CONCAT('Week ', DATE_FORMAT(usage_date, '%u, %Y'))";
            break;
        case 'monthly':
            $groupFormat = "DATE_FORMAT(usage_date, '%Y-%m')";
            $labelFormat = "DATE_FORMAT(usage_date, '%M %Y')";
            break;
        default: // daily
            $groupFormat = "usage_date";
            $labelFormat = "usage_date";
    }
    
    // 1. Blood Usage by Time Period
    $usageQuery = "
        SELECT 
            $groupFormat as period,
            $labelFormat as period_label,
            blood_group,
            SUM(units_used) as total_units_used,
            COUNT(DISTINCT request_id) as request_count,
            SUM(CASE WHEN priority = 'emergency' THEN units_used ELSE 0 END) as emergency_units,
            SUM(CASE WHEN priority = 'normal' THEN units_used ELSE 0 END) as normal_units
        FROM blood_usage_log 
        $whereClause
        GROUP BY $groupFormat, blood_group
        ORDER BY period DESC, blood_group";
    
    $stmt = $db->prepare($usageQuery);
    if ($params) {
        $stmt->bind_param($types, ...$params);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    $usage_by_period = [];
    
    while ($row = $result->fetch_assoc()) {
        $usage_by_period[] = $row;
    }
    
    // 2. Usage by Blood Bank (only for admin)
    $usage_by_bank = [];
    if (Auth::isAdmin() && !$blood_bank_id) {
        $bankQuery = "
            SELECT 
                bb.name as blood_bank_name,
                bul.blood_group,
                SUM(bul.units_used) as total_units_used,
                COUNT(DISTINCT bul.request_id) as request_count,
                ROUND(SUM(bul.units_used) * 100.0 / 
                    (SELECT SUM(units_used) FROM blood_usage_log 
                     WHERE usage_date BETWEEN ? AND ?), 2) as percentage_of_total
            FROM blood_usage_log bul
            INNER JOIN blood_banks bb ON bul.blood_bank_id = bb.id
            WHERE bul.usage_date BETWEEN ? AND ?
            GROUP BY bul.blood_bank_id, bul.blood_group
            ORDER BY total_units_used DESC";
        
        $stmt = $db->prepare($bankQuery);
        $stmt->bind_param('ssss', $start_date, $end_date, $start_date, $end_date);
        $stmt->execute();
        $result = $stmt->get_result();
        
        while ($row = $result->fetch_assoc()) {
            $usage_by_bank[] = $row;
        }
    }
    
    // 3. Usage by Hospital/Requester
    $usage_by_requester = [];
    if (!$blood_group) { // Only show when not filtered by blood group
        $requesterQuery = "
            SELECT 
                u.name as requester_name,
                u.role as requester_role,
                br.hospital_name,
                bul.blood_group,
                SUM(bul.units_used) as total_units_used,
                COUNT(DISTINCT bul.request_id) as request_count
            FROM blood_usage_log bul
            INNER JOIN blood_requests br ON bul.request_id = br.id
            INNER JOIN users u ON br.created_by = u.id
            WHERE bul.usage_date BETWEEN ? AND ?";
        
        if ($blood_bank_id) {
            $requesterQuery .= " AND bul.blood_bank_id = ?";
        }
        
        $requesterQuery .= " GROUP BY br.created_by, bul.blood_group
                           ORDER BY total_units_used DESC
                           LIMIT 20";
        
        $stmt = $db->prepare($requesterQuery);
        if ($blood_bank_id) {
            $stmt->bind_param('ssi', $start_date, $end_date, $blood_bank_id);
        } else {
            $stmt->bind_param('ss', $start_date, $end_date);
        }
        
        $stmt->execute();
        $result = $stmt->get_result();
        
        while ($row = $result->fetch_assoc()) {
            $usage_by_requester[] = $row;
        }
    }
    
    // 4. Expired Blood Statistics
    $expiredQuery = "
        SELECT 
            blood_group,
            SUM(quantity) as expired_units,
            COUNT(*) as expired_batches,
            AVG(DATEDIFF(expiry_date, collection_date)) as avg_shelf_life_days
        FROM blood_inventory 
        WHERE expiry_date < NOW() 
          AND quantity > 0
          AND expiry_date BETWEEN ? AND ?";
    
    if ($blood_bank_id) {
        $expiredQuery .= " AND blood_bank_id = ?";
    }
    
    $expiredQuery .= " GROUP BY blood_group ORDER BY expired_units DESC";
    
    $stmt = $db->prepare($expiredQuery);
    if ($blood_bank_id) {
        $stmt->bind_param('ssi', $start_date, $end_date, $blood_bank_id);
    } else {
        $stmt->bind_param('ss', $start_date, $end_date);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    $expired_blood = [];
    
    while ($row = $result->fetch_assoc()) {
        // Calculate waste percentage
        $totalQuery = "SELECT SUM(quantity) as total_units FROM blood_inventory 
                      WHERE collection_date BETWEEN ? AND ?";
        if ($blood_bank_id) {
            $totalQuery .= " AND blood_bank_id = ?";
        }
        
        $totalStmt = $db->prepare($totalQuery);
        if ($blood_bank_id) {
            $totalStmt->bind_param('ssi', $start_date, $end_date, $blood_bank_id);
        } else {
            $totalStmt->bind_param('ss', $start_date, $end_date);
        }
        
        $totalStmt->execute();
        $totalResult = $totalStmt->get_result()->fetch_assoc();
        $totalUnits = $totalResult['total_units'] ?? 1;
        
        $row['waste_percentage'] = round(($row['expired_units'] / $totalUnits) * 100, 2);
        $expired_blood[] = $row;
    }
    
    // 5. Utilization Rate Calculation
    $utilizationQuery = "
        SELECT 
            blood_group,
            SUM(CASE WHEN expiry_date >= NOW() THEN quantity ELSE 0 END) as current_stock,
            SUM(CASE WHEN usage_date BETWEEN ? AND ? THEN units_used ELSE 0 END) as units_used,
            ROUND(
                SUM(CASE WHEN usage_date BETWEEN ? AND ? THEN units_used ELSE 0 END) * 100.0 / 
                (SUM(CASE WHEN expiry_date >= NOW() THEN quantity ELSE 0 END) + 
                 SUM(CASE WHEN usage_date BETWEEN ? AND ? THEN units_used ELSE 0 END))
            , 2) as utilization_rate
        FROM (
            SELECT blood_group, quantity, expiry_date, NULL as units_used, NULL as usage_date
            FROM blood_inventory 
            WHERE 1=1";
    
    if ($blood_bank_id) {
        $utilizationQuery .= " AND blood_bank_id = $blood_bank_id";
    }
    
    $utilizationQuery .= "
            UNION ALL
            SELECT blood_group, NULL as quantity, NULL as expiry_date, units_used, usage_date
            FROM blood_usage_log 
            WHERE 1=1";
    
    if ($blood_bank_id) {
        $utilizationQuery .= " AND blood_bank_id = $blood_bank_id";
    }
    
    $utilizationQuery .= ") as combined_data
        GROUP BY blood_group
        HAVING current_stock > 0 OR units_used > 0
        ORDER BY utilization_rate DESC";
    
    $stmt = $db->prepare($utilizationQuery);
    $stmt->bind_param('ssssss', $start_date, $end_date, $start_date, $end_date, $start_date, $end_date);
    $stmt->execute();
    $result = $stmt->get_result();
    $utilization_rates = [];
    
    while ($row = $result->fetch_assoc()) {
        $utilization_rates[] = $row;
    }
    
    sendSuccess([
        'usage_by_period' => $usage_by_period,
        'usage_by_bank' => $usage_by_bank,
        'usage_by_requester' => $usage_by_requester,
        'expired_blood' => $expired_blood,
        'utilization_rates' => $utilization_rates,
        'report_parameters' => [
            'blood_bank_id' => $blood_bank_id,
            'blood_group' => $blood_group,
            'start_date' => $start_date,
            'end_date' => $end_date,
            'group_by' => $group_by
        ],
        'generated_at' => date('Y-m-d H:i:s')
    ]);
    
} catch (Exception $e) {
    sendError('Failed to generate usage report: ' . $e->getMessage());
}
?>