import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { formatCurrencyCompact, getCurrencySymbol } from '../utils/formatNumbers';

const CurrencyReport = ({ filters, onFiltersChange }) => {
  const [currencyData, setCurrencyData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('');

  const fetchCurrencyData = async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.sellerId) params.append('sellerId', filters.sellerId);

      const response = await api.get(`/api/reports/currency-summary?${params}`);

      if (response.data.success) {
        setCurrencyData(response.data.data);
      } else {
        setError('Failed to fetch currency data');
      }
    } catch (error) {
      console.error('Failed to fetch currency data:', error);
      setError('Failed to fetch currency data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrencyData();
  }, [filters]);

  const handleCurrencyFilter = (currency) => {
    setSelectedCurrency(currency);
    if (onFiltersChange) {
      onFiltersChange({ ...filters, currency: currency || null });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-error-500/10 border border-error-500/20 rounded-lg p-4">
        <p className="text-error-400">{error}</p>
      </div>
    );
  }

  if (!currencyData) {
    return null;
  }

  const { currencyBreakdown, paymentBreakdown, totals } = currencyData;

  return (
    <div className="space-y-6">
      {/* Currency Filter */}
      <div className="bg-dark-700 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-dark-100 mb-4">Currency Filter</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleCurrencyFilter('')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              !selectedCurrency
                ? 'bg-primary-600 text-white'
                : 'bg-dark-600 text-dark-300 hover:bg-dark-500'
            }`}
          >
            All Currencies
          </button>
          {currencyBreakdown.map((currency) => (
            <button
              key={currency._id}
              onClick={() => handleCurrencyFilter(currency._id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedCurrency === currency._id
                  ? 'bg-primary-600 text-white'
                  : 'bg-dark-600 text-dark-300 hover:bg-dark-500'
              }`}
            >
              {currency._id} ({currency.saleCount} sales)
            </button>
          ))}
        </div>
      </div>

      {/* Currency Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Currency */}
        <div className="bg-dark-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-dark-100 mb-4">Sales by Currency</h3>
          <div className="space-y-4">
            {currencyBreakdown.map((currency) => (
              <div key={currency._id} className="border border-white/10 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-dark-100">{currency._id}</h4>
                  <span className="text-sm text-dark-400">{currency.saleCount} sales</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-dark-400">Total Sales</p>
                    <p className="font-semibold text-dark-100">
                      {formatCurrencyCompact(currency.totalSales, currency._id)}
                    </p>
                  </div>
                  <div>
                    <p className="text-dark-400">Total Profit</p>
                    <p className="font-semibold text-green-400">
                      {formatCurrencyCompact(currency.totalProfit, currency._id)}
                    </p>
                  </div>
                  <div>
                    <p className="text-dark-400">Total Cost</p>
                    <p className="font-semibold text-dark-100">
                      {formatCurrencyCompact(currency.totalCost, currency._id)}
                    </p>
                  </div>
                  <div>
                    <p className="text-dark-400">Avg Sale</p>
                    <p className="font-semibold text-dark-100">
                      {formatCurrencyCompact(currency.averageSalePrice, currency._id)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Balances by Currency */}
        <div className="bg-dark-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-dark-100 mb-4">Balances by Currency</h3>
          <div className="space-y-4">
            {currencyBreakdown.map((currency) => (
              <div key={currency._id} className="border border-white/10 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-dark-100">{currency._id}</h4>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-dark-400">Client Balance</p>
                    <p className={`font-semibold ${
                      currency.totalClientBalance >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {formatCurrencyCompact(currency.totalClientBalance, currency._id)}
                    </p>
                  </div>
                  <div>
                    <p className="text-dark-400">Provider Balance</p>
                    <p className={`font-semibold ${
                      currency.totalProviderBalance >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {formatCurrencyCompact(currency.totalProviderBalance, currency._id)}
                    </p>
                  </div>
                  <div>
                    <p className="text-dark-400">Client Payments</p>
                    <p className="font-semibold text-dark-100">
                      {formatCurrencyCompact(currency.totalClientPayments, currency._id)}
                    </p>
                  </div>
                  <div>
                    <p className="text-dark-400">Provider Payments</p>
                    <p className="font-semibold text-dark-100">
                      {formatCurrencyCompact(currency.totalProviderPayments, currency._id)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Breakdown */}
      {paymentBreakdown && paymentBreakdown.length > 0 && (
        <div className="bg-dark-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-dark-100 mb-4">Payments by Currency</h3>
          <div className="space-y-4">
            {paymentBreakdown.map((payment) => (
              <div key={payment._id} className="border border-white/10 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-dark-100">{payment._id}</h4>
                  <span className="text-sm text-dark-400">{payment.paymentCount} payments</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-dark-400">Total Payments</p>
                    <p className="font-semibold text-dark-100">
                      {formatCurrencyCompact(payment.totalPayments, payment._id)}
                    </p>
                  </div>
                  <div>
                    <p className="text-dark-400">Client Payments</p>
                    <p className="font-semibold text-dark-100">
                      {formatCurrencyCompact(payment.clientPayments, payment._id)}
                    </p>
                  </div>
                  <div>
                    <p className="text-dark-400">Provider Payments</p>
                    <p className="font-semibold text-dark-100">
                      {formatCurrencyCompact(payment.providerPayments, payment._id)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Totals Summary */}
      <div className="bg-primary-500/10 border border-primary-500/20 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-primary-400 mb-4">Total Summary (All Currencies)</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-primary-300">Total Sales</p>
            <p className="font-semibold text-primary-100">
              {formatCurrencyCompact(totals.totalSales, 'USD')}
            </p>
          </div>
          <div>
            <p className="text-primary-300">Total Profit</p>
            <p className="font-semibold text-green-400">
              {formatCurrencyCompact(totals.totalProfit, 'USD')}
            </p>
          </div>
          <div>
            <p className="text-primary-300">Total Sales Count</p>
            <p className="font-semibold text-primary-100">
              {totals.saleCount.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-primary-300">Total Client Balance</p>
            <p className={`font-semibold ${
              totals.totalClientBalance >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {formatCurrencyCompact(totals.totalClientBalance, 'USD')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrencyReport;