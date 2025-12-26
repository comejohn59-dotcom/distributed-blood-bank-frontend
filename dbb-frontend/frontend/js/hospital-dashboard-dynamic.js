// Dynamic Hospital Dashboard JavaScript
// Connects to backend APIs for real functionality

// API Configuration
const API_BASE_URL = 'http://localhost/bloodconnect/backend/api';

// Initialize hospital dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeHospitalDashboard();
});

function initializeHospitalDashboard() {
    // Check authentication
    if (!protectDashboard('hospital')) {
        return;
    }
    
    // Initialize user info
    initializeDashboardUser();
    
    // Load hospital data
    loadHospitalData();
    
    // Initialize event listeners
    initializeEventListeners();
    
    // Load blood requests
    loadBloodRequests();
    
    // Load donation offers
    loadDonationOffers();
    
    // Load blood inventory
    loadBloodInventory();
}

function initializeEventListeners() {
    // Request approval buttons
    document.addEventListener('click', function(e) {
        if (e.target.matches('.approve-request-btn')) {
            const requestId = e.target.dataset.requestId;
            approveBloodRequest(requestId);
        }
        
        if (e.target.matches('.reject-request-btn')) {
            const requestId = e.target.dataset.requestId;
            rejectBloodRequest(requestId);
        }
        
        if (e.target.matches('.accept-donation-btn')) {
            const offerId = e.target.dataset.offerId;
            acceptDonationOffer(offerId);
        }
        
        if (e.target.matches('.reject-donation-btn')) {
            const offerId = e.target.dataset.offerId;
            rejectDonationOffer(offerId);
        }
    });
    
    // Inventory update form
    const inventoryForm = document.getElementById('updateInventoryForm');
    if (inventoryForm) {
        inventoryForm.addEventListener('submit', handleInventoryUpdate);
    }
}

// Load hospital profile data
async function loadHospitalData() {
    const user = getCurrentUser();
    if (!user || !user.profile) return;
    
    const profile = user.profile;
    
    // Update profile information
    updateElement('.hospital-name', profile.hospital_name);
    updateElement('.hospital-id', profile.hospital_id);
    updateElement('.hospital-type', profile.hospital_type);
    updateElement('.verification-status', profile.is_verified ? 'Verified' : 'Pending Verification');
    
    // Update verification badge
    const verificationBadge = document.querySelector('.verification-badge');
    if (verificationBadge) {
        verificationBadge.className = `verification-badge ${profile.is_verified ? 'verified' : 'pending'}`;
        verificationBadge.textContent = profile.is_verified ? 'Verified' : 'Pending';
    }
    
    // Show verification message if not verified
    if (!profile.is_verified) {
        showNotification('Your hospital account is pending admin verification. Some features may be limited.', 'warning');
    }
}

// Load blood requests
async function loadBloodRequests() {
    try {
        const response = await fetch(`${API_BASE_URL}/hospital/get_requests.php`, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('bloodconnect_token')
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            displayBloodRequests(result.data.requests);
            updateRequestStats(result.data.stats);
        } else {
            // Show mock data if API fails
            displayMockRequests();
        }
        
    } catch (error) {
        console.error('Load requests error:', error);
        displayMockRequests();
    }
}

// Display blood requests
function displayBloodRequests(requests) {
    const requestsContainer = document.querySelector('.requests-list, .blood-requests-container');
    if (!requestsContainer) return;
    
    if (!requests || requests.length === 0) {
        requestsContainer.innerHTML = `
            <div class="no-requests">
                <i class="fas fa-inbox"></i>
                <h4>No Blood Requests</h4>
                <p>No pending blood requests at this time.</p>
            </div>
        `;
        return;
    }
    
    const requestsHTML = requests.map(request => {
        const statusClass = request.status.toLowerCase();
        const priorityClass = request.priority.toLowerCase();
        
        return `
            <div class="request-card ${statusClass} ${priorityClass}">
                <div class="request-header">
                    <div class="request-info">
                        <h4>Blood Request #${request.request_id}</h4>
                        <div class="request-badges">
                            <span class="blood-type-badge">${request.blood_type}</span>
                            <span class="priority-badge ${priorityClass}">${capitalizeFirst(request.priority)}</span>
                            <span class="status-badge ${statusClass}">${capitalizeFirst(request.status)}</span>
                        </div>
                    </div>
                    <div class="request-time">
                        <span>${formatTimeAgo(request.created_at)}</span>
                    </div>
                </div>
                
                <div class="request-details">
                    <div class="detail-row">
                        <strong>Patient:</strong> ${request.patient_name || 'Patient ' + request.patient_id}
                    </div>
                    <div class="detail-row">
                        <strong>Units Requested:</strong> ${request.units_requested} units
                    </div>
                    <div class="detail-row">
                        <strong>Medical Reason:</strong> ${request.medical_reason}
                    </div>
                    ${request.emergency_reason ? `
                        <div class="detail-row emergency">
                            <strong>Emergency Reason:</strong> ${request.emergency_reason}
                        </div>
                    ` : ''}
                    ${request.doctor_contact ? `
                        <div class="detail-row">
                            <strong>Doctor Contact:</strong> ${request.doctor_contact}
                        </div>
                    ` : ''}
                </div>
                
                <div class="request-actions">
                    ${getRequestActions(request)}
                </div>
            </div>
        `;
    }).join('');
    
    requestsContainer.innerHTML = requestsHTML;
}

