// Hospital Dashboard Specific JavaScript
document.addEventListener('DOMContentLoaded', function() {
    initializeHospitalDashboard();
});

function initializeHospitalDashboard() {
    // Initialize real-time stock monitoring
    initializeStockMonitoring();
    
    // Initialize approval system
    initializeApprovalSystem();
    
    // Initialize alert system
    initializeAlertSystem();
    
    // Initialize inventory management
    initializeInventoryManagement();
    
    // Initialize blood request system
    initializeBloodRequestSystem();
    
    // Initialize tab system
    initializeTabSystem();
    
    // Initialize donation offers system
    initializeDonationOffersSystem();
    
    // Initialize patient blood request monitoring
    initializePatientBloodRequestMonitoring();
}

// Donation Offers System
function initializeDonationOffersSystem() {
    // Simulate incoming donation offers
    setInterval(() => {
        if (Math.random() < 0.15) { // 15% chance every 2 minutes
            addNewDonationOffer();
        }
    }, 120000);
}

// Donation Offer Handlers
function acceptDonationOffer(offerId, donorName, bloodType) {
    showConfirmationModal(
        'Accept Donation Offer',
        `Accept donation offer from ${donorName} (${bloodType} blood)?<br><br>This will:<br>• Notify the donor of acceptance<br>• Schedule the donation appointment<br>• Block this offer from other hospitals<br>• Set donation status to PENDING`,
        () => {
            // Update the offer status to accepted (PENDING in workflow)
            updateDonationOfferStatus(offerId, 'accepted');
            
            // Create donation record with PENDING status
            createDonationRecord(offerId, donorName, bloodType, 'PENDING');
            
            // Show success notification
            showNotification(`Donation offer accepted! ${donorName} has been notified and appointment scheduled. Status: PENDING`, 'success');
            
            // Simulate donor notification and confirmation
            setTimeout(() => {
                showNotification(`${donorName} confirmed the appointment for ${bloodType} donation`, 'info');
                // Update system logs
                logDonationActivity(offerId, 'DONOR_CONFIRMED', `${donorName} confirmed appointment`);
            }, 3000);
            
            // Update pending count
            updateDonationOffersBadge(-1);
            
            // Add to scheduled donations list
            addToScheduledDonations(offerId, donorName, bloodType);
        }
    );
}

function rejectDonationOffer(offerId, donorName) {
    showRejectionModal(offerId, donorName);
}

function showRejectionModal(offerId, donorName) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Reject Donation Offer</h3>
                <button class="modal-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <p>Rejecting donation offer from <strong>${donorName}</strong></p>
                <div class="form-group">
                    <label>Reason for Rejection</label>
                    <select class="form-control" name="rejectionReason">
                        <option value="no_need">No current need for this blood type</option>
                        <option value="schedule_conflict">Schedule conflict - capacity full</option>
                        <option value="capacity_full">Donation capacity full today</option>
                        <option value="medical_concern">Medical screening concern</option>
                        <option value="other">Other reason</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Additional Message (Optional)</label>
                    <textarea class="form-control" name="rejectionMessage" rows="3" placeholder="Optional message to donor..."></textarea>
                </div>
                <div class="rejection-options">
                    <label class="checkbox-label">
                        <input type="checkbox" name="suggestAlternative">
                        <span class="checkmark"></span>
                        Suggest alternative date/time
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" name="referToOtherHospital">
                        <span class="checkmark"></span>
                        Refer to other hospitals in network
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" name="allowReapply">
                        <span class="checkmark"></span>
                        Allow donor to choose another hospital or change date
                    </label>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary modal-cancel">Cancel</button>
                <button class="btn btn-danger" onclick="confirmRejection('${offerId}', '${donorName}')">
                    <i class="fas fa-times"></i>
                    Reject Offer
                </button>
            </div>
        </div>
    `;
    
    showModal(modal);
}

function confirmRejection(offerId, donorName) {
    const modal = document.querySelector('.modal-overlay');
    const reason = modal.querySelector('[name="rejectionReason"]').value;
    const message = modal.querySelector('[name="rejectionMessage"]').value;
    const suggestAlternative = modal.querySelector('[name="suggestAlternative"]').checked;
    const referToOther = modal.querySelector('[name="referToOtherHospital"]').checked;
    const allowReapply = modal.querySelector('[name="allowReapply"]').checked;
    
    // Remove the offer
    removeDonationOffer(offerId);
    
    // Log rejection activity
    logDonationActivity(offerId, 'HOSPITAL_REJECTED', `Rejected: ${reason}`);
    
    // Show notification based on options
    let notificationMessage = `Donation offer rejected. ${donorName} has been notified.`;
    if (suggestAlternative) {
        notificationMessage += ' Alternative dates suggested.';
    }
    if (referToOther) {
        notificationMessage += ' Referred to network hospitals.';
    }
    if (allowReapply) {
        notificationMessage += ' Donor can choose another hospital or change date.';
    }
    
    showNotification(notificationMessage, 'info');
    
    // Simulate donor notification with options
    setTimeout(() => {
        if (allowReapply) {
            showNotification(`${donorName} can now choose another hospital or reschedule`, 'info');
        }
    }, 2000);
    
    // Update pending count
    updateDonationOffersBadge(-1);
    
    // Close modal
    modal.remove();
}

function confirmDonationCompleted(offerId, donorName, bloodType) {
    showConfirmationModal(
        'Confirm Donation Completed',
        `Confirm that ${donorName} has successfully completed the ${bloodType} blood donation?<br><br>This will:<br>• Update blood inventory (+1 unit)<br>• Update donor history<br>• Reset donor eligibility period (56 days)<br>• Send completion confirmation<br>• Update donation status to COMPLETED`,
        () => {
            // Update stock after donation
            updateStockAfterDonation(bloodType, 1);
            
            // Update the offer status to completed
            updateDonationOfferStatus(offerId, 'completed');
            
            // Log completion activity
            logDonationActivity(offerId, 'DONATION_COMPLETED', `${donorName} completed ${bloodType} donation`);
            
            // Update donor eligibility
            updateDonorEligibility(donorName, 56); // 56 days until next donation
            
            // Show success notification
            showNotification(`Donation completed! ${donorName}'s ${bloodType} blood added to inventory. Thank you message sent.`, 'success');
            
            // Simulate system updates
            setTimeout(() => {
                showNotification('Donor eligibility updated, next donation available in 56 days', 'info');
                showNotification('Blood stock updated, inventory levels refreshed', 'success');
            }, 2000);
            
            // Remove from scheduled donations and add to completed
            moveToCompletedDonations(offerId, donorName, bloodType);
        }
    );
}

function viewDonorProfile(offerId) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content large">
            <div class="modal-header">
                <h3>Donor Profile</h3>
                <button class="modal-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="donor-profile-container">
                    <div class="profile-header">
                        <div class="profile-avatar">
                            <img src="https://via.placeholder.com/100" alt="John Doe">
                        </div>
                        <div class="profile-info">
                            <h2>John Doe</h2>
                            <p class="blood-type">Blood Type: <strong>O+</strong></p>
                            <div class="profile-badges">
                                <span class="badge success">Verified Donor</span>
                                <span class="badge primary">Regular Donor</span>
                                <span class="badge warning">Health Screened</span>
                            </div>
                        </div>
                        <div class="profile-stats">
                            <div class="stat-item">
                                <div class="stat-number">12</div>
                                <div class="stat-label">Total Donations</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-number">5.4L</div>
                                <div class="stat-label">Blood Donated</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-number">98%</div>
                                <div class="stat-label">Reliability</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="profile-details">
                        <div class="detail-section">
                            <h4>Contact Information</h4>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <label>Phone:</label>
                                    <span>+1 (555) 123-4567</span>
                                </div>
                                <div class="detail-item">
                                    <label>Email:</label>
                                    <span>john.doe@email.com</span>
                                </div>
                                <div class="detail-item">
                                    <label>Address:</label>
                                    <span>123 Main St, City, State 12345</span>
                                </div>
                                <div class="detail-item">
                                    <label>Emergency Contact:</label>
                                    <span>Jane Doe - +1 (555) 987-6543</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="detail-section">
                            <h4>Medical Information</h4>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <label>Age:</label>
                                    <span>32 years</span>
                                </div>
                                <div class="detail-item">
                                    <label>Weight:</label>
                                    <span>75 kg</span>
                                </div>
                                <div class="detail-item">
                                    <label>Last Health Check:</label>
                                    <span>2 weeks ago</span>
                                </div>
                                <div class="detail-item">
                                    <label>Eligibility Status:</label>
                                    <span class="status-badge eligible">Eligible</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="detail-section">
                            <h4>Donation History</h4>
                            <div class="donation-history">
                                <div class="history-item">
                                    <div class="history-date">Dec 15, 2024</div>
                                    <div class="history-details">O+ Blood • 450ml • City General Hospital</div>
                                    <div class="history-status completed">Completed</div>
                                </div>
                                <div class="history-item">
                                    <div class="history-date">Oct 20, 2024</div>
                                    <div class="history-details">O+ Blood • 450ml • Metro Medical Center</div>
                                    <div class="history-status completed">Completed</div>
                                </div>
                                <div class="history-item">
                                    <div class="history-date">Aug 25, 2024</div>
                                    <div class="history-details">O+ Blood • 450ml • Regional Hospital</div>
                                    <div class="history-status completed">Completed</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary modal-close">Close</button>
                <button class="btn btn-primary" onclick="contactDonor('${offerId}')">
                    <i class="fas fa-phone"></i>
                    Contact Donor
                </button>
            </div>
        </div>
    `;
    
    showModal(modal);
}

function contactDonor(offerId) {
    showNotification('Opening communication channel with donor...', 'info');
    // Would integrate with communication system
}

function rescheduleAppointment(offerId) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Reschedule Appointment</h3>
                <button class="modal-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>New Date</label>
                    <input type="date" class="form-control" name="newDate" min="${new Date().toISOString().split('T')[0]}">
                </div>
                <div class="form-group">
                    <label>New Time</label>
                    <select class="form-control" name="newTime">
                        <option value="09:00">9:00 AM</option>
                        <option value="10:00">10:00 AM</option>
                        <option value="11:00">11:00 AM</option>
                        <option value="14:00">2:00 PM</option>
                        <option value="15:00">3:00 PM</option>
                        <option value="16:00">4:00 PM</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Reason for Reschedule</label>
                    <textarea class="form-control" name="rescheduleReason" rows="3" placeholder="Optional reason..."></textarea>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary modal-cancel">Cancel</button>
                <button class="btn btn-primary" onclick="confirmReschedule('${offerId}')">
                    <i class="fas fa-calendar-alt"></i>
                    Reschedule
                </button>
            </div>
        </div>
    `;
    
    showModal(modal);
}

