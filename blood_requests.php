<?php
/**
 * Blood Requests API
 * Handles blood request creation, approval, and tracking
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../utils/response.php';
require_once __DIR__ . '/../utils/auth.php';
require_once __DIR__ . '/../utils/logger.php';

header('Content-Type: application/json');

// Validate access
$current_user = $auth->validateRequest(['admin', 'blood_bank', 'hospital']);

$method = $_SERVER['REQUEST_METHOD'];
$path = $_SERVER['PATH_INFO'] ?? '';

switch ($method) {
    case 'GET':
        handleGetRequests($path);
        break;
    case 'POST':
        handlePostRequests($path);
        break;
    case 'PUT':
        handlePutRequests($path);
        break;
    default:
        Response::error('Method not allowed', [], 405);
}

function handleGetRequests($path) {
    global $db, $current_user, $auth;
    
    if ($path === '' || $path === '/') {
        // Get requests with filters
        $filters = [];
        $params = [];
        
        // Role-based filtering
        if ($auth->hasRole('hospital')) {
            // Hospitals can only see their own requests
            $hospital_sql = "SELECT hospital_id FROM hospitals WHERE user_id = ?";
            $hospital = $db->fetchOne($hospital_sql, [$current_user['user_id']]);
            if ($hospital) {
                $filters[] = "requester_id = ? AND requester_type = 'hospital'";
                $params[] = $hospital['hospital_id'];
            }
        } elseif ($auth->hasRole('blood_bank')) {
            // Blood banks can see requests routed to them
            $bank_sql = "SELECT blood_bank_id FROM blood_banks WHERE user_id = ?";
            $bank = $db->fetchOne($bank_sql, [$current_user['user_id']]);
            if ($bank) {
                $filters[] = "rq.request_id IN (
                    SELECT request_id FROM request_routing 
                    WHERE blood_bank_id = ?
                )";
                $params[] = $bank['blood_bank_id'];
            }
        }
        
        if (!empty($_GET['status'])) {
            $filters[] = "br.status = ?";
            $params[] = $_GET['status'];
        }
        
        if (!empty($_GET['priority'])) {
            $filters[] = "br.priority = ?";
            $params[] = $_GET['priority'];
        }
        
        if (!empty($_GET['blood_group'])) {
            $filters[] = "br.blood_group = ?";
            $params[] = $_GET['blood_group'];
        }
        
        if (!empty($_GET['requester_type'])) {
            $filters[] = "br.requester_type = ?";
            $params[] = $_GET['requester_type'];
        }
        
        if (!empty($_GET['start_date'])) {
            $filters[] = "DATE(br.created_at) >= ?";
            $params[] = $_GET['start_date'];
        }
        
        if (!empty($_GET['end_date'])) {
            $filters[] = "DATE(br.created_at) <= ?";
            $params[] = $_GET['end_date'];
        }
        
        $where = $filters ? "WHERE " . implode(" AND ", $filters) : "";
        
        // Get requests with details
        $sql = "SELECT 
                    br.*,
                    CASE 
                        WHEN br.requester_type = 'hospital' THEN h.name
                        ELSE 'Patient'
                    END as requester_name,
                    CASE 
                        WHEN br.requester_type = 'hospital' THEN h.contact_number
                        ELSE NULL
                    END as contact_number,
                    (SELECT COUNT(*) FROM request_routing rr WHERE rr.request_id = br.request_id) as bank_count,
                    (SELECT COUNT(*) FROM request_routing rr WHERE rr.request_id = br.request_id AND rr.routing_status = 'accepted') as accepted_count
                FROM blood_requests br
                LEFT JOIN hospitals h ON br.requester_id = h.hospital_id AND br.requester_type = 'hospital'
                {$where}
                ORDER BY 
                    CASE br.priority 
                        WHEN 'emergency' THEN 1
                        WHEN 'urgent' THEN 2
                        ELSE 3
                    END,
                    br.created_at DESC";
        
        $requests = $db->fetchAll($sql, $params);
        
        // Get routing details for each request
        foreach ($requests as &$request) {
            $routing_sql = "SELECT 
                                rr.*,
                                bb.name as blood_bank_name,
                                bb.city,
                                bb.contact_number
                            FROM request_routing rr
                            JOIN blood_banks bb ON rr.blood_bank_id = bb.blood_bank_id
                            WHERE rr.request_id = ?
                            ORDER BY rr.distance";
            
            $routing = $db->fetchAll($routing_sql, [$request['request_id']]);
            $request['routing_details'] = $routing;
        }
        
        Response::success('Requests retrieved', $requests);
        
    } elseif (preg_match('/^\/(\d+)$/', $path, $matches)) {
        // Get specific request
        $request_id = $matches[1];
        
        $sql = "SELECT 
                    br.*,
                    CASE 
                        WHEN br.requester_type = 'hospital' THEN h.name
                        ELSE 'Patient'
                    END as requester_name,
                    CASE 
                        WHEN br.requester_type = 'hospital' THEN h.contact_number
                        ELSE NULL
                    END as contact_number
                FROM blood_requests br
                LEFT JOIN hospitals h ON br.requester_id = h.hospital_id AND br.requester_type = 'hospital'
                WHERE br.request_id = ?";
        
        $request = $db->fetchOne($sql, [$request_id]);
        
        if (!$request) {
            Response::notFound('Request not found');
        }
        
        // Check permissions
        if ($auth->hasRole('hospital')) {
            $hospital_sql = "SELECT hospital_id FROM hospitals WHERE user_id = ?";
            $hospital = $db->fetchOne($hospital_sql, [$current_user['user_id']]);
            
            if (!$hospital || $request['requester_id'] != $hospital['hospital_id']) {
                Response::forbidden('Can only view your own requests');
            }
        }
        
        // Get routing details
        $routing_sql = "SELECT 
                            rr.*,
                            bb.name as blood_bank_name,
                            bb.city,
                            bb.contact_number,
                            bb.latitude,
                            bb.longitude
                        FROM request_routing rr
                        JOIN blood_banks bb ON rr.blood_bank_id = bb.blood_bank_id
                        WHERE rr.request_id = ?
                        ORDER BY rr.distance";
        
        $routing = $db->fetchAll($routing_sql, [$request_id]);
        $request['routing_details'] = $routing;
        
        // Get fulfillment details if any
        $fulfillment_sql = "SELECT 
                                rf.*,
                                bi.blood_group,
                                bi.expiry_date,
                                bb.name as blood_bank_name
                            FROM request_fulfillment rf
                            JOIN blood_inventory bi ON rf.inventory_id = bi.inventory_id
                            JOIN blood_banks bb ON rf.blood_bank_id = bb.blood_bank_id
                            WHERE rf.request_id = ?";
        
        $fulfillment = $db->fetchAll($fulfillment_sql, [$request_id]);
        $request['fulfillment_details'] = $fulfillment;
        
        Response::success('Request retrieved', $request);
    }
}

function handlePostRequests($path) {
    global $db, $current_user, $auth, $logger;
    
    if ($path === '' || $path === '/') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Validate required fields
        $required = ['blood_group', 'units_required', 'patient_name'];
        foreach ($required as $field) {
            if (empty($input[$field])) {
                Response::error("Field '{$field}' is required");
            }
        }
        
        // Validate blood group
        $valid_blood_groups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
        if (!in_array($input['blood_group'], $valid_blood_groups)) {
            Response::error('Invalid blood group');
        }
        
        // Validate units
        if (!is_numeric($input['units_required']) || $input['units_required'] <= 0) {
            Response::error('Units required must be a positive number');
        }
        
        // Determine requester info
        $requester_id = null;
        $requester_type = 'patient';
        
        if ($auth->hasRole('hospital')) {
            $hospital_sql = "SELECT hospital_id FROM hospitals WHERE user_id = ?";
            $hospital = $db->fetchOne($hospital_sql, [$current_user['user_id']]);
            
            if ($hospital) {
                $requester_id = $hospital['hospital_id'];
                $requester_type = 'hospital';
            }
        }
        
        // Insert blood request
        $sql = "INSERT INTO blood_requests 
                (requester_id, requester_type, blood_group, units_required, 
                 priority, patient_name, patient_age, patient_gender, 
                 purpose, required_by, doctor_name, doctor_contact, status) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')";
        
        $params = [
            $requester_id,
            $requester_type,
            $input['blood_group'],
            $input['units_required'],
            $input['priority'] ?? 'normal',
            $input['patient_name'],
            $input['patient_age'] ?? null,
            $input['patient_gender'] ?? null,
            $input['purpose'] ?? null,
            $input['required_by'] ?? null,
            $input['doctor_name'] ?? null,
            $input['doctor_contact'] ?? null
        ];
        
        if ($db->execute($sql, $params)) {
            $request_id = $db->lastInsertId();
            
            // Log action
            $logger->logBloodRequest($request_id, 'CREATE_REQUEST', $input);
            
            // For emergency requests, start immediate routing
            if (($input['priority'] ?? 'normal') === 'emergency') {
                startEmergencyRouting($request_id, $input);
            } else {
                // For normal requests, start standard routing
                startStandardRouting($request_id, $input);
            }
            
            Response::success('Blood request created', [
                'request_id' => $request_id,
                'message' => 'Request submitted successfully. Routing to blood banks...'
            ]);
        } else {
            Response::serverError('Failed to create blood request');
        }
    }
}

function handlePutRequests($path) {
    global $db, $current_user, $auth, $logger;
    
    if (preg_match('/^\/(\d+)$/', $path, $matches)) {
        $request_id = $matches[1];
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Check if request exists
        $check_sql = "SELECT * FROM blood_requests WHERE request_id = ?";
        $request = $db->fetchOne($check_sql, [$request_id]);
        
        if (!$request) {
            Response::notFound('Request not found');
        }
        
        // Check permissions
        if ($auth->hasRole('hospital')) {
            $hospital_sql = "SELECT hospital_id FROM hospitals WHERE user_id = ?";
            $hospital = $db->fetchOne($hospital_sql, [$current_user['user_id']]);
            
            if (!$hospital || $request['requester_id'] != $hospital['hospital_id']) {
                Response::forbidden('Can only update your own requests');
            }
        }
        
        // Build update query
        $updates = [];
        $params = [];
        
        if (isset($input['status']) && in_array($input['status'], ['cancelled'])) {
            // Only allow cancellation by requester
            if ($request['status'] === 'pending') {
                $updates[] = "status = ?";
                $params[] = 'cancelled';
            }
        }
        
        if (isset($input['priority']) && in_array($input['priority'], ['normal', 'urgent', 'emergency'])) {
            $updates[] = "priority = ?";
            $params[] = $input['priority'];
        }
        
        if (isset($input['units_required']) && is_numeric($input['units_required'])) {
            $updates[] = "units_required = ?";
            $params[] = $input['units_required'];
        }
        
        if (!empty($input['required_by'])) {
            $updates[] = "required_by = ?";
            $params[] = $input['required_by'];
        }
        
        if (empty($updates)) {
            Response::error('No fields to update');
        }
        
        $params[] = $request_id;
        $sql = "UPDATE blood_requests SET " . implode(', ', $updates) . " WHERE request_id = ?";
        
        if ($db->execute($sql, $params)) {
            // Log action
            $logger->logBloodRequest($request_id, 'UPDATE_REQUEST', $input);
            
            Response::success('Request updated successfully');
        } else {
            Response::serverError('Failed to update request');
        }
    }
}

function startEmergencyRouting($request_id, $request_data) {
    global $db, $logger;
    
    // Emergency routing: contact all nearby blood banks immediately
    $sql = "SELECT 
                bb.blood_bank_id,
                bb.latitude,
                bb.longitude,
                COALESCE(SUM(bi.quantity), 0) as available_units
            FROM blood_banks bb
            LEFT JOIN blood_inventory bi ON bb.blood_bank_id = bi.blood_bank_id
                AND bi.blood_group = ?
                AND bi.expiry_date > CURDATE()
                AND bi.status = 'available'
            WHERE bb.status = 'active'
            GROUP BY bb.blood_bank_id, bb.latitude, bb.longitude
            HAVING available_units > 0
            ORDER BY available_units DESC
            LIMIT 10";
    
    $banks = $db->fetchAll($sql, [$request_data['blood_group']]);
    
    foreach ($banks as $bank) {
        // Calculate approximate distance (simplified)
        $distance = rand(1, 50); // Simplified for demo
        
        $routing_sql = "INSERT INTO request_routing 
                        (request_id, blood_bank_id, distance, routing_status) 
                        VALUES (?, ?, ?, 'assigned')";
        
        $db->execute($routing_sql, [$request_id, $bank['blood_bank_id'], $distance]);
        
        // Create emergency notification for blood bank
        createEmergencyNotification($bank['blood_bank_id'], $request_id, $request_data);
    }
    
    $logger->logBloodRequest($request_id, 'EMERGENCY_ROUTING_STARTED', [
        'banks_contacted' => count($banks),
        'blood_group' => $request_data['blood_group']
    ]);
}

function startStandardRouting($request_id, $request_data) {
    global $db, $logger;
    
    // Standard routing: find nearest banks with enough stock
    $sql = "SELECT 
                bb.blood_bank_id,
                COALESCE(SUM(bi.quantity), 0) as available_units
            FROM blood_banks bb
            LEFT JOIN blood_inventory bi ON bb.blood_bank_id = bi.blood_bank_id
                AND bi.blood_group = ?
                AND bi.expiry_date > CURDATE()
                AND bi.status = 'available'
            WHERE bb.status = 'active'
            GROUP BY bb.blood_bank_id
            HAVING available_units >= ?
            ORDER BY available_units DESC
            LIMIT 5";
    
    $banks = $db->fetchAll($sql, [
        $request_data['blood_group'],
        $request_data['units_required']
    ]);
    
    foreach ($banks as $index => $bank) {
        $distance = ($index + 1) * 5; // Simplified distance
        
        $routing_sql = "INSERT INTO request_routing 
                        (request_id, blood_bank_id, distance, routing_status) 
                        VALUES (?, ?, ?, 'assigned')";
        
        $db->execute($routing_sql, [$request_id, $bank['blood_bank_id'], $distance]);
    }
    
    $logger->logBloodRequest($request_id, 'STANDARD_ROUTING_STARTED', [
        'banks_contacted' => count($banks),
        'units_required' => $request_data['units_required']
    ]);
}

function createEmergencyNotification($blood_bank_id, $request_id, $request_data) {
    global $db;
    
    // Get blood bank admin user
    $admin_sql = "SELECT user_id FROM blood_banks WHERE blood_bank_id = ?";
    $bank = $db->fetchOne($admin_sql, [$blood_bank_id]);
    
    if ($bank) {
        $message = "EMERGENCY: Request #{$request_id} needs {$request_data['units_required']} units of {$request_data['blood_group']} blood. Patient: {$request_data['patient_name']}";
        
        $notif_sql = "INSERT INTO notifications 
                      (user_id, message, type, status) 
                      VALUES (?, ?, 'emergency', 'unread')";
        
        $db->execute($notif_sql, [$bank['user_id'], $message]);
    }
}
?>