# Mobile App Screen Documentation

## Overview

Smart Pocket mobile app (React Native for iOS, Android, and Web) provides a streamlined interface for scanning receipts, managing transactions, and connecting to the user's personal server.

## Navigation Architecture

```
App Launch
    ↓
[Has Session?]
    Yes → Dashboard
    No → Setup Screen
    
Dashboard
    ├── Scan Receipt Button → Camera Screen
    ├── Side Menu
    │   └── Disconnect → Setup Screen
    └── Google Sheets Sync (conditional)

Camera Screen
    └── Capture → OCR Review Screen
    
OCR Review Screen
    └── Continue → Add Transaction Screen
    
Add Transaction Screen
    └── Submit → Dashboard
```

## Screen Specifications

### 1. Setup Screen (Initial Connection)

**Purpose**: First-time connection to user's personal Smart Pocket server

**When Shown**:
- On first app launch
- After user disconnects from server
- When session is invalid/expired

**UI Elements**:
```
┌─────────────────────────────────────┐
│                                     │
│         Smart Pocket Logo           │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ Server URL                    │  │
│  │ https://smartpocket.myserver  │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ API Key                       │  │
│  │ ●●●●●●●●●●●●●●●●●●●●●●●●●●●● │  │
│  └───────────────────────────────┘  │
│                                     │
│       [Connect to Server]           │
│                                     │
│  ℹ️ Get your API key from your     │
│     server configuration            │
└─────────────────────────────────────┘
```

**Fields**:
- **Server URL** (text input)
  - Placeholder: "https://smartpocket.example.com"
  - Validation: Must be valid HTTPS URL
  - Help text below
  
- **API Key** (password input)
  - Secure text entry
  - Copy/paste enabled
  
- **Connect Button**
  - Primary action
  - Shows loading state during connection
  - Validates credentials with `/server-info` endpoint

**Behavior**:
- On successful connection:
  - Store credentials securely (Keychain/Keystore)
  - Fetch server features (Google Sheets sync enabled?)
  - Navigate to Dashboard
  
- On connection failure:
  - Show error message (invalid URL, wrong API key, server unreachable)
  - Keep user on setup screen to retry

**State Management**:
- No session yet
- Temporary loading state
- Error messages

---

### 2. Dashboard Screen

**Purpose**: Main hub for all app actions

**When Shown**:
- After successful connection
- On subsequent app launches (if session exists)
- After completing any action (scan receipt, create transaction)

**UI Elements**:
```
┌─────────────────────────────────────┐
│  ☰  Smart Pocket     [Server: ✓]   │
├─────────────────────────────────────┤
│                                     │
│         Recent Transactions         │
│  ┌───────────────────────────────┐  │
│  │ Dec 15  Walmart      $45.67   │  │
│  │ Dec 14  Target       $23.12   │  │
│  │ Dec 13  Costco      $127.89   │  │
│  └───────────────────────────────┘  │
│                                     │
│       [ 📸 Scan Receipt ]           │
│                                     │
│    [ 📊 Google Sheets Sync ]        │
│         (if enabled)                │
│                                     │
│       Quick Actions:                │
│       • Manual Transaction          │
│       • View All Transactions       │
└─────────────────────────────────────┘
```

**Components**:

**Header**:
- Hamburger menu (☰) - opens side menu
- "Smart Pocket" title
- Server connection indicator

**Recent Transactions List**:
- Last 5-10 transactions
- Each showing: date, payee, total
- Tap to view details (future feature)

**Primary Action Button**:
- **"Scan Receipt"** - Large, prominent
- Opens camera screen
- Primary use case

**Secondary Actions**:
- **Google Sheets Sync** button (conditional)
  - Only visible if server has this feature enabled
  - Shows last sync time
  - Tap to trigger sync
  
- **Manual Transaction** link
  - Opens transaction form without OCR
  
- **View All Transactions**
  - Navigate to full transaction list (future)

**Navigation**:
- Scan Receipt → Camera Screen
- Manual Transaction → Add Transaction Screen (skip OCR)
- Side Menu (☰) → Opens drawer

---

### 3. Side Menu (Drawer)

**Purpose**: Settings and account management

