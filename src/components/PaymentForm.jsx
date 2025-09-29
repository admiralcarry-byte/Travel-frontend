import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import ProvisionalReceipt from './ProvisionalReceipt';
import Modal from './Modal';

const PaymentForm = ({ saleId, paymentType, onPaymentAdded, onCancel }) => {
  const [formData, setFormData] = useState({
    amount: '',
    currency: '',
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
  const [showCurrencyEditModal, setShowCurrencyEditModal] = useState(false);
  const [currencyTypes, setCurrencyTypes] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [newCurrencyType, setNewCurrencyType] = useState('');
  const [newPaymentMethod, setNewPaymentMethod] = useState('');
  const [currencyEditLoading, setCurrencyEditLoading] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState(null);
  const [editingPaymentMethod, setEditingPaymentMethod] = useState(null);
  const [editCurrencyData, setEditCurrencyData] = useState({ code: '', name: '' });
  const [editPaymentMethodData, setEditPaymentMethodData] = useState({ name: '' });
  const [duplicateError, setDuplicateError] = useState('');


  useEffect(() => {
    fetchCurrencies();
  }, []);

  useEffect(() => {
    if (showCurrencyEditModal) {
      fetchManageCurrencies();
    }
  }, [showCurrencyEditModal]);

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
      setConvertedAmount(parseFloat(formData.amount) / parseFloat(exchangeRate));
    } else if (!manualExchangeRate && exchangeRate && formData.amount) {
      setConvertedAmount(parseFloat(formData.amount) / parseFloat(exchangeRate));
    }
  }, [exchangeRate, formData.amount, manualExchangeRate]);

  const fetchCurrencies = async () => {
    try {
      const response = await api.get('/api/manage-currencies');
      if (response.data.success) {
        // Combine currency types and payment methods for dropdown display
        const currencyTypes = response.data.data.currencyUnits || [];
        const paymentMethods = response.data.data.paymentMethods || [];
        
        const combinedCurrencies = [];
        currencyTypes.forEach(currency => {
          paymentMethods.forEach(method => {
            combinedCurrencies.push({
              code: `${currency.code} ${method.name}`,
              name: `${currency.name} ${method.name}`,
              currencyCode: currency.code,
              currencyName: currency.name,
              methodName: method.name
            });
          });
        });
        
        setCurrencies(combinedCurrencies);
      }
    } catch (error) {
      console.error('Failed to fetch currencies:', error);
      setCurrencies([]);
    }
  };

  const fetchManageCurrencies = async () => {
    try {
      const response = await api.get('/api/manage-currencies');
      if (response.data.success) {
        setCurrencyTypes(response.data.data.currencyUnits);
        setPaymentMethods(response.data.data.paymentMethods);
        
        // Also update the main currency dropdown
        await fetchCurrencies();
      }
    } catch (error) {
      console.error('Failed to fetch manage currencies:', error);
    }
  };

  const fetchExchangeRate = async () => {
    try {
      // Extract just the currency code (first part before space)
      const currencyCode = formData.currency.split(' ')[0];
      
      // Only fetch exchange rate if it's not USD (since USD to USD = 1)
      if (currencyCode === 'USD') {
        setExchangeRate('1');
        setConvertedAmount(parseFloat(formData.amount));
        return;
      }

      const response = await api.get(`/api/payments/exchange-rate?from=USD&to=${currencyCode}`);

      if (response.data.success) {
        setExchangeRate(response.data.data.rate.toString());
        if (formData.amount) {
          setConvertedAmount(parseFloat(formData.amount) / response.data.data.rate);
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

  const addCurrencyType = async () => {
    if (!newCurrencyType.trim()) {
      return;
    }

    setCurrencyEditLoading(true);
    setDuplicateError('');
    
    try {
      // Check for duplicate combinations before adding
      const code = newCurrencyType.toUpperCase();
      const name = `${code.toLowerCase()} Currency`;
      
      // Check if this currency+method combination already exists
      const existingCombinations = [];
      currencyTypes.forEach(currency => {
        paymentMethods.forEach(method => {
          existingCombinations.push(`${currency.code} ${method.name}`);
        });
      });
      
      const newCombinations = paymentMethods.map(method => `${code} ${method.name}`);
      const hasDuplicate = newCombinations.some(combo => existingCombinations.includes(combo));
      
      if (hasDuplicate) {
        setDuplicateError(`Currency combinations with ${code} already exist. Please check existing combinations.`);
        return;
      }

      const response = await api.post('/api/manage-currencies/currency', {
        code,
        name
      });
      
      if (response.data.success) {
        await fetchManageCurrencies();
        setNewCurrencyType('');
      }
    } catch (error) {
      console.error('Failed to add currency type:', error);
      const errorMessage = error.response?.data?.message || 'Failed to add currency type';
      setDuplicateError(errorMessage);
    } finally {
      setCurrencyEditLoading(false);
    }
  };

  const addPaymentMethod = async () => {
    if (!newPaymentMethod.trim()) {
      return;
    }

    setCurrencyEditLoading(true);
    setDuplicateError('');
    
    try {
      // Check for duplicate combinations before adding
      const methodName = newPaymentMethod.trim();
      
      // Check if this currency+method combination already exists
      const existingCombinations = [];
      currencyTypes.forEach(currency => {
        paymentMethods.forEach(method => {
          existingCombinations.push(`${currency.code} ${method.name}`);
        });
      });
      
      const newCombinations = currencyTypes.map(currency => `${currency.code} ${methodName}`);
      const hasDuplicate = newCombinations.some(combo => existingCombinations.includes(combo));
      
      if (hasDuplicate) {
        setDuplicateError(`Currency combinations with ${methodName} already exist. Please check existing combinations.`);
        return;
      }

      const response = await api.post('/api/manage-currencies/payment-method', {
        name: methodName
      });
      
      if (response.data.success) {
        await fetchManageCurrencies();
        setNewPaymentMethod('');
      }
    } catch (error) {
      console.error('Failed to add payment method:', error);
      const errorMessage = error.response?.data?.message || 'Failed to add payment method';
      setDuplicateError(errorMessage);
    } finally {
      setCurrencyEditLoading(false);
    }
  };

  const deleteCurrencyType = async (currencyId) => {
    try {
      const response = await api.delete(`/api/manage-currencies/currency/${currencyId}`);
      
      if (response.data.success) {
        await fetchManageCurrencies();
      }
    } catch (error) {
      console.error('Failed to delete currency type:', error);
    }
  };

  const deletePaymentMethod = async (methodId) => {
    try {
      const response = await api.delete(`/api/manage-currencies/payment-method/${methodId}`);
      
      if (response.data.success) {
        await fetchManageCurrencies();
      }
    } catch (error) {
      console.error('Failed to delete payment method:', error);
    }
  };

  // Inline editing functions
  const startEditingCurrency = (currency) => {
    setEditingCurrency(currency._id);
    setEditCurrencyData({
      code: currency.code,
      name: currency.name
    });
    setDuplicateError('');
  };

  const cancelEditingCurrency = () => {
    setEditingCurrency(null);
    setEditCurrencyData({ code: '', name: '' });
    setDuplicateError('');
  };

  const handleCurrencyCodeChange = (newCode) => {
    const code = newCode.toUpperCase();
    const name = `${code.toLowerCase()} Currency`;
    setEditCurrencyData({ code, name });
  };

  const saveCurrencyEdit = async () => {
    if (!editCurrencyData.code.trim()) {
      setDuplicateError('Currency code is required');
      return;
    }

    setCurrencyEditLoading(true);
    setDuplicateError('');

    try {
      // Check for duplicate combinations before saving
      const code = editCurrencyData.code.toUpperCase();
      
      // Check if this currency+method combination already exists (excluding current currency)
      const existingCombinations = [];
      currencyTypes.forEach(currency => {
        if (currency._id !== editingCurrency) { // Exclude current currency being edited
          paymentMethods.forEach(method => {
            existingCombinations.push(`${currency.code} ${method.name}`);
          });
        }
      });
      
      const newCombinations = paymentMethods.map(method => `${code} ${method.name}`);
      const hasDuplicate = newCombinations.some(combo => existingCombinations.includes(combo));
      
      if (hasDuplicate) {
        setDuplicateError(`Currency combinations with ${code} already exist. Please check existing combinations.`);
        return;
      }

      const response = await api.put(`/api/manage-currencies/currency/${editingCurrency}`, editCurrencyData);
      
      if (response.data.success) {
        await fetchManageCurrencies();
        setEditingCurrency(null);
        setEditCurrencyData({ code: '', name: '' });
      }
    } catch (error) {
      console.error('Failed to update currency:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update currency';
      setDuplicateError(errorMessage);
    } finally {
      setCurrencyEditLoading(false);
    }
  };

  const startEditingPaymentMethod = (method) => {
    setEditingPaymentMethod(method._id);
    setEditPaymentMethodData({ name: method.name });
    setDuplicateError('');
  };

  const cancelEditingPaymentMethod = () => {
    setEditingPaymentMethod(null);
    setEditPaymentMethodData({ name: '' });
    setDuplicateError('');
  };

  const savePaymentMethodEdit = async () => {
    if (!editPaymentMethodData.name.trim()) {
      setDuplicateError('Payment method name is required');
      return;
    }

    setCurrencyEditLoading(true);
    setDuplicateError('');

    try {
      const response = await api.put(`/api/manage-currencies/payment-method/${editingPaymentMethod}`, editPaymentMethodData);
      
      if (response.data.success) {
        await fetchManageCurrencies();
        setEditingPaymentMethod(null);
        setEditPaymentMethodData({ name: '' });
      }
    } catch (error) {
      console.error('Failed to update payment method:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update payment method';
      setDuplicateError(errorMessage);
    } finally {
      setCurrencyEditLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Extract payment method from selected currency
      const selectedCurrency = currencies.find(c => c.code === formData.currency);
      const paymentMethod = selectedCurrency ? selectedCurrency.methodName : '';
      
      // Use the exact payment method name as stored in the database
      const methodValue = paymentMethod;

      const submitData = new FormData();
      submitData.append('saleId', saleId);
      submitData.append('method', methodValue);
      submitData.append('amount', formData.amount);
      submitData.append('currency', formData.currency.split(' ')[0]); // Use just the currency code
      submitData.append('date', formData.date);
      submitData.append('notes', formData.notes);
      
      // Include exchange rate if currency is not USD
      if (formData.currency.split(' ')[0] !== 'USD' && exchangeRate) {
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
      amount: '',
      currency: '',
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

        <div className="space-y-4">

          <div>
            <div className="flex items-end gap-3">
              <div className="flex-1">
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
                  <option value="">Select currency</option>
                  {currencies.map(currency => (
                    <option key={currency.code} value={currency.code}>
                      {currency.code} - {currency.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => setShowCurrencyEditModal(true)}
                  className="px-4 py-2 text-sm font-medium text-primary-400 bg-primary-500/10 border border-primary-500/30 rounded-lg hover:bg-primary-500/20 transition-colors whitespace-nowrap"
                >
                  Edit Currencies
                </button>
              </div>
            </div>
          </div>
        </div>

        {formData.currency && formData.currency.split(' ')[0] !== 'USD' && (
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
                  placeholder={`Enter exchange rate (1 USD = ? ${formData.currency.split(' ')[0]})`}
                />
                <p className="mt-1 text-xs text-dark-400">
                  {manualExchangeRate 
                    ? `Enter the rate for 1 USD = ? ${formData.currency.split(' ')[0]}`
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

      {/* Manage Currencies Modal */}
      <Modal
        isOpen={showCurrencyEditModal}
        onClose={() => setShowCurrencyEditModal(false)}
        title="Manage Currencies"
        size="md"
      >
        <div className="space-y-6">
          {/* Error Display */}
          {duplicateError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <p className="text-red-400 text-sm">{duplicateError}</p>
            </div>
          )}
          {/* Currency Type Section */}
          <div className="bg-dark-600 rounded-lg p-4">
            <h3 className="text-lg font-medium text-dark-100 mb-4">Currency Type</h3>
            
            {/* Add New Currency Type */}
            <div className="mb-4 p-3 bg-dark-700 rounded border border-dark-500">
              <div className="flex gap-3 mb-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-dark-200 mb-1">Currency Type *</label>
                  <input
                    type="text"
                    value={newCurrencyType}
                    onChange={(e) => setNewCurrencyType(e.target.value)}
                    className="input-field text-sm"
                    placeholder="USD, EUR, GBP, etc."
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={addCurrencyType}
                    disabled={!newCurrencyType.trim() || currencyEditLoading}
                    className="px-3 py-1 bg-primary-500 text-white text-sm rounded hover:bg-primary-600 disabled:opacity-50"
                  >
                    Add Currency
                  </button>
                </div>
              </div>
            </div>

            {/* Existing Currency Types */}
            <div className="space-y-2">
              {currencyTypes.map((currency) => (
                <div key={currency._id} className="p-2 bg-dark-700 rounded border border-dark-500">
                  {editingCurrency === currency._id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editCurrencyData.code}
                        onChange={(e) => handleCurrencyCodeChange(e.target.value)}
                        className="input-field text-sm"
                        placeholder="USD, EUR, GBP, etc."
                        maxLength={3}
                        style={{ textTransform: 'uppercase' }}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={saveCurrencyEdit}
                          disabled={currencyEditLoading}
                          className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEditingCurrency}
                          disabled={currencyEditLoading}
                          className="px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center">
                      <span 
                        className="text-dark-100 cursor-pointer hover:text-primary-400 transition-colors"
                        onClick={() => startEditingCurrency(currency)}
                      >
                        {currency.code} {currency.name}
                      </span>
                      <button
                        onClick={() => deleteCurrencyType(currency._id)}
                        className="px-2 py-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Payment Method Section */}
          <div className="bg-dark-600 rounded-lg p-4">
            <h3 className="text-lg font-medium text-dark-100 mb-4">Payment Method</h3>
            
            {/* Add New Payment Method */}
            <div className="mb-4 p-3 bg-dark-700 rounded border border-dark-500">
              <div className="flex gap-3 mb-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-dark-200 mb-1">Payment Method *</label>
                  <input
                    type="text"
                    value={newPaymentMethod}
                    onChange={(e) => setNewPaymentMethod(e.target.value)}
                    className="input-field text-sm"
                    placeholder="Crypto, Transfer, etc."
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={addPaymentMethod}
                    disabled={!newPaymentMethod.trim() || currencyEditLoading}
                    className="px-3 py-1 bg-primary-500 text-white text-sm rounded hover:bg-primary-600 disabled:opacity-50"
                  >
                    Add Method
                  </button>
                </div>
              </div>
            </div>

            {/* Existing Payment Methods */}
            <div className="space-y-2">
              {paymentMethods.map((method) => (
                <div key={method._id} className="p-2 bg-dark-700 rounded border border-dark-500">
                  {editingPaymentMethod === method._id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editPaymentMethodData.name}
                        onChange={(e) => setEditPaymentMethodData(prev => ({ ...prev, name: e.target.value }))}
                        className="input-field text-sm"
                        placeholder="Payment method name"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={savePaymentMethodEdit}
                          disabled={currencyEditLoading}
                          className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEditingPaymentMethod}
                          disabled={currencyEditLoading}
                          className="px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center">
                      <span 
                        className="text-dark-100 cursor-pointer hover:text-primary-400 transition-colors"
                        onClick={() => startEditingPaymentMethod(method)}
                      >
                        {method.name}
                      </span>
                      <button
                        onClick={() => deletePaymentMethod(method._id)}
                        className="px-2 py-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PaymentForm;