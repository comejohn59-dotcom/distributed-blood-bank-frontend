<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../utils/auth.php';
require_once __DIR__ . '/../utils/response.php';

header('Content-Type: application/json');

try {
    $db = Database::getConnection();
    $current_user = Auth::getCurrentUser();
    
    $method = $_SERVER['REQUEST_METHOD'];
    
    switch ($method) {
        case 'GET':
            // GET - List blood banks (admin sees all, others see active only)
            if (Auth::isAdmin()) {
                $query = "SELECT bb.*, 
                         (SELECT COUNT(*) FROM users WHERE blood_bank_id = bb.id AND role = 'blood_bank') as staff_count,
                         (SELECT SUM(quantity) FROM blood_inventory WHERE blood_bank_id = bb.id) as total_inventory
                         FROM blood_banks bb 
                         ORDER BY bb.name";
            } else {
                $query = "SELECT id, name, location, contact_email, contact_phone, status 
                         FROM blood_banks 
                         WHERE status = 'active' 
                         ORDER BY name";
            }
            
            $result = $db->query($query);
            $blood_banks = [];
            
            while ($row = $result->fetch_assoc()) {
                // Calculate distance if location provided
                if (isset($_GET['user_lat']) && isset($_GET['user_lng']) && 
                    isset($row['latitude']) && isset($row['longitude'])) {
                    $distance = calculateDistance(
                        $_GET['user_lat'], $_GET['user_lng'],
                        $row['latitude'], $row['longitude']
                    );
                    $row['distance_km'] = round($distance, 2);
                }
                $blood_banks[] = $row;
            }
            
            sendSuccess(['blood_banks' => $blood_banks]);
            break;
            
        case 'POST':
            // POST - Create new blood bank (admin only)
            if (!Auth::isAdmin()) {
                sendError('Only administrators can create blood banks.');
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Validate required fields
            $required = ['name', 'location', 'contact_email', 'contact_phone'];
            foreach ($required as $field) {
                if (empty($data[$field])) {
                    sendError("Missing required field: $field");
                }
            }
            
            // Insert blood bank
            $stmt = $db->prepare("
                INSERT INTO blood_banks 
                (name, location, contact_email, contact_phone, address, latitude, longitude, status) 
                VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
            ");
            
            $stmt->bind_param(
                'sssssdd',
                $data['name'],
                $data['location'],
                $data['contact_email'],
                $data['contact_phone'],
                $data['address'] ?? '',
                $data['latitude'] ?? null,
                $data['longitude'] ?? null
            );
            
            if ($stmt->execute()) {
                $bank_id = $db->insert_id;
                
                // Log the action
                $logStmt = $db->prepare("
                    INSERT INTO audit_logs 
                    (user_id, action, entity_type, entity_id, details) 
                    VALUES (?, 'create', 'blood_bank', ?, ?)
                ");
                $details = json_encode([
                    'name' => $data['name'],
                    'location' => $data['location']
                ]);
                $logStmt->bind_param('iis', $current_user['id'], $bank_id, $details);
                $logStmt->execute();
                
                sendSuccess([
                    'message' => 'Blood bank created successfully',
                    'blood_bank_id' => $bank_id
                ]);
            } else {
                sendError('Failed to create blood bank: ' . $db->error);
            }
            break;
            
        case 'PUT':
            // PUT - Update blood bank (admin only)
            if (!Auth::isAdmin()) {
                sendError('Only administrators can update blood banks.');
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (empty($data['id'])) {
                sendError('Blood bank ID is required');
            }
            
            // Get existing data for audit log
            $stmt = $db->prepare("SELECT * FROM blood_banks WHERE id = ?");
            $stmt->bind_param('i', $data['id']);
            $stmt->execute();
            $oldData = $stmt->get_result()->fetch_assoc();
            
            // Update blood bank
            $updateFields = [];
            $params = [];
            $types = '';
            
            $fields = ['name', 'location', 'contact_email', 'contact_phone', 
                      'address', 'latitude', 'longitude', 'status'];
            
            foreach ($fields as $field) {
                if (isset($data[$field])) {
                    $updateFields[] = "$field = ?";
                    $params[] = $data[$field];
                    $types .= gettype($data[$field])[0];
                }
            }
            
            if (empty($updateFields)) {
                sendError('No fields to update');
            }
            
            $params[] = $data['id'];
            $types .= 'i';
            
            $query = "UPDATE blood_banks SET " . implode(', ', $updateFields) . " WHERE id = ?";
            $stmt = $db->prepare($query);
            $stmt->bind_param($types, ...$params);
            
            if ($stmt->execute()) {
                // Log the action
                $changes = [];
                foreach ($fields as $field) {
                    if (isset($data[$field]) && $oldData[$field] != $data[$field]) {
                        $changes[$field] = [
                            'old' => $oldData[$field],
                            'new' => $data[$field]
                        ];
                    }
                }
                
                if (!empty($changes)) {
                    $logStmt = $db->prepare("
                        INSERT INTO audit_logs 
                        (user_id, action, entity_type, entity_id, details) 
                        VALUES (?, 'update', 'blood_bank', ?, ?)
                    ");
                    $details = json_encode($changes);
                    $logStmt->bind_param('iis', $current_user['id'], $data['id'], $details);
                    $logStmt->execute();
                }
                
                sendSuccess(['message' => 'Blood bank updated successfully']);
            } else {
                sendError('Failed to update blood bank: ' . $db->error);
            }
            break;
            
        default:
            sendError('Method not allowed', 405);
    }
    
} catch (Exception $e) {
    sendError('Operation failed: ' . $e->getMessage());
}

// Helper function to calculate distance between coordinates
function calculateDistance($lat1, $lon1, $lat2, $lon2) {
    $earthRadius = 6371; // kilometers
    
    $lat1 = deg2rad($lat1);
    $lon1 = deg2rad($lon1);
    $lat2 = deg2rad($lat2);
    $lon2 = deg2rad($lon2);
    
    $latDelta = $lat2 - $lat1;
    $lonDelta = $lon2 - $lon1;
    
    $angle = 2 * asin(sqrt(pow(sin($latDelta / 2), 2) +
        cos($lat1) * cos($lat2) * pow(sin($lonDelta / 2), 2)));
    
    return $angle * $earthRadius;
}
?>