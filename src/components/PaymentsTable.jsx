import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import PaymentForm from './PaymentForm';
import Modal from './Modal';
import ProvisionalReceipt from './ProvisionalReceipt';
import PaymentEditModal from './PaymentEditModal';
import { formatMethodName, formatMethodNameShort } from '../utils/paymentMethodUtils';

const PaymentsTable = ({ saleId, onPaymentAdded }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showClientForm, setShowClientForm] = useState(false);
  const [showProviderForm, setShowProviderForm] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState(null);
  const [completedReceipts, setCompletedReceipts] = useState(new Set());
  const [respondedReceipts, setRespondedReceipts] = useState(new Set());
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [saving, setSaving] = useState(false);
  const [columnWidths, setColumnWidths] = useState({
    type: 'w-28',
    method: 'w-24', 
    amount: 'w-32',
    date: 'w-24',
    receipt: 'w-32',
    notes: 'w-32'
  });

  useEffect(() => {
    fetchPayments();
  }, [saleId]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      
      // Don't fetch if saleId is undefined or invalid
      if (!saleId || saleId === 'undefined') {
        setPayments([]);
        setLoading(false);
        return;
      }
      
      const response = await api.get(`/api/payments?saleId=${saleId}`);

      if (response.data.success) {
        setPayments(response.data.data.payments);
        
        // Check for responded receipts for each payment
        const respondedSet = new Set();
        for (const payment of response.data.data.payments) {
          const isResponded = await checkReceiptStatus(payment._id);
          if (isResponded) {
            respondedSet.add(payment._id);
          }
        }
        setRespondedReceipts(respondedSet);
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

  // Handle double-click to open edit modal
  const handleRowDoubleClick = (payment) => {
    setEditingPayment(payment);
    setShowEditModal(true);
  };

  // Handle saving edited payment
  const handleSavePayment = async (updatedPaymentData) => {
    if (!editingPayment) return;

    setSaving(true);
    try {
      const response = await api.put(`/api/payments/${editingPayment._id}`, updatedPaymentData);
      
      if (response.data.success) {
        // Update the payments list with the updated payment
        setPayments(prev => prev.map(payment => 
          payment._id === editingPayment._id 
            ? { ...payment, ...updatedPaymentData }
            : payment
        ));
        
        // Close modal
        setShowEditModal(false);
        setEditingPayment(null);
        
        // Notify parent component to refresh sale data
        onPaymentAdded && onPaymentAdded();
      }
    } catch (error) {
      console.error('Error updating payment:', error);
      setError(error.response?.data?.message || 'Failed to update payment');
    } finally {
      setSaving(false);
    }
  };

  // Handle canceling edit modal
  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingPayment(null);
  };

  const generateReceipt = async (paymentId) => {
    try {
      setError(''); // Clear any previous errors
      const response = await api.post('/api/receipts/generate', {
        paymentId,
        saleId
      });

      if (response.data.success) {
        setSelectedPaymentId(paymentId);
        setShowReceipt(true);
        
        // Refresh payments data to update the UI with the new receipt
        await fetchPayments();
      }
    } catch (error) {
      console.error('Receipt generation error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to generate receipt';
      setError(errorMessage);
      
      // Show error for 5 seconds then clear
      setTimeout(() => {
        setError('');
      }, 5000);
    }
  };

  const viewReceipt = async (paymentId) => {
    try {
      setError(''); // Clear any previous errors
      
      // First, try to find an existing receipt for this payment
      const existingReceiptsResponse = await api.get(`/api/receipts?paymentId=${paymentId}`);
      
      if (existingReceiptsResponse.data.success && existingReceiptsResponse.data.data.length > 0) {
        // Load the existing receipt
        setSelectedPaymentId(paymentId);
        setShowReceipt(true);
      } else {
        // No existing receipt found, generate a new one
        await generateReceipt(paymentId);
      }
    } catch (error) {
      console.error('View receipt error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load receipt';
      setError(errorMessage);
      
      // Show error for 5 seconds then clear
      setTimeout(() => {
        setError('');
      }, 5000);
    }
  };

  const checkReceiptStatus = async (paymentId) => {
    try {
      const response = await api.get(`/api/receipts?paymentId=${paymentId}`);
      if (response.data.success && response.data.data.length > 0) {
        const receipt = response.data.data[0];
        return receipt.whatsappStatus?.status === 'responded';
      }
      return false;
    } catch (error) {
      console.error('Error checking receipt status:', error);
      return false;
    }
  };

  const handleReceiptClose = () => {
    setShowReceipt(false);
    setSelectedPaymentId(null);
  };

  const handleReceiptCompleted = (paymentId) => {
    // Mark this payment as having a completed receipt
    setCompletedReceipts(prev => new Set([...prev, paymentId]));
    
    // Refresh the payments data to update the UI
    if (onPaymentAdded) {
      onPaymentAdded();
    }
  };

  const handleReceiptResponded = (paymentId) => {
    // Mark this payment as having a responded receipt
    setRespondedReceipts(prev => new Set([...prev, paymentId]));
  };

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount);
  };

  const getPaymentTypeColor = (type) => {
    return type === 'client' 
      ? 'bg-success-500/20 text-success-400 border border-success-500/30' 
      : 'bg-primary-500/20 text-primary-400 border border-primary-500/30';
  };

  const getReceiptIcon = (filename) => {
    if (!filename) return null;
    const extension = filename.split('.').pop().toLowerCase();
    if (['pdf'].includes(extension)) return '📄';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) return '🖼️';
    return '📎';
  };

  const handleColumnResize = (column) => {
    const widthMap = {
      type: ['w-20', 'w-24', 'w-28', 'w-32'],
      method: ['w-20', 'w-24', 'w-28', 'w-32'],
      amount: ['w-24', 'w-32', 'w-40', 'w-48'],
      date: ['w-20', 'w-24', 'w-28', 'w-32'],
      receipt: ['w-16', 'w-20', 'w-24', 'w-28'],
      notes: ['w-24', 'w-32', 'w-40', 'w-48']
    };

    const currentWidth = columnWidths[column];
    const availableWidths = widthMap[column];
    const currentIndex = availableWidths.indexOf(currentWidth);
    const nextIndex = (currentIndex + 1) % availableWidths.length;
    
    setColumnWidths(prev => ({
      ...prev,
      [column]: availableWidths[nextIndex]
    }));
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
        <h3 className="text-lg font-medium text-white">Payments</h3>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowClientForm(true)}
            className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
          >
            + Passenger Payment
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

      {/* Payment Modals */}
      <Modal
        isOpen={showClientForm}
        onClose={() => setShowClientForm(false)}
        title="Record Passenger Payment"
        size="lg"
      >
        <PaymentForm
          saleId={saleId}
          paymentType="client"
          onPaymentAdded={handlePaymentAdded}
          onCancel={() => setShowClientForm(false)}
        />
      </Modal>

      <Modal
        isOpen={showProviderForm}
        onClose={() => setShowProviderForm(false)}
        title="Record Provider Payment"
        size="lg"
      >
        <PaymentForm
          saleId={saleId}
          paymentType="provider"
          onPaymentAdded={handlePaymentAdded}
          onCancel={() => setShowProviderForm(false)}
        />
      </Modal>

      {/* Payment Edit Modal */}
      <PaymentEditModal
        payment={editingPayment}
        isOpen={showEditModal}
        onClose={handleCancelEdit}
        onSave={handleSavePayment}
        saving={saving}
      />

      {/* Payments Table */}
      {payments.length === 0 ? (
        <div className="text-center py-8 text-dark-400">
          <p>No payments recorded yet</p>
          <p className="text-sm">Add passenger or provider payments to track balances</p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="text-xs text-dark-400 bg-dark-800/50 px-3 py-2 rounded-md">
            💡 <strong>Tips:</strong> Double-click any column header to resize it. Double-click any payment row to edit it. Text that doesn't fit will show "..." - hover to see the full content.
          </div>
          <div className="overflow-x-auto">
          <table className="w-full divide-y divide-white/10 table-fixed">
            <thead className="bg-dark-700">
              <tr>
                <th 
                  className={`${columnWidths.type} px-3 py-3 text-left text-xs font-semibold text-dark-300 uppercase tracking-wider cursor-pointer hover:bg-dark-600 transition-colors`}
                  onDoubleClick={() => handleColumnResize('type')}
                  title="Double-click to resize column"
                >
                  Type
                </th>
                <th 
                  className={`${columnWidths.method} px-3 py-3 text-left text-xs font-semibold text-dark-300 uppercase tracking-wider cursor-pointer hover:bg-dark-600 transition-colors`}
                  onDoubleClick={() => handleColumnResize('method')}
                  title="Double-click to resize column"
                >
                  Method
                </th>
                <th 
                  className={`${columnWidths.amount} px-3 py-3 text-left text-xs font-semibold text-dark-300 uppercase tracking-wider cursor-pointer hover:bg-dark-600 transition-colors`}
                  onDoubleClick={() => handleColumnResize('amount')}
                  title="Double-click to resize column"
                >
                  Amount
                </th>
                <th 
                  className={`${columnWidths.date} px-3 py-3 text-left text-xs font-semibold text-dark-300 uppercase tracking-wider cursor-pointer hover:bg-dark-600 transition-colors`}
                  onDoubleClick={() => handleColumnResize('date')}
                  title="Double-click to resize column"
                >
                  Date
                </th>
                <th 
                  className={`${columnWidths.receipt} px-3 py-3 text-center text-xs font-semibold text-dark-300 uppercase tracking-wider cursor-pointer hover:bg-dark-600 transition-colors`}
                  onDoubleClick={() => handleColumnResize('receipt')}
                  title="Double-click to resize column"
                >
                  Receipt
                </th>
                <th 
                  className={`${columnWidths.notes} px-3 py-3 text-left text-xs font-semibold text-dark-300 uppercase tracking-wider cursor-pointer hover:bg-dark-600 transition-colors`}
                  onDoubleClick={() => handleColumnResize('notes')}
                  title="Double-click to resize column"
                >
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {payments.map((payment, index) => (
                <tr 
                  key={payment.id || payment._id || `payment-${index}`} 
                  className="hover:bg-white/5 transition-colors cursor-pointer"
                  onDoubleClick={() => handleRowDoubleClick(payment)}
                  title="Double-click to edit payment"
                >
                  <td className="px-3 py-4">
                    <div className="truncate">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPaymentTypeColor(payment.type)}`}>
                        {payment.type === 'client' ? 'Passenger' : payment.type.charAt(0).toUpperCase() + payment.type.slice(1)}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <div className="truncate text-sm text-dark-100" title={formatMethodName(payment.method)}>
                      {formatMethodNameShort(payment.method)}
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <div className="truncate">
                      <div className="text-sm font-medium text-dark-100 truncate" title={formatCurrency(payment.amount, payment.currency)}>
                        {formatCurrency(payment.amount, payment.currency)}
                      </div>
                      {payment.originalAmount && payment.originalCurrency && (
                        <div className="text-xs text-dark-400 truncate" title={`Original: ${formatCurrency(payment.originalAmount, payment.originalCurrency)} (Rate: ${payment.exchangeRate?.toFixed(4) || 'N/A'})`}>
                          Original: {formatCurrency(payment.originalAmount, payment.originalCurrency)}
                          <span className="ml-1">(Rate: {payment.exchangeRate?.toFixed(4) || 'N/A'})</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <div className="truncate text-sm text-dark-300" title={new Date(payment.date).toLocaleDateString()}>
                      {new Date(payment.date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <div className="truncate text-sm text-dark-300">
                      {payment.receiptImage || completedReceipts.has(payment._id) || respondedReceipts.has(payment._id) ? (
                        <div className="flex items-center justify-center space-x-2">
                          <span className="text-lg">{getReceiptIcon(payment.receiptImage)}</span>
                          <button
                            onClick={() => viewReceipt(payment._id)}
                            className="text-primary-400 hover:text-primary-300 text-xs bg-primary-500/20 hover:bg-primary-500/30 px-3 py-1.5 rounded-md border border-primary-500/30 transition-colors whitespace-nowrap"
                          >
                            View
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <button
                            onClick={() => generateReceipt(payment._id)}
                            className="text-primary-400 hover:text-primary-300 text-xs bg-primary-500/20 hover:bg-primary-500/30 px-3 py-1.5 rounded-md border border-primary-500/30 transition-colors whitespace-nowrap"
                          >
                            Generate
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <div className="truncate text-sm text-dark-300" title={payment.notes || '-'}>
                      {payment.notes || '-'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Receipt Display */}
      {showReceipt && (
        <ProvisionalReceipt
          paymentId={selectedPaymentId}
          saleId={saleId}
          onClose={handleReceiptClose}
          onReceiptCompleted={handleReceiptCompleted}
          onReceiptResponded={handleReceiptResponded}
        />
      )}
    </div>
  );
};

export default PaymentsTable;