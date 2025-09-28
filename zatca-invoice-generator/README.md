# ZATCA E-Invoice Generator

A comprehensive, ZATCA-compliant e-invoice generator for Saudi Arabia that creates PDF invoices with embedded XML and QR codes according to ZATCA (Zakat, Tax and Customs Authority) requirements.

## Features

### ✅ ZATCA Compliance
- **UBL 2.1 XML Schema**: Generates ZATCA-compliant XML structure
- **PDF/A-3 Format**: Embeds XML data for Phase 1 compliance
- **QR Code Generation**: TLV-encoded QR codes as per ZATCA requirements
- **Arabic & English Support**: Bilingual invoice generation
- **VAT Validation**: Saudi Arabia VAT number format validation

### 📋 Invoice Types
- **Tax Invoice (B2B)**: For business-to-business transactions
- **Simplified Tax Invoice (B2C)**: For business-to-consumer transactions

### 🔒 Security & Compliance
- **Immutable Invoices**: Prevents editing after generation
- **Sequential Numbering**: Enforces unique, sequential invoice numbers
- **Audit Logging**: Tracks all invoice operations
- **Digital Signatures**: Placeholder for Phase 2 implementation

### 🎨 User Interface
- **Bilingual Interface**: Arabic and English support
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Preview**: Preview invoices before generation
- **Invoice Management**: List, search, and manage generated invoices

## Installation

### Prerequisites
- Modern web browser with JavaScript enabled
- Local web server (for file access)

### Quick Start
1. Download all files to a directory
2. Serve the files using a local web server
3. Open `index.html` in your browser
4. Start creating ZATCA-compliant invoices!

### Using Python (Recommended)
```bash
# Navigate to the project directory
cd zatca-invoice-generator

# Start a local server
python -m http.server 8000

# Open in browser
# http://localhost:8000
```

### Using Node.js
```bash
# Install http-server globally
npm install -g http-server

# Navigate to the project directory
cd zatca-invoice-generator

# Start server
http-server

# Open in browser
# http://localhost:8080
```

## Usage

### Creating an Invoice

1. **Select Invoice Type**
   - Choose between B2B (Tax Invoice) or B2C (Simplified Tax Invoice)

2. **Enter Seller Information**
   - Seller name (required)
   - VAT registration number (15 digits, required)
   - Address (required)

3. **Enter Buyer Information** (B2B only)
   - Buyer name (required)
   - VAT registration number (15 digits, required)
   - Address (required)

4. **Add Line Items**
   - Product/service description
   - Quantity
   - Unit price
   - Tax rate (15%, 5%, or 0%)

5. **Preview & Generate**
   - Preview the invoice
   - Generate PDF with embedded XML
   - Download the invoice

### Managing Invoices

- **View All Invoices**: Browse generated invoices
- **Search Invoices**: Find invoices by number, seller, or buyer
- **Filter by Type**: Filter B2B or B2C invoices
- **Download PDFs**: Download invoice PDFs
- **Delete Drafts**: Remove non-immutable invoices

## Technical Details

### ZATCA Compliance Features

#### UBL 2.1 XML Structure
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2">
    <!-- ZATCA-compliant invoice structure -->
