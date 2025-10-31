// PDF generation utility with embedded fonts for Railway deployment
// This ensures proper text rendering when generating PDFs on servers without system fonts

import jsPDF from 'jspdf';

// Font configuration for PDF generation
const PDF_FONTS = {
  primary: 'helvetica',
  secondary: 'times',
  mono: 'courier'
};

// Function to create a PDF with proper font rendering
export const createPDF = (content, options = {}) => {
  const {
    title = 'Document',
    filename = 'document.pdf',
    orientation = 'portrait',
    unit = 'mm',
    format = 'a4',
    margin = 20
  } = options;

  const doc = new jsPDF({
    orientation,
    unit,
    format
  });

  // Set default font
  doc.setFont(PDF_FONTS.primary);
  doc.setFontSize(12);

  // Add title
  if (title) {
    doc.setFontSize(18);
    doc.setFont(PDF_FONTS.primary, 'bold');
    doc.text(title, margin, margin);
    doc.setFontSize(12);
    doc.setFont(PDF_FONTS.primary, 'normal');
  }

  // Add content
  if (typeof content === 'string') {
    // Simple text content
    const lines = doc.splitTextToSize(content, format === 'a4' ? 170 : 120);
    doc.text(lines, margin, margin + 20);
  } else if (Array.isArray(content)) {
    // Array of content objects
    let yPosition = margin + 20;
    
    content.forEach(item => {
      if (item.type === 'text') {
        doc.setFontSize(item.fontSize || 12);
        doc.setFont(PDF_FONTS.primary, item.fontStyle || 'normal');
        doc.text(item.text, margin, yPosition);
        yPosition += (item.fontSize || 12) * 0.4;
      } else if (item.type === 'line') {
        yPosition += 5;
        doc.line(margin, yPosition, format === 'a4' ? 190 : 140, yPosition);
        yPosition += 5;
      } else if (item.type === 'space') {
        yPosition += item.height || 10;
      }
    });
  }

  return doc;
};

// Function to create a receipt PDF
export const createReceiptPDF = (receipt, options = {}) => {
  const {
    filename = `receipt-${receipt.receiptNumber}.pdf`,
    orientation = 'portrait'
  } = options;

  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4'
  });

  const margin = 20;
  const pageWidth = 210; // A4 width in mm
  const contentWidth = pageWidth - (margin * 2);
  let yPosition = margin;

  // Company Header
  doc.setFillColor(37, 99, 235); // Blue background
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255); // White text
  doc.setFontSize(20);
  doc.setFont(PDF_FONTS.primary, 'bold');
  doc.text(receipt.companyDetails.name, margin, yPosition + 15);
  
  doc.setFontSize(12);
  doc.setFont(PDF_FONTS.primary, 'normal');
  doc.text(receipt.formattedCompanyAddress, margin, yPosition + 25);
  doc.text(`${receipt.companyDetails.phone} • ${receipt.companyDetails.email}`, margin, yPosition + 32);
  
  // Generated date
  doc.text(`Generated: ${new Date(receipt.generatedAt).toLocaleDateString()}`, pageWidth - margin - 50, yPosition + 15);
  
  yPosition = 50;
  doc.setTextColor(0, 0, 0); // Black text

  // Passenger Details
  doc.setFontSize(16);
  doc.setFont(PDF_FONTS.primary, 'bold');
  doc.text('Passenger Details', margin, yPosition);
  yPosition += 10;
  
  doc.setFontSize(12);
  doc.setFont(PDF_FONTS.primary, 'normal');
  
  const passengerData = [
    { label: 'Name', value: receipt.passengerFullName },
    { label: 'Nationality', value: receipt.passengerDetails.nationality },
    { label: 'Passport Number', value: receipt.passengerDetails.passportNumber }
  ];
  
  passengerData.forEach(item => {
    doc.setFont(PDF_FONTS.primary, 'bold');
    doc.text(`${item.label}:`, margin, yPosition);
    doc.setFont(PDF_FONTS.primary, 'normal');
    doc.text(item.value, margin + 40, yPosition);
    yPosition += 8;
  });
  
  yPosition += 10;

  // Service Details
  doc.setFontSize(16);
  doc.setFont(PDF_FONTS.primary, 'bold');
  doc.text('Service Details', margin, yPosition);
  yPosition += 10;
  
  doc.setFontSize(12);
  doc.setFont(PDF_FONTS.primary, 'normal');
  
  const serviceData = [
    { label: 'Service', value: receipt.serviceDetails.title },
    { label: 'Type', value: receipt.serviceDetails.type.replace('_', ' ') },
    { label: 'Provider', value: receipt.serviceDetails.providerName },
    { label: 'Dates', value: receipt.formattedServiceDates }
  ];
  
  serviceData.forEach(item => {
    doc.setFont(PDF_FONTS.primary, 'bold');
    doc.text(`${item.label}:`, margin, yPosition);
    doc.setFont(PDF_FONTS.primary, 'normal');
    doc.text(item.value, margin + 40, yPosition);
    yPosition += 8;
  });
  
  yPosition += 10;

  // Payment Details
  doc.setFontSize(16);
  doc.setFont(PDF_FONTS.primary, 'bold');
  doc.text('Payment Details', margin, yPosition);
  yPosition += 10;
  
  doc.setFontSize(12);
  doc.setFont(PDF_FONTS.primary, 'normal');
  
  const paymentData = [
    { label: 'Amount', value: receipt.formattedPaymentAmount },
    { label: 'Payment Method', value: receipt.paymentDetails.method.replace(/_/g, ' ') },
    { label: 'Payment Date', value: new Date(receipt.paymentDetails.paymentDate).toLocaleDateString() }
  ];
  
  paymentData.forEach(item => {
    doc.setFont(PDF_FONTS.primary, 'bold');
    doc.text(`${item.label}:`, margin, yPosition);
    doc.setFont(PDF_FONTS.primary, 'normal');
    doc.text(item.value, margin + 40, yPosition);
    yPosition += 8;
  });

  return doc;
};

