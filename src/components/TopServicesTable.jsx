import React, { useState } from 'react';

const TopServicesTable = ({ services, title = "Top Selling Services" }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const formatCurrency = (amount) => {
    // Handle null, undefined, NaN, or invalid numbers
    if (amount === null || amount === undefined || isNaN(amount)) {
      return 'U$0.00';
    }
    if (amount >= 1000000) {
      return `U$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `U$${(amount / 1000).toFixed(1)}K`;
    } else {
      return `U$${amount.toFixed(2)}`;
    }
  };

  const getServiceTypeColor = (type) => {
    const colors = {
      hotel: 'badge-primary',
      airline: 'badge-success',
      transfer: 'badge-warning',
      excursion: 'badge-primary',
      insurance: 'badge-error'
    };
    return colors[type] || 'badge-primary';
  };

  // Pagination logic
  const totalRows = services.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedServices = services.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value));
    setCurrentPage(1); // Reset to first page when changing rows per page
  };

  if (!services || services.length === 0) {
    return (
      <div className="card p-6">
        <h3 className="text-lg font-medium text-dark-100 mb-4">{title}</h3>
        <div className="text-center py-8 text-dark-400">
          No services data available
        </div>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="px-6 py-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-dark-100">{title}</h3>
          
          {/* Rows per page selector */}
          <div className="flex items-center space-x-2">
            <label htmlFor="rowsPerPage" className="text-sm text-dark-300">
              Rows per page:
            </label>
            <select
              id="rowsPerPage"
              value={rowsPerPage}
              onChange={handleRowsPerPageChange}
              className="px-3 py-1 text-sm border border-dark-600 rounded-md bg-dark-700 text-dark-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/10">
          <thead className="bg-dark-700/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                Rank
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                Service
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                Provider
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                Quantity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                Revenue
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                Profit
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                Sales
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {paginatedServices.map((service, index) => (
              <tr key={service.serviceId} className="hover:bg-white/5 transition-colors duration-200">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-dark-100">
                  #{startIndex + index + 1}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-dark-100">
                    {service.serviceName}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-300">
                  {service.providerName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`badge ${getServiceTypeColor(service.serviceType)}`}>
                    {service.serviceType}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-100">
                  {service.totalQuantity}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-100">
                  <div className="font-medium">{formatCurrency(service.totalRevenue)}</div>
                  <div className="text-xs text-dark-400">
                    Avg: {formatCurrency(service.avgRevenue)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className={`font-medium ${service.totalProfit >= 0 ? 'text-success-400' : 'text-error-400'}`}>
                    {formatCurrency(service.totalProfit)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-100">
                  {service.saleCount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-white/10">
        <div className="text-sm text-dark-300">
          Showing {startIndex + 1} to {Math.min(endIndex, totalRows)} of {totalRows} results
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Previous button */}
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm border border-dark-600 rounded-md bg-dark-700 text-dark-100 hover:bg-dark-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          
          {/* Page numbers */}
          <div className="flex space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNumber;
              if (totalPages <= 5) {
                pageNumber = i + 1;
              } else if (currentPage <= 3) {
                pageNumber = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNumber = totalPages - 4 + i;
              } else {
                pageNumber = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNumber}
                  onClick={() => handlePageChange(pageNumber)}
                  className={`px-3 py-1 text-sm border rounded-md transition-colors ${
                    currentPage === pageNumber
                      ? 'bg-primary-500 border-primary-500 text-white'
                      : 'border-dark-600 bg-dark-700 text-dark-100 hover:bg-dark-600'
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}
          </div>
          
          {/* Next button */}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-sm border border-dark-600 rounded-md bg-dark-700 text-dark-100 hover:bg-dark-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>
      
      {/* Summary */}
      <div className="bg-dark-700/50 px-6 py-3 border-t border-white/10">
        <div className="flex justify-between text-sm text-dark-300">
          <span>Total Services: {services.length}</span>
          <span>
            Total Revenue: {formatCurrency(services.reduce((sum, s) => sum + s.totalRevenue, 0))}
          </span>
          <span>
            Total Profit: {formatCurrency(services.reduce((sum, s) => sum + s.totalProfit, 0))}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TopServicesTable;