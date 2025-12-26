<?php
session_start();
require_once '../../backend/config/database.php';

$error_message = '';
$success_message = '';

// Handle registration form submission
if ($_POST) {
    $email = trim($_POST['email']);
    $password = $_POST['password'];
    $first_name = trim($_POST['firstName']);
    $last_name = trim($_POST['lastName']);
    $phone = trim($_POST['phone']);
    $blood_type = $_POST['bloodType'];
    $date_of_birth = $_POST['dateOfBirth'];
    $gender = $_POST['gender'];
    $address = trim($_POST['address']);
    $city = trim($_POST['city']);
    $state = trim($_POST['state']);
    $zip_code = trim($_POST['zipCode']);
    
    // Validation
    if (empty($email) || empty($password) || empty($first_name) || empty($last_name) || empty($blood_type) || empty($date_of_birth) || empty($gender)) {
        $error_message = 'Please fill in all required fields.';
    } elseif (strlen($password) < 8) {
        $error_message = 'Password must be at least 8 characters long.';
    } else {
        try {
            // Check if email already exists
            $check_stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
            $check_stmt->execute([$email]);
            if ($check_stmt->fetch()) {
                $error_message = 'Email already registered. Please use a different email.';
            } else {
                // Start transaction
                $conn->beginTransaction();
                
                // Insert user
                $user_stmt = $conn->prepare("
                    INSERT INTO users (email, password_hash, user_type, first_name, last_name, phone, address, city, state, zip_code, country, created_at)
                    VALUES (?, ?, 'patient', ?, ?, ?, ?, ?, ?, ?, 'USA', NOW())
                ");
                $user_stmt->execute([
                    $email,
                    password_hash($password, PASSWORD_DEFAULT),
                    $first_name,
                    $last_name,
                    $phone,
                    $address,
                    $city,
                    $state,
                    $zip_code
                ]);
                
                $user_id = $conn->lastInsertId();
                
                // Generate patient ID
                $patient_id = 'PT-' . date('Y') . '-' . str_pad($user_id, 6, '0', STR_PAD_LEFT);
                
                // Insert patient profile
                $patient_stmt = $conn->prepare("
                    INSERT INTO patients (user_id, patient_id, blood_type, date_of_birth, gender, weight, height, 
                                        emergency_contact_name, emergency_contact_phone, known_allergies, medical_conditions, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
                ");
                $patient_stmt->execute([
                    $user_id,
                    $patient_id,
                    $blood_type,
                    $date_of_birth,
                    $gender,
                    $_POST['weight'] ?? null,
                    $_POST['height'] ?? null,
                    $_POST['emergencyContact'] ?? null,
                    $_POST['emergencyPhone'] ?? null,
                    $_POST['allergies'] ?? null,
                    $_POST['medicalConditions'] ?? null
                ]);
                
                $conn->commit();
                $success_message = 'Registration successful! You can now login with your credentials.';
                
                // Clear form data
                $_POST = array();
            }
        } catch (PDOException $e) {
            $conn->rollBack();
            $error_message = 'Registration failed. Please try again.';
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Patient Registration - BloodConnect</title>
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
                <a href="login.php" class="nav-link">Login</a>
            </div>
        </div>
    </nav>

    <!-- Registration Container -->
    <div class="auth-container-modern">
        <div class="auth-content-modern single-card">
            <div class="auth-card-modern">
                <div class="auth-header-modern">
                    <div class="auth-logo-modern">
                        <i class="fas fa-user-injured"></i>
                    </div>
                    <h1>Patient Registration</h1>
                    <p>Register as a patient to request blood when needed</p>
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
                        <br><a href="login.php" class="btn btn-primary btn-sm" style="margin-top: 10px;">Login Now</a>
                    </div>
                <?php endif; ?>

                <form class="auth-form-modern" method="POST">
                    <!-- Personal Information -->
                    <div class="form-section">
                        <h3><i class="fas fa-user"></i> Personal Information</h3>
                        
                        <div class="form-row">
                            <div class="form-group-modern">
                                <label for="firstName">First Name *</label>
                                <input type="text" id="firstName" name="firstName" class="form-control-modern" required value="<?php echo htmlspecialchars($_POST['firstName'] ?? ''); ?>">
                            </div>
                            <div class="form-group-modern">
                                <label for="lastName">Last Name *</label>
                                <input type="text" id="lastName" name="lastName" class="form-control-modern" required value="<?php echo htmlspecialchars($_POST['lastName'] ?? ''); ?>">
                            </div>
                        </div>

                        <div class="form-group-modern">
                            <label for="email">Email Address *</label>
                            <input type="email" id="email" name="email" class="form-control-modern" required value="<?php echo htmlspecialchars($_POST['email'] ?? ''); ?>">
                        </div>

                        <div class="form-group-modern">
                            <label for="password">Password *</label>
                            <input type="password" id="password" name="password" class="form-control-modern" required minlength="8">
                            <small class="form-help">Minimum 8 characters</small>
                        </div>

                        <div class="form-group-modern">
                            <label for="phone">Phone Number</label>
                            <input type="tel" id="phone" name="phone" class="form-control-modern" value="<?php echo htmlspecialchars($_POST['phone'] ?? ''); ?>">
                        </div>
                    </div>

                    <!-- Medical Information -->
                    <div class="form-section">
                        <h3><i class="fas fa-heartbeat"></i> Medical Information</h3>
                        
                        <div class="form-row">
                            <div class="form-group-modern">
                                <label for="bloodType">Blood Type *</label>
                                <select id="bloodType" name="bloodType" class="form-control-modern" required>
                                    <option value="">Select Blood Type</option>
                                    <option value="A+" <?php echo (($_POST['bloodType'] ?? '') == 'A+') ? 'selected' : ''; ?>>A+</option>
                                    <option value="A-" <?php echo (($_POST['bloodType'] ?? '') == 'A-') ? 'selected' : ''; ?>>A-</option>
                                    <option value="B+" <?php echo (($_POST['bloodType'] ?? '') == 'B+') ? 'selected' : ''; ?>>B+</option>
                                    <option value="B-" <?php echo (($_POST['bloodType'] ?? '') == 'B-') ? 'selected' : ''; ?>>B-</option>
                                    <option value="AB+" <?php echo (($_POST['bloodType'] ?? '') == 'AB+') ? 'selected' : ''; ?>>AB+</option>
                                    <option value="AB-" <?php echo (($_POST['bloodType'] ?? '') == 'AB-') ? 'selected' : ''; ?>>AB-</option>
                                    <option value="O+" <?php echo (($_POST['bloodType'] ?? '') == 'O+') ? 'selected' : ''; ?>>O+</option>
                                    <option value="O-" <?php echo (($_POST['bloodType'] ?? '') == 'O-') ? 'selected' : ''; ?>>O-</option>
                                </select>
                            </div>
                            <div class="form-group-modern">
                                <label for="dateOfBirth">Date of Birth *</label>
                                <input type="date" id="dateOfBirth" name="dateOfBirth" class="form-control-modern" required value="<?php echo htmlspecialchars($_POST['dateOfBirth'] ?? ''); ?>">
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group-modern">
                                <label for="gender">Gender *</label>
                                <select id="gender" name="gender" class="form-control-modern" required>
                                    <option value="">Select Gender</option>
                                    <option value="male" <?php echo (($_POST['gender'] ?? '') == 'male') ? 'selected' : ''; ?>>Male</option>
                                    <option value="female" <?php echo (($_POST['gender'] ?? '') == 'female') ? 'selected' : ''; ?>>Female</option>
                                    <option value="other" <?php echo (($_POST['gender'] ?? '') == 'other') ? 'selected' : ''; ?>>Other</option>
                                </select>
                            </div>
                            <div class="form-group-modern">
                                <label for="weight">Weight (kg)</label>
                                <input type="number" id="weight" name="weight" class="form-control-modern" min="1" max="300" value="<?php echo htmlspecialchars($_POST['weight'] ?? ''); ?>">
                            </div>
                        </div>

                        <div class="form-group-modern">
                            <label for="height">Height (cm)</label>
                            <input type="number" id="height" name="height" class="form-control-modern" min="50" max="250" value="<?php echo htmlspecialchars($_POST['height'] ?? ''); ?>">
                        </div>
                    </div>

                    <!-- Address Information -->
                    <div class="form-section">
                        <h3><i class="fas fa-map-marker-alt"></i> Address Information</h3>
                        
                        <div class="form-group-modern">
                            <label for="address">Street Address</label>
                            <input type="text" id="address" name="address" class="form-control-modern" value="<?php echo htmlspecialchars($_POST['address'] ?? ''); ?>">
                        </div>

                        <div class="form-row">
                            <div class="form-group-modern">
                                <label for="city">City</label>
                                <input type="text" id="city" name="city" class="form-control-modern" value="<?php echo htmlspecialchars($_POST['city'] ?? ''); ?>">
                            </div>
                            <div class="form-group-modern">
                                <label for="state">State</label>
                                <input type="text" id="state" name="state" class="form-control-modern" value="<?php echo htmlspecialchars($_POST['state'] ?? ''); ?>">
                            </div>
                            <div class="form-group-modern">
                                <label for="zipCode">ZIP Code</label>
                                <input type="text" id="zipCode" name="zipCode" class="form-control-modern" value="<?php echo htmlspecialchars($_POST['zipCode'] ?? ''); ?>">
                            </div>
                        </div>
                    </div>

                    <!-- Emergency Contact -->
                    <div class="form-section">
                        <h3><i class="fas fa-phone"></i> Emergency Contact</h3>
                        
                        <div class="form-row">
                            <div class="form-group-modern">
                                <label for="emergencyContact">Emergency Contact Name</label>
                                <input type="text" id="emergencyContact" name="emergencyContact" class="form-control-modern" value="<?php echo htmlspecialchars($_POST['emergencyContact'] ?? ''); ?>">
                            </div>
                            <div class="form-group-modern">
                                <label for="emergencyPhone">Emergency Contact Phone</label>
                                <input type="tel" id="emergencyPhone" name="emergencyPhone" class="form-control-modern" value="<?php echo htmlspecialchars($_POST['emergencyPhone'] ?? ''); ?>">
                            </div>
                        </div>
                    </div>

                    <!-- Medical History -->
                    <div class="form-section">
                        <h3><i class="fas fa-notes-medical"></i> Medical History (Optional)</h3>
                        
                        <div class="form-group-modern">
                            <label for="allergies">Known Allergies</label>
                            <textarea id="allergies" name="allergies" class="form-control-modern" rows="2" placeholder="List any known allergies..."><?php echo htmlspecialchars($_POST['allergies'] ?? ''); ?></textarea>
                        </div>

                        <div class="form-group-modern">
                            <label for="medicalConditions">Medical Conditions</label>
                            <textarea id="medicalConditions" name="medicalConditions" class="form-control-modern" rows="2" placeholder="List any current medical conditions..."><?php echo htmlspecialchars($_POST['medicalConditions'] ?? ''); ?></textarea>
                        </div>
                    </div>

                    <button type="submit" class="btn btn-primary btn-lg btn-block auth-btn-modern">
                        <i class="fas fa-user-plus"></i>
                        Register as Patient
                    </button>
                </form>

                <div class="auth-footer-modern">
                    <p>Already have an account? <a href="login.php" class="auth-link-modern">Sign in here</a></p>
                    <p>Want to register as a different user type? <a href="register.php" class="auth-link-modern">Choose here</a></p>
                </div>
            </div>
        </div>
    </div>

    <script src="../js/main.js"></script>
</body>
</html>