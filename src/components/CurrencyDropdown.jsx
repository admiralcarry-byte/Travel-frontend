import React from 'react';
import DatabaseValue from './DatabaseValue';

/**
 * CurrencyDropdown Component
 * 
 * A dropdown component specifically for currency selection that blocks translation
 * of currency symbols and names while allowing translation of labels.
 * 
 * Usage:
 * <CurrencyDropdown 
 *   value={currency} 
 *   onChange={handleCurrencyChange}
 *   className="custom-class"
 * />
 */
const CurrencyDropdown = ({ value, onChange, className = '', ...props }) => {
  const currencyOptions = [
    { value: 'USD', symbol: 'U$', name: 'dólares estadounidenses' },
    { value: 'ARS', symbol: 'AR$', name: 'dólares argentinos' }
  ];

  return (
    <select 
      value={value} 
      onChange={onChange}
      className={`input-field ${className}`}
      {...props}
    >
      {currencyOptions.map(option => (
        <option key={option.value} value={option.value} className="notranslate">
          <DatabaseValue data-field="currency" data-currency={option.value}>
            {option.symbol} - {option.name}
          </DatabaseValue>
        </option>
      ))}
    </select>
  );
};

/**
 * CurrencySymbol Component
 * 
 * Displays currency symbol with translation blocking
 * 
 * Usage:
 * <CurrencySymbol currency="USD" />
 */
export const CurrencySymbol = ({ currency, className = '' }) => {
  const symbols = {
    'USD': 'U$',
    'ARS': 'AR$'
  };
  
  const symbol = symbols[currency] || 'U$';
  
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
 * CurrencyName Component
 * 
 * Displays currency name with translation blocking
 * 
 * Usage:
 * <CurrencyName currency="USD" />
 */
export const CurrencyName = ({ currency, className = '' }) => {
  const names = {
    'USD': 'dólares estadounidenses',
    'ARS': 'dólares argentinos'
  };
  
  const name = names[currency] || 'dólares estadounidenses';
  
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

export default CurrencyDropdown;
