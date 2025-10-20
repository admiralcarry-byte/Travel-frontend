import React, { useState, useEffect } from 'react';

const PassengerPriceModal = ({ isOpen, onClose, onComplete, currentPrice = 0, passengerCount = 0, saleCurrency = 'USD' }) => {
  const [price, setPrice] = useState(currentPrice);
  const [currency, setCurrency] = useState(saleCurrency);

  // Update currency when saleCurrency prop changes
  useEffect(() => {
    setCurrency(saleCurrency);
  }, [saleCurrency]);

  const handleComplete = () => {
    if (price > 0) {
      // Pass the price directly (assuming it's already in USD)
      onComplete(price, currency);
      onClose();
    }
  };

  const handleClose = () => {
    setPrice(currentPrice);
    setCurrency(saleCurrency);
    onClose();
  };

  const handleCurrencyChange = (newCurrency) => {
    setCurrency(newCurrency);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-dark-800/95 backdrop-blur-md rounded-lg p-6 w-full max-w-md mx-4 border border-white/10 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-dark-100">Set Price Per Passenger</h3>
          <button
            onClick={handleClose}
            className="text-dark-400 hover:text-dark-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">
              Price Per Passenger
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                className="flex-1 px-3 py-2 bg-dark-700 border border-white/20 rounded-lg text-dark-100 focus:border-blue-500 focus:outline-none"
                placeholder="0.00"
                step="0.01"
                min="0"
                autoFocus
              />
              <select
                value={currency}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                className="px-3 py-2 bg-dark-700 border border-white/20 rounded-lg text-dark-100 focus:border-blue-500 focus:outline-none"
                disabled
              >
                <option value={saleCurrency}>{saleCurrency === 'USD' ? 'U$' : saleCurrency === 'ARS' ? 'AR$' : saleCurrency}</option>
              </select>
            </div>
            <p className="text-xs text-dark-400 mt-1">
              This price will be applied to all {passengerCount} passenger{passengerCount !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Exchange Rate Field - Only show when ARS is selected */}

          {/* Total Price Preview */}
          <div className="bg-dark-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-dark-200">Total Sale Price ({saleCurrency === 'USD' ? 'U$' : saleCurrency === 'ARS' ? 'AR$' : saleCurrency}):</span>
              <span className="text-lg font-bold text-green-400">
                {currency === 'USD' ? 'U$' : currency === 'ARS' ? 'AR$' : currency} {(price * passengerCount).toFixed(2)}
              </span>
            </div>
            <div className="text-xs text-dark-400 mt-1">
              {passengerCount} passenger{passengerCount !== 1 ? 's' : ''} × {currency === 'USD' ? 'U$' : currency === 'ARS' ? 'AR$' : currency} {price.toFixed(2)}
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-dark-300 hover:text-dark-100 border border-white/20 rounded-lg hover:border-white/40 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleComplete}
              disabled={price <= 0}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              Complete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PassengerPriceModal;
