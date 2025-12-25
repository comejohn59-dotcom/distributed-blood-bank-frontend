// frontend/js/blood-bank/inventory.js

// API path helper — allows overriding `window.API_ROOT` to fix backend paths centrally
if (typeof apiPath === 'undefined') {
    var apiPath = function(p) { return (typeof window !== 'undefined' && window.API_ROOT) ? window.API_ROOT + p : p; };
}

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in and is a blood bank
    const userData = JSON.parse(localStorage.getItem('user'));
    if (!userData || userData.role !== 'blood_bank') {
        window.location.href = '../auth/login.html';
        return;
    }

    // Initialize blood bank ID
    const bloodBankId = userData.user_id;
    window.bloodBankId = bloodBankId;
    window.bloodBankData = userData;

    // Display blood bank information
    displayBloodBankInfo(userData);

    // Initialize page
    initializePage();

    // Load inventory data
    loadInventory();

    // Setup event listeners
    setupEventListeners();

    // Setup modal events
    setupModalEvents();
});

/**
 * Initialize page elements
 */
function initializePage() {
    // Initialize blood group filter
    initializeBloodGroupFilter();

    // Initialize component type filter
    initializeComponentFilter();

    // Initialize status filter
    initializeStatusFilter();

    // Initialize date inputs
    initializeDateInputs();
}

/**
 * Display blood bank information
 */
function displayBloodBankInfo(bloodBankData) {
    const bloodBankNameElement = document.getElementById('bloodBankName');
    const userNameElement = document.getElementById('userName');
    const userAvatarElement = document.getElementById('userAvatar');

    if (bloodBankNameElement) {
        bloodBankNameElement.textContent = bloodBankData.organization || bloodBankData.blood_bank_name || 'Blood Bank';
    }

    if (userNameElement) {
        userNameElement.textContent = `${bloodBankData.first_name || ''} ${bloodBankData.last_name || ''}`.trim();
    }

    if (userAvatarElement) {
        const initials = `${bloodBankData.first_name?.charAt(0) || 'B'}${bloodBankData.last_name?.charAt(0) || 'B'}`.toUpperCase();
        userAvatarElement.textContent = initials;
    }
}

/**
 * Initialize blood group filter
 */
function initializeBloodGroupFilter() {
    const bloodGroupFilter = document.getElementById('bloodGroupFilter');
    if (!bloodGroupFilter) return;

    const bloodGroups = [
        'All Groups', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
    ];

    bloodGroups.forEach(group => {
        const option = document.createElement('option');
        option.value = group === 'All Groups' ? '' : group;
        option.textContent = group;
        bloodGroupFilter.appendChild(option);
    });

    // Check URL parameter for blood group filter
    const urlParams = new URLSearchParams(window.location.search);
    const bloodGroupParam = urlParams.get('blood_group');
    if (bloodGroupParam) {
        bloodGroupFilter.value = bloodGroupParam;
    }
}

/**
 * Initialize component type filter
 */
function initializeComponentFilter() {
    const componentFilter = document.getElementById('componentFilter');
    if (!componentFilter) return;

    const components = [
        'All Components', 'Whole Blood', 'Red Cells', 'Plasma', 'Platelets', 
        'Cryoprecipitate', 'Fresh Frozen Plasma'
    ];

    components.forEach(component => {
        const option = document.createElement('option');
        option.value = component === 'All Components' ? '' : component;
        option.textContent = component;
        componentFilter.appendChild(option);
    });
}

/**
 * Initialize status filter
 */
function initializeStatusFilter() {
    const statusFilter = document.getElementById('statusFilter');
    if (!statusFilter) return;

    const statuses = [
        'All Status', 'Available', 'Reserved', 'Expired', 'Transfused', 
        'Quarantined', 'Critical', 'Low', 'Adequate', 'High'
    ];

    statuses.forEach(status => {
        const option = document.createElement('option');
        option.value = status === 'All Status' ? '' : status.toLowerCase();
        option.textContent = status;
        statusFilter.appendChild(option);
    });
}

/**
 * Initialize date inputs
 */
