# Smart Pocket - Feature Planning

## App Onboarding & Setup

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

## Primary Feature: OCR Receipt Scanning & Transaction Management

**User Story**: As a user, I want to scan receipts with OCR and automatically create detailed transaction records, so I can track spending patterns and make informed purchase decisions.

**Workflow**:
1. User taps "Scan Receipt" on dashboard
2. Camera screen opens for receipt capture
3. OCR processes image, extracts raw text
4. Review screen displays OCR text with remarks field
5. Server parses OCR text with AI (OpenAI)
6. Transaction form pre-filled with parsed data
7. User reviews/edits items, payee, account
8. Submit transaction
9. Server saves to PostgreSQL + syncs to Actual Budget

**Data Model**:
- **Transactions**: Date, payee, account, total, Actual Budget sync
- **Line Items**: Individual receipt items with codes and prices
- **Products**: Canonical product catalog (store-independent)
- **Store Items**: Store-specific product codes and prices
- **Price History**: Track item prices over time for trend analysis
- **OCR Metadata**: Raw text, remarks, confidence scores, correction history
- **Actual Budget Sync**: Mapping between local DB and Actual Budget records
- **Payees/Accounts**: Reusable entities for dropdowns

**Manual Entry Alternative**: Same transaction form works for manual input without OCR

## Optional/Personal Features

### AI Spending Analysis (Optional)
- Pattern detection in purchase behavior
- Purchase frequency tracking
- Category-based spending trends

### Smart Recommendations (Optional)
- "You're buying this too often"
- "You don't need this" suggestions
- Budget-based purchase warnings

### Price Trend Alerts
- Notify when tracked items change price significantly
- Compare prices across stores
- Historical price charts per product

### Shopping List Intelligence
- Suggest items based on purchase frequency
- Predict when items might run out
- Smart shopping reminders

### Google Sheets Sync (Personal Feature - Build Excluded)
- Sync account balances to Google Sheets
- Located in `/packages/personal/google-sheets-sync`
- Not included in public builds via build configuration
- Two-stage workflow:
  1. GET `/google-sheets/sync/draft` - Preview pending changes
  2. POST `/google-sheets/sync/approve/:draftId` - Execute sync

## Future Enhancements

- Full-text search on item names
- Category auto-tagging via ML (classify products automatically)
- Duplicate receipt detection (same receipt scanned twice)
- Receipt image storage (S3/local filesystem)
- Multi-currency exchange rate tracking
- Product barcode linking (UPC/EAN codes for universal matching)
- Store location tracking (price varies by store location)
- Seasonal product detection (flags items that are time-limited)
- Automatic brand extraction from product names
- Cross-store price comparison alerts
- Custom ML model trained on user corrections

## Related Documentation

- [Mobile App Screens](MOBILE_SCREENS.md) - Detailed UI specifications
- [API Documentation](API.md) - Feature endpoints
- [Database Schema](DATABASE.md) - Data models
- [Architecture](ARCHITECTURE.md) - System design
