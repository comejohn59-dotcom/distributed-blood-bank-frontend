<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../utils/auth.php';
require_once __DIR__ . '/../../utils/response.php';

// Only handle POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error("Method not allowed", 405);
}

// Start session and logout
session_start();
$auth = new Auth();
$result = $auth->logout();

if ($result) {
    Response::success(null, "Logout successful");
} else {
    Response::error("Logout failed");
}
?>