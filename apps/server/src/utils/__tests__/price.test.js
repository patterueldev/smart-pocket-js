const { createPrice, formatPrice, calculateTotal } = require('../price');

describe('Price Utilities', () => {
  describe('createPrice', () => {
    it('should create price object from number', () => {
      const price = createPrice(3.99, 'USD');
      expect(price).toEqual({
        amount: '3.99',
        currency: 'USD',
      });
    });

    it('should default to USD currency', () => {
      const price = createPrice(10.50);
      expect(price.currency).toBe('USD');
    });

    it('should handle integer values', () => {
      const price = createPrice(10, 'USD');
      expect(price.amount).toBe('10.00');
    });

    it('should handle zero values', () => {
      const price = createPrice(0, 'USD');
      expect(price.amount).toBe('0.00');
    });
  });

  describe('formatPrice', () => {
    it('should format USD price correctly', () => {
      const formatted = formatPrice({ amount: '3.99', currency: 'USD' });
      expect(formatted).toBe('$3.99');
    });

    it('should format PHP price correctly', () => {
      const formatted = formatPrice({ amount: '100.00', currency: 'PHP' });
      expect(formatted).toBe('₱100.00');
    });

    it('should format JPY price correctly (no decimals)', () => {
      const formatted = formatPrice({ amount: '1000', currency: 'JPY' });
      expect(formatted).toBe('¥1,000');
    });
  });

  describe('calculateTotal', () => {
    it('should calculate total from items', () => {
      const items = [
        { price: { amount: '3.99', currency: 'USD' }, quantity: 1 },
        { price: { amount: '2.49', currency: 'USD' }, quantity: 2 },
      ];
      const total = calculateTotal(items);
      expect(total).toEqual({
        amount: '8.97',
        currency: 'USD',
      });
    });

    it('should handle fractional quantities', () => {
      const items = [
        { price: { amount: '2.00', currency: 'USD' }, quantity: 1.5 },
      ];
      const total = calculateTotal(items);
      expect(total).toEqual({
        amount: '3.00',
        currency: 'USD',
      });
    });

    it('should handle empty items array', () => {
      const total = calculateTotal([]);
      expect(total).toEqual({
        amount: '0.00',
        currency: 'USD',
      });
    });
  });
});
