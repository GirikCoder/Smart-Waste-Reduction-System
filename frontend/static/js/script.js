// Sample stock data with updated types to match the image
let stockData = [
    {
        id: 'ITM016',
        name: 'Tomatoes',
        type: 'produce',
        price: 54.32,
        expiryDate: '2025-01-02',
        quantity: 96,
        supplier: 'supplier1'
    },
    {
        id: 'ITM023',
        name: 'Beans',
        type: 'canned-goods',
        price: 12.26,
        expiryDate: '2025-01-02',
        quantity: 61,
        supplier: 'supplier2'
    },
    {
        id: 'ITM018',
        name: 'Chicken Breast',
        type: 'meat',
        price: 14.05,
        expiryDate: '2025-01-06',
        quantity: 95,
        supplier: 'supplier3'
    },
    {
        id: 'ITM005',
        name: 'Bagels',
        type: 'bakery',
        price: 12.26,
        expiryDate: '2025-01-10',
        quantity: 9,
        supplier: 'supplier1'
    },
    {
        id: 'ITM010',
        name: 'Crackers',
        type: 'snacks',
        price: 19.34,
        expiryDate: '2025-01-13',
        quantity: 47,
        supplier: 'supplier2'
    },
    {
        id: 'ITM001',
        name: 'Fresh Milk',
        type: 'dairy',
        price: 4.99,
        expiryDate: '2025-01-20',
        quantity: 25,
        supplier: 'supplier1'
    },
    {
        id: 'ITM002',
        name: 'Organic Yogurt',
        type: 'dairy',
        price: 6.50,
        expiryDate: '2025-02-05',
        quantity: 15,
        supplier: 'supplier2'
    },
    {
        id: 'ITM003',
        name: 'Smartphone X',
        type: 'electronics',
        price: 899.99,
        expiryDate: '2026-12-31',
        quantity: 8,
        supplier: 'supplier3'
    }
];

// Global variables
let currentModal = null;
let currentItem = null;

