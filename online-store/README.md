# VivaLife Online Pharmacy Store

A complete e-commerce website for the VivaLife Pharmacy that integrates seamlessly with the main pharmacy management system.

## Features

### 🛒 Customer Features
- **Product Catalog**: Browse medications, vitamins, and health products
- **Smart Search**: Search by product name, category, or description
- **Shopping Cart**: Add/remove items, adjust quantities
- **Multiple Delivery Options**: Home delivery, express delivery, store pickup
- **Order Tracking**: Real-time order status updates
- **Prescription Support**: Upload prescriptions for prescription medications
- **Mobile Responsive**: Works perfectly on all devices

### 💊 Pharmacy Integration
- **Real-time Order Sync**: Orders automatically appear in pharmacy system
- **Inventory Management**: Integrated with main inventory system
- **Order Processing**: Complete workflow from order to delivery
- **Customer Management**: Integrated customer database
- **Reporting**: Order analytics and reporting

### 🔧 Technical Features
- **RESTful API**: Clean API for pharmacy system integration
- **Local Storage**: Offline cart persistence
- **Real-time Updates**: Live order status notifications
- **Secure**: Input validation and sanitization
- **Scalable**: Modular architecture for easy expansion

## Setup Instructions

### Prerequisites
- Python 3.8 or higher
- Modern web browser
- VivaLife Pharmacy Management System (for full integration)

### Installation

1. **Navigate to the online store directory:**
   ```bash
   cd online-store
   ```

2. **Install Python dependencies:**
   ```bash
   cd api
   pip install -r requirements.txt
   ```

3. **Start the API server:**
   ```bash
   python server.py
   ```

4. **Access the online store:**
   - Open your browser and go to: `http://localhost:5000/store`
   - API documentation: `http://localhost:5000/api`

### Integration with Pharmacy System

The online store automatically integrates with the main pharmacy system through:

1. **Shared Local Storage**: Orders are stored in localStorage for immediate access
2. **API Endpoints**: RESTful API for order management
3. **Event System**: Custom events notify the pharmacy system of new orders
4. **Data Synchronization**: Automatic sync of orders and inventory

## File Structure

```
online-store/
├── index.html              # Main store webpage
├── css/
│   └── styles.css          # All styling
├── js/
│   ├── main.js            # Main application logic
│   ├── products.js        # Product management
│   ├── cart.js            # Shopping cart functionality
│   └── checkout.js        # Checkout process
├── api/
│   ├── server.py          # Flask API server
│   ├── requirements.txt   # Python dependencies
│   └── data/              # Data storage (auto-created)
├── images/                # Product images (optional)
└── README.md              # This file
```

## API Endpoints

### Products
- `GET /api/products` - Get all products
- `GET /api/products/{id}` - Get specific product
- `GET /api/products?category={category}` - Filter by category
- `GET /api/products?search={term}` - Search products

### Orders
- `POST /api/orders` - Create new order
- `GET /api/orders` - Get all orders (pharmacy system)
- `PUT /api/orders/{id}` - Update order status
- `POST /api/sync/orders` - Sync orders with pharmacy system

### System
- `GET /api/health` - Health check
- `GET /` - API status

## Usage Examples

### Customer Workflow
1. **Browse Products**: Customer visits the online store
2. **Add to Cart**: Select products and add to shopping cart
3. **Checkout**: Enter delivery information and place order
4. **Confirmation**: Receive order confirmation with tracking number
5. **Updates**: Get SMS/email updates on order status

### Pharmacy Workflow
1. **Receive Order**: New orders appear in the pharmacy system
2. **Process Order**: Staff prepare medications and update status
3. **Dispatch**: Order is prepared for delivery or pickup
4. **Complete**: Order is delivered and marked as complete

## Configuration

### API Server Configuration
Edit `api/data/config.json`:
```json
{
  "pharmacy_system_url": "http://localhost:3000",
  "api_key": "your_api_key",
  "auto_sync": true,
  "notification_enabled": true
}
```

### Customization
- **Products**: Edit `js/products.js` to modify product catalog
- **Styling**: Customize `css/styles.css` for branding
- **Features**: Extend functionality in respective JS files

## Integration Examples

### Adding New Products
```javascript
// In products.js
const newProduct = {
    id: 'PROD016',
    name: 'New Medicine',
    description: 'Product description',
    price: 50.00,
    category: 'medicines',
    inStock: true,
    prescription: false
};
```

### Handling Orders in Pharmacy System
```javascript
// Listen for new orders
window.addEventListener('newOnlineOrder', (event) => {
    const order = event.detail;
    // Process order in pharmacy system
    pharmacySystem.addOnlineOrder(order);
});
```

## Security Considerations

- Input validation on all forms
- Sanitization of user data
- Secure API endpoints
- HTTPS recommended for production
- Regular security updates

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- Optimized for fast loading
- Lazy loading of products
- Efficient cart management
- Minimal API calls
- Responsive images

## Troubleshooting

### Common Issues

1. **API Server Not Starting**
   - Check Python installation
   - Verify port 5000 is available
   - Install dependencies: `pip install -r requirements.txt`

2. **Orders Not Syncing**
   - Check localStorage permissions
   - Verify pharmacy system is running
   - Check browser console for errors

3. **Products Not Loading**
   - Check API server status
   - Verify products.js file
   - Check browser network tab

### Debug Mode
Enable debug mode by adding `?debug=true` to the URL for detailed logging.

## Support

For technical support or integration assistance:
- Check the pharmacy system documentation
- Review browser console for errors
- Verify API server logs
- Test with sample data

## License

This software is part of the VivaLife Pharmacy Management System.
© 2024 VivaLife Pharmacy. All rights reserved.

## Version History

- **v1.0.0** - Initial release with core e-commerce features
- **v1.0.1** - Added prescription support and enhanced UI
- **v1.0.2** - Improved pharmacy system integration
- **v1.1.0** - Added real-time notifications and order tracking
