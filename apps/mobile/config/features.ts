import Constants from 'expo-constants';

export const isAuthRefreshEnabled = (): boolean => {
  const extra = (Constants?.expoConfig as any)?.extra || {};
  const value = extra.AUTH_REFRESH_ENABLED;
  return typeof value === 'boolean' ? value : true;
};
