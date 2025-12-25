<?php
header('Content-Type: application/json');
// Allow requests from the frontend during development
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../../utils/response.php';
require_once __DIR__ . '/../../utils/auth.php';

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed', 405);
}

$raw = file_get_contents('php://input');
$input = json_decode($raw, true);

$email = $input['email'] ?? $_POST['email'] ?? null;
$password = $input['password'] ?? $_POST['password'] ?? null;
$role = $input['role'] ?? $_POST['role'] ?? null;

if (!$email || !$password || !$role) {
    Response::error('Email, password and role are required');
}

$auth = new Auth();
$user = $auth->login($email, $password, $role);

if (!$user) {
    Response::unauthorized('Invalid credentials');
}

// Return token (session id) and cleaned user data
$token = session_id();

$name = $user['full_name'] ?? $user['name'] ?? ($user['email'] ?? '');

$responseData = [
    'token' => $token,
    'user_id' => $user['user_id'] ?? 0,
    'email' => $user['email'] ?? '',
    'role' => $user['role'] ?? $role,
    'name' => $name
];

Response::success($responseData, 'Login successful');
?>