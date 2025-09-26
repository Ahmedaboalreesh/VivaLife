# VivaLife Pharmacy Management System

A comprehensive web-based pharmacy management system designed for community pharmacies to manage inventory, staff, and product dispensing operations.

## Features

### 🏥 Dashboard
- Real-time overview of pharmacy operations
- Key statistics: total products, low stock items, daily dispensing count, active staff
- Interactive charts showing dispensing trends
- Low stock alerts and notifications

### 📦 Inventory Management
- Complete product catalog management
- Add, edit, and delete products
- Track stock levels and set minimum stock alerts
- Category-based organization (Prescription, OTC, Medical Supplies)
- Expiry date tracking
- Advanced search and filtering capabilities

### 💊 Product Dispensing
- Barcode scanning support for quick product lookup
- Product search with autocomplete suggestions
- Shopping cart interface for multiple items
- Real-time stock validation
- Automatic inventory deduction upon dispensing
- Dispensing history tracking

### 👥 Staff Management
- Add and manage pharmacy staff members
- Role-based access (Pharmacist, Technician, Assistant, Manager)
- Staff ID generation and contact information
- Staff activity tracking

### 📊 Reports & Analytics
- Dispensing activity reports
- Inventory movement tracking
- Staff performance monitoring
- Export capabilities for external analysis

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Charts**: Chart.js for data visualization
- **Icons**: Font Awesome 6.0
- **Storage**: Local Storage for data persistence
- **Design**: Responsive design with modern UI/UX

## Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- No server setup required - runs entirely in the browser

### Installation
1. Download all files to a local directory
2. Open `index.html` in your web browser
3. The system will automatically initialize with sample data

### First Time Setup
The system comes pre-loaded with sample data including:
- Sample products (Paracetamol, Ibuprofen, Vitamin C, Bandages)
- Sample staff members
- Default user session

## Usage Guide

### Adding Products
1. Navigate to the **Inventory** section
2. Click **"Add Product"** button
3. Fill in product details:
   - Product Name
   - Category (Prescription/OTC/Medical Supplies)
   - SKU/Barcode
   - Current Stock
   - Minimum Stock Level
   - Unit Price
   - Expiry Date (optional)
4. Click **"Save Product"**

### Dispensing Products
1. Go to the **Dispensing** section
2. Use one of these methods to add products:
   - **Barcode Scanner**: Enter product SKU in the barcode input field
   - **Product Search**: Type product name in the search field
3. Adjust quantities using +/- buttons
4. Click **"Process Dispensing"** to complete the transaction
5. Stock levels will be automatically updated

### Managing Staff
1. Navigate to **Staff Management**
2. Click **"Add Staff"** to add new team members
3. Fill in staff information:
   - Full Name
   - Role (Pharmacist/Technician/Assistant/Manager)
   - Staff ID (auto-generated)
   - Email and Phone
4. Click **"Save Staff"**

### Monitoring Operations
- **Dashboard**: View key metrics and recent activity
- **Inventory**: Monitor stock levels and low stock alerts
- **Reports**: Generate various operational reports

## Data Storage

The system uses browser's Local Storage to persist data:
- All data is stored locally on your computer
- No external servers or cloud storage required
- Data persists between browser sessions
- Backup: Export data regularly for safety

## Security Features

- Local data storage (no external data transmission)
- Input validation and sanitization
- Role-based access control
- Session management
- Data integrity checks

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Customization

### Adding New Product Categories
Edit the category options in:
- `index.html` (modal forms)
- `script.js` (filter functionality)

### Modifying Staff Roles
Update role options in:
- `index.html` (staff modal)
- `script.js` (role validation)

### Styling Changes
Modify `styles.css` to customize:
- Color scheme
- Layout dimensions
- Typography
- Component styling

## Troubleshooting

### Common Issues

**Data Not Persisting**
- Ensure browser allows local storage
- Check if private/incognito mode is disabled
- Clear browser cache and reload

**Charts Not Displaying**
- Verify internet connection (Chart.js CDN)
- Check browser console for JavaScript errors

**Barcode Scanning Not Working**
- Ensure barcode input field is focused
- Check that product SKU exists in inventory
- Verify barcode format matches stored SKUs

### Performance Optimization
- Clear old dispensing history periodically
- Limit product catalog size for better performance
- Use modern browsers for optimal experience

## Support

For technical support or feature requests:
1. Check the troubleshooting section
2. Review browser console for error messages
3. Ensure all files are properly downloaded and accessible

## License

This software is provided as-is for educational and commercial use within community pharmacy operations.

---

**VivaLife Pharmacy Management System** - Streamlining pharmacy operations with modern technology.
