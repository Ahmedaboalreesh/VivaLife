"""
Synchronization Service

This module handles bi-directional synchronization between POS and Wasfaty systems.
It manages prescription dispensing, inventory updates, and maintains data consistency.
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from database.database import get_db_session
from database.models import (
    Prescription, PrescriptionItem, Transaction, TransactionItem,
    InventoryItem, Drug, Pharmacy, SyncLog, 
    PrescriptionStatus, TransactionStatus, SyncStatus
)
from services.wasfaty_client import wasfaty_client, WasfatyAPIError


logger = logging.getLogger(__name__)


class SyncServiceError(Exception):
    """Custom exception for sync service errors"""
    pass


class SyncService:
    """
    Synchronization service for bi-directional data sync
    between POS and Wasfaty systems
    """
    
    def __init__(self):
        self.max_retry_attempts = 3
        self.retry_delay_seconds = 60
    
    async def process_wasfaty_prescription(
        self, 
        prescription_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Process prescription dispensing from Wasfaty and update POS inventory
        
        Args:
            prescription_data: Prescription data from Wasfaty webhook
            
        Returns:
            Dict containing processing result
        """
        try:
            with get_db_session() as db:
                # Validate prescription
                validation_result = await self._validate_prescription(
                    prescription_data
                )
                
                if not validation_result["is_valid"]:
                    return {
                        "success": False,
                        "error": "Prescription validation failed",
                        "details": validation_result["errors"]
                    }
                
                # Create or update prescription record
                prescription = await self._create_or_update_prescription(
                    db, prescription_data
                )
                
                # Check inventory availability
                availability_check = await self._check_inventory_availability(
                    db, prescription
                )
                
                if not availability_check["available"]:
                    return {
                        "success": False,
                        "error": "Insufficient inventory",
                        "details": availability_check["missing_items"]
                    }
                
                # Create dispensing transaction
                transaction = await self._create_dispensing_transaction(
                    db, prescription, prescription_data
                )
                
                # Update inventory
                inventory_updates = await self._update_inventory_for_dispensing(
                    db, prescription, transaction
                )
                
                # Mark prescription as dispensed
                prescription.status = PrescriptionStatus.DISPENSED
                prescription.dispensed_date = datetime.utcnow()
                
                db.commit()
                
                logger.info(f"Successfully processed Wasfaty prescription {prescription.wasfaty_prescription_id}")
                
                return {
                    "success": True,
                    "prescription_id": str(prescription.id),
                    "transaction_id": str(transaction.id),
                    "inventory_updates": len(inventory_updates)
                }
                
        except Exception as e:
            logger.error(f"Failed to process Wasfaty prescription: {e}")
            raise SyncServiceError(f"Prescription processing failed: {e}")
    
    async def _validate_prescription(
        self, 
        prescription_data: Dict
    ) -> Dict[str, Any]:
        """Validate prescription data and authenticity"""
        
        validation_result = {
            "is_valid": True,
            "errors": [],
            "warnings": []
        }
        
        try:
            # Validate with Wasfaty API
            async with wasfaty_client as client:
                wasfaty_validation = await client.validate_prescription(
                    prescription_data["prescription_id"],
                    prescription_data["pharmacy_id"]
                )
                
                if not wasfaty_validation.get("is_valid"):
                    validation_result["is_valid"] = False
                    validation_result["errors"].append("Prescription not valid in Wasfaty system")
                    return validation_result
            
            # Check expiry date
            expiry_date = datetime.fromisoformat(prescription_data["expiry_date"])
            if expiry_date < datetime.utcnow():
                validation_result["is_valid"] = False
                validation_result["errors"].append("Prescription has expired")
            
            # Validate prescription items
            if not prescription_data.get("items"):
                validation_result["is_valid"] = False
                validation_result["errors"].append("Prescription has no items")
            
            return validation_result
            
        except WasfatyAPIError as e:
            validation_result["is_valid"] = False
            validation_result["errors"].append(f"Wasfaty validation failed: {e}")
            return validation_result
        
        except Exception as e:
            logger.error(f"Prescription validation error: {e}")
            validation_result["is_valid"] = False
            validation_result["errors"].append(f"Validation error: {e}")
            return validation_result
    
    async def _create_or_update_prescription(
        self, 
        db: Session, 
        prescription_data: Dict
    ) -> Prescription:
        """Create or update prescription record"""
        
        # Check if prescription already exists
        existing_prescription = db.query(Prescription).filter(
            Prescription.wasfaty_prescription_id == prescription_data["prescription_id"]
        ).first()
        
        if existing_prescription:
            # Update existing prescription
            existing_prescription.status = PrescriptionStatus.ACTIVE
            existing_prescription.updated_at = datetime.utcnow()
            return existing_prescription
        
        # Create new prescription
        prescription = Prescription(
            wasfaty_prescription_id=prescription_data["prescription_id"],
            pharmacy_id=prescription_data["pharmacy_id"],
            patient_id=prescription_data.get("patient_id"),
            patient_name=prescription_data.get("patient_name"),
            patient_phone=prescription_data.get("patient_phone"),
            doctor_name=prescription_data.get("doctor_name"),
            doctor_license=prescription_data.get("doctor_license"),
            prescription_date=datetime.fromisoformat(prescription_data["prescription_date"]),
            expiry_date=datetime.fromisoformat(prescription_data["expiry_date"]),
            status=PrescriptionStatus.ACTIVE,
            is_validated=True,
            validation_date=datetime.utcnow(),
            total_amount=prescription_data.get("total_amount", 0),
            copay_amount=prescription_data.get("copay_amount", 0),
            insurance_amount=prescription_data.get("insurance_amount", 0),
            notes=prescription_data.get("notes")
        )
        
        db.add(prescription)
        db.flush()  # Get the ID
        
        # Create prescription items
        for item_data in prescription_data.get("items", []):
            # Find drug by Wasfaty ID
            drug = db.query(Drug).filter(
                Drug.wasfaty_drug_id == item_data["wasfaty_drug_id"]
            ).first()
            
            if not drug:
                logger.warning(f"Drug not found for Wasfaty ID: {item_data['wasfaty_drug_id']}")
                continue
            
            prescription_item = PrescriptionItem(
                prescription_id=prescription.id,
                drug_id=drug.id,
                prescribed_quantity=item_data["quantity"],
                unit_price=item_data.get("unit_price", drug.unit_price),
                total_price=item_data["quantity"] * item_data.get("unit_price", drug.unit_price or 0),
                dosage_instructions=item_data.get("dosage_instructions"),
                is_substitutable=item_data.get("is_substitutable", False)
            )
            
            db.add(prescription_item)
        
        return prescription
    
    async def _check_inventory_availability(
        self, 
        db: Session, 
        prescription: Prescription
    ) -> Dict[str, Any]:
        """Check if all prescription items are available in inventory"""
        
        availability_result = {
            "available": True,
            "missing_items": [],
            "low_stock_items": []
        }
        
        for item in prescription.prescription_items:
            inventory = db.query(InventoryItem).filter(
                InventoryItem.pharmacy_id == prescription.pharmacy_id,
                InventoryItem.drug_id == item.drug_id
            ).first()
            
            if not inventory:
                availability_result["available"] = False
                availability_result["missing_items"].append({
                    "drug_name": item.drug.name,
                    "required_quantity": item.prescribed_quantity,
                    "available_quantity": 0
                })
            elif inventory.current_stock < item.prescribed_quantity:
                availability_result["available"] = False
                availability_result["missing_items"].append({
                    "drug_name": item.drug.name,
                    "required_quantity": item.prescribed_quantity,
                    "available_quantity": inventory.current_stock
                })
            elif inventory.current_stock <= inventory.minimum_stock:
                availability_result["low_stock_items"].append({
                    "drug_name": item.drug.name,
                    "current_stock": inventory.current_stock,
                    "minimum_stock": inventory.minimum_stock
                })
        
        return availability_result
    
    async def _create_dispensing_transaction(
        self, 
        db: Session, 
        prescription: Prescription, 
        prescription_data: Dict
    ) -> Transaction:
        """Create transaction record for prescription dispensing"""
        
        transaction_number = self._generate_transaction_number(
            str(prescription.pharmacy_id), "WASFATY"
        )
        
        transaction = Transaction(
            transaction_number=transaction_number,
            pharmacy_id=prescription.pharmacy_id,
            prescription_id=prescription.id,
            transaction_type="wasfaty_dispense",
            status=TransactionStatus.COMPLETED,
            customer_name=prescription.patient_name,
            customer_phone=prescription.patient_phone,
            subtotal=prescription.total_amount or 0,
            total_amount=prescription.total_amount or 0,
            payment_method="insurance",
            wasfaty_transaction_id=prescription_data.get("transaction_id"),
            sync_status=SyncStatus.COMPLETED
        )
        
        db.add(transaction)
        db.flush()
        
        # Create transaction items
        for prescription_item in prescription.prescription_items:
            transaction_item = TransactionItem(
                transaction_id=transaction.id,
                drug_id=prescription_item.drug_id,
                quantity=prescription_item.prescribed_quantity,
                unit_price=prescription_item.unit_price or 0,
                total_price=prescription_item.total_price or 0
            )
            
            db.add(transaction_item)
            
            # Update prescription item dispensed quantity
            prescription_item.dispensed_quantity = prescription_item.prescribed_quantity
        
        return transaction
    
    async def _update_inventory_for_dispensing(
        self, 
        db: Session, 
        prescription: Prescription, 
        transaction: Transaction
    ) -> List[Dict]:
        """Update inventory after prescription dispensing"""
        
        inventory_updates = []
        
        for item in prescription.prescription_items:
            inventory = db.query(InventoryItem).filter(
                InventoryItem.pharmacy_id == prescription.pharmacy_id,
                InventoryItem.drug_id == item.drug_id
            ).first()
            
            if inventory:
                old_stock = inventory.current_stock
                inventory.current_stock -= item.prescribed_quantity
                inventory.updated_at = datetime.utcnow()
                
                inventory_updates.append({
                    "drug_id": str(item.drug_id),
                    "drug_name": item.drug.name,
                    "old_stock": old_stock,
                    "new_stock": inventory.current_stock,
                    "quantity_dispensed": item.prescribed_quantity
                })
                
                logger.info(f"Updated inventory for {item.drug.name}: {old_stock} -> {inventory.current_stock}")
        
        return inventory_updates
    
    async def sync_pending_transactions(self) -> Dict[str, Any]:
        """
        Sync all pending transactions with Wasfaty
        Called periodically to handle failed syncs
        """
        sync_results = {
            "processed": 0,
            "successful": 0,
            "failed": 0,
            "errors": []
        }
        
        try:
            with get_db_session() as db:
                # Get pending transactions
                pending_transactions = db.query(Transaction).filter(
                    and_(
                        Transaction.sync_status == SyncStatus.PENDING,
                        Transaction.sync_attempts < self.max_retry_attempts
                    )
                ).limit(50).all()  # Process in batches
                
                for transaction in pending_transactions:
                    sync_results["processed"] += 1
                    
                    try:
                        if transaction.transaction_type == "pos_sale":
                            await self._retry_pos_sale_sync(transaction)
                        elif transaction.transaction_type == "wasfaty_dispense":
                            await self._retry_wasfaty_dispense_sync(transaction)
                        
                        sync_results["successful"] += 1
                        
                    except Exception as e:
                        sync_results["failed"] += 1
                        sync_results["errors"].append({
                            "transaction_id": str(transaction.id),
                            "error": str(e)
                        })
                        
                        # Update retry count
                        transaction.sync_attempts += 1
                        transaction.error_message = str(e)
                        
                        if transaction.sync_attempts >= self.max_retry_attempts:
                            transaction.sync_status = SyncStatus.FAILED
                
                db.commit()
                
        except Exception as e:
            logger.error(f"Sync pending transactions failed: {e}")
            sync_results["errors"].append({"general_error": str(e)})
        
        return sync_results
    
    async def _retry_pos_sale_sync(self, transaction: Transaction):
        """Retry POS sale synchronization with Wasfaty"""
        
        # Prepare transaction data for Wasfaty
        wasfaty_data = {
            "pharmacy_id": str(transaction.pharmacy_id),
            "transaction_id": str(transaction.id),
            "transaction_type": "pos_sale",
            "timestamp": transaction.created_at.isoformat(),
            "items": []
        }
        
        # Add transaction items
        for item in transaction.transaction_items:
            if item.drug.wasfaty_drug_id:
                wasfaty_data["items"].append({
                    "wasfaty_drug_id": item.drug.wasfaty_drug_id,
                    "quantity_sold": item.quantity,
                    "unit_price": float(item.unit_price),
                    "batch_number": item.batch_number
                })
        
        # Send to Wasfaty
        async with wasfaty_client as client:
            response = await client.report_pos_transaction(wasfaty_data)
        
        # Update transaction
        transaction.sync_status = SyncStatus.COMPLETED
        transaction.last_sync_at = datetime.utcnow()
        transaction.wasfaty_transaction_id = response.get("wasfaty_transaction_id")
        transaction.error_message = None
    
    async def _retry_wasfaty_dispense_sync(self, transaction: Transaction):
        """Retry Wasfaty dispense synchronization"""
        
        if not transaction.prescription:
            raise SyncServiceError("No prescription associated with transaction")
        
        # Prepare dispensed items data
        dispensed_items = []
        for item in transaction.transaction_items:
            if item.drug.wasfaty_drug_id:
                dispensed_items.append({
                    "wasfaty_drug_id": item.drug.wasfaty_drug_id,
                    "quantity_dispensed": item.quantity,
                    "unit_price": float(item.unit_price),
                    "batch_number": item.batch_number
                })
        
        # Mark as dispensed in Wasfaty
        async with wasfaty_client as client:
            response = await client.mark_prescription_dispensed(
                transaction.prescription.wasfaty_prescription_id,
                dispensed_items,
                str(transaction.pharmacy_id),
                str(transaction.id)
            )
        
        # Update transaction
        transaction.sync_status = SyncStatus.COMPLETED
        transaction.last_sync_at = datetime.utcnow()
        transaction.error_message = None
    
    def _generate_transaction_number(self, pharmacy_id: str, prefix: str) -> str:
        """Generate unique transaction number"""
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        pharmacy_code = pharmacy_id[-4:].upper()
        return f"{prefix}-{pharmacy_code}-{timestamp}"
    
    async def get_sync_status_report(
        self, 
        pharmacy_id: Optional[str] = None,
        hours: int = 24
    ) -> Dict[str, Any]:
        """
        Generate synchronization status report
        
        Args:
            pharmacy_id: Optional pharmacy filter
            hours: Hours to look back for report
            
        Returns:
            Dict containing sync status report
        """
        try:
            with get_db_session() as db:
                # Base query
                query = db.query(SyncLog)
                
                # Apply filters
                if pharmacy_id:
                    query = query.filter(SyncLog.pharmacy_id == pharmacy_id)
                
                # Time filter
                since_time = datetime.utcnow() - timedelta(hours=hours)
                query = query.filter(SyncLog.created_at >= since_time)
                
                sync_logs = query.all()
                
                # Calculate statistics
                total_syncs = len(sync_logs)
                successful_syncs = len([log for log in sync_logs if log.status == SyncStatus.COMPLETED])
                failed_syncs = len([log for log in sync_logs if log.status == SyncStatus.FAILED])
                pending_syncs = len([log for log in sync_logs if log.status == SyncStatus.PENDING])
                
                # Group by sync type
                sync_types = {}
                for log in sync_logs:
                    if log.sync_type not in sync_types:
                        sync_types[log.sync_type] = {"total": 0, "successful": 0, "failed": 0}
                    
                    sync_types[log.sync_type]["total"] += 1
                    if log.status == SyncStatus.COMPLETED:
                        sync_types[log.sync_type]["successful"] += 1
                    elif log.status == SyncStatus.FAILED:
                        sync_types[log.sync_type]["failed"] += 1
                
                return {
                    "report_period_hours": hours,
                    "pharmacy_id": pharmacy_id,
                    "total_syncs": total_syncs,
                    "successful_syncs": successful_syncs,
                    "failed_syncs": failed_syncs,
                    "pending_syncs": pending_syncs,
                    "success_rate": (successful_syncs / total_syncs * 100) if total_syncs > 0 else 0,
                    "sync_types": sync_types,
                    "generated_at": datetime.utcnow().isoformat()
                }
                
        except Exception as e:
            logger.error(f"Failed to generate sync status report: {e}")
            return {"error": str(e)}