function initializeDateInputs() {
    const today = new Date();
    const formattedToday = today.toISOString().split('T')[0];
    
    // Expiry date filter
    const expiryFilter = document.getElementById('expiryFilter');
    if (expiryFilter) {
        expiryFilter.min = formattedToday;
    }
    
    // Collection date filter
    const collectionFilter = document.getElementById('collectionFilter');
    if (collectionFilter) {
        collectionFilter.max = formattedToday;
    }
    
    // Form date inputs
    const collectionDateInput = document.getElementById('collectionDate');
    if (collectionDateInput) {
        collectionDateInput.max = formattedToday;
        collectionDateInput.value = formattedToday;
    }
    
    const expiryDateInput = document.getElementById('expiryDate');
    if (expiryDateInput) {
        expiryDateInput.min = formattedToday;
        // Default to 42 days from today for whole blood
        const defaultExpiry = new Date(today);
        defaultExpiry.setDate(defaultExpiry.getDate() + 42);
        expiryDateInput.value = defaultExpiry.toISOString().split('T')[0];
    }
}

/**
 * Load inventory data
 */
async function loadInventory() {
    try {
        showLoading('inventoryLoading', true);
        
        // Build query parameters
        const params = new URLSearchParams();
        params.append('blood_bank_id', window.bloodBankId);
        
        // Add filters if set
        const bloodGroupFilter = document.getElementById('bloodGroupFilter')?.value;
        const componentFilter = document.getElementById('componentFilter')?.value;
        const statusFilter = document.getElementById('statusFilter')?.value;
        
        if (bloodGroupFilter) params.append('blood_group', bloodGroupFilter);
        if (componentFilter) params.append('component_type', componentFilter);
        if (statusFilter) params.append('status', statusFilter);
        
            const response = await fetch(apiPath(`/backend/api/blood_inventory.php?${params.toString()}`), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const result = await response.json();
        
        if (result.success && result.data) {
            displayInventory(result.data);
            updateInventoryStats(result.data);
        } else {
            showMessage('warning', result.message || 'No inventory found');
            displayInventory([]);
            updateInventoryStats([]);
        }
    } catch (error) {
        console.error('Error loading inventory:', error);
        showMessage('error', 'Failed to load inventory. Please try again.');
        displayInventory([]);
        updateInventoryStats([]);
    } finally {
        showLoading('inventoryLoading', false);
    }
}

/**
 * Display inventory in the table
 */
function displayInventory(inventory) {
    const inventoryTable = document.getElementById('inventoryTable');
    const emptyState = document.getElementById('emptyInventoryState');
    
    if (!inventoryTable) return;

    // Show/hide empty state
    if (emptyState) {
        emptyState.style.display = inventory.length === 0 ? 'block' : 'none';
    }

    // Clear existing rows (except header)
    while (inventoryTable.rows.length > 1) {
        inventoryTable.deleteRow(1);
    }

    // Sort inventory by expiry date (earliest first)
    inventory.sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));

    // Add inventory items to table
    inventory.forEach(item => {
        const row = inventoryTable.insertRow();
        row.className = getInventoryRowClass(item);
        row.dataset.itemId = item.id;
        
        // Calculate days until expiry
        const daysUntilExpiry = calculateDaysUntilExpiry(item.expiry_date);
        const expiryClass = getExpiryClass(daysUntilExpiry);
        
        // Format dates
        const collectionDate = new Date(item.collection_date);
        const expiryDate = new Date(item.expiry_date);
        
        const formattedCollection = collectionDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        
        const formattedExpiry = expiryDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        
        row.innerHTML = `
            <td>
                <div class="d-flex align-items-center">
                    <div class="blood-group-badge bg-${getBloodGroupColor(item.blood_group)} me-2">
                        ${item.blood_group}
                    </div>
                    <div>
                        <div class="fw-medium">${item.blood_group}</div>
                        <small class="text-muted">${item.component_type || 'Whole Blood'}</small>
                    </div>
                </div>
            </td>
            <td>
                <div class="fw-medium">${item.units_available}</div>
                <small class="text-muted">${item.volume_ml || 450} ml</small>
            </td>
            <td>
                <div>${formattedCollection}</div>
                <small class="text-muted">Donor: ${item.donor_id ? '#' + item.donor_id : 'N/A'}</small>
            </td>
            <td>
                <div>${formattedExpiry}</div>
                <small class="${expiryClass}">
                    <i class="bi bi-clock"></i> ${daysUntilExpiry} days
                </small>
            </td>
            <td>
                <span class="badge ${getInventoryStatusClass(item.status)}">
                    ${formatInventoryStatus(item.status)}
                </span>
            </td>
            <td>
                <div class="btn-group btn-group-sm" role="group">
                    <button type="button" class="btn btn-outline-primary" onclick="viewInventoryItem(${item.id})" title="View Details">
                        <i class="bi bi-eye"></i>
                    </button>
                    ${item.status === 'available' ? `
                        <button type="button" class="btn btn-outline-success" onclick="updateInventoryItem(${item.id})" title="Update">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button type="button" class="btn btn-outline-danger" onclick="deleteInventoryItem(${item.id})" title="Remove">
                            <i class="bi bi-trash"></i>
                        </button>
                    ` : ''}
                </div>
            </td>
        `;
        
        // Add click event for the entire row
        row.addEventListener('click', function(e) {
            if (!e.target.closest('button') && !e.target.closest('a')) {
                viewInventoryItem(item.id);
            }
        });
    });
}

