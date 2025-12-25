// frontend/js/blood-bank/requests.js

// API path helper — allows overriding `window.API_ROOT` to fix backend paths centrally
if (typeof apiPath === 'undefined') {
    var apiPath = function(p) { return (typeof window !== 'undefined' && window.API_ROOT) ? window.API_ROOT + p : p; };
}

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in and is a blood bank
    const userData = JSON.parse(localStorage.getItem('user'));
    if (!userData || userData.role !== 'blood_bank') {
        window.location.href = '../auth/login.html';
        return;
    }

    // Initialize blood bank ID
    const bloodBankId = userData.user_id;
    window.bloodBankId = bloodBankId;
    window.bloodBankData = userData;

    // Display blood bank information
    displayBloodBankInfo(userData);

    // Initialize page
    initializePage();

    // Load requests data
    loadRequests();

    // Setup event listeners
    setupEventListeners();

    // Setup modal events
    setupModalEvents();
});

/**
 * Initialize page elements
 */
function initializePage() {
    // Initialize status filter
    initializeStatusFilter();

    // Initialize priority filter
    initializePriorityFilter();

    // Initialize blood group filter
    initializeBloodGroupFilter();

    // Initialize date filters
    initializeDateFilters();
}

/**
 * Display blood bank information
 */
function displayBloodBankInfo(bloodBankData) {
    const bloodBankNameElement = document.getElementById('bloodBankName');
    const userNameElement = document.getElementById('userName');
    const userAvatarElement = document.getElementById('userAvatar');

    if (bloodBankNameElement) {
        bloodBankNameElement.textContent = bloodBankData.organization || bloodBankData.blood_bank_name || 'Blood Bank';
    }

    if (userNameElement) {
        userNameElement.textContent = `${bloodBankData.first_name || ''} ${bloodBankData.last_name || ''}`.trim();
    }

    if (userAvatarElement) {
        const initials = `${bloodBankData.first_name?.charAt(0) || 'B'}${bloodBankData.last_name?.charAt(0) || 'B'}`.toUpperCase();
        userAvatarElement.textContent = initials;
    }
}

/**
 * Initialize status filter
 */
function initializeStatusFilter() {
    const statusFilter = document.getElementById('statusFilter');
    if (!statusFilter) return;

    const statuses = [
        'All Status', 'Pending', 'Approved', 'Rejected', 'Fulfilled', 
        'Partially Fulfilled', 'Cancelled', 'In Progress'
    ];

    statuses.forEach(status => {
        const option = document.createElement('option');
        option.value = status === 'All Status' ? '' : status.toLowerCase().replace(/\s+/g, '_');
        option.textContent = status;
        statusFilter.appendChild(option);
    });
}

/**
 * Initialize priority filter
 */
function initializePriorityFilter() {
    const priorityFilter = document.getElementById('priorityFilter');
    if (!priorityFilter) return;

    const priorities = [
        'All Priorities', 'Emergency', 'Urgent', 'Normal', 'Planned'
    ];

    priorities.forEach(priority => {
        const option = document.createElement('option');
        option.value = priority === 'All Priorities' ? '' : priority.toLowerCase().replace(/\s+/g, '_');
        option.textContent = priority;
        priorityFilter.appendChild(option);
    });
}

/**
 * Initialize blood group filter
 */
function initializeBloodGroupFilter() {
    const bloodGroupFilter = document.getElementById('bloodGroupFilter');
    if (!bloodGroupFilter) return;

    const bloodGroups = [
        'All Groups', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
    ];

    bloodGroups.forEach(group => {
        const option = document.createElement('option');
        option.value = group === 'All Groups' ? '' : group;
        option.textContent = group;
        bloodGroupFilter.appendChild(option);
    });
}

/**
 * Initialize date filters
 */
function initializeDateFilters() {
    const today = new Date();
    const formattedToday = today.toISOString().split('T')[0];
    
    // Required by date filter
    const requiredByFilter = document.getElementById('requiredByFilter');
    if (requiredByFilter) {
        requiredByFilter.min = formattedToday;
    }
    
    // Created date filter
    const createdDateFilter = document.getElementById('createdDateFilter');
    if (createdDateFilter) {
        createdDateFilter.max = formattedToday;
    }
}

/**
 * Load requests data
 */
async function loadRequests() {
    try {
        showLoading('requestsLoading', true);
        
        // Build query parameters
        const params = new URLSearchParams();
        params.append('blood_bank_id', window.bloodBankId);
        
        // Add filters if set
        const statusFilter = document.getElementById('statusFilter')?.value;
        const priorityFilter = document.getElementById('priorityFilter')?.value;
        const bloodGroupFilter = document.getElementById('bloodGroupFilter')?.value;
        
        if (statusFilter) params.append('status', statusFilter);
        if (priorityFilter) params.append('priority', priorityFilter);
        if (bloodGroupFilter) params.append('blood_group', bloodGroupFilter);
        
        const response = await fetch(`/backend/api/blood_requests.php?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const result = await response.json();
        
        if (result.success && result.data) {
            displayRequests(result.data);
            updateRequestStats(result.data);
        } else {
            showMessage('warning', result.message || 'No requests found');
            displayRequests([]);
            updateRequestStats([]);
        }
    } catch (error) {
        console.error('Error loading requests:', error);
        showMessage('error', 'Failed to load requests. Please try again.');
        displayRequests([]);
        updateRequestStats([]);
    } finally {
        showLoading('requestsLoading', false);
    }
}

/**
 * Display requests in the table
 */
function displayRequests(requests) {
    const requestsTable = document.getElementById('requestsTable');
    const emptyState = document.getElementById('emptyRequestsState');
    
    if (!requestsTable) return;

    // Show/hide empty state
    if (emptyState) {
        emptyState.style.display = requests.length === 0 ? 'block' : 'none';
    }

    // Clear existing rows (except header)
    while (requestsTable.rows.length > 1) {
        requestsTable.deleteRow(1);
    }

    // Sort requests by priority and required date
    requests.sort((a, b) => {
        const priorityOrder = { emergency: 1, urgent: 2, normal: 3, planned: 4 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        
        if (priorityDiff !== 0) return priorityDiff;
        
        return new Date(a.required_by) - new Date(b.required_by);
    });

    // Add requests to table
    requests.forEach(request => {
        const row = requestsTable.insertRow();
        row.className = getRequestRowClass(request);
        row.dataset.requestId = request.id;
        
        // Calculate time remaining
        const timeRemaining = calculateTimeRemaining(request.required_by);
        
        // Format dates
        const createdDate = new Date(request.created_at);
        const requiredDate = new Date(request.required_by);
        
        const formattedCreated = createdDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
        
        const formattedRequired = requiredDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Format hospital info
        const hospitalInfo = request.hospital_name ? 
            `${request.hospital_name}<br><small class="text-muted">${request.hospital_city || ''}</small>` :
            'Unknown Hospital';
        
        row.innerHTML = `
            <td>
                <div class="d-flex align-items-center">
                    <div class="blood-group-badge bg-${getBloodGroupColor(request.blood_group)} me-2">
                        ${request.blood_group}
                    </div>
                    <div>
                        <div class="fw-medium">Req #${request.id}</div>
                        <small class="text-muted">${formattedCreated}</small>
                    </div>
                </div>
            </td>
            <td>
                <div>${hospitalInfo}</div>
                <small class="text-muted">${request.contact_person || 'No contact'}</small>
            </td>
            <td>
                <div class="fw-medium">${request.units_required} units</div>
                <small class="text-muted">${request.units_fulfilled || 0} fulfilled</small>
            </td>
            <td>
                <span class="badge ${getPriorityBadgeClass(request.priority)}">
                    ${request.priority}
                </span>
            </td>
            <td>
                <div>${formattedRequired}</div>
                <small class="${getTimeRemainingClass(timeRemaining)}">
                    <i class="bi bi-clock"></i> ${timeRemaining}
                </small>
            </td>
            <td>
                <span class="badge ${getRequestStatusClass(request.status)}">
                    ${formatRequestStatus(request.status)}
                </span>
            </td>
            <td>
                <div class="btn-group btn-group-sm" role="group">
                    <button type="button" class="btn btn-outline-primary" onclick="viewRequestDetails(${request.id})" title="View Details">
                        <i class="bi bi-eye"></i>
                    </button>
                    ${request.status === 'pending' ? `
                        <button type="button" class="btn btn-outline-success" onclick="showResponseModal(${request.id})" title="Respond">
                            <i class="bi bi-reply"></i>
                        </button>
                    ` : ''}
                    ${request.status === 'approved' ? `
                        <button type="button" class="btn btn-outline-info" onclick="updateFulfillment(${request.id})" title="Update Fulfillment">
                            <i class="bi bi-check-circle"></i>
                        </button>
                    ` : ''}
                </div>
            </td>
        `;
        
        // Add click event for the entire row
        row.addEventListener('click', function(e) {
            if (!e.target.closest('button') && !e.target.closest('a')) {
                viewRequestDetails(request.id);
            }
        });
    });
}

/**
 * Update request statistics
 */
function updateRequestStats(requests) {
    const totalRequestsElement = document.getElementById('totalRequests');
    const pendingRequestsElement = document.getElementById('pendingRequests');
    const responseTimeElement = document.getElementById('avgResponseTime');
    const fulfillmentRateElement = document.getElementById('fulfillmentRate');
    
    // Calculate statistics
    const pendingCount = requests.filter(req => req.status === 'pending').length;
    const approvedCount = requests.filter(req => req.status === 'approved').length;
    const fulfilledCount = requests.filter(req => req.status === 'fulfilled').length;
    const rejectedCount = requests.filter(req => req.status === 'rejected').length;
    
    // Calculate average response time (in hours)
    let totalResponseTime = 0;
    let respondedCount = 0;
    
    requests.forEach(request => {
        if (request.response_time) {
            totalResponseTime += request.response_time;
            respondedCount++;
        }
    });
    
    const avgResponseTime = respondedCount > 0 ? Math.round(totalResponseTime / respondedCount) : 0;
    
    // Calculate fulfillment rate
    const processedCount = approvedCount + rejectedCount + fulfilledCount;
    const fulfillmentRate = processedCount > 0 ? Math.round((fulfilledCount / processedCount) * 100) : 0;
    
    if (totalRequestsElement) {
        totalRequestsElement.textContent = requests.length;
    }
    
    if (pendingRequestsElement) {
        pendingRequestsElement.textContent = pendingCount;
        const pendingProgressBar = pendingRequestsElement.parentElement && pendingRequestsElement.parentElement.querySelector ? pendingRequestsElement.parentElement.querySelector('.progress-bar') : null;
        if (pendingProgressBar) {
            pendingProgressBar.style.width = `${(pendingCount / Math.max(requests.length, 1)) * 100}%`;
        }
    }
    
    if (responseTimeElement) {
        responseTimeElement.textContent = `${avgResponseTime}h`;
        responseTimeElement.className = `display-6 ${avgResponseTime <= 2 ? 'text-success' : avgResponseTime <= 6 ? 'text-warning' : 'text-danger'}`;
    }
    
    if (fulfillmentRateElement) {
        fulfillmentRateElement.textContent = `${fulfillmentRate}%`;
        
        // Update progress bar
        const progressBar = fulfillmentRateElement.parentElement && fulfillmentRateElement.parentElement.querySelector ? fulfillmentRateElement.parentElement.querySelector('.progress-bar') : null;
        if (progressBar) {
            progressBar.style.width = `${fulfillmentRate}%`;
            progressBar.className = `progress-bar ${fulfillmentRate >= 80 ? 'bg-success' : fulfillmentRate >= 50 ? 'bg-warning' : 'bg-danger'}`;
        }
    }
    
    // Update status distribution chart
    updateStatusDistribution(requests);
}

/**
 * Update status distribution chart
 */
function updateStatusDistribution(requests) {
    const distributionContainer = document.getElementById('statusDistribution');
    if (!distributionContainer) return;
    
    // Count by status
    const statusCounts = requests.reduce((acc, request) => {
        const status = formatRequestStatus(request.status);
        if (!acc[status]) {
            acc[status] = 0;
        }
        acc[status]++;
        return acc;
    }, {});
    
    // Clear existing content
    distributionContainer.innerHTML = '';
    
    // Create distribution bars
    const maxCount = Math.max(...Object.values(statusCounts), 1);
    
    Object.entries(statusCounts).forEach(([status, count]) => {
        const percentage = (count / maxCount) * 100;
        const statusColor = getStatusColor(status.toLowerCase());
        
        const barContainer = document.createElement('div');
        barContainer.className = 'mb-2';
        barContainer.innerHTML = `
            <div class="d-flex justify-content-between mb-1">
                <span class="fw-medium">${status}</span>
                <span class="text-muted">${count}</span>
            </div>
            <div class="progress" style="height: 8px;">
                <div class="progress-bar bg-${statusColor}" 
                     role="progressbar" 
                     style="width: ${percentage}%"
                     aria-valuenow="${count}" 
                     aria-valuemin="0" 
                     aria-valuemax="${maxCount}">
                </div>
            </div>
        `;
        
        distributionContainer.appendChild(barContainer);
    });
}

/**
 * View request details
 */
async function viewRequestDetails(requestId) {
    try {
        const response = await fetch(`/backend/api/blood_requests.php?id=${requestId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const result = await response.json();
        
        if (result.success && result.data) {
            showRequestDetailsModal(result.data);
        } else {
            showMessage('error', 'Failed to load request details');
        }
    } catch (error) {
        console.error('Error loading request details:', error);
        showMessage('error', 'Network error. Please try again.');
    }
}

/**
 * Show request details modal
 */
function showRequestDetailsModal(request) {
    const modal = new bootstrap.Modal(document.getElementById('requestDetailsModal'));
    const modalBody = document.getElementById('requestDetailsBody');
    
    if (!modalBody) return;
    
    // Format dates
    const createdDate = new Date(request.created_at);
    const requiredDate = new Date(request.required_by);
    
    const formattedCreated = createdDate.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const formattedRequired = requiredDate.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Calculate time remaining
    const timeRemaining = calculateTimeRemaining(request.required_by);
    
    modalBody.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <h6>Request Information</h6>
                <p><strong>Request ID:</strong> ${request.id}</p>
                <p><strong>Blood Group:</strong> 
                    <span class="badge bg-${getBloodGroupColor(request.blood_group)}">
                        ${request.blood_group}
                    </span>
                </p>
                <p><strong>Units Required:</strong> ${request.units_required}</p>
                <p><strong>Units Fulfilled:</strong> ${request.units_fulfilled || 0}</p>
                <p><strong>Priority:</strong> 
                    <span class="badge ${getPriorityBadgeClass(request.priority)}">
                        ${request.priority}
                    </span>
                </p>
            </div>
            <div class="col-md-6">
                <h6>Hospital Information</h6>
                <p><strong>Hospital:</strong> ${request.hospital_name || 'N/A'}</p>
                <p><strong>Address:</strong> ${request.hospital_address || 'N/A'}</p>
                <p><strong>Contact Person:</strong> ${request.contact_person || 'N/A'}</p>
                <p><strong>Contact Phone:</strong> ${request.contact_phone || 'N/A'}</p>
                <p><strong>Distance:</strong> ${request.distance || 'N/A'} km</p>
            </div>
        </div>
        
        <div class="row mt-3">
            <div class="col-md-6">
                <h6>Timeline</h6>
                <p><strong>Created:</strong> ${formattedCreated}</p>
                <p><strong>Required By:</strong> ${formattedRequired}</p>
                <p><strong>Time Remaining:</strong> 
                    <span class="${getTimeRemainingClass(timeRemaining)}">
                        ${timeRemaining}
                    </span>
                </p>
                <p><strong>Status:</strong> 
                    <span class="badge ${getRequestStatusClass(request.status)}">
                        ${formatRequestStatus(request.status)}
                    </span>
                </p>
            </div>
            <div class="col-md-6">
                <h6>Patient Information</h6>
                ${request.patient_name ? `<p><strong>Patient:</strong> ${request.patient_name}</p>` : ''}
                ${request.patient_age ? `<p><strong>Age:</strong> ${request.patient_age}</p>` : ''}
                ${request.patient_gender ? `<p><strong>Gender:</strong> ${request.patient_gender}</p>` : ''}
                ${request.medical_reason ? `<p><strong>Medical Reason:</strong> ${request.medical_reason}</p>` : ''}
                ${request.hospital_ward ? `<p><strong>Ward:</strong> ${request.hospital_ward}</p>` : ''}
                ${request.doctor_in_charge ? `<p><strong>Doctor:</strong> ${request.doctor_in_charge}</p>` : ''}
            </div>
        </div>
        
        ${request.urgency_notes ? `
            <div class="row mt-3">
                <div class="col-12">
                    <h6>Urgency Notes</h6>
                    <div class="alert ${request.priority === 'emergency' ? 'alert-danger' : 'alert-warning'}">
                        ${request.urgency_notes}
                    </div>
                </div>
            </div>
        ` : ''}
        
        ${request.blood_bank_responses && request.blood_bank_responses.length > 0 ? `
            <div class="row mt-3">
                <div class="col-12">
                    <h6>Blood Bank Responses</h6>
                    <div class="list-group">
                        ${request.blood_bank_responses.map(response => `
                            <div class="list-group-item ${response.blood_bank_id == window.bloodBankId ? 'active' : ''}">
                                <div class="d-flex w-100 justify-content-between">
                                    <h6 class="mb-1">${response.blood_bank_name}</h6>
                                    <span class="badge ${response.status === 'approved' ? 'bg-success' : 'bg-danger'}">
                                        ${response.status}
                                    </span>
                                </div>
                                ${response.units_offered ? `<p class="mb-1">Offering: ${response.units_offered} units</p>` : ''}
                                ${response.notes ? `<small class="${response.blood_bank_id == window.bloodBankId ? 'text-light' : 'text-muted'}">${response.notes}</small>` : ''}
                                <div class="mt-1">
                                    <small class="${response.blood_bank_id == window.bloodBankId ? 'text-light' : 'text-muted'}">
                                        Responded: ${new Date(response.response_date).toLocaleString()}
                                    </small>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        ` : ''}
    `;
    
    try {
        modal.show();
    } catch (err) {
        console.error('Failed to show request details modal', err);
    }
}

/**
 * Show response modal for a request
 */
async function showResponseModal(requestId) {
    // Load request details first
    try {
        const response = await fetch(`/backend/api/blood_requests.php?id=${requestId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const result = await response.json();
        
        if (result.success && result.data) {
            const request = result.data;
            setupResponseModal(request);
        } else {
            showMessage('error', 'Failed to load request for response');
        }
    } catch (error) {
        console.error('Error loading request for response:', error);
        showMessage('error', 'Network error. Please try again.');
    }
}

/**
 * Setup response modal with request data
 */
function setupResponseModal(request) {
    const modalEl = document.getElementById('responseModal');
    if (!modalEl) return;
    const modal = new bootstrap.Modal(modalEl);
    
    // Set request ID
    const responseFormEl = document.getElementById('responseForm');
    if (responseFormEl) responseFormEl.dataset.requestId = request.id;
    
    // Display request info
    const responseRequestInfoEl = document.getElementById('responseRequestInfo');
    if (responseRequestInfoEl) responseRequestInfoEl.innerHTML = `
        <div class="alert alert-info">
            <strong>Request Details:</strong><br>
            Blood Group: <span class="badge bg-${getBloodGroupColor(request.blood_group)}">${request.blood_group}</span><br>
            Units Required: ${request.units_required}<br>
            Priority: <span class="badge ${getPriorityBadgeClass(request.priority)}">${request.priority}</span><br>
            Hospital: ${request.hospital_name || 'Unknown'}
        </div>
    `;
    
    // Check inventory availability
    checkInventoryForResponse(request.blood_group, request.units_required);
    
    try { modal.show(); } catch (err) { console.error('Failed to show response modal', err); }
}

/**
 * Check inventory availability for response
 */
async function checkInventoryForResponse(bloodGroup, unitsRequired) {
    try {
        const response = await fetch(`/backend/api/blood_inventory.php?blood_bank_id=${window.bloodBankId}&blood_group=${bloodGroup}&status=available`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const result = await response.json();
        
        const inventoryInfo = document.getElementById('inventoryInfo');
        const unitsOfferedInput = document.getElementById('unitsOffered');
        
        if (!inventoryInfo || !unitsOfferedInput) return;
        
        if (result.success && result.data) {
            const totalAvailable = result.data.reduce((sum, item) => sum + (item.units_available || 0), 0);
            
            if (totalAvailable >= unitsRequired) {
                inventoryInfo.innerHTML = `
                    <div class="alert alert-success">
                        <i class="bi bi-check-circle"></i>
                        <strong>Inventory Available:</strong> ${totalAvailable} units of ${bloodGroup} blood
                    </div>
                `;
                unitsOfferedInput.max = Math.min(totalAvailable, unitsRequired);
                unitsOfferedInput.value = unitsRequired;
            } else if (totalAvailable > 0) {
                inventoryInfo.innerHTML = `
                    <div class="alert alert-warning">
                        <i class="bi bi-exclamation-triangle"></i>
                        <strong>Partial Availability:</strong> ${totalAvailable} units available (${unitsRequired} required)
                        <div class="form-check mt-2">
                            <input class="form-check-input" type="checkbox" id="offerPartial" checked>
                            <label class="form-check-label" for="offerPartial">
                                Offer partial fulfillment (${totalAvailable} units)
                            </label>
                        </div>
                    </div>
                `;
                unitsOfferedInput.max = totalAvailable;
                unitsOfferedInput.value = totalAvailable;
                
                // Add event listener for partial offer checkbox
                const offerPartialEl = document.getElementById('offerPartial');
                if (offerPartialEl) {
                    // use onchange assignment to avoid duplicate handlers
                    offerPartialEl.onchange = function() {
                        if (this.checked) {
                            unitsOfferedInput.value = totalAvailable;
                            unitsOfferedInput.disabled = false;
                        } else {
                            unitsOfferedInput.value = 0;
                            unitsOfferedInput.disabled = true;
                        }
                    };
                }
            } else {
                inventoryInfo.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="bi bi-x-circle"></i>
                        <strong>No Availability:</strong> 0 units of ${bloodGroup} blood available
                    </div>
                `;
                unitsOfferedInput.value = 0;
                unitsOfferedInput.disabled = true;
                const responseActionEl = document.getElementById('responseAction');
                if (responseActionEl) responseActionEl.value = 'reject';
            }
        } else {
            inventoryInfo.innerHTML = `
                <div class="alert alert-secondary">
                    <i class="bi bi-question-circle"></i>
                    Unable to check inventory availability
                </div>
            `;
        }
    } catch (error) {
        console.error('Error checking inventory:', error);
    }
}

/**
 * Update fulfillment for an approved request
 */
async function updateFulfillment(requestId) {
    const unitsFulfilled = prompt('Enter number of units fulfilled:', "0");
    if (!unitsFulfilled || isNaN(unitsFulfilled)) return;

    const unitsNum = parseInt(unitsFulfilled);
    
    try {
        const response = await fetch(apiPath('/backend/api/blood_requests.php'), {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                id: requestId,
                units_fulfilled: unitsNum,
                updated_by: window.bloodBankId
            })
        });

        const result = await response.json();
        
        if (result.success) {
            showMessage('success', 'Fulfillment updated successfully!');
            loadRequests(); // Refresh requests
        } else {
            showMessage('error', result.message || 'Failed to update fulfillment');
        }
    } catch (error) {
        console.error('Error updating fulfillment:', error);
        showMessage('error', 'Network error. Please try again.');
    }
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

    // Refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadRequests);
    }

    // Filter buttons
    const applyFiltersBtn = document.getElementById('applyFiltersBtn');
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', loadRequests);
    }

    const clearFiltersBtn = document.getElementById('clearFiltersBtn');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearFilters);
    }

    // Export button
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportRequests);
    }

    // Response form submission
    const responseForm = document.getElementById('responseForm');
    if (responseForm) {
        responseForm.addEventListener('submit', submitResponse);
    }
}

