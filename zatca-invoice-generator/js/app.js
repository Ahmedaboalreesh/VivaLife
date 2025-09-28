/**
 * ZATCA E-Invoice Generator Application
 * Main application logic and event handlers
 */

class ZATCAInvoiceApp {
    constructor() {
        this.zatcaUtils = new ZATCAUtils();
        this.invoiceGenerator = new InvoiceGenerator();
        this.currentInvoice = null;
        this.lineItemCounter = 0;
        
        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        this.setupEventListeners();
        this.loadSettings();
        this.generateInvoiceNumber();
        this.setCurrentDateTime();
        this.loadInvoiceList();
        this.addInitialLineItem();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.currentTarget.dataset.tab);
            });
        });

        // Invoice type change
        document.querySelectorAll('input[name="invoiceType"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.handleInvoiceTypeChange(e.target.value);
            });
        });

        // Add line item
        document.getElementById('add-line-item').addEventListener('click', () => {
            this.addLineItem();
        });

        // Preview invoice
        document.getElementById('preview-invoice').addEventListener('click', () => {
            this.previewInvoice();
        });

        // Generate invoice
        document.getElementById('generate-invoice').addEventListener('click', () => {
            this.generateInvoice();
        });

        // Generate from preview
        document.getElementById('generate-from-preview').addEventListener('click', () => {
            this.generateInvoice();
            this.closeModal();
        });

        // Close preview modal
        document.getElementById('close-preview').addEventListener('click', () => {
            this.closeModal();
        });

        // Modal close button
        document.querySelector('.close').addEventListener('click', () => {
            this.closeModal();
        });

        // Save settings
        document.getElementById('save-settings').addEventListener('click', () => {
            this.saveSettings();
        });

        // Search invoices
        document.getElementById('search-invoices').addEventListener('input', (e) => {
            this.searchInvoices(e.target.value);
        });

        // Filter invoices
        document.getElementById('filter-type').addEventListener('change', (e) => {
            this.filterInvoices(e.target.value);
        });

        // Form validation
        document.getElementById('invoice-form-element').addEventListener('input', () => {
            this.updateTotals();
        });
    }

    /**
     * Switch between tabs
     * @param {string} tabName - Tab name to switch to
     */
    switchTab(tabName) {
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });

        // Remove active class from all tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Show selected tab content
        document.getElementById(tabName).classList.add('active');

        // Add active class to selected tab button
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Load data for specific tabs
        if (tabName === 'invoice-list') {
            this.loadInvoiceList();
        }
    }

    /**
     * Handle invoice type change
     * @param {string} type - Invoice type (B2B or B2C)
     */
    handleInvoiceTypeChange(type) {
        const buyerSection = document.getElementById('buyer-section');
        if (type === 'B2B') {
            buyerSection.style.display = 'block';
            // Make buyer fields required
            document.getElementById('buyerName').required = true;
            document.getElementById('buyerVAT').required = true;
            document.getElementById('buyerAddress').required = true;
        } else {
            buyerSection.style.display = 'none';
            // Make buyer fields not required
            document.getElementById('buyerName').required = false;
            document.getElementById('buyerVAT').required = false;
            document.getElementById('buyerAddress').required = false;
        }
    }

    /**
     * Generate invoice number
     */
    generateInvoiceNumber() {
        const prefix = document.getElementById('invoicePrefix')?.value || 'INV';
        const invoiceNumber = this.zatcaUtils.generateInvoiceNumber(prefix);
        document.getElementById('invoiceNumber').value = invoiceNumber;
    }

    /**
     * Set current date and time
     */
    setCurrentDateTime() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        
        const dateTimeString = `${year}-${month}-${day}T${hours}:${minutes}`;
        document.getElementById('invoiceDate').value = dateTimeString;
    }

    /**
     * Add initial line item
     */
    addInitialLineItem() {
        this.addLineItem();
    }

    /**
     * Add line item to form
     */
    addLineItem() {
        const lineItemsList = document.getElementById('line-items-list');
        const lineItemId = `line-item-${this.lineItemCounter++}`;
        
        const lineItemHTML = `
            <div class="line-item" id="${lineItemId}">
                <input type="text" name="description" placeholder="وصف المنتج | Product Description" required>
                <input type="number" name="quantity" placeholder="الكمية | Quantity" min="1" step="1" required>
                <input type="number" name="unitPrice" placeholder="سعر الوحدة | Unit Price" min="0" step="0.01" required>
                <select name="taxRate" required>
                    <option value="15">15%</option>
                    <option value="0">0%</option>
                    <option value="5">5%</option>
                </select>
                <span class="line-total">0.00 SAR</span>
                <button type="button" class="btn btn-danger btn-sm" onclick="app.removeLineItem('${lineItemId}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        lineItemsList.insertAdjacentHTML('beforeend', lineItemHTML);
        
        // Add event listeners for real-time calculation
        const lineItem = document.getElementById(lineItemId);
        lineItem.querySelectorAll('input, select').forEach(input => {
            input.addEventListener('input', () => {
                this.updateLineItemTotal(lineItemId);
                this.updateTotals();
            });
        });
        
        this.updateLineItemTotal(lineItemId);
        this.updateTotals();
    }

    /**
     * Remove line item
     * @param {string} lineItemId - Line item ID to remove
     */
    removeLineItem(lineItemId) {
        const lineItem = document.getElementById(lineItemId);
        if (lineItem) {
            lineItem.remove();
            this.updateTotals();
        }
    }

    /**
     * Update line item total
     * @param {string} lineItemId - Line item ID
     */
    updateLineItemTotal(lineItemId) {
        const lineItem = document.getElementById(lineItemId);
        const quantity = parseFloat(lineItem.querySelector('input[name="quantity"]').value) || 0;
        const unitPrice = parseFloat(lineItem.querySelector('input[name="unitPrice"]').value) || 0;
        const total = quantity * unitPrice;
        
        const totalSpan = lineItem.querySelector('.line-total');
        totalSpan.textContent = this.zatcaUtils.formatCurrency(total);
    }

    /**
     * Update invoice totals
     */
    updateTotals() {
        const lineItems = this.getLineItems();
        const totals = this.zatcaUtils.calculateTotals(lineItems);
        
        document.getElementById('subtotal').textContent = this.zatcaUtils.formatCurrency(totals.subtotal);
        document.getElementById('vat-amount').textContent = this.zatcaUtils.formatCurrency(totals.vatAmount);
        document.getElementById('total-amount').textContent = this.zatcaUtils.formatCurrency(totals.totalWithVAT);
    }

    /**
     * Get line items from form
     * @returns {Array} - Array of line items
     */
    getLineItems() {
        const lineItems = [];
        document.querySelectorAll('.line-item').forEach(lineItem => {
            const description = lineItem.querySelector('input[name="description"]').value;
            const quantity = parseFloat(lineItem.querySelector('input[name="quantity"]').value) || 0;
            const unitPrice = parseFloat(lineItem.querySelector('input[name="unitPrice"]').value) || 0;
            const taxRate = parseFloat(lineItem.querySelector('select[name="taxRate"]').value) || 0;
            
            if (description && quantity > 0 && unitPrice > 0) {
                lineItems.push({
                    description,
                    quantity,
                    unitPrice,
                    taxRate
                });
            }
        });
        
        return lineItems;
    }

    /**
     * Get form data
     * @returns {Object} - Form data object
     */
    getFormData() {
        const form = document.getElementById('invoice-form-element');
        const formData = new FormData(form);
        
        return {
            invoiceType: formData.get('invoiceType'),
            seller: {
                name: formData.get('sellerName'),
                vatNumber: formData.get('sellerVAT'),
                address: formData.get('sellerAddress')
            },
            buyer: {
                name: formData.get('buyerName'),
                vatNumber: formData.get('buyerVAT'),
                address: formData.get('buyerAddress')
            },
            invoiceNumber: formData.get('invoiceNumber'),
            invoiceDate: formData.get('invoiceDate'),
            lineItems: this.getLineItems()
        };
    }

    /**
     * Validate form data
     * @param {Object} formData - Form data to validate
     * @returns {Object} - Validation result
     */
    validateFormData(formData) {
        const errors = [];
        
        // Validate seller information
        if (!formData.seller.name) errors.push('Seller name is required');
        if (!formData.seller.vatNumber) errors.push('Seller VAT number is required');
        if (!this.zatcaUtils.validateVATNumber(formData.seller.vatNumber)) {
            errors.push('Invalid seller VAT number format');
        }
        if (!formData.seller.address) errors.push('Seller address is required');
        
        // Validate buyer information for B2B
        if (formData.invoiceType === 'B2B') {
            if (!formData.buyer.name) errors.push('Buyer name is required');
            if (!formData.buyer.vatNumber) errors.push('Buyer VAT number is required');
            if (!this.zatcaUtils.validateVATNumber(formData.buyer.vatNumber)) {
                errors.push('Invalid buyer VAT number format');
            }
            if (!formData.buyer.address) errors.push('Buyer address is required');
        }
        
        // Validate line items
        if (formData.lineItems.length === 0) {
            errors.push('At least one line item is required');
        }
        
        formData.lineItems.forEach((item, index) => {
            if (!item.description) errors.push(`Line item ${index + 1}: Description is required`);
            if (item.quantity <= 0) errors.push(`Line item ${index + 1}: Quantity must be greater than 0`);
            if (item.unitPrice <= 0) errors.push(`Line item ${index + 1}: Unit price must be greater than 0`);
        });
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Preview invoice
     */
    async previewInvoice() {
        const formData = this.getFormData();
        const validation = this.validateFormData(formData);
        
        if (!validation.isValid) {
            this.showMessage('Please fix the following errors: ' + validation.errors.join(', '), 'error');
            return;
        }
        
        this.currentInvoice = formData;
        this.invoiceGenerator.previewInvoice(formData);
        this.showModal();
    }

    /**
     * Generate invoice
     */
    async generateInvoice() {
        if (!this.currentInvoice) {
            const formData = this.getFormData();
            const validation = this.validateFormData(formData);
            
            if (!validation.isValid) {
                this.showMessage('Please fix the following errors: ' + validation.errors.join(', '), 'error');
                return;
            }
            
            this.currentInvoice = formData;
        }
        
        try {
            this.showMessage('Generating invoice...', 'info');
            
            const eInvoice = await this.invoiceGenerator.generateEInvoice(this.currentInvoice);
            
            // Download PDF
            const filename = `invoice-${eInvoice.invoiceNumber}.pdf`;
            this.invoiceGenerator.downloadPDF(eInvoice.pdfBlob, filename);
            
            this.showMessage('Invoice generated successfully!', 'success');
            this.resetForm();
            this.loadInvoiceList();
            
        } catch (error) {
            console.error('Error generating invoice:', error);
            this.showMessage('Error generating invoice: ' + error.message, 'error');
        }
    }

    /**
     * Reset form
     */
    resetForm() {
        document.getElementById('invoice-form-element').reset();
        document.getElementById('line-items-list').innerHTML = '';
        this.lineItemCounter = 0;
        this.generateInvoiceNumber();
        this.setCurrentDateTime();
        this.addInitialLineItem();
        this.currentInvoice = null;
    }

    /**
     * Load invoice list
     */
    loadInvoiceList() {
        const invoices = this.zatcaUtils.getInvoices();
        const invoicesList = document.getElementById('invoices-list');
        
        if (invoices.length === 0) {
            invoicesList.innerHTML = `
                <div class="message info">
                    <i class="fas fa-info-circle"></i>
                    No invoices found. Create your first invoice!
                </div>
            `;
            return;
        }
        
        invoicesList.innerHTML = invoices.map(invoice => `
            <div class="invoice-card">
                <div class="invoice-header">
                    <div class="invoice-number">${invoice.invoiceNumber}</div>
                    <div class="invoice-type ${invoice.invoiceType}">${invoice.invoiceType}</div>
                </div>
                <div class="invoice-details">
                    <div class="invoice-detail">
                        <label>Date | التاريخ</label>
                        <span>${this.zatcaUtils.formatDate(invoice.invoiceDate)}</span>
                    </div>
                    <div class="invoice-detail">
                        <label>Seller | البائع</label>
                        <span>${invoice.seller.name}</span>
                    </div>
                    <div class="invoice-detail">
                        <label>Total | المجموع</label>
                        <span>${this.zatcaUtils.formatCurrency(invoice.totalWithVAT)}</span>
                    </div>
                    <div class="invoice-detail">
                        <label>Status | الحالة</label>
                        <span>${invoice.isImmutable ? 'Immutable | غير قابل للتعديل' : 'Draft | مسودة'}</span>
                    </div>
                </div>
                <div class="invoice-actions">
                    <button class="btn btn-outline btn-sm" onclick="app.viewInvoice('${invoice.id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="btn btn-primary btn-sm" onclick="app.downloadInvoice('${invoice.id}')">
                        <i class="fas fa-download"></i> Download
                    </button>
                    ${!invoice.isImmutable ? `
                    <button class="btn btn-danger btn-sm" onclick="app.deleteInvoice('${invoice.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    /**
     * View invoice
     * @param {string} invoiceId - Invoice ID
     */
    viewInvoice(invoiceId) {
        const invoice = this.zatcaUtils.getInvoiceById(invoiceId);
        if (invoice) {
            this.invoiceGenerator.previewInvoice(invoice);
            this.showModal();
        }
    }

    /**
     * Download invoice
     * @param {string} invoiceId - Invoice ID
     */
    downloadInvoice(invoiceId) {
        const invoice = this.zatcaUtils.getInvoiceById(invoiceId);
        if (invoice && invoice.pdfBlob) {
            const filename = `invoice-${invoice.invoiceNumber}.pdf`;
            this.invoiceGenerator.downloadPDF(invoice.pdfBlob, filename);
        }
    }

    /**
     * Delete invoice
     * @param {string} invoiceId - Invoice ID
     */
    deleteInvoice(invoiceId) {
        if (confirm('Are you sure you want to delete this invoice?')) {
            try {
                this.zatcaUtils.deleteInvoice(invoiceId);
                this.loadInvoiceList();
                this.showMessage('Invoice deleted successfully', 'success');
            } catch (error) {
                this.showMessage('Cannot delete immutable invoice', 'error');
            }
        }
    }

    /**
     * Search invoices
     * @param {string} searchTerm - Search term
     */
    searchInvoices(searchTerm) {
        const invoices = this.zatcaUtils.getInvoices();
        const filteredInvoices = invoices.filter(invoice => 
            invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            invoice.seller.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (invoice.buyer && invoice.buyer.name.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        
        this.displayInvoices(filteredInvoices);
    }

    /**
     * Filter invoices by type
     * @param {string} type - Invoice type filter
     */
    filterInvoices(type) {
        const invoices = this.zatcaUtils.getInvoices();
        const filteredInvoices = type ? invoices.filter(invoice => invoice.invoiceType === type) : invoices;
        
        this.displayInvoices(filteredInvoices);
    }

    /**
     * Display filtered invoices
     * @param {Array} invoices - Invoices to display
     */
    displayInvoices(invoices) {
        const invoicesList = document.getElementById('invoices-list');
        
        if (invoices.length === 0) {
            invoicesList.innerHTML = `
                <div class="message info">
                    <i class="fas fa-info-circle"></i>
                    No invoices found matching your criteria.
                </div>
            `;
            return;
        }
        
        invoicesList.innerHTML = invoices.map(invoice => `
            <div class="invoice-card">
                <div class="invoice-header">
                    <div class="invoice-number">${invoice.invoiceNumber}</div>
                    <div class="invoice-type ${invoice.invoiceType}">${invoice.invoiceType}</div>
                </div>
                <div class="invoice-details">
                    <div class="invoice-detail">
                        <label>Date | التاريخ</label>
                        <span>${this.zatcaUtils.formatDate(invoice.invoiceDate)}</span>
                    </div>
                    <div class="invoice-detail">
                        <label>Seller | البائع</label>
                        <span>${invoice.seller.name}</span>
                    </div>
                    <div class="invoice-detail">
                        <label>Total | المجموع</label>
                        <span>${this.zatcaUtils.formatCurrency(invoice.totalWithVAT)}</span>
                    </div>
                    <div class="invoice-detail">
                        <label>Status | الحالة</label>
                        <span>${invoice.isImmutable ? 'Immutable | غير قابل للتعديل' : 'Draft | مسودة'}</span>
                    </div>
                </div>
                <div class="invoice-actions">
                    <button class="btn btn-outline btn-sm" onclick="app.viewInvoice('${invoice.id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="btn btn-primary btn-sm" onclick="app.downloadInvoice('${invoice.id}')">
                        <i class="fas fa-download"></i> Download
                    </button>
                    ${!invoice.isImmutable ? `
                    <button class="btn btn-danger btn-sm" onclick="app.deleteInvoice('${invoice.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    /**
     * Load settings
     */
    loadSettings() {
        const settings = JSON.parse(localStorage.getItem('zatca_settings') || '{}');
        
        Object.keys(settings).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                element.value = settings[key];
            }
        });
    }

    /**
     * Save settings
     */
    saveSettings() {
        const settings = {};
        const settingElements = document.querySelectorAll('#settings input, #settings select, #settings textarea');
        
        settingElements.forEach(element => {
            settings[element.name] = element.value;
        });
        
        localStorage.setItem('zatca_settings', JSON.stringify(settings));
        this.showMessage('Settings saved successfully', 'success');
    }

    /**
     * Show modal
     */
    showModal() {
        document.getElementById('invoice-preview-modal').style.display = 'block';
    }

    /**
     * Close modal
     */
    closeModal() {
        document.getElementById('invoice-preview-modal').style.display = 'none';
    }

    /**
     * Show message
     * @param {string} message - Message to show
     * @param {string} type - Message type (success, error, info)
     */
    showMessage(message, type = 'info') {
        // Remove existing messages
        const existingMessages = document.querySelectorAll('.message');
        existingMessages.forEach(msg => msg.remove());
        
        // Create new message
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        
        const icon = type === 'success' ? 'check-circle' : 
                    type === 'error' ? 'exclamation-circle' : 'info-circle';
        
        messageDiv.innerHTML = `
            <i class="fas fa-${icon}"></i>
            ${message}
        `;
        
        // Insert at top of container
        const container = document.querySelector('.container');
        container.insertBefore(messageDiv, container.firstChild);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ZATCAInvoiceApp();
});
