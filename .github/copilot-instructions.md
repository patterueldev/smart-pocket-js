# Smart Pocket JS - AI Coding Instructions

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

## Architecture
```
React Native App (Frontend)
    ↓ (API Key)
User's Personal Server (JavaScript/Node.js)
    ↓ (Direct integration)
Actual Budget (on same server or nearby)
```

**Why Server Middleware?**
- Actual Budget's API/QL library may not be React Native compatible
- Server provides abstraction layer for Actual Budget integration
- Hides API keys (OpenAI, etc.) from client app
- Delegates heavy processing (OCR, AI analysis) to server
- Single source of truth for data transformations

**Deployment Pattern**: Homeserver model
- Each user deploys their own server instance (Docker, VPS, home server)
- Mobile app connects to user's personal server endpoint
- Data stays on user's infrastructure (privacy-first)
- Server handles: OCR processing, database, Actual Budget integration, AI features

**Authentication Model**: Server connection, not user auth
- No traditional user authentication (each server = one user)
- Mobile app "authenticates" by connecting to user's server with API key
- API key generated/configured on server, entered once in mobile app
- **Session persistence**: Connection remembered, user goes to dashboard on app open
- **Disconnect/reconnect**: Users can disconnect and connect to different servers
- Connection persists after initial setup

## Development Workflow

### Commands
*Add common commands here as they're defined (e.g., build, test, dev server)*

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

## Testing Approach
*Document testing patterns, test location conventions, and how to run tests*

## Common Patterns
*Add frequently used patterns and idioms specific to this project*

## Feature Planning

### App Onboarding & Setup
**User Flow**: First-time app setup for connecting to personal server

1. User downloads Smart Pocket app from App Store
2. App opens to setup/"login" screen (no account creation)
3. User enters:
   - Smart Pocket server URL (e.g., `https://smartpocket.myhome.server`)
   - API key (generated from their server)
4. App validates connection and stores credentials
5. Navigate to dashboard (session remembered for future app opens)
6. Side menu accessible from dashboard:
   - Disconnect button (clears session, returns to setup screen)
   - Allows connecting to different servers

**No Traditional Authentication**: Each server instance = one user. The "auth" is just connecting the app to the right server.

**Mobile App Screen Flow**:
1. **Initial Setup Screen**: Enter server URL + API key (shown only when not connected)
2. **Dashboard Screen**: Main hub (default screen when session exists)
   - Primary action: "Scan Receipt" button
   - Google Sheets sync button (visible only if feature enabled on server)
3. **Side Menu**: Accessible from dashboard
   - Disconnect button (clears session, returns to setup)
4. **Camera Screen**: Activated from "Scan Receipt" button
5. **OCR Review Screen**: After scanning
   - Display OCR text (read-only, not editable)
   - "Remarks" field (editable): User can note issues ("erasure on line 3", etc.)
   - Helps improve AI extraction accuracy
6. **Add/Edit Transaction Screen**: Form for transaction details
   - Used after OCR review or for manual entry
   - **Transaction Fields**:
     - Date field
     - Payee field (dropdown with selection screen for existing/new payees)
     - Account field (dropdown with selection screen for existing/new accounts)
     - Total price (displays calculated total for validation against receipt)
     - Items section (expandable list, add/remove items)
   - **Item List Cards** (read-only display):
     - Code Name: Item's code from receipt (often abbreviated, varies by store)
     - Readable Name: Actual product name
     - Price: Individual item price (currency TBD - consider international receipts)
     - Quantity: Item quantity
   - **Item Edit Modal/Screen**: Tap item card to edit
     - Code Name field (combo box with auto-suggest from existing database codes)
     - Readable Name field
     - Price field
     - Quantity field
     - Currency field (low-key, defaults to server config)
   - Submit button to save transaction

### Primary Feature: OCR Receipt Scanning & Transaction Management
**User Story**: As a user, I want to scan receipts with OCR and automatically create detailed transaction records, so I can track spending patterns and make informed purchase decisions.

**Workflow**:
1. User taps "Scan Receipt" on dashboard
2. Camera screen opens for receipt capture
3. OCR processes image, extracts raw text
4. Review screen displays:
   - Raw OCR text (read-only)
   - Remarks field (editable) for user notes about issues/context
