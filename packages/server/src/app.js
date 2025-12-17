const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const { logger, requestLogger } = require('./utils/logger');

// Load OpenAPI spec
const swaggerDocument = YAML.load(path.join(__dirname, '../../../docs/api-spec.yaml'));

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
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for Swagger UI
}));
app.use(cors());

// Body parsing
app.use(express.json({ limit: '10mb' })); // Increased for base64 images
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

// Swagger UI Documentation (no auth required)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customSiteTitle: 'Smart Pocket API',
  customCss: '.swagger-ui .topbar { display: none }',
  swaggerOptions: {
    persistAuthorization: true,
  }
}));

// Public routes (no auth required)
app.use('/health', healthRoutes);
// Auth routes (connect and disconnect)
app.use('/api/v1', authRoutes);

// Protected routes (require bearer token)
app.use('/api/v1/ocr', authenticate, ocrRoutes);
app.use('/api/v1/transactions', authenticate, transactionRoutes);
app.use('/api/v1/payees', authenticate, payeeRoutes);
app.use('/api/v1/accounts', authenticate, accountRoutes);
app.use('/api/v1/products', authenticate, productRoutes);
app.use('/api/v1/google-sheets', authenticate, googleSheetsRoutes);

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
