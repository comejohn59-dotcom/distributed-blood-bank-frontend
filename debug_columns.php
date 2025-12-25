<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../utils/response.php';

if (session_status() !== PHP_SESSION_ACTIVE) session_start();

try {
    $conn = Database::getConnection();
    if (!$conn) throw new Exception('DB connection failed');

    $tables = ['donors','donations'];
    $out = [];
    foreach ($tables as $t) {
        $res = $conn->query("SHOW COLUMNS FROM $t");
        if (!$res) {
            $out[$t] = ['error' => $conn->error];
            continue;
        }
        $cols = [];
        while ($row = $res->fetch_assoc()) {
            $cols[] = $row['Field'];
        }
        $out[$t] = $cols;
    }

    header('Content-Type: application/json');
    echo json_encode(['success' => true, 'data' => $out]);
} catch (Exception $e) {
    Response::error('Debug failed: ' . $e->getMessage());
}
