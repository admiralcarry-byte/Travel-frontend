import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../utils/api';

const SaleWizard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Step 1: Client Selection
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientSearch, setClientSearch] = useState('');

  // Step 2: Passengers
  const [availablePassengers, setAvailablePassengers] = useState([]);
  const [selectedPassengers, setSelectedPassengers] = useState([]);

  // Step 3: Services
  const [services, setServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);

  // Step 4: Summary
  const [saleNotes, setSaleNotes] = useState('');

  const steps = [
    { number: 1, title: 'Select Client', description: 'Choose or create a client' },
    { number: 2, title: 'Add Passengers', description: 'Select passengers for this sale' },
    { number: 3, title: 'Add Services', description: 'Choose services and set prices' },
    { number: 4, title: 'Review & Create', description: 'Review details and create sale' }
  ];

  useEffect(() => {
    fetchClients();
    fetchServices();
  }, []);

  useEffect(() => {
    if (selectedClient) {
      fetchPassengers(selectedClient._id);
    }
  }, [selectedClient]);

  const fetchClients = async () => {
    try {
      const response = await api.get('/api/clients?limit=100');

      if (response.data.success) {
        setClients(response.data.data.clients);
        
        // Check if a client ID was passed in URL params
        const clientId = searchParams.get('clientId');
        if (clientId) {
          const preSelectedClient = response.data.data.clients.find(client => client._id === clientId);
          if (preSelectedClient) {
            setSelectedClient(preSelectedClient);
            setCurrentStep(2); // Skip to step 2 since client is pre-selected
          }
        }
      }
    } catch (error) {
      setError('Failed to fetch clients');
    }
  };

  const fetchPassengers = async (clientId) => {
    try {
      const response = await api.get(`/api/clients/${clientId}/passengers`);

      if (response.data.success) {
        setAvailablePassengers(response.data.data.passengers);
      }
    } catch (error) {
      setError('Failed to fetch passengers');
    }
  };

  const fetchServices = async () => {
    try {
      const response = await api.get('/api/services?limit=100');

      if (response.data.success) {
        setServices(response.data.data.services);
      }
    } catch (error) {
      setError('Failed to fetch services');
    }
  };

  const handleClientSelect = (client) => {
    setSelectedClient(client);
    setSelectedPassengers([]);
    setSelectedServices([]);
  };

  const handlePassengerToggle = (passenger) => {
    setSelectedPassengers(prev => {
      const exists = prev.find(p => p.passengerId === passenger._id);
      if (exists) {
        return prev.filter(p => p.passengerId !== passenger._id);
      } else {
        return [...prev, {
          passengerId: passenger._id,
          price: 0,
          notes: ''
        }];
      }
    });
  };

  const handlePassengerPriceChange = (passengerId, price) => {
    setSelectedPassengers(prev => 
      prev.map(p => 
        p.passengerId === passengerId 
          ? { ...p, price: parseFloat(price) || 0 }
          : p
      )
    );
  };

  const handleServiceToggle = (service) => {
    setSelectedServices(prev => {
      const exists = prev.find(s => s.serviceId === service._id);
      if (exists) {
        return prev.filter(s => s.serviceId !== service._id);
      } else {
        return [...prev, {
          serviceId: service._id,
          providerId: service.providerId._id,
          priceClient: service.cost,
          costProvider: service.cost * 0.8, // 20% markup example
          currency: service.currency || 'USD',
          quantity: 1
        }];
      }
    });
  };

  const handleServicePriceChange = (serviceId, field, value) => {
    setSelectedServices(prev => 
      prev.map(s => 
        s.serviceId === serviceId 
          ? { ...s, [field]: parseFloat(value) || 0 }
          : s
      )
    );
  };

  const calculateTotals = () => {
    const totalSalePrice = selectedPassengers.reduce((sum, p) => sum + p.price, 0) +
                          selectedServices.reduce((sum, s) => sum + (s.priceClient * s.quantity), 0);
    const totalCost = selectedServices.reduce((sum, s) => sum + (s.costProvider * s.quantity), 0);
    const profit = totalSalePrice - totalCost;

    return { totalSalePrice, totalCost, profit };
  };

  const handleCreateSale = async () => {
    if (!selectedClient || selectedPassengers.length === 0 || selectedServices.length === 0) {
      setError('Please complete all required steps');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const saleData = {
        clientId: selectedClient._id,
        passengers: selectedPassengers,
        services: selectedServices,
        notes: saleNotes,
        status: 'open'
      };

      const response = await api.post('/api/sales', saleData);

      if (response.data.success) {
        console.log('Sale creation response:', response.data);
        console.log('Sale object:', response.data.data.sale);
        console.log('Sale ID:', response.data.data.sale.id);
        console.log('Sale _ID:', response.data.data.sale._id);
        setSuccess('Sale created successfully!');
        setTimeout(() => {
          navigate(`/sales/${response.data.data.sale.id}`);
        }, 2000);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create sale');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
      setError('');
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError('');
    }
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    client.surname.toLowerCase().includes(clientSearch.toLowerCase()) ||
    client.email.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const totals = calculateTotals();

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-dark-100">Create New Sale</h1>
        <p className="mt-1 text-sm text-dark-400">
          Multi-step wizard to create a new reservation
        </p>
      </div>

      {/* Progress Steps */}
      <div className="card-glass p-6 mb-6">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                currentStep >= step.number
                  ? 'bg-primary-600 text-white'
                  : 'bg-dark-600 text-dark-300'
              }`}>
                {step.number}
              </div>
              <div className="ml-3 hidden sm:block">
                <p className={`text-sm font-medium ${
                  currentStep >= step.number ? 'text-primary-400' : 'text-dark-300'
                }`}>
                  {step.title}
                </p>
                <p className="text-xs text-dark-400">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div 
                  key={`connector-${step.number}`}
                  className={`hidden sm:block w-16 h-0.5 ml-4 ${
                    currentStep > step.number ? 'bg-primary-600' : 'bg-white/20'
                  }`} 
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-md">
          {success}
        </div>
      )}

      {/* Step Content */}
      <div className="card p-6">
        {/* Step 1: Client Selection */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-dark-100">Select Client</h3>
            
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">
                Search Clients
              </label>
              <input
                type="text"
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="input-field"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {filteredClients.map(client => (
                <div
                  key={client._id}
                  onClick={() => handleClientSelect(client)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedClient?._id === client._id
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-white/20 hover:border-white/30'
                  }`}
                >
                  <h4 className="font-medium text-dark-100">
                    {client.name} {client.surname}
                  </h4>
                  <p className="text-sm text-dark-300">{client.email}</p>
                  <p className="text-sm text-dark-400">{client.phone}</p>
                </div>
              ))}
            </div>

            {selectedClient && (
              <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-md">
                <p className="text-green-400">
                  <strong>Selected:</strong> {selectedClient.name} {selectedClient.surname}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Passengers */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-dark-100">Select Passengers</h3>
            
            {availablePassengers.length === 0 ? (
              <div className="text-center py-8 text-dark-400">
                No passengers found for this client. Please add passengers first.
              </div>
            ) : (
              <div className="space-y-4">
                {availablePassengers.map(passenger => {
                  const isSelected = selectedPassengers.find(p => p.passengerId === passenger._id);
                  return (
                    <div
                      key={passenger._id}
                      className={`p-4 border rounded-lg ${
                        isSelected ? 'border-primary-500 bg-primary-500/10' : 'border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-dark-100">
                            {passenger.name} {passenger.surname}
                          </h4>
                          <p className="text-sm text-dark-300">
                            DOB: {new Date(passenger.dob).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-dark-400">
                            Passport: {passenger.passportNumber}
                          </p>
                        </div>
                        <div className="flex items-center space-x-4">
                          {isSelected && (
                            <div>
                              <label className="block text-sm font-medium text-dark-200">
                                Price
                              </label>
                              <input
                                type="number"
                                value={isSelected.price}
                                onChange={(e) => handlePassengerPriceChange(passenger._id, e.target.value)}
                                className="w-24 px-2 py-1 border border-white/20 rounded text-sm bg-dark-800/50 text-dark-100"
                                placeholder="0.00"
                              />
                            </div>
                          )}
                          <button
                            onClick={() => handlePassengerToggle(passenger)}
                            className={`px-4 py-2 rounded-md text-sm font-medium ${
                              isSelected
                                ? 'bg-red-600 text-white hover:bg-red-700'
                                : 'btn-primary'
                            }`}
                          >
                            {isSelected ? 'Remove' : 'Add'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Services */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-dark-100">Select Services</h3>
            
            <div className="space-y-4">
              {services.map(service => {
                const isSelected = selectedServices.find(s => s.serviceId === service._id);
                return (
                  <div
                    key={service._id}
                    className={`p-4 border rounded-lg ${
                      isSelected ? 'border-primary-500 bg-primary-500/10' : 'border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-dark-100">{service.title}</h4>
                        <p className="text-sm text-dark-300">{service.description}</p>
                        <p className="text-sm text-dark-400">
                          Provider: {service.providerId?.name} | 
                          Type: {service.type} | 
                          Base Cost: {service.formattedCost}
                        </p>
                      </div>
                      <div className="flex items-center space-x-4">
                        {isSelected && (
                          <div className="flex space-x-2">
                            <div>
                              <label className="block text-xs font-medium text-dark-200">
                                Client Price
                              </label>
                              <input
                                type="number"
                                value={isSelected.priceClient}
                                onChange={(e) => handleServicePriceChange(service._id, 'priceClient', e.target.value)}
                                className="w-20 px-2 py-1 border border-white/20 rounded text-sm bg-dark-800/50 text-dark-100"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-dark-200">
                                Provider Cost
                              </label>
                              <input
                                type="number"
                                value={isSelected.costProvider}
                                onChange={(e) => handleServicePriceChange(service._id, 'costProvider', e.target.value)}
                                className="w-20 px-2 py-1 border border-white/20 rounded text-sm bg-dark-800/50 text-dark-100"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-dark-200">
                                Qty
                              </label>
                              <input
                                type="number"
                                value={isSelected.quantity}
                                onChange={(e) => handleServicePriceChange(service._id, 'quantity', e.target.value)}
                                className="w-16 px-2 py-1 border border-white/20 rounded text-sm bg-dark-800/50 text-dark-100"
                                min="1"
                              />
                            </div>
                          </div>
                        )}
                        <button
                          onClick={() => handleServiceToggle(service)}
                          className={`px-4 py-2 rounded-md text-sm font-medium ${
                            isSelected
                              ? 'bg-red-600 text-white hover:bg-red-700'
                              : 'btn-primary'
                          }`}
                        >
                          {isSelected ? 'Remove' : 'Add'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 4: Summary */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-dark-100">Review & Create Sale</h3>
            
            {/* Client Summary */}
            <div className="bg-dark-700/50 p-4 rounded-lg border border-white/10">
              <h4 className="font-medium text-dark-100 mb-2">Client</h4>
              <p className="text-dark-200">{selectedClient?.name} {selectedClient?.surname}</p>
              <p className="text-sm text-dark-300">{selectedClient?.email}</p>
            </div>

            {/* Passengers Summary */}
            <div className="bg-dark-700/50 p-4 rounded-lg border border-white/10">
              <h4 className="font-medium text-dark-100 mb-2">Passengers ({selectedPassengers.length})</h4>
              {selectedPassengers.map((passengerSale, index) => {
                const passenger = availablePassengers.find(p => p._id === passengerSale.passengerId);
                return (
                  <div key={passengerSale.passengerId} className="flex justify-between text-sm">
                    <span className="text-dark-200">{passenger?.name} {passenger?.surname}</span>
                    <span className="text-dark-100">${passengerSale.price.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>

            {/* Services Summary */}
            <div className="bg-dark-700/50 p-4 rounded-lg border border-white/10">
              <h4 className="font-medium text-dark-100 mb-2">Services ({selectedServices.length})</h4>
              {selectedServices.map((serviceSale, index) => {
                const service = services.find(s => s._id === serviceSale.serviceId);
                return (
                  <div key={serviceSale.serviceId} className="text-sm">
                    <div className="flex justify-between">
                      <span className="text-dark-200">{service?.title} (x{serviceSale.quantity})</span>
                      <span className="text-dark-100">${(serviceSale.priceClient * serviceSale.quantity).toFixed(2)}</span>
                    </div>
                    <div className="text-xs text-dark-400 ml-4">
                      Cost: ${(serviceSale.costProvider * serviceSale.quantity).toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Totals */}
            <div className="bg-primary-500/10 p-4 rounded-lg border border-primary-500/20">
              <div className="flex justify-between text-lg font-medium">
                <span className="text-dark-100">Total Sale Price:</span>
                <span className="text-dark-100">${totals.totalSalePrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-dark-300">
                <span>Total Cost:</span>
                <span>${totals.totalCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-green-400">
                <span>Profit:</span>
                <span>${totals.profit.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-dark-300">
                <span>Profit Margin:</span>
                <span>{totals.totalSalePrice > 0 ? ((totals.profit / totals.totalSalePrice) * 100).toFixed(1) : 0}%</span>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">
                Sale Notes (Optional)
              </label>
              <textarea
                value={saleNotes}
                onChange={(e) => setSaleNotes(e.target.value)}
                rows={3}
                className="input-field"
                placeholder="Add any additional notes for this sale..."
              />
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6 border-t border-white/10">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="px-4 py-2 text-sm font-medium text-dark-300 bg-dark-700/50 hover:bg-dark-700 border border-white/10 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          {currentStep < 4 ? (
            <button
              onClick={nextStep}
              disabled={
                (currentStep === 1 && !selectedClient) ||
                (currentStep === 2 && selectedPassengers.length === 0) ||
                (currentStep === 3 && selectedServices.length === 0)
              }
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleCreateSale}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Sale'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SaleWizard;