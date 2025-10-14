import React from 'react';

const ResponsiveGrid = ({ 
  children, 
  cols = { default: 1, sm: 2, md: 3, lg: 4 },
  gap = 6,
  className = ''
}) => {
  const getGridCols = () => {
    const colClasses = [];
    
    if (cols.default) colClasses.push(`grid-cols-${cols.default}`);
    if (cols.sm) colClasses.push(`sm:grid-cols-${cols.sm}`);
    if (cols.md) colClasses.push(`md:grid-cols-${cols.md}`);
    if (cols.lg) colClasses.push(`lg:grid-cols-${cols.lg}`);
    if (cols.xl) colClasses.push(`xl:grid-cols-${cols.xl}`);
    
    return colClasses.join(' ');
  };

  return (
    <div className={`grid ${getGridCols()} gap-${gap} ${className}`}>
      {children}
    </div>
  );
};

export default ResponsiveGrid;