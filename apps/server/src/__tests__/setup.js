// Test setup and global mocks

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgres://test:test@localhost:5432/test_db';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.API_KEY = 'test-api-key';
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.OPENAI_MODEL = 'gpt-4-turbo-preview';
process.env.ACTUAL_BUDGET_URL = 'http://localhost:5006';

// Increase timeout for integration tests
jest.setTimeout(10000);

// Suppress console.error in tests (optional - uncomment if needed)
// global.console.error = jest.fn();

