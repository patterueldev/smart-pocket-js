require('dotenv').config();
const app = require('./app');
const { logger } = require('./utils/logger');
const { connectDatabase } = require('./config/database');
const { runMigrations } = require('./database/migrations');
const { validateGoogleSheetsConfig } = require('./utils/config-validator');

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    // Validate Google Sheets configuration (if enabled)
    validateGoogleSheetsConfig();
    
    // Connect to PostgreSQL
    await connectDatabase();
    logger.info('Database connected successfully');

    // Run database migrations
    await runMigrations();
    logger.info('Database schema initialized');

    // Start Express server
    app.listen(PORT, () => {
      logger.info(`Smart Pocket Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  logger.error('Unhandled Rejection:', error);
  process.exit(1);
});

startServer();
