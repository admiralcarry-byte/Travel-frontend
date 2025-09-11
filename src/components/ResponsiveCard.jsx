import React from 'react';
import AnimatedCard from './AnimatedCard';

const ResponsiveCard = ({ 
  children, 
  title,
  subtitle,
  actions,
  className = '',
  ...props 
}) => {
  return (
    <AnimatedCard 
      className={`bg-white dark:bg-gray-800 rounded-lg shadow transition-colors duration-200 ${className}`}
      {...props}
    >
      <div className="p-4 sm:p-6">
        {(title || subtitle || actions) && (
          <div className="mb-4">
            {title && (
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {subtitle}
              </p>
            )}
            {actions && (
              <div className="mt-3 flex flex-wrap gap-2">
                {actions}
              </div>
            )}
          </div>
        )}
        <div className="text-gray-700 dark:text-gray-300">
          {children}
        </div>
      </div>
    </AnimatedCard>
  );
};

export default ResponsiveCard;