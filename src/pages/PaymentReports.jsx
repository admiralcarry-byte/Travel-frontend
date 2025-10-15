import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorDisplay from '../components/ErrorDisplay';
import DataTable from '../components/DataTable';
import Button from '../components/Button';
import Modal from '../components/Modal';
import FormField from '../components/FormField';

const PaymentReports = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('bank-transfers');
  const [reports, setReports] = useState({
    bankTransfers: { data: [], summary: {}, pagination: {} },
    sellerSummary: { data: [] },
    reconciliation: { data: [], methodSummary: {} }
  });
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    sellerId: '',
    status: 'completed',
    format: 'json'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [sellers, setSellers] = useState([]);

  // Fetch sellers for filter dropdown (only when authenticated and not loading)
  useEffect(() => {
    if (!isAuthenticated || authLoading) return;
    
    const fetchSellers = async () => {
      try {
        const response = await api.get('/api/users/sellers');
        if (response.data.success) {
          setSellers(response.data.data.sellers || []);
        }
      } catch (error) {
        console.error('Error fetching sellers:', error);
        // Check if it's an authentication error
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.log('Authentication error - user may need to log in again');
        }
        // Set empty array if fetch fails (e.g., not authenticated or no sellers)
        setSellers([]);
      }
    };
    fetchSellers();
  }, [isAuthenticated, authLoading]);

  // Fetch default report on component mount (only when authenticated and not loading)
  useEffect(() => {
    if (!isAuthenticated || authLoading) return;
    
    fetchReport(activeTab);
  }, [activeTab, isAuthenticated, authLoading]);

  const fetchReport = async (reportType) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await api.get(`/api/reports/payments/${reportType}?${params}`);
      
      if (response.data.success) {
        setReports(prev => ({
          ...prev,
          [reportType]: response.data.data
        }));
      } else {
        setError(response.data.message || 'Failed to fetch report');
      }
    } catch (error) {
      console.error(`Error fetching ${reportType} report:`, error);
      // Check if it's an authentication error
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('Authentication error - user may need to log in again');
        setError('Authentication required. Please log in again.');
      } else {
        setError(error.response?.data?.message || 'Failed to fetch report');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleApplyFilters = () => {
    fetchReport(activeTab);
    setShowFilters(false);
  };

  const handleExportCSV = async (reportType) => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      params.append('format', 'csv');

      const response = await api.get(`/reports/payments/${reportType}?${params}`, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      setError('Failed to export CSV file');
    }
  };

  const formatCurrency = (amount, currency = 'USD') => {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
    
    // Replace $ with U$ for USD currency
    if (currency?.toUpperCase() === 'USD') {
      return formatted.replace('$', 'U$');
    }
    
    return formatted;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getBankTransferColumns = () => [
    { key: 'paymentId', label: 'Payment ID', sortable: true },
    { key: 'clientName', label: 'Client Name', sortable: true },
    { key: 'clientEmail', label: 'Client Email', sortable: true },
    { key: 'sellerName', label: 'Seller', sortable: true },
    { key: 'amount', label: 'Amount', sortable: true, render: (value, row) => formatCurrency(value, row.currency) },
    { key: 'date', label: 'Payment Date', sortable: true, render: (value) => formatDate(value) },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'transactionId', label: 'Transaction ID', sortable: true },
    { key: 'bankName', label: 'Bank', sortable: true },
    { key: 'totalSalePrice', label: 'Sale Total', sortable: true, render: (value, row) => formatCurrency(value, row.currency) }
  ];

  const getSellerSummaryColumns = () => [
    { key: 'sellerName', label: 'Seller Name', sortable: true },
    { key: 'sellerUsername', label: 'Username', sortable: true },
    { key: 'totalPayments', label: 'Total Payments', sortable: true },
    { key: 'totalAmount', label: 'Total Amount', sortable: true, render: (value) => formatCurrency(value) },
    { key: 'bankTransfers', label: 'Bank Transfers', sortable: true },
    { key: 'bankTransferAmount', label: 'Bank Transfer Amount', sortable: true, render: (value) => formatCurrency(value) },
    { key: 'cashPayments', label: 'Cash Payments', sortable: true },
    { key: 'cashAmount', label: 'Cash Amount', sortable: true, render: (value) => formatCurrency(value) },
    { key: 'cardPayments', label: 'Card Payments', sortable: true },
    { key: 'cardAmount', label: 'Card Amount', sortable: true, render: (value) => formatCurrency(value) }
  ];

  const getReconciliationColumns = () => [
    { key: 'paymentId', label: 'Payment ID', sortable: true },
    { key: 'clientName', label: 'Client Name', sortable: true },
    { key: 'sellerName', label: 'Seller', sortable: true },
    { key: 'amount', label: 'Amount', sortable: true, render: (value, row) => formatCurrency(value, row.currency) },
    { key: 'method', label: 'Method', sortable: true },
    { key: 'date', label: 'Payment Date', sortable: true, render: (value) => formatDate(value) },
    { key: 'transactionId', label: 'Transaction ID', sortable: true },
    { key: 'totalSalePrice', label: 'Sale Total', sortable: true, render: (value, row) => formatCurrency(value, row.currency) }
  ];

  const renderSummary = () => {
    const summary = reports[activeTab]?.summary || reports[activeTab]?.methodSummary;
    if (!summary || Object.keys(summary).length === 0) return null;

    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(summary).map(([key, value]) => (
            <div key={key} className="text-center">
              <div className="text-sm text-blue-700 dark:text-blue-300 capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </div>
              <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                {typeof value === 'number' 
                  ? (key.includes('Amount') ? formatCurrency(value) : value.toLocaleString()) 
                  : typeof value === 'object' 
                    ? JSON.stringify(value) 
                    : String(value)
                }
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'bank-transfers':
        return (
          <div>
            {renderSummary()}
            <DataTable
              data={reports.bankTransfers.data}
              columns={getBankTransferColumns()}
              loading={loading}
              pagination={reports.bankTransfers.pagination}
              onPageChange={(page) => {
                // Handle pagination if needed
                console.log('Page changed to:', page);
              }}
            />
          </div>
        );
      
      case 'seller-summary':
        return (
          <div>
            <DataTable
              data={reports.sellerSummary.data}
              columns={getSellerSummaryColumns()}
              loading={loading}
            />
          </div>
        );
      
      case 'reconciliation':
        return (
          <div>
            {renderSummary()}
            <DataTable
              data={reports.reconciliation.data}
              columns={getReconciliationColumns()}
              loading={loading}
            />
          </div>
        );
      
      default:
        return null;
    }
  };

  // Show loading state while authentication is being checked
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <LoadingSpinner />
      </div>
    );
  }

  // Show message if user is not authenticated
  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payment Reports</h1>
            <p className="text-gray-600 dark:text-gray-400">Financial reconciliation and audit reports</p>
          </div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 mb-4">
              <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-2">Authentication Required</h3>
            <p className="text-blue-700 dark:text-blue-300 mb-6">Please log in to access payment reports and financial data.</p>
            <div className="flex justify-center space-x-4">
              <Button 
                onClick={() => window.location.href = '/login'}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Go to Login
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/dashboard'}
                className="border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                Go to Dashboard
              </Button>
            </div>
            <div className="mt-6 text-sm text-blue-600 dark:text-blue-400">
              <p className="font-medium">Need help?</p>
              <p>Contact your administrator or use the default credentials:</p>
              <p className="font-mono text-xs mt-2">
                Admin: admin@travelagency.com / admin123<br/>
                Seller: seller@travelagency.com / seller123
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payment Reports</h1>
            <p className="text-gray-600 dark:text-gray-400">Financial reconciliation and audit reports</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowFilters(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
            </Button>
            <Button
              onClick={() => fetchReport(activeTab)}
              className="flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </Button>
            {/* <Button
              onClick={() => handleExportCSV(activeTab)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </Button> */}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'bank-transfers', label: 'Bank Transfers' },
              { id: 'seller-summary', label: 'Seller Summary' },
              { id: 'reconciliation', label: 'Reconciliation' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Error Display */}
        {error && <ErrorDisplay message={error} onClose={() => setError(null)} />}

        {/* Loading Spinner */}
        {loading && <LoadingSpinner />}

        {/* Tab Content */}
        {!loading && renderTabContent()}

        {/* Filters Modal */}
        <Modal
          isOpen={showFilters}
          onClose={() => setShowFilters(false)}
          title="Report Filters"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Start Date"
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
              <FormField
                label="End Date"
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
              <FormField
                label="Seller"
                type="select"
                value={filters.sellerId}
                onChange={(e) => handleFilterChange('sellerId', e.target.value)}
                options={[
                  { value: '', label: 'All Sellers' },
                  ...sellers.map(seller => ({
                    value: seller._id,
                    label: `${seller.firstName} ${seller.lastName} (${seller.username})`
                  }))
                ]}
              />
              <FormField
                label="Status"
                type="select"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                options={[
                  { value: 'completed', label: 'Completed' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'failed', label: 'Failed' },
                  { value: 'refunded', label: 'Refunded' }
                ]}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowFilters(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleApplyFilters}>
                Apply Filters
              </Button>
            </div>
          </div>
        </Modal>
      </div>
  );
};

export default PaymentReports;