import React from 'react';

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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="card p-6">
      <h2 className="text-xl font-semibold text-dark-100 mb-4">Financial Overview</h2>
      
      {/* Chart Visualization */}
      <div className="space-y-4">
        {/* Sale Price Bar */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-dark-200">Total Sale Price</span>
            <span className="text-sm font-bold text-dark-100">{formatCurrency(totalSalePrice)}</span>
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
            <span className="text-sm font-bold text-dark-100">{formatCurrency(totalCost)}</span>
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
            <span className="text-sm font-medium text-dark-200">Client Payments</span>
            <span className="text-sm font-bold text-dark-100">{formatCurrency(totalClientPayments)}</span>
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
            <span className="text-sm font-bold text-dark-100">{formatCurrency(totalProviderPayments)}</span>
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
          }`}>
            {formatCurrency(profit)}
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
            <div className="text-sm text-dark-400">Client Balance</div>
            <div className={`text-lg font-semibold ${
              sale.clientBalance <= 0 ? 'text-success-400' : 'text-error-400'
            }`}>
              {formatCurrency(sale.clientBalance)}
            </div>
          </div>
          <div>
            <div className="text-sm text-dark-400">Provider Balance</div>
            <div className={`text-lg font-semibold ${
              sale.providerBalance >= 0 ? 'text-success-400' : 'text-error-400'
            }`}>
              {formatCurrency(sale.providerBalance)}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="text-sm text-dark-400 mb-2">Legend:</div>
        <div className="flex flex-wrap gap-4 text-xs text-dark-300">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-primary-500 rounded mr-2"></div>
            <span>Sale Price</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-error-500 rounded mr-2"></div>
            <span>Cost</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-success-500 rounded mr-2"></div>
            <span>Client Payments</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-warning-500 rounded mr-2"></div>
            <span>Provider Payments</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfitChart;