/**
 * Utility functions for formatting numbers in a readable way
 */
import { t } from './i18n';

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
 * Format large numbers with appropriate suffixes (K, M, B)
 * @param {number} num - The number to format
 * @param {number} decimals - Number of decimal places (default: 1)
 * @param {string} currency - Currency symbol (default: 'U$')
 * @returns {string} Formatted number string
 */
export const formatLargeNumber = (num, decimals = 1, currency = 'USD') => {
  if (num === null || num === undefined || isNaN(num)) {
    return `${getCurrencySymbol(currency)}0`;
  }

  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  const symbol = getCurrencySymbol(currency);

  if (absNum >= 1e9) {
    return `${sign}${symbol}${(absNum / 1e9).toFixed(decimals)}B`;
  } else if (absNum >= 1e6) {
    return `${sign}${symbol}${(absNum / 1e6).toFixed(decimals)}M`;
  } else if (absNum >= 1e3) {
    return `${sign}${symbol}${(absNum / 1e3).toFixed(decimals)}K`;
  } else {
    return `${sign}${symbol}${absNum.toFixed(decimals)}`;
  }
};

/**
 * Format currency with proper locale formatting
 * @param {number} amount - The amount to format
 * @param {string} currency - Currency code (default: 'USD')
 * @param {string} locale - Locale string (default: 'en-US')
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'USD', locale = 'en-US') => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    amount = 0;
  }


  // Handle ARS currency specially since it's not a standard ISO currency code
  if (currency.toUpperCase() === 'ARS') {
    const result = `${t('arsSymbol')}${formatNumberWithCommas(amount, 2)}`;
    return result;
  }

  // Handle USD currency
  if (currency.toUpperCase() === 'USD') {
    const result = `${t('usdSymbol')}${formatNumberWithCommas(amount, 2)}`;
    return result;
  }

  // For other currencies, use Intl.NumberFormat
  const formatted = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency
  }).format(amount);
  
  return formatted;
};

/**
 * Format currency with large number abbreviations and proper currency symbol
 * @param {number} amount - The amount to format
 * @param {string} currency - Currency code (default: 'USD')
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Formatted currency string with abbreviations
 */
export const formatCurrencyCompact = (amount, currency = 'USD', decimals = 1) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return formatLargeNumber(0, decimals, getCurrencySymbol(currency));
  }

  return formatLargeNumber(amount, decimals, getCurrencySymbol(currency));
};

/**
 * Get currency symbol for display
 * @param {string} currency - Currency code
 * @returns {string} Currency symbol
 */
export const getCurrencySymbol = (currency) => {
  const symbols = {
    'USD': t('usdSymbol'),
    'ARS': t('arsSymbol')
  };
  
  return symbols[currency?.toUpperCase()] || t('usdSymbol');
};


/**
 * Format percentage with proper decimal places
 * @param {number} value - The percentage value (0-100)
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Formatted percentage string
 */
export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%';
  }

  return `${value.toFixed(decimals)}%`;
};

/**
 * Format currency with full number display (no decimals, no abbreviations)
 * @param {number} amount - The amount to format
 * @param {string} currency - Currency code (default: 'USD')
 * @returns {string} Formatted currency string with full numbers
 */
export const formatCurrencyFull = (amount, currency = 'USD') => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return formatLargeNumber(0, 0, getCurrencySymbol(currency));
  }

  const absAmount = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  
  // Display full number with proper formatting (no decimal places)
  return `${sign}${getCurrencySymbol(currency)}${formatNumberWithCommas(absAmount, 0)}`;
};

/**
 * Format balance with appropriate color coding
 * @param {number} balance - The balance amount
 * @param {string} currency - Currency symbol (default: 'U$')
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {object} Object with formatted value and color class
 */
export const formatBalance = (balance, currency = 'USD', decimals = 2) => {
  const formatted = formatCurrencyCompact(balance, currency, decimals);
  const colorClass = balance >= 0 ? 'text-green-600' : 'text-red-600';
  
  return {
    value: formatted,
    colorClass: colorClass
  };
};

/**
 * Check if a number is suspiciously large (potential data error)
 * @param {number} num - The number to check
 * @param {number} threshold - Threshold for "suspiciously large" (default: 1e6)
 * @returns {boolean} True if the number is suspiciously large
 */
export const isSuspiciouslyLarge = (num, threshold = 1e6) => {
  return Math.abs(num) > threshold;
};

/**
 * Format number with warning if suspiciously large
 * @param {number} num - The number to format
 * @param {string} currency - Currency symbol (default: 'U$')
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {object} Object with formatted value and warning flag
 */
export const formatWithWarning = (num, currency = 'USD', decimals = 1) => {
  const formatted = formatLargeNumber(num, decimals, currency);
  const warning = isSuspiciouslyLarge(num);
  
  return {
    value: formatted,
    warning: warning,
    original: num
  };
};