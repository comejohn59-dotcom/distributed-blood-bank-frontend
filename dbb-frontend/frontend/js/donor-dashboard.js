// Donor Dashboard Specific JavaScript
document.addEventListener('DOMContentLoaded', function() {
    initializeDonorDashboard();
});

function initializeDonorDashboard() {
    // Initialize availability toggle
    initializeAvailabilityToggle();
    
    // Initialize emergency request notifications
    initializeEmergencyNotifications();
    
    // Initialize achievement animations
    initializeAchievements();
    
    // Initialize timeline animations
    initializeTimeline();
    
    // Initialize profile management
    initializeProfileManagement();
    
    // Initialize notification system
    initializeNotificationSystem();
    
    // Initialize location detection
    initializeLocationDetection();
    
    // Initialize session timeout
    initializeSessionTimeout();
    
    // Update countdown timer
    updateCountdownTimer();
}

// Enhanced Availability Toggle with Location and Preferences
function initializeAvailabilityToggle() {
    const toggle = document.querySelector('#availabilityToggle');
    const label = document.querySelector('.toggle-label');
    
    if (toggle) {
        toggle.addEventListener('change', function() {
            if (this.checked) {
                showAvailabilityModal();
            } else {
                label.textContent = 'Not Available';
                label.style.color = '#ef4444';
                showNotification('You are now unavailable for donations.', 'info');
                updateAvailabilityStatus(false);
            }
        });
    }
}

function showAvailabilityModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Set Availability Preferences</h3>
                <button class="modal-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <form class="availability-form">
                    <div class="form-group">
                        <label>Preferred Hospital/Blood Bank</label>
                        <select class="form-control" name="preferredHospital" required>
                            <option value="">Select preferred location</option>
                            <option value="city-general">City General Hospital (2.3 km)</option>
                            <option value="metro-medical">Metro Medical Center (4.1 km)</option>
                            <option value="community-health">Community Health Center (6.8 km)</option>
                            <option value="regional-hospital">Regional Hospital (8.2 km)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Available Date Range</label>
                        <div class="date-range">
                            <input type="date" class="form-control" name="startDate" min="${new Date().toISOString().split('T')[0]}" required>
                            <span>to</span>
                            <input type="date" class="form-control" name="endDate" min="${new Date().toISOString().split('T')[0]}" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Preferred Time Slots</label>
                        <div class="time-slots">
                            <label class="checkbox-item">
                                <input type="checkbox" name="timeSlots" value="morning">
                                <span>Morning (8 AM - 12 PM)</span>
                            </label>
                            <label class="checkbox-item">
                                <input type="checkbox" name="timeSlots" value="afternoon">
                                <span>Afternoon (12 PM - 5 PM)</span>
                            </label>
                            <label class="checkbox-item">
                                <input type="checkbox" name="timeSlots" value="evening">
                                <span>Evening (5 PM - 8 PM)</span>
                            </label>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Emergency Response</label>
                        <label class="checkbox-item">
                            <input type="checkbox" name="emergencyResponse" checked>
                            <span>Available for emergency calls (24/7)</span>
                        </label>
                    </div>
                    <div class="form-group">
                        <label>Special Notes (Optional)</label>
                        <textarea class="form-control" name="notes" rows="3" placeholder="Any special requirements or preferences..."></textarea>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary modal-cancel">Cancel</button>
                <button class="btn btn-primary modal-confirm">Set Available</button>
            </div>
        </div>
    `;

    showModal(modal, function() {
        const form = modal.querySelector('.availability-form');
        const formData = new FormData(form);
        
        // Update availability status
        updateAvailabilityStatus(true, {
            hospital: formData.get('preferredHospital'),
            startDate: formData.get('startDate'),
            endDate: formData.get('endDate'),
            timeSlots: formData.getAll('timeSlots'),
            emergencyResponse: formData.get('emergencyResponse') === 'on',
            notes: formData.get('notes')
        });
        
        const label = document.querySelector('.toggle-label');
        label.textContent = 'Available to Donate';
        label.style.color = '#10b981';
        showNotification('Availability preferences saved! You are now available for donations.', 'success');
    });
}

function updateAvailabilityStatus(isAvailable, preferences = null) {
    // In a real app, this would update the backend
    const availabilityData = {
        isAvailable,
        preferences,
        timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('donorAvailability', JSON.stringify(availabilityData));
    
    if (isAvailable && preferences) {
        // Show nearby hospitals based on preferences
        showNearbyHospitals(preferences.hospital);
    }
}

// Enhanced Emergency Notifications with Real-time Updates
function initializeEmergencyNotifications() {
    // Check for new emergency requests every 30 seconds
    setInterval(() => {
        if (Math.random() < 0.2) { // 20% chance every 30 seconds
            addNewEmergencyRequest();
        }
    }, 30000);
    
    // Handle emergency action buttons
    document.addEventListener('click', function(e) {
        if (e.target.closest('.emergency-actions .btn')) {
            const btn = e.target.closest('.btn');
            const action = btn.textContent.trim();
            const emergencyItem = btn.closest('.emergency-item');
            
            handleEmergencyAction(action, emergencyItem);
        }
    });
    
    // Load saved emergency preferences
    loadEmergencyPreferences();
}

function handleEmergencyAction(action, emergencyItem) {
    const hospitalName = emergencyItem.querySelector('.emergency-content p strong').textContent;
    
    if (action.includes('Call Hospital')) {
        showNotification('Calling hospital emergency line...', 'info');
        // Simulate phone call
        setTimeout(() => {
            showNotification(`Connected to ${hospitalName}`, 'success');
            showEmergencyResponseModal(hospitalName);
        }, 2000);
    } else if (action.includes('Get Directions')) {
        showNotification(`Opening directions to ${hospitalName}...`, 'info');
        // Would integrate with maps API
        window.open(`https://maps.google.com/maps?q=${encodeURIComponent(hospitalName)}`, '_blank');
    } else if (action.includes('Schedule Visit')) {
        showScheduleModal(hospitalName);
    } else if (action.includes('More Info')) {
        showEmergencyDetailsModal(emergencyItem);
    }
}

