// ===== API ROOT CONFIG (MATCHES YOUR STRUCTURE) =====
window.API_ROOT = 'http://localhost/dbb-frontend';

if (typeof apiPath === 'undefined') {
    var apiPath = function (p) {
        return window.API_ROOT + p;
    };
}

document.addEventListener('DOMContentLoaded', function () {
    let userData = null;
    try {
        userData = JSON.parse(localStorage.getItem('user'));
    } catch {
        userData = null;
    }

    if (!userData) {
        window.location.href = '../auth/login.html';
        return;
    }

    displayUserInfo(userData);
    loadDashboardData();
    setupEventListeners();
    loadNotifications();
});

/* ================= USER INFO ================= */
function displayUserInfo(userData) {
    if (!userData) return;

    const userNameElement = document.getElementById('userName');
    const userAvatarElement = document.getElementById('userAvatar');
    const dashboardUserName = document.getElementById('dashboardUserName');
    const dashboardUserEmail = document.getElementById('dashboardUserEmail');
    const dashboardAvatar = document.getElementById('dashboardAvatar');

    const fullName = `${userData.first_name || ''} ${userData.last_name || ''}`.trim();

    if (userNameElement) userNameElement.textContent = fullName;
    if (dashboardUserName) dashboardUserName.textContent = fullName;

    if (dashboardUserEmail) {
        dashboardUserEmail.textContent = userData.email || '';
    }

    const initials =
        `${userData.first_name?.charAt(0) || ''}${userData.last_name?.charAt(0) || ''}`.toUpperCase();

    if (userAvatarElement) userAvatarElement.textContent = initials;
    if (dashboardAvatar) dashboardAvatar.textContent = initials;
}


/* ================= DASHBOARD LOAD ================= */
async function loadDashboardData() {
    const donorId = JSON.parse(localStorage.getItem('user')).user_id;
    showLoading(true);

    const [donations, profile, appointments] = await Promise.all([
        fetchDonations(donorId),
        fetchDonorProfile(donorId),
        fetchUpcomingAppointments(donorId)
    ]);

    displayDonations(donations);
    if (profile) displayDonorStats(profile);
    displayUpcomingAppointments(appointments);
    await loadBloodShortages();

    showLoading(false);
}

/* ================= DISPLAY DONATIONS ================= */
function displayDonations(donations) {
    const tableBody = document.querySelector('#donationsTable tbody');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    if (!donations || donations.length === 0) {
        const row = tableBody.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 5;
        cell.textContent = 'No donation history found';
        return;
    }

    // Show only last 5 donations
    const recentDonations = donations.slice(0, 5);

    recentDonations.forEach(donation => {
        const row = tableBody.insertRow();
        
        // Date
        const dateCell = row.insertCell();
        dateCell.textContent = donation.donation_date ? new Date(donation.donation_date).toLocaleDateString() : '-';
        
        // Blood Bank
        const bankCell = row.insertCell();
        bankCell.textContent = donation.bank_name || '-';
        
        // Blood Group
        const groupCell = row.insertCell();
        groupCell.textContent = donation.blood_group || '-';
        
        // Units
        const unitsCell = row.insertCell();
        unitsCell.textContent = donation.units || '1';
        
        // Status
        const statusCell = row.insertCell();
        statusCell.innerHTML = `<span style="padding: 2px 8px; background: #10b981; color: white; border-radius: 12px; font-size: 12px;">Completed</span>`;
    });
}

/* ================= DISPLAY DONOR STATS ================= */
function displayDonorStats(profile) {
    if (!profile) return;
    
    // Update blood group
    const bloodGroupElement = document.getElementById('bloodGroup');
    if (bloodGroupElement && profile.blood_group) {
        bloodGroupElement.textContent = profile.blood_group;
    }
    
    // Update total donations
    const totalDonationsElement = document.getElementById('totalDonations');
    if (totalDonationsElement && profile.total_donations !== undefined) {
        totalDonationsElement.textContent = profile.total_donations;
    }
    
    // Update eligibility status
    const eligibilityElement = document.getElementById('eligibilityStatus');
    if (eligibilityElement) {
        if (profile.is_eligible) {
            eligibilityElement.innerHTML = '<span style="color: #10b981;">✓ Eligible</span>';
        } else if (profile.next_eligible_date) {
            const nextDate = new Date(profile.next_eligible_date).toLocaleDateString();
            eligibilityElement.innerHTML = `<span style="color: #f59e0b;">Eligible from ${nextDate}</span>`;
        }
    }
    
    // Update last donation date
    const lastDonationElement = document.getElementById('lastDonation');
    if (lastDonationElement && profile.last_donation_date) {
        lastDonationElement.textContent = new Date(profile.last_donation_date).toLocaleDateString();
    }
}

