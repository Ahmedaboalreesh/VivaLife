# Wasfaty-POS Integration System

A comprehensive solution for integrating community pharmacy Point of Sale (POS) systems with Saudi Arabia's Wasfaty electronic prescription system.

## Features

- **Bi-directional Inventory Sync**: Automatic inventory updates between POS and Wasfaty
- **Prescription Validation**: Real-time prescription authenticity and validity checks
- **Secure API Communication**: JWT authentication with encryption protocols
- **Transaction Logging**: Comprehensive audit trails for all system interactions
- **Multi-pharmacy Support**: Scalable architecture for multiple pharmacy locations
- **Real-time Notifications**: Instant updates for stock changes and prescription events

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Pharmacy POS  │◄──►│  Integration    │◄──►│   Wasfaty API   │
│     System      │    │    Gateway      │    │     System      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         └──────────────►│   Database      │◄─────────────┘
                        │   (PostgreSQL)  │
                        └─────────────────┘
```

## Quick Start

1. Install dependencies: `pip install -r requirements.txt`
2. Set up database: `python setup_database.py`
3. Configure environment: Copy `.env.example` to `.env` and update values
4. Run the server: `python main.py`

## API Documentation

Once running, visit `http://localhost:8000/docs` for interactive API documentation.
