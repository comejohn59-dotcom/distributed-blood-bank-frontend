// Request Blood Page JavaScript - Complete Blood Request Flow Implementation
document.addEventListener('DOMContentLoaded', function() {
    initializeRequestBloodPage();
});

// Global variables for the blood request flow
let selectedBloodType = '';
let selectedHospital = null;
let currentRequestData = {};

function initializeRequestBloodPage() {
    // Initialize availability checker
    initializeAvailabilityChecker();
    
    // Initialize navigation toggle
    initializeNavigation();
    
    // Initialize form validation
    initializeFormValidation();
    
    // Initialize animations
    initializeAnimations();
    
    // Initialize blood request flow
    initializeBloodRequestFlow();
}

// Blood Request Flow Implementation (10-Step Process)
function initializeBloodRequestFlow() {
    // Step 1: User Login/Register is handled by auth system
    // Step 2: Search Blood Availability
    const searchButton = document.querySelector('#checkAvailability');
    if (searchButton) {
        searchButton.addEventListener('click', searchBloodAvailabilityFlow);
    }
}

// Step 2: Search Blood Availability and Show Hospital Selection
function searchBloodAvailabilityFlow() {
    const bloodType = document.getElementById('checkBloodType').value;
    const location = document.getElementById('checkLocation').value;
    
    if (!bloodType) {
        showNotification('Please select a blood type to search', 'error');
        return;
    }
    
    selectedBloodType = bloodType;
    
    // Show loading state
    const resultsContainer = document.getElementById('availabilityResults');
    resultsContainer.innerHTML = `
        <div class="loading-state">
            <div class="loading-spinner"></div>
            <p>Searching for ${bloodType} blood at ACTIVE and VERIFIED hospitals...</p>
        </div>
    `;
    
    // Simulate API call to get hospitals with blood availability
    setTimeout(() => {
        const availableHospitals = getAvailableHospitals(bloodType, location);
        displayHospitalSelection(availableHospitals);
    }, 2000);
}

// Step 3: Get Available Hospitals (ACTIVE, VERIFIED, with sufficient stock)
function getAvailableHospitals(bloodType, location) {
    // Mock data - in real app, this would be an API call
    const allHospitals = [
        {
            id: 'city-general',
            name: 'City General Hospital',
            status: 'ACTIVE',
            verified: true,
            distance: '2.3 km',
            phone: '+1 (555) 123-4567',
            address: '123 Medical Center Dr, City',
            bloodInventory: {
                'A+': 45, 'A-': 12, 'B+': 18, 'B-': 8, 
                'AB+': 15, 'AB-': 3, 'O+': 62, 'O-': 25
            },
            rating: 4.8,
            emergencyCapable: true
        },
        {
            id: 'metro-medical',
            name: 'Metro Medical Center',
            status: 'ACTIVE',
            verified: true,
            distance: '4.1 km',
            phone: '+1 (555) 987-6543',
            address: '456 Health Ave, Metro',
            bloodInventory: {
                'A+': 28, 'A-': 6, 'B+': 22, 'B-': 4, 
                'AB+': 8, 'AB-': 1, 'O+': 35, 'O-': 12
            },
            rating: 4.6,
            emergencyCapable: true
        },
        {
            id: 'regional-hospital',
            name: 'Regional Hospital',
            status: 'ACTIVE',
            verified: true,
            distance: '6.8 km',
            phone: '+1 (555) 456-7890',
            address: '789 Care Blvd, Regional',
            bloodInventory: {
                'A+': 8, 'A-': 2, 'B+': 5, 'B-': 1, 
                'AB+': 3, 'AB-': 0, 'O+': 15, 'O-': 4
            },
            rating: 4.3,
            emergencyCapable: false
        },
        {
            id: 'community-health',
            name: 'Community Health Center',
            status: 'MAINTENANCE',
            verified: true,
            distance: '8.2 km',
            phone: '+1 (555) 321-0987',
            address: '321 Community St, Health',
            bloodInventory: {
                'A+': 0, 'A-': 0, 'B+': 0, 'B-': 0, 
                'AB+': 0, 'AB-': 0, 'O+': 0, 'O-': 0
            },
            rating: 4.1,
            emergencyCapable: false
        }
    ];
    
    // Filter hospitals: ACTIVE, VERIFIED, with sufficient stock (>= 5 units)
    return allHospitals.filter(hospital => 
        hospital.status === 'ACTIVE' && 
        hospital.verified && 
        hospital.bloodInventory[bloodType] >= 5
    );
}

// Step 3: Display Hospital Selection
function displayHospitalSelection(hospitals) {
    const resultsContainer = document.getElementById('availabilityResults');
    
    if (hospitals.length === 0) {
        resultsContainer.innerHTML = `
            <div class="no-results">
                <i class="fas fa-exclamation-triangle"></i>
                <h4>No Available Hospitals</h4>
                <p>No ACTIVE and VERIFIED hospitals found with sufficient ${selectedBloodType} blood stock.</p>
                <button class="btn btn-primary" onclick="showEmergencyOptions()">
                    <i class="fas fa-phone"></i>
                    Emergency Contact
                </button>
            </div>
        `;
        return;
    }
    
    resultsContainer.innerHTML = `
        <div class="hospital-selection-results">
            <div class="results-header">
                <h4>Available Hospitals for ${selectedBloodType} Blood</h4>
                <p>Found ${hospitals.length} hospital${hospitals.length > 1 ? 's' : ''} with sufficient stock</p>
            </div>
            <div class="hospitals-grid">
                ${hospitals.map(hospital => `
                    <div class="hospital-selection-card" data-hospital-id="${hospital.id}">
                        <div class="hospital-header">
                            <div class="hospital-icon">
                                <i class="fas fa-hospital"></i>
                            </div>
                            <div class="hospital-info">
                                <h5>${hospital.name}</h5>
                                <p>${hospital.address}</p>
                                <div class="hospital-distance">
                                    <i class="fas fa-map-marker-alt"></i>
                                    <span>${hospital.distance}</span>
                                </div>
                            </div>
                            <div class="hospital-rating">
                                <div class="rating-stars">
                                    ${generateStars(hospital.rating)}
                                </div>
                                <span class="rating-value">${hospital.rating}</span>
                            </div>
                        </div>
                        <div class="hospital-details">
                            <div class="blood-availability">
                                <div class="blood-info">
                                    <span class="blood-type">${selectedBloodType}</span>
                                    <span class="units-available">${hospital.bloodInventory[selectedBloodType]} units</span>
                                </div>
                                <div class="availability-status available">Available</div>
                            </div>
                            <div class="hospital-features">
                                ${hospital.emergencyCapable ? '<span class="feature emergency"><i class="fas fa-ambulance"></i> 24/7 Emergency</span>' : ''}
                                <span class="feature verified"><i class="fas fa-check-circle"></i> Verified</span>
                                <span class="feature active"><i class="fas fa-circle"></i> Active</span>
                            </div>
                        </div>
                        <div class="hospital-actions">
                            <button class="btn btn-primary btn-select" onclick="selectHospital('${hospital.id}')">
                                <i class="fas fa-hand-point-right"></i>
                                Select Hospital
                            </button>
                            <button class="btn btn-secondary" onclick="viewHospitalDetails('${hospital.id}')">
                                <i class="fas fa-info-circle"></i>
                                Details
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Step 4: User Selects Hospital
function selectHospital(hospitalId) {
    const hospitals = getAvailableHospitals(selectedBloodType, '');
    selectedHospital = hospitals.find(h => h.id === hospitalId);
    
    if (!selectedHospital) {
        showNotification('Hospital not found', 'error');
        return;
    }
    
    // Highlight selected hospital
    document.querySelectorAll('.hospital-selection-card').forEach(card => {
        card.classList.remove('selected');
    });
    document.querySelector(`[data-hospital-id="${hospitalId}"]`).classList.add('selected');
    
    // Show blood request form
    setTimeout(() => {
        showBloodRequestForm();
    }, 500);
}

// Step 5: Show Blood Request Form
function showBloodRequestForm() {
    const modal = document.getElementById('requestModal');
    const modalTitle = document.getElementById('requestModalTitle');
    const formContainer = document.querySelector('#bloodRequestForm');
    
    modalTitle.textContent = `Blood Request - ${selectedHospital.name}`;
    
    // Generate form with pre-filled data
    formContainer.innerHTML = generateBloodRequestForm();
    
    // Show modal
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Initialize form validation for the new form
    initializeFormValidation();
}

function generateBloodRequestForm() {
    return `
        <div class="form-section">
            <h4>Blood Requirements</h4>
            <div class="form-row">
                <div class="form-group">
                    <label for="bloodType">Blood Type Needed *</label>
                    <select id="bloodType" name="bloodType" class="form-control" required readonly>
                        <option value="${selectedBloodType}" selected>${selectedBloodType}</option>
                    </select>
                    <small class="form-help">Auto-filled based on your search</small>
                </div>
                <div class="form-group">
                    <label for="unitsNeeded">Units Required *</label>
                    <select id="unitsNeeded" name="unitsNeeded" class="form-control" required>
                        <option value="">Select Units</option>
                        <option value="1">1 Unit</option>
                        <option value="2">2 Units</option>
                        <option value="3">3 Units</option>
                        <option value="4">4 Units</option>
                        <option value="5">5 Units</option>
                        <option value="6">6+ Units</option>
                    </select>
                </div>
            </div>
        </div>
        
        <div class="form-section">
            <h4>Selected Hospital</h4>
            <div class="selected-hospital-info">
                <div class="hospital-card-mini">
                    <div class="hospital-icon">
                        <i class="fas fa-hospital"></i>
                    </div>
                    <div class="hospital-details">
                        <h5>${selectedHospital.name}</h5>
                        <p>${selectedHospital.address}</p>
                        <div class="hospital-meta">
                            <span><i class="fas fa-map-marker-alt"></i> ${selectedHospital.distance}</span>
                            <span><i class="fas fa-tint"></i> ${selectedHospital.bloodInventory[selectedBloodType]} units available</span>
                        </div>
                    </div>
                </div>
                <input type="hidden" name="selectedHospital" value="${selectedHospital.id}">
            </div>
        </div>
        
        <div class="form-section">
            <h4>Request Details</h4>
            <div class="form-row">
                <div class="form-group">
                    <label for="emergencyLevel">Priority Level *</label>
                    <select id="emergencyLevel" name="emergencyLevel" class="form-control" required onchange="toggleEmergencyJustification()">
                        <option value="">Select Priority</option>
                        <option value="routine">Routine</option>
                        <option value="urgent">Urgent</option>
                        <option value="emergency">Emergency</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="expectedDate">Expected Date *</label>
                    <input type="date" id="expectedDate" name="expectedDate" class="form-control" required min="${new Date().toISOString().split('T')[0]}">
                </div>
            </div>
            
            <!-- Emergency Justification (Hidden by default) -->
            <div class="form-group" id="emergencyJustificationGroup" style="display: none;">
                <label for="emergencyJustification">Emergency Justification *</label>
                <select id="emergencyJustification" name="emergencyJustification" class="form-control">
                    <option value="">Select emergency reason</option>
                    <option value="trauma">Trauma/Accident</option>
                    <option value="surgery">Emergency Surgery</option>
                    <option value="hemorrhage">Severe Hemorrhage</option>
                    <option value="transfusion">Critical Transfusion Need</option>
                    <option value="other">Other Life-Threatening Emergency</option>
                </select>
                <small class="form-help emergency-warning">
                    <i class="fas fa-exclamation-triangle"></i>
                    Emergency requests require immediate justification and will be prioritized
                </small>
            </div>
            
            <div class="form-group">
                <label for="medicalReason">Medical Reason *</label>
                <textarea id="medicalReason" name="medicalReason" class="form-control" rows="3" required placeholder="Please describe the medical condition or reason for blood requirement..."></textarea>
            </div>
        </div>
        
        <div class="form-section">
            <h4>Patient Information</h4>
            <div class="form-row">
                <div class="form-group">
                    <label for="patientName">Patient Name *</label>
                    <input type="text" id="patientName" name="patientName" class="form-control" required>
                </div>
                <div class="form-group">
                    <label for="patientAge">Patient Age *</label>
                    <input type="number" id="patientAge" name="patientAge" class="form-control" min="1" max="120" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="doctorName">Attending Physician *</label>
                    <input type="text" id="doctorName" name="doctorName" class="form-control" required>
                </div>
                <div class="form-group">
                    <label for="doctorContact">Doctor's Contact *</label>
                    <input type="tel" id="doctorContact" name="doctorContact" class="form-control" required>
                </div>
            </div>
        </div>
        
        <div class="form-section">
            <h4>Additional Information</h4>
            <div class="form-group">
                <label for="additionalNotes">Additional Notes</label>
                <textarea id="additionalNotes" name="additionalNotes" class="form-control" rows="2" placeholder="Any additional information that might be helpful..."></textarea>
            </div>
            <div class="form-group">
                <label class="checkbox-label">
                    <input type="checkbox" id="consentCheckbox" name="consent" required>
                    <span class="checkmark"></span>
                    I consent to the processing of medical information for blood request purposes *
                </label>
            </div>
            <div class="form-group">
                <label class="checkbox-label">
                    <input type="checkbox" id="accuracyCheckbox" name="accuracy" required>
                    <span class="checkmark"></span>
                    I confirm that all information provided is accurate and complete *
                </label>
            </div>
        </div>
        
        <div class="form-actions">
            <button type="button" class="btn btn-secondary" onclick="closeRequestModal()">Cancel</button>
            <button type="submit" class="btn btn-danger btn-lg">
                <i class="fas fa-paper-plane"></i>
                Submit Blood Request
            </button>
        </div>
    `;
}

// Emergency Level Toggle
function toggleEmergencyJustification() {
    const emergencyLevel = document.getElementById('emergencyLevel').value;
    const justificationGroup = document.getElementById('emergencyJustificationGroup');
    const justificationSelect = document.getElementById('emergencyJustification');
    
    if (emergencyLevel === 'emergency') {
        justificationGroup.style.display = 'block';
        justificationSelect.setAttribute('required', 'required');
    } else {
        justificationGroup.style.display = 'none';
        justificationSelect.removeAttribute('required');
        justificationSelect.value = '';
    }
}

// Step 6: Save Request in Database
function handleFormSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    // Validate all fields
    if (!validateBloodRequestForm(form)) {
        return;
    }
    
    // Create request data object
    const requestData = {
        id: generateRequestId(),
        bloodType: formData.get('bloodType'),
        unitsNeeded: parseInt(formData.get('unitsNeeded')),
        assignedHospitalId: selectedHospital.id,
        hospitalName: selectedHospital.name,
        emergencyLevel: formData.get('emergencyLevel'),
        emergencyJustification: formData.get('emergencyJustification'),
        medicalReason: formData.get('medicalReason'),
        patientName: formData.get('patientName'),
        patientAge: parseInt(formData.get('patientAge')),
        doctorName: formData.get('doctorName'),
        doctorContact: formData.get('doctorContact'),
        additionalNotes: formData.get('additionalNotes'),
        expectedDate: formData.get('expectedDate'),
        status: 'PENDING',
        submittedAt: new Date().toISOString(),
        submittedBy: 'current-user' // In real app, get from auth
    };
    
    // Show loading state
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting Request...';
    submitButton.disabled = true;
    
    // Simulate database save
    setTimeout(() => {
        // Step 7: Notify Hospital
        saveRequestToDatabase(requestData);
        notifyHospital(requestData);
        
        // Reset button
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
        
        // Show success message
        showNotification(`Blood request submitted successfully! Request ID: ${requestData.id}`, 'success');
        
        // Close modal
        closeRequestModal();
        
        // Show next steps
        showRequestConfirmation(requestData);
        
    }, 3000);
}

// Step 6: Database Simulation
function saveRequestToDatabase(requestData) {
    // In real app, this would be an API call
    let savedRequests = JSON.parse(localStorage.getItem('bloodRequests') || '[]');
    savedRequests.push(requestData);
    localStorage.setItem('bloodRequests', JSON.stringify(savedRequests));
    
    console.log('Request saved to database:', requestData);
}

// Step 7: Hospital Notification
function notifyHospital(requestData) {
    // In real app, this would send notification to hospital dashboard
    console.log(`Notification sent to ${requestData.hospitalName} for request ${requestData.id}`);
    
    // Simulate hospital notification
    setTimeout(() => {
        showNotification(`${requestData.hospitalName} has been notified of your request`, 'info');
    }, 2000);
}

// Request Confirmation Display
function showRequestConfirmation(requestData) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay confirmation-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header success">
                <div class="success-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <div>
                    <h3>Request Submitted Successfully!</h3>
                    <p>Your blood request has been sent to the hospital</p>
                </div>
            </div>
            <div class="modal-body">
                <div class="request-summary">
                    <h4>Request Summary</h4>
                    <div class="summary-grid">
                        <div class="summary-item">
                            <label>Request ID:</label>
                            <span class="request-id">${requestData.id}</span>
                        </div>
                        <div class="summary-item">
                            <label>Blood Type:</label>
                            <span class="blood-type">${requestData.bloodType}</span>
                        </div>
                        <div class="summary-item">
                            <label>Units:</label>
                            <span>${requestData.unitsNeeded} units</span>
                        </div>
                        <div class="summary-item">
                            <label>Hospital:</label>
                            <span>${requestData.hospitalName}</span>
                        </div>
                        <div class="summary-item">
                            <label>Priority:</label>
                            <span class="priority ${requestData.emergencyLevel}">${requestData.emergencyLevel.toUpperCase()}</span>
                        </div>
                        <div class="summary-item">
                            <label>Status:</label>
                            <span class="status pending">PENDING APPROVAL</span>
                        </div>
                    </div>
                </div>
                
                <div class="next-steps">
                    <h4>What Happens Next?</h4>
                    <div class="steps-timeline">
                        <div class="step completed">
                            <div class="step-marker">1</div>
                            <div class="step-content">
                                <h5>Request Submitted</h5>
                                <p>Your request has been sent to ${requestData.hospitalName}</p>
                            </div>
                        </div>
                        <div class="step active">
                            <div class="step-marker">2</div>
                            <div class="step-content">
                                <h5>Hospital Review</h5>
                                <p>Hospital staff will review your request and check availability</p>
                            </div>
                        </div>
                        <div class="step">
                            <div class="step-marker">3</div>
                            <div class="step-content">
                                <h5>Approval Decision</h5>
                                <p>You'll be notified when the hospital approves or needs more information</p>
                            </div>
                        </div>
                        <div class="step">
                            <div class="step-marker">4</div>
                            <div class="step-content">
                                <h5>Blood Collection</h5>
                                <p>Visit the hospital to collect the blood units</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="contact-info">
                    <h4>Need Help?</h4>
                    <div class="contact-options">
                        <div class="contact-item">
                            <i class="fas fa-phone"></i>
                            <div>
                                <strong>Hospital Direct Line</strong>
                                <p>${selectedHospital.phone}</p>
                            </div>
                        </div>
                        <div class="contact-item">
                            <i class="fas fa-headset"></i>
                            <div>
                                <strong>BloodConnect Support</strong>
                                <p>1-800-BLOOD-911</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeConfirmationModal()">Close</button>
                <button class="btn btn-primary" onclick="redirectToDashboard()">
                    <i class="fas fa-tachometer-alt"></i>
                    Go to Dashboard
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    setTimeout(() => {
        modal.style.opacity = '1';
    }, 10);
    
    // Auto-close after 30 seconds
    setTimeout(() => {
        if (modal.parentElement) {
            closeConfirmationModal();
        }
    }, 30000);
}

function closeConfirmationModal() {
    const modal = document.querySelector('.confirmation-modal');
    if (modal) {
        modal.style.opacity = '0';
        setTimeout(() => modal.remove(), 300);
    }
}

function redirectToDashboard() {
    closeConfirmationModal();
    // In real app, check user role and redirect appropriately
    window.location.href = 'dashboard/patient.html';
}

// Utility Functions
function generateRequestId() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `REQ-${new Date().getFullYear()}-${random}`;
}

function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let stars = '';
    
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star"></i>';
    }
    
    if (hasHalfStar) {
        stars += '<i class="fas fa-star-half-alt"></i>';
    }
    
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star"></i>';
    }
    
    return stars;
}

function validateBloodRequestForm(form) {
    let isValid = true;
    const inputs = form.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
        if (!validateField({ target: input })) {
            isValid = false;
        }
    });
    
    // Additional validation for emergency requests
    const emergencyLevel = form.querySelector('#emergencyLevel').value;
    const emergencyJustification = form.querySelector('#emergencyJustification').value;
    
    if (emergencyLevel === 'emergency' && !emergencyJustification) {
        showFieldError(form.querySelector('#emergencyJustification'), 'Emergency justification is required for emergency requests');
        isValid = false;
    }
    
    if (!isValid) {
        showNotification('Please correct the errors in the form', 'error');
    }
    
    return isValid;
}

function viewHospitalDetails(hospitalId) {
    const hospitals = getAvailableHospitals(selectedBloodType, '');
    const hospital = hospitals.find(h => h.id === hospitalId);
    
    if (!hospital) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${hospital.name} - Details</h3>
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="hospital-details-grid">
                    <div class="detail-section">
                        <h4>Hospital Information</h4>
                        <div class="detail-item">
                            <label>Name:</label>
                            <span>${hospital.name}</span>
                        </div>
                        <div class="detail-item">
                            <label>Address:</label>
                            <span>${hospital.address}</span>
                        </div>
                        <div class="detail-item">
                            <label>Phone:</label>
                            <span>${hospital.phone}</span>
                        </div>
                        <div class="detail-item">
                            <label>Distance:</label>
                            <span>${hospital.distance}</span>
                        </div>
                        <div class="detail-item">
                            <label>Rating:</label>
                            <span>${hospital.rating}/5.0</span>
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h4>Blood Inventory</h4>
                        <div class="blood-inventory-grid">
                            ${Object.entries(hospital.bloodInventory).map(([type, units]) => `
                                <div class="blood-item ${type === selectedBloodType ? 'highlighted' : ''}">
                                    <span class="blood-type">${type}</span>
                                    <span class="units">${units} units</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
                
                <div class="hospital-features-detail">
                    <h4>Services & Features</h4>
                    <div class="features-list">
                        <div class="feature-item">
                            <i class="fas fa-check-circle text-success"></i>
                            <span>ACTIVE Status</span>
                        </div>
                        <div class="feature-item">
                            <i class="fas fa-shield-alt text-success"></i>
                            <span>Verified Hospital</span>
                        </div>
                        ${hospital.emergencyCapable ? `
                            <div class="feature-item">
                                <i class="fas fa-ambulance text-warning"></i>
                                <span>24/7 Emergency Services</span>
                            </div>
                        ` : ''}
                        <div class="feature-item">
                            <i class="fas fa-tint text-danger"></i>
                            <span>Blood Bank Services</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Close</button>
                <button class="btn btn-primary" onclick="selectHospital('${hospital.id}'); this.closest('.modal-overlay').remove();">
                    <i class="fas fa-hand-point-right"></i>
                    Select This Hospital
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    setTimeout(() => {
        modal.style.opacity = '1';
    }, 10);
}

function showEmergencyOptions() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay emergency-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header emergency">
                <div class="emergency-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div>
                    <h3>Emergency Blood Request</h3>
                    <p>No hospitals currently have sufficient stock</p>
                </div>
            </div>
            <div class="modal-body">
                <div class="emergency-options">
                    <h4>Emergency Contact Options</h4>
                    <div class="contact-options">
                        <div class="contact-option">
                            <div class="option-icon">
                                <i class="fas fa-phone"></i>
                            </div>
                            <div class="option-content">
                                <h5>Emergency Hotline</h5>
                                <p>Call our 24/7 emergency blood request line</p>
                                <strong>1-800-BLOOD-911</strong>
                            </div>
                            <button class="btn btn-danger" onclick="callEmergencyLine()">Call Now</button>
                        </div>
                        
                        <div class="contact-option">
                            <div class="option-icon">
                                <i class="fas fa-hospital"></i>
                            </div>
                            <div class="option-content">
                                <h5>Nearest Emergency Room</h5>
                                <p>Visit the nearest hospital emergency department</p>
                                <strong>City General Hospital ER</strong>
                            </div>
                            <button class="btn btn-warning" onclick="getDirections()">Get Directions</button>
                        </div>
                        
                        <div class="contact-option">
                            <div class="option-icon">
                                <i class="fas fa-network-wired"></i>
                            </div>
                            <div class="option-content">
                                <h5>Network Search</h5>
                                <p>Search extended hospital network</p>
                                <strong>Regional Blood Network</strong>
                            </div>
                            <button class="btn btn-info" onclick="searchExtendedNetwork()">Search Network</button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Close</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    setTimeout(() => {
        modal.style.opacity = '1';
    }, 10);
}

function callEmergencyLine() {
    if (navigator.userAgent.match(/(iPhone|iPod|Android|BlackBerry)/)) {
        window.location.href = 'tel:1-800-BLOOD-911';
    } else {
        showNotification('Emergency Line: 1-800-BLOOD-911', 'info');
    }
}

function getDirections() {
    const address = encodeURIComponent('City General Hospital Emergency Room');
    window.open(`https://maps.google.com/maps?q=${address}`, '_blank');
}

function searchExtendedNetwork() {
    showNotification('Searching extended network... This may take a moment.', 'info');
    // In real app, this would search a broader network
    setTimeout(() => {
        showNotification('Extended network search completed. Please call emergency line for results.', 'warning');
    }, 3000);
}

// Close modal functions
function closeRequestModal() {
    const modal = document.getElementById('requestModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function closeHospitalSelectionModal() {
    const modal = document.getElementById('hospitalSelectionModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Navigation functionality
function initializeNavigation() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
        });
    }
}

// Availability Checker
function initializeAvailabilityChecker() {
    const checkButton = document.querySelector('#checkAvailability');
    if (checkButton) {
        checkButton.addEventListener('click', checkAvailability);
    }
}

function checkAvailability() {
    const bloodType = document.getElementById('checkBloodType').value;
    const location = document.getElementById('checkLocation').value;
    const radius = document.getElementById('checkRadius').value;
    const resultsContainer = document.getElementById('availabilityResults');
    
    if (!bloodType || !location) {
        showNotification('Please select blood type and enter location', 'error');
        return;
    }
    
    // Show loading state
    resultsContainer.innerHTML = `
        <div class="loading-state">
            <div class="loading-spinner"></div>
            <p>Checking availability in your area...</p>
        </div>
    `;
    
    // Simulate API call
    setTimeout(() => {
        const mockResults = generateMockAvailabilityResults(bloodType, location, radius);
        displayAvailabilityResults(mockResults);
    }, 2000);
}

function generateMockAvailabilityResults(bloodType, location, radius) {
    const hospitals = [
        { name: 'City General Hospital', distance: '2.3 miles', units: Math.floor(Math.random() * 20) + 5, status: 'available' },
        { name: 'Memorial Medical Center', distance: '4.7 miles', units: Math.floor(Math.random() * 15) + 3, status: 'available' },
        { name: 'Regional Blood Bank', distance: '6.1 miles', units: Math.floor(Math.random() * 30) + 10, status: 'available' },
        { name: 'University Hospital', distance: '8.9 miles', units: Math.floor(Math.random() * 10) + 2, status: 'low' },
        { name: 'Community Health Center', distance: '12.4 miles', units: Math.floor(Math.random() * 5) + 1, status: 'critical' }
    ];
    
    return {
        bloodType,
        location,
        radius,
        totalUnits: hospitals.reduce((sum, h) => sum + h.units, 0),
        hospitals: hospitals.slice(0, Math.floor(Math.random() * 3) + 3)
    };
}

function displayAvailabilityResults(results) {
    const resultsContainer = document.getElementById('availabilityResults');
    
    resultsContainer.innerHTML = `
        <div class="availability-summary">
            <h3>Blood Availability for ${results.bloodType}</h3>
            <p>Found <strong>${results.totalUnits} units</strong> within ${results.radius} miles of ${results.location}</p>
        </div>
        <div class="hospital-results">
            ${results.hospitals.map(hospital => `
                <div class="hospital-result">
                    <div class="hospital-info">
                        <h4>${hospital.name}</h4>
                        <p class="hospital-distance">
                            <i class="fas fa-map-marker-alt"></i>
                            ${hospital.distance}
                        </p>
                    </div>
                    <div class="hospital-availability">
                        <div class="units-available">
                            <span class="units-count">${hospital.units}</span>
                            <span class="units-label">units</span>
                        </div>
                        <div class="availability-status ${hospital.status}">
                            ${hospital.status === 'available' ? 'Available' : 
                              hospital.status === 'low' ? 'Low Stock' : 'Critical'}
                        </div>
                    </div>
                    <div class="hospital-actions">
                        <button class="btn btn-sm btn-primary" onclick="requestFromHospital('${hospital.name}')">
                            Request Blood
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
        <div class="availability-actions">
            <button class="btn btn-outline-primary" onclick="checkAvailability()">
                <i class="fas fa-refresh"></i>
                Refresh Results
            </button>
        </div>
    `;
}

// Request Form Modal
function showRequestForm(type) {
    const modal = document.getElementById('requestModal');
    const modalTitle = document.getElementById('requestModalTitle');
    const formContainer = document.querySelector('#bloodRequestForm');
    
    // Set modal title based on request type
    const titles = {
        emergency: 'Emergency Blood Request',
        scheduled: 'Scheduled Blood Request',
        ongoing: 'Ongoing Treatment Request'
    };
    
    modalTitle.textContent = titles[type] || 'Blood Request Form';
    
    // Generate form based on type
    formContainer.innerHTML = generateRequestForm(type);
    
    // Show modal
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Initialize form validation for the new form
    initializeFormValidation();
}

function generateRequestForm(type) {
    const commonFields = `
        <div class="form-section">
            <h4>Patient Information</h4>
            <div class="form-row">
                <div class="form-group">
                    <label for="patientName">Patient Full Name *</label>
                    <input type="text" id="patientName" name="patientName" class="form-control" required>
                </div>
                <div class="form-group">
                    <label for="patientDOB">Date of Birth *</label>
                    <input type="date" id="patientDOB" name="patientDOB" class="form-control" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="patientPhone">Phone Number *</label>
                    <input type="tel" id="patientPhone" name="patientPhone" class="form-control" required>
                </div>
                <div class="form-group">
                    <label for="patientEmail">Email Address</label>
                    <input type="email" id="patientEmail" name="patientEmail" class="form-control">
                </div>
            </div>
        </div>
        
        <div class="form-section">
            <h4>Medical Information</h4>
            <div class="form-row">
                <div class="form-group">
                    <label for="bloodType">Blood Type Needed *</label>
                    <select id="bloodType" name="bloodType" class="form-control" required>
                        <option value="">Select Blood Type</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="unitsNeeded">Units Needed *</label>
                    <input type="number" id="unitsNeeded" name="unitsNeeded" class="form-control" min="1" max="10" required>
                </div>
            </div>
            <div class="form-group">
                <label for="medicalCondition">Medical Condition/Reason *</label>
                <textarea id="medicalCondition" name="medicalCondition" class="form-control" rows="3" required placeholder="Please describe the medical condition or reason for blood transfusion"></textarea>
            </div>
        </div>
        
        <div class="form-section">
            <h4>Hospital Information</h4>
            <div class="form-row">
                <div class="form-group">
                    <label for="hospitalName">Hospital/Medical Center *</label>
                    <input type="text" id="hospitalName" name="hospitalName" class="form-control" required>
                </div>
                <div class="form-group">
                    <label for="doctorName">Attending Physician *</label>
                    <input type="text" id="doctorName" name="doctorName" class="form-control" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="department">Department/Unit</label>
                    <input type="text" id="department" name="department" class="form-control" placeholder="e.g., Emergency, Surgery, ICU">
                </div>
                <div class="form-group">
                    <label for="medicalRecordNumber">Medical Record Number</label>
                    <input type="text" id="medicalRecordNumber" name="medicalRecordNumber" class="form-control">
                </div>
            </div>
        </div>
    `;
    
    let specificFields = '';
    let submitButtonText = 'Submit Request';
    
    if (type === 'emergency') {
        specificFields = `
            <div class="form-section emergency-section">
                <h4>Emergency Details</h4>
                <div class="emergency-warning">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Emergency requests are processed immediately and require medical verification.</p>
                </div>
                <div class="form-group">
                    <label for="emergencyReason">Emergency Justification *</label>
                    <textarea id="emergencyReason" name="emergencyReason" class="form-control" rows="3" required placeholder="Please provide detailed justification for emergency status"></textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="emergencyContact">Emergency Contact Name *</label>
                        <input type="text" id="emergencyContact" name="emergencyContact" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label for="emergencyContactPhone">Emergency Contact Phone *</label>
                        <input type="tel" id="emergencyContactPhone" name="emergencyContactPhone" class="form-control" required>
                    </div>
                </div>
            </div>
        `;
        submitButtonText = 'Submit Emergency Request';
    } else if (type === 'scheduled') {
        specificFields = `
            <div class="form-section">
                <h4>Scheduling Information</h4>
                <div class="form-row">
                    <div class="form-group">
                        <label for="procedureDate">Procedure/Treatment Date *</label>
                        <input type="datetime-local" id="procedureDate" name="procedureDate" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label for="procedureType">Procedure Type</label>
                        <input type="text" id="procedureType" name="procedureType" class="form-control" placeholder="e.g., Surgery, Chemotherapy">
                    </div>
                </div>
                <div class="form-group">
                    <label for="specialInstructions">Special Instructions</label>
                    <textarea id="specialInstructions" name="specialInstructions" class="form-control" rows="3" placeholder="Any special requirements or instructions"></textarea>
                </div>
            </div>
        `;
    } else if (type === 'ongoing') {
        specificFields = `
            <div class="form-section">
                <h4>Treatment Schedule</h4>
                <div class="form-row">
                    <div class="form-group">
                        <label for="treatmentFrequency">Treatment Frequency *</label>
                        <select id="treatmentFrequency" name="treatmentFrequency" class="form-control" required>
                            <option value="">Select Frequency</option>
                            <option value="weekly">Weekly</option>
                            <option value="biweekly">Bi-weekly</option>
                            <option value="monthly">Monthly</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="treatmentDuration">Expected Duration</label>
                        <input type="text" id="treatmentDuration" name="treatmentDuration" class="form-control" placeholder="e.g., 6 months, 1 year">
                    </div>
                </div>
                <div class="form-group">
                    <label for="nextAppointment">Next Appointment Date</label>
                    <input type="datetime-local" id="nextAppointment" name="nextAppointment" class="form-control">
                </div>
            </div>
        `;
    }
    
    return `
        ${commonFields}
        ${specificFields}
        <div class="form-section">
            <h4>Additional Information</h4>
            <div class="form-group">
                <label for="additionalNotes">Additional Notes</label>
                <textarea id="additionalNotes" name="additionalNotes" class="form-control" rows="3" placeholder="Any additional information that might be helpful"></textarea>
            </div>
            <div class="form-group">
                <label class="checkbox-label">
                    <input type="checkbox" id="consentCheckbox" name="consent" required>
                    <span class="checkmark"></span>
                    I consent to the processing of my medical information for blood request purposes *
                </label>
            </div>
            <div class="form-group">
                <label class="checkbox-label">
                    <input type="checkbox" id="accuracyCheckbox" name="accuracy" required>
                    <span class="checkmark"></span>
                    I confirm that all information provided is accurate and complete *
                </label>
            </div>
        </div>
        <div class="form-actions">
            <button type="button" class="btn btn-secondary" onclick="closeRequestModal()">Cancel</button>
            <button type="submit" class="btn btn-primary">
                <i class="fas fa-paper-plane"></i>
                ${submitButtonText}
            </button>
        </div>
    `;
}

function closeRequestModal() {
    const modal = document.getElementById('requestModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function requestFromHospital(hospitalName) {
    // Pre-fill hospital name and show request form
    showRequestForm('emergency');
    
    // Wait for form to load, then pre-fill hospital name
    setTimeout(() => {
        const hospitalNameField = document.getElementById('hospitalName');
        if (hospitalNameField) {
            hospitalNameField.value = hospitalName;
        }
    }, 100);
}

// Form Validation
function initializeFormValidation() {
    const form = document.getElementById('bloodRequestForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
        
        // Add real-time validation
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', validateField);
            input.addEventListener('input', clearFieldError);
        });
    }
}

function validateField(event) {
    const field = event.target;
    const value = field.value.trim();
    
    // Remove existing error
    clearFieldError(event);
    
    // Validate required fields
    if (field.hasAttribute('required') && !value) {
        showFieldError(field, 'This field is required');
        return false;
    }
    
    // Validate specific field types
    switch (field.type) {
        case 'email':
            if (value && !isValidEmail(value)) {
                showFieldError(field, 'Please enter a valid email address');
                return false;
            }
            break;
        case 'tel':
            if (value && !isValidPhone(value)) {
                showFieldError(field, 'Please enter a valid phone number');
                return false;
            }
            break;
        case 'number':
            const min = parseInt(field.getAttribute('min'));
            const max = parseInt(field.getAttribute('max'));
            const numValue = parseInt(value);
            if (value && (numValue < min || numValue > max)) {
                showFieldError(field, `Please enter a number between ${min} and ${max}`);
                return false;
            }
            break;
    }
    
    return true;
}

function clearFieldError(event) {
    const field = event.target;
    const errorElement = field.parentNode.querySelector('.field-error');
    if (errorElement) {
        errorElement.remove();
    }
    field.classList.remove('error');
}

function showFieldError(field, message) {
    field.classList.add('error');
    
    const errorElement = document.createElement('div');
    errorElement.className = 'field-error';
    errorElement.textContent = message;
    
    field.parentNode.appendChild(errorElement);
}

function handleFormSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    // Validate all fields
    let isValid = true;
    const inputs = form.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
        if (!validateField({ target: input })) {
            isValid = false;
        }
    });
    
    if (!isValid) {
        showNotification('Please correct the errors in the form', 'error');
        return;
    }
    
    // Show loading state
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    submitButton.disabled = true;
    
    // Simulate form submission
    setTimeout(() => {
        // Reset button
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
        
        // Show success message
        showNotification('Blood request submitted successfully! You will receive confirmation shortly.', 'success');
        
        // Close modal
        closeRequestModal();
        
        // Optionally redirect to dashboard or show next steps
        setTimeout(() => {
            if (confirm('Would you like to create an account to track your request?')) {
                window.location.href = 'auth/register.html';
            }
        }, 2000);
        
    }, 3000);
}

// Utility Functions
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPhone(phone) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 
                           type === 'error' ? 'fa-exclamation-circle' : 
                           'fa-info-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Animation initialization
function initializeAnimations() {
    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    const animateElements = document.querySelectorAll('.request-option, .process-step, .story-card, .requirement-category');
    animateElements.forEach(el => observer.observe(el));
}

// Close modal when clicking outside
document.addEventListener('click', function(event) {
    const modal = document.getElementById('requestModal');
    if (event.target === modal) {
        closeRequestModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeRequestModal();
    }
});
   