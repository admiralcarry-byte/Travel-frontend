import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import ProvisionalReceipt from './ProvisionalReceipt';
import Modal from './Modal';

const PaymentForm = ({ saleId, paymentType, onPaymentAdded, onCancel, saleCurrency = 'USD' }) => {
  const [formData, setFormData] = useState({
    amount: '',
    currencyType: '',
    paymentMethod: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [receiptFile, setReceiptFile] = useState(null);
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exchangeRate, setExchangeRate] = useState('');
  const [convertedAmount, setConvertedAmount] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [generatedPaymentId, setGeneratedPaymentId] = useState(null);
  const [currencyTypes, setCurrencyTypes] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [showCurrencyTooltip, setShowCurrencyTooltip] = useState(false);
  const [showAddMethod, setShowAddMethod] = useState(false);
  const [newMethodName, setNewMethodName] = useState('');
  const [addingMethod, setAddingMethod] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState('');
  const [extractedCurrency, setExtractedCurrency] = useState('');
  const [showExchangeRate, setShowExchangeRate] = useState(false);


  useEffect(() => {
    fetchCurrencies();
  }, []);

  useEffect(() => {
    if (formData.currencyType === 'USD') {
      setExchangeRate('');
      setConvertedAmount(null);
    }
  }, [formData.currencyType]);

  useEffect(() => {
    if (exchangeRate && formData.amount && formData.currencyType && formData.currencyType !== saleCurrency) {
      const amount = parseFloat(formData.amount);
      const rate = parseFloat(exchangeRate);
      
      if (saleCurrency === 'USD') {
        // Converting to USD: divide by exchange rate (e.g., 1600 ARS / 4 = 400 USD)
        setConvertedAmount(amount / rate);
      } else if (saleCurrency === 'ARS') {
        // Converting to ARS: multiply by exchange rate (e.g., 1600 USD * 4 = 6400 ARS)
        setConvertedAmount(amount * rate);
      }
    } else if (formData.currencyType && formData.currencyType === saleCurrency) {
      setConvertedAmount(parseFloat(formData.amount));
    } else {
      setConvertedAmount(null);
    }
  }, [exchangeRate, formData.amount, formData.currencyType, saleCurrency]);

  const fetchCurrencies = async () => {
    try {
      const response = await api.get('/api/manage-currencies');
      if (response.data.success) {
        // Only use USD and ARS currencies
        const defaultCurrencies = [
          { _id: 'usd-default', code: 'USD', name: 'U$' },
          { _id: 'ars-default', code: 'ARS', name: 'AR$' }
        ];
        
        setCurrencyTypes(defaultCurrencies);
        setPaymentMethods(response.data.data.paymentMethods || []);
      }
    } catch (error) {
      console.error('Failed to fetch currencies:', error);
      // Set default currencies even if API fails
      setCurrencyTypes([
        { _id: 'usd-default', code: 'USD', name: 'U$' },
        { _id: 'ars-default', code: 'ARS', name: 'AR$' }
      ]);
      setPaymentMethods([]);
    }
  };



  const handleExchangeRateChange = (e) => {
    const value = e.target.value;
    setExchangeRate(value);
  };


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
    
    // Check if currency conversion is needed when currency type changes
    if (name === 'currencyType') {
      if (value && value !== saleCurrency) {
        setShowExchangeRate(true);
        setExchangeRate('');
        setConvertedAmount(null);
      } else {
        setShowExchangeRate(false);
        setExchangeRate('');
        setConvertedAmount(null);
      }
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setReceiptFile(file);
    setExtractionError(''); // Clear any previous extraction errors
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
          setFormData(prev => ({
            ...prev,
            amount: extractedData.amount.toString()
          }));
        }
        if (extractedData.currency) {
          const extractedCurr = extractedData.currency.toUpperCase();
          setExtractedCurrency(extractedCurr);
          setFormData(prev => ({
            ...prev,
            currencyType: extractedCurr
          }));
          
          // Check if currency conversion is needed
          if (extractedCurr !== saleCurrency) {
            setShowExchangeRate(true);
            // Clear existing exchange rate when currency changes
            setExchangeRate('');
            setConvertedAmount(null);
          } else {
            setShowExchangeRate(false);
            setExchangeRate('');
            setConvertedAmount(null);
          }
        }
        if (extractedData.date) {
          // Convert date to YYYY-MM-DD format for input
          const date = new Date(extractedData.date);
          const formattedDate = date.toISOString().split('T')[0];
          setFormData(prev => ({
            ...prev,
            date: formattedDate
          }));
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

  const addNewPaymentMethod = async () => {
    if (!newMethodName.trim()) {
      return;
    }

    setAddingMethod(true);
    setError('');

    try {
      const response = await api.post('/api/manage-currencies/payment-method', {
        name: newMethodName.trim()
      });

      if (response.data.success) {
        // Refresh payment methods to include the new one
        await fetchCurrencies();
        setNewMethodName('');
        setShowAddMethod(false);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to add payment method');
    } finally {
      setAddingMethod(false);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const submitData = new FormData();
      submitData.append('saleId', saleId);
      submitData.append('method', formData.paymentMethod);
      submitData.append('amount', formData.amount);
      submitData.append('currency', formData.currencyType);
      submitData.append('date', formData.date);
      submitData.append('notes', formData.notes);
      
      // Include exchange rate if currency conversion is needed
      if (formData.currencyType !== saleCurrency) {
        if (!exchangeRate) {
          setError(`Exchange rate is required to convert ${formData.currencyType} to ${saleCurrency}`);
          setLoading(false);
          return;
        }
        submitData.append('exchangeRate', exchangeRate);
        submitData.append('baseCurrency', saleCurrency);
        submitData.append('originalCurrency', formData.currencyType);
        submitData.append('originalAmount', formData.amount);
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
      amount: '',
      currencyType: '',
      paymentMethod: '',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setReceiptFile(null);
    setExchangeRate('');
    setConvertedAmount(null);
    setShowAddMethod(false);
    setNewMethodName('');
    setExtractedCurrency('');
    setShowExchangeRate(false);
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
                ≈ U${convertedAmount.toFixed(2)} USD
                {exchangeRate && (
                  <span className="ml-2 text-xs">
                    (Rate: {parseFloat(exchangeRate).toFixed(4)})
                  </span>
                )}
              </p>
            )}
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
            <div className="mb-2">
              <label htmlFor="currencyType" className="block text-sm font-medium text-dark-200">
                Currency Type *
              </label>
            </div>
            <select
              id="currencyType"
              name="currencyType"
              value={formData.currencyType}
              onChange={handleChange}
              required
              className="input-field"
            >
              <option value="">Select currency type</option>
              {currencyTypes.map(currency => (
                <option key={currency._id} value={currency.code}>
                  {currency.code} - {currency.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <label htmlFor="paymentMethod" className="block text-sm font-medium text-dark-200">
                Payment Method *
              </label>
              <button
                type="button"
                onClick={() => setShowAddMethod(!showAddMethod)}
                className="flex items-center justify-center w-6 h-6 text-primary-400 bg-primary-500/10 border border-primary-500/30 rounded hover:bg-primary-500/20 transition-colors"
                title="Add new payment method"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
            
            {showAddMethod ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMethodName}
                    onChange={(e) => setNewMethodName(e.target.value)}
                    placeholder="Enter payment method name"
                    className="input-field flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && addNewPaymentMethod()}
                  />
                  <button
                    type="button"
                    onClick={addNewPaymentMethod}
                    disabled={!newMethodName.trim() || addingMethod}
                    className="px-3 py-2 text-sm font-medium text-white bg-primary-500 rounded hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {addingMethod ? 'Adding...' : 'Add'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddMethod(false);
                      setNewMethodName('');
                    }}
                    className="px-3 py-2 text-sm font-medium text-dark-300 bg-dark-600 rounded hover:bg-dark-500"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <select
                id="paymentMethod"
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
                required
                className="input-field"
              >
                <option value="">Select payment method</option>
                {paymentMethods.map(method => (
                  <option key={method._id} value={method.name}>
                    {method.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {showExchangeRate && formData.currencyType && formData.currencyType !== saleCurrency && (
          <div className="bg-primary-500/5 border border-primary-500/20 rounded-lg p-4">
            <div className="mb-3">
              <h4 className="text-sm font-medium text-dark-200">Currency Conversion Required *</h4>
              <p className="text-xs text-dark-400 mt-1">
                The extracted currency ({formData.currencyType}) differs from the sale currency ({saleCurrency}). 
                Please enter the exchange rate to convert the amount.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="exchangeRate" className="block text-sm font-medium text-dark-200 mb-2">
                  Exchange Rate *
                </label>
                <input
                  type="number"
                  id="exchangeRate"
                  value={exchangeRate}
                  onChange={handleExchangeRateChange}
                  required
                  min="0"
                  step="0.0001"
                  className="input-field"
                  placeholder={saleCurrency === 'USD' 
                    ? `How many ${formData.currencyType} = 1 USD?` 
                    : `How many ${saleCurrency} = 1 ${formData.currencyType}?`
                  }
                />
                <p className="mt-1 text-xs text-dark-400">
                  {saleCurrency === 'USD' 
                    ? `Enter how many ${formData.currencyType} equal 1 USD (e.g., if 1 USD = 4 ARS, enter 4)`
                    : `Enter how many ${saleCurrency} equal 1 ${formData.currencyType} (e.g., if 1 USD = 4 ARS, enter 4)`
                  }
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-2">
                  {saleCurrency} Equivalent
                </label>
                <div className="input-field bg-gray-100 text-gray-700">
                  {convertedAmount ? `${saleCurrency} ${convertedAmount.toFixed(2)}` : 'Enter amount and rate'}
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
          
          {/* File selected and Extract button */}
          {receiptFile && (
            <div className="mt-3 space-y-2">
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
              
              {extractionError && (
                <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded p-2">
                  {extractionError}
                </div>
              )}
            </div>
          )}
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