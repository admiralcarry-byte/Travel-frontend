import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PaymentForm from './PaymentForm';

const PaymentsTable = ({ saleId, onPaymentAdded }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showClientForm, setShowClientForm] = useState(false);
  const [showProviderForm, setShowProviderForm] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, [saleId]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/payments?saleId=${saleId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setPayments(response.data.data.payments);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentAdded = (newPayment) => {
    setPayments(prev => [newPayment, ...prev]);
    setShowClientForm(false);
    setShowProviderForm(false);
    onPaymentAdded && onPaymentAdded();
  };

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount);
  };

  const getPaymentTypeColor = (type) => {
    return type === 'client' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-blue-100 text-blue-800';
  };

  const getReceiptIcon = (filename) => {
    if (!filename) return null;
    const extension = filename.split('.').pop().toLowerCase();
    if (['pdf'].includes(extension)) return '📄';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) return '🖼️';
    return '📎';
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Payment Actions */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Payments</h3>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowClientForm(true)}
            className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
          >
            + Client Payment
          </button>
          <button
            onClick={() => setShowProviderForm(true)}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
          >
            + Provider Payment
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Payment Forms */}
      {showClientForm && (
        <div className="border border-gray-200 rounded-lg p-4">
          <PaymentForm
            saleId={saleId}
            paymentType="client"
            onPaymentAdded={handlePaymentAdded}
            onCancel={() => setShowClientForm(false)}
          />
        </div>
      )}

      {showProviderForm && (
        <div className="border border-gray-200 rounded-lg p-4">
          <PaymentForm
            saleId={saleId}
            paymentType="provider"
            onPaymentAdded={handlePaymentAdded}
            onCancel={() => setShowProviderForm(false)}
          />
        </div>
      )}

      {/* Payments Table */}
      {payments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No payments recorded yet</p>
          <p className="text-sm">Add client or provider payments to track balances</p>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Receipt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPaymentTypeColor(payment.type)}`}>
                      {payment.type.charAt(0).toUpperCase() + payment.type.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {payment.method}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(payment.amount, payment.currency)}
                    </div>
                    {payment.exchangeRate && payment.baseCurrency && (
                      <div className="text-xs text-gray-500">
                        ≈ {formatCurrency(payment.amount * payment.exchangeRate, payment.baseCurrency)}
                        <span className="ml-1">(Rate: {payment.exchangeRate.toFixed(4)})</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(payment.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {payment.receiptImage ? (
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getReceiptIcon(payment.receiptImage)}</span>
                        <a
                          href={`http://localhost:5000${payment.receiptImage}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-800"
                        >
                          View
                        </a>
                      </div>
                    ) : (
                      <span className="text-gray-400">No receipt</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {payment.notes || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PaymentsTable;