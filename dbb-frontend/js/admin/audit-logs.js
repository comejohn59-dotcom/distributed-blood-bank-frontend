// API path helper — allows overriding `window.API_ROOT` to fix backend paths centrally
if (typeof apiPath === 'undefined') {
    var apiPath = function(p) { return (typeof window !== 'undefined' && window.API_ROOT) ? window.API_ROOT + p : p; };
}

class AuditLogs {
    constructor() {
        this.currentPage = 1;
        this.totalPages = 1;
        this.limit = 50;
        this.filters = {
            user_id: '',
            action: '',
            entity: '',
            start_date: '',
            end_date: ''
        };
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.loadAuditLogs();
        this.loadUserDropdown();
    }
    
    bindEvents() {
        // Filter events
        document.getElementById('apply-filters').addEventListener('click', () => this.applyFilters());
        document.getElementById('reset-filters').addEventListener('click', () => this.resetFilters());
        
        // Pagination events
        document.getElementById('prev-page').addEventListener('click', () => this.changePage(-1));
        document.getElementById('next-page').addEventListener('click', () => this.changePage(1));
        
        // Refresh and export
        document.getElementById('refresh-logs').addEventListener('click', () => this.loadAuditLogs());
        document.getElementById('export-logs').addEventListener('click', () => this.exportLogs());
        
        // Date range validation
        document.getElementById('start-date').addEventListener('change', (e) => {
            const endDate = document.getElementById('end-date');
            if (e.target.value && endDate.value && e.target.value > endDate.value) {
                endDate.value = e.target.value;
            }
        });
    }
    
    async loadAuditLogs() {
        try {
            this.showLoading();
            
            const params = new URLSearchParams({
                page: this.currentPage,
                limit: this.limit,
                ...this.filters
            });
            
            const response = await fetch(`/backend/api/audit_logs.php?${params}`, {
                credentials: 'include'
            });
            
            if (!response.ok) throw new Error('Failed to fetch audit logs');
            
            const data = await response.json();
            
            if (data.success) {
                this.renderAuditLogs(data.data.logs);
                this.updatePagination(data.data.pagination);
                this.updateStatistics(data.data.logs);
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            this.showError(error.message);
        }
    }
    
    renderAuditLogs(logs) {
        const tbody = document.getElementById('logs-table-body');
        tbody.innerHTML = '';
        
        if (logs.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">
                        <i class="fas fa-clipboard-list empty-icon"></i>
                        <p>No audit logs found</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        logs.forEach(log => {
            const row = document.createElement('tr');
            row.className = 'audit-log-row';
            row.dataset.id = log.id;
            
            // Format timestamp
            const timestamp = new Date(log.created_at).toLocaleString();
            
            // Determine action badge class
            let actionClass = 'badge-secondary';
            if (log.action === 'create') actionClass = 'badge-success';
            else if (log.action === 'update') actionClass = 'badge-warning';
            else if (log.action === 'delete') actionClass = 'badge-danger';
            else if (log.action === 'login' || log.action === 'logout') actionClass = 'badge-info';
            
            // Format details
            let detailsText = '-';
            if (log.details) {
                if (typeof log.details === 'object') {
                    detailsText = JSON.stringify(log.details, null, 2);
                } else {
                    detailsText = log.details;
                }
            }
            
            row.innerHTML = `
                <td>${timestamp}</td>
                <td>
                    <div class="user-cell">
                        <div class="user-avatar-small">${log.user_name ? log.user_name.charAt(0).toUpperCase() : '?'}</div>
                        <div>
                            <div class="user-name">${log.user_name || 'Unknown User'}</div>
                            <div class="user-email">${log.user_email || ''}</div>
                        </div>
                    </div>
                </td>
                <td><span class="badge ${actionClass}">${log.action}</span></td>
                <td>${log.entity_type}</td>
                <td><code>${log.entity_id}</code></td>
                <td>
                    <button class="btn btn-sm btn-outline view-details" title="View Details">
                        <i class="fas fa-eye"></i> View
                    </button>
                </td>
                <td><small>${log.ip_address || '-'}</small></td>
            `;
            
            tbody.appendChild(row);
            
            // Add click event for details
            row.querySelector('.view-details').addEventListener('click', () => {
                this.showLogDetails(log);
            });
        });
    }
    
    showLogDetails(log) {
        // Populate modal with log details
        document.getElementById('detail-action').textContent = log.action;
        document.getElementById('detail-action').className = `badge ${this.getActionBadgeClass(log.action)}`;
        
        document.getElementById('detail-user').textContent = 
            `${log.user_name || 'Unknown User'} (${log.user_email || 'No email'})`;
        
        document.getElementById('detail-timestamp').textContent = 
            new Date(log.created_at).toLocaleString();
        
        document.getElementById('detail-entity').textContent = log.entity_type;
        document.getElementById('detail-entity-id').textContent = log.entity_id;
        document.getElementById('detail-ip').textContent = log.ip_address || '-';
        
        // Format and display details
        const detailsElement = document.getElementById('detail-changes');
        if (log.details) {
            let detailsText;
            if (typeof log.details === 'object') {
                detailsText = JSON.stringify(log.details, null, 2);
            } else {
                try {
                    detailsText = JSON.stringify(JSON.parse(log.details), null, 2);
                } catch {
                    detailsText = log.details;
                }
            }
            detailsElement.textContent = detailsText;
            detailsElement.style.display = 'block';
        } else {
            detailsElement.textContent = 'No details available';
        }
        
        // Show modal
        document.getElementById('log-details-modal').classList.add('show');
        document.getElementById('close-log-modal').addEventListener('click', () => {
            document.getElementById('log-details-modal').classList.remove('show');
        });
        
        // Close modal on outside click
        document.getElementById('log-details-modal').addEventListener('click', (e) => {
            if (e.target.id === 'log-details-modal') {
                document.getElementById('log-details-modal').classList.remove('show');
            }
        });
    }
    
    getActionBadgeClass(action) {
        switch(action) {
            case 'create': return 'badge-success';
            case 'update': return 'badge-warning';
            case 'delete': return 'badge-danger';
            case 'login':
            case 'logout': return 'badge-info';
            default: return 'badge-secondary';
        }
    }
    
    updatePagination(pagination) {
        this.currentPage = pagination.page;
        this.totalPages = pagination.pages;
        
        const pageInfo = document.getElementById('page-info');
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        
        pageInfo.textContent = `Page ${pagination.page} of ${pagination.pages}`;
        prevBtn.disabled = pagination.page <= 1;
        nextBtn.disabled = pagination.page >= pagination.pages;
    }
    
    updateStatistics(logs) {
        // Update total logs
        document.getElementById('total-logs').textContent = logs.length;
        
        // Calculate today's logs
        const today = new Date().toDateString();
        const todayLogs = logs.filter(log => 
            new Date(log.created_at).toDateString() === today
        );
        document.getElementById('today-logs').textContent = todayLogs.length;
        
        // Calculate critical actions (deletes, emergency requests, etc.)
        const criticalActions = logs.filter(log => 
            ['delete', 'emergency_request', 'security_breach'].includes(log.action)
        );
        document.getElementById('critical-actions').textContent = criticalActions.length;
        
        // Calculate admin actions
        // This would require user role information in the logs
        document.getElementById('admin-actions').textContent = 'N/A';
    }
    
    async loadUserDropdown() {
        try {
            const response = await fetch(apiPath('/backend/api/users.php?limit=100'), {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    const select = document.getElementById('user-filter');
                    select.innerHTML = '<option value="">All Users</option>';
                    
                    data.data.users.forEach(user => {
                        const option = document.createElement('option');
                        option.value = user.id;
                        option.textContent = `${user.name} (${user.email})`;
                        select.appendChild(option);
                    });
                }
            }
        } catch (error) {
            console.error('Failed to load users:', error);
        }
    }
    
    applyFilters() {
        this.filters = {
            user_id: document.getElementById('user-filter').value,
            action: document.getElementById('action-filter').value,
            entity: document.getElementById('entity-filter').value,
            start_date: document.getElementById('start-date').value,
            end_date: document.getElementById('end-date').value
        };
        
        this.currentPage = 1;
        this.loadAuditLogs();
    }
    
    resetFilters() {
        document.getElementById('user-filter').value = '';
        document.getElementById('action-filter').value = '';
        document.getElementById('entity-filter').value = '';
        document.getElementById('start-date').value = '';
        document.getElementById('end-date').value = '';
        
        this.filters = {
            user_id: '',
            action: '',
            entity: '',
            start_date: '',
            end_date: ''
        };
        
        this.currentPage = 1;
        this.loadAuditLogs();
    }
    
    changePage(delta) {
        const newPage = this.currentPage + delta;
        if (newPage >= 1 && newPage <= this.totalPages) {
            this.currentPage = newPage;
            this.loadAuditLogs();
        }
    }
    
    async exportLogs() {
        try {
            // Build export URL with current filters
            const params = new URLSearchParams({
                ...this.filters,
                export: 'csv'
            });
            
            // Create a temporary link for download
            const link = document.createElement('a');
            link.href = `/backend/api/audit_logs.php?${params}`;
            link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
        } catch (error) {
            this.showError('Failed to export logs: ' + error.message);
        }
    }
    
    showLoading() {
        const tbody = document.getElementById('logs-table-body');
        tbody.innerHTML = `
            <tr class="loading-row">
                <td colspan="7" class="text-center">
                    <div class="loading-spinner"></div>
                    <p>Loading audit logs...</p>
                </td>
            </tr>
        `;
    }
    
    showError(message) {
        const tbody = document.getElementById('logs-table-body');
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
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AuditLogs();
});