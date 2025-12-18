# Smart Pocket Mobile App

React Native mobile application for Smart Pocket personal finance management.

## Overview

Multi-platform app (iOS, Android, Web) built with:
- **React Native 0.73** + **Expo 50**
- **React Navigation** for routing
- **InversifyJS** for dependency injection
- **Feature-based architecture** with isolated packages

## Project Structure

```
packages/
  shared/
    types/          # Shared TypeScript interfaces
    ui/             # Shared UI components (Button, TextInput, Card)
  
  features/         # Public features
    receipt-scan/
      service/      # OCR parsing service
      ui/           # Camera + OCR preview screens
    transaction/
      service/      # Transaction CRUD service
      ui/           # Transaction form screen
  
  personal/         # Personal features (build-excluded)
    google-sheets-sync/
      service/      # Google Sheets sync service
      ui/           # Sync screen
  
  app/              # Main Expo app
    src/
      di/           # InversifyJS container
      screens/      # Setup & Dashboard screens
    App.tsx         # Entry point
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8+
- Expo CLI

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
cd packages/app
pnpm start
```

### Running on Devices

```bash
# iOS Simulator
pnpm ios

# Android Emulator
pnpm android

# Web Browser
pnpm web
```

## Features

### ✅ Completed

- **Shared UI Components**
  - Button (4 variants, 3 sizes, loading state)
  - TextInput (label, error, helper text)
  - Card (optional touchable)
  - Theme system (colors, spacing, typography)

- **Receipt Scan Feature**
  - Camera screen with mock viewfinder
  - OCR preview with remarks input
  - Mock service returning Walmart receipt

- **Transaction Feature**
  - Transaction form with date picker
  - Payee/account selectors
  - Line items list with add/remove
  - Calculated total display
  - Mock service with CRUD operations

- **Google Sheets Sync** (Personal Feature)
  - Sync draft preview with balance changes
  - Account cards with old→new visualization
  - Pull to refresh
  - Mock service with pending syncs

- **Main App**
  - Setup screen for server connection
  - Dashboard with recent transactions
  - React Navigation with drawer
  - Session management
  - InversifyJS DI container

### 🚧 TODO (Future)

- [ ] Real API integration (see issue #42)
- [ ] Storybook configuration for component testing
- [ ] Navigation to feature screens
- [ ] QR code auto-fill for setup (see issue #40)
- [ ] Bonjour/mDNS server discovery (see issue #41)
- [ ] Draft transaction storage (see issue #43)
- [ ] Camera permissions handling
- [ ] Form validation improvements
- [ ] Error handling and retry logic

## Architecture

### Dependency Injection

Services are bound in `packages/app/src/di/container.ts`:

```typescript
container.bind<IReceiptScanService>(TYPES.IReceiptScanService)
  .to(MockReceiptScanService);
```

Currently using **mock services** for UI development. Real API services will be implemented in issue #42.

### Feature Isolation

Each feature has:
- **Service layer** - Interface + Mock implementation
- **UI layer** - React Native screens

Features are completely isolated and independently publishable.

### Platform-Specific Features

Use `Platform.select()` for conditional features:

```typescript
// OCR only available on mobile
{Platform.OS !== 'web' && (
  <Button title="Scan Receipt" onPress={onScanReceipt} />
)}

// Google Sheets available on all platforms
{Platform.OS === 'web' && (
  <Button title="Google Sheets Sync" onPress={onSync} />
)}
```

## Development Workflow

### Adding a New Feature

See [docs/FEATURE_ARCHITECTURE.md](../../docs/FEATURE_ARCHITECTURE.md) for complete guide.

Quick steps:
1. Create `packages/features/<name>/service` with interface + mock
2. Create `packages/features/<name>/ui` with screen components
3. Add service binding to DI container
4. Integrate screens in navigation

### Testing with Mocks

All features use mock services, enabling:
- UI development without backend
- Fast iteration
- Storybook stories (coming soon)

### Switching to Real API

When ready (issue #42):
1. Implement real service classes
2. Update DI bindings in `container.ts`
3. No UI changes needed!

## Scripts

```bash
# Development
pnpm start              # Start Expo dev server
pnpm ios                # Run on iOS simulator
pnpm android            # Run on Android emulator
pnpm web                # Run in web browser

# Type Checking
pnpm typecheck          # Check TypeScript errors

# Testing (TODO)
pnpm test               # Run Jest tests
pnpm test:coverage      # With coverage report
```

## Configuration

### Expo Config

`app.json` contains:
- App name, slug, version
- iOS bundle identifier
- Android package name
- Icon and splash screen paths

### TypeScript

`tsconfig.json` extends workspace root config with:
- `jsx: react-native`
- Strict type checking enabled

### Babel

`babel.config.js` includes:
- `babel-preset-expo`
- Decorators support for InversifyJS
- Reanimated plugin for smooth animations

## Troubleshooting

### Metro bundler cache issues

```bash
pnpm start --clear
```

### Dependency resolution errors

```bash
pnpm install --force
```

### iOS simulator not launching

```bash
sudo xcode-select --switch /Applications/Xcode.app
```

## Documentation

- [FEATURE_ARCHITECTURE.md](../../docs/FEATURE_ARCHITECTURE.md) - Feature pattern guide
- [STORYBOOK_SETUP.md](../../docs/STORYBOOK_SETUP.md) - UI testing setup
- [MOBILE_SCREENS.md](../../docs/MOBILE_SCREENS.md) - Screen specifications
- [ARCHITECTURE.md](../../docs/ARCHITECTURE.md) - Overall system architecture

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for development workflow and PR guidelines.

## License

MIT
