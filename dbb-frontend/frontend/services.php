<?php
session_start();
require_once '../backend/config/database.php';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Our Services - BloodConnect</title>
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
                <a href="services.php" class="nav-link active">Services</a>
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
    <section class="services-hero">
        <div class="container">
            <div class="hero-content">
                <h1>Our Services</h1>
                <p>Comprehensive blood donation and management solutions</p>
            </div>
        </div>
    </section>

    <!-- Main Services Section -->
    <section class="main-services-section">
        <div class="container">
            <div class="section-header">
                <h2>What We Offer</h2>
                <p>Complete blood donation ecosystem for all stakeholders</p>
            </div>
            <div class="services-grid">
                <div class="service-card featured">
                    <div class="service-icon">
                        <i class="fas fa-heart"></i>
                    </div>
                    <h3>Blood Donation Management</h3>
                    <p>Complete platform for donors to schedule, track, and manage their blood donations with ease.</p>
                    <ul class="service-features">
                        <li><i class="fas fa-check"></i> Easy donation scheduling</li>
                        <li><i class="fas fa-check"></i> Donation history tracking</li>
                        <li><i class="fas fa-check"></i> Eligibility checking</li>
                        <li><i class="fas fa-check"></i> Reminder notifications</li>
                    </ul>
                    <a href="become-donor.php" class="service-btn">Become a Donor</a>
                </div>

                <div class="service-card featured">
                    <div class="service-icon">
                        <i class="fas fa-search"></i>
                    </div>
                    <h3>Blood Availability Search</h3>
                    <p>Real-time search system to find available blood units at nearby hospitals and blood banks.</p>
                    <ul class="service-features">
                        <li><i class="fas fa-check"></i> Real-time availability</li>
                        <li><i class="fas fa-check"></i> Location-based search</li>
                        <li><i class="fas fa-check"></i> Blood type matching</li>
                        <li><i class="fas fa-check"></i> Hospital contact info</li>
                    </ul>
                    <a href="request-blood.php" class="service-btn">Search Blood</a>
                </div>

                <div class="service-card featured">
                    <div class="service-icon">
                        <i class="fas fa-hospital"></i>
                    </div>
                    <h3>Hospital Management System</h3>
                    <p>Comprehensive tools for hospitals to manage blood inventory, requests, and donor coordination.</p>
                    <ul class="service-features">
                        <li><i class="fas fa-check"></i> Inventory management</li>
                        <li><i class="fas fa-check"></i> Request processing</li>
                        <li><i class="fas fa-check"></i> Donor coordination</li>
                        <li><i class="fas fa-check"></i> Reporting tools</li>
                    </ul>
                    <a href="auth/register-hospital.php" class="service-btn">Register Hospital</a>
                </div>
            </div>
        </div>
    </section>

    <!-- Detailed Services Section -->
    <section class="detailed-services-section">
        <div class="container">
            <div class="section-header">
                <h2>Detailed Service Features</h2>
                <p>Everything you need for efficient blood donation management</p>
            </div>
            
            <!-- For Donors -->
            <div class="service-category">
                <div class="category-header">
                    <div class="category-icon">
                        <i class="fas fa-heart"></i>
                    </div>
                    <div class="category-info">
                        <h3>For Blood Donors</h3>
                        <p>Comprehensive tools and features for blood donors</p>
                    </div>
                </div>
                <div class="features-grid">
                    <div class="feature-item">
                        <i class="fas fa-calendar-check"></i>
                        <h4>Donation Scheduling</h4>
                        <p>Book appointments at convenient times and locations</p>
                    </div>
                    <div class="feature-item">
                        <i class="fas fa-history"></i>
                        <h4>Donation History</h4>
                        <p>Track all your past donations and their impact</p>
                    </div>
                    <div class="feature-item">
                        <i class="fas fa-user-check"></i>
                        <h4>Eligibility Tracking</h4>
                        <p>Automatic eligibility checking and next donation dates</p>
                    </div>
                    <div class="feature-item">
                        <i class="fas fa-bell"></i>
                        <h4>Smart Notifications</h4>
                        <p>Get notified when your blood type is needed</p>
                    </div>
                    <div class="feature-item">
                        <i class="fas fa-award"></i>
                        <h4>Impact Tracking</h4>
                        <p>See how many lives you've helped save</p>
                    </div>
                    <div class="feature-item">
                        <i class="fas fa-mobile-alt"></i>
                        <h4>Mobile Access</h4>
                        <p>Access your donor dashboard from anywhere</p>
                    </div>
                </div>
            </div>

            <!-- For Patients -->
            <div class="service-category">
                <div class="category-header">
                    <div class="category-icon">
                        <i class="fas fa-user-injured"></i>
                    </div>
                    <div class="category-info">
                        <h3>For Patients</h3>
                        <p>Quick and efficient blood request services</p>
                    </div>
                </div>
                <div class="features-grid">
                    <div class="feature-item">
                        <i class="fas fa-search-location"></i>
                        <h4>Blood Search</h4>
                        <p>Find available blood units at nearby hospitals</p>
                    </div>
                    <div class="feature-item">
                        <i class="fas fa-hand-holding-medical"></i>
                        <h4>Request Submission</h4>
                        <p>Submit blood requests with priority levels</p>
                    </div>
                    <div class="feature-item">
                        <i class="fas fa-chart-line"></i>
                        <h4>Status Tracking</h4>
                        <p>Real-time tracking of your blood requests</p>
                    </div>
                    <div class="feature-item">
                        <i class="fas fa-phone"></i>
                        <h4>Hospital Contact</h4>
                        <p>Direct communication with hospitals</p>
                    </div>
                    <div class="feature-item">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h4>Emergency Requests</h4>
                        <p>Priority handling for urgent blood needs</p>
                    </div>
                    <div class="feature-item">
                        <i class="fas fa-file-medical"></i>
                        <h4>Medical Records</h4>
                        <p>Secure storage of medical information</p>
                    </div>
                </div>
            </div>

            <!-- For Hospitals -->
            <div class="service-category">
                <div class="category-header">
                    <div class="category-icon">
                        <i class="fas fa-hospital"></i>
                    </div>
                    <div class="category-info">
                        <h3>For Hospitals</h3>
                        <p>Complete blood bank management solutions</p>
                    </div>
                </div>
                <div class="features-grid">
                    <div class="feature-item">
                        <i class="fas fa-boxes"></i>
                        <h4>Inventory Management</h4>
                        <p>Real-time blood inventory tracking and alerts</p>
                    </div>
                    <div class="feature-item">
                        <i class="fas fa-clipboard-list"></i>
                        <h4>Request Management</h4>
                        <p>Efficient processing of blood requests</p>
                    </div>
                    <div class="feature-item">
                        <i class="fas fa-users-cog"></i>
                        <h4>Donor Coordination</h4>
                        <p>Coordinate with donors for scheduled donations</p>
                    </div>
                    <div class="feature-item">
                        <i class="fas fa-chart-bar"></i>
                        <h4>Analytics & Reports</h4>
                        <p>Comprehensive reporting and analytics tools</p>
                    </div>
                    <div class="feature-item">
                        <i class="fas fa-shield-alt"></i>
                        <h4>Quality Control</h4>
                        <p>Blood quality tracking and safety protocols</p>
                    </div>
                    <div class="feature-item">
                        <i class="fas fa-network-wired"></i>
                        <h4>Network Integration</h4>
                        <p>Connect with other hospitals and blood banks</p>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Technology Section -->
    <section class="technology-section">
        <div class="container">
            <div class="section-header">
                <h2>Advanced Technology</h2>
                <p>Cutting-edge features that make blood donation efficient and safe</p>
            </div>
            <div class="tech-features">
                <div class="tech-feature">
                    <div class="tech-icon">
                        <i class="fas fa-shield-alt"></i>
                    </div>
                    <h3>Secure & Private</h3>
                    <p>End-to-end encryption and HIPAA-compliant data protection ensure your medical information stays private and secure.</p>
                </div>
                <div class="tech-feature">
                    <div class="tech-icon">
                        <i class="fas fa-mobile-alt"></i>
                    </div>
                    <h3>Mobile Optimized</h3>
                    <p>Fully responsive design works seamlessly on all devices - desktop, tablet, and mobile phones.</p>
                </div>
                <div class="tech-feature">
                    <div class="tech-icon">
                        <i class="fas fa-sync-alt"></i>
                    </div>
                    <h3>Real-Time Updates</h3>
                    <p>Live synchronization ensures all stakeholders have access to the most current information at all times.</p>
                </div>
                <div class="tech-feature">
                    <div class="tech-icon">
                        <i class="fas fa-cloud"></i>
                    </div>
                    <h3>Cloud-Based</h3>
                    <p>Reliable cloud infrastructure ensures 99.9% uptime and seamless access from anywhere in the world.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- CTA Section -->
    <section class="cta-section">
        <div class="container">
            <div class="cta-content">
                <h2>Ready to Get Started?</h2>
                <p>Join thousands of users who trust BloodConnect for their blood donation needs</p>
                <div class="cta-buttons">
                    <a href="auth/register-patient.php" class="btn btn-primary btn-lg">
                        <i class="fas fa-user-plus"></i>
                        Register as Patient
                    </a>
                    <a href="auth/register-donor.php" class="btn btn-secondary btn-lg">
                        <i class="fas fa-heart"></i>
                        Register as Donor
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