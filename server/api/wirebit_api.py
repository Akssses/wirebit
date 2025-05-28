import aiohttp
import json
import re
from typing import List, Dict, Any, Optional
from config import WIREBIT_API_KEY, WIREBIT_API_LOGIN

class WirebitAPI:
    def __init__(self, base_url: str, api_key: str, api_login: str):
        self.base_url = base_url
        self.api_key = api_key
        self.api_login = api_login
        self.session = None

    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    def _get_headers(self, content_type: str = "application/json") -> Dict[str, str]:
        """Get headers for API requests"""
        return {
            "API-KEY": self.api_key,
            "API-LOGIN": self.api_login,
            "Content-Type": content_type
        }

    async def get_directions(self) -> List[Dict[str, Any]]:
        """Get available exchange directions"""
        try:
            async with self.session.get(
                f"{self.base_url}get_directions",
                headers=self._get_headers()
            ) as response:
                response.raise_for_status()
                result = await response.json()
                
                if result.get("error") == 0:
                    return result.get("data", [])
                else:
                    raise Exception(f"Failed to get directions: {result.get('error_text', 'Unknown error')}")
        except aiohttp.ClientError as e:
            raise Exception(f"Network error: {str(e)}")

    async def get_currencies(self) -> List[Dict[str, Any]]:
        """Get available currencies"""
        try:
            async with self.session.get(
                f"{self.base_url}get_currencies",
                headers=self._get_headers()
            ) as response:
                response.raise_for_status()
                result = await response.json()
                
                if result.get("error") == 0:
                    return result.get("data", [])
                else:
                    raise Exception(f"Failed to get currencies: {result.get('error_text', 'Unknown error')}")
        except aiohttp.ClientError as e:
            raise Exception(f"Network error: {str(e)}")

    async def get_available_currencies(self, direction_id: str) -> List[Dict[str, Any]]:
        """Get available currencies for a specific direction"""
        try:
            data = {"direction_id": direction_id}
            async with self.session.post(
                f"{self.base_url}get_available_to",
                headers=self._get_headers(),
                json=data
            ) as response:
                response.raise_for_status()
                result = await response.json()
                
                if result.get("error") == 0:
                    return result.get("data", [])
                else:
                    raise Exception(f"Failed to get available currencies: {result.get('error_text', 'Unknown error')}")
        except aiohttp.ClientError as e:
            raise Exception(f"Network error: {str(e)}")

    async def create_bid(self, direction_id: str, amount: float, wallet: str, email: str) -> Dict[str, Any]:
        """Create a new exchange bid"""
        # Convert to form data format
        data = {
            "direction_id": str(direction_id),
            "sum1": str(amount),  # Amount to give (BTC in case of BTC->USDT)
            "sum2": "",          # Let API calculate the amount to receive
            "account2": wallet,   # Receiving wallet address
            "cf6": email         # Email field
        }
        
        try:
            async with self.session.post(
                f"{self.base_url}create_bid",
                headers=self._get_headers("application/x-www-form-urlencoded"),
                data=data  # Use data instead of json for form data
            ) as response:
                response.raise_for_status()
                result = await response.json()
                
                if result.get("error") == "0" or result.get("error") == 0:
                    return result.get("data", {})
                else:
                    error_text = result.get("error_text", "Unknown error")
                    error_fields = result.get("error_fields", {})
                    
                    # Parse error fields for more specific error messages
                    if error_fields:
                        if "account2" in error_fields:
                            raise Exception(f"Invalid wallet address: {error_fields['account2']}")
                        elif "cf6" in error_fields:
                            raise Exception(f"Invalid email: {error_fields['cf6']}")
                        elif "sum1" in error_fields or "sum2" in error_fields:
                            # Extract max amounts from error messages
                            max_amounts = {}
                            min_amounts = {}
                            
                            for field, error in error_fields.items():
                                if field in ["sum1", "sum2"]:
                                    # Look for max values
                                    max_match = re.search(r'max[.:]\s*([0-9.]+)', error)
                                    if max_match:
                                        max_amounts[field] = float(max_match.group(1))
                                    
                                    # Look for min values
                                    min_match = re.search(r'min[.:]\s*([0-9.]+)', error)
                                    if min_match:
                                        min_amounts[field] = float(min_match.group(1))
                            
                            # Create informative error message
                            if min_amounts:
                                raise Exception(f"Amount too small. Minimum: {min_amounts}")
                            elif max_amounts:
                                raise Exception(f"Amount exceeds limits. Maximum: {max_amounts}")
                            else:
                                raise Exception(f"Amount error: {error_fields}")
                    else:
                        # Check for specific error codes
                        if "Направление не существует" in error_text:
                            raise Exception("Invalid exchange direction")
                        else:
                            raise Exception(f"API error: {error_text}")
                            
        except aiohttp.ClientError as e:
            raise Exception(f"Network error: {str(e)}")
        except Exception as e:
            # Re-raise our custom exceptions
            if any(x in str(e) for x in ["Invalid", "Amount", "API error", "Network error"]):
                raise
            else:
                raise Exception(f"Failed to create bid: {str(e)}")

    async def check_status(self, bid_id: str) -> Dict[str, Any]:
        """Check the status of an exchange bid"""
        try:
            data = {"bid_id": bid_id}
            async with self.session.post(
                f"{self.base_url}get_status",
                headers=self._get_headers("application/x-www-form-urlencoded"),
                data=data
            ) as response:
                response.raise_for_status()
                result = await response.json()
                
                if result.get("error") == 0:
                    return result.get("data", {})
                else:
                    raise Exception(f"Failed to check status: {result.get('error_text', 'Unknown error')}")
        except aiohttp.ClientError as e:
            raise Exception(f"Network error: {str(e)}")


# Factory function to create API client
def create_wirebit_client() -> WirebitAPI:
    """Create a Wirebit API client instance"""
    return WirebitAPI(
        base_url="https://wirebit.net/api/userapi/v1/",
        api_key=WIREBIT_API_KEY,
        api_login=WIREBIT_API_LOGIN
    ) 