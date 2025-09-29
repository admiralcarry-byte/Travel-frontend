import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/api';

const ReservationFlow = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [cupo, setCupo] = useState(null);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedClientPassengers, setSelectedClientPassengers] = useState([]);
  const [seatsToReserve, setSeatsToReserve] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Services state
  const [services, setServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [showServices, setShowServices] = useState(false);
  

  useEffect(() => {
    const initializeReservation = async () => {
      if (location.state?.cupo) {
        // Cupo data passed via state (from inventory dashboard)
        setCupo(location.state.cupo);
      } else {
        // Check if cupoId is passed via URL parameters (from cupo details page)
        const urlParams = new URLSearchParams(location.search);
        const cupoId = urlParams.get('cupoId');
        
        if (cupoId) {
          try {
            // Fetch cupo data using the cupoId
            const response = await api.get(`/api/cupos/${cupoId}`);
            if (response.data.success) {
              setCupo(response.data.data.cupo);
            } else {
              setError('Failed to load cupo data');
              navigate('/inventory');
            }
          } catch (error) {
            setError('Failed to load cupo data');
            navigate('/inventory');
          }
        } else {
          // No cupo data available, redirect to inventory
          navigate('/inventory');
        }
      }
    };

    initializeReservation();
    fetchClients();
    fetchServices();
  }, [location.state, location.search, navigate]);

  const fetchClients = async () => {
    try {
      const response = await api.get('/api/clients?limit=100');

      if (response.data.success) {
        setClients(response.data.data.clients);
      }
    } catch (error) {
      setError('Failed to fetch clients');
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


  const fetchClientPassengers = async (clientId) => {
    try {
      const response = await api.get(`/api/clients/${clientId}/passengers`);
      if (response.data.success) {
        setSelectedClientPassengers(response.data.data.passengers);
        
        // Calculate total seats: 1 main passenger + companions
        const passengers = response.data.data.passengers;
        const mainPassengers = passengers.filter(p => p.relationshipType === 'main_passenger');
        const companions = passengers.filter(p => p.relationshipType === 'companion');
        
        // Total seats = 1 main passenger + number of companions
        const totalSeats = 1 + companions.length;
        setSeatsToReserve(totalSeats);
      }
    } catch (error) {
      console.error('Failed to fetch client passengers:', error);
      // If fetching passengers fails, default to 1 seat
      setSeatsToReserve(1);
    }
  };

  const handleClientSelect = (client) => {
    setSelectedClient(client);
    setShowServices(true);
    // Fetch passengers for the selected client to calculate seats
    fetchClientPassengers(client._id);
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
        serviceName: service.destino,
        priceClient: 0, // Will be set by user
        costProvider: 0, // Will be set by user
        currency: 'USD', // Default currency
          quantity: 1,
          serviceDates: {
            startDate: new Date(),
            endDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // Default to tomorrow
          },
          documents: [],
          notes: '',
          invoiceFile: null // Will be set by user
        }];
      }
    });
  };

  const handleServicePriceChange = (serviceId, field, value) => {
    setSelectedServices(prev => 
      prev.map(s => 
        s.serviceId === serviceId 
          ? { ...s, [field]: field === 'quantity' ? parseInt(value) || 1 : parseFloat(value) || 0 }
          : s
      )
    );
  };

  const handleServiceDateChange = (serviceId, field, value) => {
    setSelectedServices(prev => 
      prev.map(s => 
        s.serviceId === serviceId 
          ? { 
              ...s, 
              serviceDates: { 
                ...s.serviceDates, 
                [field]: new Date(value) 
              } 
            }
          : s
      )
    );
  };

  const handleInvoiceUpload = (serviceId, file) => {
    if (file) {
      setSelectedServices(prev => 
        prev.map(s => 
          s.serviceId === serviceId 
            ? { ...s, invoiceFile: file }
            : s
        )
      );
    }
  };

  const handleReserve = async () => {
    if (!selectedClient || seatsToReserve <= 0) {
      setError('Please select a passenger and enter valid number of seats');
      return;
    }


    if (seatsToReserve > cupo.availableSeats) {
      setError(`Only ${cupo.availableSeats} seats available`);
      return;
    }

    if (!cupo._id && !cupo.id) {
      setError('Invalid slots data. Please try again.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Prepare passengers data including main client and companions
      const passengers = [
        {
          isMainClient: true,
          clientId: selectedClient._id,
          price: 0, // Main passenger price
          notes: 'Main passenger'
        }
      ];

      // Add companions if any (exclude main passenger)
      const companions = selectedClientPassengers.filter(p => 
        p.relationshipType === 'companion' && p._id !== selectedClient._id
      );
      companions.forEach(companion => {
        passengers.push({
          passengerId: companion._id,
          price: 0, // Companion price
          notes: `Companion: ${companion.name} ${companion.surname}`
        });
      });

      // Prepare services data including cupo service and any additional services
      const services = [];

      // Add any additional selected services (don't add cupo service as it's handled separately)
      selectedServices.forEach(service => {
        services.push({
          serviceId: service.serviceId,
          providerId: service.providerId,
          serviceName: service.serviceName,
          priceClient: service.priceClient || 0, // Price per passenger - backend will multiply by quantity
          costProvider: service.costProvider || 0,
          currency: service.currency || 'USD',
          quantity: seatsToReserve, // Set quantity to number of seats
          serviceDates: service.serviceDates || {
            startDate: new Date(),
            endDate: new Date()
          },
          invoiceFile: service.invoiceFile
        });
      });

      // Create FormData for file uploads
      const formData = new FormData();
      formData.append('seatsToReserve', seatsToReserve);
      formData.append('clientId', selectedClient._id);
      formData.append('passengers', JSON.stringify(passengers));
      formData.append('services', JSON.stringify(services));

      // Add invoice files
      selectedServices.forEach((service, index) => {
        if (service.invoiceFile) {
          formData.append(`invoice_${service.serviceId}`, service.invoiceFile);
        }
      });

      console.log('Sending reservation data:', {
        seatsToReserve,
        clientId: selectedClient._id,
        passengers: passengers.length,
        services: services.length,
        files: selectedServices.filter(s => s.invoiceFile).length
      });

      const response = await api.put(`/api/cupos/${cupo._id || cupo.id}/reserve`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setSuccess('Reservation created successfully!');
        
        // If a sale was created, navigate to it
        if (response.data.data.sale) {
          setTimeout(() => {
            navigate(`/sales/${response.data.data.sale._id || response.data.data.sale.id}`);
          }, 2000);
        } else {
          // Otherwise, go back to inventory
          setTimeout(() => {
            navigate('/inventory');
          }, 2000);
        }
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create reservation');
    } finally {
      setLoading(false);
    }
  };

  if (!cupo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="space-y-12">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-5xl sm:text-6xl font-bold gradient-text mb-6 font-poppins">
            Create Reservation
          </h1>
          <p className="text-xl text-dark-300 max-w-3xl mx-auto mb-8">
            Reserve seats from slots and create a new sale
          </p>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card">
            <div className="p-6 space-y-6">
              {error && (
                <div className="notification">
                  <div className="flex items-center space-x-4">
                    <div className="icon-container bg-error-500">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-error-400 font-medium text-lg">{error}</span>
                  </div>
                </div>
              )}

              {success && (
                <div className="notification">
                  <div className="flex items-center space-x-4">
                    <div className="icon-container bg-success-500">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-success-400 font-medium text-lg">{success}</span>
                  </div>
                </div>
              )}

              {/* Cupo Information */}
              <div className="bg-dark-700 shadow rounded-lg p-6">
                <h3 className="text-xl font-semibold text-dark-100 mb-4">Cupo Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-200">Service</label>
                    <p className="text-dark-100">{cupo.serviceId?.destino}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-200">Provider</label>
                    <p className="text-dark-100">{cupo.serviceId?.providerId?.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-200">Start Date</label>
                    <p className="text-dark-100">{cupo.formattedDate}</p>
                  </div>
                  {cupo.metadata.completionDate && (
                    <div>
                      <label className="block text-sm font-medium text-dark-200">Completion Date</label>
                      <p className="text-dark-100">{new Date(cupo.metadata.completionDate).toLocaleDateString()}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-dark-200">Available Seats</label>
                    <p className="text-dark-100 font-semibold">{cupo.availableSeats}</p>
                  </div>
                  {cupo.metadata.roomType && (
                    <div>
                      <label className="block text-sm font-medium text-dark-200">Room Type</label>
                      <p className="text-dark-100">{cupo.metadata.roomType}</p>
                    </div>
                  )}
                  {cupo.metadata.flightClass && (
                    <div>
                      <label className="block text-sm font-medium text-dark-200">Flight Class</label>
                      <p className="text-dark-100">{cupo.metadata.flightClass.replace('_', ' ')}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Client Selection */}
              <div className="bg-dark-600/30 border border-white/10 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-dark-100 mb-4">Select Passenger</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-64 overflow-y-auto">
                  {clients.map(client => (
                    <div
                      key={client._id}
                      onClick={() => handleClientSelect(client)}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedClient?._id === client._id
                          ? 'border-primary-500 bg-primary-500/20'
                          : 'border-white/30 hover:border-white/40 bg-dark-700/70'
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
                
                {/* Selected Client Info */}
                {selectedClient && (
                  <div className="mt-4 p-4 bg-primary-500/10 border border-primary-500/30 rounded-lg">
                    <h4 className="font-medium text-dark-100 mb-2">
                      Selected: {selectedClient.name} {selectedClient.surname}
                    </h4>
                    {selectedClientPassengers.length > 0 && (
                      <>
                        {(() => {
                          const companions = selectedClientPassengers.filter(p => p.relationshipType === 'companion');
                          return (
                            <p className="text-sm text-dark-300">
                              Total Seats: {1 + companions.length} 
                              {companions.length > 0 && (
                                <span className="text-primary-400 ml-2">
                                  (1 main passenger + {companions.length} companion{companions.length !== 1 ? 's' : ''})
                                </span>
                              )}
                            </p>
                          );
                        })()}
                        <p className="text-sm text-dark-400 mt-1">
                          Seats automatically calculated based on main passenger + companions
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Services Selection */}
              {showServices && (
                <div className="bg-dark-600/30 border border-white/10 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-dark-100 mb-4">Select Services</h3>
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
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-dark-100 mb-2">{service.destino}</h4>
                              <p className="text-sm text-dark-300 mb-2">{service.description}</p>
                              <p className="text-sm text-dark-400 mb-3">
                                Provider: {service.providerId?.name} | 
                                Type: {service.type}
                              </p>
                              <button
                                onClick={() => handleServiceToggle(service)}
                                className={`px-3 py-1 rounded-md text-sm font-medium ${
                                  isSelected
                                    ? 'bg-red-600 text-white hover:bg-red-700'
                                    : 'btn-primary'
                                }`}
                              >
                                {isSelected ? 'Remove' : 'Add'}
                              </button>
                            </div>
                            
                            {isSelected && (
                              <div className="ml-6 w-80 p-4 bg-dark-700/30 rounded-lg border border-white/10">
                                {/* Service Info Header */}
                                <div className="flex items-center justify-between mb-4">
                                  <div>
                                    <h5 className="font-medium text-dark-100">{service.destino}</h5>
                                    <p className="text-sm text-dark-300">
                                      {service.providerId?.name} • {service.type?.charAt(0).toUpperCase() + service.type?.slice(1)}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-lg font-semibold text-primary-400">
                                      ${((isSelected.priceClient || 0) * seatsToReserve).toFixed(2)}
                                    </div>
                                    <div className="text-xs text-dark-400">Total Price</div>
                                  </div>
                                </div>

                                {/* Pricing Section */}
                                <div className="grid grid-cols-1 gap-4 mb-4">
                                  <div>
                                    <label className="block text-sm font-medium text-dark-200 mb-2">
                                      Price per Passenger *
                                    </label>
                                    <div className="relative">
                                      <input
                                        type="number"
                                        step="0.01"
                                        value={isSelected.priceClient || ''}
                                        onChange={(e) => handleServicePriceChange(service._id, 'priceClient', e.target.value)}
                                        className="w-full px-3 py-2 border border-white/20 rounded-lg text-sm bg-dark-800/50 text-dark-100 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                                        placeholder="0.00"
                                        min="0"
                                      />
                                      <div className="absolute -bottom-5 left-0 text-xs text-dark-400">
                                        × {seatsToReserve} passenger{seatsToReserve !== 1 ? 's' : ''} = ${((isSelected.priceClient || 0) * seatsToReserve).toFixed(2)}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-sm font-medium text-dark-200 mb-2">
                                        Cost of Provider *
                                      </label>
                                      <input
                                        type="number"
                                        step="0.01"
                                        value={isSelected.costProvider || ''}
                                        onChange={(e) => handleServicePriceChange(service._id, 'costProvider', e.target.value)}
                                        className="w-full px-3 py-2 border border-white/20 rounded-lg text-sm bg-dark-800/50 text-dark-100 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                                        placeholder="0.00"
                                        min="0"
                                      />
                                    </div>
                                    
                                    <div>
                                      <label className="block text-sm font-medium text-dark-200 mb-2">
                                        Quantity *
                                      </label>
                                      <input
                                        type="number"
                                        value={isSelected.quantity || 1}
                                        onChange={(e) => handleServicePriceChange(service._id, 'quantity', e.target.value)}
                                        className="w-full px-3 py-2 border border-white/20 rounded-lg text-sm bg-dark-800/50 text-dark-100 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                                        min="1"
                                      />
                                      <div className="text-xs text-dark-400 mt-1">
                                        {isSelected.quantity || 1} unit{(isSelected.quantity || 1) !== 1 ? 's' : ''}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Invoice Section */}
                                <div>
                                  <label className="block text-sm font-medium text-dark-200 mb-2">
                                    Operator's Invoice (Backup)
                                  </label>
                                  <div className="flex items-center space-x-3">
                                    <input
                                      type="file"
                                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                      onChange={(e) => handleInvoiceUpload(service._id, e.target.files[0])}
                                      className="hidden"
                                      id={`invoice-${service._id}`}
                                    />
                                    <label
                                      htmlFor={`invoice-${service._id}`}
                                      className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm cursor-pointer transition-colors flex items-center space-x-2"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                      </svg>
                                      <span>{isSelected.invoiceFile ? 'Change File' : 'Upload Invoice'}</span>
                                    </label>
                                    {isSelected.invoiceFile && (
                                      <div className="flex items-center space-x-2 text-sm text-green-400">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <span>{isSelected.invoiceFile.name}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Service Dates for Selected Services */}
                          {isSelected && (
                            <div className="mt-4 pt-4 border-t border-white/10">
                              <h5 className="text-sm font-medium text-dark-200 mb-2">Service Dates</h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-xs font-medium text-dark-300">
                                    Start Date
                                  </label>
                                  <input
                                    type="datetime-local"
                                    value={isSelected.serviceDates.startDate.toISOString().slice(0, 16)}
                                    onChange={(e) => handleServiceDateChange(service._id, 'startDate', e.target.value)}
                                    className="w-full px-2 py-1 border border-white/20 rounded text-sm bg-dark-800/50 text-dark-100"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-dark-300">
                                    End Date
                                  </label>
                                  <input
                                    type="datetime-local"
                                    value={isSelected.serviceDates.endDate.toISOString().slice(0, 16)}
                                    onChange={(e) => handleServiceDateChange(service._id, 'endDate', e.target.value)}
                                    className="w-full px-2 py-1 border border-white/20 rounded text-sm bg-dark-800/50 text-dark-100"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Seats to Reserve */}
              <div>
                <h3 className="text-xl font-semibold text-dark-100 mb-4">Reservation Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="seatsToReserve" className="block text-sm font-semibold text-dark-200 mb-4">
                      Number of Seats to Reserve *
                    </label>
                    <input
                      type="number"
                      id="seatsToReserve"
                      value={seatsToReserve}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 1;
                        setSeatsToReserve(value);
                      }}
                      min="1"
                      max={cupo.availableSeats}
                      className="input-field focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                    />
                    <p className="mt-1 text-sm text-dark-400">
                      Maximum: {cupo.availableSeats} seats available
                    </p>
                    {selectedClient && selectedClientPassengers.length > 0 && (
                      <p className="mt-1 text-sm text-primary-400">
                        ✓ Automatically calculated: 1 main passenger + {selectedClientPassengers.filter(p => p.relationshipType === 'companion').length} companion{selectedClientPassengers.filter(p => p.relationshipType === 'companion').length !== 1 ? 's' : ''} = {seatsToReserve} seat{seatsToReserve !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-dark-200 mb-4">
                      Total Cost (Estimated)
                    </label>
                    <div className="mt-1 p-3 bg-dark-700/50 rounded-md border border-white/10">
                      {(() => {
                        // Calculate total cost from selected services (price per passenger × seats)
                        const totalServiceCost = selectedServices.reduce((sum, s) => 
                          sum + (s.priceClient * seatsToReserve), 0
                        );
                        
                        return (
                          <>
                            <p className="text-lg font-semibold text-dark-100">
                              ${totalServiceCost.toFixed(2)}
                            </p>
                            <p className="text-sm text-dark-400">
                              USD total for {seatsToReserve} seat{seatsToReserve !== 1 ? 's' : ''}
                              {selectedServices.length > 0 && (
                                <span className="block text-xs text-dark-500 mt-1">
                                  Sum of all service prices × seats
                                </span>
                              )}
                            </p>
                            {selectedServices.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-white/10">
                                <p className="text-sm text-dark-300">
                                  <strong>Services Total (Provider Costs):</strong> ${selectedServices.reduce((sum, s) => sum + s.costProvider, 0).toFixed(2)}
                                </p>
                                <p className="text-lg font-semibold text-primary-400">
                                  <strong>Grand Total:</strong> ${(totalServiceCost + selectedServices.reduce((sum, s) => sum + s.costProvider, 0)).toFixed(2)}
                                </p>
                                <p className="text-xs text-dark-500 mt-1">
                                  Total Cost + Services Total (Provider Costs)
                                </p>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>


              {/* Selected Client Summary */}
              {selectedClient && (
                <div className="bg-success-500/10 border border-success-500/20 p-4 rounded-md">
                  <h4 className="font-medium text-success-400 mb-2">Selected Passenger</h4>
                  <p className="text-success-300">
                    <strong>{selectedClient.name} {selectedClient.surname}</strong>
                  </p>
                  <p className="text-success-400 text-sm">{selectedClient.email}</p>
                </div>
              )}

              {/* Reservation Summary */}
              <div className="bg-primary-500/10 border border-primary-500/20 p-4 rounded-md">
                <h4 className="font-medium text-primary-400 mb-2">Reservation Summary</h4>
                <div className="text-primary-300 space-y-1">
                  <p><strong>Service:</strong> {cupo.serviceId?.destino}</p>
                  <p><strong>Start Date:</strong> {cupo.formattedDate}</p>
                  {cupo.metadata.completionDate && (
                    <p><strong>Completion Date:</strong> {new Date(cupo.metadata.completionDate).toLocaleDateString()}</p>
                  )}
                  <p><strong>Seats:</strong> {seatsToReserve}</p>
                  <p><strong>Passenger:</strong> {selectedClient ? `${selectedClient.name} ${selectedClient.surname}` : 'Not selected'}</p>
                  {selectedServices.length > 0 && (
                    <div>
                      <p><strong>Additional Services ({selectedServices.length}):</strong></p>
                      {selectedServices.map((service, index) => (
                        <p key={index} className="ml-4 text-sm">
                          • {service.serviceName} - ${service.priceClient.toFixed(2)} x{service.quantity}
                        </p>
                      ))}
                    </div>
                  )}
                  {(() => {
                    // Calculate totals using the same logic as Total Cost section
                    const totalServiceCost = selectedServices.reduce((sum, s) => 
                      sum + (s.priceClient * seatsToReserve), 0
                    );
                    const servicesProviderCost = selectedServices.reduce((sum, s) => 
                      sum + s.costProvider, 0
                    );
                    
                    return (
                      <>
                        <p><strong>Service Total:</strong> ${totalServiceCost.toFixed(2)}</p>
                        {selectedServices.length > 0 && (
                          <div>
                            <p><strong>Services Total (Provider Costs):</strong> ${servicesProviderCost.toFixed(2)}</p>
                            <p className="text-lg font-semibold text-primary-300">
                              <strong>Grand Total:</strong> ${(totalServiceCost + servicesProviderCost).toFixed(2)}
                            </p>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-white/10">
                <button
                  onClick={() => navigate('/inventory')}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReserve}
                  disabled={loading || !selectedClient || seatsToReserve <= 0}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating Reservation...' : 'Create Reservation'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReservationFlow;