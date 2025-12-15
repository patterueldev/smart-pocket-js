# Price Object Standard

## Overview

All monetary values in Smart Pocket use a standardized JSONB price object for consistency, multi-currency support, and future flexibility.

## Structure

```json
{
  "amount": "3.99",
  "currency": "USD"
}
```

### Fields

- **amount** (string): Decimal value stored as string for exact precision
  - Use string to avoid floating-point precision issues
  - Format: decimal number with 2-4 decimal places depending on currency
  - Examples: `"3.99"`, `"1000.00"`, `"0.50"`

- **currency** (string): ISO 4217 currency code
  - 3-letter uppercase code
  - Examples: `"USD"`, `"JPY"`, `"PHP"`, `"EUR"`, `"GBP"`

## Why This Structure?

### Single Standard
- One consistent format across entire application
- TypeScript interfaces can enforce this structure
- No confusion between different price representations

### Multi-Currency Native
- Each price carries its own currency context
- No need for separate currency columns
- Handles international receipts naturally

### Exact Precision
- String amount avoids JavaScript floating-point errors
- PostgreSQL JSONB stores exactly what you give it
- Convert to Decimal only when performing calculations

### Future-Proof
- Can add metadata if needed (exchange rate, original currency, etc.)
- Structure is permanent and versioned
- Easy to extend without schema migrations

## Usage in Code

### TypeScript Interface

```typescript
interface Price {
  amount: string;  // Decimal as string
  currency: string; // ISO 4217 code
}

// Example
const price: Price = {
  amount: "3.99",
  currency: "USD"
};
```

### Creating Price Objects

```typescript
import Dinero from 'dinero.js';

// From user input (dollars)
function createPrice(dollars: number, currency: string = 'USD'): Price {
  const dineroObj = Dinero({ amount: Math.round(dollars * 100), currency });
  return {
    amount: dineroObj.toUnit().toFixed(2),
    currency: currency
  };
}

// From receipt OCR (already string)
function createPriceFromOCR(amountStr: string, currency: string): Price {
  return {
    amount: parseFloat(amountStr).toFixed(2),
    currency: currency
  };
}
```

### Calculations

**Always use a money library** - never perform arithmetic directly on the string amount.

```typescript
import Dinero from 'dinero.js';

function calculateTotal(items: Array<{ price: Price, quantity: number }>): Price {
  // Convert to Dinero objects
  const dineroItems = items.map(item => {
    const cents = Math.round(parseFloat(item.price.amount) * 100);
    return Dinero({ amount: cents, currency: item.price.currency }).multiply(item.quantity);
  });
  
  // Sum
  const total = dineroItems.reduce((sum, item) => sum.add(item));
  
  // Convert back to Price object
  return {
    amount: total.toUnit().toFixed(2),
    currency: total.getCurrency()
  };
}
```

### Displaying Prices

```typescript
function formatPrice(price: Price): string {
  const amount = parseFloat(price.amount);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: price.currency
  }).format(amount);
}

// Examples:
// { amount: "3.99", currency: "USD" } → "$3.99"
// { amount: "1000", currency: "JPY" } → "¥1,000"
// { amount: "45.67", currency: "PHP" } → "₱45.67"
```

## PostgreSQL Usage

### Querying

```sql
-- Get transactions in USD with total > $50
SELECT * FROM transactions
WHERE (total->>'currency') = 'USD'
  AND (total->>'amount')::DECIMAL > 50.00;

-- Get average price for a store item
SELECT 
    store_item_id,
    AVG((price->>'amount')::DECIMAL) as avg_price,
    (price->>'currency') as currency
FROM price_history
GROUP BY store_item_id, (price->>'currency');
```

### Indexing

For faster queries on amount:
```sql
CREATE INDEX idx_transactions_amount ON transactions ((total->>'amount'));
CREATE INDEX idx_price_history_amount ON price_history ((price->>'amount'));
```

### Validation

Use CHECK constraints to ensure valid structure:
```sql
ALTER TABLE transactions 
ADD CONSTRAINT valid_total_structure 
CHECK (
  total ? 'amount' AND 
  total ? 'currency' AND
  length(total->>'currency') = 3
);
```

## API Examples

### Request Body

```json
{
  "date": "2025-12-15",
  "payeeId": "550e8400-e29b-41d4-a716-446655440000",
  "accountId": "660e8400-e29b-41d4-a716-446655440000",
  "items": [
    {
      "codeName": "WM-123456",
      "readableName": "Nestle Fresh Milk",
      "price": {
        "amount": "3.99",
        "currency": "USD"
      },
      "quantity": 1
    },
    {
      "codeName": "WM-789012",
      "readableName": "Organic Bananas",
      "price": {
        "amount": "2.49",
        "currency": "USD"
      },
      "quantity": 1.5
    }
  ]
}
```

### Response

```json
{
  "id": "770e8400-e29b-41d4-a716-446655440000",
  "date": "2025-12-15",
  "payee": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Walmart"
  },
  "account": {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "name": "Chase Checking"
  },
  "total": {
    "amount": "7.73",
    "currency": "USD"
  },
  "items": [...]
}
```

## Testing

```typescript
describe('Price Object', () => {
  it('should maintain exact precision', () => {
    const price: Price = { amount: "0.10", currency: "USD" };
    expect(price.amount).toBe("0.10"); // Not "0.1"
  });

  it('should support different currencies', () => {
    const prices: Price[] = [
      { amount: "3.99", currency: "USD" },
      { amount: "1000", currency: "JPY" },
      { amount: "45.67", currency: "PHP" }
    ];
    // All valid
  });

  it('should calculate correctly with money library', () => {
    const item1: Price = { amount: "3.99", currency: "USD" };
    const item2: Price = { amount: "2.00", currency: "USD" };
    const total = calculateTotal([
      { price: item1, quantity: 1 },
      { price: item2, quantity: 2 }
    ]);
    expect(total.amount).toBe("7.99");
  });
});
```

## Migration Notes

When migrating existing decimal columns:

```sql
-- Example migration
UPDATE transactions SET
  total = jsonb_build_object(
    'amount', total_amount::text,
    'currency', COALESCE(currency, 'USD')
  );
```

## Best Practices

1. **Always store as string**: Even if you receive a number, convert to string immediately
2. **Use money library for all calculations**: Never do arithmetic on strings
3. **Validate currency codes**: Ensure they're valid ISO 4217 codes
4. **Handle precision correctly**: Different currencies have different decimal places
   - USD, EUR: 2 decimals
   - JPY: 0 decimals (yen doesn't have cents)
   - KWD: 3 decimals (fils)
5. **Don't mix currencies**: Validate all items in a transaction use the same currency (or handle conversion)

## Common Pitfalls to Avoid

❌ **Don't do this:**
```typescript
const total = item1.price.amount + item2.price.amount; // String concatenation!
```

✅ **Do this:**
```typescript
const total = calculateTotal([item1, item2]); // Use money library
```

❌ **Don't do this:**
```typescript
const price = { amount: 3.99, currency: "USD" }; // Number!
```

✅ **Do this:**
```typescript
const price = { amount: "3.99", currency: "USD" }; // String!
```
