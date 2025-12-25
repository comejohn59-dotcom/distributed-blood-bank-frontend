<?php
// Dev-only schema runner. Use ?confirm=1 to execute. DO NOT USE IN PRODUCTION.
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../utils/response.php';

if (php_sapi_name() === 'cli') {
    echo "Run via HTTP only\n";
    exit;
}

if (!isset($_GET['confirm']) || $_GET['confirm'] !== '1') {
    Response::error('Confirmation required. Call with ?confirm=1', 400);
}

$sqlFile = __DIR__ . '/../schema.sql';
if (!file_exists($sqlFile)) {
    Response::error('Schema file not found', 500);
}

$sql = file_get_contents($sqlFile);
if ($sql === false) {
    Response::error('Failed to read schema file', 500);
}

try {
    $pdo = Database::getPDO();
    if (!$pdo) throw new Exception('PDO connection failed');

    // Split statements on semicolon followed by newline for safety
    $stmts = array_filter(array_map('trim', preg_split('/;\s*\n/', $sql)));
    foreach ($stmts as $stmt) {
        if ($stmt === '') continue;
        $pdo->exec($stmt);
    }

    Response::success(null, 'Schema executed (dev)');
} catch (Exception $e) {
    Response::error('Schema execution failed: ' . $e->getMessage(), 500);
}
