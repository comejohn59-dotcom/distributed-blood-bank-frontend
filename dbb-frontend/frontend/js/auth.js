// Authentication JavaScript for BloodConnect
// Handles login, registration, and dashboard redirection with backend integration

// API Configuration
const API_BASE_URL = 'http://localhost/bloodconnect/backend/api';

// Initialize authentication system
document.addEventListener('DOMContentLoaded', function() {
    initializeAuth();
});

function initializeAuth() {
    // Initialize login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Initialize registration forms
    const patientRegForm = document.getElementById('patientRegistrationForm');
    if (patientRegForm) {
        patientRegForm.addEventListener('submit', (e) => handleRegistration(e, 'patient'));
    }

    const donorRegForm = document.getElementById('donorRegistrationForm');
    if (donorRegForm) {
        donorRegForm.addEventListener('submit', (e) => handleRegistration(e, 'donor'));
    }

    const hospitalRegForm = document.getElementById('hospitalRegistrationForm');
    if (hospitalRegForm) {
        hospitalRegForm.addEventListener('submit', (e) => handleRegistration(e, 'hospital'));
    }

    // Initialize password toggles
    initializePasswordToggles();
    
    // Initialize form validation
    initializeFormValidation();

    // Check if user is already logged in
    checkAuthStatus();
}