// Load donation offers
async function loadDonationOffers() {
    try {
        const response = await fetch(`${API_BASE_URL}/hospital/get_requests.php?type=donations`, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('bloodconnect_token')
            }
        });
        
        const result = await response.json();
        
        if (result.success && result.data.donations) {
            displayDonationOffers(result.data.donations);
        } else {
            displayMockDonations();
        }
        
    } catch (error) {
        console.error('Load donations error:', error);
        displayMockDonations();
    }
}

// Display donation offers
function displayDonationOffers(donations) {
    const donationsContainer = document.querySelector('.donations-list, .donation-offers-container');
    if (!donationsContainer) return;
    
    if (!donations || donations.length === 0) {
        donationsContainer.innerHTML = `
            <div class="no-donations">
                <i class="fas fa-hand-holding-heart"></i>
                <h4>No Donation Offers</h4>
                <p>No pending donation offers at this time.</p>
            </div>
        `;
        return;
    }
    
    const donationsHTML = donations.map(donation => {
        const statusClass = donation.status.toLowerCase();
        
        return `
            <div class="donation-card ${statusClass}">
                <div class="donation-header">
                    <div class="donation-info">
                        <h4>Donation Offer #${donation.offer_id}</h4>
                        <div class="donation-badges">
                            <span class="blood-type-badge">${donation.blood_type}</span>
                            <span class="status-badge ${statusClass}">${capitalizeFirst(donation.status)}</span>
                        </div>
                    </div>
                    <div class="donation-time">
                        <span>${formatTimeAgo(donation.created_at)}</span>
                    </div>
                </div>
                
                <div class="donation-details">
                    <div class="detail-row">
                        <strong>Donor:</strong> ${donation.donor_name || 'Donor ' + donation.donor_id}
                    </div>
                    <div class="detail-row">
                        <strong>Volume:</strong> ${donation.volume_ml}ml
                    </div>
                    <div class="detail-row">
                        <strong>Preferred Date:</strong> ${formatDate(donation.preferred_date)}
                    </div>
                    <div class="detail-row">
                        <strong>Preferred Time:</strong> ${donation.preferred_time}
                    </div>
                    ${donation.notes ? `
                        <div class="detail-row">
                            <strong>Notes:</strong> ${donation.notes}
                        </div>
                    ` : ''}
                </div>
                
                <div class="donation-actions">
                    ${getDonationActions(donation)}
                </div>
            </div>
        `;
    }).join('');
    
    donationsContainer.innerHTML = donationsHTML;
}

// Load blood inventory
async function loadBloodInventory() {
    try {
        const response = await fetch(`${API_BASE_URL}/hospital/get_inventory.php`, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('bloodconnect_token')
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            displayBloodInventory(result.data.inventory);
        } else {
            displayMockInventory();
        }
        
    } catch (error) {
        console.error('Load inventory error:', error);
        displayMockInventory();
    }
}

