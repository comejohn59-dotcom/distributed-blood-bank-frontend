<?php
/**
 * Donations API
 * Manages blood donation records
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../utils/response.php';
require_once __DIR__ . '/../utils/auth.php';
require_once __DIR__ . '/../utils/logger.php';

header('Content-Type: application/json');

// Validate access
// Ensure a Database helper instance is available for fetchOne/fetchAll calls
$db = new Database();

$current_user = $auth->validateRequest(['admin', 'blood_bank', 'donor']);

$method = $_SERVER['REQUEST_METHOD'];
$path = $_SERVER['PATH_INFO'] ?? '';

switch ($method) {
    case 'GET':
        handleGetDonations($path);
        break;
    case 'POST':
        handlePostDonations($path);
        break;
    case 'PUT':
        handlePutDonations($path);
        break;
    default:
        Response::error('Method not allowed', [], 405);
}

function handleGetDonations($path) {
    global $db, $current_user, $auth;
    
    if ($path === '' || $path === '/') {
        // Get donations with filters
        $filters = [];
        $params = [];
        
        // Role-based filtering
        if ($auth->hasRole('donor')) {
            // Donors can only see their own donations
            $donor_sql = "SELECT donor_id FROM donors WHERE user_id = ?";
            $donor = $db->fetchOne($donor_sql, [$current_user['user_id']]);
            if ($donor) {
                $filters[] = "d.donor_id = ?";
                $params[] = $donor['donor_id'];
            }
        } elseif ($auth->hasRole('blood_bank')) {
            // Blood banks can see donations at their bank
            $bank_sql = "SELECT blood_bank_id FROM blood_banks WHERE user_id = ?";
            $bank = $db->fetchOne($bank_sql, [$current_user['user_id']]);
            if ($bank) {
                $filters[] = "d.blood_bank_id = ?";
                $params[] = $bank['blood_bank_id'];
            }
        }
        
        if (!empty($_GET['donor_id']) && $auth->hasRole('admin')) {
            $filters[] = "d.donor_id = ?";
            $params[] = $_GET['donor_id'];
        }
        
        if (!empty($_GET['blood_bank_id']) && $auth->hasAnyRole(['admin', 'blood_bank'])) {
            $filters[] = "d.blood_bank_id = ?";
            $params[] = $_GET['blood_bank_id'];
        }
        
        if (!empty($_GET['blood_group'])) {
            $filters[] = "d.blood_group = ?";
            $params[] = $_GET['blood_group'];
        }
        
        if (!empty($_GET['status'])) {
            $filters[] = "d.status = ?";
            $params[] = $_GET['status'];
        }
        
        if (!empty($_GET['start_date'])) {
            $filters[] = "DATE(d.donation_date) >= ?";
            $params[] = $_GET['start_date'];
        }
        
        if (!empty($_GET['end_date'])) {
            $filters[] = "DATE(d.donation_date) <= ?";
            $params[] = $_GET['end_date'];
        }
        
        $where = $filters ? "WHERE " . implode(" AND ", $filters) : "";
        
        // Get donations with details
        $sql = "SELECT 
                    d.*,
                    dn.name as donor_name,
                    dn.blood_group as donor_blood_group,
                    bb.name as blood_bank_name,
                    bb.city
                FROM donations d
                JOIN donors dr ON d.donor_id = dr.donor_id
                JOIN users dn ON dr.user_id = dn.user_id
                JOIN blood_banks bb ON d.blood_bank_id = bb.blood_bank_id
                {$where}
                ORDER BY d.donation_date DESC";
        
        $donations = $db->fetchAll($sql, $params);
        
        Response::success('Donations retrieved', $donations);
        
    } elseif ($path === '/stats') {
        // Get donation statistics
        $filters = [];
        $params = [];
        
        if (!empty($_GET['blood_bank_id']) && $auth->hasAnyRole(['admin', 'blood_bank'])) {
            $filters[] = "blood_bank_id = ?";
            $params[] = $_GET['blood_bank_id'];
        }
        
        if (!empty($_GET['year'])) {
            $filters[] = "YEAR(donation_date) = ?";
            $params[] = $_GET['year'];
        }
        
        $where = $filters ? "WHERE " . implode(" AND ", $filters) : "";
        
        // Overall statistics
        $stats_sql = "SELECT 
                        COUNT(*) as total_donations,
                        SUM(units_donated) as total_units,
                        COUNT(DISTINCT donor_id) as unique_donors,
                        AVG(units_donated) as avg_units_per_donation
                      FROM donations
                      {$where}";
        
        $stats = $db->fetchOne($stats_sql, $params);
        
        // Monthly breakdown
        $monthly_sql = "SELECT 
                            DATE_FORMAT(donation_date, '%Y-%m') as month,
                            COUNT(*) as donation_count,
                            SUM(units_donated) as units_collected
                        FROM donations
                        {$where}
                        GROUP BY DATE_FORMAT(donation_date, '%Y-%m')
                        ORDER BY month DESC
                        LIMIT 12";
        
        $monthly = $db->fetchAll($monthly_sql, $params);
        
        // Blood group breakdown
        $group_sql = "SELECT 
                        blood_group,
                        COUNT(*) as donation_count,
                        SUM(units_donated) as total_units
                      FROM donations
                      {$where}
                      GROUP BY blood_group
                      ORDER BY total_units DESC";
        
        $by_group = $db->fetchAll($group_sql, $params);
        
        Response::success('Donation statistics', [
            'overall' => $stats,
            'monthly' => $monthly,
            'by_blood_group' => $by_group
        ]);
        
    } elseif (preg_match('/^\/(\d+)$/', $path, $matches)) {
        // Get specific donation
        $donation_id = $matches[1];
        
        $sql = "SELECT 
                    d.*,
                    dn.name as donor_name,
                    dn.email as donor_email,
                    dr.blood_group as donor_blood_group,
                    dr.gender as donor_gender,
                    bb.name as blood_bank_name,
                    bb.address as bank_address,
                    bb.contact_number as bank_contact
                FROM donations d
                JOIN donors dr ON d.donor_id = dr.donor_id
                JOIN users dn ON dr.user_id = dn.user_id
                JOIN blood_banks bb ON d.blood_bank_id = bb.blood_bank_id
                WHERE d.donation_id = ?";
        
        $donation = $db->fetchOne($sql, [$donation_id]);
        
        if (!$donation) {
            Response::notFound('Donation not found');
        }
        
        // Check permissions for donor users
        if ($auth->hasRole('donor')) {
            $donor_sql = "SELECT donor_id FROM donors WHERE user_id = ?";
            $donor = $db->fetchOne($donor_sql, [$current_user['user_id']]);
            
            if (!$donor || $donor['donor_id'] != $donation['donor_id']) {
                Response::forbidden('Can only view your own donations');
            }
        }
        
        Response::success('Donation retrieved', $donation);
    }
}

function handlePostDonations($path) {
    global $db, $current_user, $auth, $logger;
    
    if ($path === '' || $path === '/') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Validate required fields
        $required = ['donor_id', 'blood_bank_id', 'blood_group', 'units_donated'];
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
        if (!is_numeric($input['units_donated']) || $input['units_donated'] <= 0) {
            Response::error('Units donated must be a positive number');
        }
        
        // Check donor eligibility
        if (!checkDonorEligibility($input['donor_id'])) {
            Response::error('Donor is not eligible to donate');
        }
        
        // Check if donor exists
        $donor_sql = "SELECT * FROM donors WHERE donor_id = ?";
        $donor = $db->fetchOne($donor_sql, [$input['donor_id']]);
        
        if (!$donor) {
            Response::error('Donor not found');
        }
        
        // Check if blood bank exists
        $bank_sql = "SELECT * FROM blood_banks WHERE blood_bank_id = ?";
        $bank = $db->fetchOne($bank_sql, [$input['blood_bank_id']]);
        
        if (!$bank) {
            Response::error('Blood bank not found');
        }
        
        // Insert donation
        $sql = "INSERT INTO donations 
                (donor_id, blood_bank_id, blood_group, units_donated, 
                 donation_date, hemoglobin_level, blood_pressure, 
                 pulse_rate, temperature, status) 
                VALUES (?, ?, ?, ?, NOW(), ?, ?, ?, ?, 'completed')";
        
        $params = [
            $input['donor_id'],
            $input['blood_bank_id'],
            $input['blood_group'],
            $input['units_donated'],
            $input['hemoglobin_level'] ?? null,
            $input['blood_pressure'] ?? null,
            $input['pulse_rate'] ?? null,
            $input['temperature'] ?? null
        ];
        
        if ($db->execute($sql, $params)) {
            $donation_id = $db->lastInsertId();
            
            // Update donor's last donation date
            $update_donor_sql = "UPDATE donors SET last_donation_date = CURDATE() WHERE donor_id = ?";
            $db->execute($update_donor_sql, [$input['donor_id']]);
            
            // Add to inventory
            addDonationToInventory($input, $donation_id);
            
            // Log action
            $logger->logDonation($donation_id, 'RECORD_DONATION');
            
            Response::success('Donation recorded successfully', [
                'donation_id' => $donation_id,
                'next_eligible_date' => date('Y-m-d', strtotime('+3 months'))
            ]);
        } else {
            Response::serverError('Failed to record donation');
        }
    }
}

function handlePutDonations($path) {
    global $db, $current_user, $auth, $logger;
    
    if (preg_match('/^\/(\d+)$/', $path, $matches)) {
        $donation_id = $matches[1];
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Check if donation exists
        $check_sql = "SELECT * FROM donations WHERE donation_id = ?";
        $donation = $db->fetchOne($check_sql, [$donation_id]);
        
        if (!$donation) {
            Response::notFound('Donation not found');
        }
        
        // Check permissions (only blood bank and admin can update)
        if (!$auth->hasAnyRole(['admin', 'blood_bank'])) {
            Response::forbidden('Insufficient permissions');
        }
        
        // Build update query
        $updates = [];
        $params = [];
        
        if (isset($input['status']) && in_array($input['status'], ['completed', 'cancelled', 'deferred'])) {
            $updates[] = "status = ?";
            $params[] = $input['status'];
            
            // If cancelled, remove from inventory
            if ($input['status'] === 'cancelled') {
                removeDonationFromInventory($donation_id);
            }
        }
        
        if (!empty($input['deferral_reason'])) {
            $updates[] = "deferral_reason = ?";
            $params[] = $input['deferral_reason'];
        }
        
        if (!empty($input['test_results'])) {
            $updates[] = "test_results = ?";
            $params[] = $input['test_results'];
        }
        
        if (empty($updates)) {
            Response::error('No fields to update');
        }
        
        $params[] = $donation_id;
        $sql = "UPDATE donations SET " . implode(', ', $updates) . " WHERE donation_id = ?";
        
        if ($db->execute($sql, $params)) {
            // Log action
            $logger->logDonation($donation_id, 'UPDATE_DONATION', $input);
            
            Response::success('Donation updated successfully');
        } else {
            Response::serverError('Failed to update donation');
        }
    }
}

function checkDonorEligibility($donor_id) {
    global $db;
    
    $sql = "SELECT 
                d.date_of_birth,
                d.last_donation_date,
                d.is_eligible,
                TIMESTAMPDIFF(YEAR, d.date_of_birth, CURDATE()) as age
            FROM donors d
            WHERE d.donor_id = ?";
    
    $donor = $db->fetchOne($sql, [$donor_id]);
    
    if (!$donor) {
        return false;
    }
    
    // Check age (18-65)
    if ($donor['age'] < 18 || $donor['age'] > 65) {
        return false;
    }
    
    // Check eligibility flag
    if (!$donor['is_eligible']) {
        return false;
    }
    
    // Check donation interval (minimum 3 months)
    if ($donor['last_donation_date']) {
        $last_donation = new DateTime($donor['last_donation_date']);
        $today = new DateTime();
        $interval = $today->diff($last_donation)->m;
        
        if ($interval < 3) {
            return false;
        }
    }
    
    return true;
}

function addDonationToInventory($donation_data, $donation_id) {
    global $db;
    
    // Calculate expiry date (35 days from donation)
    $expiry_date = date('Y-m-d', strtotime('+35 days'));
    
    // Add to inventory
    $sql = "INSERT INTO blood_inventory 
            (blood_bank_id, blood_group, quantity, expiry_date, 
             donor_id, donation_date, status) 
            VALUES (?, ?, ?, ?, ?, CURDATE(), 'available')";
    
    $params = [
        $donation_data['blood_bank_id'],
        $donation_data['blood_group'],
        $donation_data['units_donated'],
        $expiry_date,
        $donation_data['donor_id']
    ];
    
    $db->execute($sql, $params);
    
    // Update donation record with inventory ID
    $inventory_id = $db->lastInsertId();
    $update_sql = "UPDATE donations SET inventory_id = ? WHERE donation_id = ?";
    $db->execute($update_sql, [$inventory_id, $donation_id]);
}

function removeDonationFromInventory($donation_id) {
    global $db;
    
    // Get inventory ID from donation
    $donation_sql = "SELECT inventory_id FROM donations WHERE donation_id = ?";
    $donation = $db->fetchOne($donation_sql, [$donation_id]);
    
    if ($donation && $donation['inventory_id']) {
        // Remove from inventory
        $delete_sql = "DELETE FROM blood_inventory WHERE inventory_id = ?";
        $db->execute($delete_sql, [$donation['inventory_id']]);
    }
}
?>