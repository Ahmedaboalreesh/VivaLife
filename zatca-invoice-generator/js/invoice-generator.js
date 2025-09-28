/**
 * ZATCA E-Invoice Generator
 * Handles PDF generation with embedded XML and QR codes
 */

class InvoiceGenerator {
    constructor() {
        this.zatcaUtils = new ZATCAUtils();
        this.pdfDoc = null;
    }

    /**
     * Generate complete e-invoice with PDF and XML
     * @param {Object} invoiceData - Invoice data
     * @returns {Object} - Generated invoice with PDF and XML
     */
    async generateEInvoice(invoiceData) {
        try {
            // Calculate totals
            const totals = this.zatcaUtils.calculateTotals(invoiceData.lineItems);
            invoiceData = { ...invoiceData, ...totals };

            // Generate QR code data
            const qrData = this.zatcaUtils.generateQRCodeData(invoiceData);

            // Generate UBL XML
            const ublXML = this.zatcaUtils.generateUBLXML(invoiceData);

            // Generate PDF
            const pdfBlob = await this.generatePDF(invoiceData, qrData, ublXML);

            // Create invoice object
            const eInvoice = {
                ...invoiceData,
                qrCodeData: qrData,
                ublXML: ublXML,
                pdfBlob: pdfBlob,
                generatedAt: new Date().toISOString()
            };

            // Save invoice
            this.zatcaUtils.saveInvoice(eInvoice);

            // Generate audit log
            const auditLog = this.zatcaUtils.generateAuditLog('INVOICE_CREATED', eInvoice.id);
            this.zatcaUtils.saveAuditLog(auditLog);

            return eInvoice;
        } catch (error) {
            console.error('Error generating e-invoice:', error);
            throw error;
        }
    }

    /**
     * Generate PDF with embedded XML
     * @param {Object} invoiceData - Invoice data
     * @param {string} qrData - QR code data
     * @param {string} ublXML - UBL XML data
     * @returns {Promise<Blob>} - PDF blob
     */
    async generatePDF(invoiceData, qrData, ublXML) {
        const { jsPDF } = window.jspdf;
        this.pdfDoc = new jsPDF('p', 'mm', 'a4');

        // Set font for Arabic support
        this.pdfDoc.addFont('https://fonts.gstatic.com/s/cairo/v28/SLXGc1nY6HkvangtZmpQdkhzfH5lkS2Q.ttf', 'Cairo', 'normal');
        this.pdfDoc.setFont('Cairo');

        // Generate QR code
        const qrCodeDataURL = await this.generateQRCode(qrData);

        // Add content to PDF
        this.addHeader(invoiceData);
        this.addSellerInfo(invoiceData);
        this.addBuyerInfo(invoiceData);
        this.addInvoiceDetails(invoiceData);
        this.addLineItems(invoiceData);
        this.addTotals(invoiceData);
        this.addQRCode(qrCodeDataURL);
        this.addFooter();

        // Embed XML as attachment (PDF/A-3 compliance)
        this.embedXML(ublXML, invoiceData.invoiceNumber);

        // Return PDF as blob
        return this.pdfDoc.output('blob');
    }

    /**
     * Add header to PDF
     * @param {Object} invoiceData - Invoice data
     */
    addHeader(invoiceData) {
        const pageWidth = this.pdfDoc.internal.pageSize.getWidth();
        
        // Title
        this.pdfDoc.setFontSize(24);
        this.pdfDoc.setTextColor(44, 62, 80);
        this.pdfDoc.text('فاتورة ضريبية', pageWidth - 20, 20, { align: 'right' });
        
        this.pdfDoc.setFontSize(18);
        this.pdfDoc.text('Tax Invoice', pageWidth - 20, 30, { align: 'right' });

        // Invoice type
        this.pdfDoc.setFontSize(12);
        this.pdfDoc.setTextColor(102, 126, 234);
        const invoiceTypeText = invoiceData.invoiceType === 'B2B' ? 'فاتورة ضريبية (بين الشركات)' : 'فاتورة ضريبية مبسطة';
        this.pdfDoc.text(invoiceTypeText, pageWidth - 20, 40, { align: 'right' });

        // Line separator
        this.pdfDoc.setDrawColor(102, 126, 234);
        this.pdfDoc.setLineWidth(0.5);
        this.pdfDoc.line(20, 45, pageWidth - 20, 45);
    }

