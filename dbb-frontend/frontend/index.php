<?php
session_start();
require_once '../backend/config/database.php';

// Get some statistics for the homepage
try {
    $stats_stmt = $conn->prepare("
        SELECT 
            (SELECT COUNT(*) FROM users WHERE user_type = 'donor' AND is_active = 1) as donor_count,
            (SELECT COUNT(*) FROM users WHERE user_type = 'hospital' AND is_active = 1) as hospital_count,
            (SELECT COUNT(*) FROM blood_requests WHERE status = 'completed') as completed_requests,
            (SELECT SUM(units_available) FROM blood_inventory) as total_units
    ");
    $stats_stmt->execute();
    $stats = $stats_stmt->fetch();
} catch (PDOException $e) {
    $stats = [
        'donor_count' => 1000,
        'hospital_count' => 50,
        'completed_requests' => 5000,
        'total_units' => 10000
    ];
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BloodConnect - Save Lives Through Blood Donation</title>
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
                <a href="#home" class="nav-link active">Home</a>
                <a href="about.php" class="nav-link">About</a>
                <a href="services.php" class="nav-link">Services</a>
                <a href="contact.php" class="nav-link">Contact</a>
                <a href="become-donor.php" class="nav-link">Become a Donor</a>
                <a href="request-blood.php" class="nav-link">Request Blood</a>
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
    <section class="hero" id="home">
        <div class="hero-container">
            <div class="hero-content">
                <div class="hero-text">
                    <h1 class="hero-title">
                        Save Lives Through 
                        <span class="highlight">Blood Donation</span>
                    </h1>
                    <p class="hero-description">
                        Connect blood donors with those in need. Our platform makes it easy to donate blood, 
                        request blood, and manage blood inventory across hospitals and blood banks.
                    </p>
                    <div class="hero-buttons">
                        <a href="become-donor.php" class="btn btn-primary btn-lg">
                            <i class="fas fa-heart"></i>
                            Become a Donor
                        </a>
                        <a href="request-blood.php" class="btn btn-secondary btn-lg">
                            <i class="fas fa-hand-holding-medical"></i>
                            Request Blood
                        </a>
                    </div>
                </div>
                <div class="hero-image">
                    <div class="hero-card">
                        <div class="card-icon">
                            <i class="fas fa-tint"></i>
                        </div>
                        <h3>Blood Saves Lives</h3>
                        <p>Every donation can save up to 3 lives</p>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Stats Section -->
    <section class="stats-section">
        <div class="container">
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-users"></i>
                    </div>
                    <div class="stat-number"><?php echo number_format($stats['donor_count'] ?? 0); ?>+</div>
                    <div class="stat-label">Active Donors</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-hospital"></i>
                    </div>
                    <div class="stat-number"><?php echo number_format($stats['hospital_count'] ?? 0); ?>+</div>
                    <div class="stat-label">Partner Hospitals</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-heart"></i>
                    </div>
                    <div class="stat-number"><?php echo number_format($stats['completed_requests'] ?? 0); ?>+</div>
                    <div class="stat-label">Lives Saved</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-tint"></i>
                    </div>
                    <div class="stat-number"><?php echo number_format($stats['total_units'] ?? 0); ?>+</div>
                    <div class="stat-label">Blood Units Available</div>
                </div>
            </div>
        </div>
    </section>

    <!-- Features Section -->
    <section class="features-section">
        <div class="container">
            <div class="section-header">
                <h2>How BloodConnect Works</h2>
                <p>Our platform connects all stakeholders in the blood donation ecosystem</p>
            </div>
            <div class="features-grid">
                <div class="feature-card">
                    <div class="feature-icon">
                        <i class="fas fa-user-plus"></i>
                    </div>
                    <h3>Easy Registration</h3>
                    <p>Quick and simple registration process for donors, patients, and hospitals</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">
                        <i class="fas fa-search"></i>
                    </div>
                    <h3>Find Blood Quickly</h3>
                    <p>Search for available blood types at nearby hospitals and blood banks</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">
                        <i class="fas fa-calendar-check"></i>
                    </div>
                    <h3>Schedule Donations</h3>
                    <p>Book donation appointments at convenient times and locations</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">
                        <i class="fas fa-chart-line"></i>
                    </div>
                    <h3>Track Impact</h3>
                    <p>Monitor your donation history and see the lives you've helped save</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">
                        <i class="fas fa-bell"></i>
                    </div>
                    <h3>Smart Notifications</h3>
                    <p>Get notified when your blood type is needed in your area</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">
                        <i class="fas fa-shield-alt"></i>
                    </div>
                    <h3>Secure & Safe</h3>
                    <p>All data is encrypted and follows medical privacy standards</p>
                </div>
            </div>
        </div>
    </section>

    <!-- User Types Section -->
    <section class="user-types-section">
        <div class="container">
            <div class="section-header">
                <h2>Join Our Community</h2>
                <p>Choose your role and start making a difference today</p>
            </div>
            <div class="user-types-grid">
                <div class="user-type-card">
                    <div class="user-type-icon">
                        <i class="fas fa-heart"></i>
                    </div>
                    <h3>Blood Donors</h3>
                    <p>Donate blood regularly and help save lives in your community</p>
                    <ul class="user-type-features">
                        <li><i class="fas fa-check"></i> Schedule donations</li>
                        <li><i class="fas fa-check"></i> Track donation history</li>
                        <li><i class="fas fa-check"></i> Receive impact updates</li>
                        <li><i class="fas fa-check"></i> Get donation reminders</li>
                    </ul>
                    <a href="auth/register-donor.php" class="btn btn-primary">
                        <i class="fas fa-user-plus"></i>
                        Register as Donor
                    </a>
                </div>
                <div class="user-type-card">
                    <div class="user-type-icon">
                        <i class="fas fa-user-injured"></i>
                    </div>
                    <h3>Patients</h3>
                    <p>Request blood when needed and track your requests in real-time</p>
                    <ul class="user-type-features">
                        <li><i class="fas fa-check"></i> Search blood availability</li>
                        <li><i class="fas fa-check"></i> Submit urgent requests</li>
                        <li><i class="fas fa-check"></i> Track request status</li>
                        <li><i class="fas fa-check"></i> Contact hospitals directly</li>
                    </ul>
                    <a href="auth/register-patient.php" class="btn btn-primary">
                        <i class="fas fa-user-plus"></i>
                        Register as Patient
                    </a>
                </div>
                <div class="user-type-card">
                    <div class="user-type-icon">
                        <i class="fas fa-hospital"></i>
                    </div>
                    <h3>Hospitals</h3>
                    <p>Manage blood inventory and coordinate with donors and patients</p>
                    <ul class="user-type-features">
                        <li><i class="fas fa-check"></i> Manage blood inventory</li>
                        <li><i class="fas fa-check"></i> Handle blood requests</li>
                        <li><i class="fas fa-check"></i> Coordinate donations</li>
                        <li><i class="fas fa-check"></i> Generate reports</li>
                    </ul>
                    <a href="auth/register-hospital.php" class="btn btn-primary">
                        <i class="fas fa-user-plus"></i>
                        Register Hospital
                    </a>
                </div>
            </div>
        </div>
    </section>

    <!-- CTA Section -->
    <section class="cta-section">
        <div class="container">
            <div class="cta-content">
                <h2>Ready to Save Lives?</h2>
                <p>Join thousands of donors and help make a difference in your community</p>
                <div class="cta-buttons">
                    <a href="become-donor.php" class="btn btn-primary btn-lg">
                        <i class="fas fa-heart"></i>
                        Start Donating
                    </a>
                    <a href="request-blood.php" class="btn btn-secondary btn-lg">
                        <i class="fas fa-hand-holding-medical"></i>
                        Request Blood
                    </a>
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
                    <p>Connecting blood donors with those in need to save lives and build healthier communities.</p>
                    <div class="social-links">
                        <a href="#" class="social-link"><i class="fab fa-facebook"></i></a>
                        <a href="#" class="social-link"><i class="fab fa-twitter"></i></a>
                        <a href="#" class="social-link"><i class="fab fa-instagram"></i></a>
                        <a href="#" class="social-link"><i class="fab fa-linkedin"></i></a>
                    </div>
                </div>
                <div class="footer-section">
                    <h4>Quick Links</h4>
                    <ul class="footer-links">
                        <li><a href="about.php">About Us</a></li>
                        <li><a href="services.php">Services</a></li>
                        <li><a href="become-donor.php">Become a Donor</a></li>
                        <li><a href="request-blood.php">Request Blood</a></li>
                    </ul>
                </div>
                <div class="footer-section">
                    <h4>Support</h4>
                    <ul class="footer-links">
                        <li><a href="contact.php">Contact Us</a></li>
                        <li><a href="#">Help Center</a></li>
                        <li><a href="#">Privacy Policy</a></li>
                        <li><a href="#">Terms of Service</a></li>
                    </ul>
                </div>
                <div class="footer-section">
                    <h4>Contact Info</h4>
                    <div class="contact-info">
                        <div class="contact-item">
                            <i class="fas fa-phone"></i>
                            <span>+1 (555) 123-4567</span>
                        </div>
                        <div class="contact-item">
                            <i class="fas fa-envelope"></i>
                            <span>info@bloodconnect.com</span>
                        </div>
                        <div class="contact-item">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>123 Health St, Medical City</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; 2024 BloodConnect. All rights reserved.</p>
            </div>
        </div>
    </footer>

    <script src="js/main.js"></script>
</body>
</html>