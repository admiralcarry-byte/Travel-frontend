import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import ProvisionalReceipt from './ProvisionalReceipt';

const PaymentForm = ({ saleId, paymentType, onPaymentAdded, onCancel }) => {
  const [formData, setFormData] = useState({
    method: '',
    amount: '',
    currency: 'USD',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [receiptFile, setReceiptFile] = useState(null);
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exchangeRate, setExchangeRate] = useState('');
  const [convertedAmount, setConvertedAmount] = useState(null);
  const [manualExchangeRate, setManualExchangeRate] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [generatedPaymentId, setGeneratedPaymentId] = useState(null);

  const getPaymentMethods = () => {
    if (paymentType === 'provider') {
      return [
        { label: 'Transfer from Mare Nostrum', value: 'transfer_from_mare_nostrum' },
        { label: 'Transfer from Passengers', value: 'transfer_from_passengers' },
        { label: 'Deposit', value: 'deposit' },
        { label: 'Credit Card', value: 'credit_card' },
        { label: 'Cheque', value: 'cheque' },
        { label: 'Cash', value: 'cash' }
      ];
    } else {
      return [
        { label: 'Cash', value: 'cash' },
        { label: 'Transfer to Mare Nostrum', value: 'transfer_to_mare_nostrum' },
        { label: 'Transfer to Operator', value: 'transfer_to_operator' },
        { label: 'Deposit to Hivago', value: 'deposit_to_hivago' },
        { label: 'Deposit to Operator', value: 'deposit_to_operator' },
        { label: 'Deposit to BSP', value: 'deposit_to_bsp' },
        { label: 'Cheque', value: 'cheque' },
        { label: 'Crypto', value: 'crypto' },
        { label: 'Credit card to Operator/Airline', value: 'credit_card_to_operator_airline' },
        { label: 'Credit card to Mare Nostrum', value: 'credit_card_to_mare_nostrum' },
        // Legacy methods for backward compatibility
        { label: 'Credit Card (Legacy)', value: 'credit_card' },
        { label: 'Debit Card (Legacy)', value: 'debit_card' },
        { label: 'Bank Transfer (Legacy)', value: 'bank_transfer' },
        { label: 'PayPal (Legacy)', value: 'paypal' },
        { label: 'Stripe (Legacy)', value: 'stripe' },
        { label: 'Check (Legacy)', value: 'check' },
        { label: 'Wire Transfer (Legacy)', value: 'wire_transfer' },
        { label: 'Cryptocurrency (Legacy)', value: 'cryptocurrency' }
      ];
    }
  };

  const paymentMethods = getPaymentMethods();

  useEffect(() => {
    fetchCurrencies();
  }, []);

  useEffect(() => {
    if (formData.currency && formData.currency !== 'USD' && !manualExchangeRate) {
      fetchExchangeRate();
    } else if (formData.currency === 'USD') {
      setExchangeRate('');
      setConvertedAmount(null);
      setManualExchangeRate(false);
    }
  }, [formData.currency, formData.amount, manualExchangeRate]);

  useEffect(() => {
    if (manualExchangeRate && exchangeRate && formData.amount) {
      setConvertedAmount(parseFloat(formData.amount) * parseFloat(exchangeRate));
    } else if (!manualExchangeRate && exchangeRate && formData.amount) {
      setConvertedAmount(parseFloat(formData.amount) * parseFloat(exchangeRate));
    }
  }, [exchangeRate, formData.amount, manualExchangeRate]);

  const fetchCurrencies = async () => {
    try {
      const response = await api.get('/api/payments/currencies');

      if (response.data.success) {
        setCurrencies(response.data.data.currencies);
      }
    } catch (error) {
      console.error('Failed to fetch currencies:', error);
    }
  };

  const fetchExchangeRate = async () => {
    try {
      const response = await api.get(`/api/payments/exchange-rate?from=${formData.currency}&to=USD`);

      if (response.data.success) {
        setExchangeRate(response.data.data.rate.toString());
        if (formData.amount) {
          setConvertedAmount(parseFloat(formData.amount) * response.data.data.rate);
        }
      }
    } catch (error) {
      console.warn('Failed to fetch exchange rate:', error);
      setExchangeRate('');
      setConvertedAmount(null);
    }
  };

  const handleExchangeRateChange = (e) => {
    const value = e.target.value;
    setExchangeRate(value);
  };

  const toggleManualExchangeRate = () => {
    setManualExchangeRate(!manualExchangeRate);
    if (!manualExchangeRate) {
      // Switching to manual mode - clear auto-fetched rate
      setExchangeRate('');
      setConvertedAmount(null);
    } else {
      // Switching back to auto mode - fetch rate
      if (formData.currency && formData.currency !== 'USD') {
        fetchExchangeRate();
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setReceiptFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const submitData = new FormData();
      submitData.append('saleId', saleId);
      submitData.append('method', formData.method);
      submitData.append('amount', formData.amount);
      submitData.append('currency', formData.currency);
      submitData.append('date', formData.date);
      submitData.append('notes', formData.notes);
      
      // Include exchange rate if currency is not USD
      if (formData.currency !== 'USD' && exchangeRate) {
        submitData.append('exchangeRate', exchangeRate);
        submitData.append('baseCurrency', 'USD');
      }
      
      if (receiptFile) {
        submitData.append('receipt', receiptFile);
      }

      const endpoint = paymentType === 'client' 
        ? '/api/payments/client'
        : '/api/payments/provider';

      const response = await api.post(endpoint, submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        const payment = response.data.data.payment;
        setGeneratedPaymentId(payment._id);
        setShowReceipt(true);
        onPaymentAdded(payment);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save payment');
    } finally {
      setLoading(false);
    }
  };

  const handleReceiptClose = () => {
    setShowReceipt(false);
    setGeneratedPaymentId(null);
    // Reset form
    setFormData({
      method: '',
      amount: '',
      currency: 'USD',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setReceiptFile(null);
    setExchangeRate('');
    setConvertedAmount(null);
    setManualExchangeRate(false);
  };

  if (showReceipt) {
    return (
      <ProvisionalReceipt
        paymentId={generatedPaymentId}
        saleId={saleId}
        onClose={handleReceiptClose}
      />
    );
  }

  return (
    <div className="space-y-4">

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-md mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="method" className="block text-sm font-medium text-dark-200 mb-2">
              Payment Method *
            </label>
            <select
              id="method"
              name="method"
              value={formData.method}
              onChange={handleChange}
              required
              className="input-field"
            >
              <option value="">Select payment method</option>
              {paymentMethods.map(method => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="date" className="block text-sm font-medium text-dark-200 mb-2">
              Payment Date *
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              className="input-field"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-dark-200 mb-2">
              Amount *
            </label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              className="input-field"
              placeholder="Enter amount"
            />
            {convertedAmount && (
              <p className="mt-1 text-sm text-dark-400">
                ≈ ${convertedAmount.toFixed(2)} USD
                {exchangeRate && (
                  <span className="ml-2 text-xs">
                    (Rate: {parseFloat(exchangeRate).toFixed(4)})
                  </span>
                )}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-dark-200 mb-2">
              Currency *
            </label>
            <select
              id="currency"
              name="currency"
              value={formData.currency}
              onChange={handleChange}
              required
              className="input-field"
            >
              {currencies.map(currency => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} - {currency.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {formData.currency && formData.currency !== 'USD' && (
          <div className="bg-primary-500/5 border border-primary-500/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-dark-200">Exchange Rate</h4>
              <button
                type="button"
                onClick={toggleManualExchangeRate}
                className="text-xs px-3 py-1 rounded-full border border-primary-500/30 text-primary-400 hover:bg-primary-500/10 transition-colors"
              >
                {manualExchangeRate ? 'Use Auto Rate' : 'Manual Entry'}
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="exchangeRate" className="block text-sm font-medium text-dark-200 mb-2">
                  {manualExchangeRate ? 'Manual Exchange Rate *' : 'Auto Exchange Rate'}
                </label>
                <input
                  type="number"
                  id="exchangeRate"
                  value={exchangeRate}
                  onChange={handleExchangeRateChange}
                  disabled={!manualExchangeRate}
                  min="0"
                  step="0.0001"
                  className={`input-field ${!manualExchangeRate ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                  placeholder="Enter exchange rate (1 {formData.currency} = ? USD)"
                />
                <p className="mt-1 text-xs text-dark-400">
                  {manualExchangeRate 
                    ? `Enter the rate for 1 ${formData.currency} = ? USD`
                    : 'Rate automatically fetched from external API'
                  }
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-2">
                  USD Equivalent
                </label>
                <div className="input-field bg-gray-100 text-gray-700">
                  {convertedAmount ? `$${convertedAmount.toFixed(2)} USD` : 'Enter amount and rate'}
                </div>
              </div>
            </div>
          </div>
        )}

        <div>
          <label htmlFor="receipt" className="block text-sm font-medium text-dark-200 mb-2">
            Payment Receipt (Optional)
          </label>
          <input
            type="file"
            id="receipt"
            name="receipt"
            onChange={handleFileChange}
            accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
            className="block w-full text-sm text-dark-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-500/20 file:text-primary-400 hover:file:bg-primary-500/30"
          />
          <p className="mt-1 text-xs text-dark-400">
            PDF, JPG, PNG, GIF, WebP (max 5MB)
          </p>
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-dark-200 mb-2">
            Notes (Optional)
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            className="input-field"
            placeholder="Add any additional notes..."
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 text-sm font-medium text-dark-300 bg-dark-600 hover:bg-dark-500 rounded-lg transition-all duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save Payment'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PaymentForm;