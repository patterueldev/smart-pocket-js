import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDeviceId } from '../services/deviceId';

describe('getDeviceId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns existing device id without creating a new one', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('stored-id');

    const id = await getDeviceId();

    expect(id).toBe('stored-id');
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  });

  it('generates and stores a new id when none exists', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

    // Ensure crypto.randomUUID exists for the test environment
    if (!globalThis.crypto) {
      // @ts-expect-error minimal stub for test
      globalThis.crypto = { randomUUID: () => 'uuid-1234' };
    } else if (typeof globalThis.crypto.randomUUID !== 'function') {
      // @ts-expect-error assign stub if missing
      globalThis.crypto.randomUUID = () => 'uuid-1234';
    }

    const randomUUIDSpy = jest.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue('uuid-1234');

    const id = await getDeviceId();

    expect(id).toBe('uuid-1234');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('smartpocket_device_id', 'uuid-1234');
    randomUUIDSpy.mockRestore();
  });

  it('falls back to custom generator if randomUUID is unavailable', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    const originalCrypto = globalThis.crypto;
    // @ts-expect-error override for test
    globalThis.crypto = {} as Crypto;

    const id = await getDeviceId();

    expect(id).toMatch(/^sp-/);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('smartpocket_device_id', expect.stringMatching(/^sp-/));

    globalThis.crypto = originalCrypto;
  });
});
