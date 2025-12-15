const OpenAI = require('openai');
const { logger } = require('../utils/logger');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Parse OCR text into structured transaction data using OpenAI
 */
async function parseOCRText(ocrText, remarks = '') {
  try {
    const systemPrompt = `You are an expert at parsing receipt OCR text into structured transaction data.
Extract the following information:
- merchant: The store/business name
- date: Transaction date in YYYY-MM-DD format
- total: Total amount as decimal string
- currency: ISO 4217 currency code (default to USD if not specified)
- items: Array of items with:
  - codeName: Store-specific product code
  - readableName: Product name as it appears
  - price: Decimal string
  - quantity: Number (default 1)

Return ONLY valid JSON with no additional text.

${remarks ? `User remarks about the receipt: ${remarks}` : ''}`;

    const userPrompt = `Parse this receipt:\n\n${ocrText}`;

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2, // Lower temperature for more consistent parsing
    });

    const content = response.choices[0].message.content;
    const parsed = JSON.parse(content);

    // Transform to our standard price object format
    const result = {
      merchant: parsed.merchant || 'Unknown',
      date: parsed.date || new Date().toISOString().split('T')[0],
      total: {
        amount: String(parsed.total || '0.00'),
        currency: parsed.currency || 'USD',
      },
      items: (parsed.items || []).map(item => ({
        codeName: item.codeName || '',
        readableName: item.readableName || '',
        price: {
          amount: String(item.price || '0.00'),
          currency: parsed.currency || 'USD',
        },
        quantity: parseFloat(item.quantity || 1),
      })),
      confidence: 0.85, // Could implement more sophisticated confidence scoring
    };

    logger.info('OCR parsing successful', {
      merchant: result.merchant,
      itemCount: result.items.length,
      total: result.total.amount,
    });

    return result;
  } catch (error) {
    logger.error('OCR parsing failed', {
      error: error.message,
      ocrText: ocrText.substring(0, 100),
    });
    
    throw new Error(`Failed to parse OCR text: ${error.message}`);
  }
}

module.exports = {
  parseOCRText,
};