/**
 * Setup modal events
 */
function setupModalEvents() {
    // Response modal
    const responseModal = document.getElementById('responseModal');
    if (responseModal) {
        responseModal.addEventListener('hidden.bs.modal', resetResponseForm);
    }
}

/**
 * Clear all filters
 */
function clearFilters() {
    const statusEl = document.getElementById('statusFilter'); if (statusEl) statusEl.value = '';
    const priorityEl = document.getElementById('priorityFilter'); if (priorityEl) priorityEl.value = '';
    const bloodGroupEl = document.getElementById('bloodGroupFilter'); if (bloodGroupEl) bloodGroupEl.value = '';
    const requiredByEl = document.getElementById('requiredByFilter'); if (requiredByEl) requiredByEl.value = '';
    const createdDateEl = document.getElementById('createdDateFilter'); if (createdDateEl) createdDateEl.value = '';
    
    loadRequests();
}

/**
 * Submit response to a request
 */
async function submitResponse(e) {
    e.preventDefault();
    
    const form = document.getElementById('responseForm');
    const requestId = form && form.dataset ? form.dataset.requestId : null;
    
    if (!requestId) {
        showMessage('error', 'Request ID not found');
        return;
    }
    
    // Collect form data
    const actionEl = document.getElementById('responseAction');
    const unitsEl = document.getElementById('unitsOffered');
    const notesEl = document.getElementById('responseNotes');
    const action = actionEl ? actionEl.value : 'reject';
    const unitsOffered = unitsEl ? parseInt(unitsEl.value) || 0 : 0;
    const notes = notesEl ? notesEl.value.trim() : '';
    
    // Validation
    if (action === 'approve' && unitsOffered <= 0) {
        showMessage('error', 'Please enter number of units offered');
        return;
    }

    try {
        showLoading('responseLoading', true);
        
        const response = await fetch(apiPath('/backend/api/request_routing.php'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                request_id: parseInt(requestId),
                blood_bank_id: window.bloodBankId,
                action: action,
                units_offered: action === 'approve' ? unitsOffered : null,
                notes: notes
            })
        });

        const result = await response.json();
        
        if (result.success) {
            showMessage('success', `Request ${action === 'approve' ? 'approved' : 'rejected'} successfully!`);
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('responseModal'));
            modal.hide();
            
            // Refresh requests
            loadRequests();
        } else {
            showMessage('error', result.message || `Failed to ${action} request`);
        }
    } catch (error) {
        console.error('Error submitting response:', error);
        showMessage('error', 'Network error. Please try again.');
    } finally {
        showLoading('responseLoading', false);
    }
}

