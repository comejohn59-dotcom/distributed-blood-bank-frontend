// frontend/js/admin/users.js

// API path helper — allows overriding `window.API_ROOT` to fix backend paths centrally
if (typeof apiPath === 'undefined') {
    var apiPath = function(p) { return (typeof window !== 'undefined' && window.API_ROOT) ? window.API_ROOT + p : p; };
}
class UserManagement {
class UserManagement {
    constructor() {
        this.users = [];
        this.currentPage = 1;
        this.totalPages = 1;
        this.limit = 20;
        this.filters = {
            search: '',
            role: '',
            status: ''
        };
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.loadUsers();
        this.loadStatistics();
        this.loadBloodBanks();
    }
    
    bindEvents() {
        // Add user button
        document.getElementById('add-user').addEventListener('click', () => this.showAddUserModal());
        
        // Filter events
        document.getElementById('apply-user-filters').addEventListener('click', () => this.applyFilters());
        document.getElementById('search-users').addEventListener('input', (e) => {
            this.filters.search = e.target.value;
            this.currentPage = 1;
            this.loadUsers();
        });
        document.getElementById('role-filter').addEventListener('change', (e) => {
            this.filters.role = e.target.value;
            this.currentPage = 1;
            this.loadUsers();
        });
        document.getElementById('status-filter').addEventListener('change', (e) => {
            this.filters.status = e.target.value;
            this.currentPage = 1;
            this.loadUsers();
        });
        
        // Pagination
        document.getElementById('prev-users-page').addEventListener('click', () => this.changePage(-1));
        document.getElementById('next-users-page').addEventListener('click', () => this.changePage(1));
        
        // Refresh and export
        document.getElementById('refresh-users').addEventListener('click', () => this.loadUsers());
        document.getElementById('export-users').addEventListener('click', () => this.exportUsers());
        
        // User modal events
        document.getElementById('close-user-modal').addEventListener('click', () => this.closeUserModal());
        document.getElementById('cancel-user-modal').addEventListener('click', () => this.closeUserModal());
        document.getElementById('save-user').addEventListener('click', () => this.saveUser());
        
        // User role change shows/hides blood bank field
        document.getElementById('user-role').addEventListener('change', (e) => {
            const bloodBankField = document.getElementById('blood-bank-field');
            bloodBankField.style.display = e.target.value === 'blood_bank' ? 'block' : 'none';
        });
        
        // User details modal
        document.getElementById('close-details-modal').addEventListener('click', () => this.closeDetailsModal());
        document.getElementById('close-details').addEventListener('click', () => this.closeDetailsModal());
        document.getElementById('edit-user-details').addEventListener('click', () => this.editUserFromDetails());
    }
    
