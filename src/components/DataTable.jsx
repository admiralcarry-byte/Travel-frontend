import React from 'react';
import LoadingSpinner from './LoadingSpinner';

const DataTable = ({
  data = [],
  columns = [],
  loading = false,
  error = null,
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  rowsPerPage = 5,
  onPageChange,
  onRowsPerPageChange,
  onRowClick = null,
  emptyMessage = 'No data available',
  className = '',
  showPagination = true,
  showRowsPerPage = true
}) => {
  const handlePageChange = (newPage) => {
    if (onPageChange && newPage >= 1 && newPage <= totalPages) {
      onPageChange(newPage);
    }
  };

  const handleRowsPerPageChange = (e) => {
    if (onRowsPerPageChange) {
      onRowsPerPageChange(parseInt(e.target.value));
    }
  };

  const renderPagination = () => {
    if (!showPagination || totalPages <= 1) return null;

    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="flex items-center justify-between px-4 py-3 bg-dark-700 border-t border-white/10">
        <div className="flex items-center space-x-2">
          {showRowsPerPage && (
            <>
              <span className="text-sm text-dark-300">Rows per page:</span>
              <select
                value={rowsPerPage}
                onChange={handleRowsPerPageChange}
                className="input-field w-20 text-sm"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm text-dark-300">
            Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, totalItems)} of {totalItems} results
          </span>
          
          <div className="flex space-x-1">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm bg-dark-600 text-dark-200 rounded-md hover:bg-dark-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {pageNumbers.map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-1 text-sm rounded-md ${
                  page === currentPage
                    ? 'bg-primary-500 text-white'
                    : 'bg-dark-600 text-dark-200 hover:bg-dark-500'
                }`}
              >
                {page}
              </button>
            ))}
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm bg-dark-600 text-dark-200 rounded-md hover:bg-dark-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="card-glass p-8">
        <LoadingSpinner message="Loading data..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-glass p-8">
        <div className="text-center">
          <div className="icon-container bg-error-500 mx-auto mb-4">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-error-400 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="card-glass p-8">
        <div className="text-center">
          <div className="icon-container bg-dark-500 mx-auto mb-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-dark-300 font-medium">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`card-glass overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full divide-y divide-white/10">
          <thead className="bg-dark-700">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className="px-6 py-3 text-left text-xs font-semibold text-dark-300 uppercase tracking-wider"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={`hover:bg-white/5 transition-colors ${
                  onRowClick ? 'cursor-pointer' : ''
                }`}
                onClick={() => onRowClick && onRowClick(row, rowIndex)}
              >
                {columns.map((column, colIndex) => (
                  <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                    {column.render ? column.render(row[column.key], row, rowIndex) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {renderPagination()}
    </div>
  );
};

export default DataTable;