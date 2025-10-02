"""
POS System Integration Service

This module handles integration with various POS systems used in pharmacies.
It provides a unified interface for different POS vendors and handles
real-time inventory synchronization.
"""

import asyncio
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any
from sqlalchemy.orm import Session

from database.database import get_db_session
from database.models import (
    Transaction, TransactionItem, InventoryItem, Drug, 
    Pharmacy, SyncLog, TransactionStatus, SyncStatus
)
from services.wasfaty_client import wasfaty_client
from services.sync_service import SyncService


logger = logging.getLogger(__name__)


class POSIntegrationError(Exception):
    """Custom exception for POS integration errors"""
    pass


class POSService:
    """
    POS System Integration Service
    Handles communication with pharmacy POS systems and synchronization
    """
    
    def __init__(self):
        self.sync_service = SyncService()
    
    async def process_pos_sale(
        self, 
        pharmacy_id: str, 
        sale_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Process a sale from POS system and sync with Wasfaty
        
        Args:
            pharmacy_id: Pharmacy identifier
            sale_data: Sale transaction data from POS
            
        Returns:
            Dict containing processing result and sync status
        """
        try:
            with get_db_session() as db:
                # Create transaction record
                transaction = await self._create_transaction_record(
                    db, pharmacy_id, sale_data
                )
                
                # Update local inventory
                inventory_updates = await self._update_local_inventory(
                    db, pharmacy_id, sale_data['items']
                )
                
                # Sync with Wasfaty asynchronously
                sync_task = asyncio.create_task(
                    self._sync_pos_sale_with_wasfaty(
                        pharmacy_id, transaction.id, sale_data
                    )
                )
                
                logger.info(f"Processed POS sale {transaction.transaction_number}")
                
                return {
                    "success": True,
                    "transaction_id": str(transaction.id),
                    "transaction_number": transaction.transaction_number,
                    "inventory_updates": len(inventory_updates),
                    "sync_initiated": True
                }
                
        except Exception as e:
            logger.error(f"Failed to process POS sale: {e}")
            raise POSIntegrationError(f"POS sale processing failed: {e}")
    
    async def _create_transaction_record(
        self, 
        db: Session, 
        pharmacy_id: str, 
        sale_data: Dict
    ) -> Transaction:
        """Create transaction record in database"""
        
        # Generate transaction number
        transaction_number = self._generate_transaction_number(pharmacy_id)
        
        # Create main transaction
        transaction = Transaction(
            transaction_number=transaction_number,
            pharmacy_id=pharmacy_id,
            transaction_type="pos_sale",
            status=TransactionStatus.COMPLETED,
            customer_name=sale_data.get('customer_name'),
            customer_phone=sale_data.get('customer_phone'),
            subtotal=sale_data.get('subtotal', 0),
            tax_amount=sale_data.get('tax_amount', 0),
            discount_amount=sale_data.get('discount_amount', 0),
            total_amount=sale_data.get('total_amount', 0),
            payment_method=sale_data.get('payment_method'),
            payment_reference=sale_data.get('payment_reference'),
            cashier_id=sale_data.get('cashier_id'),
            pos_transaction_id=sale_data.get('pos_transaction_id'),
            sync_status=SyncStatus.PENDING
        )
        
        db.add(transaction)
        db.flush()  # Get the ID
        
        # Create transaction items
        for item_data in sale_data.get('items', []):
            # Find drug by barcode or SKU
            drug = db.query(Drug).filter(
                (Drug.barcode == item_data.get('barcode')) |
                (Drug.pos_drug_id == item_data.get('drug_id'))
            ).first()
            
            if not drug:
                logger.warning(f"Drug not found for barcode/ID: {item_data.get('barcode', item_data.get('drug_id'))}")
                continue
            
            transaction_item = TransactionItem(
                transaction_id=transaction.id,
                drug_id=drug.id,
                quantity=item_data['quantity'],
                unit_price=item_data['unit_price'],
                total_price=item_data['total_price'],
                batch_number=item_data.get('batch_number'),
                expiry_date=item_data.get('expiry_date')
            )
            
            db.add(transaction_item)
        
        db.commit()
        return transaction
    
    async def _update_local_inventory(
        self, 
        db: Session, 
        pharmacy_id: str, 
        items: List[Dict]
    ) -> List[Dict]:
        """Update local inventory after POS sale"""
        
        inventory_updates = []
        
        for item_data in items:
            # Find drug
            drug = db.query(Drug).filter(
                (Drug.barcode == item_data.get('barcode')) |
                (Drug.pos_drug_id == item_data.get('drug_id'))
            ).first()
            
            if not drug:
                continue
            
            # Find inventory item
            inventory_item = db.query(InventoryItem).filter(
                InventoryItem.pharmacy_id == pharmacy_id,
                InventoryItem.drug_id == drug.id
            ).first()
            
            if inventory_item:
                # Update stock
                old_stock = inventory_item.current_stock
                inventory_item.current_stock -= item_data['quantity']
                inventory_item.sync_status = SyncStatus.PENDING
                inventory_item.updated_at = datetime.utcnow()
                
                inventory_updates.append({
                    "drug_id": str(drug.id),
                    "drug_name": drug.name,
                    "barcode": drug.barcode,
                    "old_stock": old_stock,
                    "new_stock": inventory_item.current_stock,
                    "quantity_sold": item_data['quantity']
                })
                
                logger.info(f"Updated inventory for {drug.name}: {old_stock} -> {inventory_item.current_stock}")
        
        db.commit()
        return inventory_updates
    
    async def _sync_pos_sale_with_wasfaty(
        self, 
        pharmacy_id: str, 
        transaction_id: str, 
        sale_data: Dict
    ):
        """Sync POS sale with Wasfaty system asynchronously"""
        
        try:
            # Prepare data for Wasfaty
            wasfaty_data = {
                "pharmacy_id": pharmacy_id,
                "transaction_id": str(transaction_id),
                "transaction_type": "pos_sale",
                "timestamp": datetime.utcnow().isoformat(),
                "items": []
            }
            
            # Convert items to Wasfaty format
            with get_db_session() as db:
                for item_data in sale_data.get('items', []):
                    drug = db.query(Drug).filter(
                        (Drug.barcode == item_data.get('barcode')) |
                        (Drug.pos_drug_id == item_data.get('drug_id'))
                    ).first()
                    
                    if drug and drug.wasfaty_drug_id:
                        wasfaty_data["items"].append({
                            "wasfaty_drug_id": drug.wasfaty_drug_id,
                            "quantity_sold": item_data['quantity'],
                            "unit_price": item_data['unit_price'],
                            "batch_number": item_data.get('batch_number')
                        })
            
            # Send to Wasfaty
            async with wasfaty_client as client:
                response = await client.report_pos_transaction(wasfaty_data)
            
            # Update sync status
            with get_db_session() as db:
                transaction = db.query(Transaction).filter(
                    Transaction.id == transaction_id
                ).first()
                
                if transaction:
                    transaction.sync_status = SyncStatus.COMPLETED
                    transaction.last_sync_at = datetime.utcnow()
                    transaction.wasfaty_transaction_id = response.get('wasfaty_transaction_id')
                
                # Log sync success
                sync_log = SyncLog(
                    pharmacy_id=pharmacy_id,
                    sync_type="pos_sale_sync",
                    entity_type="transaction",
                    entity_id=str(transaction_id),
                    direction="pos_to_wasfaty",
                    status=SyncStatus.COMPLETED,
                    request_data=wasfaty_data,
                    response_data=response,
                    completed_at=datetime.utcnow()
                )
                db.add(sync_log)
                db.commit()
            
            logger.info(f"Successfully synced POS sale {transaction_id} with Wasfaty")
            
        except Exception as e:
            logger.error(f"Failed to sync POS sale with Wasfaty: {e}")
            
            # Update sync status to failed
            with get_db_session() as db:
                transaction = db.query(Transaction).filter(
                    Transaction.id == transaction_id
                ).first()
                
                if transaction:
                    transaction.sync_status = SyncStatus.FAILED
                    transaction.sync_attempts += 1
                    transaction.error_message = str(e)
                
                # Log sync failure
                sync_log = SyncLog(
                    pharmacy_id=pharmacy_id,
                    sync_type="pos_sale_sync",
                    entity_type="transaction",
                    entity_id=str(transaction_id),
                    direction="pos_to_wasfaty",
                    status=SyncStatus.FAILED,
                    request_data=wasfaty_data if 'wasfaty_data' in locals() else None,
                    error_message=str(e),
                    completed_at=datetime.utcnow()
                )
                db.add(sync_log)
                db.commit()
    
    async def validate_pos_transaction(
        self, 
        pharmacy_id: str, 
        transaction_data: Dict
    ) -> Dict[str, Any]:
        """
        Validate POS transaction before processing
        
        Args:
            pharmacy_id: Pharmacy identifier
            transaction_data: Transaction data to validate
            
        Returns:
            Dict containing validation result
        """
        validation_result = {
            "is_valid": True,
            "errors": [],
            "warnings": []
        }
        
        try:
            with get_db_session() as db:
                # Check if pharmacy exists and is active
                pharmacy = db.query(Pharmacy).filter(
                    Pharmacy.id == pharmacy_id,
                    Pharmacy.is_active == True
                ).first()
                
                if not pharmacy:
                    validation_result["is_valid"] = False
                    validation_result["errors"].append("Invalid or inactive pharmacy")
                    return validation_result
                
                # Validate transaction items
                for item in transaction_data.get('items', []):
                    # Check if drug exists
                    drug = db.query(Drug).filter(
                        (Drug.barcode == item.get('barcode')) |
                        (Drug.pos_drug_id == item.get('drug_id'))
                    ).first()
                    
                    if not drug:
                        validation_result["errors"].append(
                            f"Drug not found: {item.get('barcode', item.get('drug_id'))}"
                        )
                        continue
                    
                    # Check inventory availability
                    inventory = db.query(InventoryItem).filter(
                        InventoryItem.pharmacy_id == pharmacy_id,
                        InventoryItem.drug_id == drug.id
                    ).first()
                    
                    if not inventory:
                        validation_result["warnings"].append(
                            f"No inventory record for {drug.name}"
                        )
                    elif inventory.current_stock < item['quantity']:
                        validation_result["warnings"].append(
                            f"Insufficient stock for {drug.name}: {inventory.current_stock} available, {item['quantity']} requested"
                        )
                    
                    # Check if prescription is required
                    if drug.is_prescription_required and not transaction_data.get('prescription_id'):
                        validation_result["errors"].append(
                            f"Prescription required for {drug.name}"
                        )
                
                if validation_result["errors"]:
                    validation_result["is_valid"] = False
                
                return validation_result
                
        except Exception as e:
            logger.error(f"Transaction validation failed: {e}")
            validation_result["is_valid"] = False
            validation_result["errors"].append(f"Validation error: {e}")
            return validation_result
    
    def _generate_transaction_number(self, pharmacy_id: str) -> str:
        """Generate unique transaction number"""
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        pharmacy_code = pharmacy_id[-4:].upper()  # Last 4 chars of pharmacy ID
        return f"POS-{pharmacy_code}-{timestamp}"
    
    async def get_transaction_status(
        self, 
        transaction_id: str
    ) -> Dict[str, Any]:
        """
        Get transaction status and sync information
        
        Args:
            transaction_id: Transaction identifier
            
        Returns:
            Dict containing transaction status
        """
        try:
            with get_db_session() as db:
                transaction = db.query(Transaction).filter(
                    Transaction.id == transaction_id
                ).first()
                
                if not transaction:
                    return {"error": "Transaction not found"}
                
                return {
                    "transaction_id": str(transaction.id),
                    "transaction_number": transaction.transaction_number,
                    "status": transaction.status,
                    "sync_status": transaction.sync_status,
                    "sync_attempts": transaction.sync_attempts,
                    "last_sync_at": transaction.last_sync_at.isoformat() if transaction.last_sync_at else None,
                    "wasfaty_transaction_id": transaction.wasfaty_transaction_id,
                    "error_message": transaction.error_message,
                    "created_at": transaction.created_at.isoformat()
                }
                
        except Exception as e:
            logger.error(f"Failed to get transaction status: {e}")
            return {"error": str(e)}
    
    async def retry_failed_sync(self, transaction_id: str) -> Dict[str, Any]:
        """
        Retry synchronization for failed transactions
        
        Args:
            transaction_id: Transaction identifier
            
        Returns:
            Dict containing retry result
        """
        try:
            with get_db_session() as db:
                transaction = db.query(Transaction).filter(
                    Transaction.id == transaction_id,
                    Transaction.sync_status == SyncStatus.FAILED
                ).first()
                
                if not transaction:
                    return {"error": "Transaction not found or not in failed state"}
                
                # Reset sync status
                transaction.sync_status = SyncStatus.PENDING
                transaction.error_message = None
                db.commit()
                
                # Retry sync
                sale_data = {
                    "items": [
                        {
                            "drug_id": item.drug.pos_drug_id,
                            "barcode": item.drug.barcode,
                            "quantity": item.quantity,
                            "unit_price": float(item.unit_price),
                            "batch_number": item.batch_number
                        }
                        for item in transaction.transaction_items
                    ]
                }
                
                await self._sync_pos_sale_with_wasfaty(
                    str(transaction.pharmacy_id), 
                    str(transaction.id), 
                    sale_data
                )
                
                return {"success": True, "message": "Sync retry initiated"}
                
        except Exception as e:
            logger.error(f"Failed to retry sync: {e}")
            return {"error": str(e)}
