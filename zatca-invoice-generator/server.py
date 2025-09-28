#!/usr/bin/env python3
"""
Simple HTTP server for ZATCA E-Invoice Generator
Serves the application on localhost:8000
"""

import http.server
import socketserver
import webbrowser
import os
import sys
from pathlib import Path

# Configuration
PORT = 8000
HOST = 'localhost'

class CORSHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """HTTP request handler with CORS support"""
    
    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def do_OPTIONS(self):
        # Handle preflight requests
        self.send_response(200)
        self.end_headers()

def main():
    """Start the HTTP server"""
    # Change to the directory containing this script
    script_dir = Path(__file__).parent
    os.chdir(script_dir)
    
    # Check if index.html exists
    if not os.path.exists('index.html'):
        print("Error: index.html not found in current directory")
        print("Please run this script from the zatca-invoice-generator directory")
        sys.exit(1)
    
    # Create server
    with socketserver.TCPServer((HOST, PORT), CORSHTTPRequestHandler) as httpd:
        print(f"ZATCA E-Invoice Generator Server")
        print(f"=================================")
        print(f"Server running at: http://{HOST}:{PORT}")
        print(f"Press Ctrl+C to stop the server")
        print(f"Opening browser...")
        
        # Open browser
        try:
            webbrowser.open(f'http://{HOST}:{PORT}')
        except Exception as e:
            print(f"Could not open browser automatically: {e}")
            print(f"Please open http://{HOST}:{PORT} manually")
        
        # Start server
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print(f"\nServer stopped by user")
            httpd.shutdown()

if __name__ == '__main__':
    main()
