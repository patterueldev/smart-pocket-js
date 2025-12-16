# Smart Pocket JS

Personal finance management system with OCR receipt scanning - designed for homeserver deployment.

## Overview

Smart Pocket helps you track spending by scanning receipts with OCR, extracting detailed transaction data (individual items, prices, quantities), and syncing simplified transactions to Actual Budget. It's a personal project designed to run on your own server.

### Key Features

- 📸 **OCR Receipt Scanning**: Capture receipts with mobile camera, extract text, parse with AI
- 🛍️ **Detailed Item Tracking**: Track individual items, quantities, prices per transaction
- 💰 **Price History**: Monitor price changes over time per store
- 🔄 **Actual Budget Integration**: Sync simplified transactions to Actual Budget
- 📊 **Multi-Currency Support**: JSONB price objects with exact precision
- 🏪 **Store-Specific Product Codes**: Map product codes to canonical products per merchant
- 🔍 **Fuzzy Product Search**: Auto-suggest items based on partial code or name
- 📱 **React Native App**: iOS, Android, and web support

### Architecture

```
React Native Mobile App
    ↓ (HTTPS, Bearer Token Auth)
Node.js Express Server (your homeserver)
    ↓
PostgreSQL Database
    ↓
Actual Budget (optional sync)
```

**Deployment Model**: Each user runs their own server instance (Docker, VPS, home server). Mobile apps connect to personal server endpoint.

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- Docker (for containerized deployment)
- OpenAI API key (for OCR parsing)
- Actual Budget instance (optional but recommended)

### Option 1: Local Development

```bash
# Clone repository
git clone <repo-url>
cd smart-pocket-js

# Install dependencies
npm install

# Setup server
cd packages/server
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
npm run migrate

# Start server
npm run dev
```

Server runs on `http://localhost:3001`

### Option 2: Docker Deployment

```bash
# Development environment
npm run docker:dev

# Production environment  
npm run docker:prod
```

See [docs/DEVOPS.md](docs/DEVOPS.md) for comprehensive deployment guide.

## Documentation

### Core Documentation

- **[API.md](docs/API.md)** - Complete API documentation with examples
- **[DATABASE.md](docs/DATABASE.md)** - PostgreSQL schema and design
- **[MOBILE_SCREENS.md](docs/MOBILE_SCREENS.md)** - Mobile UI specifications
- **[DEVOPS.md](docs/DEVOPS.md)** - Docker deployment and testing

### Technical References

- **[PRICE_OBJECT.md](docs/PRICE_OBJECT.md)** - Price standardization guide
- **[api-spec.yaml](docs/api-spec.yaml)** - OpenAPI 3.0 specification
- **[Postman Collection](docs/smart-pocket.postman_collection.json)** - API testing collection

### External API Documentation

- **[External APIs Overview](docs/external-apis/README.md)** - Integration guide for external services
- **[Quick Reference](docs/external-apis/QUICK_REFERENCE.md)** - Quick start for all APIs
- **[Actual Budget](docs/external-apis/actual-budget/README.md)** - Budget integration guide
- **[OpenAI](docs/external-apis/openai/README.md)** - Receipt parsing with AI
- **[PostgreSQL](docs/external-apis/postgresql/README.md)** - Database features & extensions
- **[Google Sheets](docs/external-apis/google-sheets/README.md)** - Balance sync (personal feature)

### Package Documentation

- **[Server README](packages/server/README.md)** - Node.js server documentation
- **[Server Quick Start](packages/server/QUICKSTART.md)** - 5-minute setup guide
- **[Implementation Summary](packages/server/IMPLEMENTATION.md)** - What's built and what's pending

## Project Structure

```
smart-pocket-js/
├── packages/
│   ├── server/              # Node.js Express backend ✅
│   │   ├── src/
│   │   │   ├── routes/      # API endpoints (9 routes)
│   │   │   ├── services/    # Business logic
│   │   │   ├── middleware/  # Auth, error handling
│   │   │   ├── database/    # Schema, migrations
│   │   │   └── utils/       # Logger, price utilities
│   │   ├── .env.example
│   │   ├── package.json
│   │   └── README.md
│   ├── app/                 # React Native mobile app (TODO)
│   ├── ui/                  # Shared UI components (TODO)
│   ├── shared/              # Shared types, utilities (TODO)
│   └── core/                # Core SDK (TODO)
├── docs/                    # Documentation ✅
│   ├── API.md
│   ├── DATABASE.md
│   ├── MOBILE_SCREENS.md
│   ├── DEVOPS.md
│   ├── PRICE_OBJECT.md
│   ├── api-spec.yaml
│   ├── smart-pocket.postman_collection.json
│   ├── smart-pocket.postman_environment.json
│   └── external-apis/      # External API references ✅
│       ├── README.md
│       ├── QUICK_REFERENCE.md
│       ├── actual-budget/
│       ├── openai/
│       ├── postgresql/
│       └── google-sheets/
├── deploy/                  # Docker files (TODO)
│   ├── docker/
│   └── scripts/
├── .github/
│   └── copilot-instructions.md  # AI coding guidelines ✅
├── package.json             # Root workspace config ✅
├── pnpm-workspace.yaml      # Workspace definition ✅
└── README.md                # This file ✅
```

**Status**:
- ✅ **Complete**: Server implementation, API documentation, database schema
- 🚧 **In Progress**: Mobile app (planned)
- 📋 **Pending**: Docker deployment files, integration tests

## API Endpoints

All endpoints require bearer token authentication (except `/health` and `/connect`).

### Authentication

- `POST /api/v1/connect` - Exchange API key for bearer token (30-day expiry)
- `POST /api/v1/disconnect` - Invalidate session

### Core Features

- `POST /api/v1/ocr/parse` - Parse OCR text with OpenAI
- `GET/POST/PUT/DELETE /api/v1/transactions` - Transaction CRUD
- `GET /api/v1/payees` - List merchants
- `GET /api/v1/accounts` - List payment methods
- `GET /api/v1/products/search` - Search products with fuzzy matching

### Optional Features

- `GET/POST /api/v1/google-sheets/sync` - Sync account balances (personal feature)

See [API.md](docs/API.md) for detailed documentation.

## Database Schema

### Core Tables

- **payees**: Merchants/vendors
- **accounts**: Bank accounts (synced from Actual Budget)
- **transactions**: Transaction records with JSONB total price
- **line_items**: Individual items within transactions
- **products**: Canonical product catalog
- **store_items**: Store-specific product codes and prices
- **price_history**: Historical price tracking per store
- **ocr_metadata**: Raw OCR data for ML training

**Key Design**: Product codes are store-specific (same product has different codes at different stores). The system uses 3-phase fuzzy matching to link items across stores.

See [DATABASE.md](docs/DATABASE.md) for detailed schema.

## Development

### Monorepo Structure

Uses pnpm workspaces for monorepo management:

```bash
# Install all dependencies
npm install

# Run server in development mode
npm run dev

# Build all packages
npm run build

# Run tests
npm run test
```

### Package Scripts

- `npm run dev` - Start development environment
- `npm run docker:dev` - Start Docker development stack
- `npm run docker:prod` - Start Docker production stack
- `npm run docker:test` - Run test environment
- `npm run test` - Run all tests
- `npm run migrate` - Run database migrations

### Adding New Packages

```bash
# Create new package
mkdir -p packages/my-package
cd packages/my-package
npm init -y

# Link to workspace (auto-detected by pnpm)
```

## Testing

### Manual Testing

```bash
# Start server
cd packages/server
npm run dev

# Test with curl
curl http://localhost:3001/health
```

### Postman Testing

1. Import `docs/smart-pocket.postman_collection.json`
2. Import `docs/smart-pocket.postman_environment.json`
3. Set `baseUrl` and `apiKey` in environment
4. Test all endpoints

### Automated Testing (Future)

```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# API tests against running services
npm run test:api
```

## Deployment

### Docker (Recommended)

```bash
# Build images
npm run docker:build

# Deploy to homeserver
./deploy/scripts/deploy.sh homeserver.local
```

