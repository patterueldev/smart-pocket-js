# Feature Architecture Pattern

## Overview

Smart Pocket uses a feature-based package architecture where each feature is isolated into its own publishable packages. This enables:

- **Independent publishing** - Features can be distributed separately
- **Clean separation** - Features don't depend on each other
- **Easy testing** - Mock services enable UI testing without APIs
- **Build-time exclusion** - Personal features excluded from distributed builds

## Package Structure

### Feature Package Layout

```
packages/
  features/               # Public features
    <feature-name>/
      service/           # Service layer (business logic)
        package.json
        tsconfig.json
        src/
          I<Feature>Service.ts       # Interface
          Mock<Feature>Service.ts    # Mock implementation
          index.ts                   # Barrel exports
      ui/                # UI layer (React Native components)
        package.json
        tsconfig.json
        src/
          <Feature>Screen.tsx        # Main screen component
          index.ts                   # Barrel exports
          
  personal/              # Personal features (build-excluded)
    <feature-name>/
      service/
        ... (same structure)
      ui/
        ... (same structure)
```

### Example: Receipt Scan Feature

```
packages/features/receipt-scan/
  service/
    package.json          # @smart-pocket/receipt-scan-service
    src/
      IReceiptScanService.ts     # Interface with parseReceipt()
      MockReceiptScanService.ts  # Returns mock Walmart receipt
      index.ts
  ui/
    package.json          # @smart-pocket/receipt-scan-ui
    src/
      CameraScreen.tsx           # Camera viewfinder
      OCRPreviewScreen.tsx       # OCR text review
      index.ts
```

## Service Layer Pattern

### Interface Definition

Always define service as an interface:

```typescript
// IReceiptScanService.ts
import { OCRParseRequest, OCRParseResponse } from '@smart-pocket/shared-types';

export interface IReceiptScanService {
  /**
   * Parse OCR text into structured transaction data
   */
  parseReceipt(request: OCRParseRequest): Promise<OCRParseResponse>;
  
  /**
   * Validate OCR quality
   */
  validateOCRQuality(ocrText: string): Promise<number>;
}
```

### Mock Implementation

Provide mock implementation for UI testing:

```typescript
// MockReceiptScanService.ts
import { IReceiptScanService } from './IReceiptScanService';
import { OCRParseRequest, OCRParseResponse } from '@smart-pocket/shared-types';

export class MockReceiptScanService implements IReceiptScanService {
  async parseReceipt(request: OCRParseRequest): Promise<OCRParseResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Return hard-coded mock data
    return {
      merchant: 'Walmart',
      date: '2025-12-15',
      total: { amount: '45.67', currency: 'USD' },
      items: [
        {
          codeName: 'WM-123456',
          readableName: 'Organic Bananas',
          price: { amount: '3.99', currency: 'USD' },
          quantity: 1.5,
        },
      ],
      confidence: 0.88,
    };
  }
  
  async validateOCRQuality(ocrText: string): Promise<number> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return 0.85;
  }
}
```

## UI Layer Pattern

### Screen Component

UI components receive services via props (injected by DI container):

```typescript
// CameraScreen.tsx
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, theme } from '@smart-pocket/shared-ui';

export interface CameraScreenProps {
  onCapture: (imageBase64: string) => void;
  onCancel: () => void;
}

export const CameraScreen: React.FC<CameraScreenProps> = ({
  onCapture,
  onCancel,
}) => {
  const [capturing, setCapturing] = useState(false);
  
  const handleCapture = async () => {
    setCapturing(true);
    // Camera capture logic
    const mockImage = 'base64...';
    onCapture(mockImage);
    setCapturing(false);
  };
  
  return (
    <View style={styles.container}>
      {/* Camera viewfinder */}
      <Button
        title="Capture"
        onPress={handleCapture}
        loading={capturing}
      />
    </View>
  );
};
```

## Dependency Injection

### Container Setup

Main app configures InversifyJS container:

```typescript
// packages/app/src/di/container.ts
import 'reflect-metadata';
import { Container } from 'inversify';
import { IReceiptScanService, MockReceiptScanService } from '@smart-pocket/receipt-scan-service';

export const TYPES = {
  IReceiptScanService: Symbol.for('IReceiptScanService'),
};

export const container = new Container();

// Bind mock services (for now)
container.bind<IReceiptScanService>(TYPES.IReceiptScanService)
  .to(MockReceiptScanService);

// Later, bind real API services:
// container.bind<IReceiptScanService>(TYPES.IReceiptScanService)
//   .to(RealReceiptScanService);
```

### Using Services in App

```typescript
// App.tsx
import { container, TYPES } from './di/container';
import { IReceiptScanService } from '@smart-pocket/receipt-scan-service';
import { CameraScreen } from '@smart-pocket/receipt-scan-ui';

export default function App() {
  const receiptScanService = container.get<IReceiptScanService>(
    TYPES.IReceiptScanService
  );
  
  const handleCapture = async (imageBase64: string) => {
    const result = await receiptScanService.parseReceipt({
      ocrText: extractTextFromImage(imageBase64),
      remarks: '',
    });
    // Navigate to transaction screen with result
  };
  
  return <CameraScreen onCapture={handleCapture} onCancel={handleCancel} />;
}
```

## Adding a New Feature

### Step 1: Create Feature Packages

```bash
# Create directory structure
mkdir -p packages/features/my-feature/service/src
mkdir -p packages/features/my-feature/ui/src
```

### Step 2: Define Service Interface

```typescript
// packages/features/my-feature/service/src/IMyFeatureService.ts
export interface IMyFeatureService {
  doSomething(): Promise<Result>;
}
```

### Step 3: Create Mock Service

```typescript
// packages/features/my-feature/service/src/MockMyFeatureService.ts
export class MockMyFeatureService implements IMyFeatureService {
  async doSomething(): Promise<Result> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { data: 'mock' };
  }
}
```

### Step 4: Create UI Components

```typescript
// packages/features/my-feature/ui/src/MyFeatureScreen.tsx
export interface MyFeatureScreenProps {
  onAction: () => void;
}

export const MyFeatureScreen: React.FC<MyFeatureScreenProps> = ({
  onAction,
}) => {
  return <View>...</View>;
};
```

### Step 5: Add to DI Container

```typescript
// packages/app/src/di/container.ts
import { IMyFeatureService, MockMyFeatureService } from '@smart-pocket/my-feature-service';

export const TYPES = {
  // ... existing types
  IMyFeatureService: Symbol.for('IMyFeatureService'),
};

container.bind<IMyFeatureService>(TYPES.IMyFeatureService)
  .to(MockMyFeatureService);
```

### Step 6: Integrate in Navigation

```typescript
// packages/app/App.tsx
import { MyFeatureScreen } from '@smart-pocket/my-feature-ui';

// Add to navigation stack
<Stack.Screen name="MyFeature" component={MyFeatureScreen} />
```

## Personal Features

Personal features (e.g., Google Sheets Sync) follow the same pattern but:

1. Located in `packages/personal/` instead of `packages/features/`
2. Excluded from distributed builds via build configuration
3. Conditionally rendered based on server features:

```typescript
// Dashboard conditionally shows Google Sheets button
{Platform.OS === 'web' && serverInfo.features.googleSheetsSync && (
  <Button title="Google Sheets Sync" onPress={onGoogleSheetsSync} />
)}
```

## Package Naming Convention

- Service packages: `@smart-pocket/<feature>-service`
- UI packages: `@smart-pocket/<feature>-ui`
- Use workspace protocol: `"@smart-pocket/shared-types": "workspace:*"`

## Benefits

### 1. Testability
- UI can be tested with mock services without backend
- Storybook stories use mock data
- Unit tests can inject different service implementations

### 2. Modularity
- Features are completely isolated
- No circular dependencies
- Clean boundaries between features

### 3. Publishability
- Each package can be published independently
- Version features separately
- Users can pick which features to include

### 4. Maintainability
- Clear structure for new contributors
- Easy to find code (feature-based organization)
- Consistent patterns across all features

## References

- [InversifyJS Documentation](https://inversify.io/)
- [React Navigation](https://reactnavigation.org/)
- [Expo Documentation](https://docs.expo.dev/)
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Overall system architecture
- [STORYBOOK_SETUP.md](./STORYBOOK_SETUP.md) - UI testing with Storybook
