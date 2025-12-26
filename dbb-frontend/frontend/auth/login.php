<?php
session_start();
require_once '../../backend/config/database.php';

$error_message = '';
$success_message = '';

// Handle login form submission
if ($_POST && isset($_POST['email']) && isset($_POST['password'])) {
    $email = trim($_POST['email']);
    $password = $_POST['password'];
    
    if (empty($email) || empty($password)) {
        $error_message = 'Please fill in all fields.';
    } else {
        try {
            // Get user by email
            $stmt = $conn->prepare("SELECT * FROM users WHERE email = ? AND is_active = 1");
            $stmt->execute([$email]);
            $user = $stmt->fetch();
            
            if ($user && password_verify($password, $user['password_hash'])) {
                // Login successful
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['user_email'] = $user['email'];
                $_SESSION['user_type'] = $user['user_type'];
                $_SESSION['user_name'] = $user['first_name'] . ' ' . $user['last_name'];
                
                // Update last login
                $update_stmt = $conn->prepare("UPDATE users SET last_login = NOW() WHERE id = ?");
                $update_stmt->execute([$user['id']]);
                
                // Redirect based on user type
                switch ($user['user_type']) {
                    case 'patient':
                        header('Location: ../dashboard/patient.php');
                        break;
                    case 'donor':
                        header('Location: ../dashboard/donor.php');
                        break;
                    case 'hospital':
                        header('Location: ../dashboard/hospital.php');
                        break;
                    case 'admin':
                        header('Location: ../dashboard/admin.php');
                        break;
                    default:
                        header('Location: ../dashboard/patient.php');
                }
                exit();
            } else {
                $error_message = 'Invalid email or password.';
            }
        } catch (PDOException $e) {
            $error_message = 'Login failed. Please try again.';
        }
    }
}