    async loadUsers() {
        try {
            this.showLoading();
            
            const params = new URLSearchParams({
                page: this.currentPage,
                limit: this.limit,
                ...this.filters
            });
            
            const response = await fetch(apiPath(`/backend/api/users.php?${params}`), {
                credentials: 'include'
            });
            
            if (!response.ok) throw new Error('Failed to fetch users');
            
            const data = await response.json();
            
            if (data.success) {
                this.users = data.data.users || [];
                this.renderUsers(this.users);
                this.updatePagination(data.data.pagination);
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            this.showError(error.message);
        }
    }
    
    async loadStatistics() {
        try {
            const response = await fetch(apiPath('/backend/api/users.php?stats=true'), {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    const stats = data.data.statistics || {};
                    document.getElementById('admin-count').textContent = stats.admin_count || 0;
                    document.getElementById('bank-staff-count').textContent = stats.blood_bank_count || 0;
                    document.getElementById('hospital-count').textContent = stats.hospital_count || 0;
                    document.getElementById('donor-count').textContent = stats.donor_count || 0;
                }
            }
        } catch (error) {
            console.error('Failed to load statistics:', error);
        }
    }
    
    async loadBloodBanks() {
        try {
            const response = await fetch(apiPath('/backend/api/blood_banks.php'), {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    const select = document.getElementById('assigned-blood-bank');
                    select.innerHTML = '<option value="">Select Blood Bank</option>';
                    
                    data.data.blood_banks.forEach(bank => {
                        if (bank.status === 'active') {
                            const option = document.createElement('option');
                            option.value = bank.id;
                            option.textContent = `${bank.name} (${bank.location})`;
                            select.appendChild(option);
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Failed to load blood banks:', error);
        }
    }
    
    renderUsers(users) {
        const tbody = document.getElementById('users-table-body');
        tbody.innerHTML = '';
        
        if (users.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">
                        <i class="fas fa-users empty-icon"></i>
                        <p>No users found</p>
                        <button class="btn btn-primary" onclick="userManagement.showAddUserModal()">
                            <i class="fas fa-user-plus"></i> Add First User
                        </button>
                    </td>
                </tr>
            `;
            return;
        }
        
        users.forEach(user => {
            const row = document.createElement('tr');
            row.className = 'user-row';
            row.dataset.id = user.id;
            
            // Determine role badge class and icon
            let roleClass = 'badge-secondary';
            let roleIcon = 'fas fa-user';
            
            switch(user.role) {
                case 'admin':
                    roleClass = 'badge-danger';
                    roleIcon = 'fas fa-user-shield';
                    break;
                case 'blood_bank':
                    roleClass = 'badge-primary';
                    roleIcon = 'fas fa-user-md';
                    break;
                case 'hospital':
                    roleClass = 'badge-info';
                    roleIcon = 'fas fa-hospital-user';
                    break;
                case 'donor':
                    roleClass = 'badge-success';
                    roleIcon = 'fas fa-hand-holding-heart';
                    break;
            }
            
            // Determine status badge class
            let statusClass = 'badge-secondary';
            if (user.status === 'active') statusClass = 'badge-success';
            else if (user.status === 'inactive') statusClass = 'badge-danger';
            else if (user.status === 'pending') statusClass = 'badge-warning';
            
            // Format last login
            let lastLogin = '-';
            if (user.last_login) {
                const loginDate = new Date(user.last_login);
                const now = new Date();
                const diffHours = Math.floor((now - loginDate) / (1000 * 60 * 60));
                
                if (diffHours < 24) {
                    lastLogin = `${diffHours} hours ago`;
                } else {
                    lastLogin = loginDate.toLocaleDateString();
                }
            }
            
            row.innerHTML = `
                <td>
                    <div class="user-cell">
                        <div class="user-avatar-small">${user.name ? user.name.charAt(0).toUpperCase() : '?'}</div>
                        <div>
                            <div class="user-name">${user.name}</div>
                            <div class="user-id">ID: ${user.id}</div>
                        </div>
                    </div>
                </td>
                <td>${user.email}</td>
                <td>
                    <span class="badge ${roleClass}">
                        <i class="${roleIcon}"></i> ${user.role}
                    </span>
                </td>
                <td>${user.blood_bank_name || '-'}</td>
                <td>
                    <span class="badge ${statusClass}">${user.status}</span>
                </td>
                <td><small>${lastLogin}</small></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-outline view-user" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline edit-user" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger ${user.status === 'active' ? 'deactivate-user' : 'activate-user'}" 
                                title="${user.status === 'active' ? 'Deactivate' : 'Activate'}">
                            <i class="fas fa-${user.status === 'active' ? 'user-slash' : 'user-check'}"></i>
                        </button>
                    </div>
                </td>
            `;
            
            tbody.appendChild(row);
            
            // Add event listeners
            row.querySelector('.view-user').addEventListener('click', () => this.showUserDetails(user));
            row.querySelector('.edit-user').addEventListener('click', () => this.showEditUserModal(user));
            row.querySelector('.deactivate-user, .activate-user').addEventListener('click', () => this.toggleUserStatus(user));
        });
    }
    
    showAddUserModal() {
        document.getElementById('user-modal-title').textContent = 'Add New User';
        document.getElementById('user-form').reset();
        document.getElementById('user-id').value = '';
        document.getElementById('user-status').value = 'active';
        document.getElementById('blood-bank-field').style.display = 'none';
        document.getElementById('user-modal').classList.add('show');
    }
    
    showEditUserModal(user) {
        document.getElementById('user-modal-title').textContent = 'Edit User';
        
        // Populate form
        document.getElementById('user-id').value = user.id;
        
        // Split name into first and last
        const nameParts = user.name.split(' ');
        document.getElementById('first-name').value = nameParts[0] || '';
        document.getElementById('last-name').value = nameParts.slice(1).join(' ') || '';
        
        document.getElementById('user-email').value = user.email;
        document.getElementById('user-phone').value = user.phone || '';
        document.getElementById('user-role').value = user.role;
        document.getElementById('user-status').value = user.status;
        
        // Show/hide blood bank field based on role
        const bloodBankField = document.getElementById('blood-bank-field');
        if (user.role === 'blood_bank') {
            bloodBankField.style.display = 'block';
            document.getElementById('assigned-blood-bank').value = user.blood_bank_id || '';
        } else {
            bloodBankField.style.display = 'none';
        }
        
        // Clear password fields for editing
        document.getElementById('user-password').value = '';
        document.getElementById('confirm-password').value = '';
        
        document.getElementById('user-modal').classList.add('show');
    }
    
    async saveUser() {
        try {
            const form = document.getElementById('user-form');
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }
            
            // Validate password
            const password = document.getElementById('user-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            
            if (password && password.length < 8) {
                this.showNotification('Password must be at least 8 characters', 'error');
                return;
            }
            
            if (password !== confirmPassword) {
                this.showNotification('Passwords do not match', 'error');
                return;
            }
            
            const userData = {
                first_name: document.getElementById('first-name').value,
                last_name: document.getElementById('last-name').value,
                email: document.getElementById('user-email').value,
                phone: document.getElementById('user-phone').value,
                role: document.getElementById('user-role').value,
                status: document.getElementById('user-status').value
            };
            
            const passwordValue = document.getElementById('user-password').value;
            if (passwordValue) {
                userData.password = passwordValue;
            }
            
            const userId = document.getElementById('user-id').value;
            if (userId) userData.id = parseInt(userId);
            
            // Add blood bank assignment for blood bank staff
            if (userData.role === 'blood_bank') {
                const bloodBankId = document.getElementById('assigned-blood-bank').value;
                if (bloodBankId) {
                    userData.blood_bank_id = parseInt(bloodBankId);
                }
            }
            
            const method = userId ? 'PUT' : 'POST';
            const url = '/backend/api/users.php';
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
                credentials: 'include'
            });
            
            if (!response.ok) throw new Error('Failed to save user');
            
            const data = await response.json();
            
            if (data.success) {
                this.closeUserModal();
                this.showNotification('User saved successfully!', 'success');
                this.loadUsers();
                this.loadStatistics();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            this.showNotification('Error: ' + error.message, 'error');
        }
    }
    
    async showUserDetails(user) {
        try {
            // Load detailed user information
            const response = await fetch(`/backend/api/users.php?id=${user.id}`, {
                credentials: 'include'
            });
            
            if (!response.ok) throw new Error('Failed to load user details');
            
            const data = await response.json();
            
            if (data.success) {
                const userDetails = data.data.user;
                this.populateDetailsModal(userDetails);
                document.getElementById('user-details-modal').classList.add('show');
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            this.showNotification('Error: ' + error.message, 'error');
        }
    }
    
    populateDetailsModal(user) {
        // Set avatar
        const avatar = document.getElementById('user-avatar');
        avatar.textContent = user.name ? user.name.charAt(0).toUpperCase() : '?';
        
        // Set name
        document.getElementById('user-full-name').textContent = user.name;
        
        // Set role badge
        const roleBadge = document.getElementById('user-role-badge');
        roleBadge.textContent = user.role;
        roleBadge.className = `badge ${this.getRoleBadgeClass(user.role)}`;
        
        // Set other details
        document.getElementById('detail-email').textContent = user.email;
        document.getElementById('detail-phone').textContent = user.phone || '-';
        
        const statusBadge = document.getElementById('detail-status');
        statusBadge.textContent = user.status;
        statusBadge.className = `badge ${user.status === 'active' ? 'success' : 'danger'}`;
        
        document.getElementById('detail-blood-bank').textContent = user.blood_bank_name || '-';
        document.getElementById('detail-registered').textContent = new Date(user.created_at).toLocaleDateString();
        document.getElementById('detail-last-login').textContent = user.last_login ? 
            new Date(user.last_login).toLocaleString() : 'Never';
        
        // Set statistics (these would come from the API)
        document.getElementById('user-requests').textContent = user.request_count || 0;
        document.getElementById('user-donations').textContent = user.donation_count || 0;
        document.getElementById('user-appointments').textContent = user.appointment_count || 0;
        
        // Store user ID for editing
        document.getElementById('edit-user-details').dataset.userId = user.id;
    }
    
    editUserFromDetails() {
        const userId = document.getElementById('edit-user-details').dataset.userId;
        const user = this.users.find(u => u.id == userId);
        
        if (user) {
            this.closeDetailsModal();
            this.showEditUserModal(user);
        }
    }
    
    async toggleUserStatus(user) {
        const newStatus = user.status === 'active' ? 'inactive' : 'active';
        const confirmMessage = `Are you sure you want to ${newStatus === 'active' ? 'activate' : 'deactivate'} ${user.name}?`;
        
        if (!confirm(confirmMessage)) return;
        
        try {
            const response = await fetch(apiPath('/backend/api/users.php'), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: user.id,
                    status: newStatus
                }),
                credentials: 'include'
            });
            
            if (!response.ok) throw new Error('Failed to update user status');
            
            const data = await response.json();
            
            if (data.success) {
                this.showNotification(`User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully!`, 'success');
                this.loadUsers();
                this.loadStatistics();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            this.showNotification('Error: ' + error.message, 'error');
        }
    }
    
    getRoleBadgeClass(role) {
        switch(role) {
            case 'admin': return 'badge-danger';
            case 'blood_bank': return 'badge-primary';
            case 'hospital': return 'badge-info';
            case 'donor': return 'badge-success';
            default: return 'badge-secondary';
        }
    }
    
    updatePagination(pagination) {
        this.currentPage = pagination.page;
        this.totalPages = pagination.pages;
        
        const pageInfo = document.getElementById('users-page-info');
        const prevBtn = document.getElementById('prev-users-page');
        const nextBtn = document.getElementById('next-users-page');
        
        pageInfo.textContent = `Page ${pagination.page} of ${pagination.pages}`;
        prevBtn.disabled = pagination.page <= 1;
        nextBtn.disabled = pagination.page >= pagination.pages;
    }
    
    applyFilters() {
        // Filters are already applied via event listeners
        this.loadUsers();
    }
    
    changePage(delta) {
        const newPage = this.currentPage + delta;
        if (newPage >= 1 && newPage <= this.totalPages) {
            this.currentPage = newPage;
            this.loadUsers();
        }
    }
    
    async exportUsers() {
        try {
            // Build export URL with current filters
            const params = new URLSearchParams({
                ...this.filters,
                export: 'csv'
            });
            
            // Create a temporary link for download
            const link = document.createElement('a');
            link.href = `/backend/api/users.php?${params}`;
            link.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
        } catch (error) {
            this.showNotification('Failed to export users: ' + error.message, 'error');
        }
    }
    
    closeUserModal() {
        document.getElementById('user-modal').classList.remove('show');
    }
    
    closeDetailsModal() {
        document.getElementById('user-details-modal').classList.remove('show');
    }
    
    showLoading() {
        const tbody = document.getElementById('users-table-body');
        tbody.innerHTML = `
            <tr class="loading-row">
                <td colspan="7" class="text-center">
                    <div class="loading-spinner"></div>
                    <p>Loading users...</p>
                </td>
            </tr>
        `;
    }
    
    showError(message) {
        const tbody = document.getElementById('users-table-body');
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center error-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>${message}</p>
                    <button class="btn btn-primary" onclick="window.location.reload()">
                        <i class="fas fa-redo"></i> Retry
                    </button>
                </td>
            </tr>
        `;
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close">&times;</button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);
        
        // Close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.userManagement = new UserManagement();
});