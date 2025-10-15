import React from 'react';

const KPICard = ({ title, value, subtitle, icon, color = 'blue', trend, trendValue, delay = 0, valueType = 'currency' }) => {
  // Icon mapping for modern SVG icons
  const iconComponents = {
    'money': (
      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        <path d="M7 4V2C7 1.45 7.45 1 8 1s1 .45 1 1v2h6V2c0-.55.45-1 1-1s1 .45 1 1v2h2c1.1 0 2 .9 2 2v14c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2h2zm12 16H5V8h14v12z"/>
        <path d="M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 3c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
      </svg>
    ),
    'chart': (
      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
        <path d="M3 13h2v8H3v-8zm4-6h2v14H7V7zm4-4h2v18h-2V3zm4 8h2v10h-2V11zm4-6h2v16h-2V5z"/>
      </svg>
    ),
    'users': (
      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
        <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H17c-.8 0-1.54.37-2.01.99L14 10.5 12.01 8.99A2.5 2.5 0 0 0 10 8H8.46c-.8 0-1.54.37-2.01.99L4 10.5V22h2v-6h2.5l2.54-7.63A1.5 1.5 0 0 1 12.46 8H14c.8 0 1.54.37 2.01.99L18 10.5V22h2z"/>
        <path d="M12.5 11.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5S11 9.17 11 10s.67 1.5 1.5 1.5zM5.5 6c1.11 0 2-.89 2-2s-.89-2-2-2-2 .89-2 2 .89 2 2 2zm0 1c-2.33 0-7 1.17-7 3.5V19h14v-8.5c0-2.33-4.67-3.5-7-3.5zm8.5 6c0-.55-.45-1-1-1s-1 .45-1 1 .45 1 1 1 1-.45 1-1z"/>
      </svg>
    ),
    'building': (
      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/>
      </svg>
    )
  };
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
      const absVal = Math.abs(val);
      const isNegative = val < 0;
      const sign = isNegative ? '-' : '';
      
      if (valueType === 'currency') {
        if (absVal >= 1000000) {
          return `${sign}U$${(absVal / 1000000).toFixed(1)}M`;
        } else if (absVal >= 1000) {
          return `${sign}U$${(absVal / 1000).toFixed(1)}K`;
        } else {
          return `${sign}U$${absVal.toFixed(2)}`;
        }
      } else if (valueType === 'number') {
        // Format as plain number with commas
        return `${sign}${absVal.toLocaleString()}`;
      } else if (valueType === 'decimal') {
        // Format as decimal number
        return `${sign}${absVal.toFixed(2)}`;
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
            <div className="text-white">
              {iconComponents[icon] || icon}
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