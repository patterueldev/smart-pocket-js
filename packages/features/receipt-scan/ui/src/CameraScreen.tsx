import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { Button, theme } from '@smart-pocket/shared-ui';

export interface CameraScreenProps {
  onCapture: (imageUri: string) => void;
  onClose: () => void;
}

/**
 * Camera Screen for Receipt Scanning
 * 
 * Note: This is a placeholder implementation.
 * Real implementation will use expo-camera or react-native-camera
 */
export const CameraScreen: React.FC<CameraScreenProps> = ({
  onCapture,
  onClose,
}) => {
  const [isCapturing, setIsCapturing] = useState(false);

  const handleCapture = () => {
    if (Platform.OS === 'web') {
      Alert.alert(
        'Not Available',
        'Camera is not available on web. Please use the mobile app.'
      );
      return;
    }

    setIsCapturing(true);
    
    // Simulate camera capture
    setTimeout(() => {
      // Mock image URI
      const mockImageUri = 'file:///mock/receipt-image.jpg';
      onCapture(mockImageUri);
      setIsCapturing(false);
    }, 500);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Scan Receipt</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Camera Viewfinder (Mock) */}
      <View style={styles.viewfinder}>
        <View style={styles.mockCamera}>
          <Text style={styles.mockCameraText}>
            📷 Camera Viewfinder
          </Text>
          <Text style={styles.mockCameraSubtext}>
            (Mock - Real camera integration pending)
          </Text>
        </View>
        
        {/* Guide Overlay */}
        <View style={styles.guideOverlay}>
          <View style={styles.guideBox} />
        </View>
      </View>

      {/* Tips */}
      <View style={styles.tipsContainer}>
        <Text style={styles.tipsText}>
          💡 Frame entire receipt{'\n'}
          ☀️ Ensure good lighting
        </Text>
      </View>

      {/* Capture Button */}
      <View style={styles.captureContainer}>
        <Button
          title={isCapturing ? 'Capturing...' : 'Capture'}
          onPress={handleCapture}
          size="large"
          loading={isCapturing}
          style={styles.captureButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: '#fff',
    fontSize: 24,
  },
  title: {
    ...theme.typography.h3,
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  viewfinder: {
    flex: 1,
    position: 'relative',
  },
  mockCamera: {
    flex: 1,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mockCameraText: {
    fontSize: 32,
    color: '#fff',
    marginBottom: theme.spacing.sm,
  },
  mockCameraSubtext: {
    fontSize: 14,
    color: '#999',
  },
  guideOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideBox: {
    width: '80%',
    aspectRatio: 0.7,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    borderStyle: 'dashed',
  },
  tipsContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  tipsText: {
    ...theme.typography.body,
    color: '#fff',
    textAlign: 'center',
  },
  captureContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  captureButton: {
    width: '100%',
  },
});
