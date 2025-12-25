<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../utils/auth.php';
require_once __DIR__ . '/../utils/response.php';

// Only admin can access audit logs
if (!Auth::isAdmin()) {
    sendError('Unauthorized access. Admin only.');
}

header('Content-Type: application/json');

try {
    $db = Database::getConnection();
    
    // Get query parameters
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
    $offset = ($page - 1) * $limit;
    
    $user_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : null;
    $action = isset($_GET['action']) ? $_GET['action'] : null;
    $entity = isset($_GET['entity']) ? $_GET['entity'] : null;
    $start_date = isset($_GET['start_date']) ? $_GET['start_date'] : null;
    $end_date = isset($_GET['end_date']) ? $_GET['end_date'] : null;
    
    // Build query
    $query = "SELECT al.*, u.name as user_name, u.email as user_email 
              FROM audit_logs al 
              LEFT JOIN users u ON al.user_id = u.id 
              WHERE 1=1";
    $params = [];
    
    if ($user_id) {
        $query .= " AND al.user_id = ?";
        $params[] = $user_id;
    }
    if ($action) {
        $query .= " AND al.action = ?";
        $params[] = $action;
    }
    if ($entity) {
        $query .= " AND al.entity_type = ?";
        $params[] = $entity;
    }
    if ($start_date) {
        $query .= " AND al.created_at >= ?";
        $params[] = $start_date . ' 00:00:00';
    }
    if ($end_date) {
        $query .= " AND al.created_at <= ?";
        $params[] = $end_date . ' 23:59:59';
    }
    
    // Count total records
    $countQuery = "SELECT COUNT(*) as total FROM audit_logs al WHERE 1=1" . 
                  ($user_id ? " AND user_id = $user_id" : "") .
                  ($action ? " AND action = '$action'" : "") .
                  ($entity ? " AND entity_type = '$entity'" : "");
    $countResult = $db->query($countQuery);
    $total = $countResult->fetch_assoc()['total'];
    
    // Get paginated data
    $query .= " ORDER BY al.created_at DESC LIMIT ? OFFSET ?";
    $params[] = $limit;
    $params[] = $offset;
    
    $stmt = $db->prepare($query);
    
    // Bind parameters
    if ($params) {
        $types = str_repeat('s', count($params));
        $stmt->bind_param($types, ...$params);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    $logs = [];
    
    while ($row = $result->fetch_assoc()) {
        // Decode details if it's JSON
        if ($row['details'] && $row['details'][0] === '{') {
            $row['details'] = json_decode($row['details'], true);
        }
        $logs[] = $row;
    }
    
    sendSuccess([
        'logs' => $logs,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => $total,
            'pages' => ceil($total / $limit)
        ]
    ]);
    
} catch (Exception $e) {
    sendError('Failed to fetch audit logs: ' . $e->getMessage());
}
?>