<?php
header('Content-Type: application/json');

// Quick DB connectivity tester — safe for local dev only.
// Access via browser: http://localhost/dbb-frontend/backend/utils/test_db_connection.php

// Load config if available
if (file_exists(__DIR__ . '/../config/db.php')) {
    require_once __DIR__ . '/../config/db.php';
}

$out = [
    'pdo' => null,
    'mysqli' => null,
];

// PDO test
try {
    $dsn = 'mysql:host=' . (defined('DB_HOST') ? DB_HOST : '127.0.0.1')
        . ';port=' . (defined('DB_PORT') ? DB_PORT : 3306)
        . ';dbname=' . (defined('DB_NAME') ? DB_NAME : 'blood')
        . ';charset=utf8';
    $user = defined('DB_USER') ? DB_USER : (getenv('DB_USER') ?: 'root');
    $pass = defined('DB_PASS') ? DB_PASS : (getenv('DB_PASS') ?: '');
    $pdo = new PDO($dsn, $user, $pass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    $out['pdo'] = ['ok' => true, 'msg' => 'PDO connected'];
} catch (Exception $e) {
    $out['pdo'] = ['ok' => false, 'msg' => $e->getMessage()];
}

// mysqli test
try {
    $host = defined('DB_HOST') ? DB_HOST : '127.0.0.1';
    $port = defined('DB_PORT') ? DB_PORT : 3306;
    $user = defined('DB_USER') ? DB_USER : (getenv('DB_USER') ?: 'root');
    $pass = defined('DB_PASS') ? DB_PASS : (getenv('DB_PASS') ?: '');
    $dbname = defined('DB_NAME') ? DB_NAME : 'blood';

    $mysqli = @new mysqli($host, $user, $pass, $dbname, $port);
    if ($mysqli->connect_error) {
        $out['mysqli'] = ['ok' => false, 'msg' => $mysqli->connect_error];
    } else {
        $out['mysqli'] = ['ok' => true, 'msg' => 'mysqli connected'];
        $mysqli->close();
    }
} catch (Exception $e) {
    $out['mysqli'] = ['ok' => false, 'msg' => $e->getMessage()];
}

echo json_encode($out, JSON_PRETTY_PRINT);

?>