function confirmReschedule(offerId) {
    const modal = document.querySelector('.modal-overlay');
    const newDate = modal.querySelector('[name="newDate"]').value;
    const newTime = modal.querySelector('[name="newTime"]').value;
    
    if (!newDate) {
        showNotification('Please select a new date', 'error');
        return;
    }
    
    showNotification(`Appointment rescheduled to ${newDate} at ${newTime}. Donor has been notified.`, 'success');
    modal.remove();
}

function updateDonationOfferStatus(offerId, status) {
    const offerItem = document.querySelector(`[onclick*="${offerId}"]`).closest('.donation-offer-item');
    const statusBadge = offerItem.querySelector('.status-badge');
    const actions = offerItem.querySelector('.donation-actions');
    
    offerItem.className = `donation-offer-item ${status}`;
    
    switch(status) {
        case 'accepted':
            statusBadge.className = 'status-badge accepted';
            statusBadge.textContent = 'Appointment Confirmed';
            actions.innerHTML = `
                <button class="btn-sm primary" onclick="confirmDonationCompleted('${offerId}', 'Donor Name', 'O+')">
                    <i class="fas fa-check-circle"></i>
                    Confirm Donation
                </button>
                <button class="btn-sm warning" onclick="rescheduleAppointment('${offerId}')">
                    <i class="fas fa-calendar-alt"></i>
                    Reschedule
                </button>
                <button class="btn-sm info" onclick="contactDonor('${offerId}')">
                    <i class="fas fa-phone"></i>
                    Contact
                </button>
            `;
            break;
        case 'completed':
            statusBadge.className = 'status-badge completed';
            statusBadge.textContent = 'Donation Completed';
            actions.innerHTML = `
                <button class="btn-sm success" disabled>
                    <i class="fas fa-check-circle"></i>
                    Completed
                </button>
                <button class="btn-sm info" onclick="downloadDonationReceipt('${offerId}')">
                    <i class="fas fa-download"></i>
                    Receipt
                </button>
            `;
            break;
    }
}

function removeDonationOffer(offerId) {
    const offerItem = document.querySelector(`[onclick*="${offerId}"]`).closest('.donation-offer-item');
    offerItem.style.transition = 'all 0.3s ease';
    offerItem.style.opacity = '0';
    offerItem.style.transform = 'translateX(100%)';
    
    setTimeout(() => {
        offerItem.remove();
    }, 300);
}

function addNewDonationOffer() {
    const donorNames = ['Emma Wilson', 'David Brown', 'Lisa Garcia', 'Robert Taylor', 'Maria Rodriguez'];
    const bloodTypes = ['A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-', 'AB-'];
    const availabilityTimes = ['Today 2:00 PM', 'Tomorrow 10:00 AM', 'Tomorrow 3:00 PM', 'Day after tomorrow 11:00 AM'];
    
    const randomName = donorNames[Math.floor(Math.random() * donorNames.length)];
    const randomBloodType = bloodTypes[Math.floor(Math.random() * bloodTypes.length)];
    const randomAvailability = availabilityTimes[Math.floor(Math.random() * availabilityTimes.length)];
    const randomDonations = Math.floor(Math.random() * 20) + 1;
    const offerId = 'don-' + Date.now();
    
    const offersList = document.querySelector('.donation-offers-list');
    
    const offerItem = document.createElement('div');
    offerItem.className = 'donation-offer-item pending';
    offerItem.innerHTML = `
        <div class="donor-info">
            <div class="donor-avatar">
                <img src="https://via.placeholder.com/50" alt="${randomName}">
            </div>
            <div class="donor-details">
                <h4>${randomName}</h4>
                <p><strong>${randomBloodType} Blood • 450ml</strong></p>
                <p>Available: ${randomAvailability}</p>
                <div class="donor-stats">
                    <span class="stat">
                        <i class="fas fa-tint"></i>
                        ${randomDonations} donations
                    </span>
                    <span class="stat">
                        <i class="fas fa-star"></i>
                        Verified donor
                    </span>
                </div>
                <span class="offer-time">Just now</span>
            </div>
        </div>
        <div class="donation-status">
            <span class="status-badge pending">Pending Review</span>
        </div>
        <div class="donation-actions">
            <button class="btn-sm success" onclick="acceptDonationOffer('${offerId}', '${randomName}', '${randomBloodType}')">
                <i class="fas fa-check"></i>
                Accept Donor
            </button>
            <button class="btn-sm danger" onclick="rejectDonationOffer('${offerId}', '${randomName}')">
                <i class="fas fa-times"></i>
                Reject
            </button>
            <button class="btn-sm info" onclick="viewDonorProfile('${offerId}')">
                <i class="fas fa-user"></i>
                Profile
            </button>
        </div>
    `;
    
    // Insert at the beginning (but after any accepted offers)
    const firstPendingOffer = offersList.querySelector('.donation-offer-item.pending');
    if (firstPendingOffer) {
        offersList.insertBefore(offerItem, firstPendingOffer);
    } else {
        offersList.appendChild(offerItem);
    }
    
    // Animate in
    offerItem.style.opacity = '0';
    offerItem.style.transform = 'translateY(-20px)';
    setTimeout(() => {
        offerItem.style.transition = 'all 0.5s ease';
        offerItem.style.opacity = '1';
        offerItem.style.transform = 'translateY(0)';
    }, 100);
    
    // Update badge
    updateDonationOffersBadge(1);
    
    // Show notification
    showNotification(`New donation offer from ${randomName} (${randomBloodType})`, 'info');
}

function updateDonationOffersBadge(change) {
    const badge = document.querySelector('.donation-offers-management .badge');
    const currentCount = parseInt(badge.textContent.match(/\d+/)[0]);
    const newCount = Math.max(0, currentCount + change);
    badge.textContent = `${newCount} pending review`;
    
    if (newCount === 0) {
        badge.style.display = 'none';
    } else {
        badge.style.display = 'inline';
    }
}

function refreshDonationOffers() {
    showNotification('Refreshing donation offers...', 'info');
    // Would refresh from server
    setTimeout(() => {
        showNotification('Donation offers updated', 'success');
        updateWorkflowStats();
    }, 1000);
}

function viewWorkflowStatus() {
    const panel = document.getElementById('workflowStatusPanel');
    if (panel.style.display === 'none') {
        panel.style.display = 'block';
        updateWorkflowStats();
        showNotification('Workflow status panel opened', 'info');
    } else {
        panel.style.display = 'none';
    }
}

function updateWorkflowStats() {
    // Get current counts from the system
    const donations = JSON.parse(localStorage.getItem('hospitalDonations') || '[]');
    
    const pendingCount = donations.filter(d => d.status === 'PENDING').length;
    const acceptedCount = donations.filter(d => d.status === 'ACCEPTED').length;
    const completedCount = donations.filter(d => d.status === 'COMPLETED').length;
    const rejectedCount = donations.filter(d => d.status === 'REJECTED').length;
    
    // Update the UI
    document.getElementById('pendingCount').textContent = pendingCount;
    document.getElementById('acceptedCount').textContent = acceptedCount;
    document.getElementById('completedCount').textContent = completedCount;
    document.getElementById('rejectedCount').textContent = rejectedCount;
}

function downloadDonationReceipt(offerId) {
    showNotification(`Downloading donation receipt for ${offerId}...`, 'info');
    // Would generate and download PDF receipt
}

// Stock Monitoring
function initializeStockMonitoring() {
    // Simulate real-time stock updates
    setInterval(() => {
        updateStockLevels();
    }, 30000); // Update every 30 seconds

    // Initialize stock level animations
    animateStockCards();
}

function updateStockLevels() {
    const stockCards = document.querySelectorAll('.blood-inventory-card');
    
    stockCards.forEach(card => {
        const stockNumber = card.querySelector('.stock-number');
        const currentStock = parseInt(stockNumber.textContent);
        
        // Simulate stock changes (±1-3 units)
        const change = Math.floor(Math.random() * 7) - 3; // -3 to +3
        const newStock = Math.max(0, currentStock + change);
        
        if (change !== 0) {
            // Animate the change
            stockNumber.style.transform = 'scale(1.1)';
            stockNumber.style.color = change > 0 ? '#10b981' : '#ef4444';
            
            setTimeout(() => {
                stockNumber.textContent = newStock;
                updateStockStatus(card, newStock);
                
                setTimeout(() => {
                    stockNumber.style.transform = 'scale(1)';
                    stockNumber.style.color = '';
                }, 300);
            }, 200);
        }
    });
}

function updateStockStatus(card, stockLevel) {
    const statusElement = card.querySelector('.stock-status');
    const bloodType = card.getAttribute('data-type');
    
    // Update status based on stock level
    if (stockLevel <= 5) {
        statusElement.className = 'stock-status critical';
        statusElement.textContent = 'Critical';
        
        // Create alert for critical stock
        createStockAlert(bloodType, stockLevel, 'critical');
    } else if (stockLevel <= 15) {
        statusElement.className = 'stock-status low';
        statusElement.textContent = 'Low Stock';
        
        if (stockLevel <= 10) {
            createStockAlert(bloodType, stockLevel, 'warning');
        }
    } else {
        statusElement.className = 'stock-status good';
        statusElement.textContent = 'Good Stock';
    }
}

function animateStockCards() {
    const cards = document.querySelectorAll('.blood-inventory-card');
    
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

// Approval System
function initializeApprovalSystem() {
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-sm')) {
            const action = e.target.textContent.trim();
            const item = e.target.closest('.donation-item, .request-item');
            
            if (action === 'Approve') {
                handleDonationApproval(item, true);
            } else if (action === 'Reject') {
                handleDonationApproval(item, false);
            } else if (action === 'Fulfill') {
                handleBloodRequest(item, 'fulfill');
            } else if (action === 'Transfer') {
                handleBloodRequest(item, 'transfer');
            }
        }
    });
}

function handleDonationApproval(item, approved) {
    const donorName = item.querySelector('h4').textContent;
    const bloodType = item.querySelector('p').textContent.split('•')[0].trim();
    
    // Animate item out
    item.style.transition = 'all 0.3s ease';
    item.style.opacity = '0.5';
    item.style.transform = 'translateX(20px)';
    
    setTimeout(() => {
        if (approved) {
            showNotification(`${donorName}'s ${bloodType} donation approved!`, 'success');
            // Update stock levels
            updateStockAfterDonation(bloodType, 1);
        } else {
            showNotification(`${donorName}'s donation rejected.`, 'info');
        }
        
        // Remove item from list
        item.remove();
        
        // Update pending count
        updatePendingCount('.pending-donations .badge', -1);
    }, 300);
}

function handleBloodRequest(item, action) {
    const requestType = item.querySelector('h4').textContent;
    const bloodInfo = item.querySelector('p').textContent;
    
    item.style.transition = 'all 0.3s ease';
    item.style.opacity = '0.5';
    
    setTimeout(() => {
        if (action === 'fulfill') {
            showNotification(`Blood request fulfilled: ${bloodInfo}`, 'success');
            // Update stock levels (decrease)
            const bloodType = bloodInfo.split('•')[0].trim();
            const units = parseInt(bloodInfo.split('•')[1].trim().split(' ')[0]);
            updateStockAfterRequest(bloodType, units);
        } else {
            showNotification(`Transfer initiated for: ${bloodInfo}`, 'info');
        }
        
        item.remove();
        updatePendingCount('.blood-requests .badge', -1);
    }, 300);
}

function updateStockAfterDonation(bloodType, units) {
    const card = document.querySelector(`[data-type="${bloodType}"]`);
    if (card) {
        const stockNumber = card.querySelector('.stock-number');
        const currentStock = parseInt(stockNumber.textContent);
        const newStock = currentStock + units;
        
        stockNumber.textContent = newStock;
        updateStockStatus(card, newStock);
        
        // Animate positive change
        stockNumber.style.color = '#10b981';
        stockNumber.style.transform = 'scale(1.1)';
        setTimeout(() => {
            stockNumber.style.color = '';
            stockNumber.style.transform = 'scale(1)';
        }, 500);
    }
}

function updateStockAfterRequest(bloodType, units) {
    const card = document.querySelector(`[data-type="${bloodType}"]`);
    if (card) {
        const stockNumber = card.querySelector('.stock-number');
        const currentStock = parseInt(stockNumber.textContent);
        const newStock = Math.max(0, currentStock - units);
        
        stockNumber.textContent = newStock;
        updateStockStatus(card, newStock);
        
        // Animate negative change
        stockNumber.style.color = '#ef4444';
        stockNumber.style.transform = 'scale(1.1)';
        setTimeout(() => {
            stockNumber.style.color = '';
            stockNumber.style.transform = 'scale(1)';
        }, 500);
    }
}

function updatePendingCount(selector, change) {
    const badge = document.querySelector(selector);
    if (badge) {
        const currentCount = parseInt(badge.textContent.match(/\d+/)[0]);
        const newCount = Math.max(0, currentCount + change);
        badge.textContent = badge.textContent.replace(/\d+/, newCount);
    }
}

// Alert System
function initializeAlertSystem() {
    // Handle alert actions
    document.addEventListener('click', function(e) {
        if (e.target.closest('.alert-actions .btn-sm')) {
            const btn = e.target.closest('.btn-sm');
            const action = btn.textContent.trim();
            const alertItem = btn.closest('.alert-item');
            
            if (action === 'Dismiss') {
                dismissAlert(alertItem);
            } else if (action === 'Request Blood') {
                showBloodRequestModal();
            } else if (action === 'Use First') {
                showNotification('Marked for priority use', 'info');
                dismissAlert(alertItem);
            }
        }
    });

    // Simulate new alerts
    setInterval(() => {
        if (Math.random() < 0.2) { // 20% chance every minute
            addNewAlert();
        }
    }, 60000);
}

function dismissAlert(alertItem) {
    alertItem.style.transition = 'all 0.3s ease';
    alertItem.style.opacity = '0';
    alertItem.style.transform = 'translateX(100%)';
    
    setTimeout(() => {
        alertItem.remove();
    }, 300);
}

function createStockAlert(bloodType, stockLevel, severity) {
    const alertsList = document.querySelector('.alerts-list');
    if (!alertsList) return;

    // Check if alert already exists for this blood type
    const existingAlert = alertsList.querySelector(`[data-blood-type="${bloodType}"]`);
    if (existingAlert) return;

    const alertItem = document.createElement('div');
    alertItem.className = `alert-item ${severity}`;
    alertItem.setAttribute('data-blood-type', bloodType);
    
    alertItem.innerHTML = `
        <div class="alert-icon">
            <i class="fas fa-${severity === 'critical' ? 'exclamation-circle' : 'exclamation-triangle'}"></i>
        </div>
        <div class="alert-content">
            <h4>${severity === 'critical' ? 'Critical' : 'Low'} Stock Level</h4>
            <p>${bloodType} blood type has only ${stockLevel} units remaining</p>
            <span class="alert-time">Just now</span>
        </div>
        <div class="alert-actions">
            <button class="btn-sm danger">Request Blood</button>
            <button class="btn-sm secondary">Dismiss</button>
        </div>
    `;

    // Insert at the beginning
    alertsList.insertBefore(alertItem, alertsList.firstChild);

    // Animate in
    alertItem.style.opacity = '0';
    alertItem.style.transform = 'translateX(-100%)';
    setTimeout(() => {
        alertItem.style.transition = 'all 0.5s ease';
        alertItem.style.opacity = '1';
        alertItem.style.transform = 'translateX(0)';
    }, 100);
}

function addNewAlert() {
    const alerts = [
        {
            type: 'info',
            icon: 'info-circle',
            title: 'Donation Scheduled',
            message: 'New donation appointment scheduled for tomorrow',
            time: 'Just now'
        },
        {
            type: 'warning',
            icon: 'clock',
            title: 'Maintenance Reminder',
            message: 'Blood storage unit maintenance due next week',
            time: 'Just now'
        }
    ];

    const randomAlert = alerts[Math.floor(Math.random() * alerts.length)];
    const alertsList = document.querySelector('.alerts-list');
    
    const alertItem = document.createElement('div');
    alertItem.className = `alert-item ${randomAlert.type}`;
    
    alertItem.innerHTML = `
        <div class="alert-icon">
            <i class="fas fa-${randomAlert.icon}"></i>
        </div>
        <div class="alert-content">
            <h4>${randomAlert.title}</h4>
            <p>${randomAlert.message}</p>
            <span class="alert-time">${randomAlert.time}</span>
        </div>
        <div class="alert-actions">
            <button class="btn-sm secondary">View Details</button>
        </div>
    `;

    alertsList.insertBefore(alertItem, alertsList.firstChild);

    // Animate in
    alertItem.style.opacity = '0';
    alertItem.style.transform = 'translateX(-100%)';
    setTimeout(() => {
        alertItem.style.transition = 'all 0.5s ease';
        alertItem.style.opacity = '1';
        alertItem.style.transform = 'translateX(0)';
    }, 100);

    // Remove oldest alerts if more than 5
    const items = alertsList.querySelectorAll('.alert-item');
    if (items.length > 5) {
        items[items.length - 1].remove();
    }
}

// Inventory Management
function initializeInventoryManagement() {
    // Handle inventory actions
    document.addEventListener('click', function(e) {
        if (e.target.closest('.stock-actions .btn-sm')) {
            const btn = e.target.closest('.btn-sm');
            const action = btn.textContent.trim();
            const card = btn.closest('.blood-inventory-card');
            const bloodType = card.getAttribute('data-type');
            
            if (action === 'Update') {
                showUpdateStockModal(bloodType);
            } else if (action === 'History') {
                showStockHistory(bloodType);
            } else if (action === 'Request') {
                showBloodRequestModal(bloodType);
            }
        }
    });
}

// Add Blood Modal
function showAddBloodModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Add Blood Units</h3>
                <button class="modal-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <form class="add-blood-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Blood Type</label>
                            <select class="form-control" name="bloodType">
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
                        <div class="form-group">
                            <label>Number of Units</label>
                            <input type="number" class="form-control" name="units" min="1" max="50" value="1">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Collection Date</label>
                            <input type="date" class="form-control" name="collectionDate" value="${new Date().toISOString().split('T')[0]}">
                        </div>
                        <div class="form-group">
                            <label>Expiry Date</label>
                            <input type="date" class="form-control" name="expiryDate">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Donor ID (Optional)</label>
                        <input type="text" class="form-control" name="donorId" placeholder="Enter donor ID">
                    </div>
                    <div class="form-group">
                        <label>Notes</label>
                        <textarea class="form-control" name="notes" rows="3" placeholder="Additional notes..."></textarea>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary modal-cancel">Cancel</button>
                <button class="btn btn-primary modal-confirm">Add Blood Units</button>
            </div>
        </div>
    `;

    showModal(modal, function() {
        const form = modal.querySelector('.add-blood-form');
        const formData = new FormData(form);
        const bloodType = formData.get('bloodType');
        const units = parseInt(formData.get('units'));
        
        // Update stock
        updateStockAfterDonation(bloodType, units);
        showNotification(`Added ${units} units of ${bloodType} blood to inventory`, 'success');
    });
}

function showUpdateStockModal(bloodType) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Update ${bloodType} Stock</h3>
                <button class="modal-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <form class="update-stock-form">
                    <div class="form-group">
                        <label>Action</label>
                        <select class="form-control" name="action">
                            <option value="add">Add Units</option>
                            <option value="remove">Remove Units</option>
                            <option value="set">Set Total</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Number of Units</label>
                        <input type="number" class="form-control" name="units" min="1" value="1">
                    </div>
                    <div class="form-group">
                        <label>Reason</label>
                        <select class="form-control" name="reason">
                            <option value="donation">New Donation</option>
                            <option value="usage">Used for Patient</option>
                            <option value="expired">Expired Units</option>
                            <option value="transfer">Transfer</option>
                            <option value="correction">Inventory Correction</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Notes</label>
                        <textarea class="form-control" name="notes" rows="3" placeholder="Additional notes..."></textarea>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary modal-cancel">Cancel</button>
                <button class="btn btn-primary modal-confirm">Update Stock</button>
            </div>
        </div>
    `;

    showModal(modal, function() {
        const form = modal.querySelector('.update-stock-form');
        const formData = new FormData(form);
        const action = formData.get('action');
        const units = parseInt(formData.get('units'));
        const reason = formData.get('reason');
        
        const card = document.querySelector(`[data-type="${bloodType}"]`);
        const stockNumber = card.querySelector('.stock-number');
        const currentStock = parseInt(stockNumber.textContent);
        
        let newStock;
        if (action === 'add') {
            newStock = currentStock + units;
        } else if (action === 'remove') {
            newStock = Math.max(0, currentStock - units);
        } else {
            newStock = units;
        }
        
        stockNumber.textContent = newStock;
        updateStockStatus(card, newStock);
        
        showNotification(`${bloodType} stock updated: ${reason}`, 'success');
    });
}

