import React from 'react';

const TopServicesTable = ({ services, title = "Top Selling Services" }) => {
  const formatCurrency = (amount) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    } else {
      return `$${amount.toFixed(2)}`;
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
        <h3 className="text-lg font-medium text-dark-100">{title}</h3>
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
            {services.map((service, index) => (
              <tr key={service.serviceId} className="hover:bg-white/5 transition-colors duration-200">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-dark-100">
                  #{index + 1}
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