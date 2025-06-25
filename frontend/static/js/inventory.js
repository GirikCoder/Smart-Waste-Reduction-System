// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Shared data management functions
function getSharedData() {
    const data = localStorage.getItem('warehouseData');
    if (data) {
        const parsed = JSON.parse(data);
        return {
            stock: parsed.stock || [],
            orders: parsed.orders || []
        };
    }
    return {
        stock: [],
        orders: []
    };
}

function saveSharedData(data) {
    localStorage.setItem('warehouseData', JSON.stringify(data));
}

function updateStockData(newStockData) {
    const sharedData = getSharedData();
    sharedData.stock = newStockData;
    saveSharedData(sharedData);
    inventoryData = newStockData;
}

function addOrderToTracker(orderData) {
    const sharedData = getSharedData();
    const newOrder = {
        orderId: generateOrderId(),
        itemId: orderData.itemId,
        itemName: orderData.itemName,
        itemType: orderData.itemType,
        price: orderData.price,
        quantity: orderData.quantity,
        supplier: orderData.supplier,
        orderDate: new Date().toISOString().split('T')[0],
        deliveryDate: orderData.deliveryDate,
        status: 'pending',
        priority: orderData.priority || 'normal'
    };
    
    sharedData.orders.unshift(newOrder);
    saveSharedData(sharedData);
    return newOrder.orderId;
}

function generateOrderId() {
    const timestamp = Date.now().toString().slice(-6);
    return `ORD${timestamp}`;
}

// Global variables
let inventoryData = [];
let currentModal = null;
let currentItem = null;

// Initialize application
function initializeApp() {
    // Load shared data
    const sharedData = getSharedData();
    inventoryData = sharedData.stock;
    
    renderInventoryTable();
    updateStats();
    setupEventListeners();
}

// Setup event listeners
function setupEventListeners() {
    // Mobile menu toggle
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }

    // Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }

    // Filter functionality
    const typeFilter = document.getElementById('typeFilter');
    const statusFilter = document.getElementById('statusFilter');
    if (typeFilter) {
        typeFilter.addEventListener('change', handleFilter);
    }
    if (statusFilter) {
        statusFilter.addEventListener('change', handleFilter);
    }

    // Modal overlay click to close
    const modalOverlay = document.getElementById('modalOverlay');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', function(e) {
            if (e.target === modalOverlay) {
                closeModal();
            }
        });
    }
}

