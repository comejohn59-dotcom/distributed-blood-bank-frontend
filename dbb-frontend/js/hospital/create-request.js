// frontend/js/hospital/create-request.js

// API path helper — allows overriding `window.API_ROOT` to fix backend paths centrally
if (typeof apiPath === 'undefined') {
    var apiPath = function(p) { return (typeof window !== 'undefined' && window.API_ROOT) ? window.API_ROOT + p : p; };
}

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in and is a hospital
    const userData = JSON.parse(localStorage.getItem('user'));
    if (!userData || userData.role !== 'hospital') {
        window.location.href = '../auth/login.html';
        return;
    }

    // Initialize hospital ID
    const hospitalId = userData.user_id;
    window.hospitalId = hospitalId;
    window.hospitalData = userData;

    // Display user info
    displayUserInfo(userData);

    // Initialize page
    initializePage();

    // Load initial data
    loadBloodInventory();
    loadPreviousRequests();
    setupEventListeners();

    // Setup form validation
    setupFormValidation();
});

/**
 * Initialize page elements and defaults
 */
function initializePage() {
    // Set current date and time
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);
    
    // Set default date to today
    const requiredDateInput = document.getElementById('requiredDate');
    if (requiredDateInput) {
        requiredDateInput.min = today;
        requiredDateInput.value = today;
    }

    // Set default time to current time
    const requiredTimeInput = document.getElementById('requiredTime');
    if (requiredTimeInput) {
        requiredTimeInput.value = currentTime;
    }

    // Initialize units input
    const unitsInput = document.getElementById('unitsRequired');
    if (unitsInput) {
        unitsInput.min = 1;
        unitsInput.max = 50; // Reasonable maximum
        unitsInput.value = 1;
    }

    // Initialize priority selector
    initializePrioritySelector();

    // Initialize blood group selector
    initializeBloodGroupSelector();
}

/**
 * Display user information
 */
function displayUserInfo(userData) {
    const userNameElement = document.getElementById('userName');
    const hospitalNameElement = document.getElementById('hospitalName');
    const userAvatarElement = document.getElementById('userAvatar');

    if (userNameElement) {
        userNameElement.textContent = `${userData.first_name || ''} ${userData.last_name || ''}`.trim();
    }

    if (hospitalNameElement) {
        hospitalNameElement.textContent = userData.hospital_name || userData.organization || 'Hospital';
    }

    if (userAvatarElement) {
        const initials = `${userData.first_name?.charAt(0) || 'H'}${userData.last_name?.charAt(0) || ''}`.toUpperCase();
        userAvatarElement.textContent = initials;
    }
}

/**
 * Initialize priority selector with colors
 */
function initializePrioritySelector() {
    const prioritySelect = document.getElementById('priority');
    if (!prioritySelect) return;

    // Clear existing options
    prioritySelect.innerHTML = '';

    const priorities = [
        { value: 'emergency', label: 'Emergency 🔴', color: 'danger' },
        { value: 'urgent', label: 'Urgent 🟡', color: 'warning' },
        { value: 'normal', label: 'Normal 🟢', color: 'success' },
        { value: 'planned', label: 'Planned 🔵', color: 'primary' }
    ];

    priorities.forEach(priority => {
        const option = document.createElement('option');
        option.value = priority.value;
        option.textContent = priority.label;
        option.dataset.color = priority.color;
        prioritySelect.appendChild(option);
    });

    // Update color when selection changes
    prioritySelect.addEventListener('change', function() {
        updatePriorityIndicator(this.value);
    });

    // Set initial indicator
    updatePriorityIndicator(prioritySelect.value);
}

/**
 * Update priority visual indicator
 */
function updatePriorityIndicator(priority) {
    const indicator = document.getElementById('priorityIndicator');
    if (!indicator) return;

    const priorityConfig = {
        'emergency': { color: 'danger', text: 'Emergency - Immediate attention required' },
        'urgent': { color: 'warning', text: 'Urgent - Required within 24 hours' },
        'normal': { color: 'success', text: 'Normal - Required within 48 hours' },
        'planned': { color: 'primary', text: 'Planned - Scheduled requirement' }
    };

    const config = priorityConfig[priority] || { color: 'secondary', text: 'Select priority' };
    
    indicator.innerHTML = `
        <span class="badge bg-${config.color}">
            ${config.text.split(' - ')[0]}
        </span>
        <small class="text-muted ms-2">${config.text.split(' - ')[1] || ''}</small>
    `;
}

/**
 * Initialize blood group selector
 */
function initializeBloodGroupSelector() {
    const bloodGroupSelect = document.getElementById('bloodGroup');
    if (!bloodGroupSelect) return;

    const bloodGroups = [
        'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
    ];

    bloodGroups.forEach(group => {
        const option = document.createElement('option');
        option.value = group;
        option.textContent = group;
        bloodGroupSelect.appendChild(option);
    });
}

/**
 * Load current blood inventory for reference
 */
async function loadBloodInventory() {
    try {
        showLoading('inventoryLoading', true);
        
        // Get inventory from local blood banks
        const response = await fetch(apiPath('/backend/api/blood_inventory.php?region=' + encodeURIComponent(window.hospitalData.region || '')), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const result = await response.json();
        
        if (result.success && result.data) {
            displayBloodInventory(result.data);
        } else {
            document.getElementById('inventoryAlert').innerHTML = `
                <div class="alert alert-warning">
                    <i class="bi bi-exclamation-triangle"></i>
                    Unable to load current inventory levels
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading blood inventory:', error);
        document.getElementById('inventoryAlert').innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-x-circle"></i>
                Failed to load inventory data
            </div>
        `;
    } finally {
        showLoading('inventoryLoading', false);
    }
}

/**
 * Display blood inventory levels
 */
function displayBloodInventory(inventory) {
    const container = document.getElementById('inventoryLevels');
    if (!container) return;

    // Group by blood group
    const grouped = inventory.reduce((acc, item) => {
        if (!acc[item.blood_group]) {
            acc[item.blood_group] = {
                total: 0,
                blood_banks: []
            };
        }
        acc[item.blood_group].total += item.units_available || 0;
        acc[item.blood_group].blood_banks.push({
            name: item.blood_bank_name,
            units: item.units_available
        });
        return acc;
    }, {});

    // Create inventory cards
    container.innerHTML = '';
    Object.entries(grouped).forEach(([bloodGroup, data]) => {
        const card = document.createElement('div');
        card.className = 'col-md-3 col-sm-6 mb-3';
        
        // Determine status color based on inventory level
        let statusColor = 'success'; // High
        let statusText = 'Good';
        
        if (data.total < 10) {
            statusColor = 'danger';
            statusText = 'Critical';
        } else if (data.total < 25) {
            statusColor = 'warning';
            statusText = 'Low';
        } else if (data.total < 50) {
            statusColor = 'info';
            statusText = 'Moderate';
        }

        card.innerHTML = `
            <div class="card h-100">
                <div class="card-body text-center">
                    <h4 class="card-title">${bloodGroup}</h4>
                    <div class="display-4 fw-bold text-${statusColor}">${data.total}</div>
                    <p class="card-text">Units Available</p>
                    <span class="badge bg-${statusColor}">${statusText}</span>
                    <div class="mt-2">
                        <small class="text-muted">Across ${data.blood_banks.length} blood bank(s)</small>
                    </div>
                </div>
            </div>
        `;
        
        container.appendChild(card);
    });

    // Update blood group selector with availability info
    updateBloodGroupAvailability(grouped);
}

/**
 * Update blood group selector with availability information
 */
function updateBloodGroupAvailability(inventoryData) {
    const bloodGroupSelect = document.getElementById('bloodGroup');
    if (!bloodGroupSelect) return;

    Array.from(bloodGroupSelect.options).forEach(option => {
        const bloodGroup = option.value;
        const inventory = inventoryData[bloodGroup];
        
        if (inventory) {
            let availability = '';
            if (inventory.total < 5) {
                availability = ' (⚠️ Very Low)';
                option.classList.add('text-danger');
            } else if (inventory.total < 15) {
                availability = ' (⚠️ Low)';
                option.classList.add('text-warning');
            } else {
                availability = ' (✓ Available)';
                option.classList.add('text-success');
            }
            
            option.textContent = `${bloodGroup}${availability}`;
        }
    });
}

/**
 * Load previous blood requests for reference
 */
async function loadPreviousRequests() {
    try {
        showLoading('requestsLoading', true);
        
        const response = await fetch(`/backend/api/blood_requests.php?requester_id=${window.hospitalId}&limit=5`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const result = await response.json();
        
        if (result.success && result.data) {
            displayPreviousRequests(result.data);
        }
    } catch (error) {
        console.error('Error loading previous requests:', error);
    } finally {
        showLoading('requestsLoading', false);
    }
}

/**
 * Display previous blood requests
 */
function displayPreviousRequests(requests) {
    const container = document.getElementById('previousRequests');
    if (!container) return;

    if (requests.length === 0) {
        container.innerHTML = `
            <div class="alert alert-info">
                <i class="bi bi-info-circle"></i>
                No previous blood requests found
            </div>
        `;
        return;
    }

    const table = document.createElement('table');
    table.className = 'table table-sm table-hover';
    table.innerHTML = `
        <thead>
            <tr>
                <th>Date</th>
                <th>Blood Group</th>
                <th>Units</th>
                <th>Status</th>
                <th>Priority</th>
            </tr>
        </thead>
        <tbody>
            ${requests.map(request => `
                <tr>
                    <td>${formatDate(request.created_at)}</td>
                    <td>${request.blood_group}</td>
                    <td>${request.units_required}</td>
                    <td><span class="badge ${getRequestStatusClass(request.status)}">${request.status}</span></td>
                    <td><span class="badge ${getPriorityBadgeClass(request.priority)}">${request.priority}</span></td>
                </tr>
            `).join('')}
        </tbody>
    `;
    
    container.innerHTML = '';
    container.appendChild(table);
}

/**
 * Setup form validation
 */
function setupFormValidation() {
    const form = document.getElementById('bloodRequestForm');
    if (!form) return;

    // Real-time validation for units
    const unitsInput = document.getElementById('unitsRequired');
    if (unitsInput) {
        unitsInput.addEventListener('input', function() {
            validateUnits(this.value);
        });
    }

    // Real-time validation for required date/time
    const requiredDateInput = document.getElementById('requiredDate');
    const requiredTimeInput = document.getElementById('requiredTime');
    
    if (requiredDateInput && requiredTimeInput) {
        requiredDateInput.addEventListener('change', validateRequiredDateTime);
        requiredTimeInput.addEventListener('change', validateRequiredDateTime);
    }

    // Real-time validation for patient info
    const patientNameInput = document.getElementById('patientName');
    if (patientNameInput) {
        patientNameInput.addEventListener('input', function() {
            validatePatientInfo();
        });
    }
}

/**
 * Validate units input
 */
function validateUnits(units) {
    const validationElement = document.getElementById('unitsValidation');
    if (!validationElement) return;

    const unitsNum = parseInt(units);
    
    if (isNaN(unitsNum) || unitsNum < 1) {
        validationElement.innerHTML = '<small class="text-danger">Must be at least 1 unit</small>';
        return false;
    }
    
    if (unitsNum > 50) {
        validationElement.innerHTML = '<small class="text-danger">Maximum 50 units per request</small>';
        return false;
    }
    
    validationElement.innerHTML = '<small class="text-success">✓ Valid</small>';
    return true;
}

/**
 * Validate required date and time
 */
function validateRequiredDateTime() {
    const dateInput = document.getElementById('requiredDate');
    const timeInput = document.getElementById('requiredTime');
    const validationElement = document.getElementById('datetimeValidation');
    
    if (!dateInput || !timeInput || !validationElement) return false;

    const selectedDate = new Date(`${dateInput.value}T${timeInput.value}`);
    const now = new Date();
    
    // Allow requests up to 30 days in advance
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    
    if (selectedDate < now) {
        validationElement.innerHTML = '<small class="text-danger">Cannot request for past date/time</small>';
        return false;
    }
    
    if (selectedDate > maxDate) {
        validationElement.innerHTML = '<small class="text-danger">Cannot request more than 30 days in advance</small>';
        return false;
    }
    
    validationElement.innerHTML = '<small class="text-success">✓ Valid</small>';
    return true;
}

/**
 * Validate patient information
 */
function validatePatientInfo() {
    const patientName = document.getElementById('patientName').value;
    const validationElement = document.getElementById('patientValidation');
    
    if (!validationElement) return false;

    if (!patientName.trim()) {
        validationElement.innerHTML = '<small class="text-danger">Patient name is required</small>';
        return false;
    }
    
    if (patientName.length < 2) {
        validationElement.innerHTML = '<small class="text-danger">Patient name is too short</small>';
        return false;
    }
    
    validationElement.innerHTML = '<small class="text-success">✓ Valid</small>';
    return true;
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('href');
            window.location.href = page;
        });
    });

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // Back to dashboard button
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.addEventListener('click', function() {
            window.location.href = 'dashboard.html';
        });
    }

    // Refresh inventory button
    const refreshInventoryBtn = document.getElementById('refreshInventoryBtn');
    if (refreshInventoryBtn) {
        refreshInventoryBtn.addEventListener('click', loadBloodInventory);
    }

    // Form submission
    const form = document.getElementById('bloodRequestForm');
    if (form) {
        form.addEventListener('submit', submitBloodRequest);
    }

    // Reset form button
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetForm);
    }

    // Emergency mode toggle
    const emergencyToggle = document.getElementById('emergencyToggle');
    if (emergencyToggle) {
        emergencyToggle.addEventListener('change', function() {
            toggleEmergencyMode(this.checked);
        });
    }

    // Quick request buttons
    document.querySelectorAll('.quick-request-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const units = this.getAttribute('data-units');
            const bloodGroup = this.getAttribute('data-blood-group');
            setupQuickRequest(units, bloodGroup);
        });
    });
}

/**
 * Submit blood request form
 */
async function submitBloodRequest(e) {
    e.preventDefault();
    
    // Validate all fields
    if (!validateForm()) {
        showMessage('error', 'Please fix the errors in the form');
        return;
    }

    // Collect form data
    const formData = {
        requester_id: window.hospitalId,
        requester_type: 'hospital',
        blood_group: document.getElementById('bloodGroup').value,
        units_required: parseInt(document.getElementById('unitsRequired').value),
        priority: document.getElementById('priority').value,
        required_by: `${document.getElementById('requiredDate').value}T${document.getElementById('requiredTime').value}:00`,
        patient_name: document.getElementById('patientName').value.trim(),
        patient_age: document.getElementById('patientAge').value ? parseInt(document.getElementById('patientAge').value) : null,
        patient_gender: document.getElementById('patientGender').value || null,
        medical_reason: document.getElementById('medicalReason').value.trim(),
        urgency_notes: document.getElementById('urgencyNotes').value.trim(),
        contact_person: document.getElementById('contactPerson').value.trim(),
        contact_phone: document.getElementById('contactPhone').value.trim(),
        hospital_ward: document.getElementById('hospitalWard').value.trim(),
        doctor_in_charge: document.getElementById('doctorInCharge').value.trim()
    };

    // Additional validation
    if (formData.units_required > 50) {
        showMessage('error', 'Maximum 50 units per request. For larger requests, please contact directly.');
        return;
    }

    try {
        showLoading('submitLoading', true);
        
        const response = await fetch(apiPath('/backend/api/blood_requests.php'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();
        
        if (result.success) {
            showMessage('success', 'Blood request submitted successfully!');
            
            // Show request ID if available
            if (result.data && result.data.request_id) {
                document.getElementById('successMessage').innerHTML += `
                    <br><strong>Request ID:</strong> ${result.data.request_id}
                    <br><small>You can track this request in your dashboard.</small>
                `;
            }
            
            // Reset form
            resetForm();
            
            // Reload previous requests
            loadPreviousRequests();
            
            // Show success modal
            const successModal = new bootstrap.Modal(document.getElementById('successModal'));
            successModal.show();
            
            // Redirect to dashboard after 5 seconds
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 5000);
        } else {
            showMessage('error', result.message || 'Failed to submit blood request');
        }
    } catch (error) {
        console.error('Error submitting blood request:', error);
        showMessage('error', 'Network error. Please try again.');
    } finally {
        showLoading('submitLoading', false);
    }
}

/**
 * Validate entire form
 */
function validateForm() {
    let isValid = true;
    
    // Validate each field
    isValid = validateUnits(document.getElementById('unitsRequired').value) && isValid;
    isValid = validateRequiredDateTime() && isValid;
    isValid = validatePatientInfo() && isValid;
    
    // Additional validations
    const bloodGroup = document.getElementById('bloodGroup').value;
    if (!bloodGroup) {
        document.getElementById('bloodGroupValidation').innerHTML = '<small class="text-danger">Blood group is required</small>';
        isValid = false;
    } else {
        document.getElementById('bloodGroupValidation').innerHTML = '<small class="text-success">✓ Valid</small>';
    }
    
    const priority = document.getElementById('priority').value;
    if (!priority) {
        document.getElementById('priorityValidation').innerHTML = '<small class="text-danger">Priority is required</small>';
        isValid = false;
    } else {
        document.getElementById('priorityValidation').innerHTML = '<small class="text-success">✓ Valid</small>';
    }
    
    return isValid;
}

/**
 * Toggle emergency mode
 */
function toggleEmergencyMode(isEmergency) {
    const form = document.getElementById('bloodRequestForm');
    const emergencyAlert = document.getElementById('emergencyAlert');
    
    if (isEmergency) {
        // Set to emergency priority
        document.getElementById('priority').value = 'emergency';
        updatePriorityIndicator('emergency');
        
        // Show emergency alert
        emergencyAlert.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle-fill"></i>
                <strong>EMERGENCY MODE ACTIVATED</strong>
                <p class="mb-0">Your request will be flagged as emergency and sent to all available blood banks immediately.</p>
            </div>
        `;
        
        // Add emergency class to form
        form.classList.add('emergency-mode');
        
        // Auto-fill some fields for emergency
        const now = new Date();
        const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);
        
        document.getElementById('requiredDate').value = inOneHour.toISOString().split('T')[0];
        document.getElementById('requiredTime').value = inOneHour.toTimeString().split(' ')[0].substring(0, 5);
        document.getElementById('urgencyNotes').value = 'EMERGENCY: ' + (document.getElementById('urgencyNotes').value || 'Immediate attention required');
        
    } else {
        // Remove emergency styling
        form.classList.remove('emergency-mode');
        emergencyAlert.innerHTML = '';
    }
}

/**
 * Setup quick request with predefined values
 */
function setupQuickRequest(units, bloodGroup) {
    if (!confirm(`Create quick request for ${units} units of ${bloodGroup} blood?`)) {
        return;
    }

    document.getElementById('bloodGroup').value = bloodGroup;
    document.getElementById('unitsRequired').value = units;
    
    // Set to normal priority for quick requests
    document.getElementById('priority').value = 'normal';
    updatePriorityIndicator('normal');
    
    // Focus on patient name for quick entry
    document.getElementById('patientName').focus();
    
    showMessage('info', `Quick request setup: ${units} units of ${bloodGroup}. Please fill in patient details.`);
}

/**
 * Reset form to default values
 */
function resetForm() {
    const form = document.getElementById('bloodRequestForm');
    if (form) {
        form.reset();
        
        // Reset to defaults
        initializePage();
        
        // Clear validation messages
        document.querySelectorAll('.validation-message').forEach(el => {
            el.innerHTML = '';
        });
        
        // Remove emergency mode
        const emergencyToggle = document.getElementById('emergencyToggle');
        if (emergencyToggle) {
            emergencyToggle.checked = false;
            toggleEmergencyMode(false);
        }
        
        showMessage('info', 'Form has been reset');
    }
}

/**
 * Logout function
 */
function logout() {
    // Call logout API
    fetch(apiPath('/backend/api/auth/logout.php'), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    }).finally(() => {
        // Clear local storage
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        // Redirect to login
        window.location.href = '../auth/login.html';
    });
}

/**
 * Show/hide loading state
 */
function showLoading(elementId, show) {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.display = show ? 'block' : 'none';
    }
}

/**
 * Show message to user
 */
function showMessage(type, text) {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.global-alert');
    existingMessages.forEach(msg => msg.remove());
    
    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.className = `global-alert alert alert-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'info'} alert-dismissible fade show mt-3`;
    messageDiv.role = 'alert';
    messageDiv.innerHTML = `
        ${text}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Add to page
    const container = document.querySelector('.container') || document.body;
    container.insertBefore(messageDiv, container.firstChild);
    
    // Auto-remove after 5 seconds (except success messages)
    if (type !== 'success') {
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    }
}

/**
 * Format date for display
 */
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return 'Invalid date';
    }
}

/**
 * Get CSS class for request status
 */
function getRequestStatusClass(status) {
    const statusMap = {
        'pending': 'bg-secondary',
        'approved': 'bg-success',
        'rejected': 'bg-danger',
        'fulfilled': 'bg-info',
        'partially_fulfilled': 'bg-warning',
        'cancelled': 'bg-dark',
        'in_progress': 'bg-primary'
    };
    return statusMap[status?.toLowerCase()] || 'bg-secondary';
}

/**
 * Get CSS class for priority badge
 */
function getPriorityBadgeClass(priority) {
    const priorityMap = {
        'emergency': 'bg-danger',
        'urgent': 'bg-warning',
        'normal': 'bg-success',
        'planned': 'bg-primary'
    };
    return priorityMap[priority?.toLowerCase()] || 'bg-secondary';
}

// Export for testing if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        validateForm,
        validateUnits,
        validateRequiredDateTime,
        validatePatientInfo,
        submitBloodRequest,
        toggleEmergencyMode,
        setupQuickRequest,
        getRequestStatusClass,
        getPriorityBadgeClass
    };
}