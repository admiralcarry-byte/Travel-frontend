/**
 * Currency JSX Utilities
 * 
 * JSX utility functions for handling currency symbols and names with translation blocking
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
 * Get currency symbol as JSX for use in formatNumbers.jsx
 * @param {string} currency - Currency code
 * @returns {JSX.Element} DatabaseValue component with currency symbol
 */
export const getCurrencySymbolJSX = (currency) => {
  const symbols = {
    'USD': 'U$',
    'ARS': 'AR$'
  };
  
  const symbol = symbols[currency?.toUpperCase()] || 'U$';
  return <DatabaseValue data-field="currency" data-currency={currency}>{symbol}</DatabaseValue>;
};
