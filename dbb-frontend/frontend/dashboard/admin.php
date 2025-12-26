<?php
session_start();
require_once '../../backend/config/database.php';

// Check if user is logged in and is an admin
if (!isset($_SESSION['user_id']) || $_SESSION['user_type'] !== 'admin') {
    header('Location: ../auth/login.php');
    exit();
}

// Get user data
try {
    $stmt = $conn->prepare("SELECT * FROM users WHERE id = ?");
    $stmt->execute([$_SESSION['user_id']]);
    $user_data = $stmt->fetch();
    
    if (!$user_data) {
        header('Location: ../auth/login.php');
        exit();
    }
} catch (PDOException $e) {
    die("Error loading user data: " . $e->getMessage());
}

// Handle hospital approval/rejection
if ($_POST && isset($_POST['action']) && isset($_POST['hospital_id'])) {
    $hospital_id = (int)$_POST['hospital_id'];
    $action = $_POST['action'];
    
    try {
        if ($action === 'approve') {
            $stmt = $conn->prepare("UPDATE hospitals SET is_verified = 1 WHERE id = ?");
            $stmt->execute([$hospital_id]);
            $success_message = "Hospital approved successfully!";
        } elseif ($action === 'reject') {
            $stmt = $conn->prepare("UPDATE hospitals SET is_verified = 0, is_active = 0 WHERE id = ?");
            $stmt->execute([$hospital_id]);
            $success_message = "Hospital rejected successfully!";
        }
    } catch (PDOException $e) {
        $error_message = "Failed to update hospital status.";
    }
}

