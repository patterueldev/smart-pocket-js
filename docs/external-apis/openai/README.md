# OpenAI API Reference

## Overview

OpenAI's API is used to parse OCR-extracted text from receipts and convert it into structured transaction data. We leverage the Chat Completions API with structured outputs to extract merchant names, dates, items, prices, and totals from raw receipt text.

## Version

- **API Version**: `2024-11-01` (or latest stable)
- **Model**: `gpt-4o-mini` (cost-effective) or `gpt-4o` (higher accuracy)
- **Features Used**: Chat Completions, Structured Outputs, JSON mode
- **Documentation Date**: 2025-12-16

## Why We Use It

- **Accurate Parsing**: Handles messy OCR text well
- **Structured Output**: Direct JSON response with schema validation
- **Context Understanding**: Interprets abbreviations and store-specific codes
- **Multilingual**: Supports receipts in different languages
- **Error Tolerance**: Works with imperfect OCR results

## Integration Approach

### Direct API Calls

```javascript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const response = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [
    {
      role: 'system',
      content: 'You are a receipt parser. Extract structured data from OCR text.',
    },
    {
      role: 'user',
      content: ocrText,
    },
  ],
  response_format: {
    type: 'json_schema',
    json_schema: receiptSchema,
  },
});
```

## Key Concepts

### 1. Chat Completions

Standard conversational API that we use in a non-conversational way for parsing.

### 2. Structured Outputs

Force the model to return JSON matching a specific schema. This ensures we always get parseable data.

### 3. System Prompts

Instructions that guide the model's behavior. Critical for consistent parsing.

### 4. JSON Schema

Define exact structure we want. The model will conform to this schema.

### 5. Temperature

Controls randomness. Use `0` for deterministic parsing.

## Receipt Parsing Schema

```javascript
const receiptSchema = {
  type: 'object',
  properties: {
    merchant: {
      type: 'string',
      description: 'Store or merchant name',
    },
    date: {
      type: 'string',
      format: 'date',
      description: 'Transaction date in YYYY-MM-DD format',
    },
    total: {
      type: 'object',
      properties: {
        amount: { type: 'string' },
        currency: { type: 'string' },
      },
      required: ['amount', 'currency'],
    },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          codeName: {
            type: 'string',
            description: 'Item code from receipt (e.g., "MLK-001")',
          },
          readableName: {
            type: 'string',
            description: 'Human-readable product name',
          },
          price: {
            type: 'object',
            properties: {
              amount: { type: 'string' },
              currency: { type: 'string' },
            },
            required: ['amount', 'currency'],
          },
          quantity: {
            type: 'number',
            minimum: 1,
          },
        },
        required: ['codeName', 'readableName', 'price', 'quantity'],
      },
    },
    confidence: {
      type: 'string',
      enum: ['high', 'medium', 'low'],
      description: 'Confidence level in the parsing',
    },
    notes: {
      type: 'string',
      description: 'Any parsing issues or ambiguities',
    },
  },
  required: ['merchant', 'date', 'total', 'items', 'confidence'],
};
```

## Environment Variables

```bash
# OpenAI API configuration
OPENAI_API_KEY=sk-proj-xxx...
OPENAI_MODEL=gpt-4o-mini  # or gpt-4o for better accuracy
OPENAI_MAX_TOKENS=2048
OPENAI_TEMPERATURE=0      # Deterministic parsing
```

## System Prompt

```javascript
const RECEIPT_PARSER_PROMPT = `You are an expert receipt parser. Your task is to extract structured data from OCR-scanned receipt text.

Guidelines:
1. Extract the merchant/store name from the header
2. Find the transaction date (convert to YYYY-MM-DD format)
3. Parse each line item with:
   - Code name: The store's internal code (often abbreviated)
   - Readable name: Full product name in plain language
   - Price: Individual item price (not subtotal)
   - Quantity: Number of items
4. Calculate or verify the total amount
5. Indicate your confidence level (high/medium/low)
6. Note any parsing issues or ambiguities

Handle common issues:
- OCR errors (e.g., "0" vs "O", "1" vs "l")
- Missing or unclear prices
- Abbreviations (e.g., "MLK" = "Milk")
- Multiple quantity indicators (e.g., "2 @ $3.99")
- Subtotals vs totals
- Tax and discounts

If critical information is missing or unclear, note it in the 'notes' field and set confidence to 'low'.`;
```

## Common Operations

### Parse Receipt Text

```javascript
async function parseReceipt(ocrText, userRemarks = '') {
  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    temperature: 0,
    messages: [
      {
        role: 'system',
        content: RECEIPT_PARSER_PROMPT,
      },
      {
        role: 'user',
        content: `OCR Text:\n${ocrText}\n\nUser Remarks: ${userRemarks}`,
      },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'receipt_data',
        strict: true,
        schema: receiptSchema,
      },
    },
  });

  const parsed = JSON.parse(response.choices[0].message.content);
  
  return {
    ...parsed,
    tokensUsed: response.usage.total_tokens,
    model: response.model,
  };
}
```

### Handle User Remarks

User remarks help improve accuracy:

```javascript
const userRemarks = "Line 3 has an erasure, might be wrong price";

// Include remarks in the prompt
const content = `
OCR Text:
${ocrText}

User Remarks:
${userRemarks}

Pay special attention to the issues mentioned in the user remarks.
`;
```

## Error Handling

```javascript
async function parseReceiptWithRetry(ocrText, maxRetries = 2) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await parseReceipt(ocrText);
    } catch (error) {
      if (error.code === 'rate_limit_exceeded') {
        // Wait and retry
        await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)));
        continue;
      }
      
      if (error.code === 'invalid_api_key') {
        throw new Error('OpenAI API key is invalid');
      }
      
      if (error.code === 'context_length_exceeded') {
        throw new Error('Receipt text is too long');
      }
      
      // Other errors
      throw error;
    }
  }
  
  throw new Error('Failed to parse receipt after multiple attempts');
}
```

## Rate Limits

- **GPT-4o-mini**: 30,000 requests/min (Tier 1)
- **GPT-4o**: 10,000 requests/min (Tier 1)
- **Tokens per minute**: Varies by tier

See: https://platform.openai.com/docs/guides/rate-limits

## Cost Estimates

### GPT-4o-mini (Recommended)
- **Input**: $0.150 / 1M tokens
- **Output**: $0.600 / 1M tokens
- **Typical receipt**: ~500 input + 300 output tokens = $0.00026

### GPT-4o (Higher Accuracy)
- **Input**: $2.50 / 1M tokens
- **Output**: $10.00 / 1M tokens
- **Typical receipt**: ~500 input + 300 output tokens = $0.0043

**Estimate**: 1000 receipts/month with gpt-4o-mini ≈ $0.26

## Best Practices

1. **Set temperature to 0** for consistent parsing
2. **Use structured outputs** to guarantee valid JSON
3. **Include user remarks** for better accuracy
4. **Log failed parses** for prompt improvement
5. **Monitor token usage** to control costs
6. **Implement retry logic** for rate limits
7. **Store raw OCR + parsed data** for future retraining

## Links

- **OpenAI Platform**: https://platform.openai.com/
- **API Documentation**: https://platform.openai.com/docs/api-reference
- **Chat Completions Guide**: https://platform.openai.com/docs/guides/chat-completions
- **Structured Outputs**: https://platform.openai.com/docs/guides/structured-outputs
- **Rate Limits**: https://platform.openai.com/docs/guides/rate-limits
- **Pricing**: https://openai.com/api/pricing/

## Files in This Directory

- `chat-completions.md` - Detailed API reference
- `structured-outputs.md` - JSON schema and validation
- `examples/` - Code examples
  - `parse-receipt.js` - Basic receipt parsing
  - `retry-logic.js` - Error handling and retries
  - `cost-tracking.js` - Token usage monitoring

## Notes

- Store raw OCR text + parsed results for ML training later
- User corrections can improve future parses (fine-tuning)
- Consider caching for identical receipts
- Monitor for prompt injection attempts

## TODO

- [ ] Fine-tune prompt for common receipt formats
- [ ] Implement caching for repeated receipts
- [ ] Add token usage tracking to database
- [ ] Create fallback parser for when API is down
- [ ] Document multi-language receipt handling
