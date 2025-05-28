# Wirebit Exchange Backend

Backend сервис для интеграции с API криптообменника Wirebit.

## Установка

1. Создайте виртуальное окружение:

```bash
python3 -m venv venv
source venv/bin/activate  # На macOS/Linux
```

2. Установите зависимости:

```bash
pip install -r requirements.txt
```

3. Создайте файл `.env` с вашими API ключами:

```env
WIREBIT_API_KEY=your_api_key_here
WIREBIT_API_LOGIN=your_api_login_here
```

4. Запустите сервер:

```bash
uvicorn main:app --reload
```

## API Endpoints

- `GET /api/directions` - Получить доступные направления обмена
- `GET /api/currencies` - Получить список валют
- `POST /api/available-to` - Получить доступные валюты для направления
- `POST /api/create-exchange` - Создать заявку на обмен
- `POST /api/status` - Проверить статус заявки

## Известные проблемы

### Ошибка "Amount exceeds limits"

Если вы получаете ошибку о превышении лимитов при любой сумме, это может означать:

1. **API ключи в тестовом режиме** - свяжитесь с Wirebit для получения production доступа
2. **Недостаточный баланс** - проверьте баланс вашего аккаунта Wirebit
3. **Требуется верификация** - убедитесь, что ваш аккаунт прошел необходимую верификацию

### Решение проблем

1. Проверьте статус вашего аккаунта в личном кабинете Wirebit
2. Убедитесь, что API ключи имеют права на создание обменов
3. Проверьте минимальные суммы обмена для выбранного направления
4. При необходимости обратитесь в поддержку Wirebit

## Тестирование

Для проверки интеграции используйте тестовые скрипты:

```bash
# Проверить доступные направления
python3 test_create_bid.py

# Проверить статус всех направлений
python3 test_check_directions_status.py
```

## Структура проекта

```
server/
├── api/
│   └── wirebit_api.py      # Клиент для Wirebit API
├── routers/
│   └── wirebit.py          # FastAPI роутеры
├── models/
│   └── wirebit.py          # Pydantic модели
├── config.py               # Конфигурация
├── main.py                 # Точка входа FastAPI
└── requirements.txt        # Зависимости
```

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