// Render inventory table
function renderInventoryTable() {
    const tbody = document.getElementById('inventoryTableBody');
    if (!tbody) return;

    // Sort by expiry date (nearest first)
    const sortedData = [...inventoryData].sort((a, b) => {
        return new Date(a.expiryDate) - new Date(b.expiryDate);
    });

    tbody.innerHTML = sortedData.map(item => {
        const expiryInfo = getExpiryInfo(item.expiryDate);
        const quantityClass = item.quantity <= 10 ? 'quantity-low' : 'quantity-normal';
        
        return `
            <tr data-item-id="${item.id}">
                <td><strong>${item.id}</strong></td>
                <td>${item.name}</td>
                <td><span class="type-badge">${formatType(item.type)}</span></td>
                <td><strong>$${item.price.toFixed(2)}</strong></td>
                <td>
                    <div class="expiry-date">
                        <div class="expiry-main ${expiryInfo.class}">
                            <span class="expiry-icon">${expiryInfo.icon}</span>
                            ${formatDate(item.expiryDate)}
                        </div>
                        <div class="expiry-status ${expiryInfo.class}">
                            ${expiryInfo.status}
                        </div>
                    </div>
                </td>
                <td><span class="${quantityClass}">${item.quantity}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn reorder" onclick="openReorderModal('${item.id}')">
                            Reorder
                        </button>
                        <button class="action-btn discard" onclick="openDiscardModal('${item.id}')">
                            Discard
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Get expiry information with 4-tier color system
function getExpiryInfo(expiryDate) {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        // Expired - Red
        return {
            status: 'Expired',
            class: 'expiry-expired',
            icon: '⚠'
        };
    } else if (diffDays <= 7) {
        // Less than 7 days - Orange
        return {
            status: `${diffDays} days left`,
            class: 'expiry-critical',
            icon: '⚠'
        };
    } else if (diffDays <= 15) {
        // 8-15 days - Yellow
        return {
            status: `${diffDays} days left`,
            class: 'expiry-warning',
            icon: '⏰'
        };
    } else {
        // More than 15 days - Green
        return {
            status: `${diffDays} days left`,
            class: 'expiry-good',
            icon: '✓'
        };
    }
}

// Format item type
function formatType(type) {
    const typeMap = {
        'produce': 'Produce',
        'canned-goods': 'Canned Goods',
        'meat': 'Meat',
        'bakery': 'Bakery',
        'snacks': 'Snacks',
        'dairy': 'Dairy',
        'electronics': 'Electronics',
        'clothing': 'Clothing',
        'medicine': 'Medicine'
    };
    return typeMap[type] || type.charAt(0).toUpperCase() + type.slice(1);
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

// Update statistics
function updateStats() {
    const totalItems = inventoryData.length;
    let expiredItems = 0;
    let expiringItems = 0;
    let lowStockItems = 0;

    const today = new Date();

    inventoryData.forEach(item => {
        const expiry = new Date(item.expiryDate);
        const diffTime = expiry - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            expiredItems++;
        } else if (diffDays <= 7) {
            expiringItems++;
        }

        if (item.quantity <= 10) {
            lowStockItems++;
        }
    });

    document.getElementById('totalItems').textContent = totalItems;
    document.getElementById('expiredItems').textContent = expiredItems;
    document.getElementById('expiringItems').textContent = expiringItems;
    document.getElementById('lowStockItems').textContent = lowStockItems;
}

// Open reorder modal
function openReorderModal(itemId) {
    const item = inventoryData.find(item => item.id === itemId);
    if (!item) return;

    currentItem = item;
    currentModal = 'reorder';

    // Hide all modals first
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });

    // Show overlay and reorder modal
    const overlay = document.getElementById('modalOverlay');
    const modal = document.getElementById('reorderModal');
    
    overlay.classList.add('show');
    modal.style.display = 'block';

    // Populate form
    document.getElementById('reorderItemName').value = item.name;
    document.getElementById('reorderCurrentStock').value = item.quantity;
    document.getElementById('reorderQty').value = '';
    document.getElementById('reorderSupplier').value = item.supplier === 'supplier1' ? 'Supplier A' : 
                                                      item.supplier === 'supplier2' ? 'Supplier B' : 'Supplier C';
    document.getElementById('reorderDelivery').value = '';
    document.getElementById('reorderPriority').value = 'normal';

    // Default to 1 week from now for delivery
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    document.getElementById('reorderDelivery').value = nextWeek.toISOString().split('T')[0];
}

// Open discard modal
function openDiscardModal(itemId) {
    const item = inventoryData.find(item => item.id === itemId);
    if (!item) return;

    currentItem = item;
    currentModal = 'discard';

    // Hide all modals first
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });

    // Show overlay and discard modal
    const overlay = document.getElementById('modalOverlay');
    const modal = document.getElementById('discardModal');
    
    overlay.classList.add('show');
    modal.style.display = 'block';

    // Populate form
    document.getElementById('discardItemName').value = item.name;
    document.getElementById('discardAvailableQty').value = item.quantity;
    document.getElementById('discardQty').value = '';
    document.getElementById('discardReason').value = '';
    document.getElementById('discardNotes').value = '';

    // Set max quantity
    document.getElementById('discardQty').setAttribute('max', item.quantity);
}

// Close modal
function closeModal() {
    const overlay = document.getElementById('modalOverlay');
    overlay.classList.remove('show');
    
    setTimeout(() => {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }, 200);

    currentModal = null;
    currentItem = null;
}

// Process reorder action
function processReorder() {
    const qty = parseInt(document.getElementById('reorderQty').value);
    const supplier = document.getElementById('reorderSupplier').value;
    const delivery = document.getElementById('reorderDelivery').value;
    const priority = document.getElementById('reorderPriority').value;

    if (!qty || qty <= 0) {
        showMessage('Please enter a valid quantity to reorder', 'error');
        return;
    }

    if (!supplier) {
        showMessage('Please select a supplier', 'error');
        return;
    }

    if (!delivery) {
        showMessage('Please select expected delivery date', 'error');
        return;
    }

    // Create order data for tracking
    const orderData = {
        itemId: currentItem.id,
        itemName: currentItem.name,
        itemType: currentItem.type,
        price: currentItem.price,
        quantity: qty,
        supplier: supplier,
        deliveryDate: delivery,
        priority: priority
    };

    // Add to track orders
    const orderId = addOrderToTracker(orderData);

    showMessage(`Reorder placed: ${qty} units of ${currentItem.name} (Order ID: ${orderId})`, 'success');
    closeModal();
}

// Process discard action
function processDiscard() {
    const qty = parseInt(document.getElementById('discardQty').value);
    const reason = document.getElementById('discardReason').value;

    if (!qty || qty <= 0 || qty > currentItem.quantity) {
        showMessage('Please enter a valid quantity', 'error');
        return;
    }

    if (!reason) {
        showMessage('Please select a reason for discard', 'error');
        return;
    }

    // Update inventory quantity
    const itemIndex = inventoryData.findIndex(item => item.id === currentItem.id);
    if (itemIndex !== -1) {
        inventoryData[itemIndex].quantity -= qty;
        
        // Remove item if quantity reaches 0
        if (inventoryData[itemIndex].quantity <= 0) {
            inventoryData.splice(itemIndex, 1);
        }
    }

    // Update shared data
    updateStockData(inventoryData);

    showMessage(`Successfully discarded ${qty} units of ${currentItem.name}`, 'success');
    closeModal();
    renderInventoryTable();
    updateStats();
}

// Handle search
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    filterTable(searchTerm, document.getElementById('typeFilter').value, document.getElementById('statusFilter').value);
}

// Handle filter
function handleFilter(e) {
    const typeFilter = document.getElementById('typeFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    filterTable(document.getElementById('searchInput').value.toLowerCase(), typeFilter, statusFilter);
}

// Filter table
function filterTable(searchTerm, typeFilter, statusFilter) {
    const rows = document.querySelectorAll('#inventoryTableBody tr');
    
    rows.forEach(row => {
        const itemId = row.getAttribute('data-item-id');
        const item = inventoryData.find(item => item.id === itemId);
        
        if (!item) {
            row.style.display = 'none';
            return;
        }

        const matchesSearch = !searchTerm || 
            item.name.toLowerCase().includes(searchTerm) ||
            item.id.toLowerCase().includes(searchTerm) ||
            item.type.toLowerCase().includes(searchTerm);

        const matchesType = !typeFilter || item.type === typeFilter;

        let matchesStatus = true;
        if (statusFilter) {
            const today = new Date();
            const expiry = new Date(item.expiryDate);
            const diffTime = expiry - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            switch (statusFilter) {
                case 'expired':
                    matchesStatus = diffDays < 0;
                    break;
                case 'expiring':
                    matchesStatus = diffDays >= 0 && diffDays <= 7;
                    break;
                case 'low-stock':
                    matchesStatus = item.quantity <= 10;
                    break;
                case 'good':
                    matchesStatus = diffDays > 15 && item.quantity > 10;
                    break;
            }
        }

        row.style.display = (matchesSearch && matchesType && matchesStatus) ? '' : 'none';
    });
}

// Show message
function showMessage(text, type = 'info') {
    const container = document.getElementById('messageContainer');
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;
    
    container.appendChild(message);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        if (message.parentNode) {
            message.parentNode.removeChild(message);
        }
    }, 4000);
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Escape key to close modal
    if (e.key === 'Escape' && currentModal) {
        closeModal();
    }
    
    // Ctrl/Cmd + F to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.focus();
        }
    }
});

// Export function for external use
window.inventoryManager = {
    getInventory: function() {
        return [...inventoryData];
    },
    updateItem: function(itemId, updates) {
        const index = inventoryData.findIndex(item => item.id === itemId);
        if (index !== -1) {
            inventoryData[index] = { ...inventoryData[index], ...updates };
            updateStockData(inventoryData);
            renderInventoryTable();
            updateStats();
        }
    }
};