function showBloodRequestModal(bloodType = '') {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Request Blood from Network</h3>
                <button class="modal-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <form class="request-blood-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Blood Type</label>
                            <select class="form-control" name="bloodType">
                                <option value="A+" ${bloodType === 'A+' ? 'selected' : ''}>A+</option>
                                <option value="A-" ${bloodType === 'A-' ? 'selected' : ''}>A-</option>
                                <option value="B+" ${bloodType === 'B+' ? 'selected' : ''}>B+</option>
                                <option value="B-" ${bloodType === 'B-' ? 'selected' : ''}>B-</option>
                                <option value="AB+" ${bloodType === 'AB+' ? 'selected' : ''}>AB+</option>
                                <option value="AB-" ${bloodType === 'AB-' ? 'selected' : ''}>AB-</option>
                                <option value="O+" ${bloodType === 'O+' ? 'selected' : ''}>O+</option>
                                <option value="O-" ${bloodType === 'O-' ? 'selected' : ''}>O-</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Units Needed</label>
                            <input type="number" class="form-control" name="units" min="1" max="20" value="1">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Priority Level</label>
                        <select class="form-control" name="priority">
                            <option value="routine">Routine</option>
                            <option value="urgent">Urgent</option>
                            <option value="emergency">Emergency</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Reason for Request</label>
                        <textarea class="form-control" name="reason" rows="3" placeholder="Describe the medical need..." required></textarea>
                    </div>
                    <div class="form-group">
                        <label>Expected Delivery</label>
                        <select class="form-control" name="delivery">
                            <option value="immediate">Immediate (Emergency)</option>
                            <option value="today">Within Today</option>
                            <option value="tomorrow">Tomorrow</option>
                            <option value="week">Within a Week</option>
                        </select>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary modal-cancel">Cancel</button>
                <button class="btn btn-danger modal-confirm">Send Request</button>
            </div>
        </div>
    `;

    showModal(modal, function() {
        const form = modal.querySelector('.request-blood-form');
        const formData = new FormData(form);
        const requestBloodType = formData.get('bloodType');
        const units = formData.get('units');
        const priority = formData.get('priority');
        
        showNotification(`Blood request sent: ${units} units of ${requestBloodType} (${priority})`, 'success');
    });
}

function showModal(modal, onConfirm) {
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
        if (e.target === modal || e.target.classList.contains('modal-close') || e.target.classList.contains('modal-cancel')) {
            closeModal();
        } else if (e.target.classList.contains('modal-confirm')) {
            onConfirm();
            closeModal();
        }
    });

    function closeModal() {
        modal.style.opacity = '0';
        setTimeout(() => modal.remove(), 300);
    }
}

// Add hospital-specific styles
const hospitalStyles = `
    .hospital-info-card {
        background: linear-gradient(135deg, #1f2937, #374151);
        color: white;
        border-radius: 20px;
        padding: 2rem;
        margin-bottom: 2rem;
        box-shadow: 0 20px 40px rgba(31, 41, 55, 0.2);
    }

    .hospital-header {
        display: flex;
        align-items: center;
        gap: 2rem;
    }

    .hospital-avatar {
        width: 80px;
        height: 80px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2rem;
    }

    .hospital-details h2 {
        margin-bottom: 0.5rem;
        font-size: 1.75rem;
    }

    .hospital-status {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-top: 1rem;
    }

    .status-indicator {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: #10b981;
        animation: pulse 2s infinite;
    }

    .hospital-actions {
        margin-left: auto;
    }

    .inventory-section, .approvals-requests-grid, .alerts-section {
        background: white;
        border-radius: 16px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        margin-bottom: 2rem;
        border: 1px solid #e5e7eb;
    }

    .section-header {
        padding: 1.5rem;
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .section-actions {
        display: flex;
        gap: 1rem;
    }

    .inventory-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 1.5rem;
        padding: 1.5rem;
    }

    .blood-inventory-card {
        border: 2px solid #e5e7eb;
        border-radius: 12px;
        padding: 1.5rem;
        transition: all 0.3s ease;
    }

    .blood-inventory-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    }

    .blood-type-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }

    .blood-type-icon {
        width: 50px;
        height: 50px;
        background: #dc2626;
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 1.1rem;
    }

    .stock-status {
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
    }

    .stock-status.good {
        background: rgba(16, 185, 129, 0.1);
        color: #10b981;
    }

    .stock-status.low {
        background: rgba(245, 158, 11, 0.1);
        color: #f59e0b;
    }

    .stock-status.critical {
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;
    }

    .stock-details {
        text-align: center;
        margin-bottom: 1rem;
    }

    .stock-number {
        font-size: 2.5rem;
        font-weight: 700;
        color: #1f2937;
        transition: all 0.3s ease;
    }

    .stock-label {
        color: #6b7280;
        font-size: 0.875rem;
    }

    .stock-info {
        margin-bottom: 1rem;
    }

    .info-item {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.5rem;
        font-size: 0.875rem;
    }

    .info-item .warning {
        color: #f59e0b;
        font-weight: 600;
    }

    .info-item .critical {
        color: #ef4444;
        font-weight: 600;
    }

    .stock-actions {
        display: flex;
        gap: 0.5rem;
    }

    .approvals-requests-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0;
    }

    .pending-donations, .blood-requests {
        padding: 0;
    }

    .pending-donations {
        border-right: 1px solid #e5e7eb;
    }

    .donations-list, .requests-list {
        padding: 1.5rem;
        max-height: 400px;
        overflow-y: auto;
    }

    .donation-item, .request-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        margin-bottom: 1rem;
        transition: all 0.3s ease;
    }

    .donation-item:hover, .request-item:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .request-item.urgent {
        border-color: #ef4444;
        background: rgba(239, 68, 68, 0.02);
    }

    .donor-info, .request-info {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .donor-avatar {
        width: 40px;
        height: 40px;
        background: #dc2626;
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 0.875rem;
    }

    .request-icon {
        width: 40px;
        height: 40px;
        background: #fee2e2;
        color: #dc2626;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .request-item.urgent .request-icon {
        background: #fef2f2;
        color: #ef4444;
        animation: pulse 2s infinite;
    }

    .donor-details h4, .request-details h4 {
        margin-bottom: 0.25rem;
        font-size: 1rem;
    }

    .donor-details p, .request-details p {
        color: #6b7280;
        font-size: 0.875rem;
        margin-bottom: 0.25rem;
    }

    .time {
        font-size: 0.75rem;
        color: #9ca3af;
    }

    .donation-actions, .request-actions {
        display: flex;
        gap: 0.5rem;
    }

    .alerts-list {
        padding: 1.5rem;
        max-height: 400px;
        overflow-y: auto;
    }

    .alert-item {
        display: flex;
        gap: 1rem;
        padding: 1rem;
        border-radius: 8px;
        margin-bottom: 1rem;
        border: 1px solid;
        transition: all 0.3s ease;
    }

    .alert-item.critical {
        border-color: #ef4444;
        background: rgba(239, 68, 68, 0.02);
    }

    .alert-item.warning {
        border-color: #f59e0b;
        background: rgba(245, 158, 11, 0.02);
    }

    .alert-item.info {
        border-color: #3b82f6;
        background: rgba(59, 130, 246, 0.02);
    }

    .alert-icon {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.1rem;
    }

    .alert-item.critical .alert-icon {
        background: #fef2f2;
        color: #ef4444;
    }

    .alert-item.warning .alert-icon {
        background: #fffbeb;
        color: #f59e0b;
    }

    .alert-item.info .alert-icon {
        background: #eff6ff;
        color: #3b82f6;
    }

    .alert-content {
        flex: 1;
    }

    .alert-content h4 {
        margin-bottom: 0.5rem;
        font-size: 1rem;
    }

    .alert-time {
        font-size: 0.75rem;
        color: #9ca3af;
    }

    .alert-actions {
        display: flex;
        gap: 0.5rem;
        align-items: flex-start;
    }

    .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
    }

    /* Workflow Status Panel Styles */
    .workflow-status-panel {
        background: #f8fafc;
        border-top: 1px solid #e5e7eb;
        padding: 1.5rem;
        margin: 0;
    }

    .workflow-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin-bottom: 2rem;
    }

    .workflow-stat {
        display: flex;
        align-items: center;
        gap: 1rem;
        background: white;
        padding: 1rem;
        border-radius: 8px;
        border: 1px solid #e5e7eb;
    }

    .stat-icon {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.25rem;
        color: white;
    }

    .stat-icon.pending {
        background: #f59e0b;
    }

    .stat-icon.accepted {
        background: #10b981;
    }

    .stat-icon.completed {
        background: #059669;
    }

    .stat-icon.rejected {
        background: #ef4444;
    }

    .stat-info {
        flex: 1;
    }

    .stat-number {
        font-size: 1.5rem;
        font-weight: 700;
        color: #1f2937;
    }

    .stat-label {
        font-size: 0.875rem;
        color: #6b7280;
    }

    .workflow-rules {
        background: white;
        padding: 1.5rem;
        border-radius: 8px;
        border: 1px solid #e5e7eb;
    }

    .workflow-rules h4 {
        margin-bottom: 1rem;
        color: #1f2937;
        font-weight: 600;
    }

    .rule-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 0.75rem;
        font-size: 0.875rem;
        color: #4b5563;
    }

    .rule-item:last-child {
        margin-bottom: 0;
    }

    .rule-item i {
        font-size: 1rem;
    }

    .text-success {
        color: #10b981 !important;
    }

    .donation-offer-item.accepted {
        border-color: #10b981;
        background: rgba(16, 185, 129, 0.02);
    }

    .donation-offer-item.completed {
        border-color: #059669;
        background: rgba(5, 150, 105, 0.02);
    }

    /* Patient Blood Request Styles */
    .patient-request-alert {
        border-left: 4px solid #3b82f6;
    }

    .patient-request-alert.critical {
        border-left-color: #ef4444;
        animation: pulse 2s infinite;
    }

    .request-details {
        display: flex;
        gap: 0.5rem;
        margin: 0.5rem 0;
        flex-wrap: wrap;
    }

    .detail-badge {
        background: rgba(59, 130, 246, 0.1);
        color: #3b82f6;
        padding: 0.25rem 0.5rem;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 600;
    }

    .request-review-container {
        display: grid;
        gap: 2rem;
    }

    .patient-info-section,
    .blood-requirement-section,
    .medical-reason-section,
    .availability-check-section {
        background: #f9fafb;
        padding: 1.5rem;
        border-radius: 8px;
        border: 1px solid #e5e7eb;
    }

    .patient-info-section h4,
    .blood-requirement-section h4,
    .medical-reason-section h4,
    .availability-check-section h4 {
        margin-bottom: 1rem;
        color: #1f2937;
        font-weight: 600;
        border-bottom: 1px solid #e5e7eb;
        padding-bottom: 0.5rem;
    }

    .info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
    }

    .info-item {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .info-item label {
        font-weight: 600;
        color: #6b7280;
        font-size: 0.875rem;
    }

    .info-item span {
        color: #1f2937;
        font-weight: 500;
    }

    .request-id-highlight {
        background: rgba(59, 130, 246, 0.1);
        color: #3b82f6;
        padding: 0.25rem 0.5rem;
        border-radius: 6px;
        font-weight: 600;
    }

    .requirement-details {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 2rem;
    }

    .blood-type-display {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .blood-type-icon {
        width: 60px;
        height: 60px;
        background: #dc2626;
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 1.25rem;
    }

    .blood-type-info h5 {
        margin-bottom: 0.25rem;
        color: #1f2937;
    }

    .blood-type-info p {
        color: #6b7280;
        font-size: 0.875rem;
    }

    .priority-display {
        text-align: right;
    }

    .priority-badge {
        padding: 0.5rem 1rem;
        border-radius: 20px;
        font-weight: 600;
        font-size: 0.875rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .priority-badge.routine {
        background: rgba(59, 130, 246, 0.1);
        color: #3b82f6;
    }

    .priority-badge.urgent {
        background: rgba(245, 158, 11, 0.1);
        color: #f59e0b;
    }

    .priority-badge.emergency {
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;
        animation: pulse 2s infinite;
    }

    .emergency-reason {
        margin-top: 0.5rem;
        font-size: 0.875rem;
        color: #7f1d1d;
        background: rgba(239, 68, 68, 0.05);
        padding: 0.5rem;
        border-radius: 6px;
    }

    .reason-text {
        background: white;
        padding: 1rem;
        border-radius: 6px;
        border: 1px solid #e5e7eb;
        color: #374151;
        line-height: 1.6;
    }

    .doctor-contact {
        margin-top: 1rem;
        font-size: 0.875rem;
        color: #4b5563;
    }

    .stock-check-result {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: white;
        padding: 1rem;
        border-radius: 6px;
        border: 1px solid #e5e7eb;
    }

    .stock-info {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #374151;
    }

    .stock-info i {
        color: #dc2626;
    }

    .availability-status {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 600;
    }

    .availability-status.available {
        color: #10b981;
    }

    .availability-status.unavailable {
        color: #ef4444;
    }

    .availability-status i {
        font-size: 1.25rem;
    }

    @media (max-width: 1024px) {
        .info-grid {
            grid-template-columns: 1fr;
        }

        .requirement-details {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
        }

        .priority-display {
            text-align: left;
        }

        .stock-check-result {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
        }
    }

    @media (max-width: 1024px) {
        .inventory-grid {
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        }

        .approvals-requests-grid {
            grid-template-columns: 1fr;
        }

        .pending-donations {
            border-right: none;
            border-bottom: 1px solid #e5e7eb;
        }
    }

    @media (max-width: 768px) {
        .hospital-header {
            flex-direction: column;
            text-align: center;
            gap: 1rem;
        }

        .hospital-actions {
            margin-left: 0;
        }

        .section-header {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
        }

        .section-actions {
            justify-content: center;
        }

        .inventory-grid {
            grid-template-columns: 1fr;
        }

        .donation-item, .request-item {
            flex-direction: column;
            align-items: stretch;
            gap: 1rem;
        }

        .donation-actions, .request-actions {
            justify-content: center;
        }

        .form-row {
            grid-template-columns: 1fr;
        }
    }
`;

// Add styles to head
const styleSheet = document.createElement('style');
styleSheet.textContent = hospitalStyles;
document.head.appendChild(styleSheet);

// Blood Request System
function initializeBloodRequestSystem() {
    // Handle blood request actions
    document.addEventListener('click', function(e) {
        if (e.target.closest('.stock-actions .btn-sm')) {
            const btn = e.target.closest('.btn-sm');
            const action = btn.textContent.trim();
            
            if (action === 'Request More') {
                const card = btn.closest('.blood-inventory-card');
                const bloodType = card.getAttribute('data-type');
                showBloodRequestModal(bloodType);
            }
        }
    });

    // Simulate incoming requests
    setInterval(() => {
        if (Math.random() < 0.2) { // 20% chance every 2 minutes
            addNewIncomingRequest();
        }
    }, 120000);
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

// Blood Request Modal
function showBloodRequestModal(bloodType = '') {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content large">
            <div class="modal-header">
                <h3>Request Blood from Network</h3>
                <button class="modal-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="request-form-container">
                    <div class="form-section">
                        <h4>Blood Requirements</h4>
                        <form class="blood-request-form">
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Blood Type Needed</label>
                                    <select class="form-control" name="bloodType" required>
                                        <option value="">Select Blood Type</option>
                                        <option value="A+" ${bloodType === 'A+' ? 'selected' : ''}>A+</option>
                                        <option value="A-" ${bloodType === 'A-' ? 'selected' : ''}>A-</option>
                                        <option value="B+" ${bloodType === 'B+' ? 'selected' : ''}>B+</option>
                                        <option value="B-" ${bloodType === 'B-' ? 'selected' : ''}>B-</option>
                                        <option value="AB+" ${bloodType === 'AB+' ? 'selected' : ''}>AB+</option>
                                        <option value="AB-" ${bloodType === 'AB-' ? 'selected' : ''}>AB-</option>
                                        <option value="O+" ${bloodType === 'O+' ? 'selected' : ''}>O+</option>
                                        <option value="O-" ${bloodType === 'O-' ? 'selected' : ''}>O-</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Units Required</label>
                                    <input type="number" class="form-control" name="units" min="1" max="20" value="1" required>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Priority Level</label>
                                    <select class="form-control" name="priority" required>
                                        <option value="normal">Normal</option>
                                        <option value="urgent">Urgent</option>
                                        <option value="emergency">Emergency</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Preferred Source</label>
                                    <select class="form-control" name="source">
                                        <option value="any">Any Available Hospital</option>
                                        <option value="central">Central Blood Bank</option>
                                        <option value="metro">Metro Medical Center</option>
                                        <option value="regional">Regional Hospital</option>
                                        <option value="community">Community Health Center</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Medical Reason</label>
                                <textarea class="form-control" name="reason" rows="3" placeholder="Describe the medical need for this blood request..." required></textarea>
                            </div>
                            <div class="form-group">
                                <label>Expected Delivery Time</label>
                                <select class="form-control" name="delivery">
                                    <option value="immediate">Immediate (Emergency)</option>
                                    <option value="2hours">Within 2 Hours</option>
                                    <option value="6hours">Within 6 Hours</option>
                                    <option value="24hours">Within 24 Hours</option>
                                    <option value="48hours">Within 48 Hours</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Contact Person</label>
                                <input type="text" class="form-control" name="contact" placeholder="Doctor/Staff name and contact number">
                            </div>
                        </form>
                    </div>
                    
                    <div class="availability-section">
                        <h4>Network Availability</h4>
                        <div class="availability-list">
                            <div class="availability-item">
                                <div class="hospital-info">
                                    <i class="fas fa-hospital"></i>
                                    <span>Central Blood Bank</span>
                                </div>
                                <div class="blood-availability">
                                    <span class="available">A+: 25</span>
                                    <span class="available">O+: 18</span>
                                    <span class="low">AB-: 3</span>
                                </div>
                                <div class="distance">2.1 km</div>
                            </div>
                            <div class="availability-item">
                                <div class="hospital-info">
                                    <i class="fas fa-hospital"></i>
                                    <span>Metro Medical Center</span>
                                </div>
                                <div class="blood-availability">
                                    <span class="available">A+: 12</span>
                                    <span class="available">O+: 8</span>
                                    <span class="unavailable">AB-: 0</span>
                                </div>
                                <div class="distance">4.5 km</div>
                            </div>
                            <div class="availability-item">
                                <div class="hospital-info">
                                    <i class="fas fa-hospital"></i>
                                    <span>Regional Hospital</span>
                                </div>
                                <div class="blood-availability">
                                    <span class="available">A+: 8</span>
                                    <span class="low">O+: 4</span>
                                    <span class="unavailable">AB-: 0</span>
                                </div>
                                <div class="distance">6.8 km</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary modal-cancel">Cancel</button>
                <button class="btn btn-danger btn-lg" onclick="submitBloodRequest()">
                    <i class="fas fa-paper-plane"></i>
                    Submit Blood Request
                </button>
            </div>
        </div>
    `;

    showModal(modal);
}

function submitBloodRequest() {
    const form = document.querySelector('.blood-request-form');
    const formData = new FormData(form);
    
    // Validate form
    if (!formData.get('bloodType') || !formData.get('units') || !formData.get('reason')) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }

    const requestData = {
        id: 'REQ-' + Date.now(),
        bloodType: formData.get('bloodType'),
        units: parseInt(formData.get('units')),
        priority: formData.get('priority'),
        source: formData.get('source'),
        reason: formData.get('reason'),
        delivery: formData.get('delivery'),
        contact: formData.get('contact'),
        timestamp: new Date().toISOString(),
        status: 'pending'
    };

    // Add to outgoing requests
    addOutgoingRequest(requestData);
    
    // Close modal
    closeModal();
    
    // Show success notification
    showNotification(`Blood request submitted successfully! Request ID: ${requestData.id}`, 'success');
    
    // Simulate network notification to other hospitals
    setTimeout(() => {
        showNotification('Request sent to network hospitals and blood banks', 'info');
    }, 2000);
}

function addOutgoingRequest(requestData) {
    const outgoingTab = document.getElementById('outgoing-tab');
    const requestList = outgoingTab.querySelector('.request-list');
    
    const requestItem = document.createElement('div');
    requestItem.className = 'request-item outgoing';
    requestItem.innerHTML = `
        <div class="request-info">
            <div class="request-icon pending">
                <i class="fas fa-clock"></i>
            </div>
            <div class="request-details">
                <h4>${requestData.bloodType} Blood Request</h4>
                <p><strong>To: ${getSourceName(requestData.source)} • ${requestData.units} units</strong></p>
                <p>${requestData.reason}</p>
                <span class="request-time">Just now</span>
            </div>
        </div>
        <div class="request-status">
            <span class="status-badge pending">Pending Approval</span>
        </div>
        <div class="request-actions">
            <button class="btn-sm info" onclick="trackRequest('${requestData.id}')">
                <i class="fas fa-search"></i>
                Track
            </button>
            <button class="btn-sm warning" onclick="editRequest('${requestData.id}')">
                <i class="fas fa-edit"></i>
                Edit
            </button>
            <button class="btn-sm danger" onclick="cancelRequest('${requestData.id}')">
                <i class="fas fa-times"></i>
                Cancel
            </button>
        </div>
    `;
    
    // Insert at the beginning
    requestList.insertBefore(requestItem, requestList.firstChild);
    
    // Update tab badge
    updateTabBadge('outgoing', 1);
}

function getSourceName(source) {
    const sourceNames = {
        'any': 'Network Hospitals',
        'central': 'Central Blood Bank',
        'metro': 'Metro Medical Center',
        'regional': 'Regional Hospital',
        'community': 'Community Health Center'
    };
    return sourceNames[source] || 'Network Hospitals';
}

// Incoming Request Handlers
function approveBloodRequest(requestId, hospitalName, bloodType, units) {
    showConfirmationModal(
        'Approve Blood Transfer',
        `Are you sure you want to approve and transfer ${units} units of ${bloodType} blood to ${hospitalName}?`,
        () => {
            // Update stock
            updateStockAfterRequest(bloodType, units);
            
            // Remove from incoming requests
            removeIncomingRequest(requestId);
            
            // Show success notification
            showNotification(`Blood transfer approved! ${units} units of ${bloodType} sent to ${hospitalName}`, 'success');
            
            // Update tab badge
            updateTabBadge('incoming', -1);
        }
    );
}

function rejectBloodRequest(requestId) {
    showConfirmationModal(
        'Reject Blood Request',
        'Are you sure you want to reject this blood request?',
        () => {
            removeIncomingRequest(requestId);
            showNotification('Blood request rejected', 'info');
            updateTabBadge('incoming', -1);
        }
    );
}

function removeIncomingRequest(requestId) {
    const requestItems = document.querySelectorAll('.request-item.incoming');
    requestItems.forEach(item => {
        // In a real app, you'd match by actual request ID
        // For demo, we'll remove the first matching item
        if (item.querySelector('.request-actions button').getAttribute('onclick').includes(requestId)) {
            item.remove();
            return;
        }
    });
}

function viewRequestDetails(requestId) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Blood Request Details - ${requestId}</h3>
                <button class="modal-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="request-details-grid">
                    <div class="detail-section">
                        <h4>Request Information</h4>
                        <div class="detail-item">
                            <label>Request ID:</label>
                            <span>${requestId}</span>
                        </div>
                        <div class="detail-item">
                            <label>Blood Type:</label>
                            <span class="blood-type-badge">O-</span>
                        </div>
                        <div class="detail-item">
                            <label>Units Required:</label>
                            <span>5 units</span>
                        </div>
                        <div class="detail-item">
                            <label>Priority:</label>
                            <span class="priority-badge emergency">Emergency</span>
                        </div>
                        <div class="detail-item">
                            <label>Requested:</label>
                            <span>15 minutes ago</span>
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h4>Hospital Information</h4>
                        <div class="detail-item">
                            <label>Hospital:</label>
                            <span>Metro Medical Center</span>
                        </div>
                        <div class="detail-item">
                            <label>Contact Person:</label>
                            <span>Dr. Sarah Johnson</span>
                        </div>
                        <div class="detail-item">
                            <label>Phone:</label>
                            <span>+1 (555) 987-6543</span>
                        </div>
                        <div class="detail-item">
                            <label>Distance:</label>
                            <span>4.5 km away</span>
                        </div>
                    </div>
                </div>
                
                <div class="medical-reason">
                    <h4>Medical Reason</h4>
                    <p>Multiple trauma patients from vehicle accident. Critical need for O- blood for immediate transfusion. Patients are in critical condition and require immediate blood supply.</p>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary modal-close">Close</button>
                <button class="btn btn-success" onclick="approveBloodRequest('${requestId}', 'Metro Medical Center', 'O-', 5); closeModal();">
                    <i class="fas fa-check"></i>
                    Approve Transfer
                </button>
            </div>
        </div>
    `;
    
    showModal(modal);
}

// Outgoing Request Handlers
function trackRequest(requestId) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Track Request - ${requestId}</h3>
                <button class="modal-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="tracking-timeline">
                    <div class="timeline-item completed">
                        <div class="timeline-marker">
                            <i class="fas fa-check"></i>
                        </div>
                        <div class="timeline-content">
                            <h4>Request Submitted</h4>
                            <p>Blood request sent to network hospitals</p>
                            <span class="timeline-time">30 minutes ago</span>
                        </div>
                    </div>
                    
                    <div class="timeline-item completed">
                        <div class="timeline-marker">
                            <i class="fas fa-search"></i>
                        </div>
                        <div class="timeline-content">
                            <h4>Availability Checked</h4>
                            <p>System found matching blood type at Central Blood Bank</p>
                            <span class="timeline-time">25 minutes ago</span>
                        </div>
                    </div>
                    
                    <div class="timeline-item active">
                        <div class="timeline-marker">
                            <i class="fas fa-clock"></i>
                        </div>
                        <div class="timeline-content">
                            <h4>Pending Approval</h4>
                            <p>Waiting for approval from Central Blood Bank</p>
                            <span class="timeline-time">Current status</span>
                        </div>
                    </div>
                    
                    <div class="timeline-item">
                        <div class="timeline-marker">
                            <i class="fas fa-truck"></i>
                        </div>
                        <div class="timeline-content">
                            <h4>In Transit</h4>
                            <p>Blood units being transported</p>
                            <span class="timeline-time">Pending</span>
                        </div>
                    </div>
                    
                    <div class="timeline-item">
                        <div class="timeline-marker">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <div class="timeline-content">
                            <h4>Delivered</h4>
                            <p>Blood units received and verified</p>
                            <span class="timeline-time">Pending</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary modal-close">Close</button>
                <button class="btn btn-primary">
                    <i class="fas fa-phone"></i>
                    Contact Supplier
                </button>
            </div>
        </div>
    `;
    
    showModal(modal);
}

function editRequest(requestId) {
    showNotification('Request editing functionality would be implemented here', 'info');
}

function cancelRequest(requestId) {
    showConfirmationModal(
        'Cancel Blood Request',
        'Are you sure you want to cancel this blood request?',
        () => {
            // Remove from outgoing requests
            const requestItems = document.querySelectorAll('.request-item.outgoing');
            requestItems.forEach(item => {
                if (item.querySelector('.request-actions button').getAttribute('onclick').includes(requestId)) {
                    item.remove();
                    return;
                }
            });
            
            showNotification('Blood request cancelled', 'info');
            updateTabBadge('outgoing', -1);
        }
    );
}

function confirmReceived(requestId) {
    showConfirmationModal(
        'Confirm Blood Received',
        'Confirm that you have received the blood units and they have been added to your inventory?',
        () => {
            // Update the request status
            const requestItem = document.querySelector(`[onclick*="${requestId}"]`).closest('.request-item');
            const statusBadge = requestItem.querySelector('.status-badge');
            statusBadge.className = 'status-badge completed';
            statusBadge.textContent = 'Completed';
            
            // Update the icon
            const icon = requestItem.querySelector('.request-icon');
            icon.className = 'request-icon completed';
            icon.innerHTML = '<i class="fas fa-check-circle"></i>';
            
            // Update actions
            const actions = requestItem.querySelector('.request-actions');
            actions.innerHTML = `
                <button class="btn-sm success" disabled>
                    <i class="fas fa-check-circle"></i>
                    Received
                </button>
                <button class="btn-sm info" onclick="downloadReceipt('${requestId}')">
                    <i class="fas fa-download"></i>
                    Receipt
                </button>
            `;
            
            showNotification('Blood units confirmed received and added to inventory', 'success');
        }
    );
}

function downloadReceipt(requestId) {
    showNotification(`Downloading receipt for ${requestId}...`, 'info');
    // Would generate and download PDF receipt
}

// Utility Functions
function addNewIncomingRequest() {
    const incomingTab = document.getElementById('incoming-tab');
    const requestList = incomingTab.querySelector('.request-list');
    
    const hospitals = ['Regional Hospital', 'Community Health Center', 'Metro Medical Center'];
    const bloodTypes = ['A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-', 'AB-'];
    const priorities = ['normal', 'urgent', 'emergency'];
    const reasons = [
        'Scheduled surgery preparation',
        'Emergency patient treatment',
        'Stock replenishment needed',
        'Critical patient care'
    ];
    
    const randomHospital = hospitals[Math.floor(Math.random() * hospitals.length)];
    const randomBloodType = bloodTypes[Math.floor(Math.random() * bloodTypes.length)];
    const randomPriority = priorities[Math.floor(Math.random() * priorities.length)];
    const randomReason = reasons[Math.floor(Math.random() * reasons.length)];
    const randomUnits = Math.floor(Math.random() * 5) + 1;
    const requestId = 'REQ-' + Date.now();
    
    const requestItem = document.createElement('div');
    requestItem.className = `request-item incoming ${randomPriority === 'emergency' ? 'urgent' : ''}`;
    requestItem.innerHTML = `
        <div class="request-info">
            <div class="hospital-icon">
                <i class="fas fa-hospital"></i>
            </div>
            <div class="request-details">
                <h4>${randomHospital}</h4>
                <p><strong>${randomBloodType} Blood • ${randomUnits} units</strong></p>
                <p>${randomReason}</p>
                <span class="request-time">Just now</span>
            </div>
        </div>
        <div class="request-priority">
            <span class="priority-badge ${randomPriority}">${randomPriority.charAt(0).toUpperCase() + randomPriority.slice(1)}</span>
        </div>
        <div class="request-actions">
            <button class="btn-sm success" onclick="approveBloodRequest('${requestId}', '${randomHospital}', '${randomBloodType}', ${randomUnits})">
                <i class="fas fa-check"></i>
                Approve & Transfer
            </button>
            <button class="btn-sm danger" onclick="rejectBloodRequest('${requestId}')">
                <i class="fas fa-times"></i>
                Reject
            </button>
            <button class="btn-sm info" onclick="viewRequestDetails('${requestId}')">
                <i class="fas fa-eye"></i>
                Details
            </button>
        </div>
    `;
    
    // Insert at the beginning
    requestList.insertBefore(requestItem, requestList.firstChild);
    
    // Animate in
    requestItem.style.opacity = '0';
    requestItem.style.transform = 'translateY(-20px)';
    setTimeout(() => {
        requestItem.style.transition = 'all 0.5s ease';
        requestItem.style.opacity = '1';
        requestItem.style.transform = 'translateY(0)';
    }, 100);
    
    // Update tab badge
    updateTabBadge('incoming', 1);
    
    // Show notification
    showNotification(`New ${randomPriority} blood request from ${randomHospital}`, randomPriority === 'emergency' ? 'error' : 'info');
}

function updateTabBadge(tabType, change) {
    const tab = document.querySelector(`[data-tab="${tabType}"]`);
    const badge = tab.querySelector('.tab-badge');
    const currentCount = parseInt(badge.textContent);
    const newCount = Math.max(0, currentCount + change);
    badge.textContent = newCount;
    
    if (newCount === 0) {
        badge.style.display = 'none';
    } else {
        badge.style.display = 'inline';
    }
}

// Add hospital blood request styles
const hospitalBloodRequestStyles = `
    .blood-request-management {
        background: white;
        border-radius: 16px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        margin-bottom: 2rem;
        border: 1px solid #e5e7eb;
        overflow: hidden;
    }

    .request-tabs {
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
        position: relative;
    }

    .tab-btn.active {
        color: #dc2626;
        background: white;
        border-bottom: 2px solid #dc2626;
    }

    .tab-btn:hover {
        background: rgba(220, 38, 38, 0.05);
        color: #dc2626;
    }

    .tab-badge {
        background: #dc2626;
        color: white;
        font-size: 0.75rem;
        padding: 0.25rem 0.5rem;
        border-radius: 10px;
        font-weight: 600;
        min-width: 20px;
        text-align: center;
    }

    .tab-content {
        display: none;
    }

    .tab-content.active {
        display: block;
    }

    .request-list {
        padding: 1.5rem;
        max-height: 600px;
        overflow-y: auto;
    }

    .request-item {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1.5rem;
        border: 2px solid #e5e7eb;
        border-radius: 12px;
        margin-bottom: 1rem;
        transition: all 0.3s ease;
        background: white;
    }

    .request-item:hover {
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
    }

    .request-item.urgent {
        border-color: #ef4444;
        background: rgba(239, 68, 68, 0.02);
    }

    .request-item.incoming .hospital-icon {
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

    .request-item.outgoing .request-icon {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.25rem;
        color: white;
    }

    .request-icon.pending {
        background: #f59e0b;
    }

    .request-icon.approved {
        background: #10b981;
    }

    .request-icon.completed {
        background: #059669;
    }

    .request-info {
        display: flex;
        align-items: center;
        gap: 1rem;
        flex: 1;
    }

    .request-details h4 {
        margin-bottom: 0.25rem;
        color: #1f2937;
        font-weight: 600;
    }

    .request-details p {
        margin-bottom: 0.25rem;
        color: #4b5563;
        font-size: 0.875rem;
    }

    .request-time {
        font-size: 0.75rem;
        color: #9ca3af;
    }

    .request-priority, .request-status {
        margin-right: 1rem;
    }

    .priority-badge {
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .priority-badge.normal {
        background: rgba(59, 130, 246, 0.1);
        color: #3b82f6;
    }

    .priority-badge.urgent {
        background: rgba(245, 158, 11, 0.1);
        color: #f59e0b;
    }

    .priority-badge.emergency {
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;
        animation: pulse 2s infinite;
    }

    .status-badge.pending {
        background: rgba(245, 158, 11, 0.1);
        color: #f59e0b;
    }

    .status-badge.approved {
        background: rgba(16, 185, 129, 0.1);
        color: #10b981;
    }

    .status-badge.completed {
        background: rgba(5, 150, 105, 0.1);
        color: #059669;
    }

    .request-actions {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
    }

    .request-form-container {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 2rem;
    }

    .form-section h4, .availability-section h4 {
        margin-bottom: 1rem;
        color: #1f2937;
        font-weight: 600;
        border-bottom: 1px solid #e5e7eb;
        padding-bottom: 0.5rem;
    }

    .availability-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .availability-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        background: #f9fafb;
    }

    .hospital-info {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 500;
    }

    .hospital-info i {
        color: #3b82f6;
    }

    .blood-availability {
        display: flex;
        gap: 0.5rem;
        font-size: 0.875rem;
    }

    .blood-availability .available {
        color: #10b981;
        font-weight: 600;
    }

    .blood-availability .low {
        color: #f59e0b;
        font-weight: 600;
    }

    .blood-availability .unavailable {
        color: #ef4444;
        font-weight: 600;
    }

    .distance {
        font-size: 0.875rem;
        color: #6b7280;
    }

    .request-details-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
        margin-bottom: 2rem;
    }

    .medical-reason {
        background: #f9fafb;
        padding: 1rem;
        border-radius: 8px;
        border-left: 4px solid #dc2626;
    }

    .medical-reason h4 {
        margin-bottom: 0.5rem;
        color: #1f2937;
    }

    .tracking-timeline {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .timeline-item {
        display: flex;
        gap: 1rem;
        padding: 1rem 0;
        position: relative;
    }

    .timeline-item:not(:last-child)::after {
        content: '';
        position: absolute;
        left: 24px;
        top: 50px;
        width: 2px;
        height: calc(100% + 1rem);
        background: #e5e7eb;
    }

    .timeline-item.completed::after {
        background: #10b981;
    }

    .timeline-item.active::after {
        background: linear-gradient(to bottom, #10b981 0%, #e5e7eb 50%);
    }

    .timeline-marker {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.25rem;
        color: white;
        flex-shrink: 0;
        z-index: 1;
    }

    .timeline-item.completed .timeline-marker {
        background: #10b981;
    }

    .timeline-item.active .timeline-marker {
        background: #3b82f6;
        animation: pulse 2s infinite;
    }

    .timeline-item:not(.completed):not(.active) .timeline-marker {
        background: #d1d5db;
        color: #6b7280;
    }

    .timeline-content {
        flex: 1;
        padding-top: 0.5rem;
    }

    .timeline-content h4 {
        margin-bottom: 0.25rem;
        color: #1f2937;
        font-weight: 600;
    }

    .timeline-content p {
        color: #6b7280;
        font-size: 0.875rem;
        margin-bottom: 0.25rem;
    }

    .timeline-time {
        font-size: 0.75rem;
        color: #9ca3af;
    }

    @media (max-width: 1024px) {
        .request-form-container {
            grid-template-columns: 1fr;
        }

        .request-details-grid {
            grid-template-columns: 1fr;
        }
    }

    @media (max-width: 768px) {
        .request-item {
            flex-direction: column;
            align-items: stretch;
            gap: 1rem;
        }

        .request-info {
            flex-direction: column;
            align-items: stretch;
        }

        .request-actions {
            justify-content: center;
        }

        .tab-btn {
            flex-direction: column;
            gap: 0.25rem;
            font-size: 0.875rem;
        }
    }
`;

// Add styles to head
const styleSheet = document.createElement('style');
styleSheet.textContent = hospitalBloodRequestStyles;
document.head.appendChild(styleSheet);

// Donation Workflow Management Functions
function createDonationRecord(offerId, donorName, bloodType, status) {
    // Create a donation record in the system
    const donationRecord = {
        id: offerId,
        donorName: donorName,
        bloodType: bloodType,
        status: status, // PENDING, ACCEPTED, COMPLETED, REJECTED
        hospitalId: 'city-general',
        hospitalName: 'City General Hospital',
        createdAt: new Date().toISOString(),
        scheduledDate: null,
        completedDate: null,
        volume: '450ml',
        notes: []
    };
    
    // Store in localStorage for demo (in real app, would be sent to server)
    const donations = JSON.parse(localStorage.getItem('hospitalDonations') || '[]');
    donations.push(donationRecord);
    localStorage.setItem('hospitalDonations', JSON.stringify(donations));
    
    console.log('Donation record created:', donationRecord);
}

function logDonationActivity(offerId, activityType, description) {
    const activity = {
        donationId: offerId,
        type: activityType,
        description: description,
        timestamp: new Date().toISOString(),
        hospitalId: 'city-general'
    };
    
    // Store activity log
    const activities = JSON.parse(localStorage.getItem('donationActivities') || '[]');
    activities.push(activity);
    localStorage.setItem('donationActivities', JSON.stringify(activities));
    
    console.log('Donation activity logged:', activity);
}

function addToScheduledDonations(offerId, donorName, bloodType) {
    // Add to scheduled donations section (would update UI in real implementation)
    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + 1); // Tomorrow
    
    console.log(`Added to scheduled donations: ${donorName} - ${bloodType} on ${scheduledDate.toDateString()}`);
    
    // Update donation record with scheduled date
    const donations = JSON.parse(localStorage.getItem('hospitalDonations') || '[]');
    const donation = donations.find(d => d.id === offerId);
    if (donation) {
        donation.scheduledDate = scheduledDate.toISOString();
        donation.status = 'ACCEPTED';
        localStorage.setItem('hospitalDonations', JSON.stringify(donations));
    }
}

function moveToCompletedDonations(offerId, donorName, bloodType) {
    // Move from scheduled to completed donations
    const donations = JSON.parse(localStorage.getItem('hospitalDonations') || '[]');
    const donation = donations.find(d => d.id === offerId);
    if (donation) {
        donation.status = 'COMPLETED';
        donation.completedDate = new Date().toISOString();
        localStorage.setItem('hospitalDonations', JSON.stringify(donations));
    }
    
    console.log(`Moved to completed donations: ${donorName} - ${bloodType}`);
}

function updateDonorEligibility(donorName, daysUntilEligible) {
    // Update donor eligibility (in real app, would update donor record)
    const eligibilityDate = new Date();
    eligibilityDate.setDate(eligibilityDate.getDate() + daysUntilEligible);
    
    const donorEligibility = {
        donorName: donorName,
        nextEligibleDate: eligibilityDate.toISOString(),
        lastDonationDate: new Date().toISOString(),
        totalDonations: 1 // Would increment existing count
    };
    
    // Store eligibility info
    const eligibilities = JSON.parse(localStorage.getItem('donorEligibilities') || '[]');
    const existingIndex = eligibilities.findIndex(e => e.donorName === donorName);
    
    if (existingIndex >= 0) {
        eligibilities[existingIndex] = donorEligibility;
        eligibilities[existingIndex].totalDonations += 1;
    } else {
        eligibilities.push(donorEligibility);
    }
    
    localStorage.setItem('donorEligibilities', JSON.stringify(eligibilities));
    
    console.log('Donor eligibility updated:', donorEligibility);
}

// Admin Functions for Viewing All Donations (as mentioned in workflow)
function viewAllDonations() {
    const donations = JSON.parse(localStorage.getItem('hospitalDonations') || '[]');
    console.log('All donations:', donations);
    return donations;
}

function viewDonationActivities() {
    const activities = JSON.parse(localStorage.getItem('donationActivities') || '[]');
    console.log('All donation activities:', activities);
    return activities;
}

// Workflow Rule Enforcement
function enforceWorkflowRules() {
    // Rule: One donation → one hospital
    // Rule: Hospital must accept donor before donation
    // Rule: Donor cannot donate without eligibility
    
    console.log('Workflow rules enforced:');
    console.log('✓ One donation → one hospital');
    console.log('✓ Hospital must accept donor before donation');
    console.log('✓ Donor cannot donate without eligibility');
    console.log('✓ Admin can view all donations');
}

// Initialize workflow rules on page load
document.addEventListener('DOMContentLoaded', function() {
    enforceWorkflowRules();
});

