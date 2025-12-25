// frontend/js/donor/appointments.js

// API path helper — allows overriding `window.API_ROOT` to fix backend paths centrally
if (typeof apiPath === 'undefined') {
    var apiPath = function(p) { return (typeof window !== 'undefined' && window.API_ROOT) ? window.API_ROOT + p : p; };
}

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in and is a donor
    const userData = JSON.parse(localStorage.getItem('user'));
    if (!userData || userData.role !== 'donor') {
        window.location.href = '../auth/login.html';
        return;
    }

    // Initialize donor ID
    const donorId = userData.user_id;
    window.donorId = donorId;

    // Display user info
    displayUserInfo(userData);

    // Initialize page
    initializePage();

    // Load initial data
    loadAppointments();
    loadBloodBanks();
    setupEventListeners();

    // Setup modal events
    setupModalEvents();
});

/**
 * Initialize page elements
 */
function initializePage() {
    // Initialize date picker constraints
    const today = new Date();
    const minDate = today.toISOString().split('T')[0];
    const maxDate = new Date(today.setMonth(today.getMonth() + 3)).toISOString().split('T')[0];
    
    const appointmentDateInput = document.getElementById('appointmentDate');
    if (appointmentDateInput) {
        appointmentDateInput.min = minDate;
        appointmentDateInput.max = maxDate;
        appointmentDateInput.value = minDate; // Default to today
    }

    // Initialize time slots (9 AM to 5 PM)
    populateTimeSlots();
}

/**
 * Display user information
 */
function displayUserInfo(userData) {
    const userNameElement = document.getElementById('userName');
    const userAvatarElement = document.getElementById('userAvatar');

    if (userNameElement) {
        userNameElement.textContent = `${userData.first_name || ''} ${userData.last_name || ''}`.trim();
    }

    if (userAvatarElement) {
        const initials = `${userData.first_name?.charAt(0) || ''}${userData.last_name?.charAt(0) || ''}`.toUpperCase();
        userAvatarElement.textContent = initials;
    }
}

/**
 * Load appointments for the donor
 */
async function loadAppointments() {
    try {
        showLoading('appointmentsLoading', true);
        
        const response = await fetch(apiPath(`/backend/api/appointments.php?donor_id=${window.donorId}`), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const result = await response.json();
        
        if (result.success && result.data) {
            displayAppointments(result.data);
        } else {
            showMessage('warning', result.message || 'No appointments found');
            displayAppointments([]);
        }
    } catch (error) {
        console.error('Error loading appointments:', error);
        showMessage('error', 'Failed to load appointments. Please try again.');
        displayAppointments([]);
    } finally {
        showLoading('appointmentsLoading', false);
    }
}

/**
 * Display appointments in the table
 */
function displayAppointments(appointments) {
    const appointmentsTable = document.getElementById('appointmentsTable');
    const emptyState = document.getElementById('emptyState');
    const appointmentsCountElement = document.getElementById('appointmentsCount');
    
    if (!appointmentsTable) return;

    // Update count
    if (appointmentsCountElement) {
        appointmentsCountElement.textContent = appointments.length;
    }

    // Clear existing rows (except header)
    while (appointmentsTable.rows.length > 1) {
        appointmentsTable.deleteRow(1);
    }

    // Show/hide empty state
    if (emptyState) {
        emptyState.style.display = appointments.length === 0 ? 'block' : 'none';
    }

    // Sort appointments by date (newest first)
    appointments.sort((a, b) => new Date(b.appointment_date) - new Date(a.appointment_date));

    // Add appointments to table
    appointments.forEach(appointment => {
        const row = appointmentsTable.insertRow();
        row.className = 'align-middle';
        
        // Format date and time
        const appointmentDate = new Date(appointment.appointment_date);
        const formattedDate = appointmentDate.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        const formattedTime = appointmentDate.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });

        // Calculate if appointment is upcoming (within next 24 hours)
        const now = new Date();
        const appointmentTime = new Date(appointment.appointment_date);
        const isUpcoming = appointmentTime > now && 
                          (appointmentTime - now) <= 24 * 60 * 60 * 1000;
        
        row.innerHTML = `
            <td>
                <div class="fw-medium">${appointment.blood_bank_name || 'Unknown Blood Bank'}</div>
                <small class="text-muted">${appointment.blood_bank_address || ''}</small>
            </td>
            <td>
                <div>${formattedDate}</div>
                <small class="text-muted">${formattedTime}</small>
            </td>
            <td>
                <span class="badge ${getAppointmentStatusClass(appointment.status)}">
                    ${formatStatus(appointment.status)}
                </span>
                ${isUpcoming && appointment.status === 'scheduled' ? 
                    '<span class="badge bg-warning ms-1">Upcoming</span>' : ''}
            </td>
            <td>${appointment.blood_group || 'N/A'}</td>
            <td>
                <div class="btn-group btn-group-sm" role="group">
                    ${appointment.status === 'scheduled' ? `
                        <button type="button" class="btn btn-outline-primary" onclick="editAppointment(${appointment.id})" title="Edit">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button type="button" class="btn btn-outline-danger" onclick="cancelAppointment(${appointment.id})" title="Cancel">
                            <i class="bi bi-x-circle"></i>
                        </button>
                    ` : ''}
                    <button type="button" class="btn btn-outline-secondary" onclick="viewAppointmentDetails(${appointment.id})" title="View Details">
                        <i class="bi bi-eye"></i>
                    </button>
                </div>
            </td>
        `;
    });
}

