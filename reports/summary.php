<?php
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../utils/auth.php';
require_once __DIR__ . '/../../utils/response.php';

// Only admin and blood bank staff can access summary reports
if (!Auth::isAdmin() && !Auth::isBloodBank()) {
    sendError('Unauthorized access.');
}

header('Content-Type: application/json');

try {
    $db = Database::getConnection();
    $current_user = Auth::getCurrentUser();
    
    // Get parameters
    $blood_bank_id = isset($_GET['blood_bank_id']) ? (int)$_GET['blood_bank_id'] : null;
    $start_date = isset($_GET['start_date']) ? $_GET['start_date'] : date('Y-m-01'); // Start of current month
    $end_date = isset($_GET['end_date']) ? $_GET['end_date'] : date('Y-m-d');
    
    // Blood bank staff can only see their own summary
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
    
    if ($start_date) {
        $whereClause .= " AND created_at >= ?";
        $params[] = $start_date . ' 00:00:00';
        $types .= 's';
    }
    
    if ($end_date) {
        $whereClause .= " AND created_at <= ?";
        $params[] = $end_date . ' 23:59:59';
        $types .= 's';
    }
    
    // 1. Overall Statistics
    $stats = [];
    
    // Total blood units in system
    $totalUnitsQuery = "SELECT SUM(quantity) as total_units FROM blood_inventory WHERE quantity > 0";
    if ($blood_bank_id) {
        $totalUnitsQuery .= " AND blood_bank_id = $blood_bank_id";
    }
    $result = $db->query($totalUnitsQuery);
    $stats['total_blood_units'] = $result->fetch_assoc()['total_units'] ?? 0;
    
    // Active donors
    $donorsQuery = "SELECT COUNT(*) as total_donors FROM donors WHERE status = 'active'";
    if ($blood_bank_id) {
        $donorsQuery .= " AND preferred_bank_id = $blood_bank_id";
    }
    $result = $db->query($donorsQuery);
    $stats['active_donors'] = $result->fetch_assoc()['total_donors'] ?? 0;
    
    // Total blood banks
    $banksQuery = "SELECT COUNT(*) as total_banks FROM blood_banks WHERE status = 'active'";
    $result = $db->query($banksQuery);
    $stats['active_blood_banks'] = $result->fetch_assoc()['total_banks'] ?? 0;
    
    // Recent donations (last 30 days)
    $donationsQuery = "SELECT COUNT(*) as recent_donations FROM donations 
                      WHERE donation_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
    if ($blood_bank_id) {
        $donationsQuery .= " AND blood_bank_id = $blood_bank_id";
    }
    $result = $db->query($donationsQuery);
    $stats['recent_donations'] = $result->fetch_assoc()['recent_donations'] ?? 0;
    
    // Fulfilled requests (date range)
    $requestsQuery = "SELECT COUNT(*) as fulfilled_requests FROM blood_requests 
                     WHERE status = 'approved' AND updated_at BETWEEN ? AND ?";
    if ($blood_bank_id) {
        $requestsQuery .= " AND blood_bank_id = $blood_bank_id";
    }
    $stmt = $db->prepare($requestsQuery);
    $stmt->bind_param('ss', $start_date, $end_date);
    $stmt->execute();
    $result = $stmt->get_result();
    $stats['fulfilled_requests'] = $result->fetch_assoc()['fulfilled_requests'] ?? 0;
    
    // 2. Blood Group Distribution
    $groupQuery = "
        SELECT 
            blood_group,
            SUM(quantity) as total_units,
            COUNT(DISTINCT blood_bank_id) as banks_with_stock,
            AVG(quantity) as avg_per_bank
        FROM blood_inventory 
        WHERE quantity > 0";
    
    if ($blood_bank_id) {
        $groupQuery .= " AND blood_bank_id = $blood_bank_id";
    }
    
    $groupQuery .= " GROUP BY blood_group ORDER BY total_units DESC";
    
    $result = $db->query($groupQuery);
    $blood_group_distribution = [];
    
    while ($row = $result->fetch_assoc()) {
        $blood_group_distribution[] = $row;
    }
    
    // 3. Monthly Trends
    $trendQuery = "
        SELECT 
            DATE_FORMAT(donation_date, '%Y-%m') as month,
            COUNT(*) as donation_count,
            SUM(quantity_ml)/1000 as total_liters
        FROM donations 
        WHERE donation_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)";
    
    if ($blood_bank_id) {
        $trendQuery .= " AND blood_bank_id = $blood_bank_id";
    }
    
    $trendQuery .= " GROUP BY DATE_FORMAT(donation_date, '%Y-%m') 
                    ORDER BY month DESC 
                    LIMIT 6";
    
    $result = $db->query($trendQuery);
    $monthly_trends = [];
    
    while ($row = $result->fetch_assoc()) {
        $monthly_trends[] = $row;
    }
    
    // 4. Blood Bank Performance (only for admin)
    $bank_performance = [];
    if (Auth::isAdmin() && !$blood_bank_id) {
        $performanceQuery = "
            SELECT 
                bb.name as blood_bank_name,
                COUNT(DISTINCT d.id) as total_donors,
                COUNT(DISTINCT dn.id) as total_donations,
                SUM(bi.quantity) as current_inventory,
                COUNT(DISTINCT br.id) as requests_processed,
                ROUND(COUNT(CASE WHEN br.status = 'approved' THEN 1 END) * 100.0 / COUNT(br.id), 2) as approval_rate
            FROM blood_banks bb
            LEFT JOIN donors d ON d.preferred_bank_id = bb.id
            LEFT JOIN donations dn ON dn.blood_bank_id = bb.id AND dn.donation_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            LEFT JOIN blood_inventory bi ON bi.blood_bank_id = bb.id
            LEFT JOIN blood_requests br ON br.blood_bank_id = bb.id AND br.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            WHERE bb.status = 'active'
            GROUP BY bb.id
            ORDER BY current_inventory DESC";
        
        $result = $db->query($performanceQuery);
        
        while ($row = $result->fetch_assoc()) {
            $bank_performance[] = $row;
        }
    }
    
    sendSuccess([
        'summary_statistics' => $stats,
        'blood_group_distribution' => $blood_group_distribution,
        'monthly_trends' => $monthly_trends,
        'bank_performance' => $bank_performance,
        'report_period' => [
            'start_date' => $start_date,
            'end_date' => $end_date
        ],
        'generated_at' => date('Y-m-d H:i:s')
    ]);
    
} catch (Exception $e) {
    sendError('Failed to generate summary report: ' . $e->getMessage());
}
?>