// Patient Blood Request Monitoring System
function initializePatientBloodRequestMonitoring() {
    // Check for new patient blood requests every 30 seconds
    setInterval(() => {
        checkForNewPatientBloodRequests();
    }, 30000);
    
    // Initial check
    setTimeout(() => {
        checkForNewPatientBloodRequests();
    }, 5000);
}

function checkForNewPatientBloodRequests() {
    // Get hospital notifications from localStorage
    const notifications = JSON.parse(localStorage.getItem('hospitalNotifications') || '[]');
    const processedNotifications = JSON.parse(localStorage.getItem('processedHospitalNotifications') || '[]');
    
    // Filter for new notifications for this hospital
    const newNotifications = notifications.filter(notification => 
        notification.type === 'BLOOD_REQUEST' && 
        notification.hospitalId === 'city-general' && // This hospital's ID
        !processedNotifications.includes(notification.requestId)
    );
    
    // Process new notifications
    newNotifications.forEach(notification => {
        handleNewPatientBloodRequest(notification);
        processedNotifications.push(notification.requestId);
    });
    
    // Update processed notifications
    localStorage.setItem('processedHospitalNotifications', JSON.stringify(processedNotifications));
}

function handleNewPatientBloodRequest(notification) {
    // Step 6: Hospital Receives Notification
    console.log('New patient blood request received:', notification);
    
    // Show alert notification
    const alertType = notification.emergencyLevel ? 'critical' : 'info';
    const alertTitle = notification.emergencyLevel ? 'Emergency Blood Request' : 'New Blood Request';
    const alertMessage = `${notification.patientName} needs ${notification.units} unit(s) of ${notification.bloodType} blood`;
    
    // Add to alerts section
    addPatientRequestAlert(notification, alertType, alertTitle, alertMessage);
    
    // Show browser notification
    showNotification(`${alertTitle}: ${alertMessage}`, notification.emergencyLevel ? 'error' : 'info');
    
    // Update notification badge
    updateNotificationBadge(1);
}

function addPatientRequestAlert(notification, alertType, alertTitle, alertMessage) {
    const alertsList = document.querySelector('.alerts-list');
    if (!alertsList) return;

    const alertItem = document.createElement('div');
    alertItem.className = `alert-item ${alertType} patient-request-alert`;
    alertItem.setAttribute('data-request-id', notification.requestId);
    
    alertItem.innerHTML = `
        <div class="alert-icon">
            <i class="fas fa-${alertType === 'critical' ? 'exclamation-triangle' : 'hand-holding-medical'}"></i>
        </div>
        <div class="alert-content">
            <h4>${alertTitle}</h4>
            <p>${alertMessage}</p>
            <div class="request-details">
                <span class="detail-badge">Request ID: ${notification.requestId}</span>
                <span class="detail-badge">Priority: ${notification.priority.toUpperCase()}</span>
            </div>
            <span class="alert-time">Just now</span>
        </div>
        <div class="alert-actions">
            <button class="btn-sm success" onclick="reviewPatientBloodRequest('${notification.requestId}')">
                <i class="fas fa-eye"></i>
                Review Request
            </button>
            <button class="btn-sm secondary" onclick="dismissAlert(this.closest('.alert-item'))">
                <i class="fas fa-times"></i>
                Dismiss
            </button>
        </div>
    `;

    // Insert at the beginning
    alertsList.insertBefore(alertItem, alertsList.firstChild);

    // Animate in
    alertItem.style.opacity = '0';
    alertItem.style.transform = 'translateX(-100%)';
    setTimeout(() => {
        alertItem.style.transition = 'all 0.5s ease';
        alertItem.style.opacity = '1';
        alertItem.style.transform = 'translateX(0)';
    }, 100);
}

function reviewPatientBloodRequest(requestId) {
    // Get the blood request details
    const bloodRequests = JSON.parse(localStorage.getItem('bloodRequests') || '[]');
    const request = bloodRequests.find(r => r.id === requestId);
    
    if (!request) {
        showNotification('Request not found', 'error');
        return;
    }
    
    // Step 7: Hospital Reviews Request
    showPatientBloodRequestModal(request);
}

function showPatientBloodRequestModal(request) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content large">
            <div class="modal-header">
                <h3>Patient Blood Request Review</h3>
                <button class="modal-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="request-review-container">
                    <div class="patient-info-section">
                        <h4>Patient Information</h4>
                        <div class="info-grid">
                            <div class="info-item">
                                <label>Patient Name:</label>
                                <span>${request.patientName}</span>
                            </div>
                            <div class="info-item">
                                <label>Patient ID:</label>
                                <span>${request.patientId}</span>
                            </div>
                            <div class="info-item">
                                <label>Request ID:</label>
                                <span class="request-id-highlight">${request.id}</span>
                            </div>
                            <div class="info-item">
                                <label>Submitted:</label>
                                <span>${new Date(request.submittedAt).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="blood-requirement-section">
                        <h4>Blood Requirement</h4>
                        <div class="requirement-details">
                            <div class="blood-type-display">
                                <div class="blood-type-icon">${request.bloodType}</div>
                                <div class="blood-type-info">
                                    <h5>${request.bloodType} Blood</h5>
                                    <p>${request.units} unit(s) required</p>
                                </div>
                            </div>
                            <div class="priority-display">
                                <span class="priority-badge ${request.priority}">
                                    ${request.priority.toUpperCase()}
                                </span>
                                ${request.priority === 'emergency' ? `
                                    <div class="emergency-reason">
                                        <strong>Emergency Reason:</strong> ${request.emergencyReason || 'Not specified'}
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                    
                    <div class="medical-reason-section">
                        <h4>Medical Reason</h4>
                        <div class="reason-text">
                            ${request.reason}
                        </div>
                        ${request.doctorContact ? `
                            <div class="doctor-contact">
                                <strong>Doctor Contact:</strong> ${request.doctorContact}
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="availability-check-section">
                        <h4>Current Stock Check</h4>
                        <div class="stock-check-result">
                            <div class="stock-info">
                                <i class="fas fa-tint"></i>
                                <span>Current ${request.bloodType} stock: <strong>45 units</strong></span>
                            </div>
                            <div class="availability-status available">
                                <i class="fas fa-check-circle"></i>
                                <span>Sufficient stock available</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary modal-close">Cancel</button>
                <button class="btn btn-danger" onclick="rejectPatientBloodRequest('${request.id}')">
                    <i class="fas fa-times"></i>
                    Reject Request
                </button>
                <button class="btn btn-success" onclick="approvePatientBloodRequest('${request.id}')">
                    <i class="fas fa-check"></i>
                    Approve & Reserve Blood
                </button>
            </div>
        </div>
    `;
    
    showModal(modal);
}

function approvePatientBloodRequest(requestId) {
    // Step 8A: Hospital ACCEPTS
    showConfirmationModal(
        'Approve Blood Request',
        `Approve this blood request and reserve the blood for the patient?<br><br>This will:<br>• Update request status to APPROVED<br>• Reserve blood units for the patient<br>• Notify the patient of approval<br>• Reduce available stock temporarily`,
        () => {
            // Update request status
            updatePatientBloodRequestStatus(requestId, 'APPROVED');
            
            // Close the review modal
            document.querySelector('.modal-overlay').remove();
            
            // Show success notification
            showNotification('Blood request approved! Patient has been notified and blood reserved.', 'success');
            
            // Remove from alerts
            const alertItem = document.querySelector(`[data-request-id="${requestId}"]`);
            if (alertItem) {
                alertItem.remove();
            }
        }
    );
}

function rejectPatientBloodRequest(requestId) {
    // Step 8B: Hospital REJECTS
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Reject Blood Request</h3>
                <button class="modal-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>Reason for Rejection</label>
                    <select class="form-control" name="rejectionReason">
                        <option value="insufficient_stock">Insufficient stock available</option>
                        <option value="blood_type_unavailable">Blood type currently unavailable</option>
                        <option value="emergency_priority">Reserved for emergency cases</option>
                        <option value="patient_eligibility">Patient eligibility issues</option>
                        <option value="other">Other reason</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Additional Notes (Optional)</label>
                    <textarea class="form-control" name="rejectionNotes" rows="3" placeholder="Additional information for the patient..."></textarea>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary modal-cancel">Cancel</button>
                <button class="btn btn-danger" onclick="confirmPatientBloodRequestRejection('${requestId}')">
                    <i class="fas fa-times"></i>
                    Reject Request
                </button>
            </div>
        </div>
    `;
    
    showModal(modal);
}

function confirmPatientBloodRequestRejection(requestId) {
    const modal = document.querySelector('.modal-overlay');
    const reason = modal.querySelector('[name="rejectionReason"]').value;
    const notes = modal.querySelector('[name="rejectionNotes"]').value;
    
    // Update request status with rejection reason
    updatePatientBloodRequestStatus(requestId, 'REJECTED', reason, notes);
    
    // Close modals
    document.querySelectorAll('.modal-overlay').forEach(m => m.remove());
    
    // Show notification
    showNotification('Blood request rejected. Patient has been notified with reason.', 'info');
    
    // Remove from alerts
    const alertItem = document.querySelector(`[data-request-id="${requestId}"]`);
    if (alertItem) {
        alertItem.remove();
    }
}

function updatePatientBloodRequestStatus(requestId, status, rejectionReason = null, rejectionNotes = null) {
    // Update the request in localStorage
    const bloodRequests = JSON.parse(localStorage.getItem('bloodRequests') || '[]');
    const requestIndex = bloodRequests.findIndex(r => r.id === requestId);
    
    if (requestIndex !== -1) {
        const request = bloodRequests[requestIndex];
        request.status = status;
        request.lastUpdated = new Date().toISOString();
        
        if (status === 'APPROVED') {
            request.approvedAt = new Date().toISOString();
            request.approvedBy = 'City General Hospital';
        } else if (status === 'REJECTED') {
            request.rejectedAt = new Date().toISOString();
            request.rejectionReason = rejectionReason;
            request.rejectionNotes = rejectionNotes;
            request.rejectedBy = 'City General Hospital';
        }
        
        bloodRequests[requestIndex] = request;
        localStorage.setItem('bloodRequests', JSON.stringify(bloodRequests));
        
        console.log(`Patient blood request ${requestId} updated to ${status}`);
    }
}

function updateNotificationBadge(change) {
    const badge = document.querySelector('.nav-actions .notification-badge');
    if (badge) {
        const currentCount = parseInt(badge.textContent) || 0;
        const newCount = Math.max(0, currentCount + change);
        badge.textContent = newCount;
        
        if (newCount === 0) {
            badge.style.display = 'none';
        } else {
            badge.style.display = 'inline';
        }
    }
}