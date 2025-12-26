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
    $hospital_name = trim($_POST['hospitalName']);
    $hospital_type = $_POST['hospitalType'];
    $license_number = trim($_POST['licenseNumber']);
    $address = trim($_POST['address']);
    $city = trim($_POST['city']);
    $state = trim($_POST['state']);
    $zip_code = trim($_POST['zipCode']);
    
    // Validation
    if (empty($email) || empty($password) || empty($first_name) || empty($last_name) || empty($hospital_name) || empty($hospital_type) || empty($license_number)) {
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
                    VALUES (?, ?, 'hospital', ?, ?, ?, ?, ?, ?, ?, 'USA', NOW())
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
                
                // Generate hospital ID
                $hospital_id = 'HP-' . date('Y') . '-' . str_pad($user_id, 6, '0', STR_PAD_LEFT);
                
                // Insert hospital profile
                $hospital_stmt = $conn->prepare("
                    INSERT INTO hospitals (user_id, hospital_id, hospital_name, hospital_type, license_number, 
                                         accreditation_level, bed_capacity, has_blood_bank, emergency_services, 
                                         trauma_center_level, is_24_7, website, emergency_phone, blood_bank_phone, 
                                         is_verified, is_active, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1, NOW())
                ");
                $hospital_stmt->execute([
                    $user_id,
                    $hospital_id,
                    $hospital_name,
                    $hospital_type,
                    $license_number,
                    $_POST['accreditation'] ?? 'level_1',
                    $_POST['bedCapacity'] ?? null,
                    isset($_POST['hasBloodBank']) ? 1 : 0,
                    isset($_POST['emergencyServices']) ? 1 : 0,
                    $_POST['traumaLevel'] ?? 'none',
                    isset($_POST['is247']) ? 1 : 0,
                    $_POST['website'] ?? null,
                    $_POST['emergencyPhone'] ?? null,
                    $_POST['bloodBankPhone'] ?? null
                ]);
                
                $hospital_profile_id = $conn->lastInsertId();
                
                // Initialize blood inventory if has blood bank
                if (isset($_POST['hasBloodBank'])) {
                    $blood_types = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
                    foreach ($blood_types as $blood_type) {
                        $inventory_stmt = $conn->prepare("
                            INSERT INTO blood_inventory (hospital_id, blood_type, units_available, low_stock_threshold, critical_stock_threshold)
                            VALUES (?, ?, 0, 10, 5)
                        ");
                        $inventory_stmt->execute([$hospital_profile_id, $blood_type]);
                    }
                }
                
                $conn->commit();
                $success_message = 'Hospital registration successful! Your account is pending admin approval. You will be notified once approved.';
                
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
    <title>Hospital Registration - BloodConnect</title>
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
                        <i class="fas fa-hospital"></i>
                    </div>
                    <h1>Hospital Registration</h1>
                    <p>Register your hospital to manage blood inventory and requests</p>
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
                        <br><a href="login.php" class="btn btn-primary btn-sm" style="margin-top: 10px;">Go to Login</a>
                    </div>
                <?php endif; ?>

                <form class="auth-form-modern" method="POST">
                    <!-- Contact Person Information -->
                    <div class="form-section">
                        <h3><i class="fas fa-user"></i> Contact Person Information</h3>
                        
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
                            <label for="phone">Phone Number *</label>
                            <input type="tel" id="phone" name="phone" class="form-control-modern" required value="<?php echo htmlspecialchars($_POST['phone'] ?? ''); ?>">
                        </div>
                    </div>

                    <!-- Hospital Information -->
                    <div class="form-section">
                        <h3><i class="fas fa-hospital"></i> Hospital Information</h3>
                        
                        <div class="form-group-modern">
                            <label for="hospitalName">Hospital Name *</label>
                            <input type="text" id="hospitalName" name="hospitalName" class="form-control-modern" required value="<?php echo htmlspecialchars($_POST['hospitalName'] ?? ''); ?>">
                        </div>

                        <div class="form-row">
                            <div class="form-group-modern">
                                <label for="hospitalType">Hospital Type *</label>
                                <select id="hospitalType" name="hospitalType" class="form-control-modern" required>
                                    <option value="">Select Type</option>
                                    <option value="government" <?php echo (($_POST['hospitalType'] ?? '') == 'government') ? 'selected' : ''; ?>>Government</option>
                                    <option value="private" <?php echo (($_POST['hospitalType'] ?? '') == 'private') ? 'selected' : ''; ?>>Private</option>
                                    <option value="charitable" <?php echo (($_POST['hospitalType'] ?? '') == 'charitable') ? 'selected' : ''; ?>>Charitable</option>
                                    <option value="specialty" <?php echo (($_POST['hospitalType'] ?? '') == 'specialty') ? 'selected' : ''; ?>>Specialty</option>
                                </select>
                            </div>
                            <div class="form-group-modern">
                                <label for="licenseNumber">License Number *</label>
                                <input type="text" id="licenseNumber" name="licenseNumber" class="form-control-modern" required value="<?php echo htmlspecialchars($_POST['licenseNumber'] ?? ''); ?>">
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group-modern">
                                <label for="accreditation">Accreditation Level</label>
                                <select id="accreditation" name="accreditation" class="form-control-modern">
                                    <option value="level_1" <?php echo (($_POST['accreditation'] ?? 'level_1') == 'level_1') ? 'selected' : ''; ?>>Level 1</option>
                                    <option value="level_2" <?php echo (($_POST['accreditation'] ?? 'level_1') == 'level_2') ? 'selected' : ''; ?>>Level 2</option>
                                    <option value="level_3" <?php echo (($_POST['accreditation'] ?? 'level_1') == 'level_3') ? 'selected' : ''; ?>>Level 3</option>
                                    <option value="level_4" <?php echo (($_POST['accreditation'] ?? 'level_1') == 'level_4') ? 'selected' : ''; ?>>Level 4</option>
                                </select>
                            </div>
                            <div class="form-group-modern">
                                <label for="bedCapacity">Bed Capacity</label>
                                <input type="number" id="bedCapacity" name="bedCapacity" class="form-control-modern" min="1" max="10000" value="<?php echo htmlspecialchars($_POST['bedCapacity'] ?? ''); ?>">
                            </div>
                        </div>
                    </div>

                    <!-- Services -->
                    <div class="form-section">
                        <h3><i class="fas fa-cogs"></i> Services & Facilities</h3>
                        
                        <div class="form-group-modern">
                            <label class="checkbox-label-modern">
                                <input type="checkbox" name="hasBloodBank" value="1" <?php echo isset($_POST['hasBloodBank']) ? 'checked' : ''; ?>>
                                <span class="checkmark-modern"></span>
                                Has Blood Bank
                            </label>
                        </div>

                        <div class="form-group-modern">
                            <label class="checkbox-label-modern">
                                <input type="checkbox" name="emergencyServices" value="1" <?php echo isset($_POST['emergencyServices']) ? 'checked' : ''; ?>>
                                <span class="checkmark-modern"></span>
                                Emergency Services
                            </label>
                        </div>

                        <div class="form-group-modern">
                            <label class="checkbox-label-modern">
                                <input type="checkbox" name="is247" value="1" <?php echo isset($_POST['is247']) ? 'checked' : ''; ?>>
                                <span class="checkmark-modern"></span>
                                24/7 Operations
                            </label>
                        </div>

                        <div class="form-group-modern">
                            <label for="traumaLevel">Trauma Center Level</label>
                            <select id="traumaLevel" name="traumaLevel" class="form-control-modern">
                                <option value="none" <?php echo (($_POST['traumaLevel'] ?? 'none') == 'none') ? 'selected' : ''; ?>>None</option>
                                <option value="level_1" <?php echo (($_POST['traumaLevel'] ?? 'none') == 'level_1') ? 'selected' : ''; ?>>Level 1</option>
                                <option value="level_2" <?php echo (($_POST['traumaLevel'] ?? 'none') == 'level_2') ? 'selected' : ''; ?>>Level 2</option>
                                <option value="level_3" <?php echo (($_POST['traumaLevel'] ?? 'none') == 'level_3') ? 'selected' : ''; ?>>Level 3</option>
                                <option value="level_4" <?php echo (($_POST['traumaLevel'] ?? 'none') == 'level_4') ? 'selected' : ''; ?>>Level 4</option>
                            </select>
                        </div>
                    </div>

                    <!-- Address Information -->
                    <div class="form-section">
                        <h3><i class="fas fa-map-marker-alt"></i> Address Information</h3>
                        
                        <div class="form-group-modern">
                            <label for="address">Street Address *</label>
                            <input type="text" id="address" name="address" class="form-control-modern" required value="<?php echo htmlspecialchars($_POST['address'] ?? ''); ?>">
                        </div>

                        <div class="form-row">
                            <div class="form-group-modern">
                                <label for="city">City *</label>
                                <input type="text" id="city" name="city" class="form-control-modern" required value="<?php echo htmlspecialchars($_POST['city'] ?? ''); ?>">
                            </div>
                            <div class="form-group-modern">
                                <label for="state">State *</label>
                                <input type="text" id="state" name="state" class="form-control-modern" required value="<?php echo htmlspecialchars($_POST['state'] ?? ''); ?>">
                            </div>
                            <div class="form-group-modern">
                                <label for="zipCode">ZIP Code *</label>
                                <input type="text" id="zipCode" name="zipCode" class="form-control-modern" required value="<?php echo htmlspecialchars($_POST['zipCode'] ?? ''); ?>">
                            </div>
                        </div>
                    </div>

                    <!-- Contact Information -->
                    <div class="form-section">
                        <h3><i class="fas fa-phone"></i> Additional Contact Information</h3>
                        
                        <div class="form-row">
                            <div class="form-group-modern">
                                <label for="emergencyPhone">Emergency Phone</label>
                                <input type="tel" id="emergencyPhone" name="emergencyPhone" class="form-control-modern" value="<?php echo htmlspecialchars($_POST['emergencyPhone'] ?? ''); ?>">
                            </div>
                            <div class="form-group-modern">
                                <label for="bloodBankPhone">Blood Bank Phone</label>
                                <input type="tel" id="bloodBankPhone" name="bloodBankPhone" class="form-control-modern" value="<?php echo htmlspecialchars($_POST['bloodBankPhone'] ?? ''); ?>">
                            </div>
                        </div>

                        <div class="form-group-modern">
                            <label for="website">Website</label>
                            <input type="url" id="website" name="website" class="form-control-modern" placeholder="https://" value="<?php echo htmlspecialchars($_POST['website'] ?? ''); ?>">
                        </div>
                    </div>

                    <button type="submit" class="btn btn-primary btn-lg btn-block auth-btn-modern">
                        <i class="fas fa-hospital"></i>
                        Register Hospital
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