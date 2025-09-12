import React, { useState, useEffect } from 'react';
import axios from 'axios';

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
  const [exchangeRate, setExchangeRate] = useState(null);
  const [convertedAmount, setConvertedAmount] = useState(null);

  const paymentMethods = [
    { label: 'Cash', value: 'cash' },
    { label: 'Credit Card', value: 'credit_card' },
    { label: 'Debit Card', value: 'debit_card' },
    { label: 'Bank Transfer', value: 'bank_transfer' },
    { label: 'PayPal', value: 'paypal' },
    { label: 'Stripe', value: 'stripe' },
    { label: 'Check', value: 'check' },
    { label: 'Wire Transfer', value: 'wire_transfer' },
    { label: 'Cryptocurrency', value: 'cryptocurrency' }
  ];

  useEffect(() => {
    fetchCurrencies();
  }, []);

  useEffect(() => {
    if (formData.currency && formData.currency !== 'USD') {
      fetchExchangeRate();
    } else {
      setExchangeRate(null);
      setConvertedAmount(null);
    }
  }, [formData.currency, formData.amount]);

  const fetchCurrencies = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/payments/currencies', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setCurrencies(response.data.data.currencies);
      }
    } catch (error) {
      console.error('Failed to fetch currencies:', error);
    }
  };

  const fetchExchangeRate = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/payments/exchange-rate?from=${formData.currency}&to=USD`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setExchangeRate(response.data.data.rate);
        if (formData.amount) {
          setConvertedAmount(parseFloat(formData.amount) * response.data.data.rate);
        }
      }
    } catch (error) {
      console.warn('Failed to fetch exchange rate:', error);
      setExchangeRate(null);
      setConvertedAmount(null);
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
      
      if (receiptFile) {
        submitData.append('receipt', receiptFile);
      }

      const endpoint = paymentType === 'client' 
        ? 'http://localhost:5000/api/payments/client'
        : 'http://localhost:5000/api/payments/provider';

      const response = await axios.post(endpoint, submitData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        onPaymentAdded(response.data.data.payment);
        // Reset form
        setFormData({
          method: '',
          amount: '',
          currency: 'USD',
          date: new Date().toISOString().split('T')[0],
          notes: ''
        });
        setReceiptFile(null);
        setExchangeRate(null);
        setConvertedAmount(null);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

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
                    (Rate: {exchangeRate.toFixed(4)})
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

        <div>
          <label htmlFor="receipt" className="block text-sm font-medium text-dark-200 mb-2">
            Receipt (Optional)
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
            {loading ? 'Recording...' : 'Record Payment'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PaymentForm;