function showEmergencyResponseModal(hospitalName) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay emergency-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header emergency-header">
                <div class="emergency-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div>
                    <h3>Emergency Response - ${hospitalName}</h3>
                    <p>Confirm your availability for immediate donation</p>
                </div>
                <button class="modal-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="emergency-warning">
                    <i class="fas fa-clock"></i>
                    <p>This is an urgent request. Patient needs immediate blood transfusion.</p>
                </div>
                <form class="emergency-response-form">
                    <div class="form-group">
                        <label>Can you donate within the next 2 hours?</label>
                        <div class="radio-group">
                            <label class="radio-item">
                                <input type="radio" name="availability" value="immediate" required>
                                <span>Yes, I can come immediately</span>
                            </label>
                            <label class="radio-item">
                                <input type="radio" name="availability" value="within-hour" required>
                                <span>Yes, within 1 hour</span>
                            </label>
                            <label class="radio-item">
                                <input type="radio" name="availability" value="cannot" required>
                                <span>No, I cannot make it</span>
                            </label>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Your Current Location</label>
                        <input type="text" class="form-control" name="currentLocation" placeholder="Enter your current location" required>
                        <button type="button" class="btn btn-outline-primary btn-sm" onclick="detectLocation()">
                            <i class="fas fa-location-arrow"></i>
                            Use Current Location
                        </button>
                    </div>
                    <div class="form-group">
                        <label>Contact Number</label>
                        <input type="tel" class="form-control" name="contactNumber" value="+1 (555) 123-4567" required>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary modal-cancel">Cancel</button>
                <button class="btn btn-danger btn-lg emergency-confirm">
                    <i class="fas fa-heart"></i>
                    Confirm Response
                </button>
            </div>
        </div>
    `;

    showModal(modal, function() {
        const form = modal.querySelector('.emergency-response-form');
        const formData = new FormData(form);
        const availability = formData.get('availability');
        
        if (availability === 'cannot') {
            showNotification('Response recorded. Thank you for your honesty.', 'info');
        } else {
            showNotification('Emergency response confirmed! Hospital has been notified.', 'success');
            // Add to donation history as pending
            addPendingDonation(hospitalName, 'Emergency Response');
        }
    });
}

// Profile Management with Photo Upload
function initializeProfileManagement() {
    // Initialize profile photo upload
    const profileImage = document.querySelector('.profile-image');
    if (profileImage) {
        profileImage.addEventListener('error', function() {
            this.style.display = 'none';
            this.nextElementSibling.style.display = 'flex';
        });
    }
}

function showEditPhotoModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Update Profile Photo</h3>
                <button class="modal-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="photo-upload-section">
                    <div class="current-photo">
                        <img src="https://via.placeholder.com/120x120/dc2626/ffffff?text=JD" alt="Current Photo" class="preview-image">
                    </div>
                    <div class="upload-options">
                        <input type="file" id="photoUpload" accept="image/*" style="display: none;">
                        <button class="btn btn-primary" onclick="document.getElementById('photoUpload').click()">
                            <i class="fas fa-upload"></i>
                            Choose New Photo
                        </button>
                        <button class="btn btn-outline-secondary" onclick="removePhoto()">
                            <i class="fas fa-trash"></i>
                            Remove Photo
                        </button>
                    </div>
                    <div class="upload-guidelines">
                        <h4>Photo Guidelines:</h4>
                        <ul>
                            <li>Use a clear, recent photo of yourself</li>
                            <li>Maximum file size: 5MB</li>
                            <li>Supported formats: JPG, PNG, GIF</li>
                            <li>Square photos work best</li>
                        </ul>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary modal-cancel">Cancel</button>
                <button class="btn btn-primary modal-confirm">Save Photo</button>
            </div>
        </div>
    `;

    // Handle file upload preview
    modal.querySelector('#photoUpload').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                modal.querySelector('.preview-image').src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    showModal(modal, function() {
        showNotification('Profile photo updated successfully!', 'success');
        // Update the main profile image
        const mainProfileImage = document.querySelector('.profile-image');
        const newSrc = modal.querySelector('.preview-image').src;
        if (mainProfileImage && newSrc !== mainProfileImage.src) {
            mainProfileImage.src = newSrc;
        }
    });
}

function showEditProfileModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content large">
            <div class="modal-header">
                <h3>Edit Profile</h3>
                <button class="modal-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <form class="edit-profile-form">
                    <div class="form-section">
                        <h4>Personal Information</h4>
                        <div class="form-row">
                            <div class="form-group">
                                <label>First Name</label>
                                <input type="text" class="form-control" name="firstName" value="John" required>
                            </div>
                            <div class="form-group">
                                <label>Last Name</label>
                                <input type="text" class="form-control" name="lastName" value="Doe" required>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Date of Birth</label>
                                <input type="date" class="form-control" name="dateOfBirth" value="1995-03-15" required>
                            </div>
                            <div class="form-group">
                                <label>Blood Type</label>
                                <select class="form-control" name="bloodType" required>
                                    <option value="O+" selected>O+</option>
                                    <option value="O-">O-</option>
                                    <option value="A+">A+</option>
                                    <option value="A-">A-</option>
                                    <option value="B+">B+</option>
                                    <option value="B-">B-</option>
                                    <option value="AB+">AB+</option>
                                    <option value="AB-">AB-</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-section">
                        <h4>Contact Information</h4>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Email</label>
                                <input type="email" class="form-control" name="email" value="john.doe@email.com" required>
                            </div>
                            <div class="form-group">
                                <label>Phone</label>
                                <input type="tel" class="form-control" name="phone" value="+1 (555) 123-4567" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Address</label>
                            <textarea class="form-control" name="address" rows="3" required>123 Main St, Downtown District, City</textarea>
                        </div>
                        <div class="form-group">
                            <label>Emergency Contact</label>
                            <input type="text" class="form-control" name="emergencyContact" value="Jane Doe - +1 (555) 987-6543" required>
                        </div>
                    </div>
                    
                    <div class="form-section">
                        <h4>Health Information</h4>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Weight (kg)</label>
                                <input type="number" class="form-control" name="weight" value="70" min="50" required>
                            </div>
                            <div class="form-group">
                                <label>Height (cm)</label>
                                <input type="number" class="form-control" name="height" value="175" min="150" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Medical Conditions</label>
                            <textarea class="form-control" name="medicalConditions" rows="2" placeholder="List any medical conditions or medications...">None</textarea>
                        </div>
                        <div class="form-group">
                            <label>Allergies</label>
                            <textarea class="form-control" name="allergies" rows="2" placeholder="List any known allergies...">None</textarea>
                        </div>
                    </div>
                    
                    <div class="form-section">
                        <h4>Notification Preferences</h4>
                        <div class="notification-preferences">
                            <label class="checkbox-item">
                                <input type="checkbox" name="emailNotifications" checked>
                                <span>Email notifications for donation reminders</span>
                            </label>
                            <label class="checkbox-item">
                                <input type="checkbox" name="smsNotifications" checked>
                                <span>SMS notifications for emergency requests</span>
                            </label>
                            <label class="checkbox-item">
                                <input type="checkbox" name="pushNotifications" checked>
                                <span>Push notifications for nearby blood drives</span>
                            </label>
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary modal-cancel">Cancel</button>
                <button class="btn btn-primary modal-confirm">
                    <i class="fas fa-save"></i>
                    Save Changes
                </button>
            </div>
        </div>
    `;

    showModal(modal, function() {
        const form = modal.querySelector('.edit-profile-form');
        const formData = new FormData(form);
        
        // Update profile display
        document.querySelector('.profile-info h2').textContent = 
            `${formData.get('firstName')} ${formData.get('lastName')}`;
        document.querySelector('.blood-group-highlight span').textContent = 
            `${formData.get('bloodType')} Universal Donor`;
        
        showNotification('Profile updated successfully!', 'success');
    });
}

// Add New Emergency Request
function addNewEmergencyRequest() {
    const emergencyList = document.querySelector('.emergency-list');
    if (!emergencyList) return;

    const emergencyTypes = [
        {
            type: 'urgent',
            title: 'Critical: O+ Blood Needed',
            hospital: 'Emergency Medical Center',
            distance: '1.8 km away',
            description: 'Multiple accident victims need immediate blood transfusion',
            time: 'Just now'
        },
        {
            type: 'normal',
            title: 'O+ Blood Stock Critical',
            hospital: 'Regional Blood Bank',
            distance: '3.2 km away',
            description: 'Blood bank critically low on O+ blood supply',
            time: 'Just now'
        }
    ];

    const randomRequest = emergencyTypes[Math.floor(Math.random() * emergencyTypes.length)];
    
    const emergencyItem = document.createElement('div');
    emergencyItem.className = `emergency-item ${randomRequest.type === 'urgent' ? 'urgent' : ''}`;
    emergencyItem.style.opacity = '0';
    emergencyItem.style.transform = 'translateY(-20px)';
    
    emergencyItem.innerHTML = `
        <div class="emergency-icon">
            <i class="fas fa-${randomRequest.type === 'urgent' ? 'exclamation-triangle' : 'hospital'}"></i>
        </div>
        <div class="emergency-content">
            <h4>${randomRequest.title}</h4>
            <p><strong>${randomRequest.hospital}</strong> - ${randomRequest.distance}</p>
            <p>${randomRequest.description}</p>
            <div class="emergency-actions">
                <button class="btn btn-danger btn-sm">
                    <i class="fas fa-phone"></i>
                    Call Hospital
                </button>
                <button class="btn btn-primary btn-sm">
                    <i class="fas fa-directions"></i>
                    Get Directions
                </button>
            </div>
        </div>
        <div class="emergency-time">
            <span>${randomRequest.time}</span>
        </div>
    `;

    // Insert at the beginning
    emergencyList.insertBefore(emergencyItem, emergencyList.firstChild);

    // Animate in
    setTimeout(() => {
        emergencyItem.style.transition = 'all 0.5s ease';
        emergencyItem.style.opacity = '1';
        emergencyItem.style.transform = 'translateY(0)';
    }, 100);

    // Update badge count
    const badge = document.querySelector('.emergency-requests .badge');
    if (badge) {
        const currentCount = parseInt(badge.textContent.match(/\d+/)[0]);
        badge.textContent = `${currentCount + 1} Urgent`;
    }

    // Show notification
    showNotification('New emergency blood request in your area!', 'warning');

    // Remove oldest items if more than 3
    const items = emergencyList.querySelectorAll('.emergency-item');
    if (items.length > 3) {
        items[items.length - 1].remove();
    }
}

// Initialize Achievements
function initializeAchievements() {
    const achievements = document.querySelectorAll('.achievement-item');
    
    achievements.forEach((achievement, index) => {
        // Animate achievements on scroll
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }, index * 200);
                    observer.unobserve(entry.target);
                }
            });
        });
        
        achievement.style.opacity = '0';
        achievement.style.transform = 'translateY(20px)';
        achievement.style.transition = 'all 0.5s ease';
        observer.observe(achievement);
    });

    // Animate progress bars
    const progressBars = document.querySelectorAll('.progress-fill');
    progressBars.forEach(bar => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const width = entry.target.style.width;
                    entry.target.style.width = '0%';
                    setTimeout(() => {
                        entry.target.style.transition = 'width 1.5s ease';
                        entry.target.style.width = width;
                    }, 500);
                    observer.unobserve(entry.target);
                }
            });
        });
        observer.observe(bar);
    });
}

// Initialize Timeline
function initializeTimeline() {
    const timelineItems = document.querySelectorAll('.timeline-item');
    
    timelineItems.forEach((item, index) => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.classList.add('animate-in');
                    }, index * 200);
                    observer.unobserve(entry.target);
                }
            });
        });
        observer.observe(item);
    });
}

// Schedule Modal
function showScheduleModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Schedule Donation</h3>
                <button class="modal-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <form class="schedule-form">
                    <div class="form-group">
                        <label>Preferred Date</label>
                        <input type="date" class="form-control" min="${new Date().toISOString().split('T')[0]}">
                    </div>
                    <div class="form-group">
                        <label>Preferred Time</label>
                        <select class="form-control">
                            <option>9:00 AM - 10:00 AM</option>
                            <option>10:00 AM - 11:00 AM</option>
                            <option>11:00 AM - 12:00 PM</option>
                            <option>2:00 PM - 3:00 PM</option>
                            <option>3:00 PM - 4:00 PM</option>
                            <option>4:00 PM - 5:00 PM</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Location</label>
                        <select class="form-control">
                            <option>City General Hospital</option>
                            <option>Metro Blood Bank</option>
                            <option>Community Health Center</option>
                            <option>Regional Medical Center</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Special Notes (Optional)</label>
                        <textarea class="form-control" rows="3" placeholder="Any special requirements or notes..."></textarea>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary modal-cancel">Cancel</button>
                <button class="btn btn-primary modal-confirm">Schedule Donation</button>
            </div>
        </div>
    `;

    // Add modal styles
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;

    document.body.appendChild(modal);

    // Animate in
    setTimeout(() => {
        modal.style.opacity = '1';
    }, 10);

    // Handle modal actions
    modal.addEventListener('click', function(e) {
        if (e.target === modal || e.target.classList.contains('modal-close') || e.target.classList.contains('modal-cancel')) {
            closeModal();
        } else if (e.target.classList.contains('modal-confirm')) {
            showNotification('Donation scheduled successfully!', 'success');
            closeModal();
        }
    });

    function closeModal() {
        modal.style.opacity = '0';
        setTimeout(() => modal.remove(), 300);
    }
}

// Add custom styles for donor dashboard
const donorStyles = `
    .donor-profile-card {
        background: linear-gradient(135deg, #dc2626, #b91c1c);
        color: white;
        border-radius: 20px;
        padding: 2rem;
        margin-bottom: 2rem;
        box-shadow: 0 20px 40px rgba(220, 38, 38, 0.2);
    }

    .profile-header {
        display: flex;
        align-items: center;
        gap: 2rem;
        margin-bottom: 2rem;
    }

    .profile-avatar {
        width: 80px;
        height: 80px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2rem;
        position: relative;
        overflow: hidden;
    }

    .profile-image {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        object-fit: cover;
    }

    .edit-photo-btn {
        position: absolute;
        bottom: -5px;
        right: -5px;
        width: 30px;
        height: 30px;
        background: #10b981;
        border: 2px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 0.75rem;
        color: white;
        transition: all 0.3s ease;
    }

    .edit-photo-btn:hover {
        background: #059669;
        transform: scale(1.1);
    }

    .contact-info {
        margin-top: 1rem;
        font-size: 0.875rem;
        opacity: 0.9;
    }

    .contact-info p {
        margin-bottom: 0.25rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .contact-info i {
        width: 16px;
    }

    .btn-outline-light {
        border: 2px solid rgba(255, 255, 255, 0.3);
        color: white;
        background: transparent;
        margin-top: 1rem;
    }

    .btn-outline-light:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.5);
    }

    .profile-info h2 {
        margin-bottom: 0.5rem;
        font-size: 1.75rem;
    }

    .blood-group-highlight {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: rgba(255, 255, 255, 0.2);
        padding: 0.5rem 1rem;
        border-radius: 25px;
        margin-top: 1rem;
        font-weight: 600;
    }

    .donation-status {
        margin-left: auto;
    }

    .toggle-switch {
        position: relative;
        display: inline-block;
        width: 60px;
        height: 34px;
    }

    .toggle-switch input {
        opacity: 0;
        width: 0;
        height: 0;
    }

    .toggle-slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(255, 255, 255, 0.3);
        transition: 0.4s;
        border-radius: 34px;
    }

    .toggle-slider:before {
        position: absolute;
        content: "";
        height: 26px;
        width: 26px;
        left: 4px;
        bottom: 4px;
        background-color: white;
        transition: 0.4s;
        border-radius: 50%;
    }

    input:checked + .toggle-slider {
        background-color: #10b981;
    }

    input:checked + .toggle-slider:before {
        transform: translateX(26px);
    }

    .toggle-label {
        display: block;
        margin-top: 0.5rem;
        font-weight: 500;
        color: #10b981;
    }

    .profile-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 2rem;
    }

    .stat-item {
        text-align: center;
    }

    .stat-value {
        font-size: 2rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
    }

    .stat-label {
        font-size: 0.875rem;
        opacity: 0.9;
    }

    .eligibility-card, .emergency-requests, .donation-history, .achievements-card {
        background: white;
        border-radius: 16px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        margin-bottom: 2rem;
        border: 1px solid #e5e7eb;
    }

    .eligibility-content {
        padding: 1.5rem;
    }

    .eligibility-item {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1rem;
    }

    .text-success {
        color: #10b981;
    }

    .next-donation {
        margin-top: 1.5rem;
        padding-top: 1.5rem;
        border-top: 1px solid #e5e7eb;
    }

    .emergency-list {
        padding: 1.5rem;
    }

    .emergency-item {
        display: flex;
        gap: 1rem;
        padding: 1.5rem;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        margin-bottom: 1rem;
        transition: all 0.3s ease;
    }

    .emergency-item:hover {
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
    }

    .emergency-item.urgent {
        border-color: #ef4444;
        background: rgba(239, 68, 68, 0.02);
    }

    .emergency-icon {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #fee2e2;
        color: #dc2626;
        font-size: 1.25rem;
    }

    .emergency-item.urgent .emergency-icon {
        background: #fef2f2;
        color: #ef4444;
        animation: pulse 2s infinite;
    }

    .emergency-content {
        flex: 1;
    }

    .emergency-content h4 {
        margin-bottom: 0.5rem;
        color: #1f2937;
    }

    .emergency-actions {
        margin-top: 1rem;
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
    }

    .emergency-time {
        text-align: right;
        font-size: 0.75rem;
        color: #6b7280;
    }

    .timeline {
        padding: 1.5rem;
    }

    .timeline-item {
        display: flex;
        gap: 1rem;
        margin-bottom: 2rem;
        opacity: 0;
        transform: translateX(-20px);
        transition: all 0.5s ease;
    }

    .timeline-item.animate-in {
        opacity: 1;
        transform: translateX(0);
    }

    .timeline-marker {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 1rem;
        position: relative;
    }

    .timeline-marker.success {
        background: #10b981;
    }

    .timeline-marker::after {
        content: '';
        position: absolute;
        top: 40px;
        left: 50%;
        transform: translateX(-50%);
        width: 2px;
        height: 60px;
        background: #e5e7eb;
    }

    .timeline-item:last-child .timeline-marker::after {
        display: none;
    }

    .timeline-content {
        flex: 1;
        padding-top: 0.25rem;
    }

    .timeline-content h4 {
        margin-bottom: 0.5rem;
        color: #1f2937;
    }

    .timeline-date {
        font-size: 0.875rem;
        color: #6b7280;
    }

    .timeline-status {
        padding-top: 0.25rem;
    }

    .achievements-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1.5rem;
        padding: 1.5rem;
    }

    .achievement-item {
        text-align: center;
        padding: 1.5rem;
        border-radius: 12px;
        border: 2px solid #e5e7eb;
        transition: all 0.3s ease;
    }

    .achievement-item.earned {
        border-color: #10b981;
        background: rgba(16, 185, 129, 0.05);
    }

    .achievement-item:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    }

    .achievement-icon {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 1rem;
        font-size: 1.5rem;
        background: #f3f4f6;
        color: #6b7280;
    }

    .achievement-item.earned .achievement-icon {
        background: #10b981;
        color: white;
    }

    .progress-bar {
        width: 100%;
        height: 8px;
        background: #e5e7eb;
        border-radius: 4px;
        margin: 1rem 0 0.5rem;
        overflow: hidden;
    }

    .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #dc2626, #ef4444);
        border-radius: 4px;
        transition: width 0.3s ease;
    }

    .progress-text {
        font-size: 0.75rem;
        color: #6b7280;
        font-weight: 600;
    }

    .modal-content {
        background: white;
        border-radius: 16px;
        max-width: 500px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
    }

    .modal-header {
        padding: 1.5rem;
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .modal-close {
        background: none;
        border: none;
        font-size: 1.25rem;
        cursor: pointer;
        color: #6b7280;
    }

    .modal-body {
        padding: 1.5rem;
    }

    .form-group {
        margin-bottom: 1.5rem;
    }

    .form-group label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 600;
        color: #374151;
    }

    .form-control {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        font-size: 1rem;
        transition: border-color 0.3s ease;
    }

    .form-control:focus {
        outline: none;
        border-color: #dc2626;
        box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
    }

    .modal-footer {
        padding: 1.5rem;
        border-top: 1px solid #e5e7eb;
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
    }

    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
    }

    @media (max-width: 768px) {
        .profile-header {
            flex-direction: column;
            text-align: center;
            gap: 1rem;
        }

        .donation-status {
            margin-left: 0;
        }

        .emergency-item {
            flex-direction: column;
        }

        .emergency-time {
            text-align: left;
        }

        .achievements-grid {
            grid-template-columns: 1fr;
        }
    }
`;

// Add styles to head
const styleSheet = document.createElement('style');
styleSheet.textContent = donorStyles;
document.head.appendChild(styleSheet);

// Notification System with Email/SMS Reminders
function initializeNotificationSystem() {
    // Check for upcoming donation reminders
    checkUpcomingDonations();
    
    // Set up periodic reminder checks
    setInterval(checkUpcomingDonations, 3600000); // Check every hour
    
    // Load notification preferences
    loadNotificationPreferences();
}

function checkUpcomingDonations() {
    const scheduledDonations = getScheduledDonations();
    const now = new Date();
    
    scheduledDonations.forEach(donation => {
        const donationDate = new Date(donation.date);
        const timeDiff = donationDate.getTime() - now.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
        
        if (daysDiff === 1) {
            showNotification(`Reminder: You have a donation scheduled tomorrow at ${donation.hospital}`, 'info');
            sendEmailReminder(donation);
        } else if (daysDiff === 0 && timeDiff > 0) {
            const hoursDiff = Math.ceil(timeDiff / (1000 * 3600));
            if (hoursDiff <= 2) {
                showNotification(`Reminder: Your donation is in ${hoursDiff} hour(s) at ${donation.hospital}`, 'warning');
                sendSMSReminder(donation);
            }
        }
    });
}

function sendEmailReminder(donation) {
    // Simulate email sending
    console.log(`Email reminder sent for donation at ${donation.hospital} on ${donation.date}`);
}

function sendSMSReminder(donation) {
    // Simulate SMS sending
    console.log(`SMS reminder sent for donation at ${donation.hospital}`);
}

// Location Detection and Nearby Hospitals
function initializeLocationDetection() {
    // Auto-detect location if permission granted
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const { latitude, longitude } = position.coords;
                updateNearbyHospitals(latitude, longitude);
            },
            error => {
                console.log('Location access denied or unavailable');
            }
        );
    }
}

function detectLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const { latitude, longitude } = position.coords;
                // Reverse geocoding would happen here
                const locationInput = document.querySelector('input[name="currentLocation"]');
                if (locationInput) {
                    locationInput.value = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
                }
                showNotification('Location detected successfully!', 'success');
            },
            error => {
                showNotification('Unable to detect location. Please enter manually.', 'warning');
            }
        );
    }
}

function showNearbyHospitals(preferredHospital = null) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content large">
            <div class="modal-header">
                <h3>Nearby Donation Centers</h3>
                <button class="modal-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="hospitals-grid">
                    <div class="hospital-card ${preferredHospital === 'city-general' ? 'preferred' : ''}">
                        <div class="hospital-header">
                            <div class="hospital-icon">
                                <i class="fas fa-hospital"></i>
                            </div>
                            <div class="hospital-info">
                                <h4>City General Hospital</h4>
                                <p>Level 1 Trauma Center</p>
                                <div class="hospital-distance">
                                    <i class="fas fa-map-marker-alt"></i>
                                    <span>2.3 km away</span>
                                </div>
                            </div>
                            <div class="hospital-status available">
                                <span>Open</span>
                            </div>
                        </div>
                        <div class="hospital-details">
                            <div class="detail-item">
                                <i class="fas fa-phone"></i>
                                <span>+1 (555) 123-4567</span>
                            </div>
                            <div class="detail-item">
                                <i class="fas fa-clock"></i>
                                <span>24/7 Emergency</span>
                            </div>
                            <div class="detail-item">
                                <i class="fas fa-calendar"></i>
                                <span>Next available: Today 2 PM</span>
                            </div>
                        </div>
                        <div class="hospital-actions">
                            <button class="btn btn-primary btn-sm" onclick="scheduleAtHospital('City General Hospital')">
                                <i class="fas fa-calendar-plus"></i>
                                Schedule Here
                            </button>
                            <button class="btn btn-outline-primary btn-sm" onclick="getDirections('City General Hospital')">
                                <i class="fas fa-directions"></i>
                                Directions
                            </button>
                        </div>
                    </div>
                    
                    <div class="hospital-card ${preferredHospital === 'metro-medical' ? 'preferred' : ''}">
                        <div class="hospital-header">
                            <div class="hospital-icon">
                                <i class="fas fa-hospital"></i>
                            </div>
                            <div class="hospital-info">
                                <h4>Metro Medical Center</h4>
                                <p>Specialized Blood Bank</p>
                                <div class="hospital-distance">
                                    <i class="fas fa-map-marker-alt"></i>
                                    <span>4.1 km away</span>
                                </div>
                            </div>
                            <div class="hospital-status available">
                                <span>Open</span>
                            </div>
                        </div>
                        <div class="hospital-details">
                            <div class="detail-item">
                                <i class="fas fa-phone"></i>
                                <span>+1 (555) 987-6543</span>
                            </div>
                            <div class="detail-item">
                                <i class="fas fa-clock"></i>
                                <span>8 AM - 8 PM</span>
                            </div>
                            <div class="detail-item">
                                <i class="fas fa-calendar"></i>
                                <span>Next available: Tomorrow 10 AM</span>
                            </div>
                        </div>
                        <div class="hospital-actions">
                            <button class="btn btn-primary btn-sm" onclick="scheduleAtHospital('Metro Medical Center')">
                                <i class="fas fa-calendar-plus"></i>
                                Schedule Here
                            </button>
                            <button class="btn btn-outline-primary btn-sm" onclick="getDirections('Metro Medical Center')">
                                <i class="fas fa-directions"></i>
                                Directions
                            </button>
                        </div>
                    </div>
                    
                    <div class="hospital-card ${preferredHospital === 'community-health' ? 'preferred' : ''}">
                        <div class="hospital-header">
                            <div class="hospital-icon">
                                <i class="fas fa-hospital"></i>
                            </div>
                            <div class="hospital-info">
                                <h4>Community Health Center</h4>
                                <p>Community Blood Drive</p>
                                <div class="hospital-distance">
                                    <i class="fas fa-map-marker-alt"></i>
                                    <span>6.8 km away</span>
                                </div>
                            </div>
                            <div class="hospital-status limited">
                                <span>Drive Days Only</span>
                            </div>
                        </div>
                        <div class="hospital-details">
                            <div class="detail-item">
                                <i class="fas fa-phone"></i>
                                <span>+1 (555) 456-7890</span>
                            </div>
                            <div class="detail-item">
                                <i class="fas fa-clock"></i>
                                <span>Drive: Sat 9 AM - 4 PM</span>
                            </div>
                            <div class="detail-item">
                                <i class="fas fa-gift"></i>
                                <span>Bonus: +50 points</span>
                            </div>
                        </div>
                        <div class="hospital-actions">
                            <button class="btn btn-primary btn-sm" onclick="scheduleAtHospital('Community Health Center')">
                                <i class="fas fa-calendar-plus"></i>
                                Join Drive
                            </button>
                            <button class="btn btn-outline-primary btn-sm" onclick="getDirections('Community Health Center')">
                                <i class="fas fa-directions"></i>
                                Directions
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary modal-close">Close</button>
            </div>
        </div>
    `;

    showModal(modal);
}

// Pre-Donation Checklist
function showPreDonationChecklist() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Pre-Donation Checklist</h3>
                <button class="modal-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="checklist-section">
                    <h4>24 Hours Before Donation</h4>
                    <div class="checklist-items">
                        <label class="checklist-item">
                            <input type="checkbox">
                            <span>Get a good night's sleep (7-8 hours)</span>
                        </label>
                        <label class="checklist-item">
                            <input type="checkbox">
                            <span>Eat iron-rich foods (spinach, red meat, beans)</span>
                        </label>
                        <label class="checklist-item">
                            <input type="checkbox">
                            <span>Stay well hydrated</span>
                        </label>
                        <label class="checklist-item">
                            <input type="checkbox">
                            <span>Avoid alcohol consumption</span>
                        </label>
                    </div>
                </div>
                
                <div class="checklist-section">
                    <h4>Day of Donation</h4>
                    <div class="checklist-items">
                        <label class="checklist-item">
                            <input type="checkbox">
                            <span>Eat a healthy breakfast/meal</span>
                        </label>
                        <label class="checklist-item">
                            <input type="checkbox">
                            <span>Drink extra fluids (16 oz of water)</span>
                        </label>
                        <label class="checklist-item">
                            <input type="checkbox">
                            <span>Bring valid ID and donor card</span>
                        </label>
                        <label class="checklist-item">
                            <input type="checkbox">
                            <span>Wear comfortable clothing</span>
                        </label>
                        <label class="checklist-item">
                            <input type="checkbox">
                            <span>List any medications you're taking</span>
                        </label>
                    </div>
                </div>
                
                <div class="checklist-section">
                    <h4>After Donation</h4>
                    <div class="checklist-items">
                        <label class="checklist-item">
                            <input type="checkbox">
                            <span>Rest for 10-15 minutes</span>
                        </label>
                        <label class="checklist-item">
                            <input type="checkbox">
                            <span>Drink plenty of fluids</span>
                        </label>
                        <label class="checklist-item">
                            <input type="checkbox">
                            <span>Avoid heavy lifting for 24 hours</span>
                        </label>
                        <label class="checklist-item">
                            <input type="checkbox">
                            <span>Eat iron-rich foods for next few days</span>
                        </label>
                    </div>
                </div>
                
                <div class="health-tips">
                    <h4>Health Tips</h4>
                    <div class="tip-item">
                        <i class="fas fa-lightbulb"></i>
                        <p>If you feel dizzy or lightheaded, sit down immediately and inform staff</p>
                    </div>
                    <div class="tip-item">
                        <i class="fas fa-phone"></i>
                        <p>Contact the donation center if you experience any unusual symptoms</p>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary modal-close">Close</button>
                <button class="btn btn-primary" onclick="printChecklist()">
                    <i class="fas fa-print"></i>
                    Print Checklist
                </button>
            </div>
        </div>
    `;

    showModal(modal);
}

// Download History Functions
function downloadHistory() {
    showNotification('Generating PDF history report...', 'info');
    
    // Simulate PDF generation
    setTimeout(() => {
        showNotification('Donation history PDF downloaded successfully!', 'success');
        // In a real app, this would generate and download a PDF
        console.log('PDF download would happen here');
    }, 2000);
}

function downloadHistoryCSV() {
    showNotification('Generating CSV export...', 'info');
    
    // Simulate CSV generation
    setTimeout(() => {
        const csvContent = generateCSVContent();
        downloadCSVFile(csvContent, 'donation-history.csv');
        showNotification('Donation history CSV exported successfully!', 'success');
    }, 1500);
}

function generateCSVContent() {
    const donations = [
        ['Date', 'Hospital', 'Type', 'Volume', 'Status', 'Hemoglobin'],
        ['2024-10-20', 'City General Hospital', 'Regular', '450ml', 'Completed', '14.2 g/dL'],
        ['2024-08-15', 'Metro Blood Bank', 'Emergency', '450ml', 'Completed', '13.8 g/dL'],
        ['2024-06-10', 'Community Health Center', 'Drive', '450ml', 'Completed', '14.0 g/dL'],
        ['2024-05-05', 'Regional Medical Center', 'Scheduled', '0ml', 'Cancelled', '11.8 g/dL']
    ];
    
    return donations.map(row => row.join(',')).join('\n');
}

