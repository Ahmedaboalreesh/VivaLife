// Main Application Logic
class OnlinePharmacyApp {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupSmoothScrolling();
        this.setupNavigationHighlight();
        this.checkPharmacySystemConnection();
    }

    setupEventListeners() {
        // Navigation menu
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                this.scrollToSection(targetId);
                this.setActiveNavLink(link);
            });
        });

        // Search button in header
        document.getElementById('search-btn').addEventListener('click', () => {
            this.scrollToSection('products');
            document.getElementById('product-search').focus();
        });

        // Account button
        document.getElementById('account-btn').addEventListener('click', () => {
            this.showAccountModal();
        });

        // Window scroll for navigation highlighting
        window.addEventListener('scroll', () => {
            this.highlightActiveSection();
        });

        // Listen for new orders from the pharmacy system
        window.addEventListener('newOnlineOrder', (event) => {
            this.handleNewOrder(event.detail);
        });
    }

    setupSmoothScrolling() {
        // Enable smooth scrolling for all internal links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    setupNavigationHighlight() {
        // Set up intersection observer for section highlighting
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-link');

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const currentSection = entry.target.id;
                    navLinks.forEach(link => {
                        link.classList.remove('active');
                        if (link.getAttribute('href') === `#${currentSection}`) {
                            link.classList.add('active');
                        }
                    });
                }
            });
        }, {
            threshold: 0.3
        });

        sections.forEach(section => {
            observer.observe(section);
        });
    }

    scrollToSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            const headerHeight = document.querySelector('.header').offsetHeight;
            const sectionTop = section.offsetTop - headerHeight - 20;
            
            window.scrollTo({
                top: sectionTop,
                behavior: 'smooth'
            });
        }
    }

    setActiveNavLink(activeLink) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        activeLink.classList.add('active');
    }

    highlightActiveSection() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-link');
        const scrollPos = window.scrollY + 100;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.id;

            if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }

    showAccountModal() {
        // In a real implementation, this would show login/register modal
        alert('Account management feature coming soon! For now, you can place orders as a guest.');
    }

    checkPharmacySystemConnection() {
        // Check if the main pharmacy system is available
        try {
            const pharmacySystem = localStorage.getItem('pharmacySystem');
            if (pharmacySystem) {
                console.log('Connected to VivaLife Pharmacy System');
                this.showConnectionStatus(true);
            } else {
                console.log('Pharmacy system not detected - running in standalone mode');
                this.showConnectionStatus(false);
            }
        } catch (error) {
            console.warn('Could not connect to pharmacy system:', error);
            this.showConnectionStatus(false);
        }
    }

    showConnectionStatus(connected) {
        // Create a small indicator in the footer or header
        const indicator = document.createElement('div');
        indicator.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            padding: 0.5rem 1rem;
            background: ${connected ? '#28a745' : '#ffc107'};
            color: ${connected ? 'white' : '#000'};
            border-radius: 20px;
            font-size: 0.8rem;
            z-index: 1000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        `;
        indicator.innerHTML = `
            <i class="fas fa-${connected ? 'check-circle' : 'exclamation-triangle'}"></i>
            ${connected ? 'Connected to Pharmacy' : 'Standalone Mode'}
        `;
        
        document.body.appendChild(indicator);

        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (document.body.contains(indicator)) {
                indicator.style.opacity = '0';
                indicator.style.transition = 'opacity 0.5s ease';
                setTimeout(() => {
                    if (document.body.contains(indicator)) {
                        document.body.removeChild(indicator);
                    }
                }, 500);
            }
        }, 5000);
    }

    handleNewOrder(orderData) {
        // Handle new order notification
        console.log('New order received:', orderData);
        
        // In a real implementation, this might:
        // 1. Send notification to pharmacy staff
        // 2. Update inventory
        // 3. Trigger order processing workflow
        
        this.showOrderNotification(orderData.orderNumber);
    }

    showOrderNotification(orderNumber) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: #17a2b8;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 5000;
            max-width: 300px;
        `;
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <i class="fas fa-bell"></i>
                <div>
                    <strong>New Order Received!</strong>
                    <br>
                    <small>Order #${orderNumber}</small>
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

    // Utility functions
    formatCurrency(amount) {
        return `ر.س ${amount.toFixed(2)}`;
    }

    formatDate(date) {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    formatTime(date) {
        return new Date(date).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // API simulation functions
    async simulateApiCall(endpoint, data = null, delay = 1000) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Simulate different API responses
                switch (endpoint) {
                    case 'products':
                        resolve({ success: true, data: products.getAllProducts() });
                        break;
                    case 'submit-order':
                        resolve({ 
                            success: true, 
                            orderNumber: `WEB-${Date.now()}`,
                            message: 'Order submitted successfully'
                        });
                        break;
                    default:
                        reject(new Error('Unknown endpoint'));
                }
            }, delay);
        });
    }
}

// Global utility functions
function scrollToProducts() {
    app.scrollToSection('products');
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 5000;
        color: white;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
    `;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        ${message}
    `;

    document.body.appendChild(notification);

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
    }, 3000);
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new OnlinePharmacyApp();
    console.log('VivaLife Online Pharmacy initialized successfully!');
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        // Refresh cart and products when page becomes visible
        cart.updateCartDisplay();
    }
});

// Handle online/offline status
window.addEventListener('online', () => {
    showNotification('Connection restored', 'success');
});

window.addEventListener('offline', () => {
    showNotification('You are offline. Some features may not work.', 'error');
});
