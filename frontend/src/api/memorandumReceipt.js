import api from "../api/axios";

// Allow passing query params (e.g. { requested_by: userId, employee_id: id, status: 'Issued' })
export const fetchMemorandumReceipts = async (params = {}) => {
  const response = await api.get("/memorandum-receipts", { params });
  // Extract the actual data array from nested response structure
  return response.data?.data?.data || [];
};

export const createMemorandumReceipt = async (data) => {
  const response = await api.post("/memorandum-receipts", data);
  return response.data;
};

export const fetchMemorandumReceipt = async (id) => {
  const response = await api.get(`/memorandum-receipts/${id}`);
  // Return the full response for compatibility with detail page expectations
  return response.data;
};

// Sign/Acknowledge is now handled during final acceptance.

// Approve a Memorandum Receipt
export const approveMemorandumReceipt = async (id) => {
  const response = await api.post(`/memorandum-receipts/${id}/approve`);
  return response.data;
};

// Sign a Memorandum Receipt
export const signMemorandumReceipt = async (id, data) => {
  const response = await api.post(`/memorandum-receipts/${id}/sign`, data);
  return response.data;
};

// Reject a Memorandum Receipt
export const rejectMemorandumReceipt = async (id, data) => {
  const response = await api.put(`/memorandum-receipts/${id}/reject`, data);
  return response.data;
};

// Batch Approve Multiple Memorandum Receipts
export const batchApproveMRs = async (mrIds) => {
  const response = await api.post(`/memorandum-receipts/batch-approve`, {
    mr_ids: mrIds
  });
  return response.data;
};

// Accept a Memorandum Receipt and optionally provide signature
export const acceptMemorandumReceipt = async (id, signatureData = null) => {
  const response = await api.post(`/memorandum-receipts/${id}/accept`, { signature_data: signatureData });
  return response.data;
};

// Export Memorandum Receipt as PDF
export const exportMRPDF = async (id) => {
  try {
    const response = await api.get(`/memorandum-receipts/${id}/export-pdf`, {
      responseType: 'blob'
    });

    // Create a URL for the blob
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `MR-${id}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
    return response.data;
  } catch (error) {
    console.error('Error exporting PDF:', error);
    throw error;
  }
};

// Update MR Progress (Supply Officer Only)
export const updateProgressMR = async (id, data) => {
  const response = await api.post(`/memorandum-receipts/${id}/update-progress`, data);
  return response.data;
};

// Return equipment (transition to Returned)
export const returnMemorandumReceipt = async (id, data) => {
  const response = await api.post(`/memorandum-receipts/${id}/return`, data);
  return response.data;
};

export const deleteMemorandumReceipt = async (id) => {
  const response = await api.delete(`/memorandum-receipts/${id}`);
  return response.data;
};