// Handle user login
async function handleLogin(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    // Show loading state
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing In...';
    submitBtn.disabled = true;
    
    try {
        const loginData = {
            email: formData.get('email'),
            password: formData.get('password')
        };
        
        const response = await fetch(`${API_BASE_URL}/auth/login.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(loginData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Store user session
            localStorage.setItem('bloodconnect_user', JSON.stringify(result.data));
            localStorage.setItem('bloodconnect_token', result.data.session.token);
            
            // Show success message
            showNotification('Login successful! Redirecting to dashboard...', 'success');
            
            // Redirect to appropriate dashboard
            setTimeout(() => {
                redirectToDashboard(result.data.user.user_type);
            }, 1500);
            
        } else {
            showNotification(result.message || 'Login failed. Please try again.', 'error');
        }
        
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Network error. Please check your connection and try again.', 'error');
    } finally {
        // Restore button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Handle user registration
async function handleRegistration(event, userType) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    // Show loading state
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
    submitBtn.disabled = true;
    
    try {
        // Prepare registration data based on user type
        const registrationData = prepareRegistrationData(formData, userType);
        
        // Validate required fields
        if (!validateRegistrationData(registrationData, userType)) {
            return;
        }
        
        const response = await fetch(`${API_BASE_URL}/auth/register.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(registrationData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Show success message
            showNotification('Registration successful! You can now login with your credentials.', 'success');
            
            // Reset form
            form.reset();
            
            // Redirect to login page after delay
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
            
        } else {
            showNotification(result.message || 'Registration failed. Please try again.', 'error');
        }
        
    } catch (error) {
        console.error('Registration error:', error);
        showNotification('Network error. Please check your connection and try again.', 'error');
    } finally {
        // Restore button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Prepare registration data based on user type
function prepareRegistrationData(formData, userType) {
    const baseData = {
        email: formData.get('email'),
        password: formData.get('password'),
        user_type: userType,
        first_name: formData.get('firstName'),
        last_name: formData.get('lastName'),
        phone: formData.get('phone'),
        address: formData.get('address'),
        city: formData.get('city'),
        state: formData.get('state'),
        zip_code: formData.get('zipCode'),
        country: formData.get('country') || 'USA'
    };
    
    // Add user-type specific fields
    switch (userType) {
        case 'patient':
            return {
                ...baseData,
                blood_type: formData.get('bloodType'),
                date_of_birth: formData.get('dateOfBirth'),
                gender: formData.get('gender'),
                weight: formData.get('weight'),
                height: formData.get('height'),
                medical_id: formData.get('medicalId'),
                insurance_provider: formData.get('insuranceProvider'),
                emergency_contact_name: formData.get('emergencyContact1') || formData.get('emergencyContact'),
                emergency_contact_phone: formData.get('emergencyPhone1') || formData.get('emergencyPhone'),
                known_allergies: formData.get('knownAllergies') || formData.get('allergies'),
                medical_conditions: formData.get('medicalConditions') || formData.get('medicalCondition')
            };
            
        case 'donor':
            return {
                ...baseData,
                blood_type: formData.get('bloodType'),
                date_of_birth: formData.get('dateOfBirth'),
                gender: formData.get('gender'),
                weight: formData.get('weight'),
                height: formData.get('height'),
                health_status: formData.get('healthStatus') || 'good',
                preferred_donation_time: formData.get('preferredDonationTime') || 'any',
                emergency_contact_name: formData.get('emergencyContact'),
                emergency_contact_phone: formData.get('emergencyPhone'),
                known_allergies: formData.get('knownAllergies'),
                medical_conditions: formData.get('medicalConditions')
            };
            
        case 'hospital':
            return {
                ...baseData,
                hospital_name: formData.get('hospitalName'),
                hospital_type: formData.get('hospitalType'),
                license_number: formData.get('licenseNumber'),
                accreditation_level: formData.get('accreditation') || 'level_1',
                bed_capacity: formData.get('bedCapacity'),
                has_blood_bank: formData.get('hasBloodBank') === 'on' || formData.get('services')?.includes('blood_bank'),
                blood_bank_license: formData.get('bloodBankLicense'),
                emergency_services: formData.get('emergencyServices') === 'on' || formData.get('services')?.includes('emergency'),
                trauma_center_level: formData.get('traumaCenterLevel') || 'none',
                operating_hours_start: formData.get('operatingHoursStart') || '00:00',
                operating_hours_end: formData.get('operatingHoursEnd') || '23:59',
                is_24_7: formData.get('operatingHours') === '24/7' || formData.get('is247') === 'on',
                latitude: formData.get('latitude'),
                longitude: formData.get('longitude'),
                website: formData.get('website'),
                emergency_phone: formData.get('emergencyPhone'),
                blood_bank_phone: formData.get('bloodBankPhone') || formData.get('phone')
            };
            
        default:
            return baseData;
    }
}

// Validate registration data
function validateRegistrationData(data, userType) {
    // Basic validation
    if (!data.email || !data.password || !data.first_name || !data.last_name) {
        showNotification('Please fill in all required fields.', 'error');
        return false;
    }
    
    // Email validation
    if (!isValidEmail(data.email)) {
        showNotification('Please enter a valid email address.', 'error');
        return false;
    }
    
    // Password validation
    if (data.password.length < 8) {
        showNotification('Password must be at least 8 characters long.', 'error');
        return false;
    }
    
    // User-type specific validation
    switch (userType) {
        case 'patient':
        case 'donor':
            if (!data.blood_type || !data.date_of_birth || !data.gender) {
                showNotification('Please fill in all required medical information.', 'error');
                return false;
            }
            if (userType === 'donor' && (!data.weight || data.weight < 50)) {
                showNotification('Donors must weigh at least 50kg to be eligible for donation.', 'error');
                return false;
            }
            break;
            
        case 'hospital':
            if (!data.hospital_name || !data.hospital_type || !data.license_number) {
                showNotification('Please fill in all required hospital information.', 'error');
                return false;
            }
            break;
    }
    
    return true;
}

// Check authentication status
function checkAuthStatus() {
    const user = getCurrentUser();
    if (user) {
        // User is logged in, check if on login/register page
        const currentPage = window.location.pathname;
        if (currentPage.includes('login.html') || currentPage.includes('register')) {
            // Redirect to dashboard
            redirectToDashboard(user.user.user_type);
        }
    }
}

// Get current user from localStorage
function getCurrentUser() {
    try {
        const userData = localStorage.getItem('bloodconnect_user');
        return userData ? JSON.parse(userData) : null;
    } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
    }
}

// Redirect to appropriate dashboard
function redirectToDashboard(userType) {
    const dashboardUrls = {
        'patient': '../dashboard/patient.html',
        'donor': '../dashboard/donor.html',
        'hospital': '../dashboard/hospital.html',
        'admin': '../dashboard/index.html'
    };
    
    const dashboardUrl = dashboardUrls[userType];
    if (dashboardUrl) {
        window.location.href = dashboardUrl;
    } else {
        console.error('Unknown user type:', userType);
        showNotification('Unknown user type. Please contact support.', 'error');
    }
}

// Logout function
function logout() {
    // Clear user data
    localStorage.removeItem('bloodconnect_user');
    localStorage.removeItem('bloodconnect_token');
    
    // Show notification
    showNotification('Logged out successfully.', 'success');
    
    // Redirect to login page
    setTimeout(() => {
        window.location.href = '../auth/login.html';
    }, 1000);
}

// Admin login function
async function adminLogin() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'admin@bloodconnect.com',
                password: 'admin123'
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            localStorage.setItem('bloodconnect_user', JSON.stringify(result.data));
            localStorage.setItem('bloodconnect_token', result.data.session.token);
            window.location.href = '../dashboard/index.html';
        } else {
            showNotification('Admin login failed: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Admin login error:', error);
        showNotification('Admin login failed. Please try again.', 'error');
    }
}

