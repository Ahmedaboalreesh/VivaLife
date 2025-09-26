// Pharmacy Management System - Main JavaScript File

class PharmacyManagementSystem {
    constructor() {
        this.products = this.loadData('products') || [];
        this.staff = this.loadData('staff') || [];
        this.dispensingHistory = this.loadData('dispensingHistory') || [];
        this.currentUser = this.loadData('currentUser') || null;
        this.cart = [];
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadDashboard();
        this.loadInventory();
        this.loadStaff();
        this.setupDefaultData();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                this.switchSection(e.currentTarget.dataset.section);
            });
        });

        // Product management
        document.getElementById('add-product-btn').addEventListener('click', () => {
            this.openProductModal();
        });

        document.getElementById('save-product').addEventListener('click', () => {
            this.saveProduct();
        });

        document.getElementById('cancel-product').addEventListener('click', () => {
            this.closeModal('product-modal');
        });

        // Staff management
        document.getElementById('add-staff-btn').addEventListener('click', () => {
            this.openStaffModal();
        });

        document.getElementById('save-staff').addEventListener('click', () => {
            this.saveStaff();
        });

        document.getElementById('cancel-staff').addEventListener('click', () => {
            this.closeModal('staff-modal');
        });

        // Dispensing
        document.getElementById('barcode-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.scanProduct();
            }
        });

        document.getElementById('scan-btn').addEventListener('click', () => {
            this.scanProduct();
        });

        document.getElementById('dispense-search').addEventListener('input', (e) => {
            this.searchProducts(e.target.value);
        });

        document.getElementById('process-dispense').addEventListener('click', () => {
            this.processDispensing();
        });

        // Search and filter
        document.getElementById('product-search').addEventListener('input', (e) => {
            this.filterInventory(e.target.value);
        });

        document.getElementById('category-filter').addEventListener('change', (e) => {
            this.filterByCategory(e.target.value);
        });

        // Modal close buttons
        document.querySelectorAll('.close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.closeModal(e.target.closest('.modal').id);
            });
        });

        // Click outside modal to close
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target.id);
            }
        });

        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.logout();
        });
    }

    switchSection(sectionName) {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

        // Update content
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(sectionName).classList.add('active');

        // Load section-specific data
        switch(sectionName) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'inventory':
                this.loadInventory();
                break;
            case 'dispensing':
                this.loadDispensing();
                break;
            case 'staff':
                this.loadStaff();
                break;
            case 'reports':
                this.loadReports();
                break;
        }
    }

    // Dashboard functionality
    loadDashboard() {
        this.updateDashboardStats();
        this.createDispensingChart();
        this.loadLowStockItems();
    }

    updateDashboardStats() {
        const totalProducts = this.products.length;
        const lowStockItems = this.products.filter(p => p.currentStock <= p.minStock).length;
        const dispensedToday = this.getDispensedToday();
        const activeStaff = this.staff.length;

        document.getElementById('total-products').textContent = totalProducts;
        document.getElementById('low-stock').textContent = lowStockItems;
        document.getElementById('dispensed-today').textContent = dispensedToday;
        document.getElementById('active-staff').textContent = activeStaff;
    }

    getDispensedToday() {
        const today = new Date().toDateString();
        return this.dispensingHistory.filter(record => 
            new Date(record.date).toDateString() === today
        ).length;
    }

    createDispensingChart() {
        const ctx = document.getElementById('dispensing-chart');
        if (!ctx) return;

        const last7Days = this.getLast7DaysData();
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: last7Days.map(day => day.date),
                datasets: [{
                    label: 'Dispensed Items',
                    data: last7Days.map(day => day.count),
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    getLast7DaysData() {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateString = date.toDateString();
            
            const count = this.dispensingHistory.filter(record => 
                new Date(record.date).toDateString() === dateString
            ).length;
            
            days.push({
                date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                count: count
            });
        }
        return days;
    }

    loadLowStockItems() {
        const lowStockList = document.getElementById('low-stock-list');
        const lowStockItems = this.products.filter(p => p.currentStock <= p.minStock);
        
        lowStockList.innerHTML = lowStockItems.length === 0 
            ? '<p style="text-align: center; color: #7f8c8d; padding: 1rem;">No low stock items</p>'
            : lowStockItems.map(item => `
                <div class="low-stock-item">
                    <span class="product-name">${item.name}</span>
                    <span class="stock-level">${item.currentStock} left</span>
                </div>
            `).join('');
    }

    // Inventory management
    loadInventory() {
        this.renderInventoryTable();
    }

    renderInventoryTable() {
        const tbody = document.getElementById('inventory-table-body');
        tbody.innerHTML = this.products.map(product => `
            <tr>
                <td>${product.name}</td>
                <td>${this.capitalizeFirst(product.category)}</td>
                <td>${product.sku}</td>
                <td class="${product.currentStock <= product.minStock ? 'stock-low' : 'stock-ok'}">
                    ${product.currentStock}
                </td>
                <td>${product.minStock}</td>
                <td>$${product.price.toFixed(2)}</td>
                <td>${product.expiryDate || 'N/A'}</td>
                <td>
                    <button class="btn btn-sm btn-outline" onclick="pharmacySystem.editProduct('${product.sku}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="pharmacySystem.deleteProduct('${product.sku}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    filterInventory(searchTerm) {
        const filteredProducts = this.products.filter(product =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.sku.toLowerCase().includes(searchTerm.toLowerCase())
        );
        this.renderFilteredInventory(filteredProducts);
    }

    filterByCategory(category) {
        if (!category) {
            this.renderInventoryTable();
            return;
        }
        
        const filteredProducts = this.products.filter(product => product.category === category);
        this.renderFilteredInventory(filteredProducts);
    }

    renderFilteredInventory(products) {
        const tbody = document.getElementById('inventory-table-body');
        tbody.innerHTML = products.map(product => `
            <tr>
                <td>${product.name}</td>
                <td>${this.capitalizeFirst(product.category)}</td>
                <td>${product.sku}</td>
                <td class="${product.currentStock <= product.minStock ? 'stock-low' : 'stock-ok'}">
                    ${product.currentStock}
                </td>
                <td>${product.minStock}</td>
                <td>$${product.price.toFixed(2)}</td>
                <td>${product.expiryDate || 'N/A'}</td>
                <td>
                    <button class="btn btn-sm btn-outline" onclick="pharmacySystem.editProduct('${product.sku}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="pharmacySystem.deleteProduct('${product.sku}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    openProductModal(product = null) {
        const modal = document.getElementById('product-modal');
        const form = document.getElementById('product-form');
        
        if (product) {
            // Edit mode
            document.getElementById('product-name').value = product.name;
            document.getElementById('product-category').value = product.category;
            document.getElementById('product-sku').value = product.sku;
            document.getElementById('product-stock').value = product.currentStock;
            document.getElementById('product-min-stock').value = product.minStock;
            document.getElementById('product-price').value = product.price;
            document.getElementById('product-expiry').value = product.expiryDate || '';
        } else {
            // Add mode
            form.reset();
        }
        
        modal.style.display = 'block';
        this.editingProduct = product;
    }

    saveProduct() {
        const form = document.getElementById('product-form');
        const formData = new FormData(form);
        
        const productData = {
            name: document.getElementById('product-name').value,
            category: document.getElementById('product-category').value,
            sku: document.getElementById('product-sku').value,
            currentStock: parseInt(document.getElementById('product-stock').value),
            minStock: parseInt(document.getElementById('product-min-stock').value),
            price: parseFloat(document.getElementById('product-price').value),
            expiryDate: document.getElementById('product-expiry').value || null
        };

        if (this.editingProduct) {
            // Update existing product
            const index = this.products.findIndex(p => p.sku === this.editingProduct.sku);
            this.products[index] = { ...this.products[index], ...productData };
        } else {
            // Add new product
            this.products.push(productData);
        }

        this.saveData('products', this.products);
        this.closeModal('product-modal');
        this.loadInventory();
        this.loadDashboard();
        this.showMessage('Product saved successfully!', 'success');
    }

    editProduct(sku) {
        const product = this.products.find(p => p.sku === sku);
        if (product) {
            this.openProductModal(product);
        }
    }

    deleteProduct(sku) {
        if (confirm('Are you sure you want to delete this product?')) {
            this.products = this.products.filter(p => p.sku !== sku);
            this.saveData('products', this.products);
            this.loadInventory();
            this.loadDashboard();
            this.showMessage('Product deleted successfully!', 'success');
        }
    }

    // Staff management
    loadStaff() {
        this.renderStaffCards();
    }

    renderStaffCards() {
        const staffGrid = document.querySelector('.staff-grid');
        const template = document.getElementById('staff-template');
        
        // Clear existing cards (except template)
        staffGrid.innerHTML = '';
        
        this.staff.forEach((member, index) => {
            const card = template.cloneNode(true);
            card.style.display = 'block';
            card.id = `staff-${index}`;
            
            card.querySelector('.staff-name').textContent = member.name;
            card.querySelector('.staff-role').textContent = this.capitalizeFirst(member.role);
            card.querySelector('.staff-id').textContent = `ID: ${member.id}`;
            
            card.querySelector('.edit-staff').onclick = () => this.editStaff(member);
            card.querySelector('.delete-staff').onclick = () => this.deleteStaff(member.id);
            
            staffGrid.appendChild(card);
        });
    }

    openStaffModal(staff = null) {
        const modal = document.getElementById('staff-modal');
        const form = document.getElementById('staff-form');
        
        if (staff) {
            // Edit mode
            document.getElementById('staff-name').value = staff.name;
            document.getElementById('staff-role').value = staff.role;
            document.getElementById('staff-id').value = staff.id;
            document.getElementById('staff-email').value = staff.email;
            document.getElementById('staff-phone').value = staff.phone || '';
        } else {
            // Add mode
            form.reset();
            document.getElementById('staff-id').value = this.generateStaffId();
        }
        
        modal.style.display = 'block';
        this.editingStaff = staff;
    }

    saveStaff() {
        const form = document.getElementById('staff-form');
        
        const staffData = {
            name: document.getElementById('staff-name').value,
            role: document.getElementById('staff-role').value,
            id: document.getElementById('staff-id').value,
            email: document.getElementById('staff-email').value,
            phone: document.getElementById('staff-phone').value
        };

        if (this.editingStaff) {
            // Update existing staff
            const index = this.staff.findIndex(s => s.id === this.editingStaff.id);
            this.staff[index] = { ...this.staff[index], ...staffData };
        } else {
            // Add new staff
            this.staff.push(staffData);
        }

        this.saveData('staff', this.staff);
        this.closeModal('staff-modal');
        this.loadStaff();
        this.loadDashboard();
        this.showMessage('Staff member saved successfully!', 'success');
    }

    editStaff(staff) {
        this.openStaffModal(staff);
    }

    deleteStaff(staffId) {
        if (confirm('Are you sure you want to delete this staff member?')) {
            this.staff = this.staff.filter(s => s.id !== staffId);
            this.saveData('staff', this.staff);
            this.loadStaff();
            this.loadDashboard();
            this.showMessage('Staff member deleted successfully!', 'success');
        }
    }

    generateStaffId() {
        return 'STF' + Date.now().toString().slice(-6);
    }

    // Dispensing functionality
    loadDispensing() {
        this.renderCart();
    }

    scanProduct() {
        const barcode = document.getElementById('barcode-input').value.trim();
        if (!barcode) return;

        const product = this.products.find(p => p.sku === barcode);
        if (product) {
            this.addToCart(product);
            document.getElementById('barcode-input').value = '';
        } else {
            this.showMessage('Product not found!', 'error');
        }
    }

    searchProducts(searchTerm) {
        const suggestions = document.getElementById('product-suggestions');
        
        if (searchTerm.length < 2) {
            suggestions.style.display = 'none';
            return;
        }

        const filteredProducts = this.products.filter(product =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase())
        ).slice(0, 5);

        if (filteredProducts.length > 0) {
            suggestions.innerHTML = filteredProducts.map(product => `
                <div class="suggestion-item" onclick="pharmacySystem.selectProduct('${product.sku}')">
                    <div>${product.name}</div>
                    <div style="font-size: 0.8rem; color: #7f8c8d;">${product.sku} - $${product.price.toFixed(2)}</div>
                </div>
            `).join('');
            suggestions.style.display = 'block';
        } else {
            suggestions.style.display = 'none';
        }
    }

    selectProduct(sku) {
        const product = this.products.find(p => p.sku === sku);
        if (product) {
            this.addToCart(product);
            document.getElementById('dispense-search').value = '';
            document.getElementById('product-suggestions').style.display = 'none';
        }
    }

    addToCart(product) {
        if (product.currentStock <= 0) {
            this.showMessage('Product is out of stock!', 'error');
            return;
        }

        const existingItem = this.cart.find(item => item.sku === product.sku);
        if (existingItem) {
            if (existingItem.quantity < product.currentStock) {
                existingItem.quantity++;
            } else {
                this.showMessage('Cannot add more items - insufficient stock!', 'error');
                return;
            }
        } else {
            this.cart.push({
                ...product,
                quantity: 1
            });
        }

        this.renderCart();
    }

    removeFromCart(sku) {
        this.cart = this.cart.filter(item => item.sku !== sku);
        this.renderCart();
    }

    updateQuantity(sku, newQuantity) {
        if (newQuantity <= 0) {
            this.removeFromCart(sku);
            return;
        }

        const product = this.products.find(p => p.sku === sku);
        if (newQuantity > product.currentStock) {
            this.showMessage('Cannot add more items - insufficient stock!', 'error');
            return;
        }

        const cartItem = this.cart.find(item => item.sku === sku);
        if (cartItem) {
            cartItem.quantity = newQuantity;
        }

        this.renderCart();
    }

    renderCart() {
        const cartItems = document.getElementById('cart-items');
        const cartCount = document.getElementById('cart-count');
        const cartTotal = document.getElementById('cart-total');

        if (this.cart.length === 0) {
            cartItems.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 2rem;">Cart is empty</p>';
            cartCount.textContent = '0';
            cartTotal.textContent = '0.00';
            return;
        }

        cartItems.innerHTML = this.cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">$${item.price.toFixed(2)} each</div>
                </div>
                <div class="cart-item-controls">
                    <div class="quantity-control">
                        <button onclick="pharmacySystem.updateQuantity('${item.sku}', ${item.quantity - 1})">-</button>
                        <span>${item.quantity}</span>
                        <button onclick="pharmacySystem.updateQuantity('${item.sku}', ${item.quantity + 1})">+</button>
                    </div>
                    <button class="btn btn-sm btn-danger" onclick="pharmacySystem.removeFromCart('${item.sku}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');

        const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        const totalValue = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        cartCount.textContent = totalItems;
        cartTotal.textContent = totalValue.toFixed(2);
    }

    processDispensing() {
        if (this.cart.length === 0) {
            this.showMessage('Cart is empty!', 'error');
            return;
        }

        // Update inventory
        this.cart.forEach(cartItem => {
            const product = this.products.find(p => p.sku === cartItem.sku);
            if (product) {
                product.currentStock -= cartItem.quantity;
            }
        });

        // Record dispensing
        const dispensingRecord = {
            id: 'DSP' + Date.now(),
            date: new Date().toISOString(),
            items: this.cart.map(item => ({
                sku: item.sku,
                name: item.name,
                quantity: item.quantity,
                price: item.price
            })),
            totalValue: this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            staffId: this.currentUser?.id || 'Unknown'
        };

        this.dispensingHistory.push(dispensingRecord);

        // Save data
        this.saveData('products', this.products);
        this.saveData('dispensingHistory', this.dispensingHistory);

        // Clear cart
        this.cart = [];
        this.renderCart();

        this.showMessage(`Successfully dispensed ${dispensingRecord.items.length} items!`, 'success');
        this.loadDashboard();
    }

    // Reports
    loadReports() {
        // Reports functionality can be expanded here
        console.log('Loading reports...');
    }

    // Utility functions
    setupDefaultData() {
        if (this.products.length === 0) {
            this.products = [
                {
                    name: 'Paracetamol 500mg',
                    category: 'prescription',
                    sku: 'PAR500',
                    currentStock: 100,
                    minStock: 20,
                    price: 2.50,
                    expiryDate: '2025-12-31'
                },
                {
                    name: 'Ibuprofen 400mg',
                    category: 'prescription',
                    sku: 'IBU400',
                    currentStock: 75,
                    minStock: 15,
                    price: 3.20,
                    expiryDate: '2025-11-30'
                },
                {
                    name: 'Vitamin C 1000mg',
                    category: 'otc',
                    sku: 'VITC1000',
                    currentStock: 5,
                    minStock: 10,
                    price: 8.99,
                    expiryDate: '2026-03-15'
                },
                {
                    name: 'Bandages (Pack of 10)',
                    category: 'supplies',
                    sku: 'BAND10',
                    currentStock: 25,
                    minStock: 5,
                    price: 12.50,
                    expiryDate: null
                }
            ];
            this.saveData('products', this.products);
        }

        if (this.staff.length === 0) {
            this.staff = [
                {
                    name: 'Dr. Sarah Johnson',
                    role: 'pharmacist',
                    id: 'STF001',
                    email: 'sarah.johnson@vivalife.com',
                    phone: '+1-555-0101'
                },
                {
                    name: 'Mike Chen',
                    role: 'technician',
                    id: 'STF002',
                    email: 'mike.chen@vivalife.com',
                    phone: '+1-555-0102'
                }
            ];
            this.saveData('staff', this.staff);
        }

        if (!this.currentUser) {
            this.currentUser = this.staff[0];
            this.saveData('currentUser', this.currentUser);
            document.getElementById('current-user').textContent = `Welcome, ${this.currentUser.name}`;
        }
    }

    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    showMessage(message, type = 'info') {
        // Remove existing messages
        document.querySelectorAll('.message').forEach(msg => msg.remove());

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;

        const mainContent = document.querySelector('.main-content');
        mainContent.insertBefore(messageDiv, mainContent.firstChild);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    logout() {
        this.currentUser = null;
        this.saveData('currentUser', null);
        this.showMessage('Logged out successfully!', 'info');
        // In a real application, you would redirect to login page
    }

    // Data persistence
    saveData(key, data) {
        localStorage.setItem(`pharmacy_${key}`, JSON.stringify(data));
    }

    loadData(key) {
        const data = localStorage.getItem(`pharmacy_${key}`);
        return data ? JSON.parse(data) : null;
    }
}

// Initialize the pharmacy management system
const pharmacySystem = new PharmacyManagementSystem();

// Additional utility functions for global access
window.pharmacySystem = pharmacySystem;
