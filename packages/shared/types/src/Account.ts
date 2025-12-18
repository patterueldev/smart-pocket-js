export interface Account {
  id: string;
  name: string;
  type: 'checking' | 'credit' | 'cash' | 'savings' | 'other';
  actualBudgetId: string;
}
