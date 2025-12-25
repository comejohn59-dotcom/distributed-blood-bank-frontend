<?php
header('Content-Type: application/json');
// Report all errors to the log; don't display to users
error_reporting(E_ALL);
ini_set('display_errors', '0');

// Start output buffering so we can replace any accidental output
ob_start();

// Ensure any fatal error returns JSON so the frontend can parse it
register_shutdown_function(function () {
    $err = error_get_last();
    if ($err !== null) {
        // Log the fatal error details for server-side debugging
        error_log('FATAL ERROR in register.php: ' . print_r($err, true));
        // Also log the current raw input again (redact passwords)
        $rawNow = @file_get_contents('php://input');
        if ($rawNow) {
            $safeNow = preg_replace('/"password"\s*:\s*"[^"]*"/i', '"password":"[REDACTED]"', $rawNow);
            error_log('FATAL CONTEXT raw body: ' . substr($safeNow, 0, 2000));
        }
        // Clean any partial output and return JSON so frontend can parse
        if (ob_get_length()) ob_clean();
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Server error (fatal). Check server logs.']);
    }
});
// Allow requests from the frontend during development
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../../config/db.php';

$db = new Database();
$conn = Database::getConnection();

if (!$conn) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit;
}

// Accept JSON body or form-encoded POST for compatibility
$raw = file_get_contents('php://input');
$input = json_decode($raw, true);

// Log raw request and decoded input for debugging (redact passwords)
if ($raw) {
    $safeRaw = $raw;
    $safeRaw = preg_replace('/"password"\s*:\s*"[^"]*"/i', '"password":"[REDACTED]"', $safeRaw);
    error_log('register raw body: ' . substr($safeRaw, 0, 2000));
}
error_log('register decoded input: ' . print_r(is_array($input) ? (array_merge($input, ['password'=>'[REDACTED]'])) : $input, true));

if ($input && is_array($input)) {
    $role = $input['role'] ?? null;
    $full_name = $input['full_name'] ?? ($input['name'] ?? null);
    $email = $input['email'] ?? null;
    $phone = $input['phone'] ?? null;
    $password = $input['password'] ?? null;
    $confirm_password = $input['confirm_password'] ?? ($input['confirmPassword'] ?? null);
} else {
    $role = $_POST['role'] ?? null;
    $full_name = $_POST['full_name'] ?? ($_POST['name'] ?? null);
    $email = $_POST['email'] ?? null;
    $phone = $_POST['phone'] ?? null;
    $password = $_POST['password'] ?? null;
    $confirm_password = $_POST['confirm_password'] ?? ($_POST['confirmPassword'] ?? null);
}