</Invoice>
```

#### QR Code TLV Format
The QR code contains TLV-encoded data:
- **Tag 1**: Seller Name
- **Tag 2**: Seller VAT Number
- **Tag 3**: Invoice Date
- **Tag 4**: Total with VAT
- **Tag 5**: VAT Amount

#### PDF/A-3 Compliance
- Embeds UBL XML as attachment
- Maintains document integrity
- Supports long-term archival

### File Structure
```
zatca-invoice-generator/
├── index.html              # Main application interface
├── styles.css              # Styling and responsive design
├── js/
│   ├── zatca-utils.js      # ZATCA compliance utilities
│   ├── invoice-generator.js # PDF generation and QR codes
│   └── app.js              # Main application logic
└── README.md               # This documentation
```

### Dependencies
- **jsPDF**: PDF generation
- **QRCode.js**: QR code generation
- **CryptoJS**: Hashing and encryption
- **Font Awesome**: Icons
- **Google Fonts (Cairo)**: Arabic font support

## Configuration

### Settings
Access settings through the Settings tab to configure:
- **Company Information**: Default seller details
- **Invoice Settings**: Prefix, VAT rate, currency
- **ZATCA Integration**: API endpoints for Phase 2

### Default Values
- **VAT Rate**: 15% (Saudi Arabia standard)
- **Currency**: SAR (Saudi Riyal)
- **Invoice Prefix**: INV
- **Language**: Arabic (RTL) with English support

## API Reference

### ZATCAUtils Class

#### Methods
```javascript
// Generate unique invoice number
generateInvoiceNumber(prefix)

// Generate QR code data
generateQRCodeData(invoiceData)

// Generate UBL XML
generateUBLXML(invoiceData)

// Calculate invoice totals
calculateTotals(lineItems)

// Validate VAT number
validateVATNumber(vatNumber)

// Save/load invoices
saveInvoice(invoiceData)
getInvoices()
getInvoiceById(invoiceId)
```

### InvoiceGenerator Class

#### Methods
```javascript
// Generate complete e-invoice
generateEInvoice(invoiceData)

// Generate PDF with embedded XML
generatePDF(invoiceData, qrData, ublXML)

// Preview invoice
previewInvoice(invoiceData)

// Download PDF
downloadPDF(pdfBlob, filename)
```

## ZATCA Phase 2 Integration

### Preparation for Phase 2
The system includes placeholders for ZATCA Phase 2 requirements:

- **Digital Signatures**: Framework for certificate-based signing
- **API Integration**: Endpoint configuration for Fatoora portal
- **Compliance Reporting**: Audit trail for ZATCA reporting

### Integration Endpoints
```javascript
// Configure ZATCA endpoints
const zatcaConfig = {
    endpoint: 'https://api.zatca.gov.sa/',
    apiKey: 'your-api-key',
    secret: 'your-secret-key'
};
```

## Security Considerations

### Data Protection
- **Local Storage**: All data stored locally in browser
- **No Server**: No data transmitted to external servers
- **Immutable Invoices**: Cannot be modified after generation
- **Audit Trail**: Complete operation logging

### Compliance Features
- **Sequential Numbering**: Prevents invoice number manipulation
- **Hash Generation**: SHA-256 hashing for integrity
- **Digital Signatures**: Ready for Phase 2 implementation

## Troubleshooting

### Common Issues

#### QR Code Not Generating
- Ensure QRCode.js library is loaded
- Check browser console for errors
- Verify invoice data is complete

#### PDF Generation Fails
- Check jsPDF library is loaded
- Ensure all required fields are filled
- Verify browser supports blob downloads

#### Arabic Text Not Displaying
- Ensure Cairo font is loaded
- Check browser supports RTL text
- Verify UTF-8 encoding

### Browser Compatibility
- **Chrome**: 80+ (Recommended)
- **Firefox**: 75+
- **Safari**: 13+
- **Edge**: 80+

## Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Code Style
- Use ES6+ JavaScript features
- Follow camelCase naming convention
- Add comments for complex logic
- Maintain Arabic/English bilingual support

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review ZATCA documentation for compliance questions

## Changelog

### Version 1.0.0
- Initial release
- ZATCA Phase 1 compliance
- B2B and B2C invoice support
- PDF generation with embedded XML
- QR code generation
- Arabic/English bilingual support
- Invoice management system
- Audit logging
- Immutable invoice protection

## Roadmap

### Phase 2 Features (Coming Soon)
- Digital signature implementation
- ZATCA API integration
- Real-time compliance validation
- Advanced reporting features
- Multi-currency support
- Batch invoice processing

---

**Note**: This system is designed for ZATCA Phase 1 compliance. For Phase 2 requirements, additional integration with ZATCA's Fatoora portal will be necessary.
