#!/usr/bin/env python3
"""Test script to debug create_bid issue"""
import requests
import json

API_KEY = "55zoAaEefLMtro18SqGEW6Vmx7x0kwtc"
API_LOGIN = "FUq0VDBtUVw9t7osngo6ownacyEabfAY"
BASE_URL = "https://wirebit.net/api/userapi/v1/"

headers = {
    "API-KEY": API_KEY,
    "API-LOGIN": API_LOGIN,
    "Content-Type": "application/json"
}

def print_separator():
    print("\n" + "="*50 + "\n")

# First, get directions to see the structure
print("Getting directions...")
print(f"Using headers: {json.dumps(headers, indent=2)}")
print_separator()

response = requests.get(f"{BASE_URL}get_directions", headers=headers)
directions = response.json()

if directions.get("error") == 0:
    print("All available directions:")
    for d in directions["data"]:
        print(f"- {d.get('currency_give_title')} -> {d.get('currency_get_title')}")
        print(f"  direction_id: {d.get('direction_id')}")
        print(f"  currency_give_id: {d.get('currency_give_id')}")
        print(f"  currency_get_id: {d.get('currency_get_id')}")
        print()
    
    print_separator()
    
    # Find BTC -> USDT direction
    btc_to_usdt = None
    for d in directions["data"]:
        if d.get("currency_give_title") == "Bitcoin BTC" and d.get("currency_get_title") == "Tether TRC20 USDT":
            btc_to_usdt = d
            break
    
    if btc_to_usdt:
        print("Found BTC->USDT direction. Full direction data:")
        print(json.dumps(btc_to_usdt, indent=2))
        print_separator()
        
        # Try different ID formats
        test_ids = [
            ("direction_id", btc_to_usdt.get("direction_id")),
            ("composite_underscore", f"{btc_to_usdt.get('currency_give_id')}_{btc_to_usdt.get('currency_get_id')}"),
            ("composite_dash", f"{btc_to_usdt.get('currency_give_id')}-{btc_to_usdt.get('currency_get_id')}"),
            ("give_id", str(btc_to_usdt.get("currency_give_id"))),
            ("get_id", str(btc_to_usdt.get("currency_get_id"))),
        ]
        
        # Try a test bid with each format
        for id_name, test_id in test_ids:
            print(f"Testing format '{id_name}' with ID: {test_id}")
            
            bid_data = {
                "direction_id": str(test_id),
                "amount": 0.006,
                "account": "112233445566",
                "email": "test@gmail.com"
            }
            
            print(f"Request URL: {BASE_URL}create_bid")
            print(f"Request headers: {json.dumps(headers, indent=2)}")
            print(f"Request payload: {json.dumps(bid_data, indent=2)}")
            
            response = requests.post(f"{BASE_URL}create_bid", headers=headers, json=bid_data)
            print(f"Response status code: {response.status_code}")
            
            try:
                result = response.json()
                print(f"Response JSON: {json.dumps(result, indent=2)}")
            except json.JSONDecodeError:
                print(f"Raw response text: {response.text}")
            
            if result.get("error") == "0" or result.get("error") == 0:
                print("\n🎉 SUCCESS! Found working direction_id format!")
                print(f"Working format: {id_name} = {test_id}")
                break
            
            print_separator()
    else:
        print("Could not find BTC->USDT direction in the response")
else:
    print("Error getting directions:", directions) 