// Display blood inventory
function displayBloodInventory(inventory) {
    const inventoryContainer = document.querySelector('.inventory-grid, .blood-inventory-container');
    if (!inventoryContainer) return;
    
    const inventoryHTML = inventory.map(item => {
        const stockLevel = getStockLevel(item.units_available, item.critical_stock_threshold, item.low_stock_threshold);
        
        return `
            <div class="inventory-card ${stockLevel}">
                <div class="blood-type-header">
                    <span class="blood-type-large">${item.blood_type}</span>
                    <span class="stock-status ${stockLevel}">${capitalizeFirst(stockLevel)}</span>
                </div>
                <div class="inventory-stats">
                    <div class="stat">
                        <span class="stat-value">${item.units_available}</span>
                        <span class="stat-label">Available</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value">${item.units_reserved}</span>
                        <span class="stat-label">Reserved</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value">${item.units_expired || 0}</span>
                        <span class="stat-label">Expired</span>
                    </div>
                </div>
                <div class="inventory-actions">
                    <button class="btn-sm primary" onclick="updateInventory('${item.blood_type}')">
                        <i class="fas fa-edit"></i> Update
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    inventoryContainer.innerHTML = inventoryHTML;
}

// Approve blood request
async function approveBloodRequest(requestId) {
    if (!confirm('Are you sure you want to approve this blood request?')) {
        return;
    }
    
    try {
        showLoading('Approving blood request...');
        
        const response = await fetch(`${API_BASE_URL}/hospital/approve_request.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('bloodconnect_token')
            },
            body: JSON.stringify({
                request_id: requestId,
                action: 'approve'
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Blood request approved successfully!', 'success');
            loadBloodRequests(); // Refresh
            loadBloodInventory(); // Update inventory
        } else {
            showNotification(result.message || 'Failed to approve request', 'error');
        }
        
    } catch (error) {
        console.error('Approve request error:', error);
        showNotification('Failed to approve blood request', 'error');
    } finally {
        hideLoading();
    }
}

// Reject blood request
async function rejectBloodRequest(requestId) {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;
    
    try {
        showLoading('Rejecting blood request...');
        
        const response = await fetch(`${API_BASE_URL}/hospital/approve_request.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('bloodconnect_token')
            },
            body: JSON.stringify({
                request_id: requestId,
                action: 'reject',
                rejection_reason: reason
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Blood request rejected', 'success');
            loadBloodRequests(); // Refresh
        } else {
            showNotification(result.message || 'Failed to reject request', 'error');
        }
        
    } catch (error) {
        console.error('Reject request error:', error);
        showNotification('Failed to reject blood request', 'error');
    } finally {
        hideLoading();
    }
}

// Accept donation offer
async function acceptDonationOffer(offerId) {
    if (!confirm('Are you sure you want to accept this donation offer?')) {
        return;
    }
    
    try {
        showLoading('Accepting donation offer...');
        
        const response = await fetch(`${API_BASE_URL}/hospital/manage_donation.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('bloodconnect_token')
            },
            body: JSON.stringify({
                offer_id: offerId,
                action: 'accept'
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Donation offer accepted successfully!', 'success');
            loadDonationOffers(); // Refresh
        } else {
            showNotification(result.message || 'Failed to accept offer', 'error');
        }
        
    } catch (error) {
        console.error('Accept donation error:', error);
        showNotification('Failed to accept donation offer', 'error');
    } finally {
        hideLoading();
    }
}

// Reject donation offer
async function rejectDonationOffer(offerId) {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;
    
    try {
        showLoading('Rejecting donation offer...');
        
        const response = await fetch(`${API_BASE_URL}/hospital/manage_donation.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('bloodconnect_token')
            },
            body: JSON.stringify({
                offer_id: offerId,
                action: 'reject',
                rejection_reason: reason
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Donation offer rejected', 'success');
            loadDonationOffers(); // Refresh
        } else {
            showNotification(result.message || 'Failed to reject offer', 'error');
        }
        
    } catch (error) {
        console.error('Reject donation error:', error);
        showNotification('Failed to reject donation offer', 'error');
    } finally {
        hideLoading();
    }
}

// Handle inventory update
async function handleInventoryUpdate(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const updateData = {
        blood_type: formData.get('bloodType'),
        units_to_add: parseInt(formData.get('unitsToAdd')),
        action: formData.get('action') // 'add' or 'remove'
    };
    
    try {
        showLoading('Updating inventory...');
        
        const response = await fetch(`${API_BASE_URL}/hospital/update_inventory.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('bloodconnect_token')
            },
            body: JSON.stringify(updateData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Inventory updated successfully!', 'success');
            event.target.reset();
            loadBloodInventory(); // Refresh
        } else {
            showNotification(result.message || 'Failed to update inventory', 'error');
        }
        
    } catch (error) {
        console.error('Update inventory error:', error);
        showNotification('Failed to update inventory', 'error');
    } finally {
        hideLoading();
    }
}

// Utility functions
function getRequestActions(request) {
    switch (request.status) {
        case 'pending':
            return `
                <button class="btn-sm success approve-request-btn" data-request-id="${request.id}">
                    <i class="fas fa-check"></i> Approve
                </button>
                <button class="btn-sm danger reject-request-btn" data-request-id="${request.id}">
                    <i class="fas fa-times"></i> Reject
                </button>
                <button class="btn-sm info" onclick="viewRequestDetails('${request.request_id}')">
                    <i class="fas fa-eye"></i> Details
                </button>
            `;
        case 'approved':
            return `
                <button class="btn-sm success" onclick="markRequestCompleted('${request.id}')">
                    <i class="fas fa-check-circle"></i> Mark Complete
                </button>
                <button class="btn-sm info" onclick="viewRequestDetails('${request.request_id}')">
                    <i class="fas fa-eye"></i> Details
                </button>
            `;
        default:
            return `
                <button class="btn-sm info" onclick="viewRequestDetails('${request.request_id}')">
                    <i class="fas fa-eye"></i> Details
                </button>
            `;
    }
}

function getDonationActions(donation) {
    switch (donation.status) {
        case 'pending':
            return `
                <button class="btn-sm success accept-donation-btn" data-offer-id="${donation.id}">
                    <i class="fas fa-check"></i> Accept
                </button>
                <button class="btn-sm danger reject-donation-btn" data-offer-id="${donation.id}">
                    <i class="fas fa-times"></i> Reject
                </button>
                <button class="btn-sm info" onclick="viewDonationDetails('${donation.offer_id}')">
                    <i class="fas fa-eye"></i> Details
                </button>
            `;
        case 'accepted':
            return `
                <button class="btn-sm success" onclick="markDonationCompleted('${donation.id}')">
                    <i class="fas fa-check-circle"></i> Mark Complete
                </button>
                <button class="btn-sm secondary" onclick="scheduleDonation('${donation.id}')">
                    <i class="fas fa-calendar"></i> Schedule
                </button>
            `;
        default:
            return `
                <button class="btn-sm info" onclick="viewDonationDetails('${donation.offer_id}')">
                    <i class="fas fa-eye"></i> Details
                </button>
            `;
    }
}

function getStockLevel(available, critical, low) {
    if (available <= critical) return 'critical';
    if (available <= low) return 'low';
    return 'good';
}

// Mock data functions
function displayMockRequests() {
    const mockRequests = [
        {
            id: 1,
            request_id: 'REQ-2024-001',
            blood_type: 'A+',
            units_requested: 2,
            priority: 'urgent',
            status: 'pending',
            patient_id: 'PT-2024-001',
            patient_name: 'John Doe',
            medical_reason: 'Surgery preparation',
            created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        }
    ];
    
    displayBloodRequests(mockRequests);
}

function displayMockDonations() {
    const mockDonations = [
        {
            id: 1,
            offer_id: 'DON-2024-001',
            blood_type: 'O+',
            volume_ml: 450,
            status: 'pending',
            donor_id: 'DN-2024-001',
            donor_name: 'Jane Smith',
            preferred_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            preferred_time: '10:00',
            created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
        }
    ];
    
    displayDonationOffers(mockDonations);
}

function displayMockInventory() {
    const mockInventory = [
        { blood_type: 'A+', units_available: 15, units_reserved: 3, critical_stock_threshold: 5, low_stock_threshold: 10 },
        { blood_type: 'A-', units_available: 8, units_reserved: 1, critical_stock_threshold: 5, low_stock_threshold: 10 },
        { blood_type: 'B+', units_available: 12, units_reserved: 2, critical_stock_threshold: 5, low_stock_threshold: 10 },
        { blood_type: 'B-', units_available: 4, units_reserved: 0, critical_stock_threshold: 5, low_stock_threshold: 10 },
        { blood_type: 'AB+', units_available: 6, units_reserved: 1, critical_stock_threshold: 5, low_stock_threshold: 10 },
        { blood_type: 'AB-', units_available: 3, units_reserved: 0, critical_stock_threshold: 5, low_stock_threshold: 10 },
        { blood_type: 'O+', units_available: 20, units_reserved: 5, critical_stock_threshold: 5, low_stock_threshold: 10 },
        { blood_type: 'O-', units_available: 7, units_reserved: 2, critical_stock_threshold: 5, low_stock_threshold: 10 }
    ];
    
    displayBloodInventory(mockInventory);
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

function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function showLoading(message = 'Loading...') {
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
    if (stats) {
        updateElement('.pending-requests-count', stats.pending_requests || 0);
        updateElement('.total-requests-count', stats.total_requests || 0);
    }
}

// Placeholder functions for future implementation
function viewRequestDetails(requestId) {
    showNotification(`Viewing details for request ${requestId}`, 'info');
}

function markRequestCompleted(requestId) {
    showNotification(`Marking request ${requestId} as completed`, 'info');
}

function viewDonationDetails(offerId) {
    showNotification(`Viewing details for donation ${offerId}`, 'info');
}

function markDonationCompleted(donationId) {
    showNotification(`Marking donation ${donationId} as completed`, 'info');
}

function scheduleDonation(donationId) {
    showNotification(`Scheduling donation ${donationId}`, 'info');
}

function updateInventory(bloodType) {
    showNotification(`Opening inventory update for ${bloodType}`, 'info');
}