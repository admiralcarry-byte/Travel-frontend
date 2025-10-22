import React, { useState, useEffect } from 'react';
import { formatCurrency, formatCurrencyCompact, formatCurrencyEllipsis } from '../utils/formatNumbers';
import CurrencyDisplay from './CurrencyDisplay';

const FinancialSummary = ({ sales, period = 'all', selectedCurrency = 'ARS' }) => {
  const [selectedPeriod, setSelectedPeriod] = useState(period);
  const [viewMode, setViewMode] = useState('overview'); // 'overview', 'detailed', 'comparison'

  // Filter sales by period and currency
  const filteredSales = React.useMemo(() => {
    if (!sales) return [];

    // First filter by currency
    let currencyFiltered = sales.filter(sale => sale.saleCurrency === selectedCurrency);

    // Then filter by period
    if (selectedPeriod === 'all') return currencyFiltered;

    const now = new Date();
    const filterDate = new Date();

    switch (selectedPeriod) {
      case 'today':
        filterDate.setHours(0, 0, 0, 0);
        return currencyFiltered.filter(sale => new Date(sale.createdAt) >= filterDate);
      case 'week':
        filterDate.setDate(now.getDate() - 7);
        return currencyFiltered.filter(sale => new Date(sale.createdAt) >= filterDate);
      case 'month':
        filterDate.setMonth(now.getMonth() - 1);
        return currencyFiltered.filter(sale => new Date(sale.createdAt) >= filterDate);
      case 'quarter':
        filterDate.setMonth(now.getMonth() - 3);
        return currencyFiltered.filter(sale => new Date(sale.createdAt) >= filterDate);
      case 'year':
        filterDate.setFullYear(now.getFullYear() - 1);
        return currencyFiltered.filter(sale => new Date(sale.createdAt) >= filterDate);
      default:
        return currencyFiltered;
    }
  }, [sales, selectedPeriod, selectedCurrency]);

  // Calculate comprehensive financial metrics
  const financialMetrics = React.useMemo(() => {
    if (!filteredSales || filteredSales.length === 0) {
      return {
        totalSales: 0,
        totalRevenue: 0,
        totalCost: 0,
        totalProfit: 0,
        averageSaleValue: 0,
        averageProfit: 0,
        averageProfitMargin: 0,
        grossProfitMargin: 0,
        netProfitMargin: 0,
        revenueGrowth: 0,
        profitGrowth: 0,
        topPerformingSale: null,
        worstPerformingSale: null,
        profitDistribution: {
          profitable: 0,
          breakeven: 0,
          loss: 0
        },
        monthlyBreakdown: [],
        serviceBreakdown: [],
        statusBreakdown: {
          open: 0,
          closed: 0,
          cancelled: 0
        }
      };
    }

    const metrics = filteredSales.reduce((acc, sale) => {
      acc.totalSales += 1;
      acc.totalRevenue += sale.totalSalePrice || 0;
      acc.totalCost += sale.totalCost || 0;
      acc.totalProfit += sale.profit || 0;

      // Profit distribution
      if (sale.profit > 0) acc.profitDistribution.profitable += 1;
      else if (sale.profit === 0) acc.profitDistribution.breakeven += 1;
      else acc.profitDistribution.loss += 1;

      // Status breakdown
      acc.statusBreakdown[sale.status] = (acc.statusBreakdown[sale.status] || 0) + 1;

      return acc;
    }, {
      totalSales: 0,
      totalRevenue: 0,
      totalCost: 0,
      totalProfit: 0,
      profitDistribution: { profitable: 0, breakeven: 0, loss: 0 },
      statusBreakdown: { open: 0, closed: 0, cancelled: 0 }
    });

    // Calculate averages and margins
    metrics.averageSaleValue = metrics.totalSales > 0 ? metrics.totalRevenue / metrics.totalSales : 0;
    metrics.averageProfit = metrics.totalSales > 0 ? metrics.totalProfit / metrics.totalSales : 0;
    metrics.averageProfitMargin = metrics.totalRevenue > 0 ? (metrics.totalProfit / metrics.totalRevenue) * 100 : 0;
    metrics.grossProfitMargin = metrics.totalRevenue > 0 ? ((metrics.totalRevenue - metrics.totalCost) / metrics.totalRevenue) * 100 : 0;
    metrics.netProfitMargin = metrics.averageProfitMargin; // Same as average profit margin in this context

    // Find best and worst performing sales
    const sortedByProfit = [...filteredSales].sort((a, b) => (b.profit || 0) - (a.profit || 0));
    metrics.topPerformingSale = sortedByProfit[0];
    metrics.worstPerformingSale = sortedByProfit[sortedByProfit.length - 1];

    // Monthly breakdown
    const monthlyData = {};
    filteredSales.forEach(sale => {
      const date = new Date(sale.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: date.getMonth() + 1,
          year: date.getFullYear(),
          totalSales: 0,
          totalRevenue: 0,
          totalCost: 0,
          totalProfit: 0
        };
      }
      monthlyData[monthKey].totalSales += 1;
      monthlyData[monthKey].totalRevenue += sale.totalSalePrice || 0;
      monthlyData[monthKey].totalCost += sale.totalCost || 0;
      monthlyData[monthKey].totalProfit += sale.profit || 0;
    });
    metrics.monthlyBreakdown = Object.values(monthlyData).sort((a, b) => 
      a.year === b.year ? a.month - b.month : a.year - b.year
    );

    // Service breakdown
    const serviceData = {};
    filteredSales.forEach(sale => {
      sale.services?.forEach(service => {
        const serviceName = service.serviceName || 'Unknown Service';
        if (!serviceData[serviceName]) {
          serviceData[serviceName] = {
            name: serviceName,
            count: 0,
            totalRevenue: 0,
            totalCost: 0,
            totalProfit: 0
          };
        }
        serviceData[serviceName].count += 1;
        serviceData[serviceName].totalRevenue += (service.priceClient || 0) * (service.quantity || 1);
        serviceData[serviceName].totalCost += (service.costProvider || 0) * (service.quantity || 1);
        serviceData[serviceName].totalProfit += ((service.priceClient || 0) - (service.costProvider || 0)) * (service.quantity || 1);
      });
    });
    metrics.serviceBreakdown = Object.values(serviceData).sort((a, b) => b.totalProfit - a.totalProfit);

    return metrics;
  }, [filteredSales]);

  const getProfitColor = (profit) => {
    if (profit > 0) return 'text-green-400';
    if (profit === 0) return 'text-gray-400';
    return 'text-red-400';
  };

  const getMarginColor = (margin) => {
    if (margin >= 20) return 'text-green-400';
    if (margin >= 10) return 'text-yellow-400';
    if (margin >= 0) return 'text-orange-400';
    return 'text-red-400';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'closed': return 'text-green-400';
      case 'open': return 'text-yellow-400';
      case 'cancelled': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="card p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">Period</label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="input-field"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last Month</option>
                <option value="quarter">Last 3 Months</option>
                <option value="year">Last Year</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">View Mode</label>
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value)}
                className="input-field"
              >
                <option value="overview">Overview</option>
                <option value="detailed">Detailed</option>
                <option value="comparison">Comparison</option>
              </select>
            </div>
          </div>

          <div className="text-sm text-dark-300">
            {financialMetrics.totalSales} sales in {selectedPeriod}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-dark-300">Total Sales</p>
              <p className="text-2xl font-semibold text-dark-100">{financialMetrics.totalSales}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-dark-300">Total Revenue</p>
              <p className="text-2xl font-semibold text-dark-100"><CurrencyDisplay>{formatCurrencyEllipsis(financialMetrics.totalRevenue, selectedCurrency)}</CurrencyDisplay></p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-dark-300">Total Cost</p>
              <p className="text-2xl font-semibold text-dark-100"><CurrencyDisplay>{formatCurrencyEllipsis(financialMetrics.totalCost, selectedCurrency)}</CurrencyDisplay></p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-dark-300">Total Profit</p>
              <p className={`text-2xl font-semibold ${getProfitColor(financialMetrics.totalProfit)}`}>
                <CurrencyDisplay>{formatCurrencyEllipsis(financialMetrics.totalProfit, selectedCurrency)}</CurrencyDisplay>
              </p>
              <p className="text-sm text-dark-400">
                {financialMetrics.averageProfitMargin.toFixed(1)}% margin
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Metrics */}
      {viewMode === 'detailed' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-dark-100 mb-4">Performance Metrics</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-dark-300">Average Sale Value:</span>
                <span className="text-dark-100 font-medium"><CurrencyDisplay>{formatCurrency(financialMetrics.averageSaleValue, selectedCurrency)}</CurrencyDisplay></span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-dark-300">Average Profit:</span>
                <span className="text-dark-100 font-medium"><CurrencyDisplay>{formatCurrency(financialMetrics.averageProfit, selectedCurrency)}</CurrencyDisplay></span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-dark-300">Gross Profit Margin:</span>
                <span className={`font-medium ${getMarginColor(financialMetrics.grossProfitMargin)}`}>
                  {financialMetrics.grossProfitMargin.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-dark-300">Net Profit Margin:</span>
                <span className={`font-medium ${getMarginColor(financialMetrics.netProfitMargin)}`}>
                  {financialMetrics.netProfitMargin.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-dark-100 mb-4">Profit Distribution</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-green-400">Profitable Sales:</span>
                <span className="text-dark-100 font-medium">{financialMetrics.profitDistribution.profitable}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Breakeven Sales:</span>
                <span className="text-dark-100 font-medium">{financialMetrics.profitDistribution.breakeven}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-red-400">Loss Sales:</span>
                <span className="text-dark-100 font-medium">{financialMetrics.profitDistribution.loss}</span>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-dark-100 mb-4">Status Breakdown</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-green-400">Closed:</span>
                <span className="text-dark-100 font-medium">{financialMetrics.statusBreakdown.closed}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-yellow-400">Open:</span>
                <span className="text-dark-100 font-medium">{financialMetrics.statusBreakdown.open}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-red-400">Cancelled:</span>
                <span className="text-dark-100 font-medium">{financialMetrics.statusBreakdown.cancelled}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Service Breakdown */}
      {viewMode === 'detailed' && financialMetrics.serviceBreakdown.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-dark-100 mb-4">Service Performance</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-dark-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-dark-300 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-dark-300 uppercase tracking-wider">
                    Count
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
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {financialMetrics.serviceBreakdown.slice(0, 10).map((service, index) => {
                  const margin = service.totalRevenue > 0 ? (service.totalProfit / service.totalRevenue) * 100 : 0;
                  return (
                    <tr key={index} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-dark-100">
                        {service.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-100 text-right">
                        {service.count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-100 text-right">
                        <CurrencyDisplay>{formatCurrency(service.totalRevenue, selectedCurrency)}</CurrencyDisplay>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-100 text-right">
                        <CurrencyDisplay>{formatCurrency(service.totalCost, selectedCurrency)}</CurrencyDisplay>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className={`text-sm font-medium ${getProfitColor(service.totalProfit)}`}>
                          <CurrencyDisplay>{formatCurrency(service.totalProfit, selectedCurrency)}</CurrencyDisplay>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className={`text-sm font-medium ${getMarginColor(margin)}`}>
                          {margin.toFixed(1)}%
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Top Performers */}
      {financialMetrics.topPerformingSale && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-dark-100 mb-4">Top Performing Sale</h3>
            <div className="space-y-2">
              <div className="text-sm text-dark-300">
                Sale #{financialMetrics.topPerformingSale.id?.toString().slice(-8)}
              </div>
              <div className="text-sm text-dark-300">
                Passenger: {financialMetrics.topPerformingSale.clientId?.name} {financialMetrics.topPerformingSale.clientId?.surname}
              </div>
              <div className="text-sm font-medium text-green-400">
                Profit: <CurrencyDisplay>{formatCurrency(financialMetrics.topPerformingSale.profit, selectedCurrency)}</CurrencyDisplay>
              </div>
              <div className="text-sm text-dark-300">
                Margin: {financialMetrics.topPerformingSale.totalSalePrice > 0 ? 
                  ((financialMetrics.topPerformingSale.profit / financialMetrics.topPerformingSale.totalSalePrice) * 100).toFixed(1) : 0}%
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-dark-100 mb-4">Financial Health</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-dark-300">Profitability Rate:</span>
                <span className="text-dark-100 font-medium">
                  {financialMetrics.totalSales > 0 ? 
                    ((financialMetrics.profitDistribution.profitable / financialMetrics.totalSales) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-dark-300">Average Margin:</span>
                <span className={`font-medium ${getMarginColor(financialMetrics.averageProfitMargin)}`}>
                  {financialMetrics.averageProfitMargin.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-dark-300">Revenue per Sale:</span>
                <span className="text-dark-100 font-medium">
                  <CurrencyDisplay>{formatCurrency(financialMetrics.averageSaleValue, selectedCurrency)}</CurrencyDisplay>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialSummary;