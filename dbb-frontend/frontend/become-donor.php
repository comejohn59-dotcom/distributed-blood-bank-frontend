<?php
session_start();
require_once '../backend/config/database.php';

// Get donor statistics
try {
    $stats_stmt = $conn->prepare("
        SELECT 
            (SELECT COUNT(*) FROM users WHERE user_type = 'donor' AND is_active = 1) as donor_count,
            (SELECT COUNT(*) FROM donation_offers WHERE status = 'completed') as completed_donations,
            (SELECT COUNT(*) FROM blood_requests WHERE status = 'completed') as lives_saved
    ");
    $stats_stmt->execute();
    $stats = $stats_stmt->fetch();
} catch (PDOException $e) {
    $stats = [
        'donor_count' => 1000,
        'completed_donations' => 2500,
        'lives_saved' => 7500
    ];
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Become a Donor - BloodConnect</title>
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
                <a href="become-donor.php" class="nav-link active">Become a Donor</a>
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
    <section class="donor-hero">
        <div class="container">
            <div class="hero-content">
                <div class="hero-text">
                    <h1>Become a Life Saver</h1>
                    <p>Join thousands of heroes who donate blood regularly and help save lives in their community. Your donation can save up to 3 lives!</p>
                    <div class="hero-stats">
                        <div class="stat-item">
                            <div class="stat-number"><?php echo number_format($stats['donor_count'] ?? 0); ?>+</div>
                            <div class="stat-label">Active Donors</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-number"><?php echo number_format($stats['completed_donations'] ?? 0); ?>+</div>
                            <div class="stat-label">Donations Made</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-number"><?php echo number_format($stats['lives_saved'] ?? 0); ?>+</div>
                            <div class="stat-label">Lives Saved</div>
                        </div>
                    </div>
                    <div class="hero-buttons">
                        <a href="auth/register-donor.php" class="btn btn-primary btn-lg">
                            <i class="fas fa-heart"></i>
                            Register as Donor
                        </a>
                        <a href="#eligibility" class="btn btn-secondary btn-lg">
                            <i class="fas fa-info-circle"></i>
                            Check Eligibility
                        </a>
                    </div>
                </div>
                <div class="hero-image">
                    <div class="donor-card">
                        <div class="card-icon">
                            <i class="fas fa-heart"></i>
                        </div>
                        <h3>Every Drop Counts</h3>
                        <p>One donation can save up to 3 lives</p>
                        <div class="impact-visual">
                            <div class="life-icon"><i class="fas fa-user"></i></div>
                            <div class="life-icon"><i class="fas fa-user"></i></div>
                            <div class="life-icon"><i class="fas fa-user"></i></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Why Donate Section -->
    <section class="why-donate-section">
        <div class="container">
            <div class="section-header">
                <h2>Why Donate Blood?</h2>
                <p>Your donation makes a real difference in people's lives</p>
            </div>
            <div class="reasons-grid">
                <div class="reason-card">
                    <div class="reason-icon">
                        <i class="fas fa-heart"></i>
                    </div>
                    <h3>Save Lives</h3>
                    <p>Every blood donation has the potential to save up to three lives. You become a hero to someone in need.</p>
                </div>
                <div class="reason-card">
                    <div class="reason-icon">
                        <i class="fas fa-users"></i>
                    </div>
                    <h3>Help Your Community</h3>
                    <p>Blood donations stay local and help patients in your own community, including friends and family.</p>
                </div>
                <div class="reason-card">
                    <div class="reason-icon">
                        <i class="fas fa-user-md"></i>
                    </div>
                    <h3>Free Health Check</h3>
                    <p>Get a mini health screening including blood pressure, pulse, temperature, and hemoglobin check.</p>
                </div>
                <div class="reason-card">
                    <div class="reason-icon">
                        <i class="fas fa-smile"></i>
                    </div>
                    <h3>Feel Good</h3>
                    <p>Experience the satisfaction of knowing you've made a positive impact on someone's life.</p>
                </div>
                <div class="reason-card">
                    <div class="reason-icon">
                        <i class="fas fa-clock"></i>
                    </div>
                    <h3>Quick & Easy</h3>
                    <p>The entire donation process takes about 45 minutes, with the actual donation taking only 8-10 minutes.</p>
                </div>
                <div class="reason-card">
                    <div class="reason-icon">
                        <i class="fas fa-calendar-check"></i>
                    </div>
                    <h3>Regular Impact</h3>
                    <p>Donate every 56 days and make a consistent, ongoing impact in your community.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Eligibility Section -->
    <section class="eligibility-section" id="eligibility">
        <div class="container">
            <div class="section-header">
                <h2>Donor Eligibility Requirements</h2>
                <p>Check if you meet the basic requirements to donate blood</p>
            </div>
            <div class="eligibility-content">
                <div class="eligibility-checklist">
                    <h3>Basic Requirements</h3>
                    <div class="checklist">
                        <div class="check-item">
                            <i class="fas fa-check-circle"></i>
                            <span>Age: 18-65 years old</span>
                        </div>
                        <div class="check-item">
                            <i class="fas fa-check-circle"></i>
                            <span>Weight: At least 50 kg (110 lbs)</span>
                        </div>
                        <div class="check-item">
                            <i class="fas fa-check-circle"></i>
                            <span>Good general health</span>
                        </div>
                        <div class="check-item">
                            <i class="fas fa-check-circle"></i>
                            <span>No recent illness or fever</span>
                        </div>
                        <div class="check-item">
                            <i class="fas fa-check-circle"></i>
                            <span>At least 56 days since last donation</span>
                        </div>
                        <div class="check-item">
                            <i class="fas fa-check-circle"></i>
                            <span>No recent tattoos or piercings (within 3 months)</span>
                        </div>
                    </div>
                </div>
                <div class="eligibility-info">
                    <h3>Additional Information</h3>
                    <div class="info-cards">
                        <div class="info-card">
                            <h4>Before Donation</h4>
                            <ul>
                                <li>Get a good night's sleep</li>
                                <li>Eat a healthy meal</li>
                                <li>Drink plenty of water</li>
                                <li>Bring a valid ID</li>
                            </ul>
                        </div>
                        <div class="info-card">
                            <h4>After Donation</h4>
                            <ul>
                                <li>Rest for 10-15 minutes</li>
                                <li>Drink extra fluids</li>
                                <li>Avoid heavy lifting for 24 hours</li>
                                <li>Eat iron-rich foods</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Donation Process Section -->
    <section class="process-section">
        <div class="container">
            <div class="section-header">
                <h2>The Donation Process</h2>
                <p>What to expect when you donate blood</p>
            </div>
            <div class="process-steps">
                <div class="step-item">
                    <div class="step-number">1</div>
                    <div class="step-content">
                        <h3>Registration</h3>
                        <p>Sign up on our platform and schedule your donation appointment at a convenient time and location.</p>
                        <div class="step-time">5 minutes</div>
                    </div>
                </div>
                <div class="step-item">
                    <div class="step-number">2</div>
                    <div class="step-content">
                        <h3>Health Screening</h3>
                        <p>Complete a brief health questionnaire and receive a mini physical exam including vital signs check.</p>
                        <div class="step-time">10-15 minutes</div>
                    </div>
                </div>
                <div class="step-item">
                    <div class="step-number">3</div>
                    <div class="step-content">
                        <h3>Blood Donation</h3>
                        <p>The actual blood donation process is quick and comfortable. You'll donate about 1 pint of blood.</p>
                        <div class="step-time">8-10 minutes</div>
                    </div>
                </div>
                <div class="step-item">
                    <div class="step-number">4</div>
                    <div class="step-content">
                        <h3>Recovery & Refreshments</h3>
                        <p>Relax and enjoy refreshments while your body begins to replenish the donated blood.</p>
                        <div class="step-time">10-15 minutes</div>
                    </div>
                </div>
            </div>
            <div class="process-total">
                <div class="total-time">
                    <i class="fas fa-clock"></i>
                    <span>Total Time: 45-60 minutes</span>
                </div>
            </div>
        </div>
    </section>

    <!-- Blood Types Section -->
    <section class="blood-types-section">
        <div class="container">
            <div class="section-header">
                <h2>Blood Types & Compatibility</h2>
                <p>Understanding blood types and who can help whom</p>
            </div>
            <div class="blood-types-grid">
                <div class="blood-type-card universal-donor">
                    <div class="blood-type-icon">O-</div>
                    <h3>Universal Donor</h3>
                    <p>O- blood can be given to anyone. These donors are especially needed for emergency situations.</p>
                    <div class="compatibility">Can donate to: All blood types</div>
                </div>
                <div class="blood-type-card universal-recipient">
                    <div class="blood-type-icon">AB+</div>
                    <h3>Universal Recipient</h3>
                    <p>AB+ individuals can receive blood from any blood type, making them universal recipients.</p>
                    <div class="compatibility">Can receive from: All blood types</div>
                </div>
                <div class="blood-type-card common">
                    <div class="blood-type-icon">O+</div>
                    <h3>Most Common</h3>
                    <p>O+ is the most common blood type and is always in high demand at hospitals.</p>
                    <div class="compatibility">Can donate to: O+, A+, B+, AB+</div>
                </div>
                <div class="blood-type-card rare">
                    <div class="blood-type-icon">AB-</div>
                    <h3>Rare Type</h3>
                    <p>AB- is one of the rarest blood types, making these donations especially valuable.</p>
                    <div class="compatibility">Can donate to: AB+, AB-</div>
                </div>
            </div>
        </div>
    </section>

    <!-- Testimonials Section -->
    <section class="testimonials-section">
        <div class="container">
            <div class="section-header">
                <h2>Donor Stories</h2>
                <p>Hear from our amazing donors about their experiences</p>
            </div>
            <div class="testimonials-grid">
                <div class="testimonial-card">
                    <div class="testimonial-content">
                        <p>"Donating blood through BloodConnect has been incredibly rewarding. The platform makes it so easy to schedule donations and track my impact. I've donated 15 times and helped save 45 lives!"</p>
                    </div>
                    <div class="testimonial-author">
                        <div class="author-avatar">
                            <i class="fas fa-user"></i>
                        </div>
                        <div class="author-info">
                            <h4>Sarah Johnson</h4>
                            <span>Regular Donor - O+ Blood Type</span>
                        </div>
                    </div>
                </div>
                <div class="testimonial-card">
                    <div class="testimonial-content">
                        <p>"As a universal donor with O- blood, I know how important my donations are. BloodConnect keeps me informed about when I'm needed most and makes the whole process seamless."</p>
                    </div>
                    <div class="testimonial-author">
                        <div class="author-avatar">
                            <i class="fas fa-user"></i>
                        </div>
                        <div class="author-info">
                            <h4>Michael Chen</h4>
                            <span>Universal Donor - O- Blood Type</span>
                        </div>
                    </div>
                </div>
                <div class="testimonial-card">
                    <div class="testimonial-content">
                        <p>"The staff at BloodConnect partner hospitals are amazing. They make you feel comfortable and appreciated. It's wonderful knowing that my small contribution can make such a big difference."</p>
                    </div>
                    <div class="testimonial-author">
                        <div class="author-avatar">
                            <i class="fas fa-user"></i>
                        </div>
                        <div class="author-info">
                            <h4>Emily Rodriguez</h4>
                            <span>New Donor - A+ Blood Type</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- CTA Section -->
    <section class="cta-section">
        <div class="container">
            <div class="cta-content">
                <h2>Ready to Save Lives?</h2>
                <p>Join our community of heroes and start making a difference today</p>
                <div class="cta-buttons">
                    <a href="auth/register-donor.php" class="btn btn-primary btn-lg">
                        <i class="fas fa-heart"></i>
                        Register as Donor
                    </a>
                    <a href="contact.php" class="btn btn-secondary btn-lg">
                        <i class="fas fa-question-circle"></i>
                        Have Questions?
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