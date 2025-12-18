import React, { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { CameraScreen, OCRPreviewScreen } from '@smart-pocket/receipt-scan-ui';
import { MockReceiptScanService } from '@smart-pocket/receipt-scan-service';
import type { OCRParseResponse } from '@smart-pocket/shared-types';

const receiptScanService = new MockReceiptScanService();

type ScreenState = 'camera' | 'preview';

export default function ReceiptScanRoute() {
  const router = useRouter();
  const [screenState, setScreenState] = useState<ScreenState>('camera');
  const [imageUri, setImageUri] = useState<string>('');
  const [ocrText, setOcrText] = useState<string>('');
  const [parseResult, setParseResult] = useState<OCRParseResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  console.log('ReceiptScanRoute render, screenState:', screenState);

  useEffect(() => {
    console.log('useEffect: screenState changed to:', screenState);
  }, [screenState]);

  const handleCapture = (uri: string) => {
    console.log('=== handleCapture called ===');
    console.log('Receipt captured:', uri);
    console.log('Current screenState:', screenState);
    setImageUri(uri);
    
    // Simulate OCR text extraction (normally done by expo-camera or native module)
    const mockOCRText = `WALMART
DATE: ${new Date().toLocaleDateString()}
TIME: 10:30 AM

ORGANIC BANANAS   WM-123456
  1.5 @ $3.99              $5.99
  
WHOLE MILK 1GAL   WM-789012
  1 @ $4.29                $4.29

BREAD WHEAT       WM-555333
  2 @ $2.99                $5.98

SUBTOTAL:                 $16.26
TAX:                       $1.30
TOTAL:                    $17.56

THANK YOU FOR SHOPPING!`;

    setOcrText(mockOCRText);
    console.log('Setting screenState to preview...');
    setScreenState('preview');
    console.log('After setState, screenState should be preview');
  };

  const handleSubmit = async (remarks?: string) => {
    setIsLoading(true);
    try {
      // Parse OCR text with service (calls OpenAI in real implementation)
      const result = await receiptScanService.parseReceipt({
        ocrText,
        remarks,
      });
      
      console.log('OCR parsed successfully:', result);
      setParseResult(result);
      
      // Navigate to transaction screen with pre-filled data
      router.push({
        pathname: '/transaction',
        params: {
          fromOCR: 'true',
          merchant: result.merchant,
          date: result.date,
          items: JSON.stringify(result.items),
          ocrText,
          remarks: remarks || '',
          confidence: result.confidence.toString(),
        },
      });
    } catch (error) {
      console.error('Failed to parse receipt:', error);
      Alert.alert('Error', 'Failed to parse receipt. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetake = () => {
    setImageUri('');
    setOcrText('');
    setParseResult(null);
    setScreenState('camera');
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <>
      {screenState === 'camera' ? (
        <CameraScreen
          onCapture={handleCapture}
          onClose={handleClose}
        />
      ) : (
        <OCRPreviewScreen
          ocrText={ocrText}
          onSubmit={handleSubmit}
          onRetake={handleRetake}
          isLoading={isLoading}
        />
      )}
    </>
  );
}
