import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import SetupScreen from '../setup';

// Mock the router
jest.mock('expo-router');

describe('SetupScreen', () => {
  const mockRouter = {
    replace: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  it('renders setup screen with title', () => {
    const { getByText } = render(<SetupScreen />);
    expect(getByText('Welcome to Smart Pocket')).toBeTruthy();
  });

  it('renders server URL input', () => {
    const { getByPlaceholderText } = render(<SetupScreen />);
    expect(getByPlaceholderText('https://smartpocket.example.com')).toBeTruthy();
  });

  it('renders API key input', () => {
    const { getByPlaceholderText } = render(<SetupScreen />);
    expect(getByPlaceholderText('Enter API Key')).toBeTruthy();
  });

  it('renders connect button', () => {
    const { getByText } = render(<SetupScreen />);
    expect(getByText('Connect to Server')).toBeTruthy();
  });

  it('allows entering server URL', () => {
    const { getByPlaceholderText } = render(<SetupScreen />);
    const input = getByPlaceholderText('https://smartpocket.example.com');

    fireEvent.changeText(input, 'https://my-server.com');
    expect(input.props.value).toBe('https://my-server.com');
  });

  it('allows entering API key', () => {
    const { getByPlaceholderText } = render(<SetupScreen />);
    const input = getByPlaceholderText('Enter API Key');

    fireEvent.changeText(input, 'test-api-key-123');
    expect(input.props.value).toBe('test-api-key-123');
  });

  it('masks API key input', () => {
    const { getByPlaceholderText } = render(<SetupScreen />);
    const input = getByPlaceholderText('Enter API Key');

    expect(input.props.secureTextEntry).toBe(true);
  });

  it('disables connect button when fields are empty', () => {
    const { getByText } = render(<SetupScreen />);
    const button = getByText('Connect to Server').parent;

    expect(button?.props.accessibilityState?.disabled).toBe(true);
  });

  it('enables connect button when both fields are filled', () => {
    const { getByPlaceholderText, getByText } = render(<SetupScreen />);

    fireEvent.changeText(
      getByPlaceholderText('https://smartpocket.example.com'),
      'https://my-server.com'
    );
    fireEvent.changeText(
      getByPlaceholderText('Enter API Key'),
      'test-api-key-123'
    );

    const button = getByText('Connect to Server').parent;
    expect(button?.props.accessibilityState?.disabled).toBe(false);
  });

  it('shows loading state when connecting', async () => {
    const { getByPlaceholderText, getByText, getByTestId } = render(<SetupScreen />);

    // Fill in fields
    fireEvent.changeText(
      getByPlaceholderText('https://smartpocket.example.com'),
      'https://my-server.com'
    );
    fireEvent.changeText(
      getByPlaceholderText('Enter API Key'),
      'test-api-key-123'
    );

    // Press connect button
    const button = getByText('Connect to Server');
    fireEvent.press(button);

    // Should show loading indicator
    await waitFor(() => {
      expect(getByTestId('button-loading-indicator')).toBeTruthy();
    });
  });

  it('validates server URL format', async () => {
    const { getByPlaceholderText, getByText } = render(<SetupScreen />);

    fireEvent.changeText(
      getByPlaceholderText('https://smartpocket.example.com'),
      'not-a-url'
    );
    fireEvent.changeText(
      getByPlaceholderText('Enter API Key'),
      'test-api-key-123'
    );

    const button = getByText('Connect to Server');
    fireEvent.press(button);

    await waitFor(() => {
      expect(getByText(/invalid/i)).toBeTruthy();
    });
  });
});
