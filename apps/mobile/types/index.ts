export interface Transaction {
  id: string;
  date: string;
  payeeName: string;
  total: {
    amount: string;
    currency: string;
  };
}
