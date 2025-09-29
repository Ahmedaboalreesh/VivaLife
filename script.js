// Pharmacy Management System - Main JavaScript File

class PharmacyManagementSystem {
    constructor() {
        this.products = this.loadData('products') || [];
        this.staff = this.loadData('staff') || [];
        this.dispensingHistory = this.loadData('dispensingHistory') || [];
        this.currentUser = this.loadData('currentUser') || null;
        this.currentPharmacy = this.loadData('currentPharmacy') || null;
        this.pharmacies = this.loadData('pharmacies') || [];
        this.systemSettings = this.loadData('systemSettings') || {
            currency: 'SAR',
            dateFormat: 'DD/MM/YYYY',
            sessionTimeout: 30,
            requirePasswordChange: false,
            adminUsername: 'admin',
            adminPassword: 'admin123'
        };
        this.privileges = [];
        this.editingPrivilege = null;
        this.cart = [];
        this.returnItems = [];
        this.returnHistory = this.loadData('returnHistory') || [];
        this.selectedReturnProduct = null;
        this.selectedInvoice = null;
        this.favoriteProducts = [];
        
        // Agents data
        this.agents = this.loadData('agents') || [];
        this.editingAgent = null;
        
        // RSD Tracking data
        this.rsdData = {
            scannedBoxes: this.loadData('rsdScannedBoxes') || [],
            activeRecalls: this.loadData('rsdActiveRecalls') || [],
            flaggedIssues: this.loadData('rsdFlaggedIssues') || [],
            complianceRate: this.loadData('rsdComplianceRate') || 0,
            lastSubmission: this.loadData('rsdLastSubmission') || null,
            apiStatus: 'unknown',
            auditTrail: this.loadData('rsdAuditTrail') || []
        };
        
        // Loyalty Program data
        this.customers = this.loadData('customers') || [];
        this.loyaltyTransactions = this.loadData('loyaltyTransactions') || [];
        this.selectedCustomer = null;
        this.editingCustomer = null;
        this.selectedDispensingCustomer = null;
        this.currentRedemption = null;
        this.appliedDiscount = null;
        this.appliedOffer = null;
        
        // Discounts & Offers data
        this.discounts = this.loadData('discounts') || [];
        this.offers = this.loadData('offers') || [];
        this.discountHistory = this.loadData('discountHistory') || [];
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupDefaultData();
        this.updateCurrencyDisplay();
        this.initializeLogin();
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

        // Auto-sync role and privilege fields
        document.getElementById('staff-role').addEventListener('change', (e) => {
            document.getElementById('staff-privilege').value = e.target.value;
        });

        // Reports
        document.getElementById('generate-inventory-report').addEventListener('click', () => {
            this.generateInventoryReport();
        });

        document.getElementById('generate-dispensing-report').addEventListener('click', () => {
            this.generateDispensingReport();
        });

        document.getElementById('generate-staff-report').addEventListener('click', () => {
            this.generateStaffReport();
        });

        document.getElementById('generate-returns-report').addEventListener('click', () => {
            this.generateReturnsReport();
        });

        document.getElementById('generate-favorites-performance-report').addEventListener('click', () => {
            this.generateFavoritesPerformanceReport();
        });

        // Report actions
        document.getElementById('export-report-btn').addEventListener('click', () => {
            this.exportReport();
        });

        document.getElementById('print-report-btn').addEventListener('click', () => {
            this.printReport();
        });

        document.getElementById('close-report-btn').addEventListener('click', () => {
            this.closeReport();
        });

        // Login functionality
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            console.log('Form submit event triggered');
            this.handleLogin();
        });

        // Also add click event listener to the login button as backup
        document.querySelector('.login-btn').addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Login button clicked directly');
            this.handleLogin();
        });

        // Login type toggle
        document.getElementById('staff-login-toggle').addEventListener('click', () => {
            this.switchLoginType('staff');
        });

        document.getElementById('admin-login-toggle').addEventListener('click', () => {
            this.switchLoginType('admin');
        });

        // Admin authentication
        document.getElementById('close-admin-auth').addEventListener('click', () => {
            this.closeModal('admin-auth-modal');
        });

        document.getElementById('cancel-admin-auth').addEventListener('click', () => {
            this.closeModal('admin-auth-modal');
        });

        document.getElementById('confirm-delete-pharmacy').addEventListener('click', () => {
            this.authenticateAndDeletePharmacy();
        });

        document.getElementById('update-admin-credentials').addEventListener('click', () => {
            this.updateAdminCredentials();
        });

        // Privilege management
        document.getElementById('add-privilege-btn').addEventListener('click', () => {
            this.openPrivilegeModal();
        });

        document.getElementById('save-privilege').addEventListener('click', () => {
            this.savePrivilege();
        });

        document.getElementById('cancel-privilege').addEventListener('click', () => {
            this.closeModal('privilege-modal');
        });

        document.getElementById('close-privilege').addEventListener('click', () => {
            this.closeModal('privilege-modal');
        });

        // Privilege search and filter
        document.getElementById('privilege-search').addEventListener('input', (e) => {
            this.filterPrivileges();
        });

        document.getElementById('privilege-type-filter').addEventListener('change', (e) => {
            this.filterPrivileges();
        });

        // Favorites functionality
        document.getElementById('refresh-favorites-btn').addEventListener('click', () => {
            this.loadFavorites();
        });

        document.getElementById('export-favorites-btn').addEventListener('click', () => {
            this.exportFavorites();
        });

        document.getElementById('favorites-search').addEventListener('input', (e) => {
            this.filterFavorites();
        });

        document.getElementById('favorites-category-filter').addEventListener('change', (e) => {
            this.filterFavorites();
        });

        document.getElementById('favorites-sort').addEventListener('change', (e) => {
            this.sortFavorites();
        });

        // RSD Tracking functionality
        document.getElementById('verify-barcode').addEventListener('click', () => {
            this.verifyBarcode();
        });

        document.getElementById('barcode-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.verifyBarcode();
            }
        });

        document.getElementById('refresh-recalls').addEventListener('click', () => {
            this.refreshRecalls();
        });

        document.getElementById('recall-severity-filter').addEventListener('change', (e) => {
            this.filterRecalls(e.target.value);
        });

        document.getElementById('generate-rsd-report').addEventListener('click', () => {
            this.generateRSDReport();
        });

        document.getElementById('export-compliance-csv').addEventListener('click', () => {
            this.exportComplianceCSV();
        });

        document.getElementById('export-compliance-pdf').addEventListener('click', () => {
            this.exportCompliancePDF();
        });

        document.getElementById('view-audit-trail').addEventListener('click', () => {
            this.viewAuditTrail();
        });

        // Inventory tabs
        document.querySelectorAll('.inventory-tabs .tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchInventoryTab(e.target.dataset.tab);
            });
        });

        // Add permission checks to critical actions
        this.addPermissionChecks();

        // Agents functionality
        document.getElementById('add-agent-btn').addEventListener('click', () => {
            this.addAgent();
        });

        document.getElementById('save-agent').addEventListener('click', () => {
            this.saveAgent();
        });

        document.getElementById('cancel-agent').addEventListener('click', () => {
            this.closeAgentModal();
        });

        document.getElementById('close-agent-modal').addEventListener('click', () => {
            this.closeAgentModal();
        });

        document.getElementById('agent-search').addEventListener('input', (e) => {
            this.searchAgents(e.target.value);
        });

        document.getElementById('agent-status-filter').addEventListener('change', (e) => {
            this.filterAgents();
        });

        document.getElementById('agent-type-filter').addEventListener('change', (e) => {
            this.filterAgents();
        });

        // Returns functionality
        document.getElementById('return-search').addEventListener('input', (e) => {
            this.searchReturnProducts(e.target.value);
        });

        document.getElementById('return-scan-btn').addEventListener('click', () => {
            this.scanReturnProduct();
        });

        document.getElementById('add-return-item').addEventListener('click', () => {
            this.addReturnItem();
        });

        document.getElementById('clear-return-form').addEventListener('click', () => {
            this.clearReturnForm();
        });

        document.getElementById('process-returns').addEventListener('click', () => {
            this.processReturns();
        });

        document.getElementById('clear-return-list').addEventListener('click', () => {
            this.clearReturnList();
        });

        document.getElementById('refresh-returns').addEventListener('click', () => {
            this.loadReturnHistory();
        });

        // Invoice selection and viewing
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('select-invoice')) {
                const invoiceId = e.target.getAttribute('data-invoice-id');
                this.selectInvoiceForReturn(invoiceId);
            } else if (e.target.classList.contains('view-invoice-details')) {
                const invoiceId = e.target.getAttribute('data-invoice-id');
                this.viewInvoiceDetails(invoiceId);
            }
        });

        document.getElementById('refresh-staff-btn').addEventListener('click', () => {
            this.loadStaff();
            this.showMessage('Staff list refreshed!', 'info');
        });


        // View toggle
        document.getElementById('card-view-btn').addEventListener('click', () => {
            this.switchStaffView('card');
        });

        document.getElementById('table-view-btn').addEventListener('click', () => {
            this.switchStaffView('table');
        });

        document.getElementById('save-staff').addEventListener('click', () => {
            this.saveStaff();
        });

        document.getElementById('cancel-staff').addEventListener('click', () => {
            this.closeModal('staff-modal');
        });

        // Close button (×) event listener
        document.querySelector('#staff-modal .close').addEventListener('click', () => {
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

        document.getElementById('print-receipt-btn').addEventListener('click', () => {
            this.printReceipt();
        });

        // Add preview receipt button
        document.getElementById('preview-receipt-btn').addEventListener('click', () => {
            this.previewReceipt();
        });

        // Search and filter
        document.getElementById('product-search').addEventListener('input', (e) => {
            this.filterInventory(e.target.value);
        });

        document.getElementById('category-filter').addEventListener('change', (e) => {
            this.filterByCategory(e.target.value);
        });

        // Excel upload functionality
        document.getElementById('download-template-btn').addEventListener('click', () => {
            this.downloadExcelTemplate();
        });

        document.getElementById('excel-upload').addEventListener('change', (e) => {
            this.handleExcelUpload(e);
        });

        // Export inventory button
        document.getElementById('export-inventory-btn').addEventListener('click', () => {
            this.exportInventoryToExcel();
        });


        // Generate SKU button
        document.getElementById('generate-sku-btn').addEventListener('click', () => {
            this.generateSKU();
        });

        // Auto-generate SKU when category changes
        document.getElementById('product-category').addEventListener('change', (e) => {
            // Only auto-generate if we're in add mode (not editing existing product)
            if (!this.editingProduct) {
                const newSKU = this.generateUniqueSKU(e.target.value);
                document.getElementById('product-sku').value = newSKU;
            }
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

        // Window resize handler for chart
        window.addEventListener('resize', () => {
            if (this.dispensingChart) {
                this.dispensingChart.resize();
            }
        });

        // Admin functionality
        document.getElementById('add-pharmacy-btn').addEventListener('click', () => {
            this.openPharmacyModal();
        });

        document.getElementById('save-pharmacy').addEventListener('click', () => {
            this.savePharmacy();
        });

        document.getElementById('cancel-pharmacy').addEventListener('click', () => {
            this.closeModal('pharmacy-modal');
        });

        // Admin tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchAdminTab(e.target.dataset.tab);
            });
        });

        // Pharmacy search and filter
        document.getElementById('pharmacy-search').addEventListener('input', (e) => {
            this.filterPharmacies(e.target.value);
        });

        document.getElementById('pharmacy-status-filter').addEventListener('change', (e) => {
            this.filterPharmaciesByStatus(e.target.value);
        });

        // Backup functionality
        document.getElementById('create-backup-btn').addEventListener('click', () => {
            this.createBackup();
        });

        document.getElementById('restore-file').addEventListener('change', (e) => {
            this.restoreBackup(e);
        });

        // System settings
        document.getElementById('default-currency').addEventListener('change', (e) => {
            this.updateSystemSetting('currency', e.target.value);
        });

        document.getElementById('date-format').addEventListener('change', (e) => {
            this.updateSystemSetting('dateFormat', e.target.value);
        });

        document.getElementById('session-timeout').addEventListener('change', (e) => {
            this.updateSystemSetting('sessionTimeout', parseInt(e.target.value));
        });

        document.getElementById('require-password-change').addEventListener('change', (e) => {
            this.updateSystemSetting('requirePasswordChange', e.target.checked);
        });

        // Loyalty Program functionality
        document.getElementById('add-customer-btn').addEventListener('click', () => {
            this.openCustomerModal();
        });

        document.getElementById('search-customer-btn').addEventListener('click', () => {
            this.searchCustomers();
        });

        document.getElementById('customer-search').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchCustomers();
            }
        });

        document.getElementById('save-customer').addEventListener('click', (e) => {
            e.preventDefault();
            this.saveCustomer();
        });

        document.getElementById('cancel-customer').addEventListener('click', () => {
            this.closeModal('customer-modal');
        });

        document.getElementById('close-customer-modal').addEventListener('click', () => {
            this.closeModal('customer-modal');
        });

        // Prevent form submission
        document.getElementById('customer-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCustomer();
        });

        document.getElementById('add-points-btn').addEventListener('click', () => {
            this.openAddPointsModal();
        });

        document.getElementById('redeem-points-btn').addEventListener('click', () => {
            this.openRedemptionSection();
        });

        document.getElementById('confirm-add-points').addEventListener('click', () => {
            this.addPointsToCustomer();
        });

        document.getElementById('cancel-add-points').addEventListener('click', () => {
            this.closeModal('add-points-modal');
        });

        document.getElementById('close-add-points-modal').addEventListener('click', () => {
            this.closeModal('add-points-modal');
        });

        document.getElementById('redemption-amount').addEventListener('input', (e) => {
            this.updateRedemptionPreview();
        });

        document.getElementById('confirm-redemption-btn').addEventListener('click', () => {
            this.confirmRedemption();
        });

        document.getElementById('cancel-redemption-btn').addEventListener('click', () => {
            this.closeRedemptionSection();
        });

        document.getElementById('customers-filter').addEventListener('input', (e) => {
            this.filterCustomers(e.target.value);
        });

        document.getElementById('customers-sort').addEventListener('change', (e) => {
            this.sortCustomers(e.target.value);
        });

        document.getElementById('generate-loyalty-report').addEventListener('click', () => {
            this.generateLoyaltyReport();
        });

        document.getElementById('export-loyalty-data').addEventListener('click', () => {
            this.exportLoyaltyData();
        });

        document.getElementById('refresh-loyalty-btn').addEventListener('click', () => {
            this.loadLoyaltyProgram();
        });

        // Dispensing Loyalty functionality
        document.getElementById('lookup-customer-btn').addEventListener('click', () => {
            this.lookupCustomerForDispensing();
        });

        document.getElementById('customer-phone-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.lookupCustomerForDispensing();
            }
        });

        document.getElementById('customer-phone-input').addEventListener('input', () => {
            this.updateLoyaltyPreview();
        });

        // Dispensing Redemption functionality
        document.getElementById('redeem-rewards-btn').addEventListener('click', () => {
            this.openDispensingRedemptionModal();
        });

        document.getElementById('close-dispensing-redemption-modal').addEventListener('click', () => {
            this.closeModal('dispensing-redemption-modal');
        });

        document.getElementById('cancel-dispensing-redemption').addEventListener('click', () => {
            this.closeModal('dispensing-redemption-modal');
        });

        document.getElementById('redemption-points-amount').addEventListener('input', () => {
            this.updateDispensingRedemptionPreview();
        });

        document.getElementById('confirm-dispensing-redemption').addEventListener('click', () => {
            this.confirmDispensingRedemption();
        });

        // Clear cart functionality
        document.getElementById('clear-cart-btn').addEventListener('click', () => {
            this.clearCartWithConfirmation();
        });

        // Discount code functionality
        document.getElementById('apply-discount-btn').addEventListener('click', () => {
            this.applyDiscountCode();
        });

        document.getElementById('discount-code-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.applyDiscountCode();
            }
        });

        document.getElementById('remove-discount-btn').addEventListener('click', () => {
            this.removeDiscountCode();
        });

        // Apply offer functionality
        document.getElementById('apply-offer-btn').addEventListener('click', () => {
            this.openOfferSelectionModal();
        });

        document.getElementById('remove-offer-btn').addEventListener('click', () => {
            this.removeAppliedOffer();
        });

        // Offer selection modal functionality
        document.getElementById('close-offer-selection-modal').addEventListener('click', () => {
            this.closeModal('offer-selection-modal');
        });

        document.getElementById('cancel-offer-selection').addEventListener('click', () => {
            this.closeModal('offer-selection-modal');
        });

        document.getElementById('confirm-offer-selection').addEventListener('click', () => {
            this.confirmOfferSelection();
        });

        // Discounts & Offers functionality
        document.getElementById('add-discount-btn').addEventListener('click', () => {
            this.openDiscountModal();
        });

        document.getElementById('add-offer-btn').addEventListener('click', () => {
            this.openOfferModal();
        });

        document.getElementById('refresh-discounts-btn').addEventListener('click', () => {
            this.loadDiscounts();
        });

        // Discount modal events
        document.getElementById('close-discount-modal').addEventListener('click', () => {
            this.closeModal('discount-modal');
        });

        document.getElementById('cancel-discount').addEventListener('click', () => {
            this.closeModal('discount-modal');
        });

        document.getElementById('save-discount').addEventListener('click', () => {
            this.saveDiscount();
        });

        // Offer modal events
        document.getElementById('close-offer-modal').addEventListener('click', () => {
            this.closeModal('offer-modal');
        });

        document.getElementById('cancel-offer').addEventListener('click', () => {
            this.closeModal('offer-modal');
        });

        document.getElementById('save-offer').addEventListener('click', () => {
            this.saveOffer();
        });

        // History filters
        document.getElementById('discount-history-filter').addEventListener('change', () => {
            this.filterDiscountHistory();
        });

        document.getElementById('discount-date-from').addEventListener('change', () => {
            this.filterDiscountHistory();
        });

        document.getElementById('discount-date-to').addEventListener('change', () => {
            this.filterDiscountHistory();
        });

        // Product selection buttons (will be added when modal opens)
        document.addEventListener('click', (e) => {
            if (e.target.id === 'select-all-products') {
                this.selectAllProducts();
            } else if (e.target.id === 'clear-all-products') {
                this.clearAllProducts();
            }
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
            case 'returns':
                this.loadReturns();
                break;
            case 'rsd-tracking':
                this.loadRSDTracking();
                break;
            case 'loyalty':
                this.loadLoyaltyProgram();
                break;
            case 'discounts':
                this.loadDiscounts();
                break;
            case 'admin':
                this.loadAdmin();
                break;
        }
    }

    // Dashboard functionality
    loadDashboard() {
        this.updatePharmacyIndicator();
        this.updateDashboardStats();
        this.createDispensingChart();
        this.loadLowStockItems();
    }

    updatePharmacyIndicator() {
        const pharmacyNameElement = document.getElementById('current-pharmacy-name');
        if (pharmacyNameElement) {
            if (this.currentPharmacy) {
                pharmacyNameElement.textContent = this.currentPharmacy.name;
            } else {
                pharmacyNameElement.textContent = 'No Pharmacy Selected';
            }
        }
    }

    updateDashboardStats() {
        // Filter data by current pharmacy
        const currentPharmacyId = this.currentPharmacy ? this.currentPharmacy.id : 'PHARM001';
        const pharmacyProducts = this.products.filter(p => p.pharmacyId === currentPharmacyId);
        const pharmacyStaff = this.staff.filter(s => s.pharmacyId === currentPharmacyId);
        const pharmacyDispensingHistory = this.dispensingHistory.filter(d => d.pharmacyId === currentPharmacyId);
        
        const totalProducts = pharmacyProducts.length;
        const lowStockItems = pharmacyProducts.filter(p => p.currentStock <= p.minStock).length;
        const dispensedToday = this.getDispensedToday(pharmacyDispensingHistory);
        const activeStaff = pharmacyStaff.length;

        document.getElementById('total-products').textContent = totalProducts;
        document.getElementById('low-stock').textContent = lowStockItems;
        document.getElementById('dispensed-today').textContent = dispensedToday;
        document.getElementById('active-staff').textContent = activeStaff;
    }

    getDispensedToday(dispensingHistory = null) {
        const today = new Date().toDateString();
        const history = dispensingHistory || this.dispensingHistory;
        return history.filter(record => {
            // Handle both old format (date) and new format (timestamp)
            const recordDate = record.timestamp ? record.timestamp : record.date;
            return new Date(recordDate).toDateString() === today;
        }).length;
    }

    createDispensingChart() {
        const ctx = document.getElementById('dispensing-chart');
        if (!ctx) return;

        // Destroy existing chart if it exists
        if (this.dispensingChart) {
            this.dispensingChart.destroy();
        }

        // Filter dispensing history by current pharmacy
        const currentPharmacyId = this.currentPharmacy ? this.currentPharmacy.id : 'PHARM001';
        const pharmacyDispensingHistory = this.dispensingHistory.filter(d => d.pharmacyId === currentPharmacyId);
        
        const last7Days = this.getLast7DaysData(pharmacyDispensingHistory);
        
        this.dispensingChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: last7Days.map(day => day.date),
                datasets: [{
                    label: 'Dispensed Items',
                    data: last7Days.map(day => day.count),
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 3,
                    pointBackgroundColor: '#667eea',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#667eea',
                        borderWidth: 1,
                        cornerRadius: 8
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#7f8c8d',
                            font: {
                                size: 12
                            }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#7f8c8d',
                            font: {
                                size: 12
                            },
                            stepSize: 1
                        }
                    }
                },
                elements: {
                    line: {
                        tension: 0.4
                    }
                }
            }
        });

        // Resize chart after a short delay to ensure container is properly sized
        setTimeout(() => {
            if (this.dispensingChart) {
                this.dispensingChart.resize();
            }
        }, 100);
    }

    getLast7DaysData(dispensingHistory = null) {
        const history = dispensingHistory || this.dispensingHistory;
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateString = date.toDateString();
            
            const count = history.filter(record => {
                const recordDate = record.timestamp ? record.timestamp : record.date;
                return new Date(recordDate).toDateString() === dateString;
            }).length;
            
            days.push({
                date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                count: count
            });
        }
        return days;
    }

    loadLowStockItems() {
        const lowStockList = document.getElementById('low-stock-list');
        
        // Filter products by current pharmacy
        const currentPharmacyId = this.currentPharmacy ? this.currentPharmacy.id : 'PHARM001';
        const pharmacyProducts = this.products.filter(p => p.pharmacyId === currentPharmacyId);
        const lowStockItems = pharmacyProducts.filter(p => p.currentStock <= p.minStock);
        
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

    getCurrentPharmacyData() {
        if (!this.currentPharmacy) {
            return this.products;
        }
        
        return this.products.filter(p => p.pharmacyId === this.currentPharmacy.id);
    }

    renderInventoryTable() {
        const tbody = document.getElementById('inventory-table-body');
        const currentPharmacyProducts = this.getCurrentPharmacyData();
        
        if (currentPharmacyProducts.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center">
                        <div style="padding: 2rem; color: #7f8c8d;">
                            <i class="fas fa-box-open" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                            <p>No products found</p>
                            <p>Add your first product to get started</p>
                        </div>
                    </td>
                </tr>
            `;
        } else {
            tbody.innerHTML = currentPharmacyProducts.map(product => `
                <tr>
                    <td>${product.name}</td>
                    <td>${this.capitalizeFirst(product.category)}</td>
                    <td>
                        <span class="sku-display">
                            <span class="sku-number">${product.sku}</span>
                            <span class="sku-category-badge">${this.getCategoryPrefix(product.sku)}</span>
                            ${this.isAutoGeneratedSKU(product.sku) ? '<i class="fas fa-robot" title="Auto-generated SKU"></i>' : ''}
                        </span>
                    </td>
                    <td>
                        <span class="batch-number">${product.batchNumber || 'N/A'}</span>
                    </td>
                    <td class="${product.currentStock <= product.minStock ? 'stock-low' : 'stock-ok'}">
                        ${product.currentStock}
                    </td>
                    <td>${product.minStock}</td>
                    <td>${this.formatCurrency(product.price)}</td>
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
    }

    filterInventory(searchTerm) {
        // Get current pharmacy products first, then filter by search term
        const currentPharmacyProducts = this.getCurrentPharmacyData();
        const filteredProducts = currentPharmacyProducts.filter(product =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.sku.toLowerCase().includes(searchTerm.toLowerCase())
        );
        this.renderFilteredInventory(filteredProducts);
    }

    filterByCategory(category) {
        if (!category || category === '') {
            this.renderInventoryTable();
            return;
        }
        
        // Get current pharmacy products first, then filter by category
        const currentPharmacyProducts = this.getCurrentPharmacyData();
        const filteredProducts = currentPharmacyProducts.filter(product => product.category === category);
        this.renderFilteredInventory(filteredProducts);
    }

    renderAllProductsDirectly() {
        const tbody = document.getElementById('inventory-table-body');
        
        console.log('=== RENDER ALL PRODUCTS DIRECTLY ===');
        console.log('All products:', this.products);
        console.log('Products count:', this.products.length);
        console.log('====================================');
        
        if (this.products.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center">
                        <div style="padding: 2rem; color: #7f8c8d;">
                            <i class="fas fa-box-open" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                            <p>No products found</p>
                            <p>Add your first product to get started</p>
                        </div>
                    </td>
                </tr>
            `;
        } else {
            tbody.innerHTML = this.products.map(product => `
                <tr>
                    <td>${product.name}</td>
                    <td>${this.capitalizeFirst(product.category)}</td>
                    <td>
                        <span class="sku-display">
                            <span class="sku-number">${product.sku}</span>
                            <span class="sku-category-badge">${this.getCategoryPrefix(product.sku)}</span>
                            ${this.isAutoGeneratedSKU(product.sku) ? '<i class="fas fa-robot" title="Auto-generated SKU"></i>' : ''}
                        </span>
                    </td>
                    <td>
                        <span class="batch-number">${product.batchNumber || 'N/A'}</span>
                    </td>
                    <td class="${product.currentStock <= product.minStock ? 'stock-low' : 'stock-ok'}">
                        ${product.currentStock}
                    </td>
                    <td>${product.minStock}</td>
                    <td>${this.formatCurrency(product.price)}</td>
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
    }

    testCategoryFiltering() {
        console.log('=== TEST CATEGORY FILTERING ===');
        console.log('All products:', this.products);
        console.log('Product categories:', this.products.map(p => p.category));
        
        // Test each category
        const categories = ['medicines', 'cosmetics', 'diaber', 'milk', 'refrigerated'];
        
        categories.forEach(category => {
            const filtered = this.products.filter(p => p.category === category);
            console.log(`Category "${category}":`, filtered.length, 'products');
        });
        
        // Test current pharmacy filtering
        const currentPharmacyProducts = this.getCurrentPharmacyData();
        console.log('Current pharmacy products:', currentPharmacyProducts);
        
        // Test medicines filtering with pharmacy
        const medicinesWithPharmacy = currentPharmacyProducts.filter(p => p.category === 'medicines');
        console.log('Medicines with pharmacy filter:', medicinesWithPharmacy);
        
        console.log('================================');
    }

    renderFilteredInventory(products) {
        const tbody = document.getElementById('inventory-table-body');
        
        if (products.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center">
                        <div style="padding: 2rem; color: #7f8c8d;">
                            <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                            <p>No products found matching your search</p>
                            <p>Try adjusting your search criteria</p>
                        </div>
                    </td>
                </tr>
            `;
        } else {
            tbody.innerHTML = products.map(product => `
                <tr>
                    <td>${product.name}</td>
                    <td>${this.capitalizeFirst(product.category)}</td>
                    <td>
                        <span class="sku-display">
                            <span class="sku-number">${product.sku}</span>
                            <span class="sku-category-badge">${this.getCategoryPrefix(product.sku)}</span>
                            ${this.isAutoGeneratedSKU(product.sku) ? '<i class="fas fa-robot" title="Auto-generated SKU"></i>' : ''}
                        </span>
                    </td>
                    <td>
                        <span class="batch-number">${product.batchNumber || 'N/A'}</span>
                    </td>
                    <td class="${product.currentStock <= product.minStock ? 'stock-low' : 'stock-ok'}">
                        ${product.currentStock}
                    </td>
                    <td>${product.minStock}</td>
                    <td>${this.formatCurrency(product.price)}</td>
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
    }

    openProductModal(product = null) {
        const modal = document.getElementById('product-modal');
        const form = document.getElementById('product-form');
        
        if (product) {
            // Edit mode
            document.getElementById('product-name').value = product.name;
            document.getElementById('product-category').value = product.category;
            document.getElementById('product-sku').value = product.sku;
            document.getElementById('product-batch').value = product.batchNumber || '';
            document.getElementById('product-stock').value = product.currentStock;
            document.getElementById('product-min-stock').value = product.minStock;
            document.getElementById('product-price').value = product.price;
            document.getElementById('product-expiry').value = product.expiryDate || '';
        } else {
            // Add mode
            form.reset();
            // Auto-generate SKU for new products based on default category
            const defaultCategory = document.getElementById('product-category').value;
            document.getElementById('product-sku').value = this.generateUniqueSKU(defaultCategory);
        }
        
        modal.style.display = 'block';
        this.editingProduct = product;
    }

    generateSKU() {
        const skuInput = document.getElementById('product-sku');
        const categorySelect = document.getElementById('product-category');
        const selectedCategory = categorySelect.value;
        const newSKU = this.generateUniqueSKU(selectedCategory);
        skuInput.value = newSKU;
        skuInput.focus();
        this.showMessage(`New unique SKU generated for ${this.capitalizeFirst(selectedCategory)} category!`, 'info');
    }

    isAutoGeneratedSKU(sku) {
        // Check if SKU follows the auto-generated format (6 digits starting with 1-5)
        return /^[1-5]\d{5}$/.test(sku);
    }

    getCategoryPrefix(sku) {
        if (!this.isAutoGeneratedSKU(sku)) return '';
        
        const categoryMap = {
            '1': 'MED',
            '2': 'COS',
            '3': 'DIA',
            '4': 'MIL',
            '5': 'REF'
        };
        
        return categoryMap[sku.charAt(0)] || '';
    }

    saveProduct() {
        const form = document.getElementById('product-form');
        const formData = new FormData(form);
        
        const productData = {
            name: document.getElementById('product-name').value,
            category: document.getElementById('product-category').value,
            sku: document.getElementById('product-sku').value.trim(),
            batchNumber: document.getElementById('product-batch').value.trim() || null,
            currentStock: parseInt(document.getElementById('product-stock').value),
            minStock: parseInt(document.getElementById('product-min-stock').value),
            price: parseFloat(document.getElementById('product-price').value),
            expiryDate: document.getElementById('product-expiry').value || null
        };

        // Validate SKU uniqueness
        const existingProduct = this.products.find(p => p.sku === productData.sku);
        if (existingProduct && (!this.editingProduct || existingProduct.sku !== this.editingProduct.sku)) {
            this.showMessage('SKU already exists! Please use a different SKU or generate a new one.', 'error');
            return;
        }

        if (this.editingProduct) {
            // Update existing product
            const index = this.products.findIndex(p => p.sku === this.editingProduct.sku);
            this.products[index] = { ...this.products[index], ...productData };
        } else {
            // Add new product with unique ID
            const productWithId = {
                ...productData,
                id: this.generateUniqueId(),
                pharmacyId: this.currentPharmacy ? this.currentPharmacy.id : null
            };
            this.products.push(productWithId);
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
        this.renderStaffTable();
    }

    renderStaffCards() {
        const staffGrid = document.querySelector('.staff-grid');
        const template = document.getElementById('staff-template');
        
        if (!template) {
            console.error('Staff template not found!');
            return;
        }
        
        // Clear existing cards (except template)
        staffGrid.innerHTML = '';
        
        // Filter staff for current pharmacy
        const currentPharmacyStaff = this.staff.filter(staff => 
            !this.currentPharmacy || staff.pharmacyId === this.currentPharmacy.id
        );
        
        
        currentPharmacyStaff.forEach((member, index) => {
            const card = template.cloneNode(true);
            card.style.display = 'block';
            card.id = `staff-${member.id}`;
            
            card.querySelector('.staff-name').textContent = member.name;
            card.querySelector('.staff-role').textContent = this.formatPrivilegeLevel(member.role || 'warehouse-assistant');
            card.querySelector('.staff-privilege').textContent = this.formatPrivilegeLevel(member.privilege || 'warehouse-assistant');
            card.querySelector('.staff-pharmacy').textContent = this.getPharmacyName(member.pharmacyId);
            card.querySelector('.staff-password').innerHTML = member.password ? 
                '<i class="fas fa-check-circle" style="color: #28a745;"></i> Password Set' :
                '<i class="fas fa-times-circle" style="color: #dc3545;"></i> No Password';
            card.querySelector('.staff-id').textContent = `ID: ${member.id}`;
            
            card.querySelector('.edit-staff').onclick = () => this.editStaff(member);
            card.querySelector('.delete-staff').onclick = () => this.deleteStaff(member.id);
            
            staffGrid.appendChild(card);
        });
    }

    renderStaffTable() {
        const tableBody = document.getElementById('staff-table-body');
        
        // Clear existing table rows
        tableBody.innerHTML = '';
        
        // Filter staff for current pharmacy
        const currentPharmacyStaff = this.staff.filter(staff => 
            !this.currentPharmacy || staff.pharmacyId === this.currentPharmacy.id
        );
        
        currentPharmacyStaff.forEach(staff => {
            const row = document.createElement('tr');
            row.id = `staff-row-${staff.id}`;
            
            row.innerHTML = `
                <td>
                    <div class="staff-name-cell">
                        <strong>${staff.name}</strong>
                    </div>
                </td>
                <td><span class="privilege-badge">${this.formatPrivilegeLevel(staff.role || 'warehouse-assistant')}</span></td>
                <td>
                    <span class="privilege-badge">${this.formatPrivilegeLevel(staff.privilege || 'warehouse-assistant')}</span>
                </td>
                <td>
                    <span class="pharmacy-badge">${this.getPharmacyName(staff.pharmacyId)}</span>
                </td>
                <td>
                    <code>${staff.id}</code>
                </td>
                <td>${staff.email || '-'}</td>
                <td>${staff.phone || '-'}</td>
                <td>
                    ${staff.password ? 
                        '<span style="color: #28a745; font-weight: bold;"><i class="fas fa-check-circle"></i> Set</span>' :
                        '<span style="color: #dc3545; font-weight: bold;"><i class="fas fa-times-circle"></i> Not Set</span>'
                    }
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-outline edit-staff-table" data-staff-id="${staff.id}">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-sm btn-danger delete-staff-table" data-staff-id="${staff.id}">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </td>
            `;
            
            // Add event listeners for table action buttons
            row.querySelector('.edit-staff-table').addEventListener('click', () => {
                this.editStaff(staff);
            });
            
            row.querySelector('.delete-staff-table').addEventListener('click', () => {
                this.deleteStaff(staff.id);
            });
            
            tableBody.appendChild(row);
        });
    }

    switchStaffView(view) {
        const cardView = document.getElementById('staff-card-view');
        const tableView = document.getElementById('staff-table-view');
        const cardBtn = document.getElementById('card-view-btn');
        const tableBtn = document.getElementById('table-view-btn');
        
        if (view === 'card') {
            cardView.style.display = 'block';
            tableView.style.display = 'none';
            cardBtn.classList.add('active');
            tableBtn.classList.remove('active');
        } else {
            cardView.style.display = 'none';
            tableView.style.display = 'block';
            cardBtn.classList.remove('active');
            tableBtn.classList.add('active');
        }
    }

    populatePharmacyDropdown() {
        const pharmacySelect = document.getElementById('staff-pharmacy');
        if (!pharmacySelect) return;
        
        // Clear existing options except the first one
        pharmacySelect.innerHTML = '<option value="">Select Pharmacy</option>';
        
        // Add pharmacy options
        this.pharmacies.forEach(pharmacy => {
            const option = document.createElement('option');
            option.value = pharmacy.id;
            option.textContent = pharmacy.name;
            pharmacySelect.appendChild(option);
        });
    }

    openStaffModal(staff = null) {
        const modal = document.getElementById('staff-modal');
        const form = document.getElementById('staff-form');
        
        // Populate pharmacy dropdown
        this.populatePharmacyDropdown();
        
        if (staff) {
            // Edit mode
            document.getElementById('staff-name').value = staff.name;
            document.getElementById('staff-role').value = staff.role;
            document.getElementById('staff-privilege').value = staff.role; // Set privilege to match role
            document.getElementById('staff-pharmacy').value = staff.pharmacyId || '';
            document.getElementById('staff-id').value = staff.id;
            document.getElementById('staff-email').value = staff.email;
            document.getElementById('staff-phone').value = staff.phone || '';
            document.getElementById('staff-password').value = ''; // Clear password for security
            document.querySelector('#staff-modal .modal-header h3').textContent = 'Edit Staff Member';
        } else {
            // Add mode
            form.reset();
            document.getElementById('staff-id').value = this.generateStaffId();
            document.getElementById('staff-role').value = 'warehouse-assistant';
            document.getElementById('staff-privilege').value = 'warehouse-assistant';
            document.getElementById('staff-pharmacy').value = this.currentPharmacy ? this.currentPharmacy.id : '';
            document.getElementById('staff-password').value = '';
            document.querySelector('#staff-modal .modal-header h3').textContent = 'Add New Staff Member';
        }
        
        modal.style.display = 'block';
        this.editingStaff = staff;
        
        // Focus on the first input field
        setTimeout(() => {
            document.getElementById('staff-name').focus();
        }, 100);
    }

    saveStaff() {
        const form = document.getElementById('staff-form');
        
        // Validate required fields
        const name = document.getElementById('staff-name').value.trim();
        const role = document.getElementById('staff-role').value;
        const privilege = document.getElementById('staff-privilege').value;
        const pharmacyId = document.getElementById('staff-pharmacy').value;
        const email = document.getElementById('staff-email').value.trim();
        const password = document.getElementById('staff-password').value.trim();
        
        if (!name) {
            this.showMessage('Please enter staff name', 'error');
            return;
        }
        
        if (!role) {
            this.showMessage('Please select a role', 'error');
            return;
        }
        
        if (!pharmacyId) {
            this.showMessage('Please select a pharmacy', 'error');
            return;
        }
        
        if (email && !this.isValidEmail(email)) {
            this.showMessage('Please enter a valid email address', 'error');
            return;
        }
        
        // Password validation
        if (!this.editingStaff && !password) {
            this.showMessage('Please enter a password for new staff member', 'error');
            return;
        }
        
        if (password && password.length < 6) {
            this.showMessage('Password must be at least 6 characters long', 'error');
            return;
        }
        
        const staffData = {
            name: name,
            role: role,
            privilege: role, // Set privilege to match role
            id: document.getElementById('staff-id').value,
            email: email,
            phone: document.getElementById('staff-phone').value.trim(),
            pharmacyId: pharmacyId,
            password: password || null // Only include password if provided
        };

        if (this.editingStaff) {
            // Update existing staff
            const index = this.staff.findIndex(s => s.id === this.editingStaff.id);
            const existingStaff = this.staff[index];
            
            // If no password provided during edit, keep existing password
            if (!password) {
                staffData.password = existingStaff.password;
            }
            
            this.staff[index] = { ...existingStaff, ...staffData };
        } else {
            // Add new staff
            this.staff.push(staffData);
        }

        this.saveData('staff', this.staff);
        this.closeModal('staff-modal');
        
        
        this.loadStaff();
        this.loadDashboard();
        
        const action = this.editingStaff ? 'updated' : 'added';
        this.showMessage(`Staff member ${action} successfully!`, 'success');
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

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }


    generateUniqueId() {
        return 'PROD_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateUniqueSKU(category = 'medicines') {
        // Generate a unique SKU with 6-digit number based on category
        const categoryPrefixes = {
            'medicines': 1,
            'cosmetics': 2,
            'diaber': 3,
            'milk': 4,
            'refrigerated': 5
        };
        
        const prefix = categoryPrefixes[category] || 1;
        let sku;
        let attempts = 0;
        const maxAttempts = 100;
        
        // Get the next serial number for this category
        const categoryProducts = this.products.filter(p => p.category === category);
        const existingSkus = categoryProducts.map(p => p.sku);
        let nextSerial = 1;
        
        // Find the highest serial number for this category
        for (const existingSku of existingSkus) {
            if (existingSku.length === 6 && existingSku.startsWith(prefix.toString())) {
                const serial = parseInt(existingSku.substring(1));
                if (serial >= nextSerial) {
                    nextSerial = serial + 1;
                }
            }
        }
        
        do {
            // Format: prefix + 5-digit serial (padded with zeros)
            const serialStr = nextSerial.toString().padStart(5, '0');
            sku = prefix + serialStr;
            attempts++;
            nextSerial++;
        } while (this.products.find(p => p.sku === sku) && attempts < maxAttempts);
        
        if (attempts >= maxAttempts) {
            // Fallback to timestamp-based SKU if generation fails
            const timestamp = Date.now().toString().slice(-5);
            sku = prefix + timestamp;
        }
        
        return sku;
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
                    <div style="font-size: 0.8rem; color: #7f8c8d;">${product.sku} - ${this.formatCurrency(product.price)}</div>
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
        
        // If cart becomes empty and there's an active redemption, restore points
        if (this.cart.length === 0 && this.currentRedemption) {
            this.restoreRedemptionPoints();
        }
        
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

        // Calculate discount per item if redemption is active
        let discountPerItem = 0;
        if (this.currentRedemption && this.cart.length > 0) {
            const totalOriginalValue = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            discountPerItem = this.currentRedemption.discountAmount / totalOriginalValue;
        }

        cartItems.innerHTML = this.cart.map(item => {
            const itemTotal = item.price * item.quantity;
            const itemDiscount = itemTotal * discountPerItem;
            const discountedItemTotal = itemTotal - itemDiscount;
            const discountedItemPrice = item.price - (item.price * discountPerItem);

            return `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-price">
                            ${this.currentRedemption ? 
                                `<span class="original-price">${this.formatCurrency(item.price)}</span> → <span class="discounted-price">${this.formatCurrency(discountedItemPrice)}</span> each` :
                                `${this.formatCurrency(item.price)} each`
                            }
                        </div>
                        <div class="cart-item-total">
                            ${this.currentRedemption ? 
                                `<span class="original-total">${this.formatCurrency(itemTotal)}</span> → <span class="discounted-total">${this.formatCurrency(discountedItemTotal)}</span>` :
                                `${this.formatCurrency(itemTotal)}`
                            }
                        </div>
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
            `;
        }).join('');

        const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        const totalValue = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        cartCount.textContent = totalItems;
        
        // Show total with discounts/redemption/offers if applicable
        if (this.currentRedemption || this.appliedDiscount || this.appliedOffer) {
            let finalTotal = totalValue;
            let discountInfo = '';

            if (this.currentRedemption) {
                finalTotal = this.currentRedemption.newTotal;
                discountInfo += `<div class="discount">Points Redeemed: ${this.currentRedemption.pointsRedeemed} (${this.formatCurrency(this.currentRedemption.discountAmount)} discount)</div>`;
            }

            if (this.appliedDiscount) {
                finalTotal = this.appliedDiscount.newTotal;
                discountInfo += `<div class="discount">Discount Code: ${this.appliedDiscount.name} (${this.formatCurrency(this.appliedDiscount.appliedAmount)} discount)</div>`;
            }

            if (this.appliedOffer) {
                finalTotal = this.appliedOffer.newTotal;
                discountInfo += `<div class="discount">Offer: ${this.appliedOffer.name} (${this.formatCurrency(this.appliedOffer.appliedSavings)} savings)</div>`;
            }

            cartTotal.innerHTML = `
                <div class="cart-total-with-redemption">
                    <div class="original-total">Original: ${this.formatCurrency(totalValue)}</div>
                    ${discountInfo}
                    <div class="final-total">Total: ${this.formatCurrency(finalTotal)}</div>
                </div>
            `;
        } else {
            cartTotal.textContent = this.formatCurrency(totalValue);
        }
        
        // Update loyalty preview
        this.updateLoyaltyPreview();
    }


    printReceipt() {
        if (this.cart.length === 0) {
            this.showMessage('Cart is empty!', 'error');
            return;
        }
        
        // Show loading state
        const printBtn = document.getElementById('print-receipt-btn');
        const originalText = printBtn.innerHTML;
        printBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Printing...';
        printBtn.disabled = true;
        
        this.showMessage('Generating receipt...', 'info');
        this.printReceiptFromCart(this.cart);
        
        // Reset button after a delay
        setTimeout(() => {
            printBtn.innerHTML = originalText;
            printBtn.disabled = false;
        }, 2000);
    }

    previewReceipt() {
        if (this.cart.length === 0) {
            this.showMessage('Cart is empty!', 'error');
            return;
        }
        
        // Create preview modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 400px; max-height: 80vh; overflow-y: auto;">
                <div class="modal-header">
                    <h3>Receipt Preview</h3>
                    <span class="close" id="preview-close-btn">&times;</span>
                </div>
                <div class="modal-body" id="receipt-preview-content">
                    <!-- Receipt will be inserted here -->
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" id="preview-close-btn-2">Close</button>
                    <button class="btn btn-primary" id="preview-print-btn">Print</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners for modal buttons
        const closeBtn1 = document.getElementById('preview-close-btn');
        const closeBtn2 = document.getElementById('preview-close-btn-2');
        const printBtn = document.getElementById('preview-print-btn');
        
        const closeModal = () => {
            modal.remove();
        };
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        closeBtn1.addEventListener('click', closeModal);
        closeBtn2.addEventListener('click', closeModal);
        
        printBtn.addEventListener('click', () => {
            console.log('Print button clicked in preview modal');
            
            try {
                // Show loading state
                const originalText = printBtn.innerHTML;
                printBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Printing...';
                printBtn.disabled = true;
                
                // Print the receipt
                this.printReceiptFromCart(this.cart);
                
                // Show success message
                this.showMessage('Print dialog opened!', 'success');
                
                // Close modal after a short delay
                setTimeout(() => {
                    closeModal();
                }, 1000);
                
                // Reset button (in case modal doesn't close)
                setTimeout(() => {
                    printBtn.innerHTML = originalText;
                    printBtn.disabled = false;
                }, 2000);
            } catch (error) {
                console.error('Error in print button click:', error);
                this.showMessage('Error printing receipt: ' + error.message, 'error');
                
                // Reset button
                printBtn.innerHTML = 'Print';
                printBtn.disabled = false;
            }
        });
        
        // Generate receipt HTML for preview
        const receiptHTML = this.generateReceiptHTML(this.cart);
        document.getElementById('receipt-preview-content').innerHTML = receiptHTML;
        
        // Generate QR code for preview
        setTimeout(() => {
            const qrElement = document.querySelector('#receipt-preview-content [id^="qr-code-"]');
            if (qrElement) {
                const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                const pharmacyName = this.currentPharmacy ? this.currentPharmacy.name : 'VivaLife Pharmacy';
                const qrData = this.generateQRCodeData(pharmacyName, subtotal);
                
                if (typeof QRCode !== 'undefined') {
                    QRCode.toCanvas(qrElement, qrData, {
                        width: 120,
                        margin: 2,
                        color: {
                            dark: '#000000',
                            light: '#FFFFFF'
                        }
                    }, function (error, canvas) {
                        if (error) {
                            console.error('QR Code generation error:', error);
                            qrElement.innerHTML = '<div style="padding: 20px; text-align: center; color: #666; font-family: monospace;">QR Code Error</div>';
                        } else {
                            console.log('QR Code generated successfully for preview');
                        }
                    });
                } else {
                    // Fallback text QR code
                    qrElement.innerHTML = `
                        <div style="padding: 20px; text-align: center; color: #666; font-family: monospace; font-size: 10px;">
                            <div>QR Code Data:</div>
                            <div style="margin-top: 10px; word-break: break-all;">${qrData}</div>
                        </div>
                    `;
                }
            }
        }, 100);
    }

    generateQRCodeData(pharmacyName, total) {
        // Simple QR code data for pharmacy receipt
        const date = new Date().toLocaleDateString('en-GB');
        const time = new Date().toLocaleTimeString();
        return `${pharmacyName}|${date}|${time}|${this.formatCurrency(total)}`;
    }

    generateTextQRCode(data) {
        // Simple text-based QR code representation as fallback
        const lines = [
            '┌─────────────────┐',
            '│  ██  ██  ██  ██ │',
            '│  ██  ██  ██  ██ │',
            '│  ██  ██  ██  ██ │',
            '│  ██  ██  ██  ██ │',
            '│  ██  ██  ██  ██ │',
            '│  ██  ██  ██  ██ │',
            '│  ██  ██  ██  ██ │',
            '│  ██  ██  ██  ██ │',
            '└─────────────────┘'
        ];
        return lines.join('<br>');
    }

    generateReceiptHTML(cartItems) {
        if (cartItems.length === 0) {
            return '<p>No items in cart</p>';
        }

        // Calculate totals
        const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
        
        // Get current pharmacy info
        const pharmacyName = this.currentPharmacy ? this.currentPharmacy.name : 'VivaLife Pharmacy';
        const pharmacyAddress = this.currentPharmacy ? this.currentPharmacy.address : '123 Main Street, City, State 12345';
        const pharmacyPhone = this.currentPharmacy ? this.currentPharmacy.phone : '+1-555-0100';

        // Generate QR code data
        const qrData = this.generateQRCodeData(pharmacyName, subtotal);

        return `
            <div class="receipt" style="max-width: 300px; margin: 0 auto; border: 2px solid #000; padding: 20px; background: white; font-family: 'Cairo', 'Arial', sans-serif; font-size: 12px; direction: rtl;">
                <div class="header" style="text-align: center; border-bottom: 2px dashed #000; padding-bottom: 15px; margin-bottom: 20px;">
                    <div class="pharmacy-name" style="font-size: 18px; font-weight: bold; margin-bottom: 8px; text-transform: uppercase;">${pharmacyName}</div>
                    <div class="pharmacy-name-ar" style="font-size: 16px; font-weight: bold; margin-bottom: 8px; color: #333;">فيفا لايف الصيدلية</div>
                    <div class="pharmacy-address" style="font-size: 11px; margin-bottom: 5px; line-height: 1.3;">${pharmacyAddress}</div>
                    <div class="pharmacy-address-ar" style="font-size: 10px; margin-bottom: 5px; line-height: 1.3; color: #666;">الرياض، المملكة العربية السعودية</div>
                    <div class="pharmacy-phone" style="font-size: 11px; margin-bottom: 10px; font-weight: bold;">${pharmacyPhone}</div>
                </div>
                
                <div class="receipt-title" style="font-size: 16px; font-weight: bold; margin-bottom: 15px; text-align: center; text-transform: uppercase; letter-spacing: 1px;">SALES RECEIPT</div>
                <div class="receipt-title-ar" style="font-size: 14px; font-weight: bold; margin-bottom: 15px; text-align: center; color: #333;">فاتورة مبيعات</div>
                <div class="date-time" style="font-size: 11px; margin-bottom: 20px; text-align: center; background: #f0f0f0; padding: 8px; border-radius: 4px;">Date: ${new Date().toLocaleDateString('en-GB')} | Time: ${new Date().toLocaleTimeString()}</div>
                <div class="date-time-ar" style="font-size: 10px; margin-bottom: 20px; text-align: center; background: #f8f8f8; padding: 6px; border-radius: 4px; color: #666;">التاريخ: ${new Date().toLocaleDateString('ar-SA')} | الوقت: ${new Date().toLocaleTimeString('ar-SA')}</div>
                
                <div class="items" style="margin-bottom: 20px;">
                    <div class="items-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; font-size: 11px; font-weight: bold; background: #f0f0f0; padding: 8px; border-radius: 4px;">
                        <div style="flex: 1; text-align: right;">المنتج / Product</div>
                        <div style="width: 40px; text-align: center;">الكمية / Qty</div>
                        <div style="width: 70px; text-align: left;">السعر / Price</div>
                    </div>
                    ${cartItems.map(item => `
                        <div class="item" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 12px; padding: 5px 0; border-bottom: 1px dotted #ccc;">
                            <div class="item-name" style="flex: 1; margin-right: 15px; font-weight: bold; text-align: right;">${item.name}</div>
                            <div class="item-qty" style="width: 40px; text-align: center; background: #f8f8f8; padding: 2px 5px; border-radius: 3px;">${item.quantity}</div>
                            <div class="item-price" style="width: 70px; text-align: left; font-weight: bold;">${this.formatCurrency(item.price * item.quantity)}</div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="total-section" style="border-top: 2px dashed #000; padding-top: 15px; margin-top: 20px;">
                    <div class="total-line" style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px;">
                        <span style="text-align: right;">إجمالي العناصر / Total Items:</span>
                        <span style="text-align: left;">${totalItems}</span>
                    </div>
                    <div class="total-line total-final" style="font-weight: bold; font-size: 16px; border-top: 2px solid #000; padding-top: 10px; margin-top: 10px; background: #f0f0f0; padding: 10px; border-radius: 4px; display: flex; justify-content: space-between;">
                        <span style="text-align: right;">المجموع الكلي / TOTAL:</span>
                        <span style="text-align: left;">${this.formatCurrency(subtotal)}</span>
                    </div>
                </div>
                
                <div class="qr-section" style="text-align: center; margin: 20px 0; padding: 15px; background: #f8f8f8; border-radius: 8px;">
                    <div style="font-size: 10px; margin-bottom: 10px; font-weight: bold;">رمز الاستجابة السريعة / QR Code</div>
                    <div id="qr-code-${Date.now()}" style="display: inline-block; padding: 10px; background: white; border: 1px solid #ccc; border-radius: 4px;"></div>
                    <div style="font-size: 8px; margin-top: 5px; color: #666;">${qrData}</div>
                </div>
                
                <div class="footer" style="text-align: center; margin-top: 25px; font-size: 10px; border-top: 1px dashed #000; padding-top: 15px;">
                    <div class="thank-you" style="font-weight: bold; margin-bottom: 8px; font-size: 12px;">شكراً لتعاملكم معنا! / Thank you for your business!</div>
                    <div style="margin-bottom: 5px;">يرجى الاحتفاظ بهذه الفاتورة / Please keep this receipt for your records</div>
                    <div class="receipt-id" style="background: #e0e0e0; padding: 5px 10px; border-radius: 3px; font-family: 'Cairo', monospace; font-weight: bold; margin-top: 5px;">رقم الفاتورة / Receipt ID: ${'RCP' + Date.now().toString().slice(-6)}</div>
                </div>
            </div>
        `;
    }

    printReceiptFromCart(cartItems) {
        console.log('printReceiptFromCart called with:', cartItems);
        
        if (cartItems.length === 0) {
            console.log('No items in cart to print');
            this.showMessage('Cart is empty!', 'error');
            return;
        }

        console.log('Printing receipt for cart items:', cartItems);

        // Calculate totals
        const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
        
        // Get current pharmacy info
        const pharmacyName = this.currentPharmacy ? this.currentPharmacy.name : 'VivaLife Pharmacy';
        const pharmacyAddress = this.currentPharmacy ? this.currentPharmacy.address : '123 Main Street, City, State 12345';
        const pharmacyPhone = this.currentPharmacy ? this.currentPharmacy.phone : '+1-555-0100';

        console.log('Pharmacy info:', { pharmacyName, pharmacyAddress, pharmacyPhone });
        console.log('Calculated totals:', { subtotal, totalItems });
        
        // Show debug info to user
        this.showMessage(`Printing receipt with ${cartItems.length} items, Total: ${this.formatCurrency(subtotal)}`, 'info');

        // Generate QR code data
        const qrData = this.generateQRCodeData(pharmacyName, subtotal);
        
        // Create receipt HTML with improved styling
        const receiptHTML = `<!DOCTYPE html>
<html>
<head>
    <title>Receipt - ${pharmacyName}</title>
    <meta charset="UTF-8">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Cairo', 'Arial', sans-serif;
            font-size: 12px;
            line-height: 1.4;
            margin: 0;
            padding: 20px;
            background: white;
            color: #000;
            direction: rtl;
        }
        
        .receipt {
            max-width: 300px;
            margin: 0 auto;
            border: 2px solid #000;
            padding: 20px;
            background: white;
        }
        
        .header {
            text-align: center;
            border-bottom: 2px dashed #000;
            padding-bottom: 15px;
            margin-bottom: 20px;
        }
        
        .pharmacy-name {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 8px;
            text-transform: uppercase;
        }
        
        .pharmacy-address {
            font-size: 11px;
            margin-bottom: 5px;
            line-height: 1.3;
        }
        
        .pharmacy-phone {
            font-size: 11px;
            margin-bottom: 10px;
            font-weight: bold;
        }
        
        .receipt-title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 15px;
            text-align: center;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .date-time {
            font-size: 11px;
            margin-bottom: 20px;
            text-align: center;
            background: #f0f0f0;
            padding: 8px;
            border-radius: 4px;
        }
        
        .items {
            margin-bottom: 20px;
        }
        
        .item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
            font-size: 12px;
            padding: 5px 0;
            border-bottom: 1px dotted #ccc;
        }
        
        .item-name {
            flex: 1;
            margin-right: 15px;
            font-weight: bold;
        }
        
        .item-qty {
            width: 40px;
            text-align: center;
            background: #f8f8f8;
            padding: 2px 5px;
            border-radius: 3px;
        }
        
        .item-price {
            width: 70px;
            text-align: right;
            font-weight: bold;
        }
        
        .total-section {
            border-top: 2px dashed #000;
            padding-top: 15px;
            margin-top: 20px;
        }
        
        .total-line {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 13px;
        }
        
        .total-final {
            font-weight: bold;
            font-size: 16px;
            border-top: 2px solid #000;
            padding-top: 10px;
            margin-top: 10px;
            background: #f0f0f0;
            padding: 10px;
            border-radius: 4px;
        }
        
        .footer {
            text-align: center;
            margin-top: 25px;
            font-size: 10px;
            border-top: 1px dashed #000;
            padding-top: 15px;
        }
        
        .thank-you {
            font-weight: bold;
            margin-bottom: 8px;
            font-size: 12px;
        }
        
        .receipt-id {
            background: #e0e0e0;
            padding: 5px 10px;
            border-radius: 3px;
            font-family: monospace;
            font-weight: bold;
        }
        
        @media print {
            body { 
                margin: 0; 
                padding: 10px; 
                font-size: 11px;
            }
            .receipt { 
                border: 2px solid #000; 
                max-width: 280px; 
                margin: 0 auto;
            }
        }
    </style>
</head>
<body>
    <div class="receipt">
        <div class="header">
            <div class="pharmacy-name">${pharmacyName}</div>
            <div class="pharmacy-name-ar" style="font-size: 16px; font-weight: bold; margin-bottom: 8px; color: #333;">فيفا لايف الصيدلية</div>
            <div class="pharmacy-address">${pharmacyAddress}</div>
            <div class="pharmacy-address-ar" style="font-size: 10px; margin-bottom: 5px; line-height: 1.3; color: #666;">الرياض، المملكة العربية السعودية</div>
            <div class="pharmacy-phone">${pharmacyPhone}</div>
        </div>
        
        <div class="receipt-title">SALES RECEIPT</div>
        <div class="receipt-title-ar" style="font-size: 14px; font-weight: bold; margin-bottom: 15px; text-align: center; color: #333;">فاتورة مبيعات</div>
        <div class="date-time">Date: ${new Date().toLocaleDateString('en-GB')} | Time: ${new Date().toLocaleTimeString()}</div>
        <div class="date-time-ar" style="font-size: 10px; margin-bottom: 20px; text-align: center; background: #f8f8f8; padding: 6px; border-radius: 4px; color: #666;">التاريخ: ${new Date().toLocaleDateString('ar-SA')} | الوقت: ${new Date().toLocaleTimeString('ar-SA')}</div>
        
        <div class="items">
            <div class="items-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; font-size: 11px; font-weight: bold; background: #f0f0f0; padding: 8px; border-radius: 4px;">
                <div style="flex: 1; text-align: right;">المنتج / Product</div>
                <div style="width: 40px; text-align: center;">الكمية / Qty</div>
                <div style="width: 70px; text-align: left;">السعر / Price</div>
            </div>
            ${cartItems.map(item => `
                <div class="item">
                    <div class="item-name" style="text-align: right;">${item.name}</div>
                    <div class="item-qty">${item.quantity}</div>
                    <div class="item-price" style="text-align: left;">${this.formatCurrency(item.price * item.quantity)}</div>
                </div>
            `).join('')}
        </div>
        
        <div class="total-section">
            <div class="total-line">
                <span style="text-align: right;">إجمالي العناصر / Total Items:</span>
                <span style="text-align: left;">${totalItems}</span>
            </div>
            <div class="total-line total-final">
                <span style="text-align: right;">المجموع الكلي / TOTAL:</span>
                <span style="text-align: left;">${this.formatCurrency(subtotal)}</span>
            </div>
        </div>
        
        <div class="qr-section" style="text-align: center; margin: 20px 0; padding: 15px; background: #f8f8f8; border-radius: 8px;">
            <div style="font-size: 10px; margin-bottom: 10px; font-weight: bold;">رمز الاستجابة السريعة / QR Code</div>
            <div id="qr-code-${Date.now()}" style="display: inline-block; padding: 10px; background: white; border: 1px solid #ccc; border-radius: 4px;"></div>
            <div style="font-size: 8px; margin-top: 5px; color: #666;">${qrData}</div>
        </div>
        
        <div class="footer">
            <div class="thank-you">شكراً لتعاملكم معنا! / Thank you for your business!</div>
            <div style="margin-bottom: 5px;">يرجى الاحتفاظ بهذه الفاتورة / Please keep this receipt for your records</div>
            <div class="receipt-id" style="font-family: 'Cairo', monospace;">رقم الفاتورة / Receipt ID: ${'RCP' + Date.now().toString().slice(-6)}</div>
        </div>
    </div>
</body>
</html>`;

        // Open print window
        const printWindow = window.open('', '_blank', 'width=500,height=700,scrollbars=yes,resizable=yes');
        
        if (!printWindow) {
            console.error('Print window was blocked by browser');
            this.showMessage('Print window was blocked. Please allow popups and try again.', 'error');
            return;
        }
        
        // Write the HTML content
        printWindow.document.open();
        printWindow.document.write(receiptHTML);
        printWindow.document.close();
        
        // Wait for content to load, then print
        printWindow.onload = function() {
            console.log('Print window loaded, attempting to print...');
            printWindow.focus();
            
            // Generate QR code
            try {
                const qrElement = printWindow.document.querySelector('[id^="qr-code-"]');
                if (qrElement) {
                    if (typeof QRCode !== 'undefined') {
                        QRCode.toCanvas(qrElement, qrData, {
                            width: 120,
                            margin: 2,
                            color: {
                                dark: '#000000',
                                light: '#FFFFFF'
                            }
                        }, function (error, canvas) {
                            if (error) {
                                console.error('QR Code generation error:', error);
                                qrElement.innerHTML = '<div style="padding: 20px; text-align: center; color: #666; font-family: monospace;">QR Code Error</div>';
                            } else {
                                console.log('QR Code generated successfully');
                            }
                        });
                    } else {
                        // Fallback text QR code
                        qrElement.innerHTML = `
                            <div style="padding: 20px; text-align: center; color: #666; font-family: monospace; font-size: 10px;">
                                <div>QR Code Data:</div>
                                <div style="margin-top: 10px; word-break: break-all;">${qrData}</div>
                            </div>
                        `;
                    }
                }
            } catch (error) {
                console.error('QR Code generation failed:', error);
                const qrElement = printWindow.document.querySelector('[id^="qr-code-"]');
                if (qrElement) {
                    qrElement.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">QR Code Unavailable</div>';
                }
            }
            
            // Ensure styles are applied
            setTimeout(() => {
                // Force a reflow to ensure styles are applied
                printWindow.document.body.offsetHeight;
                
                // Print the document
                printWindow.print();
                console.log('Print dialog should be open now');
            }, 500);
        };
        
        // Fallback: if onload doesn't fire, try printing after a delay
        setTimeout(() => {
            if (printWindow && !printWindow.closed) {
                console.log('Fallback: attempting to print...');
                printWindow.focus();
                
                // Force a reflow
                printWindow.document.body.offsetHeight;
                printWindow.print();
            } else {
                // If popup was blocked, offer to download the receipt
                this.offerReceiptDownload(receiptHTML, pharmacyName);
            }
        }, 1500);
    }

    offerReceiptDownload(receiptHTML, pharmacyName) {
        console.log('Popup was blocked, offering receipt download');
        this.showMessage('Print popup was blocked. Would you like to download the receipt instead?', 'info');
        
        // Create a download link
        const blob = new Blob([receiptHTML], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `receipt-${pharmacyName}-${Date.now()}.html`;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        this.showMessage('Receipt downloaded! You can open it and print from your browser.', 'success');
    }

    // Reports
    loadReports() {
        // Reports functionality can be expanded here
        console.log('Loading reports...');
    }

    // Admin functionality
    loadAdmin() {
        this.loadPharmacies();
        this.updateCurrentPharmacyDisplay();
        this.loadSystemSettings();
        this.loadPrivileges();
        this.loadFavorites();
    }

    loadSystemSettings() {
        // Set current values in the form
        document.getElementById('default-currency').value = this.systemSettings.currency;
        document.getElementById('date-format').value = this.systemSettings.dateFormat;
        document.getElementById('session-timeout').value = this.systemSettings.sessionTimeout;
        document.getElementById('require-password-change').checked = this.systemSettings.requirePasswordChange;
        document.getElementById('admin-username-setting').value = this.systemSettings.adminUsername || '';
        document.getElementById('admin-password-setting').value = '';
    }

    updateSystemSetting(key, value) {
        this.systemSettings[key] = value;
        this.saveData('systemSettings', this.systemSettings);
        
        // Update currency display if currency changed
        if (key === 'currency') {
            this.updateCurrencyDisplay();
        }
        
        this.showMessage('System setting updated successfully!', 'success');
    }

    getCurrencySymbol() {
        const currencyMap = {
            'SAR': 'ر.س',
            'USD': '$',
            'EUR': '€',
            'GBP': '£'
        };
        return currencyMap[this.systemSettings.currency] || 'ر.س';
    }

    formatCurrency(amount) {
        return `${this.getCurrencySymbol()}${parseFloat(amount).toFixed(2)}`;
    }

    updateCurrencyDisplay() {
        // Update all currency displays in the application
        document.querySelectorAll('.currency-display').forEach(element => {
            const amount = element.dataset.amount;
            if (amount) {
                element.textContent = this.formatCurrency(amount);
            }
        });
    }

    switchAdminTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');
    }

    loadPharmacies() {
        this.renderPharmacyCards();
    }

    renderPharmacyCards() {
        const pharmacyGrid = document.querySelector('.pharmacy-grid');
        const template = document.getElementById('pharmacy-template');
        
        // Clear existing cards (except template)
        pharmacyGrid.innerHTML = '';
        
        this.pharmacies.forEach((pharmacy, index) => {
            const card = template.cloneNode(true);
            card.style.display = 'block';
            card.id = `pharmacy-${index}`;
            
            card.querySelector('.pharmacy-name').textContent = pharmacy.name;
            card.querySelector('.pharmacy-location').textContent = pharmacy.address;
            card.querySelector('.pharmacy-status').textContent = this.capitalizeFirst(pharmacy.status);
            card.querySelector('.pharmacy-status').className = `pharmacy-status ${pharmacy.status}`;
            
            // Update stats
            const productCount = this.getPharmacyProductCount(pharmacy.id);
            const staffCount = this.getPharmacyStaffCount(pharmacy.id);
            const lastActivity = this.getPharmacyLastActivity(pharmacy.id);
            
            card.querySelector('.stat-item:nth-child(1) .stat-value').textContent = productCount;
            card.querySelector('.stat-item:nth-child(2) .stat-value').textContent = staffCount;
            card.querySelector('.stat-item:nth-child(3) .stat-value').textContent = lastActivity;
            
            // Add event listeners
            card.querySelector('.switch-pharmacy').onclick = () => this.switchToPharmacy(pharmacy.id);
            card.querySelector('.edit-pharmacy').onclick = () => this.editPharmacy(pharmacy);
            const deleteBtn = card.querySelector('.delete-pharmacy');
            if (deleteBtn) {
                deleteBtn.onclick = () => {
                    console.log('Delete button clicked for pharmacy:', pharmacy.name);
                    this.deletePharmacy(pharmacy.id);
                };
            } else {
                console.error('Delete button not found in pharmacy card');
            }
            
            // Highlight current pharmacy
            if (this.currentPharmacy && this.currentPharmacy.id === pharmacy.id) {
                card.style.border = '2px solid #28a745';
                card.querySelector('.switch-pharmacy').textContent = 'Current';
                card.querySelector('.switch-pharmacy').disabled = true;
            }
            
            pharmacyGrid.appendChild(card);
        });
    }

    getPharmacyProductCount(pharmacyId) {
        const pharmacyProducts = this.products.filter(p => p.pharmacyId === pharmacyId);
        return pharmacyProducts.length;
    }

    getPharmacyStaffCount(pharmacyId) {
        const pharmacyStaff = this.staff.filter(s => s.pharmacyId === pharmacyId);
        return pharmacyStaff.length;
    }

    getPharmacyLastActivity(pharmacyId) {
        const pharmacyDispensing = this.dispensingHistory.filter(d => d.pharmacyId === pharmacyId);
        if (pharmacyDispensing.length === 0) return 'Never';
        
        const lastDispensing = pharmacyDispensing.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
        return new Date(lastDispensing.date).toLocaleDateString();
    }

    openPharmacyModal(pharmacy = null) {
        const modal = document.getElementById('pharmacy-modal');
        const form = document.getElementById('pharmacy-form');
        
        if (pharmacy) {
            // Edit mode
            document.getElementById('pharmacy-name').value = pharmacy.name;
            document.getElementById('pharmacy-address').value = pharmacy.address;
            document.getElementById('pharmacy-phone').value = pharmacy.phone;
            document.getElementById('pharmacy-email').value = pharmacy.email;
            document.getElementById('pharmacy-manager').value = pharmacy.manager;
            document.getElementById('pharmacy-status').value = pharmacy.status;
        } else {
            // Add mode
            form.reset();
        }
        
        modal.style.display = 'block';
        this.editingPharmacy = pharmacy;
    }

    savePharmacy() {
        const form = document.getElementById('pharmacy-form');
        
        const pharmacyData = {
            name: document.getElementById('pharmacy-name').value,
            address: document.getElementById('pharmacy-address').value,
            phone: document.getElementById('pharmacy-phone').value,
            email: document.getElementById('pharmacy-email').value,
            manager: document.getElementById('pharmacy-manager').value,
            status: document.getElementById('pharmacy-status').value
        };

        if (this.editingPharmacy) {
            // Update existing pharmacy
            const index = this.pharmacies.findIndex(p => p.id === this.editingPharmacy.id);
            this.pharmacies[index] = { ...this.pharmacies[index], ...pharmacyData };
        } else {
            // Add new pharmacy
            const newPharmacy = {
                id: 'PHARM' + Date.now().toString().slice(-6),
                ...pharmacyData,
                createdAt: new Date().toISOString()
            };
            this.pharmacies.push(newPharmacy);
        }

        this.saveData('pharmacies', this.pharmacies);
        this.closeModal('pharmacy-modal');
        this.loadPharmacies();
        this.showMessage('Pharmacy saved successfully!', 'success');
    }

    editPharmacy(pharmacy) {
        this.openPharmacyModal(pharmacy);
    }

    deletePharmacy(pharmacyId) {
        console.log('Delete pharmacy clicked for ID:', pharmacyId);
        // Store the pharmacy ID for deletion after authentication
        this.pharmacyToDelete = pharmacyId;
        
        // Get pharmacy name for display
        const pharmacy = this.pharmacies.find(p => p.id === pharmacyId);
        const pharmacyName = pharmacy ? pharmacy.name : 'Unknown Pharmacy';
        
        // Update modal content to show pharmacy name
        document.querySelector('#admin-auth-modal .modal-header h3').textContent = 
            `Delete Pharmacy: ${pharmacyName}`;
        
        // Clear previous inputs
        document.getElementById('admin-username').value = '';
        document.getElementById('admin-password').value = '';
        
        // Show authentication modal
        const modal = document.getElementById('admin-auth-modal');
        if (modal) {
            modal.style.display = 'block';
            console.log('Admin auth modal displayed');
        } else {
            console.error('Admin auth modal not found');
        }
    }

    switchToPharmacy(pharmacyId) {
        const pharmacy = this.pharmacies.find(p => p.id === pharmacyId);
        if (pharmacy) {
            this.currentPharmacy = pharmacy;
            this.saveData('currentPharmacy', this.currentPharmacy);
            this.updateCurrentPharmacyDisplay();
            this.loadDashboard();
            this.loadInventory();
            this.loadStaff();
            this.showMessage(`Switched to ${pharmacy.name}`, 'success');
        }
    }

    updateCurrentPharmacyDisplay() {
        const userInfo = document.querySelector('.user-info');
        const currentPharmacySpan = document.getElementById('current-pharmacy-display');
        
        if (this.currentPharmacy) {
            if (!currentPharmacySpan) {
                const span = document.createElement('span');
                span.id = 'current-pharmacy-display';
                span.className = 'current-pharmacy';
                span.textContent = this.currentPharmacy.name;
                userInfo.appendChild(span);
            } else {
                currentPharmacySpan.textContent = this.currentPharmacy.name;
            }
        }
    }

    filterPharmacies(searchTerm) {
        const cards = document.querySelectorAll('.pharmacy-card:not(#pharmacy-template)');
        cards.forEach(card => {
            const name = card.querySelector('.pharmacy-name').textContent.toLowerCase();
            const location = card.querySelector('.pharmacy-location').textContent.toLowerCase();
            const matches = name.includes(searchTerm.toLowerCase()) || location.includes(searchTerm.toLowerCase());
            card.style.display = matches ? 'block' : 'none';
        });
    }

    filterPharmaciesByStatus(status) {
        const cards = document.querySelectorAll('.pharmacy-card:not(#pharmacy-template)');
        cards.forEach(card => {
            const pharmacyStatus = card.querySelector('.pharmacy-status').textContent.toLowerCase();
            const matches = !status || pharmacyStatus === status.toLowerCase();
            card.style.display = matches ? 'block' : 'none';
        });
    }

    createBackup() {
        const backupData = {
            pharmacies: this.pharmacies,
            products: this.products,
            staff: this.staff,
            dispensingHistory: this.dispensingHistory,
            currentPharmacy: this.currentPharmacy,
            currentUser: this.currentUser,
            backupDate: new Date().toISOString(),
            version: '1.0'
        };

        const dataStr = JSON.stringify(backupData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const filename = `VivaLife_Backup_${timestamp}.json`;
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = filename;
        link.click();
        
        this.showMessage('Backup created successfully!', 'success');
    }

    restoreBackup(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const backupData = JSON.parse(e.target.result);
                
                if (confirm('This will replace all current data. Are you sure you want to continue?')) {
                    this.pharmacies = backupData.pharmacies || [];
                    this.products = backupData.products || [];
                    this.staff = backupData.staff || [];
                    this.dispensingHistory = backupData.dispensingHistory || [];
                    this.currentPharmacy = backupData.currentPharmacy || null;
                    this.currentUser = backupData.currentUser || null;

                    this.saveData('pharmacies', this.pharmacies);
                    this.saveData('products', this.products);
                    this.saveData('staff', this.staff);
                    this.saveData('dispensingHistory', this.dispensingHistory);
                    this.saveData('currentPharmacy', this.currentPharmacy);
                    this.saveData('currentUser', this.currentUser);

                    this.loadDashboard();
                    this.loadInventory();
                    this.loadStaff();
                    this.loadPharmacies();
                    this.updateCurrentPharmacyDisplay();
                    
                    this.showMessage('Backup restored successfully!', 'success');
                }
            } catch (error) {
                this.showMessage('Error reading backup file: ' + error.message, 'error');
            }
        };
        reader.readAsText(file);
        
        // Reset file input
        event.target.value = '';
    }

    // Excel functionality
    downloadExcelTemplate() {
        const templateData = [
            {
                'Product Name': 'Paracetamol 500mg',
                'Category': 'medicines',
                'SKU': '100001',
                'Batch Number': 'BATCH001',
                'Current Stock': 100,
                'Min Stock': 20,
                'Unit Price': 2.50,
                'Expiry Date': '2025-12-31'
            },
            {
                'Product Name': 'Face Cream 50ml',
                'Category': 'cosmetics',
                'SKU': '200001',
                'Batch Number': 'COS001',
                'Current Stock': 25,
                'Min Stock': 5,
                'Unit Price': 15.99,
                'Expiry Date': '2026-06-30'
            },
            {
                'Product Name': 'Diabetic Test Strips',
                'Category': 'diaber',
                'SKU': '300001',
                'Batch Number': 'DIA001',
                'Current Stock': 50,
                'Min Stock': 10,
                'Unit Price': 45.00,
                'Expiry Date': '2025-09-15'
            }
        ];

        const ws = XLSX.utils.json_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Products');
        
        // Add instructions sheet
        const instructions = [
            { 'Column': 'Product Name', 'Description': 'Full name of the product', 'Required': 'Yes', 'Example': 'Paracetamol 500mg' },
            { 'Column': 'Category', 'Description': 'Product category', 'Required': 'Yes', 'Example': 'medicines, cosmetics, diaber, milk, or refrigerated' },
            { 'Column': 'SKU', 'Description': 'Unique product identifier/barcode', 'Required': 'Yes', 'Example': '100001' },
            { 'Column': 'Batch Number', 'Description': 'Product batch number', 'Required': 'No', 'Example': 'BATCH001' },
            { 'Column': 'Current Stock', 'Description': 'Current inventory quantity', 'Required': 'Yes', 'Example': '100' },
            { 'Column': 'Min Stock', 'Description': 'Minimum stock level for alerts', 'Required': 'Yes', 'Example': '20' },
            { 'Column': 'Unit Price', 'Description': 'Price per unit', 'Required': 'Yes', 'Example': '2.50' },
            { 'Column': 'Expiry Date', 'Description': 'Product expiry date (YYYY-MM-DD)', 'Required': 'No', 'Example': '2025-12-31' }
        ];
        
        const wsInstructions = XLSX.utils.json_to_sheet(instructions);
        XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');
        
        XLSX.writeFile(wb, 'VivaLife_Product_Template.xlsx');
        this.showMessage('Excel template downloaded successfully!', 'success');
    }

    handleExcelUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                this.processExcelData(jsonData);
            } catch (error) {
                this.showMessage('Error reading Excel file: ' + error.message, 'error');
            }
        };
        reader.readAsArrayBuffer(file);
        
        // Reset file input
        event.target.value = '';
    }

    processExcelData(jsonData) {
        if (!jsonData || jsonData.length === 0) {
            this.showMessage('No data found in Excel file', 'error');
            return;
        }

        const validProducts = [];
        const errors = [];
        const warnings = [];

        jsonData.forEach((row, index) => {
            const rowNumber = index + 2; // +2 because Excel rows start from 1 and we skip header
            const product = this.validateExcelRow(row, rowNumber);
            
            if (product.errors.length > 0) {
                errors.push(...product.errors);
            } else {
                validProducts.push(product.data);
                if (product.warnings.length > 0) {
                    warnings.push(...product.warnings);
                }
            }
        });

        if (errors.length > 0) {
            this.showMessage(`Found ${errors.length} errors in Excel file. Please fix them and try again.`, 'error');
            console.error('Excel Import Errors:', errors);
            return;
        }

        if (warnings.length > 0) {
            console.warn('Excel Import Warnings:', warnings);
        }

        // Process valid products
        this.importProducts(validProducts);
        this.showMessage(`Successfully imported ${validProducts.length} products!`, 'success');
    }

    validateExcelRow(row, rowNumber) {
        const errors = [];
        const warnings = [];
        const data = {};

        // Required fields validation
        const requiredFields = ['Product Name', 'Category', 'SKU', 'Current Stock', 'Min Stock', 'Unit Price'];
        
        requiredFields.forEach(field => {
            if (!row[field] || row[field] === '') {
                errors.push(`Row ${rowNumber}: ${field} is required`);
            }
        });

        if (errors.length > 0) {
            return { errors, warnings, data: null };
        }

        // Validate and process each field
        data.name = String(row['Product Name']).trim();
        data.sku = String(row['SKU']).trim();
        data.batchNumber = row['Batch Number'] ? String(row['Batch Number']).trim() : null;
        
        // Check for duplicate SKU
        if (this.products.find(p => p.sku === data.sku)) {
            errors.push(`Row ${rowNumber}: SKU '${data.sku}' already exists`);
            return { errors, warnings, data: null };
        }

        // Validate category
        const validCategories = ['medicines', 'cosmetics', 'diaber', 'milk', 'refrigerated'];
        data.category = String(row['Category']).toLowerCase().trim();
        if (!validCategories.includes(data.category)) {
            errors.push(`Row ${rowNumber}: Category must be one of: ${validCategories.join(', ')}`);
        }

        // Validate numeric fields
        const currentStock = parseInt(row['Current Stock']);
        const minStock = parseInt(row['Min Stock']);
        const unitPrice = parseFloat(row['Unit Price']);

        if (isNaN(currentStock) || currentStock < 0) {
            errors.push(`Row ${rowNumber}: Current Stock must be a valid non-negative number`);
        } else {
            data.currentStock = currentStock;
        }

        if (isNaN(minStock) || minStock < 0) {
            errors.push(`Row ${rowNumber}: Min Stock must be a valid non-negative number`);
        } else {
            data.minStock = minStock;
        }

        if (isNaN(unitPrice) || unitPrice < 0) {
            errors.push(`Row ${rowNumber}: Unit Price must be a valid non-negative number`);
        } else {
            data.price = unitPrice;
        }

        // Validate expiry date (optional)
        if (row['Expiry Date']) {
            const expiryDate = new Date(row['Expiry Date']);
            if (isNaN(expiryDate.getTime())) {
                warnings.push(`Row ${rowNumber}: Invalid expiry date format, skipping`);
            } else {
                data.expiryDate = row['Expiry Date'];
            }
        } else {
            data.expiryDate = null;
        }

        // Check for low stock
        if (data.currentStock <= data.minStock) {
            warnings.push(`Row ${rowNumber}: Product '${data.name}' is at or below minimum stock level`);
        }

        return { errors, warnings, data };
    }

    importProducts(products) {
        // Add new products to existing inventory
        this.products.push(...products);
        
        // Save updated inventory
        this.saveData('products', this.products);
        
        // Refresh inventory display
        this.loadInventory();
        this.loadDashboard();
    }

    exportInventoryToExcel() {
        // Get current filtered products (what's currently displayed in the table)
        const searchTerm = document.getElementById('product-search').value.toLowerCase();
        const categoryFilter = document.getElementById('category-filter').value;
        
        let productsToExport = this.products;
        
        // Apply search filter
        if (searchTerm) {
            productsToExport = productsToExport.filter(product =>
                product.name.toLowerCase().includes(searchTerm) ||
                product.sku.toLowerCase().includes(searchTerm) ||
                (product.batchNumber && product.batchNumber.toLowerCase().includes(searchTerm))
            );
        }
        
        // Apply category filter
        if (categoryFilter) {
            productsToExport = productsToExport.filter(product => product.category === categoryFilter);
        }
        
        if (productsToExport.length === 0) {
            this.showMessage('No products to export!', 'error');
            return;
        }
        
        // Prepare data for export
        const exportData = productsToExport.map(product => ({
            'Product Name': product.name,
            'Category': this.capitalizeFirst(product.category),
            'SKU': product.sku,
            'Batch Number': product.batchNumber || '',
            'Current Stock': product.currentStock,
            'Min Stock': product.minStock,
            'Unit Price': product.price,
            'Expiry Date': product.expiryDate || '',
            'Stock Status': product.currentStock <= product.minStock ? 'Low Stock' : 'OK',
            'Total Value': this.formatCurrency(product.currentStock * product.price)
        }));
        
        // Create workbook
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        
        // Set column widths
        const colWidths = [
            { wch: 25 }, // Product Name
            { wch: 12 }, // Category
            { wch: 10 }, // SKU
            { wch: 15 }, // Batch Number
            { wch: 12 }, // Current Stock
            { wch: 10 }, // Min Stock
            { wch: 12 }, // Unit Price
            { wch: 12 }, // Expiry Date
            { wch: 12 }, // Stock Status
            { wch: 12 }  // Total Value
        ];
        ws['!cols'] = colWidths;
        
        // Add the worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Inventory Export');
        
        // Add summary sheet
        this.addSummarySheet(wb, productsToExport);
        
        // Generate filename with timestamp
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const filename = `VivaLife_Inventory_Export_${timestamp}.xlsx`;
        
        // Export the file
        XLSX.writeFile(wb, filename);
        
        this.showMessage(`Successfully exported ${productsToExport.length} products to Excel!`, 'success');
    }

    addSummarySheet(wb, products) {
        const summaryData = [
            { 'Metric': 'Total Products', 'Value': products.length },
            { 'Metric': 'Total Stock Value', 'Value': this.formatCurrency(products.reduce((sum, p) => sum + (p.currentStock * p.price), 0)) },
            { 'Metric': 'Low Stock Items', 'Value': products.filter(p => p.currentStock <= p.minStock).length },
            { 'Metric': 'Categories', 'Value': [...new Set(products.map(p => p.category))].length },
            { 'Metric': 'Export Date', 'Value': new Date().toLocaleString() }
        ];
        
        // Add category breakdown
        const categories = [...new Set(products.map(p => p.category))];
        categories.forEach(category => {
            const categoryProducts = products.filter(p => p.category === category);
            summaryData.push({
                'Metric': `${this.capitalizeFirst(category)} Products`,
                'Value': categoryProducts.length
            });
        });
        
        const wsSummary = XLSX.utils.json_to_sheet(summaryData);
        wsSummary['!cols'] = [{ wch: 20 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
    }

    // Utility functions
    setupDefaultData() {
        // Setup default pharmacy if none exists
        if (this.pharmacies.length === 0) {
            this.pharmacies = [
                {
                    id: 'PHARM001',
                    name: 'VivaLife Main Branch',
                    address: '123 Main Street, City, State 12345',
                    phone: '+1-555-0100',
                    email: 'main@vivalife.com',
                    manager: 'Dr. Sarah Johnson',
                    status: 'active',
                    createdAt: new Date().toISOString()
                }
            ];
            this.saveData('pharmacies', this.pharmacies);
            this.currentPharmacy = this.pharmacies[0];
            this.saveData('currentPharmacy', this.currentPharmacy);
        }

        // Fix existing products that don't have pharmacyId or ID
        let productsUpdated = false;
        this.products.forEach(product => {
            if (!product.pharmacyId) {
                product.pharmacyId = this.currentPharmacy ? this.currentPharmacy.id : 'PHARM001';
                productsUpdated = true;
            }
            if (!product.id) {
                product.id = this.generateUniqueId();
                productsUpdated = true;
            }
        });
        
        if (productsUpdated) {
            this.saveData('products', this.products);
            console.log('Updated products with pharmacy IDs and unique IDs');
        }

        if (this.products.length === 0) {
            this.products = [
                {
                    id: this.generateUniqueId(),
                    name: 'Paracetamol 500mg',
                    category: 'medicines',
                    sku: '100001',
                    batchNumber: 'BATCH001',
                    currentStock: 100,
                    minStock: 20,
                    price: 2.50,
                    expiryDate: '2025-12-31',
                    pharmacyId: this.currentPharmacy ? this.currentPharmacy.id : 'PHARM001'
                },
                {
                    id: this.generateUniqueId(),
                    name: 'Ibuprofen 400mg',
                    category: 'medicines',
                    sku: '100002',
                    batchNumber: 'BATCH002',
                    currentStock: 75,
                    minStock: 15,
                    price: 3.20,
                    expiryDate: '2025-11-30',
                    pharmacyId: this.currentPharmacy ? this.currentPharmacy.id : 'PHARM001'
                },
                {
                    id: this.generateUniqueId(),
                    name: 'Face Cream 50ml',
                    category: 'cosmetics',
                    sku: '200001',
                    batchNumber: 'COS001',
                    currentStock: 25,
                    minStock: 5,
                    price: 15.99,
                    expiryDate: '2026-06-30',
                    pharmacyId: this.currentPharmacy ? this.currentPharmacy.id : 'PHARM001'
                },
                {
                    id: this.generateUniqueId(),
                    name: 'Diabetic Test Strips',
                    category: 'diaber',
                    sku: '300001',
                    batchNumber: 'DIA001',
                    currentStock: 50,
                    minStock: 10,
                    price: 45.00,
                    expiryDate: '2025-09-15',
                    pharmacyId: this.currentPharmacy ? this.currentPharmacy.id : 'PHARM001'
                },
                {
                    id: this.generateUniqueId(),
                    name: 'Baby Formula 400g',
                    category: 'milk',
                    sku: '400001',
                    batchNumber: 'MILK001',
                    currentStock: 30,
                    minStock: 8,
                    price: 25.50,
                    expiryDate: '2025-08-20',
                    pharmacyId: this.currentPharmacy ? this.currentPharmacy.id : 'PHARM001'
                },
                {
                    id: this.generateUniqueId(),
                    name: 'Insulin Vial 10ml',
                    category: 'refrigerated',
                    sku: '500001',
                    batchNumber: 'REF001',
                    currentStock: 15,
                    minStock: 3,
                    price: 120.00,
                    expiryDate: '2025-07-10',
                    pharmacyId: this.currentPharmacy ? this.currentPharmacy.id : 'PHARM001'
                }
            ];
            this.saveData('products', this.products);
        }

        // Fix existing staff that don't have pharmacyId
        let staffUpdated = false;
        this.staff.forEach(staff => {
            if (!staff.pharmacyId) {
                staff.pharmacyId = this.currentPharmacy ? this.currentPharmacy.id : 'PHARM001';
                staffUpdated = true;
            }
        });
        
        if (staffUpdated) {
            this.saveData('staff', this.staff);
            console.log('Updated staff with pharmacy IDs');
        }

        if (this.staff.length === 0) {
            this.staff = [
                {
                    name: 'Dr. Sarah Johnson',
                    role: 'pharmacist',
                    privilege: 'manager',
                    id: 'STF001',
                    email: 'sarah.johnson@vivalife.com',
                    phone: '+1-555-0101',
                    pharmacyId: this.currentPharmacy ? this.currentPharmacy.id : 'PHARM001'
                },
                {
                    name: 'Mike Chen',
                    role: 'technician',
                    privilege: 'pharmacy-supervisor',
                    id: 'STF002',
                    email: 'mike.chen@vivalife.com',
                    phone: '+1-555-0102',
                    pharmacyId: this.currentPharmacy ? this.currentPharmacy.id : 'PHARM001'
                },
                {
                    name: 'Ahmed Al-Rashid',
                    role: 'assistant',
                    privilege: 'warehouse-assistant',
                    id: 'STF003',
                    email: 'ahmed.rashid@vivalife.com',
                    phone: '+1-555-0103',
                    pharmacyId: this.currentPharmacy ? this.currentPharmacy.id : 'PHARM001'
                }
            ];
            this.saveData('staff', this.staff);
        }

        // Setup default privileges if none exist
        if (this.privileges.length === 0) {
            this.privileges = [
                {
                    id: 'admin',
                    name: 'Administrator',
                    description: 'Full system access',
                    permissions: [
                        'view-dashboard', 'view-inventory', 'add-products', 'edit-products', 'delete-products',
                        'process-dispensing', 'view-dispensing-history', 'process-returns', 'view-returns-history',
                        'view-rsd-tracking', 'view-loyalty', 'manage-loyalty', 'view-discounts', 'manage-discounts', 'view-staff', 'manage-staff',
                        'view-reports', 'admin-access', 'export-data', 'import-data'
                    ],
                    isDefault: true
                },
                {
                    id: 'pharmacy-supervisor',
                    name: 'Pharmacy Supervisor',
                    description: 'Supervisor level access',
                    permissions: [
                        'view-dashboard', 'view-inventory', 'add-products', 'edit-products', 'delete-products',
                        'process-dispensing', 'view-dispensing-history', 'process-returns', 'view-returns-history',
                        'view-rsd-tracking', 'view-loyalty', 'manage-loyalty', 'view-discounts', 'manage-discounts', 'view-staff', 'view-reports', 'export-data'
                    ],
                    isDefault: true
                },
                {
                    id: 'pharmacy-staff',
                    name: 'Pharmacy Staff',
                    description: 'Standard staff access',
                    permissions: [
                        'view-dashboard', 'view-inventory', 'add-products', 'edit-products',
                        'process-dispensing', 'view-dispensing-history', 'process-returns', 'view-returns-history',
                        'view-loyalty', 'manage-loyalty', 'view-discounts', 'view-reports'
                    ],
                    isDefault: true
                },
                {
                    id: 'warehouse-assistant',
                    name: 'Warehouse Assistant',
                    description: 'Limited access for warehouse operations',
                    permissions: [
                        'view-dashboard', 'view-inventory', 'add-products', 'edit-products', 'view-reports'
                    ],
                    isDefault: true
                },
                {
                    id: 'data-entry',
                    name: 'Data Entry',
                    description: 'Data entry access only',
                    permissions: [
                        'view-dashboard', 'view-inventory', 'add-products', 'edit-products', 'view-reports'
                    ],
                    isDefault: true
                }
            ];
            this.saveData('privileges', this.privileges);
        }

        if (!this.currentUser) {
            this.currentUser = this.staff[0];
            this.saveData('currentUser', this.currentUser);
            document.getElementById('current-user').textContent = `Welcome, ${this.currentUser.name}`;
        }

        // Fix existing dispensing records that have undefined productId
        this.fixExistingDispensingRecords();

        // Add sample dispensing records if none exist
        if (this.dispensingHistory.length === 0 && this.products.length > 0) {
            console.log('Creating sample dispensing records...');
            console.log('Available products:', this.products);
            
            this.dispensingHistory = [
                {
                    id: 'DSP' + Date.now() + '_1',
                    invoiceNumber: 'INV' + Date.now() + '_1',
                    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
                    items: [
                        {
                            productId: this.products[0].id,
                            sku: this.products[0].sku,
                            name: this.products[0].name,
                            quantity: 2,
                            price: this.products[0].price
                        },
                        {
                            productId: this.products[1].id,
                            sku: this.products[1].sku,
                            name: this.products[1].name,
                            quantity: 1,
                            price: this.products[1].price
                        }
                    ],
                    totalValue: (this.products[0].price * 2) + (this.products[1].price * 1),
                    staffId: 'STF001',
                    staffName: 'Dr. Sarah Johnson',
                    pharmacyId: this.currentPharmacy ? this.currentPharmacy.id : 'PHARM001'
                },
                {
                    id: 'DSP' + Date.now() + '_2',
                    invoiceNumber: 'INV' + Date.now() + '_2',
                    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
                    items: [
                        {
                            productId: this.products[0].id,
                            sku: this.products[0].sku,
                            name: this.products[0].name,
                            quantity: 1,
                            price: this.products[0].price
                        }
                    ],
                    totalValue: this.products[0].price * 1,
                    staffId: 'STF002',
                    staffName: 'Mike Chen',
                    pharmacyId: this.currentPharmacy ? this.currentPharmacy.id : 'PHARM001'
                }
            ];
            this.saveData('dispensingHistory', this.dispensingHistory);
            console.log('Sample dispensing records created:', this.dispensingHistory);
        }

        // Add sample return records if none exist
        if (this.returnHistory.length === 0 && this.products.length > 0) {
            console.log('Creating sample return records...');
            
            this.returnHistory = [
                {
                    id: 'RET' + Date.now() + '_1',
                    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
                    items: [
                        {
                            productId: this.products[0].id,
                            name: this.products[0].name,
                            sku: this.products[0].sku,
                            quantity: 1,
                            reason: 'expired',
                            notes: 'Product expired before dispensing',
                            price: this.products[0].price
                        }
                    ],
                    totalItems: 1,
                    totalValue: this.products[0].price * 1,
                    staffId: 'STF001',
                    staffName: 'Dr. Sarah Johnson',
                    pharmacyId: this.currentPharmacy ? this.currentPharmacy.id : 'PHARM001',
                    status: 'processed'
                },
                {
                    id: 'RET' + Date.now() + '_2',
                    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
                    items: [
                        {
                            productId: this.products[1].id,
                            name: this.products[1].name,
                            sku: this.products[1].sku,
                            quantity: 2,
                            reason: 'damaged',
                            notes: 'Package damaged during transport',
                            price: this.products[1].price
                        }
                    ],
                    totalItems: 2,
                    totalValue: this.products[1].price * 2,
                    staffId: 'STF002',
                    staffName: 'Mike Chen',
                    pharmacyId: this.currentPharmacy ? this.currentPharmacy.id : 'PHARM001',
                    status: 'processed'
                }
            ];
            this.saveData('returnHistory', this.returnHistory);
            console.log('Sample return records created:', this.returnHistory);
        }
    }

    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    openModal(modalId) {
        document.getElementById(modalId).style.display = 'block';
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

    formatPrivilegeLevel(privilege) {
        const privilegeMap = {
            'warehouse-assistant': 'Warehouse Assistant',
            'pharmacy-staff': 'Pharmacy Staff',
            'pharmacy-supervisor': 'Pharmacy Supervisor',
            'manager': 'Manager',
            'data-entry': 'Data Entry'
        };
        return privilegeMap[privilege] || 'Warehouse Assistant';
    }

    getPharmacyName(pharmacyId) {
        if (!pharmacyId) return 'No Pharmacy';
        const pharmacy = this.pharmacies.find(p => p.id === pharmacyId);
        return pharmacy ? pharmacy.name : 'Unknown Pharmacy';
    }

    getStaffName(staffId) {
        if (!staffId || staffId === 'Unknown') return 'Unknown';
        const staff = this.staff.find(s => s.id === staffId);
        return staff ? staff.name : 'Unknown';
    }

    authenticateAndDeletePharmacy() {
        const username = document.getElementById('admin-username').value.trim();
        const password = document.getElementById('admin-password').value.trim();
        
        if (!username || !password) {
            this.showMessage('Please enter both username and password', 'error');
            return;
        }
        
        // Check credentials
        if (username === this.systemSettings.adminUsername && password === this.systemSettings.adminPassword) {
            // Authentication successful, proceed with deletion
            this.performPharmacyDeletion();
        } else {
            this.showMessage('Invalid admin credentials. Access denied.', 'error');
            // Clear password field for security
            document.getElementById('admin-password').value = '';
        }
    }

    performPharmacyDeletion() {
        if (!this.pharmacyToDelete) {
            this.showMessage('No pharmacy selected for deletion', 'error');
            return;
        }
        
        const pharmacyId = this.pharmacyToDelete;
        
        // Perform the actual deletion
        this.pharmacies = this.pharmacies.filter(p => p.id !== pharmacyId);
        this.products = this.products.filter(p => p.pharmacyId !== pharmacyId);
        this.staff = this.staff.filter(s => s.pharmacyId !== pharmacyId);
        this.dispensingHistory = this.dispensingHistory.filter(d => d.pharmacyId !== pharmacyId);
        
        // If we're deleting the current pharmacy, switch to another one or clear it
        if (this.currentPharmacy && this.currentPharmacy.id === pharmacyId) {
            if (this.pharmacies.length > 0) {
                this.currentPharmacy = this.pharmacies[0];
                this.saveData('currentPharmacy', this.currentPharmacy);
            } else {
                this.currentPharmacy = null;
                this.saveData('currentPharmacy', null);
            }
        }
        
        this.saveData('pharmacies', this.pharmacies);
        this.saveData('products', this.products);
        this.saveData('staff', this.staff);
        this.saveData('dispensingHistory', this.dispensingHistory);
        
        // Close modal and refresh
        this.closeModal('admin-auth-modal');
        this.loadPharmacies();
        this.loadDashboard();
        this.showMessage('Pharmacy deleted successfully!', 'success');
        
        // Clear the stored pharmacy ID
        this.pharmacyToDelete = null;
    }

    updateAdminCredentials() {
        const username = document.getElementById('admin-username-setting').value.trim();
        const password = document.getElementById('admin-password-setting').value.trim();
        
        if (!username) {
            this.showMessage('Please enter admin username', 'error');
            return;
        }
        
        if (!password) {
            this.showMessage('Please enter admin password', 'error');
            return;
        }
        
        // Update admin credentials
        this.systemSettings.adminUsername = username;
        this.systemSettings.adminPassword = password;
        this.saveData('systemSettings', this.systemSettings);
        
        // Clear password field for security
        document.getElementById('admin-password-setting').value = '';
        
        this.showMessage('Admin credentials updated successfully!', 'success');
    }

    // Login functionality
    initializeLogin() {
        // Check if user is already logged in
        const loggedInUser = this.loadData('loggedInUser');
        const currentPharmacy = this.loadData('currentPharmacy');
        
        if (loggedInUser) {
            this.currentUser = loggedInUser;
            if (currentPharmacy) {
                this.currentPharmacy = currentPharmacy;
            }
            this.showMainApp();
            return;
        }

        // Show login page
        this.showLoginPage();
        this.populateLoginPharmacyDropdown();
    }

    showLoginPage() {
        document.getElementById('login-page').style.display = 'flex';
        document.getElementById('main-app').style.display = 'none';
    }

    switchLoginType(type) {
        const staffToggle = document.getElementById('staff-login-toggle');
        const adminToggle = document.getElementById('admin-login-toggle');
        const staffFields = document.getElementById('staff-login-fields');
        const adminFields = document.getElementById('admin-login-fields');
        const loginTitle = document.getElementById('login-title');
        const loginSubtitle = document.getElementById('login-subtitle');

        // Get form fields
        const staffIdField = document.getElementById('login-staff-id');
        const passwordField = document.getElementById('login-password');
        const pharmacyField = document.getElementById('login-pharmacy');
        const adminUsernameField = document.getElementById('login-admin-username');
        const adminPasswordField = document.getElementById('login-admin-password');

        // Update toggle buttons
        if (type === 'staff') {
            staffToggle.classList.add('active');
            adminToggle.classList.remove('active');
            staffFields.style.display = 'block';
            adminFields.style.display = 'none';
            loginTitle.textContent = 'Staff Login';
            loginSubtitle.textContent = 'Please enter your credentials to access the system';
            
            // Set required attributes for staff fields
            staffIdField.required = true;
            passwordField.required = true;
            pharmacyField.required = true;
            adminUsernameField.required = false;
            adminPasswordField.required = false;
        } else {
            adminToggle.classList.add('active');
            staffToggle.classList.remove('active');
            staffFields.style.display = 'none';
            adminFields.style.display = 'block';
            loginTitle.textContent = 'Admin Login';
            loginSubtitle.textContent = 'Please enter your admin credentials to access the system';
            
            // Set required attributes for admin fields
            staffIdField.required = false;
            passwordField.required = false;
            pharmacyField.required = false;
            adminUsernameField.required = true;
            adminPasswordField.required = true;
        }

        // Clear form fields
        this.clearLoginForm();
    }

    clearLoginForm() {
        document.getElementById('login-staff-id').value = '';
        document.getElementById('login-password').value = '';
        document.getElementById('login-pharmacy').value = '';
        document.getElementById('login-admin-username').value = '';
        document.getElementById('login-admin-password').value = '';
        this.hideLoginError();
    }

    showMainApp() {
        document.getElementById('login-page').style.display = 'none';
        document.getElementById('main-app').style.display = 'block';
        this.updateCurrentUserDisplay();
        
        // Initialize access control
        this.initializeAccessControl();
        
        // Ensure dashboard is the active section
        this.switchSection('dashboard');
    }

    populateLoginPharmacyDropdown() {
        const pharmacySelect = document.getElementById('login-pharmacy');
        if (!pharmacySelect) return;
        
        // Clear existing options except the first one
        pharmacySelect.innerHTML = '<option value="">Select Pharmacy</option>';
        
        // Add pharmacy options
        this.pharmacies.forEach(pharmacy => {
            const option = document.createElement('option');
            option.value = pharmacy.id;
            option.textContent = pharmacy.name;
            pharmacySelect.appendChild(option);
        });
    }

    handleLogin() {
        console.log('Login button clicked - handleLogin called');
        
        // Clear previous error
        this.hideLoginError();

        // Check if admin login is active
        const isAdminLogin = document.getElementById('admin-login-toggle').classList.contains('active');
        console.log('Is admin login active:', isAdminLogin);
        
        if (isAdminLogin) {
            console.log('Calling handleAdminLogin');
            this.handleAdminLogin();
        } else {
            console.log('Calling handleStaffLogin');
            this.handleStaffLogin();
        }
    }

    handleStaffLogin() {
        const staffId = document.getElementById('login-staff-id').value.trim();
        const password = document.getElementById('login-password').value.trim();
        const pharmacyId = document.getElementById('login-pharmacy').value;

        console.log('Staff login values:', { staffId, password, pharmacyId });

        // Validate inputs
        if (!staffId || !password || !pharmacyId) {
            console.log('Validation failed - missing fields');
            this.showLoginError('Please fill in all fields');
            return;
        }

        // Find staff member
        const staff = this.staff.find(s => 
            s.id === staffId && 
            s.pharmacyId === pharmacyId &&
            s.password === password
        );

        if (!staff) {
            this.showLoginError('Invalid Staff ID, Password, or Pharmacy. Please check your credentials.');
            return;
        }

        // Set current user and pharmacy
        this.currentUser = staff;
        this.currentPharmacy = this.pharmacies.find(p => p.id === pharmacyId);

        // Save login state
        this.saveData('loggedInUser', this.currentUser);
        this.saveData('currentPharmacy', this.currentPharmacy);

        // Show main app
        this.showMainApp();
        this.initializeAccessControl(); // Initialize access control after login
        this.loadDashboard();
        this.loadInventory();
        this.loadStaff();

        // Show success message
        this.showMessage(`Welcome back, ${staff.name}!`, 'success');
    }

    handleAdminLogin() {
        const username = document.getElementById('login-admin-username').value.trim();
        const password = document.getElementById('login-admin-password').value.trim();

        console.log('Admin login values:', { username, password });

        // Validate inputs
        if (!username || !password) {
            console.log('Admin validation failed - missing fields');
            this.showLoginError('Please enter both username and password');
            return;
        }

        // Get admin credentials from system settings
        const adminCredentials = this.loadData('adminCredentials') || {
            username: 'admin',
            password: 'admin123'
        };

        // Check admin credentials
        if (username === adminCredentials.username && password === adminCredentials.password) {
            // Create admin user object
            this.currentUser = {
                id: 'ADMIN',
                name: 'System Administrator',
                role: 'admin',
                privilege: 'admin',
                email: 'admin@vivalife.com',
                phone: '',
                pharmacyId: 'ADMIN',
                isAdmin: true
            };

            // Set current pharmacy to first available pharmacy or create default
            if (this.pharmacies.length > 0) {
                this.currentPharmacy = this.pharmacies[0];
            } else {
                this.currentPharmacy = {
                    id: 'ADMIN',
                    name: 'System Administration',
                    address: 'System Admin',
                    phone: '',
                    email: 'admin@vivalife.com',
                    status: 'active'
                };
            }

            // Save login state
            this.saveData('loggedInUser', this.currentUser);
            this.saveData('currentPharmacy', this.currentPharmacy);

            // Show main app
            this.showMainApp();
            this.initializeAccessControl(); // Initialize access control after admin login
            this.loadDashboard();
            this.loadInventory();
            this.loadStaff();

            // Show success message
            this.showMessage('Welcome, System Administrator!', 'success');
        } else {
            this.showLoginError('Invalid admin credentials. Please check your username and password.');
        }
    }

    showLoginError(message) {
        const errorDiv = document.getElementById('login-error');
        const errorText = document.getElementById('login-error-text');
        
        errorText.textContent = message;
        errorDiv.style.display = 'flex';
    }

    hideLoginError() {
        const errorDiv = document.getElementById('login-error');
        errorDiv.style.display = 'none';
    }

    updateCurrentUserDisplay() {
        const userElement = document.getElementById('current-user');
        if (userElement && this.currentUser) {
            userElement.textContent = `Welcome, ${this.currentUser.name}`;
        }
    }

    logout() {
        // Clear login state
        this.currentUser = null;
        this.currentPharmacy = null;
        this.saveData('loggedInUser', null);
        this.saveData('currentPharmacy', null);

        // Clear form
        document.getElementById('login-form').reset();
        this.hideLoginError();

        // Show login page
        this.showLoginPage();
        this.populateLoginPharmacyDropdown();

        this.showMessage('You have been logged out successfully', 'info');
    }

    // Privilege Management
    openPrivilegeModal(privilege = null) {
        const modal = document.getElementById('privilege-modal');
        const form = document.getElementById('privilege-form');
        const title = document.getElementById('privilege-modal-title');
        
        if (privilege) {
            // Edit mode
            title.textContent = 'Edit Privilege';
            document.getElementById('privilege-name').value = privilege.name;
            document.getElementById('privilege-description').value = privilege.description || '';
            
            // Set permissions
            this.setPrivilegePermissions(privilege.permissions);
            this.editingPrivilege = privilege;
        } else {
            // Add mode
            title.textContent = 'Add New Privilege';
            form.reset();
            this.editingPrivilege = null;
        }
        
        modal.style.display = 'block';
    }

    setPrivilegePermissions(permissions) {
        const permissionMap = {
            'view-inventory': 'perm-view-inventory',
            'add-products': 'perm-add-products',
            'edit-products': 'perm-edit-products',
            'delete-products': 'perm-delete-products',
            'process-dispensing': 'perm-process-dispensing',
            'view-dispensing-history': 'perm-view-dispensing-history',
            'process-returns': 'perm-process-returns',
            'view-returns-history': 'perm-view-returns-history',
            'view-reports': 'perm-view-reports',
            'manage-pharmacies': 'perm-manage-pharmacies',
            'manage-staff': 'perm-manage-staff',
            'system-settings': 'perm-system-settings'
        };

        // Clear all checkboxes first
        Object.values(permissionMap).forEach(id => {
            const checkbox = document.getElementById(id);
            if (checkbox) checkbox.checked = false;
        });

        // Set permissions
        if (permissions) {
            permissions.forEach(permission => {
                const checkboxId = permissionMap[permission];
                if (checkboxId) {
                    const checkbox = document.getElementById(checkboxId);
                    if (checkbox) checkbox.checked = true;
                }
            });
        }
    }

    getPrivilegePermissions() {
        const permissions = [];
        const permissionMap = {
            'perm-view-inventory': 'view-inventory',
            'perm-add-products': 'add-products',
            'perm-edit-products': 'edit-products',
            'perm-delete-products': 'delete-products',
            'perm-process-dispensing': 'process-dispensing',
            'perm-view-dispensing-history': 'view-dispensing-history',
            'perm-process-returns': 'process-returns',
            'perm-view-returns-history': 'view-returns-history',
            'perm-view-reports': 'view-reports',
            'perm-manage-pharmacies': 'manage-pharmacies',
            'perm-manage-staff': 'manage-staff',
            'perm-system-settings': 'system-settings'
        };

        Object.entries(permissionMap).forEach(([checkboxId, permission]) => {
            const checkbox = document.getElementById(checkboxId);
            if (checkbox && checkbox.checked) {
                permissions.push(permission);
            }
        });

        return permissions;
    }

    savePrivilege() {
        const name = document.getElementById('privilege-name').value.trim();
        const description = document.getElementById('privilege-description').value.trim();
        const permissions = this.getPrivilegePermissions();

        if (!name) {
            this.showMessage('Please enter privilege name', 'error');
            return;
        }

        const privilegeData = {
            id: this.editingPrivilege ? this.editingPrivilege.id : 'PRIV' + Date.now(),
            name: name,
            description: description,
            permissions: permissions,
            isDefault: this.editingPrivilege ? this.editingPrivilege.isDefault : false
        };

        if (this.editingPrivilege) {
            // Update existing privilege
            const index = this.privileges.findIndex(p => p.id === this.editingPrivilege.id);
            this.privileges[index] = { ...this.privileges[index], ...privilegeData };
        } else {
            // Add new privilege
            this.privileges.push(privilegeData);
        }

        this.saveData('privileges', this.privileges);
        this.closeModal('privilege-modal');
        this.loadPrivileges();
        this.showMessage('Privilege saved successfully!', 'success');
    }

    loadPrivileges() {
        // Load privileges from localStorage or use defaults
        this.privileges = this.loadData('privileges') || this.getDefaultPrivileges();
        this.renderPrivileges();
    }

    getDefaultPrivileges() {
        return [
            {
                id: 'warehouse-assistant',
                name: 'Warehouse Assistant',
                description: 'Basic inventory management and data entry',
                permissions: ['view-dashboard', 'view-inventory', 'add-products', 'edit-products', 'delete-products', 'process-dispensing', 'view-dispensing-history', 'process-returns', 'view-returns-history', 'view-reports', 'export-data', 'import-data'],
                isDefault: true
            },
            {
                id: 'pharmacy-staff',
                name: 'Pharmacy Staff',
                description: 'Full pharmacy operations and customer service',
                permissions: ['view-dashboard', 'view-inventory', 'add-products', 'edit-products', 'delete-products', 'process-dispensing', 'view-dispensing-history', 'process-returns', 'view-returns-history', 'view-reports', 'view-staff', 'export-data', 'import-data', 'view-rsd-tracking'],
                isDefault: true
            },
            {
                id: 'pharmacy-supervisor',
                name: 'Pharmacy Supervisor',
                description: 'Supervisory role with staff management capabilities',
                permissions: ['view-dashboard', 'view-inventory', 'add-products', 'edit-products', 'delete-products', 'process-dispensing', 'view-dispensing-history', 'process-returns', 'view-returns-history', 'view-reports', 'manage-pharmacies', 'manage-staff', 'export-data', 'import-data', 'view-rsd-tracking'],
                isDefault: true
            },
            {
                id: 'manager',
                name: 'Manager',
                description: 'Full system access and management capabilities',
                permissions: ['view-dashboard', 'view-inventory', 'add-products', 'edit-products', 'delete-products', 'process-dispensing', 'view-dispensing-history', 'process-returns', 'view-returns-history', 'view-reports', 'manage-pharmacies', 'manage-staff', 'system-settings', 'admin-access', 'export-data', 'import-data', 'view-rsd-tracking'],
                isDefault: true
            },
            {
                id: 'data-entry',
                name: 'Data Entry',
                description: 'Limited access for data entry tasks only',
                permissions: ['view-dashboard', 'view-inventory', 'add-products', 'edit-products', 'view-dispensing-history', 'view-returns-history', 'view-reports', 'export-data', 'import-data'],
                isDefault: true
            },
            {
                id: 'admin',
                name: 'System Administrator',
                description: 'Full system access with all permissions',
                permissions: ['view-dashboard', 'view-inventory', 'add-products', 'edit-products', 'delete-products', 'process-dispensing', 'view-dispensing-history', 'process-returns', 'view-returns-history', 'view-reports', 'manage-pharmacies', 'manage-staff', 'system-settings', 'admin-access', 'export-data', 'import-data', 'view-rsd-tracking'],
                isDefault: true
            }
        ];
    }

    renderPrivileges() {
        const privilegeList = document.querySelector('.privilege-list');
        if (!privilegeList) return;

        privilegeList.innerHTML = '';

        this.privileges.forEach(privilege => {
            const privilegeItem = this.createPrivilegeItem(privilege);
            privilegeList.appendChild(privilegeItem);
        });

        // Update summary statistics
        this.updatePrivilegeSummary();
    }

    updatePrivilegeSummary() {
        const totalPrivileges = this.privileges.length;
        const defaultPrivileges = this.privileges.filter(p => p.isDefault).length;
        const customPrivileges = this.privileges.filter(p => !p.isDefault).length;
        const totalPermissions = this.privileges.reduce((sum, p) => sum + p.permissions.length, 0);

        // Update summary cards
        const totalPrivilegesEl = document.getElementById('total-privileges');
        const defaultPrivilegesEl = document.getElementById('default-privileges');
        const customPrivilegesEl = document.getElementById('custom-privileges');
        const totalPermissionsEl = document.getElementById('total-permissions');

        if (totalPrivilegesEl) totalPrivilegesEl.textContent = totalPrivileges;
        if (defaultPrivilegesEl) defaultPrivilegesEl.textContent = defaultPrivileges;
        if (customPrivilegesEl) customPrivilegesEl.textContent = customPrivileges;
        if (totalPermissionsEl) totalPermissionsEl.textContent = totalPermissions;
    }

    createPrivilegeItem(privilege) {
        const item = document.createElement('div');
        item.className = 'privilege-item';
        item.setAttribute('data-privilege', privilege.id);

        const permissionGroups = this.groupPermissions(privilege.permissions);

        item.innerHTML = `
            <div class="privilege-info">
                <h4>${privilege.name}</h4>
                <p>${privilege.description}</p>
                <div class="privilege-stats">
                    <span class="stat-item">
                        <i class="fas fa-shield-alt"></i>
                        <strong>${privilege.permissions.length}</strong> Permissions
                    </span>
                    <span class="stat-item">
                        <i class="fas fa-${privilege.isDefault ? 'lock' : 'unlock'}"></i>
                        ${privilege.isDefault ? 'System Default' : 'Custom'}
                    </span>
                </div>
            </div>
            <div class="privilege-permissions">
                ${permissionGroups.map(group => `
                    <div class="permission-group">
                        <h5>${group.title}</h5>
                        ${group.permissions.map(permission => `
                            <label class="permission-item ${permission.hasPermission ? 'granted' : 'denied'}">
                                <input type="checkbox" ${permission.hasPermission ? 'checked' : ''} disabled>
                                <span class="permission-label">${permission.label}</span>
                                <span class="permission-status">
                                    <i class="fas fa-${permission.hasPermission ? 'check-circle' : 'times-circle'}"></i>
                                    ${permission.hasPermission ? 'Granted' : 'Denied'}
                                </span>
                            </label>
                        `).join('')}
                    </div>
                `).join('')}
            </div>
            <div class="privilege-actions">
                <button class="btn btn-sm btn-outline edit-privilege" data-privilege="${privilege.id}">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-sm btn-danger delete-privilege" data-privilege="${privilege.id}" ${privilege.isDefault ? 'disabled' : ''}>
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        `;

        // Add event listeners
        item.querySelector('.edit-privilege').addEventListener('click', () => {
            this.openPrivilegeModal(privilege);
        });

        if (!privilege.isDefault) {
            item.querySelector('.delete-privilege').addEventListener('click', () => {
                this.deletePrivilege(privilege.id);
            });
        }

        return item;
    }

    groupPermissions(permissions) {
        const permissionGroups = {
            'Inventory Access': [
                { key: 'view-inventory', label: 'View Inventory' },
                { key: 'add-products', label: 'Add Products' },
                { key: 'edit-products', label: 'Edit Products' },
                { key: 'delete-products', label: 'Delete Products' }
            ],
            'Dispensing Access': [
                { key: 'process-dispensing', label: 'Process Dispensing' },
                { key: 'view-dispensing-history', label: 'View Dispensing History' }
            ],
            'Returns Access': [
                { key: 'process-returns', label: 'Process Returns' },
                { key: 'view-returns-history', label: 'View Returns History' }
            ],
            'Reports Access': [
                { key: 'view-reports', label: 'View Reports' }
            ],
            'Admin Access': [
                { key: 'manage-pharmacies', label: 'Manage Pharmacies' },
                { key: 'manage-staff', label: 'Manage Staff' },
                { key: 'system-settings', label: 'System Settings' }
            ]
        };

        return Object.entries(permissionGroups).map(([title, groupPermissions]) => ({
            title,
            permissions: groupPermissions.map(perm => ({
                ...perm,
                hasPermission: permissions.includes(perm.key)
            }))
        }));
    }

    deletePrivilege(privilegeId) {
        if (confirm('Are you sure you want to delete this privilege? This action cannot be undone.')) {
            this.privileges = this.privileges.filter(p => p.id !== privilegeId);
            this.saveData('privileges', this.privileges);
            this.loadPrivileges();
            this.showMessage('Privilege deleted successfully!', 'success');
        }
    }

    filterPrivileges() {
        const searchTerm = document.getElementById('privilege-search').value.toLowerCase();
        const typeFilter = document.getElementById('privilege-type-filter').value;
        
        const privilegeItems = document.querySelectorAll('.privilege-item');
        
        privilegeItems.forEach(item => {
            const privilegeId = item.getAttribute('data-privilege');
            const privilege = this.privileges.find(p => p.id === privilegeId);
            
            if (!privilege) return;
            
            const matchesSearch = privilege.name.toLowerCase().includes(searchTerm) ||
                                privilege.description.toLowerCase().includes(searchTerm);
            
            const matchesType = !typeFilter || 
                              (typeFilter === 'default' && privilege.isDefault) ||
                              (typeFilter === 'custom' && !privilege.isDefault);
            
            if (matchesSearch && matchesType) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }

    // Returns functionality
    loadReturns() {
        this.loadReturnHistory();
        this.updateReturnItemsDisplay();
        
        // If no dispensing history, create some test data
        if (this.dispensingHistory.length === 0 && this.products.length > 0) {
            this.createTestDispensingRecords();
        }
    }

    createTestDispensingRecords() {
        if (this.products.length < 2) {
            console.log('Not enough products to create test records');
            return;
        }

        // First, fix existing dispensing records that have undefined productId
        this.fixExistingDispensingRecords();

        const testRecords = [
            {
                id: 'TEST_DSP_001',
                invoiceNumber: 'TEST_INV_001',
                date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                items: [
                    {
                        productId: this.products[0].id,
                        sku: this.products[0].sku,
                        name: this.products[0].name,
                        quantity: 2,
                        price: this.products[0].price
                    }
                ],
                totalValue: this.products[0].price * 2,
                staffId: 'TEST_STAFF_001',
                staffName: 'Test Staff',
                pharmacyId: this.currentPharmacy ? this.currentPharmacy.id : 'PHARM001'
            },
            {
                id: 'TEST_DSP_002',
                invoiceNumber: 'TEST_INV_002',
                date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                items: [
                    {
                        productId: this.products[1].id,
                        sku: this.products[1].sku,
                        name: this.products[1].name,
                        quantity: 1,
                        price: this.products[1].price
                    }
                ],
                totalValue: this.products[1].price * 1,
                staffId: 'TEST_STAFF_002',
                staffName: 'Test Staff 2',
                pharmacyId: this.currentPharmacy ? this.currentPharmacy.id : 'PHARM001'
            }
        ];

        this.dispensingHistory = testRecords;
        this.saveData('dispensingHistory', this.dispensingHistory);
        console.log('Test dispensing records created:', this.dispensingHistory);
    }

    fixExistingDispensingRecords() {
        let recordsUpdated = false;
        
        this.dispensingHistory.forEach(record => {
            record.items.forEach(item => {
                if (!item.productId && item.sku) {
                    // Find product by SKU and assign the correct productId
                    const product = this.products.find(p => p.sku === item.sku);
                    if (product) {
                        item.productId = product.id;
                        recordsUpdated = true;
                    }
                }
            });
        });
        
        if (recordsUpdated) {
            this.saveData('dispensingHistory', this.dispensingHistory);
        }
    }

    searchReturnProducts(query) {
        if (!query || query.length < 2) {
            this.hideSearchResults();
            return;
        }

        const products = this.getCurrentPharmacyData();
        const searchTerm = query.toLowerCase().trim();
        
        const filteredProducts = products.filter(product => 
            product.name.toLowerCase().includes(searchTerm) ||
            product.sku.toLowerCase().includes(searchTerm) ||
            (product.barcode && product.barcode.toLowerCase().includes(searchTerm)) ||
            (product.category && product.category.toLowerCase().includes(searchTerm))
        );

        this.displaySearchResults(filteredProducts);
    }

    displaySearchResults(products) {
        const resultsContainer = document.getElementById('return-search-results');
        if (!resultsContainer) return;

        if (products.length === 0) {
            resultsContainer.innerHTML = `
                <div class="search-result-item no-results">
                    <i class="fas fa-search"></i>
                    <div>
                        <h4>No products found</h4>
                        <p>Try searching by product name, SKU, or category</p>
                    </div>
                </div>
            `;
        } else {
            resultsContainer.innerHTML = products.map(product => `
                <div class="search-result-item" data-product-id="${product.id}">
                    <div class="product-icon">
                        <i class="fas fa-pills"></i>
                    </div>
                    <div class="product-info">
                        <h4>${product.name}</h4>
                        <p class="product-details">
                            <span class="sku">SKU: ${product.sku}</span>
                            <span class="stock">Stock: ${product.currentStock}</span>
                            <span class="price">${this.formatCurrency(product.price)}</span>
                        </p>
                        <p class="product-category">Category: ${product.category}</p>
                    </div>
                    <div class="product-actions">
                        <i class="fas fa-arrow-right"></i>
                    </div>
                </div>
            `).join('');
        }

        resultsContainer.style.display = 'block';

        // Remove any existing event listeners first
        resultsContainer.removeEventListener('click', this.handleSearchResultClick);
        
        // Add click listener using event delegation
        this.handleSearchResultClick = (e) => {
            const searchItem = e.target.closest('.search-result-item:not(.no-results)');
            if (searchItem) {
                e.preventDefault();
                e.stopPropagation();
                const productId = searchItem.getAttribute('data-product-id');
                this.selectReturnProduct(productId);
            }
        };
        
        resultsContainer.addEventListener('click', this.handleSearchResultClick);
    }

    hideSearchResults() {
        const resultsContainer = document.getElementById('return-search-results');
        if (resultsContainer) {
            resultsContainer.style.display = 'none';
        }
    }

    selectReturnProduct(productId) {
        const products = this.getCurrentPharmacyData();
        this.selectedReturnProduct = products.find(p => p.id === productId);
        
        if (this.selectedReturnProduct) {
            document.getElementById('return-search').value = this.selectedReturnProduct.name;
            this.hideSearchResults();
            this.showMessage(`Selected: ${this.selectedReturnProduct.name}`, 'success');
            
            // Show invoices containing this product
            this.showProductInvoices(productId);
        } else {
            this.showMessage('Product not found', 'error');
        }
    }

    scanReturnProduct() {
        // Simulate barcode scanning
        const barcode = prompt('Enter barcode or scan:');
        if (barcode) {
            const products = this.getCurrentPharmacyData();
            const product = products.find(p => p.sku === barcode || p.barcode === barcode);
            
            if (product) {
                this.selectReturnProduct(product.id);
            } else {
                this.showMessage('Product not found with this barcode', 'error');
            }
        }
    }

    findProductInvoices(productId) {
        // Find all dispensing records (invoices) that contain this product
        const currentPharmacyId = this.currentPharmacy ? this.currentPharmacy.id : 'PHARM001';
        
        const filteredRecords = this.dispensingHistory.filter(record => 
            record.pharmacyId === currentPharmacyId &&
            record.items.some(item => item.productId === productId)
        );
        
        return filteredRecords;
    }

    showProductInvoices(productId) {
        const invoices = this.findProductInvoices(productId);
        const invoiceListContainer = document.getElementById('product-invoices-list');
        
        if (!invoiceListContainer) {
            console.error('Invoice list container not found');
            return;
        }

        if (invoices.length === 0) {
            invoiceListContainer.innerHTML = `
                <div class="no-invoices">
                    <i class="fas fa-receipt"></i>
                    <h4>No Invoices Found</h4>
                    <p>This product has not been dispensed yet.</p>
                </div>
            `;
        } else {
            invoiceListContainer.innerHTML = `
                <div class="invoices-header">
                    <h4><i class="fas fa-receipt"></i> Invoices Containing This Product</h4>
                    <span class="invoice-count">${invoices.length} invoice${invoices.length !== 1 ? 's' : ''} found</span>
                </div>
                <div class="invoices-list">
                    ${invoices.map(invoice => this.createInvoiceItem(invoice, productId)).join('')}
                </div>
            `;
        }
        
        // Show the invoice list
        invoiceListContainer.style.display = 'block';
    }

    createInvoiceItem(invoice, productId) {
        const invoiceDate = new Date(invoice.date).toLocaleDateString('en-GB');
        const invoiceTime = new Date(invoice.date).toLocaleTimeString();
        const productItem = invoice.items.find(item => item.productId === productId);
        
        return `
            <div class="invoice-item" data-invoice-id="${invoice.id}">
                <div class="invoice-header">
                    <div class="invoice-info">
                        <h5>Invoice #${invoice.invoiceNumber}</h5>
                        <p class="invoice-date">${invoiceDate} at ${invoiceTime}</p>
                    </div>
                    <div class="invoice-actions">
                        <button class="btn btn-sm btn-outline view-invoice-details" data-invoice-id="${invoice.id}">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="btn btn-sm btn-primary select-invoice" data-invoice-id="${invoice.id}">
                            <i class="fas fa-check"></i> Select
                        </button>
                    </div>
                </div>
                <div class="invoice-details">
                    <div class="product-detail">
                        <span class="product-quantity">Qty: ${productItem.quantity}</span>
                        <span class="product-price">${this.formatCurrency(productItem.price)} each</span>
                        <span class="product-total">Total: ${this.formatCurrency(productItem.price * productItem.quantity)}</span>
                    </div>
                    <div class="invoice-summary">
                        <span class="total-items">${invoice.items.length} items</span>
                        <span class="total-value">${this.formatCurrency(invoice.totalValue)}</span>
                        <span class="staff-name">Dispensed by: ${invoice.staffName}</span>
                    </div>
                </div>
            </div>
        `;
    }

    selectInvoiceForReturn(invoiceId) {
        const invoice = this.dispensingHistory.find(record => record.id === invoiceId);
        if (!invoice) {
            this.showMessage('Invoice not found', 'error');
            return;
        }

        // Store selected invoice for return processing
        this.selectedInvoice = invoice;
        
        // Update UI to show selected invoice
        document.querySelectorAll('.invoice-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        const selectedItem = document.querySelector(`[data-invoice-id="${invoiceId}"]`);
        if (selectedItem) {
            selectedItem.classList.add('selected');
        }

        this.showMessage(`Selected Invoice #${invoice.invoiceNumber} for return processing`, 'success');
    }

    viewInvoiceDetails(invoiceId) {
        const invoice = this.dispensingHistory.find(record => record.id === invoiceId);
        if (!invoice) {
            this.showMessage('Invoice not found', 'error');
            return;
        }

        this.openInvoiceDetailsModal(invoice);
    }

    openInvoiceDetailsModal(invoice) {
        // Create modal if it doesn't exist
        let modal = document.getElementById('invoice-details-modal');
        if (!modal) {
            modal = this.createInvoiceDetailsModal();
            document.body.appendChild(modal);
        }

        // Populate modal with invoice data
        this.populateInvoiceDetailsModal(invoice);
        
        // Show modal
        modal.style.display = 'block';
    }

    createInvoiceDetailsModal() {
        const modal = document.createElement('div');
        modal.id = 'invoice-details-modal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 800px;">
                <div class="modal-header">
                    <h3 id="invoice-modal-title">Invoice Details</h3>
                    <span class="close" id="close-invoice-modal">&times;</span>
                </div>
                <div class="modal-body" id="invoice-modal-body">
                    <!-- Invoice details will be populated here -->
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline" id="close-invoice-details">Close</button>
                    <button type="button" class="btn btn-primary" id="select-invoice-from-modal">Select This Invoice</button>
                </div>
            </div>
        `;

        // Add event listeners
        modal.querySelector('#close-invoice-modal').addEventListener('click', () => {
            this.closeModal('invoice-details-modal');
        });
        
        modal.querySelector('#close-invoice-details').addEventListener('click', () => {
            this.closeModal('invoice-details-modal');
        });
        
        modal.querySelector('#select-invoice-from-modal').addEventListener('click', () => {
            const invoiceId = modal.getAttribute('data-invoice-id');
            this.selectInvoiceForReturn(invoiceId);
            this.closeModal('invoice-details-modal');
        });

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal('invoice-details-modal');
            }
        });

        return modal;
    }

    populateInvoiceDetailsModal(invoice) {
        const modal = document.getElementById('invoice-details-modal');
        const modalBody = document.getElementById('invoice-modal-body');
        const modalTitle = document.getElementById('invoice-modal-title');
        
        modal.setAttribute('data-invoice-id', invoice.id);
        modalTitle.textContent = `Invoice #${invoice.invoiceNumber} Details`;

        const invoiceDate = new Date(invoice.date).toLocaleDateString('en-GB');
        const invoiceTime = new Date(invoice.date).toLocaleTimeString();
        const pharmacy = this.pharmacies.find(p => p.id === invoice.pharmacyId);

        modalBody.innerHTML = `
            <div class="invoice-details-container">
                <!-- Invoice Header -->
                <div class="invoice-details-header">
                    <div class="invoice-info-section">
                        <h4>Invoice Information</h4>
                        <div class="info-grid">
                            <div class="info-item">
                                <label>Invoice Number:</label>
                                <span>${invoice.invoiceNumber}</span>
                            </div>
                            <div class="info-item">
                                <label>Date & Time:</label>
                                <span>${invoiceDate} at ${invoiceTime}</span>
                            </div>
                            <div class="info-item">
                                <label>Pharmacy:</label>
                                <span>${pharmacy ? pharmacy.name : 'Unknown'}</span>
                            </div>
                            <div class="info-item">
                                <label>Dispensed by:</label>
                                <span>${invoice.staffName}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Items List -->
                <div class="invoice-items-section">
                    <h4>Dispensed Items</h4>
                    <div class="items-table-container">
                        <table class="invoice-items-table">
                            <thead>
                                <tr>
                                    <th>Product Name</th>
                                    <th>SKU</th>
                                    <th>Quantity</th>
                                    <th>Unit Price</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${invoice.items.map(item => `
                                    <tr>
                                        <td>${item.name}</td>
                                        <td>${item.sku}</td>
                                        <td>${item.quantity}</td>
                                        <td>${this.formatCurrency(item.price)}</td>
                                        <td>${this.formatCurrency(item.price * item.quantity)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Invoice Summary -->
                <div class="invoice-summary-section">
                    <div class="summary-card">
                        <div class="summary-item">
                            <label>Total Items:</label>
                            <span>${invoice.items.length}</span>
                        </div>
                        <div class="summary-item">
                            <label>Total Quantity:</label>
                            <span>${invoice.items.reduce((sum, item) => sum + item.quantity, 0)}</span>
                        </div>
                        <div class="summary-item total">
                            <label>Total Value:</label>
                            <span>${this.formatCurrency(invoice.totalValue)}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    addReturnItem() {
        if (!this.selectedReturnProduct) {
            this.showMessage('Please select a product first', 'error');
            return;
        }

        const reason = document.getElementById('return-reason').value;
        const quantity = parseInt(document.getElementById('return-quantity').value);
        const notes = document.getElementById('return-notes').value;

        if (!reason) {
            this.showMessage('Please select a return reason', 'error');
            return;
        }

        if (!quantity || quantity <= 0) {
            this.showMessage('Please enter a valid quantity', 'error');
            return;
        }

        if (quantity > this.selectedReturnProduct.currentStock) {
            this.showMessage('Return quantity cannot exceed current stock', 'error');
            return;
        }

        // Check if product already in return list
        const existingItem = this.returnItems.find(item => item.productId === this.selectedReturnProduct.id);
        if (existingItem) {
            existingItem.quantity += quantity;
            existingItem.notes = notes;
        } else {
            this.returnItems.push({
                id: 'RET' + Date.now(),
                productId: this.selectedReturnProduct.id,
                name: this.selectedReturnProduct.name,
                sku: this.selectedReturnProduct.sku,
                quantity: quantity,
                reason: reason,
                notes: notes,
                price: this.selectedReturnProduct.price
            });
        }

        this.updateReturnItemsDisplay();
        this.clearReturnForm();
        this.showMessage('Item added to return list', 'success');
    }

    updateReturnItemsDisplay() {
        const returnItemsList = document.getElementById('return-items-list');
        const processButton = document.getElementById('process-returns');
        const clearButton = document.getElementById('clear-return-list');
        
        if (!returnItemsList) return;

        if (this.returnItems.length === 0) {
            returnItemsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-undo"></i>
                    <p>No items added for return</p>
                    <span>Search and add medications to process returns</span>
                </div>
            `;
            processButton.disabled = true;
            clearButton.disabled = true;
        } else {
            returnItemsList.innerHTML = this.returnItems.map(item => `
                <div class="return-item" data-item-id="${item.id}">
                    <div class="return-item-info">
                        <h4>${item.name}</h4>
                        <p>SKU: ${item.sku}</p>
                    </div>
                    <div class="return-item-details">
                        <span class="return-quantity">Qty: ${item.quantity}</span>
                        <span class="return-reason">${this.formatReturnReason(item.reason)}</span>
                    </div>
                    <div class="return-item-actions">
                        <button class="btn btn-sm btn-outline edit-return-item" data-item-id="${item.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger remove-return-item" data-item-id="${item.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');

            processButton.disabled = false;
            clearButton.disabled = false;

            // Add event listeners
            returnItemsList.querySelectorAll('.remove-return-item').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const itemId = e.target.closest('.remove-return-item').getAttribute('data-item-id');
                    this.removeReturnItem(itemId);
                });
            });
        }
    }

    formatReturnReason(reason) {
        const reasonMap = {
            'expired': 'Expired',
            'damaged': 'Damaged',
            'wrong-medication': 'Wrong Medication',
            'patient-refused': 'Patient Refused',
            'overstock': 'Overstock',
            'recall': 'Product Recall',
            'other': 'Other',
            'unknown': 'Unknown'
        };
        return reasonMap[reason] || reason || 'Unknown';
    }

    removeReturnItem(itemId) {
        this.returnItems = this.returnItems.filter(item => item.id !== itemId);
        this.updateReturnItemsDisplay();
        this.showMessage('Item removed from return list', 'info');
    }

    clearReturnForm() {
        document.getElementById('return-form').reset();
        this.selectedReturnProduct = null;
        this.hideSearchResults();
    }

    clearReturnList() {
        if (this.returnItems.length > 0 && confirm('Are you sure you want to clear all return items?')) {
            this.returnItems = [];
            this.updateReturnItemsDisplay();
            this.showMessage('Return list cleared', 'info');
        } else if (this.returnItems.length === 0) {
            this.showMessage('No items to clear', 'info');
        }
    }

    processReturns() {
        if (this.returnItems.length === 0) {
            this.showMessage('No items to process', 'error');
            return;
        }

        const returnRecord = {
            id: 'RET' + Date.now(),
            date: new Date().toISOString(),
            items: this.returnItems.map(item => ({
                productId: item.productId,
                name: item.name,
                sku: item.sku,
                quantity: item.quantity,
                reason: item.reason,
                notes: item.notes,
                price: item.price
            })),
            totalItems: this.returnItems.reduce((sum, item) => sum + item.quantity, 0),
            totalValue: this.returnItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            staffId: this.currentUser?.id || 'Unknown',
            staffName: this.currentUser?.name || 'Unknown',
            pharmacyId: this.currentPharmacy ? this.currentPharmacy.id : 'PHARM001',
            status: 'processed'
        };

        // Update inventory
        this.returnItems.forEach(item => {
            const product = this.products.find(p => p.id === item.productId);
            if (product) {
                product.currentStock += item.quantity;
            }
        });

        // Save data
        this.returnHistory.unshift(returnRecord);
        this.saveData('returnHistory', this.returnHistory);
        this.saveData('products', this.products);

        // Clear return list
        this.returnItems = [];
        this.updateReturnItemsDisplay();
        this.loadReturnHistory();

        this.showMessage(`Successfully processed ${returnRecord.totalItems} returned items`, 'success');
    }

    loadReturnHistory() {
        const historyList = document.getElementById('return-history-list');
        if (!historyList) return;

        const dateFilter = document.getElementById('return-date-filter').value;
        let filteredHistory = this.returnHistory;

        if (dateFilter) {
            const filterDate = new Date(dateFilter).toDateString();
            filteredHistory = this.returnHistory.filter(record => {
                const recordDate = record.timestamp ? record.timestamp : record.date;
                return new Date(recordDate).toDateString() === filterDate;
            });
        }

        if (filteredHistory.length === 0) {
            historyList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-history"></i>
                    <p>No return records found</p>
                    <span>Process some returns to see history here</span>
                </div>
            `;
        } else {
            historyList.innerHTML = filteredHistory.slice(0, 10).map(record => `
                <div class="return-history-item">
                    <div class="return-history-info">
                        <h4>Return #${record.id}</h4>
                        <div class="return-history-details">
                            <span>${record.totalItems} items</span>
                            <span>${this.formatCurrency(record.totalValue)}</span>
                            <span class="return-history-date">${new Date(record.timestamp || record.date).toLocaleString()}</span>
                        </div>
                    </div>
                    <div class="return-status ${record.status}">
                        ${record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                    </div>
                </div>
            `).join('');
        }
    }


    // Data persistence
    saveData(key, data) {
        localStorage.setItem(`pharmacy_${key}`, JSON.stringify(data));
    }

    loadData(key) {
        const data = localStorage.getItem(`pharmacy_${key}`);
        return data ? JSON.parse(data) : null;
    }

    // Report Generation Functions
    generateInventoryReport() {
        const products = this.getCurrentPharmacyData();
        const currentDate = new Date().toLocaleDateString('en-GB');
        const currentTime = new Date().toLocaleTimeString();
        const pharmacyName = this.currentPharmacy ? this.currentPharmacy.name : 'All Pharmacies';

        // Calculate summary statistics
        const totalProducts = products.length;
        const lowStockProducts = products.filter(p => p.currentStock < 10).length;
        const outOfStockProducts = products.filter(p => p.currentStock === 0).length;
        const totalValue = products.reduce((sum, p) => sum + (p.price * p.currentStock), 0);

        // Generate report HTML
        const reportHTML = `
            <div class="report-summary">
                <div class="report-summary-item">
                    <h4>Total Products</h4>
                    <p>All Categories</p>
                    <span class="value">${totalProducts}</span>
                </div>
                <div class="report-summary-item">
                    <h4>Low Stock Items</h4>
                    <p>Less than 10 units</p>
                    <span class="value">${lowStockProducts}</span>
                </div>
                <div class="report-summary-item">
                    <h4>Out of Stock</h4>
                    <p>Zero quantity</p>
                    <span class="value">${outOfStockProducts}</span>
                </div>
                <div class="report-summary-item">
                    <h4>Total Value</h4>
                    <p>Inventory worth</p>
                    <span class="value">${this.formatCurrency(totalValue)}</span>
                </div>
            </div>

            <h4>Detailed Product List</h4>
            <table class="report-table">
                <thead>
                    <tr>
                        <th>SKU</th>
                        <th>Product Name</th>
                        <th>Category</th>
                        <th>Quantity</th>
                        <th>Unit Price</th>
                        <th>Total Value</th>
                        <th>Batch Number</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${products.map(product => `
                        <tr>
                            <td><code>${product.sku}</code></td>
                            <td><strong>${product.name}</strong></td>
                            <td>${this.capitalizeFirst(product.category)}</td>
                            <td>${product.currentStock}</td>
                            <td>${this.formatCurrency(product.price)}</td>
                            <td>${this.formatCurrency(product.price * product.currentStock)}</td>
                            <td>${product.batchNumber || '-'}</td>
                            <td>
                                ${product.currentStock === 0 ? 
                                    '<span style="color: #e74c3c; font-weight: bold;">Out of Stock</span>' :
                                    product.currentStock < 10 ? 
                                    '<span style="color: #f39c12; font-weight: bold;">Low Stock</span>' :
                                    '<span style="color: #27ae60; font-weight: bold;">In Stock</span>'
                                }
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div style="margin-top: 2rem; padding: 1rem; background: #f8f9fa; border-radius: 8px; font-size: 0.9rem; color: #666;">
                <p><strong>Report Generated:</strong> ${currentDate} at ${currentTime}</p>
                <p><strong>Pharmacy:</strong> ${pharmacyName}</p>
                <p><strong>Generated By:</strong> ${this.currentUser ? this.currentUser.name : 'System'}</p>
            </div>
        `;

        this.displayReport('Inventory Report', reportHTML);
    }

    displayReport(title, content) {
        document.getElementById('report-title').textContent = title;
        document.getElementById('report-content').innerHTML = content;
        document.getElementById('report-display').style.display = 'block';
        
        // Scroll to report
        document.getElementById('report-display').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }

    closeReport() {
        document.getElementById('report-display').style.display = 'none';
    }

    exportReport() {
        const title = document.getElementById('report-title').textContent;
        const content = document.getElementById('report-content').innerHTML;
        
        // Create a new window for printing/exporting
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        
        if (!printWindow) {
            this.showMessage('Export window was blocked. Please allow popups and try again.', 'error');
            return;
        }
        
        const exportHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${title} - VivaLife Pharmacy</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .report-header { text-align: center; margin-bottom: 30px; }
                    .report-header h1 { color: #333; margin-bottom: 10px; }
                    .report-header p { color: #666; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; font-weight: bold; }
                    .report-summary { display: flex; justify-content: space-around; margin-bottom: 30px; }
                    .summary-item { text-align: center; padding: 15px; background: #f8f9fa; border-radius: 8px; }
                    .summary-item h3 { margin: 0 0 5px 0; color: #333; }
                    .summary-item p { margin: 0; color: #666; }
                </style>
            </head>
            <body>
                <div class="report-header">
                    <h1>${title}</h1>
                    <p>VivaLife Pharmacy Management System</p>
                    <p>Generated on ${new Date().toLocaleString('en-GB')}</p>
                </div>
                ${content}
            </body>
            </html>
        `;
        
        printWindow.document.write(exportHTML);
        printWindow.document.close();
        
        // Trigger print dialog
        setTimeout(() => {
            printWindow.print();
        }, 500);
    }

    printReport() {
        this.exportReport();
    }

    generateDispensingReport() {
        const dispensingHistory = this.dispensingHistory.filter(d => 
            !this.currentPharmacy || d.pharmacyId === this.currentPharmacy.id
        );
        const currentDate = new Date().toLocaleDateString('en-GB');
        const currentTime = new Date().toLocaleTimeString();
        const pharmacyName = this.currentPharmacy ? this.currentPharmacy.name : 'All Pharmacies';

        // Calculate summary statistics
        const totalDispensing = dispensingHistory.length;
        const totalItemsDispensed = dispensingHistory.reduce((sum, d) => sum + d.items.length, 0);
        const totalValue = dispensingHistory.reduce((sum, d) => sum + d.totalValue, 0);

        const reportHTML = `
            <div class="report-summary">
                <div class="report-summary-item">
                    <h4>Total Dispensing</h4>
                    <p>Transactions</p>
                    <span class="value">${totalDispensing}</span>
                </div>
                <div class="report-summary-item">
                    <h4>Items Dispensed</h4>
                    <p>Total units</p>
                    <span class="value">${totalItemsDispensed}</span>
                </div>
                <div class="report-summary-item">
                    <h4>Total Value</h4>
                    <p>Revenue</p>
                    <span class="value">${this.formatCurrency(totalValue)}</span>
                </div>
                <div class="report-summary-item">
                    <h4>Average per Transaction</h4>
                    <p>Value per dispensing</p>
                    <span class="value">${totalDispensing > 0 ? this.formatCurrency(totalValue / totalDispensing) : '0.00'}</span>
                </div>
            </div>

            <h4>Recent Dispensing Records</h4>
            <table class="report-table">
                <thead>
                    <tr>
                        <th>Date & Time</th>
                        <th>Items</th>
                        <th>Total Value</th>
                        <th>Staff</th>
                    </tr>
                </thead>
                <tbody>
                    ${dispensingHistory.slice(-20).reverse().map(record => `
                        <tr>
                            <td>${new Date(record.timestamp || record.date).toLocaleString('en-GB')}</td>
                            <td>${record.items.length}</td>
                            <td>${this.formatCurrency(record.totalValue)}</td>
                            <td>${this.getStaffName(record.staffId)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div style="margin-top: 2rem; padding: 1rem; background: #f8f9fa; border-radius: 8px; font-size: 0.9rem; color: #666;">
                <p><strong>Report Generated:</strong> ${currentDate} at ${currentTime}</p>
                <p><strong>Pharmacy:</strong> ${pharmacyName}</p>
                <p><strong>Generated By:</strong> ${this.currentUser ? this.currentUser.name : 'System'}</p>
            </div>
        `;

        this.displayReport('Dispensing Report', reportHTML);
    }

    generateStaffReport() {
        const staff = this.staff.filter(s => 
            !this.currentPharmacy || s.pharmacyId === this.currentPharmacy.id
        );
        const currentDate = new Date().toLocaleDateString('en-GB');
        const currentTime = new Date().toLocaleTimeString();
        const pharmacyName = this.currentPharmacy ? this.currentPharmacy.name : 'All Pharmacies';

        // Calculate summary statistics
        const totalStaff = staff.length;
        const roleStats = {};
        staff.forEach(member => {
            if (!roleStats[member.role]) {
                roleStats[member.role] = 0;
            }
            roleStats[member.role]++;
        });

        const reportHTML = `
            <div class="report-summary">
                <div class="report-summary-item">
                    <h4>Total Staff</h4>
                    <p>All Roles</p>
                    <span class="value">${totalStaff}</span>
                </div>
                <div class="report-summary-item">
                    <h4>Pharmacies</h4>
                    <p>Active locations</p>
                    <span class="value">${new Set(staff.map(s => s.pharmacyId)).size}</span>
                </div>
                <div class="report-summary-item">
                    <h4>Managers</h4>
                    <p>Management level</p>
                    <span class="value">${roleStats['manager'] || 0}</span>
                </div>
                <div class="report-summary-item">
                    <h4>Pharmacy Staff</h4>
                    <p>Operational staff</p>
                    <span class="value">${(roleStats['pharmacy-staff'] || 0) + (roleStats['pharmacy-supervisor'] || 0)}</span>
                </div>
            </div>

            <h4>Staff Directory</h4>
            <table class="report-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Role</th>
                        <th>Pharmacy</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Staff ID</th>
                    </tr>
                </thead>
                <tbody>
                    ${staff.map(member => `
                        <tr>
                            <td><strong>${member.name}</strong></td>
                            <td>${this.formatPrivilegeLevel(member.role)}</td>
                            <td>${this.getPharmacyName(member.pharmacyId)}</td>
                            <td>${member.email || '-'}</td>
                            <td>${member.phone || '-'}</td>
                            <td><code>${member.id}</code></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div style="margin-top: 2rem; padding: 1rem; background: #f8f9fa; border-radius: 8px; font-size: 0.9rem; color: #666;">
                <p><strong>Report Generated:</strong> ${currentDate} at ${currentTime}</p>
                <p><strong>Pharmacy:</strong> ${pharmacyName}</p>
                <p><strong>Generated By:</strong> ${this.currentUser ? this.currentUser.name : 'System'}</p>
            </div>
        `;

        this.displayReport('Staff Activity Report', reportHTML);
    }

    generateReturnsReport() {
        // Fix existing return records that might be missing staffName
        this.fixExistingReturnRecords();
        
        // Debug current user status
        console.log('Current user in returns report:', this.currentUser);
        console.log('Current user name:', this.currentUser?.name);
        
        const currentPharmacyId = this.currentPharmacy ? this.currentPharmacy.id : 'PHARM001';
        const returnHistory = this.returnHistory.filter(returnItem => 
            returnItem.pharmacyId === currentPharmacyId
        );
        const currentDate = new Date().toLocaleDateString('en-GB');
        const currentTime = new Date().toLocaleTimeString();
        const pharmacyName = this.currentPharmacy ? this.currentPharmacy.name : 'All Pharmacies';

        // Calculate summary statistics
        const totalReturns = returnHistory.length;
        const totalValue = returnHistory.reduce((sum, returnItem) => sum + returnItem.totalValue, 0);
        const reasonStats = {};
        const productStats = {};
        
        returnHistory.forEach(returnItem => {
            // Count by reason (from individual items)
            returnItem.items.forEach(item => {
                const reason = item.reason || 'unknown';
                if (!reasonStats[reason]) {
                    reasonStats[reason] = 0;
                }
                reasonStats[reason]++;
                
                // Count by product
                if (!productStats[item.name]) {
                    productStats[item.name] = { count: 0, quantity: 0 };
                }
                productStats[item.name].count++;
                productStats[item.name].quantity += item.quantity;
            });
        });

        // Get recent returns (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentReturns = returnHistory.filter(returnItem => 
            new Date(returnItem.date) >= thirtyDaysAgo
        );

        const reportHTML = `
            <div class="report-summary">
                <div class="report-summary-item">
                    <h4>Total Returns</h4>
                    <p>All time</p>
                    <span class="value">${totalReturns}</span>
                </div>
                <div class="report-summary-item">
                    <h4>Total Value</h4>
                    <p>Returned amount</p>
                    <span class="value">${this.formatCurrency(totalValue)}</span>
                </div>
                <div class="report-summary-item">
                    <h4>Recent Returns</h4>
                    <p>Last 30 days</p>
                    <span class="value">${recentReturns.length}</span>
                </div>
                <div class="report-summary-item">
                    <h4>Avg. Value</h4>
                    <p>Per return</p>
                    <span class="value">${totalReturns > 0 ? this.formatCurrency(totalValue / totalReturns) : '0.00'}</span>
                </div>
            </div>

            <h4>Return Reasons Breakdown</h4>
            <div class="report-chart-container">
                <table class="report-table">
                    <thead>
                        <tr>
                            <th>Reason</th>
                            <th>Count</th>
                            <th>Percentage</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${Object.entries(reasonStats).map(([reason, count]) => `
                            <tr>
                                <td>${this.formatReturnReason(reason)}</td>
                                <td>${count}</td>
                                <td>${totalReturns > 0 ? ((count / totalReturns) * 100).toFixed(1) : 0}%</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <h4>Most Returned Products</h4>
            <div class="report-chart-container">
                <table class="report-table">
                    <thead>
                        <tr>
                            <th>Product Name</th>
                            <th>SKU</th>
                            <th>Return Count</th>
                            <th>Total Quantity</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${Object.entries(productStats)
                            .sort((a, b) => b[1].count - a[1].count)
                            .slice(0, 10)
                            .map(([productName, stats]) => {
                                const product = this.products.find(p => p.name === productName);
                                return `
                                    <tr>
                                        <td><strong>${productName}</strong></td>
                                        <td>${product ? product.sku : '-'}</td>
                                        <td>${stats.count}</td>
                                        <td>${stats.quantity}</td>
                                    </tr>
                                `;
                            }).join('')}
                    </tbody>
                </table>
            </div>

            <h4>Recent Return History</h4>
            <div class="report-chart-container">
                <table class="report-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Return ID</th>
                            <th>Items</th>
                            <th>Reason</th>
                            <th>Value</th>
                            <th>Staff</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${returnHistory
                            .sort((a, b) => new Date(b.date) - new Date(a.date))
                            .slice(0, 20)
                            .map(returnItem => {
                                // Get the most common reason from items in this return
                                const reasonCounts = {};
                                returnItem.items.forEach(item => {
                                    const reason = item.reason || 'unknown';
                                    reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
                                });
                                const primaryReason = Object.keys(reasonCounts).reduce((a, b) => 
                                    reasonCounts[a] > reasonCounts[b] ? a : b
                                );
                                
                                return `
                                    <tr>
                                        <td>${new Date(returnItem.date).toLocaleDateString('en-GB')}</td>
                                        <td><code>${returnItem.id}</code></td>
                                        <td>${returnItem.items.length} item${returnItem.items.length !== 1 ? 's' : ''}</td>
                                        <td>${this.formatReturnReason(primaryReason)}</td>
                                        <td>${this.formatCurrency(returnItem.totalValue)}</td>
                                        <td>${returnItem.staffName || this.currentUser?.name || 'Unknown'}</td>
                                    </tr>
                                `;
                            }).join('')}
                    </tbody>
                </table>
            </div>

            <div style="margin-top: 2rem; padding: 1rem; background: #f8f9fa; border-radius: 8px; font-size: 0.9rem; color: #666;">
                <p><strong>Report Generated:</strong> ${currentDate} at ${currentTime}</p>
                <p><strong>Pharmacy:</strong> ${pharmacyName}</p>
                <p><strong>Generated By:</strong> ${this.currentUser ? this.currentUser.name : 'System'}</p>
                <p><strong>Data Range:</strong> All return records</p>
            </div>
        `;

        this.displayReport('Returns Report', reportHTML);
    }

    generateFavoritesPerformanceReport() {
        // Load favorite products first
        this.loadFavorites();
        
        const currentPharmacyId = this.currentPharmacy ? this.currentPharmacy.id : 'PHARM001';
        const currentDate = new Date().toLocaleDateString('en-GB');
        const currentTime = new Date().toLocaleTimeString();
        const pharmacyName = this.currentPharmacy ? this.currentPharmacy.name : 'All Pharmacies';

        // Get all dispensing records for the current pharmacy
        const dispensingRecords = this.dispensingHistory.filter(record => 
            record.pharmacyId === currentPharmacyId
        );

        // Get favorite product IDs
        const favoriteProductIds = this.favoriteProducts.map(p => p.id);

        // Calculate staff performance with favorite products
        const staffPerformance = {};
        
        dispensingRecords.forEach(record => {
            const staffId = record.staffId;
            const staffName = record.staffName || 'Unknown Staff';
            
            if (!staffPerformance[staffId]) {
                staffPerformance[staffId] = {
                    staffId: staffId,
                    staffName: staffName,
                    totalDispensing: 0,
                    favoriteDispensing: 0,
                    favoriteValue: 0,
                    totalValue: 0,
                    favoriteProducts: {},
                    performanceScore: 0
                };
            }

            // Count all dispensing
            staffPerformance[staffId].totalDispensing += record.items.length;
            staffPerformance[staffId].totalValue += record.totalValue;

            // Count favorite product dispensing
            record.items.forEach(item => {
                if (favoriteProductIds.includes(item.productId)) {
                    staffPerformance[staffId].favoriteDispensing += item.quantity;
                    staffPerformance[staffId].favoriteValue += item.price * item.quantity;
                    
                    // Track individual favorite products
                    if (!staffPerformance[staffId].favoriteProducts[item.productId]) {
                        staffPerformance[staffId].favoriteProducts[item.productId] = {
                            name: item.name,
                            sku: item.sku,
                            quantity: 0,
                            value: 0
                        };
                    }
                    staffPerformance[staffId].favoriteProducts[item.productId].quantity += item.quantity;
                    staffPerformance[staffId].favoriteProducts[item.productId].value += item.price * item.quantity;
                }
            });
        });

        // Calculate performance scores
        Object.values(staffPerformance).forEach(staff => {
            if (staff.totalDispensing > 0) {
                staff.performanceScore = (staff.favoriteDispensing / staff.totalDispensing) * 100;
            }
        });

        // Convert to array and sort by performance score
        const staffArray = Object.values(staffPerformance).sort((a, b) => b.performanceScore - a.performanceScore);

        // Calculate summary statistics
        const totalStaff = staffArray.length;
        const totalFavoriteDispensing = staffArray.reduce((sum, staff) => sum + staff.favoriteDispensing, 0);
        const totalFavoriteValue = staffArray.reduce((sum, staff) => sum + staff.favoriteValue, 0);
        const avgPerformanceScore = staffArray.length > 0 ? 
            staffArray.reduce((sum, staff) => sum + staff.performanceScore, 0) / staffArray.length : 0;

        // Find top performer
        const topPerformer = staffArray.length > 0 ? staffArray[0] : null;

        const reportHTML = `
            <div class="report-summary">
                <div class="report-summary-item">
                    <h4>Total Staff</h4>
                    <p>Active staff members</p>
                    <span class="value">${totalStaff}</span>
                </div>
                <div class="report-summary-item">
                    <h4>Favorite Items Dispensed</h4>
                    <p>High-profit products</p>
                    <span class="value">${totalFavoriteDispensing}</span>
                </div>
                <div class="report-summary-item">
                    <h4>Favorite Value</h4>
                    <p>Revenue from favorites</p>
                    <span class="value">${this.formatCurrency(totalFavoriteValue)}</span>
                </div>
                <div class="report-summary-item">
                    <h4>Avg. Performance</h4>
                    <p>Favorite focus score</p>
                    <span class="value">${avgPerformanceScore.toFixed(1)}%</span>
                </div>
            </div>

            <h4>Staff Performance Rankings</h4>
            <div class="report-chart-container">
                <table class="report-table">
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Staff Member</th>
                            <th>Performance Score</th>
                            <th>Favorite Items</th>
                            <th>Favorite Value</th>
                            <th>Total Dispensing</th>
                            <th>Focus Rate</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${staffArray.map((staff, index) => `
                            <tr>
                                <td>
                                    <div class="rank-badge ${index < 3 ? 'top-' + (index + 1) : ''}">
                                        ${index + 1}
                                    </div>
                                </td>
                                <td><strong>${staff.staffName}</strong></td>
                                <td>
                                    <div class="performance-bar">
                                        <div class="performance-fill" style="width: ${staff.performanceScore}%"></div>
                                        <span class="performance-text">${staff.performanceScore.toFixed(1)}%</span>
                                    </div>
                                </td>
                                <td>${staff.favoriteDispensing}</td>
                                <td>${this.formatCurrency(staff.favoriteValue)}</td>
                                <td>${staff.totalDispensing}</td>
                                <td>
                                    <span class="focus-rate ${staff.performanceScore >= 50 ? 'high' : staff.performanceScore >= 25 ? 'medium' : 'low'}">
                                        ${staff.performanceScore >= 50 ? 'High' : staff.performanceScore >= 25 ? 'Medium' : 'Low'}
                                    </span>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <h4>Top Performer Details</h4>
            ${topPerformer ? `
                <div class="top-performer-card">
                    <div class="performer-header">
                        <div class="performer-info">
                            <h5>${topPerformer.staffName}</h5>
                            <p>Performance Score: ${topPerformer.performanceScore.toFixed(1)}%</p>
                        </div>
                        <div class="performer-badge">
                            <i class="fas fa-trophy"></i>
                            #1 Performer
                        </div>
                    </div>
                    <div class="performer-stats">
                        <div class="stat-item">
                            <span class="stat-label">Favorite Items Dispensed</span>
                            <span class="stat-value">${topPerformer.favoriteDispensing}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Favorite Revenue</span>
                            <span class="stat-value">${this.formatCurrency(topPerformer.favoriteValue)}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Total Dispensing</span>
                            <span class="stat-value">${topPerformer.totalDispensing}</span>
                        </div>
                    </div>
                </div>
            ` : '<p>No performance data available</p>'}

            <h4>Favorite Products Performance</h4>
            <div class="report-chart-container">
                <table class="report-table">
                    <thead>
                        <tr>
                            <th>Product Name</th>
                            <th>SKU</th>
                            <th>Profit Margin</th>
                            <th>Times Dispensed</th>
                            <th>Total Quantity</th>
                            <th>Revenue Generated</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.favoriteProducts.slice(0, 10).map(product => {
                            // Count how many times this product was dispensed
                            const dispensingCount = dispensingRecords.reduce((count, record) => {
                                return count + record.items.filter(item => item.productId === product.id).length;
                            }, 0);
                            
                            const totalQuantity = dispensingRecords.reduce((total, record) => {
                                return total + record.items
                                    .filter(item => item.productId === product.id)
                                    .reduce((sum, item) => sum + item.quantity, 0);
                            }, 0);
                            
                            const revenue = dispensingRecords.reduce((total, record) => {
                                return total + record.items
                                    .filter(item => item.productId === product.id)
                                    .reduce((sum, item) => sum + (item.price * item.quantity), 0);
                            }, 0);

                            return `
                                <tr>
                                    <td><strong>${product.name}</strong></td>
                                    <td>${product.sku}</td>
                                    <td>
                                        <span class="profit-margin">${product.profitMargin.toFixed(1)}%</span>
                                    </td>
                                    <td>${dispensingCount}</td>
                                    <td>${totalQuantity}</td>
                                    <td>${this.formatCurrency(revenue)}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>

            <div style="margin-top: 2rem; padding: 1rem; background: #f8f9fa; border-radius: 8px; font-size: 0.9rem; color: #666;">
                <p><strong>Report Generated:</strong> ${currentDate} at ${currentTime}</p>
                <p><strong>Pharmacy:</strong> ${pharmacyName}</p>
                <p><strong>Generated By:</strong> ${this.currentUser ? this.currentUser.name : 'System'}</p>
                <p><strong>Performance Period:</strong> All dispensing records</p>
                <p><strong>Note:</strong> Performance score is calculated as (Favorite Items Dispensed / Total Items Dispensed) × 100</p>
            </div>
        `;

        this.displayReport('Favorite List Performance Report', reportHTML);
    }

    // Favorites functionality
    loadFavorites() {
        const currentPharmacyId = this.currentPharmacy ? this.currentPharmacy.id : 'PHARM001';
        const pharmacyProducts = this.products.filter(p => p.pharmacyId === currentPharmacyId);
        
        // Calculate profitability for each product
        const productsWithProfit = pharmacyProducts.map(product => {
            // Calculate profit margin (assuming cost is 70% of price for simplicity)
            const cost = product.price * 0.7;
            const profit = product.price - cost;
            const profitMargin = (profit / product.price) * 100;
            
            return {
                ...product,
                cost: cost,
                profit: profit,
                profitMargin: profitMargin,
                totalValue: product.price * product.currentStock
            };
        });

        // Sort by profit margin (highest first) and take top 20
        this.favoriteProducts = productsWithProfit
            .sort((a, b) => b.profitMargin - a.profitMargin)
            .slice(0, 20);

        this.renderFavorites();
        this.updateFavoritesSummary();
    }

    renderFavorites() {
        const favoritesList = document.getElementById('favorites-list');
        if (!favoritesList) return;

        if (this.favoriteProducts.length === 0) {
            favoritesList.innerHTML = `
                <div class="empty-favorites">
                    <i class="fas fa-star"></i>
                    <h4>No Favorite Products</h4>
                    <p>Add products to see high-profitability favorites for staff incentives</p>
                </div>
            `;
            return;
        }

        favoritesList.innerHTML = this.favoriteProducts.map((product, index) => `
            <div class="favorite-item" data-product-id="${product.id}">
                <div class="favorite-header">
                    <div class="favorite-info">
                        <h4>${product.name}</h4>
                        <p>SKU: ${product.sku} | Category: ${this.formatCategory(product.category)}</p>
                    </div>
                    <div class="favorite-badge">
                        <i class="fas fa-trophy"></i>
                        #${index + 1} Top Profit
                    </div>
                </div>
                
                <div class="favorite-details">
                    <div class="favorite-detail">
                        <label>Price</label>
                        <span>${this.formatCurrency(product.price)}</span>
                    </div>
                    <div class="favorite-detail">
                        <label>Cost</label>
                        <span>${this.formatCurrency(product.cost)}</span>
                    </div>
                    <div class="favorite-detail">
                        <label>Profit</label>
                        <span class="profit-margin">${this.formatCurrency(product.profit)}</span>
                    </div>
                    <div class="favorite-detail">
                        <label>Profit Margin</label>
                        <span class="profit-margin">${product.profitMargin.toFixed(1)}%</span>
                    </div>
                    <div class="favorite-detail">
                        <label>Stock</label>
                        <span>${product.currentStock} units</span>
                    </div>
                    <div class="favorite-detail">
                        <label>Total Value</label>
                        <span>${this.formatCurrency(product.totalValue)}</span>
                    </div>
                </div>
                
                <div class="favorite-actions">
                    <button class="btn btn-sm btn-outline" onclick="pharmacySystem.viewProductDetails('${product.id}')">
                        <i class="fas fa-eye"></i> View Details
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="pharmacySystem.addToIncentive('${product.id}')">
                        <i class="fas fa-gift"></i> Add to Incentive
                    </button>
                </div>
            </div>
        `).join('');
    }

    updateFavoritesSummary() {
        if (!this.favoriteProducts || this.favoriteProducts.length === 0) {
            document.getElementById('total-favorites').textContent = '0';
            document.getElementById('avg-profit-margin').textContent = '0%';
            document.getElementById('total-favorites-value').textContent = '0.00';
            document.getElementById('top-category').textContent = '-';
            return;
        }

        const totalFavorites = this.favoriteProducts.length;
        const avgProfitMargin = this.favoriteProducts.reduce((sum, p) => sum + p.profitMargin, 0) / totalFavorites;
        const totalValue = this.favoriteProducts.reduce((sum, p) => sum + p.totalValue, 0);
        
        // Find top category
        const categoryCount = {};
        this.favoriteProducts.forEach(p => {
            categoryCount[p.category] = (categoryCount[p.category] || 0) + 1;
        });
        const topCategory = Object.keys(categoryCount).reduce((a, b) => 
            categoryCount[a] > categoryCount[b] ? a : b
        );

        document.getElementById('total-favorites').textContent = totalFavorites;
        document.getElementById('avg-profit-margin').textContent = `${avgProfitMargin.toFixed(1)}%`;
        document.getElementById('total-favorites-value').textContent = this.formatCurrency(totalValue);
        document.getElementById('top-category').textContent = this.formatCategory(topCategory);
    }

    filterFavorites() {
        const searchTerm = document.getElementById('favorites-search').value.toLowerCase();
        const categoryFilter = document.getElementById('favorites-category-filter').value;
        
        const filteredProducts = this.favoriteProducts.filter(product => {
            const matchesSearch = product.name.toLowerCase().includes(searchTerm) ||
                                product.sku.toLowerCase().includes(searchTerm);
            const matchesCategory = !categoryFilter || product.category === categoryFilter;
            
            return matchesSearch && matchesCategory;
        });

        this.renderFilteredFavorites(filteredProducts);
    }

    renderFilteredFavorites(products) {
        const favoritesList = document.getElementById('favorites-list');
        if (!favoritesList) return;

        if (products.length === 0) {
            favoritesList.innerHTML = `
                <div class="empty-favorites">
                    <i class="fas fa-search"></i>
                    <h4>No Products Found</h4>
                    <p>Try adjusting your search or filter criteria</p>
                </div>
            `;
            return;
        }

        favoritesList.innerHTML = products.map((product, index) => `
            <div class="favorite-item" data-product-id="${product.id}">
                <div class="favorite-header">
                    <div class="favorite-info">
                        <h4>${product.name}</h4>
                        <p>SKU: ${product.sku} | Category: ${this.formatCategory(product.category)}</p>
                    </div>
                    <div class="favorite-badge">
                        <i class="fas fa-trophy"></i>
                        #${index + 1} Top Profit
                    </div>
                </div>
                
                <div class="favorite-details">
                    <div class="favorite-detail">
                        <label>Price</label>
                        <span>${this.formatCurrency(product.price)}</span>
                    </div>
                    <div class="favorite-detail">
                        <label>Cost</label>
                        <span>${this.formatCurrency(product.cost)}</span>
                    </div>
                    <div class="favorite-detail">
                        <label>Profit</label>
                        <span class="profit-margin">${this.formatCurrency(product.profit)}</span>
                    </div>
                    <div class="favorite-detail">
                        <label>Profit Margin</label>
                        <span class="profit-margin">${product.profitMargin.toFixed(1)}%</span>
                    </div>
                    <div class="favorite-detail">
                        <label>Stock</label>
                        <span>${product.currentStock} units</span>
                    </div>
                    <div class="favorite-detail">
                        <label>Total Value</label>
                        <span>${this.formatCurrency(product.totalValue)}</span>
                    </div>
                </div>
                
                <div class="favorite-actions">
                    <button class="btn btn-sm btn-outline" onclick="pharmacySystem.viewProductDetails('${product.id}')">
                        <i class="fas fa-eye"></i> View Details
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="pharmacySystem.addToIncentive('${product.id}')">
                        <i class="fas fa-gift"></i> Add to Incentive
                    </button>
                </div>
            </div>
        `).join('');
    }

    sortFavorites() {
        const sortBy = document.getElementById('favorites-sort').value;
        
        let sortedProducts = [...this.favoriteProducts];
        
        switch (sortBy) {
            case 'profit-margin':
                sortedProducts.sort((a, b) => b.profitMargin - a.profitMargin);
                break;
            case 'price':
                sortedProducts.sort((a, b) => b.price - a.price);
                break;
            case 'name':
                sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'category':
                sortedProducts.sort((a, b) => a.category.localeCompare(b.category));
                break;
        }
        
        this.renderFilteredFavorites(sortedProducts);
    }

    exportFavorites() {
        if (!this.favoriteProducts || this.favoriteProducts.length === 0) {
            this.showMessage('No favorite products to export', 'error');
            return;
        }

        const exportData = this.favoriteProducts.map((product, index) => ({
            'Rank': index + 1,
            'Product Name': product.name,
            'SKU': product.sku,
            'Category': this.formatCategory(product.category),
            'Price': product.price,
            'Cost': product.cost,
            'Profit': product.profit,
            'Profit Margin (%)': product.profitMargin.toFixed(1),
            'Current Stock': product.currentStock,
            'Total Value': product.totalValue
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Favorite Products');
        
        const fileName = `favorite-products-${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        this.showMessage('Favorite products exported successfully!', 'success');
    }

    addToIncentive(productId) {
        const product = this.favoriteProducts.find(p => p.id === productId);
        if (!product) {
            this.showMessage('Product not found', 'error');
            return;
        }

        // This could be expanded to add products to an incentive program
        this.showMessage(`${product.name} added to staff incentive program!`, 'success');
        console.log('Added to incentive:', product);
    }

    viewProductDetails(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) {
            this.showMessage('Product not found', 'error');
            return;
        }

        // Open product modal or navigate to inventory page
        this.openProductModal(product);
    }

    formatCategory(category) {
        const categoryMap = {
            'medicines': 'Medicines',
            'cosmetics': 'Cosmetics',
            'diaber': 'Diaber',
            'milk': 'Milk',
            'refrigerated': 'Refrigerated'
        };
        return categoryMap[category] || category;
    }

    fixExistingReturnRecords() {
        let recordsUpdated = false;
        
        this.returnHistory.forEach(returnRecord => {
            if (!returnRecord.staffName && returnRecord.staffId) {
                // Try to find the staff member by ID
                const staff = this.staff.find(s => s.id === returnRecord.staffId);
                if (staff) {
                    returnRecord.staffName = staff.name;
                    recordsUpdated = true;
                } else {
                    // If staff not found, use a default
                    returnRecord.staffName = 'Unknown Staff';
                    recordsUpdated = true;
                }
            } else if (!returnRecord.staffName) {
                // If no staffId either, use current user or default
                returnRecord.staffName = this.currentUser?.name || 'Unknown Staff';
                recordsUpdated = true;
            }
        });
        
        if (recordsUpdated) {
            this.saveData('returnHistory', this.returnHistory);
        }
    }

    // RSD Tracking & Trace functionality
    loadRSDTracking() {
        this.updateRSDStatus();
        this.updateRSDDashboard();
        this.loadRecalls();
        this.loadInventoryMonitoring();
        this.updateComplianceStatus();
    }

    updateRSDStatus() {
        const statusElement = document.getElementById('rsd-connection-status');
        const indicator = document.querySelector('.rsd-status-indicator');
        
        // Simulate API connection check
        setTimeout(() => {
            this.rsdData.apiStatus = 'connected';
            statusElement.textContent = 'Connected to SFDA RSD';
            indicator.className = 'rsd-status-indicator connected';
        }, 1000);
    }

    updateRSDDashboard() {
        // Update KPI cards
        document.getElementById('total-scanned-boxes').textContent = this.rsdData.scannedBoxes.length;
        document.getElementById('active-recalls').textContent = this.rsdData.activeRecalls.length;
        document.getElementById('flagged-issues').textContent = this.rsdData.flaggedIssues.length;
        document.getElementById('compliance-rate').textContent = this.rsdData.complianceRate + '%';

        // Create charts
        this.createRSDInventoryChart();
        this.createRSDRecallChart();
    }

    createRSDInventoryChart() {
        const ctx = document.getElementById('rsd-inventory-chart');
        if (!ctx) return;

        // Destroy existing chart if it exists
        if (this.rsdInventoryChart) {
            this.rsdInventoryChart.destroy();
        }

        const currentPharmacyId = this.currentPharmacy ? this.currentPharmacy.id : 'PHARM001';
        const pharmacyProducts = this.products.filter(p => p.pharmacyId === currentPharmacyId);
        
        const dispensedData = pharmacyProducts.map(product => {
            const dispensed = this.dispensingHistory
                .filter(d => d.pharmacyId === currentPharmacyId)
                .reduce((total, record) => {
                    return total + record.items
                        .filter(item => item.productId === product.id)
                        .reduce((sum, item) => sum + item.quantity, 0);
                }, 0);
            return dispensed;
        });

        const availableData = pharmacyProducts.map(product => product.currentStock);

        this.rsdInventoryChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: pharmacyProducts.slice(0, 10).map(p => p.name.substring(0, 20) + '...'),
                datasets: [{
                    label: 'Dispensed',
                    data: dispensedData.slice(0, 10),
                    backgroundColor: 'rgba(102, 126, 234, 0.8)',
                    borderColor: '#667eea',
                    borderWidth: 1
                }, {
                    label: 'Available',
                    data: availableData.slice(0, 10),
                    backgroundColor: 'rgba(67, 233, 123, 0.8)',
                    borderColor: '#43e97b',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    }
                }
            }
        });
    }

    createRSDRecallChart() {
        const ctx = document.getElementById('rsd-recall-chart');
        if (!ctx) return;

        // Destroy existing chart if it exists
        if (this.rsdRecallChart) {
            this.rsdRecallChart.destroy();
        }

        // Generate sample recall data for last 30 days
        const last30Days = [];
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            last30Days.push({
                date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                count: Math.floor(Math.random() * 5) // Random recall count
            });
        }

        this.rsdRecallChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: last30Days.map(day => day.date),
                datasets: [{
                    label: 'Recalls',
                    data: last30Days.map(day => day.count),
                    borderColor: '#f5576c',
                    backgroundColor: 'rgba(245, 87, 108, 0.1)',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 3,
                    pointBackgroundColor: '#f5576c',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    }
                }
            }
        });
    }

    verifyBarcode() {
        const barcodeInput = document.getElementById('barcode-input');
        const barcode = barcodeInput.value.trim();
        
        if (!barcode) {
            this.showMessage('Please enter or scan a barcode', 'error');
            return;
        }

        // Simulate SFDA RSD API call
        this.showMessage('Verifying with SFDA RSD...', 'info');
        
        setTimeout(() => {
            const verificationResult = this.simulateBarcodeVerification(barcode);
            this.displayVerificationResult(verificationResult);
            
            // Add to scanned boxes
            this.rsdData.scannedBoxes.push({
                barcode: barcode,
                timestamp: new Date().toISOString(),
                result: verificationResult.status,
                product: verificationResult.product
            });
            this.saveData('rsdScannedBoxes', this.rsdData.scannedBoxes);
            
            // Add to audit trail
            this.addToAuditTrail('barcode_verification', {
                barcode: barcode,
                result: verificationResult.status,
                user: this.currentUser?.name || 'Unknown'
            });
            
            barcodeInput.value = '';
        }, 2000);
    }

    simulateBarcodeVerification(barcode) {
        // Simulate different verification results
        const results = [
            { status: 'valid', product: 'Aspirin 100mg', batch: 'BATCH001', expiry: '2025-12-31' },
            { status: 'recalled', product: 'Paracetamol 500mg', batch: 'BATCH002', expiry: '2024-06-30' },
            { status: 'expired', product: 'Ibuprofen 200mg', batch: 'BATCH003', expiry: '2023-12-31' },
            { status: 'counterfeit', product: 'Unknown Product', batch: 'UNKNOWN', expiry: 'N/A' }
        ];
        
        return results[Math.floor(Math.random() * results.length)];
    }

    displayVerificationResult(result) {
        const verificationResult = document.getElementById('verification-result');
        const verificationStatus = document.getElementById('verification-status');
        const verificationDetails = document.getElementById('verification-details');
        
        // Update status
        verificationStatus.className = `verification-status ${result.status}`;
        verificationStatus.innerHTML = `
            <i class="fas fa-${this.getStatusIcon(result.status)}"></i>
            <span>${result.status.toUpperCase()}</span>
        `;
        
        // Update details
        verificationDetails.innerHTML = `
            <div class="verification-detail">
                <strong>Product:</strong> ${result.product}
            </div>
            <div class="verification-detail">
                <strong>Batch Number:</strong> ${result.batch}
            </div>
            <div class="verification-detail">
                <strong>Expiry Date:</strong> ${result.expiry}
            </div>
            <div class="verification-detail">
                <strong>Verification Time:</strong> ${new Date().toLocaleString()}
            </div>
        `;
        
        verificationResult.style.display = 'block';
        
        // Update flagged issues if needed
        if (result.status !== 'valid') {
            this.rsdData.flaggedIssues.push({
                type: result.status,
                product: result.product,
                barcode: document.getElementById('barcode-input').value,
                timestamp: new Date().toISOString()
            });
            this.saveData('rsdFlaggedIssues', this.rsdData.flaggedIssues);
            this.updateRSDDashboard();
        }
    }

    getStatusIcon(status) {
        const icons = {
            'valid': 'check-circle',
            'recalled': 'exclamation-triangle',
            'expired': 'clock',
            'counterfeit': 'times-circle'
        };
        return icons[status] || 'question-circle';
    }

    loadRecalls() {
        // Simulate loading recalls from SFDA RSD
        const recalls = [
            {
                id: 'REC001',
                title: 'Paracetamol 500mg Tablets - Batch BATCH002',
                severity: 'patient-level',
                description: 'Potential contamination detected in specific batch',
                date: '2024-01-15',
                affectedProducts: ['Paracetamol 500mg']
            },
            {
                id: 'REC002',
                title: 'Ibuprofen 200mg Capsules - Multiple Batches',
                severity: 'pharmacy-level',
                description: 'Packaging defect may affect product integrity',
                date: '2024-01-10',
                affectedProducts: ['Ibuprofen 200mg']
            }
        ];
        
        this.rsdData.activeRecalls = recalls;
        this.saveData('rsdActiveRecalls', this.rsdData.activeRecalls);
        this.renderRecalls();
    }

    renderRecalls() {
        const recallsList = document.getElementById('recalls-list');
        if (!recallsList) return;
        
        if (this.rsdData.activeRecalls.length === 0) {
            recallsList.innerHTML = '<p style="text-align: center; color: #6c757d; padding: 2rem;">No active recalls</p>';
            return;
        }
        
        recallsList.innerHTML = this.rsdData.activeRecalls.map(recall => `
            <div class="recall-item ${recall.severity}">
                <div class="recall-header">
                    <h4 class="recall-title">${recall.title}</h4>
                    <span class="recall-severity ${recall.severity}">${recall.severity.replace('-', ' ')}</span>
                </div>
                <div class="recall-details">
                    <p><strong>Date:</strong> ${recall.date}</p>
                    <p><strong>Description:</strong> ${recall.description}</p>
                    <p><strong>Affected Products:</strong> ${recall.affectedProducts.join(', ')}</p>
                </div>
                <div class="recall-actions">
                    <button class="btn btn-sm btn-outline">View Details</button>
                    <button class="btn btn-sm btn-primary">Take Action</button>
                </div>
            </div>
        `).join('');
    }

    refreshRecalls() {
        this.showMessage('Refreshing recalls from SFDA RSD...', 'info');
        setTimeout(() => {
            this.loadRecalls();
            this.showMessage('Recalls updated successfully', 'success');
        }, 1500);
    }

    filterRecalls(severity) {
        const recalls = document.querySelectorAll('.recall-item');
        recalls.forEach(recall => {
            if (severity === 'all' || recall.classList.contains(severity)) {
                recall.style.display = 'block';
            } else {
                recall.style.display = 'none';
            }
        });
    }

    loadInventoryMonitoring() {
        this.renderInventoryStatus();
        this.renderMovementHistory();
        this.renderShortageAlerts();
    }

    renderInventoryStatus() {
        const inventoryGrid = document.getElementById('inventory-grid');
        if (!inventoryGrid) return;
        
        const currentPharmacyId = this.currentPharmacy ? this.currentPharmacy.id : 'PHARM001';
        const pharmacyProducts = this.products.filter(p => p.pharmacyId === currentPharmacyId);
        
        inventoryGrid.innerHTML = pharmacyProducts.slice(0, 12).map(product => {
            const isRecalled = this.rsdData.activeRecalls.some(recall => 
                recall.affectedProducts.some(affected => 
                    product.name.toLowerCase().includes(affected.toLowerCase())
                )
            );
            const isFlagged = this.rsdData.flaggedIssues.some(issue => 
                issue.product === product.name
            );
            
            return `
                <div class="inventory-item ${isRecalled ? 'recalled' : ''} ${isFlagged ? 'flagged' : ''}">
                    <h5>${product.name}</h5>
                    <p><strong>SKU:</strong> ${product.sku}</p>
                    <p><strong>Stock:</strong> ${product.currentStock}</p>
                    <p><strong>Status:</strong> 
                        ${isRecalled ? 'Recalled' : isFlagged ? 'Flagged' : 'Normal'}
                    </p>
                </div>
            `;
        }).join('');
    }

    renderMovementHistory() {
        const timeline = document.getElementById('movement-timeline');
        if (!timeline) return;
        
        const movements = [
            {
                title: 'Product Received from Distributor',
                date: '2024-01-20',
                details: 'Aspirin 100mg - 1000 units received from ABC Distributors'
            },
            {
                title: 'Quality Check Completed',
                date: '2024-01-20',
                details: 'All products passed quality inspection'
            },
            {
                title: 'Product Dispensed',
                date: '2024-01-21',
                details: '50 units dispensed to patients'
            }
        ];
        
        timeline.innerHTML = movements.map(movement => `
            <div class="timeline-item">
                <div class="timeline-content">
                    <div class="timeline-header">
                        <h5 class="timeline-title">${movement.title}</h5>
                        <span class="timeline-date">${movement.date}</span>
                    </div>
                    <p class="timeline-details">${movement.details}</p>
                </div>
            </div>
        `).join('');
    }

    renderShortageAlerts() {
        const alertsList = document.getElementById('shortage-alerts-list');
        if (!alertsList) return;
        
        const currentPharmacyId = this.currentPharmacy ? this.currentPharmacy.id : 'PHARM001';
        const pharmacyProducts = this.products.filter(p => p.pharmacyId === currentPharmacyId);
        const lowStockProducts = pharmacyProducts.filter(p => p.currentStock <= p.minStock);
        
        if (lowStockProducts.length === 0) {
            alertsList.innerHTML = '<p style="text-align: center; color: #6c757d; padding: 2rem;">No shortage alerts</p>';
            return;
        }
        
        alertsList.innerHTML = lowStockProducts.map(product => `
            <div class="alert-item ${product.currentStock === 0 ? 'critical' : 'warning'}">
                <i class="fas fa-exclamation-triangle alert-icon"></i>
                <div class="alert-content">
                    <h5 class="alert-title">Low Stock Alert</h5>
                    <p class="alert-description">
                        ${product.name} - Only ${product.currentStock} units remaining 
                        (Minimum: ${product.minStock})
                    </p>
                </div>
            </div>
        `).join('');
    }

    switchInventoryTab(tabName) {
        // Remove active class from all tabs
        document.querySelectorAll('.inventory-tabs .tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Hide all tab content
        document.querySelectorAll('.inventory-content .tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // Activate selected tab
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(tabName).classList.add('active');
    }

    updateComplianceStatus() {
        document.getElementById('last-rsd-submission').textContent = 
            this.rsdData.lastSubmission ? 
            new Date(this.rsdData.lastSubmission).toLocaleDateString() : 'Never';
        
        document.getElementById('pending-transactions').textContent = 
            this.rsdData.scannedBoxes.filter(box => !box.submitted).length;
        
        document.getElementById('api-status').textContent = 
            this.rsdData.apiStatus.charAt(0).toUpperCase() + this.rsdData.apiStatus.slice(1);
    }

    generateRSDReport() {
        this.showMessage('Generating RSD compliance report...', 'info');
        
        setTimeout(() => {
            const reportData = {
                generatedAt: new Date().toISOString(),
                pharmacy: this.currentPharmacy?.name || 'Unknown',
                scannedBoxes: this.rsdData.scannedBoxes.length,
                activeRecalls: this.rsdData.activeRecalls.length,
                flaggedIssues: this.rsdData.flaggedIssues.length,
                complianceRate: this.rsdData.complianceRate
            };
            
            this.addToAuditTrail('rsd_report_generated', reportData);
            this.showMessage('RSD report generated successfully', 'success');
        }, 2000);
    }

    exportComplianceCSV() {
        const csvData = this.generateComplianceCSV();
        this.downloadFile(csvData, 'rsd-compliance-report.csv', 'text/csv');
        this.showMessage('Compliance report exported as CSV', 'success');
    }

    exportCompliancePDF() {
        this.showMessage('PDF export functionality would be implemented here', 'info');
    }

    viewAuditTrail() {
        this.showMessage('Audit trail functionality would be implemented here', 'info');
    }

    generateComplianceCSV() {
        const headers = ['Timestamp', 'Action', 'User', 'Details'];
        const rows = this.rsdData.auditTrail.map(entry => [
            entry.timestamp,
            entry.action,
            entry.user,
            JSON.stringify(entry.details)
        ]);
        
        return [headers, ...rows].map(row => 
            row.map(field => `"${field}"`).join(',')
        ).join('\n');
    }

    addToAuditTrail(action, details) {
        this.rsdData.auditTrail.push({
            timestamp: new Date().toISOString(),
            action: action,
            user: this.currentUser?.name || 'System',
            details: details
        });
        this.saveData('rsdAuditTrail', this.rsdData.auditTrail);
    }

    downloadFile(data, filename, mimeType) {
        const blob = new Blob([data], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // Privilege-based access control
    hasPermission(permission) {
        if (!this.currentUser || !this.currentUser.privilege) {
            return false;
        }

        // Find the privilege level
        const privilege = this.privileges.find(p => p.id === this.currentUser.privilege);
        if (!privilege) {
            return false;
        }

        return privilege.permissions.includes(permission);
    }

    isAdmin() {
        return this.currentUser && this.currentUser.privilege === 'admin';
    }

    updateNavigationAccess() {
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            const section = item.dataset.section;
            const hasAccess = this.checkSectionAccess(section);
            
            if (!hasAccess) {
                item.style.display = 'none';
            } else {
                item.style.display = 'flex';
            }
        });
    }

    checkSectionAccess(section) {
        const sectionPermissions = {
            'dashboard': ['view-dashboard'],
            'inventory': ['view-inventory'],
            'dispensing': ['process-dispensing'],
            'returns': ['process-returns'],
            'rsd-tracking': ['view-rsd-tracking'],
            'loyalty': ['view-loyalty', 'manage-loyalty'],
            'discounts': ['view-discounts', 'manage-discounts'],
            'staff': ['view-staff', 'manage-staff'],
            'reports': ['view-reports'],
            'admin': ['admin-access']
        };

        const requiredPermissions = sectionPermissions[section] || [];
        
        if (requiredPermissions.length === 0) {
            return true; // No specific permissions required
        }

        return requiredPermissions.some(permission => this.hasPermission(permission));
    }

    updateButtonAccess() {
        // Update all buttons based on permissions
        this.updateInventoryButtons();
        this.updateDispensingButtons();
        this.updateReturnsButtons();
        this.updateStaffButtons();
        this.updateReportsButtons();
        this.updateAdminButtons();
        this.updateRSDButtons();
    }

    updateInventoryButtons() {
        const addProductBtn = document.getElementById('add-product-btn');
        const editProductBtns = document.querySelectorAll('.edit-product');
        const deleteProductBtns = document.querySelectorAll('.delete-product');
        const exportBtn = document.getElementById('export-inventory-btn');
        const uploadBtn = document.getElementById('upload-excel-btn');

        if (addProductBtn) {
            addProductBtn.disabled = !this.hasPermission('add-products');
            if (!this.hasPermission('add-products')) {
                addProductBtn.title = 'Insufficient privileges to add products';
            }
        }

        editProductBtns.forEach(btn => {
            btn.disabled = !this.hasPermission('edit-products');
            if (!this.hasPermission('edit-products')) {
                btn.title = 'Insufficient privileges to edit products';
            }
        });

        deleteProductBtns.forEach(btn => {
            btn.disabled = !this.hasPermission('delete-products');
            if (!this.hasPermission('delete-products')) {
                btn.title = 'Insufficient privileges to delete products';
            }
        });

        if (exportBtn) {
            exportBtn.disabled = !this.hasPermission('export-data');
            if (!this.hasPermission('export-data')) {
                exportBtn.title = 'Insufficient privileges to export data';
            }
        }

        if (uploadBtn) {
            uploadBtn.disabled = !this.hasPermission('import-data');
            if (!this.hasPermission('import-data')) {
                uploadBtn.title = 'Insufficient privileges to import data';
            }
        }
    }

    updateDispensingButtons() {
        const processBtn = document.getElementById('process-dispensing');
        const addToCartBtns = document.querySelectorAll('.add-to-cart');
        const clearCartBtn = document.getElementById('clear-cart');

        if (processBtn) {
            processBtn.disabled = !this.hasPermission('process-dispensing');
            if (!this.hasPermission('process-dispensing')) {
                processBtn.title = 'Insufficient privileges to process dispensing';
            }
        }

        addToCartBtns.forEach(btn => {
            btn.disabled = !this.hasPermission('process-dispensing');
            if (!this.hasPermission('process-dispensing')) {
                btn.title = 'Insufficient privileges to add items to cart';
            }
        });

        if (clearCartBtn) {
            clearCartBtn.disabled = !this.hasPermission('process-dispensing');
            if (!this.hasPermission('process-dispensing')) {
                clearCartBtn.title = 'Insufficient privileges to clear cart';
            }
        }
    }

    updateReturnsButtons() {
        const processReturnsBtn = document.getElementById('process-returns');
        const addReturnItemBtn = document.getElementById('add-return-item');
        const clearReturnBtn = document.getElementById('clear-return-form');
        const clearAllBtn = document.getElementById('clear-return-list');

        if (processReturnsBtn) {
            processReturnsBtn.disabled = !this.hasPermission('process-returns');
            if (!this.hasPermission('process-returns')) {
                processReturnsBtn.title = 'Insufficient privileges to process returns';
            }
        }

        if (addReturnItemBtn) {
            addReturnItemBtn.disabled = !this.hasPermission('process-returns');
            if (!this.hasPermission('process-returns')) {
                addReturnItemBtn.title = 'Insufficient privileges to add return items';
            }
        }

        if (clearReturnBtn) {
            clearReturnBtn.disabled = !this.hasPermission('process-returns');
            if (!this.hasPermission('process-returns')) {
                clearReturnBtn.title = 'Insufficient privileges to clear return form';
            }
        }

        if (clearAllBtn) {
            clearAllBtn.disabled = !this.hasPermission('process-returns');
            if (!this.hasPermission('process-returns')) {
                clearAllBtn.title = 'Insufficient privileges to clear return list';
            }
        }
    }

    updateStaffButtons() {
        const addStaffBtn = document.getElementById('add-staff-btn');
        const editStaffBtns = document.querySelectorAll('.edit-staff');
        const deleteStaffBtns = document.querySelectorAll('.delete-staff');

        if (addStaffBtn) {
            addStaffBtn.disabled = !this.hasPermission('manage-staff');
            if (!this.hasPermission('manage-staff')) {
                addStaffBtn.title = 'Insufficient privileges to add staff';
            }
        }

        editStaffBtns.forEach(btn => {
            btn.disabled = !this.hasPermission('manage-staff');
            if (!this.hasPermission('manage-staff')) {
                btn.title = 'Insufficient privileges to edit staff';
            }
        });

        deleteStaffBtns.forEach(btn => {
            btn.disabled = !this.hasPermission('manage-staff');
            if (!this.hasPermission('manage-staff')) {
                btn.title = 'Insufficient privileges to delete staff';
            }
        });
    }

    updateReportsButtons() {
        const reportBtns = document.querySelectorAll('[id$="-report"]');
        
        reportBtns.forEach(btn => {
            const reportType = btn.id.replace('-report', '').replace('generate-', '');
            const hasAccess = this.hasPermission('view-reports');
            
            btn.disabled = !hasAccess;
            if (!hasAccess) {
                btn.title = 'Insufficient privileges to generate reports';
            }
        });
    }

    updateAdminButtons() {
        const adminBtns = document.querySelectorAll('#admin-tab button, #admin-tab .btn');
        
        adminBtns.forEach(btn => {
            const hasAccess = this.isAdmin();
            btn.disabled = !hasAccess;
            if (!hasAccess) {
                btn.title = 'Admin access required';
            }
        });
    }

    updateRSDButtons() {
        const verifyBtn = document.getElementById('verify-barcode');
        const refreshRecallsBtn = document.getElementById('refresh-recalls');
        const generateReportBtn = document.getElementById('generate-rsd-report');
        const exportBtns = document.querySelectorAll('#rsd-tracking .btn');

        if (verifyBtn) {
            verifyBtn.disabled = !this.hasPermission('view-rsd-tracking');
            if (!this.hasPermission('view-rsd-tracking')) {
                verifyBtn.title = 'Insufficient privileges to verify barcodes';
            }
        }

        if (refreshRecallsBtn) {
            refreshRecallsBtn.disabled = !this.hasPermission('view-rsd-tracking');
            if (!this.hasPermission('view-rsd-tracking')) {
                refreshRecallsBtn.title = 'Insufficient privileges to refresh recalls';
            }
        }

        if (generateReportBtn) {
            generateReportBtn.disabled = !this.hasPermission('view-reports');
            if (!this.hasPermission('view-reports')) {
                generateReportBtn.title = 'Insufficient privileges to generate RSD reports';
            }
        }

        exportBtns.forEach(btn => {
            if (btn.id.includes('export') || btn.id.includes('csv') || btn.id.includes('pdf')) {
                btn.disabled = !this.hasPermission('export-data');
                if (!this.hasPermission('export-data')) {
                    btn.title = 'Insufficient privileges to export data';
                }
            }
        });
    }

    updateFormAccess() {
        // Disable form inputs based on permissions
        this.updateInventoryFormAccess();
        this.updateStaffFormAccess();
        this.updateDispensingFormAccess();
    }

    updateInventoryFormAccess() {
        const inventoryInputs = document.querySelectorAll('#inventory input, #inventory select, #inventory textarea');
        
        inventoryInputs.forEach(input => {
            const isEdit = input.closest('.edit-product') || input.id.includes('edit');
            const isAdd = input.closest('.add-product') || input.id.includes('add');
            
            if (isEdit && !this.hasPermission('edit-products')) {
                input.disabled = true;
                input.title = 'Insufficient privileges to edit products';
            } else if (isAdd && !this.hasPermission('add-products')) {
                input.disabled = true;
                input.title = 'Insufficient privileges to add products';
            }
        });
    }

    updateStaffFormAccess() {
        const staffInputs = document.querySelectorAll('#staff input, #staff select, #staff textarea');
        
        staffInputs.forEach(input => {
            if (!this.hasPermission('manage-staff')) {
                input.disabled = true;
                input.title = 'Insufficient privileges to manage staff';
            }
        });
    }

    updateDispensingFormAccess() {
        const dispensingInputs = document.querySelectorAll('#dispensing input, #dispensing select, #dispensing textarea');
        
        dispensingInputs.forEach(input => {
            if (!this.hasPermission('process-dispensing')) {
                input.disabled = true;
                input.title = 'Insufficient privileges to process dispensing';
            }
        });
    }

    showAccessDeniedMessage(feature) {
        this.showMessage(`Access denied: You don't have permission to ${feature}`, 'error');
    }

    initializeAccessControl() {
        // Update access control after login
        this.updateNavigationAccess();
        this.updateButtonAccess();
        this.updateFormAccess();
    }

    addPermissionChecks() {
        // Override critical functions with permission checks
        const originalAddProduct = this.addProduct;
        this.addProduct = () => {
            if (!this.hasPermission('add-products')) {
                this.showAccessDeniedMessage('add products');
                return;
            }
            return originalAddProduct.call(this);
        };

        const originalEditProduct = this.editProduct;
        this.editProduct = (id) => {
            if (!this.hasPermission('edit-products')) {
                this.showAccessDeniedMessage('edit products');
                return;
            }
            return originalEditProduct.call(this, id);
        };

        const originalDeleteProduct = this.deleteProduct;
        this.deleteProduct = (id) => {
            if (!this.hasPermission('delete-products')) {
                this.showAccessDeniedMessage('delete products');
                return;
            }
            return originalDeleteProduct.call(this, id);
        };

        const originalProcessDispensing = this.processDispensing;
        this.processDispensing = () => {
            if (!this.hasPermission('process-dispensing')) {
                this.showAccessDeniedMessage('process dispensing');
                return;
            }
            return originalProcessDispensing.call(this);
        };

        const originalProcessReturns = this.processReturns;
        this.processReturns = () => {
            if (!this.hasPermission('process-returns')) {
                this.showAccessDeniedMessage('process returns');
                return;
            }
            return originalProcessReturns.call(this);
        };

        const originalAddStaff = this.addStaff;
        this.addStaff = () => {
            if (!this.hasPermission('manage-staff')) {
                this.showAccessDeniedMessage('add staff');
                return;
            }
            return originalAddStaff.call(this);
        };

        const originalEditStaff = this.editStaff;
        this.editStaff = (id) => {
            if (!this.hasPermission('manage-staff')) {
                this.showAccessDeniedMessage('edit staff');
                return;
            }
            return originalEditStaff.call(this, id);
        };

        const originalDeleteStaff = this.deleteStaff;
        this.deleteStaff = (id) => {
            if (!this.hasPermission('manage-staff')) {
                this.showAccessDeniedMessage('delete staff');
                return;
            }
            return originalDeleteStaff.call(this, id);
        };

        const originalGenerateReport = this.generateReport;
        this.generateReport = (type) => {
            if (!this.hasPermission('view-reports')) {
                this.showAccessDeniedMessage('generate reports');
                return;
            }
            return originalGenerateReport.call(this, type);
        };

        const originalVerifyBarcode = this.verifyBarcode;
        this.verifyBarcode = () => {
            if (!this.hasPermission('view-rsd-tracking')) {
                this.showAccessDeniedMessage('verify barcodes');
                return;
            }
            return originalVerifyBarcode.call(this);
        };
    }

    // Agents Management Functions
    loadAgents() {
        this.renderAgentsTable();
        this.updateAgentsSummary();
    }

    addAgent() {
        this.editingAgent = null;
        this.openAgentModal();
    }

    editAgent(id) {
        const agent = this.agents.find(a => a.id === id);
        if (agent) {
            this.editingAgent = agent;
            this.openAgentModal();
        }
    }

    deleteAgent(id) {
        if (confirm('Are you sure you want to delete this agent? This action cannot be undone.')) {
            this.agents = this.agents.filter(a => a.id !== id);
            this.saveData('agents', this.agents);
            this.loadAgents();
            this.showMessage('Agent deleted successfully', 'success');
        }
    }

    openAgentModal() {
        const modal = document.getElementById('agent-modal');
        const title = document.getElementById('agent-modal-title');
        
        if (this.editingAgent) {
            title.textContent = 'Edit Agent';
            this.populateAgentForm(this.editingAgent);
        } else {
            title.textContent = 'Add New Agent';
            this.clearAgentForm();
        }
        
        modal.style.display = 'block';
    }

    closeAgentModal() {
        document.getElementById('agent-modal').style.display = 'none';
        this.editingAgent = null;
        this.clearAgentForm();
    }

    populateAgentForm(agent) {
        document.getElementById('agent-name').value = agent.name || '';
        document.getElementById('agent-company').value = agent.company || '';
        document.getElementById('agent-type').value = agent.type || '';
        document.getElementById('agent-status').value = agent.status || 'active';
        document.getElementById('agent-contact').value = agent.contact || '';
        document.getElementById('agent-phone').value = agent.phone || '';
        document.getElementById('agent-email').value = agent.email || '';
        document.getElementById('agent-website').value = agent.website || '';
        document.getElementById('agent-address').value = agent.address || '';
        document.getElementById('agent-tax-id').value = agent.taxId || '';
        document.getElementById('agent-license').value = agent.license || '';
        document.getElementById('agent-notes').value = agent.notes || '';
    }

    clearAgentForm() {
        document.getElementById('agent-form').reset();
    }

    saveAgent() {
        const form = document.getElementById('agent-form');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const agentData = {
            name: document.getElementById('agent-name').value.trim(),
            company: document.getElementById('agent-company').value.trim(),
            type: document.getElementById('agent-type').value,
            status: document.getElementById('agent-status').value,
            contact: document.getElementById('agent-contact').value.trim(),
            phone: document.getElementById('agent-phone').value.trim(),
            email: document.getElementById('agent-email').value.trim(),
            website: document.getElementById('agent-website').value.trim(),
            address: document.getElementById('agent-address').value.trim(),
            taxId: document.getElementById('agent-tax-id').value.trim(),
            license: document.getElementById('agent-license').value.trim(),
            notes: document.getElementById('agent-notes').value.trim()
        };

        if (this.editingAgent) {
            // Update existing agent
            const index = this.agents.findIndex(a => a.id === this.editingAgent.id);
            if (index !== -1) {
                this.agents[index] = { ...this.agents[index], ...agentData };
                this.showMessage('Agent updated successfully', 'success');
            }
        } else {
            // Add new agent
            const newAgent = {
                id: this.generateUniqueId(),
                ...agentData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            this.agents.push(newAgent);
            this.showMessage('Agent added successfully', 'success');
        }

        this.saveData('agents', this.agents);
        this.closeAgentModal();
        this.loadAgents();
    }

    renderAgentsTable() {
        const tbody = document.getElementById('agents-table-body');
        if (!tbody) return;

        if (this.agents.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="agents-empty-state">
                        <i class="fas fa-users"></i>
                        <h3>No Agents Found</h3>
                        <p>Start by adding your first agent or supplier</p>
                        <button class="btn btn-primary" onclick="pharmacySystem.addAgent()">
                            <i class="fas fa-plus"></i> Add Agent
                        </button>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.agents.map(agent => `
            <tr>
                <td>
                    <div class="agent-info">
                        <strong>${agent.name}</strong>
                    </div>
                </td>
                <td>${agent.company || '-'}</td>
                <td>
                    <span class="agent-type ${agent.type}">${agent.type || '-'}</span>
                </td>
                <td>
                    <div class="contact-info">
                        <div>${agent.contact || '-'}</div>
                        ${agent.phone ? `<small>${agent.phone}</small>` : ''}
                    </div>
                </td>
                <td>${agent.email || '-'}</td>
                <td>
                    <span class="agent-status ${agent.status}">${agent.status}</span>
                </td>
                <td>
                    <div class="agent-products">
                        <span class="product-count">${this.getAgentProductCount(agent.id)}</span>
                        <small>products</small>
                    </div>
                </td>
                <td>
                    <div class="agent-actions">
                        <button class="btn btn-sm btn-outline edit-agent" onclick="pharmacySystem.editAgent('${agent.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline delete-agent" onclick="pharmacySystem.deleteAgent('${agent.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    getAgentProductCount(agentId) {
        // Count products from this agent
        return this.products.filter(p => p.agentId === agentId).length;
    }

    updateAgentsSummary() {
        const totalAgents = this.agents.length;
        const activeAgents = this.agents.filter(a => a.status === 'active').length;
        const supplierAgents = this.agents.filter(a => a.type === 'supplier').length;
        const distributorAgents = this.agents.filter(a => a.type === 'distributor').length;

        document.getElementById('total-agents').textContent = totalAgents;
        document.getElementById('active-agents').textContent = activeAgents;
        document.getElementById('supplier-agents').textContent = supplierAgents;
        document.getElementById('distributor-agents').textContent = distributorAgents;
    }

    searchAgents(query) {
        const filteredAgents = this.agents.filter(agent => 
            agent.name.toLowerCase().includes(query.toLowerCase()) ||
            agent.company.toLowerCase().includes(query.toLowerCase()) ||
            agent.contact.toLowerCase().includes(query.toLowerCase()) ||
            agent.email.toLowerCase().includes(query.toLowerCase())
        );
        
        this.renderFilteredAgentsTable(filteredAgents);
    }

    filterAgents() {
        const statusFilter = document.getElementById('agent-status-filter').value;
        const typeFilter = document.getElementById('agent-type-filter').value;
        
        let filteredAgents = this.agents;
        
        if (statusFilter !== 'all') {
            filteredAgents = filteredAgents.filter(agent => agent.status === statusFilter);
        }
        
        if (typeFilter !== 'all') {
            filteredAgents = filteredAgents.filter(agent => agent.type === typeFilter);
        }
        
        this.renderFilteredAgentsTable(filteredAgents);
    }

    renderFilteredAgentsTable(agents) {
        const tbody = document.getElementById('agents-table-body');
        if (!tbody) return;

        if (agents.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="agents-empty-state">
                        <i class="fas fa-search"></i>
                        <h3>No Agents Found</h3>
                        <p>Try adjusting your search or filter criteria</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = agents.map(agent => `
            <tr>
                <td>
                    <div class="agent-info">
                        <strong>${agent.name}</strong>
                    </div>
                </td>
                <td>${agent.company || '-'}</td>
                <td>
                    <span class="agent-type ${agent.type}">${agent.type || '-'}</span>
                </td>
                <td>
                    <div class="contact-info">
                        <div>${agent.contact || '-'}</div>
                        ${agent.phone ? `<small>${agent.phone}</small>` : ''}
                    </div>
                </td>
                <td>${agent.email || '-'}</td>
                <td>
                    <span class="agent-status ${agent.status}">${agent.status}</span>
                </td>
                <td>
                    <div class="agent-products">
                        <span class="product-count">${this.getAgentProductCount(agent.id)}</span>
                        <small>products</small>
                    </div>
                </td>
                <td>
                    <div class="agent-actions">
                        <button class="btn btn-sm btn-outline edit-agent" onclick="pharmacySystem.editAgent('${agent.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline delete-agent" onclick="pharmacySystem.deleteAgent('${agent.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // ==================== LOYALTY PROGRAM METHODS ====================

    loadLoyaltyProgram() {
        this.updateLoyaltyStats();
        this.renderCustomersTable();
        this.loadTopCustomers();
        this.loadRecentRedemptions();
    }

    updateLoyaltyStats() {
        const totalCustomers = this.customers.length;
        const totalPointsIssued = this.loyaltyTransactions
            .filter(t => t.type === 'earned')
            .reduce((sum, t) => sum + t.points, 0);
        const totalPointsRedeemed = this.loyaltyTransactions
            .filter(t => t.type === 'redeemed')
            .reduce((sum, t) => sum + t.points, 0);
        const totalDiscountsGiven = this.loyaltyTransactions
            .filter(t => t.type === 'redeemed')
            .reduce((sum, t) => sum + t.discountAmount, 0);

        document.getElementById('total-customers').textContent = totalCustomers;
        document.getElementById('total-points-issued').textContent = totalPointsIssued.toLocaleString();
        document.getElementById('total-points-redeemed').textContent = totalPointsRedeemed.toLocaleString();
        document.getElementById('total-discounts-given').textContent = `ر.س${totalDiscountsGiven.toFixed(2)}`;
    }

    openCustomerModal() {
        this.editingCustomer = null;
        document.getElementById('customer-modal-title').textContent = 'Add New Customer';
        document.getElementById('customer-form').reset();
        document.getElementById('customer-id-input').placeholder = 'Auto-generated if left empty';
        this.openModal('customer-modal');
    }

    saveCustomer() {
        const form = document.getElementById('customer-form');
        if (!form) {
            this.showMessage('Form not found!', 'error');
            return;
        }
        
        const customerData = {
            id: document.getElementById('customer-id-input').value || this.generateCustomerId(),
            name: document.getElementById('customer-name').value,
            phone: document.getElementById('customer-phone').value,
            email: document.getElementById('customer-email').value,
            address: document.getElementById('customer-address').value,
            dateOfBirth: document.getElementById('customer-date-of-birth').value,
            gender: document.getElementById('customer-gender').value,
            notes: document.getElementById('customer-notes').value,
            points: 0,
            joinDate: new Date().toISOString(),
            lastActivity: new Date().toISOString()
        };

        if (!customerData.name || !customerData.phone) {
            this.showMessage('Name and phone number are required!', 'error');
            return;
        }

        if (this.editingCustomer) {
            // Update existing customer
            const index = this.customers.findIndex(c => c.id === this.editingCustomer.id);
            if (index !== -1) {
                this.customers[index] = { ...this.customers[index], ...customerData };
                this.showMessage('Customer updated successfully!', 'success');
            }
        } else {
            // Add new customer
            this.customers.push(customerData);
            this.showMessage('Customer added successfully!', 'success');
        }

        this.saveData('customers', this.customers);
        this.closeModal('customer-modal');
        this.loadLoyaltyProgram();
    }

    generateCustomerId() {
        const prefix = 'CUST';
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `${prefix}${timestamp}${random}`;
    }

    searchCustomers() {
        const query = document.getElementById('customer-search').value.toLowerCase();
        const results = this.customers.filter(customer => 
            customer.name.toLowerCase().includes(query) ||
            customer.phone.includes(query) ||
            customer.id.toLowerCase().includes(query)
        );

        this.displayCustomerSearchResults(results);
    }

    displayCustomerSearchResults(customers) {
        const container = document.getElementById('customer-search-results');
        
        if (customers.length === 0) {
            container.innerHTML = '<div class="no-results">No customers found</div>';
            return;
        }

        container.innerHTML = customers.map(customer => `
            <div class="customer-result-item" onclick="pharmacySystem.selectCustomer('${customer.id}')">
                <div class="customer-info">
                    <h4>${customer.name}</h4>
                    <p>ID: ${customer.id} | Phone: ${customer.phone}</p>
                    <p>Points: ${customer.points} | Joined: ${new Date(customer.joinDate).toLocaleDateString()}</p>
                </div>
                <div class="customer-actions">
                    <button class="btn btn-sm btn-primary">Select</button>
                </div>
            </div>
        `).join('');
    }

    selectCustomer(customerId) {
        this.selectedCustomer = this.customers.find(c => c.id === customerId);
        if (this.selectedCustomer) {
            this.displayCustomerDetails();
            document.getElementById('customer-search-results').innerHTML = '';
            document.getElementById('customer-search').value = '';
        }
    }

    displayCustomerDetails() {
        if (!this.selectedCustomer) return;

        document.getElementById('selected-customer-name').textContent = this.selectedCustomer.name;
        document.getElementById('customer-id').textContent = this.selectedCustomer.id;
        document.getElementById('customer-phone-display').textContent = this.selectedCustomer.phone;
        document.getElementById('customer-email-display').textContent = this.selectedCustomer.email || '-';
        document.getElementById('customer-join-date').textContent = new Date(this.selectedCustomer.joinDate).toLocaleDateString();
        document.getElementById('customer-points').textContent = this.selectedCustomer.points;

        document.getElementById('customer-details-section').style.display = 'block';
    }

    openAddPointsModal() {
        if (!this.selectedCustomer) {
            this.showMessage('Please select a customer first!', 'error');
            return;
        }
        this.openModal('add-points-modal');
    }

    addPointsToCustomer() {
        if (!this.selectedCustomer) return;

        const points = parseInt(document.getElementById('points-amount').value);
        const reason = document.getElementById('points-reason').value;
        const notes = document.getElementById('points-notes').value;

        if (!points || points <= 0) {
            this.showMessage('Please enter a valid points amount!', 'error');
            return;
        }

        if (!reason) {
            this.showMessage('Please select a reason!', 'error');
            return;
        }

        // Add points to customer
        this.selectedCustomer.points += points;
        this.selectedCustomer.lastActivity = new Date().toISOString();

        // Record transaction
        const transaction = {
            id: this.generateTransactionId(),
            customerId: this.selectedCustomer.id,
            type: 'earned',
            points: points,
            reason: reason,
            notes: notes,
            timestamp: new Date().toISOString(),
            staffId: this.currentUser?.id || 'system'
        };

        this.loyaltyTransactions.push(transaction);

        this.saveData('customers', this.customers);
        this.saveData('loyaltyTransactions', this.loyaltyTransactions);

        this.showMessage(`${points} points added to ${this.selectedCustomer.name}!`, 'success');
        this.closeModal('add-points-modal');
        this.displayCustomerDetails();
        this.updateLoyaltyStats();
    }

    generateTransactionId() {
        return 'TXN' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
    }

    openRedemptionSection() {
        if (!this.selectedCustomer) {
            this.showMessage('Please select a customer first!', 'error');
            return;
        }

        if (this.selectedCustomer.points < 100) {
            this.showMessage('Customer needs at least 100 points to redeem!', 'error');
            return;
        }

        document.getElementById('redemption-section').style.display = 'block';
        document.getElementById('redemption-amount').max = this.selectedCustomer.points;
        this.updateRedemptionPreview();
    }

    updateRedemptionPreview() {
        if (!this.selectedCustomer) return;

        const pointsToRedeem = parseInt(document.getElementById('redemption-amount').value) || 0;
        const discountAmount = (pointsToRedeem / 100) * 2; // 100 points = 2 SAR
        const remainingPoints = this.selectedCustomer.points - pointsToRedeem;

        document.getElementById('preview-points').textContent = pointsToRedeem;
        document.getElementById('preview-discount').textContent = `ر.س${discountAmount.toFixed(2)}`;
        document.getElementById('preview-remaining').textContent = remainingPoints;
    }

    confirmRedemption() {
        if (!this.selectedCustomer) return;

        const pointsToRedeem = parseInt(document.getElementById('redemption-amount').value);
        const discountAmount = (pointsToRedeem / 100) * 2;

        if (pointsToRedeem < 100) {
            this.showMessage('Minimum 100 points required for redemption!', 'error');
            return;
        }

        if (pointsToRedeem > this.selectedCustomer.points) {
            this.showMessage('Not enough points available!', 'error');
            return;
        }

        // Deduct points from customer
        this.selectedCustomer.points -= pointsToRedeem;
        this.selectedCustomer.lastActivity = new Date().toISOString();

        // Record transaction
        const transaction = {
            id: this.generateTransactionId(),
            customerId: this.selectedCustomer.id,
            type: 'redeemed',
            points: pointsToRedeem,
            discountAmount: discountAmount,
            reason: 'points_redemption',
            notes: `Redeemed ${pointsToRedeem} points for ${discountAmount.toFixed(2)} SAR discount`,
            timestamp: new Date().toISOString(),
            staffId: this.currentUser?.id || 'system'
        };

        this.loyaltyTransactions.push(transaction);

        this.saveData('customers', this.customers);
        this.saveData('loyaltyTransactions', this.loyaltyTransactions);

        this.showMessage(`${pointsToRedeem} points redeemed for ر.س${discountAmount.toFixed(2)} discount!`, 'success');
        this.closeRedemptionSection();
        this.displayCustomerDetails();
        this.updateLoyaltyStats();
    }

    closeRedemptionSection() {
        document.getElementById('redemption-section').style.display = 'none';
        document.getElementById('redemption-amount').value = '';
    }

    renderCustomersTable() {
        const tbody = document.getElementById('customers-table-body');
        if (!tbody) return;

        tbody.innerHTML = this.customers.map(customer => `
            <tr>
                <td>${customer.id}</td>
                <td>${customer.name}</td>
                <td>${customer.phone}</td>
                <td>${customer.email || '-'}</td>
                <td><span class="points-badge">${customer.points}</span></td>
                <td>${new Date(customer.joinDate).toLocaleDateString()}</td>
                <td>${new Date(customer.lastActivity).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm btn-outline" onclick="pharmacySystem.selectCustomer('${customer.id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="pharmacySystem.editCustomer('${customer.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                </td>
            </tr>
        `).join('');
    }

    editCustomer(customerId) {
        this.editingCustomer = this.customers.find(c => c.id === customerId);
        if (this.editingCustomer) {
            document.getElementById('customer-modal-title').textContent = 'Edit Customer';
            document.getElementById('customer-name').value = this.editingCustomer.name;
            document.getElementById('customer-phone').value = this.editingCustomer.phone;
            document.getElementById('customer-email').value = this.editingCustomer.email || '';
            document.getElementById('customer-address').value = this.editingCustomer.address || '';
            document.getElementById('customer-date-of-birth').value = this.editingCustomer.dateOfBirth || '';
            document.getElementById('customer-gender').value = this.editingCustomer.gender || '';
            document.getElementById('customer-notes').value = this.editingCustomer.notes || '';
            document.getElementById('customer-id-input').value = this.editingCustomer.id;
            document.getElementById('customer-id-input').placeholder = 'Customer ID';
            this.openModal('customer-modal');
        }
    }

    filterCustomers(query) {
        const filteredCustomers = this.customers.filter(customer => 
            customer.name.toLowerCase().includes(query.toLowerCase()) ||
            customer.phone.includes(query) ||
            customer.id.toLowerCase().includes(query) ||
            (customer.email && customer.email.toLowerCase().includes(query.toLowerCase()))
        );

        const tbody = document.getElementById('customers-table-body');
        if (tbody) {
            tbody.innerHTML = filteredCustomers.map(customer => `
                <tr>
                    <td>${customer.id}</td>
                    <td>${customer.name}</td>
                    <td>${customer.phone}</td>
                    <td>${customer.email || '-'}</td>
                    <td><span class="points-badge">${customer.points}</span></td>
                    <td>${new Date(customer.joinDate).toLocaleDateString()}</td>
                    <td>${new Date(customer.lastActivity).toLocaleDateString()}</td>
                    <td>
                        <button class="btn btn-sm btn-outline" onclick="pharmacySystem.selectCustomer('${customer.id}')">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="btn btn-sm btn-primary" onclick="pharmacySystem.editCustomer('${customer.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                    </td>
                </tr>
            `).join('');
        }
    }

    sortCustomers(sortBy) {
        let sortedCustomers = [...this.customers];
        
        switch(sortBy) {
            case 'name':
                sortedCustomers.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'points':
                sortedCustomers.sort((a, b) => b.points - a.points);
                break;
            case 'join-date':
                sortedCustomers.sort((a, b) => new Date(b.joinDate) - new Date(a.joinDate));
                break;
        }

        const tbody = document.getElementById('customers-table-body');
        if (tbody) {
            tbody.innerHTML = sortedCustomers.map(customer => `
                <tr>
                    <td>${customer.id}</td>
                    <td>${customer.name}</td>
                    <td>${customer.phone}</td>
                    <td>${customer.email || '-'}</td>
                    <td><span class="points-badge">${customer.points}</span></td>
                    <td>${new Date(customer.joinDate).toLocaleDateString()}</td>
                    <td>${new Date(customer.lastActivity).toLocaleDateString()}</td>
                    <td>
                        <button class="btn btn-sm btn-outline" onclick="pharmacySystem.selectCustomer('${customer.id}')">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="btn btn-sm btn-primary" onclick="pharmacySystem.editCustomer('${customer.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                    </td>
                </tr>
            `).join('');
        }
    }

    loadTopCustomers() {
        const topCustomers = [...this.customers]
            .sort((a, b) => b.points - a.points)
            .slice(0, 5);

        const container = document.getElementById('top-customers-list');
        if (container) {
            container.innerHTML = topCustomers.map((customer, index) => `
                <div class="top-customer-item">
                    <div class="rank">${index + 1}</div>
                    <div class="customer-info">
                        <h5>${customer.name}</h5>
                        <p>${customer.points} points</p>
                    </div>
                </div>
            `).join('');
        }
    }

    loadRecentRedemptions() {
        const recentRedemptions = this.loyaltyTransactions
            .filter(t => t.type === 'redeemed')
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 5);

        const container = document.getElementById('recent-redemptions-list');
        if (container) {
            container.innerHTML = recentRedemptions.map(transaction => {
                const customer = this.customers.find(c => c.id === transaction.customerId);
                return `
                    <div class="redemption-item">
                        <div class="redemption-info">
                            <h5>${customer ? customer.name : 'Unknown Customer'}</h5>
                            <p>${transaction.points} points → ر.س${transaction.discountAmount.toFixed(2)}</p>
                            <small>${new Date(transaction.timestamp).toLocaleDateString()}</small>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    generateLoyaltyReport() {
        const reportData = {
            totalCustomers: this.customers.length,
            totalPointsIssued: this.loyaltyTransactions
                .filter(t => t.type === 'earned')
                .reduce((sum, t) => sum + t.points, 0),
            totalPointsRedeemed: this.loyaltyTransactions
                .filter(t => t.type === 'redeemed')
                .reduce((sum, t) => sum + t.points, 0),
            totalDiscountsGiven: this.loyaltyTransactions
                .filter(t => t.type === 'redeemed')
                .reduce((sum, t) => sum + t.discountAmount, 0),
            topCustomers: [...this.customers]
                .sort((a, b) => b.points - a.points)
                .slice(0, 10),
            recentTransactions: this.loyaltyTransactions
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, 20)
        };

        this.displayLoyaltyReport(reportData);
    }

    displayLoyaltyReport(data) {
        const reportContent = `
            <div class="loyalty-report">
                <h3>Loyalty Program Report</h3>
                <div class="report-summary">
                    <div class="summary-item">
                        <h4>${data.totalCustomers}</h4>
                        <p>Total Customers</p>
                    </div>
                    <div class="summary-item">
                        <h4>${data.totalPointsIssued.toLocaleString()}</h4>
                        <p>Points Issued</p>
                    </div>
                    <div class="summary-item">
                        <h4>${data.totalPointsRedeemed.toLocaleString()}</h4>
                        <p>Points Redeemed</p>
                    </div>
                    <div class="summary-item">
                        <h4>ر.س${data.totalDiscountsGiven.toFixed(2)}</h4>
                        <p>Discounts Given</p>
                    </div>
                </div>
                
                <div class="report-section">
                    <h4>Top Customers by Points</h4>
                    <table class="report-table">
                        <thead>
                            <tr>
                                <th>Rank</th>
                                <th>Customer Name</th>
                                <th>Points</th>
                                <th>Join Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.topCustomers.map((customer, index) => `
                                <tr>
                                    <td>${index + 1}</td>
                                    <td>${customer.name}</td>
                                    <td>${customer.points}</td>
                                    <td>${new Date(customer.joinDate).toLocaleDateString()}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                
                <div class="report-section">
                    <h4>Recent Transactions</h4>
                    <table class="report-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Customer</th>
                                <th>Type</th>
                                <th>Points</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.recentTransactions.map(transaction => {
                                const customer = this.customers.find(c => c.id === transaction.customerId);
                                return `
                                    <tr>
                                        <td>${new Date(transaction.timestamp).toLocaleDateString()}</td>
                                        <td>${customer ? customer.name : 'Unknown'}</td>
                                        <td>${transaction.type === 'earned' ? 'Earned' : 'Redeemed'}</td>
                                        <td>${transaction.points}</td>
                                        <td>${transaction.discountAmount ? `ر.س${transaction.discountAmount.toFixed(2)}` : '-'}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        document.getElementById('report-title').textContent = 'Loyalty Program Report';
        document.getElementById('report-content').innerHTML = reportContent;
        document.getElementById('report-display').style.display = 'block';
    }

    exportLoyaltyData() {
        const data = {
            customers: this.customers,
            transactions: this.loyaltyTransactions,
            exportDate: new Date().toISOString(),
            systemVersion: '1.0.0'
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `loyalty-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showMessage('Loyalty data exported successfully!', 'success');
    }

    // Method to add points when customer makes a purchase (called from dispensing process)
    addPointsFromPurchase(customerId, purchaseAmount) {
        const customer = this.customers.find(c => c.id === customerId);
        if (!customer) return;

        const pointsEarned = Math.floor(purchaseAmount); // 1 point per SAR
        if (pointsEarned <= 0) return;

        customer.points += pointsEarned;
        customer.lastActivity = new Date().toISOString();

        const transaction = {
            id: this.generateTransactionId(),
            customerId: customerId,
            type: 'earned',
            points: pointsEarned,
            reason: 'purchase',
            notes: `Earned ${pointsEarned} points from purchase of ر.س${purchaseAmount.toFixed(2)}`,
            timestamp: new Date().toISOString(),
            staffId: this.currentUser?.id || 'system'
        };

        this.loyaltyTransactions.push(transaction);

        this.saveData('customers', this.customers);
        this.saveData('loyaltyTransactions', this.loyaltyTransactions);

        this.showMessage(`${pointsEarned} points added to ${customer.name}'s account!`, 'success');
    }

    // ==================== DISPENSING LOYALTY METHODS ====================

    lookupCustomerForDispensing() {
        const phoneNumber = document.getElementById('customer-phone-input').value.trim();
        
        if (!phoneNumber) {
            this.showMessage('Please enter a phone number', 'error');
            return;
        }

        const customer = this.customers.find(c => c.phone === phoneNumber);
        
        if (customer) {
            this.selectedDispensingCustomer = customer;
            this.displayDispensingCustomerInfo(customer);
            this.updateLoyaltyPreview();
            this.showMessage(`Customer found: ${customer.name}`, 'success');
        } else {
            this.showMessage('Customer not found. Please check the phone number or add the customer first.', 'error');
            this.clearDispensingCustomerInfo();
        }
    }

    displayDispensingCustomerInfo(customer) {
        document.getElementById('dispensing-customer-name').textContent = customer.name;
        document.getElementById('dispensing-customer-points').textContent = `${customer.points} points`;
        document.getElementById('customer-loyalty-info').style.display = 'block';
    }

    clearDispensingCustomerInfo() {
        // Restore points if there's an active redemption when clearing customer
        if (this.currentRedemption && this.selectedDispensingCustomer) {
            this.restoreRedemptionPoints();
        }
        
        this.selectedDispensingCustomer = null;
        document.getElementById('customer-loyalty-info').style.display = 'none';
        document.getElementById('customer-phone-input').value = '';
    }

    updateLoyaltyPreview() {
        if (!this.selectedDispensingCustomer) {
            document.getElementById('points-to-earn').textContent = '0';
            return;
        }

        const cartTotal = this.calculateCartTotal();
        const pointsToEarn = Math.floor(cartTotal); // 1 point per SAR
        document.getElementById('points-to-earn').textContent = pointsToEarn;
    }

    calculateCartTotal() {
        return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }


    generateDispensingId() {
        const timestamp = Date.now().toString().slice(-8);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `DISP${timestamp}${random}`;
    }

    // Override the existing printReceiptFromCart method to include loyalty information
    printReceiptFromCart(cart) {
        const totalAmount = this.calculateCartTotal();
        const pointsEarned = this.selectedDispensingCustomer ? Math.floor(totalAmount) : 0;
        
        let receiptContent = `
            <div class="receipt">
                <div class="receipt-header">
                    <h2>VivaLife Pharmacy</h2>
                    <p>Receipt #${this.generateDispensingId()}</p>
                    <p>Date: ${new Date().toLocaleString()}</p>
                    <p>Staff: ${this.currentUser?.name || 'Unknown'}</p>
                </div>
                
                <div class="receipt-items">
                    <table>
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Qty</th>
                                <th>Price</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        cart.forEach(item => {
            receiptContent += `
                <tr>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>ر.س${item.price.toFixed(2)}</td>
                    <td>ر.س${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
            `;
        });

        receiptContent += `
                        </tbody>
                    </table>
                </div>
                
                <div class="receipt-total">
                    <p><strong>Total: ر.س${totalAmount.toFixed(2)}</strong></p>
        `;

        // Add loyalty information if customer is selected
        if (this.selectedDispensingCustomer) {
            receiptContent += `
                    <div class="loyalty-info">
                        <p><strong>Customer: ${this.selectedDispensingCustomer.name}</strong></p>
                        <p>Phone: ${this.selectedDispensingCustomer.phone}</p>
                        <p>Points Earned: ${pointsEarned}</p>
                        <p>Total Points: ${this.selectedDispensingCustomer.points + pointsEarned}</p>
                    </div>
            `;
        }

        receiptContent += `
                </div>
                
                <div class="receipt-footer">
                    <p>Thank you for your business!</p>
                    <p>Visit our loyalty program for more rewards</p>
                </div>
            </div>
        `;

        // Create and show receipt modal
        this.showReceiptModal(receiptContent);
    }

    showReceiptModal(content) {
        // Remove existing receipt modal if any
        const existingModal = document.getElementById('receipt-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Create receipt modal
        const modal = document.createElement('div');
        modal.id = 'receipt-modal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content receipt-modal-content">
                <div class="modal-header">
                    <h3>Receipt Preview</h3>
                    <span class="close" id="close-receipt-modal">&times;</span>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                <div class="modal-footer">
                    <button id="print-receipt-modal-btn" class="btn btn-primary">
                        <i class="fas fa-print"></i> Print Receipt
                    </button>
                    <button id="close-receipt-modal-btn" class="btn btn-outline">Close</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.style.display = 'block';

        // Add event listeners
        document.getElementById('close-receipt-modal').addEventListener('click', () => {
            modal.remove();
        });

        document.getElementById('close-receipt-modal-btn').addEventListener('click', () => {
            modal.remove();
        });

        document.getElementById('print-receipt-modal-btn').addEventListener('click', () => {
            window.print();
        });

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    // ==================== DISPENSING REDEMPTION METHODS ====================

    restoreRedemptionPoints() {
        if (this.currentRedemption && this.selectedDispensingCustomer) {
            // Restore points to customer account
            this.selectedDispensingCustomer.points += this.currentRedemption.pointsRedeemed;

            // Create restoration transaction
            const restorationTransaction = {
                id: this.generateTransactionId(),
                customerId: this.selectedDispensingCustomer.id,
                type: 'restoration',
                points: this.currentRedemption.pointsRedeemed,
                amount: 0,
                reason: 'Points restored due to dispensing cancellation',
                timestamp: new Date().toISOString(),
                dispensingId: null
            };

            this.loyaltyTransactions.push(restorationTransaction);

            // Save data
            this.saveData('customers', this.customers);
            this.saveData('loyaltyTransactions', this.loyaltyTransactions);

            // Update UI
            this.displayDispensingCustomerInfo(this.selectedDispensingCustomer);
            this.updateLoyaltyPreview();

            // Show restoration message
            this.showMessage(`${this.currentRedemption.pointsRedeemed} points restored to ${this.selectedDispensingCustomer.name}'s account`, 'success');

            // Clear redemption
            this.currentRedemption = null;
        }
    }

    clearCartWithConfirmation() {
        if (this.cart.length === 0) {
            this.showMessage('Cart is already empty', 'info');
            return;
        }

        let confirmMessage = 'Are you sure you want to clear the cart?';
        
        // Add warning about points restoration if redemption is active
        if (this.currentRedemption && this.selectedDispensingCustomer) {
            confirmMessage += `\n\nThis will restore ${this.currentRedemption.pointsRedeemed} points to ${this.selectedDispensingCustomer.name}'s account.`;
        }

        if (confirm(confirmMessage)) {
            // Restore points if redemption is active
            if (this.currentRedemption) {
                this.restoreRedemptionPoints();
            }

            // Clear cart, discount, offer, and customer info
            this.cart = [];
            this.appliedDiscount = null;
            this.appliedOffer = null;
            this.renderCart();
            this.clearDispensingCustomerInfo();
            this.hideAppliedDiscount();
            this.hideAppliedOffer();

            this.showMessage('Cart cleared successfully', 'success');
        }
    }

    openDispensingRedemptionModal() {
        if (!this.selectedDispensingCustomer) {
            this.showMessage('Please select a customer first', 'error');
            return;
        }

        if (this.cart.length === 0) {
            this.showMessage('Cart is empty! Add items before redeeming points', 'error');
            return;
        }

        // Populate customer info
        document.getElementById('redemption-customer-name').textContent = this.selectedDispensingCustomer.name;
        document.getElementById('redemption-available-points').textContent = this.selectedDispensingCustomer.points;
        document.getElementById('redemption-cart-total').textContent = this.formatCurrency(this.calculateCartTotal());

        // Reset form
        document.getElementById('redemption-points-amount').value = '';
        this.updateDispensingRedemptionPreview();

        // Show modal
        this.openModal('dispensing-redemption-modal');
    }

    updateDispensingRedemptionPreview() {
        const pointsToRedeem = parseInt(document.getElementById('redemption-points-amount').value) || 0;
        const availablePoints = this.selectedDispensingCustomer.points;
        const cartTotal = this.calculateCartTotal();

        // Validate points
        if (pointsToRedeem < 100) {
            document.getElementById('preview-points').textContent = '0';
            document.getElementById('preview-discount').textContent = 'ر.س0.00';
            document.getElementById('preview-new-total').textContent = this.formatCurrency(cartTotal);
            document.getElementById('preview-remaining-points').textContent = availablePoints;
            return;
        }

        if (pointsToRedeem > availablePoints) {
            this.showMessage('Not enough points available', 'error');
            document.getElementById('redemption-points-amount').value = availablePoints;
            return;
        }

        // Calculate discount (100 points = 2 SAR)
        const discountAmount = (pointsToRedeem / 100) * 2;
        const newTotal = Math.max(0, cartTotal - discountAmount);
        const remainingPoints = availablePoints - pointsToRedeem;

        // Update preview
        document.getElementById('preview-points').textContent = pointsToRedeem;
        document.getElementById('preview-discount').textContent = this.formatCurrency(discountAmount);
        document.getElementById('preview-new-total').textContent = this.formatCurrency(newTotal);
        document.getElementById('preview-remaining-points').textContent = remainingPoints;
    }

    confirmDispensingRedemption() {
        const pointsToRedeem = parseInt(document.getElementById('redemption-points-amount').value) || 0;
        const availablePoints = this.selectedDispensingCustomer.points;

        // Validation
        if (pointsToRedeem < 100) {
            this.showMessage('Minimum redemption is 100 points', 'error');
            return;
        }

        if (pointsToRedeem > availablePoints) {
            this.showMessage('Not enough points available', 'error');
            return;
        }

        // Calculate discount
        const discountAmount = (pointsToRedeem / 100) * 2;
        const cartTotal = this.calculateCartTotal();
        const newTotal = Math.max(0, cartTotal - discountAmount);

        // Store redemption info
        this.currentRedemption = {
            pointsRedeemed: pointsToRedeem,
            discountAmount: discountAmount,
            originalTotal: cartTotal,
            newTotal: newTotal
        };

        // Update customer points
        this.selectedDispensingCustomer.points -= pointsToRedeem;

        // Create redemption transaction
        const transaction = {
            id: this.generateTransactionId(),
            customerId: this.selectedDispensingCustomer.id,
            type: 'redemption',
            points: -pointsToRedeem,
            amount: discountAmount,
            reason: 'Points redemption during dispensing',
            timestamp: new Date().toISOString(),
            dispensingId: null // Will be set when dispensing is processed
        };

        this.loyaltyTransactions.push(transaction);

        // Save data
        this.saveData('customers', this.customers);
        this.saveData('loyaltyTransactions', this.loyaltyTransactions);

        // Update UI
        this.updateLoyaltyPreview();
        this.displayDispensingCustomerInfo(this.selectedDispensingCustomer);
        this.renderCart(); // Refresh cart to show discount on all items

        // Close modal
        this.closeModal('dispensing-redemption-modal');

        // Show success message
        this.showMessage(`${pointsToRedeem} points redeemed for ${this.formatCurrency(discountAmount)} discount!`, 'success');
    }

    // Override the existing processDispensing method to include redemption
    processDispensing() {
        if (this.cart.length === 0) {
            this.showMessage('Cart is empty!', 'error');
            return;
        }

        // Check for low stock before processing
        const lowStockItems = this.cart.filter(item => {
            const product = this.products.find(p => p.id === item.id);
            return product && product.currentStock < item.quantity;
        });

        if (lowStockItems.length > 0) {
            this.showMessage('Some items have insufficient stock!', 'error');
            return;
        }

        // Calculate final total with redemption, discounts, and offers
        let finalTotal = this.calculateCartTotal();
        if (this.currentRedemption) {
            finalTotal = this.currentRedemption.newTotal;
        }
        if (this.appliedDiscount) {
            finalTotal = this.appliedDiscount.newTotal;
        }
        if (this.appliedOffer) {
            finalTotal = this.appliedOffer.newTotal;
        }

        // Create dispensing record
        const dispensingRecord = {
            id: this.generateDispensingId(),
            timestamp: new Date().toISOString(),
            items: [...this.cart],
            totalAmount: finalTotal,
            originalAmount: this.calculateCartTotal(),
            redemption: this.currentRedemption || null,
            discount: this.appliedDiscount || null,
            offer: this.appliedOffer || null,
            staffId: this.currentUser?.id || 'unknown',
            pharmacyId: this.currentPharmacy?.id || 'unknown',
            customerId: this.selectedDispensingCustomer?.id || null,
            customerPhone: this.selectedDispensingCustomer?.phone || null
        };

        // Update inventory
        this.cart.forEach(cartItem => {
            const product = this.products.find(p => p.id === cartItem.id);
            if (product) {
                product.currentStock -= cartItem.quantity;
            }
        });

        // Add to dispensing history
        this.dispensingHistory.push(dispensingRecord);

        // Award loyalty points if customer is selected (after redemption)
        if (this.selectedDispensingCustomer) {
            const pointsEarned = Math.floor(finalTotal);
            this.addPointsFromPurchase(this.selectedDispensingCustomer.id, finalTotal);

            // Update redemption transaction with dispensing ID
            if (this.currentRedemption) {
                const redemptionTransaction = this.loyaltyTransactions.find(t => 
                    t.customerId === this.selectedDispensingCustomer.id && 
                    t.type === 'redemption' && 
                    t.dispensingId === null
                );
                if (redemptionTransaction) {
                    redemptionTransaction.dispensingId = dispensingRecord.id;
                }
            }
        }

        // Save data
        this.saveData('products', this.products);
        this.saveData('dispensingHistory', this.dispensingHistory);
        this.saveData('loyaltyTransactions', this.loyaltyTransactions);

        // Print receipt before clearing cart
        this.showMessage('Generating receipt...', 'info');
        this.printReceiptFromCart(this.cart);

        // Clear cart, customer selection, redemption, discount, and offer
        this.cart = [];
        this.selectedDispensingCustomer = null;
        this.currentRedemption = null;
        this.appliedDiscount = null;
        this.appliedOffer = null;
        this.renderCart();
        this.clearDispensingCustomerInfo();
        this.hideAppliedDiscount();
        this.loadInventory();
        this.loadDashboard();

        this.showMessage('Dispensing completed successfully!', 'success');
    }

    // Override the existing printReceiptFromCart method to include redemption and discount information
    printReceiptFromCart(cart) {
        const originalTotal = this.calculateCartTotal();
        let finalTotal = originalTotal;
        
        if (this.currentRedemption) {
            finalTotal = this.currentRedemption.newTotal;
        }
        if (this.appliedDiscount) {
            finalTotal = this.appliedDiscount.newTotal;
        }
        
        const pointsEarned = this.selectedDispensingCustomer ? Math.floor(finalTotal) : 0;
        
        let receiptContent = `
            <div class="receipt">
                <div class="receipt-header">
                    <h2>VivaLife Pharmacy</h2>
                    <p>Receipt #${this.generateDispensingId()}</p>
                    <p>Date: ${new Date().toLocaleString()}</p>
                    <p>Staff: ${this.currentUser?.name || 'Unknown'}</p>
                </div>
                
                <div class="receipt-items">
                    <table>
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Qty</th>
                                <th>Price</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        cart.forEach(item => {
            receiptContent += `
                <tr>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>ر.س${item.price.toFixed(2)}</td>
                    <td>ر.س${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
            `;
        });

        receiptContent += `
                        </tbody>
                    </table>
                </div>
                
                <div class="receipt-total">
                    <p>Subtotal: ر.س${originalTotal.toFixed(2)}</p>
        `;

        // Add redemption information if applicable
        if (this.currentRedemption) {
            receiptContent += `
                    <p>Loyalty Discount: -ر.س${this.currentRedemption.discountAmount.toFixed(2)}</p>
                    <p>Points Redeemed: ${this.currentRedemption.pointsRedeemed}</p>
            `;
        }

        // Add discount code information if applicable
        if (this.appliedDiscount) {
            receiptContent += `
                    <p>Discount Code: ${this.appliedDiscount.name}</p>
                    <p>Discount: -ر.س${this.appliedDiscount.appliedAmount.toFixed(2)}</p>
            `;
        }

        // Add offer information if applicable
        if (this.appliedOffer) {
            receiptContent += `
                    <p>Special Offer: ${this.appliedOffer.name}</p>
                    <p>Savings: -ر.س${this.appliedOffer.appliedSavings.toFixed(2)}</p>
            `;
        }

        receiptContent += `
                    <p><strong>Total: ر.س${finalTotal.toFixed(2)}</strong></p>
        `;

        // Add loyalty information if customer is selected
        if (this.selectedDispensingCustomer) {
            receiptContent += `
                    <div class="loyalty-info">
                        <p><strong>Customer: ${this.selectedDispensingCustomer.name}</strong></p>
                        <p>Phone: ${this.selectedDispensingCustomer.phone}</p>
                        <p>Points Earned: ${pointsEarned}</p>
                        <p>Total Points: ${this.selectedDispensingCustomer.points + pointsEarned}</p>
                    </div>
            `;
        }

        receiptContent += `
                </div>
                
                <div class="receipt-footer">
                    <p>Thank you for your business!</p>
                    <p>Visit our loyalty program for more rewards</p>
                </div>
            </div>
        `;

        // Create and show receipt modal
        this.showReceiptModal(receiptContent);
    }

    // ==================== DISCOUNT CODE METHODS ====================

    applyDiscountCode() {
        const code = document.getElementById('discount-code-input').value.trim().toUpperCase();
        
        if (!code) {
            this.showMessage('Please enter a discount code', 'error');
            return;
        }

        if (this.cart.length === 0) {
            this.showMessage('Add items to cart before applying discount', 'error');
            return;
        }

        // Find discount by code
        const discount = this.discounts.find(d => 
            d.code && d.code.toUpperCase() === code && 
            d.active && 
            new Date(d.startDate) <= new Date() && 
            new Date(d.endDate) > new Date()
        );

        if (!discount) {
            this.showMessage('Invalid or expired discount code', 'error');
            return;
        }

        // Check if discount applies to cart items
        const cartTotal = this.calculateCartTotal();
        if (discount.minAmount > 0 && cartTotal < discount.minAmount) {
            this.showMessage(`Minimum purchase of ${this.formatCurrency(discount.minAmount)} required`, 'error');
            return;
        }

        // Check if discount applies to specific products
        if (discount.products.length > 0) {
            const cartProductIds = this.cart.map(item => item.id);
            const hasApplicableProduct = discount.products.some(productId => 
                cartProductIds.includes(productId)
            );
            
            if (!hasApplicableProduct) {
                this.showMessage('This discount does not apply to items in your cart', 'error');
                return;
            }
        }

        // Calculate discount amount
        let discountAmount = 0;
        if (discount.type === 'percentage') {
            discountAmount = (cartTotal * discount.value) / 100;
        } else if (discount.type === 'fixed') {
            discountAmount = discount.value;
        }

        // Apply maximum discount limit
        if (discount.maxAmount && discountAmount > discount.maxAmount) {
            discountAmount = discount.maxAmount;
        }

        // Store applied discount
        this.appliedDiscount = {
            ...discount,
            appliedAmount: discountAmount,
            originalTotal: cartTotal,
            newTotal: Math.max(0, cartTotal - discountAmount)
        };

        // Update UI
        this.displayAppliedDiscount();
        this.renderCart();
        this.showMessage(`Discount "${discount.name}" applied successfully!`, 'success');

        // Clear input
        document.getElementById('discount-code-input').value = '';
    }

    removeDiscountCode() {
        this.appliedDiscount = null;
        this.hideAppliedDiscount();
        this.renderCart();
        this.showMessage('Discount removed', 'info');
    }

    displayAppliedDiscount() {
        const discount = this.appliedDiscount;
        
        document.getElementById('applied-discount-name').textContent = discount.name;
        document.getElementById('applied-discount-value').textContent = 
            discount.type === 'percentage' ? `${discount.value}% off` : `${this.formatCurrency(discount.value)} off`;
        document.getElementById('discount-amount').textContent = this.formatCurrency(discount.appliedAmount);
        
        document.getElementById('discount-info').style.display = 'block';
    }

    hideAppliedDiscount() {
        document.getElementById('discount-info').style.display = 'none';
    }

    // ==================== APPLY OFFER METHODS ====================

    getOfferTypeDisplayName(type) {
        const typeMap = {
            'bogo': 'BOGO',
            'bogoh': 'BOGOH', 
            'b2g1': 'B2G1',
            'b3g1': 'B3G1'
        };
        return typeMap[type] || type.toUpperCase();
    }

    openOfferSelectionModal() {
        if (this.cart.length === 0) {
            this.showMessage('Please add items to cart first', 'error');
            return;
        }

        this.loadAvailableOffers();
        this.openModal('offer-selection-modal');
    }

    loadAvailableOffers() {
        const availableOffersList = document.getElementById('available-offers-list');
        const now = new Date();
        
        console.log('Loading available offers...');
        console.log('All offers:', this.offers);
        console.log('Cart items:', this.cart);
        
        // Filter active offers that match cart items
        const availableOffers = this.offers.filter(offer => {
            // Check if offer is active
            if (!offer.active) {
                console.log(`Offer ${offer.name} is not active`);
                return false;
            }
            
            const startDate = new Date(offer.startDate);
            const endDate = new Date(offer.endDate);
            if (now < startDate || now > endDate) {
                console.log(`Offer ${offer.name} is outside date range`);
                return false;
            }
            
            // Check if offer product is in cart
            const cartProductIds = this.cart.map(item => item.id);
            const isInCart = cartProductIds.includes(offer.productId);
            console.log(`Offer ${offer.name} product ${offer.productId} in cart:`, isInCart);
            return isInCart;
        });
        
        console.log('Available offers:', availableOffers);

        if (availableOffers.length === 0) {
            availableOffersList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-gift"></i>
                    <p>No offers available for items in your cart</p>
                </div>
            `;
            return;
        }

        availableOffersList.innerHTML = availableOffers.map(offer => {
            const product = this.products.find(p => p.id === offer.productId);
            const cartItem = this.cart.find(item => item.id === offer.productId);
            
            return `
                <div class="offer-item" data-offer-id="${offer.id}">
                    <div class="offer-header">
                        <div class="offer-name">${offer.name}</div>
                        <div class="offer-type">${this.getOfferTypeDisplayName(offer.type)}</div>
                    </div>
                    <div class="offer-details">
                        <div class="offer-description">${offer.description || 'Special offer'}</div>
                        <div class="offer-validity">Valid until ${new Date(offer.endDate).toLocaleDateString()}</div>
                    </div>
                </div>
            `;
        }).join('');

        // Add click listeners to offer items
        availableOffersList.querySelectorAll('.offer-item').forEach(item => {
            item.addEventListener('click', () => {
                // Remove previous selection
                availableOffersList.querySelectorAll('.offer-item').forEach(i => i.classList.remove('selected'));
                // Add selection to clicked item
                item.classList.add('selected');
                
                const offerId = item.dataset.offerId;
                this.previewOffer(offerId);
            });
        });
    }

    previewOffer(offerId) {
        const offer = this.offers.find(o => o.id === offerId);
        if (!offer) return;

        const product = this.products.find(p => p.id === offer.productId);
        const cartItem = this.cart.find(item => item.id === offer.productId);
        
        if (!product || !cartItem) return;

        // Calculate savings based on offer type
        let savings = 0;
        let newTotal = this.calculateCartTotal();
        
        console.log('Calculating savings for offer:', offer);
        console.log('Product:', product);
        console.log('Cart item:', cartItem);

        switch (offer.type) {
            case 'bogo':
                // Buy 1 Get 1 Free
                if (cartItem.quantity >= 2) {
                    const freeItems = Math.floor(cartItem.quantity / 2);
                    savings = freeItems * product.price;
                }
                break;
            case 'bogoh':
                // Buy 1 Get 1 Half Price
                if (cartItem.quantity >= 2) {
                    const halfPriceItems = Math.floor(cartItem.quantity / 2);
                    savings = halfPriceItems * (product.price * 0.5);
                }
                break;
            case 'b2g1':
                // Buy 2 Get 1 Free
                if (cartItem.quantity >= 3) {
                    const freeItems = Math.floor(cartItem.quantity / 3);
                    savings = freeItems * product.price;
                }
                break;
            case 'b3g1':
                // Buy 3 Get 1 Free
                if (cartItem.quantity >= 4) {
                    const freeItems = Math.floor(cartItem.quantity / 4);
                    savings = freeItems * product.price;
                }
                break;
        }

        newTotal = Math.max(0, newTotal - savings);
        
        console.log('Calculated savings:', savings);
        console.log('New total:', newTotal);

        // Update preview
        document.getElementById('preview-offer-name').textContent = offer.name;
        document.getElementById('preview-offer-type').textContent = this.getOfferTypeDisplayName(offer.type);
        document.getElementById('preview-offer-savings').textContent = this.formatCurrency(savings);
        document.getElementById('preview-new-total').textContent = this.formatCurrency(newTotal);
        
        // Show preview and enable confirm button
        document.getElementById('offer-preview').style.display = 'block';
        document.getElementById('confirm-offer-selection').disabled = false;
    }

    confirmOfferSelection() {
        const selectedOffer = document.querySelector('.offer-item.selected');
        if (!selectedOffer) {
            this.showMessage('Please select an offer', 'error');
            return;
        }

        const offerId = selectedOffer.dataset.offerId;
        const offer = this.offers.find(o => o.id === offerId);
        if (!offer) return;

        const product = this.products.find(p => p.id === offer.productId);
        const cartItem = this.cart.find(item => item.id === offer.productId);
        
        if (!product || !cartItem) return;

        // Calculate savings
        let savings = 0;
        let newTotal = this.calculateCartTotal();

        switch (offer.type) {
            case 'bogo':
                if (cartItem.quantity >= 2) {
                    const freeItems = Math.floor(cartItem.quantity / 2);
                    savings = freeItems * product.price;
                }
                break;
            case 'bogoh':
                if (cartItem.quantity >= 2) {
                    const halfPriceItems = Math.floor(cartItem.quantity / 2);
                    savings = halfPriceItems * (product.price * 0.5);
                }
                break;
            case 'b2g1':
                if (cartItem.quantity >= 3) {
                    const freeItems = Math.floor(cartItem.quantity / 3);
                    savings = freeItems * product.price;
                }
                break;
            case 'b3g1':
                if (cartItem.quantity >= 4) {
                    const freeItems = Math.floor(cartItem.quantity / 4);
                    savings = freeItems * product.price;
                }
                break;
        }

        newTotal = Math.max(0, newTotal - savings);

        // Store applied offer
        this.appliedOffer = {
            ...offer,
            appliedSavings: savings,
            originalTotal: this.calculateCartTotal(),
            newTotal: newTotal,
            productId: offer.productId,
            productName: product.name
        };

        // Update UI
        this.displayAppliedOffer();
        this.renderCart();
        this.closeModal('offer-selection-modal');

        this.showMessage(`Offer "${offer.name}" applied successfully!`, 'success');
    }

    displayAppliedOffer() {
        const offer = this.appliedOffer;
        
        document.getElementById('applied-offer-name').textContent = offer.name;
        document.getElementById('applied-offer-type').textContent = this.getOfferTypeDisplayName(offer.type);
        document.getElementById('offer-savings').textContent = this.formatCurrency(offer.appliedSavings);
        
        document.getElementById('applied-offer-info').style.display = 'block';
    }

    hideAppliedOffer() {
        document.getElementById('applied-offer-info').style.display = 'none';
    }

    removeAppliedOffer() {
        this.appliedOffer = null;
        this.hideAppliedOffer();
        this.renderCart();
        this.showMessage('Offer removed', 'info');
    }

    // ==================== DISCOUNTS & OFFERS METHODS ====================

    loadDiscounts() {
        this.renderActiveDiscounts();
        this.renderActiveOffers();
        this.renderDiscountHistory();
        this.populateProductSelects();
    }

    openDiscountModal() {
        this.resetDiscountForm();
        this.populateProductSelects();
        this.openModal('discount-modal');
    }

    openOfferModal() {
        this.resetOfferForm();
        this.populateProductSelects();
        this.openModal('offer-modal');
    }

    resetDiscountForm() {
        document.getElementById('discount-form').reset();
        document.getElementById('discount-active').checked = true;
        
        // Set default dates
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        document.getElementById('discount-start-date').value = this.formatDateTimeLocal(now);
        document.getElementById('discount-end-date').value = this.formatDateTimeLocal(nextWeek);
    }

    resetOfferForm() {
        document.getElementById('offer-form').reset();
        document.getElementById('offer-active').checked = true;
        
        // Set default dates
        const now = new Date();
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        document.getElementById('offer-start-date').value = this.formatDateTimeLocal(now);
        document.getElementById('offer-end-date').value = this.formatDateTimeLocal(nextWeek);
    }

    formatDateTimeLocal(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    populateProductSelects() {
        this.populateDiscountProductList();
        this.populateOfferProductSelect();
    }

    populateDiscountProductList() {
        const container = document.getElementById('discount-products-list');
        const offerSelect = document.getElementById('offer-product');
        
        // Clear existing options
        container.innerHTML = '';
        offerSelect.innerHTML = '<option value="">Select Product</option>';
        
        // Add products to discount list
        this.products.forEach(product => {
            const productItem = document.createElement('div');
            productItem.className = 'product-selection-item';
            productItem.innerHTML = `
                <input type="checkbox" id="product-${product.id}" value="${product.id}">
                <div class="product-info">
                    <div class="product-name">${product.name}</div>
                    <div class="product-sku">SKU: ${product.sku}</div>
                    <div class="product-price">ر.س${product.price.toFixed(2)}</div>
                </div>
            `;
            container.appendChild(productItem);
            
            // Add to offer select
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = `${product.name} (${product.sku})`;
            offerSelect.appendChild(option);
        });

        // Add event listeners for checkboxes
        container.addEventListener('change', (e) => {
            if (e.target.type === 'checkbox') {
                this.updateProductSelectionCount();
            }
        });

        // Add event listeners for select all/clear all buttons
        document.getElementById('select-all-products').addEventListener('click', () => {
            this.selectAllProducts();
        });

        document.getElementById('clear-all-products').addEventListener('click', () => {
            this.clearAllProducts();
        });
    }

    populateOfferProductSelect() {
        const offerSelect = document.getElementById('offer-product');
        offerSelect.innerHTML = '<option value="">Select Product</option>';
        
        this.products.forEach(product => {
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = `${product.name} (${product.sku})`;
            offerSelect.appendChild(option);
        });
    }

    selectAllProducts() {
        const checkboxes = document.querySelectorAll('#discount-products-list input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = true;
        });
        this.updateProductSelectionCount();
    }

    clearAllProducts() {
        const checkboxes = document.querySelectorAll('#discount-products-list input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        this.updateProductSelectionCount();
    }

    updateProductSelectionCount() {
        const checkboxes = document.querySelectorAll('#discount-products-list input[type="checkbox"]');
        const selectedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
        document.querySelector('.selected-count').textContent = `${selectedCount} products selected`;
    }

    getSelectedProducts() {
        const checkboxes = document.querySelectorAll('#discount-products-list input[type="checkbox"]:checked');
        return Array.from(checkboxes).map(cb => cb.value);
    }

    saveDiscount() {
        const form = document.getElementById('discount-form');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const discount = {
            id: this.generateDiscountId(),
            name: document.getElementById('discount-name').value.trim(),
            code: document.getElementById('discount-code').value.trim() || null,
            type: document.getElementById('discount-type').value,
            value: parseFloat(document.getElementById('discount-value').value),
            minAmount: parseFloat(document.getElementById('discount-min-amount').value) || 0,
            maxAmount: parseFloat(document.getElementById('discount-max-amount').value) || null,
            startDate: new Date(document.getElementById('discount-start-date').value),
            endDate: new Date(document.getElementById('discount-end-date').value),
            description: document.getElementById('discount-description').value.trim(),
            products: this.getSelectedProducts(),
            active: document.getElementById('discount-active').checked,
            createdAt: new Date().toISOString(),
            usageCount: 0,
            totalSavings: 0
        };

        // Validation
        if (discount.startDate >= discount.endDate) {
            this.showMessage('End date must be after start date', 'error');
            return;
        }

        if (discount.type === 'percentage' && (discount.value < 0 || discount.value > 100)) {
            this.showMessage('Percentage must be between 0 and 100', 'error');
            return;
        }

        if (discount.type === 'fixed' && discount.value < 0) {
            this.showMessage('Fixed amount must be positive', 'error');
            return;
        }

        this.discounts.push(discount);
        this.saveData('discounts', this.discounts);

        this.closeModal('discount-modal');
        this.loadDiscounts();
        this.showMessage('Discount created successfully!', 'success');
    }

    saveOffer() {
        const form = document.getElementById('offer-form');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const offer = {
            id: this.generateOfferId(),
            name: document.getElementById('offer-name').value.trim(),
            type: document.getElementById('offer-type').value,
            productId: document.getElementById('offer-product').value,
            quantity: parseInt(document.getElementById('offer-quantity').value),
            startDate: new Date(document.getElementById('offer-start-date').value),
            endDate: new Date(document.getElementById('offer-end-date').value),
            description: document.getElementById('offer-description').value.trim(),
            active: document.getElementById('offer-active').checked,
            createdAt: new Date().toISOString(),
            usageCount: 0,
            totalSavings: 0
        };

        // Validation
        if (offer.startDate >= offer.endDate) {
            this.showMessage('End date must be after start date', 'error');
            return;
        }

        this.offers.push(offer);
        this.saveData('offers', this.offers);

        this.closeModal('offer-modal');
        this.loadDiscounts();
        this.showMessage('Offer created successfully!', 'success');
    }

    generateDiscountId() {
        const timestamp = Date.now().toString().slice(-8);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `DISC${timestamp}${random}`;
    }

    generateOfferId() {
        const timestamp = Date.now().toString().slice(-8);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `OFFER${timestamp}${random}`;
    }

    renderActiveDiscounts() {
        const container = document.getElementById('active-discounts-list');
        const activeDiscounts = this.discounts.filter(d => d.active && new Date(d.endDate) > new Date());
        
        if (activeDiscounts.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 2rem;">No active discounts</p>';
            return;
        }

        container.innerHTML = activeDiscounts.map(discount => `
            <div class="discount-item">
                <div class="discount-header">
                    <div class="discount-name">${discount.name}</div>
                    <div class="discount-type ${discount.type}">${discount.type}</div>
                </div>
                <div class="discount-details">
                    <div class="detail-item">
                        <div class="detail-label">Value</div>
                        <div class="detail-value">${discount.type === 'percentage' ? discount.value + '%' : 'ر.س' + discount.value}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Code</div>
                        <div class="detail-value">${discount.code || 'N/A'}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Valid Until</div>
                        <div class="detail-value">${new Date(discount.endDate).toLocaleDateString()}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Usage</div>
                        <div class="detail-value">${discount.usageCount} times</div>
                    </div>
                </div>
                <div class="discount-actions">
                    <button class="btn btn-sm btn-edit" onclick="pharmacySystem.editDiscount('${discount.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-deactivate" onclick="pharmacySystem.toggleDiscount('${discount.id}')">
                        <i class="fas fa-pause"></i> Deactivate
                    </button>
                    <button class="btn btn-sm btn-delete" onclick="pharmacySystem.deleteDiscount('${discount.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderActiveOffers() {
        const container = document.getElementById('active-offers-list');
        const activeOffers = this.offers.filter(o => o.active && new Date(o.endDate) > new Date());
        
        if (activeOffers.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 2rem;">No active offers</p>';
            return;
        }

        container.innerHTML = activeOffers.map(offer => {
            const product = this.products.find(p => p.id === offer.productId);
            return `
                <div class="offer-item">
                    <div class="offer-header">
                        <div class="offer-name">${offer.name}</div>
                        <div class="offer-type ${offer.type}">${offer.type.toUpperCase()}</div>
                    </div>
                    <div class="offer-details">
                        <div class="detail-item">
                            <div class="detail-label">Product</div>
                            <div class="detail-value">${product ? product.name : 'Unknown'}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Min Quantity</div>
                            <div class="detail-value">${offer.quantity}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Valid Until</div>
                            <div class="detail-value">${new Date(offer.endDate).toLocaleDateString()}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Usage</div>
                            <div class="detail-value">${offer.usageCount} times</div>
                        </div>
                    </div>
                    <div class="offer-actions">
                        <button class="btn btn-sm btn-edit" onclick="pharmacySystem.editOffer('${offer.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-sm btn-deactivate" onclick="pharmacySystem.toggleOffer('${offer.id}')">
                            <i class="fas fa-pause"></i> Deactivate
                        </button>
                        <button class="btn btn-sm btn-delete" onclick="pharmacySystem.deleteOffer('${offer.id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderDiscountHistory() {
        const container = document.getElementById('discount-history-list');
        const allItems = [...this.discounts, ...this.offers].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        if (allItems.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 2rem;">No discount history</p>';
            return;
        }

        container.innerHTML = allItems.map(item => {
            const isExpired = new Date(item.endDate) < new Date();
            const isDiscount = item.type === 'percentage' || item.type === 'fixed';
            
            return `
                <div class="history-item">
                    <div class="history-header">
                        <div class="history-name">${item.name}</div>
                        <div class="history-type ${isExpired ? 'expired' : (isDiscount ? item.type : item.type)}">
                            ${isExpired ? 'EXPIRED' : (isDiscount ? item.type.toUpperCase() : item.type.toUpperCase())}
                        </div>
                    </div>
                    <div class="history-details">
                        <div class="detail-item">
                            <div class="detail-label">Type</div>
                            <div class="detail-value">${isDiscount ? 'Discount' : 'Offer'}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Created</div>
                            <div class="detail-value">${new Date(item.createdAt).toLocaleDateString()}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Status</div>
                            <div class="detail-value ${isExpired ? 'status-expired' : (item.active ? 'status-active' : 'status-inactive')}">
                                ${isExpired ? 'Expired' : (item.active ? 'Active' : 'Inactive')}
                            </div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Usage</div>
                            <div class="detail-value">${item.usageCount} times</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    filterDiscountHistory() {
        // This method will be implemented to filter the discount history
        this.renderDiscountHistory();
    }

    // Placeholder methods for discount/offer management
    editDiscount(id) {
        this.showMessage('Edit discount functionality coming soon', 'info');
    }

    toggleDiscount(id) {
        const discount = this.discounts.find(d => d.id === id);
        if (discount) {
            discount.active = !discount.active;
            this.saveData('discounts', this.discounts);
            this.loadDiscounts();
            this.showMessage(`Discount ${discount.active ? 'activated' : 'deactivated'}`, 'success');
        }
    }

    deleteDiscount(id) {
        if (confirm('Are you sure you want to delete this discount?')) {
            this.discounts = this.discounts.filter(d => d.id !== id);
            this.saveData('discounts', this.discounts);
            this.loadDiscounts();
            this.showMessage('Discount deleted', 'success');
        }
    }

    editOffer(id) {
        this.showMessage('Edit offer functionality coming soon', 'info');
    }

    toggleOffer(id) {
        const offer = this.offers.find(o => o.id === id);
        if (offer) {
            offer.active = !offer.active;
            this.saveData('offers', this.offers);
            this.loadDiscounts();
            this.showMessage(`Offer ${offer.active ? 'activated' : 'deactivated'}`, 'success');
        }
    }

    deleteOffer(id) {
        if (confirm('Are you sure you want to delete this offer?')) {
            this.offers = this.offers.filter(o => o.id !== id);
            this.saveData('offers', this.offers);
            this.loadDiscounts();
            this.showMessage('Offer deleted', 'success');
        }
    }
}

// Initialize the pharmacy management system
const pharmacySystem = new PharmacyManagementSystem();

// Additional utility functions for global access
window.pharmacySystem = pharmacySystem;
