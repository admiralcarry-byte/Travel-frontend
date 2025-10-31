import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/api';
import PaymentsTable from '../components/PaymentsTable';
import ProfitChart from '../components/ProfitChart';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorDisplay from '../components/ErrorDisplay';
import CurrencyDisplay from '../components/CurrencyDisplay';
import { formatCurrencyCompact, formatWithWarning, formatCurrencyFull, getCurrencySymbol } from '../utils/formatNumbers';

// Component for individual provider cards with expandable details
const ProviderCard = ({ provider, serviceIndex, providerIndex }) => {
  const [providerDetails, setProviderDetails] = useState(provider);
  const [loadingProvider, setLoadingProvider] = useState(true);
  const [errorProvider, setErrorProvider] = useState('');
  const [showViewModal, setShowViewModal] = useState(false);

  useEffect(() => {
    const setupProviderDetails = () => {
      // Debug: Log the provider data to understand the structure
      console.log('ProviderCard - Raw provider data:', provider);
      console.log('ProviderCard - Provider keys:', Object.keys(provider));

      // Use populated provider data directly if available
      let providerName = 'Unknown Provider';

      if (provider.providerId && typeof provider.providerId === 'object') {
        // Provider is populated from database (from providers array structure)
        providerName = provider.providerId.name || provider.providerId.destino || 'Unknown Provider';
      } else if (provider.name) {
        // Provider name is directly available (already extracted)
        providerName = provider.name;
      } else if (typeof provider === 'object' && provider._id) {
        // Provider object might have name directly
        providerName = provider.name || 'Unknown Provider';
      }

      // Extract documents - check multiple possible locations
      let documents = [];
      if (provider.documents && provider.documents.length > 0) {
        documents = provider.documents;
      } else if (provider.allDocuments && provider.allDocuments.length > 0) {
        documents = provider.allDocuments;
      }
      
      const providerDetails = {
        name: providerName,
        costProvider: provider.costProvider !== undefined && provider.costProvider !== null ? provider.costProvider : null,
        currency: provider.currency || sale.saleCurrency,
        startDate: provider.startDate || provider.serviceDates?.startDate || null,
        endDate: provider.endDate || provider.serviceDates?.endDate || null,
        documents: documents
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

  // File handling functions
  const handleOpenFile = (file) => {
    try {
      console.log('🔍 Attempting to open file:', {
        filename: file.filename || file.name,
        hasUrl: !!(file.url && file.url.trim() !== ''),
        hasFileObject: !!(file.fileObject && file.fileObject instanceof File),
        hasFile: !!(file.file && file.file instanceof File),
        fileObjectType: typeof file.fileObject,
        fileObjectKeys: file.fileObject ? Object.keys(file.fileObject) : 'no fileObject',
        fileType: typeof file.file,
        fileKeys: file.file ? Object.keys(file.file) : 'no file',
        allFileKeys: Object.keys(file)
      });
      
      console.log('🔍 Complete file object:', file);

      // Check if file has a URL (from server)
      if (file.url && file.url.trim() !== '') {
        console.log('✅ Opening file from URL:', file.url);
        window.open(file.url, '_blank');
      return;
    }

      // Check if file has a fileObject (from upload)
      if (file.fileObject && file.fileObject instanceof File) {
        console.log('✅ Opening file from fileObject');
        const url = URL.createObjectURL(file.fileObject);
        window.open(url, '_blank');
        // Clean up the URL after a delay
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        return;
      }
      
      // Check if file has a file property (alternative structure)
      if (file.file && file.file instanceof File) {
        console.log('✅ Opening file from file property');
        const url = URL.createObjectURL(file.file);
        window.open(url, '_blank');
        // Clean up the URL after a delay
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        return;
      }
      
      // Check if fileObject exists but is not a File (might be serialized)
      if (file.fileObject && typeof file.fileObject === 'object' && Object.keys(file.fileObject).length === 0) {
        console.log('⚠️ fileObject is empty object - file was serialized and lost');
        alert('File was uploaded but the file data was lost during processing. This happens when files are saved to the database.\n\nFile: ' + (file.filename || file.name || 'Unknown') + '\n\nPlease re-upload the file if you need to view it.');
        return;
      }
      
      // Check if file has empty URL (stored in database but not served)
      if (file.url === '') {
        console.log('⚠️ File has empty URL - needs server-side file serving implementation');
        alert('File is stored in the database but not accessible for viewing.\n\nFile: ' + (file.filename || file.name || 'Unknown') + '\n\nThis requires implementing a file serving system on the backend to generate proper URLs for uploaded files.');
        return;
      }
      
      // If no valid file source found, show error
      console.log('❌ No valid file source found');
      alert('File was uploaded but URL is not available. This may be due to upload failure or server configuration.\n\nCurrent file: ' + (file.filename || file.name || 'Unknown'));
    } catch (error) {
      console.error('Error opening file:', error);
      alert('Error opening file: ' + error.message);
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleViewDocuments = () => {
    setShowViewModal(true);
  };

  return (
    <>
      <div className="bg-dark-700/50 border border-white/10 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-dark-100">
              {providerDetails.name}
            </h3>
          </div>
          
          <button
            onClick={handleViewDocuments}
            disabled={!providerDetails.documents || providerDetails.documents.length === 0}
            className={`inline-flex items-center justify-center w-8 h-8 transition-colors ${
              providerDetails.documents && providerDetails.documents.length > 0
                ? 'text-primary-400 hover:text-primary-300'
                : 'text-gray-500 cursor-not-allowed'
            }`}
            title={
              providerDetails.documents && providerDetails.documents.length > 0
                ? `View ${providerDetails.documents.length} file(s)`
                : 'No files uploaded for this provider'
            }
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" strokeWidth={2} />
            </svg>
          </button>
        </div>
      </div>

      {/* File View Modal */}
      {showViewModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10000]">
          <div className="bg-dark-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-dark-100">
                Files for {providerDetails.name}
              </h3>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-dark-400 hover:text-dark-100 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {providerDetails.documents && providerDetails.documents.length > 0 ? (
              <div className="space-y-3">
                {providerDetails.documents.map((file, index) => (
                  <div
                    key={index}
                    className="bg-dark-700/50 border border-white/10 rounded-lg p-4 hover:bg-dark-700/70 transition-colors cursor-pointer"
                    onClick={() => handleOpenFile(file)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        {/* File Icon */}
                        <div className="flex-shrink-0">
                          {file.type && file.type.startsWith('image/') ? (
                            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          ) : (file.filename && file.filename.toLowerCase().endsWith('.pdf')) || (file.type && file.type.includes('pdf')) ? (
                            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          ) : (file.filename && (file.filename.toLowerCase().includes('word') || file.filename.toLowerCase().includes('doc'))) || (file.type && (file.type.includes('word') || file.type.includes('document'))) ? (
                            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          ) : (file.filename && (file.filename.toLowerCase().includes('sheet') || file.filename.toLowerCase().includes('excel'))) || (file.type && (file.type.includes('sheet') || file.type.includes('excel'))) ? (
                            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          ) : (
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          )}
                        </div>

                        {/* File Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-dark-100 truncate">
                            {file.filename || file.name || `Document ${index + 1}`}
                          </h4>
                          <div className="flex items-center space-x-4 text-xs text-dark-400">
                            {file.size && <span>{formatFileSize(file.size)}</span>}
                            {file.uploadDate && <span>{new Date(file.uploadDate).toLocaleDateString()}</span>}
                            <span className="capitalize">
                              {file.type ? file.type.split('/')[1] : (file.filename ? file.filename.split('.').pop() : 'file')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* View File Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
        // Handle different document scenarios
        let fileUrl = '';
        let canView = false;

                          if (file.url && file.url.startsWith('http')) {
          // Full URL provided
                            fileUrl = file.url;
          canView = true;
                          } else if (file.url && file.url.trim() !== '') {
          // Relative URL - construct full URL
                            fileUrl = `${api.getUri()}${file.url}`;
          canView = true;
                          } else if (file.fileObject) {
          // File object available - create object URL for viewing
          try {
                              fileUrl = URL.createObjectURL(file.fileObject);
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

                          if (canView) {
                            window.open(fileUrl, '_blank');
                          } else {
                            alert(`File was uploaded but URL is not available. This may be due to upload failure or server configuration.\n\nCurrent file: ${file.filename || file.name || 'Unknown'}`);
                          }
                        }}
                        className="text-primary-400 hover:text-primary-300 p-1 ml-2"
                        title="View file"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
              </div>
              </div>
                ))}
            </div>
            ) : (
              <div className="text-center py-8 text-dark-400">
                <svg className="w-12 h-12 mx-auto mb-4 text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>No files uploaded for this provider yet.</p>
                <p className="text-sm mt-1">Files can be uploaded during the service configuration process.</p>
            </div>
            )}

            {/* Modal Actions */}
            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-white/10">
          <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 text-dark-300 hover:text-dark-100 border border-white/10 rounded-lg transition-colors"
          >
                Close
          </button>
      </div>
    </div>
        </div>
      )}
    </>
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
          <CurrencyDisplay>{getCurrencySymbol(provider.currency || sale.saleCurrency)}{provider.costProvider.toFixed(2)}</CurrencyDisplay>
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchSale();
  }, [id]);

  // Refresh data when navigating back to this page (e.g., from Edit Sale page)
  useEffect(() => {
    fetchSale();
  }, [location.key, id]);

  // Check sale status when sale data is loaded
  useEffect(() => {
    if (sale && sale.clientBalance !== undefined) {
      // Check if sale should be automatically closed
      if (sale.clientBalance <= 0 && sale.status === 'open') {
        console.log('Sale should be closed - checking status...');
        checkSaleStatus();
      }
    }
  }, [sale]);

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

  const handlePaymentAdded = async () => {
    // Refresh sale data to get updated balances
    await fetchSale();
    
    // Check if status should be updated after payment
    if (sale && sale.clientBalance <= 0 && sale.status === 'open') {
      console.log('Payment added - checking if sale should be closed...');
      await checkSaleStatus();
    }
  };

  // Function to check and update sale status
  const checkSaleStatus = async () => {
    try {
      const response = await api.put(`/api/sales/${id}/check-status`);
      if (response.data.success) {
        const { sale: updatedSale, statusUpdate } = response.data.data;
        
        // Update the sale state with the latest data
        setSale(updatedSale);
        
        // Show notification if status changed
        if (statusUpdate.statusChanged) {
          console.log(`Sale status updated: ${statusUpdate.previousStatus} → ${statusUpdate.newStatus}`);
          // You could add a toast notification here if you have one
        }
        
        return statusUpdate;
      }
    } catch (error) {
      console.error('Error checking sale status:', error);
    }
    return null;
  };

  // Function to delete sale
  const handleDeleteSale = async () => {
    try {
      setIsDeleting(true);
      const response = await api.delete(`/api/sales/${id}`);
      
      if (response.data.success) {
        // Navigate back to sales list after successful deletion
        navigate('/sales');
      } else {
        console.error('Delete sale failed:', response.data.message);
        alert('Failed to delete sale. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting sale:', error);
      if (error.response?.data?.message) {
        alert(`Error deleting sale: ${error.response.data.message}`);
      } else {
        alert('An error occurred while deleting the sale. Please try again.');
      }
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };



  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-yellow-500 text-yellow-900';
      case 'closed': return 'bg-green-500 text-green-900';
      case 'cancelled': return 'bg-red-500 text-red-900';
      default: return 'bg-gray-500 text-gray-900';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open': return '🔓';
      case 'closed': return '🔒';
      case 'cancelled': return '❌';
      default: return '❓';
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
              <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(sale.status)}`}>
                <span className="mr-1">{getStatusIcon(sale.status)}</span>
                {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
              </span>
              <button
                onClick={checkSaleStatus}
                className="px-3 py-1 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors"
                title="Check and update sale status"
              >
                🔄 Check Status
              </button>
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
                title="Edit Sale"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={() => navigate('/sales')}
                className="px-4 py-2 bg-dark-600 text-white rounded-md hover:bg-dark-700"
                title="Back to Sales"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                title="Delete Sale"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
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
                      let serviceNotes = '';
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
                      } else if (serviceSale.serviceTemplateId && typeof serviceSale.serviceTemplateId === 'object') {
                        // Check serviceTemplateId first (for services added via new flow)
                        serviceType = serviceSale.serviceTemplateId.name || serviceSale.serviceTemplateId.category || 'Unknown Type';
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
                      
                      // Extract service notes
                      if (serviceSale.notes) {
                        serviceNotes = serviceSale.notes;
                      }
                      
                      // Clean up any "undefined" values and remove "undefined -" prefix from notes
                      if (serviceNotes && serviceNotes.includes('undefined -')) {
                        serviceNotes = serviceNotes.replace('undefined -', '').trim();
                      }
                      if (serviceNotes === 'undefined' || serviceNotes === 'undefined -') {
                        serviceNotes = '';
                      }
                      
                      // Remove "Service:" prefix from notes
                      if (serviceNotes && serviceNotes.startsWith('Service: ')) {
                        serviceNotes = serviceNotes.replace(/^Service: /, '').trim();
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
                        serviceNotes,
                        serviceCost,
                        serviceCurrency,
                        startDate,
                        endDate
                      });

                      return (
                        <div key={index} className="bg-green-600/20 border border-green-500/30 rounded-lg p-4">
                          {/* Service Type and Description - Top Section */}
                          <div className="mb-3">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <span className="text-lg font-bold text-green-200">Type: {serviceType}</span>
                                {serviceNotes && (
                                  <div className="mt-2">
                                    <span className="text-sm font-medium text-green-200">Notes: </span>
                                    <span className="text-sm text-green-100">
                                      {serviceNotes}
                                    </span>
                                  </div>
                                )}
                              </div>
                              {serviceCost && (
                                <div className="text-right">
                                  <p className="text-lg font-semibold text-green-300">
                                    <CurrencyDisplay>{parseFloat(serviceCost).toFixed(2)} {getCurrencySymbol(serviceCurrency)}</CurrencyDisplay>
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                          
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
                          // Documents can be in provider.documents or provider.providerId.documents
                          const documentsToAdd = provider.documents || provider.providerId?.documents || [];
                          if (documentsToAdd && documentsToAdd.length > 0) {
                            // Ensure we're adding document objects with proper structure
                            const validDocuments = documentsToAdd.filter(doc => doc && (doc.url || doc.filename || doc.name));
                            providerData.allDocuments.push(...validDocuments);
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
                    allProviders.push(...Array.from(providerDataMap.values()).map(provider => {
                      const providerObj = {
                        ...provider,
                        documents: provider.allDocuments || [] // Use aggregated documents
                      };
                      console.log(`🔍 Provider ${provider.uniqueKey} - Documents count:`, providerObj.documents.length);
                      console.log(`🔍 Provider ${provider.uniqueKey} - Documents:`, providerObj.documents);
                      return providerObj;
                    }));

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
            <div className="bg-dark-700 shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-dark-100 mb-4">Notes</h2>
              <p className="text-dark-200">
                Sale with {sale.services?.length || 0} service template instance{(sale.services?.length || 0) !== 1 ? 's' : ''}.
              </p>
            </div>

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
                    <CurrencyDisplay>{formatCurrencyFull(sale.totalSalePrice || 0, sale.saleCurrency)}</CurrencyDisplay>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-300">Total Cost:</span>
                  <span className="font-semibold text-dark-100">
                    <CurrencyDisplay>{formatCurrencyFull(sale.totalCost || 0, sale.saleCurrency)}</CurrencyDisplay>
                  </span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="text-dark-300">Profit:</span>
                    <span className={`font-bold text-lg ${(sale.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      <CurrencyDisplay>{formatCurrencyFull(sale.profit || 0, sale.saleCurrency)}</CurrencyDisplay>
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
                    <CurrencyDisplay>{formatCurrencyFull(sale.totalClientPayments, sale.saleCurrency)}</CurrencyDisplay>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-300">Provider Payments:</span>
                  <span className="font-semibold text-dark-100">
                    <CurrencyDisplay>{formatCurrencyFull(sale.totalProviderPayments, sale.saleCurrency)}</CurrencyDisplay>
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
                      return <CurrencyDisplay>{formatCurrencyFull(balance, sale.saleCurrency)}</CurrencyDisplay>;
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
                        return <CurrencyDisplay>{formatCurrencyFull(balance, sale.saleCurrency)}</CurrencyDisplay>;
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10000]">
          <div className="bg-dark-800 rounded-lg p-6 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-dark-100">
                Delete Sale
              </h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-dark-400 hover:text-dark-100 transition-colors"
                disabled={isDeleting}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-lg font-medium text-dark-100">Are you sure?</h4>
                  <p className="text-sm text-dark-300">This action cannot be undone.</p>
                </div>
              </div>
              
              <p className="text-dark-300 mb-4">
                You are about to permanently delete this sale record. The sale data including passenger information, service details, provider assignments, and payment records associated with this sale will be removed. Note: The underlying provider, service, and passenger entities will remain in the system.
              </p>
              
              <div className="bg-dark-700/50 border border-red-500/30 rounded-lg p-3">
                <p className="text-sm text-dark-200 font-medium">Sale ID: {sale?.id}</p>
                <p className="text-sm text-dark-300">Created: {sale?.createdAt ? new Date(sale.createdAt).toLocaleDateString() : 'N/A'}</p>
                <p className="text-sm text-dark-300">Status: {sale?.status?.charAt(0).toUpperCase() + sale?.status?.slice(1) || 'N/A'}</p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-dark-300 hover:text-dark-100 border border-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSale}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isDeleting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Delete Sale</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SaleSummary;