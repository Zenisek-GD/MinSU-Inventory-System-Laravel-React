import api from './axios';

/**
 * Export Memorandum Receipt as PDF
 * @param {number} mrId - The Memorandum Receipt ID
 * @returns {Promise} - Downloads the PDF file
 */
export const exportMemorandumReceiptPDF = async (mrId) => {
  try {
    const response = await api.get(`/memorandum-receipts/${mrId}/export-pdf`, {
      responseType: 'blob',
      withCredentials: true,
    });

    // Create a blob from the response
    const blob = new Blob([response.data], { type: 'application/pdf' });
    
    // Create a temporary URL for the blob
    const url = window.URL.createObjectURL(blob);
    
    // Create a temporary anchor element and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = `MR-${String(mrId).padStart(6, '0')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Release the URL object
    window.URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Failed to export PDF:', error);
    throw error;
  }
};

/**
 * Print Memorandum Receipt (browser print dialog)
 * @param {number} mrId - The Memorandum Receipt ID
 */
export const printMemorandumReceipt = async (mrId) => {
  try {
    const response = await api.get(`/memorandum-receipts/${mrId}/export-pdf`, {
      responseType: 'blob',
      withCredentials: true,
    });

    // Create a blob from the response
    const blob = new Blob([response.data], { type: 'application/pdf' });
    
    // Create a temporary URL for the blob
    const url = window.URL.createObjectURL(blob);
    
    // Open print dialog
    const newWindow = window.open(url);
    
    if (newWindow) {
      newWindow.addEventListener('load', () => {
        newWindow.print();
      });
    }

    // Release the URL object after a delay (print dialog closes)
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 1000);

    return true;
  } catch (error) {
    console.error('Failed to print:', error);
    throw error;
  }
};
