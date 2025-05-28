import requests
import logging
from typing import Dict, Any, Optional, List
import xml.etree.ElementTree as ET
from core.config import settings


logger = logging.getLogger(__name__)


class WirebitClient:
    def __init__(self):
        self.base_url = settings.wirebit_base_url
        self.rates_url = "https://wirebit.net/request-exportxml.xml"
        self.headers = {
            "API-KEY": settings.wirebit_api_key,
            "API-LOGIN": settings.wirebit_api_login,
            "Content-Type": "application/json"
        }
        self.session = requests.Session()
        self.session.headers.update(self.headers)
        self._rates_cache = {}
        self._load_rates()
    
    def _load_rates(self):
        """Load exchange rates from XML API"""
        try:
            response = requests.get(self.rates_url)
            response.raise_for_status()
            
            root = ET.fromstring(response.content)
            
            # Parse XML and create rates mapping
            for item in root.findall('item'):
                from_currency = item.find('from').text
                to_currency = item.find('to').text
                in_amount = float(item.find('in').text)
                out_amount = float(item.find('out').text)
                
                # Calculate rate (out/in)
                rate = out_amount / in_amount if in_amount > 0 else 1
                
                # Parse min/max amounts
                min_text = item.find('minamount').text
                max_text = item.find('maxamount').text
                
                # Extract numeric values from min/max
                min_amount = float(min_text.split()[0]) if min_text else 0
                max_amount = float(max_text.split()[0]) if max_text else 999999
                
                # Create key for rates cache
                key = f"{from_currency}_{to_currency}"
                self._rates_cache[key] = {
                    "rate": rate,
                    "min": min_amount,
                    "max": max_amount,
                    "reserve": float(item.find('amount').text) if item.find('amount') is not None else 0
                }
                
            logger.info(f"Loaded {len(self._rates_cache)} exchange rates from XML")
            
        except Exception as e:
            logger.error(f"Error loading rates from XML: {str(e)}")
            # Keep empty cache if loading fails
    
    def _get_rate_info(self, from_currency: str, to_currency: str) -> Dict[str, Any]:
        """Get rate info from cache"""
        # Try exact match first
        key = f"{from_currency}_{to_currency}"
        if key in self._rates_cache:
            return self._rates_cache[key]
        
        # Try with simplified currency names (remove suffixes like TRC20, ERC20)
        from_simple = from_currency.split()[0]
        to_simple = to_currency.split()[0]
        
        # Map common currency names
        currency_map = {
            "Tether TRC20 USDT": "USDTTRC20",
            "Bitcoin BTC": "BTC",
            "Ethereum ETH": "ETH",
            "TRON TRX": "TRX",
            "Dogecoin DOGE": "DOGE",
            "Toncoin TON": "TON",
            "Notcoin NOT": "NOT",
            "USDCoin ERC20 USDC": "USDCERC20",
            "Zelle USD": "ZELLEUSD",
            "Банковский счет Wire Transfer USD": "WIREUSD",
            "Банковская карта RUB": "CARDRUB",
            "СБП RUB": "SBPRUB",
            "Сбербанк RUB": "SBERRUB",
            "Т-Банк RUB": "TCSBRUB",
            "Альфа-Банк RUB": "ACRUB"
        }
        
        from_mapped = currency_map.get(from_currency, from_simple)
        to_mapped = currency_map.get(to_currency, to_simple)
        
        # Try with mapped names
        key = f"{from_mapped}_{to_mapped}"
        if key in self._rates_cache:
            return self._rates_cache[key]
        
        # Return default if not found
        return {"rate": 1, "min": 10, "max": 10000, "reserve": 0}
    
    def _make_request(self, method: str, endpoint: str, **kwargs) -> Dict[str, Any]:
        """Make HTTP request to Wirebit API with error handling"""
        url = f"{self.base_url}{endpoint}"
        
        try:
            logger.info(f"Making {method} request to {url}")
            response = self.session.request(method, url, **kwargs)
            response.raise_for_status()
            
            data = response.json()
            logger.info(f"Response from {endpoint}: {data}")
            return data
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Request error for {endpoint}: {str(e)}")
            raise Exception(f"Ошибка при обращении к API: {str(e)}")
        except ValueError as e:
            logger.error(f"JSON decode error for {endpoint}: {str(e)}")
            raise Exception("Некорректный ответ от сервера")
    
    def get_directions(self) -> List[Dict[str, Any]]:
        """Get all exchange directions from Wirebit"""
        try:
            # Reload rates to get fresh data
            self._load_rates()
            
            response = self._make_request("GET", "get_directions")
            
            # Check if request was successful (error = 0 means success)
            if response.get("error") == 0:
                directions = response.get("data", [])
                
                # Process directions to extract currency info with logos
                processed_directions = []
                
                for direction in directions:
                    from_currency = direction.get("currency_give_title")
                    to_currency = direction.get("currency_get_title")
                    
                    # Get rate info from XML data
                    rate_info = self._get_rate_info(from_currency, to_currency)
                    
                    processed_directions.append({
                        "direction_id": direction.get("direction_id"),
                        "from": from_currency,
                        "to": to_currency,
                        "from_logo": direction.get("currency_give_logo"),
                        "to_logo": direction.get("currency_get_logo"),
                        "rate": rate_info["rate"],
                        "min": rate_info["min"],
                        "max": rate_info["max"]
                    })
                
                return processed_directions
            else:
                error_msg = response.get("error_text", "Не удалось получить направления обмена")
                logger.error(f"API error: {error_msg}")
                raise Exception(error_msg)
                
        except Exception as e:
            logger.error(f"Error getting directions: {str(e)}")
            raise
    
    def create_bid(self, direction_id: str, amount: float, account: str, email: str) -> Dict[str, Any]:
        """Create exchange bid"""
        try:
            payload = {
                "direction_id": direction_id,
                "amount": amount,
                "account": account,
                "email": email
            }
            
            response = self._make_request("POST", "create_bid", json=payload)
            
            if response.get("error") == 0:
                return {
                    "success": True,
                    "bid_id": response.get("data", {}).get("bid_id"),
                    "message": "Заявка успешно создана"
                }
            else:
                error_msg = response.get("error_text", "Не удалось создать заявку")
                return {
                    "success": False,
                    "message": error_msg
                }
                
        except Exception as e:
            logger.error(f"Error creating bid: {str(e)}")
            return {
                "success": False,
                "message": str(e)
            }
    
    def get_status(self, bid_id: str) -> Dict[str, Any]:
        """Get bid status"""
        try:
            params = {"bid_id": bid_id}
            response = self._make_request("GET", "get_status", params=params)
            
            if response.get("error") == 0:
                status_data = response.get("data", {})
                status = status_data.get("status", "unknown")
                
                # Map status to user-friendly messages
                status_messages = {
                    "new": "Новая заявка",
                    "pending": "В обработке",
                    "processing": "Обрабатывается",
                    "completed": "Выполнена",
                    "cancelled": "Отменена",
                    "rejected": "Заявка отклонена администратором"
                }
                
                return {
                    "success": True,
                    "status": status,
                    "message": status_messages.get(status, status),
                    "data": status_data
                }
            else:
                error_msg = response.get("error_text", "Не удалось получить статус заявки")
                return {
                    "success": False,
                    "message": error_msg
                }
                
        except Exception as e:
            logger.error(f"Error getting status: {str(e)}")
            return {
                "success": False,
                "message": str(e)
            }


# Singleton instance
wirebit_client = WirebitClient()
