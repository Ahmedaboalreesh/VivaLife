/**
 * ZATCA E-Invoice Utilities
 * Utility functions for ZATCA compliance and e-invoice generation
 */

class ZATCAUtils {
    constructor() {
        this.vatRate = 15; // Default VAT rate for Saudi Arabia
        this.currency = 'SAR';
        this.invoiceCounter = this.loadInvoiceCounter();
    }

    /**
     * Generate unique invoice number
     * @param {string} prefix - Invoice prefix
     * @returns {string} - Unique invoice number
     */
    generateInvoiceNumber(prefix = 'INV') {
        const timestamp = Date.now();
        const counter = this.invoiceCounter++;
        this.saveInvoiceCounter();
        return `${prefix}-${timestamp}-${counter.toString().padStart(6, '0')}`;
    }

    /**
     * Generate ZATCA-compliant QR code data
     * @param {Object} invoiceData - Invoice data
     * @returns {string} - QR code data string
     */
    generateQRCodeData(invoiceData) {
        const qrData = {
            sellerName: invoiceData.seller.name,
            sellerVAT: invoiceData.seller.vatNumber,
            invoiceDate: invoiceData.invoiceDate,
            totalWithVAT: invoiceData.totalWithVAT,
            vatAmount: invoiceData.vatAmount
        };

        // Convert to TLV format as per ZATCA requirements
        return this.encodeTLV(qrData);
    }

    /**
     * Encode data in TLV (Tag-Length-Value) format
     * @param {Object} data - Data to encode
     * @returns {string} - TLV encoded string
     */
    encodeTLV(data) {
        const tlvData = [];
        
        // Tag 1: Seller Name
        if (data.sellerName) {
            tlvData.push(this.createTLVEntry(1, data.sellerName));
        }
        
        // Tag 2: Seller VAT Number
        if (data.sellerVAT) {
            tlvData.push(this.createTLVEntry(2, data.sellerVAT));
        }
        
        // Tag 3: Invoice Date
        if (data.invoiceDate) {
            tlvData.push(this.createTLVEntry(3, data.invoiceDate));
        }
        
        // Tag 4: Total with VAT
        if (data.totalWithVAT) {
            tlvData.push(this.createTLVEntry(4, data.totalWithVAT.toString()));
        }
        
        // Tag 5: VAT Amount
        if (data.vatAmount) {
            tlvData.push(this.createTLVEntry(5, data.vatAmount.toString()));
        }

        return tlvData.join('');
    }

    /**
     * Create TLV entry
     * @param {number} tag - Tag number
     * @param {string} value - Value to encode
     * @returns {string} - TLV entry
     */
    createTLVEntry(tag, value) {
        const length = value.length;
        return `${tag}${length}${value}`;
    }

    /**
     * Generate UBL 2.1 XML for ZATCA compliance
     * @param {Object} invoiceData - Invoice data
     * @returns {string} - UBL XML string
     */
    generateUBLXML(invoiceData) {
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
         xmlns:ccts="urn:un:unece:uncefact:documentation:2"
         xmlns:qdt="urn:oasis:names:specification:ubl:schema:xsd:QualifiedDatatypes-2"
         xmlns:udt="urn:un:unece:uncefact:data:specification:UnqualifiedDataTypesSchemaModule:2">
    
    <!-- Invoice ID -->
    <cbc:ID>${invoiceData.invoiceNumber}</cbc:ID>
    
    <!-- Issue Date -->
    <cbc:IssueDate>${this.formatDateForXML(invoiceData.invoiceDate)}</cbc:IssueDate>
    
    <!-- Issue Time -->
    <cbc:IssueTime>${this.formatTimeForXML(invoiceData.invoiceDate)}</cbc:IssueTime>
    
    <!-- Invoice Type Code -->
    <cbc:InvoiceTypeCode>${invoiceData.invoiceType === 'B2B' ? '388' : '383'}</cbc:InvoiceTypeCode>
    
    <!-- Document Currency Code -->
    <cbc:DocumentCurrencyCode>${this.currency}</cbc:DocumentCurrencyCode>
    
    <!-- Tax Currency Code -->
    <cbc:TaxCurrencyCode>${this.currency}</cbc:TaxCurrencyCode>
    
    <!-- Accounting Cost Code -->
    <cbc:AccountingCostCode>${invoiceData.invoiceNumber}</cbc:AccountingCostCode>
    
    <!-- Line Count Numeric -->
    <cbc:LineCountNumeric>${invoiceData.lineItems.length}</cbc:LineCountNumeric>
    
    <!-- Seller Party -->
    <cac:AccountingSupplierParty>
        <cac:Party>
            <cac:PartyName>
                <cbc:Name>${this.escapeXML(invoiceData.seller.name)}</cbc:Name>
            </cac:PartyName>
            <cac:PostalAddress>
                <cbc:StreetName>${this.escapeXML(invoiceData.seller.address)}</cbc:StreetName>
                <cbc:CityName>Riyadh</cbc:CityName>
                <cbc:PostalZone>12345</cbc:PostalZone>
                <cac:Country>
                    <cbc:IdentificationCode>SA</cbc:IdentificationCode>
                </cac:Country>
            </cac:PostalAddress>
            <cac:PartyTaxScheme>
                <cac:TaxScheme>
                    <cbc:ID>${invoiceData.seller.vatNumber}</cbc:ID>
                </cac:TaxScheme>
            </cac:PartyTaxScheme>
        </cac:Party>
    </cac:AccountingSupplierParty>
    
    <!-- Buyer Party (B2B only) -->
    ${invoiceData.invoiceType === 'B2B' ? `
    <cac:AccountingCustomerParty>
        <cac:Party>
            <cac:PartyName>
                <cbc:Name>${this.escapeXML(invoiceData.buyer.name)}</cbc:Name>
            </cac:PartyName>
            <cac:PostalAddress>
                <cbc:StreetName>${this.escapeXML(invoiceData.buyer.address)}</cbc:StreetName>
                <cbc:CityName>Riyadh</cbc:CityName>
                <cbc:PostalZone>12345</cbc:PostalZone>
                <cac:Country>
                    <cbc:IdentificationCode>SA</cbc:IdentificationCode>
                </cac:Country>
            </cac:PostalAddress>
            <cac:PartyTaxScheme>
                <cac:TaxScheme>
                    <cbc:ID>${invoiceData.buyer.vatNumber}</cbc:ID>
                </cac:TaxScheme>
            </cac:PartyTaxScheme>
        </cac:Party>
    </cac:AccountingCustomerParty>
    ` : ''}
    
    <!-- Tax Total -->
    <cac:TaxTotal>
        <cbc:TaxAmount currencyID="${this.currency}">${invoiceData.vatAmount.toFixed(2)}</cbc:TaxAmount>
        <cac:TaxSubtotal>
            <cbc:TaxableAmount currencyID="${this.currency}">${invoiceData.subtotal.toFixed(2)}</cbc:TaxableAmount>
            <cbc:TaxAmount currencyID="${this.currency}">${invoiceData.vatAmount.toFixed(2)}</cbc:TaxAmount>
            <cac:TaxCategory>
                <cbc:ID>S</cbc:ID>
                <cbc:Percent>${this.vatRate}</cbc:Percent>
                <cac:TaxScheme>
                    <cbc:ID>VAT</cbc:ID>
                </cac:TaxScheme>
            </cac:TaxCategory>
        </cac:TaxSubtotal>
    </cac:TaxTotal>
    
    <!-- Legal Monetary Total -->
    <cac:LegalMonetaryTotal>
        <cbc:LineExtensionAmount currencyID="${this.currency}">${invoiceData.subtotal.toFixed(2)}</cbc:LineExtensionAmount>
        <cbc:TaxExclusiveAmount currencyID="${this.currency}">${invoiceData.subtotal.toFixed(2)}</cbc:TaxExclusiveAmount>
        <cbc:TaxInclusiveAmount currencyID="${this.currency}">${invoiceData.totalWithVAT.toFixed(2)}</cbc:TaxInclusiveAmount>
        <cbc:PayableAmount currencyID="${this.currency}">${invoiceData.totalWithVAT.toFixed(2)}</cbc:PayableAmount>
    </cac:LegalMonetaryTotal>
    
    <!-- Invoice Lines -->
    ${invoiceData.lineItems.map((item, index) => `
    <cac:InvoiceLine>
        <cbc:ID>${index + 1}</cbc:ID>
        <cbc:InvoicedQuantity unitCode="PCE">${item.quantity}</cbc:InvoicedQuantity>
        <cbc:LineExtensionAmount currencyID="${this.currency}">${(item.quantity * item.unitPrice).toFixed(2)}</cbc:LineExtensionAmount>
        <cac:TaxTotal>
            <cbc:TaxAmount currencyID="${this.currency}">${(item.quantity * item.unitPrice * this.vatRate / 100).toFixed(2)}</cbc:TaxAmount>
        </cac:TaxTotal>
        <cac:Item>
            <cbc:Description>${this.escapeXML(item.description)}</cbc:Description>
        </cac:Item>
        <cac:Price>
            <cbc:PriceAmount currencyID="${this.currency}">${item.unitPrice.toFixed(2)}</cbc:PriceAmount>
        </cac:Price>
    </cac:InvoiceLine>
    `).join('')}
    
</Invoice>`;

        return xml;
    }

    /**
     * Format date for XML
     * @param {string} dateString - Date string
     * @returns {string} - Formatted date
     */
    formatDateForXML(dateString) {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    }

    /**
     * Format time for XML
     * @param {string} dateString - Date string
     * @returns {string} - Formatted time
     */
    formatTimeForXML(dateString) {
        const date = new Date(dateString);
        return date.toISOString().split('T')[1].split('.')[0];
    }

    /**
     * Escape XML special characters
     * @param {string} text - Text to escape
     * @returns {string} - Escaped text
     */
    escapeXML(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /**
     * Calculate invoice totals
     * @param {Array} lineItems - Line items array
     * @returns {Object} - Calculated totals
     */
    calculateTotals(lineItems) {
        const subtotal = lineItems.reduce((sum, item) => {
            return sum + (item.quantity * item.unitPrice);
        }, 0);

        const vatAmount = subtotal * (this.vatRate / 100);
        const totalWithVAT = subtotal + vatAmount;

        return {
            subtotal: parseFloat(subtotal.toFixed(2)),
            vatAmount: parseFloat(vatAmount.toFixed(2)),
            totalWithVAT: parseFloat(totalWithVAT.toFixed(2))
        };
    }

    /**
     * Validate VAT number (Saudi Arabia format)
     * @param {string} vatNumber - VAT number to validate
     * @returns {boolean} - Is valid
     */
    validateVATNumber(vatNumber) {
        // Saudi Arabia VAT numbers are 15 digits
        const vatRegex = /^[0-9]{15}$/;
        return vatRegex.test(vatNumber);
    }

    /**
     * Generate invoice hash for immutability
     * @param {Object} invoiceData - Invoice data
     * @returns {string} - SHA-256 hash
     */
    generateInvoiceHash(invoiceData) {
        const dataString = JSON.stringify(invoiceData, Object.keys(invoiceData).sort());
        return CryptoJS.SHA256(dataString).toString();
    }

    /**
     * Create digital signature (placeholder for Phase 2)
     * @param {string} data - Data to sign
     * @returns {string} - Digital signature
     */
    createDigitalSignature(data) {
        // This is a placeholder for Phase 2 implementation
        // In production, this would use proper digital certificates
        return CryptoJS.HmacSHA256(data, 'placeholder-secret-key').toString();
    }

    /**
     * Save invoice counter to localStorage
     */
    saveInvoiceCounter() {
        localStorage.setItem('zatca_invoice_counter', this.invoiceCounter.toString());
    }

    /**
     * Load invoice counter from localStorage
     * @returns {number} - Invoice counter
     */
    loadInvoiceCounter() {
        const counter = localStorage.getItem('zatca_invoice_counter');
        return counter ? parseInt(counter) : 1;
    }

    /**
     * Save invoice to localStorage
     * @param {Object} invoiceData - Invoice data
     */
    saveInvoice(invoiceData) {
        const invoices = this.getInvoices();
        invoiceData.id = this.generateInvoiceHash(invoiceData);
        invoiceData.createdAt = new Date().toISOString();
        invoiceData.isImmutable = true;
        
        invoices.push(invoiceData);
        localStorage.setItem('zatca_invoices', JSON.stringify(invoices));
    }

    /**
     * Get all invoices from localStorage
     * @returns {Array} - Array of invoices
     */
    getInvoices() {
        const invoices = localStorage.getItem('zatca_invoices');
        return invoices ? JSON.parse(invoices) : [];
    }

    /**
     * Get invoice by ID
     * @param {string} invoiceId - Invoice ID
     * @returns {Object|null} - Invoice data or null
     */
    getInvoiceById(invoiceId) {
        const invoices = this.getInvoices();
        return invoices.find(invoice => invoice.id === invoiceId) || null;
    }

    /**
     * Delete invoice (only if not immutable)
     * @param {string} invoiceId - Invoice ID
     * @returns {boolean} - Success status
     */
    deleteInvoice(invoiceId) {
        const invoices = this.getInvoices();
        const invoiceIndex = invoices.findIndex(invoice => invoice.id === invoiceId);
        
        if (invoiceIndex === -1) return false;
        
        const invoice = invoices[invoiceIndex];
        if (invoice.isImmutable) {
            throw new Error('Cannot delete immutable invoice');
        }
        
        invoices.splice(invoiceIndex, 1);
        localStorage.setItem('zatca_invoices', JSON.stringify(invoices));
        return true;
    }

    /**
     * Generate audit log entry
     * @param {string} action - Action performed
     * @param {string} invoiceId - Invoice ID
     * @param {string} userId - User ID
     * @returns {Object} - Audit log entry
     */
    generateAuditLog(action, invoiceId, userId = 'system') {
        return {
            id: 'AUDIT-' + Date.now(),
            action: action,
            invoiceId: invoiceId,
            userId: userId,
            timestamp: new Date().toISOString(),
            ipAddress: '127.0.0.1' // Placeholder
        };
    }

    /**
     * Save audit log
     * @param {Object} auditEntry - Audit log entry
     */
    saveAuditLog(auditEntry) {
        const auditLogs = this.getAuditLogs();
        auditLogs.push(auditEntry);
        localStorage.setItem('zatca_audit_logs', JSON.stringify(auditLogs));
    }

    /**
     * Get audit logs
     * @returns {Array} - Array of audit logs
     */
    getAuditLogs() {
        const logs = localStorage.getItem('zatca_audit_logs');
        return logs ? JSON.parse(logs) : [];
    }

    /**
     * Format currency for display
     * @param {number} amount - Amount to format
     * @returns {string} - Formatted currency
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat('ar-SA', {
            style: 'currency',
            currency: this.currency,
            minimumFractionDigits: 2
        }).format(amount);
    }

    /**
     * Format date for display
     * @param {string} dateString - Date string
     * @returns {string} - Formatted date
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    /**
     * Format datetime for display
     * @param {string} dateString - Date string
     * @returns {string} - Formatted datetime
     */
    formatDateTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('ar-SA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// Export for use in other modules
window.ZATCAUtils = ZATCAUtils;
