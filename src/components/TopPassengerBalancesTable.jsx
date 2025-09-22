import React, { useState } from 'react';

const TopPassengerBalancesTable = ({ balances, title = "Top Passenger Balances" }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  if (!balances || balances.length === 0) {
    return (
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10">
          <h3 className="text-lg font-medium text-dark-100">{title}</h3>
        </div>
        <div className="p-6">
          <div className="text-center py-8 text-dark-400">
            No passenger balances data available
          </div>
        </div>
      </div>
    );
  }

  // Pagination logic
  const totalRows = balances.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedBalances = balances.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value));
    setCurrentPage(1); // Reset to first page when changing rows per page
  };

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
              <option value={10}>10</option>
              <option value={15}>15</option>
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
                Passenger
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                Balance
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                Sales
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {paginatedBalances.map((client, index) => (
              <tr key={index} className="hover:bg-white/5 transition-colors duration-200">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-dark-100">{client.clientName}</div>
                  <div className="text-sm text-dark-400">{client.clientEmail}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-100">
                  ${client.totalBalance.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-300">
                  {client.saleCount}
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
    </div>
  );
};

export default TopPassengerBalancesTable;