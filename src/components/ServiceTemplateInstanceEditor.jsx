import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { toast } from 'react-toastify';

const ServiceTemplateInstanceEditor = ({ 
  instance, 
  onUpdate, 
  onDelete, 
  availableProviders = [],
  onProviderSearch,
  isEditing = false,
  onEditStart,
  onEditCancel,
  getGlobalProviderCount,
  saleCurrency = 'USD'
}) => {
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Field-specific states
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [tempDates, setTempDates] = useState({
    checkIn: instance.checkIn,
    checkOut: instance.checkOut
  });
  const [tempCurrency, setTempCurrency] = useState(instance.currency);
  const [exchangeRate, setExchangeRate] = useState('');
  const [convertedAmount, setConvertedAmount] = useState(null);
  
  // Multiple provider selection
  const [selectedProviders, setSelectedProviders] = useState([]);
  
  // Local search state for the modal
  const [localProviderSearch, setLocalProviderSearch] = useState('');
  
  // Provider cost states
  const [providerCosts, setProviderCosts] = useState({});

  
  // Initialize selected providers when modal opens
  useEffect(() => {
    if (showProviderModal) {
      // Convert instance.provider to array format
      // Handle both backend structure (providers array with providerId objects) and frontend structure (direct provider objects)
      let currentProviders = [];
      
      if (instance.providers && instance.providers.length > 0) {
        // Handle mixed formats - some providers might be in backend format, others in frontend format
        currentProviders = instance.providers.map(p => {
          // If provider has providerId property, extract the actual provider object
          if (p.providerId) {
            return p.providerId;
          }
          // Otherwise, use the provider object directly
          return p;
        }).filter(Boolean);
      } else if (instance.provider) {
        // Fall back to single provider
        currentProviders = [instance.provider];
      }
      
      console.log('🔍 Provider Modal - Initializing providers:', {
        instanceId: instance.id,
        instanceProviders: instance.providers,
        currentProviders: currentProviders,
        globalCounts: currentProviders.map(p => ({
          providerId: p._id,
          providerName: p.name,
          globalCount: getGlobalProviderCount ? getGlobalProviderCount(p._id, instance.id) : 0
        }))
      });
      
      setSelectedProviders(currentProviders);
      // Reset search when modal opens
      setLocalProviderSearch('');
      
      // Initialize provider costs from existing data
      const initialCosts = {};
      currentProviders.forEach((provider, index) => {
        const costKey = `${provider._id}_${index}`;
        initialCosts[costKey] = provider.costProvider || '';
        initialCosts[`${costKey}_currency`] = saleCurrency; // Use sale currency
      });
      setProviderCosts(initialCosts);
    }
  }, [showProviderModal, instance.provider, instance.providers, getGlobalProviderCount]);

  const startEditing = (field, currentValue) => {
    setEditingField(field);
    if (field === 'destination') {
      setEditValue(currentValue?.city || '');
    } else if (field === 'cost') {
      setEditValue(currentValue || '');
      setTempCurrency(instance.currency); // Initialize with current currency
      setExchangeRate(''); // Clear exchange rate
      setConvertedAmount(null); // Clear converted amount
    } else {
      setEditValue(currentValue || '');
    }
    setError('');
    if (onEditStart) onEditStart();
  };

  const cancelEditing = () => {
    setEditingField(null);
    setEditValue('');
    setError('');
    setTempCurrency(instance.currency); // Reset to original currency
    setExchangeRate(''); // Clear exchange rate
    setConvertedAmount(null); // Clear converted amount
    if (onEditCancel) onEditCancel();
  };

  const saveField = async (field, value) => {
    if (value === instance[field]) {
      cancelEditing();
      return;
    }

    setLoading(true);
    setError('');

    try {
      const updateData = {
        [field]: value
      };

      // Handle special field mappings
      if (field === 'serviceInfo') {
        updateData.serviceInfo = value; // Keep consistent with display field
        updateData.serviceName = value; // Also update the backend field
      } else if (field === 'serviceDescription') {
        updateData.serviceDescription = value; // Keep consistent with display field
        updateData.notes = value; // Also update the backend field
      } else if (field === 'cost') {
        updateData.cost = parseFloat(value); // Keep consistent with display field
        updateData.priceClient = parseFloat(value);
        updateData.costProvider = parseFloat(value); // Update costProvider directly
        updateData.currency = tempCurrency; // Include the selected currency
        
        // Update the providers array to reflect the new costProvider value
        if (instance.providers && instance.providers.length > 0) {
          // When editing cost directly, set the total cost as the first provider's cost
          // and set other providers to 0 to maintain the total
          updateData.providers = instance.providers.map((provider, index) => ({
            ...provider,
            costProvider: index === 0 ? parseFloat(value) : 0
          }));
        }
      } else if (field === 'checkIn' || field === 'checkOut') {
        updateData[field] = value; // Keep consistent with display field
        updateData.serviceDates = {
          startDate: field === 'checkIn' ? new Date(value) : new Date(instance.serviceDates?.startDate || instance.checkIn),
          endDate: field === 'checkOut' ? new Date(value) : new Date(instance.serviceDates?.endDate || instance.checkOut)
        };
      } else if (field === 'provider') {
        updateData.provider = value; // Keep consistent with display field
        updateData.providerId = value._id;
      } else if (field === 'destination') {
        updateData.destination = { city: value, country: '' }; // Store as city only, no country
      }

      // Update the instance
      const updatedInstance = {
        ...instance,
        ...updateData
      };


      onUpdate(updatedInstance);
      cancelEditing();
      toast.success(`${field} updated successfully`);
    } catch (error) {
      console.error('Error updating field:', error);
      setError(error.response?.data?.message || 'Failed to update field');
      toast.error('Failed to update field');
    } finally {
      setLoading(false);
    }
  };

  const handleProviderToggle = (provider) => {
    setSelectedProviders(prev => {
      // Count how many times this provider is currently selected in this modal
      const currentModalCount = prev.filter(p => p._id === provider._id).length;
      
      // Count how many times this provider is selected in other services (excluding current modal)
      const otherServicesCount = getGlobalProviderCount ? getGlobalProviderCount(provider._id, instance.id) : 0;
      
      // Calculate what the real-time global count would be after adding one more
      const wouldBeGlobalCount = otherServicesCount + currentModalCount + 1;
      
      const maxSelections = 7;
      
      console.log('🔍 Provider Toggle - Debug:', {
        providerName: provider.name,
        providerId: provider._id,
        currentModalCount,
        otherServicesCount,
        wouldBeGlobalCount,
        wouldExceedLimit: wouldBeGlobalCount > maxSelections,
        maxSelections
      });
      
      // Check if adding one more would exceed the global limit
      if (wouldBeGlobalCount > maxSelections) {
        toast.error(`Cannot select more instances of ${provider.name}. Global limit is ${maxSelections} selections across all services. Current count would be: ${wouldBeGlobalCount}`);
        return prev;
      }
      
      // Add provider instance
      return [...prev, provider];
    });
  };

  const removeProviderInstance = (providerId, instanceIndex) => {
    setSelectedProviders(prev => {
      let count = 0;
      return prev.filter(p => {
        if (p._id === providerId) {
          if (count === instanceIndex) {
            count++;
            return false; // Remove this instance
          }
          count++;
        }
        return true; // Keep this provider
      });
    });
  };
  
  const handleProviderSave = () => {
    if (selectedProviders.length === 0) {
      toast.error('Please select at least one provider');
      return;
    }
    
    // Calculate total cost from provider costs
    let totalCost = 0;
    
    // Group providers by ID to match the UI structure
    const providerGroups = {};
    selectedProviders.forEach((provider, index) => {
      if (!providerGroups[provider._id]) {
        providerGroups[provider._id] = {
          provider,
          indices: []
        };
      }
      providerGroups[provider._id].indices.push(index);
    });
    
    // Calculate costs using the same key structure as the UI
    const providersWithCosts = [];
    Object.values(providerGroups).forEach(({ provider, indices }) => {
      indices.forEach((originalIndex, i) => {
        const costKey = `${provider._id}_${i}`;
        const providerCost = parseFloat(providerCosts[costKey]) || 0;
        
        totalCost += providerCost;
        
        providersWithCosts.push({
          ...provider,
          costProvider: providerCost,
          currency: saleCurrency
        });
      });
    });
    
    // Save providers array with costs
    const updatedInstance = {
      ...instance,
      providers: providersWithCosts,
      provider: providersWithCosts[0], // Keep first provider for backward compatibility
      cost: totalCost, // Update total cost
      costProvider: totalCost, // Update costProvider to match calculated total
      currency: saleCurrency // Use sale currency
    };
    
    console.log('🔧 ServiceTemplateInstanceEditor - Saving providers with costs:', {
      selectedProviders,
      providersWithCosts,
      totalCost,
      updatedInstance,
      providerCosts
    });
    
    onUpdate(updatedInstance);
    setShowProviderModal(false);
    toast.success(`${selectedProviders.length} provider(s) selected with costs`);
  };

  const handleDateSave = () => {
    saveField('checkIn', tempDates.checkIn);
    saveField('checkOut', tempDates.checkOut);
    setShowDateModal(false);
  };

  const renderFieldEditor = (field, label, currentValue, type = 'text') => {
    if (editingField !== field) {
      return (
        <div className="flex items-center justify-between group">
          <div className="flex-1">
            <span className="text-sm text-dark-400">{label}:</span>
            <div className="text-dark-100 font-medium">
              {field === 'provider' ? (
                instance.providers && instance.providers.length > 0 ? 
                  (() => {
                    // Group providers by name and count occurrences
                    const providerCounts = {};
                    instance.providers.forEach(p => {
                      // Handle both backend format (providerId.name) and frontend format (p.name)
                      const providerName = p.providerId?.name || p.name || 'Unknown Provider';
                      providerCounts[providerName] = (providerCounts[providerName] || 0) + 1;
                    });
                    
                    // Format providers with counts
                    return Object.entries(providerCounts)
                      .map(([name, count]) => `${name} × ${count}`)
                      .join(', ');
                  })() :
                  (currentValue?.name || 'No provider')
              ) : 
               field === 'destination' ? currentValue?.city || 'Not set' :
               field === 'cost' ? (
                 <div>
                   <div className="text-dark-100 font-medium">
                     {instance.currency} {currentValue || (instance.cost !== null && instance.cost !== undefined ? instance.cost : (instance.costProvider !== null && instance.costProvider !== undefined ? instance.costProvider : 0))}
                   </div>
                 </div>
               ) :
               field === 'checkIn' || field === 'checkOut' ? new Date(currentValue).toLocaleDateString() :
               currentValue || 'Not set'}
            </div>
          </div>
          <button
            onClick={() => startEditing(field, currentValue)}
            className="opacity-100 transition-opacity p-1 text-primary-400 hover:text-primary-300"
            title={`Edit ${label}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <label className="text-sm text-dark-400">{label}:</label>
        <div className="flex items-center space-x-2">
          {field === 'provider' ? (
            <div className="flex-1">
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const provider = availableProviders.find(p => 
                      p.name.toLowerCase().includes(editValue.toLowerCase())
                    );
                    if (provider) {
                      saveField('provider', provider);
                    }
                  } else if (e.key === 'Escape') {
                    cancelEditing();
                  }
                }}
                className="input-field text-sm"
                placeholder="Search provider..."
                autoFocus
              />
              <button
                onClick={() => setShowProviderModal(true)}
                className="mt-1 text-xs text-primary-400 hover:text-primary-300"
              >
                Browse all providers
              </button>
            </div>
          ) : field === 'destination' ? (
            <div className="flex-1">
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveField(field, editValue);
                  if (e.key === 'Escape') cancelEditing();
                }}
                className="input-field text-sm"
                placeholder="Enter city name"
                autoFocus
              />
            </div>
          ) : field === 'checkIn' || field === 'checkOut' ? (
            <div className="flex-1">
              <input
                type="date"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveField(field, editValue);
                  if (e.key === 'Escape') cancelEditing();
                }}
                className="input-field text-sm"
                autoFocus
              />
            </div>
          ) : field === 'cost' ? (
            <div className="flex-1 space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveField(field, editValue);
                    if (e.key === 'Escape') cancelEditing();
                  }}
                  className="input-field text-sm flex-1"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  autoFocus
                />
                <select
                  value={tempCurrency}
                  onChange={(e) => {
                    setTempCurrency(e.target.value);
                  }}
                  className="input-field text-sm w-20"
                >
                  <option value="USD">USD</option>
                  <option value="ARS">ARS</option>
                </select>
              </div>
              
            </div>
          ) : (
            <input
              type={type}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveField(field, editValue);
                if (e.key === 'Escape') cancelEditing();
              }}
              className="input-field text-sm flex-1"
              autoFocus
            />
          )}
          <button
            onClick={() => saveField(field, editValue)}
            disabled={loading}
            className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? '...' : '✓'}
          </button>
          <button
            onClick={cancelEditing}
            className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
          >
            ✕
          </button>
        </div>
        {error && <div className="text-red-400 text-xs">{error}</div>}
      </div>
    );
  };

  return (
    <div className="bg-dark-700/50 border border-white/10 rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-medium text-dark-100 mb-1">
            {instance.templateName} - {instance.serviceInfo}
          </h4>
          <div className="text-xs text-primary-400 bg-primary-500/20 px-2 py-1 rounded inline-block">
            {instance.templateCategory}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onDelete(instance.id)}
            className="text-red-400 hover:text-red-300 p-1"
            title="Remove service"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Editable Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Service Info */}
        {renderFieldEditor('serviceInfo', 'Service Details', instance.serviceInfo)}
        
        
        {/* Cost - Show actual provider cost, not client price */}
        <div className="flex items-center justify-between group">
          <div className="flex-1">
            <span className="text-sm text-dark-400">Cost:</span>
            <div className="text-dark-100 font-medium">
              {instance.currency} {(() => {
                // First priority: Use the calculated cost from providers (updated by modal)
                if (instance.cost !== null && instance.cost !== undefined) {
                  return instance.cost;
                }
                // Second priority: Display costProvider field directly from the service
                if (instance.costProvider !== null && instance.costProvider !== undefined) {
                  return instance.costProvider;
                }
                // Fallback: Calculate from providers array if neither cost nor costProvider is available
                if (instance.providers && instance.providers.length > 0) {
                  return instance.providers.reduce((total, provider) => {
                    return total + (parseFloat(provider.costProvider) || 0);
                  }, 0);
                }
                return 0;
              })()}
            </div>
            <div className="text-xs text-dark-400 mt-1">
              Total provider costs
            </div>
          </div>
          <button
            onClick={() => {
              const currentCost = (() => {
                if (instance.providers && instance.providers.length > 0) {
                  return instance.providers.reduce((total, provider) => {
                    return total + (parseFloat(provider.costProvider) || 0);
                  }, 0);
                }
                return 0;
              })();
              startEditing('cost', currentCost);
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-primary-400 hover:text-primary-300"
            title="Edit cost"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </div>
        
        {/* Dates */}
        <div className="space-y-2">
          <div className="flex items-center justify-between group">
            <div className="flex-1">
              <span className="text-sm text-dark-400">Dates:</span>
              <div className="text-dark-100 font-medium">
                {new Date(instance.checkIn).toLocaleDateString()} - {new Date(instance.checkOut).toLocaleDateString()}
              </div>
            </div>
            <button
              onClick={() => {
                setTempDates({
                  checkIn: instance.checkIn,
                  checkOut: instance.checkOut
                });
                setShowDateModal(true);
              }}
              className="opacity-100 transition-opacity p-1 text-primary-400 hover:text-primary-300"
              title="Edit dates"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Provider */}
        {renderFieldEditor('provider', 'Provider', instance.provider)}
        
        {/* City */}
        {renderFieldEditor('destination', 'City', instance.destination)}
      </div>

      {/* Provider Selection Modal */}
      {showProviderModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-dark-100 mb-4">
              Select Providers ({selectedProviders.length} selected)
            </h3>
            
            <div className="space-y-2 mb-4">
              <input
                type="text"
                placeholder="Search providers..."
                value={localProviderSearch}
                onChange={(e) => {
                  const value = e.target.value;
                  setLocalProviderSearch(value);
                  onProviderSearch(value);
                }}
                className="input-field w-full"
              />
            </div>
            
            {/* Selected Providers Section */}
            {selectedProviders.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-dark-200 mb-2">Selected Providers</h4>
                <div className="space-y-2">
                  {(() => {
                    // Group providers by ID and count instances
                    const providerGroups = {};
                    selectedProviders.forEach((provider, index) => {
                      if (!providerGroups[provider._id]) {
                        providerGroups[provider._id] = {
                          provider,
                          indices: []
                        };
                      }
                      providerGroups[provider._id].indices.push(index);
                    });

                    return Object.values(providerGroups).map(({ provider, indices }) => (
                      <div key={provider._id} className="bg-primary-500/10 border border-primary-500/30 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex-1">
                            <h5 className="font-medium text-dark-100">{provider.name}</h5>
                            <div className="text-sm text-dark-300">
                              {provider.phone && <span>Phone: {provider.phone}</span>}
                              {provider.email && <span className="ml-4">Email: {provider.email}</span>}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-primary-400 bg-primary-500/20 px-2 py-1 rounded">
                              {indices.length} selected
                            </span>
                            <button
                              onClick={() => removeProviderInstance(provider._id, indices.length - 1)}
                              className="text-red-400 hover:text-red-300 text-sm"
                              title="Remove one instance"
                            >
                              Remove 1
                            </button>
                          </div>
                        </div>
                        
                        {/* Cost Entry Section for each provider instance */}
                        <div className="space-y-2">
                          {indices.map((index, i) => {
                            const costKey = `${provider._id}_${i}`;
                            const currentCost = providerCosts[costKey] || '';
                            const currentCurrency = providerCosts[`${costKey}_currency`] || instance.currency || 'USD';
                            
                            return (
                              <div key={i} className="bg-dark-800/50 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs text-dark-400">Instance {i + 1} Cost:</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="number"
                                    value={currentCost}
                                    onChange={(e) => setProviderCosts(prev => ({
                                      ...prev,
                                      [costKey]: e.target.value
                                    }))}
                                    className="flex-1 px-3 py-2 bg-dark-700 border border-white/20 rounded-lg text-dark-100 focus:border-blue-500 focus:outline-none text-sm"
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0"
                                  />
                                  <select
                                    value={currentCurrency}
                                    onChange={(e) => setProviderCosts(prev => ({
                                      ...prev,
                                      [`${costKey}_currency`]: e.target.value
                                    }))}
                                    className="px-3 py-2 bg-dark-700 border border-white/20 rounded-lg text-dark-100 focus:border-blue-500 focus:outline-none text-sm"
                                    disabled
                                  >
                                    <option value={saleCurrency}>{saleCurrency}</option>
                                  </select>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}

            <div className="max-h-60 overflow-y-auto space-y-2">
              <h4 className="text-sm font-medium text-dark-200 mb-2">Available Providers</h4>
              {availableProviders.map((provider) => {
                const selectedCount = selectedProviders.filter(p => p._id === provider._id).length;
                
                // Get the global count from other services (excluding current modal selections)
                const otherServicesCount = getGlobalProviderCount ? getGlobalProviderCount(provider._id, instance.id) : 0;
                
                // Calculate real-time global count including current modal selections
                const realTimeGlobalCount = otherServicesCount + selectedCount;
                
                console.log('🔍 Real-time Global Count - Debug:', {
                  providerName: provider.name,
                  providerId: provider._id,
                  otherServicesCount,
                  selectedCount,
                  realTimeGlobalCount,
                  maxSelections: 7
                });
                
                const maxSelections = 7; // Global limit across all services
                const canSelectMore = realTimeGlobalCount < maxSelections;
                
                return (
                  <div
                    key={provider._id}
                    onClick={() => canSelectMore && handleProviderToggle(provider)}
                    className={`p-3 border rounded-lg transition-colors ${
                      !canSelectMore
                        ? 'opacity-50 cursor-not-allowed bg-dark-700/30 border-white/5'
                        : 'cursor-pointer border-white/10 hover:bg-dark-700/50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                          selectedCount > 0 
                            ? 'border-primary-500 bg-primary-500' 
                            : 'border-dark-400'
                        }`}>
                          {selectedCount > 0 && (
                            <span className="text-xs text-white font-medium">{selectedCount}</span>
                          )}
                        </div>
                        {selectedCount > 0 && canSelectMore && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleProviderToggle(provider);
                            }}
                            className="text-primary-400 hover:text-primary-300 text-sm"
                            title="Add another instance"
                          >
                            +
                          </button>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-dark-100">{provider.name}</h4>
                          {realTimeGlobalCount > 0 && (
                            <span className={`text-xs px-2 py-1 rounded ${
                              realTimeGlobalCount > maxSelections 
                                ? 'text-red-400 bg-red-500/20' 
                                : 'text-primary-400 bg-primary-500/20'
                            }`}>
                              Global: {Math.min(realTimeGlobalCount, maxSelections)}/{maxSelections}
                              {realTimeGlobalCount > maxSelections && ' (EXCEEDED!)'}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-dark-300">
                          {provider.phone && <span>Phone: {provider.phone}</span>}
                          {provider.email && <span className="ml-4">Email: {provider.email}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => setShowProviderModal(false)}
                className="px-4 py-2 text-dark-300 hover:text-dark-100"
              >
                Cancel
              </button>
              <button
                onClick={handleProviderSave}
                className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
                disabled={selectedProviders.length === 0}
              >
                Save ({selectedProviders.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Date Selection Modal */}
      {showDateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-dark-100 mb-4">Edit Dates</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-dark-400 mb-2">Check-in Date</label>
                <input
                  type="date"
                  value={tempDates.checkIn}
                  onChange={(e) => setTempDates(prev => ({ ...prev, checkIn: e.target.value }))}
                  className="input-field w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm text-dark-400 mb-2">Check-out Date</label>
                <input
                  type="date"
                  value={tempDates.checkOut}
                  onChange={(e) => setTempDates(prev => ({ ...prev, checkOut: e.target.value }))}
                  min={tempDates.checkIn}
                  className="input-field w-full"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowDateModal(false)}
                className="px-4 py-2 text-dark-300 hover:text-dark-100"
              >
                Cancel
              </button>
              <button
                onClick={handleDateSave}
                className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
              >
                Save Dates
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceTemplateInstanceEditor;
