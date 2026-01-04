# Smart Pocket - Minimum Viable Product (MVP)

## Overview

This document defines the MVP feature set and acceptance criteria for Smart Pocket's initial release.

## Core Features

### 1. OCR Receipt Scanning & Transaction Management

**Primary Feature**: Scan receipts with OCR and automatically create detailed transaction records.

#### OCR Processing Options

The system supports **two modes** for extracting receipt details:

**Option 1: Traditional OCR → AI Parsing**
- Mobile app uses native OCR library to extract text from receipt image
- Send extracted text to server
- Server sends text to OpenAI for structured parsing
- **Pros**: Faster, lower cost, works with text-focused models
- **Use case**: Clear, high-quality receipts

**Option 2: Direct Image → AI Extraction**
- Mobile app sends receipt photo directly to server
- Server sends image to OpenAI (GPT-4 Vision or similar)
- AI extracts and structures data directly from image
- **Pros**: Better accuracy for poor quality receipts, handles complex layouts
- **Use case**: Blurry receipts, unusual formats, handwritten notes

**Implementation Notes**:
- Mobile app should provide UI option to choose method (or auto-detect quality)
- Both methods produce same structured output format
- Server handles both endpoints: `POST /api/v1/ocr/parse` (text) and `POST /api/v1/ocr/parse-image` (image)
- Store which method was used in OCR metadata for analytics

#### User Workflow

1. **Capture Receipt**
   - User taps "Scan Receipt" on dashboard
   - Camera screen opens for receipt capture
   - Option to select OCR method (or auto-detect)

2. **OCR Processing**
   - **Method 1**: Extract text locally → send text to server
   - **Method 2**: Send image to server → server processes with OpenAI Vision
   - Show processing indicator

3. **Review OCR Results**
   - Display extracted text (Method 1) or image (Method 2)
   - User can add remarks about quality issues
   - Continue to parsed transaction form

4. **Review & Edit Transaction**
   - Pre-filled form with AI-parsed data:
     - Date, merchant (payee), account
     - Line items with codes, names, prices, quantities
   - User reviews and edits as needed
   - Auto-suggestions for product codes based on store

5. **Save Transaction**
   - Validate all fields
   - Save to PostgreSQL with detailed line items
   - Sync simplified transaction to Actual Budget
   - Store OCR metadata for ML training

#### Data Model

**Transactions**:
- Date, payee, account, total (JSONB price object)
- Link to Actual Budget transaction ID
- Created/updated timestamps

**Line Items**:
- Store-specific product code (code_name)
- Readable product name
- Price (JSONB: amount + currency)
- Quantity (decimal for weight-based items)
- Link to store_item (optional, added when matched)

**OCR Metadata**:
- Raw OCR text (Method 1) or image reference (Method 2)
- User remarks about quality
- Processing method used (text-based or image-based)
- Confidence scores
- Correction history (for ML training)

**Store Items** (Store-specific product catalog):
- Product code at specific store (payee_id IS the store)
- Link to canonical product
- Current price, purchase frequency
- Last seen timestamp

**Products** (Canonical product catalog):
- Store-independent product definition
- Normalized name for fuzzy matching
- Category, brand, description

**Price History**:
- Track price changes over time per store_item
- Support trend analysis and price alerts

#### Acceptance Criteria

**Receipt Scanning**:
- [ ] Camera permission handling (iOS/Android)
- [ ] Receipt image capture with guide overlay
- [ ] Option to select OCR processing method
- [ ] Show preview with "Use Photo" / "Retake" options
- [ ] OCR processing with loading indicator
- [ ] Display extracted text or image with remarks field
- [ ] Handle OCR errors gracefully

**AI Parsing** (Both Methods):
- [ ] Extract merchant name with fuzzy matching to existing payees
- [ ] Parse transaction date (handle various formats)
- [ ] Extract line items with codes, names, prices, quantities
- [ ] Calculate total and validate against receipt
- [ ] Return confidence scores
- [ ] Support multi-currency receipts

**Transaction Form**:
- [ ] Pre-fill with AI-parsed data
- [ ] Date picker (defaults to current date)
- [ ] Payee dropdown with search (create new option)
- [ ] Account dropdown (synced from Actual Budget)
- [ ] Calculated total display (validation)
- [ ] Items list with expand/collapse
- [ ] Add/edit/remove line items
- [ ] Item auto-suggestions by code/name (store-specific)
- [ ] Save transaction to PostgreSQL + Actual Budget
- [ ] Return to dashboard on success

**Manual Entry Alternative**:
- [ ] Same transaction form works without OCR
- [ ] Direct access from dashboard ("Manual Transaction")

**Data Quality**:
- [ ] Store raw OCR data + corrections for ML training
- [ ] Handle fuzzy matching for store names (pg_trgm)
- [ ] Auto-suggest products based on code prefix + frequency
- [ ] Track price changes in price_history table
- [ ] Support draft payees/products (low-confidence matches)

### 2. Server Connection & Authentication

**User Story**: Connect mobile app to personal Smart Pocket server

#### Workflow

1. **Initial Setup Screen**
   - Enter server URL (HTTPS)
   - Enter API key (generated from server setup)
   - Validate connection
   - Store credentials securely (Keychain/Keystore)

2. **Two-Stage Authentication**
   - Stage 1: API key (one-time setup)
   - Stage 2: Bearer token (30-day expiry, JWT)
   - `POST /api/v1/connect` exchanges API key for token
   - Token used in `Authorization: Bearer <token>` header

3. **Session Management**
   - Remember connection (persist to dashboard)
   - Disconnect option in side menu
   - Handle 401 by re-authenticating
   - Manual disconnect clears session

#### Acceptance Criteria

- [ ] Setup screen with URL + API key fields
- [ ] HTTPS URL validation
- [ ] Connect endpoint (`POST /api/v1/connect`)
- [ ] Bearer token generation and storage
- [ ] Token expiry handling (30 days)
- [ ] Secure credential storage (platform keychain)
- [ ] Disconnect endpoint (`POST /api/v1/disconnect`)
- [ ] Side menu with disconnect button
- [ ] Return to setup screen on disconnect
- [ ] Handle network errors gracefully

### 3. Dashboard & Navigation

**User Story**: Central hub for all app actions

#### Components

- **Recent Transactions List**: Last 5-10 transactions
- **Primary Action**: "Scan Receipt" button (large, prominent)
- **Side Menu**: Settings, disconnect, help
- **Quick Actions**: Manual transaction, view all transactions

#### Acceptance Criteria

- [ ] Dashboard loads after successful connection
- [ ] Display recent transactions (date, payee, total)
- [ ] Scan Receipt button opens camera
- [ ] Side menu with hamburger icon
- [ ] Connection status indicator
- [ ] Pull to refresh transactions
- [ ] Navigation to transaction form (manual entry)

### 4. Transaction & Product Management

**User Story**: Review, edit, and track transaction details

#### Features

- **Payee Management**: Select existing or create new merchants
- **Account Selection**: Choose from Actual Budget accounts
- **Product Code Matching**: Auto-suggest based on store + code
- **Multi-Currency Support**: Each transaction has currency context

#### Acceptance Criteria

- [ ] Payee dropdown with search functionality
- [ ] Create new payee from dropdown
- [ ] Account dropdown (synced from Actual Budget)
- [ ] Product search endpoint (`GET /api/v1/products/search`)
- [ ] Auto-suggestions filtered by store (payee_id)
- [ ] Product code + name combo box in item editor
- [ ] Price objects: `{"amount": "3.99", "currency": "USD"}`
- [ ] Quantity field (supports decimals for weight)
- [ ] Currency dropdown (defaults to server config)
- [ ] Item edit modal/screen
- [ ] Add/remove items from transaction
- [ ] Validate total matches sum of items

### 5. Actual Budget Integration

**User Story**: Sync transactions to Actual Budget for budgeting

#### Integration Points

- **Accounts**: Fetch from Actual Budget for dropdown
- **Transaction Sync**: Save transaction creates simplified entry in Actual Budget
- **Bidirectional Link**: Track `actual_budget_id` in PostgreSQL

#### Data Flow

```
PostgreSQL (Smart Pocket)          Actual Budget
─────────────────────              ─────────────
Transaction with line items   →    Simplified transaction
  - Date                             - Date
  - Payee                            - Payee
  - Account                          - Account  
  - Total (calculated)               - Amount
  - Items (detailed)                 (no line items)
  - OCR metadata
  - Price history
```

#### Acceptance Criteria

- [ ] Fetch accounts from Actual Budget on connect
- [ ] Create transaction in Actual Budget on save
- [ ] Store `actual_budget_id` in PostgreSQL transaction
- [ ] Handle Actual Budget API errors
- [ ] Sync status indicator
- [ ] Option to edit/delete in Actual Budget (future)

### 6. Database Schema (PostgreSQL)

#### Core Tables

- **transactions**: Date, payee_id, account_id, total (JSONB), actual_budget_id
- **line_items**: transaction_id, store_item_id, code_name, readable_name, price (JSONB), quantity
- **products**: Canonical product catalog (name, normalized_name, category, brand)
- **store_items**: Store-specific product codes (product_id, payee_id, code_name, current_price, frequency)
- **price_history**: Price changes over time (store_item_id, price, recorded_at, transaction_id)
- **ocr_metadata**: Raw OCR data + corrections (transaction_id, raw_text/image_ref, remarks, confidence, processing_method)
- **payees**: Merchants/stores (name, actual_budget_id, transaction_count)
- **accounts**: Bank accounts (name, actual_budget_id, type)

#### Acceptance Criteria

- [ ] PostgreSQL 16+ with pg_trgm extension (fuzzy matching)
- [ ] All tables use UUID primary keys
- [ ] Timestamps: created_at, updated_at
- [ ] JSONB price objects: `{"amount": "string", "currency": "ISO-4217"}`
- [ ] Indexes on frequently queried fields
- [ ] Foreign key constraints with CASCADE
- [ ] Migrations using Prisma or similar

### 7. API Endpoints (Server)

#### Authentication
- `POST /api/v1/connect` - Exchange API key for bearer token
- `POST /api/v1/disconnect` - Invalidate session

#### OCR & Parsing
- `POST /api/v1/ocr/parse` - Parse OCR text (Method 1)
- `POST /api/v1/ocr/parse-image` - Parse receipt image directly (Method 2)

#### Transactions
- `GET /api/v1/transactions` - List transactions (pagination, filters)
- `POST /api/v1/transactions` - Create transaction
- `GET /api/v1/transactions/:id` - Get transaction details
- `PUT /api/v1/transactions/:id` - Update transaction
- `DELETE /api/v1/transactions/:id` - Delete transaction

#### Payees & Accounts
- `GET /api/v1/payees` - List payees (search support)
- `POST /api/v1/payees` - Create payee
- `GET /api/v1/accounts` - List accounts

#### Products
- `GET /api/v1/products/search` - Auto-suggest products (by code/name, filtered by store)

#### Acceptance Criteria

- [ ] OpenAPI 3.0 specification (api-spec.yaml)
- [ ] Request/response validation
- [ ] Error handling with consistent format
- [ ] Bearer token authentication (except /connect, /health)
- [ ] Rate limiting considerations
- [ ] API documentation generated from spec
- [ ] Postman collection for testing

## Out of Scope (Post-MVP)

### Optional/Personal Features (Build-time Excluded)

- **Google Sheets Sync**: Account balance sync (personal feature, excluded from distributed builds)
- **AI Spending Analysis**: Pattern detection, recommendations
- **Price Trend Alerts**: Notify on significant price changes
- **Shopping List Intelligence**: Frequency-based suggestions

### Future Enhancements

- Full-text search on item names
- Category auto-tagging via ML
- Duplicate receipt detection
- Receipt image storage (S3/local)
- Multi-store price comparison
- Product barcode linking (UPC/EAN)
- Custom ML model training

## Non-Functional Requirements

### Performance
- OCR processing: < 5 seconds (text method)
- Image processing: < 10 seconds (direct method)
- API response time: < 1 second (excluding AI calls)
- Transaction save: < 2 seconds

### Security
- HTTPS required for all API calls
- API key stored in platform keychain
- Bearer tokens expire after 30 days
- No sensitive data in logs

### Deployment
- Docker-based homeserver deployment
- One server instance per user
- PostgreSQL 16+ with JSONB support
- Node.js 20+ for server
- Mobile apps distributed via App Store (connect to personal servers)

### Testing
- Unit tests: 70% coverage threshold
- Integration tests for API endpoints
- E2E tests for critical flows (receipt scan → save)
- Manual QA for OCR accuracy

## Success Metrics

- **OCR Accuracy**: > 85% for clear receipts (both methods)
- **User Satisfaction**: Faster than manual entry
- **Data Quality**: Price history tracking enables insights
- **Adoption**: Users successfully connect and scan receipts

## Related Documentation

- [Architecture](ARCHITECTURE.md) - System design and tech stack
- [Database Schema](DATABASE.md) - Detailed table structures
- [API Documentation](API.md) - Complete endpoint reference
- [Mobile Screens](MOBILE_SCREENS.md) - UI specifications
- [Features](FEATURES.md) - Feature roadmap and optional features
- [DevOps](DEVOPS.md) - Docker deployment and testing
