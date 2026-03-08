import axios from 'axios';
import api from './axios'; // Use the shared axios instance with credentials

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

/**
 * Desktop: Create a new scanner session
 */
export const createScannerSession = async () => {
  try {
    const response = await api.post('/scanner-sessions');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Mobile: Join session without authentication
 */
export const joinScannerSession = async (sessionCode) => {
  try {
    const response = await axios.post(
      `${backendUrl}/api/v1/scanner-sessions/join`,
      { session_code: sessionCode }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Mobile: Submit scanned QR code
 */
export const submitScan = async (sessionId, qrCode, notes = '') => {
  try {
    const response = await axios.post(
      `${backendUrl}/api/v1/scanner-sessions/submit-scan`,
      {
        session_id: sessionId,
        qr_code: qrCode,
        notes: notes,
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Desktop: Get new scans from mobile
 */
export const getNewScans = async (sessionId) => {
  try {
    const response = await api.get(`/scanner-sessions/${sessionId}/scans`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Desktop: Mark a scan as processed
 */
export const markScanProcessed = async (scanId) => {
  try {
    const response = await api.patch(`/scanner-scans/${scanId}/processed`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Get session status
 */
export const getScannerSessionStatus = async (sessionId) => {
  try {
    const response = await api.get(`/scanner-sessions/${sessionId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Desktop: Close session
 */
export const closeScannerSession = async (sessionId) => {
  try {
    const response = await api.post(`/scanner-sessions/${sessionId}/close`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