/**
 * Reset response form
 */
function resetResponseForm() {
    const form = document.getElementById('responseForm');
    if (form) {
        try { form.reset(); } catch (err) { /* ignore */ }
        if (form.dataset) delete form.dataset.requestId;
        
        // Reset inventory info
        const inventoryInfo = document.getElementById('inventoryInfo');
        if (inventoryInfo) inventoryInfo.innerHTML = '';
        
        // Reset units offered
        const unitsOfferedInput = document.getElementById('unitsOffered');
        if (unitsOfferedInput) {
            unitsOfferedInput.value = 0;
            unitsOfferedInput.disabled = false;
            unitsOfferedInput.max = 100;
        }
    }
}

/**
 * Export requests to CSV
 */
function exportRequests() {
    showMessage('info', 'Export feature would generate a CSV file of requests');
    
    // In a real implementation, this would:
    // 1. Fetch all request data
    // 2. Convert to CSV format
    // 3. Create download link
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
 * Calculate time remaining
 */
function calculateTimeRemaining(requiredDate) {
    const now = new Date();
    const required = new Date(requiredDate);
    const diffMs = required - now;
    
    if (diffMs <= 0) return 'Overdue';
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
        return `${diffDays}d ${diffHours % 24}h`;
    } else if (diffHours > 0) {
        return `${diffHours}h`;
    } else {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return `${diffMinutes}m`;
    }
}

/**
 * Get CSS class for time remaining
 */
function getTimeRemainingClass(timeRemaining) {
    if (timeRemaining === 'Overdue') return 'text-danger';
    if (timeRemaining.includes('h') || timeRemaining.includes('m')) return 'text-warning';
    return 'text-success';
}

/**
 * Get CSS class for request row
 */
function getRequestRowClass(request) {
    if (request.priority === 'emergency') return 'table-danger';
    if (request.priority === 'urgent') return 'table-warning';
    if (request.status === 'approved') return 'table-success';
    if (request.status === 'fulfilled') return 'table-info';
    if (request.status === 'rejected') return 'table-secondary';
    return '';
}

/**
 * Get CSS class for blood group
 */
function getBloodGroupColor(bloodGroup) {
    const colorMap = {
        'A+': 'primary',
        'A-': 'info',
        'B+': 'success',
        'B-': 'secondary',
        'AB+': 'warning',
        'AB-': 'dark',
        'O+': 'danger',
        'O-': 'light'
    };
    return colorMap[bloodGroup] || 'primary';
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

/**
 * Get CSS class for request status
 */
function getRequestStatusClass(status) {
    const statusMap = {
        'pending': 'bg-secondary',
        'approved': 'bg-primary',
        'rejected': 'bg-danger',
        'fulfilled': 'bg-success',
        'partially_fulfilled': 'bg-warning',
        'cancelled': 'bg-dark',
        'in_progress': 'bg-info'
    };
    return statusMap[status?.toLowerCase()] || 'bg-secondary';
}

/**
 * Format request status for display
 */
function formatRequestStatus(status) {
    const statusMap = {
        'pending': 'Pending',
        'approved': 'Approved',
        'rejected': 'Rejected',
        'fulfilled': 'Fulfilled',
        'partially_fulfilled': 'Partial',
        'cancelled': 'Cancelled',
        'in_progress': 'In Progress'
    };
    return statusMap[status?.toLowerCase()] || status || 'Unknown';
}

/**
 * Get status color for distribution chart
 */
function getStatusColor(status) {
    const colorMap = {
        'pending': 'secondary',
        'approved': 'primary',
        'rejected': 'danger',
        'fulfilled': 'success',
        'partial': 'warning',
        'cancelled': 'dark',
        'in progress': 'info'
    };
    return colorMap[status] || 'secondary';
}

// Export for testing if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadRequests,
        displayRequests,
        updateRequestStats,
        calculateTimeRemaining,
        getTimeRemainingClass,
        getBloodGroupColor,
        getPriorityBadgeClass,
        getRequestStatusClass,
        formatRequestStatus
    };
}