function downloadCSVFile(content, filename) {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Impact Stories and Certificates
function viewDonationCertificate(donationId) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content certificate-modal">
            <div class="modal-header">
                <h3>Donation Certificate</h3>
                <button class="modal-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="certificate">
                    <div class="certificate-header">
                        <div class="certificate-logo">
                            <i class="fas fa-tint"></i>
                        </div>
                        <h2>BloodConnect</h2>
                        <h3>Certificate of Donation</h3>
                    </div>
                    <div class="certificate-content">
                        <p>This certifies that</p>
                        <h4>John Doe</h4>
                        <p>has generously donated blood on</p>
                        <h4>October 20, 2024</h4>
                        <p>at City General Hospital</p>
                        <div class="certificate-details">
                            <p><strong>Donation ID:</strong> ${donationId}</p>
                            <p><strong>Blood Type:</strong> O+</p>
                            <p><strong>Volume:</strong> 450ml</p>
                        </div>
                        <p class="certificate-message">
                            Your generous donation has the potential to save up to 3 lives.
                            Thank you for being a hero in our community.
                        </p>
                    </div>
                    <div class="certificate-footer">
                        <div class="signature">
                            <p>Dr. Sarah Johnson</p>
                            <p>Medical Director</p>
                        </div>
                        <div class="certificate-seal">
                            <i class="fas fa-certificate"></i>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary modal-close">Close</button>
                <button class="btn btn-primary" onclick="printCertificate()">
                    <i class="fas fa-print"></i>
                    Print Certificate
                </button>
                <button class="btn btn-outline-primary" onclick="downloadCertificate('${donationId}')">
                    <i class="fas fa-download"></i>
                    Download PDF
                </button>
            </div>
        </div>
    `;

    showModal(modal);
}

function viewImpactStory(donationId) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Your Impact Story</h3>
                <button class="modal-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="impact-story">
                    <div class="story-header">
                        <div class="story-icon">
                            <i class="fas fa-heart"></i>
                        </div>
                        <h4>Emergency Response - August 15, 2024</h4>
                    </div>
                    <div class="story-content">
                        <p>Your emergency donation on August 15th helped save the lives of two accident victims who were brought to Metro Blood Bank in critical condition.</p>
                        
                        <div class="story-details">
                            <div class="detail-card">
                                <h5>Patient 1</h5>
                                <p><strong>Age:</strong> 34 years old</p>
                                <p><strong>Condition:</strong> Severe blood loss from trauma</p>
                                <p><strong>Outcome:</strong> Fully recovered, discharged after 5 days</p>
                            </div>
                            <div class="detail-card">
                                <h5>Patient 2</h5>
                                <p><strong>Age:</strong> 28 years old</p>
                                <p><strong>Condition:</strong> Internal bleeding</p>
                                <p><strong>Outcome:</strong> Successful surgery, recovering well</p>
                            </div>
                        </div>
                        
                        <div class="gratitude-message">
                            <blockquote>
                                "We cannot thank you enough for your immediate response. Your donation arrived just in time and made all the difference in saving these lives."
                            </blockquote>
                            <cite>- Dr. Michael Chen, Emergency Department</cite>
                        </div>
                        
                        <div class="impact-stats">
                            <div class="stat">
                                <span class="number">2</span>
                                <span class="label">Lives Saved</span>
                            </div>
                            <div class="stat">
                                <span class="number">15</span>
                                <span class="label">Minutes Response Time</span>
                            </div>
                            <div class="stat">
                                <span class="number">450ml</span>
                                <span class="label">Blood Donated</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary modal-close">Close</button>
                <button class="btn btn-primary" onclick="shareImpactStory('${donationId}')">
                    <i class="fas fa-share"></i>
                    Share Story
                </button>
            </div>
        </div>
    `;

    showModal(modal);
}

// Session Timeout for Security
function initializeSessionTimeout() {
    let sessionTimeout;
    const timeoutDuration = 30 * 60 * 1000; // 30 minutes
    
    function resetSessionTimeout() {
        clearTimeout(sessionTimeout);
        sessionTimeout = setTimeout(() => {
            showSessionTimeoutWarning();
        }, timeoutDuration);
    }
    
    // Reset timeout on user activity
    document.addEventListener('click', resetSessionTimeout);
    document.addEventListener('keypress', resetSessionTimeout);
    document.addEventListener('scroll', resetSessionTimeout);
    
    // Initialize timeout
    resetSessionTimeout();
}

function showSessionTimeoutWarning() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay session-timeout-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Session Timeout Warning</h3>
            </div>
            <div class="modal-body">
                <div class="timeout-warning">
                    <i class="fas fa-clock"></i>
                    <p>Your session will expire in <span id="countdown">60</span> seconds due to inactivity.</p>
                    <p>Click "Stay Logged In" to continue your session.</p>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="logoutUser()">Logout</button>
                <button class="btn btn-primary" onclick="extendSession()">Stay Logged In</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    
    // Countdown timer
    let countdown = 60;
    const countdownElement = modal.querySelector('#countdown');
    const countdownInterval = setInterval(() => {
        countdown--;
        countdownElement.textContent = countdown;
        if (countdown <= 0) {
            clearInterval(countdownInterval);
            logoutUser();
        }
    }, 1000);
    
    // Handle actions
    modal.querySelector('.btn-primary').addEventListener('click', () => {
        clearInterval(countdownInterval);
        modal.remove();
        initializeSessionTimeout(); // Restart timeout
        showNotification('Session extended successfully!', 'success');
    });
    
    modal.querySelector('.btn-secondary').addEventListener('click', () => {
        clearInterval(countdownInterval);
        modal.remove();
        logoutUser();
    });
}

function extendSession() {
    // This would make an API call to extend the session
    console.log('Session extended');
}

function logoutUser() {
    showNotification('Session expired. Logging out...', 'info');
    setTimeout(() => {
        window.location.href = '../index.html';
    }, 2000);
}

// Countdown Timer for Next Donation
function updateCountdownTimer() {
    const countdownElement = document.querySelector('.countdown-number');
    if (!countdownElement) return;
    
    // Calculate days until next eligible donation (56 days after last donation)
    const lastDonationDate = new Date('2024-10-20');
    const nextEligibleDate = new Date(lastDonationDate);
    nextEligibleDate.setDate(nextEligibleDate.getDate() + 56);
    
    const now = new Date();
    const timeDiff = nextEligibleDate.getTime() - now.getTime();
    const daysDiff = Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));
    
    countdownElement.textContent = daysDiff;
    
    if (daysDiff === 0) {
        document.querySelector('.countdown-label').textContent = 'Ready Now!';
        countdownElement.style.color = '#10b981';
    }
}

// Utility Functions
function getScheduledDonations() {
    // Mock data - in real app, this would come from backend
    return [
        {
            id: 'SCH-001',
            date: '2024-12-28',
            time: '10:00 AM',
            hospital: 'City General Hospital'
        }
    ];
}

function loadNotificationPreferences() {
    const preferences = localStorage.getItem('notificationPreferences');
    if (preferences) {
        const prefs = JSON.parse(preferences);
        // Apply preferences to UI
        console.log('Loaded notification preferences:', prefs);
    }
}

function loadEmergencyPreferences() {
    const preferences = localStorage.getItem('emergencyPreferences');
    if (preferences) {
        const prefs = JSON.parse(preferences);
        // Apply emergency response preferences
        console.log('Loaded emergency preferences:', prefs);
    }
}

function addPendingDonation(hospital, type) {
    // Add to pending donations list
    const pendingDonations = JSON.parse(localStorage.getItem('pendingDonations') || '[]');
    pendingDonations.push({
        id: 'PEND-' + Date.now(),
        hospital,
        type,
        date: new Date().toISOString(),
        status: 'pending'
    });
    localStorage.setItem('pendingDonations', JSON.stringify(pendingDonations));
}

function scheduleAtHospital(hospitalName) {
    showScheduleModal(hospitalName);
}

function getDirections(hospitalName) {
    const encodedHospital = encodeURIComponent(hospitalName);
    window.open(`https://maps.google.com/maps?q=${encodedHospital}`, '_blank');
}

function printChecklist() {
    window.print();
}

function printCertificate() {
    window.print();
}

function downloadCertificate(donationId) {
    showNotification(`Downloading certificate for ${donationId}...`, 'info');
    // Would generate and download PDF certificate
}

function shareImpactStory(donationId) {
    if (navigator.share) {
        navigator.share({
            title: 'My Blood Donation Impact',
            text: 'I helped save lives through blood donation!',
            url: window.location.href
        });
    } else {
        // Fallback for browsers without Web Share API
        const shareText = 'I helped save lives through blood donation with BloodConnect!';
        navigator.clipboard.writeText(shareText);
        showNotification('Impact story copied to clipboard!', 'success');
    }
}

