// Polyfills for React Native environment in Jest tests
global.performance = {
  now: () => Date.now(),
};