See [DEVOPS.md](docs/DEVOPS.md) for:
- 3 Docker environments (dev/prod/test)
- Docker Compose configurations
- Testing strategies
- Deployment workflows

### Manual Deployment

1. Set up PostgreSQL database
2. Configure `.env` with production values
3. Run migrations: `npm run migrate`
4. Start server: `npm start`
5. Set up nginx reverse proxy with HTTPS

## Security

### Authentication

- Two-stage auth: API key → JWT bearer token
- Tokens expire after 30 days of inactivity
- No traditional user accounts (one server = one user)

### Best Practices

- API keys stored securely in Keychain/Keystore
- JWT secrets generated with crypto.randomBytes(32)
- PostgreSQL connections over SSL in production
- HTTPS enforced via reverse proxy (nginx + Let's Encrypt)
- Helmet.js for security headers

## Configuration

All configuration via environment variables:

### Server Configuration

```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgres://user:pass@localhost:5432/smart_pocket
JWT_SECRET=<random-secret>
API_KEY=<random-api-key>
OPENAI_API_KEY=sk-...
ACTUAL_BUDGET_URL=http://localhost:5006
DEFAULT_CURRENCY=USD
GOOGLE_SHEETS_ENABLED=false
```

See [.env.example](packages/server/.env.example) for full list.

## Roadmap

### Phase 1: Core Backend (✅ Complete)

- [x] Express server with authentication
- [x] PostgreSQL database schema
- [x] API endpoints (9 total)
- [x] OCR parsing with OpenAI
- [x] Transaction management
- [x] Product search with fuzzy matching
- [x] Price object utilities
- [x] Logging and error handling
- [x] Database migrations

### Phase 2: Docker Deployment (📋 Pending)

- [ ] Dockerfile for server
- [ ] Docker Compose files (dev/prod/test)
- [ ] nginx configuration
- [ ] Deployment scripts
- [ ] CI/CD pipeline

### Phase 3: Mobile App (📋 Pending)

- [ ] React Native setup
- [ ] Camera integration
- [ ] OCR capture screen
- [ ] Transaction form UI
- [ ] Server connection setup
- [ ] Navigation and routing

### Phase 4: Integrations (📋 Pending)

- [ ] Actual Budget QL library integration
- [ ] Google Sheets API integration (optional)
- [ ] Receipt image storage (S3/local)
- [ ] Price change notifications

### Phase 5: Testing & Quality (📋 Pending)

- [ ] Unit tests (Jest)
- [ ] Integration tests (Supertest)
- [ ] API endpoint tests
- [ ] Database migration tests
- [ ] E2E tests (mobile app)

### Phase 6: Advanced Features (Future)

- [ ] AI spending insights
- [ ] Price trend analysis
- [ ] Smart shopping recommendations
- [ ] Barcode scanning
- [ ] Multi-currency exchange rates
- [ ] Export to CSV/Excel

## Contributing

This is a personal project. If you're building something similar, feel free to use this as inspiration.

## License

Private project - not for redistribution.

## Notes

- **Homeserver model**: Each user runs their own instance
- **No multi-user support**: One server = one user (by design)
- **Privacy-first**: All data stays on your infrastructure
- **Self-hosted**: No cloud dependencies except OpenAI API
- **Modular design**: Features can be enabled/disabled per deployment
- **SDK approach**: Core can be distributed, personal features excluded from builds

## Support

- **Documentation**: See `docs/` folder
- **Issues**: File issues on GitHub (if public)
- **Questions**: Check documentation first, then open discussion

## Acknowledgments

- **Actual Budget**: Open source budgeting backend
- **OpenAI**: GPT-4 for OCR parsing
- **React Native**: Cross-platform mobile framework
- **PostgreSQL**: Robust relational database
- **Dinero.js**: Money calculations library

---

**Built with**: Node.js, Express, PostgreSQL, React Native, OpenAI  
**Designed for**: Homeserver deployment (one instance per user)  
**Status**: Development - Core backend complete, mobile app pending
