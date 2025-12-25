<?php
// Set secure session cookie settings - ADDED THESE LINES
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', 0); // Set to 1 if using HTTPS
ini_set('session.cookie_samesite', 'Lax');
ini_set('session.use_only_cookies', 1);
ini_set('session.cookie_lifetime', 86400); // 24 hours

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

require_once __DIR__ . '/response.php';
require_once __DIR__ . '/../config/db.php'; // Adjust path to your db.php

class Auth {
    private $conn;

    public function __construct() {
        $this->conn = Database::getConnection(); // Use your DB connection
        if (!$this->conn) {
            Response::error("Database connection failed", 500);
        }

        if (session_status() !== PHP_SESSION_ACTIVE) {
            session_start();
        }
    }

    // Login method with password verification
    public function login($email, $password, $role) {
        // Authenticate against central `users` table which holds email/password/role
        $stmt = $this->conn->prepare("SELECT * FROM users WHERE email = ? AND role = ?");
        $stmt->bind_param("ss", $email, $role);
        $stmt->execute();
        $user = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        if (!$user) {
            return false; // email not found for this role
        }

        // Verify hashed password
        if (!password_verify($password, $user['password'])) {
            return false; // invalid password
        }

        // Remove password before returning
        unset($user['password']);

        // Ensure role is set
        $user['role'] = $role;

        // user_id comes from users table
        if (isset($user['user_id'])) {
            $user['user_id'] = (int)$user['user_id'];
        } elseif (isset($user['id'])) {
            $user['user_id'] = (int)$user['id'];
        } else {
            $user['user_id'] = 0;
        }

        // Optionally attach role-specific record ids (e.g., blood_bank_id)
        switch ($role) {
            case 'blood_bank':
                $stmt = $this->conn->prepare("SELECT blood_bank_id FROM blood_banks WHERE user_id = ? LIMIT 1");
                $stmt->bind_param("i", $user['user_id']);
                $stmt->execute();
                $rb = $stmt->get_result()->fetch_assoc();
                $stmt->close();
                if ($rb && isset($rb['blood_bank_id'])) $user['blood_bank_id'] = (int)$rb['blood_bank_id'];
                break;
            case 'donor':
                $stmt = $this->conn->prepare("SELECT donor_id FROM donors WHERE user_id = ? LIMIT 1");
                $stmt->bind_param("i", $user['user_id']);
                $stmt->execute();
                $rd = $stmt->get_result()->fetch_assoc();
                $stmt->close();
                if ($rd && isset($rd['donor_id'])) $user['donor_id'] = (int)$rd['donor_id'];
                break;
            case 'hospital':
                $stmt = $this->conn->prepare("SELECT hospital_id FROM hospitals WHERE user_id = ? LIMIT 1");
                $stmt->bind_param("i", $user['user_id']);
                $stmt->execute();
                $rh = $stmt->get_result()->fetch_assoc();
                $stmt->close();
                if ($rh && isset($rh['hospital_id'])) $user['hospital_id'] = (int)$rh['hospital_id'];
                break;
            case 'admin':
                // admins are represented in users table; no extra lookup required
                break;
        }

        // Save user session
        $_SESSION['user'] = $user;

        return $user;
    }

    // Check role for authentication
    public function checkRole(array $allowedRoles = []) {
        if (empty($_SESSION['user'])) {
            Response::unauthorized('Not authenticated');
        }

        $user = $_SESSION['user'];

        if (!empty($allowedRoles) && !in_array($user['role'] ?? '', $allowedRoles)) {
            Response::forbidden('Insufficient permissions');
        }

        return $user;
    }

    // --- Static helpers to preserve compatibility with older code ---
    public static function ensureSession()
    {
        if (session_status() !== PHP_SESSION_ACTIVE) {
            session_start();
        }
    }

    public static function getUser()
    {
        self::ensureSession();
        return $_SESSION['user'] ?? null;
    }

    public static function validateRequest()
    {
        $user = self::getUser();
        if (!$user) {
            Response::unauthorized('Not authenticated');
        }
        return $user;
    }

    public static function validateToken($token = null)
    {
        self::ensureSession();
        if ($token && $token !== session_id()) {
            Response::unauthorized('Invalid token');
        }
        return self::getUser();
    }

    public static function isAdmin()
    {
        $u = self::getUser();
        return isset($u['role']) && $u['role'] === 'admin';
    }

    public static function isBloodBank()
    {
        $u = self::getUser();
        return isset($u['role']) && $u['role'] === 'blood_bank';
    }

    public static function isDonor()
    {
        $u = self::getUser();
        return isset($u['role']) && $u['role'] === 'donor';
    }

    // Static proxy for instance login
    public static function loginStatic($email, $password, $role)
    {
        $a = new self();
        return $a->login($email, $password, $role);
    }

    // NOTE: Do not declare a static method named `login` because it would
    // conflict with the instance method `login()` above. Use `loginStatic()`
    // or create an instance and call `$auth->login(...)` instead.
}

// Global instance
$auth = new Auth();