/**
 * Update inventory statistics
 */
function updateInventoryStats(inventory) {
    const totalUnitsElement = document.getElementById('totalUnits');
    const availableUnitsElement = document.getElementById('availableUnits');
    const expiringSoonElement = document.getElementById('expiringSoon');
    const criticalStockElement = document.getElementById('criticalStock');
    
    // Calculate statistics
    let totalUnits = 0;
    let availableUnits = 0;
    let expiringSoonCount = 0;
    let criticalStockCount = 0;
    
    inventory.forEach(item => {
        totalUnits += item.units_available || 0;
        
        if (item.status === 'available') {
            availableUnits += item.units_available || 0;
        }
        
        // Check if expiring within 7 days
        const daysUntilExpiry = calculateDaysUntilExpiry(item.expiry_date);
        if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
            expiringSoonCount += item.units_available || 0;
        }
        
        // Check if critical stock
        if (item.status === 'critical') {
            criticalStockCount += item.units_available || 0;
        }
    });
    
    if (totalUnitsElement) {
        totalUnitsElement.textContent = totalUnits;
    }
    
    if (availableUnitsElement) {
        availableUnitsElement.textContent = availableUnits;
        availableUnitsElement.parentElement.querySelector('.progress-bar').style.width = `${(availableUnits / Math.max(totalUnits, 1)) * 100}%`;
    }
    
    if (expiringSoonElement) {
        expiringSoonElement.textContent = expiringSoonCount;
        expiringSoonElement.parentElement.className = `stat-card ${expiringSoonCount > 0 ? 'border-warning' : ''}`;
    }
    
    if (criticalStockElement) {
        criticalStockElement.textContent = criticalStockCount;
        criticalStockElement.parentElement.className = `stat-card ${criticalStockCount > 0 ? 'border-danger' : ''}`;
    }
    
    // Update blood group distribution
    updateBloodGroupDistribution(inventory);
}

/**
 * Update blood group distribution
 */
function updateBloodGroupDistribution(inventory) {
    const distributionContainer = document.getElementById('bloodGroupDistribution');
    if (!distributionContainer) return;
    
    // Group by blood group
    const distribution = inventory.reduce((acc, item) => {
        if (!acc[item.blood_group]) {
            acc[item.blood_group] = 0;
        }
        acc[item.blood_group] += item.units_available || 0;
        return acc;
    }, {});
    
    // Clear existing content
    distributionContainer.innerHTML = '';
    
    // Create distribution bars
    const maxUnits = Math.max(...Object.values(distribution), 1);
    
    Object.entries(distribution).forEach(([bloodGroup, units]) => {
        const percentage = (units / maxUnits) * 100;
        
        const barContainer = document.createElement('div');
        barContainer.className = 'mb-2';
        barContainer.innerHTML = `
            <div class="d-flex justify-content-between mb-1">
                <span class="fw-medium">${bloodGroup}</span>
                <span class="text-muted">${units} units</span>
            </div>
            <div class="progress" style="height: 8px;">
                <div class="progress-bar bg-${getBloodGroupColor(bloodGroup)}" 
                     role="progressbar" 
                     style="width: ${percentage}%"
                     aria-valuenow="${units}" 
                     aria-valuemin="0" 
                     aria-valuemax="${maxUnits}">
                </div>
            </div>
        `;
        
        distributionContainer.appendChild(barContainer);
    });
}

/**
 * View inventory item details
 */
async function viewInventoryItem(itemId) {
    try {
        const response = await fetch(apiPath(`/backend/api/blood_inventory.php?id=${itemId}`), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const result = await response.json();
        
        if (result.success && result.data) {
            showInventoryItemModal(result.data);
        } else {
            showMessage('error', 'Failed to load inventory item details');
        }
    } catch (error) {
        console.error('Error loading inventory item:', error);
        showMessage('error', 'Network error. Please try again.');
    }
}

/**
 * Show inventory item modal
 */
function showInventoryItemModal(item) {
    const modal = new bootstrap.Modal(document.getElementById('inventoryItemModal'));
    const modalBody = document.getElementById('inventoryItemBody');
    
    if (!modalBody) return;
    
    // Format dates
    const collectionDate = new Date(item.collection_date);
    const expiryDate = new Date(item.expiry_date);
    
    const formattedCollection = collectionDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const formattedExpiry = expiryDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Calculate days until expiry
    const daysUntilExpiry = calculateDaysUntilExpiry(item.expiry_date);
    
    modalBody.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <h6>Blood Information</h6>
                <p><strong>Blood Group:</strong> 
                    <span class="badge bg-${getBloodGroupColor(item.blood_group)}">
                        ${item.blood_group}
                    </span>
                </p>
                <p><strong>Component Type:</strong> ${item.component_type || 'Whole Blood'}</p>
                <p><strong>Units Available:</strong> ${item.units_available}</p>
                <p><strong>Volume:</strong> ${item.volume_ml || 450} ml</p>
                <p><strong>Blood Bag ID:</strong> ${item.blood_bag_id || 'N/A'}</p>
            </div>
            <div class="col-md-6">
                <h6>Status & Dates</h6>
                <p><strong>Status:</strong> 
                    <span class="badge ${getInventoryStatusClass(item.status)}">
                        ${formatInventoryStatus(item.status)}
                    </span>
                </p>
                <p><strong>Collection Date:</strong> ${formattedCollection}</p>
                <p><strong>Expiry Date:</strong> ${formattedExpiry}</p>
                <p><strong>Days Until Expiry:</strong> 
                    <span class="${getExpiryClass(daysUntilExpiry)}">
                        ${daysUntilExpiry} days
                    </span>
                </p>
                <p><strong>Storage Location:</strong> ${item.storage_location || 'Main Storage'}</p>
            </div>
        </div>
        
        <div class="row mt-3">
            <div class="col-md-6">
                <h6>Donor Information</h6>
                <p><strong>Donor ID:</strong> ${item.donor_id || 'N/A'}</p>
                ${item.donor_name ? `<p><strong>Donor Name:</strong> ${item.donor_name}</p>` : ''}
                ${item.donation_id ? `<p><strong>Donation ID:</strong> ${item.donation_id}</p>` : ''}
            </div>
            <div class="col-md-6">
                <h6>Testing Information</h6>
                <p><strong>Screening Status:</strong> ${item.screening_status || 'Not Screened'}</p>
                ${item.test_results ? `<p><strong>Test Results:</strong> ${item.test_results}</p>` : ''}
                ${item.notes ? `<p><strong>Notes:</strong> ${item.notes}</p>` : ''}
            </div>
        </div>
        
        ${item.reserved_for ? `
            <div class="row mt-3">
                <div class="col-12">
                    <h6>Reservation Information</h6>
                    <div class="alert alert-info">
                        <p><strong>Reserved For:</strong> ${item.reserved_for}</p>
                        ${item.reservation_notes ? `<p><strong>Notes:</strong> ${item.reservation_notes}</p>` : ''}
                    </div>
                </div>
            </div>
        ` : ''}
    `;
    
    modal.show();
}

/**
 * Update inventory item
 */
async function updateInventoryItem(itemId) {
    // Load item data first
    try {
        const response = await fetch(apiPath(`/backend/api/blood_inventory.php?id=${itemId}`), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const result = await response.json();
        
        if (result.success && result.data) {
            showUpdateModal(result.data);
        } else {
            showMessage('error', 'Failed to load item for update');
        }
    } catch (error) {
        console.error('Error loading item for update:', error);
        showMessage('error', 'Network error. Please try again.');
    }
}

/**
 * Show update modal with pre-filled data
 */
function showUpdateModal(item) {
    const modal = new bootstrap.Modal(document.getElementById('updateInventoryModal'));
    
    // Pre-fill form with item data
    document.getElementById('updateBloodGroup').value = item.blood_group;
    document.getElementById('updateComponentType').value = item.component_type || 'Whole Blood';
    document.getElementById('updateUnitsAvailable').value = item.units_available;
    document.getElementById('updateVolume').value = item.volume_ml || 450;
    document.getElementById('updateCollectionDate').value = item.collection_date.split('T')[0];
    document.getElementById('updateExpiryDate').value = item.expiry_date.split('T')[0];
    document.getElementById('updateStatus').value = item.status;
    document.getElementById('updateStorageLocation').value = item.storage_location || '';
    document.getElementById('updateScreeningStatus').value = item.screening_status || 'negative';
    document.getElementById('updateTestResults').value = item.test_results || '';
    document.getElementById('updateNotes').value = item.notes || '';
    
    // Set item ID in form
    document.getElementById('updateInventoryForm').dataset.itemId = item.id;
    
    modal.show();
}

/**
 * Delete inventory item
 */
async function deleteInventoryItem(itemId) {
    if (!confirm('Are you sure you want to remove this inventory item? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await fetch(apiPath(`/backend/api/blood_inventory.php?id=${itemId}`), {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const result = await response.json();
        
        if (result.success) {
            showMessage('success', 'Inventory item removed successfully!');
            loadInventory(); // Refresh inventory
        } else {
            showMessage('error', result.message || 'Failed to remove inventory item');
        }
    } catch (error) {
        console.error('Error deleting inventory item:', error);
        showMessage('error', 'Network error. Please try again.');
    }
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

    // Refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadInventory);
    }

    // Filter buttons
    const applyFiltersBtn = document.getElementById('applyFiltersBtn');
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', loadInventory);
    }

    const clearFiltersBtn = document.getElementById('clearFiltersBtn');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearFilters);
    }

    // Add new inventory button
    const addInventoryBtn = document.getElementById('addInventoryBtn');
    if (addInventoryBtn) {
        addInventoryBtn.addEventListener('click', showAddModal);
    }

    // Export button
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportInventory);
    }

    // Quick add buttons
    document.querySelectorAll('.quick-add-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const bloodGroup = this.getAttribute('data-blood-group');
            setupQuickAdd(bloodGroup);
        });
    });
}

/**
 * Setup modal events
 */
function setupModalEvents() {
    // Add inventory modal
    const addModal = document.getElementById('addInventoryModal');
    if (addModal) {
        addModal.addEventListener('hidden.bs.modal', resetAddForm);
        
        const addForm = document.getElementById('addInventoryForm');
        if (addForm) {
            addForm.addEventListener('submit', addInventoryItem);
        }
    }

    // Update inventory modal
    const updateModal = document.getElementById('updateInventoryModal');
    if (updateModal) {
        updateModal.addEventListener('hidden.bs.modal', function() {
            delete document.getElementById('updateInventoryForm').dataset.itemId;
        });
        
        const updateForm = document.getElementById('updateInventoryForm');
        if (updateForm) {
            updateForm.addEventListener('submit', updateInventoryFormSubmit);
        }
    }
}

/**
 * Clear all filters
 */
function clearFilters() {
    document.getElementById('bloodGroupFilter').value = '';
    document.getElementById('componentFilter').value = '';
    document.getElementById('statusFilter').value = '';
    document.getElementById('expiryFilter').value = '';
    document.getElementById('collectionFilter').value = '';
    
    loadInventory();
}

/**
 * Show add inventory modal
 */
function showAddModal() {
    resetAddForm();
    
    const modal = new bootstrap.Modal(document.getElementById('addInventoryModal'));
    modal.show();
}

/**
 * Setup quick add for specific blood group
 */
function setupQuickAdd(bloodGroup) {
    showAddModal();
    
    // Pre-fill blood group
    document.getElementById('bloodGroup').value = bloodGroup;
    
    // Set default expiry (42 days from today)
    const today = new Date();
    const defaultExpiry = new Date(today);
    defaultExpiry.setDate(defaultExpiry.getDate() + 42);
    document.getElementById('expiryDate').value = defaultExpiry.toISOString().split('T')[0];
    
    showMessage('info', `Quick add setup for ${bloodGroup} blood. Please fill in remaining details.`);
}

/**
 * Add new inventory item
 */
async function addInventoryItem(e) {
    e.preventDefault();
    
    // Collect form data
    const formData = {
        blood_bank_id: window.bloodBankId,
        blood_group: document.getElementById('bloodGroup').value,
        component_type: document.getElementById('componentType').value,
        units_available: parseInt(document.getElementById('unitsAvailable').value),
        volume_ml: parseInt(document.getElementById('volume').value),
        collection_date: document.getElementById('collectionDate').value + 'T00:00:00',
        expiry_date: document.getElementById('expiryDate').value + 'T23:59:59',
        donor_id: document.getElementById('donorId').value ? parseInt(document.getElementById('donorId').value) : null,
        donation_id: document.getElementById('donationId').value ? parseInt(document.getElementById('donationId').value) : null,
        storage_location: document.getElementById('storageLocation').value.trim(),
        screening_status: document.getElementById('screeningStatus').value,
        test_results: document.getElementById('testResults').value.trim(),
        notes: document.getElementById('notes').value.trim()
    };
    
    // Validation
    if (!formData.blood_group) {
        showMessage('error', 'Please select blood group');
        return;
    }
    
    if (formData.units_available < 1) {
        showMessage('error', 'Units available must be at least 1');
        return;
    }
    
    if (formData.volume_ml < 100) {
        showMessage('error', 'Volume must be at least 100ml');
        return;
    }
    
    // Validate expiry date is after collection date
    const collectionDate = new Date(formData.collection_date);
    const expiryDate = new Date(formData.expiry_date);
    if (expiryDate <= collectionDate) {
        showMessage('error', 'Expiry date must be after collection date');
        return;
    }

    try {
        showLoading('addLoading', true);
        
        const response = await fetch(apiPath('/backend/api/blood_inventory.php'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();
        
        if (result.success) {
            showMessage('success', 'Inventory item added successfully!');
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('addInventoryModal'));
            modal.hide();
            
            // Refresh inventory
            loadInventory();
        } else {
            showMessage('error', result.message || 'Failed to add inventory item');
        }
    } catch (error) {
        console.error('Error adding inventory item:', error);
        showMessage('error', 'Network error. Please try again.');
    } finally {
        showLoading('addLoading', false);
    }
}

/**
 * Update inventory item form submission
 */
async function updateInventoryFormSubmit(e) {
    e.preventDefault();
    
    const form = document.getElementById('updateInventoryForm');
    const itemId = form.dataset.itemId;
    
    if (!itemId) {
        showMessage('error', 'Item ID not found');
        return;
    }
    
    // Collect form data
    const formData = {
        id: parseInt(itemId),
        blood_group: document.getElementById('updateBloodGroup').value,
        component_type: document.getElementById('updateComponentType').value,
        units_available: parseInt(document.getElementById('updateUnitsAvailable').value),
        volume_ml: parseInt(document.getElementById('updateVolume').value),
        collection_date: document.getElementById('updateCollectionDate').value + 'T00:00:00',
        expiry_date: document.getElementById('updateExpiryDate').value + 'T23:59:59',
        status: document.getElementById('updateStatus').value,
        storage_location: document.getElementById('updateStorageLocation').value.trim(),
        screening_status: document.getElementById('updateScreeningStatus').value,
        test_results: document.getElementById('updateTestResults').value.trim(),
        notes: document.getElementById('updateNotes').value.trim()
    };
    
    // Validation
    if (formData.units_available < 0) {
        showMessage('error', 'Units available cannot be negative');
        return;
    }
    
    if (formData.volume_ml < 100) {
        showMessage('error', 'Volume must be at least 100ml');
        return;
    }

    try {
        showLoading('updateLoading', true);
        
        const response = await fetch(apiPath('/backend/api/blood_inventory.php'), {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();
        
        if (result.success) {
            showMessage('success', 'Inventory item updated successfully!');
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('updateInventoryModal'));
            modal.hide();
            
            // Refresh inventory
            loadInventory();
        } else {
            showMessage('error', result.message || 'Failed to update inventory item');
        }
    } catch (error) {
        console.error('Error updating inventory item:', error);
        showMessage('error', 'Network error. Please try again.');
    } finally {
        showLoading('updateLoading', false);
    }
}

/**
 * Export inventory to CSV
 */
function exportInventory() {
    showMessage('info', 'Export feature would generate a CSV file of inventory');
    
    // In a real implementation, this would:
    // 1. Fetch all inventory data
    // 2. Convert to CSV format
    // 3. Create download link
}

/**
 * Reset add form
 */
function resetAddForm() {
    const form = document.getElementById('addInventoryForm');
    if (form) {
        form.reset();
        
        // Reset to defaults
        document.getElementById('unitsAvailable').value = 1;
        document.getElementById('volume').value = 450;
        
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('collectionDate').value = today;
        
        const defaultExpiry = new Date();
        defaultExpiry.setDate(defaultExpiry.getDate() + 42);
        document.getElementById('expiryDate').value = defaultExpiry.toISOString().split('T')[0];
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
    const existingMessages = document.querySelectorAll('.global-alert');
    existingMessages.forEach(msg => msg.remove());
    
    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.className = `global-alert alert alert-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'info'} alert-dismissible fade show mt-3`;
    messageDiv.role = 'alert';
    messageDiv.innerHTML = `
        ${text}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Add to page
    const container = document.querySelector('.container') || document.body;
    container.insertBefore(messageDiv, container.firstChild);
    
    // Auto-remove after 5 seconds (except success messages)
    if (type !== 'success') {
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    }
}

