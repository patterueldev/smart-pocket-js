# Server Tests

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test -- --coverage

# Run specific test file
pnpm test -- src/services/__tests__/ocr.service.test.js

# Run tests matching pattern
pnpm test -- --testNamePattern="OCR"
```

## Test Structure

```
src/
├── __tests__/
│   ├── setup.js                      # Global test setup
│   ├── openapi-validation.test.js    # OpenAPI spec validation ⭐
│   ├── integration/                  # Integration tests
│   │   └── api.test.js               # Full API flow tests
│   └── README.md                     # This file
├── services/
│   └── __tests__/                    # Service unit tests
│       └── ocr.service.test.js
├── routes/
│   └── __tests__/                    # Route/endpoint tests
│       ├── auth.test.js
│       ├── health.test.js
│       └── ocr.test.js
├── middleware/
│   └── __tests__/                    # Middleware tests
│       └── auth.test.js
└── utils/
    └── __tests__/                    # Utility tests
        └── price.test.js
```

## Test Types

### OpenAPI Validation Tests ⭐ NEW

**File**: `openapi-validation.test.js`

Ensures API implementation stays in sync with OpenAPI specification:

- ✅ All documented routes are implemented
- ✅ All implemented routes are documented
- ✅ HTTP methods match between spec and code
- ✅ Path parameters are consistent
- ✅ OpenAPI spec structure is valid

**Run validation**:
```bash
pnpm test -- openapi-validation.test.js
```

**When to run:**
- Before committing code
- After adding/modifying endpoints
- In CI/CD pipeline

**Fixing errors:**
```bash
# "Routes documented but not implemented"
# → Implement the route or remove from docs/api-spec.yaml

# "Routes implemented but not documented"  
# → Add endpoint to docs/api-spec.yaml

# See test output for specific missing routes
```

### Unit Tests
Test individual functions/modules in isolation:
- Services (`services/__tests__/`)
- Utilities (`utils/__tests__/`)
- Middleware (`middleware/__tests__/`)

### Integration Tests
Test API endpoints with mocked dependencies:
- Route handlers (`routes/__tests__/`)
- Full API flows (`__tests__/integration/`)

### Mocking Strategy

**Database**: Always mocked in tests
```javascript
jest.mock('../../config/database', () => ({
  pool: {
    query: jest.fn(),
  },
}));
```

**External APIs** (OpenAI): Mocked to avoid actual API calls
```javascript
jest.mock('openai');
```

**Environment Variables**: Set in `setup.js` for consistent test environment

## Coverage Goals

Minimum coverage thresholds (configured in `jest.config.js`):
- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

## Writing Tests

### Example Service Test

```javascript
const myService = require('../my.service');

// Mock dependencies
jest.mock('../../config/database');

describe('My Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should do something', async () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = await myService.doSomething(input);
    
    // Assert
    expect(result).toBe('expected');
  });
});
```

### Example Route Test

```javascript
const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const myRouter = require('../my.route');

describe('My Routes', () => {
  let app;
  let token;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/v1', myRouter);
    
    token = jwt.sign({ device: 'test' }, process.env.JWT_SECRET);
  });

  it('should handle GET request', async () => {
    const response = await request(app)
      .get('/api/v1/endpoint')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
  });
});
```

## CI/CD Integration

Tests run automatically in Docker test environment:
```bash
pnpm run docker:test
```

## Debugging Tests

```bash
# Run with verbose output
pnpm test -- --verbose

# Run single test with debugging
node --inspect-brk node_modules/.bin/jest --runInBand path/to/test.js
```

## Best Practices

1. **Keep tests focused**: One test, one assertion concept
2. **Use descriptive test names**: Clearly state what is being tested
3. **Follow AAA pattern**: Arrange, Act, Assert
4. **Mock external dependencies**: Database, APIs, file system
5. **Clean up**: Use `beforeEach`/`afterEach` to reset state
6. **Test error cases**: Don't just test happy paths
7. **Keep tests fast**: Mock slow operations
8. **Test behavior, not implementation**: Focus on inputs/outputs

## Common Issues

### "Cannot find module"
- Check mock paths are correct
- Ensure `jest.mock()` is called before `require()`

### "Timeout exceeded"
- Increase timeout: `jest.setTimeout(10000)`
- Check for unresolved promises

### "Port already in use"
- Tests shouldn't start actual servers
- Use supertest with app instance, not server.listen()

## Adding New Tests

When adding new features:
1. Write tests first (TDD approach recommended)
2. Create test file in same directory as source: `__tests__/`
3. Name test file: `[filename].test.js`
4. Run tests to ensure they fail (red)
5. Implement feature
6. Run tests to ensure they pass (green)
7. Refactor if needed (keeping tests green)
