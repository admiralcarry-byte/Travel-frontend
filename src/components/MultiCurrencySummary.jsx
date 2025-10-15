import React from 'react';
import { formatCurrency, formatCurrencyCompact } from '../utils/formatNumbers';

const MultiCurrencySummary = ({ currencyData, title = "Sales by Currency" }) => {
  if (!currencyData || currencyData.length === 0) {
    return (
      <div className="card-glass p-6">
        <h3 className="text-lg font-semibold text-dark-200 mb-4">{title}</h3>
        <p className="text-dark-400 text-sm">No currency data available</p>
      </div>
    );
  }

  // Calculate grand totals across all currencies (for display purposes only)
  const grandTotals = currencyData.reduce((acc, curr) => ({
    totalSales: acc.totalSales + (curr.totalSales || curr.totalSalesInCurrency || 0),
    totalProfit: acc.totalProfit + (curr.totalProfit || curr.totalProfitInCurrency || 0),
    totalCost: acc.totalCost + (curr.totalCost || curr.totalCostInCurrency || 0),
    count: acc.count + (curr.count || curr.saleCount || 0)
  }), { totalSales: 0, totalProfit: 0, totalCost: 0, count: 0 });

  // Function to format currency with proper symbol (USD and ARS only)
  const formatWithCurrency = (amount, currency) => {
    const symbols = {
      USD: 'U$',
      ARS: 'AR$'
    };

    const symbol = symbols[currency] || currency;
    return `${symbol} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Get profit margin color
  const getProfitMarginColor = (margin) => {
    if (margin >= 30) return 'text-green-400';
    if (margin >= 15) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="card-glass p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-dark-200">{title}</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-dark-400">
            {currencyData.length} {currencyData.length === 1 ? 'Currency' : 'Currencies'}
          </span>
        </div>
      </div>

      {/* Currency Breakdown Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-dark-700">
              <th className="text-left py-3 px-4 text-sm font-semibold text-dark-300">Currency</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-dark-300">Sales Count</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-dark-300">Total Revenue</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-dark-300">Total Cost</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-dark-300">Total Profit</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-dark-300">Margin</th>
            </tr>
          </thead>
          <tbody>
            {currencyData.map((data, index) => {
              const currency = data._id;
              const salesCount = data.count || data.saleCount || 0;
              const totalRevenue = data.totalSales || data.totalSalesInCurrency || 0;
              const totalCost = data.totalCost || data.totalCostInCurrency || 0;
              const totalProfit = data.totalProfit || data.totalProfitInCurrency || 0;
              const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100) : 0;

              return (
                <tr 
                  key={currency || index}
                  className="border-b border-dark-700/50 hover:bg-dark-700/30 transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary-500/20 text-primary-400 font-semibold text-sm">
                        {currency}
                      </span>
                      <span className="text-dark-200 font-medium">{currency}</span>
                    </div>
                  </td>
                  <td className="text-right py-3 px-4 text-dark-200">
                    {salesCount}
                  </td>
                  <td className="text-right py-3 px-4 text-dark-200 font-medium">
                    {formatWithCurrency(totalRevenue, currency)}
                  </td>
                  <td className="text-right py-3 px-4 text-dark-300">
                    {formatWithCurrency(totalCost, currency)}
                  </td>
                  <td className="text-right py-3 px-4 text-green-400 font-semibold">
                    {formatWithCurrency(totalProfit, currency)}
                  </td>
                  <td className={`text-right py-3 px-4 font-semibold ${getProfitMarginColor(profitMargin)}`}>
                    {profitMargin.toFixed(2)}%
                  </td>
                </tr>
              );
            })}

            {/* Grand Total Row (Warning: Mixed Currencies) */}
            {currencyData.length > 1 && (
              <tr className="border-t-2 border-dark-600 bg-dark-700/40">
                <td className="py-3 px-4 font-semibold text-dark-200">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">Combined Total</span>
                    <span className="text-xs text-yellow-400" title="Note: This is a mixed-currency total for reference only">
                      ⚠️
                    </span>
                  </div>
                </td>
                <td className="text-right py-3 px-4 font-semibold text-dark-200">
                  {grandTotals.count}
                </td>
                <td className="text-right py-3 px-4 font-semibold text-dark-200">
                  <span className="text-xs text-dark-400">Mixed</span>
                </td>
                <td className="text-right py-3 px-4 font-semibold text-dark-200">
                  <span className="text-xs text-dark-400">Mixed</span>
                </td>
                <td className="text-right py-3 px-4 font-semibold text-dark-200">
                  <span className="text-xs text-dark-400">Mixed</span>
                </td>
                <td className="text-right py-3 px-4">
                  <span className="text-xs text-dark-400">-</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Warning about mixed currencies */}
      {currencyData.length > 1 && (
        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <div className="flex items-start space-x-2">
            <svg className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm text-yellow-400 font-medium">Multiple Currencies Detected</p>
              <p className="text-xs text-dark-300 mt-1">
                The combined total is for reference only. To get accurate comparisons, apply currency exchange rates or filter by a specific currency.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Currency Distribution Chart (simple bar visualization) */}
      <div className="mt-6">
        <h4 className="text-sm font-semibold text-dark-300 mb-3">Revenue Distribution</h4>
        <div className="space-y-2">
          {currencyData.map((data, index) => {
            const currency = data._id;
            const totalRevenue = data.totalSales || data.totalSalesInCurrency || 0;
            const percentage = grandTotals.totalSales > 0 ? (totalRevenue / grandTotals.totalSales) * 100 : 0;

            return (
              <div key={currency || index} className="flex items-center space-x-3">
                <span className="text-xs font-medium text-dark-300 w-12">{currency}</span>
                <div className="flex-1 bg-dark-700 rounded-full h-6 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full flex items-center justify-end px-2"
                    style={{ width: `${Math.max(percentage, 5)}%` }}
                  >
                    <span className="text-xs font-semibold text-white">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MultiCurrencySummary;

