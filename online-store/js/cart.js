// Shopping Cart Management
class ShoppingCart {
    constructor() {
        this.items = [];
        this.isOpen = false;
        this.init();
    }

    init() {
        this.loadCart();
        this.setupEventListeners();
        this.updateCartDisplay();
    }

    setupEventListeners() {
        // Cart toggle
        document.getElementById('cart-btn').addEventListener('click', () => {
            this.toggleCart();
        });

        document.getElementById('close-cart').addEventListener('click', () => {
            this.closeCart();
        });

        // Cart actions
        document.getElementById('clear-cart').addEventListener('click', () => {
            this.clearCart();
        });

        document.getElementById('checkout-btn').addEventListener('click', () => {
            this.proceedToCheckout();
        });

        // Close cart when clicking outside
        document.addEventListener('click', (e) => {
            const cartSidebar = document.getElementById('cart-sidebar');
            const cartBtn = document.getElementById('cart-btn');
            
            if (this.isOpen && !cartSidebar.contains(e.target) && !cartBtn.contains(e.target)) {
                this.closeCart();
            }
        });
    }

    addToCart(productId, quantity = 1) {
        const product = products.getProduct(productId);
        if (!product) return;

        // Check real-time stock availability
        if (!this.checkStockAvailability(product, quantity)) {
            return;
        }

        // Check if prescription is required
        if (product.prescription) {
            this.showPrescriptionModal(product);
            return;
        }

        const existingItem = this.items.find(item => item.id === productId);

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.items.push({
                id: productId,
                name: product.name,
                price: product.price,
                image: product.image,
                quantity: quantity,
                prescription: product.prescription
            });
        }