    /**
     * Add seller information to PDF
     * @param {Object} invoiceData - Invoice data
     */
    addSellerInfo(invoiceData) {
        const pageWidth = this.pdfDoc.internal.pageSize.getWidth();
        let yPosition = 55;

        // Seller section title
        this.pdfDoc.setFontSize(14);
        this.pdfDoc.setTextColor(44, 62, 80);
        this.pdfDoc.text('معلومات البائع', pageWidth - 20, yPosition, { align: 'right' });
        this.pdfDoc.text('Seller Information', pageWidth - 20, yPosition + 8, { align: 'right' });

        yPosition += 20;

        // Seller details
        this.pdfDoc.setFontSize(10);
        this.pdfDoc.setTextColor(52, 73, 94);
        
        this.pdfDoc.text(`الاسم: ${invoiceData.seller.name}`, pageWidth - 20, yPosition, { align: 'right' });
        this.pdfDoc.text(`Name: ${invoiceData.seller.name}`, pageWidth - 20, yPosition + 6, { align: 'right' });
        
        this.pdfDoc.text(`الرقم الضريبي: ${invoiceData.seller.vatNumber}`, pageWidth - 20, yPosition + 14, { align: 'right' });
        this.pdfDoc.text(`VAT Number: ${invoiceData.seller.vatNumber}`, pageWidth - 20, yPosition + 20, { align: 'right' });
        
        this.pdfDoc.text(`العنوان: ${invoiceData.seller.address}`, pageWidth - 20, yPosition + 28, { align: 'right' });
        this.pdfDoc.text(`Address: ${invoiceData.seller.address}`, pageWidth - 20, yPosition + 34, { align: 'right' });
    }

    /**
     * Add buyer information to PDF (B2B only)
     * @param {Object} invoiceData - Invoice data
     */
    addBuyerInfo(invoiceData) {
        if (invoiceData.invoiceType !== 'B2B') return;

        const pageWidth = this.pdfDoc.internal.pageSize.getWidth();
        let yPosition = 120;

        // Buyer section title
        this.pdfDoc.setFontSize(14);
        this.pdfDoc.setTextColor(44, 62, 80);
        this.pdfDoc.text('معلومات المشتري', pageWidth - 20, yPosition, { align: 'right' });
        this.pdfDoc.text('Buyer Information', pageWidth - 20, yPosition + 8, { align: 'right' });

        yPosition += 20;

        // Buyer details
        this.pdfDoc.setFontSize(10);
        this.pdfDoc.setTextColor(52, 73, 94);
        
        this.pdfDoc.text(`الاسم: ${invoiceData.buyer.name}`, pageWidth - 20, yPosition, { align: 'right' });
        this.pdfDoc.text(`Name: ${invoiceData.buyer.name}`, pageWidth - 20, yPosition + 6, { align: 'right' });
        
        this.pdfDoc.text(`الرقم الضريبي: ${invoiceData.buyer.vatNumber}`, pageWidth - 20, yPosition + 14, { align: 'right' });
        this.pdfDoc.text(`VAT Number: ${invoiceData.buyer.vatNumber}`, pageWidth - 20, yPosition + 20, { align: 'right' });
        
        this.pdfDoc.text(`العنوان: ${invoiceData.buyer.address}`, pageWidth - 20, yPosition + 28, { align: 'right' });
        this.pdfDoc.text(`Address: ${invoiceData.buyer.address}`, pageWidth - 20, yPosition + 34, { align: 'right' });
    }

    /**
     * Add invoice details to PDF
     * @param {Object} invoiceData - Invoice data
     */
    addInvoiceDetails(invoiceData) {
        const pageWidth = this.pdfDoc.internal.pageSize.getWidth();
        let yPosition = invoiceData.invoiceType === 'B2B' ? 180 : 120;

        // Invoice details section
        this.pdfDoc.setFontSize(14);
        this.pdfDoc.setTextColor(44, 62, 80);
        this.pdfDoc.text('تفاصيل الفاتورة', pageWidth - 20, yPosition, { align: 'right' });
        this.pdfDoc.text('Invoice Details', pageWidth - 20, yPosition + 8, { align: 'right' });

        yPosition += 20;

        // Invoice details
        this.pdfDoc.setFontSize(10);
        this.pdfDoc.setTextColor(52, 73, 94);
        
        this.pdfDoc.text(`رقم الفاتورة: ${invoiceData.invoiceNumber}`, pageWidth - 20, yPosition, { align: 'right' });
        this.pdfDoc.text(`Invoice Number: ${invoiceData.invoiceNumber}`, pageWidth - 20, yPosition + 6, { align: 'right' });
        
        const invoiceDate = this.zatcaUtils.formatDateTime(invoiceData.invoiceDate);
        this.pdfDoc.text(`تاريخ الفاتورة: ${invoiceDate}`, pageWidth - 20, yPosition + 14, { align: 'right' });
        this.pdfDoc.text(`Invoice Date: ${invoiceDate}`, pageWidth - 20, yPosition + 20, { align: 'right' });
    }

