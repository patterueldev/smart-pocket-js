import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';

describe('Button', () => {
  it('renders with title', () => {
    const { getByText } = render(<Button title="Click Me" onPress={() => {}} />);
    expect(getByText('Click Me')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button title="Click Me" onPress={onPress} />);
    
    fireEvent.press(getByText('Click Me'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('disables press when disabled', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button title="Click Me" onPress={onPress} disabled />
    );
    
    fireEvent.press(getByText('Click Me'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('disables press when loading', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button title="Click Me" onPress={onPress} loading />
    );
    
    fireEvent.press(getByText('Click Me'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows loading indicator when loading', () => {
    const { getByTestId } = render(
      <Button title="Click Me" onPress={() => {}} loading />
    );
    
    expect(getByTestId('button-loading-indicator')).toBeTruthy();
  });

  it('applies variant styles', () => {
    const { getByTestId: getByTestIdPrimary } = render(
      <Button title="Primary" onPress={() => {}} variant="primary" />
    );
    const { getByTestId: getByTestIdSecondary } = render(
      <Button title="Secondary" onPress={() => {}} variant="secondary" />
    );
    
    expect(getByTestIdPrimary('button-container')).toBeTruthy();
    expect(getByTestIdSecondary('button-container')).toBeTruthy();
  });

  it('applies size styles', () => {
    const { getByTestId: getByTestIdSmall } = render(
      <Button title="Small" onPress={() => {}} size="small" />
    );
    const { getByTestId: getByTestIdLarge } = render(
      <Button title="Large" onPress={() => {}} size="large" />
    );
    
    expect(getByTestIdSmall('button-container')).toBeTruthy();
    expect(getByTestIdLarge('button-container')).toBeTruthy();
  });
});
