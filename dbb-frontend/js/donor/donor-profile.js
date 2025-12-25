// frontend/js/donor/profile.js

// API path helper — allows overriding `window.API_ROOT` to fix backend paths centrally
if (typeof apiPath === 'undefined') {
    var apiPath = function(p) {
        var root = (typeof window !== 'undefined' && window.API_ROOT) ? window.API_ROOT : '/dbb-frontend';
        return root + p;
    };
}

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in and is a donor
    const userData = JSON.parse(localStorage.getItem('user'));
    if (!userData || userData.role !== 'donor') {
        window.location.href = '../auth/login.html';
        return;
    }

    // Load donor profile on page load
    loadDonorProfile();

    // Setup form submission
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', updateProfile);
    }

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('href');
            window.location.href = page;
        });
    });
});

/**
 * Load donor profile data from API
 */
async function loadDonorProfile() {
    const userData = JSON.parse(localStorage.getItem('user'));
    const donorId = userData.user_id;

    try {
        // Show loading state
        showLoading(true);

        const response = await fetch(apiPath(`/backend/api/donors.php?id=${donorId}`), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const result = await response.json();

        if (result.success && result.data) {
            populateProfileForm(result.data);
        } else {
            showMessage('error', result.message || 'Failed to load profile');
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        showMessage('error', 'Network error. Please try again.');
    } finally {
        showLoading(false);
    }
}

/**
 * Populate form with donor data
 */
function populateProfileForm(donorData) {
    // Basic info
    document.getElementById('firstName').value = donorData.first_name || '';
    document.getElementById('lastName').value = donorData.last_name || '';
    document.getElementById('email').value = donorData.email || '';
    document.getElementById('phone').value = donorData.phone || '';
    document.getElementById('dateOfBirth').value = donorData.date_of_birth || '';
    
    // Address
    document.getElementById('address').value = donorData.address || '';
    document.getElementById('city').value = donorData.city || '';
    document.getElementById('state').value = donorData.state || '';
    document.getElementById('zipCode').value = donorData.zip_code || '';
    
    // Medical info
    document.getElementById('bloodGroup').value = donorData.blood_group || '';
    document.getElementById('weight').value = donorData.weight || '';
    document.getElementById('height').value = donorData.height || '';
    
    // Health conditions
    const healthConditions = donorData.health_conditions ? JSON.parse(donorData.health_conditions) : [];
    document.getElementById('healthConditions').value = healthConditions.join(', ');
    
    // Medications
    const medications = donorData.medications ? JSON.parse(donorData.medications) : [];
    document.getElementById('medications').value = medications.join(', ');
    
    // Last donation date
    if (donorData.last_donation_date) {
        document.getElementById('lastDonationDate').value = formatDate(donorData.last_donation_date);
    }
    
    // Donation count
    if (donorData.donation_count !== undefined) {
        document.getElementById('donationCount').textContent = donorData.donation_count;
    }
    
    // Eligibility status
    if (donorData.eligibility_status) {
        const statusBadge = document.getElementById('eligibilityStatus');
        statusBadge.textContent = donorData.eligibility_status;
        statusBadge.className = `badge ${getStatusClass(donorData.eligibility_status)}`;
    }
}

/**
 * Handle profile form submission
 */
async function updateProfile(e) {
    e.preventDefault();
    
    const userData = JSON.parse(localStorage.getItem('user'));
    const donorId = userData.user_id;
    
    // Collect form data
    const formData = {
        id: donorId,
        first_name: document.getElementById('firstName').value.trim(),
        last_name: document.getElementById('lastName').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        date_of_birth: document.getElementById('dateOfBirth').value,
        address: document.getElementById('address').value.trim(),
        city: document.getElementById('city').value.trim(),
        state: document.getElementById('state').value.trim(),
        zip_code: document.getElementById('zipCode').value.trim(),
        weight: parseFloat(document.getElementById('weight').value) || 0,
        height: parseFloat(document.getElementById('height').value) || 0,
        health_conditions: document.getElementById('healthConditions').value
            .split(',')
            .map(item => item.trim())
            .filter(item => item),
        medications: document.getElementById('medications').value
            .split(',')
            .map(item => item.trim())
            .filter(item => item)
    };
    
    // Basic validation
    if (!formData.first_name || !formData.last_name) {
        showMessage('error', 'First name and last name are required');
        return;
    }
    
    if (!formData.phone) {
        showMessage('error', 'Phone number is required');
        return;
    }
    
    if (formData.weight < 50) {
        showMessage('error', 'Minimum weight for donation is 50kg');
        return;
    }
    
    try {
        showLoading(true);
        
        const response = await fetch(apiPath('/backend/api/donors.php'), {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showMessage('success', 'Profile updated successfully!');
            // Update user data in localStorage if needed
            if (result.data) {
                const currentUser = JSON.parse(localStorage.getItem('user'));
                currentUser.first_name = formData.first_name;
                currentUser.last_name = formData.last_name;
                localStorage.setItem('user', JSON.stringify(currentUser));
                
                // Update displayed name
                const userNameElement = document.querySelector('.user-name');
                if (userNameElement) {
                    userNameElement.textContent = `${formData.first_name} ${formData.last_name}`;
                }
            }
            
            // Reload profile to get updated data
            setTimeout(() => loadDonorProfile(), 1000);
        } else {
            showMessage('error', result.message || 'Failed to update profile');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        showMessage('error', 'Network error. Please try again.');
    } finally {
        showLoading(false);
    }
}

/**
 * Logout function
 */
function logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '../auth/login.html';
}

/**
 * Show loading state
 */
function showLoading(show) {
    const loadingElement = document.getElementById('loadingSpinner');
    const submitButton = document.getElementById('submitBtn');
    
    if (loadingElement) {
        loadingElement.style.display = show ? 'block' : 'none';
    }
    
    if (submitButton) {
        submitButton.disabled = show;
        submitButton.innerHTML = show ? 
            '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Updating...' : 
            'Update Profile';
    }
}

/**
 * Show message to user
 */
function showMessage(type, text) {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.alert');
    existingMessages.forEach(msg => msg.remove());
    
    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.className = `alert alert-${type === 'error' ? 'danger' : 'success'} alert-dismissible fade show`;
    messageDiv.role = 'alert';
    messageDiv.innerHTML = `
        ${text}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Add to page
    const container = document.querySelector('.container') || document.body;
    container.insertBefore(messageDiv, container.firstChild);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 5000);
}

/**
 * Format date for display
 */
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
}

/**
 * Get CSS class for status badge
 */
function getStatusClass(status) {
    const statusMap = {
        'eligible': 'bg-success',
        'ineligible': 'bg-danger',
        'pending': 'bg-warning',
        'temporary': 'bg-info'
    };
    return statusMap[status.toLowerCase()] || 'bg-secondary';
}

/**
 * Validate phone number
 */
function validatePhone(phone) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
}

/**
 * Validate email
 */
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Export functions for testing if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadDonorProfile,
        updateProfile,
        populateProfileForm,
        validatePhone,
        validateEmail
    };
}