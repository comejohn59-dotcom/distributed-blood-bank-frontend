<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../utils/auth.php';
require_once __DIR__ . '/../utils/response.php';
require_once __DIR__ . '/../utils/logger.php';
require_once __DIR__ . '/../config/db.php';

// Handle different HTTP methods
$method = $_SERVER['REQUEST_METHOD'];

// Initialize auth and database
$auth = new Auth();
$db = new Database();
$conn = $db->getPDO();
$logger = new Logger();

switch ($method) {
    case 'GET':
        // Get users (admin only)
        $user = $auth->checkRole(['admin']);
        
        $query = "SELECT user_id, name, email, role, status, created_at FROM users";
        
        // Apply filters
        $params = [];
        if (isset($_GET['role'])) {
            $query .= " WHERE role = :role";
            $params[':role'] = $_GET['role'];
        }
        
        if (isset($_GET['status'])) {
            $query .= (strpos($query, 'WHERE') !== false ? " AND" : " WHERE");
            $query .= " status = :status";
            $params[':status'] = $_GET['status'];
        }
        
        $query .= " ORDER BY created_at DESC";
        
        $stmt = $conn->prepare($query);
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        
        $stmt->execute();
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Log the action
        $logger->log($user['user_id'], 'view', 'users', null, 'Viewed users list');
        
        Response::success($users);
        break;
        
    case 'POST':
        // Update user status (admin only)
        $user = $auth->checkRole(['admin']);
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['user_id']) || !isset($data['action'])) {
            Response::error("User ID and action are required");
        }
        
        $user_id = $data['user_id'];
        $action = $data['action'];
        
        // Validate action
        if (!in_array($action, ['activate', 'deactivate'])) {
            Response::error("Invalid action");
        }
        
        $status = $action === 'activate' ? 'active' : 'inactive';
        
        $query = "UPDATE users SET status = :status WHERE user_id = :user_id";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':status', $status);
        $stmt->bindParam(':user_id', $user_id);
        
        if ($stmt->execute()) {
            // Log the action
            $logger->log($user['user_id'], $action, 'user', $user_id, "User {$action}d");
            
            Response::success(null, "User {$action}d successfully");
        } else {
            Response::error("Failed to update user");
        }
        break;
        
    case 'PUT':
        // Update user profile
        $user = $auth->validateToken();
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Users can only update their own profile unless admin
        $target_user_id = isset($data['user_id']) ? $data['user_id'] : $user['user_id'];
        
        if ($user['role'] !== 'admin' && $user['user_id'] != $target_user_id) {
            Response::forbidden("You can only update your own profile");
        }
        
        $updates = [];
        $params = [':user_id' => $target_user_id];
        
        if (isset($data['name'])) {
            $updates[] = "name = :name";
            $params[':name'] = $data['name'];
        }
        
        if (isset($data['email'])) {
            // Check if email is already taken
            $check_query = "SELECT user_id FROM users WHERE email = :email AND user_id != :user_id";
            $check_stmt = $conn->prepare($check_query);
            $check_stmt->bindParam(':email', $data['email']);
            $check_stmt->bindParam(':user_id', $target_user_id);
            $check_stmt->execute();
            
            if ($check_stmt->rowCount() > 0) {
                Response::error("Email already in use");
            }
            
            $updates[] = "email = :email";
            $params[':email'] = filter_var($data['email'], FILTER_SANITIZE_EMAIL);
        }
        
        if (empty($updates)) {
            Response::error("No fields to update");
        }
        
        $query = "UPDATE users SET " . implode(', ', $updates) . " WHERE user_id = :user_id";
        $stmt = $conn->prepare($query);
        
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        
        if ($stmt->execute()) {
            // Log the action
            $logger->log($user['user_id'], 'update', 'user', $target_user_id, "User profile updated");
            
            Response::success(null, "Profile updated successfully");
        } else {
            Response::error("Failed to update profile");
        }
        break;
        
    default:
        Response::error("Method not allowed", 405);
}
?>