/**
 * Calculate days until expiry
 */
function calculateDaysUntilExpiry(expiryDate) {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffMs = expiry - now;
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Get CSS class for expiry
 */
function getExpiryClass(days) {
    if (days <= 0) return 'text-danger';
    if (days <= 3) return 'text-danger';
    if (days <= 7) return 'text-warning';
    if (days <= 14) return 'text-info';
    return 'text-success';
}

/**
 * Get CSS class for inventory row
 */
function getInventoryRowClass(item) {
    const daysUntilExpiry = calculateDaysUntilExpiry(item.expiry_date);
    
    if (daysUntilExpiry <= 0) return 'table-danger';
    if (daysUntilExpiry <= 3) return 'table-danger';
    if (daysUntilExpiry <= 7) return 'table-warning';
    if (item.status === 'critical') return 'table-danger';
    if (item.status === 'low') return 'table-warning';
    if (item.status === 'reserved') return 'table-info';
    return '';
}

/**
 * Get CSS class for blood group
 */
function getBloodGroupColor(bloodGroup) {
    const colorMap = {
        'A+': 'primary',
        'A-': 'info',
        'B+': 'success',
        'B-': 'secondary',
        'AB+': 'warning',
        'AB-': 'dark',
        'O+': 'danger',
        'O-': 'light'
    };
    return colorMap[bloodGroup] || 'primary';
}

/**
 * Get CSS class for inventory status
 */
function getInventoryStatusClass(status) {
    const statusMap = {
        'available': 'bg-success',
        'reserved': 'bg-primary',
        'expired': 'bg-danger',
        'transfused': 'bg-info',
        'quarantined': 'bg-warning',
        'critical': 'bg-danger',
        'low': 'bg-warning',
        'adequate': 'bg-success',
        'high': 'bg-info'
    };
    return statusMap[status?.toLowerCase()] || 'bg-secondary';
}

/**
 * Format inventory status for display
 */
function formatInventoryStatus(status) {
    const statusMap = {
        'available': 'Available',
        'reserved': 'Reserved',
        'expired': 'Expired',
        'transfused': 'Transfused',
        'quarantined': 'Quarantined',
        'critical': 'Critical',
        'low': 'Low',
        'adequate': 'Adequate',
        'high': 'High'
    };
    return statusMap[status?.toLowerCase()] || status || 'Unknown';
}

// Export for testing if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadInventory,
        displayInventory,
        updateInventoryStats,
        calculateDaysUntilExpiry,
        getExpiryClass,
        getBloodGroupColor,
        getInventoryStatusClass,
        formatInventoryStatus
    };
}