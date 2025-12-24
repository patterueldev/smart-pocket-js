# Smart Pocket App - Testing Guide

## Overview

The Smart Pocket app package includes Jest-based unit tests for React Native components and screens. Tests are configured to work with React 19, Expo Router, and the application's architecture.

## Test Structure

```
packages/app/
├── __tests__/               # Feature tests (future)
├── app/__tests__/           # Screen/route tests
│   ├── index.test.tsx       # Dashboard tests
│   └── setup.test.tsx       # Setup screen tests
├── components/__tests__/    # Component tests
│   └── SideMenu.test.tsx    # Side menu tests
├── jest.config.js           # Jest configuration
├── jest.setup.js            # Test environment setup & mocks
└── jest.polyfills.js        # Polyfills for React Native
```

## Running Tests

### All Tests
```bash
cd packages/app
pnpm test
```

### Watch Mode
```bash
pnpm test:watch
```

### Coverage Report
```bash
pnpm test:coverage
```

### Specific Test File
```bash
pnpm jest components/__tests__/SideMenu.test.tsx
```

## Test Configuration

### jest.config.js

The Jest configuration is customized for:
- **React Native** transformation with Babel
- **Expo Router** compatibility
- **TypeScript** support
- **Module path aliases** (`@/` for package root)
- **Transform ignore patterns** for node_modules

Key settings:
```javascript
{
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', {
      presets: ['module:@react-native/babel-preset'],
    }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|expo|@expo)/)',
  ],
}
```

### jest.setup.js

Global test setup includes mocks for:
- **expo-router** - useRouter, usePathname, useSegments
- **AsyncStorage** - setItem, getItem, removeItem, clear
- **Expo modules** - expo-constants, expo-status-bar
- **React Native Platform** - OS detection

### jest.polyfills.js

Provides polyfills for:
- `setImmediate` / `clearImmediate` for React Native environment

## Writing Tests

### Example: Component Test

```typescript
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SideMenu } from '../SideMenu';

describe('SideMenu', () => {
  const mockOnClose = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders when visible', () => {
    const { getByText } = render(
      <SideMenu
        visible={true}
        onClose={mockOnClose}
        onSettings={jest.fn()}
        onDisconnect={jest.fn()}
      />
    );

    expect(getByText('Settings')).toBeTruthy();
    expect(getByText('Disconnect')).toBeTruthy();
  });

  it('calls onClose when close button pressed', () => {
    const { getByTestID } = render(
      <SideMenu visible={true} onClose={mockOnClose} ... />
    );

    fireEvent.press(getByTestID('side-menu-close-button'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
```

### Example: Screen Test

```typescript
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import Dashboard from '../index';

jest.mock('expo-router');

describe('Dashboard', () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
  };

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  it('navigates to receipt scan when button pressed', () => {
    const { getByText } = render(<Dashboard />);
    
    fireEvent.press(getByText('📸 Scan Receipt'));
    expect(mockRouter.push).toHaveBeenCalledWith('/receipt-scan');
  });
});
```

## Test IDs

Components include `testID` props for reliable testing:

```typescript
// In component
<Pressable testID="hamburger-menu-button" onPress={handleOpenMenu}>
  ...
</Pressable>

// In test
const button = getByTestID('hamburger-menu-button');
fireEvent.press(button);
```

### Current Test IDs
- `side-menu-modal` - Side menu modal wrapper
- `side-menu-overlay` - Overlay background
- `side-menu-close-button` - Close button
- `hamburger-menu-button` - Dashboard menu button

## Mocking Guidelines

### Mocking expo-router
```typescript
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  })),
  usePathname: jest.fn(() => '/'),
  useSegments: jest.fn(() => []),
}));
```

### Mocking AsyncStorage
```typescript
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(JSON.stringify({ ... }))),
  removeItem: jest.fn(() => Promise.resolve()),
}));
```

### Mocking Service Layers
```typescript
// Mock transaction service
jest.mock('@smart-pocket/transaction-service', () => ({
  useTransactionService: jest.fn(() => ({
    saveTransaction: jest.fn(() => Promise.resolve({ id: '123' })),
    getTransactions: jest.fn(() => Promise.resolve([])),
  })),
}));
```

## Coverage Thresholds

The app package uses project-wide coverage thresholds defined in the root jest configuration:
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

Coverage collection focuses on:
- `app/**/*.{ts,tsx}` - All screen/route files
- `components/**/*.{ts,tsx}` - All component files
- Excludes: `*.d.ts`, `index.ts` files

## Testing Best Practices

### 1. Test User Interactions
Focus on testing from the user's perspective:
- Button presses
- Form submissions
- Navigation flows
- Error states

### 2. Mock External Dependencies
Always mock:
- Navigation (expo-router)
- Storage (AsyncStorage)
- External services (API calls)
- Expo modules

### 3. Test Accessibility
Use accessible queries when possible:
```typescript
getByText('Button Label')  // ✅ Mimics user behavior
getByTestID('button-id')   // ✅ Reliable selector
getByProps({ title: '...' }) // ❌ Fragile
```

### 4. Clear Test State
```typescript
beforeEach(() => {
  jest.clearAllMocks();
});
```

### 5. Test Edge Cases
- Empty states (no data)
- Loading states
- Error states
- Disabled/enabled states
- Permission denials

## Common Issues & Solutions

### Issue: "Cannot use import statement outside a module"
**Solution**: Ensure `transformIgnorePatterns` includes the problematic package.

### Issue: "react-test-renderer version mismatch"
**Solution**: Ensure versions match between `react`, `react-native`, and `react-test-renderer` in package.json.

### Issue: "Cannot find module '@/...'"
**Solution**: Verify `moduleNameMapper` in jest.config.js includes the path alias.

### Issue: "Platform.OS is not defined"
**Solution**: Ensure jest.setup.js includes Platform mock.

## React 19 Compatibility

Tests are configured for React 19:
- Uses React 19.1.0
- `react-test-renderer` version must match React version
- Pressable components tested instead of TouchableOpacity (deprecated in React 19)

## CI/CD Integration

Tests run automatically in GitHub Actions:
```yaml
- name: Run tests
  run: pnpm --filter @smart-pocket/app test --coverage

- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./packages/app/coverage/clover.xml
```

## Future Test Coverage

Planned test additions:
- [ ] **receipt-scan.tsx** - Camera screen, OCR flow
- [ ] **transaction.tsx** - Transaction form, item editing
- [ ] **google-sheets-sync.tsx** - Sync draft, approval
- [ ] **Integration tests** - Full user flows (scan → review → save)
- [ ] **E2E tests** - Detox for native app testing

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library React Native](https://callstack.github.io/react-native-testing-library/)
- [Expo Testing](https://docs.expo.dev/develop/unit-testing/)
- [React Native Testing Overview](https://reactnative.dev/docs/testing-overview)

## Contributing

When adding new components or screens:
1. Create corresponding test file in `__tests__/` directory
2. Add `testID` props to interactive elements
3. Test user interactions and state changes
4. Run tests and ensure coverage meets thresholds
5. Include tests in PR

Test naming convention:
```
ComponentName.test.tsx    # Component tests
screen-name.test.tsx      # Screen tests
feature.test.tsx          # Feature/integration tests
```
