const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const productService = require('../services/product.service');

/**
 * GET /api/v1/products/search
 * Search for products/store items with auto-suggestions
 */
router.get('/search', asyncHandler(async (req, res) => {
  const { query, payeeId, limit = 10 } = req.query;

  if (!query) {
    return res.status(400).json({
      error: 'validation_error',
      message: 'query parameter is required',
    });
  }

  const suggestions = await productService.searchProducts(
    query,
    payeeId,
    parseInt(limit, 10)
  );

  res.json({ suggestions });
}));

module.exports = router;
