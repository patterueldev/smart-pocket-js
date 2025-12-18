# Storybook Setup (TODO)

## Overview

This workspace will use Storybook for React Native to enable isolated UI component testing with mock data.

## Installation

```bash
# Install Storybook for React Native
npx sb init --type react_native
```

## Configuration

Create `.storybook/main.js` at workspace root:

```javascript
module.exports = {
  stories: [
    '../packages/**/ui/**/*.stories.@(js|jsx|ts|tsx)',
  ],
  addons: [
    '@storybook/addon-ondevice-controls',
    '@storybook/addon-ondevice-actions',
  ],
};
```

## Writing Stories

Example story for Button component:

```typescript
// packages/shared/ui/src/Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Shared/Button',
  component: Button,
  argTypes: {
    variant: {
      options: ['primary', 'secondary', 'outline', 'text'],
      control: { type: 'select' },
    },
    size: {
      options: ['small', 'medium', 'large'],
      control: { type: 'select' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    title: 'Primary Button',
    variant: 'primary',
    onPress: () => console.log('Pressed'),
  },
};

export const Loading: Story = {
  args: {
    title: 'Loading',
    variant: 'primary',
    loading: true,
  },
};
```

## Running Storybook

```bash
cd packages/app
npm run storybook
```

## Benefits

- Test components in isolation
- Visual regression testing
- Documentation for UI components
- Faster UI development without running full app

## Next Steps

1. Install Storybook dependencies
2. Configure story discovery
3. Create stories for all UI components
4. Add to CI/CD for automated testing

## References

- [Storybook for React Native](https://storybook.js.org/tutorials/intro-to-storybook/react-native/en/get-started/)
- [On-Device Addons](https://github.com/storybookjs/react-native#readme)
