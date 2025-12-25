<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../utils/auth.php';
require_once __DIR__ . '/../utils/response.php';
require_once __DIR__ . '/../utils/logger.php';
require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$auth = new Auth();
$db = new Database();
$conn = $db->getPDO();

switch ($method) {
    case 'GET':
        $user = $auth->validateToken();
        
        $query = "SELECT * FROM notifications WHERE user_id = :user_id";
        
        // Apply filters
        if (isset($_GET['status'])) {
            $query .= " AND status = :status";
        }
        
        if (isset($_GET['type'])) {
            $query .= " AND type = :type";
        }
        
        $query .= " ORDER BY created_at DESC";
        
        // Limit for dashboard
        if (isset($_GET['limit'])) {
            $query .= " LIMIT :limit";
        }
        
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':user_id', $user['user_id']);
        
        if (isset($_GET['status'])) {
            $stmt->bindParam(':status', $_GET['status']);
        }
        
        if (isset($_GET['type'])) {
            $stmt->bindParam(':type', $_GET['type']);
        }
        
        if (isset($_GET['limit'])) {
            $stmt->bindParam(':limit', $_GET['limit'], PDO::PARAM_INT);
        }
        
        $stmt->execute();
        $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get unread count
        $count_query = "SELECT COUNT(*) as unread_count FROM notifications 
                       WHERE user_id = :user_id AND status = 'unread'";
        $count_stmt = $conn->prepare($count_query);
        $count_stmt->bindParam(':user_id', $user['user_id']);
        $count_stmt->execute();
        $count_result = $count_stmt->fetch(PDO::FETCH_ASSOC);
        
        Response::success([
            'notifications' => $notifications,
            'unread_count' => $count_result['unread_count'] ?? 0
        ]);
        break;
        
    case 'PUT':
        // Mark notifications as read
        $user = $auth->validateToken();
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['notification_ids'])) {
            Response::error("Notification IDs are required");
        }
        
        // Convert to array if single ID
        $ids = is_array($data['notification_ids']) ? $data['notification_ids'] : [$data['notification_ids']];
        
        // Create placeholders
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        
        $query = "UPDATE notifications SET status = 'read' 
                  WHERE notification_id IN ($placeholders) AND user_id = ?";
        
        $stmt = $conn->prepare($query);
        
        // Bind parameters
        $param_index = 1;
        foreach ($ids as $id) {
            $stmt->bindValue($param_index++, $id, PDO::PARAM_INT);
        }
        $stmt->bindValue($param_index, $user['user_id'], PDO::PARAM_INT);
        
        if ($stmt->execute()) {
            Response::success(null, "Notifications marked as read");
        } else {
            Response::error("Failed to update notifications");
        }
        break;
        
    default:
        Response::error("Method not allowed", 405);
}
?>