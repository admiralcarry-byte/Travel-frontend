import { useState, useEffect } from 'react';
import { t, getCurrentLanguage } from '../utils/i18n';
import { 
  formatCurrencyJSX, 
  formatLargeNumberJSX, 
  formatCurrencyCompactJSX, 
  formatCurrencyFullJSX,
  formatBalanceJSX,
  getCurrencySymbolJSX 
} from '../utils/formatCurrencyJSX.jsx';

/**
 * Custom hook for reactive currency formatting
 * This ensures currency symbols update when language changes
 */
export const useCurrencyFormat = () => {
  const [currentLanguage, setCurrentLanguage] = useState(getCurrentLanguage());

  useEffect(() => {
    const handleLanguageChange = () => {
      setCurrentLanguage(getCurrentLanguage());
    };

    window.addEventListener('languageChanged', handleLanguageChange);
    return () => window.removeEventListener('languageChanged', handleLanguageChange);
  }, []);

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

  const formatCurrency = (amount, currency = 'USD') => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      amount = 0;
    }

    // Handle ARS currency specially since it's not a standard ISO currency code
    if (currency.toUpperCase() === 'ARS') {
      return `${t('arsSymbol')}${formatNumberWithCommas(amount, 2)}`;
    }

    // Handle USD currency
    if (currency.toUpperCase() === 'USD') {
      return `${t('usdSymbol')}${formatNumberWithCommas(amount, 2)}`;
    }

    // For other currencies, use Intl.NumberFormat
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
    
    return formatted;
  };

  const getCurrencySymbol = (currency) => {
    const symbols = {
      'USD': t('usdSymbol'),
      'ARS': t('arsSymbol')
    };
    
    return symbols[currency?.toUpperCase()] || t('usdSymbol');
  };

  return {
    formatCurrency,
    formatNumberWithCommas,
    getCurrencySymbol,
    currentLanguage,
    // JSX versions that prevent translation
    formatCurrencyJSX,
    formatLargeNumberJSX,
    formatCurrencyCompactJSX,
    formatCurrencyFullJSX,
    formatBalanceJSX,
    getCurrencySymbolJSX
  };
};
