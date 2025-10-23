import React from 'react';

/**
 * NoTranslate Component
 * 
 * A wrapper component that prevents browser translation for database content.
 * This ensures that all text stored in the database is displayed as-is without
 * being translated by the browser's translation function.
 * 
 * Usage:
 * <NoTranslate>
 *   <div>Database content that should not be translated</div>
 * </NoTranslate>
 */
const NoTranslate = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={`notranslate ${className}`} 
      translate="no"
      {...props}
    >
      {children}
    </div>
  );
};

export default NoTranslate;