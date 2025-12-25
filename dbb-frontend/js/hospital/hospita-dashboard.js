// frontend/js/hospital/dashboard.js

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

    // Initialize hospital ID and data
    const hospitalId = userData.user_id;
    window.hospitalId = hospitalId;
    window.hospitalData = userData;

    // Display hospital information
    displayHospitalInfo(userData);

    // Load all dashboard data
    loadDashboardData();

    // Setup event listeners
    setupEventListeners();

    // Load notifications
    loadNotifications();

    // Setup auto-refresh for active requests
    setupAutoRefresh();
});

/**
 * Display hospital information
 */
function displayHospitalInfo(hospitalData) {
    const hospitalNameElement = document.getElementById('hospitalName');
    const hospitalAddressElement = document.getElementById('hospitalAddress');
    const userNameElement = document.getElementById('userName');
    const userAvatarElement = document.getElementById('userAvatar');
    const hospitalStatsElement = document.getElementById('hospitalStats');

    // Display hospital name
    if (hospitalNameElement) {
        hospitalNameElement.textContent = hospitalData.hospital_name || hospitalData.organization || 'Hospital';
    }

    // Display hospital address if available
    if (hospitalAddressElement && hospitalData.address) {
        hospitalAddressElement.textContent = `${hospitalData.address}, ${hospitalData.city || ''}`;
        hospitalAddressElement.style.display = 'block';
    }

    // Display user name
    if (userNameElement) {
        userNameElement.textContent = `${hospitalData.first_name || ''} ${hospitalData.last_name || ''}`.trim();
    }

    // Display user avatar
    if (userAvatarElement) {
        const initials = `${hospitalData.first_name?.charAt(0) || 'H'}${hospitalData.last_name?.charAt(0) || ''}`.toUpperCase();
        userAvatarElement.textContent = initials;
    }

    // Display hospital statistics badge
    if (hospitalStatsElement && hospitalData.hospital_type) {
        const typeMap = {
            'government': 'bg-primary',
            'private': 'bg-success',
            'charity': 'bg-info',
            'teaching': 'bg-warning'
        };
        const badgeClass = typeMap[hospitalData.hospital_type.toLowerCase()] || 'bg-secondary';
        
        hospitalStatsElement.innerHTML = `
            <span class="badge ${badgeClass} me-2">${hospitalData.hospital_type}</span>
            ${hospitalData.beds ? `<span class="badge bg-dark">${hospitalData.beds} Beds</span>` : ''}
        `;
    }
}

/**
 * Load all dashboard data
 */
async function loadDashboardData() {
    try {
        showLoading(true);
        
        // Load multiple data sources in parallel
        const [bloodRequestsData, statsData, inventoryAlerts, recentActivity] = await Promise.allSettled([
            fetchBloodRequests(),
            fetchHospitalStats(),
            fetchInventoryAlerts(),
            fetchRecentActivity()
        ]);

        // Process blood requests
        if (bloodRequestsData.status === 'fulfilled' && bloodRequestsData.value) {
            displayBloodRequests(bloodRequestsData.value);
            updateRequestStats(bloodRequestsData.value);
        }

        // Process hospital stats
        if (statsData.status === 'fulfilled' && statsData.value) {
            displayHospitalStats(statsData.value);
        }

        // Process inventory alerts
        if (inventoryAlerts.status === 'fulfilled' && inventoryAlerts.value) {
            displayInventoryAlerts(inventoryAlerts.value);
        }

        // Process recent activity
        if (recentActivity.status === 'fulfilled' && recentActivity.value) {
            displayRecentActivity(recentActivity.value);
        }

        // Load charts if available
        loadRequestTrends();

    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showMessage('error', 'Failed to load dashboard data. Please refresh.');
    } finally {
        showLoading(false);
    }
}

/**
 * Fetch blood requests for the hospital
 */
