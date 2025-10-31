import React from 'react';

/**
 * CurrencyDisplay component that prevents browser translation of currency values
 * This component wraps currency values with translate="no" to prevent
 * automatic translation by browser translation features like Google Translate
 */
const CurrencyDisplay = ({ 
  children, 
  className = '', 
  as: Component = 'span',
  ...props 
}) => {
  return (
    <Component 
      translate="no" 
      className={className}
      {...props}
    >
      {children}
    </Component>
  );
};

export default CurrencyDisplay;