/**
 * Load blood banks for appointment booking
 */
async function loadBloodBanks() {
    try {
        showLoading('bloodBanksLoading', true);
        
        const response = await fetch(apiPath('/backend/api/blood_banks.php'), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const result = await response.json();
        
        if (result.success && result.data) {
            populateBloodBanksSelect(result.data);
        } else {
            showMessage('warning', 'Unable to load blood banks');
        }
    } catch (error) {
        console.error('Error loading blood banks:', error);
        showMessage('error', 'Failed to load blood banks');
    } finally {
        showLoading('bloodBanksLoading', false);
    }
}

/**
 * Populate blood banks select dropdown
 */
function populateBloodBanksSelect(bloodBanks) {
    const bloodBankSelect = document.getElementById('bloodBankId');
    if (!bloodBankSelect) return;

    // Clear existing options except the first one
    while (bloodBankSelect.options.length > 1) {
        bloodBankSelect.remove(1);
    }

    // Filter only active blood banks
    const activeBloodBanks = bloodBanks.filter(bank => bank.status === 'active');
    
    // Add blood bank options
    activeBloodBanks.forEach(bank => {
        const option = document.createElement('option');
        option.value = bank.id;
        option.textContent = `${bank.name} - ${bank.city}, ${bank.state}`;
        bloodBankSelect.appendChild(option);
    });

    // If no active blood banks, show message
    if (activeBloodBanks.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'No active blood banks available';
        option.disabled = true;
        bloodBankSelect.appendChild(option);
        bloodBankSelect.disabled = true;
    }
}

/**
 * Populate time slots (9 AM to 5 PM, every 30 minutes)
 */
function populateTimeSlots() {
    const timeSlotSelect = document.getElementById('appointmentTime');
    if (!timeSlotSelect) return;

    // Clear existing options
    timeSlotSelect.innerHTML = '';

    // Create time slots from 9:00 AM to 5:00 PM
    for (let hour = 9; hour <= 17; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
            if (hour === 17 && minute === 30) break; // Stop at 5:30 PM
            
            const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            const displayTime = formatTimeDisplay(hour, minute);
            
            const option = document.createElement('option');
            option.value = timeString;
            option.textContent = displayTime;
            timeSlotSelect.appendChild(option);
        }
    }
}

/**
 * Format time for display (AM/PM)
 */
function formatTimeDisplay(hour, minute) {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('href');
            window.location.href = page;
        });
    });

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // Book appointment button
    const bookAppointmentBtn = document.getElementById('bookAppointmentBtn');
    if (bookAppointmentBtn) {
        bookAppointmentBtn.addEventListener('click', showBookingModal);
    }

    // Refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadAppointments);
    }

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            filterAppointments(filter);
        });
    });

    // Search input
    const searchInput = document.getElementById('searchAppointments');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            searchAppointments(this.value);
        });
    }

    // Blood bank change event
    const bloodBankSelect = document.getElementById('bloodBankId');
    if (bloodBankSelect) {
        bloodBankSelect.addEventListener('change', loadBloodBankDetails);
    }

    // Date change event
    const dateInput = document.getElementById('appointmentDate');
    if (dateInput) {
        dateInput.addEventListener('change', checkDateAvailability);
    }
}

/**
 * Setup modal events
 */
function setupModalEvents() {
    const bookingModal = document.getElementById('bookingModal');
    if (bookingModal) {
        bookingModal.addEventListener('hidden.bs.modal', resetBookingForm);
        
        // Form submission
        const bookingForm = document.getElementById('bookingForm');
        if (bookingForm) {
            bookingForm.addEventListener('submit', bookAppointment);
        }
    }

    // Details modal
    const detailsModal = document.getElementById('detailsModal');
    if (detailsModal) {
        detailsModal.addEventListener('hidden.bs.modal', function() {
            document.getElementById('appointmentDetails').innerHTML = '';
        });
    }
}

/**
 * Show booking modal
 */
function showBookingModal() {
    // Reset form
    resetBookingForm();
    
    // Get donor's blood group if available
    loadDonorBloodGroup();
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('bookingModal'));
    modal.show();
}

/**
 * Load donor's blood group
 */
async function loadDonorBloodGroup() {
    try {
        const response = await fetch(apiPath(`/backend/api/donors.php?id=${window.donorId}`), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const result = await response.json();
        
        if (result.success && result.data && result.data.blood_group) {
            const bloodGroupSelect = document.getElementById('bloodGroup');
            if (bloodGroupSelect) {
                bloodGroupSelect.value = result.data.blood_group;
            }
        }
    } catch (error) {
        console.error('Error loading donor blood group:', error);
    }
}

/**
 * Load blood bank details when selected
 */
async function loadBloodBankDetails() {
    const bloodBankId = document.getElementById('bloodBankId').value;
    if (!bloodBankId) return;

    try {
        const response = await fetch(apiPath(`/backend/api/blood_banks.php?id=${bloodBankId}`), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const result = await response.json();
        
        if (result.success && result.data) {
            const bank = result.data;
            const detailsDiv = document.getElementById('bloodBankDetails');
            
            detailsDiv.innerHTML = `
                <div class="mt-2">
                    <p class="mb-1"><strong>Address:</strong> ${bank.address || 'N/A'}</p>
                    <p class="mb-1"><strong>Phone:</strong> ${bank.phone || 'N/A'}</p>
                    <p class="mb-1"><strong>Hours:</strong> ${bank.operating_hours || '9:00 AM - 5:00 PM'}</p>
                </div>
            `;
            detailsDiv.style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading blood bank details:', error);
    }
}

/**
 * Check date availability
 */
async function checkDateAvailability() {
    const date = document.getElementById('appointmentDate').value;
    const bloodBankId = document.getElementById('bloodBankId').value;
    
    if (!date || !bloodBankId) return;

    try {
        showLoading('availabilityLoading', true);
        
        const response = await fetch(apiPath(`/backend/api/appointments.php?blood_bank_id=${bloodBankId}&date=${date}`), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const result = await response.json();
        
        const availabilityDiv = document.getElementById('dateAvailability');
        if (result.success && result.data) {
            const bookedSlots = result.data.map(apt => 
                new Date(apt.appointment_date).toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'})
            );
            
            if (bookedSlots.length >= 16) { // Max 16 slots per day (9-5, 30 min intervals)
                availabilityDiv.innerHTML = '<div class="text-danger"><i class="bi bi-x-circle"></i> Fully booked for this date</div>';
            } else {
                availabilityDiv.innerHTML = `<div class="text-success"><i class="bi bi-check-circle"></i> ${16 - bookedSlots.length} slots available</div>`;
            }
        }
    } catch (error) {
        console.error('Error checking availability:', error);
    } finally {
        showLoading('availabilityLoading', false);
    }
}

/**
 * Book a new appointment
 */
async function bookAppointment(e) {
    e.preventDefault();
    
    // Collect form data
    const formData = {
        donor_id: window.donorId,
        blood_bank_id: document.getElementById('bloodBankId').value,
        appointment_date: `${document.getElementById('appointmentDate').value}T${document.getElementById('appointmentTime').value}:00`,
        blood_group: document.getElementById('bloodGroup').value,
        purpose: document.getElementById('appointmentPurpose').value,
        notes: document.getElementById('additionalNotes').value
    };
    
    // Validation
    if (!formData.blood_bank_id) {
        showMessage('error', 'Please select a blood bank');
        return;
    }
    
    if (!formData.appointment_date) {
        showMessage('error', 'Please select date and time');
        return;
    }
    
    if (!formData.blood_group) {
        showMessage('error', 'Please select blood group');
        return;
    }

    try {
        showLoading('bookingLoading', true);
        
        const response = await fetch(apiPath('/backend/api/appointments.php'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();
        
        if (result.success) {
            showMessage('success', 'Appointment booked successfully!');
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('bookingModal'));
            modal.hide();
            
            // Refresh appointments list
            loadAppointments();
        } else {
            showMessage('error', result.message || 'Failed to book appointment');
        }
    } catch (error) {
        console.error('Error booking appointment:', error);
        showMessage('error', 'Network error. Please try again.');
    } finally {
        showLoading('bookingLoading', false);
    }
}

/**
 * Edit an existing appointment
 */
async function editAppointment(appointmentId) {
    try {
        // Load appointment details
        const response = await fetch(apiPath(`/backend/api/appointments.php?id=${appointmentId}`), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const result = await response.json();
        
        if (result.success && result.data) {
            const appointment = result.data;
            
            // Populate edit form (you might want a separate modal for editing)
            showBookingModal(); // Reuse booking modal for editing
            
            // Set form values
            document.getElementById('bloodBankId').value = appointment.blood_bank_id;
            document.getElementById('appointmentDate').value = appointment.appointment_date.split('T')[0];
            document.getElementById('appointmentTime').value = appointment.appointment_date.split('T')[1].substring(0, 5);
            document.getElementById('bloodGroup').value = appointment.blood_group;
            document.getElementById('appointmentPurpose').value = appointment.purpose || '';
            document.getElementById('additionalNotes').value = appointment.notes || '';
            
            // Change form to update mode
            const form = document.getElementById('bookingForm');
            form.dataset.editId = appointmentId;
            document.getElementById('modalTitle').textContent = 'Edit Appointment';
        }
    } catch (error) {
        console.error('Error loading appointment for edit:', error);
        showMessage('error', 'Failed to load appointment details');
    }
}

/**
 * Cancel an appointment
 */
async function cancelAppointment(appointmentId) {
    if (!confirm('Are you sure you want to cancel this appointment?')) {
        return;
    }

    try {
        const response = await fetch(apiPath('/backend/api/appointments.php'), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                id: appointmentId,
                status: 'cancelled',
                cancellation_reason: 'Cancelled by donor'
            })
        });

        const result = await response.json();
        
        if (result.success) {
            showMessage('success', 'Appointment cancelled successfully');
            loadAppointments();
        } else {
            showMessage('error', result.message || 'Failed to cancel appointment');
        }
    } catch (error) {
        console.error('Error cancelling appointment:', error);
        showMessage('error', 'Network error. Please try again.');
    }
}

/**
 * View appointment details
 */
async function viewAppointmentDetails(appointmentId) {
    try {
        const response = await fetch(apiPath(`/backend/api/appointments.php?id=${appointmentId}`), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const result = await response.json();
        
        if (result.success && result.data) {
            const appointment = result.data;
            const detailsDiv = document.getElementById('appointmentDetails');
            
            const appointmentDate = new Date(appointment.appointment_date);
            const formattedDate = appointmentDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            const formattedTime = appointmentDate.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
            
            detailsDiv.innerHTML = `
                <div class="row">
                    <div class="col-md-6">
                        <h6>Blood Bank Information</h6>
                        <p><strong>Name:</strong> ${appointment.blood_bank_name || 'N/A'}</p>
                        <p><strong>Address:</strong> ${appointment.blood_bank_address || 'N/A'}</p>
                        <p><strong>Phone:</strong> ${appointment.blood_bank_phone || 'N/A'}</p>
                    </div>
                    <div class="col-md-6">
                        <h6>Appointment Details</h6>
                        <p><strong>Date:</strong> ${formattedDate}</p>
                        <p><strong>Time:</strong> ${formattedTime}</p>
                        <p><strong>Blood Group:</strong> ${appointment.blood_group || 'N/A'}</p>
                        <p><strong>Status:</strong> <span class="badge ${getAppointmentStatusClass(appointment.status)}">${formatStatus(appointment.status)}</span></p>
                    </div>
                </div>
                ${appointment.purpose ? `<p><strong>Purpose:</strong> ${appointment.purpose}</p>` : ''}
                ${appointment.notes ? `<p><strong>Notes:</strong> ${appointment.notes}</p>` : ''}
                ${appointment.cancellation_reason ? `<p><strong>Cancellation Reason:</strong> ${appointment.cancellation_reason}</p>` : ''}
                <p><strong>Created:</strong> ${new Date(appointment.created_at).toLocaleString()}</p>
            `;
            
            const modal = new bootstrap.Modal(document.getElementById('detailsModal'));
            modal.show();
        }
    } catch (error) {
        console.error('Error loading appointment details:', error);
        showMessage('error', 'Failed to load appointment details');
    }
}

/**
 * Filter appointments by status
 */
function filterAppointments(filter) {
    const rows = document.querySelectorAll('#appointmentsTable tbody tr');
    
    rows.forEach(row => {
        const statusCell = row.querySelector('td:nth-child(3)');
        const status = statusCell?.textContent.toLowerCase() || '';
        
        if (filter === 'all') {
            row.style.display = '';
        } else {
            row.style.display = status.includes(filter) ? '' : 'none';
        }
    });
}

/**
 * Search appointments
 */
function searchAppointments(searchTerm) {
    const rows = document.querySelectorAll('#appointmentsTable tbody tr');
    const searchLower = searchTerm.toLowerCase();
    
    rows.forEach(row => {
        const bloodBankCell = row.querySelector('td:nth-child(1)');
        const dateCell = row.querySelector('td:nth-child(2)');
        
        const bloodBankText = bloodBankCell?.textContent.toLowerCase() || '';
        const dateText = dateCell?.textContent.toLowerCase() || '';
        
        if (bloodBankText.includes(searchLower) || dateText.includes(searchLower)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

/**
 * Reset booking form
 */
function resetBookingForm() {
    const form = document.getElementById('bookingForm');
    if (form) {
        form.reset();
        form.dataset.editId = '';
        
        // Reset dynamic elements
        document.getElementById('bloodBankDetails').style.display = 'none';
        document.getElementById('dateAvailability').innerHTML = '';
        document.getElementById('modalTitle').textContent = 'Book New Appointment';
        
        // Set default date to today
        const today = new Date().toISOString().split('T')[0];
        const dateInput = document.getElementById('appointmentDate');
        if (dateInput) {
            dateInput.value = today;
        }
    }
}

/**
 * Logout function
 */
function logout() {
    // Call logout API
    fetch(apiPath('/backend/api/auth/logout.php'), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    }).finally(() => {
        // Clear local storage
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        // Redirect to login
        window.location.href = '../auth/login.html';
    });
}

/**
 * Show/hide loading state
 */
function showLoading(elementId, show) {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.display = show ? 'block' : 'none';
    }
}

/**
 * Show message to user
 */
function showMessage(type, text) {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.alert');
    existingMessages.forEach(msg => msg.remove());
    
    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.className = `alert alert-${type === 'error' ? 'danger' : 'success'} alert-dismissible fade show mt-3`;
    messageDiv.role = 'alert';
    messageDiv.innerHTML = `
        ${text}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Add to page
    const container = document.querySelector('.container') || document.body;
    container.insertBefore(messageDiv, container.firstChild);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 5000);
}

/**
 * Get CSS class for appointment status
 */
function getAppointmentStatusClass(status) {
    const statusMap = {
        'scheduled': 'bg-primary',
        'confirmed': 'bg-success',
        'cancelled': 'bg-danger',
        'completed': 'bg-info',
        'no_show': 'bg-warning',
        'pending': 'bg-secondary'
    };
    return statusMap[status?.toLowerCase()] || 'bg-secondary';
}

/**
 * Format status for display
 */
function formatStatus(status) {
    const statusMap = {
        'scheduled': 'Scheduled',
        'confirmed': 'Confirmed',
        'cancelled': 'Cancelled',
        'completed': 'Completed',
        'no_show': 'No Show',
        'pending': 'Pending'
    };
    return statusMap[status?.toLowerCase()] || status || 'Unknown';
}

// Export for testing if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadAppointments,
        loadBloodBanks,
        bookAppointment,
        cancelAppointment,
        editAppointment,
        filterAppointments,
        searchAppointments,
        getAppointmentStatusClass,
        formatStatus
    };
}