import React from 'react';
import { formatCurrencyCompact, formatWithWarning } from '../utils/formatNumbers';

const ProfitChart = ({ sale }) => {
  // Calculate chart data
  const totalSalePrice = sale.totalSalePrice || 0;
  const totalCost = sale.totalCost || 0;
  const profit = sale.profit || 0;
  const totalClientPayments = sale.totalClientPayments || 0;
  const totalProviderPayments = sale.totalProviderPayments || 0;

  // Calculate percentages for the chart
  const maxValue = Math.max(totalSalePrice, totalCost, totalClientPayments, totalProviderPayments);
  const salePricePercent = maxValue > 0 ? (totalSalePrice / maxValue) * 100 : 0;
  const costPercent = maxValue > 0 ? (totalCost / maxValue) * 100 : 0;
  const clientPaymentsPercent = maxValue > 0 ? (totalClientPayments / maxValue) * 100 : 0;
  const providerPaymentsPercent = maxValue > 0 ? (totalProviderPayments / maxValue) * 100 : 0;

  // Format values with warnings for suspiciously large numbers
  const formattedSalePrice = formatWithWarning(totalSalePrice);
  const formattedCost = formatWithWarning(totalCost);
  const formattedClientPayments = formatWithWarning(totalClientPayments);
  const formattedProviderPayments = formatWithWarning(totalProviderPayments);
  const formattedProfit = formatWithWarning(profit);

  return (
    <div className="card p-6">
      <h2 className="text-xl font-semibold text-dark-100 mb-4">Financial Overview</h2>
      
      {/* Chart Visualization */}
      <div className="space-y-4">
        {/* Sale Price Bar */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-dark-200">Total Sale Price</span>
            <span 
              className={`text-sm font-bold ${formattedSalePrice.warning ? 'text-red-500' : 'text-blue-500'}`}
              style={{ color: formattedSalePrice.warning ? '#ef4444' : '#3b82f6' }}
            >
              {formattedSalePrice.value}
              {formattedSalePrice.warning && <span className="text-xs text-red-400 ml-1">⚠️</span>}
            </span>
          </div>
          <div className="w-full bg-dark-700 rounded-full h-3">
            <div 
              className="bg-primary-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${salePricePercent}%` }}
            ></div>
          </div>
        </div>

        {/* Cost Bar */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-dark-200">Total Cost</span>
            <span 
              className={`text-sm font-bold ${formattedCost.warning ? 'text-red-500' : 'text-red-500'}`}
              style={{ color: '#ef4444' }}
            >
              {formattedCost.value}
              {formattedCost.warning && <span className="text-xs text-red-400 ml-1">⚠️</span>}
            </span>
          </div>
          <div className="w-full bg-dark-700 rounded-full h-3">
            <div 
              className="bg-error-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${costPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Client Payments Bar */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-dark-200">Passenger Payments</span>
            <span 
              className={`text-sm font-bold ${formattedClientPayments.warning ? 'text-red-500' : 'text-green-500'}`}
              style={{ color: formattedClientPayments.warning ? '#ef4444' : '#22c55e' }}
            >
              {formattedClientPayments.value}
              {formattedClientPayments.warning && <span className="text-xs text-red-400 ml-1">⚠️</span>}
            </span>
          </div>
          <div className="w-full bg-dark-700 rounded-full h-3">
            <div 
              className="bg-success-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${clientPaymentsPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Provider Payments Bar */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-dark-200">Provider Payments</span>
            <span 
              className={`text-sm font-bold ${formattedProviderPayments.warning ? 'text-red-500' : 'text-orange-500'}`}
              style={{ color: formattedProviderPayments.warning ? '#ef4444' : '#f97316' }}
            >
              {formattedProviderPayments.value}
              {formattedProviderPayments.warning && <span className="text-xs text-red-400 ml-1">⚠️</span>}
            </span>
          </div>
          <div className="w-full bg-dark-700 rounded-full h-3">
            <div 
              className="bg-warning-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${providerPaymentsPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Profit Summary */}
      <div className="mt-6 pt-4 border-t border-white/10">
        <div className="flex justify-between items-center">
          <span className="text-lg font-medium text-dark-200">Net Profit</span>
          <span className={`text-2xl font-bold ${
            profit >= 0 ? 'text-success-400' : 'text-error-400'
          } ${formattedProfit.warning ? 'text-red-500' : ''}`}>
            {formattedProfit.value}
            {formattedProfit.warning && <span className="text-xs text-red-400 ml-1">⚠️</span>}
          </span>
        </div>
        <div className="flex justify-between items-center mt-1">
          <span className="text-sm text-dark-400">Profit Margin</span>
          <span className={`text-sm font-semibold ${
            profit >= 0 ? 'text-success-400' : 'text-error-400'
          }`}>
            {totalSalePrice > 0 ? ((profit / totalSalePrice) * 100).toFixed(1) : 0}%
          </span>
        </div>
      </div>

      {/* Balance Summary */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-dark-400">Passenger Balance</div>
            <div className={`text-lg font-semibold ${
              sale.clientBalance <= 0 ? 'text-success-400' : 'text-error-400'
            }`}>
              {formatCurrencyCompact(sale.clientBalance)}
            </div>
          </div>
          <div>
            <div className="text-sm text-dark-400">Provider Balance</div>
            <div className={`text-lg font-semibold ${
              sale.providerBalance >= 0 ? 'text-success-400' : 'text-error-400'
            }`}>
              {formatCurrencyCompact(sale.providerBalance)}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="text-sm text-dark-400 mb-2">Legend:</div>
        <div className="flex flex-wrap gap-4 text-xs text-dark-300">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
            <span>Sale Price</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
            <span>Cost</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
            <span>Passenger Payments</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-orange-500 rounded mr-2"></div>
            <span>Provider Payments</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfitChart;