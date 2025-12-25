<?php
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../utils/auth.php';
require_once __DIR__ . '/../../utils/response.php';

// Only admin and blood bank staff can access shortage reports
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
    $threshold = isset($_GET['threshold']) ? (int)$_GET['threshold'] : 10; // Default threshold
    
    // Blood bank staff can only see their own shortages
    if (Auth::isBloodBank() && !Auth::isAdmin()) {
        $blood_bank_id = $current_user['blood_bank_id'];
    }
    
    // Query for current inventory below threshold
    $query = "SELECT 
                bb.name as blood_bank_name,
                bi.blood_group,
                SUM(bi.quantity) as current_quantity,
                COUNT(DISTINCT bi.id) as inventory_items,
                MIN(bi.expiry_date) as earliest_expiry,
                COUNT(DISTINCT br.id) as pending_requests
              FROM blood_inventory bi
              INNER JOIN blood_banks bb ON bi.blood_bank_id = bb.id
              LEFT JOIN blood_requests br ON br.blood_bank_id = bi.blood_bank_id 
                AND br.blood_group = bi.blood_group 
                AND br.status = 'pending'
              WHERE bi.quantity > 0 
                AND bb.status = 'active'";
    
    $params = [];
    $types = '';
    
    if ($blood_bank_id) {
        $query .= " AND bi.blood_bank_id = ?";
        $params[] = $blood_bank_id;
        $types .= 'i';
    }
    
    if ($blood_group) {
        $query .= " AND bi.blood_group = ?";
        $params[] = $blood_group;
        $types .= 's';
    }
    
    $query .= " GROUP BY bi.blood_bank_id, bi.blood_group
                HAVING current_quantity < ?";
    
    $params[] = $threshold;
    $types .= 'i';
    
    $stmt = $db->prepare($query);
    if ($params) {
        $stmt->bind_param($types, ...$params);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    $shortages = [];
    
    while ($row = $result->fetch_assoc()) {
        $row['shortage_level'] = 'critical';
        if ($row['current_quantity'] >= $threshold * 0.5) {
            $row['shortage_level'] = 'warning';
        }
        
        // Calculate shortage percentage
        $row['shortage_percentage'] = round((1 - ($row['current_quantity'] / $threshold)) * 100, 2);
        
        // Get available donors for this blood group
        $donorQuery = "SELECT COUNT(*) as available_donors 
                      FROM donors d
                      INNER JOIN users u ON d.user_id = u.id
                      WHERE d.blood_group = ? 
                        AND d.status = 'active'
                        AND (d.last_health_check IS NULL OR d.last_health_check >= DATE_SUB(NOW(), INTERVAL 1 YEAR))";
        
        if ($blood_bank_id) {
            $donorQuery .= " AND (d.preferred_bank_id = ? OR d.preferred_bank_id IS NULL)";
        }
        
        $donorStmt = $db->prepare($donorQuery);
        if ($blood_bank_id) {
            $donorStmt->bind_param('si', $row['blood_group'], $blood_bank_id);
        } else {
            $donorStmt->bind_param('s', $row['blood_group']);
        }
        $donorStmt->execute();
        $donorResult = $donorStmt->get_result()->fetch_assoc();
        $row['available_donors'] = $donorResult['available_donors'];
        
        $shortages[] = $row;
    }
    
    // Get historical shortage trends (last 30 days)
    $trendQuery = "
        SELECT 
            DATE(created_at) as date,
            blood_group,
            COUNT(*) as shortage_alerts
        FROM notifications 
        WHERE type = 'shortage_alert' 
          AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY DATE(created_at), blood_group
        ORDER BY date DESC";
    
    $trendResult = $db->query($trendQuery);
    $trends = [];
    
    while ($row = $trendResult->fetch_assoc()) {
        $trends[] = $row;
    }
    
    sendSuccess([
        'shortages' => $shortages,
        'trends' => $trends,
        'threshold' => $threshold,
        'report_date' => date('Y-m-d H:i:s')
    ]);
    
} catch (Exception $e) {
    sendError('Failed to generate shortage report: ' . $e->getMessage());
}
?>