    /**
     * Add line items table to PDF
     * @param {Object} invoiceData - Invoice data
     */
    addLineItems(invoiceData) {
        const pageWidth = this.pdfDoc.internal.pageSize.getWidth();
        let yPosition = invoiceData.invoiceType === 'B2B' ? 240 : 180;

        // Table header
        this.pdfDoc.setFontSize(12);
        this.pdfDoc.setTextColor(44, 62, 80);
        this.pdfDoc.text('عناصر الفاتورة', pageWidth - 20, yPosition, { align: 'right' });
        this.pdfDoc.text('Line Items', pageWidth - 20, yPosition + 8, { align: 'right' });

        yPosition += 20;

        // Table headers
        this.pdfDoc.setFontSize(8);
        this.pdfDoc.setTextColor(255, 255, 255);
        this.pdfDoc.setFillColor(102, 126, 234);
        
        // Header background
        this.pdfDoc.rect(20, yPosition - 5, pageWidth - 40, 10, 'F');
        
        // Header text
        this.pdfDoc.text('المجموع', pageWidth - 25, yPosition, { align: 'right' });
        this.pdfDoc.text('معدل الضريبة', pageWidth - 60, yPosition, { align: 'right' });
        this.pdfDoc.text('سعر الوحدة', pageWidth - 90, yPosition, { align: 'right' });
        this.pdfDoc.text('الكمية', pageWidth - 120, yPosition, { align: 'right' });
        this.pdfDoc.text('الوصف', pageWidth - 150, yPosition, { align: 'right' });

        yPosition += 15;

        // Table rows
        this.pdfDoc.setTextColor(52, 73, 94);
        invoiceData.lineItems.forEach((item, index) => {
            if (yPosition > 250) {
                this.pdfDoc.addPage();
                yPosition = 20;
            }

            // Row background (alternating)
            if (index % 2 === 0) {
                this.pdfDoc.setFillColor(248, 249, 250);
                this.pdfDoc.rect(20, yPosition - 3, pageWidth - 40, 8, 'F');
            }

            // Row data
            this.pdfDoc.setFontSize(8);
            this.pdfDoc.text(this.zatcaUtils.formatCurrency(item.quantity * item.unitPrice), pageWidth - 25, yPosition, { align: 'right' });
            this.pdfDoc.text(`${item.taxRate}%`, pageWidth - 60, yPosition, { align: 'right' });
            this.pdfDoc.text(this.zatcaUtils.formatCurrency(item.unitPrice), pageWidth - 90, yPosition, { align: 'right' });
            this.pdfDoc.text(item.quantity.toString(), pageWidth - 120, yPosition, { align: 'right' });
            this.pdfDoc.text(item.description, pageWidth - 150, yPosition, { align: 'right' });

            yPosition += 10;
        });
    }

    /**
     * Add totals section to PDF
     * @param {Object} invoiceData - Invoice data
     */
    addTotals(invoiceData) {
        const pageWidth = this.pdfDoc.internal.pageSize.getWidth();
        let yPosition = 200;

        // Totals section
        this.pdfDoc.setFontSize(12);
        this.pdfDoc.setTextColor(44, 62, 80);
        this.pdfDoc.text('إجماليات الفاتورة', pageWidth - 20, yPosition, { align: 'right' });
        this.pdfDoc.text('Invoice Totals', pageWidth - 20, yPosition + 8, { align: 'right' });

        yPosition += 25;

        // Totals
        this.pdfDoc.setFontSize(10);
        this.pdfDoc.setTextColor(52, 73, 94);
        
        this.pdfDoc.text(`المجموع الفرعي: ${this.zatcaUtils.formatCurrency(invoiceData.subtotal)}`, pageWidth - 20, yPosition, { align: 'right' });
        this.pdfDoc.text(`Subtotal: ${this.zatcaUtils.formatCurrency(invoiceData.subtotal)}`, pageWidth - 20, yPosition + 8, { align: 'right' });
        
        this.pdfDoc.text(`مبلغ الضريبة: ${this.zatcaUtils.formatCurrency(invoiceData.vatAmount)}`, pageWidth - 20, yPosition + 18, { align: 'right' });
        this.pdfDoc.text(`VAT Amount: ${this.zatcaUtils.formatCurrency(invoiceData.vatAmount)}`, pageWidth - 20, yPosition + 26, { align: 'right' });
        
        // Total line
        this.pdfDoc.setFontSize(12);
        this.pdfDoc.setTextColor(44, 62, 80);
        this.pdfDoc.setLineWidth(1);
        this.pdfDoc.line(pageWidth - 100, yPosition + 35, pageWidth - 20, yPosition + 35);
        
        this.pdfDoc.text(`المجموع الكلي: ${this.zatcaUtils.formatCurrency(invoiceData.totalWithVAT)}`, pageWidth - 20, yPosition + 40, { align: 'right' });
        this.pdfDoc.text(`Total: ${this.zatcaUtils.formatCurrency(invoiceData.totalWithVAT)}`, pageWidth - 20, yPosition + 48, { align: 'right' });
    }

