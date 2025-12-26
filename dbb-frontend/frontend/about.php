<?php
session_start();
require_once '../backend/config/database.php';

// Get some statistics for the about page
try {
    $stats_stmt = $conn->prepare("
        SELECT 
            (SELECT COUNT(*) FROM users WHERE user_type = 'donor' AND is_active = 1) as donor_count,
            (SELECT COUNT(*) FROM users WHERE user_type = 'hospital' AND is_active = 1) as hospital_count,
            (SELECT COUNT(*) FROM blood_requests WHERE status = 'completed') as completed_requests,
            (SELECT COUNT(*) FROM users WHERE user_type = 'patient' AND is_active = 1) as patient_count
    ");
    $stats_stmt->execute();
    $stats = $stats_stmt->fetch();
} catch (PDOException $e) {
    $stats = [
        'donor_count' => 1000,
        'hospital_count' => 50,
        'completed_requests' => 5000,
        'patient_count' => 2000
    ];
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>About Us - BloodConnect</title>
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
                <a href="about.php" class="nav-link active">About</a>
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
    <section class="about-hero">
        <div class="container">
            <div class="hero-content">
                <h1>About BloodConnect</h1>
                <p>Connecting lives through the gift of blood donation</p>
            </div>
        </div>
    </section>

    <!-- Mission Section -->
    <section class="mission-section">
        <div class="container">
            <div class="section-header">
                <h2>Our Mission</h2>
                <p>Saving lives by connecting blood donors with those in need</p>
            </div>
            <div class="mission-content">
                <div class="mission-text">
                    <h3>Bridging the Gap Between Donors and Recipients</h3>
                    <p>BloodConnect is a comprehensive blood donation management system designed to streamline the process of blood donation and distribution. Our platform connects blood donors, patients, hospitals, and blood banks in a seamless network that saves lives.</p>
                    <p>We believe that every drop of blood donated has the potential to save up to three lives. Our mission is to make blood donation more accessible, efficient, and impactful for everyone involved.</p>
                    <div class="mission-features">
                        <div class="feature-item">
                            <i class="fas fa-heart"></i>
                            <span>Compassionate Care</span>
                        </div>
                        <div class="feature-item">
                            <i class="fas fa-shield-alt"></i>
                            <span>Safe & Secure</span>
                        </div>
                        <div class="feature-item">
                            <i class="fas fa-users"></i>
                            <span>Community Driven</span>
                        </div>
                        <div class="feature-item">
                            <i class="fas fa-clock"></i>
                            <span>24/7 Available</span>
                        </div>
                    </div>
                </div>
                <div class="mission-image">
                    <div class="image-placeholder">
                        <i class="fas fa-hands-helping"></i>
                        <h4>Saving Lives Together</h4>
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
                        <i class="fas fa-user-injured"></i>
                    </div>
                    <div class="stat-number"><?php echo number_format($stats['patient_count'] ?? 0); ?>+</div>
                    <div class="stat-label">Registered Patients</div>
                </div>
            </div>
        </div>
    </section>

    <!-- Values Section -->
    <section class="values-section">
        <div class="container">
            <div class="section-header">
                <h2>Our Core Values</h2>
                <p>The principles that guide everything we do</p>
            </div>
            <div class="values-grid">
                <div class="value-card">
                    <div class="value-icon">
                        <i class="fas fa-heart"></i>
                    </div>
                    <h3>Compassion</h3>
                    <p>We approach every interaction with empathy and understanding, recognizing the critical nature of blood donation.</p>
                </div>
                <div class="value-card">
                    <div class="value-icon">
                        <i class="fas fa-shield-alt"></i>
                    </div>
                    <h3>Safety</h3>
                    <p>Patient safety and donor well-being are our top priorities. We maintain the highest standards of medical safety.</p>
                </div>
                <div class="value-card">
                    <div class="value-icon">
                        <i class="fas fa-handshake"></i>
                    </div>
                    <h3>Trust</h3>
                    <p>We build trust through transparency, reliability, and consistent delivery of our promises to all stakeholders.</p>
                </div>
                <div class="value-card">
                    <div class="value-icon">
                        <i class="fas fa-rocket"></i>
                    </div>
                    <h3>Innovation</h3>
                    <p>We continuously improve our platform using the latest technology to make blood donation more efficient.</p>
                </div>
                <div class="value-card">
                    <div class="value-icon">
                        <i class="fas fa-users"></i>
                    </div>
                    <h3>Community</h3>
                    <p>We foster a strong community of donors, patients, and healthcare providers working together to save lives.</p>
                </div>
                <div class="value-card">
                    <div class="value-icon">
                        <i class="fas fa-balance-scale"></i>
                    </div>
                    <h3>Integrity</h3>
                    <p>We operate with the highest ethical standards and maintain complete transparency in all our operations.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Team Section -->
    <section class="team-section">
        <div class="container">
            <div class="section-header">
                <h2>How BloodConnect Works</h2>
                <p>Simple steps to save lives</p>
            </div>
            <div class="process-steps">
                <div class="step-card">
                    <div class="step-number">1</div>
                    <div class="step-content">
                        <h3>Register</h3>
                        <p>Sign up as a donor, patient, or hospital to join our life-saving network.</p>
                    </div>
                </div>
                <div class="step-card">
                    <div class="step-number">2</div>
                    <div class="step-content">
                        <h3>Connect</h3>
                        <p>Our platform matches donors with recipients based on blood type and location.</p>
                    </div>
                </div>
                <div class="step-card">
                    <div class="step-number">3</div>
                    <div class="step-content">
                        <h3>Donate</h3>
                        <p>Schedule and complete your donation at a convenient time and location.</p>
                    </div>
                </div>
                <div class="step-card">
                    <div class="step-number">4</div>
                    <div class="step-content">
                        <h3>Save Lives</h3>
                        <p>Your donation helps save up to three lives and makes a real difference.</p>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- CTA Section -->
    <section class="cta-section">
        <div class="container">
            <div class="cta-content">
                <h2>Ready to Make a Difference?</h2>
                <p>Join our community of life-savers and help us build a healthier world</p>
                <div class="cta-buttons">
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