**UI Elements**:
```
┌─────────────────────────┐
│                         │
│  👤 Connected Server    │
│  smartpocket.server.com │
│                         │
├─────────────────────────┤
│  Settings               │
│  About                  │
│  Help                   │
├─────────────────────────┤
│  [Disconnect]           │
│                         │
└─────────────────────────┘
```

**Options**:
- **Connected Server**: Shows current server URL
- **Settings**: App preferences (future)
- **About**: App version, credits
- **Help**: Documentation, FAQs

**Disconnect Button**:
- Clear session
- Remove stored credentials
- Navigate to Setup Screen
- Confirm dialog: "Are you sure you want to disconnect?"

---

### 4. Camera Screen

**Purpose**: Capture receipt image

**When Shown**:
- User taps "Scan Receipt" from Dashboard

**UI Elements**:
```
┌─────────────────────────────────────┐
│  [X]                    [⚙️]         │
│                                     │
│   ┌───────────────────────────┐    │
│   │                           │    │
│   │    Camera Viewfinder      │    │
│   │                           │    │
│   │      [Guide Overlay]      │    │
│   │                           │    │
│   │                           │    │
│   │                           │    │
│   └───────────────────────────┘    │
│                                     │
│         [ 📷 Capture ]              │
│                                     │
│     Tips: Frame entire receipt     │
│     Ensure good lighting            │
└─────────────────────────────────────┘
```

**Components**:
- **Close Button** [X]: Return to Dashboard
- **Settings** [⚙️]: Camera settings (flash, resolution)
- **Camera Viewfinder**: Live camera feed
- **Guide Overlay**: Rectangle showing ideal framing
- **Capture Button**: Takes photo
- **Tips**: Helpful text at bottom

**Behavior**:
- Request camera permissions on first use
- Auto-focus on receipt
- Optional: Auto-detect receipt edges
- On capture:
  - Show preview with "Use Photo" / "Retake" options
  - If confirmed, process OCR and navigate to Review Screen

**Image Processing**:
- Compress image before upload
- Optional: Apply filters (contrast, brightness) for better OCR

---

### 5. OCR Review Screen

**Purpose**: Review extracted OCR text and add context

**When Shown**:
- After capturing receipt image
- OCR processing complete

**UI Elements**:
```
┌─────────────────────────────────────┐
│  Receipt Review                 [X] │
├─────────────────────────────────────┤
│  📄 OCR Extracted Text              │
│  ┌───────────────────────────────┐  │
│  │ WALMART                       │  │
│  │ DATE: 12/15/2025              │  │
│  │ ITEM 1  WM-123   3.99         │  │
│  │ ITEM 2  WM-456   2.49         │  │
│  │ TOTAL:          $6.48         │  │
│  └───────────────────────────────┘  │
│  ⚠️ Read-only - Cannot edit text    │
│                                     │
│  ✏️ Your Remarks (Optional)         │
│  ┌───────────────────────────────┐  │
│  │ Receipt slightly blurry at    │  │
│  │ bottom. Total may be unclear  │  │
│  └───────────────────────────────┘  │
│                                     │
│       [Continue to Details]         │
│       [Retake Photo]                │
└─────────────────────────────────────┘
```

**Components**:

**OCR Text Display** (Read-only):
- Scrollable text area
- Shows raw OCR output
- Cannot be edited by user
- Monospace font for clarity

**Remarks Field** (Editable):
- Multi-line text input
- Optional - user can leave blank
- Purpose: Note issues for AI parsing
  - "Blurry total line"
  - "Erasure on item 3"
  - "Receipt crumpled"
- Helps improve AI extraction accuracy

**Actions**:
- **Continue to Details**: 
  - Send OCR text + remarks to server
  - Server parses with OpenAI
  - Navigate to Add Transaction Screen with pre-filled data
  
- **Retake Photo**: 
  - Discard OCR
  - Return to Camera Screen

**Loading State**:
- Show spinner while OCR processes
- Display confidence score if available

---

### 6. Add/Edit Transaction Screen

**Purpose**: Review and edit transaction details

**When Shown**:
- After OCR review (pre-filled with AI-parsed data)
- Manual transaction entry (empty form)
- Editing existing transaction (future)

**UI Elements**:
```
┌─────────────────────────────────────┐
│  Transaction Details            [X] │
├─────────────────────────────────────┤
│  📅 Date                            │
│  [Dec 15, 2025          ▼]          │
│                                     │
│  🏪 Payee                           │
│  [Walmart               ▼]          │
│    • Select existing                │
│    • Add new                        │
│                                     │
│  💳 Account                         │
│  [Chase Checking        ▼]          │
│                                     │
│  💰 Total: $6.48                    │
│     (calculated from items)         │
│                                     │
│  📦 Items (2)              [+ Add]  │
│  ┌───────────────────────────────┐  │
│  │ WM-123 • Nestle Milk          │  │
│  │ $3.99 × 1                  [→]│  │
│  ├───────────────────────────────┤  │
│  │ WM-456 • Bananas              │  │
│  │ $2.49 × 1                  [→]│  │
│  └───────────────────────────────┘  │
│                                     │
│       [Save Transaction]            │
└─────────────────────────────────────┘
```

**Fields**:

**Date**:
- Date picker
- Defaults to current date
- Can edit to past dates

**Payee** (Dropdown):
- Select from existing payees
- Search/filter as you type
- "+ Add New Payee" option at bottom
- Opens selection screen (see below)

**Account** (Dropdown):
- Select from existing accounts
- Synced from Actual Budget
- Required field

**Total Display**:
- Auto-calculated from items
- Read-only (sum of line items)
- Shows currency
- Validates against receipt total

**Items List**:
- Each item shown as card
- Displays: code, name, price × quantity
- Tap card → opens Item Edit Screen
- **[+] Add** button to add new items

**Actions**:
- **Save Transaction**:
  - Validate all fields
  - Submit to server
  - Show success message
  - Return to Dashboard

---

### 8. Payee/Account Selection Screen

**Purpose**: Sync Actual Budget account balances to Google Sheets

**When Shown**:
- User taps "Google Sheets Sync" button from Dashboard
- Only available if server has this feature enabled (personal feature)

**UI Elements (With Pending Changes)**:
```
┌─────────────────────────────────────┐
│  Google Sheets Sync             [X] │
│  ⟳ Pull to refresh                  │
├─────────────────────────────────────┤
│  Pending Syncs (3)                  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ 💵 Cash                       │  │
│  │ Cleared:                      │  │
│  │   ₱1,234.00 → ₱1,450.00      │  │
│  │   🔴 old      🟢 new          │  │
│  │ Last synced: 2 hours ago      │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ 💳 Credit Card                │  │
│  │ Cleared:                      │  │
│  │   ₱5,000.00 → ₱4,850.00      │  │
│  │ Uncleared:                    │  │
│  │   ₱150.00 → ₱300.00          │  │
│  │ Last synced: 1 day ago        │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ 💻 Online Wallet              │  │
│  │ Uncleared:                    │  │
│  │   ₱0.00 → ₱50.00             │  │
│  │ Last synced: 5 hours ago      │  │
│  └───────────────────────────────┘  │
│                                     │
│       [Sync to Google Sheets]       │
│                                     │
└─────────────────────────────────────┘
```

**UI Elements (Empty State)**:
```
┌─────────────────────────────────────┐
│  Google Sheets Sync             [X] │
│  ⟳ Pull to refresh                  │
├─────────────────────────────────────┤
│                                     │
│         ✅                          │
│                                     │
│    All accounts are synced          │
│                                     │
│  Pull down to check for updates     │
│                                     │
│  Last synced: 2 hours ago           │
```

**Components**:

**Pull to Refresh**:
- Gesture: Pull down from top
- Action: Fetch latest balance differences from server
- Shows loading spinner while checking

**Account List**:
- Only shows accounts with pending changes
- If all accounts synced, show empty state
- Each account card displays:
  - **Account Name** witext color (🔴)
    - Arrow (→)
    - New value in green text color (🟢)
  - **Uncleared Field** (if different from synced value):
    - Same format as cleared
  - **Last Synced Timestamp**: When this account was last synced
    - Format: "2 hours ago", "1 day ago", etc.
    - New value in green (🟢)
  - **Uncleared Field** (if different from synced value):
    - Same format as cleared
  - **Rules**:
    - Don't show cleared field if value matches Google Sheets
    - Don't show uncleared field if value matches Google Sheets
    - Don't show account card at all if both fields are synced

**Sync Button**:
- Only visible when there are pending changes
- Text: "Sync to Google Sheets"
- On tap:
  - Call sync API endpoint
  - Show loading indicator
  - On success: Refresh screen (should show empty state)
  - On error: Show error message, keep changes visible

**Last Synced Timestamp**:

**Initial Load**:
1. Fetch pending sync data from server
2. Server compares Actual Budget balances vs. last synced values
3. Display only accounts with differences
4. If no differences, show empty state

**Pull to Refresh**:
1. User pulls down gesture
2. Show loading spinner
3. Fetch latest data from server
4. Update list (may add/remove accounts)

**After Sync**:
1. Call sync API: `POST /api/google-sheets/sync`
2. Server updates Google Sheets with latest balances
3. Return to empty state (all synced)
4. Update "Last synced" timestamp

**API Response Structure** (from server):
```json
{
  "pendingSyncs": [
    {
      "lastSyncedAt": "2025-12-15T08:30:00Z",
      "cleared": {
        "current": { "amount": "1450.00", "currency": "PHP" },
        "synced": { "amount": "1234.00", "currency": "PHP" }
      },
      "uncleared": null  // Already synced, don't show
    },
    {
      "accountId": "uuid",
      "accountName": "Credit Card",
      "lastSyncedAt": "2025-12-14T10:30:00Z
      "accountId": "uuid",
      "accountName": "Credit Card",
      "cleared": {
        "current": { "amount": "4850.00", "currency": "PHP" },
        "synced": { "amount": "5000.00", "currency": "PHP" }
      },
      "uncleared": {
        "current": { "amount": "300.00", "currency": "PHP" },
        "synced": { "amount": "150.00", "currency": "PHP" }
      }
    }
  ],
  "lastSyncedAt": "2025-12-15T10:30:00Z"
}
```

