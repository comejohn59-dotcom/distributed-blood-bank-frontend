<?php
session_start();
require_once '../../backend/config/database.php';

// Check if user is logged in and is a patient
if (!isset($_SESSION['user_id']) || $_SESSION['user_type'] !== 'patient') {
    header('Location: ../auth/login.php');
    exit();
}

// Get user and patient data
try {
    $stmt = $conn->prepare("
        SELECT u.*, p.patient_id, p.blood_type, p.date_of_birth, p.gender, p.weight, p.height,
               p.emergency_contact_name, p.emergency_contact_phone, p.known_allergies, p.medical_conditions
        FROM users u 
        JOIN patients p ON u.id = p.user_id 
        WHERE u.id = ?
    ");
    $stmt->execute([$_SESSION['user_id']]);
    $user_data = $stmt->fetch();
    
    if (!$user_data) {
        header('Location: ../auth/login.php');
        exit();
    }
} catch (PDOException $e) {
    die("Error loading user data: " . $e->getMessage());
}

// Handle blood request submission
if ($_POST && isset($_POST['submit_request'])) {
    $blood_type = $_POST['bloodType'];
    $units_requested = (int)$_POST['units'];
    $priority = $_POST['priority'];
    $hospital_id = (int)$_POST['hospital'];
    $medical_reason = trim($_POST['reason']);
    $doctor_contact = trim($_POST['doctorContact']);
    $emergency_contact = trim($_POST['emergencyContact']);
    
    try {
        $request_id = 'REQ-' . date('Y') . '-' . str_pad(rand(1, 999999), 6, '0', STR_PAD_LEFT);
        
        $stmt = $conn->prepare("
            INSERT INTO blood_requests (request_id, patient_id, hospital_id, blood_type, units_requested, 
                                      priority, medical_reason, doctor_contact, emergency_contact_name, 
                                      status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())
        ");
        $stmt->execute([
            $request_id,
            $user_data['id'],
            $hospital_id,
            $blood_type,
            $units_requested,
            $priority,
            $medical_reason,
            $doctor_contact,
            $emergency_contact
        ]);
        
        $success_message = "Blood request submitted successfully! Request ID: " . $request_id;
    } catch (PDOException $e) {
        $error_message = "Failed to submit request. Please try again.";
    }
}

// Get patient's blood requests
try {
    $requests_stmt = $conn->prepare("
        SELECT br.*, h.hospital_name, h.emergency_phone as hospital_phone
        FROM blood_requests br
        LEFT JOIN hospitals h ON br.hospital_id = h.id
        WHERE br.patient_id = ?
        ORDER BY br.created_at DESC
        LIMIT 10
    ");
    $requests_stmt->execute([$_SESSION['user_id']]);
    $blood_requests = $requests_stmt->fetchAll();
} catch (PDOException $e) {
    $blood_requests = [];
}

// Get nearby hospitals
try {
    $hospitals_stmt = $conn->prepare("
        SELECT h.id, h.hospital_name, h.hospital_type, h.emergency_services, h.is_24_7,
               u.phone, u.address, u.city
        FROM hospitals h
        JOIN users u ON h.user_id = u.id
        WHERE h.is_verified = 1 AND h.is_active = 1
        ORDER BY h.hospital_name
        LIMIT 10
    ");
    $hospitals_stmt->execute();
    $hospitals = $hospitals_stmt->fetchAll();
} catch (PDOException $e) {
    $hospitals = [];
}

// Handle blood search
$search_results = [];
if (isset($_GET['search_blood']) && !empty($_GET['blood_type'])) {
    $search_blood_type = $_GET['blood_type'];
    try {
        $search_stmt = $conn->prepare("
            SELECT h.id, h.hospital_name, h.hospital_type, h.emergency_services, h.is_24_7,
                   u.phone, u.address, u.city, bi.units_available,
                   CASE 
                       WHEN bi.units_available >= 20 THEN 'good'
                       WHEN bi.units_available >= 5 THEN 'low'
                       ELSE 'critical'
                   END as stock_status
            FROM hospitals h
            JOIN users u ON h.user_id = u.id
            JOIN blood_inventory bi ON h.id = bi.hospital_id
            WHERE h.is_verified = 1 AND h.is_active = 1 
                  AND bi.blood_type = ? AND bi.units_available > 0
            ORDER BY bi.units_available DESC
        ");
        $search_stmt->execute([$search_blood_type]);
        $search_results = $search_stmt->fetchAll();
    } catch (PDOException $e) {
        $search_results = [];
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Patient Dashboard - BloodConnect</title>
    <link rel="stylesheet" href="../css/style.css">
    <link rel="stylesheet" href="../css/dashboard.css">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</head>
<body class="dashboard-body">
    <!-- Dashboard Navigation -->
    <nav class="dashboard-nav">
        <div class="nav-brand">
            <i class="fas fa-tint"></i>
            <span>BloodConnect</span>
        </div>
        <div class="nav-user">
            <div class="user-info">
                <span class="user-name"><?php echo htmlspecialchars($user_data['first_name'] . ' ' . $user_data['last_name']); ?></span>
                <span class="user-role">Patient</span>
            </div>
            <div class="user-avatar">
                <i class="fas fa-user-injured"></i>
            </div>
            <div class="nav-actions">
                <button class="btn-icon" title="Notifications">
                    <i class="fas fa-bell"></i>
                    <span class="notification-badge"><?php echo count($blood_requests); ?></span>
                </button>
                <button class="btn-icon" title="Settings">
                    <i class="fas fa-cog"></i>
                </button>
                <a href="../auth/logout.php" class="btn-icon" title="Logout">
                    <i class="fas fa-sign-out-alt"></i>
                </a>
            </div>
        </div>
    </nav>

    <div class="dashboard-container">
        <!-- Sidebar -->
        <aside class="dashboard-sidebar">
            <div class="sidebar-menu">
                <div class="menu-section">
                    <h3>Dashboard</h3>
                    <a href="#overview" class="menu-item active">
                        <i class="fas fa-chart-pie"></i>
                        <span>Overview</span>
                    </a>
                </div>
                
                <div class="menu-section">
                    <h3>Blood Requests</h3>
                    <a href="#search" class="menu-item">
                        <i class="fas fa-search"></i>
                        <span>Search Blood</span>
                    </a>
                    <a href="#request" class="menu-item">
                        <i class="fas fa-plus-circle"></i>
                        <span>New Request</span>
                    </a>
                    <a href="#requests" class="menu-item">
                        <i class="fas fa-list"></i>
                        <span>My Requests</span>
                    </a>
                </div>
                
                <div class="menu-section">
                    <h3>Profile</h3>
                    <a href="#profile" class="menu-item">
                        <i class="fas fa-user"></i>
                        <span>My Profile</span>
                    </a>
                </div>
            </div>
        </aside>

        <!-- Main Content -->
        <main class="dashboard-main">
            <?php if (isset($success_message)): ?>
                <div class="alert alert-success">
                    <i class="fas fa-check-circle"></i>
                    <?php echo htmlspecialchars($success_message); ?>
                </div>
            <?php endif; ?>

            <?php if (isset($error_message)): ?>
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle"></i>
                    <?php echo htmlspecialchars($error_message); ?>
                </div>
            <?php endif; ?>

            <!-- Patient Profile Card -->
            <div class="patient-profile-card" id="overview">
                <div class="profile-header">
                    <div class="profile-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="profile-info">
                        <h2><?php echo htmlspecialchars($user_data['first_name'] . ' ' . $user_data['last_name']); ?></h2>
                        <p>Patient ID: <span class="patient-id"><?php echo htmlspecialchars($user_data['patient_id']); ?></span></p>
                        <div class="blood-group-highlight">
                            <i class="fas fa-tint"></i>
                            <span>Blood Type: <span class="blood-type"><?php echo htmlspecialchars($user_data['blood_type']); ?></span></span>
                        </div>
                    </div>
                    <div class="emergency-button">
                        <a href="#request" class="btn btn-danger btn-lg">
                            <i class="fas fa-exclamation-triangle"></i>
                            Emergency Request
                        </a>
                    </div>
                </div>
            </div>

            <!-- Blood Availability Search -->
            <div class="blood-search-section" id="search">
                <div class="card-header">
                    <h3>Search Blood Availability</h3>
                    <p>Find available blood units at nearby hospitals</p>
                </div>
                <div class="search-container">
                    <form class="search-form" method="GET">
                        <div class="form-row">
                            <div class="form-group">
                                <label>Blood Type Needed</label>
                                <select class="form-control" name="blood_type">
                                    <option value="">Select Blood Type</option>
                                    <option value="A+" <?php echo (($_GET['blood_type'] ?? '') == 'A+') ? 'selected' : ''; ?>>A+</option>
                                    <option value="A-" <?php echo (($_GET['blood_type'] ?? '') == 'A-') ? 'selected' : ''; ?>>A-</option>
                                    <option value="B+" <?php echo (($_GET['blood_type'] ?? '') == 'B+') ? 'selected' : ''; ?>>B+</option>
                                    <option value="B-" <?php echo (($_GET['blood_type'] ?? '') == 'B-') ? 'selected' : ''; ?>>B-</option>
                                    <option value="AB+" <?php echo (($_GET['blood_type'] ?? '') == 'AB+') ? 'selected' : ''; ?>>AB+</option>
                                    <option value="AB-" <?php echo (($_GET['blood_type'] ?? '') == 'AB-') ? 'selected' : ''; ?>>AB-</option>
                                    <option value="O+" <?php echo (($_GET['blood_type'] ?? '') == 'O+') ? 'selected' : ''; ?>>O+</option>
                                    <option value="O-" <?php echo (($_GET['blood_type'] ?? '') == 'O-') ? 'selected' : ''; ?>>O-</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <button type="submit" name="search_blood" class="btn btn-primary">
                                    <i class="fas fa-search"></i>
                                    Search
                                </button>
                            </div>
                        </div>
                    </form>
                    
                    <?php if (!empty($search_results)): ?>
                        <div class="search-results">
                            <h4>Search Results (<?php echo count($search_results); ?> hospitals found)</h4>
                            <div class="hospitals-grid">
                                <?php foreach ($search_results as $hospital): ?>
                                    <div class="hospital-result-card">
                                        <div class="hospital-header">
                                            <div class="hospital-info">
                                                <h4><?php echo htmlspecialchars($hospital['hospital_name']); ?></h4>
                                                <p><?php echo htmlspecialchars($hospital['hospital_type']); ?> • <?php echo htmlspecialchars($hospital['city']); ?></p>
                                                <div class="stock-info">
                                                    <span class="blood-type-badge"><?php echo htmlspecialchars($_GET['blood_type']); ?></span>
                                                    <span class="stock-count <?php echo $hospital['stock_status']; ?>"><?php echo $hospital['units_available']; ?> units</span>
                                                </div>
                                            </div>
                                            <div class="hospital-status <?php echo $hospital['stock_status']; ?>">
                                                <?php echo ucfirst($hospital['stock_status']); ?>
                                            </div>
                                        </div>
                                        <div class="hospital-details">
                                            <div class="detail-row">
                                                <i class="fas fa-phone"></i>
                                                <span><?php echo htmlspecialchars($hospital['phone'] ?? 'N/A'); ?></span>
                                            </div>
                                            <div class="detail-row">
                                                <i class="fas fa-clock"></i>
                                                <span><?php echo $hospital['is_24_7'] ? '24/7 Service' : 'Limited Hours'; ?></span>
                                            </div>
                                            <div class="detail-row">
                                                <i class="fas fa-ambulance"></i>
                                                <span><?php echo $hospital['emergency_services'] ? 'Emergency Services' : 'No Emergency'; ?></span>
                                            </div>
                                        </div>
                                        <div class="hospital-actions">
                                            <a href="#request" class="btn-sm primary">
                                                <i class="fas fa-hand-holding-medical"></i>
                                                Request Blood
                                            </a>
                                            <?php if ($hospital['phone']): ?>
                                                <a href="tel:<?php echo $hospital['phone']; ?>" class="btn-sm secondary">
                                                    <i class="fas fa-phone"></i>
                                                    Contact
                                                </a>
                                            <?php endif; ?>
                                        </div>
                                    </div>
                                <?php endforeach; ?>
                            </div>
                        </div>
                    <?php elseif (isset($_GET['search_blood'])): ?>
                        <div class="search-results">
                            <div class="no-results">
                                <i class="fas fa-search"></i>
                                <h4>No Results Found</h4>
                                <p>No hospitals found with the requested blood type.</p>
                            </div>
                        </div>
                    <?php endif; ?>
                </div>
            </div>

            <!-- Quick Request Form -->
            <div class="quick-request-section" id="request">
                <div class="card-header">
                    <h3>Quick Blood Request</h3>
                    <p>Submit a blood request quickly and easily</p>
                </div>
                <div class="request-form-container">
                    <form class="quick-request-form" method="POST">
                        <div class="form-row">
                            <div class="form-group">
                                <label>Blood Type Needed</label>
                                <select class="form-control" name="bloodType" required>
                                    <option value="">Select Blood Type</option>
                                    <option value="A+" <?php echo ($user_data['blood_type'] == 'A+') ? 'selected' : ''; ?>>A+</option>
                                    <option value="A-" <?php echo ($user_data['blood_type'] == 'A-') ? 'selected' : ''; ?>>A-</option>
                                    <option value="B+" <?php echo ($user_data['blood_type'] == 'B+') ? 'selected' : ''; ?>>B+</option>
                                    <option value="B-" <?php echo ($user_data['blood_type'] == 'B-') ? 'selected' : ''; ?>>B-</option>
                                    <option value="AB+" <?php echo ($user_data['blood_type'] == 'AB+') ? 'selected' : ''; ?>>AB+</option>
                                    <option value="AB-" <?php echo ($user_data['blood_type'] == 'AB-') ? 'selected' : ''; ?>>AB-</option>
                                    <option value="O+" <?php echo ($user_data['blood_type'] == 'O+') ? 'selected' : ''; ?>>O+</option>
                                    <option value="O-" <?php echo ($user_data['blood_type'] == 'O-') ? 'selected' : ''; ?>>O-</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Units Required</label>
                                <select class="form-control" name="units" required>
                                    <option value="">Select Units</option>
                                    <option value="1">1 Unit</option>
                                    <option value="2">2 Units</option>
                                    <option value="3">3 Units</option>
                                    <option value="4">4 Units</option>
                                    <option value="5">5+ Units</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Priority Level</label>
                                <select class="form-control" name="priority" required>
                                    <option value="">Select Priority</option>
                                    <option value="routine">Routine</option>
                                    <option value="urgent">Urgent</option>
                                    <option value="emergency">Emergency</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Preferred Hospital</label>
                                <select class="form-control" name="hospital" required>
                                    <option value="">Select Hospital</option>
                                    <?php foreach ($hospitals as $hospital): ?>
                                        <option value="<?php echo $hospital['id']; ?>">
                                            <?php echo htmlspecialchars($hospital['hospital_name'] . ' - ' . $hospital['city']); ?>
                                        </option>
                                    <?php endforeach; ?>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Medical Reason</label>
                            <textarea class="form-control" name="reason" rows="3" placeholder="Describe the medical condition or reason for blood requirement..." required></textarea>
                        </div>
                        <div class="form-group">
                            <label>Doctor's Contact (Optional)</label>
                            <input type="text" class="form-control" name="doctorContact" placeholder="Doctor's name and contact information">
                        </div>
                        
                        <div class="form-group">
                            <label>Emergency Contact Person</label>
                            <input type="text" class="form-control" name="emergencyContact" placeholder="Name and phone number of emergency contact" value="<?php echo htmlspecialchars($user_data['emergency_contact_name'] . ' - ' . $user_data['emergency_contact_phone']); ?>" required>
                        </div>
                        <div class="form-actions">
                            <button type="submit" name="submit_request" class="btn btn-primary btn-lg">
                                <i class="fas fa-paper-plane"></i>
                                Submit Request
                            </button>
                            <button type="reset" class="btn btn-secondary">
                                <i class="fas fa-undo"></i>
                                Reset Form
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Request Status Tracking -->
            <div class="request-status-section" id="requests">
                <div class="card-header">
                    <h3>My Blood Requests</h3>
                    <span class="badge info"><?php echo count($blood_requests); ?> requests</span>
                </div>
                <div class="requests-timeline">
                    <?php if (empty($blood_requests)): ?>
                        <div class="no-requests">
                            <i class="fas fa-clipboard-list"></i>
                            <h4>No Blood Requests</h4>
                            <p>You haven't submitted any blood requests yet.</p>
                        </div>
                    <?php else: ?>
                        <?php foreach ($blood_requests as $request): ?>
                            <div class="request-item <?php echo $request['status']; ?>">
                                <div class="request-status-indicator <?php echo $request['status']; ?>">
                                    <i class="fas <?php echo ($request['status'] == 'pending') ? 'fa-clock' : (($request['status'] == 'approved') ? 'fa-check' : (($request['status'] == 'completed') ? 'fa-check-circle' : 'fa-times-circle')); ?>"></i>
                                </div>
                                <div class="request-details">
                                    <div class="request-header">
                                        <h4><?php echo htmlspecialchars($request['blood_type']); ?> Blood Request</h4>
                                        <span class="request-id">#<?php echo htmlspecialchars($request['request_id']); ?></span>
                                    </div>
                                    <div class="request-info">
                                        <p><strong>Units:</strong> <?php echo $request['units_requested']; ?> units</p>
                                        <p><strong>Priority:</strong> <?php echo ucfirst($request['priority']); ?></p>
                                        <p><strong>Hospital:</strong> <?php echo htmlspecialchars($request['hospital_name'] ?? 'Hospital'); ?></p>
                                        <p><strong>Submitted:</strong> <?php echo date('M j, Y g:i A', strtotime($request['created_at'])); ?></p>
                                        <p><strong>Status:</strong> <span class="status-badge <?php echo $request['status']; ?>"><?php echo ucfirst($request['status']); ?></span></p>
                                    </div>
                                </div>
                                <div class="request-actions">
                                    <?php if ($request['hospital_phone']): ?>
                                        <a href="tel:<?php echo $request['hospital_phone']; ?>" class="btn-sm secondary">
                                            <i class="fas fa-phone"></i>
                                            Contact Hospital
                                        </a>
                                    <?php endif; ?>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </div>
            </div>

            <!-- Profile Management -->
            <div class="profile-management-section" id="profile">
                <div class="card-header">
                    <h3>Profile Information</h3>
                </div>
                <div class="profile-info-grid">
                    <div class="profile-section">
                        <h4>Personal Information</h4>
                        <div class="profile-item">
                            <span class="label">Full Name:</span>
                            <span class="value"><?php echo htmlspecialchars($user_data['first_name'] . ' ' . $user_data['last_name']); ?></span>
                        </div>
                        <div class="profile-item">
                            <span class="label">Blood Type:</span>
                            <span class="value blood-type-badge"><?php echo htmlspecialchars($user_data['blood_type']); ?></span>
                        </div>
                        <div class="profile-item">
                            <span class="label">Date of Birth:</span>
                            <span class="value"><?php echo date('F j, Y', strtotime($user_data['date_of_birth'])); ?></span>
                        </div>
                        <div class="profile-item">
                            <span class="label">Gender:</span>
                            <span class="value"><?php echo ucfirst($user_data['gender']); ?></span>
                        </div>
                    </div>

                    <div class="profile-section">
                        <h4>Contact Information</h4>
                        <div class="profile-item">
                            <span class="label">Email:</span>
                            <span class="value"><?php echo htmlspecialchars($user_data['email']); ?></span>
                        </div>
                        <div class="profile-item">
                            <span class="label">Phone:</span>
                            <span class="value"><?php echo htmlspecialchars($user_data['phone'] ?? 'Not provided'); ?></span>
                        </div>
                        <div class="profile-item">
                            <span class="label">Address:</span>
                            <span class="value"><?php echo htmlspecialchars(($user_data['address'] ?? '') . ', ' . ($user_data['city'] ?? '') . ', ' . ($user_data['state'] ?? '')); ?></span>
                        </div>
                        <div class="profile-item">
                            <span class="label">Emergency Contact:</span>
                            <span class="value"><?php echo htmlspecialchars(($user_data['emergency_contact_name'] ?? '') . ' - ' . ($user_data['emergency_contact_phone'] ?? '')); ?></span>
                        </div>
                    </div>

                    <div class="profile-section">
                        <h4>Medical Information</h4>
                        <div class="profile-item">
                            <span class="label">Patient ID:</span>
                            <span class="value"><?php echo htmlspecialchars($user_data['patient_id']); ?></span>
                        </div>
                        <div class="profile-item">
                            <span class="label">Weight:</span>
                            <span class="value"><?php echo htmlspecialchars($user_data['weight'] ?? 'Not provided'); ?> kg</span>
                        </div>
                        <div class="profile-item">
                            <span class="label">Height:</span>
                            <span class="value"><?php echo htmlspecialchars($user_data['height'] ?? 'Not provided'); ?> cm</span>
                        </div>
                        <div class="profile-item">
                            <span class="label">Allergies:</span>
                            <span class="value"><?php echo htmlspecialchars($user_data['known_allergies'] ?? 'None reported'); ?></span>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>

    <script>
        // Simple navigation
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Remove active class from all items
                document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
                
                // Add active class to clicked item
                this.classList.add('active');
                
                // Get target section
                const target = this.getAttribute('href');
                if (target && target.startsWith('#')) {
                    const section = document.querySelector(target);
                    if (section) {
                        section.scrollIntoView({ behavior: 'smooth' });
                    }
                }
            });
        });
    </script>
</body>
</html>