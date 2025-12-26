<?php
session_start();
require_once '../backend/config/database.php';

$success_message = '';
$error_message = '';

// Handle contact form submission
if ($_POST) {
    $name = trim($_POST['name']);
    $email = trim($_POST['email']);
    $phone = trim($_POST['phone']);
    $subject = trim($_POST['subject']);
    $message = trim($_POST['message']);
    
    // Basic validation
    if (empty($name) || empty($email) || empty($subject) || empty($message)) {
        $error_message = 'Please fill in all required fields.';
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $error_message = 'Please enter a valid email address.';
    } else {
        // Here you would typically save to database or send email
        // For now, we'll just show a success message
        $success_message = 'Thank you for your message! We will get back to you within 24 hours.';
        
        // Clear form data
        $_POST = array();
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contact Us - BloodConnect</title>
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
                <a href="contact.php" class="nav-link active">Contact</a>
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
    <section class="contact-hero">
        <div class="container">
            <div class="hero-content">
                <h1>Contact Us</h1>
                <p>Get in touch with our team - we're here to help</p>
            </div>
        </div>
    </section>

    <!-- Contact Section -->
    <section class="contact-section">
        <div class="container">
            <div class="contact-content">
                <!-- Contact Information -->
                <div class="contact-info">
                    <div class="section-header">
                        <h2>Get in Touch</h2>
                        <p>We're here to help you with any questions or concerns</p>
                    </div>
                    
                    <div class="contact-methods">
                        <div class="contact-method">
                            <div class="method-icon">
                                <i class="fas fa-phone"></i>
                            </div>
                            <div class="method-info">
                                <h3>Phone</h3>
                                <p>+1 (555) 123-4567</p>
                                <small>Mon-Fri 8AM-6PM</small>
                            </div>
                        </div>
                        
                        <div class="contact-method">
                            <div class="method-icon">
                                <i class="fas fa-envelope"></i>
                            </div>
                            <div class="method-info">
                                <h3>Email</h3>
                                <p>info@bloodconnect.com</p>
                                <small>We'll respond within 24 hours</small>
                            </div>
                        </div>
                        
                        <div class="contact-method">
                            <div class="method-icon">
                                <i class="fas fa-map-marker-alt"></i>
                            </div>
                            <div class="method-info">
                                <h3>Address</h3>
                                <p>123 Health Street<br>Medical City, MC 12345</p>
                                <small>Visit us during business hours</small>
                            </div>
                        </div>
                        
                        <div class="contact-method">
                            <div class="method-icon">
                                <i class="fas fa-clock"></i>
                            </div>
                            <div class="method-info">
                                <h3>Business Hours</h3>
                                <p>Monday - Friday: 8:00 AM - 6:00 PM<br>
                                   Saturday: 9:00 AM - 4:00 PM<br>
                                   Sunday: Closed</p>
                                <small>Emergency support available 24/7</small>
                            </div>
                        </div>
                    </div>
                    
                    <div class="emergency-contact">
                        <div class="emergency-card">
                            <div class="emergency-icon">
                                <i class="fas fa-exclamation-triangle"></i>
                            </div>
                            <div class="emergency-info">
                                <h3>Emergency Blood Requests</h3>
                                <p>For urgent blood requirements, call our 24/7 emergency hotline:</p>
                                <a href="tel:+15551234567" class="emergency-phone">+1 (555) 123-4567</a>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Contact Form -->
                <div class="contact-form-section">
                    <div class="form-header">
                        <h2>Send us a Message</h2>
                        <p>Fill out the form below and we'll get back to you soon</p>
                    </div>
                    
                    <?php if ($success_message): ?>
                        <div class="alert alert-success">
                            <i class="fas fa-check-circle"></i>
                            <?php echo htmlspecialchars($success_message); ?>
                        </div>
                    <?php endif; ?>

                    <?php if ($error_message): ?>
                        <div class="alert alert-danger">
                            <i class="fas fa-exclamation-circle"></i>
                            <?php echo htmlspecialchars($error_message); ?>
                        </div>
                    <?php endif; ?>
                    
                    <form class="contact-form" method="POST">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="name">Full Name *</label>
                                <input type="text" id="name" name="name" class="form-control" required value="<?php echo htmlspecialchars($_POST['name'] ?? ''); ?>">
                            </div>
                            <div class="form-group">
                                <label for="email">Email Address *</label>
                                <input type="email" id="email" name="email" class="form-control" required value="<?php echo htmlspecialchars($_POST['email'] ?? ''); ?>">
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="phone">Phone Number</label>
                                <input type="tel" id="phone" name="phone" class="form-control" value="<?php echo htmlspecialchars($_POST['phone'] ?? ''); ?>">
                            </div>
                            <div class="form-group">
                                <label for="subject">Subject *</label>
                                <select id="subject" name="subject" class="form-control" required>
                                    <option value="">Select a subject</option>
                                    <option value="general" <?php echo (($_POST['subject'] ?? '') == 'general') ? 'selected' : ''; ?>>General Inquiry</option>
                                    <option value="donor" <?php echo (($_POST['subject'] ?? '') == 'donor') ? 'selected' : ''; ?>>Donor Support</option>
                                    <option value="patient" <?php echo (($_POST['subject'] ?? '') == 'patient') ? 'selected' : ''; ?>>Patient Support</option>
                                    <option value="hospital" <?php echo (($_POST['subject'] ?? '') == 'hospital') ? 'selected' : ''; ?>>Hospital Partnership</option>
                                    <option value="technical" <?php echo (($_POST['subject'] ?? '') == 'technical') ? 'selected' : ''; ?>>Technical Support</option>
                                    <option value="feedback" <?php echo (($_POST['subject'] ?? '') == 'feedback') ? 'selected' : ''; ?>>Feedback</option>
                                    <option value="other" <?php echo (($_POST['subject'] ?? '') == 'other') ? 'selected' : ''; ?>>Other</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="message">Message *</label>
                            <textarea id="message" name="message" class="form-control" rows="6" placeholder="Please describe your inquiry in detail..." required><?php echo htmlspecialchars($_POST['message'] ?? ''); ?></textarea>
                        </div>
                        
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary btn-lg">
                                <i class="fas fa-paper-plane"></i>
                                Send Message
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </section>

    <!-- FAQ Section -->
    <section class="faq-section">
        <div class="container">
            <div class="section-header">
                <h2>Frequently Asked Questions</h2>
                <p>Quick answers to common questions</p>
            </div>
            <div class="faq-grid">
                <div class="faq-item">
                    <div class="faq-question">
                        <h3>How do I register as a blood donor?</h3>
                        <i class="fas fa-plus"></i>
                    </div>
                    <div class="faq-answer">
                        <p>You can register as a blood donor by clicking on "Become a Donor" and filling out the registration form. You'll need to provide basic personal information, medical history, and contact details.</p>
                    </div>
                </div>
                
                <div class="faq-item">
                    <div class="faq-question">
                        <h3>How can I request blood for a patient?</h3>
                        <i class="fas fa-plus"></i>
                    </div>
                    <div class="faq-answer">
                        <p>Register as a patient or family member, then use our blood search feature to find available blood units at nearby hospitals. You can submit requests directly through the platform.</p>
                    </div>
                </div>
                
                <div class="faq-item">
                    <div class="faq-question">
                        <h3>Is my personal information secure?</h3>
                        <i class="fas fa-plus"></i>
                    </div>
                    <div class="faq-answer">
                        <p>Yes, we use industry-standard encryption and follow HIPAA compliance guidelines to protect your personal and medical information. Your data is never shared without your consent.</p>
                    </div>
                </div>
                
                <div class="faq-item">
                    <div class="faq-question">
                        <h3>How often can I donate blood?</h3>
                        <i class="fas fa-plus"></i>
                    </div>
                    <div class="faq-answer">
                        <p>Generally, you can donate whole blood every 56 days (8 weeks). Our system automatically tracks your eligibility and will notify you when you're eligible to donate again.</p>
                    </div>
                </div>
                
                <div class="faq-item">
                    <div class="faq-question">
                        <h3>Can hospitals join the BloodConnect network?</h3>
                        <i class="fas fa-plus"></i>
                    </div>
                    <div class="faq-answer">
                        <p>Yes, hospitals and blood banks can register to join our network. After registration, our admin team will verify your credentials before activating your account.</p>
                    </div>
                </div>
                
                <div class="faq-item">
                    <div class="faq-question">
                        <h3>Is there a mobile app available?</h3>
                        <i class="fas fa-plus"></i>
                    </div>
                    <div class="faq-answer">
                        <p>Our platform is fully mobile-responsive and works seamlessly on all devices. You can access all features through your mobile browser without needing a separate app.</p>
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
    <script>
        // FAQ Toggle functionality
        document.querySelectorAll('.faq-question').forEach(question => {
            question.addEventListener('click', () => {
                const faqItem = question.parentElement;
                const answer = faqItem.querySelector('.faq-answer');
                const icon = question.querySelector('i');
                
                faqItem.classList.toggle('active');
                
                if (faqItem.classList.contains('active')) {
                    answer.style.maxHeight = answer.scrollHeight + 'px';
                    icon.classList.remove('fa-plus');
                    icon.classList.add('fa-minus');
                } else {
                    answer.style.maxHeight = '0';
                    icon.classList.remove('fa-minus');
                    icon.classList.add('fa-plus');
                }
            });
        });
    </script>
</body>
</html>