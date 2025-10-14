// Font utility for ensuring proper text rendering in downloads
// This addresses the issue where Railway servers don't have access to system fonts

// Google Fonts that are commonly available and reliable
const FONT_FAMILIES = {
  primary: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  secondary: 'Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif',
  mono: '"JetBrains Mono", "Fira Code", "Consolas", "Monaco", "Courier New", monospace'
};

// CSS for embedding Google Fonts
const FONT_IMPORTS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Roboto:wght@300;400;500;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
`;

// Base styles that ensure proper font rendering
const BASE_STYLES = `
  <style>
    ${FONT_IMPORTS}
    
    * {
      font-family: ${FONT_FAMILIES.primary};
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      text-rendering: optimizeLegibility;
    }
    
    body {
      margin: 0;
      padding: 0;
      font-family: ${FONT_FAMILIES.primary};
      font-size: 14px;
      line-height: 1.5;
      color: #000;
      background: #fff;
    }
    
    h1, h2, h3, h4, h5, h6 {
      font-family: ${FONT_FAMILIES.primary};
      font-weight: 600;
      margin: 0;
      line-height: 1.2;
    }
    
    p {
      font-family: ${FONT_FAMILIES.primary};
      margin: 0;
      line-height: 1.5;
    }
    
    .font-mono {
      font-family: ${FONT_FAMILIES.mono};
    }
    
    .font-bold {
      font-weight: 700;
    }
    
    .font-semibold {
      font-weight: 600;
    }
    
    .font-medium {
      font-weight: 500;
    }
    
    .font-normal {
      font-weight: 400;
    }
    
    .font-light {
      font-weight: 300;
    }
  </style>
`;

// Function to create a complete HTML document with embedded fonts
export const createFontEmbeddedHTML = (content, title = 'Document') => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      ${BASE_STYLES}
    </head>
    <body>
      ${content}
    </body>
    </html>
  `;
};

// Function to add font styles to existing HTML content
export const addFontStyles = (htmlContent) => {
  return `
    ${BASE_STYLES}
    <div style="font-family: ${FONT_FAMILIES.primary};">
      ${htmlContent}
    </div>
  `;
};

// Function to create a container with proper font rendering for html2canvas
export const createFontRenderedContainer = (content, width = '600px') => {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-10000px';
  container.style.top = '-10000px';
  container.style.width = width;
  container.style.backgroundColor = 'white';
  container.style.fontFamily = FONT_FAMILIES.primary;
  container.style.padding = '0';
  container.style.margin = '0';
  container.style.borderRadius = '8px';
  container.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
  container.style.overflow = 'hidden';
  container.style.fontSize = '14px';
  container.style.lineHeight = '1.5';
  container.style.color = '#000';
  container.style.marginBottom = '20px';
  
  // Add font imports to the container
  const styleElement = document.createElement('style');
  styleElement.textContent = FONT_IMPORTS;
  container.appendChild(styleElement);
  
  // Add the content
  const contentDiv = document.createElement('div');
  contentDiv.innerHTML = content;
  container.appendChild(contentDiv);
  
  return container;
};

// Function to ensure fonts are loaded before rendering
export const ensureFontsLoaded = async () => {
  try {
    // Load Google Fonts
    const fontPromises = [
      'Inter:300,400,500,600,700',
      'Roboto:300,400,500,700',
      'JetBrains+Mono:400,500,600'
    ].map(font => {
      return new Promise((resolve, reject) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${font}&display=swap`;
        link.onload = resolve;
        link.onerror = reject;
        document.head.appendChild(link);
      });
    });
    
    await Promise.all(fontPromises);
    
    // Wait a bit more to ensure fonts are fully loaded
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return true;
  } catch (error) {
    console.warn('Failed to load Google Fonts, falling back to system fonts:', error);
    return false;
  }
};

// Function to create styled HTML for receipts with proper fonts
export const createStyledReceiptHTML = (receipt) => {
  return `
    <div style="width: 100%; background: white; font-family: ${FONT_FAMILIES.primary};">
      <!-- Company Header -->
      <div style="background-color: #2563eb; color: white; padding: 20px; margin-bottom: 0;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h2 style="margin: 0 0 10px 0; font-size: 24px; font-weight: 700; font-family: ${FONT_FAMILIES.primary};">${receipt.companyDetails.name}</h2>
            <p style="margin: 5px 0; font-size: 14px; font-family: ${FONT_FAMILIES.primary};">${receipt.formattedCompanyAddress}</p>
            <p style="margin: 5px 0; font-size: 14px; font-family: ${FONT_FAMILIES.primary};">${receipt.companyDetails.phone} • ${receipt.companyDetails.email}</p>
          </div>
          <div style="text-align: right;">
            <p style="font-size: 12px; margin: 0; font-family: ${FONT_FAMILIES.primary};">Generated:</p>
            <p style="font-weight: 600; margin: 0; font-size: 14px; font-family: ${FONT_FAMILIES.primary};">${new Date(receipt.generatedAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      <!-- Receipt Content -->
      <div style="padding: 20px;">
        <!-- Passenger Details -->
        <div style="margin-bottom: 20px;">
          <h3 style="color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 15px; font-size: 18px; font-weight: 600; font-family: ${FONT_FAMILIES.primary};">Passenger Details</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div>
              <div style="font-size: 12px; font-weight: 600; color: #6b7280; margin-bottom: 5px; font-family: ${FONT_FAMILIES.primary};">Name</div>
              <div style="font-weight: 700; color: black; font-size: 14px; font-family: ${FONT_FAMILIES.primary};">${receipt.passengerFullName}</div>
            </div>
            <div>
              <div style="font-size: 12px; font-weight: 600; color: #6b7280; margin-bottom: 5px; font-family: ${FONT_FAMILIES.primary};">Nationality</div>
              <div style="font-weight: 700; color: black; font-size: 14px; font-family: ${FONT_FAMILIES.primary};">${receipt.passengerDetails.nationality}</div>
            </div>
            <div>
              <div style="font-size: 12px; font-weight: 600; color: #6b7280; margin-bottom: 5px; font-family: ${FONT_FAMILIES.primary};">Passport Number</div>
              <div style="font-weight: 700; color: black; font-size: 14px; font-family: ${FONT_FAMILIES.primary};">${receipt.passengerDetails.passportNumber}</div>
            </div>
          </div>
        </div>

        <!-- Service Details -->
        <div style="margin-bottom: 20px;">
          <h3 style="color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 15px; font-size: 18px; font-weight: 600; font-family: ${FONT_FAMILIES.primary};">Service Details</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
            <div>
              <div style="font-size: 12px; font-weight: 600; color: #6b7280; margin-bottom: 5px; font-family: ${FONT_FAMILIES.primary};">Service</div>
              <div style="font-weight: 700; color: black; font-size: 14px; font-family: ${FONT_FAMILIES.primary};">${receipt.serviceDetails.title}</div>
            </div>
            <div>
              <div style="font-size: 12px; font-weight: 600; color: #6b7280; margin-bottom: 5px; font-family: ${FONT_FAMILIES.primary};">Type</div>
              <div style="font-weight: 700; color: black; font-size: 14px; font-family: ${FONT_FAMILIES.primary};">${receipt.serviceDetails.type.replace('_', ' ')}</div>
            </div>
            <div>
              <div style="font-size: 12px; font-weight: 600; color: #6b7280; margin-bottom: 5px; font-family: ${FONT_FAMILIES.primary};">Provider</div>
              <div style="font-weight: 700; color: black; font-size: 14px; font-family: ${FONT_FAMILIES.primary};">${receipt.serviceDetails.providerName}</div>
            </div>
            <div style="grid-column: 1 / -1;">
              <div style="font-size: 12px; font-weight: 600; color: #6b7280; margin-bottom: 5px; font-family: ${FONT_FAMILIES.primary};">Dates</div>
              <div style="font-weight: 700; color: black; font-size: 14px; font-family: ${FONT_FAMILIES.primary};">${receipt.formattedServiceDates}</div>
            </div>
          </div>
        </div>

        <!-- Payment Details -->
        <div style="margin-bottom: 20px;">
          <h3 style="color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 15px; font-size: 18px; font-weight: 600; font-family: ${FONT_FAMILIES.primary};">Payment Details</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
            <div>
              <div style="font-size: 12px; font-weight: 600; color: #6b7280; margin-bottom: 5px; font-family: ${FONT_FAMILIES.primary};">Amount</div>
              <div style="font-weight: 700; color: black; font-size: 16px; font-family: ${FONT_FAMILIES.primary};">${receipt.formattedPaymentAmount}</div>
            </div>
            <div>
              <div style="font-size: 12px; font-weight: 600; color: #6b7280; margin-bottom: 5px; font-family: ${FONT_FAMILIES.primary};">Payment Method</div>
              <div style="font-weight: 700; color: black; font-size: 14px; font-family: ${FONT_FAMILIES.primary};">${receipt.paymentDetails.method.replace(/_/g, ' ')}</div>
            </div>
            <div>
              <div style="font-size: 12px; font-weight: 600; color: #6b7280; margin-bottom: 5px; font-family: ${FONT_FAMILIES.primary};">Payment Date</div>
              <div style="font-weight: 700; color: black; font-size: 14px; font-family: ${FONT_FAMILIES.primary};">${new Date(receipt.paymentDetails.paymentDate).toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Bottom margin for better readability -->
      <div style="height: 40px; background: white;"></div>
    </div>
  `;
};

// Function to create styled HTML for reports with proper fonts
export const createStyledReportHTML = (data, type = 'report') => {
  const title = type === 'report' ? 'Report' : type.charAt(0).toUpperCase() + type.slice(1);
  
  return `
    <div style="width: 100%; background: white; font-family: ${FONT_FAMILIES.primary}; padding: 20px;">
      <h1 style="font-size: 24px; font-weight: 700; color: #1f2937; margin-bottom: 20px; font-family: ${FONT_FAMILIES.primary};">${title}</h1>
      <div style="font-family: ${FONT_FAMILIES.primary};">
        ${data}
      </div>
    </div>
  `;
};

export default {
  FONT_FAMILIES,
  createFontEmbeddedHTML,
  addFontStyles,
  createFontRenderedContainer,
  ensureFontsLoaded,
  createStyledReceiptHTML,
  createStyledReportHTML
};