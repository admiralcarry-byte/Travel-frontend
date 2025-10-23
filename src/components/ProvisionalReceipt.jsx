import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { createFontRenderedContainer, ensureFontsLoaded, createStyledReceiptHTML } from '../utils/fontUtils';
import { createReceiptPDF, downloadPDF } from '../utils/pdfUtils';

const ProvisionalReceipt = ({ paymentId, saleId, onClose, onReceiptCompleted, onReceiptResponded }) => {
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [whatsappStatus, setWhatsappStatus] = useState('pending');
  const [responseMessage, setResponseMessage] = useState('');

  useEffect(() => {
    loadOrGenerateReceipt();
  }, [paymentId, saleId]);

  const loadOrGenerateReceipt = async () => {
    try {
      setLoading(true);
      setError('');

      // First, try to find an existing receipt for this payment
      const existingReceiptsResponse = await api.get(`/api/receipts?paymentId=${paymentId}`);
      
      if (existingReceiptsResponse.data.success && 
          existingReceiptsResponse.data.data.length > 0) {
        // Load the existing receipt
        const existingReceipt = existingReceiptsResponse.data.data[0];
        setReceipt(existingReceipt);
        setWhatsappStatus(existingReceipt.whatsappStatus?.status || 'pending');
      } else {
        // No existing receipt found, generate a new one
        await generateReceipt();
      }
    } catch (error) {
      console.error('Error loading receipt:', error);
      setError('Failed to load receipt');
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
      }
    } catch (error) {
      console.error('Receipt generation error:', error);
      setError('Failed to generate receipt');
    }
  };

  const createSimplifiedReceiptHTML = (receipt) => {
    return `
      <div style="max-width: 400px; margin: 0 auto; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
          <h1 style="font-size: 24px; font-weight: bold; color: #1f2937 !important; margin: 0; background: none !important;">
            Welcome here!
          </h1>
          <p style="font-size: 14px; color: #6b7280; margin: 0;">
            ${new Date(receipt.generatedAt).toLocaleDateString()}
          </p>
        </div>

        <!-- Receipt Content -->
        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px;">
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <!-- Amount -->
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 14px; font-weight: 500; color: #6b7280;">Amount:</span>
              <span style="font-weight: bold; font-size: 18px; color: #1f2937;">${receipt.formattedPaymentAmount}</span>
            </div>
            
            <!-- Payment Date -->
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 14px; font-weight: 500; color: #6b7280;">Payment Date:</span>
              <span style="font-weight: 600; color: #1f2937;">
                ${new Date(receipt.paymentDetails.paymentDate).toLocaleDateString()}
              </span>
            </div>
            
            <!-- Payment Method -->
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 14px; font-weight: 500; color: #6b7280;">Payment Method:</span>
              <span style="font-weight: 600; color: #1f2937; text-transform: capitalize;">
                ${receipt.paymentDetails.method.replace(/_/g, ' ')}
              </span>
            </div>
          </div>
        </div>
      </div>
    `;
  };

  const handleWhatsAppShare = async () => {
    try {
      const response = await api.put(`/api/receipts/${receipt._id}/mark-sent`);
      
      if (response.data.success) {
        // Update the receipt with the new data
        if (response.data.data && response.data.data.receipt) {
          setReceipt(response.data.data.receipt);
          setWhatsappStatus(response.data.data.receipt.whatsappStatus?.status || 'sent');
        } else {
          // Fallback: just update the status
          setWhatsappStatus('sent');
        }
      }
    } catch (error) {
      console.error('WhatsApp share error:', error);
      setError('Failed to mark receipt as sent');
    }
  };

  const handleResponseSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await api.put(`/api/receipts/${receipt._id}/mark-responded`, {
        response: responseMessage
      });
      
      // Update the receipt object with the new data from the API response
      if (response.data.success) {
        if (response.data.data && response.data.data.receipt) {
          setReceipt(response.data.data.receipt);
          setWhatsappStatus(response.data.data.receipt.whatsappStatus?.status || 'responded');
        } else {
          setWhatsappStatus('responded');
        }
      } else {
        setWhatsappStatus('responded');
      }
      
      setResponseMessage('');
      
      // Notify parent that receipt process is completed
      if (onReceiptCompleted) {
        onReceiptCompleted(paymentId);
      }
      
      // Notify parent that receipt has been responded to
      if (onReceiptResponded) {
        onReceiptResponded(paymentId);
      }
      
      // Close the modal
      onClose();
    } catch (error) {
      console.error('Response submit error:', error);
      setError(error.response?.data?.message || 'Failed to submit response');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'responded':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
    if (!receipt) return;

    try {
      await ensureFontsLoaded();
      const container = createFontRenderedContainer();
      
      // Create simplified receipt HTML that matches the displayed version
      const html = createSimplifiedReceiptHTML(receipt);
      container.innerHTML = html;
      document.body.appendChild(container);

      // Use html2canvas to convert to image
      const canvas = await import('html2canvas').then(html2canvas => 
        html2canvas.default(container, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        })
      );

      // Convert canvas to blob and download
      canvas.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `receipt-${receipt.receiptNumber}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 'image/png');

      // Clean up
      document.body.removeChild(container);
    } catch (error) {
      console.error('Download error:', error);
      setError('Failed to download receipt');
    }
  };


  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading receipt...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl max-w-md">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-4">⚠️</div>
            <div className="text-gray-800 text-lg mb-4">{error}</div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={loadOrGenerateReceipt}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
              >
                Retry
              </button>
              <button
                onClick={onClose}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl max-w-md">
          <div className="text-center">
            <div className="text-gray-500 text-xl mb-4">No receipt data available</div>
            <button
              onClick={onClose}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white max-w-md w-full rounded-lg shadow-xl border">
        <div className="p-4">
          {/* Simplified Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-black bg-blue-100 px-2 py-1 rounded inline-block">
              Welcome here!
            </h1>
            <p className="text-sm text-gray-600">
              {new Date(receipt.generatedAt).toLocaleDateString()}
            </p>
          </div>

          {/* Simplified Receipt Content */}
          <div id="receipt-content" className="bg-white rounded-lg border border-gray-200 p-4 notranslate" translate="no">
            <div className="space-y-3">
              {/* Amount */}
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Amount:</span>
                <span className="font-bold text-lg text-black">{receipt.formattedPaymentAmount}</span>
              </div>
              
              {/* Payment Date */}
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Payment Date:</span>
                <span className="font-semibold text-black">
                  {new Date(receipt.paymentDetails.paymentDate).toLocaleDateString()}
                </span>
              </div>
              
              {/* Payment Method */}
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Payment Method:</span>
                <span className="font-semibold text-black capitalize">
                  {receipt.paymentDetails.method.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
          </div>

          {/* WhatsApp Status Section */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-black mb-3">WhatsApp Status</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(whatsappStatus)}`}>
                  {getStatusText(whatsappStatus)}
                </span>
                {whatsappStatus === 'sent' && receipt.whatsappStatus?.sentAt && (
                  <span className="text-sm text-gray-500">
                    Sent: {new Date(receipt.whatsappStatus.sentAt).toLocaleString()}
                  </span>
                )}
                {whatsappStatus === 'responded' && receipt.whatsappStatus?.respondedAt && (
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
            
            {/* Display payment amount and response message when responded */}
            {whatsappStatus === 'responded' && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Amount:</span>
                    <span className="text-sm font-bold text-gray-900">
                      {receipt.paymentDetails?.currency || 'USD'} {receipt.paymentDetails?.amount || '0'}
                    </span>
                  </div>
                  {receipt.whatsappStatus?.responseMessage && (
                    <div className="mt-2">
                      <span className="text-sm font-medium text-gray-700 block mb-1">Response:</span>
                      <div className="text-sm text-gray-900 bg-white p-2 rounded border">
                        {receipt.whatsappStatus.responseMessage}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Response Form */}
          {whatsappStatus === 'sent' && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-black mb-3">Response Message</h3>
              <form onSubmit={handleResponseSubmit} className="space-y-4">
                <div>
                  <textarea
                    value={responseMessage}
                    onChange={(e) => setResponseMessage(e.target.value)}
                    placeholder="Enter customer response..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none text-gray-900"
                    rows={3}
                  />
                </div>
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
                >
                  Mark as Responded
                </button>
              </form>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-center gap-3 pt-4 border-t border-gray-200 mt-4">
            <button
              onClick={downloadReceipt}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-semibold flex items-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download
            </button>
            <button
              onClick={onClose}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 font-semibold text-sm"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProvisionalReceipt;