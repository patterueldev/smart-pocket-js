const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const ocrService = require('../services/ocr.service');

/**
 * POST /api/v1/ocr/parse
 * Parse OCR text into structured transaction data using OpenAI
 */
router.post('/parse', asyncHandler(async (req, res) => {
  const { ocrText, remarks } = req.body;

  if (!ocrText || typeof ocrText !== 'string') {
    return res.status(400).json({
      error: 'validation_error',
      message: 'ocrText is required and must be a string',
    });
  }

  // Parse OCR text with OpenAI
  const parsedData = await ocrService.parseOCRText(ocrText, remarks);

  res.json(parsedData);
}));

module.exports = router;
