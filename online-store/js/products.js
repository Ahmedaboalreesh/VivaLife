// Products Management
class ProductsManager {
    constructor() {
        this.products = [];
        this.filteredProducts = [];
        this.currentPage = 1;
        this.productsPerPage = 12;
        this.init();
    }

    init() {
        this.loadProducts();
        this.setupEventListeners();
        this.displayProducts();
    }

    setupEventListeners() {
        // Search functionality
        document.getElementById('search-products-btn').addEventListener('click', () => {
            this.searchProducts();
        });

        document.getElementById('product-search').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchProducts();
            }
        });

        // Category filter
        document.getElementById('category-filter').addEventListener('change', () => {
            this.filterProducts();
        });

        // Load more products
        document.getElementById('load-more-btn').addEventListener('click', () => {
            this.loadMoreProducts();
        });
    }

    loadProducts() {
        // Load products from pharmacy system inventory
        this.loadFromPharmacyInventory();
        
        // Fallback to sample data if no pharmacy data available
        if (this.products.length === 0) {
            this.loadSampleProducts();
        }
        
        this.filteredProducts = [...this.products];
    }

    loadFromPharmacyInventory() {
        try {
            // Get products from the main pharmacy system
            const pharmacyProducts = JSON.parse(localStorage.getItem('pharmacy_products') || '[]');
            const pharmacies = JSON.parse(localStorage.getItem('pharmacy_pharmacies') || '[]');
            
            // Check if we have pharmacy data (integrated mode)
            if (pharmacyProducts.length > 0) {
                // Get the first pharmacy ID
                const firstPharmacy = pharmacies.length > 0 ? pharmacies[0] : { id: 'PHARM001' };
                
                // Filter products for the first pharmacy and convert to e-commerce format
                const pharmacyInventory = pharmacyProducts.filter(product => 
                    product.pharmacyId === firstPharmacy.id && 
                    product.currentStock > 0 && // Only show in-stock items
                    this.isProductSuitableForOnlineSale(product)
                );

                this.products = pharmacyInventory.map(product => this.convertPharmacyProductToEcommerce(product));
                
                console.log(`Loaded ${this.products.length} products from pharmacy inventory (integrated mode)`);
            } else {
                // Standalone mode - no pharmacy data available
                console.log('No pharmacy data found - running in standalone mode');
                this.products = [];
            }
            
        } catch (error) {
            console.warn('Could not load pharmacy inventory:', error);
            this.products = [];
        }
    }

    isProductSuitableForOnlineSale(product) {
        // Define criteria for products suitable for online sale
        const unsuitableCategories = ['controlled-substances', 'refrigerated-high-risk'];
        const requiresSpecialHandling = product.name && (
            product.name.toLowerCase().includes('insulin') ||
            product.name.toLowerCase().includes('vaccine') ||
            product.name.toLowerCase().includes('injection')
        );

        return !unsuitableCategories.includes(product.category) && !requiresSpecialHandling;
    }

    convertPharmacyProductToEcommerce(pharmacyProduct) {
        // Convert pharmacy product format to e-commerce format
        return {
            id: pharmacyProduct.id || pharmacyProduct.sku,
            name: pharmacyProduct.name,
            description: this.generateProductDescription(pharmacyProduct),
            price: pharmacyProduct.price || 0,
            category: this.mapPharmacyCategory(pharmacyProduct.category),
            image: this.getProductIcon(pharmacyProduct.category, pharmacyProduct.name),
            inStock: pharmacyProduct.currentStock > 0,
            currentStock: pharmacyProduct.currentStock,
            minStock: pharmacyProduct.minStock,
            prescription: this.requiresPrescription(pharmacyProduct),
            sku: pharmacyProduct.sku,
            batchNumber: pharmacyProduct.batchNumber,
            expiryDate: pharmacyProduct.expiryDate,
            pharmacyId: pharmacyProduct.pharmacyId
        };
    }

    generateProductDescription(product) {
        // Generate a user-friendly description based on product data
        let description = '';
        
        if (product.category === 'medicines') {
            description = `Effective medication for therapeutic use. `;
        } else if (product.category === 'vitamins') {
            description = `Essential supplement for health and wellness. `;
        } else if (product.category === 'cosmetics') {
            description = `Quality cosmetic product for personal care. `;
        } else {
            description = `High-quality health and wellness product. `;
        }

        if (product.batchNumber) {
            description += `Batch: ${product.batchNumber}. `;
        }

        if (product.expiryDate) {
            const expiryDate = new Date(product.expiryDate);
            const now = new Date();
            const monthsToExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24 * 30));
            
            if (monthsToExpiry > 12) {
                description += `Long shelf life.`;
            } else if (monthsToExpiry > 6) {
                description += `Fresh stock available.`;
            }
        }

        return description.trim();
    }

    mapPharmacyCategory(pharmacyCategory) {
        // Map pharmacy categories to e-commerce categories
        const categoryMap = {
            'medicines': 'medicines',
            'cosmetics': 'cosmetics',
            'diaber': 'medical-devices',
            'milk': 'baby-care',
            'refrigerated': 'medicines',
            'vitamins': 'vitamins',
            'supplements': 'vitamins'
        };

        return categoryMap[pharmacyCategory] || 'personal-care';
    }

    getProductIcon(category, productName) {
        // Return appropriate FontAwesome icon based on category and name
        const name = productName ? productName.toLowerCase() : '';
        
        if (name.includes('insulin') || name.includes('syringe')) {
            return 'fas fa-syringe';
        } else if (name.includes('thermometer')) {
            return 'fas fa-thermometer-half';
        } else if (name.includes('pressure') || name.includes('monitor')) {
            return 'fas fa-heartbeat';
        } else if (category === 'medicines') {
            return name.includes('syrup') || name.includes('liquid') ? 'fas fa-prescription-bottle' : 'fas fa-pills';
        } else if (category === 'vitamins' || category === 'supplements') {
            return 'fas fa-capsules';
        } else if (category === 'cosmetics') {
            return 'fas fa-spa';
        } else if (category === 'baby-care' || category === 'milk') {
            return 'fas fa-baby';
        } else {
            return 'fas fa-prescription-bottle-alt';
        }
    }

    requiresPrescription(product) {
        // Determine if product requires prescription based on name and category
        const prescriptionKeywords = [
            'insulin', 'antibiotic', 'steroid', 'controlled',
            'prescription', 'rx', 'morphine', 'codeine'
        ];

        const productName = product.name ? product.name.toLowerCase() : '';
        return prescriptionKeywords.some(keyword => productName.includes(keyword));
    }

    loadSampleProducts() {
        // Fallback sample products if pharmacy inventory is not available
        this.products = [
            {
                id: 'PROD001',
                name: 'Paracetamol 500mg',
                description: 'Pain relief and fever reducer. Pack of 20 tablets.',
                price: 15.00,
                category: 'medicines',
                image: 'fas fa-pills',
                inStock: true,
                currentStock: 50,
                prescription: false,
                sku: 'PAR500'
            },
            {
                id: 'PROD002',
                name: 'Vitamin D3 1000IU',
                description: 'Essential vitamin for bone health and immunity. 60 capsules.',
                price: 45.00,
                category: 'vitamins',
                image: 'fas fa-capsules',
                inStock: true,
                currentStock: 30,
                prescription: false,
                sku: 'VIT1000'
            },
            {
                id: 'PROD003',
                name: 'Ibuprofen 400mg',
                description: 'Anti-inflammatory pain relief. Pack of 30 tablets.',
                price: 25.00,
                category: 'medicines',
                image: 'fas fa-pills',
                inStock: true,
                currentStock: 25,
                prescription: false,
                sku: 'IBU400'
            },
            {
                id: 'PROD004',
                name: 'Multivitamin Complex',
                description: 'Complete daily nutrition support. 90 tablets.',
                price: 65.00,
                category: 'vitamins',
                image: 'fas fa-capsules',
                inStock: true,
                prescription: false
            },
            {
                id: 'PROD005',
                name: 'Omega-3 Fish Oil',
                description: 'Heart and brain health support. 60 softgels.',
                price: 55.00,
                category: 'vitamins',
                image: 'fas fa-capsules',
                inStock: true,
                prescription: false
            },
            {
                id: 'PROD006',
                name: 'Cough Syrup 100ml',
                description: 'Effective cough relief for adults and children.',
                price: 35.00,
                category: 'medicines',
                image: 'fas fa-prescription-bottle',
                inStock: true,
                prescription: false
            },
            {
                id: 'PROD007',
                name: 'Antiseptic Cream',
                description: 'Wound care and infection prevention. 50g tube.',
                price: 20.00,
                category: 'personal-care',
                image: 'fas fa-prescription-bottle-alt',
                inStock: true,
                prescription: false
            },
            {
                id: 'PROD008',
                name: 'Baby Formula 400g',
                description: 'Nutritious infant formula for healthy growth.',
                price: 85.00,
                category: 'baby-care',
                image: 'fas fa-baby',
                inStock: true,
                prescription: false
            },
            {
                id: 'PROD009',
                name: 'Sunscreen SPF 50',
                description: 'Broad spectrum UV protection. 100ml.',
                price: 40.00,
                category: 'cosmetics',
                image: 'fas fa-sun',
                inStock: true,
                prescription: false
            },
            {
                id: 'PROD010',
                name: 'Hand Sanitizer 250ml',
                description: '70% alcohol-based hand sanitizer.',
                price: 18.00,
                category: 'personal-care',
                image: 'fas fa-pump-soap',
                inStock: true,
                prescription: false
            },
            {
                id: 'PROD011',
                name: 'Calcium + Magnesium',
                description: 'Bone and muscle health supplement. 120 tablets.',
                price: 50.00,
                category: 'vitamins',
                image: 'fas fa-capsules',
                inStock: true,
                prescription: false
            },
            {
                id: 'PROD012',
                name: 'Throat Lozenges',
                description: 'Soothing relief for sore throat. Pack of 24.',
                price: 12.00,
                category: 'medicines',
                image: 'fas fa-pills',
                inStock: true,
                prescription: false
            },
            {
                id: 'PROD013',
                name: 'Insulin Pen',
                description: 'Diabetes management insulin delivery system.',
                price: 120.00,
                category: 'medicines',
                image: 'fas fa-syringe',
                inStock: true,
                prescription: true
            },
            {
                id: 'PROD014',
                name: 'Blood Pressure Monitor',
                description: 'Digital automatic blood pressure monitor.',
                price: 180.00,
                category: 'medical-devices',
                image: 'fas fa-heartbeat',
                inStock: true,
                prescription: false
            },
            {
                id: 'PROD015',
                name: 'Thermometer Digital',
                description: 'Fast and accurate digital thermometer.',
                price: 35.00,
                category: 'medical-devices',
                image: 'fas fa-thermometer-half',
                inStock: true,
                prescription: false
            }
        ];

        this.filteredProducts = [...this.products];
    }

    searchProducts() {
        const searchTerm = document.getElementById('product-search').value.toLowerCase();
        
        if (searchTerm.trim() === '') {
            this.filteredProducts = [...this.products];
        } else {
            this.filteredProducts = this.products.filter(product =>
                product.name.toLowerCase().includes(searchTerm) ||
                product.description.toLowerCase().includes(searchTerm) ||
                product.category.toLowerCase().includes(searchTerm)
            );
        }

        this.currentPage = 1;
        this.displayProducts();
    }

    filterProducts() {
        const category = document.getElementById('category-filter').value;
        const searchTerm = document.getElementById('product-search').value.toLowerCase();

        let filtered = [...this.products];

        // Apply category filter
        if (category) {
            filtered = filtered.filter(product => product.category === category);
        }

        // Apply search filter
        if (searchTerm.trim() !== '') {
            filtered = filtered.filter(product =>
                product.name.toLowerCase().includes(searchTerm) ||
                product.description.toLowerCase().includes(searchTerm)
            );
        }

        this.filteredProducts = filtered;
        this.currentPage = 1;
        this.displayProducts();
    }

    displayProducts() {
        const productsGrid = document.getElementById('products-grid');
        const startIndex = 0;
        const endIndex = this.currentPage * this.productsPerPage;
        const productsToShow = this.filteredProducts.slice(startIndex, endIndex);

        if (this.currentPage === 1) {
            productsGrid.innerHTML = '';
        }

        productsToShow.forEach(product => {
            const productCard = this.createProductCard(product);
            productsGrid.appendChild(productCard);
        });

        // Update load more button
        const loadMoreBtn = document.getElementById('load-more-btn');
        if (endIndex >= this.filteredProducts.length) {
            loadMoreBtn.style.display = 'none';
        } else {
            loadMoreBtn.style.display = 'block';
        }

        // Show no products message if empty
        if (this.filteredProducts.length === 0) {
            productsGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: #666;">
                    <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                    <h3>No products found</h3>
                    <p>Try adjusting your search or filter criteria.</p>
                </div>
            `;
        }
    }

    createProductCard(product) {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="product-image">
                <i class="${product.image}"></i>
            </div>
            <div class="product-info">
                <div class="product-name">${product.name}</div>
                <div class="product-description">${product.description}</div>
                <div class="product-price">ر.س ${product.price.toFixed(2)}</div>
                <div class="product-actions">
                    <button class="add-to-cart" onclick="cart.addToCart('${product.id}')" ${!product.inStock ? 'disabled' : ''}>
                        <i class="fas fa-cart-plus"></i>
                        ${product.inStock ? 'Add to Cart' : 'Out of Stock'}
                    </button>
                    <button class="product-favorite" onclick="products.toggleFavorite('${product.id}')">
                        <i class="fas fa-heart"></i>
                    </button>
                </div>
                ${product.prescription ? '<div class="prescription-required"><i class="fas fa-prescription"></i> Prescription Required</div>' : ''}
            </div>
        `;
        return card;
    }

    loadMoreProducts() {
        this.currentPage++;
        this.displayProducts();
    }

    toggleFavorite(productId) {
        // In a real implementation, this would save to user preferences
        const button = event.target.closest('.product-favorite');
        button.classList.toggle('favorited');
        
        if (button.classList.contains('favorited')) {
            button.style.color = '#ff4757';
            button.style.borderColor = '#ff4757';
        } else {
            button.style.color = '#666';
            button.style.borderColor = '#ddd';
        }
    }

    getProduct(productId) {
        return this.products.find(product => product.id === productId);
    }

    getAllProducts() {
        return this.products;
    }
}

// Initialize products manager
const products = new ProductsManager();
