export interface ServerInfo {
  version: string;
  features: {
    googleSheetsSync: boolean;
    aiInsights: boolean;
  };
  currency: string;
}

export interface ConnectionRequest {
  deviceInfo: {
    platform: string;
    appVersion: string;
    deviceId: string;
  };
}

export interface ConnectionResponse {
  token: string;
  expiresIn: number;
  serverInfo: ServerInfo;
}

export interface Session {
  serverUrl: string;
  token: string;
  expiresAt: string;
  serverInfo: ServerInfo;
}
