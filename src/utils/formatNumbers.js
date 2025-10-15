/**
 * Utility functions for formatting numbers in a readable way
 */

/**
 * Format large numbers with appropriate suffixes (K, M, B)
 * @param {number} num - The number to format
 * @param {number} decimals - Number of decimal places (default: 1)
 * @param {string} currency - Currency symbol (default: 'U$')
 * @returns {string} Formatted number string
 */
export const formatLargeNumber = (num, decimals = 1, currency = 'U$') => {
  if (num === null || num === undefined || isNaN(num)) {
    return `${currency}0`;
  }

  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  if (absNum >= 1e9) {
    return `${sign}${currency}${(absNum / 1e9).toFixed(decimals)}B`;
  } else if (absNum >= 1e6) {
    return `${sign}${currency}${(absNum / 1e6).toFixed(decimals)}M`;
  } else if (absNum >= 1e3) {
    return `${sign}${currency}${(absNum / 1e3).toFixed(decimals)}K`;
  } else {
    return `${sign}${currency}${absNum.toFixed(decimals)}`;
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
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(0);
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency
  }).format(amount);
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
    'USD': 'U$',
    'ARS': 'AR$'
  };
  
  return symbols[currency?.toUpperCase()] || 'U$';
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
 * Format balance with appropriate color coding
 * @param {number} balance - The balance amount
 * @param {string} currency - Currency symbol (default: 'U$')
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {object} Object with formatted value and color class
 */
export const formatBalance = (balance, currency = 'U$', decimals = 2) => {
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
export const formatWithWarning = (num, currency = 'U$', decimals = 1) => {
  const formatted = formatLargeNumber(num, decimals, currency);
  const warning = isSuspiciouslyLarge(num);
  
  return {
    value: formatted,
    warning: warning,
    original: num
  };
};