// Check required fields
if (!$role || !$full_name || !$email || !$password) {
    echo json_encode(['success' => false, 'message' => 'Missing required fields']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Invalid email address']);
    exit;
}

if ($password !== $confirm_password) {
    echo json_encode(['success' => false, 'message' => 'Passwords do not match']);
    exit;
}

$hashed_password = password_hash($password, PASSWORD_DEFAULT);

// Log basic attempt (redact sensitive data)
error_log('register attempt: role=' . ($role ?? 'NULL') . ' email=' . ($email ?? 'NULL') . ' name=' . ($full_name ?? 'NULL'));
// Helper: check whether a table exists in the current DB
function tableExists($conn, $table) {
    $t = $conn->real_escape_string($table);
    $res = $conn->query("SHOW TABLES LIKE '" . $t . "'");
    return $res && $res->num_rows > 0;
}

// Check duplicate email across existing tables only (use safe checks and handle SQL exceptions)
try {
    if (tableExists($conn, 'users')) {
        $checkSql = @$conn->prepare("SELECT 1 FROM users WHERE email = ? LIMIT 1");
        if ($checkSql) {
            $checkSql->bind_param("s", $email);
            if ($checkSql->execute()) {
                $checkSql->store_result();
                if ($checkSql->num_rows > 0) { echo json_encode(['success' => false, 'message' => 'Email already registered']); exit; }
            } else {
                error_log('checkSql execute error: ' . $checkSql->error);
            }
            $checkSql->close();
        }
    }
} catch (Exception $e) {
    error_log('register.php duplicate-check users exception: ' . $e->getMessage());
}

try {
    if (tableExists($conn, 'hospitals')) {
        $checkHosp = @$conn->prepare("SELECT 1 FROM hospitals WHERE email = ? LIMIT 1");
        if ($checkHosp) {
            $checkHosp->bind_param("s", $email);
            if ($checkHosp->execute()) {
                $checkHosp->store_result();
                if ($checkHosp->num_rows > 0) { echo json_encode(['success' => false, 'message' => 'Email already registered']); exit; }
            } else {
                error_log('checkHosp execute error: ' . $checkHosp->error);
            }
            $checkHosp->close();
        }
    }
} catch (Exception $e) {
    error_log('register.php duplicate-check hospitals exception: ' . $e->getMessage());
}

try {
    if (tableExists($conn, 'hospital_users')) {
        $checkHospUser = @$conn->prepare("SELECT 1 FROM hospital_users WHERE email = ? LIMIT 1");
        if ($checkHospUser) {
            $checkHospUser->bind_param("s", $email);
            if ($checkHospUser->execute()) {
                $checkHospUser->store_result();
                if ($checkHospUser->num_rows > 0) { echo json_encode(['success' => false, 'message' => 'Email already registered']); exit; }
            } else {
                error_log('checkHospUser execute error: ' . $checkHospUser->error);
            }
            $checkHospUser->close();
        }
    }
} catch (Exception $e) {
    error_log('register.php duplicate-check hospital_users exception: ' . $e->getMessage());
}

// Role-based insert with safe defaults
try {
    if ($role === 'donor') {
        // CHANGED: Get age instead of dob
        $age = $input['age'] ?? ($_POST['age'] ?? null);
        $blood_group = $input['blood_group'] ?? ($_POST['blood_group'] ?? null);
        $gender = $input['gender'] ?? ($_POST['gender'] ?? null);
        $last_donation = $input['last_donation'] ?? ($_POST['last_donation'] ?? null);

        // Validate age
        if (!$age || !is_numeric($age) || $age < 18 || $age > 65) {
            echo json_encode(['success' => false, 'message' => 'Age must be between 18 and 65']);
            exit;
        }

        // CHANGED: SQL query uses age instead of dob
        $stmt = $conn->prepare("INSERT INTO donors (full_name, email, phone, age, password, blood_group, gender, last_donation) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("sssissss", $full_name, $email, $phone, $age, $hashed_password, $blood_group, $gender, $last_donation);

    } elseif ($role === 'hospital') {
        // Hospital-person registration: store as an individual under `hospital_users`.
        $hospital_name = $input['hospital_name'] ?? ($_POST['hospital_name'] ?? null);
        $hospital_license = $input['hospital_license'] ?? ($_POST['hospital_license'] ?? null);
        $hospital_address = $input['hospital_address'] ?? ($_POST['hospital_address'] ?? null);

        $stmt = $conn->prepare("INSERT INTO hospital_users (full_name, email, phone, password, hospital_name, hospital_license, hospital_address) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("sssssss", $full_name, $email, $phone, $hashed_password, $hospital_name, $hospital_license, $hospital_address);

    } elseif ($role === 'blood_bank') {
        $bank_name = $input['bank_name'] ?? ($_POST['bank_name'] ?? null);
        $bank_license = $input['bank_license'] ?? ($_POST['bank_license'] ?? null);
        $address = $input['address'] ?? ($_POST['address'] ?? null);
        $operating_hours = $input['operating_hours'] ?? ($_POST['operating_hours'] ?? null);

        $stmt = $conn->prepare("INSERT INTO blood_banks (full_name, email, phone, password, bank_name, bank_license, address, operating_hours) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("ssssssss", $full_name, $email, $phone, $hashed_password, $bank_name, $bank_license, $address, $operating_hours);

    } else {
        echo json_encode(['success' => false, 'message' => 'Invalid role']);
        exit;
    }

    if (!$stmt) {
        echo json_encode(['success' => false, 'message' => 'Failed to prepare statement: ' . $conn->error]);
        exit;
    }

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Registration successful']);
    } else {
        error_log('register stmt execute error: ' . $stmt->error);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $stmt->error]);
    }

    $stmt->close();
    $conn->close();

    // Flush the output buffer if active
    if (ob_get_length()) {
        ob_end_flush();
    }

} catch (Exception $e) {
    error_log('register.php error: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
?>