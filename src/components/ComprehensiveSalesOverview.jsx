import React, { useState, useEffect } from 'react';
import { formatCurrency, formatCurrencyCompact } from '../utils/formatNumbers';
import CurrencyDisplay from './CurrencyDisplay';
import api from '../utils/api';

const ComprehensiveSalesOverview = ({ sales, onSaleClick, loading = false, selectedCurrency = 'ARS' }) => {
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewMode, setViewMode] = useState('detailed'); // 'detailed', 'compact', 'summary'
  const [selectedPeriod, setSelectedPeriod] = useState('all'); // 'all', 'today', 'week', 'month', 'quarter', 'year'


  // Calculate summary statistics filtered by selected currency
  const summaryStats = React.useMemo(() => {
    if (!sales || sales.length === 0) {
      return {
        totalSales: 0,
        totalRevenue: 0,
        totalCost: 0,
        totalProfit: 0,
        averageProfitMargin: 0,
        topPerformingSale: null,
        worstPerformingSale: null
      };
    }

    // Filter sales by selected currency
    const currencyFilteredSales = sales.filter(sale => 
      sale.saleCurrency === selectedCurrency
    );

    const stats = currencyFilteredSales.reduce((acc, sale) => {
      acc.totalSales += 1;
      acc.totalRevenue += sale.totalSalePrice || 0;
      acc.totalCost += sale.totalCost || 0;
      acc.totalProfit += sale.profit || 0;
      return acc;
    }, { totalSales: 0, totalRevenue: 0, totalCost: 0, totalProfit: 0 });

    stats.averageProfitMargin = stats.totalRevenue > 0 ? (stats.totalProfit / stats.totalRevenue) * 100 : 0;
    
    // Find best and worst performing sales from currency-filtered sales
    const sortedByProfit = [...currencyFilteredSales].sort((a, b) => (b.profit || 0) - (a.profit || 0));
    stats.topPerformingSale = sortedByProfit[0];
    stats.worstPerformingSale = sortedByProfit[sortedByProfit.length - 1];

    return stats;
  }, [sales, selectedCurrency]);

  // Filter sales by period and currency
  const filteredSales = React.useMemo(() => {
    if (!sales) return [];
    
    let filtered = [...sales];
    
    // Filter by currency first
    filtered = filtered.filter(sale => sale.saleCurrency === selectedCurrency);
    
    // Filter by period
    if (selectedPeriod !== 'all') {
      const now = new Date();
      const filterDate = new Date();

      switch (selectedPeriod) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(sale => new Date(sale.createdAt) >= filterDate);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          filtered = filtered.filter(sale => new Date(sale.createdAt) >= filterDate);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          filtered = filtered.filter(sale => new Date(sale.createdAt) >= filterDate);
          break;
        case 'quarter':
          filterDate.setMonth(now.getMonth() - 3);
          filtered = filtered.filter(sale => new Date(sale.createdAt) >= filterDate);
          break;
        case 'year':
          filterDate.setFullYear(now.getFullYear() - 1);
          filtered = filtered.filter(sale => new Date(sale.createdAt) >= filterDate);
          break;
      }
    }
    
    return filtered;
  }, [sales, selectedPeriod, selectedCurrency]);

  // Sort sales
  const sortedSales = React.useMemo(() => {
    if (!filteredSales) return [];

    return [...filteredSales].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'totalSalePrice':
          aValue = a.totalSalePrice || 0;
          bValue = b.totalSalePrice || 0;
          break;
        case 'totalCost':
          aValue = a.totalCost || 0;
          bValue = b.totalCost || 0;
          break;
        case 'profit':
          aValue = a.profit || 0;
          bValue = b.profit || 0;
          break;
        case 'profitMargin':
          aValue = a.totalSalePrice > 0 ? (a.profit / a.totalSalePrice) * 100 : 0;
          bValue = b.totalSalePrice > 0 ? (b.profit / b.totalSalePrice) * 100 : 0;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        default:
          aValue = a[sortBy] || 0;
          bValue = b[sortBy] || 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [filteredSales, sortBy, sortOrder]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const getProfitMarginColor = (margin) => {
    if (margin >= 20) return 'text-green-400';
    if (margin >= 10) return 'text-yellow-400';
    if (margin >= 0) return 'text-orange-400';
    return 'text-red-400';
  };

  const getProfitColor = (profit) => {
    if (profit > 0) return 'text-green-400';
    if (profit === 0) return 'text-gray-400';
    return 'text-red-400';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-20 w-20 border-4 border-primary-200 border-t-primary-500"></div>
        <p className="text-dark-300 text-lg font-medium ml-4">Loading sales data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
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
              <p className="text-2xl font-semibold text-dark-100">{summaryStats.totalSales}</p>
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
              <p className="text-2xl font-semibold text-dark-100"><CurrencyDisplay>{formatCurrency(summaryStats.totalRevenue, selectedCurrency)}</CurrencyDisplay></p>
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
              <p className="text-2xl font-semibold text-dark-100"><CurrencyDisplay>{formatCurrency(summaryStats.totalCost, selectedCurrency)}</CurrencyDisplay></p>
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
              <p className={`text-2xl font-semibold ${getProfitColor(summaryStats.totalProfit)}`}>
                <CurrencyDisplay>{formatCurrency(summaryStats.totalProfit, selectedCurrency)}</CurrencyDisplay>
              </p>
              <p className="text-sm text-dark-400">
                {summaryStats.averageProfitMargin.toFixed(1)}% avg margin
              </p>
            </div>
          </div>
        </div>
      </div>

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
                <option value="detailed">Detailed</option>
                <option value="compact">Compact</option>
                <option value="summary">Summary</option>
              </select>
            </div>

          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm text-dark-300">
              Showing {sortedSales.length} sales
              {selectedPeriod !== 'all' && ` in ${selectedPeriod}`}
              {selectedCurrency !== 'ARS' && ` in ${selectedCurrency}`}
            </div>
            <button
              onClick={() => {
                setSelectedPeriod('all');
              }}
              className="px-3 py-1 text-xs bg-dark-600 hover:bg-dark-500 text-dark-200 rounded-md transition-colors"
              title="Reset period filter"
            >
              Clear Filter
            </button>
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10">
            <thead className="bg-dark-700/50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-semibold text-dark-300 uppercase tracking-wider cursor-pointer hover:bg-dark-600"
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center">
                    Date {getSortIcon('createdAt')}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-dark-300 uppercase tracking-wider">
                  Passenger
                </th>
                <th 
                  className="px-6 py-3 text-right text-xs font-semibold text-dark-300 uppercase tracking-wider cursor-pointer hover:bg-dark-600"
                  onClick={() => handleSort('totalSalePrice')}
                >
                  <div className="flex items-center justify-end">
                    Sale Price {getSortIcon('totalSalePrice')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-right text-xs font-semibold text-dark-300 uppercase tracking-wider cursor-pointer hover:bg-dark-600"
                  onClick={() => handleSort('totalCost')}
                >
                  <div className="flex items-center justify-end">
                    Cost {getSortIcon('totalCost')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-right text-xs font-semibold text-dark-300 uppercase tracking-wider cursor-pointer hover:bg-dark-600"
                  onClick={() => handleSort('profit')}
                >
                  <div className="flex items-center justify-end">
                    Profit {getSortIcon('profit')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-center text-xs font-semibold text-dark-300 uppercase tracking-wider cursor-pointer hover:bg-dark-600"
                  onClick={() => handleSort('profitMargin')}
                >
                  <div className="flex items-center justify-center">
                    Margin {getSortIcon('profitMargin')}
                  </div>
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-dark-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-dark-300 uppercase tracking-wider">
                  Actions
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-dark-300 uppercase tracking-wider">
                  Sale ID
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {sortedSales.map((sale) => {
                const profitMargin = sale.totalSalePrice > 0 ? (sale.profit / sale.totalSalePrice) * 100 : 0;
                
                return (
                  <tr 
                    key={sale.id || sale._id} 
                    className="hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => onSaleClick && onSaleClick(sale)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-100">
                      {new Date(sale.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-dark-100">
                        {sale.clientId?.name} {sale.clientId?.surname}
                      </div>
                      <div className="text-sm text-dark-400">
                        {sale.clientId?.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-dark-100">
                      <CurrencyDisplay>{formatCurrency(sale.totalSalePrice, selectedCurrency)}</CurrencyDisplay>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-dark-100">
                      <CurrencyDisplay>{formatCurrency(sale.totalCost, selectedCurrency)}</CurrencyDisplay>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className={`text-sm font-medium ${getProfitColor(sale.profit)}`}>
                        <CurrencyDisplay>{formatCurrency(sale.profit, selectedCurrency)}</CurrencyDisplay>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className={`text-sm font-medium ${getProfitMarginColor(profitMargin)}`}>
                        {profitMargin.toFixed(1)}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        sale.status === 'closed' 
                          ? 'bg-green-100 text-green-800' 
                          : sale.status === 'open'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSaleClick && onSaleClick(sale);
                        }}
                        className="text-primary-400 hover:text-primary-300 text-sm font-medium"
                      >
                        View Details
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-dark-100">
                      #{(sale.id || sale._id).toString().slice(-8)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {sortedSales.length === 0 && (
          <div className="text-center py-12">
            <div className="text-dark-400 text-lg">No sales found</div>
            <div className="text-dark-500 text-sm mt-2">
              {selectedPeriod !== 'all' ? 'Try selecting a different period' : 'Create your first sale to get started'}
            </div>
          </div>
        )}
      </div>

      {/* Performance Insights */}
      {summaryStats.topPerformingSale && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-dark-100 mb-4">Top Performing Sale</h3>
            <div className="space-y-2">
              <div className="text-sm text-dark-300">
                Sale #{summaryStats.topPerformingSale.id?.toString().slice(-8)}
              </div>
              <div className="text-sm text-dark-300">
                Passenger: {summaryStats.topPerformingSale.clientId?.name} {summaryStats.topPerformingSale.clientId?.surname}
              </div>
              <div className="text-sm font-medium text-green-400">
                Profit: <CurrencyDisplay>{formatCurrency(summaryStats.topPerformingSale.profit, selectedCurrency)}</CurrencyDisplay>
              </div>
              <div className="text-sm text-dark-300">
                Margin: {summaryStats.topPerformingSale.totalSalePrice > 0 ? 
                  ((summaryStats.topPerformingSale.profit / summaryStats.topPerformingSale.totalSalePrice) * 100).toFixed(1) : 0}%
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-dark-100 mb-4">Performance Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-dark-300">Average Sale Value:</span>
                <span className="text-dark-100 font-medium">
                  <CurrencyDisplay>{formatCurrency(summaryStats.totalRevenue / summaryStats.totalSales, selectedCurrency)}</CurrencyDisplay>
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-dark-300">Average Profit:</span>
                <span className="text-dark-100 font-medium">
                  <CurrencyDisplay>{formatCurrency(summaryStats.totalProfit / summaryStats.totalSales, selectedCurrency)}</CurrencyDisplay>
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-dark-300">Average Margin:</span>
                <span className="text-dark-100 font-medium">
                  {summaryStats.averageProfitMargin.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComprehensiveSalesOverview;