import json
import re
from typing import List, Dict, Any, Optional
from core.config import settings
import httpx
from fastapi import HTTPException
from pydantic import BaseModel, Field

class CreateBidRequest(BaseModel):
    direction_id: str = Field(..., description="Direction ID from get_directions")
    amount: float = Field(..., gt=0, description="Amount to exchange")
    account_to: str = Field(..., description="Wallet address to receive funds")
    cf6: Optional[str] = Field(None, description="Email address")

class WirebitAPI:
    def __init__(self, base_url: str, api_key: str, api_login: str):
        self.base_url = base_url
        self.api_key = api_key
        self.api_login = api_login

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        pass

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
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    f"{self.base_url}get_directions",
                    headers=self._get_headers()
                )
                response.raise_for_status()
                result = response.json()
                
                if result.get("error") == 0:
                    return result.get("data", [])
                else:
                    raise Exception(f"Failed to get directions: {result.get('error_text', 'Unknown error')}")
        except httpx.RequestError as e:
            raise Exception(f"Network error: {str(e)}")

    async def get_currencies(self) -> List[Dict[str, Any]]:
        """Get available currencies from directions"""
        try:
            # Get all directions and extract unique currencies
            directions = await self.get_directions()
            
            # Extract unique "give" currencies
            currencies_dict = {}
            for direction in directions:
                currency_title = direction.get("currency_give_title")
                currency_logo = direction.get("currency_give_logo")
                
                if currency_title and currency_title not in currencies_dict:
                    currencies_dict[currency_title] = {
                        "title": currency_title,
                        "logo": currency_logo
                    }
            
            return list(currencies_dict.values())
            
        except Exception as e:
            raise Exception(f"Failed to get currencies: {str(e)}")

    async def get_available_currencies(self, from_currency: str) -> List[Dict[str, Any]]:
        """Get available currencies for receiving based on from_currency"""
        try:
            # Get all directions and filter by from_currency
            directions = await self.get_directions()
            
            # Extract unique "get" currencies for the specified "give" currency
            currencies_dict = {}
            for direction in directions:
                give_title = direction.get("currency_give_title") 
                get_title = direction.get("currency_get_title")
                get_logo = direction.get("currency_get_logo")
                
                if give_title == from_currency and get_title and get_title not in currencies_dict:
                    currencies_dict[get_title] = {
                        "title": get_title,
                        "logo": get_logo
                    }
            
            return list(currencies_dict.values())
            
        except Exception as e:
            raise Exception(f"Failed to get available currencies: {str(e)}")

    async def create_bid(self, create_bid_data: CreateBidRequest) -> Dict[str, Any]:
        """Create a new exchange bid"""
        headers = self._get_headers()
        headers["Content-Type"] = "application/x-www-form-urlencoded"
        
        # Use the correct parameter names
        data = {
            "direction_id": str(create_bid_data.direction_id),
            "calc_amount": str(create_bid_data.amount),
            "calc_action": "1",  # 1 = amount I'm giving
            "account2": create_bid_data.account_to,
            "cf6": create_bid_data.cf6 or "test@example.com"
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{self.base_url}create_bid",
                headers=headers,
                data=data  # Using data instead of json for form encoding
            )
            
            result = response.json()
            
            if result.get("error") != "0" and result.get("error") != 0:
                error_text = result.get('error_text', 'Unknown error')
                error_fields = result.get('error_fields', {})
                
                # Parse error fields for more details
                if error_fields:
                    details = []
                    for field, error_html in error_fields.items():
                        # Try to extract min/max values from HTML
                        import re
                        min_match = re.search(r'min[.:]\s*([0-9.]+)', str(error_html))
                        max_match = re.search(r'max[.:]\s*([0-9.]+)', str(error_html))
                        
                        if min_match or max_match:
                            limits = []
                            if min_match:
                                limits.append(f"min: {min_match.group(1)}")
                            if max_match:
                                limits.append(f"max: {max_match.group(1)}")
                            details.append(f"{field}: {', '.join(limits)}")
                    
                    if details:
                        error_text += f" ({'; '.join(details)})"
                
                raise HTTPException(
                    status_code=400,
                    detail=f"API error: {error_text}"
                )
            
            return result.get("data", result)

    async def check_status(self, bid_id: str) -> Dict[str, Any]:
        """Check the status of an exchange bid"""
        try:
            data = {"bid_id": bid_id}
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}get_status",
                    headers=self._get_headers("application/x-www-form-urlencoded"),
                    data=data
                )
                response.raise_for_status()
                result = response.json()
                
                if result.get("error") == 0:
                    return result.get("data", {})
                else:
                    raise Exception(f"Failed to check status: {result.get('error_text', 'Unknown error')}")
        except httpx.RequestError as e:
            raise Exception(f"Network error: {str(e)}")


# Factory function to create API client
def create_wirebit_client() -> WirebitAPI:
    """Create a Wirebit API client instance"""
    return WirebitAPI(
        base_url="https://wirebit.net/api/userapi/v1/",
        api_key=settings.wirebit_api_key,
        api_login=settings.wirebit_api_login
    ) 