// Get system statistics
try {
    $stats_stmt = $conn->prepare("
        SELECT 
            (SELECT COUNT(*) FROM users WHERE user_type = 'patient' AND is_active = 1) as patient_count,
            (SELECT COUNT(*) FROM users WHERE user_type = 'donor' AND is_active = 1) as donor_count,
            (SELECT COUNT(*) FROM users WHERE user_type = 'hospital' AND is_active = 1) as hospital_count,
            (SELECT COUNT(*) FROM hospitals WHERE is_verified = 1) as verified_hospitals,
            (SELECT COUNT(*) FROM blood_requests) as total_requests,
            (SELECT COUNT(*) FROM blood_requests WHERE status = 'completed') as completed_requests,
            (SELECT COUNT(*) FROM donation_offers) as total_offers,
            (SELECT COUNT(*) FROM donation_offers WHERE status = 'completed') as completed_offers
    ");
    $stats_stmt->execute();
    $stats = $stats_stmt->fetch();
} catch (PDOException $e) {
    $stats = [
        'patient_count' => 0,
        'donor_count' => 0,
        'hospital_count' => 0,
        'verified_hospitals' => 0,
        'total_requests' => 0,
        'completed_requests' => 0,
        'total_offers' => 0,
        'completed_offers' => 0
    ];
}

// Get pending hospital registrations
try {
    $pending_hospitals_stmt = $conn->prepare("
        SELECT h.*, u.first_name, u.last_name, u.email, u.phone, u.address, u.city, u.state, u.created_at
        FROM hospitals h
        JOIN users u ON h.user_id = u.id
        WHERE h.is_verified = 0 AND u.is_active = 1
        ORDER BY u.created_at DESC
    ");
    $pending_hospitals_stmt->execute();
    $pending_hospitals = $pending_hospitals_stmt->fetchAll();
} catch (PDOException $e) {
    $pending_hospitals = [];
}

// Get recent activities
try {
    $recent_users_stmt = $conn->prepare("
        SELECT u.*, 
               CASE 
                   WHEN u.user_type = 'patient' THEN p.patient_id
                   WHEN u.user_type = 'donor' THEN d.donor_id
                   WHEN u.user_type = 'hospital' THEN h.hospital_id
                   ELSE NULL
               END as type_id
        FROM users u
        LEFT JOIN patients p ON u.id = p.user_id AND u.user_type = 'patient'
        LEFT JOIN donors d ON u.id = d.user_id AND u.user_type = 'donor'
        LEFT JOIN hospitals h ON u.id = h.user_id AND u.user_type = 'hospital'
        WHERE u.user_type != 'admin'
        ORDER BY u.created_at DESC
        LIMIT 10
    ");
    $recent_users_stmt->execute();
    $recent_users = $recent_users_stmt->fetchAll();
} catch (PDOException $e) {
    $recent_users = [];
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard - BloodConnect</title>
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
                <span class="user-role">Administrator</span>
            </div>
            <div class="user-avatar">
                <i class="fas fa-user-shield"></i>
            </div>
            <div class="nav-actions">
                <button class="btn-icon" title="Notifications">
                    <i class="fas fa-bell"></i>
                    <span class="notification-badge"><?php echo count($pending_hospitals); ?></span>
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
                    <h3>Management</h3>
                    <a href="#hospitals" class="menu-item">
                        <i class="fas fa-hospital"></i>
                        <span>Hospital Approvals</span>
                    </a>
                    <a href="#users" class="menu-item">
                        <i class="fas fa-users"></i>
                        <span>User Management</span>
                    </a>
                    <a href="#reports" class="menu-item">
                        <i class="fas fa-chart-bar"></i>
                        <span>Reports</span>
                    </a>
                </div>
                
                <div class="menu-section">
                    <h3>System</h3>
                    <a href="#settings" class="menu-item">
                        <i class="fas fa-cogs"></i>
                        <span>Settings</span>
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

            <!-- System Overview -->
            <div class="admin-overview-section" id="overview">
                <div class="card-header">
                    <h3>System Overview</h3>
                    <p>BloodConnect system statistics and metrics</p>
                </div>
                
                <!-- Statistics Cards -->
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon patients">
                            <i class="fas fa-user-injured"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-number"><?php echo number_format($stats['patient_count'] ?? 0); ?></div>
                            <div class="stat-label">Registered Patients</div>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon donors">
                            <i class="fas fa-heart"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-number"><?php echo number_format($stats['donor_count'] ?? 0); ?></div>
                            <div class="stat-label">Active Donors</div>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon hospitals">
                            <i class="fas fa-hospital"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-number"><?php echo number_format($stats['verified_hospitals'] ?? 0); ?></div>
                            <div class="stat-label">Verified Hospitals</div>
                            <div class="stat-sub"><?php echo ($stats['hospital_count'] ?? 0) - ($stats['verified_hospitals'] ?? 0); ?> pending</div>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon requests">
                            <i class="fas fa-hand-holding-medical"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-number"><?php echo number_format($stats['completed_requests'] ?? 0); ?></div>
                            <div class="stat-label">Completed Requests</div>
                            <div class="stat-sub"><?php echo $stats['total_requests'] ?? 0; ?> total</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Hospital Approval Section -->
            <div class="hospital-approval-section" id="hospitals">
                <div class="card-header">
                    <h3>Hospital Approval Requests</h3>
                    <span class="badge warning"><?php echo count($pending_hospitals); ?> pending</span>
                </div>
                
                <?php if (empty($pending_hospitals)): ?>
                    <div class="no-pending">
                        <i class="fas fa-check-circle"></i>
                        <h4>No Pending Approvals</h4>
                        <p>All hospital registrations have been processed.</p>
                    </div>
                <?php else: ?>
                    <div class="hospitals-grid">
                        <?php foreach ($pending_hospitals as $hospital): ?>
                            <div class="hospital-approval-card">
                                <div class="hospital-header">
                                    <div class="hospital-info">
                                        <h4><?php echo htmlspecialchars($hospital['hospital_name']); ?></h4>
                                        <p><?php echo htmlspecialchars($hospital['hospital_type']); ?> Hospital</p>
                                        <div class="hospital-id">ID: <?php echo htmlspecialchars($hospital['hospital_id']); ?></div>
                                    </div>
                                    <div class="hospital-status pending">
                                        <span>Pending Approval</span>
                                    </div>
                                </div>
                                
                                <div class="hospital-details">
                                    <div class="detail-section">
                                        <h5>Contact Person</h5>
                                        <p><strong><?php echo htmlspecialchars($hospital['first_name'] . ' ' . $hospital['last_name']); ?></strong></p>
                                        <p><i class="fas fa-envelope"></i> <?php echo htmlspecialchars($hospital['email']); ?></p>
                                        <p><i class="fas fa-phone"></i> <?php echo htmlspecialchars($hospital['phone']); ?></p>
                                    </div>
                                    
                                    <div class="detail-section">
                                        <h5>Hospital Details</h5>
                                        <p><strong>License:</strong> <?php echo htmlspecialchars($hospital['license_number']); ?></p>
                                        <p><strong>Type:</strong> <?php echo ucfirst($hospital['hospital_type']); ?></p>
                                        <p><strong>Beds:</strong> <?php echo $hospital['bed_capacity'] ?? 'Not specified'; ?></p>
                                        <p><strong>Blood Bank:</strong> <?php echo $hospital['has_blood_bank'] ? 'Yes' : 'No'; ?></p>
                                    </div>
                                    
                                    <div class="detail-section">
                                        <h5>Location</h5>
                                        <p><?php echo htmlspecialchars($hospital['address']); ?></p>
                                        <p><?php echo htmlspecialchars($hospital['city'] . ', ' . $hospital['state']); ?></p>
                                    </div>
                                    
                                    <div class="detail-section">
                                        <h5>Registration Date</h5>
                                        <p><?php echo date('F j, Y g:i A', strtotime($hospital['created_at'])); ?></p>
                                    </div>
                                </div>
                                
                                <div class="hospital-actions">
                                    <form method="POST" style="display: inline;">
                                        <input type="hidden" name="hospital_id" value="<?php echo $hospital['id']; ?>">
                                        <button type="submit" name="action" value="approve" class="btn btn-success">
                                            <i class="fas fa-check"></i>
                                            Approve
                                        </button>
                                    </form>
                                    <form method="POST" style="display: inline;">
                                        <input type="hidden" name="hospital_id" value="<?php echo $hospital['id']; ?>">
                                        <button type="submit" name="action" value="reject" class="btn btn-danger" onclick="return confirm('Are you sure you want to reject this hospital?')">
                                            <i class="fas fa-times"></i>
                                            Reject
                                        </button>
                                    </form>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    </div>
                <?php endif; ?>
            </div>

            <!-- User Management Section -->
            <div class="user-management-section" id="users">
                <div class="card-header">
                    <h3>Recent User Registrations</h3>
                    <p>Latest users who joined the system</p>
                </div>
                
                <div class="users-table">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Type</th>
                                <th>ID</th>
                                <th>Email</th>
                                <th>Registered</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($recent_users as $user): ?>
                                <tr>
                                    <td>
                                        <div class="user-info">
                                            <div class="user-avatar-small">
                                                <i class="fas <?php echo ($user['user_type'] == 'patient') ? 'fa-user-injured' : (($user['user_type'] == 'donor') ? 'fa-heart' : 'fa-hospital'); ?>"></i>
                                            </div>
                                            <div>
                                                <strong><?php echo htmlspecialchars($user['first_name'] . ' ' . $user['last_name']); ?></strong>
                                            </div>
                                        </div>
                                    </td>
                                    <td><span class="user-type-badge <?php echo $user['user_type']; ?>"><?php echo ucfirst($user['user_type']); ?></span></td>
                                    <td><?php echo htmlspecialchars($user['type_id'] ?? 'N/A'); ?></td>
                                    <td><?php echo htmlspecialchars($user['email']); ?></td>
                                    <td><?php echo date('M j, Y', strtotime($user['created_at'])); ?></td>
                                    <td>
                                        <span class="status-badge <?php echo $user['is_active'] ? 'active' : 'inactive'; ?>">
                                            <?php echo $user['is_active'] ? 'Active' : 'Inactive'; ?>
                                        </span>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Reports Section -->
            <div class="reports-section" id="reports">
                <div class="card-header">
                    <h3>System Reports</h3>
                    <p>Key metrics and performance indicators</p>
                </div>
                
                <div class="reports-grid">
                    <div class="report-card">
                        <div class="report-header">
                            <h4>Blood Requests</h4>
                            <i class="fas fa-hand-holding-medical"></i>
                        </div>
                        <div class="report-stats">
                            <div class="report-number"><?php echo $stats['total_requests']; ?></div>
                            <div class="report-label">Total Requests</div>
                            <div class="report-progress">
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: <?php echo $stats['total_requests'] > 0 ? ($stats['completed_requests'] / $stats['total_requests'] * 100) : 0; ?>%"></div>
                                </div>
                                <span><?php echo $stats['completed_requests']; ?> completed</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="report-card">
                        <div class="report-header">
                            <h4>Donation Offers</h4>
                            <i class="fas fa-heart"></i>
                        </div>
                        <div class="report-stats">
                            <div class="report-number"><?php echo $stats['total_offers']; ?></div>
                            <div class="report-label">Total Offers</div>
                            <div class="report-progress">
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: <?php echo $stats['total_offers'] > 0 ? ($stats['completed_offers'] / $stats['total_offers'] * 100) : 0; ?>%"></div>
                                </div>
                                <span><?php echo $stats['completed_offers']; ?> completed</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="report-card">
                        <div class="report-header">
                            <h4>Hospital Network</h4>
                            <i class="fas fa-hospital"></i>
                        </div>
                        <div class="report-stats">
                            <div class="report-number"><?php echo $stats['hospital_count']; ?></div>
                            <div class="report-label">Total Hospitals</div>
                            <div class="report-progress">
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: <?php echo $stats['hospital_count'] > 0 ? ($stats['verified_hospitals'] / $stats['hospital_count'] * 100) : 0; ?>%"></div>
                                </div>
                                <span><?php echo $stats['verified_hospitals']; ?> verified</span>
                            </div>
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