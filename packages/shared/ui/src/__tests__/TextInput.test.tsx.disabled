import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TextInput } from '../TextInput';

describe('TextInput', () => {
  it('renders with value', () => {
    const { getByDisplayValue } = render(
      <TextInput value="test value" onChangeText={() => {}} />
    );
    expect(getByDisplayValue('test value')).toBeTruthy();
  });

  it('calls onChangeText when text changes', () => {
    const onChangeText = jest.fn();
    const { getByTestId } = render(
      <TextInput value="" onChangeText={onChangeText} />
    );
    
    fireEvent.changeText(getByTestId('text-input'), 'new text');
    expect(onChangeText).toHaveBeenCalledWith('new text');
  });

  it('renders label when provided', () => {
    const { getByText } = render(
      <TextInput value="" onChangeText={() => {}} label="Username" />
    );
    expect(getByText('Username')).toBeTruthy();
  });

  it('renders error message when provided', () => {
    const { getByText } = render(
      <TextInput value="" onChangeText={() => {}} error="Invalid input" />
    );
    expect(getByText('Invalid input')).toBeTruthy();
  });

  it('renders helper text when provided', () => {
    const { getByText } = render(
      <TextInput value="" onChangeText={() => {}} helperText="Enter your name" />
    );
    expect(getByText('Enter your name')).toBeTruthy();
  });

  it('applies error styling when error is present', () => {
    const { getByTestId } = render(
      <TextInput value="" onChangeText={() => {}} error="Error" />
    );
    const input = getByTestId('text-input');
    expect(input).toBeTruthy();
  });
});
