# Wirebit Exchange Backend API

Production-ready FastAPI backend for cryptocurrency exchange integration with Wirebit API.

## Features

- FastAPI framework with async support
- Pydantic models for request/response validation
- Structured logging
- CORS configuration for frontend integration
- Environment-based configuration
- Error handling and user-friendly messages
- Modular architecture

## Project Structure

```
server/
├── core/
│   ├── __init__.py
│   └── config.py          # Configuration management
├── routes/
│   ├── __init__.py
│   └── exchange.py        # Exchange API endpoints
├── schemas/
│   ├── __init__.py
│   └── exchange.py        # Pydantic models
├── services/
│   ├── __init__.py
│   └── wirebit_client.py  # Wirebit API client
├── main.py                # FastAPI application
├── requirements.txt       # Python dependencies
└── .env                   # Environment variables
```

## API Endpoints

All endpoints are prefixed with `/api`:

- `GET /api/directions` - Get all exchange directions
- `GET /api/currencies` - Get unique currencies for sending
- `GET /api/available-to?from={currency}` - Get available currencies to receive
- `POST /api/create-exchange` - Create exchange bid
- `GET /api/status?bid_id={id}` - Get bid status

## Setup

1. Create virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Configure environment variables:

   - Copy `.env.example` to `.env`
   - Update API credentials if needed

4. Run the server:

```bash
python main.py
```

Or with uvicorn directly:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## API Documentation

Once the server is running, visit:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Environment Variables

- `WIREBIT_API_KEY` - Wirebit API key
- `WIREBIT_API_LOGIN` - Wirebit API login
- `WIREBIT_BASE_URL` - Wirebit API base URL
- `CORS_ORIGINS` - Allowed CORS origins (JSON array)
- `LOG_LEVEL` - Logging level (INFO, DEBUG, ERROR)

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

## Frontend Integration

The API is designed to work with react-toastify on the frontend. All responses include `success` and `message` fields for easy toast notifications.
