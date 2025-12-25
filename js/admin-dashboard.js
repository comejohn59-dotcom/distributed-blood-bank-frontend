// frontend/js/admin/dashboard.js
document.addEventListener('DOMContentLoaded', function () {

    // API Base URL
    const API_BASE_URL = 'http://localhost/backend/api';

    // ======================
    // DOM ELEMENTS (SAFE)
    // ======================
    const notificationIcon = document.getElementById('notificationIcon');
    const notificationBadge = document.getElementById('notificationBadge');
    const userProfile = document.getElementById('userProfile');
    const dropdownMenu = document.getElementById('dropdownMenu');
    const logoutBtn = document.getElementById('logoutBtn');

    // Dashboard summary elements
    const totalBloodBanksEl = document.getElementById('totalBloodBanks');
    const totalDonorsEl = document.getElementById('totalDonors');
    const activeRequestsEl = document.getElementById('activeRequests');
    const systemHealthEl = document.getElementById('systemHealth');

    // FIX: Match REAL HTML (divs, not tables)
    const recentActivityContainer = document.getElementById('recentActivity');
    const systemNotificationsContainer = document.getElementById('systemNotifications');

    // ======================
    // INIT
    // ======================
    initializeDashboard();

    // ======================
    // EVENTS (NULL SAFE)
    // ======================
    if (userProfile && dropdownMenu) {
        userProfile.addEventListener('click', function () {
            dropdownMenu.classList.toggle('show');
        });
    }

    if (notificationIcon) {
        notificationIcon.addEventListener('click', function () {
            window.location.href = '../notifications.html';
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', function (e) {
            e.preventDefault();
            logout();
        });
    }

    document.addEventListener('click', function (event) {
        if (
            userProfile &&
            dropdownMenu &&
            !userProfile.contains(event.target) &&
            !dropdownMenu.contains(event.target)
        ) {
            dropdownMenu.classList.remove('show');
        }
    });

    // ======================
    // FUNCTIONS
    // ======================
    async function initializeDashboard() {
        const token = localStorage.getItem('auth_token');
        const userRole = localStorage.getItem('user_role');

        if (!token || userRole !== 'admin') {
            window.location.href = '../auth/login.html';
            return;
        }

        await loadDashboardSummary();
        await loadRecentActivity();
        await loadSystemAlerts();
        await loadNotifications();
    }

    async function loadDashboardSummary() {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${API_BASE_URL}/reports/summary.php`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!response.ok) return;

            const data = await response.json();
            if (!data.success) return;

            if (totalBloodBanksEl) totalBloodBanksEl.textContent = data.data.total_blood_banks ?? 0;
            if (totalDonorsEl) totalDonorsEl.textContent = data.data.total_donors ?? 0;
            if (activeRequestsEl) activeRequestsEl.textContent = data.data.active_requests ?? 0;
            if (systemHealthEl) systemHealthEl.textContent = data.data.system_health ?? 'OK';

        } catch (err) {
            console.error('Dashboard summary error:', err);
        }
    }

    async function loadRecentActivity() {
        if (!recentActivityContainer) return;

        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(
                `${API_BASE_URL}/audit_logs.php?action=get_recent&limit=10`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            recentActivityContainer.innerHTML = '';

            if (!response.ok) {
                recentActivityContainer.innerHTML = '<p>No recent activity</p>';
                return;
            }

            const data = await response.json();

            if (!data.success || !data.data.length) {
                recentActivityContainer.innerHTML = '<p>No recent activity</p>';
                return;
            }

            data.data.forEach(log => {
                const div = document.createElement('div');
                div.className = 'activity-item';
                div.innerHTML = `
                    <div class="activity-time">${formatDateTime(log.timestamp)}</div>
                    <div class="activity-text">
                        <strong>${log.user_name || 'System'}</strong> ${log.action}
                    </div>
                `;
                recentActivityContainer.appendChild(div);
            });

        } catch (err) {
            console.error('Activity error:', err);
            recentActivityContainer.innerHTML = '<p>Error loading activity</p>';
        }
    }

    async function loadSystemAlerts() {
        if (!systemNotificationsContainer) return;

        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(
                `${API_BASE_URL}/notifications.php?action=get_system_alerts&limit=10`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            systemNotificationsContainer.innerHTML = '';

            if (!response.ok) {
                systemNotificationsContainer.innerHTML = '<p>No alerts</p>';
                return;
            }

            const data = await response.json();

            if (!data.success || !data.data.length) {
                systemNotificationsContainer.innerHTML = '<p>No alerts</p>';
                return;
            }

            data.data.forEach(alert => {
                const div = document.createElement('div');
                div.className = 'notification-item';
                div.innerHTML = `
                    <div class="notification-title">
                        ${alert.type}
                        <span class="badge ${getSeverityBadgeClass(alert.severity)}">
                            ${alert.severity}
                        </span>
                    </div>
                    <div class="notification-text">${alert.message}</div>
                    <div class="notification-time">${formatDateTime(alert.created_at)}</div>
                `;
                systemNotificationsContainer.appendChild(div);
            });

        } catch (err) {
            console.error('Alerts error:', err);
            systemNotificationsContainer.innerHTML = '<p>Error loading alerts</p>';
        }
    }

    async function loadNotifications() {
        if (!notificationBadge) return;

        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(
                `${API_BASE_URL}/notifications.php?action=get_unread_count`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (!response.ok) return;

            const data = await response.json();
            if (data.success && data.data.count > 0) {
                notificationBadge.textContent = data.data.count;
            } else {
                notificationBadge.style.display = 'none';
            }

        } catch (err) {
            console.error('Notification count error:', err);
        }
    }

    function logout() {
        localStorage.clear();
        window.location.href = '../auth/login.html';
    }

    // ======================
    // UTILITIES
    // ======================
    function getSeverityBadgeClass(severity = '') {
        switch (severity.toLowerCase()) {
            case 'critical':
            case 'high':
                return 'badge-emergency';
            case 'medium':
                return 'badge-low-stock';
            case 'low':
            default:
                return 'badge-pending';
        }
    }

    function formatDateTime(dateTimeString) {
        const date = new Date(dateTimeString);
        return date.toLocaleString();
    }
});
