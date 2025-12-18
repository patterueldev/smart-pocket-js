// Jest setup for shared-ui package
// This file provides manual mocks for react-native instead of using the preset
// to avoid ES module import issues

// Mock react-native modules FIRST before anything imports testing-library
jest.mock('react-native', () => {
  return {
    Platform: {
      OS: 'ios',
      select: jest.fn((obj) => obj.ios || obj.default),
    },
    StyleSheet: {
      create: (styles) => styles,
      flatten: (style) => style,
    },
    Dimensions: {
      get: jest.fn(() => ({ width: 375, height: 667 })),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
    View: 'View',
    Text: 'Text',
    TextInput: 'TextInput',
    TouchableOpacity: 'TouchableOpacity',
    Pressable: 'Pressable',
    ScrollView: 'ScrollView',
    Image: 'Image',
    Button: 'Button',
  };
});

// Mock testing library render  
jest.mock('@testing-library/react-native', () => {
  const React = require('react');
  const renderer = require('react-test-renderer');
  
  return {
    render: (element) => {
      const instance = renderer.create(element);
      return {
        getByText: (text) => {
          let found;
          instance.root.findByProps = function() { return found; };
          return found || {};
        },
        getByTestId: (id) => ({}),
        debug: () => {},
        findByTestId: () => Promise.resolve({}),
      };
    },
    fireEvent: {
      press: jest.fn(),
    },
  };
});
