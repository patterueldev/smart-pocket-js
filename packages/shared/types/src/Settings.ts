/**
 * User-defined account types for transfer filtering
 */
export type CustomAccountType = 'bank' | 'ewallet' | 'cash' | 'credit' | 'savings' | 'other';

/**
 * Mapping of account IDs to custom types
 */
export type AccountTypes = Record<string, CustomAccountType>;

/**
 * Account type classifications
 */
export type AccountClassType = 'bank' | 'ewallet' | 'cash';

/**
 * Account type mappings for transfer filtering
 */
export interface AccountMappings {
  accountTypes: AccountTypes;
}

/**
 * Update account types request
 */
export interface UpdateAccountTypesRequest {
  accountTypes: AccountTypes;
}

/**
 * Account types response
 */
export interface AccountTypesResponse {
  accountTypes: AccountTypes;
}

/**
 * Accounts by type response
 */
export interface AccountsByTypeResponse {
  accounts: Array<{
    id: string;
    name: string;
    actualBudgetId: string;
    customType: CustomAccountType;
  }>;
}

/**
 * Transfer settings configuration
 */
export interface TransferSettings {
  enabledAccountIds: string[];
  bankAtmPayeeIds: string[];
}

/**
 * Update transfer settings request
 */
export interface UpdateTransferSettingsRequest {
  enabledAccountIds: string[];
  bankAtmPayeeIds: string[];
}

/**
 * Transfer settings response
 */
export interface TransferSettingsResponse {
  transferSettings: TransferSettings;
}
