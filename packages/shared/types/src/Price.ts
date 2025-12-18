/**
 * Standardized price object for monetary values
 * 
 * @see docs/PRICE_OBJECT.md for specification
 */
export interface Price {
  /**
   * Decimal value as string for exact precision
   * @example "3.99"
   */
  amount: string;
  
  /**
   * ISO 4217 currency code
   * @example "USD", "JPY", "PHP"
   */
  currency: string;
}
