// Admin Hospital Management JavaScript
document.addEventListener('DOMContentLoaded', function() {
    initializeHospitalManagement();
});

function initializeHospitalManagement() {
    // Initialize tab system
    initializeTabSystem();
    
    // Load pending hospitals
    loadPendingHospitals();
    
    // Initialize search and filters
    initializeSearchAndFilters();
}

// Tab System
function initializeTabSystem() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            // Remove active class from all tabs and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            this.classList.add('active');
            document.getElementById(targetTab + '-tab').classList.add('active');
        });
    });
}

// Load Pending Hospitals
function loadPendingHospitals() {
    const pendingHospitals = JSON.parse(localStorage.getItem('pendingHospitals') || '[]');
    const pendingList = document.getElementById('pendingHospitalsList');
    
    if (pendingHospitals.length === 0) {
        pendingList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-hospital"></i>
                </div>
                <h3>No Pending Hospitals</h3>
                <p>All hospital registrations have been processed.</p>
            </div>
        `;
        return;
    }
    
    pendingList.innerHTML = '';
    
    pendingHospitals.forEach(hospital => {
        const hospitalCard = createPendingHospitalCard(hospital);
        pendingList.appendChild(hospitalCard);
    });
}

function createPendingHospitalCard(hospital) {
    const card = document.createElement('div');
    card.className = 'pending-hospital-card';
    card.setAttribute('data-hospital-id', hospital.registrationId);
    
    card.innerHTML = `
        <div class="hospital-header">
            <div class="hospital-icon pending">
                <i class="fas fa-hospital"></i>
            </div>
            <div class="hospital-info">
                <h4>${hospital.hospitalName}</h4>
                <p>${getHospitalTypeText(hospital.hospitalType)}</p>
                <span class="registration-id">${hospital.registrationId}</span>
            </div>
            <div class="registration-date">
                <span>Registered: ${formatDate(hospital.registrationDate)}</span>
            </div>
        </div>
        
        <div class="hospital-details-grid">
            <div class="detail-section">
                <h5>Hospital Information</h5>
                <div class="detail-item">
                    <span class="label">License Number:</span>
                    <span class="value">${hospital.licenseNumber}</span>
                </div>
                <div class="detail-item">
                    <span class="label">Email:</span>
                    <span class="value">${hospital.hospitalEmail}</span>
                </div>
                <div class="detail-item">
                    <span class="label">Phone:</span>
                    <span class="value">${hospital.hospitalPhone}</span>
                </div>
                <div class="detail-item">
                    <span class="label">Address:</span>
                    <span class="value">${hospital.hospitalAddress}</span>
                </div>
                ${hospital.bedCapacity ? `
                <div class="detail-item">
                    <span class="label">Bed Capacity:</span>
                    <span class="value">${hospital.bedCapacity} beds</span>
                </div>
                ` : ''}
            </div>
            
            <div class="detail-section">
                <h5>Administrator</h5>
                <div class="detail-item">
                    <span class="label">Name:</span>
                    <span class="value">${hospital.adminFirstName} ${hospital.adminLastName}</span>
                </div>
                <div class="detail-item">
                    <span class="label">Email:</span>
                    <span class="value">${hospital.adminEmail}</span>
                </div>
                <div class="detail-item">
                    <span class="label">Phone:</span>
                    <span class="value">${hospital.adminPhone}</span>
                </div>
                <div class="detail-item">
                    <span class="label">Position:</span>
                    <span class="value">${hospital.adminPosition}</span>
                </div>
                ${hospital.adminDepartment ? `
                <div class="detail-item">
                    <span class="label">Department:</span>
                    <span class="value">${hospital.adminDepartment}</span>
                </div>
                ` : ''}
            </div>
        </div>
        
        <div class="verification-section">
            <div class="verification-checklist">
                <h5>Verification Checklist</h5>
                <div class="checklist-item">
                    <input type="checkbox" id="verify-license-${hospital.registrationId}">
                    <label for="verify-license-${hospital.registrationId}">License number verified</label>
                </div>
                <div class="checklist-item">
                    <input type="checkbox" id="verify-documents-${hospital.registrationId}">
                    <label for="verify-documents-${hospital.registrationId}">Registration documents reviewed</label>
                </div>
                <div class="checklist-item">
                    <input type="checkbox" id="verify-contact-${hospital.registrationId}">
                    <label for="verify-contact-${hospital.registrationId}">Contact information verified</label>
                </div>
                <div class="checklist-item">
                    <input type="checkbox" id="verify-compliance-${hospital.registrationId}">
                    <label for="verify-compliance-${hospital.registrationId}">Compliance standards met</label>
                </div>
            </div>
            
            <div class="documents-section">
                <h5>Uploaded Documents</h5>
                <div class="document-item">
                    <i class="fas fa-file-pdf"></i>
                    <span>Registration Certificate</span>
                    <button class="btn-sm secondary" onclick="viewDocument('${hospital.registrationId}', 'certificate')">
                        <i class="fas fa-eye"></i>
                        View
                    </button>
                </div>
            </div>
        </div>
        
        <div class="approval-actions">
            <div class="action-buttons">
                <button class="btn btn-success" onclick="approveHospital('${hospital.registrationId}')">
                    <i class="fas fa-check"></i>
                    Approve Hospital
                </button>
                <button class="btn btn-danger" onclick="rejectHospital('${hospital.registrationId}')">
                    <i class="fas fa-times"></i>
                    Reject Application
                </button>
                <button class="btn btn-secondary" onclick="requestMoreInfo('${hospital.registrationId}')">
                    <i class="fas fa-question-circle"></i>
                    Request More Info
                </button>
            </div>
            
            <div class="admin-notes">
                <textarea placeholder="Add verification notes..." class="admin-notes-input" id="notes-${hospital.registrationId}"></textarea>
            </div>
        </div>
    `;
    
    return card;
}

// Hospital Actions
function approveHospital(registrationId) {
    const checklist = getVerificationChecklist(registrationId);
    
    if (!checklist.allChecked) {
        showNotification('Please complete all verification steps before approving', 'warning');
        return;
    }
    
    showConfirmationModal(
        'Approve Hospital Registration',
        'Are you sure you want to approve this hospital? This will activate their account and grant access to the system.',
        () => {
            // Get hospital data
            const pendingHospitals = JSON.parse(localStorage.getItem('pendingHospitals') || '[]');
            const hospitalIndex = pendingHospitals.findIndex(h => h.registrationId === registrationId);
            
            if (hospitalIndex !== -1) {
                const hospital = pendingHospitals[hospitalIndex];
                
                // Update status
                hospital.status = 'ACTIVE';
                hospital.approvalDate = new Date().toISOString();
                hospital.approvedBy = 'System Administrator';
                
                // Get admin notes
                const notes = document.getElementById(`notes-${registrationId}`).value;
                if (notes) {
                    hospital.adminNotes = notes;
                }
                
                // Move to active hospitals
                const activeHospitals = JSON.parse(localStorage.getItem('activeHospitals') || '[]');
                activeHospitals.push(hospital);
                localStorage.setItem('activeHospitals', JSON.stringify(activeHospitals));
                
                // Remove from pending
                pendingHospitals.splice(hospitalIndex, 1);
                localStorage.setItem('pendingHospitals', JSON.stringify(pendingHospitals));
                
                // Remove card from UI
                const card = document.querySelector(`[data-hospital-id="${registrationId}"]`);
                card.style.transition = 'all 0.5s ease';
                card.style.opacity = '0';
                card.style.transform = 'translateX(100%)';
                
                setTimeout(() => {
                    card.remove();
                    
                    // Check if no more pending hospitals
                    if (pendingHospitals.length === 0) {
                        loadPendingHospitals();
                    }
                }, 500);
                
                // Update tab badge
                updateTabBadge('pending', -1);
                updateTabBadge('active', 1);
                
                // Show success notification
                showNotification(`${hospital.hospitalName} has been approved and activated!`, 'success');
                
                // Simulate sending approval email
                setTimeout(() => {
                    showNotification(`Approval notification sent to ${hospital.adminEmail}`, 'info');
                }, 2000);
            }
        }
    );
}

function rejectHospital(registrationId) {
    showRejectModal(registrationId);
}

function showRejectModal(registrationId) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Reject Hospital Registration</h3>
                <button class="modal-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="rejection-form">
                    <div class="form-group">
                        <label>Reason for Rejection *</label>
                        <select class="form-control" id="rejectionReason" required>
                            <option value="">Select reason</option>
                            <option value="invalid-license">Invalid or expired license</option>
                            <option value="incomplete-documents">Incomplete documentation</option>
                            <option value="compliance-issues">Compliance issues</option>
                            <option value="verification-failed">Verification failed</option>
                            <option value="duplicate-registration">Duplicate registration</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Additional Comments</label>
                        <textarea class="form-control" id="rejectionComments" rows="4" placeholder="Provide specific details about the rejection..."></textarea>
                    </div>
                    
                    <div class="form-group checkbox-group">
                        <label class="checkbox-label">
                            <input type="checkbox" id="allowResubmission">
                            <span class="checkmark"></span>
                            Allow resubmission after corrections
                        </label>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary modal-close">Cancel</button>
                <button class="btn btn-danger" onclick="confirmRejection('${registrationId}')">
                    <i class="fas fa-times"></i>
                    Reject Hospital
                </button>
            </div>
        </div>
    `;
    
    showModal(modal);
}

function confirmRejection(registrationId) {
    const reason = document.getElementById('rejectionReason').value;
    const comments = document.getElementById('rejectionComments').value;
    const allowResubmission = document.getElementById('allowResubmission').checked;
    
    if (!reason) {
        showNotification('Please select a reason for rejection', 'error');
        return;
    }
    
    // Get hospital data
    const pendingHospitals = JSON.parse(localStorage.getItem('pendingHospitals') || '[]');
    const hospitalIndex = pendingHospitals.findIndex(h => h.registrationId === registrationId);
    
    if (hospitalIndex !== -1) {
        const hospital = pendingHospitals[hospitalIndex];
        
        // Update status
        hospital.status = 'REJECTED';
        hospital.rejectionDate = new Date().toISOString();
        hospital.rejectionReason = reason;
        hospital.rejectionComments = comments;
        hospital.allowResubmission = allowResubmission;
        hospital.rejectedBy = 'System Administrator';
        
        // Move to rejected hospitals
        const rejectedHospitals = JSON.parse(localStorage.getItem('rejectedHospitals') || '[]');
        rejectedHospitals.push(hospital);
        localStorage.setItem('rejectedHospitals', JSON.stringify(rejectedHospitals));
        
        // Remove from pending
        pendingHospitals.splice(hospitalIndex, 1);
        localStorage.setItem('pendingHospitals', JSON.stringify(pendingHospitals));
        
        // Remove card from UI
        const card = document.querySelector(`[data-hospital-id="${registrationId}"]`);
        card.style.transition = 'all 0.5s ease';
        card.style.opacity = '0';
        card.style.transform = 'translateX(-100%)';
        
        setTimeout(() => {
            card.remove();
            
            // Check if no more pending hospitals
            if (pendingHospitals.length === 0) {
                loadPendingHospitals();
            }
        }, 500);
        
        // Update tab badge
        updateTabBadge('pending', -1);
        
        // Close modal
        closeModal();
        
        // Show notification
        showNotification(`Hospital registration rejected: ${reason}`, 'info');
        
        // Simulate sending rejection email
        setTimeout(() => {
            showNotification(`Rejection notification sent to ${hospital.adminEmail}`, 'info');
        }, 2000);
    }
}

function requestMoreInfo(registrationId) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Request Additional Information</h3>
                <button class="modal-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="info-request-form">
                    <div class="form-group">
                        <label>Information Needed *</label>
                        <div class="checkbox-group">
                            <label class="checkbox-label">
                                <input type="checkbox" name="infoNeeded" value="updated-license">
                                <span class="checkmark"></span>
                                Updated license documentation
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" name="infoNeeded" value="additional-certificates">
                                <span class="checkmark"></span>
                                Additional certificates or accreditations
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" name="infoNeeded" value="contact-verification">
                                <span class="checkmark"></span>
                                Contact information verification
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" name="infoNeeded" value="facility-details">
                                <span class="checkmark"></span>
                                Additional facility details
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" name="infoNeeded" value="other">
                                <span class="checkmark"></span>
                                Other (specify below)
                            </label>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>Specific Requirements</label>
                        <textarea class="form-control" id="infoRequirements" rows="4" placeholder="Specify exactly what information or documentation is needed..."></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label>Response Deadline</label>
                        <select class="form-control" id="responseDeadline">
                            <option value="3">3 business days</option>
                            <option value="5">5 business days</option>
                            <option value="7">1 week</option>
                            <option value="14">2 weeks</option>
                        </select>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary modal-close">Cancel</button>
                <button class="btn btn-primary" onclick="sendInfoRequest('${registrationId}')">
                    <i class="fas fa-paper-plane"></i>
                    Send Request
                </button>
            </div>
        </div>
    `;
    
    showModal(modal);
}

function sendInfoRequest(registrationId) {
    const checkedItems = document.querySelectorAll('input[name="infoNeeded"]:checked');
    const requirements = document.getElementById('infoRequirements').value;
    const deadline = document.getElementById('responseDeadline').value;
    
    if (checkedItems.length === 0 && !requirements) {
        showNotification('Please specify what information is needed', 'error');
        return;
    }
    
    const infoNeeded = Array.from(checkedItems).map(item => item.value);
    
    // Get hospital data
    const pendingHospitals = JSON.parse(localStorage.getItem('pendingHospitals') || '[]');
    const hospital = pendingHospitals.find(h => h.registrationId === registrationId);
    
    if (hospital) {
        // Update hospital record
        hospital.infoRequested = {
            date: new Date().toISOString(),
            items: infoNeeded,
            requirements: requirements,
            deadline: deadline,
            requestedBy: 'System Administrator'
        };
        
        localStorage.setItem('pendingHospitals', JSON.stringify(pendingHospitals));
        
        // Update UI to show info requested status
        const card = document.querySelector(`[data-hospital-id="${registrationId}"]`);
        const header = card.querySelector('.hospital-header');
        
        // Add info requested indicator
        const indicator = document.createElement('div');
        indicator.className = 'info-requested-indicator';
        indicator.innerHTML = `
            <i class="fas fa-question-circle"></i>
            <span>Info Requested</span>
        `;
        header.appendChild(indicator);
        
        closeModal();
        showNotification(`Information request sent to ${hospital.adminEmail}`, 'success');
    }
}

// Verification Checklist
function getVerificationChecklist(registrationId) {
    const checkboxes = document.querySelectorAll(`input[id^="verify-"][id$="-${registrationId}"]`);
    const checkedCount = document.querySelectorAll(`input[id^="verify-"][id$="-${registrationId}"]:checked`).length;
    
    return {
        total: checkboxes.length,
        checked: checkedCount,
        allChecked: checkedCount === checkboxes.length
    };
}

// Document Viewing
function viewDocument(registrationId, documentType) {
    // In a real application, this would open the actual document
    showNotification('Document viewer would open here', 'info');
}

// Hospital Management Actions
function viewHospital(hospitalId) {
    showNotification(`Viewing hospital details for ${hospitalId}`, 'info');
}

function editHospital(hospitalId) {
    showNotification(`Editing hospital ${hospitalId}`, 'info');
}

function suspendHospital(hospitalId) {
    showConfirmationModal(
        'Suspend Hospital',
        'Are you sure you want to suspend this hospital? They will lose access to the system.',
        () => {
            showNotification(`Hospital ${hospitalId} suspended`, 'warning');
        }
    );
}

function reactivateHospital(hospitalId) {
    showConfirmationModal(
        'Reactivate Hospital',
        'Are you sure you want to reactivate this hospital?',
        () => {
            showNotification(`Hospital ${hospitalId} reactivated`, 'success');
        }
    );
}

function deleteHospital(hospitalId) {
    showConfirmationModal(
        'Delete Hospital',
        'Are you sure you want to permanently delete this hospital? This action cannot be undone.',
        () => {
            showNotification(`Hospital ${hospitalId} deleted`, 'error');
        }
    );
}

// Search and Filters
function initializeSearchAndFilters() {
    const searchInput = document.querySelector('.search-input');
    const filterSelect = document.querySelector('.filter-select');
    
    if (searchInput) {
        searchInput.addEventListener('input', filterHospitals);
    }
    
    if (filterSelect) {
        filterSelect.addEventListener('change', filterHospitals);
    }
}

function filterHospitals() {
    // Implementation for filtering active hospitals
    showNotification('Hospital filtering functionality', 'info');
}

// Utility Functions
function getHospitalTypeText(type) {
    const types = {
        'general-hospital': 'General Hospital',
        'specialty-hospital': 'Specialty Hospital',
        'blood-bank': 'Blood Bank',
        'trauma-center': 'Trauma Center',
        'community-health': 'Community Health Center'
    };
    return types[type] || type;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function updateTabBadge(tabType, change) {
    const tab = document.querySelector(`[data-tab="${tabType}"]`);
    const badge = tab.querySelector('.tab-badge');
    const currentCount = parseInt(badge.textContent);
    const newCount = Math.max(0, currentCount + change);
    badge.textContent = newCount;
}

// Modal Functions
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
                <button class="btn btn-primary confirm-action">Confirm</button>
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

// Add admin hospital styles
const adminHospitalStyles = `
    .hospital-tabs-section {
        background: white;
        border-radius: 16px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        border: 1px solid #e5e7eb;
        overflow: hidden;
    }

    .hospital-tabs {
        display: flex;
        border-bottom: 1px solid #e5e7eb;
        background: #f9fafb;
    }

    .tab-btn {
        flex: 1;
        padding: 1rem 1.5rem;
        border: none;
        background: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        font-weight: 500;
        color: #6b7280;
        transition: all 0.3s ease;
    }

    .tab-btn.active {
        color: #dc2626;
        background: white;
        border-bottom: 2px solid #dc2626;
    }

    .tab-content {
        display: none;
        padding: 2rem;
    }

    .tab-content.active {
        display: block;
    }

    .pending-hospital-card {
        background: white;
        border: 2px solid #e5e7eb;
        border-radius: 16px;
        margin-bottom: 2rem;
        overflow: hidden;
        transition: all 0.3s ease;
    }

    .pending-hospital-card:hover {
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
    }

    .hospital-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1.5rem;
        background: #f9fafb;
        border-bottom: 1px solid #e5e7eb;
    }

    .hospital-icon.pending {
        width: 60px;
        height: 60px;
        background: #f59e0b;
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
    }

    .hospital-info {
        flex: 1;
    }

    .hospital-info h4 {
        margin-bottom: 0.25rem;
        color: #1f2937;
        font-weight: 600;
    }

    .registration-id {
        font-size: 0.875rem;
        color: #6b7280;
        font-weight: 500;
    }

    .registration-date {
        text-align: right;
        font-size: 0.875rem;
        color: #6b7280;
    }

    .hospital-details-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
        padding: 1.5rem;
        border-bottom: 1px solid #e5e7eb;
    }

    .detail-section h5 {
        margin-bottom: 1rem;
        color: #1f2937;
        font-weight: 600;
        border-bottom: 1px solid #e5e7eb;
        padding-bottom: 0.5rem;
    }

    .detail-item {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.75rem;
        font-size: 0.875rem;
    }

    .detail-item .label {
        color: #6b7280;
        font-weight: 500;
    }

    .detail-item .value {
        color: #1f2937;
        font-weight: 500;
        text-align: right;
        max-width: 60%;
        word-break: break-word;
    }

    .verification-section {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
        padding: 1.5rem;
        background: #f9fafb;
        border-bottom: 1px solid #e5e7eb;
    }

    .verification-checklist h5,
    .documents-section h5 {
        margin-bottom: 1rem;
        color: #1f2937;
        font-weight: 600;
    }

    .checklist-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 0.75rem;
    }

    .checklist-item input[type="checkbox"] {
        width: 18px;
        height: 18px;
        accent-color: #dc2626;
    }

    .checklist-item label {
        font-size: 0.875rem;
        color: #4b5563;
        cursor: pointer;
    }

    .document-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        margin-bottom: 0.5rem;
    }

    .document-item i {
        color: #ef4444;
        font-size: 1.25rem;
    }

    .approval-actions {
        padding: 1.5rem;
    }

    .action-buttons {
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;
        flex-wrap: wrap;
    }

    .admin-notes-input {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        resize: vertical;
        min-height: 80px;
        font-family: inherit;
    }

    .admin-notes-input:focus {
        outline: none;
        border-color: #dc2626;
        box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
    }

    .info-requested-indicator {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: #fef3c7;
        color: #92400e;
        padding: 0.5rem 1rem;
        border-radius: 20px;
        font-size: 0.875rem;
        font-weight: 500;
    }

    .hospitals-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
        gap: 1.5rem;
    }

    .hospital-card {
        background: white;
        border: 2px solid #e5e7eb;
        border-radius: 12px;
        padding: 1.5rem;
        transition: all 0.3s ease;
    }

    .hospital-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    }

    .hospital-card.suspended {
        border-color: #ef4444;
        background: rgba(239, 68, 68, 0.02);
    }

    .hospital-card .hospital-header {
        padding: 0;
        background: none;
        border: none;
        margin-bottom: 1rem;
    }

    .hospital-card .hospital-icon {
        width: 50px;
        height: 50px;
        background: #3b82f6;
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.25rem;
    }

    .hospital-details {
        margin-bottom: 1rem;
    }

    .detail-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.5rem;
        font-size: 0.875rem;
    }

    .detail-row span:first-child {
        color: #6b7280;
    }

    .detail-row span:last-child {
        color: #1f2937;
        font-weight: 500;
    }

    .hospital-actions {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
    }

    .empty-state {
        text-align: center;
        padding: 4rem 2rem;
        color: #6b7280;
    }

    .empty-icon {
        width: 80px;
        height: 80px;
        background: #f3f4f6;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 1rem;
        font-size: 2rem;
        color: #9ca3af;
    }

    .search-filter {
        display: flex;
        gap: 1rem;
        align-items: center;
    }

    .search-input {
        flex: 1;
        padding: 0.5rem 1rem;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        font-size: 0.875rem;
    }

    .filter-select {
        padding: 0.5rem 1rem;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        font-size: 0.875rem;
        background: white;
    }

    .rejection-form .checkbox-group {
        margin-bottom: 1rem;
    }

    .info-request-form .checkbox-group {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        margin-bottom: 1rem;
    }

    @media (max-width: 1024px) {
        .hospital-details-grid,
        .verification-section {
            grid-template-columns: 1fr;
        }

        .hospitals-grid {
            grid-template-columns: 1fr;
        }
    }

    @media (max-width: 768px) {
        .tab-btn {
            flex-direction: column;
            gap: 0.25rem;
            font-size: 0.875rem;
            padding: 0.75rem 1rem;
        }

        .action-buttons {
            flex-direction: column;
        }

        .search-filter {
            flex-direction: column;
            align-items: stretch;
        }
    }
`;

// Add styles to head
const styleSheet = document.createElement('style');
styleSheet.textContent = adminHospitalStyles;
document.head.appendChild(styleSheet);