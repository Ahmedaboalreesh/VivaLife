#!/usr/bin/env python3
"""
VivaLife Online Pharmacy API Server
Handles communication between the online store and pharmacy management system
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import json
import os
import datetime
import uuid
from pathlib import Path

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configuration
DATA_DIR = Path(__file__).parent / 'data'
DATA_DIR.mkdir(exist_ok=True)

ORDERS_FILE = DATA_DIR / 'orders.json'
PRODUCTS_FILE = DATA_DIR / 'products.json'
CONFIG_FILE = DATA_DIR / 'config.json'

# Initialize data files if they don't exist
def init_data_files():
    if not ORDERS_FILE.exists():
        with open(ORDERS_FILE, 'w') as f:
            json.dump([], f)
    
    if not PRODUCTS_FILE.exists():
        # Sample products data
        sample_products = [
            {
                "id": "PROD001",
                "name": "Paracetamol 500mg",
                "description": "Pain relief and fever reducer. Pack of 20 tablets.",
                "price": 15.00,
                "category": "medicines",
                "inStock": True,
                "prescription": False,
                "sku": "PAR500"
            },
            {
                "id": "PROD002",
                "name": "Vitamin D3 1000IU",
                "description": "Essential vitamin for bone health and immunity. 60 capsules.",
                "price": 45.00,
                "category": "vitamins",
                "inStock": True,
                "prescription": False,
                "sku": "VIT1000"
            }
        ]
        with open(PRODUCTS_FILE, 'w') as f:
            json.dump(sample_products, f, indent=2)
    
    if not CONFIG_FILE.exists():
        config = {
            "pharmacy_system_url": "http://localhost:3000",
            "api_key": "vivalife_api_key_2024",
            "auto_sync": True,
            "notification_enabled": True
        }
        with open(CONFIG_FILE, 'w') as f:
            json.dump(config, f, indent=2)

def load_json_file(file_path):
    """Load JSON data from file"""
    try:
        with open(file_path, 'r') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return []

def save_json_file(file_path, data):
    """Save JSON data to file"""
    with open(file_path, 'w') as f:
        json.dump(data, f, indent=2)

def generate_order_id():
    """Generate unique order ID"""
    timestamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
    random_id = str(uuid.uuid4())[:8]
    return f"WEB-{timestamp}-{random_id}"

# API Routes

@app.route('/')
def index():
    """API status endpoint"""
    return jsonify({
        "status": "online",
        "service": "VivaLife Online Pharmacy API",
        "version": "1.0.0",
        "timestamp": datetime.datetime.now().isoformat()
    })

@app.route('/api/products', methods=['GET'])
def get_products():
    """Get all available products"""
    try:
        products = load_json_file(PRODUCTS_FILE)
        
        # Apply filters if provided
        category = request.args.get('category')
        search = request.args.get('search', '').lower()
        
        if category:
            products = [p for p in products if p.get('category') == category]
        
        if search:
            products = [p for p in products if 
                       search in p.get('name', '').lower() or 
                       search in p.get('description', '').lower()]
        
        return jsonify({
            "success": True,
            "data": products,
            "count": len(products)
        })
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/products/<product_id>', methods=['GET'])
def get_product(product_id):
    """Get specific product by ID"""
    try:
        products = load_json_file(PRODUCTS_FILE)
        product = next((p for p in products if p['id'] == product_id), None)
        
        if not product:
            return jsonify({
                "success": False,
                "error": "Product not found"
            }), 404
        
        return jsonify({
            "success": True,
            "data": product
        })
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/orders', methods=['POST'])
def create_order():
    """Create new order from online store"""
    try:
        order_data = request.json
        
        # Validate required fields
        required_fields = ['customer', 'items', 'delivery', 'totals']
        for field in required_fields:
            if field not in order_data:
                return jsonify({
                    "success": False,
                    "error": f"Missing required field: {field}"
                }), 400
        
        # Generate order ID and add metadata
        order_id = generate_order_id()
        order = {
            "id": order_id,
            "orderNumber": order_id,
            "customerName": order_data['customer']['name'],
            "customerPhone": order_data['customer']['phone'],
            "customerEmail": order_data['customer'].get('email', ''),
            "customerAddress": order_data['delivery']['address'],
            "items": order_data['items'],
            "totalAmount": order_data['totals']['total'],
            "status": "pending",
            "priority": order_data.get('priority', 'normal'),
            "deliveryMethod": order_data['delivery']['method'],
            "deliveryTime": order_data['delivery'].get('time', 'Any Time'),
            "deliveryNotes": order_data['delivery'].get('notes', ''),
            "orderDate": datetime.datetime.now().isoformat(),
            "estimatedDelivery": calculate_estimated_delivery(order_data['delivery']['method']),
            "source": "online_store",
            "processed": False
        }
        
        # Save order
        orders = load_json_file(ORDERS_FILE)
        orders.append(order)
        save_json_file(ORDERS_FILE, orders)
        
        # Notify pharmacy system (if connected)
        notify_pharmacy_system(order)
        
        return jsonify({
            "success": True,
            "orderNumber": order_id,
            "estimatedDelivery": order["estimatedDelivery"],
            "message": "Order created successfully"
        })
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/orders', methods=['GET'])
def get_orders():
    """Get all orders (for pharmacy system)"""
    try:
        orders = load_json_file(ORDERS_FILE)
        
        # Apply filters
        status = request.args.get('status')
        unprocessed_only = request.args.get('unprocessed', 'false').lower() == 'true'
        
        if status:
            orders = [o for o in orders if o.get('status') == status]
        
        if unprocessed_only:
            orders = [o for o in orders if not o.get('processed', False)]
        
        return jsonify({
            "success": True,
            "data": orders,
            "count": len(orders)
        })
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/orders/<order_id>', methods=['PUT'])
def update_order(order_id):
    """Update order status (from pharmacy system)"""
    try:
        update_data = request.json
        orders = load_json_file(ORDERS_FILE)
        
        # Find and update order
        order_index = next((i for i, o in enumerate(orders) if o['id'] == order_id), None)
        
        if order_index is None:
            return jsonify({
                "success": False,
                "error": "Order not found"
            }), 404
        
        # Update order fields
        if 'status' in update_data:
            orders[order_index]['status'] = update_data['status']
        
        if 'processed' in update_data:
            orders[order_index]['processed'] = update_data['processed']
        
        if 'notes' in update_data:
            orders[order_index]['processingNotes'] = update_data['notes']
        
        orders[order_index]['lastUpdated'] = datetime.datetime.now().isoformat()
        
        save_json_file(ORDERS_FILE, orders)
        
        return jsonify({
            "success": True,
            "message": "Order updated successfully"
        })
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/sync/orders', methods=['POST'])
def sync_orders():
    """Sync orders with pharmacy system"""
    try:
        # This endpoint would be called by the pharmacy system
        # to synchronize order data
        
        sync_data = request.json
        orders = load_json_file(ORDERS_FILE)
        
        # Update orders based on sync data
        updated_count = 0
        for sync_order in sync_data.get('orders', []):
            order_index = next((i for i, o in enumerate(orders) if o['id'] == sync_order['id']), None)
            if order_index is not None:
                orders[order_index].update(sync_order)
                updated_count += 1
        
        save_json_file(ORDERS_FILE, orders)
        
        return jsonify({
            "success": True,
            "updated": updated_count,
            "message": f"Synchronized {updated_count} orders"
        })
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.datetime.now().isoformat(),
        "orders_count": len(load_json_file(ORDERS_FILE)),
        "products_count": len(load_json_file(PRODUCTS_FILE))
    })

# Utility functions

def calculate_estimated_delivery(delivery_method):
    """Calculate estimated delivery time"""
    now = datetime.datetime.now()
    
    if delivery_method == 'express':
        delivery_time = now + datetime.timedelta(hours=2)
    elif delivery_method == 'pickup':
        delivery_time = now + datetime.timedelta(hours=1)
    else:  # home-delivery
        delivery_time = now + datetime.timedelta(days=1)
    
    return delivery_time.isoformat()

def notify_pharmacy_system(order):
    """Notify the pharmacy system of new order"""
    try:
        # In a real implementation, this would make an HTTP request
        # to the pharmacy system's API endpoint
        
        config = load_json_file(CONFIG_FILE)
        if config.get('notification_enabled', True):
            print(f"📋 New order notification: {order['orderNumber']}")
            print(f"   Customer: {order['customerName']}")
            print(f"   Items: {len(order['items'])} items")
            print(f"   Total: ر.س {order['totalAmount']:.2f}")
            print(f"   Delivery: {order['deliveryMethod']}")
        
        return True
    
    except Exception as e:
        print(f"Failed to notify pharmacy system: {e}")
        return False

# Error handlers

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        "success": False,
        "error": "Endpoint not found"
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        "success": False,
        "error": "Internal server error"
    }), 500

# Static file serving for the online store
@app.route('/store')
def serve_store():
    """Serve the online store"""
    return send_from_directory('../', 'index.html')

@app.route('/store/<path:filename>')
def serve_store_files(filename):
    """Serve static files for the online store"""
    return send_from_directory('../', filename)

if __name__ == '__main__':
    # Initialize data files
    init_data_files()
    
    print("🚀 Starting VivaLife Online Pharmacy API Server...")
    print("📋 Online Store: http://localhost:5000/store")
    print("🔗 API Endpoint: http://localhost:5000/api")
    print("💊 Pharmacy System Integration: Ready")
    
    # Run the server
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True,
        threaded=True
    )
