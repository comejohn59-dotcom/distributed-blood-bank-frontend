// Admin Users Management JavaScript
document.addEventListener('DOMContentLoaded', function() {
    initializeUserManagement();
});

function initializeUserManagement() {
    // Initialize search functionality
    initializeSearch();
    
    // Initialize filters
    initializeFilters();
    
    // Initialize table interactions
    initializeTableInteractions();
    
    // Load users data
    loadUsersData();
}

// Search Functionality
function initializeSearch() {
    const searchInput = document.getElementById('userSearch');
    
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            filterUsers();
        });
    }
}

// Filter Functionality
function initializeFilters() {
    const filters = ['userTypeFilter', 'statusFilter', 'bloodTypeFilter'];
    
    filters.forEach(filterId => {
        const filter = document.getElementById(filterId);
        if (filter) {
            filter.addEventListener('change', filterUsers);
        }
    });
}

function filterUsers() {
    const searchTerm = document.getElementById('userSearch').value.toLowerCase();
    const typeFilter = document.getElementById('userTypeFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    const bloodTypeFilter = document.getElementById('bloodTypeFilter').value;
    
    const rows = document.querySelectorAll('#usersTableBody tr');
    let visibleCount = 0;
    
    rows.forEach(row => {
        const userDetails = row.querySelector('.user-details');
        const userName = userDetails.querySelector('strong').textContent.toLowerCase();
        const userEmail = userDetails.querySelector('span').textContent.toLowerCase();
        const userType = row.getAttribute('data-type');
        const userStatus = row.getAttribute('data-status');
        const bloodType = row.querySelector('.blood-type-badge').textContent;
        
        const matchesSearch = userName.includes(searchTerm) || userEmail.includes(searchTerm);
        const matchesType = !typeFilter || userType === typeFilter;
        const matchesStatus = !statusFilter || userStatus === statusFilter;
        const matchesBloodType = !bloodTypeFilter || bloodType === bloodTypeFilter;
        
        if (matchesSearch && matchesType && matchesStatus && matchesBloodType) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });
    
    // Update pagination info
    updatePaginationInfo(visibleCount);
}

function clearFilters() {
    document.getElementById('userSearch').value = '';
    document.getElementById('userTypeFilter').value = '';
    document.getElementById('statusFilter').value = '';
    document.getElementById('bloodTypeFilter').value = '';
    filterUsers();
}

// Table Interactions
function initializeTableInteractions() {
    // Select all checkbox
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function() {
            const checkboxes = document.querySelectorAll('.user-checkbox');
            checkboxes.forEach(checkbox => {
                checkbox.checked = this.checked;
            });
        });
    }
    
    // Individual checkboxes
    document.addEventListener('change', function(e) {
        if (e.target.classList.contains('user-checkbox')) {
            updateSelectAllState();
        }
    });
}

function updateSelectAllState() {
    const checkboxes = document.querySelectorAll('.user-checkbox');
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    const checkedCount = document.querySelectorAll('.user-checkbox:checked').length;
    
    if (checkedCount === 0) {
        selectAllCheckbox.indeterminate = false;
        selectAllCheckbox.checked = false;
    } else if (checkedCount === checkboxes.length) {
        selectAllCheckbox.indeterminate = false;
        selectAllCheckbox.checked = true;
    } else {
        selectAllCheckbox.indeterminate = true;
    }
}

function selectAll() {
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    selectAllCheckbox.checked = !selectAllCheckbox.checked;
    selectAllCheckbox.dispatchEvent(new Event('change'));
}

// User Actions
function viewUser(userId) {
    showUserDetailsModal(userId);
}

function editUser(userId) {
    showEditUserModal(userId);
}

function approveUser(userId) {
    showConfirmationModal(
        'Approve User',
        'Are you sure you want to approve this user?',
        () => {
            updateUserStatus(userId, 'active');
            showNotification('User approved successfully!', 'success');
        }
    );
}

function rejectUser(userId) {
    showConfirmationModal(
        'Reject User',
        'Are you sure you want to reject this user? This action cannot be undone.',
        () => {
            updateUserStatus(userId, 'rejected');
            showNotification('User rejected.', 'info');
        }
    );
}

function suspendUser(userId) {
    showConfirmationModal(
        'Suspend User',
        'Are you sure you want to suspend this user?',
        () => {
            updateUserStatus(userId, 'suspended');
            showNotification('User suspended.', 'warning');
        }
    );
}

