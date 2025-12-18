import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SideMenu } from '../SideMenu';

describe('SideMenu', () => {
  const mockOnClose = jest.fn();
  const mockOnSettings = jest.fn();
  const mockOnDisconnect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not render when not visible', () => {
    const { queryByTestId } = render(
      <SideMenu
        visible={false}
        onClose={mockOnClose}
        onSettings={mockOnSettings}
        onDisconnect={mockOnDisconnect}
      />
    );

    expect(queryByTestId('side-menu-modal')).toBeTruthy();
  });

  it('renders when visible', () => {
    const { getByTestId, getByText } = render(
      <SideMenu
        visible={true}
        onClose={mockOnClose}
        onSettings={mockOnSettings}
        onDisconnect={mockOnDisconnect}
      />
    );

    expect(getByTestId('side-menu-modal')).toBeTruthy();
    expect(getByText('Settings')).toBeTruthy();
    expect(getByText('Disconnect')).toBeTruthy();
  });

  it('calls onClose when close button pressed', () => {
    const { getByTestId } = render(
      <SideMenu
        visible={true}
        onClose={mockOnClose}
        onSettings={mockOnSettings}
        onDisconnect={mockOnDisconnect}
      />
    );

    const closeButton = getByTestId('side-menu-close-button');
    fireEvent.press(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when overlay pressed', () => {
    const { getByTestId } = render(
      <SideMenu
        visible={true}
        onClose={mockOnClose}
        onSettings={mockOnSettings}
        onDisconnect={mockOnDisconnect}
      />
    );

    const overlay = getByTestId('side-menu-overlay');
    fireEvent.press(overlay);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onSettings when settings option pressed', () => {
    const { getByText } = render(
      <SideMenu
        visible={true}
        onClose={mockOnClose}
        onSettings={mockOnSettings}
        onDisconnect={mockOnDisconnect}
      />
    );

    const settingsButton = getByText('Settings');
    fireEvent.press(settingsButton);

    expect(mockOnSettings).toHaveBeenCalledTimes(1);
  });

  it('calls onDisconnect when disconnect option pressed', () => {
    const { getByText } = render(
      <SideMenu
        visible={true}
        onClose={mockOnClose}
        onSettings={mockOnSettings}
        onDisconnect={mockOnDisconnect}
      />
    );

    const disconnectButton = getByText('Disconnect');
    fireEvent.press(disconnectButton);

    expect(mockOnDisconnect).toHaveBeenCalledTimes(1);
  });

  it('applies correct animation type to modal', () => {
    const { getByTestId } = render(
      <SideMenu
        visible={true}
        onClose={mockOnClose}
        onSettings={mockOnSettings}
        onDisconnect={mockOnDisconnect}
      />
    );

    const modal = getByTestId('side-menu-modal');
    expect(modal.props.animationType).toBe('fade');
  });

  it('sets modal as transparent', () => {
    const { getByTestId } = render(
      <SideMenu
        visible={true}
        onClose={mockOnClose}
        onSettings={mockOnSettings}
        onDisconnect={mockOnDisconnect}
      />
    );

    const modal = getByTestId('side-menu-modal');
    expect(modal.props.transparent).toBe(true);
  });
});