/* ================= DISPLAY UPCOMING APPOINTMENTS ================= */
function displayUpcomingAppointments(appointments) {
    const container = document.getElementById('upcomingAppointments');
    if (!container) return;

    if (!appointments || appointments.length === 0) {
        container.innerHTML = '<p class="text-muted">No upcoming appointments</p>';
        return;
    }

    let html = '<ul class="appointment-list">';
    appointments.forEach(app => {
        html += `
            <li class="appointment-item">
                <div class="appointment-date">
                    <strong>${app.appointment_date ? new Date(app.appointment_date).toLocaleDateString() : '-'}</strong>
                </div>
                <div class="appointment-details">
                    <span>${app.bank_name || 'Blood Bank'}</span>
                    <span class="status-badge ${app.status || 'scheduled'}">${app.status || 'Scheduled'}</span>
                </div>
            </li>
        `;
    });
    html += '</ul>';
    container.innerHTML = html;
}

/* ================= API CALLS ================= */
async function fetchDonations(donorId) {
    try {
        const r = await fetch(apiPath(`/backend/api/donations.php?donor_id=${donorId}`), {
            credentials: 'include'  // ADDED THIS
        });
        if (!r.ok) return [];
        const j = await r.json();
        return j.success ? j.data : [];
    } catch { return []; }
}

async function fetchDonorProfile(donorId) {
    try {
        const r = await fetch(apiPath(`/backend/api/donors.php?current=true`), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'  // ADDED THIS - REMOVED Authorization header
        });
        if (!r.ok) return null;
        const j = await r.json();
        return j.success ? j.data.donor : null;
    } catch { return null; }
}

async function fetchUpcomingAppointments(donorId) {
    try {
        const today = new Date().toISOString().split('T')[0];
        const r = await fetch(
            apiPath(`/backend/api/appointments.php?donor_id=${donorId}&status=scheduled&from_date=${today}`),
            {
                credentials: 'include'  // ADDED THIS
            }
        );
        if (!r.ok) return [];
        const j = await r.json();
        return j.success ? j.data : [];
    } catch { return []; }
}

async function loadBloodShortages() {
    try {
        const r = await fetch(apiPath('/backend/api/reports/shortages.php'), {
            credentials: 'include'  // ADDED THIS
        });
        if (!r.ok) return;
        const j = await r.json();
        if (j.success) displayBloodShortages(j.data);
    } catch {}
}

/* ================= DISPLAY BLOOD SHORTAGES ================= */
function displayBloodShortages(shortages) {
    const container = document.getElementById('bloodShortages');
    if (!container) return;

    if (!shortages || shortages.length === 0) {
        container.innerHTML = '<p class="text-muted">No critical shortages reported</p>';
        return;
    }

    let html = '<ul class="shortage-list">';
    shortages.forEach(shortage => {
        html += `
            <li class="shortage-item">
                <span class="blood-group">${shortage.blood_group || 'Unknown'}</span>
                <span class="shortage-level ${shortage.severity || 'medium'}">${shortage.severity || 'Medium'}</span>
            </li>
        `;
    });
    html += '</ul>';
    container.innerHTML = html;
}

async function loadNotifications() {
    const userId = JSON.parse(localStorage.getItem('user')).user_id;
    try {
        const r = await fetch(
            apiPath(`/backend/api/notifications.php?user_id=${userId}&unread_only=true`),
            {
                credentials: 'include'  // ADDED THIS
            }
        );
        if (!r.ok) return;
        const j = await r.json();
        if (j.success) updateNotificationBadge(j.data.length);
    } catch {}
}

/* ================= LOGOUT ================= */
function logout() {
    fetch(apiPath('/backend/api/auth/logout.php'), { 
        method: 'POST',
        credentials: 'include'  // ADDED THIS
    })
        .finally(() => {
            localStorage.clear();
            window.location.href = '../auth/login.html';
        });
}

/* ================= UI HELPERS ================= */
function showLoading(show) {
    document.getElementById('loadingSpinner').style.display = show ? 'block' : 'none';
    document.getElementById('dashboardContent').style.opacity = show ? '0.5' : '1';
}

function updateNotificationBadge(count) {
    const b = document.getElementById('notificationBadge');
    b.style.display = count ? 'inline-block' : 'none';
    b.textContent = count;
}

/* ================= EVENTS ================= */
function setupEventListeners() {
    document.getElementById('logoutBtn')?.addEventListener('click', logout);
}