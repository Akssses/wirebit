# Wirebit API Integration

## Overview

This backend integrates with Wirebit cryptocurrency exchange API to provide exchange services.

## Data Sources

1. **Exchange Directions** - Retrieved from Wirebit API (`/get_directions`)
2. **Exchange Rates** - Retrieved from XML feed: https://wirebit.net/request-exportxml.xml

## API Endpoints

### GET /api/directions

Returns all available exchange directions with real-time rates.

### GET /api/currencies

Returns unique currencies available for sending.

### GET /api/available-to?from={currency}

Returns currencies available to receive for a given source currency.

### POST /api/create-exchange

Creates an exchange order.

Request body:

```json
{
  "direction_id": "1395",
  "amount": 100,
  "account": "wallet_address",
  "email": "user@example.com"
}
```

### GET /api/status?bid_id={id}

Returns the status of an exchange order.

## Rate Calculation

Exchange rates are fetched from the XML feed and cached in memory. The rates are refreshed on each `/api/directions` request.

The XML provides:

- `in` - amount of source currency
- `out` - amount of destination currency
- `rate` = `out` / `in`

## Currency Mapping

The system maps between Wirebit API currency names and XML currency codes:

- "Tether TRC20 USDT" → "USDTTRC20"
- "Bitcoin BTC" → "BTC"
- etc.

## Error Handling

All endpoints return consistent error format:

```json
{
  "success": false,
  "message": "Error description"
}
```