        this.saveCart();
        this.updateCartDisplay();
        this.showAddToCartFeedback(product.name);
    }

    removeFromCart(productId) {
        this.items = this.items.filter(item => item.id !== productId);
        this.saveCart();
        this.updateCartDisplay();
    }

    updateQuantity(productId, quantity) {
        const item = this.items.find(item => item.id === productId);
        if (item) {
            if (quantity <= 0) {
                this.removeFromCart(productId);
            } else {
                item.quantity = quantity;
                this.saveCart();
                this.updateCartDisplay();
            }
        }
    }

    clearCart() {
        if (this.items.length === 0) return;

        if (confirm('Are you sure you want to clear your cart?')) {
            this.items = [];
            this.saveCart();
            this.updateCartDisplay();
        }
    }

    toggleCart() {
        if (this.isOpen) {
            this.closeCart();
        } else {
            this.openCart();
        }
    }

    openCart() {
        document.getElementById('cart-sidebar').classList.add('open');
        this.isOpen = true;
        document.body.style.overflow = 'hidden';
    }

    closeCart() {
        document.getElementById('cart-sidebar').classList.remove('open');
        this.isOpen = false;
        document.body.style.overflow = 'auto';
    }

    updateCartDisplay() {
        this.updateCartCount();
        this.updateCartItems();
        this.updateCartSummary();
    }

    updateCartCount() {
        const totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
        const cartCount = document.getElementById('cart-count');
        cartCount.textContent = totalItems;
        cartCount.style.display = totalItems > 0 ? 'block' : 'none';
    }

    updateCartItems() {
        const cartItemsContainer = document.getElementById('cart-items');
        
        if (this.items.length === 0) {
            cartItemsContainer.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #666;">
                    <i class="fas fa-shopping-cart" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                    <h4>Your cart is empty</h4>
                    <p>Add some products to get started!</p>
                </div>
            `;
            return;
        }

        cartItemsContainer.innerHTML = this.items.map(item => `
            <div class="cart-item">
                <div class="cart-item-image">
                    <i class="${item.image}"></i>
                </div>
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">ر.س ${item.price.toFixed(2)}</div>
                    <div class="cart-item-controls">
                        <button class="quantity-btn" onclick="cart.updateQuantity('${item.id}', ${item.quantity - 1})">
                            <i class="fas fa-minus"></i>
                        </button>
                        <input type="number" class="quantity-input" value="${item.quantity}" 
                               onchange="cart.updateQuantity('${item.id}', parseInt(this.value))" min="1">
                        <button class="quantity-btn" onclick="cart.updateQuantity('${item.id}', ${item.quantity + 1})">
                            <i class="fas fa-plus"></i>
                        </button>
                        <button class="remove-item" onclick="cart.removeFromCart('${item.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    updateCartSummary() {
        const subtotal = this.getSubtotal();
        const deliveryFee = this.getDeliveryFee();
        const total = subtotal + deliveryFee;

        document.getElementById('cart-subtotal').textContent = `ر.س ${subtotal.toFixed(2)}`;
        document.getElementById('delivery-fee').textContent = deliveryFee === 0 ? 'Free' : `ر.س ${deliveryFee.toFixed(2)}`;
        document.getElementById('cart-total').textContent = `ر.س ${total.toFixed(2)}`;
    }

    getSubtotal() {
        return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    getDeliveryFee() {
        // Free delivery for orders over 100 SAR
        const subtotal = this.getSubtotal();
        return subtotal >= 100 ? 0 : 15;
    }

    getTotal() {
        return this.getSubtotal() + this.getDeliveryFee();
    }

    proceedToCheckout() {
        if (this.items.length === 0) {
            alert('Your cart is empty!');
            return;
        }

        // Check for prescription items
        const prescriptionItems = this.items.filter(item => item.prescription);
        if (prescriptionItems.length > 0) {
            alert('Please upload prescriptions for prescription items before checkout.');
            return;
        }

        this.closeCart();
        checkout.openCheckout();
    }

    showPrescriptionModal(product) {
        // In a real implementation, this would show a prescription upload modal
        alert(`${product.name} requires a prescription. Please consult with our pharmacist or upload your prescription.`);
    }

    showAddToCartFeedback(productName) {
        // Create temporary notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 5000;
            animation: slideIn 0.3s ease;
        `;
        notification.innerHTML = `
            <i class="fas fa-check-circle"></i>
            ${productName} added to cart!
        `;

        document.body.appendChild(notification);

        // Add CSS animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);

        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => {
                document.body.removeChild(notification);
                document.head.removeChild(style);
            }, 300);
        }, 3000);
    }

    saveCart() {
        localStorage.setItem('vivalife_cart', JSON.stringify(this.items));
    }

    loadCart() {
        const savedCart = localStorage.getItem('vivalife_cart');
        if (savedCart) {
            this.items = JSON.parse(savedCart);
        }
    }

    getCartItems() {
        return this.items;
    }

    getCartCount() {
        return this.items.reduce((sum, item) => sum + item.quantity, 0);
    }

    checkStockAvailability(product, requestedQuantity) {
        // Get current stock from pharmacy system
        const currentStock = this.getCurrentPharmacyStock(product.id);
        
        // Check existing cart quantity for this product
        const existingCartItem = this.items.find(item => item.id === product.id);
        const currentCartQuantity = existingCartItem ? existingCartItem.quantity : 0;
        
        const totalRequestedQuantity = currentCartQuantity + requestedQuantity;

        if (currentStock <= 0) {
            this.showStockError(product.name, 'This item is currently out of stock.');
            return false;
        }

        if (totalRequestedQuantity > currentStock) {
            this.showStockError(
                product.name, 
                `Only ${currentStock} items available. You already have ${currentCartQuantity} in your cart.`
            );
            return false;
        }

        return true;
    }

    getCurrentPharmacyStock(productId) {
        try {
            // Check if we're in integrated mode first
            const pharmacyProducts = JSON.parse(localStorage.getItem('pharmacy_products') || '[]');
            
            if (pharmacyProducts.length > 0) {
                // Integrated mode - check pharmacy inventory
                const product = pharmacyProducts.find(p => p.id === productId || p.sku === productId);
                return product ? product.currentStock : 0;
            } else {
                // Standalone mode - check product catalog
                const product = products.getProduct(productId);
                return product ? (product.currentStock || (product.inStock ? 999 : 0)) : 0;
            }
        } catch (error) {
            console.warn('Could not check stock:', error);
            return 0;
        }
    }

    showStockError(productName, message) {
        // Create stock error notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: #dc3545;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 5000;
            max-width: 300px;
        `;
        notification.innerHTML = `
            <div style="display: flex; align-items: flex-start; gap: 0.5rem;">
                <i class="fas fa-exclamation-triangle"></i>
                <div>
                    <strong>Stock Unavailable</strong>
                    <br>
                    <strong>${productName}</strong>
                    <br>
                    <small>${message}</small>
                </div>
            </div>
        `;

        document.body.appendChild(notification);

        // Remove notification after 5 seconds
        setTimeout(() => {
            if (document.body.contains(notification)) {
                notification.style.opacity = '0';
                notification.style.transition = 'opacity 0.5s ease';
                setTimeout(() => {
                    if (document.body.contains(notification)) {
                        document.body.removeChild(notification);
                    }
                }, 500);
            }
        }, 5000);
    }

    refreshInventoryData() {
        // Refresh product data from pharmacy system
        if (typeof products !== 'undefined' && products.loadFromPharmacyInventory) {
            products.loadFromPharmacyInventory();
            
            // Update cart items with latest stock info
            this.validateCartItems();
        }
    }

    validateCartItems() {
        // Check if cart items are still available and in stock
        let cartUpdated = false;
        
        this.items = this.items.filter(item => {
            const currentStock = this.getCurrentPharmacyStock(item.id);
            
            if (currentStock <= 0) {
                this.showStockError(item.name, 'This item is no longer available and has been removed from your cart.');
                cartUpdated = true;
                return false;
            }
            
            if (item.quantity > currentStock) {
                item.quantity = currentStock;
                this.showStockError(item.name, `Quantity reduced to ${currentStock} (maximum available).`);
                cartUpdated = true;
            }
            
            return true;
        });

        if (cartUpdated) {
            this.saveCart();
            this.updateCartDisplay();
        }
    }
}

// Initialize shopping cart
const cart = new ShoppingCart();
