import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { formatCurrencyCompact, getCurrencySymbol } from '../utils/formatNumbers';
import { formatMethodName } from '../utils/paymentMethodUtils';

const PaymentReports = ({ filters, onFiltersChange }) => {
  const [clientPayments, setClientPayments] = useState(null);
  const [supplierPayments, setSupplierPayments] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('client');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('completed');

  const fetchClientPayments = async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.sellerId) params.append('sellerId', filters.sellerId);
      if (filters.currency) params.append('currency', filters.currency);
      if (paymentMethodFilter) params.append('paymentMethod', paymentMethodFilter);
      if (statusFilter) params.append('status', statusFilter);

      const response = await api.get(`/api/reports/payments/client?${params}`);

      if (response.data.success) {
        setClientPayments(response.data.data);
      } else {
        setError('Failed to fetch client payments');
      }
    } catch (error) {
      console.error('Failed to fetch client payments:', error);
      setError('Failed to fetch client payments');
    } finally {
      setLoading(false);
    }
  };

  const fetchSupplierPayments = async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.sellerId) params.append('sellerId', filters.sellerId);
      if (filters.currency) params.append('currency', filters.currency);
      if (paymentMethodFilter) params.append('paymentMethod', paymentMethodFilter);
      if (statusFilter) params.append('status', statusFilter);

      const response = await api.get(`/api/reports/payments/supplier?${params}`);

      if (response.data.success) {
        setSupplierPayments(response.data.data);
      } else {
        setError('Failed to fetch supplier payments');
      }
    } catch (error) {
      console.error('Failed to fetch supplier payments:', error);
      setError('Failed to fetch supplier payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'client') {
      fetchClientPayments();
    } else {
      fetchSupplierPayments();
    }
  }, [filters, paymentMethodFilter, statusFilter, activeTab]);

  const paymentMethods = [
    { value: '', label: 'All Payment Methods' },
    { value: 'cash', label: 'Cash' },
    { value: 'transfer_to_mare_nostrum', label: 'Transfer to Mare Nostrum' },
    { value: 'transfer_to_operator', label: 'Transfer to Operator' },
    { value: 'deposit_to_hivago', label: 'Deposit to Hivago' },
    { value: 'deposit_to_operator', label: 'Deposit to Operator' },
    { value: 'deposit_to_bsp', label: 'Deposit to BSP' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'crypto', label: 'Cryptocurrency' },
    { value: 'credit_card_to_operator_airline', label: 'Credit Card to Operator/Airline' },
    { value: 'credit_card_to_mare_nostrum', label: 'Credit Card to Mare Nostrum' },
    { value: 'transfer_from_mare_nostrum', label: 'Transfer from Mare Nostrum' },
    { value: 'transfer_from_passengers', label: 'Transfer from Passengers' },
    { value: 'deposit', label: 'Deposit' },
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'wire_transfer', label: 'Wire Transfer' }
  ];

  const statusOptions = [
    { value: 'completed', label: 'Completed' },
    { value: 'pending', label: 'Pending' },
    { value: 'failed', label: 'Failed' },
    { value: 'refunded', label: 'Refunded' },
    { value: 'cancelled', label: 'Cancelled' }
  ];


  const renderPaymentTable = (payments, type) => {
    if (!payments) return null;

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        {payments.summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-dark-700 rounded-lg p-4">
              <h4 className="text-sm font-medium text-dark-300 mb-2">Total Payments</h4>
              <p className="text-2xl font-bold text-dark-100">{payments.summary.totalPayments}</p>
            </div>
            <div className="bg-dark-700 rounded-lg p-4">
              <h4 className="text-sm font-medium text-dark-300 mb-2">Total Amount</h4>
              <p className="text-2xl font-bold text-primary-400">
                {formatCurrencyCompact(payments.summary.totalAmount, 'USD')}
              </p>
            </div>
            <div className="bg-dark-700 rounded-lg p-4">
              <h4 className="text-sm font-medium text-dark-300 mb-2">Average Amount</h4>
              <p className="text-2xl font-bold text-dark-100">
                {formatCurrencyCompact(payments.summary.averageAmount, 'USD')}
              </p>
            </div>
            <div className="bg-dark-700 rounded-lg p-4">
              <h4 className="text-sm font-medium text-dark-300 mb-2">Currencies</h4>
              <p className="text-2xl font-bold text-dark-100">
                {payments.summary.currencies?.length || 0}
              </p>
            </div>
          </div>
        )}

        {/* Payment Method Breakdown */}
        {payments.methodBreakdown && payments.methodBreakdown.length > 0 && (
          <div className="bg-dark-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-dark-100 mb-4">Payment Methods Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {payments.methodBreakdown.map((method, index) => (
                <div key={index} className="bg-dark-600 rounded-lg p-4">
                  <h4 className="font-medium text-dark-100 mb-2">
                    {formatPaymentMethod(method._id)}
                  </h4>
                  <div className="space-y-1 text-sm">
                    <p className="text-dark-300">
                      <span className="font-medium">Count:</span> {method.count}
                    </p>
                    <p className="text-dark-300">
                      <span className="font-medium">Total:</span> {formatCurrencyCompact(method.totalAmount, 'USD')}
                    </p>
                    <p className="text-dark-300">
                      <span className="font-medium">Average:</span> {formatCurrencyCompact(method.averageAmount, 'USD')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payments Table */}
        <div className="bg-dark-700 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10">
            <h3 className="text-lg font-medium text-dark-100">
              {type === 'client' ? 'Client Payments' : 'Supplier Payments'}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-dark-600/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                    Status
                  </th>
                  {type === 'client' ? (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                        Sale ID
                      </th>
                    </>
                  ) : (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                        Provider
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                        Sale ID
                      </th>
                    </>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                    Seller
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {payments.payments?.map((payment, index) => (
                  <tr key={index} className="hover:bg-white/5 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-300">
                      {new Date(payment.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-dark-100">
                      {formatCurrencyCompact(payment.amount, payment.currency)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-300">
                      {formatMethodName(payment.method)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                        payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        payment.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                    {type === 'client' ? (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-300">
                          {payment.client?.name} {payment.client?.surname}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-300">
                          {payment.sale?.id}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-300">
                          {payment.providers?.[0]?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-300">
                          {payment.sale?.id}
                        </td>
                      </>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-300">
                      {payment.seller?.username}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
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

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-dark-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-dark-100 mb-4">Payment Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">
              Payment Type
            </label>
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="input-field"
            >
              <option value="client">Client Payments</option>
              <option value="supplier">Supplier Payments</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">
              Payment Method
            </label>
            <select
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
              className="input-field"
            >
              {paymentMethods.map(method => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field"
            >
              {statusOptions.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setPaymentMethodFilter('');
                setStatusFilter('completed');
              }}
              className="btn-secondary w-full"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Payment Reports */}
      {activeTab === 'client' ? renderPaymentTable(clientPayments, 'client') : renderPaymentTable(supplierPayments, 'supplier')}
    </div>
  );
};

export default PaymentReports;