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

// Initialize application
function initializeApp() {
    // Load shared data
    const sharedData = getSharedData();
    ordersData = sharedData.orders;
    
    renderOrdersTable();
    setupEventListeners();
    checkEmptyState();
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
    const statusFilter = document.getElementById('statusFilter');
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

// Get orders data
let ordersData = [];

// Render orders table
function renderOrdersTable() {
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return;

    // Sort by order date (newest first)
    const sortedData = [...ordersData].sort((a, b) => {
        return new Date(b.orderDate) - new Date(a.orderDate);
    });

    tbody.innerHTML = sortedData.map(order => {
        const totalCost = (order.price * order.quantity).toFixed(2);
        
        return `
            <tr data-order-id="${order.orderId}" onclick="showOrderDetails('${order.orderId}')">
                <td><strong>${order.orderId}</strong></td>
                <td>
                    <div class="item-details">
                        <div class="item-name">${order.itemName}</div>
                        <div class="item-id">${order.itemId}</div>
                        <div class="item-type">${formatType(order.itemType)}</div>
                    </div>
                </td>
                <td><span class="supplier-info">${order.supplier}</span></td>
                <td><strong>${order.quantity}</strong></td>
                <td><span class="date-info">${formatDate(order.orderDate)}</span></td>
                <td><span class="date-info">${formatDate(order.deliveryDate)}</span></td>
                <td><span class="status-badge status-${order.status}">${order.status}</span></td>
                <td><span class="priority-badge priority-${order.priority}">${order.priority}</span></td>
                <td>
                    <button class="btn btn-secondary btn-small" onclick="event.stopPropagation(); showOrderDetails('${order.orderId}')">
                        View Details
                    </button>
                </td>
            </tr>
        `;
    }).join('');
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

// Show order details modal
function showOrderDetails(orderId) {
    const order = ordersData.find(order => order.orderId === orderId);
    if (!order) return;

    // Populate modal with order details
    document.getElementById('detailOrderId').textContent = order.orderId;
    document.getElementById('detailItemId').textContent = order.itemId;
    document.getElementById('detailItemName').textContent = order.itemName;
    document.getElementById('detailItemType').textContent = formatType(order.itemType);
    document.getElementById('detailItemPrice').textContent = `$${order.price.toFixed(2)}`;
    document.getElementById('detailQuantity').textContent = order.quantity;
    document.getElementById('detailTotalCost').textContent = `$${(order.price * order.quantity).toFixed(2)}`;
    document.getElementById('detailSupplier').textContent = order.supplier;
    document.getElementById('detailOrderDate').textContent = formatDate(order.orderDate);
    document.getElementById('detailDeliveryDate').textContent = formatDate(order.deliveryDate);
    document.getElementById('detailPriority').innerHTML = `<span class="priority-badge priority-${order.priority}">${order.priority}</span>`;
    document.getElementById('detailStatus').innerHTML = `<span class="status-badge status-${order.status}">${order.status}</span>`;

    // Show modal
    const overlay = document.getElementById('modalOverlay');
    overlay.classList.add('show');
}

// Close modal
function closeModal() {
    const overlay = document.getElementById('modalOverlay');
    overlay.classList.remove('show');
}

// Handle search
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    filterTable(searchTerm, document.getElementById('statusFilter').value);
}

// Handle filter
function handleFilter(e) {
    const statusFilter = e.target.value;
    filterTable(document.getElementById('searchInput').value.toLowerCase(), statusFilter);
}

// Filter table
function filterTable(searchTerm, statusFilter) {
    const rows = document.querySelectorAll('#ordersTableBody tr');
    
    rows.forEach(row => {
        const orderId = row.getAttribute('data-order-id');
        const order = ordersData.find(order => order.orderId === orderId);
        
        if (!order) {
            row.style.display = 'none';
            return;
        }

        const matchesSearch = !searchTerm || 
            order.itemName.toLowerCase().includes(searchTerm) ||
            order.orderId.toLowerCase().includes(searchTerm) ||
            order.itemId.toLowerCase().includes(searchTerm) ||
            order.supplier.toLowerCase().includes(searchTerm);

        const matchesStatus = !statusFilter || order.status === statusFilter;

        row.style.display = (matchesSearch && matchesStatus) ? '' : 'none';
    });

    checkEmptyState();
}

// Check if table is empty and show/hide empty state
function checkEmptyState() {
    const visibleRows = document.querySelectorAll('#ordersTableBody tr:not([style*="display: none"])');
    const emptyState = document.getElementById('emptyState');
    const tableContainer = document.querySelector('.table-container');
    
    if (visibleRows.length === 0) {
        emptyState.style.display = 'block';
        tableContainer.style.display = 'none';
    } else {
        emptyState.style.display = 'none';
        tableContainer.style.display = 'block';
    }
}

// Function to add new order (called from other pages)
function addOrder(orderData) {
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
    
    ordersData.unshift(newOrder);
    
    // Update shared data
    const sharedData = getSharedData();
    sharedData.orders = ordersData;
    saveSharedData(sharedData);
    
    renderOrdersTable();
    checkEmptyState();
    
    return newOrder.orderId;
}

// Generate unique order ID
function generateOrderId() {
    const timestamp = Date.now().toString().slice(-6);
    return `ORD${timestamp}`;
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
    if (e.key === 'Escape') {
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

// Export functions for external use
window.trackOrders = {
    addOrder: addOrder,
    getOrders: function() {
        return [...ordersData];
    }
};