async function fetchBloodRequests() {
    try {
        const response = await fetch(`/backend/api/blood_requests.php?requester_id=${window.hospitalId}&status=active`, {
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
            showMessage('warning', result.message || 'No active blood requests found');
            return [];
        }
    } catch (error) {
        console.error('Error fetching blood requests:', error);
        return [];
    }
}

/**
 * Fetch hospital statistics
 */
async function fetchHospitalStats() {
    try {
        // Get comprehensive stats including historical data
        const response = await fetch(`/backend/api/reports/summary.php?hospital_id=${window.hospitalId}`, {
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
        console.error('Error fetching hospital stats:', error);
        return null;
    }
}

/**
 * Fetch inventory alerts for blood shortages
 */
async function fetchInventoryAlerts() {
    try {
        const response = await fetch(`/backend/api/reports/shortages.php?region=${encodeURIComponent(window.hospitalData.region || '')}`, {
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
        console.error('Error fetching inventory alerts:', error);
        return [];
    }
}

/**
 * Fetch recent activity (audit logs)
 */
async function fetchRecentActivity() {
    try {
        const response = await fetch(`/backend/api/audit_logs.php?user_id=${window.hospitalId}&limit=10`, {
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
        console.error('Error fetching recent activity:', error);
        return [];
    }
}

/**
 * Display blood requests in the table
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

    // Clear existing rows (except header)
    while (requestsTable.rows.length > 1) {
        requestsTable.deleteRow(1);
    }

    // Sort requests by priority and required date
    requests.sort((a, b) => {
        // First by priority
        const priorityOrder = { emergency: 1, urgent: 2, normal: 3, planned: 4 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        
        if (priorityDiff !== 0) return priorityDiff;
        
        // Then by required date (earliest first)
        return new Date(a.required_by) - new Date(b.required_by);
    });

    // Add requests to table
    requests.forEach(request => {
        const row = requestsTable.insertRow();
        row.className = getRequestRowClass(request);
        row.dataset.requestId = request.id;
        
        // Calculate time remaining
        const timeRemaining = calculateTimeRemaining(request.required_by);
        const timeClass = getTimeRemainingClass(timeRemaining);
        
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
        
        row.innerHTML = `
            <td>
                <div class="d-flex align-items-center">
                    <div class="blood-group-badge bg-${getBloodGroupColor(request.blood_group)} me-2">
                        ${request.blood_group}
                    </div>
                    <div>
                        <div class="fw-medium">${request.blood_group} Blood</div>
                        <small class="text-muted">Req: ${formattedCreated}</small>
                    </div>
                </div>
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
                <small class="${timeClass}">
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
                    ${request.status === 'pending' || request.status === 'approved' ? `
                        <button type="button" class="btn btn-outline-success" onclick="updateRequestStatus(${request.id}, 'fulfilled')" title="Mark as Fulfilled">
                            <i class="bi bi-check-circle"></i>
                        </button>
                        <button type="button" class="btn btn-outline-danger" onclick="cancelRequest(${request.id})" title="Cancel Request">
                            <i class="bi bi-x-circle"></i>
                        </button>
                    ` : ''}
                </div>
            </td>
        `;
        
        // Add click event for the entire row (except buttons)
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
    const urgentRequestsElement = document.getElementById('urgentRequests');
    const fulfilledRequestsElement = document.getElementById('fulfilledRequests');
    
    if (totalRequestsElement) {
        totalRequestsElement.textContent = requests.length;
    }
    
    // Calculate statistics
    const pendingCount = requests.filter(req => req.status === 'pending').length;
    const urgentCount = requests.filter(req => req.priority === 'emergency' || req.priority === 'urgent').length;
    const fulfilledCount = requests.filter(req => req.status === 'fulfilled').length;
    
    if (pendingRequestsElement) {
        pendingRequestsElement.textContent = pendingCount;
        pendingRequestsElement.parentElement.querySelector('.progress-bar').style.width = `${(pendingCount / Math.max(requests.length, 1)) * 100}%`;
    }
    
    if (urgentRequestsElement) {
        urgentRequestsElement.textContent = urgentCount;
    }
    
    if (fulfilledRequestsElement) {
        fulfilledRequestsElement.textContent = fulfilledCount;
    }
}

/**
 * Display hospital statistics
 */
function displayHospitalStats(stats) {
    // Update stats cards
    const monthlyRequestsElement = document.getElementById('monthlyRequests');
    const fulfillmentRateElement = document.getElementById('fulfillmentRate');
    const avgResponseTimeElement = document.getElementById('avgResponseTime');
    const topBloodGroupElement = document.getElementById('topBloodGroup');
    
    if (monthlyRequestsElement && stats.monthly_requests !== undefined) {
        monthlyRequestsElement.textContent = stats.monthly_requests;
        
        // Calculate trend
        if (stats.previous_month_requests !== undefined) {
            const trend = ((stats.monthly_requests - stats.previous_month_requests) / Math.max(stats.previous_month_requests, 1)) * 100;
            const trendElement = monthlyRequestsElement.parentElement.querySelector('.trend');
            if (trendElement) {
                trendElement.textContent = `${trend >= 0 ? '+' : ''}${trend.toFixed(1)}%`;
                trendElement.className = `trend ${trend >= 0 ? 'text-success' : 'text-danger'}`;
            }
        }
    }
    
    if (fulfillmentRateElement && stats.fulfillment_rate !== undefined) {
        fulfillmentRateElement.textContent = `${stats.fulfillment_rate}%`;
        
        // Update progress bar
        const progressBar = fulfillmentRateElement.parentElement.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.style.width = `${stats.fulfillment_rate}%`;
            progressBar.className = `progress-bar ${stats.fulfillment_rate >= 80 ? 'bg-success' : stats.fulfillment_rate >= 50 ? 'bg-warning' : 'bg-danger'}`;
        }
    }
    
    if (avgResponseTimeElement && stats.avg_response_time !== undefined) {
        avgResponseTimeElement.textContent = `${stats.avg_response_time} hours`;
        
        // Color code based on response time
        avgResponseTimeElement.className = `display-6 ${stats.avg_response_time <= 2 ? 'text-success' : stats.avg_response_time <= 6 ? 'text-warning' : 'text-danger'}`;
    }
    
    if (topBloodGroupElement && stats.top_blood_group) {
        topBloodGroupElement.textContent = stats.top_blood_group;
        topBloodGroupElement.className = `display-6 text-${getBloodGroupColor(stats.top_blood_group)}`;
    }
    
    // Display blood group distribution if available
    if (stats.blood_group_distribution) {
        displayBloodGroupDistribution(stats.blood_group_distribution);
    }
}

/**
 * Display blood group distribution chart
 */
function displayBloodGroupDistribution(distribution) {
    const container = document.getElementById('bloodGroupDistribution');
    if (!container) return;
    
    // Create a simple bar chart using divs
    container.innerHTML = '';
    
    Object.entries(distribution).forEach(([bloodGroup, count]) => {
        const maxCount = Math.max(...Object.values(distribution));
        const percentage = (count / maxCount) * 100;
        
        const barContainer = document.createElement('div');
        barContainer.className = 'mb-2';
        barContainer.innerHTML = `
            <div class="d-flex justify-content-between mb-1">
                <span class="fw-medium">${bloodGroup}</span>
                <span class="text-muted">${count}</span>
            </div>
            <div class="progress" style="height: 8px;">
                <div class="progress-bar bg-${getBloodGroupColor(bloodGroup)}" 
                     role="progressbar" 
                     style="width: ${percentage}%"
                     aria-valuenow="${count}" 
                     aria-valuemin="0" 
                     aria-valuemax="${maxCount}">
                </div>
            </div>
        `;
        
        container.appendChild(barContainer);
    });
}

/**
 * Display inventory alerts
 */
function displayInventoryAlerts(alerts) {
    const alertsContainer = document.getElementById('inventoryAlerts');
    if (!alertsContainer) return;
    
    alertsContainer.innerHTML = '';
    
    // Filter for critical alerts only
    const criticalAlerts = alerts.filter(alert => 
        alert.severity === 'critical' || alert.severity === 'high'
    );
    
    if (criticalAlerts.length === 0) {
        alertsContainer.innerHTML = `
            <div class="alert alert-success">
                <i class="bi bi-check-circle"></i>
                All blood types are sufficiently available in your region.
            </div>
        `;
        return;
    }
    
    // Sort by severity (critical first)
    criticalAlerts.sort((a, b) => {
        const severityOrder = { critical: 1, high: 2, medium: 3, low: 4 };
        return severityOrder[a.severity] - severityOrder[b.severity];
    });
    
    // Display alerts
    criticalAlerts.forEach(alert => {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${alert.severity === 'critical' ? 'danger' : 'warning'} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                <div class="flex-grow-1">
                    <strong>${alert.blood_group} Blood Shortage</strong>
                    <div class="small">
                        Severity: ${alert.severity.toUpperCase()} | 
                        Available: ${alert.current_level} units | 
                        Region: ${alert.region || 'Your area'}
                    </div>
                </div>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
            ${alert.recommendation ? `<div class="mt-1 small">${alert.recommendation}</div>` : ''}
        `;
        
        alertsContainer.appendChild(alertDiv);
    });
}

/**
 * Display recent activity
 */
function displayRecentActivity(activities) {
    const activityList = document.getElementById('recentActivityList');
    if (!activityList) return;
    
    activityList.innerHTML = '';
    
    if (activities.length === 0) {
        activityList.innerHTML = `
            <div class="text-center py-3 text-muted">
                <i class="bi bi-clock-history display-6"></i>
                <p class="mt-2">No recent activity</p>
            </div>
        `;
        return;
    }
    
    activities.forEach(activity => {
        const activityItem = document.createElement('div');
        activityItem.className = 'list-group-item list-group-item-action';
        
        // Format timestamp
        const timestamp = new Date(activity.timestamp);
        const timeAgo = getTimeAgo(timestamp);
        
        // Get icon based on action type
        const icon = getActivityIcon(activity.action_type);
        
        activityItem.innerHTML = `
            <div class="d-flex w-100 justify-content-between">
                <div>
                    <i class="bi ${icon} me-2"></i>
                    <strong>${formatActivityAction(activity.action_type)}</strong>
                </div>
                <small class="text-muted">${timeAgo}</small>
            </div>
            <p class="mb-1">${activity.description || ''}</p>
            ${activity.details ? `<small class="text-muted">${activity.details}</small>` : ''}
        `;
        
        activityList.appendChild(activityItem);
    });
}

/**
 * Load request trends chart
 */
function loadRequestTrends() {
    // This would typically use a charting library like Chart.js
    // For now, we'll create a simple implementation
    
    const trendsContainer = document.getElementById('requestTrends');
    if (!trendsContainer) return;
    
    // Simulated trend data (in a real app, this would come from API)
    const trendsData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        requests: [45, 52, 48, 55, 58, 62],
        fulfilled: [38, 45, 42, 48, 52, 58]
    };
    
    trendsContainer.innerHTML = `
        <div class="card h-100">
            <div class="card-header">
                <h6 class="mb-0">Request Trends (Last 6 Months)</h6>
            </div>
            <div class="card-body">
                <div id="trendsChart" style="height: 200px;">
                    <!-- Chart would be rendered here -->
                </div>
                <div class="mt-3">
                    <div class="d-flex justify-content-between small">
                        <span><span class="badge bg-primary me-1"></span> Total Requests</span>
                        <span><span class="badge bg-success me-1"></span> Fulfilled</span>
                    </div>
                </div>
            </div>
        </div>
    `;
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
        </div>
        
        ${request.patient_name ? `
            <div class="row mt-3">
                <div class="col-12">
                    <h6>Patient Information</h6>
                    <p><strong>Name:</strong> ${request.patient_name}</p>
                    ${request.patient_age ? `<p><strong>Age:</strong> ${request.patient_age}</p>` : ''}
                    ${request.patient_gender ? `<p><strong>Gender:</strong> ${request.patient_gender}</p>` : ''}
                    ${request.medical_reason ? `<p><strong>Medical Reason:</strong> ${request.medical_reason}</p>` : ''}
                    ${request.hospital_ward ? `<p><strong>Ward:</strong> ${request.hospital_ward}</p>` : ''}
                    ${request.doctor_in_charge ? `<p><strong>Doctor:</strong> ${request.doctor_in_charge}</p>` : ''}
                </div>
            </div>
        ` : ''}
        
        ${request.urgency_notes ? `
            <div class="row mt-3">
                <div class="col-12">
                    <h6>Additional Notes</h6>
                    <div class="alert alert-info">
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
                            <div class="list-group-item">
                                <div class="d-flex w-100 justify-content-between">
                                    <h6 class="mb-1">${response.blood_bank_name}</h6>
                                    <span class="badge ${response.status === 'approved' ? 'bg-success' : 'bg-danger'}">
                                        ${response.status}
                                    </span>
                                </div>
                                ${response.units_offered ? `<p class="mb-1">Offering: ${response.units_offered} units</p>` : ''}
                                ${response.notes ? `<small class="text-muted">${response.notes}</small>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        ` : ''}
    `;
    
    modal.show();
}

/**
 * Update request status
 */
async function updateRequestStatus(requestId, newStatus) {
    if (!confirm(`Are you sure you want to mark this request as ${newStatus}?`)) {
        return;
    }

    try {
        const response = await fetch(apiPath('/backend/api/blood_requests.php'), {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                id: requestId,
                status: newStatus,
                updated_by: window.hospitalId
            })
        });

        const result = await response.json();
        
        if (result.success) {
            showMessage('success', `Request marked as ${newStatus}`);
            loadDashboardData(); // Refresh dashboard
        } else {
            showMessage('error', result.message || 'Failed to update request');
        }
    } catch (error) {
        console.error('Error updating request:', error);
        showMessage('error', 'Network error. Please try again.');
    }
}

/**
 * Cancel a blood request
 */
async function cancelRequest(requestId) {
    const reason = prompt('Please enter reason for cancellation:');
    if (!reason) return;

    try {
        const response = await fetch(apiPath('/backend/api/blood_requests.php'), {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                id: requestId,
                status: 'cancelled',
                cancellation_reason: reason,
                updated_by: window.hospitalId
            })
        });

        const result = await response.json();
        
        if (result.success) {
            showMessage('success', 'Request cancelled successfully');
            loadDashboardData(); // Refresh dashboard
        } else {
            showMessage('error', result.message || 'Failed to cancel request');
        }
    } catch (error) {
        console.error('Error cancelling request:', error);
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

    // Create new request button
    const newRequestBtn = document.getElementById('newRequestBtn');
    if (newRequestBtn) {
        newRequestBtn.addEventListener('click', function() {
            window.location.href = 'create-request.html';
        });
    }

    // View all requests button
    const viewAllRequestsBtn = document.getElementById('viewAllRequestsBtn');
    if (viewAllRequestsBtn) {
        viewAllRequestsBtn.addEventListener('click', function() {
            // In a full implementation, this would navigate to a requests page
            showMessage('info', 'This would navigate to all requests page');
        });
    }

    // Notifications dropdown
    const notificationsLink = document.getElementById('notificationsLink');
    if (notificationsLink) {
        notificationsLink.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = '../notifications.html';
        });
    }

    // Dashboard cards click events
    document.querySelectorAll('.stat-card').forEach(card => {
        card.addEventListener('click', function() {
            const cardType = this.dataset.cardType;
            handleCardClick(cardType);
        });
    });
}

/**
 * Handle dashboard card clicks
 */
function handleCardClick(cardType) {
    switch(cardType) {
        case 'pending':
            filterRequests('pending');
            break;
        case 'urgent':
            filterRequests('urgent');
            break;
        case 'fulfilled':
            filterRequests('fulfilled');
            break;
        case 'inventory':
            loadInventoryAlerts();
            break;
        default:
            // Do nothing
    }
}

/**
 * Filter requests by type
 */
function filterRequests(filterType) {
    const rows = document.querySelectorAll('#requestsTable tbody tr');
    
    rows.forEach(row => {
        const statusCell = row.querySelector('td:nth-child(5)');
        const priorityCell = row.querySelector('td:nth-child(3)');
        
        const status = statusCell?.textContent.toLowerCase() || '';
        const priority = priorityCell?.textContent.toLowerCase() || '';
        
        let showRow = false;
        
        switch(filterType) {
            case 'pending':
                showRow = status.includes('pending');
                break;
            case 'urgent':
                showRow = priority.includes('emergency') || priority.includes('urgent');
                break;
            case 'fulfilled':
                showRow = status.includes('fulfilled');
                break;
            default:
                showRow = true;
        }
        
        row.style.display = showRow ? '' : 'none';
    });
    
    showMessage('info', `Showing ${filterType} requests`);
}

/**
 * Load notifications
 */
async function loadNotifications() {
    try {
        const response = await fetch(apiPath(`/backend/api/notifications.php?user_id=${window.hospitalId}&unread_only=true`), {
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
 * Setup auto-refresh for active requests
 */
function setupAutoRefresh() {
    // Auto-refresh every 60 seconds for real-time updates
    setInterval(() => {
        if (document.visibilityState === 'visible') {
            loadDashboardData();
        }
    }, 60000);
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
    if (request.status === 'fulfilled') return 'table-success';
    if (request.status === 'cancelled') return 'table-secondary';
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
        'partially_fulfilled': 'Partially Fulfilled',
        'cancelled': 'Cancelled',
        'in_progress': 'In Progress'
    };
    return statusMap[status?.toLowerCase()] || status || 'Unknown';
}

/**
 * Get time ago string
 */
function getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Get activity icon
 */
function getActivityIcon(actionType) {
    const iconMap = {
        'request_created': 'bi-plus-circle',
        'request_updated': 'bi-pencil',
        'request_fulfilled': 'bi-check-circle',
        'request_cancelled': 'bi-x-circle',
        'inventory_alert': 'bi-exclamation-triangle',
        'notification_sent': 'bi-bell',
        'login': 'bi-box-arrow-in-right',
        'logout': 'bi-box-arrow-right'
    };
    return iconMap[actionType] || 'bi-activity';
}

/**
 * Format activity action
 */
function formatActivityAction(actionType) {
    const actionMap = {
        'request_created': 'Blood Request Created',
        'request_updated': 'Request Updated',
        'request_fulfilled': 'Request Fulfilled',
        'request_cancelled': 'Request Cancelled',
        'inventory_alert': 'Inventory Alert',
        'notification_sent': 'Notification Sent',
        'login': 'User Login',
        'logout': 'User Logout'
    };
    return actionMap[actionType] || actionType;
}

// Export for testing if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        displayHospitalInfo,
        loadDashboardData,
        fetchBloodRequests,
        displayBloodRequests,
        calculateTimeRemaining,
        getTimeRemainingClass,
        getBloodGroupColor,
        getPriorityBadgeClass,
        getRequestStatusClass
    };
}