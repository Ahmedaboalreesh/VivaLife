// Checkout Management
class CheckoutManager {
    constructor() {
        this.deliveryMethods = {
            'home-delivery': { name: 'Home Delivery', fee: 0 },
            'express': { name: 'Express Delivery', fee: 15 },
            'pickup': { name: 'Store Pickup', fee: 0 }
        };
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Checkout form submission
        document.getElementById('checkout-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.processOrder();
        });

        // Delivery method change
        document.getElementById('delivery-method').addEventListener('change', (e) => {
            this.updateDeliveryMethod(e.target.value);
        });

        // Modal close events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeCheckoutModal();
            }
        });
    }

    openCheckout() {
        this.populateCheckoutItems();
        this.updateCheckoutSummary();
        document.getElementById('checkout-modal').classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    closeCheckoutModal() {
        document.getElementById('checkout-modal').classList.remove('show');
        document.body.style.overflow = 'auto';
        this.resetForm();
    }

    populateCheckoutItems() {
        const checkoutItems = document.getElementById('checkout-items');
        const cartItems = cart.getCartItems();

        checkoutItems.innerHTML = cartItems.map(item => `
            <div class="checkout-item">
                <div>
                    <strong>${item.name}</strong>
                    <br>
                    <small>Quantity: ${item.quantity}</small>
                </div>
                <div>ر.س ${(item.price * item.quantity).toFixed(2)}</div>
            </div>
        `).join('');
    }

    updateCheckoutSummary() {
        const subtotal = cart.getSubtotal();
        const deliveryMethod = document.getElementById('delivery-method').value;
        const deliveryFee = deliveryMethod ? this.deliveryMethods[deliveryMethod].fee : 0;
        const total = subtotal + deliveryFee;

        document.getElementById('checkout-subtotal').textContent = `ر.س ${subtotal.toFixed(2)}`;
        document.getElementById('checkout-delivery-fee').textContent = deliveryFee === 0 ? 'Free' : `ر.س ${deliveryFee.toFixed(2)}`;
        document.getElementById('checkout-total').textContent = `ر.س ${total.toFixed(2)}`;
    }

    updateDeliveryMethod(method) {
        const addressSection = document.getElementById('address-section');
        
        if (method === 'pickup') {
            addressSection.style.display = 'none';
            document.getElementById('delivery-address').required = false;
        } else {
            addressSection.style.display = 'block';
            document.getElementById('delivery-address').required = true;
        }

        this.updateCheckoutSummary();
    }

    async processOrder() {
        // Show loading
        this.showLoading();

        try {
            // Collect form data
            const orderData = this.collectOrderData();
            
            // Validate order data
            if (!this.validateOrderData(orderData)) {
                this.hideLoading();
                return;
            }

            // Validate stock availability
            const stockValidation = this.validateStockAvailability(orderData.items);
            if (!stockValidation.valid) {
                this.showStockError(stockValidation.errors);
                this.hideLoading();
                return;
            }

            // Send order to pharmacy system
            const orderResult = await this.submitOrder(orderData);

            if (orderResult.success) {
                this.showOrderConfirmation(orderResult.orderNumber);
                cart.clearCart();
                this.closeCheckoutModal();
            } else {
                throw new Error(orderResult.message || 'Order submission failed');
            }

        } catch (error) {
            console.error('Order processing error:', error);
            alert('There was an error processing your order. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    collectOrderData() {
        const cartItems = cart.getCartItems();
        const deliveryMethod = document.getElementById('delivery-method').value;
        
        return {
            customer: {
                name: document.getElementById('customer-name').value.trim(),
                phone: document.getElementById('customer-phone').value.trim(),
                email: document.getElementById('customer-email').value.trim()
            },
            delivery: {
                method: deliveryMethod,
                address: deliveryMethod !== 'pickup' ? document.getElementById('delivery-address').value.trim() : 'Store Pickup',
                time: document.getElementById('delivery-time').value,
                notes: document.getElementById('delivery-notes').value.trim()
            },
            items: cartItems.map(item => ({
                id: item.id,
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                sku: item.id // Using ID as SKU for simplicity
            })),
            totals: {
                subtotal: cart.getSubtotal(),
                deliveryFee: this.deliveryMethods[deliveryMethod].fee,
                total: cart.getSubtotal() + this.deliveryMethods[deliveryMethod].fee
            },
            orderDate: new Date().toISOString(),
            priority: this.calculatePriority(cartItems, deliveryMethod)
        };
    }

    validateOrderData(orderData) {
        // Validate required fields
        if (!orderData.customer.name) {
            alert('Please enter your full name.');
            return false;
        }

        if (!orderData.customer.phone) {
            alert('Please enter your phone number.');
            return false;
        }

        if (!orderData.delivery.method) {
            alert('Please select a delivery method.');
            return false;
        }

        if (orderData.delivery.method !== 'pickup' && !orderData.delivery.address) {
            alert('Please enter your delivery address.');
            return false;
        }

        // Validate phone number format (basic Saudi phone number validation)
        const phoneRegex = /^(\+966|966|0)?[5][0-9]{8}$/;
        if (!phoneRegex.test(orderData.customer.phone.replace(/\s/g, ''))) {
            alert('Please enter a valid Saudi phone number.');
            return false;
        }

        return true;
    }

    calculatePriority(cartItems, deliveryMethod) {
        // Calculate priority based on items and delivery method
        if (deliveryMethod === 'express') return 'high';
        
        const hasPrescriptionItems = cartItems.some(item => item.prescription);
        if (hasPrescriptionItems) return 'high';
        
        const totalValue = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        if (totalValue > 200) return 'high';
        
        return 'normal';
    }

    async submitOrder(orderData) {
        // Simulate API call to pharmacy system
        return new Promise((resolve) => {
            setTimeout(() => {
                // Generate order number
                const orderNumber = this.generateOrderNumber();
                
                // In a real implementation, this would send data to the pharmacy system
                // For now, we'll simulate success and store in localStorage for the pharmacy system to pick up
                this.saveOrderToSystem(orderData, orderNumber);
                
                resolve({
                    success: true,
                    orderNumber: orderNumber,
                    estimatedDelivery: this.calculateEstimatedDelivery(orderData.delivery.method)
                });
            }, 2000); // Simulate network delay
        });
    }

    validateStockAvailability(orderItems) {
        // Check if we're in integrated mode (pharmacy system available)
        const pharmacyProducts = JSON.parse(localStorage.getItem('pharmacy_products') || '[]');
        const isIntegratedMode = pharmacyProducts.length > 0;
        
        const errors = [];
        let valid = true;

        if (isIntegratedMode) {
            // Integrated mode - validate against pharmacy inventory
            orderItems.forEach(orderItem => {
                const pharmacyProduct = pharmacyProducts.find(product => 
                    product.id === orderItem.id || 
                    product.sku === orderItem.id ||
                    product.name === orderItem.name
                );

                if (!pharmacyProduct) {
                    errors.push(`Product "${orderItem.name}" is no longer available.`);
                    valid = false;
                } else if (pharmacyProduct.currentStock < orderItem.quantity) {
                    errors.push(`Insufficient stock for "${orderItem.name}". Available: ${pharmacyProduct.currentStock}, Requested: ${orderItem.quantity}`);
                    valid = false;
                }
            });
        } else {
            // Standalone mode - validate against product catalog stock
            orderItems.forEach(orderItem => {
                const product = products.getProduct(orderItem.id);
                
                if (!product) {
                    errors.push(`Product "${orderItem.name}" is no longer available.`);
                    valid = false;
                } else if (product.currentStock && product.currentStock < orderItem.quantity) {
                    errors.push(`Insufficient stock for "${orderItem.name}". Available: ${product.currentStock}, Requested: ${orderItem.quantity}`);
                    valid = false;
                } else if (!product.inStock) {
                    errors.push(`Product "${orderItem.name}" is currently out of stock.`);
                    valid = false;
                }
            });
        }

        return { valid, errors };
    }

    showStockError(errors) {
        const errorMessage = 'Stock availability issues:\n\n' + errors.join('\n');
        alert(errorMessage + '\n\nPlease update your cart and try again.');
        
        // Refresh cart to show current stock levels
        if (typeof cart !== 'undefined' && cart.refreshInventoryData) {
            cart.refreshInventoryData();
        }
    }

    saveOrderToSystem(orderData, orderNumber) {
        // Check if we're in integrated mode
        const pharmacyProducts = JSON.parse(localStorage.getItem('pharmacy_products') || '[]');
        const isIntegratedMode = pharmacyProducts.length > 0;
        
        const newOrder = {
            id: `ORD${Date.now()}`,
            orderNumber: orderNumber,
            customerName: orderData.customer.name,
            customerPhone: orderData.customer.phone,
            customerEmail: orderData.customer.email,
            customerAddress: orderData.delivery.address,
            deliveryAddress: orderData.delivery.address,
            items: orderData.items.map(item => ({
                id: item.id,
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                sku: item.sku || item.id,
                total: item.price * item.quantity
            })),
            totalAmount: orderData.totals.total,
            status: 'pending',
            priority: orderData.priority,
            deliveryMethod: orderData.delivery.method,
            deliveryTime: this.formatDeliveryTime(orderData.delivery.time),
            deliveryNotes: orderData.delivery.notes,
            orderDate: orderData.orderDate,
            lastUpdated: orderData.orderDate,
            estimatedDelivery: this.calculateEstimatedDelivery(orderData.delivery.method),
            source: isIntegratedMode ? 'online-store' : 'standalone-store',
            pharmacyId: isIntegratedMode ? 'PHARM001' : 'STANDALONE'
        };

        if (isIntegratedMode) {
            // Integrated mode - save to pharmacy system
            const existingOrders = JSON.parse(localStorage.getItem('pharmacy_onlineOrders') || '[]');
            existingOrders.push(newOrder);
            localStorage.setItem('pharmacy_onlineOrders', JSON.stringify(existingOrders));
            localStorage.setItem('onlineOrders', JSON.stringify(existingOrders));

            // Trigger event for pharmacy system
            window.dispatchEvent(new CustomEvent('newOnlineOrder', { detail: newOrder }));
            
            console.log('Order saved to integrated pharmacy system:', newOrder);
        } else {
            // Standalone mode - save locally
            const existingOrders = JSON.parse(localStorage.getItem('standalone_orders') || '[]');
            existingOrders.push(newOrder);
            localStorage.setItem('standalone_orders', JSON.stringify(existingOrders));
            
            console.log('Order saved in standalone mode:', newOrder);
        }
    }

    generateOrderNumber() {
        const timestamp = Date.now().toString().slice(-8);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `WEB-2024-${timestamp}${random}`;
    }

    calculateEstimatedDelivery(deliveryMethod) {
        const now = new Date();
        let deliveryDate = new Date(now);

        switch (deliveryMethod) {
            case 'express':
                deliveryDate.setHours(now.getHours() + 2);
                break;
            case 'pickup':
                deliveryDate.setHours(now.getHours() + 1);
                break;
            default: // home-delivery
                deliveryDate.setDate(now.getDate() + 1);
                break;
        }

        return deliveryDate.toISOString();
    }

    formatDeliveryTime(timeSlot) {
        const timeSlots = {
            'morning': '9 AM - 12 PM',
            'afternoon': '12 PM - 4 PM',
            'evening': '4 PM - 8 PM'
        };
        return timeSlots[timeSlot] || 'Any Time';
    }

    showOrderConfirmation(orderNumber) {
        document.getElementById('order-number').textContent = orderNumber;
        
        const deliveryMethod = document.getElementById('delivery-method').value;
        const estimatedDelivery = this.calculateEstimatedDelivery(deliveryMethod);
        const deliveryDate = new Date(estimatedDelivery);
        
        let deliveryText;
        if (deliveryMethod === 'express') {
            deliveryText = 'Within 2 hours';
        } else if (deliveryMethod === 'pickup') {
            deliveryText = 'Ready for pickup within 1 hour';
        } else {
            deliveryText = deliveryDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
        
        document.getElementById('estimated-delivery').textContent = deliveryText;
        document.getElementById('order-confirmation-modal').classList.add('show');
    }

    closeOrderConfirmation() {
        document.getElementById('order-confirmation-modal').classList.remove('show');
        document.body.style.overflow = 'auto';
    }

    showLoading() {
        document.getElementById('loading-overlay').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loading-overlay').style.display = 'none';
    }

    resetForm() {
        document.getElementById('checkout-form').reset();
        document.getElementById('address-section').style.display = 'none';
    }
}

// Global functions for modal management
function closeCheckoutModal() {
    checkout.closeCheckoutModal();
}

function closeOrderConfirmation() {
    checkout.closeOrderConfirmation();
}

// Initialize checkout manager
const checkout = new CheckoutManager();
