#!/usr/bin/env python3
"""
Simple test script to verify API endpoints
"""
import requests
import json
from typing import Dict, Any


BASE_URL = "http://localhost:8000"


def test_endpoint(method: str, endpoint: str, data: Dict[str, Any] = None, params: Dict[str, Any] = None):
    """Test an API endpoint and print results"""
    url = f"{BASE_URL}{endpoint}"
    print(f"\n{'='*50}")
    print(f"Testing: {method} {endpoint}")
    
    try:
        if method == "GET":
            response = requests.get(url, params=params)
        elif method == "POST":
            response = requests.post(url, json=data)
        else:
            print(f"Unsupported method: {method}")
            return
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
        
    except Exception as e:
        print(f"Error: {str(e)}")


def main():
    print("Testing Wirebit Exchange API Endpoints")
    
    # Test root endpoint
    test_endpoint("GET", "/")
    
    # Test health check
    test_endpoint("GET", "/health")
    
    # Test get directions
    test_endpoint("GET", "/api/directions")
    
    # Test get currencies
    test_endpoint("GET", "/api/currencies")
    
    # Test get available-to (example with BTC)
    test_endpoint("GET", "/api/available-to", params={"from": "BTC"})
    
    # Test create exchange (example)
    test_data = {
        "direction_id": "1",
        "amount": 0.1,
        "account": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
        "email": "test@example.com"
    }
    test_endpoint("POST", "/api/create-exchange", data=test_data)
    
    # Test get status (example)
    test_endpoint("GET", "/api/status", params={"bid_id": "12345"})


if __name__ == "__main__":
    main() 