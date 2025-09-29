// Utility functions for payment method formatting

// Helper function to format method names
export const formatMethodName = (method) => {
  // Return the method name as-is since it's now stored exactly as entered by the user
  return method || '';
};

// Helper function to format method names in short form (for tables with limited space)
export const formatMethodNameShort = (method) => {
  // Return the method name as-is since it's now stored exactly as entered by the user
  return method || '';
};

// Helper function to get method icons
export const getMethodIcon = (method) => {
  if (!method) return '💳';
  
  const methodLower = method.toLowerCase();
  
  // Generic icon mapping based on common keywords
  if (methodLower.includes('crypto') || methodLower.includes('bitcoin')) {
    return '₿';
  } else if (methodLower.includes('transfer') || methodLower.includes('bank')) {
    return '🏦';
  } else if (methodLower.includes('card') || methodLower.includes('credit') || methodLower.includes('debit')) {
    return '💳';
  } else if (methodLower.includes('cash') || methodLower.includes('money')) {
    return '$';
  } else if (methodLower.includes('check') || methodLower.includes('cheque')) {
    return '✓';
  } else if (methodLower.includes('deposit')) {
    return '🏦';
  } else {
    // Default icon for unknown methods
    return '💳';
  }
};