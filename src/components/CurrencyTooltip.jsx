import React, { useState } from 'react';

const CurrencyTooltip = ({ children, currency, data }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!currency || !data) {
    return children;
  }

  const formatCurrency = (amount, currency) => {
    if (!amount) return '0';
    
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    return formatter.format(amount);
  };

  const getCurrencySymbol = (currency) => {
    switch (currency) {
      case 'USD':
        return '$';
      case 'ARS':
        return 'AR$';
      default:
        return currency;
    }
  };

  const getCurrencyInfo = (currency) => {
    switch (currency) {
      case 'USD':
        return {
          name: 'US Dollar',
          symbol: '$',
          description: 'United States Dollar - Primary currency for international transactions'
        };
      case 'ARS':
        return {
          name: 'Argentine Peso',
          symbol: '$',
          description: 'Argentine Peso - Local currency for Argentina operations'
        };
      default:
        return {
          name: currency,
          symbol: currency,
          description: `${currency} currency transactions`
        };
    }
  };

  const currencyInfo = getCurrencyInfo(currency);

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {children}
      
      {showTooltip && (
        <div className="absolute z-50 w-80 p-4 bg-dark-800 border border-dark-600 rounded-lg shadow-xl top-full left-0 mt-2">
          <div className="space-y-3">
            {/* Currency Header */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {currencyInfo.symbol}
                </span>
              </div>
              <div>
                <h4 className="text-white font-semibold text-sm">
                  {currencyInfo.name}
                </h4>
                <p className="text-dark-300 text-xs">
                  {currencyInfo.description}
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-dark-600"></div>

            {/* Data Summary */}
            <div className="space-y-2">
              <h5 className="text-dark-200 font-medium text-sm">
                Current Period Summary
              </h5>
              
              {data.totalRevenue && (
                <div className="flex justify-between items-center">
                  <span className="text-dark-300 text-xs">Total Revenue:</span>
                  <span className="text-white font-medium text-sm">
                    {formatCurrency(data.totalRevenue, currency)}
                  </span>
                </div>
              )}
              
              {data.totalProfit && (
                <div className="flex justify-between items-center">
                  <span className="text-dark-300 text-xs">Total Profit:</span>
                  <span className="text-green-400 font-medium text-sm">
                    {formatCurrency(data.totalProfit, currency)}
                  </span>
                </div>
              )}
              
              {data.saleCount && (
                <div className="flex justify-between items-center">
                  <span className="text-dark-300 text-xs">Sales Count:</span>
                  <span className="text-white font-medium text-sm">
                    {data.saleCount}
                  </span>
                </div>
              )}
              
              {data.averageSaleValue && (
                <div className="flex justify-between items-center">
                  <span className="text-dark-300 text-xs">Avg Sale Value:</span>
                  <span className="text-white font-medium text-sm">
                    {formatCurrency(data.averageSaleValue, currency)}
                  </span>
                </div>
              )}
            </div>

            {/* Filter Note */}
            <div className="bg-primary-900/20 border border-primary-600/30 rounded p-2">
              <p className="text-primary-300 text-xs">
                <strong>Note:</strong> Only {currency} transactions are displayed when this filter is active.
              </p>
            </div>
          </div>
          
          {/* Tooltip Arrow */}
          <div className="absolute -top-2 left-4 w-4 h-4 bg-dark-800 border-l border-t border-dark-600 transform rotate-45"></div>
        </div>
      )}
    </div>
  );
};

export default CurrencyTooltip;
