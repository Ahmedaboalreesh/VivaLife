"""
Database models for Wasfaty-POS Integration System

This module defines the database schema that supports synchronization
between POS and Wasfaty systems with proper audit trails and scalability.
"""

from datetime import datetime
from enum import Enum
from typing import Optional
from sqlalchemy import (
    Column, Integer, String, DateTime, Boolean, Text, 
    Numeric, ForeignKey, Index, UniqueConstraint
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid


Base = declarative_base()


class TransactionStatus(str, Enum):
    """Transaction status enumeration"""
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class PrescriptionStatus(str, Enum):
    """Prescription status enumeration"""
    ACTIVE = "active"
    DISPENSED = "dispensed"
    EXPIRED = "expired"
    CANCELLED = "cancelled"


class SyncStatus(str, Enum):
    """Synchronization status enumeration"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"


class Pharmacy(Base):
    """
    Pharmacy model - supports multiple pharmacy locations
    Each pharmacy has its own inventory and can be added easily
    """
    __tablename__ = "pharmacies"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    license_number = Column(String(100), unique=True, nullable=False)
    address = Column(Text)
    phone = Column(String(20))
    email = Column(String(255))
    wasfaty_pharmacy_id = Column(String(100), unique=True)  # Wasfaty system ID
    pos_system_id = Column(String(100))  # POS system identifier
    is_active = Column(Boolean, default=True)
    api_key = Column(String(255))  # For API authentication
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    inventory_items = relationship("InventoryItem", back_populates="pharmacy")
    transactions = relationship("Transaction", back_populates="pharmacy")
    prescriptions = relationship("Prescription", back_populates="pharmacy")


class Drug(Base):
    """
    Drug master data - contains all drug information
    Synchronized between POS and Wasfaty systems
    """
    __tablename__ = "drugs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    generic_name = Column(String(255))
    brand_name = Column(String(255))
    strength = Column(String(100))
    dosage_form = Column(String(100))
    manufacturer = Column(String(255))
    barcode = Column(String(100), unique=True)
    ndc_code = Column(String(50))  # National Drug Code
    wasfaty_drug_id = Column(String(100), unique=True)  # Wasfaty system ID
    pos_drug_id = Column(String(100))  # POS system ID
    unit_price = Column(Numeric(10, 2))
    is_prescription_required = Column(Boolean, default=True)
    is_controlled_substance = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    inventory_items = relationship("InventoryItem", back_populates="drug")
    transaction_items = relationship("TransactionItem", back_populates="drug")
    prescription_items = relationship("PrescriptionItem", back_populates="drug")
    
    # Indexes for performance
    __table_args__ = (
        Index('idx_drug_barcode', 'barcode'),
        Index('idx_drug_wasfaty_id', 'wasfaty_drug_id'),
        Index('idx_drug_name', 'name'),
    )


class InventoryItem(Base):
    """
    Inventory tracking for each pharmacy
    Maintains real-time stock levels synchronized between systems
    """
    __tablename__ = "inventory_items"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    pharmacy_id = Column(UUID(as_uuid=True), ForeignKey("pharmacies.id"), nullable=False)
    drug_id = Column(UUID(as_uuid=True), ForeignKey("drugs.id"), nullable=False)
    current_stock = Column(Integer, default=0)
    reserved_stock = Column(Integer, default=0)  # Stock reserved for prescriptions
    minimum_stock = Column(Integer, default=0)
    maximum_stock = Column(Integer, default=0)
    batch_number = Column(String(100))
    expiry_date = Column(DateTime)
    cost_price = Column(Numeric(10, 2))
    selling_price = Column(Numeric(10, 2))
    last_sync_at = Column(DateTime)  # Last synchronization with Wasfaty
    sync_status = Column(String(20), default=SyncStatus.COMPLETED)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    pharmacy = relationship("Pharmacy", back_populates="inventory_items")
    drug = relationship("Drug", back_populates="inventory_items")
    
    # Constraints and indexes
    __table_args__ = (
        UniqueConstraint('pharmacy_id', 'drug_id', 'batch_number', name='unique_pharmacy_drug_batch'),
        Index('idx_inventory_pharmacy_drug', 'pharmacy_id', 'drug_id'),
        Index('idx_inventory_sync_status', 'sync_status'),
    )


class Prescription(Base):
    """
    Prescription data from Wasfaty system
    Tracks prescription lifecycle and validation
    """
    __tablename__ = "prescriptions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    wasfaty_prescription_id = Column(String(100), unique=True, nullable=False)
    pharmacy_id = Column(UUID(as_uuid=True), ForeignKey("pharmacies.id"), nullable=False)
    patient_id = Column(String(100))  # Patient identifier from Wasfaty
    patient_name = Column(String(255))
    patient_phone = Column(String(20))
    doctor_name = Column(String(255))
    doctor_license = Column(String(100))
    prescription_date = Column(DateTime, nullable=False)
    expiry_date = Column(DateTime, nullable=False)
    status = Column(String(20), default=PrescriptionStatus.ACTIVE)
    is_validated = Column(Boolean, default=False)
    validation_date = Column(DateTime)
    dispensed_date = Column(DateTime)
    total_amount = Column(Numeric(10, 2))
    copay_amount = Column(Numeric(10, 2))
    insurance_amount = Column(Numeric(10, 2))
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    pharmacy = relationship("Pharmacy", back_populates="prescriptions")
    prescription_items = relationship("PrescriptionItem", back_populates="prescription")
    transactions = relationship("Transaction", back_populates="prescription")
    
    # Indexes
    __table_args__ = (
        Index('idx_prescription_wasfaty_id', 'wasfaty_prescription_id'),
        Index('idx_prescription_patient', 'patient_id'),
        Index('idx_prescription_status', 'status'),
    )


class PrescriptionItem(Base):
    """
    Individual items within a prescription
    Links prescriptions to specific drugs with quantities
    """
    __tablename__ = "prescription_items"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    prescription_id = Column(UUID(as_uuid=True), ForeignKey("prescriptions.id"), nullable=False)
    drug_id = Column(UUID(as_uuid=True), ForeignKey("drugs.id"), nullable=False)
    prescribed_quantity = Column(Integer, nullable=False)
    dispensed_quantity = Column(Integer, default=0)
    unit_price = Column(Numeric(10, 2))
    total_price = Column(Numeric(10, 2))
    dosage_instructions = Column(Text)
    is_substitutable = Column(Boolean, default=False)
    substituted_drug_id = Column(UUID(as_uuid=True), ForeignKey("drugs.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    prescription = relationship("Prescription", back_populates="prescription_items")
    drug = relationship("Drug", back_populates="prescription_items")
    substituted_drug = relationship("Drug", foreign_keys=[substituted_drug_id])


class Transaction(Base):
    """
    Transaction records for all sales (POS and Wasfaty)
    Provides comprehensive audit trail and reporting
    """
    __tablename__ = "transactions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    transaction_number = Column(String(100), unique=True, nullable=False)
    pharmacy_id = Column(UUID(as_uuid=True), ForeignKey("pharmacies.id"), nullable=False)
    prescription_id = Column(UUID(as_uuid=True), ForeignKey("prescriptions.id"))
    transaction_type = Column(String(20), nullable=False)  # 'pos_sale', 'wasfaty_dispense'
    status = Column(String(20), default=TransactionStatus.PENDING)
    customer_name = Column(String(255))
    customer_phone = Column(String(20))
    subtotal = Column(Numeric(10, 2), default=0)
    tax_amount = Column(Numeric(10, 2), default=0)
    discount_amount = Column(Numeric(10, 2), default=0)
    total_amount = Column(Numeric(10, 2), default=0)
    payment_method = Column(String(50))
    payment_reference = Column(String(100))
    cashier_id = Column(String(100))
    pos_transaction_id = Column(String(100))  # Original POS transaction ID
    wasfaty_transaction_id = Column(String(100))  # Wasfaty transaction ID
    sync_status = Column(String(20), default=SyncStatus.PENDING)
    sync_attempts = Column(Integer, default=0)
    last_sync_at = Column(DateTime)
    error_message = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    pharmacy = relationship("Pharmacy", back_populates="transactions")
    prescription = relationship("Prescription", back_populates="transactions")
    transaction_items = relationship("TransactionItem", back_populates="transaction")
    
    # Indexes
    __table_args__ = (
        Index('idx_transaction_number', 'transaction_number'),
        Index('idx_transaction_pharmacy', 'pharmacy_id'),
        Index('idx_transaction_type', 'transaction_type'),
        Index('idx_transaction_sync_status', 'sync_status'),
        Index('idx_transaction_created', 'created_at'),
    )


class TransactionItem(Base):
    """
    Individual items within a transaction
    Tracks what was sold and quantities
    """
    __tablename__ = "transaction_items"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    transaction_id = Column(UUID(as_uuid=True), ForeignKey("transactions.id"), nullable=False)
    drug_id = Column(UUID(as_uuid=True), ForeignKey("drugs.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    total_price = Column(Numeric(10, 2), nullable=False)
    batch_number = Column(String(100))
    expiry_date = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    transaction = relationship("Transaction", back_populates="transaction_items")
    drug = relationship("Drug", back_populates="transaction_items")


class SyncLog(Base):
    """
    Synchronization logs between POS and Wasfaty systems
    Provides detailed audit trail for all sync operations
    """
    __tablename__ = "sync_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    pharmacy_id = Column(UUID(as_uuid=True), ForeignKey("pharmacies.id"))
    sync_type = Column(String(50), nullable=False)  # 'inventory_update', 'prescription_sync', etc.
    entity_type = Column(String(50), nullable=False)  # 'transaction', 'inventory', 'prescription'
    entity_id = Column(String(100))  # ID of the synced entity
    direction = Column(String(20), nullable=False)  # 'pos_to_wasfaty', 'wasfaty_to_pos'
    status = Column(String(20), default=SyncStatus.PENDING)
    request_data = Column(JSONB)  # Request payload
    response_data = Column(JSONB)  # Response data
    error_message = Column(Text)
    processing_time_ms = Column(Integer)  # Processing time in milliseconds
    retry_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)
    
    # Relationships
    pharmacy = relationship("Pharmacy")
    
    # Indexes
    __table_args__ = (
        Index('idx_sync_log_pharmacy', 'pharmacy_id'),
        Index('idx_sync_log_type', 'sync_type'),
        Index('idx_sync_log_status', 'status'),
        Index('idx_sync_log_created', 'created_at'),
    )


class ApiKey(Base):
    """
    API key management for secure authentication
    Each pharmacy gets unique API keys for system access
    """
    __tablename__ = "api_keys"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    pharmacy_id = Column(UUID(as_uuid=True), ForeignKey("pharmacies.id"), nullable=False)
    key_name = Column(String(100), nullable=False)
    key_hash = Column(String(255), nullable=False)  # Hashed API key
    permissions = Column(JSONB)  # JSON array of permissions
    is_active = Column(Boolean, default=True)
    expires_at = Column(DateTime)
    last_used_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    pharmacy = relationship("Pharmacy")
    
    # Indexes
    __table_args__ = (
        Index('idx_api_key_pharmacy', 'pharmacy_id'),
        Index('idx_api_key_hash', 'key_hash'),
    )
