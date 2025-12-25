<?php
/**
 * Appointments API
 * Manages donation appointment scheduling
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../utils/response.php';
require_once __DIR__ . '/../utils/auth.php';
require_once __DIR__ . '/../utils/logger.php';

header('Content-Type: application/json');

// Validate access
$current_user = $auth->validateRequest(['admin', 'blood_bank', 'donor']);

$method = $_SERVER['REQUEST_METHOD'];
$path = $_SERVER['PATH_INFO'] ?? '';

switch ($method) {
    case 'GET':
        handleGetAppointments($path);
        break;
    case 'POST':
        handlePostAppointments($path);
        break;
    case 'PUT':
        handlePutAppointments($path);
        break;
    case 'DELETE':
        handleDeleteAppointments($path);
        break;
    default:
        Response::error('Method not allowed', [], 405);
}

function handleGetAppointments($path) {
    global $db, $current_user, $auth;
    
    if ($path === '' || $path === '/') {
        // Get appointments with filters
        $filters = [];
        $params = [];
        
        // Role-based filtering
        if ($auth->hasRole('donor')) {
            // Donors can only see their own appointments
            $donor_sql = "SELECT donor_id FROM donors WHERE user_id = ?";
            $donor = $db->fetchOne($donor_sql, [$current_user['user_id']]);
            if ($donor) {
                $filters[] = "a.donor_id = ?";
                $params[] = $donor['donor_id'];
            }
        } elseif ($auth->hasRole('blood_bank')) {
            // Blood banks can see appointments at their bank
            $bank_sql = "SELECT blood_bank_id FROM blood_banks WHERE user_id = ?";
            $bank = $db->fetchOne($bank_sql, [$current_user['user_id']]);
            if ($bank) {
                $filters[] = "a.blood_bank_id = ?";
                $params[] = $bank['blood_bank_id'];
            }
        }
        
        if (!empty($_GET['donor_id']) && $auth->hasRole('admin')) {
            $filters[] = "a.donor_id = ?";
            $params[] = $_GET['donor_id'];
        }
        
        if (!empty($_GET['blood_bank_id']) && $auth->hasAnyRole(['admin', 'blood_bank'])) {
            $filters[] = "a.blood_bank_id = ?";
            $params[] = $_GET['blood_bank_id'];
        }
        
        if (!empty($_GET['status'])) {
            $filters[] = "a.status = ?";
            $params[] = $_GET['status'];
        }
        
        if (!empty($_GET['date'])) {
            $filters[] = "DATE(a.appointment_date) = ?";
            $params[] = $_GET['date'];
        }
        
        if (!empty($_GET['upcoming'])) {
            $filters[] = "a.appointment_date >= NOW()";
        }
        
        $where = $filters ? "WHERE " . implode(" AND ", $filters) : "";
        
        // Get appointments with details
        $sql = "SELECT 
                    a.*,
                    d.name as donor_name,
                    d.email as donor_email,
                    dr.blood_group as donor_blood_group,
                    bb.name as blood_bank_name,
                    bb.address as bank_address,
                    bb.contact_number as bank_contact
                FROM appointments a
                JOIN donors dr ON a.donor_id = dr.donor_id
                JOIN users d ON dr.user_id = d.user_id
                JOIN blood_banks bb ON a.blood_bank_id = bb.blood_bank_id
                {$where}
                ORDER BY a.appointment_date";
        
        $appointments = $db->fetchAll($sql, $params);
        
        Response::success('Appointments retrieved', $appointments);
        
    } elseif ($path === '/available-slots') {
        // Get available appointment slots
        $required = ['blood_bank_id', 'date'];
        foreach ($required as $param) {
            if (empty($_GET[$param])) {
                Response::error("Parameter '{$param}' is required");
            }
        }
        
        $blood_bank_id = $_GET['blood_bank_id'];
        $date = $_GET['date'];
        
        // Check if date is valid
        $appointment_date = DateTime::createFromFormat('Y-m-d', $date);
        if (!$appointment_date) {
            Response::error('Invalid date format. Use YYYY-MM-DD');
        }
        
        // Define available time slots (9 AM to 5 PM, every 30 minutes)
        $start_time = strtotime($date . ' 09:00:00');
        $end_time = strtotime($date . ' 17:00:00');
        $slot_duration = 30 * 60; // 30 minutes in seconds
        
        $available_slots = [];
        $current_time = $start_time;
        
        while ($current_time <= $end_time) {
            $slot_time = date('H:i', $current_time);
            $slot_datetime = date('Y-m-d H:i:s', $current_time);
            
            // Check if slot is already booked
            $check_sql = "SELECT COUNT(*) as booked 
                          FROM appointments 
                          WHERE blood_bank_id = ? 
                            AND DATE(appointment_date) = ? 
                            AND TIME(appointment_date) = ? 
                            AND status IN ('scheduled', 'confirmed')";
            
            $booked = $db->fetchOne($check_sql, [
                $blood_bank_id,
                $date,
                $slot_time
            ]);
            
            if ($booked['booked'] == 0) {
                $available_slots[] = [
                    'time' => $slot_time,
                    'datetime' => $slot_datetime
                ];
            }
            
            $current_time += $slot_duration;
        }
        
        Response::success('Available slots retrieved', [
            'date' => $date,
            'blood_bank_id' => $blood_bank_id,
            'slots' => $available_slots
        ]);
        
    } elseif (preg_match('/^\/(\d+)$/', $path, $matches)) {
        // Get specific appointment
        $appointment_id = $matches[1];
        
        $sql = "SELECT 
                    a.*,
                    d.name as donor_name,
                    d.email as donor_email,
                    dr.blood_group as donor_blood_group,
                    bb.name as blood_bank_name,
                    bb.address as bank_address,
                    bb.contact_number as bank_contact
                FROM appointments a
                JOIN donors dr ON a.donor_id = dr.donor_id
                JOIN users d ON dr.user_id = d.user_id
                JOIN blood_banks bb ON a.blood_bank_id = bb.blood_bank_id
                WHERE a.appointment_id = ?";
        
        $appointment = $db->fetchOne($sql, [$appointment_id]);
        
        if (!$appointment) {
            Response::notFound('Appointment not found');
        }
        
        // Check permissions for donor users
        if ($auth->hasRole('donor')) {
            $donor_sql = "SELECT donor_id FROM donors WHERE user_id = ?";
            $donor = $db->fetchOne($donor_sql, [$current_user['user_id']]);
            
            if (!$donor || $donor['donor_id'] != $appointment['donor_id']) {
                Response::forbidden('Can only view your own appointments');
            }
        }
        
        Response::success('Appointment retrieved', $appointment);
    }
}

function handlePostAppointments($path) {
    global $db, $current_user, $auth, $logger;
    
    if ($path === '' || $path === '/') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Validate required fields
        $required = ['donor_id', 'blood_bank_id', 'appointment_date'];
        foreach ($required as $field) {
            if (empty($input[$field])) {
                Response::error("Field '{$field}' is required");
            }
        }
        
        // Validate appointment date
        $appointment_date = DateTime::createFromFormat('Y-m-d H:i:s', $input['appointment_date']);
        if (!$appointment_date || $appointment_date < new DateTime()) {
            Response::error('Appointment date must be a future date and time');
        }
        
        // Check donor eligibility
        if (!checkDonorEligibility($input['donor_id'], $input['appointment_date'])) {
            Response::error('Donor is not eligible to schedule an appointment');
        }
        
        // Check if donor exists
        $donor_sql = "SELECT * FROM donors WHERE donor_id = ?";
        $donor = $db->fetchOne($donor_sql, [$input['donor_id']]);
        
        if (!$donor) {
            Response::error('Donor not found');
        }
        
        // For donor users, ensure they can only schedule for themselves
        if ($auth->hasRole('donor')) {
            $user_donor_sql = "SELECT donor_id FROM donors WHERE user_id = ?";
            $user_donor = $db->fetchOne($user_donor_sql, [$current_user['user_id']]);
            
            if (!$user_donor || $user_donor['donor_id'] != $input['donor_id']) {
                Response::forbidden('Can only schedule appointments for yourself');
            }
        }
        
        // Check if blood bank exists
        $bank_sql = "SELECT * FROM blood_banks WHERE blood_bank_id = ?";
        $bank = $db->fetchOne($bank_sql, [$input['blood_bank_id']]);
        
        if (!$bank) {
            Response::error('Blood bank not found');
        }
        
        // Check if slot is available
        $slot_sql = "SELECT COUNT(*) as booked 
                     FROM appointments 
                     WHERE blood_bank_id = ? 
                       AND appointment_date = ? 
                       AND status IN ('scheduled', 'confirmed')";
        
        $booked = $db->fetchOne($slot_sql, [
            $input['blood_bank_id'],
            $input['appointment_date']
        ]);
        
        if ($booked['booked'] > 0) {
            Response::error('Selected time slot is already booked');
        }
        
        // Insert appointment
        $sql = "INSERT INTO appointments 
                (donor_id, blood_bank_id, appointment_date, 
                 appointment_type, duration_minutes, status, notes) 
                VALUES (?, ?, ?, ?, ?, 'scheduled', ?)";
        
        $params = [
            $input['donor_id'],
            $input['blood_bank_id'],
            $input['appointment_date'],
            $input['appointment_type'] ?? 'donation',
            $input['duration_minutes'] ?? 30,
            $input['notes'] ?? null
        ];
        
        if ($db->execute($sql, $params)) {
            $appointment_id = $db->lastInsertId();
            
            // Log action
            $logger->logAppointment($appointment_id, 'SCHEDULE_APPOINTMENT', $input);
            
            // Create notification for donor
            createAppointmentNotification($input['donor_id'], $appointment_id, 'scheduled');
            
            Response::success('Appointment scheduled successfully', [
                'appointment_id' => $appointment_id,
                'message' => 'Appointment scheduled. You will receive a confirmation reminder.'
            ]);
        } else {
            Response::serverError('Failed to schedule appointment');
        }
    }
}

function handlePutAppointments($path) {
    global $db, $current_user, $auth, $logger;
    
    if (preg_match('/^\/(\d+)$/', $path, $matches)) {
        $appointment_id = $matches[1];
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Check if appointment exists
        $check_sql = "SELECT * FROM appointments WHERE appointment_id = ?";
        $appointment = $db->fetchOne($check_sql, [$appointment_id]);
        
        if (!$appointment) {
            Response::notFound('Appointment not found');
        }
        
        // Check permissions
        if ($auth->hasRole('donor')) {
            $donor_sql = "SELECT donor_id FROM donors WHERE user_id = ?";
            $donor = $db->fetchOne($donor_sql, [$current_user['user_id']]);
            
            if (!$donor || $donor['donor_id'] != $appointment['donor_id']) {
                Response::forbidden('Can only update your own appointments');
            }
        }
        
        // Build update query
        $updates = [];
        $params = [];
        
        if (isset($input['status'])) {
            $allowed_statuses = ['confirmed', 'completed', 'cancelled', 'no_show'];
            if (in_array($input['status'], $allowed_statuses)) {
                $updates[] = "status = ?";
                $params[] = $input['status'];
                
                // If cancelled or no-show, update donor eligibility
                if (in_array($input['status'], ['cancelled', 'no_show'])) {
                    updateDonorForCancellation($appointment['donor_id'], $input['status']);
                }
            }
        }
        
        if (!empty($input['appointment_date'])) {
            // Validate new appointment date
            $new_date = DateTime::createFromFormat('Y-m-d H:i:s', $input['appointment_date']);
            if (!$new_date || $new_date < new DateTime()) {
                Response::error('New appointment date must be a future date and time');
            }
            
            // Check if new slot is available
            $slot_sql = "SELECT COUNT(*) as booked 
                         FROM appointments 
                         WHERE blood_bank_id = ? 
                           AND appointment_date = ? 
                           AND appointment_id != ?
                           AND status IN ('scheduled', 'confirmed')";
            
            $booked = $db->fetchOne($slot_sql, [
                $appointment['blood_bank_id'],
                $input['appointment_date'],
                $appointment_id
            ]);
            
            if ($booked['booked'] > 0) {
                Response::error('New time slot is already booked');
            }
            
            $updates[] = "appointment_date = ?";
            $params[] = $input['appointment_date'];
        }
        
        if (!empty($input['notes'])) {
            $updates[] = "notes = ?";
            $params[] = $input['notes'];
        }
        
        if (empty($updates)) {
            Response::error('No fields to update');
        }
        
        $params[] = $appointment_id;
        $sql = "UPDATE appointments SET " . implode(', ', $updates) . " WHERE appointment_id = ?";
        
        if ($db->execute($sql, $params)) {
            // Log action
            $logger->logAppointment($appointment_id, 'UPDATE_APPOINTMENT', $input);
            
            // Update notification if status changed
            if (isset($input['status'])) {
                createAppointmentNotification($appointment['donor_id'], $appointment_id, $input['status']);
            }
            
            Response::success('Appointment updated successfully');
        } else {
            Response::serverError('Failed to update appointment');
        }
    }
}

function handleDeleteAppointments($path) {
    global $db, $current_user, $auth, $logger;
    
    if (preg_match('/^\/(\d+)$/', $path, $matches)) {
        $appointment_id = $matches[1];
        
        // Check if appointment exists
        $check_sql = "SELECT * FROM appointments WHERE appointment_id = ?";
        $appointment = $db->fetchOne($check_sql, [$appointment_id]);
        
        if (!$appointment) {
            Response::notFound('Appointment not found');
        }
        
        // Check permissions
        if ($auth->hasRole('donor')) {
            $donor_sql = "SELECT donor_id FROM donors WHERE user_id = ?";
            $donor = $db->fetchOne($donor_sql, [$current_user['user_id']]);
            
            if (!$donor || $donor['donor_id'] != $appointment['donor_id']) {
                Response::forbidden('Can only cancel your own appointments');
            }
        }
        
        // Only allow cancellation if appointment is in future
        $appointment_time = new DateTime($appointment['appointment_date']);
        $now = new DateTime();
        
        if ($appointment_time <= $now) {
            Response::error('Cannot delete past or ongoing appointments');
        }
        
        // Delete appointment
        $sql = "DELETE FROM appointments WHERE appointment_id = ?";
        
        if ($db->execute($sql, [$appointment_id])) {
            // Log action
            $logger->logAppointment($appointment_id, 'CANCEL_APPOINTMENT');
            
            // Update donor for cancellation
            updateDonorForCancellation($appointment['donor_id'], 'cancelled');
            
            Response::success('Appointment cancelled successfully');
        } else {
            Response::serverError('Failed to cancel appointment');
        }
    }
}

function checkDonorEligibility($donor_id, $appointment_date) {
    global $db;
    
    $sql = "SELECT 
                d.date_of_birth,
                d.last_donation_date,
                d.is_eligible,
                TIMESTAMPDIFF(YEAR, d.date_of_birth, ?) as age
            FROM donors d
            WHERE d.donor_id = ?";
    
    $donor = $db->fetchOne($sql, [$appointment_date, $donor_id]);
    
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
        $appointment = new DateTime($appointment_date);
        $interval = $appointment->diff($last_donation)->m;
        
        if ($interval < 3) {
            return false;
        }
    }
    
    return true;
}

function updateDonorForCancellation($donor_id, $reason) {
    global $db;
    
    // For no-shows, mark donor as temporarily ineligible
    if ($reason === 'no_show') {
        $sql = "UPDATE donors SET is_eligible = FALSE, no_show_count = COALESCE(no_show_count, 0) + 1 WHERE donor_id = ?";
        $db->execute($sql, [$donor_id]);
    }
}

function createAppointmentNotification($donor_id, $appointment_id, $status) {
    global $db;
    
    // Get donor user ID
    $donor_sql = "SELECT user_id FROM donors WHERE donor_id = ?";
    $donor = $db->fetchOne($donor_sql, [$donor_id]);
    
    if (!$donor) return;
    
    $messages = [
        'scheduled' => "Your donation appointment #{$appointment_id} has been scheduled.",
        'confirmed' => "Your appointment #{$appointment_id} has been confirmed.",
        'cancelled' => "Your appointment #{$appointment_id} has been cancelled.",
        'completed' => "Thank you for your donation! Appointment #{$appointment_id} completed."
    ];
    
    $message = $messages[$status] ?? "Appointment #{$appointment_id} status updated to {$status}.";
    
    $notif_sql = "INSERT INTO notifications 
                  (user_id, message, type, status) 
                  VALUES (?, ?, 'appointment', 'unread')";
    
    $db->execute($notif_sql, [$donor['user_id'], $message]);
}
?>