5. System sends OCR text + remarks to server
6. Server uses OpenAI to extract structured transaction details
7. User reviews/enhances extracted data in transaction form
8. Store complete data: OCR text, remarks, corrections, final transaction
9. Save to PostgreSQL with full itemization
10. Sync transaction to Actual Budget server

**Data Model Requirements**:
- **Transactions**: merchant/payee, date, total, account, currency
- **Line Items**: code name (store-specific), readable name, quantity, price, currency
- **Item Code Mapping**: Complex relationship - code names vary by store/merchant
  - Same product can have different codes at different stores
  - Auto-suggest existing codes to reduce manual mapping
- **Price History**: track item prices over time for trend analysis
- **OCR Metadata**: raw text, remarks, confidence scores, correction history
- **Actual Budget Sync**: mapping between local DB and Actual Budget records
- **Payees/Accounts**: Reusable entities for dropdowns

**Manual Entry Alternative**: Same transaction form works for manual input without OCR

### Optional/Personal Features
- **AI Spending Analysis** (optional): Pattern detection, purchase frequency tracking
- **Smart Recommendations** (optional): "You're buying this too often", "You don't need this"
- **Price Trend Alerts**: Notify when tracked items change price significantly
- **Shopping List Intelligence**: Suggest items based on purchase frequency
- **Google Sheets Sync** (personal - excluded from distributed builds): Sync account balances to Google Sheets
  - Located in `/packages/personal/google-sheets-sync`
  - Not included in public builds via build configuration

## External Dependencies
- **Actual Budget**: Core backend for budget data
  - Integration via QL library (primary approach)
  - Open source project - refer to their documentation for API patterns
- **OpenAI**: OCR text parsing and data extraction
  - Extract merchant, date, items, prices from receipt text
  - Potentially for AI spending insights (optional features)
- **PostgreSQL**: Relational database for complex data relationships
  - Transactions, line items, price history, OCR metadata
  - Supports rich querying for trend analysis
  - Uses DECIMAL for price storage (exact precision)
- **Money/Currency Library**: For accurate monetary calculations
  - Needed for price arithmetic, totals, multi-currency conversions
  - Options: dinero.js, currency.js, or similar
  - Must handle DECIMAL precision correctly
- **React Native**: Mobile + web UI with camera integration
- **Docker**: Container deployment for easy homeserver setup

## Notes for AI Assistants
- Project is in early planning/development phase
- **SDK-based architecture**: Features are independent packages in a monorepo
- **Build-time exclusions**: Use build config to exclude `/packages/personal/*` from distributed versions
- **Homeserver deployment model**: Design for single-user instances, not multi-tenant SaaS
- **Server middleware is essential**: Don't assume React Native can directly talk to Actual Budget
  - Server provides API compatibility layer
  - Hides sensitive API keys (OpenAI, etc.)
  - Handles heavy processing (OCR, AI)
- **Authentication model**: No traditional user auth - just server connection setup
  - Mobile app connects to user's personal server with API key
  - One server = one user (no multi-user auth needed)
  - API key for server-to-app communication, not user sessions
- Always consider feature modularity - ask "should this be optional?" when implementing features
- Prefer TypeScript for type safety across all packages
- When integrating with Actual Budget, consider the abstraction layer carefully
- **Item code complexity**: Code names are store-specific, same product has different codes at different merchants
  - Design for code → product mapping per store
  - Auto-suggest existing codes to help users map items efficiently
- **Currency handling**: Support international receipts (multi-currency consideration)
- Some features are personal requirements - design them as opt-in/configurable
- **Monetary calculations**: Always use a proper money library (dinero.js, currency.js, etc.)
  - Never use raw floating-point arithmetic for prices
  - Database stores DECIMAL, library ensures accurate calculations
  - Handle multi-currency conversions with proper rounding
- **OCR workflow is the primary feature** - prioritize this when making architectural decisions
- Store raw OCR data + corrections for future ML fine-tuning
- **PostgreSQL schema**: Design for relationships - transactions → line items → price history
- **OpenAI integration**: Use for parsing OCR text into structured transaction data
- Sync strategy: PostgreSQL detailed DB → Actual Budget simplified transactions
- **Docker deployment**: Docker Compose for server + PostgreSQL + Actual Budget
- **React Native**: Target both mobile (iOS/Android) and web platforms
- Mobile app must support configurable server endpoints (user enters their server URL)
- Package management: likely pnpm workspaces or npm workspaces for monorepo
