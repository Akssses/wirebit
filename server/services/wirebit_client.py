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
    
    def create_bid(self, direction_id: str, amount: float, account_to: Optional[str] = None, 
                   account2: Optional[str] = None, cfgive8: Optional[str] = None,
                   cf6: str = "", cf11: Optional[str] = None) -> Dict[str, Any]:
        """Create exchange bid"""
        try:
            # Use form data with correct parameter names
            payload = {
                "direction_id": str(direction_id),
                "calc_amount": str(amount),
                "calc_action": "1",  # 1 = amount I'm giving
            }
            
            # Add email (required field)
            if cf6:
                payload["cf6"] = cf6
            else:
                payload["cf6"] = "test@example.com"
            
            # Add crypto fields if provided
            if account_to:
                payload["account2"] = account_to
            
            # Add ruble fields if provided
            if account2:
                payload["account2"] = account2
                # For ruble exchanges, add required additional fields
                payload["account1"] = account2  # Duplicate card number to account1
            if cfgive8:
                payload["cfgive8"] = cfgive8
                # For ruble exchanges, automatically fill cf1, cf2, cf3 from cfgive8 if needed
                if account2 and cfgive8:  # This is a ruble exchange
                    name_parts = cfgive8.strip().split()
                    if len(name_parts) >= 3:
                        payload["cf3"] = name_parts[0]  # Фамилия
                        payload["cf1"] = name_parts[1]  # Имя  
                        payload["cf2"] = name_parts[2]  # Отчество
                    elif len(name_parts) == 2:
                        payload["cf3"] = name_parts[0]  # Фамилия
                        payload["cf1"] = name_parts[1]  # Имя
                        payload["cf2"] = ""  # Отчество пустое
                    else:
                        payload["cf1"] = cfgive8  # Если одно слово, используем как имя
                        payload["cf2"] = ""
                        payload["cf3"] = ""
                    
                    # Add additional required fields for ruble exchanges
                    payload["cf10"] = cfgive8  # ФИО получателя
                    payload["cfget1"] = cfgive8  # ФИО получателя (полное ФИО)
                    payload["cfget9"] = cfgive8  # ФИО получателя (дублируем)
            if cf11:
                payload["cf11"] = cf11
            
            # Use form headers for this request
            form_headers = {
                "API-KEY": settings.wirebit_api_key,
                "API-LOGIN": settings.wirebit_api_login,
                "Content-Type": "application/x-www-form-urlencoded"
            }
            
            logger.info(f"Creating bid with payload: {payload}")
            
            response = requests.post(
                f"{self.base_url}create_bid",
                headers=form_headers,
                data=payload,
                timeout=30
            )
            response.raise_for_status()
            data = response.json()
            
            if data.get("error") == "0" or data.get("error") == 0:
                return {
                    "success": True,
                    "bid_id": data.get("data", {}).get("id"),
                    "message": "Заявка успешно создана",
                    "data": data.get("data", {})
                }
            else:
                error_msg = data.get("error_text", "Не удалось создать заявку")
                logger.error(f"Wirebit API error: {error_msg}")
                logger.error(f"Full Wirebit response: {data}")
                
                # Try to extract more detailed error info
                error_fields = data.get("error_fields", {})
                if error_fields:
                    logger.error(f"Error fields: {error_fields}")
                    
                    # Check for specific field errors
                    if "account2" in error_fields:
                        error_msg = "Неправильный адрес кошелька получателя или номер карты. Проверьте формат данных."
                    elif "calc_amount" in error_fields:
                        error_msg = "Неправильная сумма обмена. Проверьте минимальные и максимальные лимиты."
                    elif "cf6" in error_fields:
                        error_msg = "Неправильный формат email адреса."
                    elif "cf1" in error_fields or "cf2" in error_fields or "cf3" in error_fields:
                        error_msg = "Неправильно заполнены персональные данные (имя, отчество, фамилия)."
                    elif "cf4" in error_fields:
                        error_msg = "Неправильный формат номера телефона."
                    elif "cfgive8" in error_fields:
                        error_msg = "Неправильно указано ФИО владельца карты."
                
                # Generic error message improvements
                if error_msg == "Ошибка!":
                    error_msg = "Ошибка создания заявки. Проверьте правильность введенных данных."
                
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