function reactivateUser(userId) {
    showConfirmationModal(
        'Reactivate User',
        'Are you sure you want to reactivate this user?',
        () => {
            updateUserStatus(userId, 'active');
            showNotification('User reactivated successfully!', 'success');
        }
    );
}

function deleteUser(userId) {
    showConfirmationModal(
        'Delete User',
        'Are you sure you want to permanently delete this user? This action cannot be undone.',
        () => {
            removeUserFromTable(userId);
            showNotification('User deleted permanently.', 'error');
        }
    );
}

function updateUserStatus(userId, newStatus) {
    const row = document.querySelector(`tr[data-user-id="${userId}"]`);
    if (row) {
        row.setAttribute('data-status', newStatus);
        const statusBadge = row.querySelector('.status-badge');
        statusBadge.className = `status-badge ${newStatus}`;
        statusBadge.textContent = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
        
        // Update action buttons based on new status
        updateActionButtons(row, newStatus);
    }
}

function updateActionButtons(row, status) {
    const actionButtons = row.querySelector('.action-buttons');
    const userId = row.getAttribute('data-user-id');
    
    let buttonsHTML = '';
    
    if (status === 'pending') {
        buttonsHTML = `
            <button class="btn-icon-sm success" title="Approve User" onclick="approveUser(${userId})">
                <i class="fas fa-check"></i>
            </button>
            <button class="btn-icon-sm info" title="View Details" onclick="viewUser(${userId})">
                <i class="fas fa-eye"></i>
            </button>
            <button class="btn-icon-sm danger" title="Reject User" onclick="rejectUser(${userId})">
                <i class="fas fa-times"></i>
            </button>
        `;
    } else if (status === 'suspended') {
        buttonsHTML = `
            <button class="btn-icon-sm success" title="Reactivate User" onclick="reactivateUser(${userId})">
                <i class="fas fa-undo"></i>
            </button>
            <button class="btn-icon-sm info" title="View Details" onclick="viewUser(${userId})">
                <i class="fas fa-eye"></i>
            </button>
            <button class="btn-icon-sm danger" title="Delete User" onclick="deleteUser(${userId})">
                <i class="fas fa-trash"></i>
            </button>
        `;
    } else {
        buttonsHTML = `
            <button class="btn-icon-sm info" title="View Details" onclick="viewUser(${userId})">
                <i class="fas fa-eye"></i>
            </button>
            <button class="btn-icon-sm warning" title="Edit User" onclick="editUser(${userId})">
                <i class="fas fa-edit"></i>
            </button>
            <button class="btn-icon-sm danger" title="Suspend User" onclick="suspendUser(${userId})">
                <i class="fas fa-ban"></i>
            </button>
        `;
    }
    
    actionButtons.innerHTML = buttonsHTML;
}

function removeUserFromTable(userId) {
    const row = document.querySelector(`tr[data-user-id="${userId}"]`);
    if (row) {
        row.remove();
        updatePaginationInfo();
    }
}

// Bulk Actions
function bulkAction(action) {
    const checkedBoxes = document.querySelectorAll('.user-checkbox:checked');
    
    if (checkedBoxes.length === 0) {
        showNotification('Please select users to perform bulk action.', 'warning');
        return;
    }
    
    const userIds = Array.from(checkedBoxes).map(checkbox => {
        return checkbox.closest('tr').getAttribute('data-user-id');
    });
    
    const actionText = action === 'suspend' ? 'suspend' : 'activate';
    const confirmText = `Are you sure you want to ${actionText} ${userIds.length} selected user(s)?`;
    
    showConfirmationModal(
        `Bulk ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}`,
        confirmText,
        () => {
            userIds.forEach(userId => {
                updateUserStatus(userId, action === 'suspend' ? 'suspended' : 'active');
            });
            
            // Uncheck all checkboxes
            checkedBoxes.forEach(checkbox => checkbox.checked = false);
            updateSelectAllState();
            
            showNotification(`${userIds.length} user(s) ${actionText}d successfully!`, 'success');
        }
    );
}

