<?php
header('Content-Type: application/json');
// Allow requests from the frontend during development
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once __DIR__ . '/../../../utils/response.php';
require_once __DIR__ . '/../../../utils/auth.php';

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$token = null;
// Security: accept token only via Authorization header (Bearer) or rely on
// the session cookie. Do NOT accept tokens via URL or request body.
$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? ($_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? null);
$token = null;
if (!empty($authHeader) && preg_match('/Bearer\s+(\S+)/', $authHeader, $m)) {
    $token = $m[1];
}

// Use Auth helper to validate session/token. If $token is provided it will be
// compared to the current session id; otherwise validation will use the
// session cookie.
$user = Auth::validateToken($token ?? null);

// If validateToken returned, session is valid and user exists
Response::success(['user' => $user], 'Token valid');

?>