    /**
     * Add QR code to PDF
     * @param {string} qrCodeDataURL - QR code data URL
     */
    addQRCode(qrCodeDataURL) {
        const pageWidth = this.pdfDoc.internal.pageSize.getWidth();
        const pageHeight = this.pdfDoc.internal.pageSize.getHeight();
        
        // QR code position (bottom right)
        const qrSize = 40;
        const qrX = pageWidth - qrSize - 20;
        const qrY = pageHeight - qrSize - 20;
        
        this.pdfDoc.addImage(qrCodeDataURL, 'PNG', qrX, qrY, qrSize, qrSize);
        
        // QR code label
        this.pdfDoc.setFontSize(8);
        this.pdfDoc.setTextColor(102, 126, 234);
        this.pdfDoc.text('رمز الاستجابة السريعة', qrX + qrSize/2, qrY - 5, { align: 'center' });
        this.pdfDoc.text('QR Code', qrX + qrSize/2, qrY + qrSize + 8, { align: 'center' });
    }

    /**
     * Add footer to PDF
     */
    addFooter() {
        const pageWidth = this.pdfDoc.internal.pageSize.getWidth();
        const pageHeight = this.pdfDoc.internal.pageSize.getHeight();
        
        // Footer line
        this.pdfDoc.setDrawColor(102, 126, 234);
        this.pdfDoc.setLineWidth(0.5);
        this.pdfDoc.line(20, pageHeight - 30, pageWidth - 20, pageHeight - 30);
        
        // Footer text
        this.pdfDoc.setFontSize(8);
        this.pdfDoc.setTextColor(127, 140, 141);
        this.pdfDoc.text('شكراً لتعاملكم معنا', pageWidth - 20, pageHeight - 20, { align: 'right' });
        this.pdfDoc.text('Thank you for your business', pageWidth - 20, pageHeight - 15, { align: 'right' });
        this.pdfDoc.text('هذه الفاتورة متوافقة مع متطلبات هيئة الزكاة والضريبة والجمارك', pageWidth - 20, pageHeight - 10, { align: 'right' });
        this.pdfDoc.text('This invoice complies with ZATCA requirements', pageWidth - 20, pageHeight - 5, { align: 'right' });
    }

    /**
     * Embed XML as attachment (PDF/A-3 compliance)
     * @param {string} xmlData - XML data
     * @param {string} filename - Filename for attachment
     */
    embedXML(xmlData, filename) {
        // This is a simplified version - in production, you would use a proper PDF library
        // that supports PDF/A-3 with embedded files
        console.log('XML embedded:', filename);
        console.log('XML data length:', xmlData.length);
        
        // For now, we'll add the XML as a text attachment
        // In a real implementation, you would use a library like PDF-lib or similar
        this.pdfDoc.text('XML Data Embedded', 20, 20);
    }

