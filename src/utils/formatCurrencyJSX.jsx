/**
 * Enhanced currency formatting utilities that return JSX elements with translate="no"
 * This prevents browser translation features from modifying currency symbols and values
 */
import React from 'react';
import { t } from './i18n';
import CurrencyDisplay from '../components/CurrencyDisplay';

/**
 * Format number with commas as thousand separators, independent of browser locale
 * @param {number} num - The number to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted number string
 */
const formatNumberWithCommas = (num, decimals = 2) => {
  if (num === null || num === undefined || isNaN(num)) {
    num = 0;
  }
  
  // Use Math.round to avoid any locale-dependent formatting
  const multiplier = Math.pow(10, decimals);
  const rounded = Math.round(num * multiplier) / multiplier;
  
  // Convert to string and ensure we have the right number of decimal places
  let str = rounded.toString();
  
  // Handle decimal places
  if (decimals > 0) {
    const dotIndex = str.indexOf('.');
    if (dotIndex === -1) {
      str += '.';
    }
    const currentDecimals = str.length - str.indexOf('.') - 1;
    for (let i = currentDecimals; i < decimals; i++) {
      str += '0';
    }
  }
  
  // Split into integer and decimal parts
  const parts = str.split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1] || '';
  
  // Add commas to integer part
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  // Combine parts
  const result = decimals > 0 && decimalPart ? formattedInteger + '.' + decimalPart : formattedInteger;
  return result;
};

/**
 * Get currency symbol for display
 * @param {string} currency - Currency code
 * @returns {string} Currency symbol
 */
const getCurrencySymbol = (currency) => {
  const symbols = {
    'USD': t('usdSymbol'),
    'ARS': t('arsSymbol')
  };
  
  return symbols[currency?.toUpperCase()] || t('usdSymbol');
};

/**
 * Format currency with proper locale formatting - returns JSX element
 * @param {number} amount - The amount to format
 * @param {string} currency - Currency code (default: 'USD')
 * @param {string} locale - Locale string (default: 'en-US')
 * @param {string} className - CSS class for the wrapper element
 * @returns {JSX.Element} Formatted currency JSX element
 */
export const formatCurrencyJSX = (amount, currency = 'USD', locale = 'en-US', className = '') => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    amount = 0;
  }

  // Handle ARS currency specially since it's not a standard ISO currency code
  if (currency.toUpperCase() === 'ARS') {
    const result = `${t('arsSymbol')}${formatNumberWithCommas(amount, 2)}`;
    return (
      <CurrencyDisplay className={className}>
        {result}
      </CurrencyDisplay>
    );
  }

  // Handle USD currency
  if (currency.toUpperCase() === 'USD') {
    const result = `${t('usdSymbol')}${formatNumberWithCommas(amount, 2)}`;
    return (
      <CurrencyDisplay className={className}>
        {result}
      </CurrencyDisplay>
    );
  }

  // For other currencies, use Intl.NumberFormat
  const formatted = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency
  }).format(amount);
  
  return (
    <CurrencyDisplay className={className}>
      {formatted}
    </CurrencyDisplay>
  );
};

/**
 * Format large numbers with appropriate suffixes (K, M, B) - returns JSX element
 * @param {number} num - The number to format
 * @param {number} decimals - Number of decimal places (default: 1)
 * @param {string} currency - Currency symbol (default: 'USD')
 * @param {string} className - CSS class for the wrapper element
 * @returns {JSX.Element} Formatted number JSX element
 */
export const formatLargeNumberJSX = (num, decimals = 1, currency = 'USD', className = '') => {
  if (num === null || num === undefined || isNaN(num)) {
    return (
      <CurrencyDisplay className={className}>
        {getCurrencySymbol(currency)}0
      </CurrencyDisplay>
    );
  }

  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  const symbol = getCurrencySymbol(currency);

  let result;
  if (absNum >= 1e9) {
    result = `${sign}${symbol}${(absNum / 1e9).toFixed(decimals)}B`;
  } else if (absNum >= 1e6) {
    result = `${sign}${symbol}${(absNum / 1e6).toFixed(decimals)}M`;
  } else if (absNum >= 1e3) {
    result = `${sign}${symbol}${(absNum / 1e3).toFixed(decimals)}K`;
  } else {
    result = `${sign}${symbol}${absNum.toFixed(decimals)}`;
  }

  return (
    <CurrencyDisplay className={className}>
      {result}
    </CurrencyDisplay>
  );
};

/**
 * Format currency with large number abbreviations - returns JSX element
 * @param {number} amount - The amount to format
 * @param {string} currency - Currency code (default: 'USD')
 * @param {number} decimals - Number of decimal places (default: 1)
 * @param {string} className - CSS class for the wrapper element
 * @returns {JSX.Element} Formatted currency JSX element with abbreviations
 */
export const formatCurrencyCompactJSX = (amount, currency = 'USD', decimals = 1, className = '') => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return formatLargeNumberJSX(0, decimals, getCurrencySymbol(currency), className);
  }

  return formatLargeNumberJSX(amount, decimals, getCurrencySymbol(currency), className);
};

/**
 * Format currency with full number display (no decimals, no abbreviations) - returns JSX element
 * @param {number} amount - The amount to format
 * @param {string} currency - Currency code (default: 'USD')
 * @param {string} className - CSS class for the wrapper element
 * @returns {JSX.Element} Formatted currency JSX element with full numbers
 */
export const formatCurrencyFullJSX = (amount, currency = 'USD', className = '') => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return formatLargeNumberJSX(0, 0, getCurrencySymbol(currency), className);
  }

  const absAmount = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  
  // Display full number with proper formatting (no decimal places)
  const result = `${sign}${getCurrencySymbol(currency)}${formatNumberWithCommas(absAmount, 0)}`;
  
  return (
    <CurrencyDisplay className={className}>
      {result}
    </CurrencyDisplay>
  );
};

/**
 * Format balance with appropriate color coding - returns JSX element
 * @param {number} balance - The balance amount
 * @param {string} currency - Currency symbol (default: 'USD')
 * @param {number} decimals - Number of decimal places (default: 2)
 * @param {string} className - CSS class for the wrapper element
 * @returns {JSX.Element} Object with formatted value and color class
 */
export const formatBalanceJSX = (balance, currency = 'USD', decimals = 2, className = '') => {
  const formatted = formatCurrencyCompactJSX(balance, currency, decimals, className);
  const colorClass = balance >= 0 ? 'text-green-600' : 'text-red-600';
  
  return (
    <CurrencyDisplay className={`${colorClass} ${className}`}>
      {formatted.props.children}
    </CurrencyDisplay>
  );
};

/**
 * Get currency symbol JSX element
 * @param {string} currency - Currency code
 * @param {string} className - CSS class for the wrapper element
 * @returns {JSX.Element} Currency symbol JSX element
 */
export const getCurrencySymbolJSX = (currency, className = '') => {
  const symbol = getCurrencySymbol(currency);
  
  return (
    <CurrencyDisplay className={className}>
      {symbol}
    </CurrencyDisplay>
  );
};

export default {
  formatCurrencyJSX,
  formatLargeNumberJSX,
  formatCurrencyCompactJSX,
  formatCurrencyFullJSX,
  formatBalanceJSX,
  getCurrencySymbolJSX
};