// Handle admin quick login
if (isset($_GET['admin_login'])) {
    try {
        $stmt = $conn->prepare("SELECT * FROM users WHERE email = 'admin@bloodconnect.com' AND is_active = 1");
        $stmt->execute();
        $admin = $stmt->fetch();
        
        if ($admin) {
            $_SESSION['user_id'] = $admin['id'];
            $_SESSION['user_email'] = $admin['email'];
            $_SESSION['user_type'] = $admin['user_type'];
            $_SESSION['user_name'] = $admin['first_name'] . ' ' . $admin['last_name'];
            
            header('Location: ../dashboard/admin.php');
            exit();
        }
    } catch (PDOException $e) {
        $error_message = 'Admin login failed.';
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - BloodConnect</title>
    <link rel="stylesheet" href="../css/style.css">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</head>
<body class="auth-body">
    <!-- Navigation -->
    <nav class="navbar">
        <div class="nav-container">
            <div class="nav-brand">
                <i class="fas fa-tint"></i>
                <span>BloodConnect</span>
            </div>
            <div class="nav-menu">
                <a href="../index.php" class="nav-link">Home</a>
                <a href="../about.php" class="nav-link">About</a>
                <a href="../contact.php" class="nav-link">Contact</a>
                <a href="../become-donor.php" class="nav-link">Become a Donor</a>
                <a href="../request-blood.php" class="nav-link">Request Blood</a>
            </div>
            <div class="nav-toggle">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    </nav>

    <!-- Auth Container -->
    <div class="auth-container-modern">
        <div class="auth-content-modern">
            <!-- Login Card -->
            <div class="auth-card-modern">
                <div class="auth-header-modern">
                    <div class="auth-logo-modern">
                        <i class="fas fa-tint"></i>
                    </div>
                    <h1>Welcome Back</h1>
                    <p>Sign in to your BloodConnect account</p>
                </div>

                <?php if ($error_message): ?>
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-circle"></i>
                        <?php echo htmlspecialchars($error_message); ?>
                    </div>
                <?php endif; ?>

                <?php if ($success_message): ?>
                    <div class="alert alert-success">
                        <i class="fas fa-check-circle"></i>
                        <?php echo htmlspecialchars($success_message); ?>
                    </div>
                <?php endif; ?>

                <form class="auth-form-modern" method="POST">
                    <div class="form-group-modern">
                        <label for="email">Email Address</label>
                        <div class="input-group-modern">
                            <i class="fas fa-envelope"></i>
                            <input type="email" id="email" name="email" class="form-control-modern" placeholder="Enter your email" required value="<?php echo isset($_POST['email']) ? htmlspecialchars($_POST['email']) : ''; ?>">
                        </div>
                    </div>

                    <div class="form-group-modern">
                        <label for="password">Password</label>
                        <div class="input-group-modern">
                            <i class="fas fa-lock"></i>
                            <input type="password" id="password" name="password" class="form-control-modern" placeholder="Enter your password" required>
                            <button type="button" class="password-toggle-modern" onclick="togglePassword()">
                                <i class="fas fa-eye" id="passwordToggleIcon"></i>
                            </button>
                        </div>
                    </div>

                    <div class="form-options-modern">
                        <label class="checkbox-label-modern">
                            <input type="checkbox" name="remember" value="yes">
                            <span class="checkmark-modern"></span>
                            Remember me
                        </label>
                    </div>

                    <button type="submit" class="btn btn-primary btn-lg btn-block auth-btn-modern">
                        <i class="fas fa-sign-in-alt"></i>
                        Sign In
                    </button>
                </form>

                <div class="auth-divider-modern">
                    <span>or</span>
                </div>

                <a href="?admin_login=1" class="btn btn-secondary btn-block auth-btn-modern">
                    <i class="fas fa-user-shield"></i>
                    Admin Login (Quick Access)
                </a>

                <div class="auth-footer-modern">
                    <p>Don't have an account? <a href="register.php" class="auth-link-modern">Sign up here</a></p>
                </div>
            </div>

            <!-- Side Panel -->
            <div class="auth-side-panel">
                <div class="side-panel-content">
                    <div class="side-panel-header">
                        <h2>Welcome Back to BloodConnect</h2>
                        <p>Access your dashboard and continue making a difference in people's lives</p>
                    </div>

                    <div class="side-panel-features">
                        <div class="feature-item">
                            <div class="feature-icon">
                                <i class="fas fa-shield-alt"></i>
                            </div>
                            <div class="feature-content">
                                <h4>Secure Access</h4>
                                <p>Your data is protected with enterprise-grade security</p>
                            </div>
                        </div>

                        <div class="feature-item">
                            <div class="feature-icon">
                                <i class="fas fa-heart"></i>
                            </div>
                            <div class="feature-content">
                                <h4>Save Lives</h4>
                                <p>Track your donations and see your impact</p>
                            </div>
                        </div>

                        <div class="feature-item">
                            <div class="feature-icon">
                                <i class="fas fa-users"></i>
                            </div>
                            <div class="feature-content">
                                <h4>Join Community</h4>
                                <p>Connect with other life-savers in your area</p>
                            </div>
                        </div>
                    </div>

                    <div class="side-panel-stats">
                        <?php
                        try {
                            // Get statistics from database
                            $stats_stmt = $conn->prepare("
                                SELECT 
                                    (SELECT COUNT(*) FROM users WHERE user_type = 'donor') as donor_count,
                                    (SELECT COUNT(*) FROM users WHERE user_type = 'hospital') as hospital_count,
                                    (SELECT COUNT(*) FROM blood_requests WHERE status = 'completed') as completed_requests
                            ");
                            $stats_stmt->execute();
                            $stats = $stats_stmt->fetch();
                        } catch (PDOException $e) {
                            $stats = ['donor_count' => '10K+', 'hospital_count' => '500+', 'completed_requests' => '25K+'];
                        }
                        ?>
                        <div class="stat-item-modern">
                            <div class="stat-number"><?php echo number_format($stats['completed_requests'] ?? 0); ?>+</div>
                            <div class="stat-label">Lives Saved</div>
                        </div>
                        <div class="stat-item-modern">
                            <div class="stat-number"><?php echo number_format($stats['donor_count'] ?? 0); ?>+</div>
                            <div class="stat-label">Active Donors</div>
                        </div>
                        <div class="stat-item-modern">
                            <div class="stat-number"><?php echo number_format($stats['hospital_count'] ?? 0); ?>+</div>
                            <div class="stat-label">Hospitals</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        function togglePassword() {
            const passwordInput = document.getElementById('password');
            const toggleIcon = document.getElementById('passwordToggleIcon');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                toggleIcon.classList.remove('fa-eye');
                toggleIcon.classList.add('fa-eye-slash');
            } else {
                passwordInput.type = 'password';
                toggleIcon.classList.remove('fa-eye-slash');
                toggleIcon.classList.add('fa-eye');
            }
        }
    </script>
    <script src="../js/main.js"></script>
</body>
</html>