**Error Handling**:
- Network error: "Unable to connect. Check your connection."
- Google Sheets efont color (#D32F2F)
- New value: Green font color (#388E3C)
- Arrow: Neutral gray (→)
- Cards: Subtle border, slight shadow
- Empty state: Centered icon and text
- Last synced timestamps: Small, gray
- New value: Green text (#388E3C)
- Arrow: Neutral gray (→)
- Cards: Subtle border, slight shadow
- Empty state: Centered icon and text

**Notes**:
- This is a personal feature (excluded from distributed builds)
- Server must have Google Sheets integration configured
- Respects server's default currency
- Simple workflow: check → sync → done

---

### 8. Item Edit Screen (Modal/Full Screen)

**Purpose**: Edit individual line item details

**When Shown**:
- Tap on item card in transaction form
- Add new item

**UI Elements**:
```
┌─────────────────────────────────────┐
│  Edit Item                      [X] │
├─────────────────────────────────────┤
│  🔤 Product Code                    │
│  [WM-123           ]     [🔍]       │
│    Auto-suggestions:                │
│    • WM-123456 - Nestle Milk        │
│    • WM-123789 - Cookies            │
│                                     │
│  📝 Product Name                    │
│  [Nestle Fresh Milk              ]  │
│                                     │
│  💰 Price                           │
│  [$3.99              ] [USD ▼]      │
│                                     │
│  🔢 Quantity                        │
│  [1.0                            ]  │
│                                     │
│  💱 Currency (advanced)             │
│  [USD                 ▼]            │
│    Defaults to server config        │
│                                     │
│       [Save Item]                   │
│       [Remove Item]                 │
└─────────────────────────────────────┘
```

**Fields**:

**Product Code** (Combo Box):
- Text input with autocomplete
- As user types, show suggestions from database
- Suggestions filtered by:
  - Current payee (store)
  - Code prefix match
  - Frequency (most common first)
- Each suggestion shows: code + product name
- Can select from list or enter new code

**Product Name**:
- Text input
- Pre-filled if code is selected
- Can edit manually

**Price**:
- Decimal number input
- Currency indicator (defaults to server config)
- Validation: must be positive

**Quantity**:
- Decimal number input (supports 1.5 for weight-based items)
- Defaults to 1.0

**Currency** (Advanced):
- Dropdown, defaults to server currency
- Shows "Low-key" - not prominent
- For international receipts (Japanese yen, etc.)

**Actions**:
- **Save Item**: Return to transaction form with updated item
- **Remove Item**: Delete from list, return to form

**Auto-Suggestion UX**:
- Show top 5 matches
- Each entry shows frequency icon (🔥 for common items)
- Tap suggestion to auto-fill code + name

---

### 9. Payee/Account Selection Screen

**Purpose**: Select or create payees/accounts

**When Shown**:
- Tap payee/account dropdown in transaction form

**UI Elements**:
```
┌─────────────────────────────────────┐
│  Select Payee                   [X] │
├─────────────────────────────────────┤
│  🔍 [Search...                    ] │
│                                     │
│  Recent:                            │
│  • Walmart (42 transactions)        │
│  • Target (28 transactions)         │
│  • Costco (15 transactions)         │
│                                     │
│  All Payees (A-Z):                  │
│  • 7-Eleven                         │
│  • Amazon                           │
│  • Best Buy                         │
│  • Costco                           │
│  • CVS Pharmacy                     │
│  • ...                              │
│                                     │
│  [+ Add New Payee]                  │
└─────────────────────────────────────┘
```

**Components**:
- **Search Bar**: Filter payees as you type
- **Recent Section**: Most used payees (by transaction count)
- **All Payees**: Alphabetical list
- **Add New**: Opens dialog to enter new payee name

**Behavior**:
- Tap payee → select and return to transaction form
- Search filters list in real-time
- Show transaction count for context

---

## Cross-Screen Considerations

### State Management

**Session State**:
- Server URL
- API key (secure storage)
- Server features (Google Sheets enabled?)

**Transaction Draft**:
- Persist partially-completed transaction
- Restore on app restart
- Clear on successful save

**Recent Data Cache**:
- Payees list
- Accounts list
- Recent transactions
- Refresh periodically

### Error Handling

**Network Errors**:
- Show retry option
- Offline mode (future): Queue transactions locally

**Validation Errors**:
- Inline field validation
- Clear error messages
- Prevent submission until fixed

**Server Errors**:
- Display user-friendly messages
- Log technical details for debugging

### Loading States

**Long Operations**:
- OCR processing: "Extracting text from receipt..."
- AI parsing: "Analyzing transaction details..."
- Saving: "Saving transaction..."
- Sync: "Syncing with Actual Budget..."

**Skeleton Screens**:
- Show placeholders while loading data
- Better UX than spinners for lists

### Accessibility

- **VoiceOver/TalkBack support**: All UI elements labeled
- **Dynamic text sizing**: Respect system font settings
- **Color contrast**: WCAG AA compliant
- **Touch targets**: Minimum 44×44 points

### Platform Considerations

**iOS**:
- Native navigation patterns
- Swipe gestures
- iOS camera permissions

**Android**:
- Material Design guidelines
- Android camera API
- Back button handling

**Web**:
- Keyboard navigation
- No camera on desktop (manual upload)
- Responsive layout

---

## Future Screens (Not in Initial Release)

### Transaction Detail Screen
- View full transaction details
- Edit/delete transaction
- View linked receipt image
- Price history for items

### Transaction List Screen
- Filter by date range
- Search by payee/item
- Sort options
- Bulk actions

### Analytics/Insights Screen
- Spending trends
- AI recommendations ("You're buying X too often")
- Price comparison across stores
- Category breakdowns

### Settings Screen
- Default currency
- OCR preferences
- Notification settings
- Data export

### Product Detail Screen
- View product across all stores
- Price history chart
- Purchase frequency
- Similar products

---

## Design System Notes

### Color Palette
- Primary: Action buttons, selected items
- Secondary: Supporting actions
- Success: Confirmations, positive indicators
- Warning: Alerts, important notes
- Error: Validation errors, failed operations

### Typography
- Headings: Bold, clear hierarchy
- Body: Readable, adequate line height
- Monospace: OCR text, codes

### Spacing
- Consistent padding: 8px grid system
- Comfortable touch targets
- Visual grouping with whitespace

### Components
- Buttons: Primary, secondary, text
- Input fields: Consistent styling
- Cards: Rounded corners, subtle shadows
- Lists: Clear separators, icons

---

## Testing Considerations

### User Flows to Test
1. First-time setup and connection
2. Scan receipt → review OCR → save transaction
3. Manual transaction entry
4. Edit item with auto-suggestions
5. Disconnect and reconnect to different server
6. Handle OCR errors gracefully
7. Multi-currency receipt scanning

### Edge Cases
- No camera permissions
- Poor OCR quality (gibberish text)
- Network timeout during save
- Duplicate receipt detection
- Very long receipts (many items)
- Empty/null fields from AI parsing
