const base = require('../../../jest.config.base');

module.exports = {
  ...base,
  displayName: '@smart-pocket/shared-ui',
  rootDir: '.',
  testEnvironment: 'jsdom',
};
