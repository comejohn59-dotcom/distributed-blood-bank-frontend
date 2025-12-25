// frontend/js/blood-bank/dashboard.js

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

    // Initialize blood bank ID and data
    const bloodBankId = userData.user_id;
    window.bloodBankId = bloodBankId;
    window.bloodBankData = userData;

    // Display blood bank information
    displayBloodBankInfo(userData);

    // Load all dashboard data
    loadDashboardData();

    // Setup event listeners
    setupEventListeners();

    // Load notifications
    loadNotifications();

    // Setup auto-refresh
    setupAutoRefresh();
});

/**
 * Display blood bank information
 */
function displayBloodBankInfo(bloodBankData) {
    const bloodBankNameElement = document.getElementById('bloodBankName');
    const bloodBankAddressElement = document.getElementById('bloodBankAddress');
    const userNameElement = document.getElementById('userName');
    const userAvatarElement = document.getElementById('userAvatar');
    const bloodBankStatsElement = document.getElementById('bloodBankStats');

    // Display blood bank name
    if (bloodBankNameElement) {
        bloodBankNameElement.textContent = bloodBankData.organization || bloodBankData.blood_bank_name || 'Blood Bank';
    }

    // Display blood bank address
    if (bloodBankAddressElement && bloodBankData.address) {
        bloodBankAddressElement.textContent = `${bloodBankData.address}, ${bloodBankData.city || ''}, ${bloodBankData.state || ''}`;
        bloodBankAddressElement.style.display = 'block';
    }

    // Display user name
    if (userNameElement) {
        userNameElement.textContent = `${bloodBankData.first_name || ''} ${bloodBankData.last_name || ''}`.trim();
    }

    // Display user avatar
    if (userAvatarElement) {
        const initials = `${bloodBankData.first_name?.charAt(0) || 'B'}${bloodBankData.last_name?.charAt(0) || 'B'}`.toUpperCase();
        userAvatarElement.textContent = initials;
    }

    // Display blood bank statistics
    if (bloodBankStatsElement) {
        let badges = [];
        
        if (bloodBankData.blood_bank_type) {
            const typeMap = {
                'government': 'bg-primary',
                'private': 'bg-success',
                'charity': 'bg-info',
                'hospital_attached': 'bg-warning'
            };
            const badgeClass = typeMap[bloodBankData.blood_bank_type.toLowerCase()] || 'bg-secondary';
            badges.push(`<span class="badge ${badgeClass} me-1">${bloodBankData.blood_bank_type}</span>`);
        }
        
        if (bloodBankData.accreditation_status === 'accredited') {
            badges.push('<span class="badge bg-success me-1">Accredited</span>');
        }
        
        if (bloodBankData.operating_hours) {
            badges.push(`<span class="badge bg-dark me-1">${bloodBankData.operating_hours}</span>`);
        }
        
        bloodBankStatsElement.innerHTML = badges.join('');
    }
}

/**
 * Load all dashboard data
 */
async function loadDashboardData() {
    try {
        showLoading(true);
        
        // Load multiple data sources in parallel
        const [inventoryData, requestsData, statsData, pendingAppointments] = await Promise.allSettled([
            fetchBloodInventory(),
            fetchBloodRequests(),
            fetchBloodBankStats(),
            fetchPendingAppointments()
        ]);

        // Process inventory data
        if (inventoryData.status === 'fulfilled' && inventoryData.value) {
            displayInventorySummary(inventoryData.value);
        }

        // Process blood requests
        if (requestsData.status === 'fulfilled' && requestsData.value) {
            displayBloodRequests(requestsData.value);
            updateRequestStats(requestsData.value);
        }

        // Process blood bank stats
        if (statsData.status === 'fulfilled' && statsData.value) {
            displayBloodBankStats(statsData.value);
        }

        // Process pending appointments
        if (pendingAppointments.status === 'fulfilled' && pendingAppointments.value) {
            displayPendingAppointments(pendingAppointments.value);
        }

        // Load critical shortages
        await loadCriticalShortages();

    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showMessage('error', 'Failed to load dashboard data. Please refresh.');
    } finally {
        showLoading(false);
    }
}

/**
 * Fetch blood inventory for the blood bank
 */
async function fetchBloodInventory() {
    try {
        const response = await fetch(`/backend/api/blood_inventory.php?blood_bank_id=${window.bloodBankId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const result = await response.json();
        
        if (result.success && result.data) {
            return result.data;
        } else {
            showMessage('warning', result.message || 'No inventory data found');
            return [];
        }
    } catch (error) {
        console.error('Error fetching blood inventory:', error);
        return [];
    }
}

/**
 * Fetch blood requests for the blood bank
 */
async function fetchBloodRequests() {
    try {
        const response = await fetch(`/backend/api/blood_requests.php?blood_bank_id=${window.bloodBankId}&status=pending,approved`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const result = await response.json();
        
        if (result.success && result.data) {
            return result.data;
        } else {
            showMessage('warning', result.message || 'No pending requests found');
            return [];
        }
    } catch (error) {
        console.error('Error fetching blood requests:', error);
        return [];
    }
}

/**
 * Fetch blood bank statistics
 */
async function fetchBloodBankStats() {
    try {
        const response = await fetch(`/backend/api/reports/summary.php?blood_bank_id=${window.bloodBankId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const result = await response.json();
        
        if (result.success && result.data) {
            return result.data;
        }
        return null;
    } catch (error) {
        console.error('Error fetching blood bank stats:', error);
        return null;
    }
}

/**
 * Fetch pending appointments
 */
async function fetchPendingAppointments() {
    try {
        const today = new Date().toISOString().split('T')[0];
        const response = await fetch(`/backend/api/appointments.php?blood_bank_id=${window.bloodBankId}&status=scheduled,confirmed&from_date=${today}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const result = await response.json();
        
        if (result.success && result.data) {
            return result.data;
        }
        return [];
    } catch (error) {
        console.error('Error fetching pending appointments:', error);
        return [];
    }
}

/**
 * Load critical shortages
 */
async function loadCriticalShortages() {
    try {
        const response = await fetch(`/backend/api/blood_inventory.php?blood_bank_id=${window.bloodBankId}&critical_only=true`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const result = await response.json();
        
        if (result.success && result.data && result.data.length > 0) {
            displayCriticalShortages(result.data);
        }
    } catch (error) {
        console.error('Error loading critical shortages:', error);
    }
}

/**
 * Display inventory summary
 */
function displayInventorySummary(inventory) {
    const inventoryContainer = document.getElementById('inventorySummary');
    const totalUnitsElement = document.getElementById('totalUnits');
    const lowStockCountElement = document.getElementById('lowStockCount');
    
    if (!inventoryContainer) return;

    // Calculate totals
    let totalUnits = 0;
    let lowStockCount = 0;
    
    inventory.forEach(item => {
        totalUnits += item.units_available || 0;
        if (item.status === 'low' || item.status === 'critical') {
            lowStockCount++;
        }
    });

    // Update total units
    if (totalUnitsElement) {
        totalUnitsElement.textContent = totalUnits;
    }

    // Update low stock count
    if (lowStockCountElement) {
        lowStockCountElement.textContent = lowStockCount;
        lowStockCountElement.parentElement.querySelector('.progress-bar').style.width = `${(lowStockCount / Math.max(inventory.length, 1)) * 100}%`;
    }

    // Create inventory cards for each blood group
    inventoryContainer.innerHTML = '';
    
    // Group by blood group
    const groupedInventory = inventory.reduce((acc, item) => {
        if (!acc[item.blood_group]) {
            acc[item.blood_group] = {
                units: 0,
                status: 'adequate',
                components: []
            };
        }
        acc[item.blood_group].units += item.units_available || 0;
        acc[item.blood_group].components.push(item);
        
        // Determine overall status (worst status among components)
        const statusOrder = { critical: 1, low: 2, adequate: 3, high: 4 };
        if (statusOrder[item.status] < statusOrder[acc[item.blood_group].status]) {
            acc[item.blood_group].status = item.status;
        }
        
        return acc;
    }, {});

    // Create cards for each blood group
    Object.entries(groupedInventory).forEach(([bloodGroup, data]) => {
        const card = document.createElement('div');
        card.className = 'col-md-3 col-sm-6 mb-3';
        
        const statusColor = getInventoryStatusColor(data.status);
        const statusIcon = getInventoryStatusIcon(data.status);
        
        card.innerHTML = `
            <div class="card h-100">
                <div class="card-body text-center">
                    <h4 class="card-title">${bloodGroup}</h4>
                    <div class="display-4 fw-bold text-${statusColor}">${data.units}</div>
                    <p class="card-text">Units Available</p>
                    <div class="mt-2">
                        <span class="badge bg-${statusColor}">
                            <i class="bi ${statusIcon}"></i> ${data.status.toUpperCase()}
                        </span>
                    </div>
                    <div class="mt-2">
                        <small class="text-muted">${data.components.length} component(s)</small>
                    </div>
                </div>
            </div>
        `;
        
        // Add click event to navigate to inventory page
        card.addEventListener('click', function() {
            window.location.href = `inventory.html?blood_group=${bloodGroup}`;
        });
        
        inventoryContainer.appendChild(card);
    });
}

/**
 * Display blood requests
 */
function displayBloodRequests(requests) {
    const requestsTable = document.getElementById('requestsTable');
    const emptyState = document.getElementById('emptyRequestsState');
    const urgentRequestsBadge = document.getElementById('urgentRequestsBadge');
    
    if (!requestsTable) return;

    // Count urgent requests
    const urgentCount = requests.filter(req => req.priority === 'emergency' || req.priority === 'urgent').length;
    if (urgentRequestsBadge) {
        urgentRequestsBadge.textContent = urgentCount;
        urgentRequestsBadge.style.display = urgentCount > 0 ? 'inline-block' : 'none';
    }

    // Show/hide empty state
    if (emptyState) {
        emptyState.style.display = requests.length === 0 ? 'block' : 'none';
    }

    // Clear existing rows
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
                        <div class="fw-medium">${request.blood_group}</div>
                        <small class="text-muted">Req ID: ${request.id}</small>
                    </div>
                </div>
            </td>
            <td>
                <div>${hospitalInfo}</div>
            </td>
            <td>
                <div class="fw-medium">${request.units_required} units</div>
                <small class="text-muted">Distance: ${request.distance || 'N/A'} km</small>
            </td>
            <td>
                <span class="badge ${getPriorityBadgeClass(request.priority)}">
                    ${request.priority}
                </span>
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
                        <button type="button" class="btn btn-outline-success" onclick="approveRequest(${request.id})" title="Approve">
                            <i class="bi bi-check-circle"></i>
                        </button>
                        <button type="button" class="btn btn-outline-danger" onclick="rejectRequest(${request.id})" title="Reject">
                            <i class="bi bi-x-circle"></i>
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
    const approvedRequestsElement = document.getElementById('approvedRequests');
    const fulfillmentRateElement = document.getElementById('fulfillmentRate');
    
    if (totalRequestsElement) {
        totalRequestsElement.textContent = requests.length;
    }
    
    // Calculate statistics
    const pendingCount = requests.filter(req => req.status === 'pending').length;
    const approvedCount = requests.filter(req => req.status === 'approved').length;
    const fulfilledCount = requests.filter(req => req.status === 'fulfilled').length;
    const totalProcessed = requests.filter(req => req.status !== 'pending').length;
    const fulfillmentRate = totalProcessed > 0 ? Math.round((fulfilledCount / totalProcessed) * 100) : 0;
    
    if (pendingRequestsElement) {
        pendingRequestsElement.textContent = pendingCount;
        pendingRequestsElement.parentElement.querySelector('.progress-bar').style.width = `${(pendingCount / Math.max(requests.length, 1)) * 100}%`;
    }
    
    if (approvedRequestsElement) {
        approvedRequestsElement.textContent = approvedCount;
    }
    
    if (fulfillmentRateElement) {
        fulfillmentRateElement.textContent = `${fulfillmentRate}%`;
        
        // Update progress bar
        const progressBar = fulfillmentRateElement.parentElement.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.style.width = `${fulfillmentRate}%`;
            progressBar.className = `progress-bar ${fulfillmentRate >= 80 ? 'bg-success' : fulfillmentRate >= 50 ? 'bg-warning' : 'bg-danger'}`;
        }
    }
}

/**
 * Display blood bank statistics
 */
function displayBloodBankStats(stats) {
    // Update stats cards
    const monthlyDonationsElement = document.getElementById('monthlyDonations');
    const activeDonorsElement = document.getElementById('activeDonors');
    const todayAppointmentsElement = document.getElementById('todayAppointments');
    const responseRateElement = document.getElementById('responseRate');
    
    if (monthlyDonationsElement && stats.monthly_donations !== undefined) {
        monthlyDonationsElement.textContent = stats.monthly_donations;
        
        // Calculate trend
        if (stats.previous_month_donations !== undefined) {
            const trend = ((stats.monthly_donations - stats.previous_month_donations) / Math.max(stats.previous_month_donations, 1)) * 100;
            const trendElement = monthlyDonationsElement.parentElement.querySelector('.trend');
            if (trendElement) {
                trendElement.textContent = `${trend >= 0 ? '+' : ''}${trend.toFixed(1)}%`;
                trendElement.className = `trend ${trend >= 0 ? 'text-success' : 'text-danger'}`;
            }
        }
    }
    
    if (activeDonorsElement && stats.active_donors !== undefined) {
        activeDonorsElement.textContent = stats.active_donors;
    }
    
    if (todayAppointmentsElement && stats.today_appointments !== undefined) {
        todayAppointmentsElement.textContent = stats.today_appointments;
        
        // Color code based on count
        todayAppointmentsElement.className = `display-6 ${stats.today_appointments > 10 ? 'text-success' : stats.today_appointments > 5 ? 'text-warning' : 'text-danger'}`;
    }
    
    if (responseRateElement && stats.response_rate !== undefined) {
        responseRateElement.textContent = `${stats.response_rate}%`;
        
        // Update progress bar
        const progressBar = responseRateElement.parentElement.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.style.width = `${stats.response_rate}%`;
            progressBar.className = `progress-bar ${stats.response_rate >= 80 ? 'bg-success' : stats.response_rate >= 50 ? 'bg-warning' : 'bg-danger'}`;
        }
    }
}

/**
 * Display pending appointments
 */
function displayPendingAppointments(appointments) {
    const appointmentsList = document.getElementById('pendingAppointments');
    if (!appointmentsList) return;
    
    appointmentsList.innerHTML = '';
    
    if (appointments.length === 0) {
        appointmentsList.innerHTML = `
            <div class="text-center py-3 text-muted">
                <i class="bi bi-calendar-check display-6"></i>
                <p class="mt-2">No pending appointments today</p>
            </div>
        `;
        return;
    }
    
    // Sort by appointment time
    appointments.sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date));
    
    // Display appointments
    appointments.forEach(appointment => {
        const appointmentItem = document.createElement('div');
        appointmentItem.className = 'list-group-item list-group-item-action';
        
        const appointmentTime = new Date(appointment.appointment_date);
        const formattedTime = appointmentTime.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        appointmentItem.innerHTML = `
            <div class="d-flex w-100 justify-content-between">
                <div>
                    <h6 class="mb-1">${appointment.donor_name || 'Donor'}</h6>
                    <p class="mb-1">
                        <span class="badge bg-${getBloodGroupColor(appointment.blood_group)}">
                            ${appointment.blood_group}
                        </span>
                        <small class="ms-2">${appointment.purpose || 'Regular Donation'}</small>
                    </p>
                </div>
                <div class="text-end">
                    <div class="fw-bold">${formattedTime}</div>
                    <span class="badge ${getAppointmentStatusClass(appointment.status)}">
                        ${appointment.status}
                    </span>
                </div>
            </div>
            ${appointment.notes ? `<small class="text-muted">${appointment.notes}</small>` : ''}
        `;
        
        appointmentItem.addEventListener('click', function() {
            viewAppointmentDetails(appointment.id);
        });
        
        appointmentsList.appendChild(appointmentItem);
    });
}

/**
 * Display critical shortages
 */
function displayCriticalShortages(shortages) {
    const shortagesContainer = document.getElementById('criticalShortages');
    if (!shortagesContainer) return;
    
    shortagesContainer.innerHTML = '';
    
    shortages.forEach(shortage => {
        if (shortage.status === 'critical') {
            const alertDiv = document.createElement('div');
            alertDiv.className = 'alert alert-danger alert-dismissible fade show';
            alertDiv.innerHTML = `
                <div class="d-flex align-items-center">
                    <i class="bi bi-exclamation-triangle-fill me-2"></i>
                    <div class="flex-grow-1">
                        <strong>CRITICAL SHORTAGE: ${shortage.blood_group}</strong>
                        <div class="small">
                            Available: ${shortage.units_available} units | 
                            Minimum Required: ${shortage.minimum_required || 10} units
                        </div>
                    </div>
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
                <div class="mt-2">
                    <button class="btn btn-sm btn-outline-light me-2" onclick="window.location.href='inventory.html?blood_group=${shortage.blood_group}'">
                        <i class="bi bi-box-arrow-up-right"></i> Manage Inventory
                    </button>
                    <button class="btn btn-sm btn-light" onclick="sendUrgentRequest('${shortage.blood_group}')">
                        <i class="bi bi-megaphone"></i> Send Urgent Request
                    </button>
                </div>
            `;
            
            shortagesContainer.appendChild(alertDiv);
        }
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
            showRequestModal(result.data);
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
function showRequestModal(request) {
    const modal = new bootstrap.Modal(document.getElementById('requestDetailsModal'));
    const modalBody = document.getElementById('requestDetailsBody');
    
    if (!modalBody) return;
    
    // Format dates
    const createdDate = new Date(request.created_at);
    const requiredDate = new Date(request.required_by);
    
    const formattedCreated = createdDate.toLocaleString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const formattedRequired = requiredDate.toLocaleString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
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
                <p><strong>Priority:</strong> 
                    <span class="badge ${getPriorityBadgeClass(request.priority)}">
                        ${request.priority}
                    </span>
                </p>
            </div>
            <div class="col-md-6">
                <h6>Hospital Information</h6>
                <p><strong>Hospital:</strong> ${request.hospital_name || 'N/A'}</p>
                <p><strong>Contact:</strong> ${request.contact_person || 'N/A'}</p>
                <p><strong>Phone:</strong> ${request.contact_phone || 'N/A'}</p>
                <p><strong>Distance:</strong> ${request.distance || 'N/A'} km</p>
            </div>
        </div>
        
        <div class="row mt-3">
            <div class="col-md-6">
                <h6>Timeline</h6>
                <p><strong>Created:</strong> ${formattedCreated}</p>
                <p><strong>Required By:</strong> ${formattedRequired}</p>
                <p><strong>Time Remaining:</strong> ${calculateTimeRemaining(request.required_by)}</p>
            </div>
            <div class="col-md-6">
                <h6>Patient Information</h6>
                ${request.patient_name ? `<p><strong>Patient:</strong> ${request.patient_name}</p>` : ''}
                ${request.patient_age ? `<p><strong>Age:</strong> ${request.patient_age}</p>` : ''}
                ${request.medical_reason ? `<p><strong>Reason:</strong> ${request.medical_reason}</p>` : ''}
                ${request.hospital_ward ? `<p><strong>Ward:</strong> ${request.hospital_ward}</p>` : ''}
            </div>
        </div>
        
        ${request.urgency_notes ? `
            <div class="row mt-3">
                <div class="col-12">
                    <h6>Additional Notes</h6>
                    <div class="alert ${request.priority === 'emergency' ? 'alert-danger' : 'alert-warning'}">
                        ${request.urgency_notes}
                    </div>
                </div>
            </div>
        ` : ''}
        
        <div class="row mt-3">
            <div class="col-12">
                <h6>Your Inventory</h6>
                <div id="inventoryCheck"></div>
            </div>
        </div>
    `;
    
    // Check inventory availability
    checkInventoryAvailability(request.blood_group, request.units_required);
    
    modal.show();
}

/**
 * Check inventory availability for a request
 */
async function checkInventoryAvailability(bloodGroup, unitsRequired) {
    try {
        const response = await fetch(`/backend/api/blood_inventory.php?blood_bank_id=${window.bloodBankId}&blood_group=${bloodGroup}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const result = await response.json();
        
        const inventoryCheck = document.getElementById('inventoryCheck');
        if (!inventoryCheck) return;
        
        if (result.success && result.data) {
            const totalAvailable = result.data.reduce((sum, item) => sum + (item.units_available || 0), 0);
            
            if (totalAvailable >= unitsRequired) {
                inventoryCheck.innerHTML = `
                    <div class="alert alert-success">
                        <i class="bi bi-check-circle"></i>
                        <strong>Available:</strong> ${totalAvailable} units of ${bloodGroup} blood
                        <div class="mt-2">
                            <button class="btn btn-success btn-sm" onclick="approveRequestFromModal(${getCurrentRequestId()})">
                                <i class="bi bi-check-circle"></i> Approve & Allocate ${unitsRequired} units
                            </button>
                        </div>
                    </div>
                `;
            } else if (totalAvailable > 0) {
                inventoryCheck.innerHTML = `
                    <div class="alert alert-warning">
                        <i class="bi bi-exclamation-triangle"></i>
                        <strong>Partial Availability:</strong> ${totalAvailable} units available (${unitsRequired} required)
                        <div class="mt-2">
                            <button class="btn btn-warning btn-sm me-2" onclick="approveRequestFromModal(${getCurrentRequestId()}, ${totalAvailable})">
                                <i class="bi bi-check-circle"></i> Approve ${totalAvailable} units (Partial)
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="rejectRequestFromModal(${getCurrentRequestId()})">
                                <i class="bi bi-x-circle"></i> Reject Request
                            </button>
                        </div>
                    </div>
                `;
            } else {
                inventoryCheck.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="bi bi-x-circle"></i>
                        <strong>No Availability:</strong> 0 units of ${bloodGroup} blood available
                        <div class="mt-2">
                            <button class="btn btn-danger btn-sm" onclick="rejectRequestFromModal(${getCurrentRequestId()})">
                                <i class="bi bi-x-circle"></i> Reject Request
                            </button>
                        </div>
                    </div>
                `;
            }
        } else {
            inventoryCheck.innerHTML = `
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
 * Get current request ID from modal
 */
function getCurrentRequestId() {
    const modal = document.getElementById('requestDetailsModal');
    const requestId = modal?.querySelector('[data-request-id]')?.dataset.requestId;
    return requestId ? parseInt(requestId) : null;
}

/**
 * Approve request from modal
 */
async function approveRequestFromModal(requestId, units = null) {
    if (!confirm(`Are you sure you want to approve this request?`)) {
        return;
    }

    try {
        const response = await fetch(apiPath('/backend/api/request_routing.php'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                request_id: requestId,
                blood_bank_id: window.bloodBankId,
                action: 'approve',
                units_offered: units,
                notes: 'Approved via dashboard'
            })
        });

        const result = await response.json();
        
        if (result.success) {
            showMessage('success', 'Request approved successfully!');
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('requestDetailsModal'));
            modal.hide();
            
            // Refresh dashboard
            loadDashboardData();
        } else {
            showMessage('error', result.message || 'Failed to approve request');
        }
    } catch (error) {
        console.error('Error approving request:', error);
        showMessage('error', 'Network error. Please try again.');
    }
}

/**
 * Reject request from modal
 */
async function rejectRequestFromModal(requestId) {
    const reason = prompt('Please enter reason for rejection:');
    if (!reason) return;

    try {
        const response = await fetch(apiPath('/backend/api/request_routing.php'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                request_id: requestId,
                blood_bank_id: window.bloodBankId,
                action: 'reject',
                notes: reason
            })
        });

        const result = await response.json();
        
        if (result.success) {
            showMessage('success', 'Request rejected successfully!');
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('requestDetailsModal'));
            modal.hide();
            
            // Refresh dashboard
            loadDashboardData();
        } else {
            showMessage('error', result.message || 'Failed to reject request');
        }
    } catch (error) {
        console.error('Error rejecting request:', error);
        showMessage('error', 'Network error. Please try again.');
    }
}

/**
 * Approve a request
 */
async function approveRequest(requestId) {
    if (!confirm('Are you sure you want to approve this request?')) {
        return;
    }

    try {
        const response = await fetch(apiPath('/backend/api/request_routing.php'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                request_id: requestId,
                blood_bank_id: window.bloodBankId,
                action: 'approve',
                notes: 'Approved via dashboard'
            })
        });

        const result = await response.json();
        
        if (result.success) {
            showMessage('success', 'Request approved successfully!');
            loadDashboardData();
        } else {
            showMessage('error', result.message || 'Failed to approve request');
        }
    } catch (error) {
        console.error('Error approving request:', error);
        showMessage('error', 'Network error. Please try again.');
    }
}

/**
 * Reject a request
 */
async function rejectRequest(requestId) {
    const reason = prompt('Please enter reason for rejection:');
    if (!reason) return;

    try {
        const response = await fetch(apiPath('/backend/api/request_routing.php'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                request_id: requestId,
                blood_bank_id: window.bloodBankId,
                action: 'reject',
                notes: reason
            })
        });

        const result = await response.json();
        
        if (result.success) {
            showMessage('success', 'Request rejected successfully!');
            loadDashboardData();
        } else {
            showMessage('error', result.message || 'Failed to reject request');
        }
    } catch (error) {
        console.error('Error rejecting request:', error);
        showMessage('error', 'Network error. Please try again.');
    }
}

/**
 * View appointment details
 */
async function viewAppointmentDetails(appointmentId) {
    // Implementation for appointment details view
    showMessage('info', 'Appointment details feature would open here');
}

/**
 * Send urgent request for critical shortage
 */
async function sendUrgentRequest(bloodGroup) {
    const units = prompt(`How many units of ${bloodGroup} blood do you urgently need?`, "10");
    if (!units || isNaN(units)) return;

    try {
        const response = await fetch(apiPath('/backend/api/blood_requests.php'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                requester_id: window.bloodBankId,
                requester_type: 'blood_bank',
                blood_group: bloodGroup,
                units_required: parseInt(units),
                priority: 'urgent',
                purpose: 'Urgent inventory replenishment',
                notes: `Critical shortage of ${bloodGroup} blood at ${window.bloodBankData.organization || 'Blood Bank'}`
            })
        });

        const result = await response.json();
        
        if (result.success) {
            showMessage('success', 'Urgent request sent to nearby blood banks!');
        } else {
            showMessage('error', result.message || 'Failed to send urgent request');
        }
    } catch (error) {
        console.error('Error sending urgent request:', error);
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
        refreshBtn.addEventListener('click', function() {
            loadDashboardData();
        });
    }

    // View all requests button
    const viewAllRequestsBtn = document.getElementById('viewAllRequestsBtn');
    if (viewAllRequestsBtn) {
        viewAllRequestsBtn.addEventListener('click', function() {
            window.location.href = 'requests.html';
        });
    }

    // Manage inventory button
    const manageInventoryBtn = document.getElementById('manageInventoryBtn');
    if (manageInventoryBtn) {
        manageInventoryBtn.addEventListener('click', function() {
            window.location.href = 'inventory.html';
        });
    }

    // View all appointments button
    const viewAllAppointmentsBtn = document.getElementById('viewAllAppointmentsBtn');
    if (viewAllAppointmentsBtn) {
        viewAllAppointmentsBtn.addEventListener('click', function() {
            // This would navigate to appointments page
            showMessage('info', 'This would navigate to appointments page');
        });
    }
}

/**
 * Load notifications
 */
async function loadNotifications() {
    try {
        const response = await fetch(`/backend/api/notifications.php?user_id=${window.bloodBankId}&unread_only=true`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const result = await response.json();
        
        if (result.success && result.data) {
            updateNotificationBadge(result.data.length);
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

/**
 * Update notification badge
 */
function updateNotificationBadge(count) {
    const notificationBadge = document.getElementById('notificationBadge');
    if (notificationBadge) {
        if (count > 0) {
            notificationBadge.textContent = count;
            notificationBadge.style.display = 'inline-block';
        } else {
            notificationBadge.style.display = 'none';
        }
    }
}

/**
 * Setup auto-refresh
 */
function setupAutoRefresh() {
    // Auto-refresh every 30 seconds for real-time updates
    setInterval(() => {
        if (document.visibilityState === 'visible') {
            loadDashboardData();
        }
    }, 30000);
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
function showLoading(show) {
    const loadingElement = document.getElementById('loadingSpinner');
    const dashboardContent = document.getElementById('dashboardContent');
    
    if (loadingElement) {
        loadingElement.style.display = show ? 'flex' : 'none';
    }
    
    if (dashboardContent) {
        dashboardContent.style.opacity = show ? '0.5' : '1';
        dashboardContent.style.pointerEvents = show ? 'none' : 'auto';
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
 * Get CSS class for request row
 */
function getRequestRowClass(request) {
    if (request.priority === 'emergency') return 'table-danger';
    if (request.priority === 'urgent') return 'table-warning';
    if (request.status === 'approved') return 'table-success';
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
 * Get inventory status color
 */
function getInventoryStatusColor(status) {
    const statusMap = {
        'critical': 'danger',
        'low': 'warning',
        'adequate': 'success',
        'high': 'info'
    };
    return statusMap[status?.toLowerCase()] || 'secondary';
}

/**
 * Get inventory status icon
 */
function getInventoryStatusIcon(status) {
    const iconMap = {
        'critical': 'bi-exclamation-triangle-fill',
        'low': 'bi-exclamation-triangle',
        'adequate': 'bi-check-circle',
        'high': 'bi-arrow-up-circle'
    };
    return iconMap[status?.toLowerCase()] || 'bi-question-circle';
}

/**
 * Get appointment status class
 */
function getAppointmentStatusClass(status) {
    const statusMap = {
        'scheduled': 'bg-primary',
        'confirmed': 'bg-success',
        'cancelled': 'bg-danger',
        'completed': 'bg-info',
        'no_show': 'bg-warning'
    };
    return statusMap[status?.toLowerCase()] || 'bg-secondary';
}

// Export for testing if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        displayBloodBankInfo,
        loadDashboardData,
        fetchBloodInventory,
        fetchBloodRequests,
        displayInventorySummary,
        displayBloodRequests,
        calculateTimeRemaining,
        getBloodGroupColor,
        getPriorityBadgeClass,
        getRequestStatusClass
    };
}