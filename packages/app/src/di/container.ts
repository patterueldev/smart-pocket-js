import 'reflect-metadata';
import { Container } from 'inversify';
import { IReceiptScanService, MockReceiptScanService } from '@smart-pocket/receipt-scan-service';
import { ITransactionService, MockTransactionService } from '@smart-pocket/transaction-service';
import { IGoogleSheetsService, MockGoogleSheetsService } from '@smart-pocket/google-sheets-service';

// Service identifiers
export const TYPES = {
  IReceiptScanService: Symbol.for('IReceiptScanService'),
  ITransactionService: Symbol.for('ITransactionService'),
  IGoogleSheetsService: Symbol.for('IGoogleSheetsService'),
};

/**
 * Dependency Injection Container
 * 
 * Binds service interfaces to implementations.
 * Currently using mock services - will be replaced with real API services in issue #42
 */
export const container = new Container();

// Bind mock services (for now)
container.bind<IReceiptScanService>(TYPES.IReceiptScanService).to(MockReceiptScanService);
container.bind<ITransactionService>(TYPES.ITransactionService).to(MockTransactionService);
container.bind<IGoogleSheetsService>(TYPES.IGoogleSheetsService).to(MockGoogleSheetsService);
