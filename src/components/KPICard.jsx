import React from 'react';

const KPICard = ({ title, value, subtitle, icon, color = 'blue', trend, trendValue, delay = 0 }) => {
  const colorGradients = {
    blue: 'from-primary-500 to-primary-600',
    green: 'from-green-500 to-green-600',
    yellow: 'from-yellow-500 to-yellow-600',
    red: 'from-red-500 to-red-600',
    purple: 'from-purple-500 to-purple-600',
    indigo: 'from-indigo-500 to-indigo-600'
  };

  const formatValue = (val) => {
    if (typeof val === 'number') {
      if (val >= 1000000) {
        return `$${(val / 1000000).toFixed(1)}M`;
      } else if (val >= 1000) {
        return `$${(val / 1000).toFixed(1)}K`;
      } else {
        return `$${val.toFixed(2)}`;
      }
    }
    return val;
  };

  const getTrendColor = (trend) => {
    if (trend === 'up') return 'text-green-600 dark:text-green-400';
    if (trend === 'down') return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getTrendIcon = (trend) => {
    if (trend === 'up') return '↗';
    if (trend === 'down') return '↘';
    return '→';
  };

  return (
    <div className="card p-6 hover:shadow-2xl transition-all duration-300 ease-out transform hover:scale-105 animate-slide-up" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className={`w-16 h-16 bg-gradient-to-r ${colorGradients[color]} rounded-2xl flex items-center justify-center shadow-lg animate-float`}>
            <div className="text-white text-2xl">
              {icon}
            </div>
          </div>
        </div>
        <div className="ml-6 w-0 flex-1">
          <dl>
            <dt className="text-sm font-semibold text-gray-600 dark:text-gray-400 truncate mb-2">
              {title}
            </dt>
            <dd className="flex items-baseline">
              <div className="text-3xl font-bold gradient-text">
                {formatValue(value)}
              </div>
              {trend && trendValue && (
                <div className={`ml-3 flex items-baseline text-sm font-semibold ${getTrendColor(trend)}`}>
                  <span className="text-lg animate-pulse">{getTrendIcon(trend)}</span>
                  <span className="ml-1">{trendValue}%</span>
                </div>
              )}
            </dd>
            {subtitle && (
              <dd className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {subtitle}
              </dd>
            )}
          </dl>
        </div>
      </div>
      
      {/* Shimmer effect on hover */}
      <div className="shimmer-effect opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
    </div>
  );
};

export default KPICard;