// Shared data management functions
function getSharedData() {
    const data = localStorage.getItem('warehouseData');
    if (data) {
        const parsed = JSON.parse(data);
        return {
            stock: parsed.stock || stockData,
            orders: parsed.orders || []
        };
    }
    return {
        stock: stockData,
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
    stockData = newStockData;
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

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Initialize application
function initializeApp() {
    // Load shared data
    const sharedData = getSharedData();
    stockData = sharedData.stock;
    
    renderTable();
    setupEventListeners();
    
    // Auto-refresh every 30 seconds
    setInterval(renderTable, 30000);
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
    if (typeFilter) {
        typeFilter.addEventListener('change', handleFilter);
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

    // Price calculation for reduce price modal
    const reduceNewPrice = document.getElementById('reduceNewPrice');
    const reduceCurrentPrice = document.getElementById('reduceCurrentPrice');
    const reduceDiscountPercent = document.getElementById('reduceDiscountPercent');
    
    if (reduceNewPrice && reduceCurrentPrice && reduceDiscountPercent) {
        reduceNewPrice.addEventListener('input', function() {
            const currentPrice = parseFloat(reduceCurrentPrice.value) || 0;
            const newPrice = parseFloat(this.value) || 0;
            
            if (currentPrice > 0 && newPrice > 0) {
                const discount = ((currentPrice - newPrice) / currentPrice * 100).toFixed(1);
                reduceDiscountPercent.value = `${discount}%`;
            } else {
                reduceDiscountPercent.value = '';
            }
        });
    }
}

// Render stock table
function renderTable() {
    const tbody = document.getElementById('stockTableBody');
    if (!tbody) return;

    // Sort by expiry date (nearest first)
    const sortedData = [...stockData].sort((a, b) => {
        return new Date(a.expiryDate) - new Date(b.expiryDate);
    });

    tbody.innerHTML = sortedData.map(item => {
        const expiryInfo = getExpiryInfo(item.expiryDate);
        const quantityClass = item.quantity <= 10 ? 'quantity-low' : 'quantity-normal';
        const suggestedActions = getSuggestedActions(item);
        
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
                    <div class="suggestions-container">
                        <div class="suggestions-dropdown">
                            <button class="dropdown-btn" onclick="toggleDropdown('${item.id}')">
                                Select Action
                                <span class="dropdown-arrow">▼</span>
                            </button>
                            <div class="dropdown-content" id="dropdown-${item.id}">
                                ${suggestedActions.map(action => 
                                    `<button class="dropdown-item ${action.toLowerCase().replace(' ', '-')}" onclick="openModal('${action.toLowerCase().replace(' ', '-')}', '${item.id}')">
                                        ${action}
                                    </button>`
                                ).join('')}
                            </div>
                        </div>
                        <div class="action-tags">
                            ${suggestedActions.slice(0, 3).map(action => 
                                `<span class="action-tag ${action.toLowerCase().replace(' ', '-')}">${action}</span>`
                            ).join('')}
                        </div>
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

// Get suggested actions based on item properties
function getSuggestedActions(item) {
    const today = new Date();
    const expiry = new Date(item.expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let actions = [];
    
    // Always include reorder
    actions.push('Reorder');
    
    // If expired or near expiry
    if (diffDays <= 0) {
        actions.unshift('Discard');
        if (['produce', 'dairy', 'meat', 'bakery'].includes(item.type)) {
            actions.unshift('Donate');
        }
    } else if (diffDays <= 7) {
        if (['produce', 'dairy', 'meat', 'bakery'].includes(item.type)) {
            actions.unshift('Donate');
        }
        actions.unshift('Reduce Price');
    } else if (diffDays <= 15) {
        actions.unshift('Reduce Price');
    } else if (item.price > 50) {
        actions.unshift('Reduce Price');
    }
    
    // If low quantity
    if (item.quantity <= 10) {
        if (!actions.includes('Reorder')) {
            actions.unshift('Reorder');
        }
    }
    
    return actions;
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

// Toggle dropdown
function toggleDropdown(itemId) {
    // Close all other dropdowns
    document.querySelectorAll('.dropdown-content').forEach(dropdown => {
        if (dropdown.id !== `dropdown-${itemId}`) {
            dropdown.classList.remove('show');
        }
    });
    
    // Close all dropdown buttons
    document.querySelectorAll('.dropdown-btn').forEach(btn => {
        if (!btn.onclick.toString().includes(itemId)) {
            btn.classList.remove('active');
        }
    });

    // Toggle current dropdown
    const dropdown = document.getElementById(`dropdown-${itemId}`);
    const button = event.target.closest('.dropdown-btn');
    
    if (dropdown) {
        dropdown.classList.toggle('show');
        button.classList.toggle('active');
    }
}

// Close all dropdowns when clicking outside
document.addEventListener('click', function(e) {
    if (!e.target.closest('.suggestions-dropdown')) {
        document.querySelectorAll('.dropdown-content').forEach(dropdown => {
            dropdown.classList.remove('show');
        });
        document.querySelectorAll('.dropdown-btn').forEach(btn => {
            btn.classList.remove('active');
        });
    }
});

// Open modal
function openModal(type, itemId) {
    const item = stockData.find(item => item.id === itemId);
    if (!item) return;

    currentItem = item;
    currentModal = type;

    // Close all dropdowns
    document.querySelectorAll('.dropdown-content').forEach(dropdown => {
        dropdown.classList.remove('show');
    });
    document.querySelectorAll('.dropdown-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Hide all modals first
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });

    // Show overlay
    const overlay = document.getElementById('modalOverlay');
    overlay.classList.add('show');

    // Setup modal based on type
    switch (type) {
        case 'donate':
            setupDonateModal(item);
            break;
        case 'discard':
            setupDiscardModal(item);
            break;
        case 'reduce-price':
            setupReducePriceModal(item);
            break;
        case 'reorder':
            setupReorderModal(item);
            break;
    }
}

// Setup donate modal
function setupDonateModal(item) {
    const modal = document.getElementById('donateModal');
    modal.style.display = 'block';

    document.getElementById('donateItemName').value = item.name;
    document.getElementById('donateAvailableQty').value = item.quantity;
    document.getElementById('donateQty').value = '';
    document.getElementById('donateOrg').value = '';
    document.getElementById('donateReason').value = '';

    // Set max quantity
    document.getElementById('donateQty').setAttribute('max', item.quantity);
}

// Setup discard modal
function setupDiscardModal(item) {
    const modal = document.getElementById('discardModal');
    modal.style.display = 'block';

    document.getElementById('discardItemName').value = item.name;
    document.getElementById('discardAvailableQty').value = item.quantity;
    document.getElementById('discardQty').value = '';
    document.getElementById('discardReason').value = '';
    document.getElementById('discardNotes').value = '';

    // Set max quantity
    document.getElementById('discardQty').setAttribute('max', item.quantity);
}

// Setup reduce price modal
function setupReducePriceModal(item) {
    const modal = document.getElementById('reducePriceModal');
    modal.style.display = 'block';

    document.getElementById('reduceItemName').value = item.name;
    document.getElementById('reduceCurrentPrice').value = item.price.toFixed(2);
    document.getElementById('reduceNewPrice').value = '';
    document.getElementById('reduceDiscountPercent').value = '';
    document.getElementById('reduceValidUntil').value = '';
    document.getElementById('reduceSaleQty').value = '';

    // Set max quantity
    document.getElementById('reduceSaleQty').setAttribute('max', item.quantity);

    // Default to tomorrow for valid until
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('reduceValidUntil').value = tomorrow.toISOString().split('T')[0];
}

// Setup reorder modal
function setupReorderModal(item) {
    const modal = document.getElementById('reorderModal');
    modal.style.display = 'block';

    document.getElementById('reorderItemName').value = item.name;
    document.getElementById('reorderCurrentStock').value = item.quantity;
    document.getElementById('reorderQty').value = '';
    document.getElementById('reorderSupplier').value = item.supplier || '';
    document.getElementById('reorderDelivery').value = '';
    document.getElementById('reorderPriority').value = 'normal';

    // Default to 1 week from now for delivery
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    document.getElementById('reorderDelivery').value = nextWeek.toISOString().split('T')[0];
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

// Process donate action
function processDonate() {
    const qty = parseInt(document.getElementById('donateQty').value);
    const org = document.getElementById('donateOrg').value;
    const reason = document.getElementById('donateReason').value;

    if (!qty || qty <= 0 || qty > currentItem.quantity) {
        showMessage('Please enter a valid quantity', 'error');
        return;
    }

    if (!org) {
        showMessage('Please select an organization', 'error');
        return;
    }

    // Update stock quantity
    const itemIndex = stockData.findIndex(item => item.id === currentItem.id);
    if (itemIndex !== -1) {
        stockData[itemIndex].quantity -= qty;
        
        // Remove item if quantity reaches 0
        if (stockData[itemIndex].quantity <= 0) {
            stockData.splice(itemIndex, 1);
        }
    }

    // Update shared data
    updateStockData(stockData);

    showMessage(`Successfully donated ${qty} units of ${currentItem.name}`, 'success');
    closeModal();
    renderTable();
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

    // Update stock quantity
    const itemIndex = stockData.findIndex(item => item.id === currentItem.id);
    if (itemIndex !== -1) {
        stockData[itemIndex].quantity -= qty;
        
        // Remove item if quantity reaches 0
        if (stockData[itemIndex].quantity <= 0) {
            stockData.splice(itemIndex, 1);
        }
    }

    // Update shared data
    updateStockData(stockData);

    showMessage(`Successfully discarded ${qty} units of ${currentItem.name}`, 'success');
    closeModal();
    renderTable();
}

// Process reduce price action
function processReducePrice() {
    const newPrice = parseFloat(document.getElementById('reduceNewPrice').value);
    const validUntil = document.getElementById('reduceValidUntil').value;
    const saleQty = parseInt(document.getElementById('reduceSaleQty').value);

    if (!newPrice || newPrice <= 0 || newPrice >= currentItem.price) {
        showMessage('Please enter a valid reduced price', 'error');
        return;
    }

    if (!validUntil) {
        showMessage('Please select a valid until date', 'error');
        return;
    }

    if (!saleQty || saleQty <= 0 || saleQty > currentItem.quantity) {
        showMessage('Please enter a valid sale quantity', 'error');
        return;
    }

    // Update item price
    const itemIndex = stockData.findIndex(item => item.id === currentItem.id);
    if (itemIndex !== -1) {
        stockData[itemIndex].price = newPrice;
    }

    // Update shared data
    updateStockData(stockData);

    const discount = ((currentItem.price - newPrice) / currentItem.price * 100).toFixed(1);
    showMessage(`Price reduced by ${discount}% for ${currentItem.name}`, 'success');
    closeModal();
    renderTable();
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
        supplier: supplier === 'supplier1' ? 'Supplier A' : 
                  supplier === 'supplier2' ? 'Supplier B' : 'Supplier C',
        deliveryDate: delivery,
        priority: priority
    };

    // Add to track orders
    const orderId = addOrderToTracker(orderData);

    showMessage(`Reorder placed: ${qty} units of ${currentItem.name} (Order ID: ${orderId})`, 'success');
    closeModal();
}

// Handle search
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    filterTable(searchTerm, document.getElementById('typeFilter').value);
}

// Handle filter
function handleFilter(e) {
    const typeFilter = e.target.value;
    filterTable(document.getElementById('searchInput').value.toLowerCase(), typeFilter);
}

// Filter table
function filterTable(searchTerm, typeFilter) {
    const rows = document.querySelectorAll('#stockTableBody tr');
    
    rows.forEach(row => {
        const itemId = row.getAttribute('data-item-id');
        const item = stockData.find(item => item.id === itemId);
        
        if (!item) {
            row.style.display = 'none';
            return;
        }

        const matchesSearch = !searchTerm || 
            item.name.toLowerCase().includes(searchTerm) ||
            item.id.toLowerCase().includes(searchTerm) ||
            item.type.toLowerCase().includes(searchTerm);

        const matchesType = !typeFilter || item.type === typeFilter;

        row.style.display = (matchesSearch && matchesType) ? '' : 'none';
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
window.stockTracker = {
    addItem: function(item) {
        stockData.push(item);
        updateStockData(stockData);
        renderTable();
    },
    removeItem: function(itemId) {
        const index = stockData.findIndex(item => item.id === itemId);
        if (index !== -1) {
            stockData.splice(index, 1);
            updateStockData(stockData);
            renderTable();
        }
    },
    updateItem: function(itemId, updates) {
        const index = stockData.findIndex(item => item.id === itemId);
        if (index !== -1) {
            stockData[index] = { ...stockData[index], ...updates };
            updateStockData(stockData);
            renderTable();
        }
    },
    getStock: function() {
        return [...stockData];
    }
};