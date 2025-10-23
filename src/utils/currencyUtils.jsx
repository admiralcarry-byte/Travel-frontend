/**
 * Currency Utilities
 * 
 * Utility functions for handling currency symbols and names with translation blocking
 */

import React from 'react';
import DatabaseValue from '../components/DatabaseValue';

/**
 * Currency symbols mapping
 */
export const CURRENCY_SYMBOLS = {
  USD: 'U$',
  ARS: 'AR$'
};

/**
 * Currency names mapping
 */
export const CURRENCY_NAMES = {
  USD: 'dólares estadounidenses',
  ARS: 'dólares argentinos'
};

/**
 * Get currency symbol as DatabaseValue component (blocks translation)
 * @param {string} currency - Currency code ('USD' or 'ARS')
 * @param {string} className - Additional CSS classes
 * @returns {JSX.Element} DatabaseValue component with currency symbol
 */
export const CurrencySymbol = ({ currency, className = '' }) => {
  const symbol = CURRENCY_SYMBOLS[currency] || CURRENCY_SYMBOLS.USD;
  
  return (
    <DatabaseValue 
      data-field="currency" 
      data-currency={currency}
      className={className}
    >
      {symbol}
    </DatabaseValue>
  );
};

/**
 * Get currency name as DatabaseValue component (blocks translation)
 * @param {string} currency - Currency code ('USD' or 'ARS')
 * @param {string} className - Additional CSS classes
 * @returns {JSX.Element} DatabaseValue component with currency name
 */
export const CurrencyName = ({ currency, className = '' }) => {
  const name = CURRENCY_NAMES[currency] || CURRENCY_NAMES.USD;
  
  return (
    <DatabaseValue 
      data-field="currency" 
      data-currency={currency}
      className={className}
    >
      {name}
    </DatabaseValue>
  );
};

/**
 * Get currency symbol as string (for non-JSX contexts)
 * @param {string} currency - Currency code ('USD' or 'ARS')
 * @returns {string} Currency symbol
 */
export const getCurrencySymbolString = (currency) => {
  return CURRENCY_SYMBOLS[currency] || CURRENCY_SYMBOLS.USD;
};

/**
 * Get currency name as string (for non-JSX contexts)
 * @param {string} currency - Currency code ('USD' or 'ARS')
 * @returns {string} Currency name
 */
export const getCurrencyNameString = (currency) => {
  return CURRENCY_NAMES[currency] || CURRENCY_NAMES.USD;
};

/**
 * Format currency amount with symbol (blocks translation of symbol)
 * @param {number} amount - The amount to format
 * @param {string} currency - Currency code ('USD' or 'ARS')
 * @param {number} decimals - Number of decimal places (default: 2)
 * @param {string} className - Additional CSS classes
 * @returns {JSX.Element} Formatted currency with DatabaseValue wrapper
 */
export const FormatCurrency = ({ amount, currency, decimals = 2, className = '' }) => {
  const symbol = CURRENCY_SYMBOLS[currency] || CURRENCY_SYMBOLS.USD;
  const formattedAmount = amount.toFixed(decimals);
  
  return (
    <span className={className}>
      <DatabaseValue data-field="currency" data-currency={currency}>
        {symbol}
      </DatabaseValue>
      {formattedAmount}
    </span>
  );
};

/**
 * Create currency dropdown options with translation blocking
 * @returns {Array} Array of currency options with DatabaseValue components
 */
export const getCurrencyDropdownOptions = () => [
  {
    value: 'USD',
    label: (
      <span className="notranslate">
        <CurrencySymbol currency="USD" /> - <CurrencyName currency="USD" />
      </span>
    )
  },
  {
    value: 'ARS',
    label: (
      <span className="notranslate">
        <CurrencySymbol currency="ARS" /> - <CurrencyName currency="ARS" />
      </span>
    )
  }
];