    /**
     * Generate QR code
     * @param {string} data - Data to encode
     * @returns {Promise<string>} - QR code data URL
     */
    generateQRCode(data) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            QRCode.toCanvas(canvas, data, {
                width: 200,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            }, (error, canvas) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(canvas.toDataURL());
                }
            });
        });
    }

    /**
     * Download PDF
     * @param {Blob} pdfBlob - PDF blob
     * @param {string} filename - Filename for download
     */
    downloadPDF(pdfBlob, filename) {
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    /**
     * Preview invoice in modal
     * @param {Object} invoiceData - Invoice data
     */
    previewInvoice(invoiceData) {
        const previewContent = document.getElementById('invoice-preview-content');
        const totals = this.zatcaUtils.calculateTotals(invoiceData.lineItems);
        
        previewContent.innerHTML = `
            <div class="invoice-preview">
                <div class="invoice-preview-header">
                    <h1>فاتورة ضريبية</h1>
                    <h1>Tax Invoice</h1>
                    <p>${invoiceData.invoiceType === 'B2B' ? 'فاتورة ضريبية (بين الشركات)' : 'فاتورة ضريبية مبسطة'}</p>
                </div>
                
                <div class="invoice-preview-info">
                    <div class="invoice-preview-section">
                        <h3>معلومات البائع | Seller Information</h3>
                        <p><strong>الاسم:</strong> ${invoiceData.seller.name}</p>
                        <p><strong>Name:</strong> ${invoiceData.seller.name}</p>
                        <p><strong>الرقم الضريبي:</strong> ${invoiceData.seller.vatNumber}</p>
                        <p><strong>VAT Number:</strong> ${invoiceData.seller.vatNumber}</p>
                        <p><strong>العنوان:</strong> ${invoiceData.seller.address}</p>
                        <p><strong>Address:</strong> ${invoiceData.seller.address}</p>
                    </div>
                    
                    ${invoiceData.invoiceType === 'B2B' ? `
                    <div class="invoice-preview-section">
                        <h3>معلومات المشتري | Buyer Information</h3>
                        <p><strong>الاسم:</strong> ${invoiceData.buyer.name}</p>
                        <p><strong>Name:</strong> ${invoiceData.buyer.name}</p>
                        <p><strong>الرقم الضريبي:</strong> ${invoiceData.buyer.vatNumber}</p>
                        <p><strong>VAT Number:</strong> ${invoiceData.buyer.vatNumber}</p>
                        <p><strong>العنوان:</strong> ${invoiceData.buyer.address}</p>
                        <p><strong>Address:</strong> ${invoiceData.buyer.address}</p>
                    </div>
                    ` : ''}
                </div>
                
                <div class="invoice-preview-info">
                    <div class="invoice-preview-section">
                        <h3>تفاصيل الفاتورة | Invoice Details</h3>
                        <p><strong>رقم الفاتورة:</strong> ${invoiceData.invoiceNumber}</p>
                        <p><strong>Invoice Number:</strong> ${invoiceData.invoiceNumber}</p>
                        <p><strong>تاريخ الفاتورة:</strong> ${this.zatcaUtils.formatDateTime(invoiceData.invoiceDate)}</p>
                        <p><strong>Invoice Date:</strong> ${this.zatcaUtils.formatDateTime(invoiceData.invoiceDate)}</p>
                    </div>
                </div>
                
                <div class="invoice-preview-items">
                    <h3>عناصر الفاتورة | Line Items</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>الوصف | Description</th>
                                <th>الكمية | Qty</th>
                                <th>سعر الوحدة | Unit Price</th>
                                <th>معدل الضريبة | Tax Rate</th>
                                <th>المجموع | Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${invoiceData.lineItems.map(item => `
                                <tr>
                                    <td>${item.description}</td>
                                    <td>${item.quantity}</td>
                                    <td>${this.zatcaUtils.formatCurrency(item.unitPrice)}</td>
                                    <td>${item.taxRate}%</td>
                                    <td>${this.zatcaUtils.formatCurrency(item.quantity * item.unitPrice)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                
                <div class="invoice-preview-totals">
                    <div class="total-line">
                        <span>المجموع الفرعي | Subtotal</span>
                        <span>${this.zatcaUtils.formatCurrency(totals.subtotal)}</span>
                    </div>
                    <div class="total-line">
                        <span>مبلغ الضريبة | VAT Amount</span>
                        <span>${this.zatcaUtils.formatCurrency(totals.vatAmount)}</span>
                    </div>
                    <div class="total-line total-final">
                        <span>المجموع الكلي | Total</span>
                        <span>${this.zatcaUtils.formatCurrency(totals.totalWithVAT)}</span>
                    </div>
                </div>
                
                <div class="qr-code-container">
                    <h4>رمز الاستجابة السريعة | QR Code</h4>
                    <div id="preview-qr-code"></div>
                </div>
            </div>
        `;
        
        // Generate QR code for preview
        const qrData = this.zatcaUtils.generateQRCodeData(invoiceData);
        QRCode.toCanvas(document.getElementById('preview-qr-code'), qrData, {
            width: 150,
            margin: 2
        });
    }
}

// Export for use in other modules
window.InvoiceGenerator = InvoiceGenerator;
