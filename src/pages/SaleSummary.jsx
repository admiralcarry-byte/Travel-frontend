import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import PaymentsTable from '../components/PaymentsTable';
import ProfitChart from '../components/ProfitChart';

const SaleSummary = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    fetchSale();
  }, [id]);

  const fetchSale = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/sales/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setSale(response.data.data.sale);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to fetch sale details');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentAdded = () => {
    // Refresh sale data to get updated balances
    fetchSale();
  };

  const handleFileUpload = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadError('');

    try {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('documents', file);
      });
      formData.append('type', 'other');

      const response = await axios.post(`http://localhost:5000/api/sales/${id}/upload`, formData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        // Refresh sale data to show new documents
        fetchSale();
      }
    } catch (error) {
      setUploadError(error.response?.data?.message || 'Failed to upload documents');
    } finally {
      setUploading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-yellow-100 text-yellow-800';
      case 'closed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDocumentIcon = (type) => {
    switch (type) {
      case 'ticket': return '🎫';
      case 'invoice': return '📄';
      case 'contract': return '📋';
      case 'receipt': return '🧾';
      default: return '📎';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <div className="space-y-12">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-5xl sm:text-6xl font-bold gradient-text mb-6 font-poppins">
              Sale Error
            </h1>
            <p className="text-xl text-dark-300 max-w-3xl mx-auto mb-8">
              Unable to load sale details
            </p>
          </div>

          {/* Error Content */}
          <div className="card p-8">
            <div className="text-center">
              <div className="flex items-center justify-center mb-6">
                <div className="icon-container bg-error-500 mr-4">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-3xl font-semibold text-dark-100">
                  Error Loading Sale
                </h3>
              </div>
              <p className="text-dark-300 mb-8 max-w-md mx-auto text-lg">
                {error}
              </p>
              <button
                onClick={() => navigate('/sales')}
                className="btn-primary"
              >
                Back to Sales
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="min-h-screen">
        <div className="space-y-12">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-5xl sm:text-6xl font-bold gradient-text mb-6 font-poppins">
              Sale Not Found
            </h1>
            <p className="text-xl text-dark-300 max-w-3xl mx-auto mb-8">
              The requested sale could not be found
            </p>
          </div>

          {/* Not Found Content */}
          <div className="card p-8">
            <div className="text-center">
              <div className="flex items-center justify-center mb-6">
                <div className="icon-container bg-warning-500 mr-4">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-3xl font-semibold text-dark-100">
                  Sale Not Found
                </h3>
              </div>
              <p className="text-dark-300 mb-8 max-w-md mx-auto text-lg">
                The sale you're looking for doesn't exist or has been removed.
              </p>
              <button
                onClick={() => navigate('/sales')}
                className="btn-primary"
              >
                Back to Sales
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Sale Summary</h1>
              <p className="text-gray-600 mt-2">Sale ID: {sale.id}</p>
            </div>
            <div className="flex space-x-3">
              <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(sale.status)}`}>
                {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
              </span>
              <button
                onClick={() => navigate('/sales')}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Back to Sales
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Client Information */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Client Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <p className="text-gray-900">{sale.clientId?.name} {sale.clientId?.surname}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="text-gray-900">{sale.clientId?.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <p className="text-gray-900">{sale.clientId?.phone}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Passport</label>
                  <p className="text-gray-900">{sale.clientId?.passportNumber}</p>
                </div>
              </div>
            </div>

            {/* Passengers */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Passengers ({sale.passengers.length})</h2>
              <div className="space-y-4">
                {sale.passengers.map((passengerSale, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {passengerSale.passengerId?.name} {passengerSale.passengerId?.surname}
                        </h3>
                        <p className="text-sm text-gray-600">
                          DOB: {new Date(passengerSale.passengerId?.dob).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-500">
                          Passport: {passengerSale.passengerId?.passportNumber}
                        </p>
                        {passengerSale.notes && (
                          <p className="text-sm text-gray-500 mt-1">
                            Notes: {passengerSale.notes}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900">
                          ${passengerSale.price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Services */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Services ({sale.services.length})</h2>
              <div className="space-y-4">
                {sale.services.map((serviceSale, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {serviceSale.serviceId?.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {serviceSale.serviceId?.description}
                        </p>
                        <p className="text-sm text-gray-500">
                          Provider: {serviceSale.providerId?.name} | 
                          Type: {serviceSale.serviceId?.type} | 
                          Quantity: {serviceSale.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900">
                          ${(serviceSale.priceClient * serviceSale.quantity).toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500">
                          Cost: ${(serviceSale.costProvider * serviceSale.quantity).toFixed(2)}
                        </p>
                        <p className="text-sm text-green-600">
                          Profit: ${((serviceSale.priceClient - serviceSale.costProvider) * serviceSale.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            {sale.notes && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Notes</h2>
                <p className="text-gray-700">{sale.notes}</p>
              </div>
            )}

            {/* Payments */}
            <div className="bg-white shadow rounded-lg p-6">
              <PaymentsTable 
                saleId={sale.id} 
                onPaymentAdded={handlePaymentAdded}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Financial Summary */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Financial Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Sale Price:</span>
                  <span className="font-semibold text-gray-900">
                    {sale.formattedTotalSalePrice || `$${sale.totalSalePrice.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Cost:</span>
                  <span className="font-semibold text-gray-900">
                    {sale.formattedTotalCost || `$${sale.totalCost.toFixed(2)}`}
                  </span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Profit:</span>
                    <span className={`font-bold text-lg ${
                      sale.profit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {sale.formattedProfit || `$${sale.profit.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-gray-600">Profit Margin:</span>
                    <span className={`font-semibold ${
                      sale.profit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {sale.profitMargin}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Balances */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Balances</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Client Payments:</span>
                  <span className="font-semibold text-gray-900">
                    {sale.formattedTotalClientPayments || `$${sale.totalClientPayments.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Provider Payments:</span>
                  <span className="font-semibold text-gray-900">
                    {sale.formattedTotalProviderPayments || `$${sale.totalProviderPayments.toFixed(2)}`}
                  </span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Client Balance:</span>
                    <span className={`font-bold text-lg ${
                      sale.clientBalance <= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {sale.formattedClientBalance || `$${sale.clientBalance.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-gray-600">Provider Balance:</span>
                    <span className={`font-bold text-lg ${
                      sale.providerBalance >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {sale.formattedProviderBalance || `$${sale.providerBalance.toFixed(2)}`}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Profit Chart */}
            <ProfitChart sale={sale} />

            {/* Sale Information */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Sale Information</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created By</label>
                  <p className="text-gray-900">{sale.createdBy?.username}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created Date</label>
                  <p className="text-gray-900">{new Date(sale.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Updated</label>
                  <p className="text-gray-900">{new Date(sale.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Documents */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Documents</h2>
              
              {/* Upload Section */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Documents
                </label>
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx,.txt"
                />
                {uploading && (
                  <p className="text-sm text-blue-600 mt-1">Uploading...</p>
                )}
                {uploadError && (
                  <p className="text-sm text-red-600 mt-1">{uploadError}</p>
                )}
              </div>

              {/* Documents List */}
              {sale.documents && sale.documents.length > 0 ? (
                <div className="space-y-2">
                  {sale.documents.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border border-gray-200 rounded">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getDocumentIcon(doc.type)}</span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{doc.filename}</p>
                          <p className="text-xs text-gray-500">
                            {doc.type} • {new Date(doc.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <a
                        href={`http://localhost:5000${doc.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-800 text-sm"
                      >
                        View
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No documents uploaded yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaleSummary;