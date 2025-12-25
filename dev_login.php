<?php
// Dev login helper - DO NOT USE IN PRODUCTION
require_once __DIR__ . '/../utils/response.php';

if (session_status() !== PHP_SESSION_ACTIVE) session_start();

$role = isset($_GET['role']) ? $_GET['role'] : 'donor';
$user_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 1;
$name = isset($_GET['name']) ? $_GET['name'] : 'Dev User';
$email = isset($_GET['email']) ? $_GET['email'] : 'dev@example.com';

// Minimal user object used by auth checks in this app
$_SESSION['user'] = [
    'user_id' => $user_id,
    'role' => $role,
    'name' => $name,
    'email' => $email
];

Response::success(['user' => $_SESSION['user']], 'Dev session created');