// Modal Functions
function showUserDetailsModal(userId) {
    // Get user data (in real app, this would be an API call)
    const userData = getUserData(userId);
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content large">
            <div class="modal-header">
                <h3>User Details - ${userData.name}</h3>
                <button class="modal-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="user-details-grid">
                    <div class="detail-section">
                        <h4>Personal Information</h4>
                        <div class="detail-item">
                            <label>Full Name:</label>
                            <span>${userData.name}</span>
                        </div>
                        <div class="detail-item">
                            <label>Email:</label>
                            <span>${userData.email}</span>
                        </div>
                        <div class="detail-item">
                            <label>Phone:</label>
                            <span>${userData.phone}</span>
                        </div>
                        <div class="detail-item">
                            <label>Date of Birth:</label>
                            <span>${userData.dob}</span>
                        </div>
                        <div class="detail-item">
                            <label>Blood Type:</label>
                            <span class="blood-type-badge">${userData.bloodType}</span>
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h4>Account Information</h4>
                        <div class="detail-item">
                            <label>User Type:</label>
                            <span class="badge ${userData.type}">${userData.type.charAt(0).toUpperCase() + userData.type.slice(1)}</span>
                        </div>
                        <div class="detail-item">
                            <label>Status:</label>
                            <span class="status-badge ${userData.status}">${userData.status.charAt(0).toUpperCase() + userData.status.slice(1)}</span>
                        </div>
                        <div class="detail-item">
                            <label>Joined:</label>
                            <span>${userData.joined}</span>
                        </div>
                        <div class="detail-item">
                            <label>Last Active:</label>
                            <span>${userData.lastActive}</span>
                        </div>
                        <div class="detail-item">
                            <label>Total Donations:</label>
                            <span>${userData.donations || 'N/A'}</span>
                        </div>
                    </div>
                </div>
                
                <div class="activity-section">
                    <h4>Recent Activity</h4>
                    <div class="activity-list">
                        ${userData.activities.map(activity => `
                            <div class="activity-item">
                                <i class="fas fa-${activity.icon}"></i>
                                <span>${activity.description}</span>
                                <span class="activity-time">${activity.time}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary modal-close">Close</button>
                <button class="btn btn-warning" onclick="editUser(${userId}); closeModal();">Edit User</button>
            </div>
        </div>
    `;
    
    showModal(modal);
}

function showEditUserModal(userId) {
    const userData = getUserData(userId);
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Edit User - ${userData.name}</h3>
                <button class="modal-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <form class="edit-user-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Full Name</label>
                            <input type="text" class="form-control" name="name" value="${userData.name}" required>
                        </div>
                        <div class="form-group">
                            <label>Email</label>
                            <input type="email" class="form-control" name="email" value="${userData.email}" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Phone</label>
                            <input type="tel" class="form-control" name="phone" value="${userData.phone}">
                        </div>
                        <div class="form-group">
                            <label>Blood Type</label>
                            <select class="form-control" name="bloodType">
                                <option value="A+" ${userData.bloodType === 'A+' ? 'selected' : ''}>A+</option>
                                <option value="A-" ${userData.bloodType === 'A-' ? 'selected' : ''}>A-</option>
                                <option value="B+" ${userData.bloodType === 'B+' ? 'selected' : ''}>B+</option>
                                <option value="B-" ${userData.bloodType === 'B-' ? 'selected' : ''}>B-</option>
                                <option value="AB+" ${userData.bloodType === 'AB+' ? 'selected' : ''}>AB+</option>
                                <option value="AB-" ${userData.bloodType === 'AB-' ? 'selected' : ''}>AB-</option>
                                <option value="O+" ${userData.bloodType === 'O+' ? 'selected' : ''}>O+</option>
                                <option value="O-" ${userData.bloodType === 'O-' ? 'selected' : ''}>O-</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>User Type</label>
                            <select class="form-control" name="type">
                                <option value="donor" ${userData.type === 'donor' ? 'selected' : ''}>Donor</option>
                                <option value="patient" ${userData.type === 'patient' ? 'selected' : ''}>Patient</option>
                                <option value="hospital" ${userData.type === 'hospital' ? 'selected' : ''}>Hospital</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Status</label>
                            <select class="form-control" name="status">
                                <option value="active" ${userData.status === 'active' ? 'selected' : ''}>Active</option>
                                <option value="inactive" ${userData.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                                <option value="suspended" ${userData.status === 'suspended' ? 'selected' : ''}>Suspended</option>
                                <option value="pending" ${userData.status === 'pending' ? 'selected' : ''}>Pending</option>
                            </select>
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary modal-close">Cancel</button>
                <button class="btn btn-primary" onclick="saveUserChanges(${userId})">Save Changes</button>
            </div>
        </div>
    `;
    
    showModal(modal);
}

function showAddUserModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Add New User</h3>
                <button class="modal-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <form class="add-user-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Full Name</label>
                            <input type="text" class="form-control" name="name" required>
                        </div>
                        <div class="form-group">
                            <label>Email</label>
                            <input type="email" class="form-control" name="email" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Phone</label>
                            <input type="tel" class="form-control" name="phone">
                        </div>
                        <div class="form-group">
                            <label>Blood Type</label>
                            <select class="form-control" name="bloodType" required>
                                <option value="">Select Blood Type</option>
                                <option value="A+">A+</option>
                                <option value="A-">A-</option>
                                <option value="B+">B+</option>
                                <option value="B-">B-</option>
                                <option value="AB+">AB+</option>
                                <option value="AB-">AB-</option>
                                <option value="O+">O+</option>
                                <option value="O-">O-</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>User Type</label>
                            <select class="form-control" name="type" required>
                                <option value="">Select User Type</option>
                                <option value="donor">Donor</option>
                                <option value="patient">Patient</option>
                                <option value="hospital">Hospital</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Initial Status</label>
                            <select class="form-control" name="status">
                                <option value="pending">Pending Approval</option>
                                <option value="active">Active</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Temporary Password</label>
                        <input type="password" class="form-control" name="password" placeholder="User will be asked to change on first login">
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary modal-close">Cancel</button>
                <button class="btn btn-primary" onclick="addNewUser()">Add User</button>
            </div>
        </div>
    `;
    
    showModal(modal);
}

// Helper Functions
function getUserData(userId) {
    // Mock data - in real app, this would be an API call
    const users = {
        1: {
            name: 'John Doe',
            email: 'john.doe@email.com',
            phone: '+1 (555) 123-4567',
            dob: 'January 15, 1990',
            bloodType: 'O+',
            type: 'donor',
            status: 'active',
            joined: 'Dec 15, 2024',
            lastActive: '2 hours ago',
            donations: 12,
            activities: [
                { icon: 'tint', description: 'Completed blood donation', time: '2 days ago' },
                { icon: 'user-edit', description: 'Updated profile information', time: '1 week ago' },
                { icon: 'sign-in-alt', description: 'Logged in to account', time: '2 hours ago' }
            ]
        },
        2: {
            name: 'City Hospital',
            email: 'admin@cityhospital.com',
            phone: '+1 (555) 987-6543',
            dob: 'N/A',
            bloodType: '-',
            type: 'hospital',
            status: 'active',
            joined: 'Dec 10, 2024',
            lastActive: '1 hour ago',
            donations: 'N/A',
            activities: [
                { icon: 'hospital', description: 'Updated blood inventory', time: '1 hour ago' },
                { icon: 'hand-holding-medical', description: 'Processed blood request', time: '3 hours ago' },
                { icon: 'user-check', description: 'Approved donor registration', time: '1 day ago' }
            ]
        }
    };
    
    return users[userId] || users[1];
}

function saveUserChanges(userId) {
    const form = document.querySelector('.edit-user-form');
    const formData = new FormData(form);
    
    // Update the table row with new data
    const row = document.querySelector(`tr[data-user-id="${userId}"]`);
    if (row) {
        // Update user details in the table
        const userDetails = row.querySelector('.user-details');
        userDetails.querySelector('strong').textContent = formData.get('name');
        userDetails.querySelector('span').textContent = formData.get('email');
        
        // Update blood type
        row.querySelector('.blood-type-badge').textContent = formData.get('bloodType');
        
        // Update status
        const newStatus = formData.get('status');
        updateUserStatus(userId, newStatus);
        
        // Update type badge
        const typeBadge = row.querySelector('.badge');
        typeBadge.className = `badge ${formData.get('type')}`;
        typeBadge.textContent = formData.get('type').charAt(0).toUpperCase() + formData.get('type').slice(1);
    }
    
    closeModal();
    showNotification('User updated successfully!', 'success');
}

function addNewUser() {
    const form = document.querySelector('.add-user-form');
    const formData = new FormData(form);
    
    // Validate form
    if (!formData.get('name') || !formData.get('email') || !formData.get('type')) {
        showNotification('Please fill in all required fields.', 'error');
        return;
    }
    
    // Add new row to table (in real app, this would be an API call)
    const newUserId = Date.now(); // Simple ID generation
    const tableBody = document.getElementById('usersTableBody');
    
    const newRow = document.createElement('tr');
    newRow.setAttribute('data-user-id', newUserId);
    newRow.setAttribute('data-type', formData.get('type'));
    newRow.setAttribute('data-status', formData.get('status'));
    
    const initials = formData.get('name').split(' ').map(n => n[0]).join('').toUpperCase();
    
    newRow.innerHTML = `
        <td><input type="checkbox" class="user-checkbox"></td>
        <td>
            <div class="user-info-cell">
                <div class="user-avatar-sm">${initials}</div>
                <div class="user-details">
                    <strong>${formData.get('name')}</strong>
                    <span>${formData.get('email')}</span>
                </div>
            </div>
        </td>
        <td><span class="badge ${formData.get('type')}">${formData.get('type').charAt(0).toUpperCase() + formData.get('type').slice(1)}</span></td>
        <td><span class="blood-type-badge">${formData.get('bloodType')}</span></td>
        <td><span class="status-badge ${formData.get('status')}">${formData.get('status').charAt(0).toUpperCase() + formData.get('status').slice(1)}</span></td>
        <td>Just now</td>
        <td>Just now</td>
        <td>
            <div class="action-buttons">
                <button class="btn-icon-sm info" title="View Details" onclick="viewUser(${newUserId})">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-icon-sm warning" title="Edit User" onclick="editUser(${newUserId})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon-sm danger" title="Suspend User" onclick="suspendUser(${newUserId})">
                    <i class="fas fa-ban"></i>
                </button>
            </div>
        </td>
    `;
    
    tableBody.insertBefore(newRow, tableBody.firstChild);
    
    closeModal();
    showNotification('User added successfully!', 'success');
}

function loadUsersData() {
    // In a real application, this would load data from an API
    // For now, we'll just update the pagination info
    updatePaginationInfo();
}

function updatePaginationInfo(visibleCount = null) {
    const paginationInfo = document.querySelector('.pagination-info');
    if (paginationInfo) {
        const totalRows = document.querySelectorAll('#usersTableBody tr').length;
        const displayCount = visibleCount !== null ? visibleCount : totalRows;
        paginationInfo.textContent = `Showing 1-${displayCount} of ${displayCount} users`;
    }
}

// Utility Functions
function showModal(modal) {
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;

    document.body.appendChild(modal);

    setTimeout(() => {
        modal.style.opacity = '1';
    }, 10);

    modal.addEventListener('click', function(e) {
        if (e.target === modal || e.target.classList.contains('modal-close')) {
            closeModal();
        }
    });
}

function closeModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.style.opacity = '0';
        setTimeout(() => modal.remove(), 300);
    }
}

function showConfirmationModal(title, message, onConfirm) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content small">
            <div class="modal-header">
                <h3>${title}</h3>
                <button class="modal-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <p>${message}</p>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary modal-close">Cancel</button>
                <button class="btn btn-danger confirm-action">Confirm</button>
            </div>
        </div>
    `;

    modal.addEventListener('click', function(e) {
        if (e.target.classList.contains('confirm-action')) {
            onConfirm();
            closeModal();
        }
    });

    showModal(modal);
}

// Add admin-specific styles
const adminStyles = `
    .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid #e5e7eb;
    }

    .page-title h1 {
        margin-bottom: 0.5rem;
        color: #1f2937;
        font-size: 2rem;
        font-weight: 700;
    }

    .page-title p {
        color: #6b7280;
        margin: 0;
    }

    .page-actions {
        display: flex;
        gap: 1rem;
    }

    .user-stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1.5rem;
        margin-bottom: 2rem;
    }

    .filters-section {
        background: white;
        padding: 1.5rem;
        border-radius: 12px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        margin-bottom: 2rem;
        border: 1px solid #e5e7eb;
    }

    .search-box {
        position: relative;
        margin-bottom: 1rem;
    }

    .search-box i {
        position: absolute;
        left: 1rem;
        top: 50%;
        transform: translateY(-50%);
        color: #9ca3af;
    }

    .search-box input {
        width: 100%;
        padding: 0.75rem 1rem 0.75rem 3rem;
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        font-size: 1rem;
        transition: border-color 0.3s ease;
    }

    .search-box input:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .filter-controls {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
        align-items: center;
    }

    .filter-select {
        padding: 0.5rem 1rem;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        background: white;
        font-size: 0.875rem;
        min-width: 150px;
    }

    .users-table-section {
        background: white;
        border-radius: 12px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        border: 1px solid #e5e7eb;
        overflow: hidden;
    }

    .table-header {
        padding: 1.5rem;
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .table-actions {
        display: flex;
        gap: 0.5rem;
    }

    .table-container {
        overflow-x: auto;
    }

    .users-table {
        width: 100%;
        border-collapse: collapse;
    }

    .users-table th,
    .users-table td {
        padding: 1rem;
        text-align: left;
        border-bottom: 1px solid #f3f4f6;
    }

    .users-table th {
        background: #f9fafb;
        font-weight: 600;
        color: #374151;
        font-size: 0.875rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .users-table tbody tr:hover {
        background: #f9fafb;
    }

    .user-info-cell {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .user-avatar-sm {
        width: 40px;
        height: 40px;
        background: #3b82f6;
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 0.875rem;
        flex-shrink: 0;
    }

    .user-avatar-sm.hospital {
        background: #10b981;
    }

    .user-details strong {
        display: block;
        color: #1f2937;
        font-weight: 600;
    }

    .user-details span {
        display: block;
        color: #6b7280;
        font-size: 0.875rem;
    }

    .blood-type-badge {
        background: #fef2f2;
        color: #dc2626;
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-weight: 600;
        font-size: 0.875rem;
    }

    .status-badge {
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-weight: 600;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .status-badge.active {
        background: rgba(16, 185, 129, 0.1);
        color: #10b981;
    }

    .status-badge.inactive {
        background: rgba(107, 114, 128, 0.1);
        color: #6b7280;
    }

    .status-badge.pending {
        background: rgba(245, 158, 11, 0.1);
        color: #f59e0b;
    }

    .status-badge.suspended {
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;
    }

    .action-buttons {
        display: flex;
        gap: 0.5rem;
    }

    .btn-icon-sm {
        width: 32px;
        height: 32px;
        border: none;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 0.875rem;
    }

    .btn-icon-sm.info {
        background: rgba(59, 130, 246, 0.1);
        color: #3b82f6;
    }

    .btn-icon-sm.warning {
        background: rgba(245, 158, 11, 0.1);
        color: #f59e0b;
    }

    .btn-icon-sm.danger {
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;
    }

    .btn-icon-sm.success {
        background: rgba(16, 185, 129, 0.1);
        color: #10b981;
    }

    .btn-icon-sm:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .pagination-section {
        padding: 1.5rem;
        border-top: 1px solid #e5e7eb;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .pagination-info {
        color: #6b7280;
        font-size: 0.875rem;
    }

    .pagination-controls {
        display: flex;
        gap: 0.5rem;
        align-items: center;
    }

    .modal-content.large {
        max-width: 800px;
        width: 90%;
    }

    .modal-content.small {
        max-width: 400px;
        width: 90%;
    }

    .user-details-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
        margin-bottom: 2rem;
    }

    .detail-section h4 {
        margin-bottom: 1rem;
        color: #1f2937;
        font-weight: 600;
        border-bottom: 1px solid #e5e7eb;
        padding-bottom: 0.5rem;
    }

    .detail-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.75rem;
        padding: 0.5rem 0;
    }

    .detail-item label {
        font-weight: 500;
        color: #6b7280;
        margin: 0;
    }

    .activity-section h4 {
        margin-bottom: 1rem;
        color: #1f2937;
        font-weight: 600;
        border-bottom: 1px solid #e5e7eb;
        padding-bottom: 0.5rem;
    }

    .activity-list {
        max-height: 200px;
        overflow-y: auto;
    }

    .activity-item {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 0.75rem 0;
        border-bottom: 1px solid #f3f4f6;
    }

    .activity-item:last-child {
        border-bottom: none;
    }

    .activity-item i {
        color: #6b7280;
        width: 16px;
    }

    .activity-time {
        margin-left: auto;
        font-size: 0.75rem;
        color: #9ca3af;
    }

    @media (max-width: 1024px) {
        .user-details-grid {
            grid-template-columns: 1fr;
        }

        .filter-controls {
            flex-direction: column;
            align-items: stretch;
        }

        .filter-select {
            min-width: auto;
        }
    }

    @media (max-width: 768px) {
        .page-header {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
        }

        .page-actions {
            justify-content: center;
        }

        .user-stats-grid {
            grid-template-columns: 1fr;
        }

        .table-header {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
        }

        .table-actions {
            justify-content: center;
        }

        .pagination-section {
            flex-direction: column;
            gap: 1rem;
        }

        .users-table {
            font-size: 0.875rem;
        }

        .users-table th,
        .users-table td {
            padding: 0.75rem 0.5rem;
        }
    }
`;

// Add styles to head
const styleSheet = document.createElement('style');
styleSheet.textContent = adminStyles;
document.head.appendChild(styleSheet);