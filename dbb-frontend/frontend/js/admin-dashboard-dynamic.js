// Dynamic Admin Dashboard JavaScript
// Handles hospital approvals and system management

// API Configuration
const API_BASE_URL = 'http://localhost/bloodconnect/backend/api';

// Initialize admin dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeAdminDashboard();
});

function initializeAdminDashboard() {
    // Check authentication
    if (!protectDashboard('admin')) {
        return;
    }
    
    // Initialize user info
    initializeDashboardUser();
    
    // Load pending hospitals
    loadPendingHospitals();
    
    // Initialize event listeners
    initializeEventListeners();
    
    // Load dashboard statistics
    loadDashboardStats();
}

function initializeEventListeners() {
    // Refresh button
    const refreshBtn = document.querySelector('.btn[onclick="refreshData()"]');
    if (refreshBtn) {
        refreshBtn.onclick = refreshData;
    }
}

// Load pending hospital registrations
async function loadPendingHospitals() {
    try {
        showLoading('Loading pending hospital registrations...');
        
        const response = await fetch(`${API_BASE_URL}/admin/get_pending_hospitals.php`, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('bloodconnect_token')
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            displayPendingHospitals(result.data.pending_hospitals);
            updateHospitalStats(result.data.stats);
        } else {
            showNotification(result.message || 'Failed to load pending hospitals', 'error');
        }
        
    } catch (error) {
        console.error('Load pending hospitals error:', error);
        // Show mock data if API fails
        displayMockPendingHospitals();
    } finally {
        hideLoading();
    }
}

// Display pending hospitals
function displayPendingHospitals(hospitals) {
    const approvalsTable = document.querySelector('.approvals-table tbody');
    if (!approvalsTable) return;
    
    if (!hospitals || hospitals.length === 0) {
        approvalsTable.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 2rem;">
                    <i class="fas fa-check-circle" style="font-size: 2rem; color: #10b981; margin-bottom: 1rem;"></i>
                    <p>No pending hospital registrations</p>
                </td>
            </tr>
        `;
        return;
    }
    
    const hospitalsHTML = hospitals.map(hospital => `
        <tr>
            <td>
                <div class="user-cell">
                    <div class="user-avatar-sm">${hospital.hospital_name.substring(0, 2).toUpperCase()}</div>
                    <div>
                        <strong>${hospital.hospital_name}</strong>
                        <br>
                        <small>${hospital.first_name} ${hospital.last_name}</small>
                        <br>
                        <small>${hospital.email}</small>
                    </div>
                </div>
            </td>
            <td><span class="badge info">Hospital</span></td>
            <td>
                <div>
                    <strong>Type:</strong> ${capitalizeFirst(hospital.hospital_type)}<br>
                    <strong>License:</strong> ${hospital.license_number}<br>
                    <strong>Beds:</strong> ${hospital.bed_capacity || 'N/A'}
                </div>
            </td>
            <td>${formatDate(hospital.created_at)}</td>
            <td>
                <button class="btn-sm success" onclick="approveHospital(${hospital.id}, '${hospital.hospital_name}')">
                    <i class="fas fa-check"></i>
                    Approve
                </button>
                <button class="btn-sm danger" onclick="rejectHospital(${hospital.id}, '${hospital.hospital_name}')">
                    <i class="fas fa-times"></i>
                    Reject
                </button>
                <button class="btn-sm info" onclick="viewHospitalDetails(${hospital.id})">
                    <i class="fas fa-eye"></i>
                    Details
                </button>
            </td>
        </tr>
    `).join('');
    
    approvalsTable.innerHTML = hospitalsHTML;
}

// Approve hospital
async function approveHospital(hospitalId, hospitalName) {
    if (!confirm(`Approve registration for ${hospitalName}?\n\nThis will give them full access to the BloodConnect system.`)) {
        return;
    }
    
    try {
        showLoading('Processing hospital approval...');
        
        const response = await fetch(`${API_BASE_URL}/admin/approve_hospital.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('bloodconnect_token')
            },
            body: JSON.stringify({
                hospital_id: hospitalId,
                action: 'approve'
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification(`${hospitalName} has been approved successfully!`, 'success');
            loadPendingHospitals(); // Refresh the list
            loadDashboardStats(); // Update stats
        } else {
            showNotification(result.message || 'Failed to approve hospital', 'error');
        }
        
    } catch (error) {
        console.error('Approve hospital error:', error);
        showNotification('Failed to approve hospital', 'error');
    } finally {
        hideLoading();
    }
}

