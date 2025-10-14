import React from 'react';

const NewSaleWizardSteps = ({
  currentStep,
  // Service Template Data
  serviceTemplates,
  availableServiceTemplates,
  serviceTemplateInstances,
  serviceLoading,
  currentServiceTemplate,
  currentServiceInfo,
  currentServiceDates,
  currentServiceCost,
  currentServiceCurrency,
  currentServiceExchangeRate,
  setCurrentServiceExchangeRate,
  currentServiceProvider,
  currentServiceProviders,
  addProviderToCurrentService,
  removeProviderFromCurrentService,
  // Destination Data
  destination,
  citySuggestions,
  countrySuggestions,
  // Passenger Data
  selectedPassengers,
  selectedCompanions,
  availablePassengers,
  availableCompanions,
  allForSelection,
  passengerSearch,
  companionSearch,
  passengerLoading,
  companionLoading,
  companionsFetched,
  // Provider Data
  availableProviders,
  providerSearch,
  providerLoading,
  expandedProviders,
  providerFormData,
  // Functions
  setCurrentStep,
  selectServiceTemplate,
  setCurrentServiceInfo,
  setCurrentServiceDates,
  setCurrentServiceCost,
  setCurrentServiceCurrency,
  setCurrentServiceProvider,
  setCurrentServiceProviders,
  addServiceInstance,
  removeServiceInstance,
  editServiceInstance,
  currentServiceInstance,
  setCurrentServiceInstance,
  setCurrentServiceTemplate,
  setDestination,
  searchCities,
  searchCountries,
  setCitySuggestions,
  setCountrySuggestions,
  togglePassengerSelection,
  removeSelectedPassenger,
  toggleCompanionSelection,
  removeSelectedCompanion,
  setPassengerSearch,
  setCompanionSearch,
  toggleProviderSelection,
  removeSelectedProvider,
  toggleProviderExpansion,
  updateProviderFormData,
  getProviderFormData,
  convertProviderAmountToUSD,
  handleProviderFileUpload,
  openFileModal,
  closeFileModal,
  openFile,
  showFileModal,
  selectedProviderFiles,
  // Service Template Modal
  showAddServiceTemplateModal,
  setShowAddServiceTemplateModal,
  onServiceTemplateAdded,
  // Service Template Search
  serviceTemplateSearch,
  setServiceTemplateSearch,
  // Service Instance Management
  updateServiceInstance,
  // Template Editing
  editingTemplate,
  setEditingTemplate,
  updateServiceTemplate,
  // Price per Passenger
  pricePerPassenger,
  setPricePerPassenger,
  passengerCurrency,
  setPassengerCurrency,
  passengerExchangeRate,
  setPassengerExchangeRate,
  passengerConvertedAmount,
  // Provider Search
  setProviderSearch
}) => {
  return (
    <>
      {/* Step 1: Select Passengers */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-dark-100">Select Passengers</h3>
          <p className="text-sm text-dark-400">Choose passengers for this sale</p>
          
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search passengers by name, phone, or passport number..."
              value={passengerSearch ?? ''}
              onChange={(e) => setPassengerSearch(e.target.value)}
              className="input-field w-full pl-10"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                  </div>
              </div>

          {/* Selected Passengers */}
          {selectedPassengers.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-md font-medium text-dark-100">Selected Passengers</h4>
              <div className="grid grid-cols-1 gap-3">
                {selectedPassengers.map((passenger) => (
                  <div key={passenger._id} className="bg-dark-700/50 border border-white/10 rounded-lg p-4 relative">
                    <button
                      onClick={() => removeSelectedPassenger(passenger._id)}
                      className="absolute top-2 right-2 text-red-400 hover:text-red-300 text-sm"
                    >
                      ✕
                    </button>
                    <h5 className="font-medium mb-2 text-dark-100">{passenger.name} {passenger.surname}</h5>
                    <div className="text-sm space-y-2 text-dark-300">
                      {passenger.phone && (
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <span>{passenger.phone}</span>
              </div>
                      )}
                      {passenger.passportNumber && (
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                          </svg>
                          <span>{passenger.passportNumber}</span>
            </div>
          )}
                      {passenger.email && (
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span>{passenger.email}</span>
                  </div>
                      )}
                </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Available Passengers */}
          <div className="space-y-3 mb-6">
            <h4 className="text-md font-medium text-dark-100">
              Available Passengers {passengerLoading && <span className="text-sm text-dark-400">(Loading...)</span>}
            </h4>
            
            {availablePassengers.length === 0 && !passengerLoading ? (
              <div className="text-center py-8 text-dark-400">
                <p>No passengers found. Try adjusting your search or register new passengers first.</p>
                </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                {availablePassengers
                  .filter(passenger => !selectedPassengers.find(selected => selected._id === passenger._id))
                  .map((passenger) => (
                    <div
                      key={passenger._id}
                      onClick={() => togglePassengerSelection(passenger)}
                      className="rounded-lg p-4 transition-colors bg-dark-700/50 border border-white/10 cursor-pointer hover:bg-dark-600/50 hover:border-primary-500/30"
                    >
                      <h5 className="font-medium mb-2 text-dark-100">
                        {passenger.name} {passenger.surname}
                      </h5>
                      <div className="text-sm space-y-2 text-dark-300">
                        {passenger.phone && (
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <span>{passenger.phone}</span>
              </div>
            )}
                        {passenger.passportNumber && (
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                            </svg>
                            <span>{passenger.passportNumber}</span>
          </div>
                        )}
                        {passenger.email && (
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span>{passenger.email}</span>
        </div>
      )}
          </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Companion Selection */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-dark-100">Acompañante Selection</h3>
          <p className="text-sm text-dark-400">Review and manage acompañantes and additional acompañantes for your sale</p>
          
          {/* Selected Passengers Summary */}
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <h4 className="font-medium text-dark-100 mb-3 flex items-center">
                <svg className="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              Selected Passengers ({selectedPassengers.length})
              </h4>
              <div className="space-y-2">
              {selectedPassengers.map((passenger) => (
                <div key={passenger._id} className="text-sm text-dark-300 bg-dark-700/30 rounded p-2">
                  <span className="text-green-400 font-medium">•</span> {passenger.name} {passenger.surname}
                  <span className="text-dark-400 ml-2">({passenger.phone})</span>
                  </div>
                ))}
              </div>
            </div>
            
          {/* Auto-Selected Companions */}
          {selectedCompanions.length > 0 && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <h4 className="font-medium text-dark-100 mb-3 flex items-center">
                <svg className="w-5 h-5 text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                Auto-Selected Acompañantes ({selectedCompanions.length})
              </h4>
              <div className="space-y-2">
                {selectedCompanions.map((companion) => (
                  <div key={companion._id} className="text-sm text-dark-300 bg-dark-700/30 rounded p-2 flex items-center justify-between">
            <div>
                      <span className="text-blue-400 font-medium">•</span> {companion.name} {companion.surname}
                      <span className="text-dark-400 ml-2">({companion.phone})</span>
            </div>
                    <button
                      onClick={() => removeSelectedCompanion(companion._id)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-xs text-blue-300">
                These acompañantes were automatically selected based on your passenger choice. You can remove them if needed.
          </div>
        </div>
      )}

          {/* Additional Passengers Search */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-dark-100">Add Additional Acompañantes</h4>
            <p className="text-sm text-dark-400">Search and select additional acompañantes from the database</p>
            
            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search additional acompañantes by name, phone, or passport number..."
                value={companionSearch ?? ''}
                onChange={(e) => setCompanionSearch(e.target.value)}
                className="input-field w-full pl-10"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                  </div>
                </div>
            
            {/* Available Companions */}
            <div className="space-y-3">
              <h4 className="text-md font-medium text-dark-100">
                Available Acompañantes {companionLoading && <span className="text-sm text-dark-400">(Loading...)</span>}
              </h4>
              
              {availableCompanions.length === 0 && !companionLoading ? (
                <div className="text-center py-8 text-dark-400">
                  <p>No acompañantes found. Try adjusting your search.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                  {availableCompanions
                    .filter(companion => !selectedCompanions.find(selected => selected._id === companion._id))
                    .map((companion) => (
                      <div
                        key={companion._id}
                        onClick={() => toggleCompanionSelection(companion)}
                        className="rounded-lg p-4 transition-colors bg-dark-700/50 border border-white/10 cursor-pointer hover:bg-dark-600/50 hover:border-primary-500/30"
                      >
                        <h5 className="font-medium mb-2 text-dark-100">
                          {companion.name} {companion.surname}
                        </h5>
                        <div className="text-sm space-y-2 text-dark-300">
                          {companion.phone && (
                            <div className="flex items-center space-x-2">
                              <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              <span>{companion.phone}</span>
                    </div>
                          )}
                          {companion.passportNumber && (
                            <div className="flex items-center space-x-2">
                              <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                              </svg>
                              <span>{companion.passportNumber}</span>
                </div>
              )}
                          {companion.email && (
                            <div className="flex items-center space-x-2">
                              <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              <span>{companion.email}</span>
            </div>
            )}
                        </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Price Per Passenger */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-dark-100">Price Per Passenger</h3>
          <p className="text-sm text-dark-400">Set the price per passenger for this sale</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">
                Price Per Passenger *
              </label>
              <input
                type="number"
                value={pricePerPassenger}
                onChange={(e) => setPricePerPassenger(e.target.value)}
                className="input-field"
                placeholder="0.00"
                step="0.01"
                min="0"
                required
              />
            <p className="text-xs text-dark-400 mt-1">
                Enter the price per passenger for this sale
            </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">
                Currency *
              </label>
              <select
                value={passengerCurrency}
                onChange={(e) => setPassengerCurrency(e.target.value)}
                className="input-field"
              >
                <option value="USD">USD - US Dollar</option>
                <option value="ARS">ARS - Argentine Peso</option>
              </select>
              <p className="text-xs text-dark-400 mt-1">
                Select the currency for the price
              </p>
            </div>
          </div>

          {/* Currency Conversion Section */}
          {passengerCurrency === 'ARS' && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <svg className="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h4 className="font-medium text-green-300">Currency Conversion</h4>
              </div>
              <p className="text-sm text-green-200 mb-4">
                Since you selected ARS, please provide the exchange rate to convert to USD. The amount will be stored in USD in the database for consistency.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-green-200 mb-2">
                    Exchange Rate (1 USD = ? ARS) *
                  </label>
                  <input
                    type="number"
                    value={passengerExchangeRate}
                    onChange={(e) => setPassengerExchangeRate(e.target.value)}
                    className="input-field"
                    placeholder="e.g., 6"
                    min="0.01"
                    step="0.01"
                    required={passengerCurrency === 'ARS'}
                  />
                </div>
                  <div>
                    <label className="block text-sm font-medium text-green-200 mb-2">
                      Converted Amount (USD)
                    </label>
                  <input
                    type="text"
                    value={passengerConvertedAmount ? `U$${passengerConvertedAmount.toFixed(2)} USD` : 'U$0.00 USD'}
                    className="input-field bg-dark-700 text-green-100"
                    readOnly
              />
            </div>
                    </div>
                  </div>
                )}

          {/* Summary */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-blue-300">
                <strong>Total for {selectedPassengers.length + selectedCompanions.length} passenger{(selectedPassengers.length + selectedCompanions.length) > 1 ? 's' : ''}:</strong> {passengerCurrency} {pricePerPassenger || '0'} × {selectedPassengers.length + selectedCompanions.length} = {passengerCurrency} {((parseFloat(pricePerPassenger) || 0) * (selectedPassengers.length + selectedCompanions.length)).toFixed(2)}
                {passengerConvertedAmount && (
                  <span className="ml-2">(U${(passengerConvertedAmount * (selectedPassengers.length + selectedCompanions.length)).toFixed(2)} USD)</span>
                )}
                <br />
                <span className="text-xs text-blue-200">
                  ({selectedPassengers.length} main passenger{selectedPassengers.length !== 1 ? 's' : ''} + {selectedCompanions.length} companion{selectedCompanions.length !== 1 ? 's' : ''})
                </span>
              </p>
            </div>
              </div>
            </div>
          )}

      {/* Step 4: Select Service Template */}
      {currentStep === 4 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-dark-100">Select Service Template</h3>
              <p className="text-sm text-dark-400">Review and manage service templates for your sale</p>
            </div>
            <button
              onClick={() => setShowAddServiceTemplateModal(true)}
              className="text-xs text-primary-400 hover:text-primary-300 underline whitespace-nowrap"
            >
              + Add New Service Template
            </button>
          </div>

          {/* Selected Templates Section */}
          {serviceTemplateInstances.length > 0 && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <h4 className="font-medium text-dark-100 mb-3 flex items-center">
                <svg className="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Selected Templates ({serviceTemplateInstances.length})
              </h4>
              <div className="space-y-2">
                {serviceTemplateInstances.map((instance, index) => (
                  <div key={instance.id} className="flex items-center justify-between text-sm text-dark-300 bg-dark-700/30 rounded p-2">
                    <div className="flex items-center">
                      <span className="text-green-400 font-medium mr-2">{index + 1}.</span>
                      <span>{instance.templateName || instance.serviceInfo}</span>
                      <span className="text-xs px-2 py-1 bg-primary-500/20 text-primary-400 rounded ml-2">
                        {instance.templateCategory || 'Template'}
                      </span>
                      {instance.destination?.city && (
                        <span className="text-dark-400 ml-2">({instance.destination.city})</span>
                      )}
                      {instance.isTemplateOnly && (
                        <span className="text-xs text-yellow-400 ml-2">(Template Only)</span>
                      )}
                    </div>
                    <button
                      onClick={() => removeServiceInstance(instance.id)}
                      className="text-red-400 hover:text-red-300 text-xs"
                    >
                      ✕
                    </button>
                    </div>
                  ))}
                </div>
        </div>
      )}

          {/* Search Section */}
          <div className="space-y-3">
            <h4 className="text-md font-medium text-dark-100">
              Search and select service templates from the database
            </h4>
            <div className="relative">
              <input
                type="text"
                placeholder="Search service templates by name, category, or description..."
                value={serviceTemplateSearch || ''}
                onChange={(e) => setServiceTemplateSearch(e.target.value)}
                className="input-field w-full pl-10"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Available Templates Section */}
          <div className="space-y-3">
            <h4 className="text-md font-medium text-dark-100">
              Available Templates {serviceLoading && <span className="text-sm text-dark-400">(Loading...)</span>}
            </h4>
            
            {(() => {
              const filteredTemplates = availableServiceTemplates.filter(template => {
                const isNotSelected = !serviceTemplateInstances.find(instance => instance.templateId === template._id);
                
                if (serviceTemplateSearch && serviceTemplateSearch.trim()) {
                  const searchTerm = serviceTemplateSearch.toLowerCase().trim();
                  const matchesName = template.name?.toLowerCase().includes(searchTerm);
                  const matchesCategory = template.category?.toLowerCase().includes(searchTerm);
                  const matchesDescription = template.description?.toLowerCase().includes(searchTerm);
                  
                  return isNotSelected && (matchesName || matchesCategory || matchesDescription);
                }
                
                return isNotSelected;
              });
              
              return filteredTemplates.length === 0 && !serviceLoading ? (
                <div className="text-center py-8 text-dark-400">
                  {serviceTemplateSearch && serviceTemplateSearch.trim() ? (
                    <div>
                      <p>No service templates found matching "{serviceTemplateSearch}"</p>
                      <p className="text-sm mt-2">Try adjusting your search or add a new service template.</p>
                    </div>
                  ) : (
                    <p>No service templates available. Add a new service template to get started.</p>
                  )}
                </div>
              ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                {availableServiceTemplates
                  .filter(template => {
                    // First filter out already selected templates
                    const isNotSelected = !serviceTemplateInstances.find(instance => instance.templateId === template._id);
                    
                    // Then apply search filter if search term exists
                    if (serviceTemplateSearch && serviceTemplateSearch.trim()) {
                      const searchTerm = serviceTemplateSearch.toLowerCase().trim();
                      const matchesName = template.name?.toLowerCase().includes(searchTerm);
                      const matchesCategory = template.category?.toLowerCase().includes(searchTerm);
                      const matchesDescription = template.description?.toLowerCase().includes(searchTerm);
                      
                      return isNotSelected && (matchesName || matchesCategory || matchesDescription);
                    }
                    
                    return isNotSelected;
                  })
                  .map((template) => (
                    <div key={template._id} className="p-4 border rounded-lg bg-dark-700/50 border-white/10 hover:bg-dark-600/50 hover:border-primary-500/30">
                      <div className="flex items-center justify-between mb-2">
                        <div 
                          onClick={() => selectServiceTemplate(template)}
                          className="flex-1 cursor-pointer"
                        >
                          <h5 className="font-medium text-dark-100">{template.name}</h5>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTemplate(template);
                          }}
                          className="text-primary-400 hover:text-primary-300 p-1 rounded hover:bg-primary-500/10"
                          title="Edit template"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                    </div>
                      <div 
                        onClick={() => selectServiceTemplate(template)}
                        className="cursor-pointer"
                      >
                        {template.description && (
                          <p className="text-sm text-dark-300 line-clamp-2">{template.description}</p>
              )}
            </div>
                    </div>
                  ))}
              </div>
              );
            })()}
          </div>
        </div>
      )}



      {/* Step 5: Service Dates */}
      {currentStep === 5 && (
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-dark-100">Service Dates</h3>
          <p className="text-sm text-dark-400">Set check-in and check-out dates for this service</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">
                Check-in Date *
              </label>
              <input
                type="date"
                value={currentServiceDates.checkIn}
                onChange={(e) => setCurrentServiceDates(prev => ({ ...prev, checkIn: e.target.value }))}
                className="input-field"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">
                Check-out Date *
              </label>
              <input
                type="date"
                value={currentServiceDates.checkOut}
                onChange={(e) => setCurrentServiceDates(prev => ({ ...prev, checkOut: e.target.value }))}
                className="input-field"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">
                City *
              </label>
              <input
                type="text"
                value={destination.city}
                onChange={(e) => setDestination(prev => ({ ...prev, city: e.target.value }))}
                className="input-field"
                placeholder="Enter city name"
                required
              />
            </div>
            </div>
          </div>
      )}



      {/* Step 7: Service Provider */}
      {currentStep === 7 && (
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-dark-100">Service Provider</h3>
          <p className="text-sm text-dark-400">Select a provider for this service</p>
          
          {/* Information about saved data */}
          {serviceTemplateInstances.length > 0 && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6">
              <div className="flex items-center mb-2">
                <svg className="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h4 className="font-medium text-green-300">Service Information Saved Successfully</h4>
              </div>
              <p className="text-sm text-green-200">
                All the information you entered in steps 1-6 has been saved and is shown below. 
                You can edit any service by clicking the edit icon, or add more services to create a comprehensive travel package.
              </p>
            </div>
          )}
          
          {/* Current Service Summary - Show if service is configured */}
          {currentServiceTemplate && currentServiceInfo && currentServiceDates.checkIn && currentServiceDates.checkOut && currentServiceCost && currentServiceProvider && (
            <div className="bg-primary-500/10 border border-primary-500/30 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-dark-100 mb-2">
                {currentServiceInstance ? 'Service Comparison (Old vs New)' : 'Current Service (Ready to Add)'}
              </h4>
              
              {currentServiceInstance ? (
                <div className="space-y-3">
                  {/* Comparison Table */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Old Values */}
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                      <h5 className="text-sm font-medium text-red-300 mb-2">Previous Values</h5>
                      <div className="text-xs text-dark-300 space-y-1">
                        <div><span className="text-red-400">Details:</span> {currentServiceInstance.serviceInfo}</div>
                        <div><span className="text-red-400">Dates:</span> {currentServiceInstance.checkIn} to {currentServiceInstance.checkOut}</div>
                        <div><span className="text-red-400">Destination:</span> {currentServiceInstance.destination.city}</div>
                        <div><span className="text-red-400">Cost:</span> {currentServiceInstance.originalCurrency || currentServiceInstance.currency} {parseFloat(currentServiceInstance.originalAmount || currentServiceInstance.cost).toFixed(2)}</div>
                        <div><span className="text-red-400">Provider(s):</span> {currentServiceInstance.providers && currentServiceInstance.providers.length > 0 ? currentServiceInstance.providers.map(p => p.name || p.providerId?.name).join(', ') : currentServiceInstance.provider?.name || 'None'}</div>
                      </div>
                    </div>
                    
                    {/* New Values */}
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                      <h5 className="text-sm font-medium text-green-300 mb-2">New Values</h5>
                      <div className="text-xs text-dark-300 space-y-1">
                        <div><span className="text-green-400">Details:</span> {currentServiceInfo}</div>
                        <div><span className="text-green-400">Dates:</span> {currentServiceDates.checkIn} to {currentServiceDates.checkOut}</div>
                        <div><span className="text-green-400">Destination:</span> {destination.city}</div>
                        <div><span className="text-green-400">Cost:</span> {currentServiceCurrency} {parseFloat(currentServiceCost).toFixed(2)}</div>
                        <div><span className="text-green-400">Provider(s):</span> {currentServiceProviders.length > 0 ? currentServiceProviders.map(p => p.name).join(', ') : currentServiceProvider?.name || 'None'}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-primary-300">
                    Review the changes above and click "Update This Service" to save the new values.
                  </div>
                </div>
              ) : (
                <div className="text-sm text-dark-300 space-y-1">
                  <div><span className="text-primary-400">Template:</span> {currentServiceTemplate.name}</div>
                  <div><span className="text-primary-400">Details:</span> {currentServiceInfo}</div>
                  <div><span className="text-primary-400">Dates:</span> {currentServiceDates.checkIn} to {currentServiceDates.checkOut}</div>
                  <div><span className="text-primary-400">Destination:</span> {destination.city}</div>
                  <div><span className="text-primary-400">Cost:</span> {currentServiceCurrency} {parseFloat(currentServiceCost).toFixed(2)}</div>
                  <div><span className="text-primary-400">Provider:</span> {currentServiceProvider?.name}</div>
                </div>
              )}
              
              <div className="mt-3 text-xs text-primary-300">
                {currentServiceInstance 
                  ? 'Review the comparison above and click "Update This Service" to save your changes.'
                  : 'This service is configured and ready to be added to your sale.'
                }
              </div>
            </div>
          )}

          {/* Editing Notice */}
          {currentServiceInstance && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
              <div className="flex items-center mb-2">
                <svg className="w-5 h-5 text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <h4 className="font-medium text-blue-300">Editing Service: {currentServiceInstance.templateName}</h4>
              </div>
              <p className="text-sm text-blue-200">
                You are currently editing an existing service. Use the "Update This Service" button below to save your changes, 
                or navigate back to the form to modify the values.
              </p>
            </div>
          )}

          {/* Add Service Button */}
          <div className="flex space-x-4">
            {currentServiceTemplate && currentServiceInfo && currentServiceDates.checkIn && currentServiceDates.checkOut && currentServiceCost && currentServiceProvider ? (
              <>
                <button
                  onClick={addServiceInstance}
                  className="btn-primary"
                >
                  {currentServiceInstance ? 'Update This Service' : 'Add This Service'}
                </button>
                <button
                  onClick={() => setCurrentStep(1)}
                  className="btn-secondary"
                >
                  Add Another Service
                </button>
              </>
            ) : (
              <button
                onClick={() => setCurrentStep(1)}
                className="btn-primary"
              >
                {serviceTemplateInstances.length > 0 ? 'Add Another Service' : 'Configure Your First Service'}
              </button>
            )}
          </div>

          {/* Service Instances List */}
          {serviceTemplateInstances.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-md font-medium text-dark-100">Added Services ({serviceTemplateInstances.length})</h4>
              <div className="space-y-3">
                {serviceTemplateInstances.map((instance) => (
                  <div key={instance.id} className="bg-dark-700/50 border border-white/10 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h5 className="font-medium text-dark-100 mb-2">{instance.templateName}</h5>
                        <div className="text-sm text-dark-300 space-y-1">
                          <div><span className="text-primary-400">Details:</span> {instance.serviceInfo || 'Not specified'}</div>
                          <div><span className="text-primary-400">Dates:</span> {instance.checkIn && instance.checkOut ? `${instance.checkIn} to ${instance.checkOut}` : 'Not specified'}</div>
                          <div><span className="text-primary-400">Destination:</span> {instance.destination?.city || 'Not specified'}</div>
                          <div><span className="text-primary-400">Cost:</span> {instance.originalCurrency || instance.currency} {parseFloat(instance.originalAmount || instance.cost || 0).toFixed(2)}</div>
                          <div><span className="text-primary-400">Provider(s):</span> {instance.providers && instance.providers.length > 0 ? instance.providers.map(p => p.name || p.providerId?.name).join(', ') : instance.provider?.name || 'None'}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => editServiceInstance(instance)}
                          className="text-blue-400 hover:text-blue-300 p-1"
                          title="Edit service"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => removeServiceInstance(instance.id)}
                          className="text-red-400 hover:text-red-300 p-1"
                          title="Remove service"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 6: Service Cost */}
      {currentStep === 6 && (
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-dark-100">Service Cost</h3>
          <p className="text-sm text-dark-400">Set the cost for this service</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">
                Cost *
              </label>
            <input
                type="number"
                value={currentServiceCost}
                onChange={(e) => setCurrentServiceCost(e.target.value)}
                className="input-field"
                placeholder="0.00"
                step="0.01"
                min="0"
                required
              />
          </div>

            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">
                Currency
              </label>
              <select
                value={currentServiceCurrency}
                onChange={(e) => {
                  setCurrentServiceCurrency(e.target.value);
                  // Reset exchange rate when switching away from ARS
                  if (e.target.value !== 'ARS') {
                    setCurrentServiceExchangeRate('');
                  }
                }}
                className="input-field"
              >
                <option value="USD">USD - US Dollar</option>
                <option value="ARS">ARS - Argentine Peso</option>
              </select>
                        </div>
                        </div>

          {/* Exchange Rate Input for ARS */}
          {currentServiceCurrency === 'ARS' && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <svg className="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
                <h4 className="text-lg font-semibold text-green-300">Currency Conversion</h4>
            </div>
              <p className="text-sm text-green-200 mb-4">
                Since you selected ARS, please provide the exchange rate to convert to USD. 
                The amount will be stored in USD in the database for consistency.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-green-200 mb-2">
                    Exchange Rate (1 USD = ? ARS) *
                  </label>
                  <input
                    type="number"
                    value={currentServiceExchangeRate}
                    onChange={(e) => setCurrentServiceExchangeRate(e.target.value)}
                    className="input-field"
                    placeholder="e.g., 1000"
                    step="0.01"
                    min="0"
                    required
                  />
          </div>

                {currentServiceCost && currentServiceExchangeRate && (
                  <div>
                    <label className="block text-sm font-medium text-green-200 mb-2">
                      Converted Amount (USD)
                    </label>
                    <div className="input-field bg-dark-700 text-dark-100 cursor-not-allowed">
                      U${(parseFloat(currentServiceCost) / parseFloat(currentServiceExchangeRate)).toFixed(2)} USD
                  </div>
              </div>
                )}
              </div>
            </div>
          )}
            </div>
          )}

      {/* Step 7: Service Provider */}
      {currentStep === 7 && (
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-dark-100">Service Provider</h3>
          <p className="text-sm text-dark-400">Select a provider for this service</p>
          
          {/* Selected Providers - Display at top */}
          {currentServiceProviders.length > 0 && (
            <div id="selected-providers" className="bg-primary-500/10 border border-primary-500/30 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-dark-100 mb-3">
                Selected Providers ({currentServiceProviders.length})
              </h4>
            <div className="space-y-3">
                {currentServiceProviders.map((provider) => (
                  <div key={provider._id} className="bg-dark-700/50 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h5 className="font-medium text-dark-100 mb-1">{provider.name}</h5>
                        <div className="text-sm text-dark-300 space-y-1">
                          {provider.type && (
                        <div className="flex items-center space-x-2">
                              <span className="text-primary-400">Type:</span>
                              <span>{provider.type}</span>
                        </div>
                      )}
                          {provider.phone && (
                        <div className="flex items-center space-x-2">
                              <span className="text-primary-400">Phone:</span>
                              <span>{provider.phone}</span>
                        </div>
                      )}
                          {provider.email && (
                        <div className="flex items-center space-x-2">
                              <span className="text-primary-400">Email:</span>
                              <span>{provider.email}</span>
                        </div>
                      )}
                        </div>
                      </div>
                      <button
                        onClick={() => removeProviderFromCurrentService(provider._id)}
                        className="text-red-400 hover:text-red-300 ml-2"
                        title="Remove provider"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    
                    {/* File Upload Section for Selected Provider */}
                    <div className="border-t border-white/10 pt-3">
                      <div className="flex items-center justify-between mb-3">
                        <h6 className="text-sm font-medium text-dark-200">Files for {provider.name}</h6>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleProviderFileUpload(provider._id)}
                            className="text-green-400 hover:text-green-300 text-sm flex items-center space-x-1 px-3 py-1 border border-green-400/30 rounded hover:bg-green-400/10 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <span>Upload</span>
                          </button>
                          <button
                            onClick={() => openFileModal(provider._id)}
                            className="text-blue-400 hover:text-blue-300 text-sm flex items-center space-x-1 px-3 py-1 border border-blue-400/30 rounded hover:bg-blue-400/10 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span>View</span>
                          </button>
                        </div>
                      </div>
                      
                      {/* File Upload Area */}
                      <div
                        onClick={() => handleProviderFileUpload(provider._id)}
                        className="border-2 border-dashed border-primary-500/30 rounded-lg p-4 text-center cursor-pointer hover:border-primary-500/50 transition-colors"
                      >
                        <svg className="w-8 h-8 text-primary-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-sm text-dark-300">Click to upload files for {provider.name}</p>
                        <p className="text-xs text-dark-400 mt-1">PDF, DOC, DOCX, JPG, PNG (Max 10MB each)</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Provider Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search providers..."
              value={providerSearch}
              onChange={(e) => setProviderSearch(e.target.value)}
              className="input-field w-full pl-10"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Available Providers */}
          <div className="space-y-3">
            <h4 className="text-md font-medium text-dark-100">
              Available Providers {providerLoading && <span className="text-sm text-dark-400">(Loading...)</span>}
            </h4>
            
            {availableProviders.length === 0 && !providerLoading ? (
              <div className="text-center py-8 text-dark-400">
                <p>No providers found. Try adjusting your search.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                {availableProviders
                  .filter(provider => {
                    // Apply search filter if search term exists
                    if (providerSearch && providerSearch.trim()) {
                      const searchTerm = providerSearch.toLowerCase().trim();
                      const matchesName = provider.name?.toLowerCase().includes(searchTerm);
                      const matchesEmail = provider.email?.toLowerCase().includes(searchTerm);
                      const matchesType = provider.type?.toLowerCase().includes(searchTerm);
                      
                      return matchesName || matchesEmail || matchesType;
                    }
                    
                    return true;
                  })
                  .map((provider) => {
                    const isSelected = currentServiceProviders.some(p => p._id === provider._id);
                    
                    return (
                      <div
                        key={provider._id}
                        onClick={() => {
                          addProviderToCurrentService(provider);
                          // Scroll to top of selected providers section
                          setTimeout(() => {
                            const selectedProvidersElement = document.getElementById('selected-providers');
                            if (selectedProvidersElement) {
                              selectedProvidersElement.scrollIntoView({ 
                                behavior: 'smooth', 
                                block: 'start' 
                              });
                            }
                          }, 100);
                        }}
                        className={`rounded-lg p-4 transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-primary-500/20 border-primary-500/50 border-2'
                            : 'bg-dark-700/50 border border-white/10 hover:bg-dark-600/50 hover:border-primary-500/30'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h5 className="font-medium mb-2 text-dark-100">{provider.name}</h5>
                            <div className="text-sm space-y-1 text-dark-300">
                              {provider.type && (
                          <div className="flex items-center space-x-2">
                                  <span className="text-primary-400">Type:</span>
                                  <span>{provider.type}</span>
                          </div>
                        )}
                              {provider.phone && (
                          <div className="flex items-center space-x-2">
                                  <span className="text-primary-400">Phone:</span>
                                  <span>{provider.phone}</span>
                          </div>
                        )}
                              {provider.email && (
                          <div className="flex items-center space-x-2">
                                  <span className="text-primary-400">Email:</span>
                                  <span>{provider.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                          <div className="ml-2">
                            {isSelected ? (
                              <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      )}


      {/* Step 8: Add More Services */}
      {currentStep === 8 && (
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-dark-100">Add More Services</h3>
          <p className="text-sm text-dark-400">Add additional services to your sale</p>
          
          {/* Current Services Summary */}
          {serviceTemplateInstances.length > 0 && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <h4 className="font-medium text-dark-100 mb-3 flex items-center">
              <svg className="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
                Current Services ({serviceTemplateInstances.length})
            </h4>
            <div className="space-y-2">
                {serviceTemplateInstances.map((instance, index) => (
                  <div key={instance.id} className="text-sm text-dark-300 bg-dark-700/30 rounded p-2">
                    <span className="text-green-400 font-medium">•</span> {index + 1}. {instance.templateName}
                    <span className="text-dark-400 ml-2">({instance.serviceInfo})</span>
                    <span className="text-dark-400 ml-2">- {instance.originalCurrency || instance.currency} {parseFloat(instance.originalAmount || instance.cost || 0).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
          )}

          {/* Add Another Service */}
          <div className="bg-primary-500/10 border border-primary-500/30 rounded-lg p-6">
            <h4 className="font-medium text-dark-100 mb-4 flex items-center">
              <svg className="w-5 h-5 text-primary-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              Add Another Service
              </h4>
            <p className="text-sm text-dark-300 mb-4">
              You can add more services to create a comprehensive travel package. Each service can have different dates, destinations, and providers.
            </p>
            
                    <button
              onClick={() => {
                // Reset all form fields for new service
                setCurrentServiceInstance(null);
                setCurrentServiceTemplate(null);
                setCurrentServiceInfo('');
                setCurrentServiceDates({ checkIn: '', checkOut: '' });
                setCurrentServiceCost('');
                setCurrentServiceCurrency('USD');
                setCurrentServiceExchangeRate('');
                setCurrentServiceProvider(null);
                setCurrentServiceProviders([]);
                setDestination({ city: '', country: '' });
                // Navigate to step 4
                setCurrentStep(4);
              }}
              className="btn-primary flex items-center justify-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add New Service
                    </button>
                  </div>

          {/* Service Management */}
          {serviceTemplateInstances.length > 0 && (
          <div className="space-y-4">
              <h4 className="text-md font-medium text-dark-100">Manage Services</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {serviceTemplateInstances.map((instance, index) => (
                  <div key={instance.id} className="bg-dark-700/50 border border-white/10 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h5 className="font-medium text-dark-100 mb-1">
                          {index + 1}. {instance.templateName}
              </h5>
                        <p className="text-sm text-dark-300">{instance.serviceInfo}</p>
                </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => editServiceInstance(instance)}
                          className="text-blue-400 hover:text-blue-300 p-1"
                          title="Edit service"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                        </button>
                        <button
                          onClick={() => removeServiceInstance(instance.id)}
                          className="text-red-400 hover:text-red-300 p-1"
                          title="Remove service"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                        </button>
                            </div>
                    </div>
                    
                    <div className="text-xs text-dark-400 space-y-1">
                      <div><span className="text-primary-400">Dates:</span> {instance.checkIn && instance.checkOut ? `${instance.checkIn} to ${instance.checkOut}` : 'Not specified'}</div>
                      <div><span className="text-primary-400">Destination:</span> {instance.destination?.city || 'Not specified'}</div>
                      <div><span className="text-primary-400">Cost:</span> {instance.originalCurrency || instance.currency} {parseFloat(instance.originalAmount || instance.cost || 0).toFixed(2)}</div>
                      <div><span className="text-primary-400">Providers:</span> {instance.providers && instance.providers.length > 0 ? instance.providers.map(p => p.name).join(', ') : 'None'}</div>
                        </div>
                      </div>
                    ))}
              </div>
                </div>
              )}
        </div>
      )}

      {/* Step 9: Review & Create */}
      {currentStep === 9 && (
        <div className="space-y-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-dark-100 mb-2">Review & Create Sale</h3>
            <p className="text-dark-400">Please review all information before finalizing your sale</p>
          </div>
          
          {/* Service Instances Summary */}
          <div className="bg-gradient-to-r from-primary-900/20 to-primary-800/20 border border-primary-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-primary-200">Services ({serviceTemplateInstances.length})</h4>
              </div>
            </div>
            
            <div className="space-y-4">
              {serviceTemplateInstances.map((instance, index) => (
                <div key={instance.id} className="bg-dark-800/50 border border-primary-500/20 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h5 className="font-medium text-dark-100 mb-2">
                        {index + 1}. {instance.templateName} - {instance.serviceInfo}
                      </h5>
                      <div className="text-sm text-dark-300 space-y-1">
                        <div><span className="text-primary-400">Dates:</span> {instance.checkIn} to {instance.checkOut}</div>
                        <div><span className="text-primary-400">Destination:</span> {instance.destination.city}</div>
                        <div><span className="text-primary-400">Cost:</span> {instance.originalCurrency || instance.currency} {parseFloat(instance.originalAmount || instance.cost).toFixed(2)}</div>
                        <div><span className="text-primary-400">Provider(s):</span> {instance.providers && instance.providers.length > 0 ? instance.providers.map(p => p.name || p.providerId?.name).join(', ') : instance.provider?.name || 'None'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Passengers Summary */}
          <div className="bg-gradient-to-r from-blue-900/20 to-blue-800/20 border border-blue-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-blue-200">Passengers ({selectedPassengers.length + selectedCompanions.length})</h4>
              </div>
            </div>
            
            <div className="space-y-3">
              {selectedPassengers.map((passenger) => (
                <div key={passenger._id} className="bg-dark-800/50 border border-blue-500/20 rounded-lg p-3">
                  <h5 className="font-medium text-dark-100">{passenger.name} {passenger.surname}</h5>
                  <div className="text-sm text-dark-300">
                    {passenger.phone && <span>Phone: {passenger.phone}</span>}
                    {passenger.passportNumber && <span className="ml-4">Passport: {passenger.passportNumber}</span>}
                  </div>
                </div>
              ))}
              
              {selectedCompanions.map((companion) => (
                <div key={companion._id} className="bg-dark-800/50 border border-blue-500/20 rounded-lg p-3">
                  <h5 className="font-medium text-dark-100">{companion.name} {companion.surname}</h5>
                  <div className="text-sm text-dark-300">
                    {companion.phone && <span>Phone: {companion.phone}</span>}
                    {companion.passportNumber && <span className="ml-4">Passport: {companion.passportNumber}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}


    </>
  );
};

export default NewSaleWizardSteps;