// Password Toggle
function initializePasswordToggles() {
    const toggleButtons = document.querySelectorAll('.password-toggle, .password-toggle-modern');
    
    toggleButtons.forEach(button => {
        button.addEventListener('click', function() {
            const input = this.previousElementSibling || this.parentElement.querySelector('input[type="password"], input[type="text"]');
            const icon = this.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });
}

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const button = input.nextElementSibling || input.parentElement.querySelector('.password-toggle, .password-toggle-modern');
    const icon = button.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Form Validation
function initializeFormValidation() {
    // Real-time validation for email fields
    const emailInputs = document.querySelectorAll('input[type="email"]');
    emailInputs.forEach(input => {
        input.addEventListener('blur', function() {
            if (this.value && !isValidEmail(this.value)) {
                showFieldError(this, 'Please enter a valid email address');
            } else {
                clearFieldError(this);
            }
        });
    });
    
    // Real-time validation for phone fields
    const phoneInputs = document.querySelectorAll('input[type="tel"]');
    phoneInputs.forEach(input => {
        input.addEventListener('input', function() {
            // Format phone number as user types
            this.value = formatPhoneNumber(this.value);
        });
    });
    
    // Password strength indicator
    const passwordInputs = document.querySelectorAll('input[name="password"]');
    passwordInputs.forEach(input => {
        input.addEventListener('input', function() {
            updatePasswordStrength(this.value);
        });
    });
}

function updatePasswordStrength(password) {
    const strengthBar = document.querySelector('.strength-fill');
    const strengthText = document.querySelector('.strength-text');
    
    if (!strengthBar || !strengthText) return;
    
    let strength = 0;
    let strengthLabel = '';
    
    if (password.length >= 8) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    
    if (strength === 0) {
        strengthLabel = 'Password strength';
        strengthBar.style.background = '#e5e7eb';
    } else if (strength <= 25) {
        strengthLabel = 'Weak';
        strengthBar.style.background = '#ef4444';
    } else if (strength <= 50) {
        strengthLabel = 'Fair';
        strengthBar.style.background = '#f59e0b';
    } else if (strength <= 75) {
        strengthLabel = 'Good';
        strengthBar.style.background = '#3b82f6';
    } else {
        strengthLabel = 'Strong';
        strengthBar.style.background = '#10b981';
    }
    
    strengthBar.style.width = strength + '%';
    strengthText.textContent = strengthLabel;
}

function showFieldError(field, message) {
    clearFieldError(field);
    
    field.classList.add('error');
    const errorElement = document.createElement('div');
    errorElement.className = 'field-error';
    errorElement.textContent = message;
    field.parentElement.appendChild(errorElement);
}

function clearFieldError(field) {
    field.classList.remove('error');
    const existingError = field.parentElement.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
}

// Utility functions
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function formatPhoneNumber(phoneNumber) {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
        return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    
    return phoneNumber;
}

function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add notification styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${getNotificationColor(type)};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        z-index: 10001;
        max-width: 400px;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        font-family: 'Inter', sans-serif;
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

function getNotificationIcon(type) {
    const icons = {
        'success': 'check-circle',
        'error': 'exclamation-circle',
        'warning': 'exclamation-triangle',
        'info': 'info-circle'
    };
    return icons[type] || 'info-circle';
}

function getNotificationColor(type) {
    const colors = {
        'success': '#10b981',
        'error': '#ef4444',
        'warning': '#f59e0b',
        'info': '#3b82f6'
    };
    return colors[type] || '#3b82f6';
}

// Dashboard protection - call this on dashboard pages
function protectDashboard(requiredUserType = null) {
    const user = getCurrentUser();
    
    if (!user) {
        // Not logged in, redirect to login
        window.location.href = '../auth/login.html';
        return false;
    }
    
    if (requiredUserType && user.user.user_type !== requiredUserType) {
        // Wrong user type, redirect to correct dashboard
        redirectToDashboard(user.user.user_type);
        return false;
    }
    
    return true;
}

// Initialize user info in dashboard
function initializeDashboardUser() {
    const user = getCurrentUser();
    if (user) {
        // Update user name in navigation
        const userNameElements = document.querySelectorAll('.user-name');
        userNameElements.forEach(element => {
            element.textContent = `${user.user.first_name} ${user.user.last_name}`;
        });
        
        // Update user role
        const userRoleElements = document.querySelectorAll('.user-role');
        userRoleElements.forEach(element => {
            element.textContent = user.user.user_type.charAt(0).toUpperCase() + user.user.user_type.slice(1);
        });
        
        // Update profile-specific information
        if (user.profile) {
            updateProfileInfo(user.profile, user.user.user_type);
        }
    }
}

// Update profile-specific information
function updateProfileInfo(profile, userType) {
    switch (userType) {
        case 'patient':
            if (profile.patient_id) {
                const patientIdElements = document.querySelectorAll('.patient-id');
                patientIdElements.forEach(element => {
                    element.textContent = profile.patient_id;
                });
            }
            if (profile.blood_type) {
                const bloodTypeElements = document.querySelectorAll('.blood-type');
                bloodTypeElements.forEach(element => {
                    element.textContent = profile.blood_type;
                });
            }
            break;
            
        case 'donor':
            if (profile.donor_id) {
                const donorIdElements = document.querySelectorAll('.donor-id');
                donorIdElements.forEach(element => {
                    element.textContent = profile.donor_id;
                });
            }
            if (profile.blood_type) {
                const bloodTypeElements = document.querySelectorAll('.blood-type');
                bloodTypeElements.forEach(element => {
                    element.textContent = profile.blood_type;
                });
            }
            break;
            
        case 'hospital':
            if (profile.hospital_name) {
                const hospitalNameElements = document.querySelectorAll('.hospital-name');
                hospitalNameElements.forEach(element => {
                    element.textContent = profile.hospital_name;
                });
            }
            if (profile.hospital_id) {
                const hospitalIdElements = document.querySelectorAll('.hospital-id');
                hospitalIdElements.forEach(element => {
                    element.textContent = profile.hospital_id;
                });
            }
            break;
    }
}

// Multi-step form functionality (for complex registration forms)
let currentStep = 1;
let totalSteps = 3;

function nextStep() {
    if (validateCurrentStep()) {
        if (currentStep < totalSteps) {
            currentStep++;
            updateFormStep();
        }
    }
}

function prevStep() {
    if (currentStep > 1) {
        currentStep--;
        updateFormStep();
    }
}

function updateFormStep() {
    // Update progress indicator
    const progressSteps = document.querySelectorAll('.progress-step, .step');
    const formSteps = document.querySelectorAll('.form-step, .step-form');
    
    progressSteps.forEach((step, index) => {
        if (index + 1 <= currentStep) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
        
        if (index + 1 < currentStep) {
            step.classList.add('completed');
        } else {
            step.classList.remove('completed');
        }
    });
    
    // Update form steps
    formSteps.forEach((step, index) => {
        if (index + 1 === currentStep) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    });
    
    // Scroll to top of form
    const authCard = document.querySelector('.auth-card-modern, .auth-card');
    if (authCard) {
        authCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function validateCurrentStep() {
    const currentFormStep = document.querySelector(`.form-step[data-step="${currentStep}"], .step-form[data-step="${currentStep}"]`);
    if (!currentFormStep) return true;
    
    const requiredFields = currentFormStep.querySelectorAll('input[required], select[required], textarea[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.classList.add('error');
            isValid = false;
            
            // Remove error class after user starts typing
            field.addEventListener('input', function() {
                this.classList.remove('error');
            }, { once: true });
        } else {
            field.classList.remove('error');
        }
    });
    
    if (!isValid) {
        showNotification('Please fill in all required fields', 'error');
    }
    
    return isValid;
}

// Add CSS for error states and notifications
const authStyles = `
    .form-control.error,
    .form-control-modern.error {
        border-color: #ef4444 !important;
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
    }
    
    .field-error {
        color: #ef4444;
        font-size: 0.875rem;
        margin-top: 0.25rem;
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 0.25rem;
        border-radius: 4px;
        transition: background-color 0.3s ease;
        flex-shrink: 0;
    }
    
    .notification-close:hover {
        background: rgba(255, 255, 255, 0.2);
    }
    
    @media (max-width: 768px) {
        .notification {
            top: 10px;
            right: 10px;
            left: 10px;
            max-width: none;
        }
    }
`;

// Add styles to head
const styleSheet = document.createElement('style');
styleSheet.textContent = authStyles;
document.head.appendChild(styleSheet);