function viewHealthTips() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Health Tips for Donors</h3>
                <button class="modal-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="health-tips-content">
                    <div class="tip-section">
                        <h4>Increasing Hemoglobin Levels</h4>
                        <ul>
                            <li>Eat iron-rich foods: red meat, spinach, lentils, tofu</li>
                            <li>Include vitamin C: citrus fruits, tomatoes, bell peppers</li>
                            <li>Avoid tea/coffee with meals (reduces iron absorption)</li>
                            <li>Consider iron supplements (consult your doctor)</li>
                        </ul>
                    </div>
                    <div class="tip-section">
                        <h4>General Health for Donors</h4>
                        <ul>
                            <li>Stay well hydrated (8-10 glasses of water daily)</li>
                            <li>Get adequate sleep (7-8 hours per night)</li>
                            <li>Exercise regularly but avoid intense workouts before donation</li>
                            <li>Maintain a balanced diet with adequate protein</li>
                        </ul>
                    </div>
                    <div class="tip-section">
                        <h4>When to Avoid Donating</h4>
                        <ul>
                            <li>If you're feeling unwell or have a fever</li>
                            <li>Recent dental work or surgery</li>
                            <li>Taking certain medications</li>
                            <li>Recent travel to malaria-endemic areas</li>
                        </ul>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary modal-close">Close</button>
                <button class="btn btn-primary" onclick="scheduleHealthConsultation()">
                    <i class="fas fa-user-md"></i>
                    Schedule Consultation
                </button>
            </div>
        </div>
    `;

    showModal(modal);
}

function scheduleHealthConsultation() {
    showNotification('Health consultation request sent to medical team!', 'success');
    // Would integrate with healthcare provider scheduling system
}
// Add enhanced styles to head
const enhancedDonorStyles = `
    .eligibility-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
        margin-bottom: 2rem;
    }

    .eligibility-section h4 {
        margin-bottom: 1rem;
        color: #1f2937;
        font-weight: 600;
        border-bottom: 1px solid #e5e7eb;
        padding-bottom: 0.5rem;
    }

    .next-donation-info {
        text-align: center;
    }

    .countdown-circle {
        width: 120px;
        height: 120px;
        border: 8px solid #e5e7eb;
        border-top: 8px solid #10b981;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 1rem;
        animation: spin 10s linear infinite;
    }

    .countdown-text {
        text-align: center;
    }

    .countdown-number {
        display: block;
        font-size: 2rem;
        font-weight: 700;
        color: #10b981;
    }

    .countdown-label {
        font-size: 0.75rem;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .donation-actions {
        display: flex;
        gap: 1rem;
        justify-content: center;
        flex-wrap: wrap;
        margin-top: 2rem;
        padding-top: 2rem;
        border-top: 1px solid #e5e7eb;
    }

    /* Enhanced Timeline */
    .header-actions {
        display: flex;
        gap: 0.5rem;
        align-items: center;
    }

    .donation-details {
        display: flex;
        gap: 0.5rem;
        margin: 0.5rem 0;
        flex-wrap: wrap;
    }

    .detail-badge {
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 600;
        background: #f3f4f6;
        color: #374151;
    }

    .detail-badge.emergency {
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;
    }

    .detail-badge.cancelled {
        background: rgba(107, 114, 128, 0.1);
        color: #6b7280;
    }

    .timeline-marker.cancelled {
        background: #6b7280;
    }

    .timeline-actions {
        display: flex;
        gap: 0.5rem;
        margin-top: 0.5rem;
        flex-wrap: wrap;
    }

    /* Impact Tracking */
    .impact-tracking-card {
        background: white;
        border-radius: 16px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        margin-bottom: 2rem;
        border: 1px solid #e5e7eb;
    }

    .impact-content {
        padding: 2rem;
    }

    .impact-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1.5rem;
        margin-bottom: 2rem;
    }

    .impact-item {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1.5rem;
        border: 2px solid #e5e7eb;
        border-radius: 12px;
        transition: all 0.3s ease;
    }

    .impact-item:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        border-color: #10b981;
    }

    .impact-icon {
        width: 60px;
        height: 60px;
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
    }

    .impact-details h4 {
        margin-bottom: 0.5rem;
        color: #1f2937;
    }

    .impact-number {
        font-size: 1.5rem;
        font-weight: 700;
        color: #10b981;
        margin-bottom: 0.25rem;
    }

    .impact-description {
        font-size: 0.875rem;
        color: #6b7280;
    }

    .impact-stories {
        border-top: 1px solid #e5e7eb;
        padding-top: 2rem;
    }

    .story-item {
        display: flex;
        gap: 1rem;
        margin-bottom: 1.5rem;
        padding: 1rem;
        background: #f9fafb;
        border-radius: 8px;
    }

    .story-icon {
        width: 40px;
        height: 40px;
        background: #dc2626;
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    .story-content blockquote {
        font-style: italic;
        margin-bottom: 0.5rem;
        color: #374151;
    }

    .story-author {
        font-size: 0.875rem;
        color: #6b7280;
        font-weight: 500;
    }

    /* Enhanced Achievements */
    .achievement-progress {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .level-progress {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex: 1;
    }

    .achievement-date {
        font-size: 0.75rem;
        color: #10b981;
        margin-top: 0.5rem;
        font-weight: 500;
    }

    /* Modal Enhancements */
    .modal-content.large {
        max-width: 800px;
        width: 95%;
    }

    .modal-content.certificate-modal {
        max-width: 600px;
    }

    .date-range {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .date-range span {
        color: #6b7280;
        font-weight: 500;
    }

    .time-slots, .notification-preferences {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .checkbox-item, .radio-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        cursor: pointer;
        padding: 0.5rem;
        border-radius: 6px;
        transition: background-color 0.3s ease;
    }

    .checkbox-item:hover, .radio-item:hover {
        background: #f9fafb;
    }

    .radio-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .form-section {
        margin-bottom: 2rem;
        padding-bottom: 1.5rem;
        border-bottom: 1px solid #e5e7eb;
    }

    .form-section:last-child {
        border-bottom: none;
        margin-bottom: 0;
        padding-bottom: 0;
    }

    .form-section h4 {
        margin-bottom: 1rem;
        color: #1f2937;
        font-weight: 600;
    }

    .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
        margin-bottom: 1rem;
    }

    /* Hospital Cards */
    .hospitals-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
        gap: 1.5rem;
    }

    .hospital-card {
        border: 2px solid #e5e7eb;
        border-radius: 12px;
        padding: 1.5rem;
        transition: all 0.3s ease;
    }

    .hospital-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    }

    .hospital-card.preferred {
        border-color: #10b981;
        background: rgba(16, 185, 129, 0.02);
    }

    .hospital-header {
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;
        align-items: flex-start;
    }

    .hospital-icon {
        width: 50px;
        height: 50px;
        background: #3b82f6;
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.25rem;
        flex-shrink: 0;
    }

    .hospital-info {
        flex: 1;
    }

    .hospital-info h4 {
        margin-bottom: 0.25rem;
        color: #1f2937;
    }

    .hospital-info p {
        color: #6b7280;
        font-size: 0.875rem;
        margin-bottom: 0.5rem;
    }

    .hospital-distance {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #9ca3af;
        font-size: 0.875rem;
    }

    .hospital-status {
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
    }

    .hospital-status.available {
        background: rgba(16, 185, 129, 0.1);
        color: #10b981;
    }

    .hospital-status.limited {
        background: rgba(245, 158, 11, 0.1);
        color: #f59e0b;
    }

    .hospital-details {
        margin-bottom: 1rem;
    }

    .detail-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 0.5rem;
        font-size: 0.875rem;
        color: #4b5563;
    }

    .detail-item i {
        color: #6b7280;
        width: 16px;
    }

    .hospital-actions {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
    }

    /* Checklist Styles */
    .checklist-section {
        margin-bottom: 2rem;
    }

    .checklist-section h4 {
        margin-bottom: 1rem;
        color: #1f2937;
        font-weight: 600;
        border-bottom: 1px solid #e5e7eb;
        padding-bottom: 0.5rem;
    }

    .checklist-items {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .checklist-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        cursor: pointer;
        padding: 0.5rem;
        border-radius: 6px;
        transition: background-color 0.3s ease;
    }

    .checklist-item:hover {
        background: #f9fafb;
    }

    .checklist-item input[type="checkbox"]:checked + span {
        text-decoration: line-through;
        color: #10b981;
    }

    .health-tips {
        background: #f0f9ff;
        border: 1px solid #bae6fd;
        border-radius: 8px;
        padding: 1.5rem;
        margin-top: 2rem;
    }

    .health-tips h4 {
        margin-bottom: 1rem;
        color: #0369a1;
    }

    .tip-item {
        display: flex;
        align-items: flex-start;
        gap: 1rem;
        margin-bottom: 1rem;
    }

    .tip-item:last-child {
        margin-bottom: 0;
    }

    .tip-item i {
        color: #0369a1;
        margin-top: 0.25rem;
    }

    /* Certificate Styles */
    .certificate {
        background: white;
        border: 2px solid #dc2626;
        border-radius: 12px;
        padding: 2rem;
        text-align: center;
        font-family: serif;
    }

    .certificate-header {
        margin-bottom: 2rem;
    }

    .certificate-logo {
        width: 80px;
        height: 80px;
        background: #dc2626;
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2rem;
        margin: 0 auto 1rem;
    }

    .certificate h2 {
        color: #dc2626;
        margin-bottom: 0.5rem;
    }

    .certificate h3 {
        color: #374151;
        margin-bottom: 0;
    }

    .certificate-content h4 {
        color: #dc2626;
        font-size: 1.5rem;
        margin: 1rem 0;
    }

    .certificate-details {
        background: #f9fafb;
        border-radius: 8px;
        padding: 1rem;
        margin: 1.5rem 0;
        text-align: left;
    }

    .certificate-message {
        font-style: italic;
        color: #374151;
        margin: 1.5rem 0;
        font-size: 1.1rem;
    }

    .certificate-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 2rem;
        padding-top: 1rem;
        border-top: 1px solid #e5e7eb;
    }

    .signature {
        text-align: left;
    }

    .certificate-seal {
        font-size: 3rem;
        color: #dc2626;
    }

    /* Impact Story Styles */
    .impact-story {
        max-width: 600px;
        margin: 0 auto;
    }

    .story-header {
        text-align: center;
        margin-bottom: 2rem;
    }

    .story-header .story-icon {
        width: 80px;
        height: 80px;
        background: #dc2626;
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2rem;
        margin: 0 auto 1rem;
    }

    .story-details {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
        margin: 2rem 0;
    }

    .detail-card {
        background: #f9fafb;
        border-radius: 8px;
        padding: 1.5rem;
        border-left: 4px solid #10b981;
    }

    .detail-card h5 {
        color: #10b981;
        margin-bottom: 1rem;
    }

    .gratitude-message {
        background: #fef7f0;
        border-left: 4px solid #f59e0b;
        padding: 1.5rem;
        margin: 2rem 0;
        border-radius: 0 8px 8px 0;
    }

    .gratitude-message blockquote {
        font-style: italic;
        margin-bottom: 1rem;
        color: #92400e;
    }

    .gratitude-message cite {
        color: #78350f;
        font-weight: 500;
    }

    .impact-stats {
        display: flex;
        justify-content: space-around;
        margin-top: 2rem;
        padding-top: 2rem;
        border-top: 1px solid #e5e7eb;
    }

    .impact-stats .stat {
        text-align: center;
    }

    .impact-stats .number {
        display: block;
        font-size: 2rem;
        font-weight: 700;
        color: #dc2626;
    }

    .impact-stats .label {
        font-size: 0.875rem;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    /* Session Timeout Modal */
    .session-timeout-modal .modal-content {
        border: 3px solid #f59e0b;
    }

    .timeout-warning {
        text-align: center;
        padding: 2rem;
    }

    .timeout-warning i {
        font-size: 3rem;
        color: #f59e0b;
        margin-bottom: 1rem;
    }

    .timeout-warning #countdown {
        font-weight: 700;
        color: #dc2626;
        font-size: 1.2rem;
    }

    /* Emergency Modal Enhancements */
    .emergency-modal .modal-content {
        border: 3px solid #ef4444;
    }

    .emergency-header {
        background: rgba(239, 68, 68, 0.05);
        border-bottom: 1px solid #fecaca;
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .emergency-header .emergency-icon {
        width: 50px;
        height: 50px;
        background: #ef4444;
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.25rem;
        animation: pulse 2s infinite;
    }

    .emergency-warning {
        background: rgba(245, 158, 11, 0.1);
        border: 1px solid #fbbf24;
        border-radius: 8px;
        padding: 1rem;
        margin-bottom: 1.5rem;
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .emergency-warning i {
        color: #f59e0b;
        font-size: 1.25rem;
    }

    /* Photo Upload Styles */
    .photo-upload-section {
        text-align: center;
    }

    .current-photo {
        margin-bottom: 2rem;
    }

    .preview-image {
        width: 120px;
        height: 120px;
        border-radius: 50%;
        object-fit: cover;
        border: 4px solid #e5e7eb;
    }

    .upload-options {
        display: flex;
        gap: 1rem;
        justify-content: center;
        margin-bottom: 2rem;
    }

    .upload-guidelines {
        background: #f0f9ff;
        border: 1px solid #bae6fd;
        border-radius: 8px;
        padding: 1.5rem;
        text-align: left;
    }

    .upload-guidelines h4 {
        color: #0369a1;
        margin-bottom: 1rem;
    }

    .upload-guidelines ul {
        list-style-type: disc;
        padding-left: 1.5rem;
        color: #374151;
    }

    .upload-guidelines li {
        margin-bottom: 0.5rem;
    }

    /* Health Tips Content */
    .health-tips-content {
        max-width: 600px;
        margin: 0 auto;
    }

    .tip-section {
        margin-bottom: 2rem;
        padding-bottom: 1.5rem;
        border-bottom: 1px solid #e5e7eb;
    }

    .tip-section:last-child {
        border-bottom: none;
        margin-bottom: 0;
        padding-bottom: 0;
    }

    .tip-section h4 {
        color: #1f2937;
        margin-bottom: 1rem;
        font-weight: 600;
    }

    .tip-section ul {
        list-style-type: disc;
        padding-left: 1.5rem;
        color: #374151;
    }

    .tip-section li {
        margin-bottom: 0.75rem;
        line-height: 1.5;
    }

    /* Animations */
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
    }

    /* Responsive Design */
    @media (max-width: 1024px) {
        .eligibility-grid {
            grid-template-columns: 1fr;
        }

        .impact-stats {
            grid-template-columns: 1fr;
        }

        .hospitals-grid {
            grid-template-columns: 1fr;
        }

        .story-details {
            grid-template-columns: 1fr;
        }
    }

    @media (max-width: 768px) {
        .profile-header {
            flex-direction: column;
            text-align: center;
            gap: 1rem;
        }

        .donation-status {
            margin-left: 0;
        }

        .donation-actions {
            flex-direction: column;
        }

        .form-row {
            grid-template-columns: 1fr;
        }

        .date-range {
            flex-direction: column;
            gap: 0.5rem;
        }

        .header-actions {
            flex-direction: column;
            gap: 0.5rem;
        }

        .impact-stats {
            flex-direction: column;
            gap: 1rem;
        }

        .hospital-header {
            flex-direction: column;
            align-items: center;
            text-align: center;
        }

        .hospital-status {
            margin-top: 0.5rem;
        }

        .hospital-actions {
            justify-content: center;
        }

        .upload-options {
            flex-direction: column;
        }
    }
`;

// Add styles to head
const enhancedStyleSheet = document.createElement('style');
enhancedStyleSheet.textContent = enhancedDonorStyles;
document.head.appendChild(enhancedStyleSheet);