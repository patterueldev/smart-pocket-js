import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'smartpocket_device_id';

function generateFallbackId() {
  // Lightweight UUID-ish string without extra dependencies
  return 'sp-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

function createId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch (e) {
    // If randomUUID throws (unsupported environment), fall through to fallback
  }
  return generateFallbackId();
}

export async function getDeviceId(): Promise<string> {
  try {
    const existing = await AsyncStorage.getItem(STORAGE_KEY);
    if (existing) return existing;

    const id = createId();
    await AsyncStorage.setItem(STORAGE_KEY, id);
    return id;
  } catch (error) {
    console.warn('[deviceId] Failed to read/write device id, using fallback', error);
    return createId();
  }
}
