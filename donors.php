<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../utils/auth.php';
require_once __DIR__ . '/../utils/response.php';

header('Content-Type: application/json');
header('Content-Type: application/json');

// Simple debug logger (appends JSON lines to logs/api_debug.log)
function api_debug_log($entry) {
    $logDir = __DIR__ . '/../../logs';
    if (!is_dir($logDir)) {
        @mkdir($logDir, 0755, true);
    }
    $file = $logDir . '/api_debug.log';
    $line = '[' . date('c') . '] ' . json_encode($entry) . PHP_EOL;
    @file_put_contents($file, $line, FILE_APPEND | LOCK_EX);
}

try {
    api_debug_log([
        'endpoint' => 'donors.php',
        'method' => $_SERVER['REQUEST_METHOD'] ?? 'N/A',
        'get' => $_GET,
        'post' => $_POST,
        'cookies' => array_intersect_key($_COOKIE, array_flip(['PHPSESSID'])),
        'session_id' => session_id(),
        'session_user' => isset($_SESSION['user']) ? $_SESSION['user'] : null
    ]);
    // Create Auth instance and validate access
    $auth = new Auth();
    $current_user = $auth->checkRole(['admin', 'blood_bank', 'donor']);
    
    $db = Database::getConnection();
    $method = $_SERVER['REQUEST_METHOD'];
    
    switch ($method) {
        case 'GET':
            // Check if requesting current user's donor profile
            if (isset($_GET['current']) && $_GET['current'] === 'true') {
                // Get current user's donor profile
                
                // Check if user is a donor
                if ($current_user['role'] !== 'donor') {
                    Response::error('Only donors can access donor profiles', 403);
                }
                
                    // Use direct queries to avoid mysqli_stmt::get_result() (mysqlnd may be unavailable)
                    $uid = (int)$current_user['user_id'];

                    // Be defensive: some deployments don't have a central `users` table.
                    $usersExistsRes = $db->query("SHOW TABLES LIKE 'users'");
                    $usersExists = $usersExistsRes && $usersExistsRes->num_rows > 0;

                    if ($usersExists) {
                        $sql = "SELECT d.*, u.name, u.email, u.phone FROM donors d INNER JOIN users u ON d.user_id = u.user_id WHERE d.user_id = $uid";
                    } else {
                        // Fallback: return donor row only (limited info)
                        $sql = "SELECT d.* FROM donors d WHERE d.user_id = $uid";
                    }

                    $res = $db->query($sql);
                    $donor = $res ? $res->fetch_assoc() : null;
                
                if (!$donor) {
                    Response::error('Donor profile not found for current user', 404);
                }
                
                // Get donation history
                    // Get donation history via direct query
                    $did = (int)$donor['donor_id'];
                    $donationSql = "SELECT COUNT(*) as total_donations, MAX(donation_date) as last_donation_date FROM donations WHERE donor_id = $did";
                    $dres = $db->query($donationSql);
                    $donationInfo = $dres ? $dres->fetch_assoc() : ['total_donations' => 0, 'last_donation_date' => null];
                
                // Calculate eligibility
                if (!empty($donationInfo['last_donation_date'])) {
                    $lastDonation = new DateTime($donationInfo['last_donation_date']);
                    $nextEligible = $lastDonation->modify('+90 days');
                    $donor['next_eligible_date'] = $nextEligible->format('Y-m-d');
                    $donor['is_eligible'] = $nextEligible <= new DateTime();
                } else {
                    $donor['next_eligible_date'] = null;
                    $donor['is_eligible'] = true;
                }
                
                $donor['total_donations'] = $donationInfo['total_donations'] ?? 0;
                $donor['last_donation_date'] = $donationInfo['last_donation_date'] ?? null;
                
                Response::success(['donor' => $donor]);
                exit;
            }
            
            // Original GET logic for listing donors with filters
            // Check permissions - only admin and blood bank can list donors
            if ($current_user['role'] !== 'admin' && $current_user['role'] !== 'blood_bank') {
                Response::forbidden('Unauthorized access. Only admin and blood bank staff can list donors.');
            }
            
            $blood_bank_id = isset($_GET['blood_bank_id']) ? (int)$_GET['blood_bank_id'] : null;
            $blood_group = isset($_GET['blood_group']) ? $_GET['blood_group'] : null;
            $status = isset($_GET['status']) ? $_GET['status'] : 'active';
            $search = isset($_GET['search']) ? $_GET['search'] : null;
            
            // Blood bank staff can only see their own donors
            if ($current_user['role'] === 'blood_bank') {
                // Get blood bank ID from user
                $bankStmt = $db->prepare("SELECT blood_bank_id FROM users WHERE user_id = ?");
                $bankStmt->bind_param('i', $current_user['user_id']);
                $bankStmt->execute();
                $bankResult = $bankStmt->get_result()->fetch_assoc();
                $blood_bank_id = $bankResult['blood_bank_id'] ?? null;
            }
            
            $query = "SELECT d.*, u.name, u.email, u.phone, 
                     (SELECT COUNT(*) FROM donations WHERE donor_id = d.donor_id) as total_donations,
                     (SELECT MAX(donation_date) FROM donations WHERE donor_id = d.donor_id) as last_donation_date
                     FROM donors d
                     INNER JOIN users u ON d.user_id = u.user_id
                     WHERE 1=1";
            $params = [];
            $types = '';
            
            if ($blood_bank_id) {
                $query .= " AND d.blood_bank_id = ?";
                $params[] = $blood_bank_id;
                $types .= 'i';
            }
            
            if ($blood_group) {
                $query .= " AND d.blood_group = ?";
                $params[] = $blood_group;
                $types .= 's';
            }
            
            if ($status) {
                $query .= " AND d.status = ?";
                $params[] = $status;
                $types .= 's';
            }
            
            if ($search) {
                $query .= " AND (u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)";
                $searchTerm = "%$search%";
                $params[] = $searchTerm;
                $params[] = $searchTerm;
                $params[] = $searchTerm;
                $types .= 'sss';
            }
            
            $query .= " ORDER BY u.name";
            
            $stmt = $db->prepare($query);
            if ($params) {
                $stmt->bind_param($types, ...$params);
            }
            
            $stmt->execute();
            $result = $stmt->get_result();
            $donors = [];
            
            while ($row = $result->fetch_assoc()) {
                // Calculate next eligible donation date (90 days after last donation)
                if ($row['last_donation_date']) {
                    $lastDonation = new DateTime($row['last_donation_date']);
                    $nextEligible = $lastDonation->modify('+90 days');
                    $row['next_eligible_date'] = $nextEligible->format('Y-m-d');
                    $row['is_eligible'] = $nextEligible <= new DateTime();
                } else {
                    $row['next_eligible_date'] = null;
                    $row['is_eligible'] = true;
                }
                $donors[] = $row;
            }
            
            Response::success(['donors' => $donors]);
            break;
            
        case 'POST':
            // Check permissions - only admin can create donor profiles
            if ($current_user['role'] !== 'admin') {
                Response::forbidden('Only administrators can create donor profiles');
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Validate required fields
            $required = ['user_id', 'blood_group', 'date_of_birth'];
            foreach ($required as $field) {
                if (empty($data[$field])) {
                    Response::error("Missing required field: $field");
                }
            }
            
            // Check if donor already exists
            $checkStmt = $db->prepare("SELECT donor_id FROM donors WHERE user_id = ?");
            $checkStmt->bind_param('i', $data['user_id']);
            $checkStmt->execute();
            if ($checkStmt->get_result()->num_rows > 0) {
                Response::error('Donor profile already exists for this user');
            }
            
            // Validate blood group
            $validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
            if (!in_array($data['blood_group'], $validBloodGroups)) {
                Response::error('Invalid blood group');
            }
            
            // Validate age (must be at least 18)
            $dob = new DateTime($data['date_of_birth']);
            $today = new DateTime();
            $age = $today->diff($dob)->y;
            
            if ($age < 18) {
                Response::error('Donor must be at least 18 years old');
            }
            
            // Insert donor
            $stmt = $db->prepare("
                INSERT INTO donors 
                (user_id, blood_group, date_of_birth, weight, medical_conditions, 
                 last_health_check, preferred_bank_id, status) 
                VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
            ");
            
            $stmt->bind_param(
                'issdssi',
                $data['user_id'],
                $data['blood_group'],
                $data['date_of_birth'],
                $data['weight'] ?? null,
                $data['medical_conditions'] ?? null,
                $data['last_health_check'] ?? null,
                $data['preferred_bank_id'] ?? null
            );
            
            if ($stmt->execute()) {
                $donor_id = $db->insert_id;
                
                // Log the action
                $logStmt = $db->prepare("
                    INSERT INTO audit_logs 
                    (user_id, action, entity_type, entity_id, details) 
                    VALUES (?, 'create', 'donor', ?, ?)
                ");
                $details = json_encode([
                    'blood_group' => $data['blood_group'],
                    'age' => $age
                ]);
                $logStmt->bind_param('iis', $current_user['user_id'], $donor_id, $details);
                $logStmt->execute();
                
                Response::success([
                    'message' => 'Donor profile created successfully',
                    'donor_id' => $donor_id
                ]);
            } else {
                Response::error('Failed to create donor profile: ' . $db->error);
            }
            break;
            
        case 'PUT':
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (empty($data['donor_id'])) {
                Response::error('Donor ID is required');
            }
            
            // Check if donor exists
            $donorStmt = $db->prepare("SELECT user_id FROM donors WHERE donor_id = ?");
            $donorStmt->bind_param('i', $data['donor_id']);
            $donorStmt->execute();
            $donor = $donorStmt->get_result()->fetch_assoc();
            
            if (!$donor) {
                Response::error('Donor not found');
            }
            
            // Check permissions: 
            // - Admin can update any donor
            // - Blood bank staff can update donors in their bank
            // - Donor can update own profile
            $canUpdate = false;
            
            if ($current_user['role'] === 'admin') {
                $canUpdate = true;
            } elseif ($current_user['role'] === 'blood_bank') {
                // Check if donor belongs to this blood bank
                $bankStmt = $db->prepare("SELECT blood_bank_id FROM donors WHERE donor_id = ?");
                $bankStmt->bind_param('i', $data['donor_id']);
                $bankStmt->execute();
                $donorBank = $bankStmt->get_result()->fetch_assoc();
                
                // Get user's blood bank ID
                $userBankStmt = $db->prepare("SELECT blood_bank_id FROM users WHERE user_id = ?");
                $userBankStmt->bind_param('i', $current_user['user_id']);
                $userBankStmt->execute();
                $userBank = $userBankStmt->get_result()->fetch_assoc();
                
                if ($donorBank && $userBank && $donorBank['blood_bank_id'] == $userBank['blood_bank_id']) {
                    $canUpdate = true;
                }
            } elseif ($current_user['role'] === 'donor' && $current_user['user_id'] == $donor['user_id']) {
                $canUpdate = true;
            }
            
            if (!$canUpdate) {
                Response::forbidden('Unauthorized to update this donor profile');
            }
            
            // Update donor
            $updateFields = [];
            $params = [];
            $types = '';
            
            $fields = ['blood_group', 'weight', 'medical_conditions', 
                      'last_health_check', 'preferred_bank_id', 'status'];
            
            foreach ($fields as $field) {
                if (isset($data[$field])) {
                    $updateFields[] = "$field = ?";
                    $params[] = $data[$field];
                    $types .= gettype($data[$field])[0];
                }
            }
            
            if (empty($updateFields)) {
                Response::error('No fields to update');
            }
            
            $params[] = $data['donor_id'];
            $types .= 'i';
            
            $query = "UPDATE donors SET " . implode(', ', $updateFields) . " WHERE donor_id = ?";
            $stmt = $db->prepare($query);
            $stmt->bind_param($types, ...$params);
            
            if ($stmt->execute()) {
                // Log the action
                $logStmt = $db->prepare("
                    INSERT INTO audit_logs 
                    (user_id, action, entity_type, entity_id, details) 
                    VALUES (?, 'update', 'donor', ?, ?)
                ");
                $details = json_encode(['updated_fields' => array_keys($updateFields)]);
                $logStmt->bind_param('iis', $current_user['user_id'], $data['donor_id'], $details);
                $logStmt->execute();
                
                Response::success(['message' => 'Donor profile updated successfully']);
            } else {
                Response::error('Failed to update donor profile: ' . $db->error);
            }
            break;
            
        default:
            Response::error('Method not allowed', 405);
    }
    
} catch (Exception $e) {
    // Log exception details to api_debug.log for diagnosis
    api_debug_log([
        'error' => 'exception',
        'message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine(),
        'trace' => $e->getTraceAsString()
    ]);
    Response::error('Operation failed: ' . $e->getMessage());
}
?>