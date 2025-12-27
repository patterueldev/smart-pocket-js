const fs = require('fs');
const { logger } = require('./logger');

/**
 * Validate Google Sheets configuration on server startup
 * Only runs if GOOGLE_SHEETS_ENABLED is true
 */
function validateGoogleSheetsConfig() {
  const enabled = process.env.GOOGLE_SHEETS_ENABLED === 'true';
  
  if (!enabled) {
    logger.info('Google Sheets sync is disabled');
    return;
  }

  logger.info('Validating Google Sheets configuration...');

  // Check required environment variables
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const sheetName = process.env.GOOGLE_SHEET_NAME || 'Accounts';
  
  if (!sheetId) {
    throw new Error('GOOGLE_SHEETS_ENABLED is true but GOOGLE_SHEET_ID is not configured');
  }

  // Check credentials file
  const defaultPath = '/data/keys/smart-pocket-server.json';
  const credPath = process.env.GOOGLE_CREDENTIALS_JSON_PATH || defaultPath;
  
  if (!fs.existsSync(credPath)) {
    throw new Error(`Google Sheets credentials file not found at: ${credPath}`);
  }

  // Check if path is a directory instead of a file
  const stats = fs.statSync(credPath);
  if (stats.isDirectory()) {
    throw new Error(`GOOGLE_CREDENTIALS_JSON_PATH points to a directory, not a file: ${credPath}\nPlease specify the full path to the credentials JSON file.`);
  }

  // Validate JSON structure
  try {
    const creds = JSON.parse(fs.readFileSync(credPath, 'utf8'));
    
    if (!creds.client_email || !creds.private_key) {
      throw new Error('Invalid service account credentials JSON - missing client_email or private_key');
    }

    logger.info('Google Sheets configuration validated', {
      sheetId,
      sheetName,
      credentialsPath: credPath,
      serviceAccount: creds.client_email,
    });
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Credentials file not found: ${credPath}`);
    }
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in credentials file: ${credPath}`);
    }
    throw error;
  }
}

module.exports = {
  validateGoogleSheetsConfig,
};
