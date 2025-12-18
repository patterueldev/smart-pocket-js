import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, TouchableWithoutFeedback } from 'react-native';

interface SideMenuProps {
  visible: boolean;
  onClose: () => void;
  onSettings: () => void;
  onDisconnect: () => void;
}

export const SideMenu: React.FC<SideMenuProps> = ({ visible, onClose, onSettings, onDisconnect }) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
      testID="side-menu-modal"
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} testID="side-menu-overlay">
          <TouchableWithoutFeedback>
            <View style={styles.menu}>
              <View style={styles.header}>
                <Text style={styles.title}>Menu</Text>
                <Pressable 
                  onPress={onClose} 
                  style={styles.closeButton}
                  testID="side-menu-close-button"
                >
                  <Text style={styles.closeIcon}>✕</Text>
                </Pressable>
              </View>

              <View style={styles.menuItems}>
                <Pressable
                  style={({ pressed }) => [
                    styles.menuItem,
                    pressed && styles.menuItemPressed,
                  ]}
                  onPress={onSettings}
                >
                  <Text style={styles.menuItemIcon}>⚙️</Text>
                  <Text style={styles.menuItemText}>Settings</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.menuItem,
                    styles.disconnectItem,
                    pressed && styles.menuItemPressed,
                  ]}
                  onPress={onDisconnect}
                >
                  <Text style={styles.menuItemIcon}>🔌</Text>
                  <Text style={[styles.menuItemText, styles.disconnectText]}>Disconnect</Text>
                </Pressable>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
  },
  menu: {
    width: 280,
    height: '100%',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  closeIcon: {
    fontSize: 24,
    color: '#666',
  },
  menuItems: {
    paddingTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemPressed: {
    backgroundColor: '#f5f5f5',
  },
  menuItemIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  menuItemText: {
    fontSize: 18,
    color: '#333',
  },
  disconnectItem: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  disconnectText: {
    color: '#d32f2f',
  },
});
