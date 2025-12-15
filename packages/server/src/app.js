const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { logger, requestLogger } = require('./utils/logger');

// Routes
const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/auth');
const ocrRoutes = require('./routes/ocr');
const transactionRoutes = require('./routes/transactions');
const payeeRoutes = require('./routes/payees');
const accountRoutes = require('./routes/accounts');
const productRoutes = require('./routes/products');
const googleSheetsRoutes = require('./routes/google-sheets');

// Middleware
const { errorHandler } = require('./middleware/errorHandler');
const { authenticate } = require('./middleware/auth');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Body parsing
app.use(express.json({ limit: '10mb' })); // Increased for base64 images
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

// Public routes (no auth required)
app.use('/health', healthRoutes);
app.use('/api/v1/connect', authRoutes);

// Protected routes (require bearer token)
app.use('/api/v1/ocr', authenticate, ocrRoutes);
app.use('/api/v1/transactions', authenticate, transactionRoutes);
app.use('/api/v1/payees', authenticate, payeeRoutes);
app.use('/api/v1/accounts', authenticate, accountRoutes);
app.use('/api/v1/products', authenticate, productRoutes);
app.use('/api/v1/google-sheets', authenticate, googleSheetsRoutes);
app.use('/api/v1/disconnect', authenticate, authRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'not_found',
    message: 'Endpoint not found',
    details: {
      path: req.path,
      method: req.method
    }
  });
});

// Error handler (must be last)
app.use(errorHandler);

module.exports = app;
