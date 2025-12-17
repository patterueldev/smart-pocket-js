# Smart Pocket - Architecture Documentation

## Project Overview

Smart Pocket is a personal finance management application that integrates with Actual Budget (open source budgeting backend). While primarily a personal project, it's designed to potentially support multiple users. Features are modular and configurable - some are personal/optional, others are core functionality.

## Technology Stack

- **Frontend**: React Native (mobile + web)
- **Backend**: JavaScript/Node.js server
- **Database**: PostgreSQL (relational model needed for complex item/transaction relationships)
- **AI/OCR**: OpenAI for extracting details from OCR text
- **Deployment**: Docker (homeserver pattern)
  - Each user runs their own dedicated server instance
  - Apps distributed via App Store, but connect to personal servers
  - Self-hosted or personal cloud (similar to Actual Budget's model)
- **Data Source**: Actual Budget integration
  - Dedicated server using Actual Budget's QL library (likely approach)
  - Community REST HTTP library as fallback

## System Architecture

```
React Native App (Frontend)
    ↓ (API Key)
User's Personal Server (JavaScript/Node.js)
    ↓ (Direct integration)
Actual Budget (on same server or nearby)
```

### Why Server Middleware?

- Actual Budget's API/QL library may not be React Native compatible
- Server provides abstraction layer for Actual Budget integration
- Hides API keys (OpenAI, etc.) from client app
- Delegates heavy processing (OCR, AI analysis) to server
- Single source of truth for data transformations

### Deployment Pattern: Homeserver Model

- Each user deploys their own server instance (Docker, VPS, home server)
- Mobile app connects to user's personal server endpoint
- Data stays on user's infrastructure (privacy-first)
- Server handles: OCR processing, database, Actual Budget integration, AI features

### Authentication Model: Server Connection

- No traditional user authentication (each server = one user)
- Mobile app "authenticates" by connecting to user's server with API key
- API key generated/configured on server, entered once in mobile app
- **Session persistence**: Connection remembered, user goes to dashboard on app open
- **Disconnect/reconnect**: Users can disconnect and connect to different servers
- Connection persists after initial setup

## Code Conventions

### Feature Architecture

- **SDK-based modular design**: Core functionality separated into distributable packages
- Features/UI/services structured as independent packages (monorepo/workspace pattern)
- **Build-time feature exclusion**: Personal features excluded from distributed builds, not just config
- Core SDK can be distributed; personal features remain private
- Use feature flags or configuration to enable/disable optional functionality at runtime
- Design for extensibility - other users may want different feature sets

### Package Structure

Expected monorepo layout:

- `/packages/core` - Core SDK, distributable
- `/packages/features/*` - Feature packages (OCR, transactions, etc.)
- `/packages/ui` - Shared UI components
- `/packages/services` - Backend service interfaces
- `/packages/personal/*` - Personal features (excluded from distributed builds)
  - Example: `/packages/personal/google-sheets-sync`
- Build configuration determines which packages are included in final apps

### File Organization

- `/packages` - Monorepo with independent packages
  - `/packages/core` - Core SDK
  - `/packages/server` - Node.js backend services
    - OCR processing pipeline
    - Actual Budget integration layer
    - Database management
  - `/packages/mobile` or `/packages/app` - React Native frontend
    - Camera/OCR capture
    - Transaction forms and review UI
    - Server connection management
  - `/packages/features/*` - Feature packages
    - `/packages/features/ocr` - OCR transaction processing
    - `/packages/features/price-history` - Price tracking
    - `/packages/features/ai-insights` - AI spending analysis (optional)
  - `/packages/personal/*` - Personal features (build-time excluded)
    - `/packages/personal/google-sheets-sync` - Account balance sync
  - `/packages/shared` - Shared types, utilities
  - `/packages/ui` - Shared UI components
- `/deploy` or `/docker` - Deployment configurations
- Root: Workspace configuration (pnpm-workspace.yaml, lerna.json, etc.)

## External Dependencies

- **Actual Budget**: Core backend for budget data
  - Docker image: `docker.io/actualbudget/actual-server:latest`
  - Integration via QL library (primary approach)
  - Open source project - refer to their documentation for API patterns
- **OpenAI**: OCR text parsing and data extraction
  - Extract merchant, date, items, prices from receipt text
  - Potentially for AI spending insights (optional features)
- **PostgreSQL**: Relational database for complex data relationships
  - Docker image: `postgres:16-alpine`
  - Transactions, line items, price history, OCR metadata
  - Supports rich querying for trend analysis
  - Uses JSONB for price objects (exact precision)
  - Extensions: pg_trgm (fuzzy matching), uuid-ossp
- **Money/Currency Library**: For accurate monetary calculations
  - Needed for price arithmetic, totals, multi-currency conversions
  - Options: dinero.js, currency.js, or similar
  - Must handle DECIMAL precision correctly
- **React Native**: Mobile + web UI with camera integration
  - Web version deployed via nginx in Docker
- **Docker**: Container deployment for easy homeserver setup
  - Development, production, and test environments
  - Docker Compose orchestration

## Related Documentation

- [API Documentation](API.md) - REST API endpoints and workflows
- [Database Schema](DATABASE.md) - PostgreSQL table structure
- [DevOps Guide](DEVOPS.md) - Docker deployment and testing
- [Price Object Standard](PRICE_OBJECT.md) - Monetary value handling
- [Mobile App Screens](MOBILE_SCREENS.md) - UI specifications
- [Feature Planning](FEATURES.md) - Feature roadmap and optional features
