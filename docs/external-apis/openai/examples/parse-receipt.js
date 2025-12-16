// Example: Parsing receipt text with OpenAI
// See: ../README.md for setup instructions

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// System prompt for receipt parsing
const RECEIPT_PARSER_PROMPT = `You are an expert receipt parser. Extract structured data from OCR-scanned receipt text.

Guidelines:
1. Extract merchant name from header
2. Find transaction date (convert to YYYY-MM-DD)
3. Parse line items with code, name, price, quantity
4. Verify total amount
5. Indicate confidence level

Handle OCR errors and abbreviations intelligently.`;

// Receipt data schema
const receiptSchema = {
  type: 'object',
  properties: {
    merchant: { type: 'string' },
    date: { type: 'string', format: 'date' },
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
          codeName: { type: 'string' },
          readableName: { type: 'string' },
          price: {
            type: 'object',
            properties: {
              amount: { type: 'string' },
              currency: { type: 'string' },
            },
          },
          quantity: { type: 'number' },
        },
        required: ['codeName', 'readableName', 'price', 'quantity'],
      },
    },
    confidence: { 
      type: 'string', 
      enum: ['high', 'medium', 'low'] 
    },
    notes: { type: 'string' },
  },
  required: ['merchant', 'date', 'total', 'items', 'confidence'],
};

async function parseReceipt(ocrText, userRemarks = '') {
  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0, // Deterministic
      messages: [
        {
          role: 'system',
          content: RECEIPT_PARSER_PROMPT,
        },
        {
          role: 'user',
          content: `OCR Text:\n${ocrText}\n\n${userRemarks ? `User Remarks: ${userRemarks}` : ''}`,
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
      success: true,
      data: parsed,
      tokensUsed: response.usage.total_tokens,
      model: response.model,
    };
  } catch (error) {
    console.error('OpenAI parsing error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Example usage
const exampleOCRText = `
WALMART SUPERCENTER
123 MAIN ST, ANYTOWN USA

12/15/2025    14:35:42

MLK-WHT-001  MILK WHOLE GAL     3.99
BRD-WHT-024  BREAD WHITE        2.49
EGG-LRG-012  EGGS LARGE DOZ     4.99

                    SUBTOTAL   11.47
                    TAX         0.92
                    TOTAL      12.39

THANK YOU FOR SHOPPING
`;

parseReceipt(exampleOCRText, 'Receipt is slightly blurry on line 2')
  .then(result => {
    if (result.success) {
      console.log('Parsed successfully!');
      console.log(JSON.stringify(result.data, null, 2));
      console.log(`Tokens used: ${result.tokensUsed}`);
    } else {
      console.error('Parsing failed:', result.error);
    }
  });
