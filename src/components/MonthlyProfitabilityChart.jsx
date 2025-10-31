import React, { useState, useEffect } from 'react';
import { formatCurrency, formatCurrencyCompact } from '../utils/formatNumbers';
import CurrencyDisplay from './CurrencyDisplay';

const MonthlyProfitabilityChart = ({ sales, onMonthClick, selectedCurrency = 'ARS' }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [viewMode, setViewMode] = useState('chart'); // 'chart', 'table', 'summary'

  // Calculate monthly data
  const monthlyData = React.useMemo(() => {
    if (!sales || sales.length === 0) return [];

    // Filter sales by selected currency
    const currencyFilteredSales = sales.filter(sale => sale.saleCurrency === selectedCurrency);

    const months = {};
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Initialize all months for the selected year
    for (let i = 0; i < 12; i++) {
      const monthKey = `${selectedYear}-${String(i + 1).padStart(2, '0')}`;
      months[monthKey] = {
        month: i + 1,
        monthName: monthNames[i],
        year: selectedYear,
        sales: [],
        totalSales: 0,
        totalRevenue: 0,
        totalCost: 0,
        totalProfit: 0,
        averageProfitMargin: 0,
        profitMargin: 0
      };
    }

    // Process sales data
    currencyFilteredSales.forEach(sale => {
      const saleDate = new Date(sale.createdAt);
      if (saleDate.getFullYear() === selectedYear) {
        const monthKey = `${selectedYear}-${String(saleDate.getMonth() + 1).padStart(2, '0')}`;
        if (months[monthKey]) {
          months[monthKey].sales.push(sale);
          months[monthKey].totalSales += 1;
          months[monthKey].totalRevenue += sale.totalSalePrice || 0;
          months[monthKey].totalCost += sale.totalCost || 0;
          months[monthKey].totalProfit += sale.profit || 0;
        }
      }
    });

    // Calculate profit margins
    Object.values(months).forEach(month => {
      if (month.totalRevenue > 0) {
        month.profitMargin = (month.totalProfit / month.totalRevenue) * 100;
        month.averageProfitMargin = month.totalSales > 0 ? month.profitMargin : 0;
      }
    });

    return Object.values(months).sort((a, b) => a.month - b.month);
  }, [sales, selectedYear, selectedCurrency]);

  // Calculate year summary
  const yearSummary = React.useMemo(() => {
    const totalSales = monthlyData.reduce((sum, month) => sum + month.totalSales, 0);
    const totalRevenue = monthlyData.reduce((sum, month) => sum + month.totalRevenue, 0);
    const totalCost = monthlyData.reduce((sum, month) => sum + month.totalCost, 0);
    const totalProfit = monthlyData.reduce((sum, month) => sum + month.totalProfit, 0);
    const averageProfitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return {
      totalSales,
      totalRevenue,
      totalCost,
      totalProfit,
      averageProfitMargin
    };
  }, [monthlyData]);

  // Get available years
  const availableYears = React.useMemo(() => {
    if (!sales || sales.length === 0) return [selectedYear];
    
    const years = new Set();
    sales.forEach(sale => {
      years.add(new Date(sale.createdAt).getFullYear());
    });
    
    return Array.from(years).sort((a, b) => b - a);
  }, [sales, selectedYear, selectedCurrency]);

  const getProfitColor = (profit) => {
    if (profit > 0) return 'text-green-400';
    if (profit === 0) return 'text-gray-400';
    return 'text-red-400';
  };

  const getProfitMarginColor = (margin) => {
    if (margin >= 20) return 'text-green-400';
    if (margin >= 10) return 'text-yellow-400';
    if (margin >= 0) return 'text-orange-400';
    return 'text-red-400';
  };

  const getBarColor = (profit) => {
    if (profit > 0) return 'bg-green-500';
    if (profit === 0) return 'bg-gray-500';
    return 'bg-red-500';
  };

  const maxProfit = Math.max(...monthlyData.map(month => Math.abs(month.totalProfit)), 1);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="card p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="input-field"
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">View Mode</label>
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value)}
                className="input-field"
              >
                <option value="chart">Chart</option>
                <option value="table">Table</option>
                <option value="summary">Summary</option>
              </select>
            </div>
          </div>

          <div className="text-sm text-dark-300">
            {yearSummary.totalSales} sales in {selectedYear}
          </div>
        </div>
      </div>

      {/* Year Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="text-sm font-medium text-dark-300">Total Sales</div>
          <div className="text-2xl font-semibold text-dark-100">{yearSummary.totalSales}</div>
        </div>
        <div className="card p-6">
          <div className="text-sm font-medium text-dark-300">Total Revenue</div>
          <div className="text-2xl font-semibold text-dark-100"><CurrencyDisplay>{formatCurrency(yearSummary.totalRevenue, selectedCurrency)}</CurrencyDisplay></div>
        </div>
        <div className="card p-6">
          <div className="text-sm font-medium text-dark-300">Total Profit</div>
          <div className={`text-2xl font-semibold ${getProfitColor(yearSummary.totalProfit)}`}>
            <CurrencyDisplay>{formatCurrency(yearSummary.totalProfit, selectedCurrency)}</CurrencyDisplay>
          </div>
        </div>
        <div className="card p-6">
          <div className="text-sm font-medium text-dark-300">Average Margin</div>
          <div className={`text-2xl font-semibold ${getProfitMarginColor(yearSummary.averageProfitMargin)}`}>
            {yearSummary.averageProfitMargin.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Chart View */}
      {viewMode === 'chart' && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-dark-100 mb-6">Monthly Profitability - {selectedYear}</h3>
          <div className="space-y-4">
            {monthlyData.map((month) => (
              <div key={month.month} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="text-sm font-medium text-dark-200">{month.monthName}</div>
                  <div className="text-sm text-dark-300">
                    {month.totalSales} sales • <CurrencyDisplay>{formatCurrency(month.totalProfit, selectedCurrency)}</CurrencyDisplay> profit
                  </div>
                </div>
                <div className="w-full bg-dark-700 rounded-full h-4 relative">
                  <div
                    className={`h-4 rounded-full transition-all duration-300 ${getBarColor(month.totalProfit)}`}
                    style={{
                      width: `${Math.abs(month.totalProfit) / maxProfit * 100}%`,
                      marginLeft: month.totalProfit < 0 ? `${100 - (Math.abs(month.totalProfit) / maxProfit * 100)}%` : '0%'
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-dark-400">
                  <span>Revenue: <CurrencyDisplay>{formatCurrency(month.totalRevenue, selectedCurrency)}</CurrencyDisplay></span>
                  <span>Cost: <CurrencyDisplay>{formatCurrency(month.totalCost, selectedCurrency)}</CurrencyDisplay></span>
                  <span className={getProfitMarginColor(month.profitMargin)}>
                    Margin: {month.profitMargin.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10">
            <h3 className="text-lg font-semibold text-dark-100">Monthly Performance - {selectedYear}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-dark-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-dark-300 uppercase tracking-wider">
                    Month
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-dark-300 uppercase tracking-wider">
                    Sales Count
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-dark-300 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-dark-300 uppercase tracking-wider">
                    Cost
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-dark-300 uppercase tracking-wider">
                    Profit
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-dark-300 uppercase tracking-wider">
                    Margin
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-dark-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {monthlyData.map((month) => (
                  <tr key={month.month} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-dark-100">
                      {month.monthName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-100 text-right">
                      {month.totalSales}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-100 text-right">
                      <CurrencyDisplay>{formatCurrency(month.totalRevenue, selectedCurrency)}</CurrencyDisplay>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-100 text-right">
                      <CurrencyDisplay>{formatCurrency(month.totalCost, selectedCurrency)}</CurrencyDisplay>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className={`text-sm font-medium ${getProfitColor(month.totalProfit)}`}>
                        <CurrencyDisplay>{formatCurrency(month.totalProfit, selectedCurrency)}</CurrencyDisplay>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className={`text-sm font-medium ${getProfitMarginColor(month.profitMargin)}`}>
                        {month.profitMargin.toFixed(1)}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => onMonthClick && onMonthClick(month)}
                        className="text-primary-400 hover:text-primary-300 text-sm font-medium"
                        disabled={month.totalSales === 0}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary View */}
      {viewMode === 'summary' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-dark-100 mb-4">Best Performing Months</h3>
            <div className="space-y-3">
              {monthlyData
                .filter(month => month.totalSales > 0)
                .sort((a, b) => b.totalProfit - a.totalProfit)
                .slice(0, 3)
                .map((month, index) => (
                  <div key={month.month} className="flex justify-between items-center">
                    <div className="text-sm font-medium text-dark-200">
                      #{index + 1} {month.monthName}
                    </div>
                    <div className="text-sm font-medium text-green-400">
                      <CurrencyDisplay>{formatCurrency(month.totalProfit, selectedCurrency)}</CurrencyDisplay>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-dark-100 mb-4">Monthly Trends</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-dark-300">Highest Revenue Month:</span>
                <span className="text-dark-100 font-medium">
                  {monthlyData.reduce((max, month) => 
                    month.totalRevenue > max.totalRevenue ? month : max, monthlyData[0])?.monthName || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-dark-300">Highest Margin Month:</span>
                <span className="text-dark-100 font-medium">
                  {monthlyData.reduce((max, month) => 
                    month.profitMargin > max.profitMargin ? month : max, monthlyData[0])?.monthName || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-dark-300">Most Active Month:</span>
                <span className="text-dark-100 font-medium">
                  {monthlyData.reduce((max, month) => 
                    month.totalSales > max.totalSales ? month : max, monthlyData[0])?.monthName || 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthlyProfitabilityChart;