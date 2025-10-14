import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';

const VendorDashboard = () => {
  const { providerId } = useParams();
  const navigate = useNavigate();
  const [provider, setProvider] = useState(null);
  const [vendorPayments, setVendorPayments] = useState([]);
  const [providerTotals, setProviderTotals] = useState(null);
  const [recentPayments, setRecentPayments] = useState([]);
  const [overduePayments, setOverduePayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    if (providerId) {
      fetchProviderData();
    }
  }, [providerId, dateRange]);

  const fetchProviderData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch provider details
      const providerResponse = await api.get(`/api/providers/${providerId}`);
      if (providerResponse.data.success) {
        setProvider(providerResponse.data.data.provider);
      }

      // Fetch sales data for this provider (same data source as Sale Summary)
      const params = new URLSearchParams();
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);
      params.append('providerId', providerId);

      const salesResponse = await api.get(`/api/sales?${params}`);
      if (salesResponse.data.success) {
        const sales = salesResponse.data.data.sales || [];
        
        // Calculate totals from sales data (same logic as Sale Summary)
        const providerTotals = {
          totalPayments: 0,
          totalCommissions: 0,
          totalProfit: 0,
          totalRevenue: 0,
          totalCost: 0,
          overduePayments: 0,
          overdueCount: 0,
          paymentCount: sales.length
        };

        const recentPayments = [];
        const paymentHistory = [];

        sales.forEach(sale => {
          // Calculate provider-specific totals from this sale
          sale.services.forEach(service => {
            if (service.providerId && service.providerId._id === providerId) {
              const serviceRevenue = (service.priceClient || 0) * (service.quantity || 1);
              const serviceCost = (service.costProvider || 0) * (service.quantity || 1);
              const serviceCommission = 0; // Commission disabled

              // For now, use the service cost as the provider cost
              // The actual payment data will be fetched separately if needed
              const effectiveProviderCost = serviceCost;

              providerTotals.totalRevenue += serviceRevenue;
              providerTotals.totalCost += effectiveProviderCost;
              providerTotals.totalCommissions += serviceCommission;
              providerTotals.totalPayments += effectiveProviderCost; // Use actual payment amount
              providerTotals.totalProfit += serviceRevenue - effectiveProviderCost;

              // Add to payment history
              paymentHistory.push({
                _id: sale._id,
                saleId: { id: sale.saleNumber || sale._id },
                serviceDetails: {
                  serviceTitle: service.serviceId?.destino || service.serviceId?.title || 'Unknown Service',
                  quantity: service.quantity || 1
                },
                profit: {
                  grossRevenue: serviceRevenue,
                  providerCost: effectiveProviderCost, // Use actual payment amount
                  netProfit: serviceRevenue - effectiveProviderCost,
                  currency: service.currency || 'USD'
                },
                commission: {
                  amount: 0, // Commission disabled
                  rate: 0, // Commission disabled
                  currency: service.currency || 'USD'
                },
                paymentDetails: {
                  status: 'pending' // Default status
                },
                dueDate: new Date(sale.createdAt.getTime() + (30 * 24 * 60 * 60 * 1000)),
                isOverdue: new Date() > new Date(sale.createdAt.getTime() + (30 * 24 * 60 * 60 * 1000)),
                daysOverdue: Math.max(0, Math.floor((new Date() - sale.createdAt) / (1000 * 60 * 60 * 24)) - 30)
              });
            }
          });

          // Add client payments to recent payments (simplified)
          if (sale.paymentsClient && sale.paymentsClient.length > 0) {
            sale.paymentsClient.forEach(payment => {
              recentPayments.push({
                _id: payment._id,
                saleId: { id: sale.saleNumber || sale._id },
                serviceDetails: {
                  serviceTitle: sale.services[0]?.serviceId?.destino || 'Unknown Service'
                },
                paymentDetails: {
                  amount: 0, // Will be populated when payment data is available
                  currency: 'USD',
                  method: 'unknown',
                  date: new Date(),
                  status: 'pending'
                }
              });
            });
          }
        });

        // Calculate overdue payments
        paymentHistory.forEach(payment => {
          if (payment.isOverdue) {
            providerTotals.overduePayments += payment.profit.providerCost;
            providerTotals.overdueCount += 1;
          }
        });

        // Sort recent payments by date
        recentPayments.sort((a, b) => new Date(b.paymentDetails.date) - new Date(a.paymentDetails.date));

        setProviderTotals(providerTotals);
        setRecentPayments(recentPayments.slice(0, 5));
        setOverduePayments(paymentHistory.filter(p => p.isOverdue));
        setVendorPayments(paymentHistory);
      }

    } catch (error) {
      setError(error.response?.data?.message || 'Failed to fetch vendor data');
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatCurrency = (amount, currency = 'USD') => {
    // Handle undefined, null, or NaN values
    if (amount === undefined || amount === null || isNaN(amount)) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
      }).format(0);
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-400 border border-green-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
      case 'failed':
        return 'bg-red-500/20 text-red-400 border border-red-500/30';
      case 'overdue':
        return 'bg-red-500/20 text-red-400 border border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
    }
  };

  const getPaymentMethodColor = (method) => {
    const colors = {
      'transfer_from_mare_nostrum': 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
      'cash': 'bg-green-500/20 text-green-400 border border-green-500/30',
      'credit_card': 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
      'cheque': 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
      'deposit': 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
    };
    return colors[method] || 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">{error}</div>
          <button
            onClick={() => navigate('/providers')}
            className="btn-secondary"
          >
            Back to Providers
          </button>
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 text-xl mb-4">Provider not found</div>
          <button
            onClick={() => navigate('/providers')}
            className="btn-secondary"
          >
            Back to Providers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/providers')}
            className="flex items-center text-gray-300 hover:text-white mb-4 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Providers
          </button>
          <h1 className="text-3xl font-bold text-white">{provider.name} Dashboard</h1>
          <p className="text-gray-300 mt-2">Vendor payment tracking and analytics</p>
        </div>

        {/* Date Range Filter */}
        <div className="card-glass p-6 mb-8">
          <h3 className="text-lg font-medium text-white mb-4">Filter by Date Range</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-300 mb-2">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={dateRange.startDate}
                onChange={handleDateRangeChange}
                className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-dark-700 text-white"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-300 mb-2">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={dateRange.endDate}
                onChange={handleDateRangeChange}
                className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-dark-700 text-white"
              />
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        {providerTotals && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card-glass p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-500/20 text-blue-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-300">Total Payments</p>
                  <p className="text-2xl font-semibold text-white">
                    {formatCurrency(providerTotals.totalPayments)}
                  </p>
                </div>
              </div>
            </div>

            <div className="card-glass p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-500/20 text-green-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-300">Total Commissions</p>
                  <p className="text-2xl font-semibold text-white">
                    {formatCurrency(providerTotals.totalCommissions)}
                  </p>
                </div>
              </div>
            </div>

            <div className="card-glass p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-500/20 text-purple-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-300">Net Profit</p>
                  <p className="text-2xl font-semibold text-white">
                    {formatCurrency(providerTotals.totalProfit)}
                  </p>
                </div>
              </div>
            </div>

            <div className="card-glass p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-red-500/20 text-red-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-300">Overdue Payments</p>
                  <p className="text-2xl font-semibold text-white">
                    {formatCurrency(providerTotals.overduePayments)}
                  </p>
                  <p className="text-sm text-red-400">
                    {providerTotals.overdueCount} payments
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Overdue Payments Alert */}
        {overduePayments && overduePayments.length > 0 && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 mb-8">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-red-500/20 text-red-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-red-400">Overdue Payments</h3>
                <p className="text-red-300">
                  You have {overduePayments.length} overdue payment(s) totaling {formatCurrency(providerTotals.overduePayments)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Recent Payments */}
        <div className="card-glass mb-8">
          <div className="px-6 py-4 border-b border-white/10">
            <h3 className="text-lg font-medium text-white">Recent Payments</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-dark-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Sale ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {recentPayments && recentPayments.length > 0 ? (
                  recentPayments.map((payment) => (
                    <tr key={payment._id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                        {payment.saleId.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {payment.serviceDetails.serviceTitle}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {formatCurrency(payment.paymentDetails.amount, payment.paymentDetails.currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentMethodColor(payment.paymentDetails.method)}`}>
                          {payment.paymentDetails.method.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {formatDate(payment.paymentDetails.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.paymentDetails.status)}`}>
                          {payment.paymentDetails.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-400">
                      Currently unavailable
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed Payment History */}
        <div className="card-glass">
          <div className="px-6 py-4 border-b border-white/10">
            <h3 className="text-lg font-medium text-white">Payment History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-dark-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Sale ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Commission
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Profit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Payment Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Due Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {vendorPayments && vendorPayments.length > 0 ? (
                  vendorPayments.map((payment) => (
                    <tr key={payment._id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                        {payment.saleId.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        <div>
                          <div className="font-medium">{payment.serviceDetails.serviceTitle}</div>
                          <div className="text-gray-300">Qty: {payment.serviceDetails.quantity}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {formatCurrency(payment.profit.grossRevenue, payment.profit.currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {formatCurrency(payment.profit.providerCost, payment.profit.currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        <div>
                          <div>{formatCurrency(payment.commission.amount, payment.commission.currency)}</div>
                          <div className="text-gray-300">(0%)</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        <span className={payment.profit.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}>
                          {formatCurrency(payment.profit.netProfit, payment.profit.currency)}
                        </span>
                        {/* Debug info - remove in production */}
                        {console.log(`Frontend profit debug:`, {
                          saleId: payment._id,
                          netProfit: payment.profit.netProfit,
                          grossRevenue: payment.profit.grossRevenue,
                          providerCost: payment.profit.providerCost,
                          currency: payment.profit.currency
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.paymentDetails.status)}`}>
                          {payment.paymentDetails.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        <div>
                          <div>{formatDate(payment.dueDate)}</div>
                          {payment.isOverdue && (
                            <div className="text-red-400 text-xs">
                              {payment.daysOverdue} days overdue
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="px-6 py-8 text-center text-gray-400">
                      Currently unavailable
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;