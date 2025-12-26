<?php
session_start();
require_once '../backend/config/database.php';

$error_message = '';
$success_message = '';

// Handle blood request form submission
if ($_POST && isset($_POST['submit_request'])) {
    // Check if user is logged in
    if (!isset($_SESSION['user_id'])) {
        $error_message = 'Please login to submit a blood request.';
    } else {
        $blood_type = $_POST['bloodType'];
        $units_requested = (int)$_POST['unitsRequested'];
        $priority = $_POST['priority'];
        $medical_reason = trim($_POST['medicalReason']);
        $hospital_id = $_POST['hospitalId'] ?? null;
        $doctor_contact = trim($_POST['doctorContact']);
        $emergency_contact = trim($_POST['emergencyContact']);
        
        // Validation
        if (empty($blood_type) || empty($units_requested) || empty($priority) || empty($medical_reason)) {
            $error_message = 'Please fill in all required fields.';
        } elseif ($units_requested < 1 || $units_requested > 10) {
            $error_message = 'Units requested must be between 1 and 10.';
        } else {
            try {
                // Generate request ID
                $request_id = 'REQ-' . date('Y') . '-' . str_pad(rand(1, 999999), 6, '0', STR_PAD_LEFT);
                
                // Insert blood request
                $stmt = $conn->prepare("
                    INSERT INTO blood_requests (request_id, patient_id, hospital_id, blood_type, units_requested, 
                                              priority, medical_reason, doctor_contact, emergency_contact_name, 
                                              status, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())
                ");
                $stmt->execute([
                    $request_id,
                    $_SESSION['user_id'],
                    $hospital_id,
                    $blood_type,
                    $units_requested,
                    $priority,
                    $medical_reason,
                    $doctor_contact,
                    $emergency_contact
                ]);
                
                $success_message = "Blood request submitted successfully! Request ID: $request_id. You will be notified when a match is found.";
                
                // Clear form data
                $_POST = array();
            } catch (PDOException $e) {
                $error_message = 'Failed to submit request. Please try again.';
            }
        }
    }
}

// Get available hospitals
try {
    $hospitals_stmt = $conn->prepare("
        SELECT h.id, h.hospital_name, u.city, u.state, h.has_blood_bank, h.emergency_services
        FROM hospitals h 
        JOIN users u ON h.user_id = u.id 
        WHERE h.is_active = 1 AND h.is_verified = 1
        ORDER BY h.hospital_name
    ");
    $hospitals_stmt->execute();
    $hospitals = $hospitals_stmt->fetchAll();
} catch (PDOException $e) {
    $hospitals = [];
}

// Get blood availability data
try {
    $availability_stmt = $conn->prepare("
        SELECT bi.blood_type, SUM(bi.units_available) as total_units,
               COUNT(CASE WHEN bi.units_available > bi.low_stock_threshold THEN 1 END) as available_hospitals,
               COUNT(h.id) as total_hospitals
        FROM blood_inventory bi
        JOIN hospitals h ON bi.hospital_id = h.id
        WHERE h.is_active = 1
        GROUP BY bi.blood_type
        ORDER BY bi.blood_type
    ");
    $availability_stmt->execute();
    $blood_availability = $availability_stmt->fetchAll();
} catch (PDOException $e) {
    $blood_availability = [];
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Request Blood - BloodConnect</title>
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="css/modern-styles.css">
    <link rel="stylesheet" href="css/page-specific.css">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
</head>
<body>
    <!-- Navigation -->
    <nav class="navbar">
        <div class="nav-container">
            <div class="nav-brand">
                <i class="fas fa-tint"></i>
                <span>BloodConnect</span>
            </div>
            <div class="nav-menu">
                <a href="index.php" class="nav-link">Home</a>
                <a href="about.php" class="nav-link">About</a>
                <a href="services.php" class="nav-link">Services</a>
                <a href="contact.php" class="nav-link">Contact</a>
                <a href="become-donor.php" class="nav-link">Become a Donor</a>
                <a href="request-blood.php" class="nav-link active">Request Blood</a>
                <?php if (isset($_SESSION['user_id'])): ?>
                    <a href="dashboard/<?php echo $_SESSION['user_type']; ?>.php" class="nav-link">Dashboard</a>
                    <a href="auth/logout.php" class="nav-link">Logout</a>
                <?php else: ?>
                    <a href="auth/login.php" class="nav-link">Login</a>
                <?php endif; ?>
            </div>
            <div class="nav-toggle">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <section class="hero-compact">
        <div class="container">
            <div class="hero-horizontal">
                <div class="hero-text">
                    <h1><i class="fas fa-hand-holding-medical"></i> Request Blood</h1>
                    <p>Submit your blood request and get connected with available donors and hospitals in your area.</p>
                    <?php if (!isset($_SESSION['user_id'])): ?>
                        <div class="hero-actions-inline">
                            <a href="auth/login.php" class="btn btn-primary">
                                <i class="fas fa-sign-in-alt"></i>
                                Login to Request
                            </a>
                            <a href="auth/register-patient.php" class="btn btn-outline-light">
                                <i class="fas fa-user-plus"></i>
                                Register as Patient
                            </a>
                        </div>
                    <?php endif; ?>
                </div>
                <div class="hero-stats-inline">
                    <div class="stat-item">
                        <span class="stat-number"><?php echo count($hospitals); ?></span>
                        <span class="stat-label">Partner Hospitals</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number"><?php echo array_sum(array_column($blood_availability, 'total_units')); ?></span>
                        <span class="stat-label">Units Available</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">24/7</span>
                        <span class="stat-label">Emergency Support</span>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Main Content -->
    <section class="main-content-horizontal">
        <div class="container">
            <div class="content-grid">
                <!-- Request Form -->
                <div class="content-section">
                    <h2><i class="fas fa-clipboard-list"></i> Submit Blood Request</h2>
                    
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

                    <?php if (isset($_SESSION['user_id'])): ?>
                        <form method="POST" class="eligibility-form-compact">
                            <!-- Blood Type and Units -->
                            <div class="form-group-inline">
                                <label for="bloodType">Blood Type Required *</label>
                                <select id="bloodType" name="bloodType" class="form-control-mini" required>
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

                            <div class="form-group-inline">
                                <label for="unitsRequested">Units Required *</label>
                                <select id="unitsRequested" name="unitsRequested" class="form-control-mini" required>
                                    <option value="">Select Units</option>
                                    <?php for ($i = 1; $i <= 10; $i++): ?>
                                        <option value="<?php echo $i; ?>" <?php echo (($_POST['unitsRequested'] ?? '') == $i) ? 'selected' : ''; ?>><?php echo $i; ?> Unit<?php echo $i > 1 ? 's' : ''; ?></option>
                                    <?php endfor; ?>
                                </select>
                            </div>

                            <!-- Priority Level -->
                            <div class="form-group-inline">
                                <label>Priority Level *</label>
                                <div class="radio-group-horizontal">
                                    <div class="radio-item-compact">
                                        <input type="radio" id="routine" name="priority" value="routine" <?php echo (($_POST['priority'] ?? '') == 'routine') ? 'checked' : ''; ?> required>
                                        <label for="routine">Routine</label>
                                    </div>
                                    <div class="radio-item-compact">
                                        <input type="radio" id="urgent" name="priority" value="urgent" <?php echo (($_POST['priority'] ?? '') == 'urgent') ? 'checked' : ''; ?> required>
                                        <label for="urgent">Urgent</label>
                                    </div>
                                    <div class="radio-item-compact">
                                        <input type="radio" id="emergency" name="priority" value="emergency" <?php echo (($_POST['priority'] ?? '') == 'emergency') ? 'checked' : ''; ?> required>
                                        <label for="emergency">Emergency</label>
                                    </div>
                                </div>
                            </div>

                            <!-- Hospital Selection -->
                            <div class="form-group-inline">
                                <label for="hospitalId">Preferred Hospital</label>
                                <select id="hospitalId" name="hospitalId" class="form-control-mini">
                                    <option value="">Select Hospital (Optional)</option>
                                    <?php foreach ($hospitals as $hospital): ?>
                                        <option value="<?php echo $hospital['id']; ?>" <?php echo (($_POST['hospitalId'] ?? '') == $hospital['id']) ? 'selected' : ''; ?>>
                                            <?php echo htmlspecialchars($hospital['hospital_name']); ?> - <?php echo htmlspecialchars($hospital['city']); ?>, <?php echo htmlspecialchars($hospital['state']); ?>
                                        </option>
                                    <?php endforeach; ?>
                                </select>
                            </div>

                            <!-- Medical Reason -->
                            <div class="form-group-inline">
                                <label for="medicalReason">Medical Reason *</label>
                                <textarea id="medicalReason" name="medicalReason" class="form-control-mini" rows="3" placeholder="Please describe the medical condition requiring blood transfusion..." required><?php echo htmlspecialchars($_POST['medicalReason'] ?? ''); ?></textarea>
                            </div>

                            <!-- Contact Information -->
                            <div class="form-group-inline">
                                <label for="doctorContact">Doctor/Hospital Contact</label>
                                <input type="text" id="doctorContact" name="doctorContact" class="form-control-mini" placeholder="Doctor name and contact number" value="<?php echo htmlspecialchars($_POST['doctorContact'] ?? ''); ?>">
                            </div>

                            <div class="form-group-inline">
                                <label for="emergencyContact">Emergency Contact *</label>
                                <input type="text" id="emergencyContact" name="emergencyContact" class="form-control-mini" placeholder="Emergency contact name and phone" value="<?php echo htmlspecialchars($_POST['emergencyContact'] ?? ''); ?>" required>
                            </div>

                            <button type="submit" name="submit_request" class="btn btn-primary btn-block">
                                <i class="fas fa-paper-plane"></i>
                                Submit Blood Request
                            </button>
                        </form>
                    <?php else: ?>
                        <div class="alert alert-info">
                            <i class="fas fa-info-circle"></i>
                            Please <a href="auth/login.php">login</a> or <a href="auth/register-patient.php">register as a patient</a> to submit a blood request.
                        </div>
                    <?php endif; ?>
                </div>

                <!-- Blood Availability -->
                <div class="content-section">
                    <h2><i class="fas fa-chart-bar"></i> Current Blood Availability</h2>
                    
                    <div class="blood-grid-compact">
                        <?php foreach ($blood_availability as $blood): ?>
                            <?php
                            $status = 'available';
                            if ($blood['total_units'] < 20) $status = 'low';
                            if ($blood['total_units'] < 10) $status = 'critical';
                            ?>
                            <div class="blood-item">
                                <div class="blood-type"><?php echo htmlspecialchars($blood['blood_type']); ?></div>
                                <div class="blood-count"><?php echo $blood['total_units']; ?></div>
                                <div class="blood-status <?php echo $status; ?>">
                                    <?php echo ucfirst($status); ?>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    </div>

                    <div class="help-mini">
                        <h3><i class="fas fa-question-circle"></i> Need Help?</h3>
                        <div class="help-contact">
                            <i class="fas fa-phone"></i>
                            Emergency Hotline: +1-800-BLOOD-NOW
                        </div>
                        <div class="help-contact">
                            <i class="fas fa-envelope"></i>
                            Email: emergency@bloodconnect.com
                        </div>
                        <div class="help-contact">
                            <i class="fas fa-clock"></i>
                            Available 24/7 for emergencies
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Process Requirements -->
    <section class="process-requirements-horizontal">
        <div class="container">
            <h2 class="text-center mb-8"><i class="fas fa-list-check"></i> Request Process</h2>
            
            <div class="process-steps-mini">
                <div class="process-step-mini">
                    <div class="step-number-mini">1</div>
                    <div class="step-content-mini">
                        <h4>Submit Request</h4>
                        <p>Fill out the blood request form with medical details</p>
                    </div>
                </div>
                <div class="process-step-mini">
                    <div class="step-number-mini">2</div>
                    <div class="step-content-mini">
                        <h4>Verification</h4>
                        <p>Medical team verifies the request and urgency</p>
                    </div>
                </div>
                <div class="process-step-mini">
                    <div class="step-number-mini">3</div>
                    <div class="step-content-mini">
                        <h4>Matching</h4>
                        <p>System finds compatible donors and hospitals</p>
                    </div>
                </div>
                <div class="process-step-mini">
                    <div class="step-number-mini">4</div>
                    <div class="step-content-mini">
                        <h4>Notification</h4>
                        <p>You receive confirmation and next steps</p>
                    </div>
                </div>
            </div>

            <div class="requirements-mini">
                <div class="requirement-item">
                    <i class="fas fa-id-card"></i>
                    <div>
                        <h4>Valid Medical Documentation</h4>
                        <p>Doctor's prescription or medical certificate may be required for verification</p>
                    </div>
                </div>
                <div class="requirement-item">
                    <i class="fas fa-hospital"></i>
                    <div>
                        <h4>Hospital Coordination</h4>
                        <p>Requests are coordinated with registered hospitals and blood banks</p>
                    </div>
                </div>
                <div class="requirement-item">
                    <i class="fas fa-clock"></i>
                    <div>
                        <h4>Response Time</h4>
                        <p>Emergency requests: 1-2 hours, Urgent: 4-6 hours, Routine: 24-48 hours</p>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
        <div class="container">
            <div class="footer-content">
                <div class="footer-section">
                    <div class="footer-brand">
                        <i class="fas fa-tint"></i>
                        <span>BloodConnect</span>
                    </div>
                    <p>Connecting donors, patients, and hospitals to save lives through efficient blood donation management.</p>
                    <div class="social-links">
                        <a href="#"><i class="fab fa-facebook"></i></a>
                        <a href="#"><i class="fab fa-twitter"></i></a>
                        <a href="#"><i class="fab fa-instagram"></i></a>
                        <a href="#"><i class="fab fa-linkedin"></i></a>
                    </div>
                </div>
                
                <div class="footer-section">
                    <h3>Quick Links</h3>
                    <ul>
                        <li><a href="index.php">Home</a></li>
                        <li><a href="about.php">About Us</a></li>
                        <li><a href="services.php">Services</a></li>
                        <li><a href="become-donor.php">Become a Donor</a></li>
                        <li><a href="request-blood.php">Request Blood</a></li>
                    </ul>
                </div>
                
                <div class="footer-section">
                    <h3>Support</h3>
                    <ul>
                        <li><a href="contact.php">Contact Us</a></li>
                        <li><a href="#">Help Center</a></li>
                        <li><a href="#">Privacy Policy</a></li>
                        <li><a href="#">Terms of Service</a></li>
                    </ul>
                </div>
                
                <div class="footer-section">
                    <h3>Emergency Contact</h3>
                    <div class="emergency-contact">
                        <p><i class="fas fa-phone"></i> +1-800-BLOOD-NOW</p>
                        <p><i class="fas fa-envelope"></i> emergency@bloodconnect.com</p>
                        <p><i class="fas fa-clock"></i> 24/7 Emergency Support</p>
                    </div>
                </div>
            </div>
            
            <div class="footer-bottom">
                <p>&copy; 2024 BloodConnect. All rights reserved. | Saving lives, one donation at a time.</p>
            </div>
        </div>
    </footer>

    <script src="js/main.js"></script>
</body>
</html>