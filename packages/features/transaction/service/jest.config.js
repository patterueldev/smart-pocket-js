const base = require('../../../../jest.config.base');

module.exports = {
  ...base,
  preset: undefined, // Don't use react-native preset
  testEnvironment: 'node',
  displayName: '@smart-pocket/transaction-service',
  rootDir: '.',
};
