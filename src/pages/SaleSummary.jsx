import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/api';
import PaymentsTable from '../components/PaymentsTable';
import ProfitChart from '../components/ProfitChart';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorDisplay from '../components/ErrorDisplay';
import { formatCurrencyCompact, formatWithWarning, formatCurrencyFull, getCurrencySymbol } from '../utils/formatNumbers';

// Component for individual provider cards with expandable details
const ProviderCard = ({ provider, serviceIndex, providerIndex }) => {
  const [providerDetails, setProviderDetails] = useState(provider);
  const [loadingProvider, setLoadingProvider] = useState(true);
  const [errorProvider, setErrorProvider] = useState('');

  useEffect(() => {
    const setupProviderDetails = () => {
      // Debug: Log the provider data to understand the structure
      console.log('ProviderCard - Raw provider data:', provider);
      console.log('ProviderCard - Provider keys:', Object.keys(provider));

      // Use populated provider data directly if available
      let providerName = 'Unknown Provider';

      if (provider.providerId && typeof provider.providerId === 'object') {
        // Provider is populated from database
        providerName = provider.providerId.name || 'Unknown Provider';
      } else if (provider.name) {
        // Provider name is directly available
        providerName = provider.name;
      }

      const providerDetails = {
        name: providerName,
        costProvider: provider.costProvider !== undefined && provider.costProvider !== null ? provider.costProvider : null,
        currency: provider.currency || sale.saleCurrency,
        startDate: provider.startDate || provider.serviceDates?.startDate || null,
        endDate: provider.endDate || provider.serviceDates?.endDate || null,
        documents: provider.documents || []
      };

      console.log('ProviderCard - Processed provider details:', providerDetails);
      console.log('ProviderCard - Cost provider value:', provider.costProvider);
      console.log('ProviderCard - Start date:', provider.startDate);
      console.log('ProviderCard - End date:', provider.endDate);
      console.log('ProviderCard - Documents:', provider.documents);
      setProviderDetails(providerDetails);
      setLoadingProvider(false);
    };

    setupProviderDetails();
  }, [provider]);

  if (loadingProvider) return <p className="text-dark-300">Loading provider...</p>;
  if (errorProvider) return <ErrorDisplay message={errorProvider} />;

  const handleViewDocuments = () => {
    if (!providerDetails.documents || providerDetails.documents.length === 0) {
      alert('No documents available for this provider.');
      return;
    }

    // Group documents by service for better organization
    const documentsByService = {};
    let docIndex = 0;

    providerDetails.documents.forEach((doc) => {
      // Find which service this document belongs to
      const serviceInfo = provider.services?.find(service => 
        service.documents && service.documents.some(serviceDoc => 
          serviceDoc.filename === doc.filename && serviceDoc.url === doc.url
        )
      ) || { serviceName: 'Unknown Service' };

      const serviceName = serviceInfo.serviceName || 'Unknown Service';
      
      if (!documentsByService[serviceName]) {
        documentsByService[serviceName] = [];
      }
      
      documentsByService[serviceName].push({ ...doc, docIndex: docIndex++ });
    });

    const fileList = Object.entries(documentsByService).map(([serviceName, docs]) => {
      const serviceDocs = docs.map((doc) => {
        // Handle different document scenarios
        let fileUrl = '';
        let canView = false;

        if (doc.url && doc.url.startsWith('http')) {
          // Full URL provided
          fileUrl = doc.url;
          canView = true;
        } else if (doc.url && doc.url.trim() !== '') {
          // Relative URL - construct full URL
          fileUrl = `${api.getUri()}${doc.url}`;
          canView = true;
        } else if (doc.fileObject) {
          // File object available - create object URL for viewing
          try {
            fileUrl = URL.createObjectURL(doc.fileObject);
            canView = true;
          } catch (error) {
            console.error('Error creating object URL:', error);
            fileUrl = '#';
            canView = false;
          }
        } else {
          // No URL or file object available - file was uploaded but not accessible
          fileUrl = '#';
          canView = false;
        }

        const filename = doc.filename || doc.name || `Document ${doc.docIndex + 1}`;
        const isPdf = filename.toLowerCase().endsWith('.pdf');
        
        return `
          <div class="document-item">
            <div class="document-header">
              <div class="file-icon">
                ${isPdf ?
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14,2 14,8 20,8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10,9 9,9 8,9"></polyline></svg>' :
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21,15 16,10 5,21"></polyline></svg>'
          }
              </div>
              <div class="file-info">
                <div class="filename">${filename}</div>
                <div class="file-type">${doc.type || 'document'}</div>
              </div>
            </div>
            <div class="document-actions">
              ${canView ?
            `<button onclick="window.open('${fileUrl}', '_blank')" class="view-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                View
              </button>` :
            `<button onclick="alert('File was uploaded but URL is not available. This may be due to upload failure or server configuration.\\n\\nCurrent file: ${doc.filename}')" class="view-btn-disabled" title="File uploaded but URL not available - click for details">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                View
              </button>`
          }
            </div>
          </div>
        `;
      }).join('');

      return `
        <div class="service-section">
          <h3 class="service-title">${serviceName}</h3>
          ${serviceDocs}
        </div>
      `;
    }).join('');

    const modal = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
    modal.document.write(`
      <html>
        <head>
          <title>Provider Documents - ${providerDetails.name}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              padding: 24px; 
              background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); 
              color: #ffffff; 
              min-height: 100vh;
            }
            .modal-container {
              background: #2a2a4a;
              border-radius: 12px;
              padding: 32px;
              max-width: 700px;
              margin: 40px auto;
              box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            }
            h2 {
              color: #f97316;
              font-size: 28px;
              margin-bottom: 24px;
              font-weight: 700;
              text-align: center;
            }
            .document-item {
              background: #1e1e3a;
              border: 1px solid #3a3a5a;
              border-radius: 10px;
              padding: 16px;
              margin-bottom: 16px;
              display: flex;
              align-items: center;
              justify-content: space-between;
              transition: all 0.3s ease;
            }
            .document-item:hover {
              transform: translateY(-3px);
              box-shadow: 0 6px 15px rgba(0, 0, 0, 0.2);
            }
            .document-header {
              display: flex;
              align-items: center;
              flex: 1;
            }
            .file-icon {
              color: #f97316;
              margin-right: 12px;
            }
            .file-info {
              flex: 1;
            }
            .filename {
              font-size: 14px;
              font-weight: 500;
              color: #ffffff;
              margin-bottom: 4px;
              word-break: break-all;
            }
            .file-type {
              font-size: 12px;
              color: #a1a1aa;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .document-actions {
              margin-left: 16px;
            }
            .view-btn {
              background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
              color: white;
              border: none;
              border-radius: 8px;
              padding: 8px 16px;
              font-size: 12px;
              font-weight: 500;
              cursor: pointer;
              transition: all 0.3s ease;
              display: flex;
              align-items: center;
              gap: 6px;
            }
            .view-btn:hover {
              background: linear-gradient(135deg, #ea580c 0%, #dc2626 100%);
              transform: translateY(-1px);
              box-shadow: 0 4px 12px rgba(249, 115, 22, 0.4);
            }
            .view-btn-disabled {
              background: #6b7280;
              color: #d1d5db;
              border: none;
              border-radius: 8px;
              padding: 8px 16px;
              font-size: 12px;
              font-weight: 500;
              cursor: pointer;
              display: flex;
              align-items: center;
              gap: 6px;
              opacity: 0.8;
              transition: all 0.3s ease;
            }
            .view-btn-disabled:hover {
              background: #4b5563;
              color: #f3f4f6;
              opacity: 1;
            }
            .close-btn { 
              margin-top: 24px; 
              padding: 12px 24px; 
              background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); 
              color: white; 
              border: none; 
              border-radius: 8px; 
              cursor: pointer; 
              font-size: 14px;
              font-weight: 500;
              transition: all 0.3s ease;
              display: block;
              margin-left: auto;
              margin-right: auto;
            }
            .close-btn:hover {
              background: linear-gradient(135deg, #7c7c7c 0%, #5a5a5a 100%);
              transform: translateY(-1px);
            }
            .service-section {
              margin-bottom: 32px;
              padding: 20px;
              background: #1a1a3a;
              border-radius: 12px;
              border: 1px solid #3a3a5a;
            }
            .service-title {
              color: #f97316;
              font-size: 18px;
              font-weight: 600;
              margin-bottom: 16px;
              padding-bottom: 8px;
              border-bottom: 2px solid #3a3a5a;
            }
          </style>
        </head>
        <body>
          <div class="modal-container">
            <h2>Provider Documents for ${providerDetails.name}</h2>
            <p style="text-align: center; color: #a1a1aa; margin-bottom: 24px;">Total: ${providerDetails.documents.length} document(s) across ${Object.keys(documentsByService).length} service(s)</p>
            ${providerDetails.documents.length > 0 ?
        `<div class="documents-list">${fileList}</div>` :
        `<div class="empty-state">No documents available for this provider.</div>`
      }
            <button onclick="window.close()" class="close-btn">Close</button>
          </div>
        </body>
      </html>
    `);
  };

  return (
    <div className="bg-dark-700/50 border border-white/10 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-dark-100">
            {providerDetails.name}
          </h3>
        </div>
        
        {providerDetails.documents.length > 0 && (
          <button
            onClick={handleViewDocuments}
            className="inline-flex items-center justify-center w-8 h-8 text-primary-400 hover:text-primary-300 transition-colors"
            title={`View ${providerDetails.documents.length} file(s)`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" strokeWidth={2} />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

// Component to display individual provider with name fetching
const ProviderDisplay = ({ provider, providerIndex }) => {
  const [providerName, setProviderName] = useState(provider.providerName || provider.name || 'Loading...');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If we don't have a provider name, try to fetch it
    if (!provider.providerName && !provider.name && provider.providerId) {
      fetchProviderName();
    }
  }, [provider.providerId]);

  const fetchProviderName = async () => {
    if (!provider.providerId) return;

    try {
      setLoading(true);
      const response = await api.get(`/api/providers/${provider.providerId}`);
      if (response.data.success) {
        setProviderName(response.data.data.provider.name);
      } else {
        setProviderName('Unknown Provider');
      }
    } catch (error) {
      console.error('Error fetching provider name:', error);
      setProviderName('Unknown Provider');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between py-3 px-4 bg-dark-700/50 rounded-lg border border-white/10 w-full mx-0">
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
        <span className="text-sm text-dark-100 font-medium flex-1 truncate">
          {loading ? 'Loading...' : providerName}
        </span>
      </div>
      {provider.costProvider && (
        <span className="text-sm font-semibold text-blue-400 ml-4 flex-shrink-0">
          {getCurrencySymbol(provider.currency || sale.saleCurrency)}{provider.costProvider.toFixed(2)}
        </span>
      )}
    </div>
  );
};

const SaleSummary = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showServices, setShowServices] = useState(false);
  const [showProviders, setShowProviders] = useState(false);
  const [showPassengers, setShowPassengers] = useState(false);

  useEffect(() => {
    fetchSale();
  }, [id]);

  // Refresh data when navigating back to this page (e.g., from Edit Sale page)
  useEffect(() => {
    fetchSale();
  }, [location.key, id]);

  const fetchSale = async () => {
    try {
      setLoading(true);
      setError(''); // Clear any previous errors


      // Validate ObjectId format
      if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
        setError('Invalid sale ID format. The ID should be a 24-character hexadecimal string.');
        setLoading(false);
        return;
      }

      // console.log('SaleSummary - ID from URL params:', id);
      // console.log('SaleSummary - API URL:', `/api/sales/${id}`);

      // Add cache-busting parameter to ensure fresh data
      const response = await api.get(`/api/sales/${id}?t=${Date.now()}`);

      if (response.data.success) {
        const saleData = response.data.data.sale;
        
        // Use the sale data as-is from the backend (totals should be correct)
        setSale(saleData);
      }
    } catch (error) {
      console.error('Error fetching sale:', error);

      if (error.response?.status === 404) {
        setError('The requested sale was not found. This could mean the sale has been deleted, the ID is incorrect, or the sale never existed.');
      } else if (error.response?.status === 401) {
        setError('You are not authorized to view this sale. Please log in again or contact your administrator.');
      } else if (error.response?.status === 403) {
        setError('Access denied. You do not have permission to view this sale. Contact your administrator for access.');
      } else if (error.response?.status === 400) {
        setError('Invalid sale ID format. The ID should be a 24-character hexadecimal string. Please check the URL and try again.');
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.code === 'NETWORK_ERROR' || !error.response) {
        setError('Unable to connect to the server. Please check your internet connection and try again.');
      } else if (error.code === 'ECONNREFUSED') {
        setError('Server is not responding. Please check if the backend server is running and try again.');
      } else {
        setError('An unexpected error occurred while loading the sale details. Please try again or contact support.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentAdded = () => {
    // Refresh sale data to get updated balances
    fetchSale();
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
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner message="Loading sale details..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-800 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-5xl sm:text-6xl font-bold gradient-text mb-6 font-poppins">
              Sale Not Found
            </h1>
            <p className="text-xl text-dark-300 max-w-3xl mx-auto mb-8">
              The requested sale could not be found
            </p>
          </div>

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
              <p className="text-dark-300 mb-6 max-w-md mx-auto text-lg">
                {error}
              </p>
              <p className="text-dark-400 mb-8 text-sm">
                Sale ID: {id}
              </p>

              {/* Helpful suggestions */}
              <div className="bg-dark-600 rounded-lg p-6 mb-8 text-left">
                <h4 className="text-lg font-semibold text-dark-100 mb-4">What you can do:</h4>
                <ul className="space-y-2 text-dark-300">
                  <li className="flex items-start">
                    <span className="text-primary-400 mr-2">•</span>
                    <span>Check if the sale ID is correct and try again</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-400 mr-2">•</span>
                    <span>Go back to the sales list to browse all available sales</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-400 mr-2">•</span>
                    <span>Create a new sale if this one was accidentally deleted</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-400 mr-2">•</span>
                    <span>Contact support if you believe this is an error</span>
                  </li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate('/sales')}
                  className="btn-secondary"
                >
                  Back to Sales List
                </button>
                <button
                  onClick={() => navigate('/sales/new')}
                  className="btn-secondary"
                >
                  Create New Sale
                </button>
                <button
                  onClick={fetchSale}
                  className="btn-primary"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="min-h-screen bg-dark-800 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-5xl sm:text-6xl font-bold gradient-text mb-6 font-poppins">
              Sale Not Found
            </h1>
            <p className="text-xl text-dark-300 max-w-3xl mx-auto mb-8">
              The requested sale could not be found
            </p>
          </div>

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
              <p className="text-dark-300 mb-6 max-w-md mx-auto text-lg">
                The sale you're looking for doesn't exist or has been removed.
              </p>
              <p className="text-dark-400 mb-8 text-sm">
                Sale ID: {id}
              </p>

              {/* Helpful suggestions */}
              <div className="bg-dark-600 rounded-lg p-6 mb-8 text-left">
                <h4 className="text-lg font-semibold text-dark-100 mb-4">What you can do:</h4>
                <ul className="space-y-2 text-dark-300">
                  <li className="flex items-start">
                    <span className="text-primary-400 mr-2">•</span>
                    <span>Check if the sale ID is correct and try again</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-400 mr-2">•</span>
                    <span>Go back to the sales list to browse all available sales</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-400 mr-2">•</span>
                    <span>Create a new sale if this one was accidentally deleted</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-400 mr-2">•</span>
                    <span>Contact support if you believe this is an error</span>
                  </li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate('/sales')}
                  className="btn-secondary"
                >
                  Back to Sales List
                </button>
                <button
                  onClick={() => navigate('/sales/new')}
                  className="btn-secondary"
                >
                  Create New Sale
                </button>
                <button
                  onClick={fetchSale}
                  className="btn-primary"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-800 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-dark-100">Sale Summary</h1>
              <p className="text-dark-300 mt-2">Sale ID: {sale.id}</p>
            </div>
            <div className="flex space-x-3">
              <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(sale.status)}`}
                style={{ alignItems: "center" }}
              >
                {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
              </span>
              {/* <button
                onClick={fetchSale}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                title="Refresh data"
              >
                🔄 Refresh
              </button> */}
              <button
                onClick={() => navigate(`/sales/${sale.id}/edit`)}
                className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => navigate('/sales')}
                className="px-4 py-2 bg-dark-600 text-white rounded-md hover:bg-dark-700"
              >
                Back to Sales
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Sale Information */}
            <div className="bg-dark-700 shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-dark-100 mb-4">Sale Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-200">Created By</label>
                  <p className="text-dark-100">{sale.createdBy?.username}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-200">Created Date</label>
                  <p className="text-dark-100">{new Date(sale.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-200">Last Updated</label>
                  <p className="text-dark-100">{new Date(sale.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Passengers */}
            <div className="bg-dark-700 shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-dark-100">
                  Passengers ({sale.passengers.length})
                </h2>
                <button
                  onClick={() => setShowPassengers(!showPassengers)}
                  className="inline-flex items-center justify-center w-10 h-10 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-all duration-200 hover:scale-105"
                >
                  {showPassengers ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </button>
              </div>
              {showPassengers && (
                <div className="space-y-4">
                  {sale.passengers.map((passengerSale, index) => {
                    // Debug logging
                    console.log(`Passenger ${index}:`, passengerSale);
                    console.log(`Passenger ${index} passengerId:`, passengerSale.passengerId);
                    console.log(`Passenger ${index} isMainClient:`, passengerSale.isMainClient);
                    
                    // Show all passengers (both main client and companions)
                    // Handle both cases: passengerId as object or passengerId as reference
                    const passengerData = passengerSale.passengerId || passengerSale;
                    
                    // Additional debug logging for main client
                    if (passengerSale.isMainClient) {
                      console.log(`Main client passengerData:`, passengerData);
                      console.log(`Main client email:`, passengerData?.email);
                      console.log(`Main client phone:`, passengerData?.phone);
                    }
                    
                    if (passengerData) {
                      return (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div>
                            <h3 className="font-medium text-dark-100">
                              {passengerData?.name} {passengerData?.surname}
                              {passengerSale.isMainClient && (
                                <span className="ml-2 text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">
                                  Main Passenger
                                </span>
                              )}
                            </h3>
                            <p className="text-sm text-dark-300">
                              Email: {passengerData?.email || 'N/A'}
                            </p>
                            <p className="text-sm text-dark-300">
                              Phone: {passengerData?.phone || 'N/A'}
                            </p>
                            <p className="text-sm text-dark-400">
                              Passport: {passengerData?.passportNumber || 'N/A'}
                            </p>
                            {passengerSale.notes && (
                              <p className="text-sm text-dark-400 mt-1">
                                Notes: {passengerSale.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              )}
            </div>

            {/* Services */}
            <div className="bg-dark-700 shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-dark-100">
                  Services ({sale.services.length})
                </h2>
                <button
                  onClick={() => setShowServices(!showServices)}
                  className="inline-flex items-center justify-center w-10 h-10 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-all duration-200 hover:scale-105"
                >
                  {showServices ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </button>
              </div>

              {showServices && (
                <div className="space-y-4">
                  {/* Debug: Log sale data */}
                  {console.log('Sale data:', sale)}
                  {console.log('Sale services:', sale.services)}
                  {/* Destination - Simple City Display */}
                  {sale.destination && sale.destination.city && (
                    <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-4">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-blue-100 font-medium">City: {sale.destination.city}</span>
                      </div>
                    </div>
                  )}

                  {/* Individual Service Cards with Price and Dates */}
                  <div className="space-y-4">
                    {(sale.services || []).map((serviceSale, index) => {
                      // Debug: Log the service data to understand the structure
                      console.log('ServiceSale data:', serviceSale);
                      console.log('ServiceSale keys:', Object.keys(serviceSale));
                      
                      // Handle service data extraction based on actual schema
                      let serviceName = 'Unknown Service';
                      let serviceType = 'Unknown Type';
                      let serviceDescription = '';
                      let serviceCost = null;
                      let serviceCurrency = serviceSale.currency || sale.saleCurrency;
                      let startDate = null;
                      let endDate = null;
                      
                      // Extract service name
                      if (serviceSale.serviceName) {
                        serviceName = serviceSale.serviceName;
                      } else if (serviceSale.serviceId && typeof serviceSale.serviceId === 'object') {
                        serviceName = serviceSale.serviceId.destino || serviceSale.serviceId.title || 'Unknown Service';
                      }
                      
                      // Extract service type
                      if (serviceSale.serviceTypeName) {
                        serviceType = serviceSale.serviceTypeName;
                      } else if (serviceSale.serviceId && typeof serviceSale.serviceId === 'object') {
                        serviceType = serviceSale.serviceId.typeId?.name || serviceSale.serviceId.category || serviceSale.serviceId.type || 'Unknown Type';
                      }
                      
                      // Extract service description
                      if (serviceSale.serviceInfo) {
                        serviceDescription = serviceSale.serviceInfo;
                      } else if (serviceSale.serviceId && typeof serviceSale.serviceId === 'object') {
                        serviceDescription = serviceSale.serviceId.description || serviceSale.serviceId.destino || '';
                      }
                      
                      // Clean up any "undefined" values and remove "undefined -" prefix
                      if (serviceDescription && serviceDescription.includes('undefined -')) {
                        serviceDescription = serviceDescription.replace('undefined -', '').trim();
                      }
                      if (serviceDescription === 'undefined' || serviceDescription === 'undefined -') {
                        serviceDescription = '';
                      }
                      
                      
                      // Extract pricing information - use costProvider instead of priceClient
                      // Handle costProvider = 0 case by checking for null/undefined explicitly
                      serviceCost = serviceSale.costProvider !== null && serviceSale.costProvider !== undefined 
                        ? serviceSale.costProvider 
                        : (serviceSale.priceClient || serviceSale.originalAmount);
                      serviceCurrency = serviceSale.currency || serviceSale.originalCurrency || sale.saleCurrency;
                      
                      // Extract date information
                      if (serviceSale.serviceDates) {
                        startDate = serviceSale.serviceDates.startDate;
                        endDate = serviceSale.serviceDates.endDate;
                      } else {
                        // Fallback for other date field names
                        startDate = serviceSale.startDate || serviceSale.checkIn;
                        endDate = serviceSale.endDate || serviceSale.checkOut;
                      }
                      
                      // Debug: Log the extracted values
                      console.log('Extracted values:', {
                        serviceName,
                        serviceType,
                        serviceDescription,
                        serviceCost,
                        serviceCurrency,
                        startDate,
                        endDate
                      });

                      return (
                        <div key={index} className="bg-green-600/20 border border-green-500/30 rounded-lg p-4">
                          {/* Service Name - Top Left */}
                          <div className="mb-3">
                            <h3 className="text-lg font-semibold text-green-300">
                              {serviceName}
                            </h3>
                          </div>
                          
                          {/* Service Type (Left) and Price (Right) - Second Row */}
                          <div className="flex justify-between items-center mb-3">
                            <div>
                              <span className="text-sm text-green-200">Type: {serviceType}</span>
                            </div>
                            {serviceCost && (
                              <div className="text-right">
                                <p className="text-lg font-semibold text-green-300">
                                  {parseFloat(serviceCost).toFixed(2)} {getCurrencySymbol(serviceCurrency)}
                                </p>
                              </div>
                            )}
                          </div>
                          
                          {/* Service Description - Third Row */}
                          {serviceDescription && (
                            <div className="mb-3">
                              <p className="text-sm text-green-100 line-clamp-2">
                                {serviceDescription}
                              </p>
                            </div>
                          )}
                          
                          {/* Start and End Dates - Fourth Row */}
                          {(startDate || endDate) && (
                            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-green-500/20">
                              {startDate && (
                                <div>
                                  <label className="block text-xs font-medium text-green-200">Start Date</label>
                                  <p className="text-green-100 font-medium">
                                    {new Date(startDate).toLocaleDateString()}
                                  </p>
                                </div>
                              )}
                              {endDate && (
                                <div>
                                  <label className="block text-xs font-medium text-green-200">End Date</label>
                                  <p className="text-green-100 font-medium">
                                    {new Date(endDate).toLocaleDateString()}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Providers Section */}
            <div className="bg-dark-700 shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-dark-100">
                  Providers ({(() => {
                    // Calculate unique providers count
                    const seenProviders = new Set();
                    let providerCount = 0;

                    sale.services.forEach((serviceSale) => {
                      // Handle multiple providers per service (prioritize this over single provider)
                      if (serviceSale.providers && serviceSale.providers.length > 0) {
                        serviceSale.providers.forEach((provider) => {
                          const providerKey = provider.providerId?._id || provider.providerId || provider._id;
                          if (!seenProviders.has(providerKey)) {
                            seenProviders.add(providerKey);
                            providerCount++;
                          }
                        });
                      }
                      // Handle single provider per service (only if no providers array exists)
                      else if (serviceSale.providerId && (!serviceSale.providers || serviceSale.providers.length === 0)) {
                        const providerKey = serviceSale.providerId?._id || serviceSale.providerId;
                        if (!seenProviders.has(providerKey)) {
                          seenProviders.add(providerKey);
                          providerCount++;
                        }
                      }
                    });

                    return providerCount;
                  })()})
                </h2>
                <button
                  onClick={() => setShowProviders(!showProviders)}
                  className="inline-flex items-center justify-center w-10 h-10 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-all duration-200 hover:scale-105"
                >
                  {showProviders ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </button>
              </div>

              {showProviders && (
                <div className="space-y-4">
                  {(() => {
                    // Collect all unique providers across all services with aggregated documents
                    const allProviders = [];
                    const seenProviders = new Set();
                    const providerDataMap = new Map(); // Map to store aggregated provider data

                    sale.services.forEach((serviceSale, serviceIndex) => {
                      // Handle multiple providers per service (prioritize this over single provider)
                      if (serviceSale.providers && serviceSale.providers.length > 0) {
                        serviceSale.providers.forEach((provider, providerIndex) => {
                          // Create a unique identifier for the provider
                          const providerKey = provider.providerId?._id || provider.providerId || provider._id || `${serviceIndex}-${providerIndex}`;

                          if (!providerDataMap.has(providerKey)) {
                            // First time seeing this provider - initialize with base data
                            providerDataMap.set(providerKey, {
                              ...provider,
                              uniqueKey: providerKey,
                              serviceIndex,
                              providerIndex,
                              allDocuments: [], // Array to collect all documents
                              services: [] // Array to track which services this provider appears in
                            });
                          }

                          // Add documents from this service to the provider's document collection
                          const providerData = providerDataMap.get(providerKey);
                          if (provider.documents && provider.documents.length > 0) {
                            providerData.allDocuments.push(...provider.documents);
                          }
                          providerData.services.push({
                            serviceIndex,
                            serviceName: serviceSale.serviceName || 'Unknown Service',
                            documents: provider.documents || []
                          });
                        });
                      }
                      // Handle single provider per service (only if no providers array exists)
                      else if (serviceSale.providerId && (!serviceSale.providers || serviceSale.providers.length === 0)) {
                        const providerKey = serviceSale.providerId?._id || serviceSale.providerId;

                        if (!providerDataMap.has(providerKey)) {
                          // First time seeing this provider - initialize with base data
                          providerDataMap.set(providerKey, {
                            ...serviceSale,
                            uniqueKey: providerKey,
                            serviceIndex,
                            providerIndex: 0,
                            allDocuments: [], // Array to collect all documents
                            services: [] // Array to track which services this provider appears in
                          });
                        }

                        // Add documents from this service to the provider's document collection
                        const providerData = providerDataMap.get(providerKey);
                        if (serviceSale.documents && serviceSale.documents.length > 0) {
                          providerData.allDocuments.push(...serviceSale.documents);
                        }
                        providerData.services.push({
                          serviceIndex,
                          serviceName: serviceSale.serviceName || 'Unknown Service',
                          documents: serviceSale.documents || []
                        });
                      }
                    });

                    // Convert map to array and update documents property
                    allProviders.push(...Array.from(providerDataMap.values()).map(provider => ({
                      ...provider,
                      documents: provider.allDocuments // Use aggregated documents
                    })));

                    // Render each unique provider only once
                    return allProviders.map((provider) => (
                      <ProviderCard
                        key={provider.uniqueKey}
                        provider={provider}
                        serviceIndex={provider.serviceIndex}
                        providerIndex={provider.providerIndex}
                      />
                    ));
                  })()}
                </div>
              )}
            </div>


            {/* Notes */}
            {sale.notes && (
              <div className="bg-dark-700 shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold text-dark-100 mb-4">Notes</h2>
                <p className="text-dark-200">{sale.notes}</p>
              </div>
            )}

            {/* Payments */}
            <div className="bg-dark-700 shadow rounded-lg p-6">
              <PaymentsTable
                saleId={sale.id}
                onPaymentAdded={handlePaymentAdded}
                saleCurrency={sale.saleCurrency}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Financial Summary */}
            <div className="bg-dark-700 shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-dark-100 mb-4">Financial Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-dark-300">Total Sale Price:</span>
                  <span className="font-semibold text-dark-100">
                    {formatCurrencyFull(sale.totalSalePrice || 0, sale.saleCurrency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-300">Total Cost:</span>
                  <span className="font-semibold text-dark-100">
                    {formatCurrencyFull(sale.totalCost || 0, sale.saleCurrency)}
                  </span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="text-dark-300">Profit:</span>
                    <span className={`font-bold text-lg ${(sale.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrencyFull(sale.profit || 0, sale.saleCurrency)}
                    </span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-dark-300">Profit Margin:</span>
                    <span className={`font-semibold ${(() => {
                      const margin = (sale.totalSalePrice || 0) > 0 ? ((sale.profit || 0) / (sale.totalSalePrice || 0)) * 100 : 0;
                      return margin >= 0 ? 'text-green-600' : 'text-red-600';
                    })()}`}>
                      {(() => {
                        const margin = (sale.totalSalePrice || 0) > 0 ? ((sale.profit || 0) / (sale.totalSalePrice || 0)) * 100 : 0;
                        return `${margin.toFixed(2)}%`;
                      })()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Balances */}
            <div className="bg-dark-700 shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-dark-100 mb-4">Payment Balances</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-dark-300">Passenger Payments:</span>
                  <span className="font-semibold text-dark-100">
                    {formatCurrencyFull(sale.totalClientPayments, sale.saleCurrency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-300">Provider Payments:</span>
                  <span className="font-semibold text-dark-100">
                    {formatCurrencyFull(sale.totalProviderPayments, sale.saleCurrency)}
                  </span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="text-dark-300">Passenger Balance:</span>
                    <span className={`font-bold text-lg ${(() => {
                      const totalPassengerPrice = sale.totalSalePrice || 0;
                      const totalClientPayments = sale.totalClientPayments || 0;
                      const balance = totalPassengerPrice - totalClientPayments;
                      return balance <= 0 ? 'text-green-600' : 'text-red-600';
                    })()}`}>
                      {(() => {
                        const totalPassengerPrice = sale.totalSalePrice || 0;
                        const totalClientPayments = sale.totalClientPayments || 0;
                        const balance = totalPassengerPrice - totalClientPayments;
                        return formatCurrencyFull(balance, sale.saleCurrency);
                      })()}
                    </span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-dark-300">Provider Balance:</span>
                    <span className={`font-bold text-lg ${(() => {
                      const totalServiceCost = sale.services?.reduce((total, service) => {
                        const costProvider = service.costProvider !== null && service.costProvider !== undefined 
                          ? service.costProvider 
                          : (service.priceClient || service.originalAmount);
                        return total + (parseFloat(costProvider) || 0);
                      }, 0) || 0;
                      const totalProviderPayments = sale.totalProviderPayments || 0;
                      const balance = totalServiceCost - totalProviderPayments;
                      return balance >= 0 ? 'text-green-600' : 'text-red-600';
                    })()}`}>
                      {(() => {
                        const totalServiceCost = sale.services?.reduce((total, service) => {
                          const costProvider = service.costProvider !== null && service.costProvider !== undefined 
                            ? service.costProvider 
                            : (service.priceClient || service.originalAmount);
                          return total + (parseFloat(costProvider) || 0);
                        }, 0) || 0;
                        const totalProviderPayments = sale.totalProviderPayments || 0;
                        const balance = totalServiceCost - totalProviderPayments;
                        return formatCurrencyFull(balance, sale.saleCurrency);
                      })()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Profit Chart */}
            <ProfitChart sale={sale} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaleSummary;