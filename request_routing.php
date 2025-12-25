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
$logger = new Logger();

// Function to route request to nearest blood bank
function routeRequestToNearestBank($request_id, $blood_group, $units_required, $conn, $logger) {
    // Get all blood banks with sufficient inventory
    $query = "SELECT bb.blood_bank_id, bb.name, bb.latitude, bb.longitude, 
                     COALESCE(SUM(bi.quantity), 0) as available_units
              FROM blood_banks bb
              LEFT JOIN blood_inventory bi ON bb.blood_bank_id = bi.blood_bank_id 
                                           AND bi.blood_group = :blood_group
              WHERE bb.status = 'active'
              GROUP BY bb.blood_bank_id
              HAVING available_units >= :units_required
              ORDER BY available_units DESC";
    
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':blood_group', $blood_group);
    $stmt->bindParam(':units_required', $units_required);
    $stmt->execute();
    
    $available_banks = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($available_banks)) {
        return false; // No bank has sufficient stock
    }
    
    // For simplicity, select the first bank with enough stock
    // In real implementation, calculate distance using latitude/longitude
    $selected_bank = $available_banks[0];
    
    // Create routing record
    $routing_query = "INSERT INTO request_routing (request_id, blood_bank_id, routing_status) 
                      VALUES (:request_id, :blood_bank_id, 'assigned')";
    $routing_stmt = $conn->prepare($routing_query);
    $routing_stmt->bindParam(':request_id', $request_id);
    $routing_stmt->bindParam(':blood_bank_id', $selected_bank['blood_bank_id']);
    
    if ($routing_stmt->execute()) {
        // Create notification for blood bank
        $message = "New blood request assigned: {$units_required} units of {$blood_group} required";
        $logger->createNotification($selected_bank['blood_bank_id'], $message, 'emergency', $request_id, 'blood_request');
        
        return $selected_bank['blood_bank_id'];
    }
    
    return false;
}

switch ($method) {
    case 'GET':
        $user = $auth->validateToken();
        
        $query = "SELECT br.*, u.name as requester_name, 
                         GROUP_CONCAT(bb.name SEPARATOR ', ') as assigned_banks
                  FROM blood_requests br
                  JOIN users u ON br.requester_id = u.user_id
                  LEFT JOIN request_routing rr ON br.request_id = rr.request_id
                  LEFT JOIN blood_banks bb ON rr.blood_bank_id = bb.blood_bank_id
                  WHERE 1=1";
        
        $params = [];
        
        // Apply filters based on user role
        if ($user['role'] === 'hospital' || $user['role'] === 'donor') {
            $query .= " AND br.requester_id = :requester_id";
            $params[':requester_id'] = $user['user_id'];
        } elseif ($user['role'] === 'blood_bank') {
            // Get blood bank ID for this user
            $bank_query = "SELECT blood_bank_id FROM blood_banks WHERE name LIKE :name LIMIT 1";
            $bank_stmt = $conn->prepare($bank_query);
            $bank_stmt->bindValue(':name', '%' . $user['name'] . '%');
            $bank_stmt->execute();
            $bank_result = $bank_stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($bank_result) {
                $query .= " AND br.request_id IN (
                    SELECT request_id FROM request_routing 
                    WHERE blood_bank_id = :blood_bank_id
                )";
                $params[':blood_bank_id'] = $bank_result['blood_bank_id'];
            }
        }
        
        // Additional filters
        if (isset($_GET['status'])) {
            $query .= " AND br.status = :status";
            $params[':status'] = $_GET['status'];
        }
        
        if (isset($_GET['priority'])) {
            $query .= " AND br.priority = :priority";
            $params[':priority'] = $_GET['priority'];
        }
        
        if (isset($_GET['blood_group'])) {
            $query .= " AND br.blood_group = :blood_group";
            $params[':blood_group'] = $_GET['blood_group'];
        }
        
        $query .= " GROUP BY br.request_id ORDER BY br.created_at DESC";
        
        // Limit for dashboard
        if (isset($_GET['limit'])) {
            $query .= " LIMIT :limit";
            $params[':limit'] = (int)$_GET['limit'];
        }
        
        $stmt = $conn->prepare($query);
        foreach ($params as $key => $value) {
            if ($key === ':limit') {
                $stmt->bindValue($key, $value, PDO::PARAM_INT);
            } else {
                $stmt->bindValue($key, $value);
            }
        }
        
        $stmt->execute();
        $requests = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        Response::success($requests);
        break;
        
    case 'POST':
        // Create new blood request (hospital/patient only)
        $user = $auth->checkRole(['hospital', 'donor']);
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['blood_group']) || !isset($data['units_required'])) {
            Response::error("Blood group and units required are required");
        }
        
        // Validate blood group
        $valid_blood_groups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
        if (!in_array($data['blood_group'], $valid_blood_groups)) {
            Response::error("Invalid blood group");
        }
        
        // Validate units
        if (!is_numeric($data['units_required']) || $data['units_required'] <= 0) {
            Response::error("Units required must be a positive number");
        }
        
        // Create request
        $query = "INSERT INTO blood_requests (requester_id, requester_type, blood_group, units_required, priority) 
                  VALUES (:requester_id, :requester_type, :blood_group, :units_required, :priority)";
        
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':requester_id', $user['user_id']);
        $stmt->bindParam(':requester_type', $user['role']);
        $stmt->bindParam(':blood_group', $data['blood_group']);
        $stmt->bindParam(':units_required', $data['units_required']);
        $stmt->bindParam(':priority', $data['priority'] ?? 'normal');
        
        if ($stmt->execute()) {
            $request_id = $conn->lastInsertId();
            
            // Log the action
            $logger->log($user['user_id'], 'create', 'blood_request', $request_id, 
                       "Created request for {$data['units_required']} units of {$data['blood_group']}");
            
            // Route request to nearest blood bank
            $routed = routeRequestToNearestBank(
                $request_id, 
                $data['blood_group'], 
                $data['units_required'], 
                $conn, 
                $logger
            );
            
            $message = $routed ? "Request created and routed successfully" : "Request created but no available blood banks found";
            
            Response::success(['request_id' => $request_id], $message);
        } else {
            Response::error("Failed to create request");
        }
        break;
        
    case 'PUT':
        // Update request status (blood bank or admin)
        $user = $auth->checkRole(['blood_bank', 'admin']);
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['request_id']) || !isset($data['action'])) {
            Response::error("Request ID and action are required");
        }
        
        $request_id = $data['request_id'];
        $action = $data['action'];
        
        // Validate action
        if (!in_array($action, ['approve', 'reject', 'fulfill'])) {
            Response::error("Invalid action");
        }
        
        $status_map = [
            'approve' => 'approved',
            'reject' => 'rejected',
            'fulfill' => 'fulfilled'
        ];
        
        $status = $status_map[$action];
        
        // Check if blood bank is authorized for this request
        if ($user['role'] === 'blood_bank') {
            $bank_query = "SELECT blood_bank_id FROM blood_banks WHERE name LIKE :name LIMIT 1";
            $bank_stmt = $conn->prepare($bank_query);
            $bank_stmt->bindValue(':name', '%' . $user['name'] . '%');
            $bank_stmt->execute();
            $bank_result = $bank_stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($bank_result) {
                $check_query = "SELECT routing_id FROM request_routing 
                               WHERE request_id = :request_id AND blood_bank_id = :blood_bank_id";
                $check_stmt = $conn->prepare($check_query);
                $check_stmt->bindParam(':request_id', $request_id);
                $check_stmt->bindParam(':blood_bank_id', $bank_result['blood_bank_id']);
                $check_stmt->execute();
                
                if ($check_stmt->rowCount() === 0) {
                    Response::forbidden("You are not authorized to handle this request");
                }
            }
        }
        
        // Start transaction
        $conn->beginTransaction();
        
        try {
            // Update request status
            $update_query = "UPDATE blood_requests SET status = :status WHERE request_id = :request_id";
            $update_stmt = $conn->prepare($update_query);
            $update_stmt->bindParam(':status', $status);
            $update_stmt->bindParam(':request_id', $request_id);
            $update_stmt->execute();
            
            // If approved or fulfilled, update inventory
            if ($action === 'approve' || $action === 'fulfill') {
                // Get request details
                $req_query = "SELECT blood_group, units_required FROM blood_requests WHERE request_id = :request_id";
                $req_stmt = $conn->prepare($req_query);
                $req_stmt->bindParam(':request_id', $request_id);
                $req_stmt->execute();
                $request_details = $req_stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($request_details) {
                    // Get blood bank ID for this routing
                    $routing_query = "SELECT blood_bank_id FROM request_routing WHERE request_id = :request_id";
                    $routing_stmt = $conn->prepare($routing_query);
                    $routing_stmt->bindParam(':request_id', $request_id);
                    $routing_stmt->execute();
                    $routing = $routing_stmt->fetch(PDO::FETCH_ASSOC);
                    
                    if ($routing) {
                        // Update inventory
                        $inv_query = "UPDATE blood_inventory 
                                     SET quantity = quantity - :units 
                                     WHERE blood_bank_id = :blood_bank_id 
                                     AND blood_group = :blood_group 
                                     AND quantity >= :units";
                        $inv_stmt = $conn->prepare($inv_query);
                        $inv_stmt->bindParam(':units', $request_details['units_required']);
                        $inv_stmt->bindParam(':blood_bank_id', $routing['blood_bank_id']);
                        $inv_stmt->bindParam(':blood_group', $request_details['blood_group']);
                        
                        if (!$inv_stmt->execute()) {
                            throw new Exception("Insufficient inventory or update failed");
                        }
                        
                        // Update routing status
                        $routing_update = "UPDATE request_routing SET routing_status = :status 
                                          WHERE request_id = :request_id AND blood_bank_id = :blood_bank_id";
                        $routing_stmt = $conn->prepare($routing_update);
                        $routing_status = $action === 'fulfill' ? 'fulfilled' : 'accepted';
                        $routing_stmt->bindParam(':status', $routing_status);
                        $routing_stmt->bindParam(':request_id', $request_id);
                        $routing_stmt->bindParam(':blood_bank_id', $routing['blood_bank_id']);
                        $routing_stmt->execute();
                    }
                }
            }
            
            // Commit transaction
            $conn->commit();
            
            // Log the action
            $logger->log($user['user_id'], $action, 'blood_request', $request_id);
            
            // Create notification for requester
            $requester_query = "SELECT requester_id FROM blood_requests WHERE request_id = :request_id";
            $requester_stmt = $conn->prepare($requester_query);
            $requester_stmt->bindParam(':request_id', $request_id);
            $requester_stmt->execute();
            $requester = $requester_stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($requester) {
                $message = "Your blood request #{$request_id} has been {$status}";
                $logger->createNotification($requester['requester_id'], $message, 'info', $request_id, 'blood_request');
            }
            
            Response::success(null, "Request {$action}d successfully");
            
        } catch (Exception $e) {
            $conn->rollBack();
            Response::error("Failed to process request: " . $e->getMessage());
        }
        break;
        
    default:
        Response::error("Method not allowed", 405);
}
?>