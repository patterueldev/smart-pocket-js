# AI Assistant Guide - Using External API Documentation

This guide helps AI assistants effectively use the external API documentation when implementing features.

## When to Reference These Docs

**Always read the relevant API documentation** before generating code that integrates with external services:

- ❌ Don't: Generate code from memory or general knowledge
- ✅ Do: Read the specific docs in `docs/external-apis/[service]/README.md`

## Quick Decision Tree

```
Need to implement a feature?
    ↓
Does it integrate with external service?
    ↓ Yes
Which service?
    ↓
┌─────────────────┬───────────────┬─────────────────┬──────────────────┐
│ Actual Budget   │ OpenAI        │ PostgreSQL      │ Google Sheets    │
│ (Transactions)  │ (OCR Parsing) │ (Database)      │ (Sync - Personal)│
└─────────────────┴───────────────┴─────────────────┴──────────────────┘
         ↓                ↓               ↓                  ↓
   Read README.md    Read README.md  Read README.md    Read README.md
         ↓                ↓               ↓                  ↓
   Check examples/  Check examples/ Check examples/   Check examples/
         ↓                ↓               ↓                  ↓
  Follow patterns   Follow patterns Follow patterns   Follow patterns
         ↓                ↓               ↓                  ↓
   Generate code    Generate code   Generate code     Generate code
```

## Documentation Structure

Each service has:

```
docs/external-apis/[service]/
├── README.md           # Start here - comprehensive guide
│   ├── Overview        # What the service does
│   ├── Version         # API version we're targeting
│   ├── Authentication  # How to auth
│   ├── Key Concepts    # Important to understand
│   ├── Integration     # How we integrate
│   ├── Env Variables   # Required config
│   ├── Common Ops      # Typical operations
│   ├── Error Handling  # How to handle errors
│   └── Links           # Official docs
└── examples/           # Working code to reference
    └── [operation].js  # Specific examples
```

## How to Use - Step by Step

### Step 1: Identify the Service

User asks: "Parse this receipt text"
→ Service: **OpenAI** (OCR parsing)
→ Path: `docs/external-apis/openai/README.md`

### Step 2: Read the README

1. **Overview**: Understand why we use it
2. **Version**: Note the API version
3. **Authentication**: See how to auth
4. **Key Concepts**: Learn important concepts
5. **Integration Approach**: See our pattern
6. **Environment Variables**: Note required config
7. **Common Operations**: Find relevant operation
8. **Error Handling**: Learn error patterns

### Step 3: Check Examples

Look in `examples/` directory for similar operations:
- `parse-receipt.js` - Shows full parsing workflow
- Working code with comments
- Error handling included
- Can be adapted to user's needs

### Step 4: Generate Code

Follow the patterns shown:
- Use same authentication approach
- Follow same error handling
- Use same data structures
- Include similar logging/validation

### Step 5: Explain to User

- Mention which docs you referenced
- Explain any important concepts
- Note any environment variables needed
- Point out error handling considerations

## Example Workflows

### Example 1: Receipt Parsing

**User**: "Implement receipt parsing with OpenAI"

**Your Response**:

1. Read `docs/external-apis/openai/README.md`
2. Note key points:
   - Use `gpt-4o-mini` for cost-effectiveness
   - Temperature 0 for deterministic parsing
   - Structured outputs with JSON schema
   - Cost: ~$0.26/1000 receipts
3. Reference `examples/parse-receipt.js`
4. Generate code following that pattern
5. Explain:
   - Needs `OPENAI_API_KEY` env variable
   - Uses structured outputs for guaranteed JSON
   - Includes retry logic for rate limits
   - Handles user remarks for accuracy

### Example 2: Create Transaction

**User**: "Create a transaction in Actual Budget"

**Your Response**:

1. Read `docs/external-apis/actual-budget/README.md`
2. Note key points:
   - Amounts in cents, expenses negative
   - Must download budget first
   - Can create/get payees
   - QL library handles sync
3. Reference `examples/create-transaction.js`
4. Generate code following that pattern
5. Explain:
   - Needs `ACTUAL_SERVER_URL`, `ACTUAL_PASSWORD`, `ACTUAL_BUDGET_ID`
   - Must initialize connection first
   - Remember to shutdown after
   - Amounts are in cents (multiply by 100)

### Example 3: Product Search

**User**: "Search products with fuzzy matching"

**Your Response**:

1. Read `docs/external-apis/postgresql/README.md`
2. Note key points:
   - Uses pg_trgm extension
   - 3-phase matching (exact, fuzzy code, fuzzy name)
   - Trigram similarity scoring
   - Need GIN index for performance
3. Reference `examples/product-search.sql`
4. Generate code following that pattern
5. Explain:
   - Phase 1: Exact code match at store
   - Phase 2: Fuzzy code match at store
   - Phase 3: Global name similarity
   - Returns most relevant matches first

## Important Patterns

### Always Include

1. **Error Handling**: Don't just show happy path
   ```javascript
   try {
     // operation
   } catch (error) {
     if (error.code === 'rate_limit_exceeded') {
       // retry logic
     }
     throw error;
   }
   ```

2. **Environment Variables**: Show what's needed
   ```javascript
   const apiKey = process.env.OPENAI_API_KEY;
   if (!apiKey) {
     throw new Error('OPENAI_API_KEY not configured');
   }
   ```

3. **Validation**: Validate inputs
   ```javascript
   if (!price.amount || !price.currency) {
     throw new Error('Invalid price object');
   }
   ```

4. **Comments**: Explain why, not just what
   ```javascript
   // Use temperature 0 for deterministic parsing
   temperature: 0,
   ```

### API-Specific Patterns

**Actual Budget**:
- Always `await actual.init()` first
- Remember to `await actual.shutdown()`
- Amounts in cents, negative for expenses

**OpenAI**:
- Use structured outputs for guaranteed JSON
- Temperature 0 for consistency
- Include retry logic for rate limits
- Log token usage

**PostgreSQL**:
- Use parameterized queries (prevent injection)
- Connection pooling for performance
- JSONB for price objects
- Trigram indexes for fuzzy search

**Google Sheets** (Personal):
- Service account for automation
- Check GOOGLE_SHEETS_ENABLED first
- Handle rate limits gracefully
- Batch updates when possible

## What NOT to Do

❌ **Don't generate code without reading docs**
❌ **Don't use deprecated APIs or patterns**
❌ **Don't skip error handling**
❌ **Don't ignore rate limits**
❌ **Don't hardcode secrets**
❌ **Don't assume API knowledge from other contexts**

## Quick Reference Locations

- **Overview**: `docs/external-apis/README.md`
- **Quick Start**: `docs/external-apis/QUICK_REFERENCE.md`
- **Actual Budget**: `docs/external-apis/actual-budget/README.md`
- **OpenAI**: `docs/external-apis/openai/README.md`
- **PostgreSQL**: `docs/external-apis/postgresql/README.md`
- **Google Sheets**: `docs/external-apis/google-sheets/README.md`

## Updating Documentation

If you discover:
- Missing information
- Outdated patterns
- Better approaches
- Common errors

Suggest updates to the documentation!

## Summary

1. **Always read the docs** before generating code
2. **Follow the patterns** shown in examples
3. **Include error handling** from the start
4. **Validate inputs** properly
5. **Explain to user** what you referenced
6. **Note env variables** needed
7. **Handle edge cases** mentioned in docs

This ensures accurate, consistent, production-ready code! ✨
