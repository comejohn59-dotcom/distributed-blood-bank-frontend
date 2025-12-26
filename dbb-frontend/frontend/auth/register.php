<?php
session_start();

// If user is already logged in, redirect to dashboard
if (isset($_SESSION['user_id'])) {
    header('Location: ../dashboard/' . $_SESSION['user_type'] . '.php');
    exit();
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Register - BloodConnect</title>
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
                        <i class="fas fa-user-plus"></i>
                    </div>
                    <h1>Join BloodConnect</h1>
                    <p>Choose your role to get started and help save lives</p>
                </div>

                <div class="role-options-modern">
                    <a href="register-patient.php" class="role-option-modern">
                        <div class="role-icon-modern patient-logo">
                            <i class="fas fa-user-injured"></i>
                        </div>
                        <h4>Patient</h4>
                        <p>Register as a patient to request blood when needed for medical treatment</p>
                        <div class="role-features">
                            <small><i class="fas fa-check"></i> Request blood transfusions</small>
                            <small><i class="fas fa-check"></i> Track request status</small>
                            <small><i class="fas fa-check"></i> Emergency requests</small>
                        </div>
                    </a>

                    <a href="register-donor.php" class="role-option-modern">
                        <div class="role-icon-modern donor-logo">
                            <i class="fas fa-heart"></i>
                        </div>
                        <h4>Blood Donor</h4>
                        <p>Register as a donor to help save lives by donating blood regularly</p>
                        <div class="role-features">
                            <small><i class="fas fa-check"></i> Schedule donations</small>
                            <small><i class="fas fa-check"></i> Track donation history</small>
                            <small><i class="fas fa-check"></i> Receive emergency alerts</small>
                        </div>
                    </a>

                    <a href="register-hospital.php" class="role-option-modern">
                        <div class="role-icon-modern hospital-logo">
                            <i class="fas fa-hospital"></i>
                        </div>
                        <h4>Hospital / Blood Bank</h4>
                        <p>Register your medical institution to manage blood inventory and requests</p>
                        <div class="role-features">
                            <small><i class="fas fa-check"></i> Manage blood inventory</small>
                            <small><i class="fas fa-check"></i> Process requests</small>
                            <small><i class="fas fa-check"></i> Coordinate with donors</small>
                        </div>
                    </a>
                </div>

                <div class="auth-divider-modern">
                    <span>or</span>
                </div>

                <div class="auth-footer-modern">
                    <p>Already have an account? <a href="login.php" class="auth-link-modern">Sign in here</a></p>
                    <p style="margin-top: 1rem; font-size: 0.875rem; color: #6b7280;">
                        By registering, you agree to our <a href="#" class="auth-link-modern">Terms of Service</a> and <a href="#" class="auth-link-modern">Privacy Policy</a>
                    </p>
                </div>
            </div>
        </div>
    </div>

    <style>
    .auth-content-modern.single-card {
        grid-template-columns: 1fr;
        max-width: 600px;
    }
    
    .role-options-modern {
        display: grid;
        grid-template-columns: 1fr;
        gap: 1.5rem;
        margin-bottom: 2rem;
    }
    
    .role-option-modern {
        padding: 2rem;
        border: 2px solid #e5e7eb;
        border-radius: 1rem;
        text-align: center;
        text-decoration: none;
        color: inherit;
        transition: all 0.2s ease-in-out;
        background: #ffffff;
        display: block;
    }
    
    .role-option-modern:hover {
        border-color: #dc2626;
        transform: translateY(-2px);
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        text-decoration: none;
        color: inherit;
    }
    
    .role-icon-modern {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 1rem;
        transition: all 0.2s ease-in-out;
    }
    
    .role-option-modern:hover .role-icon-modern {
        transform: scale(1.1);
    }
    
    .role-icon-modern i {
        font-size: 1.5rem;
        color: #ffffff;
    }
    
    .donor-logo {
        background: linear-gradient(135deg, #dc2626, #b91c1c);
    }
    
    .patient-logo {
        background: linear-gradient(135deg, #2563eb, #1d4ed8);
    }
    
    .hospital-logo {
        background: linear-gradient(135deg, #059669, #047857);
    }
    
    .role-option-modern h4 {
        font-size: 1.25rem;
        font-weight: 600;
        color: #111827;
        margin-bottom: 0.5rem;
    }
    
    .role-option-modern p {
        color: #6b7280;
        font-size: 0.875rem;
        line-height: 1.5;
        margin-bottom: 1rem;
    }
    
    .role-features {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        text-align: left;
    }
    
    .role-features small {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #6b7280;
        font-size: 0.75rem;
    }
    
    .role-features i {
        color: #10b981;
        font-size: 0.75rem;
    }
    
    @media (max-width: 768px) {
        .auth-card-modern {
            padding: 2rem;
        }
        
        .role-option-modern {
            padding: 1.5rem;
        }
        
        .role-icon-modern {
            width: 50px;
            height: 50px;
        }
        
        .role-icon-modern i {
            font-size: 1.25rem;
        }
    }
    </style>

    <script src="../js/main.js"></script>
</body>
</html>