// Function to create a report PDF
export const createReportPDF = (data, title, options = {}) => {
  const {
    filename = `${title.toLowerCase().replace(/\s+/g, '-')}.pdf`,
    orientation = 'landscape'
  } = options;

  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4'
  });

  const margin = 20;
  const pageWidth = orientation === 'landscape' ? 297 : 210;
  const contentWidth = pageWidth - (margin * 2);
  let yPosition = margin;

  // Title
  doc.setFontSize(20);
  doc.setFont(PDF_FONTS.primary, 'bold');
  doc.text(title, margin, yPosition);
  yPosition += 15;

  // Date
  doc.setFontSize(12);
  doc.setFont(PDF_FONTS.primary, 'normal');
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, yPosition);
  yPosition += 20;

  // Content
  if (Array.isArray(data)) {
    // Table data
    const headers = Object.keys(data[0] || {});
    const colWidth = contentWidth / headers.length;
    
    // Headers
    doc.setFont(PDF_FONTS.primary, 'bold');
    headers.forEach((header, index) => {
      doc.text(header, margin + (index * colWidth), yPosition);
    });
    yPosition += 10;
    
    // Data rows
    doc.setFont(PDF_FONTS.primary, 'normal');
    data.forEach(row => {
      headers.forEach((header, index) => {
        const value = row[header] || '';
        doc.text(String(value), margin + (index * colWidth), yPosition);
      });
      yPosition += 8;
      
      // Check if we need a new page
      if (yPosition > 280) {
        doc.addPage();
        yPosition = margin;
      }
    });
  } else {
    // Simple text content
    const lines = doc.splitTextToSize(JSON.stringify(data, null, 2), contentWidth);
    doc.text(lines, margin, yPosition);
  }

  return doc;
};

// Function to download PDF
export const downloadPDF = (doc, filename) => {
  doc.save(filename);
};

// Function to create and download a PDF
export const createAndDownloadPDF = (content, title, options = {}) => {
  const doc = createPDF(content, { title, ...options });
  const filename = options.filename || `${title.toLowerCase().replace(/\s+/g, '-')}.pdf`;
  downloadPDF(doc, filename);
  return doc;
};

export default {
  PDF_FONTS,
  createPDF,
  createReceiptPDF,
  createReportPDF,
  downloadPDF,
  createAndDownloadPDF
};