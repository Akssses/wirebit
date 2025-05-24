# Crypto Exchange API

Backend API for the cryptocurrency and fiat currency exchange platform.

## Features

- User authentication and management
- Exchange rate management
- Order processing
- User verification system
- Integration with WordPress plugin for rates
- Support for multiple currencies (fiat and crypto)

## Prerequisites

- Python 3.8+
- PostgreSQL
- Poetry (optional, for dependency management)

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd server
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file in the root directory with the following variables:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/crypto_exchange
SECRET_KEY=your-secret-key-here
WP_API_URL=your-wordpress-api-url
WP_API_KEY=your-wordpress-api-key
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
```

5. Initialize the database:
```bash
alembic upgrade head
```

## Running the Application

1. Start the development server:
```bash
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`

## API Documentation

Once the server is running, you can access the API documentation at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## API Endpoints

### Authentication
- POST `/api/auth/token` - Get access token
- POST `/api/auth/telegram-login` - Login with Telegram

### Users
- POST `/api/users/register` - Register new user
- GET `/api/users/me` - Get current user info
- GET `/api/users/{user_id}` - Get user by ID (admin only)

### Exchange Rates
- GET `/api/rates/` - Get all exchange rates
- GET `/api/rates/{from_currency}/{to_currency}` - Get specific rate
- POST `/api/rates/update` - Update rates from WordPress

### Orders
- POST `/api/orders/` - Create new order
- GET `/api/orders/` - Get user's orders
- GET `/api/orders/{order_id}` - Get specific order
- PUT `/api/orders/{order_id}/cancel` - Cancel order

### Verification
- POST `/api/verification/` - Submit verification
- GET `/api/verification/status` - Get verification status
- PUT `/api/verification/{verification_id}/approve` - Approve verification (admin)
- PUT `/api/verification/{verification_id}/reject` - Reject verification (admin)

## Development

### Database Migrations

To create a new migration:
```bash
alembic revision --autogenerate -m "description"
```

To apply migrations:
```bash
alembic upgrade head
```

## Testing

Run tests with pytest:
```bash
pytest
```

## Security

- All endpoints (except authentication) require JWT token
- Admin-only endpoints check for admin role
- Verification required for fiat currency operations
- Rate limiting implemented
- CORS configured for security 