"""
Wasfaty API Client Service

This module handles all communication with the Wasfaty system including:
- Prescription validation and retrieval
- Inventory synchronization
- Transaction reporting
- Secure authentication and encryption
"""

import httpx
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from cryptography.fernet import Fernet
from jose import jwt

from config import get_wasfaty_config, get_security_config
from database.models import Prescription, Drug, InventoryItem, Transaction


logger = logging.getLogger(__name__)


class WasfatyAPIError(Exception):
    """Custom exception for Wasfaty API errors"""
    def __init__(self, message: str, status_code: int = None, response_data: Dict = None):
        self.message = message
        self.status_code = status_code
        self.response_data = response_data
        super().__init__(self.message)


class WasfatyClient:
    """
    Wasfaty API client with secure authentication and encryption
    Handles all interactions with the Saudi Arabia Wasfaty system
    """
    
    def __init__(self):
        self.config = get_wasfaty_config()
        self.security_config = get_security_config()
        self.base_url = self.config["base_url"]
        self.client_id = self.config["client_id"]
        self.client_secret = self.config["client_secret"]
        self.api_version = self.config["api_version"]
        
        # Initialize encryption
        self.cipher_suite = Fernet(self.security_config["secret_key"].encode()[:32].ljust(32, b'0'))
        
        # HTTP client with timeout and retry configuration
        self.client = httpx.AsyncClient(
            timeout=30.0,
            limits=httpx.Limits(max_keepalive_connections=5, max_connections=10)
        )
        
        self._access_token = None
        self._token_expires_at = None
    
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()
    
    async def _get_access_token(self) -> str:
        """
        Get or refresh access token for Wasfaty API
        Implements OAuth2 client credentials flow
        """
        if self._access_token and self._token_expires_at > datetime.utcnow():
            return self._access_token
        
        try:
            auth_url = f"{self.base_url}/oauth/token"
            auth_data = {
                "grant_type": "client_credentials",
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "scope": "prescription:read inventory:write transaction:write"
            }
            
            response = await self.client.post(auth_url, data=auth_data)
            response.raise_for_status()
            
            token_data = response.json()
            self._access_token = token_data["access_token"]
            expires_in = token_data.get("expires_in", 3600)
            self._token_expires_at = datetime.utcnow() + timedelta(seconds=expires_in - 60)
            
            logger.info("Successfully obtained Wasfaty access token")
            return self._access_token
            
        except httpx.HTTPError as e:
            logger.error(f"Failed to obtain Wasfaty access token: {e}")
            raise WasfatyAPIError(f"Authentication failed: {e}")
    
    async def _make_request(
        self, 
        method: str, 
        endpoint: str, 
        data: Dict = None, 
        params: Dict = None
    ) -> Dict:
        """
        Make authenticated request to Wasfaty API with encryption
        """
        token = await self._get_access_token()
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "X-API-Version": self.api_version,
            "X-Client-ID": self.client_id
        }
        
        url = f"{self.base_url}/api/{self.api_version}/{endpoint}"
        
        # Encrypt sensitive data if present
        if data and any(key in data for key in ['patient_id', 'prescription_id']):
            data = self._encrypt_sensitive_data(data)
        
        try:
            response = await self.client.request(
                method=method,
                url=url,
                headers=headers,
                json=data,
                params=params
            )
            
            response.raise_for_status()
            response_data = response.json()
            
            # Decrypt response if needed
            if 'encrypted_data' in response_data:
                response_data = self._decrypt_response_data(response_data)
            
            return response_data
            
        except httpx.HTTPStatusError as e:
            error_data = {}
            try:
                error_data = e.response.json()
            except:
                pass
            
            logger.error(f"Wasfaty API error {e.response.status_code}: {error_data}")
            raise WasfatyAPIError(
                f"API request failed: {error_data.get('message', str(e))}",
                status_code=e.response.status_code,
                response_data=error_data
            )
        
        except httpx.RequestError as e:
            logger.error(f"Wasfaty API request error: {e}")
            raise WasfatyAPIError(f"Request failed: {e}")
    
    def _encrypt_sensitive_data(self, data: Dict) -> Dict:
        """Encrypt sensitive data before sending to API"""
        encrypted_data = data.copy()
        sensitive_fields = ['patient_id', 'prescription_id', 'patient_phone']
        
        for field in sensitive_fields:
            if field in encrypted_data:
                encrypted_value = self.cipher_suite.encrypt(
                    str(encrypted_data[field]).encode()
                ).decode()
                encrypted_data[f"encrypted_{field}"] = encrypted_value
                del encrypted_data[field]
        
        return encrypted_data
    
    def _decrypt_response_data(self, response_data: Dict) -> Dict:
        """Decrypt sensitive data from API response"""
        decrypted_data = response_data.copy()
        
        if 'encrypted_data' in decrypted_data:
            encrypted_fields = decrypted_data['encrypted_data']
            for field, encrypted_value in encrypted_fields.items():
                try:
                    decrypted_value = self.cipher_suite.decrypt(
                        encrypted_value.encode()
                    ).decode()
                    decrypted_data[field] = decrypted_value
                except Exception as e:
                    logger.warning(f"Failed to decrypt field {field}: {e}")
            
            del decrypted_data['encrypted_data']
        
        return decrypted_data
    
    # Prescription Management Methods
    
    async def validate_prescription(
        self, 
        prescription_id: str, 
        pharmacy_id: str
    ) -> Dict[str, Any]:
        """
        Validate prescription authenticity and check if it's still valid
        
        Args:
            prescription_id: Wasfaty prescription ID
            pharmacy_id: Pharmacy identifier
            
        Returns:
            Dict containing validation result and prescription details
        """
        try:
            response = await self._make_request(
                "POST",
                "prescriptions/validate",
                data={
                    "prescription_id": prescription_id,
                    "pharmacy_id": pharmacy_id,
                    "validation_timestamp": datetime.utcnow().isoformat()
                }
            )
            
            logger.info(f"Prescription {prescription_id} validation: {response.get('is_valid')}")
            return response
            
        except WasfatyAPIError as e:
            logger.error(f"Prescription validation failed: {e}")
            raise
    
    async def get_prescription_details(self, prescription_id: str) -> Dict[str, Any]:
        """
        Retrieve detailed prescription information from Wasfaty
        
        Args:
            prescription_id: Wasfaty prescription ID
            
        Returns:
            Dict containing complete prescription details
        """
        try:
            response = await self._make_request(
                "GET",
                f"prescriptions/{prescription_id}"
            )
            
            logger.info(f"Retrieved prescription details for {prescription_id}")
            return response
            
        except WasfatyAPIError as e:
            logger.error(f"Failed to get prescription details: {e}")
            raise
    
    async def mark_prescription_dispensed(
        self, 
        prescription_id: str, 
        dispensed_items: List[Dict],
        pharmacy_id: str,
        transaction_id: str
    ) -> Dict[str, Any]:
        """
        Mark prescription as dispensed in Wasfaty system
        
        Args:
            prescription_id: Wasfaty prescription ID
            dispensed_items: List of dispensed items with quantities
            pharmacy_id: Pharmacy identifier
            transaction_id: Local transaction ID
            
        Returns:
            Dict containing dispense confirmation
        """
        try:
            response = await self._make_request(
                "POST",
                f"prescriptions/{prescription_id}/dispense",
                data={
                    "pharmacy_id": pharmacy_id,
                    "transaction_id": transaction_id,
                    "dispensed_items": dispensed_items,
                    "dispensed_at": datetime.utcnow().isoformat()
                }
            )
            
            logger.info(f"Marked prescription {prescription_id} as dispensed")
            return response
            
        except WasfatyAPIError as e:
            logger.error(f"Failed to mark prescription as dispensed: {e}")
            raise
    
    # Inventory Management Methods
    
    async def sync_inventory_update(
        self, 
        pharmacy_id: str, 
        drug_updates: List[Dict]
    ) -> Dict[str, Any]:
        """
        Send inventory updates to Wasfaty system
        Called when drugs are sold through POS
        
        Args:
            pharmacy_id: Pharmacy identifier
            drug_updates: List of drug stock updates
            
        Returns:
            Dict containing sync confirmation
        """
        try:
            response = await self._make_request(
                "POST",
                "inventory/sync",
                data={
                    "pharmacy_id": pharmacy_id,
                    "updates": drug_updates,
                    "sync_timestamp": datetime.utcnow().isoformat()
                }
            )
            
            logger.info(f"Synced {len(drug_updates)} inventory updates for pharmacy {pharmacy_id}")
            return response
            
        except WasfatyAPIError as e:
            logger.error(f"Inventory sync failed: {e}")
            raise
    
    async def get_drug_information(self, drug_identifier: str) -> Dict[str, Any]:
        """
        Get drug information from Wasfaty database
        
        Args:
            drug_identifier: Drug barcode, NDC, or Wasfaty ID
            
        Returns:
            Dict containing drug information
        """
        try:
            response = await self._make_request(
                "GET",
                f"drugs/lookup/{drug_identifier}"
            )
            
            logger.info(f"Retrieved drug information for {drug_identifier}")
            return response
            
        except WasfatyAPIError as e:
            logger.error(f"Drug lookup failed: {e}")
            raise
    
    # Transaction Reporting Methods
    
    async def report_pos_transaction(
        self, 
        transaction_data: Dict
    ) -> Dict[str, Any]:
        """
        Report POS transaction to Wasfaty for inventory tracking
        
        Args:
            transaction_data: Complete transaction information
            
        Returns:
            Dict containing reporting confirmation
        """
        try:
            response = await self._make_request(
                "POST",
                "transactions/report",
                data=transaction_data
            )
            
            logger.info(f"Reported POS transaction {transaction_data.get('transaction_id')}")
            return response
            
        except WasfatyAPIError as e:
            logger.error(f"Transaction reporting failed: {e}")
            raise
    
    # Health Check and Status Methods
    
    async def health_check(self) -> Dict[str, Any]:
        """
        Check Wasfaty API health and connectivity
        
        Returns:
            Dict containing health status
        """
        try:
            response = await self._make_request("GET", "health")
            logger.info("Wasfaty API health check successful")
            return response
            
        except WasfatyAPIError as e:
            logger.error(f"Wasfaty API health check failed: {e}")
            raise
    
    async def get_system_status(self) -> Dict[str, Any]:
        """
        Get Wasfaty system status and maintenance information
        
        Returns:
            Dict containing system status
        """
        try:
            response = await self._make_request("GET", "system/status")
            return response
            
        except WasfatyAPIError as e:
            logger.error(f"Failed to get system status: {e}")
            raise


# Singleton instance for global use
wasfaty_client = WasfatyClient()
