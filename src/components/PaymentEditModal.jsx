import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const PaymentEditModal = ({ 
  payment, 
  isOpen, 
  onClose, 
  onSave, 
  saving = false 
}) => {
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'USD',
    method: '',
    date: '',
    notes: '',
    exchangeRate: ''
  });
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loadingMethods, setLoadingMethods] = useState(false);
  const [usdEquivalent, setUsdEquivalent] = useState(null);
  const [receiptFile, setReceiptFile] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState('');

  // Calculate USD equivalent when amount, currency, or exchange rate changes
  const calculateUsdEquivalent = () => {
    if (!formData.amount || !formData.currency) {
      setUsdEquivalent(null);
      return;
    }

    if (formData.currency === 'USD') {
      setUsdEquivalent(parseFloat(formData.amount));
    } else if (formData.currency !== 'USD' && formData.exchangeRate) {
      const amount = parseFloat(formData.amount);
      const rate = parseFloat(formData.exchangeRate);
      if (amount && rate) {
        setUsdEquivalent(amount / rate);
      } else {
        setUsdEquivalent(null);
      }
    } else {
      setUsdEquivalent(null);
    }
  };

  // Fetch payment methods when modal opens
  const fetchPaymentMethods = async () => {
    setLoadingMethods(true);
    try {
      const response = await api.get('/api/manage-currencies');
      if (response.data.success) {
        setPaymentMethods(response.data.data.paymentMethods || []);
      }
    } catch (error) {
      console.error('Failed to fetch payment methods:', error);
      // Set some default payment methods if API fails
      setPaymentMethods([
        { _id: 'cash', name: 'Cash' },
        { _id: 'crypto', name: 'Crypto' },
        { _id: 'credit_card', name: 'Credit Card' },
        { _id: 'bank_transfer', name: 'Bank Transfer' },
        { _id: 'wire_transfer', name: 'Wire Transfer' }
      ]);
    } finally {
      setLoadingMethods(false);
    }
  };

  useEffect(() => {
    if (payment && isOpen) {
      setFormData({
        amount: payment.originalAmount || payment.amount,
        currency: payment.originalCurrency || payment.currency,
        method: payment.method || '',
        date: new Date(payment.date).toISOString().split('T')[0],
        notes: payment.notes || '',
        exchangeRate: payment.exchangeRate ? (1 / payment.exchangeRate).toString() : ''
      });
      // Fetch payment methods when modal opens
      fetchPaymentMethods();
    }
  }, [payment, isOpen]);

  // Recalculate USD equivalent when form data changes
  useEffect(() => {
    calculateUsdEquivalent();
  }, [formData.amount, formData.currency, formData.exchangeRate]);

  // Handle receipt file upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setReceiptFile(file);
    setExtractionError('');
  };

  // Extract data from receipt
  const handleExtractReceipt = async () => {
    if (!receiptFile) {
      setExtractionError('Please select a receipt file first');
      return;
    }

    setExtracting(true);
    setExtractionError('');

    try {
      const formData = new FormData();
      formData.append('receipt', receiptFile);

      const response = await api.post('/api/receipts/extract', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000, // 2 minutes timeout for OCR processing
      });

      if (response.data.success) {
        const extractedData = response.data.data;
        
        // Auto-populate form fields
        if (extractedData.amount) {
          handleInputChange('amount', extractedData.amount.toString());
        }
        if (extractedData.currency) {
          handleInputChange('currency', extractedData.currency);
        }
        if (extractedData.date) {
          // Convert date to YYYY-MM-DD format for input
          const date = new Date(extractedData.date);
          const formattedDate = date.toISOString().split('T')[0];
          handleInputChange('date', formattedDate);
        }
        
        setExtractionError('');
      } else {
        setExtractionError(response.data.message || 'Failed to extract data from receipt');
      }
    } catch (error) {
      console.error('Receipt extraction error:', error);
      setExtractionError(
        error.response?.data?.message || 
        'Failed to process receipt. Please try again or enter data manually.'
      );
    } finally {
      setExtracting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Calculate USD amount if currency is not USD
    let updateData = { ...formData };
    
    if (formData.currency !== 'USD') {
      if (!formData.exchangeRate) {
        alert('Exchange rate is required for non-USD currencies');
        return;
      }
      const exchangeRate = parseFloat(formData.exchangeRate);
      updateData.amount = parseFloat(formData.amount) * (1 / exchangeRate);
      updateData.exchangeRate = 1 / exchangeRate;
      updateData.baseCurrency = 'USD';
    } else {
      updateData.amount = parseFloat(formData.amount);
      updateData.exchangeRate = null;
      updateData.baseCurrency = null;
    }

    // Convert date to proper format
    updateData.date = new Date(formData.date);
    
    // Store original values for display
    updateData.originalAmount = parseFloat(formData.amount);
    updateData.originalCurrency = formData.currency;

    onSave(updateData);
  };

  if (!isOpen || !payment) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50">
      <div className="bg-dark-700 rounded-lg shadow-xl w-full max-w-md mx-4 border border-white/10">
        <div className="px-6 py-4 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white">
            Edit Payment
          </h3>
          <p className="text-sm text-dark-300 mt-1">
            {payment.type === 'client' ? 'Passenger' : 'Provider'} Payment
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Receipt Upload Section */}
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4">
            <h4 className="text-sm font-medium text-dark-200 mb-3">
              Upload Receipt (Optional)
            </h4>
            <p className="text-xs text-dark-400 mb-3">
              Upload a receipt image to automatically extract amount, currency, and payment date.
            </p>
            
            <div className="space-y-3">
              <div>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded-md text-white text-sm file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary-600 file:text-white hover:file:bg-primary-700 file:cursor-pointer cursor-pointer"
                />
              </div>
              
              {receiptFile && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-dark-300">
                    Selected: {receiptFile.name}
                  </span>
                  <button
                    type="button"
                    onClick={handleExtractReceipt}
                    disabled={extracting}
                    className="px-3 py-1 bg-primary-600 text-white text-xs rounded hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {extracting ? 'Extracting...' : 'Extract Data'}
                  </button>
                </div>
              )}
              
              {extractionError && (
                <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded p-2">
                  {extractionError}
                </div>
              )}
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">
              Payment Method
            </label>
            <select
              value={formData.method}
              onChange={(e) => handleInputChange('method', e.target.value)}
              className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded-md text-white focus:border-primary-500 focus:outline-none"
              required
              disabled={loadingMethods}
            >
              <option value="">Select payment method</option>
              {paymentMethods.map(method => (
                <option key={method._id} value={method.name}>
                  {method.name}
                </option>
              ))}
            </select>
            {loadingMethods && (
              <p className="text-xs text-dark-400 mt-1">Loading payment methods...</p>
            )}
          </div>

          {/* Amount and Currency */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">
                Amount
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded-md text-white focus:border-primary-500 focus:outline-none"
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">
                Currency
              </label>
              <select
                value={formData.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
                className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded-md text-white focus:border-primary-500 focus:outline-none"
              >
                <option value="USD">USD</option>
                <option value="ARS">ARS</option>
              </select>
            </div>
          </div>

          {/* USD Equivalent Display */}
          {formData.currency && formData.amount && (
            <div className="bg-primary-500/5 border border-primary-500/20 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-dark-200">
                  USD Equivalent:
                </span>
                <span className="text-sm font-semibold text-primary-400">
                  {usdEquivalent !== null 
                    ? `$${usdEquivalent.toFixed(2)} USD`
                    : formData.currency === 'USD' 
                      ? `$${parseFloat(formData.amount || 0).toFixed(2)} USD`
                      : 'Enter exchange rate'
                  }
                </span>
              </div>
              {formData.currency !== 'USD' && !formData.exchangeRate && (
                <p className="text-xs text-dark-400 mt-1">
                  Enter exchange rate below to calculate USD equivalent
                </p>
              )}
            </div>
          )}

          {/* Exchange Rate for non-USD currencies */}
          {formData.currency !== 'USD' && (
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">
                Exchange Rate (USD to {formData.currency})
              </label>
              <input
                type="number"
                step="0.0001"
                value={formData.exchangeRate}
                onChange={(e) => handleInputChange('exchangeRate', e.target.value)}
                className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded-md text-white focus:border-primary-500 focus:outline-none"
                placeholder="e.g., 1000 (for ARS)"
                required
              />
              <p className="text-xs text-dark-400 mt-1">
                Enter how many {formData.currency} equal 1 USD
              </p>
            </div>
          )}

          {/* Payment Date */}
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">
              Payment Date
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded-md text-white focus:border-primary-500 focus:outline-none"
              required
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded-md text-white focus:border-primary-500 focus:outline-none"
              placeholder="Additional notes about this payment..."
              rows="3"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-dark-300 bg-dark-600 hover:bg-dark-500 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-primary-600 text-white hover:bg-primary-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentEditModal;
