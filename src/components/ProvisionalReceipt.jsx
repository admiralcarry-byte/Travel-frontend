import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { createFontRenderedContainer, ensureFontsLoaded, createStyledReceiptHTML } from '../utils/fontUtils';
import { createReceiptPDF, downloadPDF } from '../utils/pdfUtils';

const ProvisionalReceipt = ({ paymentId, saleId, onClose, onReceiptCompleted }) => {
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [whatsappStatus, setWhatsappStatus] = useState('pending');
  const [responseMessage, setResponseMessage] = useState('');

  useEffect(() => {
    if (paymentId && saleId) {
      loadOrGenerateReceipt();
    }
  }, [paymentId, saleId]);

  const loadOrGenerateReceipt = async () => {
    setLoading(true);
    setError('');

    try {
      // First, try to find an existing receipt for this payment
      const existingReceiptsResponse = await api.get(`/api/receipts?paymentId=${paymentId}`);
      
      if (existingReceiptsResponse.data.success && 
          existingReceiptsResponse.data.data.receipts.length > 0) {
        // Load the existing receipt
        const existingReceipt = existingReceiptsResponse.data.data.receipts[0];
        setReceipt(existingReceipt);
        setWhatsappStatus(existingReceipt.whatsappStatus.status);
        // Auto-download the existing receipt
        setTimeout(() => downloadReceipt(), 1000);
      } else {
        // No existing receipt found, generate a new one
        await generateReceipt();
      }
    } catch (error) {
      // If there's an error loading existing receipts, try to generate a new one
      console.warn('Failed to load existing receipts, generating new one:', error);
      await generateReceipt();
    } finally {
      setLoading(false);
    }
  };

  const generateReceipt = async () => {
    try {
      const response = await api.post('/api/receipts/generate', {
        paymentId,
        saleId
      });

      if (response.data.success) {
        setReceipt(response.data.data.receipt);
        setWhatsappStatus(response.data.data.receipt.whatsappStatus.status);
        // Auto-download the receipt when generated
        setTimeout(() => downloadReceipt(), 1000);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to generate receipt');
    }
  };

  const handleWhatsAppShare = () => {
    if (receipt?.whatsappShareUrl) {
      window.open(receipt.whatsappShareUrl, '_blank');

      // Mark as sent after opening WhatsApp
      markAsSent();
    }
  };

  const markAsSent = async () => {
    try {
      const response = await api.put(`/api/receipts/${receipt._id}/mark-sent`, {
        messageId: `whatsapp_${Date.now()}`
      });
      
      // Update the receipt object with the new data from the API response
      if (response.data.success && response.data.data.receipt) {
        setReceipt(response.data.data.receipt);
        setWhatsappStatus(response.data.data.receipt.whatsappStatus.status);
      } else {
        setWhatsappStatus('sent');
      }
    } catch (error) {
      console.error('Failed to mark as sent:', error);
    }
  };

  const handleResponseSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await api.put(`/api/receipts/${receipt._id}/mark-responded`, {
        responseMessage
      });
      
      // Update the receipt object with the new data from the API response
      if (response.data.success && response.data.data.receipt) {
        setReceipt(response.data.data.receipt);
        setWhatsappStatus(response.data.data.receipt.whatsappStatus.status);
      } else {
        setWhatsappStatus('responded');
      }
      
      setResponseMessage('');
      
      // Notify parent that receipt process is completed
      if (onReceiptCompleted) {
        onReceiptCompleted(paymentId);
      }
      
      // Close the modal
      onClose();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to submit response');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
      case 'sent':
        return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      case 'responded':
        return 'bg-green-500/20 text-green-400 border border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'sent':
        return 'Sent';
      case 'responded':
        return 'Responded';
      default:
        return 'Unknown';
    }
  };

  const downloadReceipt = async () => {
    if (!receipt) {
      // Silently return without showing error message or alert
      return;
    }

    try {
      console.log('Starting PNG generation with receipt:', receipt);
      
      // Validate receipt data
      if (!receipt.passengerDetails || !receipt.serviceDetails || !receipt.paymentDetails) {
        throw new Error('Receipt data is incomplete. Missing required fields.');
      }
      
      // Ensure fonts are loaded before generating the receipt
      console.log('Loading fonts...');
      await ensureFontsLoaded();
      console.log('Fonts loaded successfully');

      // Create styled receipt HTML with embedded fonts
      console.log('Creating styled receipt HTML...');
      const receiptHTML = createStyledReceiptHTML(receipt);
      console.log('Receipt HTML created:', receiptHTML.substring(0, 200) + '...');
      
      // Validate HTML was created
      if (!receiptHTML || receiptHTML.length < 100) {
        throw new Error('Failed to generate receipt HTML. HTML is too short or empty.');
      }

      // Create a container with proper font rendering
      console.log('Creating font rendered container...');
      const tempContainer = createFontRenderedContainer(receiptHTML, '600px');
      document.body.appendChild(tempContainer);
      console.log('Container created and added to DOM');

      // Wait for the container to be rendered and fonts to be applied
      console.log('Waiting for rendering...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Import html2canvas
      console.log('Importing html2canvas...');
      const html2canvas = (await import('html2canvas')).default;
      console.log('html2canvas imported successfully');
      
      // Convert to canvas with enhanced options for better font rendering
      console.log('Converting to canvas...');
      const canvasOptions = {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: false, // Disable CORS to avoid issues
        allowTaint: false, // Disable taint to avoid issues
        width: 600,
        height: tempContainer.scrollHeight,
        logging: true, // Enable logging to see what's happening
        foreignObjectRendering: false, // Disable foreign object rendering
        imageTimeout: 10000,
        removeContainer: false,
        ignoreElements: (element) => {
          // Ignore elements that might cause issues
          return element.tagName === 'SCRIPT' || element.tagName === 'LINK';
        }
      };
      
      console.log('Canvas options:', canvasOptions);
      const canvas = await html2canvas(tempContainer, canvasOptions);
      console.log('Canvas created successfully:', canvas);

      // Create download link
      console.log('Creating download link...');
      const link = document.createElement('a');
      link.download = `receipt-${receipt.receiptNumber}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      console.log('Download link created');
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      console.log('Download triggered');
      
      // Clean up
      document.body.removeChild(link);
      document.body.removeChild(tempContainer);
      console.log('Cleanup completed');

    } catch (error) {
      console.error('Failed to download PNG:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // Try a simpler fallback approach
      try {
        console.log('Attempting fallback PNG generation...');
        await generateSimplePNG(receipt);
      } catch (fallbackError) {
        console.error('Fallback PNG generation also failed:', fallbackError);
        alert(`Failed to generate PNG: ${error.message}. Please try downloading as PDF instead.`);
      }
    }
  };

  // Fallback PNG generation with simpler approach
  const generateSimplePNG = async (receipt) => {
    try {
      console.log('Using simple PNG generation fallback...');
      
      // Create a simple HTML structure without complex styling
      const simpleHTML = `
        <div style="width: 600px; padding: 20px; font-family: Arial, sans-serif; background: white;">
          <h2 style="color: #2563eb; margin-bottom: 20px;">${receipt.companyDetails.name}</h2>
          <div style="margin-bottom: 15px;">
            <strong>Passenger:</strong> ${receipt.passengerDetails.name} ${receipt.passengerDetails.surname}
          </div>
          <div style="margin-bottom: 15px;">
            <strong>Service:</strong> ${receipt.serviceDetails.title}
          </div>
          <div style="margin-bottom: 15px;">
            <strong>Amount:</strong> ${receipt.paymentDetails.currency} ${receipt.paymentDetails.amount}
          </div>
          <div style="margin-bottom: 15px;">
            <strong>Payment Method:</strong> ${receipt.paymentDetails.method}
          </div>
          <div style="margin-bottom: 15px;">
            <strong>Date:</strong> ${new Date(receipt.paymentDetails.paymentDate).toLocaleDateString()}
          </div>
        </div>
      `;
      
      // Create container and append to body
      const tempContainer = document.createElement('div');
      tempContainer.innerHTML = simpleHTML;
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '-9999px';
      document.body.appendChild(tempContainer);
      
      // Wait a moment for rendering
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Import html2canvas and convert
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(tempContainer, {
        backgroundColor: '#ffffff',
        scale: 1,
        logging: false
      });
      
      // Create and trigger download
      const link = document.createElement('a');
      link.download = `receipt-${receipt.receiptNumber || 'simple'}.png`;
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      document.body.removeChild(tempContainer);
      
      console.log('Simple PNG generation successful');
    } catch (error) {
      console.error('Simple PNG generation failed:', error);
      throw error;
    }
  };

  const downloadReceiptPDF = () => {
    if (!receipt) return;

    try {
      const doc = createReceiptPDF(receipt);
      const filename = `receipt-${receipt.receiptNumber}.pdf`;
      downloadPDF(doc, filename);
    } catch (error) {
      console.error('Failed to download PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">{error}</div>
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 text-xl mb-4">No receipt data available</div>
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-lg shadow-xl border">
        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-black mb-2">
              Provisional Receipt
            </h1>
            <p className="text-xl text-gray-600">
              Receipt #{receipt.receiptNumber}
            </p>
          </div>

          {/* Receipt Card */}
          <div id="receipt-content" className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
            {/* Company Header */}
            <div className="bg-primary-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{receipt.companyDetails.name}</h2>
                  <p className="text-primary-100">{receipt.formattedCompanyAddress}</p>
                  <p className="text-primary-100">
                    {receipt.companyDetails.phone} • {receipt.companyDetails.email}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-primary-100">Generated:</p>
                  <p className="font-semibold">
                    {new Date(receipt.generatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Receipt Content */}
            <div className="p-6 space-y-6">
              {/* Passenger Details */}
              <div>
                <h3 className="text-lg font-semibold text-black mb-3">Passenger Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                     <p className="text-sm font-semibold text-gray-600">Name</p>
                     <p className="font-bold text-black">{receipt.passengerFullName}</p>
                   </div>
                   <div>
                     <p className="text-sm font-semibold text-gray-600">Passport Number</p>
                     <p className="font-bold text-black">{receipt.passengerDetails.passportNumber}</p>
                   </div>
                   <div>
                     <p className="text-sm font-semibold text-gray-600">Nationality</p>
                     <p className="font-bold text-black">{receipt.passengerDetails.nationality}</p>
                   </div>
                </div>
              </div>

              {/* Service Details */}
              <div>
                <h3 className="text-lg font-semibold text-black mb-3">Service Details</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                     <p className="text-sm font-semibold text-gray-600">Service</p>
                     <p className="font-bold text-black">{receipt.serviceDetails.title}</p>
                   </div>
                   <div>
                     <p className="text-sm font-semibold text-gray-600">Type</p>
                     <p className="font-bold text-black capitalize">{receipt.serviceDetails.type.replace('_', ' ')}</p>
                   </div>
                   <div>
                     <p className="text-sm font-semibold text-gray-600">Provider</p>
                     <p className="font-bold text-black">{receipt.serviceDetails.providerName}</p>
                   </div>
                   <div className="md:col-span-2">
                     <p className="text-sm font-semibold text-gray-600">Dates</p>
                     <p className="font-bold text-black">{receipt.formattedServiceDates}</p>
                   </div>
                 </div>
              </div>

              {/* Payment Details */}
              <div>
                <h3 className="text-lg font-semibold text-black mb-3">Payment Details</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                     <p className="text-sm font-semibold text-gray-600">Amount</p>
                     <p className="font-bold text-lg text-black">{receipt.formattedPaymentAmount}</p>
                   </div>
                   <div>
                     <p className="text-sm font-semibold text-gray-600">Payment Method</p>
                     <p className="font-bold text-black capitalize">
                       {receipt.paymentDetails.method.replace(/_/g, ' ')}
                     </p>
                   </div>
                   <div>
                     <p className="text-sm font-semibold text-gray-600">Payment Date</p>
                     <p className="font-bold text-black">
                       {new Date(receipt.paymentDetails.paymentDate).toLocaleDateString()}
                     </p>
                   </div>
                 </div>
              </div>

              {/* WhatsApp Status */}
              <div>
                <h3 className="text-lg font-semibold text-black mb-3">WhatsApp Status</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(whatsappStatus)}`}>
                      {getStatusText(whatsappStatus)}
                    </span>
                    {whatsappStatus === 'sent' && receipt.whatsappStatus.sentAt && (
                      <span className="text-sm text-gray-500">
                        Sent: {new Date(receipt.whatsappStatus.sentAt).toLocaleString()}
                      </span>
                    )}
                    {whatsappStatus === 'responded' && receipt.whatsappStatus.respondedAt && (
                      <span className="text-sm text-gray-500">
                        Responded: {new Date(receipt.whatsappStatus.respondedAt).toLocaleString()}
                      </span>
                    )}
                  </div>

                  {whatsappStatus === 'pending' && (
                    <button
                      onClick={handleWhatsAppShare}
                      className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center space-x-2"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                      </svg>
                      <span>Share via WhatsApp</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Conversation History */}
              {receipt?.whatsappStatus?.conversationHistory && receipt.whatsappStatus.conversationHistory.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-black mb-3">Conversation History</h3>
                  <div className="space-y-3 max-h-40 overflow-y-auto">
                    {receipt.whatsappStatus.conversationHistory.map((msg, index) => (
                      <div key={index} className={`p-3 rounded-lg ${
                        msg.type === 'customer' 
                          ? 'bg-blue-50 border-l-4 border-blue-400' 
                          : 'bg-gray-50 border-l-4 border-gray-400'
                      }`}>
                        <div className="flex justify-between items-start">
                          <p className="text-sm text-black font-medium">{msg.message}</p>
                          <span className="text-xs text-gray-600 ml-2">
                            {new Date(msg.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {msg.type === 'customer' ? 'Customer' : 'Agent'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Response Form */}
              {whatsappStatus === 'sent' && (
                <div>
                  <h3 className="text-lg font-semibold text-black mb-3">Customer Response</h3>
                  <form onSubmit={handleResponseSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="responseMessage" className="block text-sm font-medium text-gray-600 mb-2">
                        Response Message
                      </label>
                      <textarea
                        id="responseMessage"
                        value={responseMessage}
                        onChange={(e) => setResponseMessage(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 font-semibold text-black bg-white"
                        placeholder="Enter customer response..."
                      />
                    </div>
                    <button
                      type="submit"
                      className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
                    >
                      Mark as Responded
                    </button>
                  </form>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-center gap-4 pt-6 border-t border-gray-200">
                <button
                  onClick={downloadReceipt}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download PNG
                </button>
                <button
                  onClick={downloadReceiptPDF}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Download PDF
                </button>
                <button
                  onClick={onClose}
                  className="bg-primary-600 text-white px-8 py-3 rounded-lg hover:bg-primary-700 font-semibold"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProvisionalReceipt;