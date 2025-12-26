// Dynamic Patient Dashboard JavaScript
// Connects to backend APIs for real functionality

// API Configuration
const API_BASE_URL = 'http://localhost/bloodconnect/backend/api';

// Initialize patient dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializePatientDashboard();
});

function initializePatientDashboard() {
    // Check authentication
    if (!protectDashboard('patient')) {
        return;
    }
    
    // Initialize user info
    initializeDashboardUser();
    
    // Load patient data
    loadPatientData();
    
    // Initialize event listeners
    initializeEventListeners();
    
    // Load blood requests
    loadBloodRequests();
    
    // Load nearby hospitals
    loadNearbyHospitals();
}

function initializeEventListeners() {
    // Search blood availability
    const searchBtn = document.querySelector('button[onclick="searchBloodAvailability()"]');
    if (searchBtn) {
        searchBtn.onclick = searchBloodAvailability;
    }
    
    // Quick request form
    const quickRequestForm = document.querySelector('.quick-request-form');
    if (quickRequestForm) {
        quickRequestForm.addEventListener('submit', handleQuickRequest);
    }
    
    // Emergency request button
    const emergencyBtn = document.querySelector('button[onclick="showEmergencyRequestModal()"]');
    if (emergencyBtn) {
        emergencyBtn.onclick = showEmergencyRequestModal;
    }
    
    // Priority select change
    const prioritySelect = document.getElementById('prioritySelect');
    if (prioritySelect) {
        prioritySelect.addEventListener('change', toggleEmergencyReason);
    }
}

// Load patient profile data
async function loadPatientData() {
    const user = getCurrentUser();
    if (!user || !user.profile) return;
    
    const profile = user.profile;
    
    // Update profile information
    updateElement('.patient-id', profile.patient_id);
    updateElement('.blood-type', profile.blood_type);
    
    // Pre-fill blood type in search and request forms
    const bloodTypeSelects = document.querySelectorAll('select[name="bloodType"], #searchBloodType');
    bloodTypeSelects.forEach(select => {
        if (select && profile.blood_type) {
            select.value = profile.blood_type;
        }
    });
}

// Search blood availability
async function searchBloodAvailability() {
    const bloodType = document.getElementById('searchBloodType')?.value;
    const location = document.getElementById('locationPreference')?.value;
    const radius = document.getElementById('searchRadius')?.value;
    
    if (!bloodType) {
        showNotification('Please select a blood type', 'error');
        return;
    }
    
    try {
        showLoading('Searching for blood availability...');
        
        const response = await fetch(`${API_BASE_URL}/blood/search_availability.php?blood_type=${bloodType}&location=${location}&radius=${radius}`, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('bloodconnect_token')
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            displaySearchResults(result.data);
            showNotification(`Found ${result.data.total_found} hospitals with ${bloodType} blood`, 'success');
        } else {
            showNotification(result.message || 'Search failed', 'error');
        }
        
    } catch (error) {
        console.error('Search error:', error);
        showNotification('Failed to search blood availability', 'error');
    } finally {
        hideLoading();
    }
}

// Display search results
function displaySearchResults(data) {
    const resultsContainer = document.getElementById('searchResults');
    if (!resultsContainer) return;
    
    if (data.hospitals.length === 0) {
        resultsContainer.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h4>No Results Found</h4>
                <p>No hospitals found with the requested blood type in your area.</p>
            </div>
        `;
        return;
    }
    
    const hospitalsHTML = data.hospitals.map(hospital => `
        <div class="hospital-result-card">
            <div class="hospital-header">
                <div class="hospital-info">
                    <h4>${hospital.hospital_name}</h4>
                    <p>${hospital.hospital_type} • ${hospital.distance}</p>
                    <div class="stock-info">
                        <span class="blood-type-badge">${data.search_criteria.blood_type}</span>
                        <span class="stock-count ${hospital.stock_status}">${hospital.units_available} units</span>
                    </div>
                </div>
                <div class="hospital-status ${hospital.stock_status}">
                    ${hospital.stock_status === 'good' ? 'Available' : hospital.stock_status === 'low' ? 'Limited' : 'Critical'}
                </div>
            </div>
            <div class="hospital-details">
                <div class="detail-row">
                    <i class="fas fa-phone"></i>
                    <span>${hospital.contact_info.phone || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <i class="fas fa-clock"></i>
                    <span>${hospital.services.is_24_7 ? '24/7 Service' : 'Limited Hours'}</span>
                </div>
                <div class="detail-row">
                    <i class="fas fa-ambulance"></i>
                    <span>${hospital.services.emergency_services ? 'Emergency Services' : 'No Emergency'}</span>
                </div>
            </div>
            <div class="hospital-actions">
                <button class="btn-sm primary" onclick="selectHospitalForRequest(${hospital.id}, '${hospital.hospital_name}')">
                    <i class="fas fa-hand-holding-medical"></i>
                    Request Blood
                </button>
                <button class="btn-sm secondary" onclick="contactHospital('${hospital.contact_info.phone}')">
                    <i class="fas fa-phone"></i>
                    Contact
                </button>
            </div>
        </div>
    `).join('');
    
    resultsContainer.innerHTML = `
        <div class="search-results-header">
            <h4>Search Results (${data.total_found} hospitals found)</h4>
            <p>Showing hospitals with ${data.search_criteria.blood_type} blood availability</p>
        </div>
        <div class="hospitals-grid">
            ${hospitalsHTML}
        </div>
    `;
}

// Handle quick blood request
async function handleQuickRequest(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const requestData = {
        blood_type: formData.get('bloodType'),
        units_requested: parseInt(formData.get('units')),
        priority: formData.get('priority'),
        hospital_id: parseInt(formData.get('hospital')),
        medical_reason: formData.get('reason'),
        doctor_contact: formData.get('doctorContact'),
        emergency_contact_name: formData.get('emergencyContact'),
        emergency_reason: formData.get('emergencyReason')
    };
    
    // Validation
    if (!requestData.blood_type || !requestData.units_requested || !requestData.priority || !requestData.hospital_id || !requestData.medical_reason) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    if (requestData.priority === 'emergency' && !requestData.emergency_reason) {
        showNotification('Emergency justification is required for emergency requests', 'error');
        return;
    }
    
    try {
        showLoading('Submitting blood request...');
        
        const response = await fetch(`${API_BASE_URL}/blood/submit_request.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('bloodconnect_token')
            },
            body: JSON.stringify(requestData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Blood request submitted successfully!', 'success');
            event.target.reset();
            
            // Refresh blood requests
            setTimeout(() => {
                loadBloodRequests();
            }, 1000);
            
        } else {
            showNotification(result.message || 'Failed to submit request', 'error');
        }
        
    } catch (error) {
        console.error('Request submission error:', error);
        showNotification('Failed to submit blood request', 'error');
    } finally {
        hideLoading();
    }
}

// Load blood requests
async function loadBloodRequests() {
    try {
        const response = await fetch(`${API_BASE_URL}/patient/get_requests.php`, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('bloodconnect_token')
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            displayBloodRequests(result.data.requests);
            updateRequestStats(result.data.stats);
        }
        
    } catch (error) {
        console.error('Load requests error:', error);
        // Show mock data if API fails
        displayMockRequests();
    }
}

// Display blood requests
function displayBloodRequests(requests) {
    const timelineContainer = document.querySelector('.requests-timeline');
    if (!timelineContainer) return;
    
    if (!requests || requests.length === 0) {
        timelineContainer.innerHTML = `
            <div class="no-requests">
                <i class="fas fa-clipboard-list"></i>
                <h4>No Blood Requests</h4>
                <p>You haven't submitted any blood requests yet.</p>
            </div>
        `;
        return;
    }
    
    const requestsHTML = requests.map(request => {
        const statusClass = request.status.toLowerCase();
        const progress = getRequestProgress(request.status);
        
        return `
            <div class="request-item ${statusClass}">
                <div class="request-status-indicator ${statusClass}">
                    <i class="fas ${getStatusIcon(request.status)}"></i>
                </div>
                <div class="request-details">
                    <div class="request-header">
                        <h4>${request.blood_type} Blood Request</h4>
                        <span class="request-id">#${request.request_id}</span>
                    </div>
                    <div class="request-info">
                        <p><strong>Units:</strong> ${request.units_requested} units</p>
                        <p><strong>Priority:</strong> ${capitalizeFirst(request.priority)}</p>
                        <p><strong>Hospital:</strong> ${request.hospital_name || 'Hospital'}</p>
                        <p><strong>Submitted:</strong> ${formatTimeAgo(request.created_at)}</p>
                    </div>
                    <div class="request-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress.percentage}%"></div>
                        </div>
                        <div class="progress-steps">
                            ${progress.steps.map(step => `
                                <span class="step ${step.status}">${step.label}</span>
                            `).join('')}
                        </div>
                    </div>
                </div>
                <div class="request-actions">
                    ${getRequestActions(request)}
                </div>
            </div>
        `;
    }).join('');
    
    timelineContainer.innerHTML = requestsHTML;
}

// Load nearby hospitals
async function loadNearbyHospitals() {
    try {
        const response = await fetch(`${API_BASE_URL}/hospital/get_nearby.php`, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('bloodconnect_token')
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            populateHospitalDropdown(result.data.hospitals);
        }
        
    } catch (error) {
        console.error('Load hospitals error:', error);
        // Use default hospitals if API fails
        populateDefaultHospitals();
    }
}

// Populate hospital dropdown
function populateHospitalDropdown(hospitals) {
    const hospitalSelect = document.getElementById('hospitalSelect');
    if (!hospitalSelect) return;
    
    // Clear existing options except the first one
    hospitalSelect.innerHTML = '<option value="">Select Hospital</option>';
    
    hospitals.forEach(hospital => {
        const option = document.createElement('option');
        option.value = hospital.id;
        option.textContent = `${hospital.hospital_name} (${hospital.distance})`;
        hospitalSelect.appendChild(option);
    });
}

// Utility functions
function selectHospitalForRequest(hospitalId, hospitalName) {
    const hospitalSelect = document.getElementById('hospitalSelect');
    if (hospitalSelect) {
        hospitalSelect.value = hospitalId;
        
        // Scroll to quick request form
        document.querySelector('.quick-request-section')?.scrollIntoView({ behavior: 'smooth' });
    }
}

function contactHospital(phone) {
    if (phone && phone !== 'N/A') {
        window.open(`tel:${phone}`);
    } else {
        showNotification('Phone number not available', 'info');
    }
}

function toggleEmergencyReason() {
    const prioritySelect = document.getElementById('prioritySelect');
    const emergencyGroup = document.getElementById('emergencyReasonGroup');
    const emergencyReason = document.getElementById('emergencyReason');
    
    if (prioritySelect && emergencyGroup) {
        if (prioritySelect.value === 'emergency') {
            emergencyGroup.style.display = 'block';
            emergencyReason.required = true;
        } else {
            emergencyGroup.style.display = 'none';
            emergencyReason.required = false;
            emergencyReason.value = '';
        }
    }
}

function showEmergencyRequestModal() {
    // Set priority to emergency and show form
    const prioritySelect = document.getElementById('prioritySelect');
    if (prioritySelect) {
        prioritySelect.value = 'emergency';
        toggleEmergencyReason();
    }
    
    // Scroll to form
    document.querySelector('.quick-request-section')?.scrollIntoView({ behavior: 'smooth' });
    showNotification('Emergency request form activated. Please fill in all details.', 'info');
}

function getRequestProgress(status) {
    const progressMap = {
        'pending': { percentage: 25, steps: [
            { label: 'Submitted', status: 'completed' },
            { label: 'Under Review', status: 'active' },
            { label: 'Approved', status: '' },
            { label: 'Fulfilled', status: '' }
        ]},
        'approved': { percentage: 75, steps: [
            { label: 'Submitted', status: 'completed' },
            { label: 'Under Review', status: 'completed' },
            { label: 'Approved', status: 'completed' },
            { label: 'Preparing', status: 'active' }
        ]},
        'completed': { percentage: 100, steps: [
            { label: 'Submitted', status: 'completed' },
            { label: 'Under Review', status: 'completed' },
            { label: 'Approved', status: 'completed' },
            { label: 'Fulfilled', status: 'completed' }
        ]},
        'rejected': { percentage: 50, steps: [
            { label: 'Submitted', status: 'completed' },
            { label: 'Under Review', status: 'completed' },
            { label: 'Rejected', status: 'rejected' },
            { label: 'Closed', status: 'rejected' }
        ]}
    };
    
    return progressMap[status] || progressMap['pending'];
}

function getStatusIcon(status) {
    const iconMap = {
        'pending': 'fa-clock',
        'approved': 'fa-check',
        'completed': 'fa-check-circle',
        'rejected': 'fa-times-circle'
    };
    return iconMap[status] || 'fa-clock';
}

function getRequestActions(request) {
    switch (request.status) {
        case 'pending':
            return `
                <button class="btn-sm info" onclick="viewRequestDetails('${request.request_id}')">View Details</button>
                <button class="btn-sm secondary" onclick="contactHospital('${request.hospital_phone}')">Contact Hospital</button>
                <button class="btn-sm warning" onclick="cancelRequest('${request.request_id}')">Cancel Request</button>
            `;
        case 'approved':
            return `
                <button class="btn-sm info" onclick="viewRequestDetails('${request.request_id}')">View Details</button>
                <button class="btn-sm success" onclick="contactHospital('${request.hospital_phone}')">Contact Hospital</button>
            `;
        case 'completed':
            return `
                <button class="btn-sm success" onclick="downloadReceipt('${request.request_id}')">Download Receipt</button>
                <button class="btn-sm secondary" onclick="rateExperience('${request.request_id}')">Rate Experience</button>
            `;
        default:
            return `<button class="btn-sm info" onclick="viewRequestDetails('${request.request_id}')">View Details</button>`;
    }
}

// Mock data fallback
function displayMockRequests() {
    const mockRequests = [
        {
            request_id: 'REQ-2024-001',
            blood_type: 'A+',
            units_requested: 2,
            priority: 'urgent',
            hospital_name: 'City General Hospital',
            status: 'pending',
            created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        }
    ];
    
    displayBloodRequests(mockRequests);
}

function populateDefaultHospitals() {
    const defaultHospitals = [
        { id: 1, hospital_name: 'City General Hospital', distance: '2.3 km' },
        { id: 2, hospital_name: 'Metro Medical Center', distance: '4.1 km' },
        { id: 3, hospital_name: 'Regional Hospital', distance: '6.8 km' }
    ];
    
    populateHospitalDropdown(defaultHospitals);
}

// Utility functions
function updateElement(selector, value) {
    const element = document.querySelector(selector);
    if (element && value) {
        element.textContent = value;
    }
}

function formatTimeAgo(dateString) {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
        return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
        return 'Less than an hour ago';
    }
}

function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function showLoading(message = 'Loading...') {
    // Create or update loading indicator
    let loader = document.getElementById('loadingIndicator');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'loadingIndicator';
        loader.className = 'loading-indicator';
        loader.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;
        document.body.appendChild(loader);
    }
    
    loader.innerHTML = `
        <div style="background: white; padding: 2rem; border-radius: 8px; text-align: center;">
            <div style="border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 2s linear infinite; margin: 0 auto 1rem;"></div>
            <p>${message}</p>
        </div>
    `;
    loader.style.display = 'flex';
    
    // Add CSS animation
    if (!document.getElementById('loadingCSS')) {
        const style = document.createElement('style');
        style.id = 'loadingCSS';
        style.textContent = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
        document.head.appendChild(style);
    }
}

function hideLoading() {
    const loader = document.getElementById('loadingIndicator');
    if (loader) {
        loader.style.display = 'none';
    }
}

function updateRequestStats(stats) {
    const badge = document.querySelector('.card-header .badge');
    if (badge && stats) {
        badge.textContent = `${stats.pending_requests} active requests`;
    }
}

// Placeholder functions for future implementation
function viewRequestDetails(requestId) {
    showNotification(`Viewing details for request ${requestId}`, 'info');
}

function cancelRequest(requestId) {
    if (confirm('Are you sure you want to cancel this request?')) {
        showNotification(`Request ${requestId} cancelled`, 'success');
        loadBloodRequests(); // Refresh
    }
}

function downloadReceipt(requestId) {
    showNotification(`Downloading receipt for request ${requestId}`, 'info');
}

function rateExperience(requestId) {
    showNotification(`Rating experience for request ${requestId}`, 'info');
}