// Reject hospital
async function rejectHospital(hospitalId, hospitalName) {
    const reason = prompt(`Reject registration for ${hospitalName}?\n\nPlease provide a reason for rejection:`);
    if (!reason) return;
    
    try {
        showLoading('Processing hospital rejection...');
        
        const response = await fetch(`${API_BASE_URL}/admin/approve_hospital.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('bloodconnect_token')
            },
            body: JSON.stringify({
                hospital_id: hospitalId,
                action: 'reject',
                rejection_reason: reason
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification(`${hospitalName} registration has been rejected`, 'info');
            loadPendingHospitals(); // Refresh the list
            loadDashboardStats(); // Update stats
        } else {
            showNotification(result.message || 'Failed to reject hospital', 'error');
        }
        
    } catch (error) {
        console.error('Reject hospital error:', error);
        showNotification('Failed to reject hospital', 'error');
    } finally {
        hideLoading();
    }
}

// Load dashboard statistics
async function loadDashboardStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/get_stats.php`, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('bloodconnect_token')
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            updateDashboardStats(result.data);
        }
        
    } catch (error) {
        console.error('Load stats error:', error);
        // Use mock stats if API fails
        updateMockStats();
    }
}

// Update dashboard statistics
function updateDashboardStats(stats) {
    if (!stats) return;
    
    // Update stat cards
    updateStatCard('[data-target="1247"]', stats.total_donors || 1247);
    updateStatCard('[data-target="856"]', stats.blood_units_available || 856);
    updateStatCard('[data-target="23"]', stats.active_requests || 23);
    updateStatCard('[data-target="4"]', stats.critical_alerts || 4);
    
    // Update pending approvals badge
    const pendingBadge = document.querySelector('.approvals-card .badge');
    if (pendingBadge) {
        pendingBadge.textContent = `${stats.pending_hospitals || 0} pending`;
    }
}

// Update hospital statistics
function updateHospitalStats(stats) {
    if (!stats) return;
    
    // Update any hospital-specific stats display
    console.log('Hospital stats:', stats);
}

// Mock data for fallback
function displayMockPendingHospitals() {
    const mockHospitals = [
        {
            id: 1,
            hospital_name: 'Metro Medical Center',
            first_name: 'Dr. Sarah',
            last_name: 'Johnson',
            email: 'admin@metromed.com',
            hospital_type: 'private',
            license_number: 'LIC-2024-001',
            bed_capacity: 200,
            created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        },
        {
            id: 2,
            hospital_name: 'Community Health Center',
            first_name: 'Dr. Michael',
            last_name: 'Brown',
            email: 'admin@commhealth.com',
            hospital_type: 'public',
            license_number: 'LIC-2024-002',
            bed_capacity: 150,
            created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
        }
    ];
    
    displayPendingHospitals(mockHospitals);
}

function updateMockStats() {
    const mockStats = {
        total_donors: 1247,
        blood_units_available: 856,
        active_requests: 23,
        critical_alerts: 4,
        pending_hospitals: 2
    };
    
    updateDashboardStats(mockStats);
}

// Utility functions
function updateStatCard(selector, value) {
    const element = document.querySelector(selector);
    if (element) {
        // Animate counter
        animateCounter(element, parseInt(element.textContent) || 0, value);
    }
}

function animateCounter(element, start, end) {
    const duration = 1000;
    const increment = (end - start) / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            current = end;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current);
    }, 16);
}

function refreshData() {
    showNotification('Refreshing admin dashboard...', 'info');
    loadPendingHospitals();
    loadDashboardStats();
}

function viewHospitalDetails(hospitalId) {
    showNotification(`Viewing details for hospital ${hospitalId}`, 'info');
    // Would open a modal with detailed hospital information
}

function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString();
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
    
    // Add CSS animation if not exists
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