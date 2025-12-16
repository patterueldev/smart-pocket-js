/**
 * Price Object Utilities
 * 
 * Utilities for working with standardized price objects:
 * { amount: "3.99", currency: "USD" }
 */

const Dinero = require('dinero.js');

/**
 * Create a price object from number
 */
function createPrice(amount, currency = 'USD') {
  if (typeof amount === 'string') {
    amount = parseFloat(amount);
  }
  
  return {
    amount: amount.toFixed(2),
    currency: currency.toUpperCase(),
  };
}

/**
 * Parse price object to Dinero instance
 */
function toDinero(priceObj) {
  const cents = Math.round(parseFloat(priceObj.amount) * 100);
  return Dinero({ amount: cents, currency: priceObj.currency });
}

/**
 * Convert Dinero instance to price object
 */
function fromDinero(dineroObj) {
  return {
    amount: dineroObj.toUnit().toFixed(2),
    currency: dineroObj.getCurrency(),
  };
}

/**
 * Add two prices (must have same currency)
 */
function addPrices(price1, price2) {
  if (price1.currency !== price2.currency) {
    throw new Error('Cannot add prices with different currencies');
  }
  
  const d1 = toDinero(price1);
  const d2 = toDinero(price2);
  
  return fromDinero(d1.add(d2));
}

/**
 * Subtract two prices (must have same currency)
 */
function subtractPrices(price1, price2) {
  if (price1.currency !== price2.currency) {
    throw new Error('Cannot subtract prices with different currencies');
  }
  
  const d1 = toDinero(price1);
  const d2 = toDinero(price2);
  
  return fromDinero(d1.subtract(d2));
}

/**
 * Multiply price by quantity
 */
function multiplyPrice(priceObj, quantity) {
  const dineroObj = toDinero(priceObj);
  return fromDinero(dineroObj.multiply(quantity));
}

/**
 * Compare two prices
 * Returns: -1 if price1 < price2, 0 if equal, 1 if price1 > price2
 */
function comparePrices(price1, price2) {
  if (price1.currency !== price2.currency) {
    throw new Error('Cannot compare prices with different currencies');
  }
  
  const amount1 = parseFloat(price1.amount);
  const amount2 = parseFloat(price2.amount);
  
  if (amount1 < amount2) return -1;
  if (amount1 > amount2) return 1;
  return 0;
}

/**
 * Format price for display
 */
function formatPrice(priceObj, locale = 'en-US') {
  const amount = parseFloat(priceObj.amount);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: priceObj.currency,
  }).format(amount);
}

/**
 * Validate price object structure
 */
function isValidPrice(priceObj) {
  if (!priceObj || typeof priceObj !== 'object') {
    return false;
  }
  
  if (!priceObj.amount || !priceObj.currency) {
    return false;
  }
  
  if (typeof priceObj.amount !== 'string') {
    return false;
  }
  
  if (typeof priceObj.currency !== 'string' || priceObj.currency.length !== 3) {
    return false;
  }
  
  if (isNaN(parseFloat(priceObj.amount))) {
    return false;
  }
  
  return true;
}

/**
 * Calculate total price from line items
 * Each item should have: { price: { amount, currency }, quantity }
 */
function calculateTotal(items) {
  if (!items || items.length === 0) {
    return { amount: '0.00', currency: 'USD' };
  }
  
  // Verify all items have same currency
  const currency = items[0].price.currency;
  const differentCurrency = items.some(item => item.price.currency !== currency);
  
  if (differentCurrency) {
    throw new Error('Cannot calculate total: items have different currencies');
  }
  
  // Calculate total using Dinero
  const total = items.reduce((sum, item) => {
    const itemPrice = toDinero(item.price);
    const lineTotal = itemPrice.multiply(item.quantity);
    return sum ? sum.add(lineTotal) : lineTotal;
  }, null);
  
  return fromDinero(total);
}

module.exports = {
  createPrice,
  toDinero,
  fromDinero,
  addPrices,
  subtractPrices,
  multiplyPrice,
  comparePrices,
  formatPrice,
  isValidPrice,
  calculateTotal,
};
