class BloodBanks {
    constructor() {
        this.bloodBanks = [];
        this.selectedBank = null;
        this.init();
    }
    
    // API path helper — allows overriding `window.API_ROOT` to fix backend paths centrally
    if (typeof apiPath === 'undefined') {
        var apiPath = function(p) { return (typeof window !== 'undefined' && window.API_ROOT) ? window.API_ROOT + p : p; };
    }
    
    init() {
        this.bindEvents();
        this.loadBloodBanks();
        this.loadStatistics();
    }
    
    bindEvents() {
        // Add new blood bank
        document.getElementById('add-blood-bank').addEventListener('click', () => this.showAddModal());
        
        // Modal events
        document.getElementById('close-modal').addEventListener('click', () => this.closeModal());
        document.getElementById('cancel-modal').addEventListener('click', () => this.closeModal());
        document.getElementById('save-blood-bank').addEventListener('click', () => this.saveBloodBank());
        
        // Search
        document.getElementById('search-banks').addEventListener('input', (e) => this.searchBanks(e.target.value));
        document.getElementById('refresh-banks').addEventListener('click', () => this.loadBloodBanks());
        
        // Delete confirmation
        document.getElementById('cancel-delete').addEventListener('click', () => this.closeDeleteModal());
        document.getElementById('confirm-delete').addEventListener('click', () => this.deleteBloodBank());
    }
    
    async loadBloodBanks() {
        try {
            this.showLoading();
            
            const response = await fetch(apiPath('/backend/api/blood_banks.php'), {
                credentials: 'include'
            });
            
            if (!response.ok) throw new Error('Failed to fetch blood banks');
            
            const data = await response.json();
            
            if (data.success) {
                this.bloodBanks = data.data.blood_banks || [];
                this.renderBloodBanks(this.bloodBanks);
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            this.showError(error.message);
        }
    }
    
    async loadStatistics() {
        try {
            const response = await fetch(apiPath('/backend/api/reports/summary.php'), {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    const stats = data.data.summary_statistics;
                    document.getElementById('total-banks').textContent = stats.active_blood_banks || 0;
                    document.getElementById('active-banks').textContent = stats.active_blood_banks || 0;
                    document.getElementById('total-inventory').textContent = stats.total_blood_units || 0;
                    
                    // Calculate total staff (this would need a separate API)
                    document.getElementById('total-staff').textContent = 'N/A';
                }
            }
        } catch (error) {
            console.error('Failed to load statistics:', error);
        }
    }
    
    renderBloodBanks(banks) {
        const tbody = document.getElementById('banks-table-body');
        tbody.innerHTML = '';
        
        if (banks.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">
                        <i class="fas fa-hospital empty-icon"></i>
                        <p>No blood banks found</p>
                        <button class="btn btn-primary" onclick="bloodBanks.showAddModal()">
                            <i class="fas fa-plus"></i> Add First Blood Bank
                        </button>
                    </td>
                </tr>
            `;
            return;
        }
        
        banks.forEach(bank => {
            const row = document.createElement('tr');
            row.className = 'blood-bank-row';
            row.dataset.id = bank.id;
            
            // Determine status badge class
            let statusClass = 'badge-secondary';
            if (bank.status === 'active') statusClass = 'badge-success';
            else if (bank.status === 'inactive') statusClass = 'badge-danger';
            else if (bank.status === 'maintenance') statusClass = 'badge-warning';
            
            row.innerHTML = `
                <td>
                    <div class="bank-name">
                        <i class="fas fa-hospital"></i>
                        <strong>${bank.name}</strong>
                    </div>
                </td>
                <td>
                    <div class="bank-location">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${bank.location}</span>
                    </div>
                </td>
                <td>
                    <div class="bank-contact">
                        <div><i class="fas fa-envelope"></i> ${bank.contact_email}</div>
                        <div><i class="fas fa-phone"></i> ${bank.contact_phone}</div>
                    </div>
                </td>
                <td>
                    <span class="badge ${statusClass}">${bank.status}</span>
                </td>
                <td>
                    <div class="inventory-info">
                        <i class="fas fa-tint"></i>
                        <span>${bank.total_inventory || 0} units</span>
                    </div>
                </td>
                <td>
                    <div class="staff-info">
                        <i class="fas fa-user-md"></i>
                        <span>${bank.staff_count || 0} staff</span>
                    </div>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-outline view-bank" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline edit-bank" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger delete-bank" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            
            tbody.appendChild(row);
            
            // Add event listeners for action buttons
            row.querySelector('.view-bank').addEventListener('click', () => this.viewBankDetails(bank));
            row.querySelector('.edit-bank').addEventListener('click', () => this.showEditModal(bank));
            row.querySelector('.delete-bank').addEventListener('click', () => this.showDeleteModal(bank));
        });
    }
    
    showAddModal() {
        this.selectedBank = null;
        document.getElementById('modal-title').textContent = 'Add New Blood Bank';
        document.getElementById('blood-bank-form').reset();
        document.getElementById('bank-id').value = '';
        document.getElementById('bank-status').value = 'active';
        document.getElementById('blood-bank-modal').classList.add('show');
    }
    
    showEditModal(bank) {
        this.selectedBank = bank;
        document.getElementById('modal-title').textContent = 'Edit Blood Bank';
        
        // Populate form fields
        document.getElementById('bank-id').value = bank.id;
        document.getElementById('bank-name').value = bank.name;
        document.getElementById('bank-location').value = bank.location;
        document.getElementById('contact-email').value = bank.contact_email;
        document.getElementById('contact-phone').value = bank.contact_phone;
        document.getElementById('bank-address').value = bank.address || '';
        document.getElementById('latitude').value = bank.latitude || '';
        document.getElementById('longitude').value = bank.longitude || '';
        document.getElementById('bank-status').value = bank.status;
        
        document.getElementById('blood-bank-modal').classList.add('show');
    }
    
    async saveBloodBank() {
        try {
            const form = document.getElementById('blood-bank-form');
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }
            
            const bankData = {
                name: document.getElementById('bank-name').value,
                location: document.getElementById('bank-location').value,
                contact_email: document.getElementById('contact-email').value,
                contact_phone: document.getElementById('contact-phone').value,
                address: document.getElementById('bank-address').value,
                status: document.getElementById('bank-status').value
            };
            
            const latitude = document.getElementById('latitude').value;
            const longitude = document.getElementById('longitude').value;
            if (latitude) bankData.latitude = parseFloat(latitude);
            if (longitude) bankData.longitude = parseFloat(longitude);
            
            const bankId = document.getElementById('bank-id').value;
            const method = bankId ? 'PUT' : 'POST';
            const url = '/backend/api/blood_banks.php';
            
            if (bankId) bankData.id = parseInt(bankId);
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(bankData),
                credentials: 'include'
            });
            
            if (!response.ok) throw new Error('Failed to save blood bank');
            
            const data = await response.json();
            
            if (data.success) {
                this.closeModal();
                this.showNotification('Blood bank saved successfully!', 'success');
                this.loadBloodBanks();
                this.loadStatistics();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            this.showNotification('Error: ' + error.message, 'error');
        }
    }
    
    viewBankDetails(bank) {
        // This would open a detailed view modal or navigate to a details page
        alert(`Viewing details for ${bank.name}\n\nLocation: ${bank.location}\nEmail: ${bank.contact_email}\nPhone: ${bank.contact_phone}\nStatus: ${bank.status}`);
    }
    
    showDeleteModal(bank) {
        this.selectedBank = bank;
        document.getElementById('confirm-delete-modal').classList.add('show');
    }
    
    async deleteBloodBank() {
        if (!this.selectedBank) return;
        
        try {
            const response = await fetch(`/backend/api/blood_banks.php?id=${this.selectedBank.id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            
            if (!response.ok) throw new Error('Failed to delete blood bank');
            
            const data = await response.json();
            
            if (data.success) {
                this.closeDeleteModal();
                this.showNotification('Blood bank deleted successfully!', 'success');
                this.loadBloodBanks();
                this.loadStatistics();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            this.showNotification('Error: ' + error.message, 'error');
        }
    }
    
    closeModal() {
        document.getElementById('blood-bank-modal').classList.remove('show');
        this.selectedBank = null;
    }
    
    closeDeleteModal() {
        document.getElementById('confirm-delete-modal').classList.remove('show');
        this.selectedBank = null;
    }
    
    searchBanks(query) {
        if (!query.trim()) {
            this.renderBloodBanks(this.bloodBanks);
            return;
        }
        
        const searchTerm = query.toLowerCase();
        const filtered = this.bloodBanks.filter(bank => 
            bank.name.toLowerCase().includes(searchTerm) ||
            bank.location.toLowerCase().includes(searchTerm) ||
            bank.contact_email.toLowerCase().includes(searchTerm) ||
            bank.contact_phone.includes(searchTerm)
        );
        
        this.renderBloodBanks(filtered);
    }
    
    showLoading() {
        const tbody = document.getElementById('banks-table-body');
        tbody.innerHTML = `
            <tr class="loading-row">
                <td colspan="7" class="text-center">
                    <div class="loading-spinner"></div>
                    <p>Loading blood banks...</p>
                </td>
            </tr>
        `;
    }
    
    showError(message) {
        const tbody = document.getElementById('banks-table-body');
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
    window.bloodBanks = new BloodBanks();
});