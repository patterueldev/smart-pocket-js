# Smart Pocket Server

Node.js/Express backend for Smart Pocket personal finance management system.

## Features

- **OCR Receipt Parsing**: OpenAI-powered receipt text extraction
- **Transaction Management**: Detailed transaction tracking with line items
- **Price History**: Track price changes over time per store
- **Multi-Currency Support**: JSONB price objects with exact precision
- **Authentication**: Two-stage auth (API key → JWT bearer token)
- **Actual Budget Integration**: Sync simplified transactions to Actual Budget
- **Google Sheets Sync** (optional): Personal feature for account balance tracking
- **Product Matching**: Fuzzy matching for store-specific product codes

## Prerequisites

- Node.js 20+
- PostgreSQL 16+
- OpenAI API key
- Actual Budget instance (optional but recommended)

## Setup

### 1. Install Dependencies

```bash
cd packages/server
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and set:
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Strong random secret for JWT signing
- `API_KEY`: API key for mobile app connection
- `OPENAI_API_KEY`: Your OpenAI API key
- `ACTUAL_BUDGET_URL`: URL of your Actual Budget instance

### 3. Run Database Migrations

```bash
npm run migrate
```

This will:
- Enable PostgreSQL extensions (uuid-ossp, pg_trgm)
- Create all tables with proper schemas
- Set up indexes for performance
- Add seed data for development

### 4. Start Server

**Development (with hot-reload):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

Server will run on `http://localhost:3001` (or PORT from .env)

## API Endpoints

All endpoints except `/health` and `/connect` require bearer token authentication.

### Public Endpoints

- `GET /health` - Health check
- `GET /api/v1/server-info` - Server info and features
- `POST /api/v1/connect` - Exchange API key for bearer token

### Protected Endpoints

- `POST /api/v1/ocr/parse` - Parse OCR text into transaction data
- `GET /api/v1/payees` - List payees
- `POST /api/v1/payees` - Create payee
- `GET /api/v1/accounts` - List accounts
- `GET /api/v1/products/search` - Search products with auto-suggestions
- `GET /api/v1/transactions` - List transactions
- `POST /api/v1/transactions` - Create transaction
- `GET /api/v1/transactions/:id` - Get transaction details
- `PUT /api/v1/transactions/:id` - Update transaction
- `DELETE /api/v1/transactions/:id` - Delete transaction
- `GET /api/v1/google-sheets/sync/draft` - Get pending syncs (if enabled)
- `POST /api/v1/google-sheets/sync` - Execute Google Sheets sync (if enabled)
- `POST /api/v1/disconnect` - Invalidate session

## Project Structure

```
packages/server/
├── src/
│   ├── index.js                 # Server entry point
│   ├── app.js                   # Express app configuration
│   ├── config/
│   │   └── database.js          # PostgreSQL connection pool
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication
│   │   └── errorHandler.js      # Global error handling
│   ├── routes/
│   │   ├── health.js            # Health check
│   │   ├── auth.js              # Connect/disconnect
│   │   ├── ocr.js               # OCR parsing
│   │   ├── payees.js            # Payee management
│   │   ├── accounts.js          # Account management
│   │   ├── products.js          # Product search
│   │   ├── transactions.js      # Transaction CRUD
│   │   └── google-sheets.js     # Google Sheets sync
│   ├── services/
│   │   ├── ocr.service.js            # OpenAI OCR parsing
│   │   ├── payee.service.js          # Payee business logic
│   │   ├── account.service.js        # Account business logic
│   │   ├── product.service.js        # Product search logic
│   │   ├── transaction.service.js    # Transaction business logic
│   │   ├── actual-budget.service.js  # Actual Budget integration
│   │   └── google-sheets.service.js  # Google Sheets integration
│   ├── database/
│   │   ├── schema.sql           # Database schema
│   │   └── migrations.js        # Migration runner
│   └── utils/
│       ├── logger.js            # Winston logger
│       └── price.js             # Price object utilities
├── .env.example                 # Environment template
├── package.json
└── README.md
```

## Database Schema

### Core Tables

- **payees**: Merchants/vendors
- **accounts**: Bank accounts/payment methods (synced from Actual Budget)
- **transactions**: Transaction records with JSONB total
- **line_items**: Individual items within transactions
- **products**: Canonical product catalog
- **store_items**: Store-specific product codes and prices
- **price_history**: Historical price tracking per store item
- **ocr_metadata**: Raw OCR data for ML training

### Price Object Format

All monetary values use standardized JSONB structure:
```json
{
  "amount": "3.99",
  "currency": "USD"
}
```

See `PRICE_OBJECT.md` for detailed documentation.

## Development

### Run Tests

```bash
npm test
```

### Code Style

- Use `logger` for all logging (not `console.log`)
- Use `asyncHandler` wrapper for all async routes
- Validate all inputs in route handlers
- Business logic belongs in service layer
- Use Dinero.js for all price calculations

### Adding New Endpoints

1. Create route handler in `src/routes/`
2. Add business logic to `src/services/`
3. Mount route in `src/app.js`
4. Add authentication middleware if needed
5. Update API documentation

## Troubleshooting

### Database Connection Errors

Check `DATABASE_URL` in `.env` and ensure PostgreSQL is running:
```bash
psql $DATABASE_URL -c "SELECT 1"
```

### OpenAI API Errors

Verify `OPENAI_API_KEY` is valid and has credits:
```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

### Port Already in Use

Change `PORT` in `.env` or kill existing process:
```bash
lsof -ti:3001 | xargs kill -9
```

## Production Deployment

See `docs/DEVOPS.md` for Docker deployment instructions.

### Security Checklist

- [ ] Change `JWT_SECRET` to strong random value
- [ ] Change `API_KEY` to strong random value
- [ ] Use HTTPS (reverse proxy with Let's Encrypt)
- [ ] Enable PostgreSQL SSL connection
- [ ] Set `NODE_ENV=production`
- [ ] Implement rate limiting (optional)
- [ ] Regular database backups

## License

Private project - not for redistribution.
