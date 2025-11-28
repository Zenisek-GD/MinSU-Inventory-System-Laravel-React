import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Chip,
  Button,
  Alert,
  Dialog,
  Grid,
  TextField,
} from '@mui/material';
import {
  QrCode as QRIcon,
  CameraAlt as CameraIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { QrReader } from '@blackbox-vision/react-qr-reader';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { fetchItemByQr, updateItemStatus } from '../api/item';

const QRScanner = () => {
  const [scannedData, setScannedData] = useState('');
  const [scannedItem, setScannedItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [manualInputOpen, setManualInputOpen] = useState(false);
  const [manualCode, setManualCode] = useState('');

  const handleScan = async (qrCode) => {
    if (!qrCode || typeof qrCode !== 'string') return;
    
    setScannedData(qrCode);
    setLoading(true);
    setError('');
    setInfo('');

    try {
      // Get data from backend API
      const response = await fetchItemByQr(qrCode);
      setScannedItem(response);
      setInfo('Item found successfully!');
    } catch (error) {
      console.error('Error fetching item:', error);
      setError('Item not found. Please try a different QR code.');
      setScannedItem(null);
    } finally {
      setLoading(false);
    }
  };

  const handleManualScan = () => {
    if (manualCode.trim()) {
      handleScan(manualCode.trim());
      setManualInputOpen(false);
      setManualCode('');
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Simulate QR code reading from image
      const reader = new FileReader();
      reader.onload = (e) => {
        // In a real app, you would use a QR code library here
        // For demo, we'll just use a mock QR code from the filename
        const mockQrCode = `ITEM-${file.name.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 6)}`;
        handleScan(mockQrCode);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!scannedItem) return;
    try {
      await updateItemStatus(scannedItem.id, { status: newStatus });
      setInfo(`Item status updated to ${newStatus}`);
      setScannedItem({ ...scannedItem, status: newStatus });
    } catch {
      setError('Failed to update item status.');
    }
  };

  const resetScanner = () => {
    setScannedData('');
    setScannedItem(null);
    setError('');
    setInfo('');
  };

  const getStatusColor = (status) => {
    const colors = {
      'Available': 'success',
      'Borrowed': 'warning',
      'Under Maintenance': 'info',
      'Lost': 'error',
      'Disposed': 'default'
    };
    return colors[status] || 'default';
  };

  const getConditionColor = (condition) => {
    const colors = {
      'Excellent': 'success',
      'Good': 'primary',
      'Fair': 'warning',
      'Needs Repair': 'error',
      'Damaged': 'error',
      'Disposed': 'default'
    };
    return colors[condition] || 'default';
  };

  // Demo QR codes for testing
  const demoQRCodes = [
    { code: 'ITEM-LAP-001', label: 'Laptop' },
    { code: 'ITEM-PRN-001', label: 'Printer' },
    { code: 'ITEM-PRO-001', label: 'Projector' },
  ];

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          QR Code Scanner
        </Typography>

        <Grid container spacing={3}>
        {/* Scanner Interface */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <QRIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Scan QR Code
            </Typography>
            <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
              Point your camera at a QR code or use one of the options below
            </Typography>

            {/* Camera Scanner */}
            <Paper sx={{ p: 2, mb: 3, backgroundColor: '#f5f5f5' }}>
              <QrReader
                constraints={{ facingMode: 'environment' }}
                onResult={(result, error) => {
                  if (!!result) {
                    handleScan(result?.text || result?.data || '');
                  }
                  if (!!error && error.message && !error.message.includes('NotFound')) {
                    console.error('QR Reader error:', error);
                  }
                }}
                containerStyle={{ width: '100%' }}
                videoStyle={{ width: '100%' }}
              />
            </Paper>

            {/* Demo QR Codes */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Try Scanning:
              </Typography>
              <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 1 }}>
                Use your camera or manual entry to scan item QR codes
              </Typography>
            </Box>

            {/* Manual Input */}
            <Box sx={{ mb: 3 }}>
              <Button
                variant="outlined"
                onClick={() => setManualInputOpen(true)}
                sx={{ mb: 1 }}
              >
                Enter QR Code Manually
              </Button>
              <Typography variant="caption" display="block" color="textSecondary">
                Or type the QR code directly
              </Typography>
            </Box>

            {/* File Upload */}
            <Box>
              <Button
                variant="outlined"
                component="label"
                startIcon={<CameraIcon />}
              >
                Upload QR Image
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleFileUpload}
                />
              </Button>
              <Typography variant="caption" display="block" color="textSecondary" sx={{ mt: 1 }}>
                Upload an image containing a QR code
              </Typography>
            </Box>

            {/* Scanner Status */}
            {scannedData && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Scanned: {scannedData}
              </Alert>
            )}

            {loading && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Loading item information...
              </Alert>
            )}

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}

            {info && (
              <Alert severity="success" sx={{ mt: 2 }}>
                {info}
              </Alert>
            )}

            {(scannedData || scannedItem) && (
              <Button
                startIcon={<RefreshIcon />}
                onClick={resetScanner}
                sx={{ mt: 2 }}
              >
                Scan Another Code
              </Button>
            )}
          </Paper>
        </Grid>

        {/* Item Details */}
        <Grid item xs={12} md={6}>
          {scannedItem ? (
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom fontWeight={600}>
                  {scannedItem.name}
                </Typography>

                <Box display="flex" gap={1} mb={2} flexWrap="wrap">
                  <Chip 
                    label={scannedItem.status} 
                    color={getStatusColor(scannedItem.status)}
                    size="small"
                  />
                  {scannedItem.condition && (
                    <Chip 
                      label={scannedItem.condition} 
                      color={getConditionColor(scannedItem.condition)}
                      size="small"
                    />
                  )}
                </Box>

                <Typography variant="body2" color="textSecondary" gutterBottom sx={{ mb: 2 }}>
                  {scannedItem.description}
                </Typography>

                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="textSecondary">
                      Category
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {scannedItem.category?.name}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="textSecondary">
                      Office
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {scannedItem.office?.name}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="textSecondary">
                      Serial Number
                    </Typography>
                    <Typography variant="body2" fontFamily="monospace">
                      {scannedItem.serial_number}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="textSecondary">
                      QR Code
                    </Typography>
                    <Typography variant="body2" fontFamily="monospace">
                      {scannedItem.qr_code}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="textSecondary">
                      Purchase Date
                    </Typography>
                    <Typography variant="body2">
                      {new Date(scannedItem.purchase_date).toLocaleDateString()}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="textSecondary">
                      Purchase Price
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      ₱{scannedItem.purchase_price?.toLocaleString()}
                    </Typography>
                  </Grid>

                  {scannedItem.warranty_expiry && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="textSecondary">
                        Warranty Expiry
                      </Typography>
                      <Typography variant="body2">
                        {new Date(scannedItem.warranty_expiry).toLocaleDateString()}
                      </Typography>
                    </Grid>
                  )}

                  {scannedItem.notes && (
                    <Grid item xs={12}>
                      <Typography variant="caption" color="textSecondary">
                        Notes
                      </Typography>
                      <Typography variant="body2">
                        {scannedItem.notes}
                      </Typography>
                    </Grid>
                  )}

                  {/* Current Borrow Information */}
                  {scannedItem.current_borrow && (
                    <Grid item xs={12}>
                      <Alert severity="warning" sx={{ mt: 1 }}>
                        <Typography variant="subtitle2" fontWeight={600}>
                          Currently Borrowed
                        </Typography>
                        <Typography variant="body2">
                          By: {scannedItem.current_borrow.borrowed_by?.name || scannedItem.current_borrow.borrowedBy?.name}<br />
                          Since: {new Date(scannedItem.current_borrow.borrow_date).toLocaleDateString()}<br />
                          Expected Return: {new Date(scannedItem.current_borrow.expected_return_date).toLocaleDateString()}
                        </Typography>
                      </Alert>
                    </Grid>
                  )}

                  {/* Borrow History */}
                  {scannedItem.borrow_records && scannedItem.borrow_records.length > 0 && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                        Recent Borrow History
                      </Typography>
                      {scannedItem.borrow_records.slice(0, 3).map((record) => (
                        <Box key={record.id} sx={{ mb: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                          <Typography variant="body2">
                            {record.borrowed_by?.name} - {new Date(record.borrow_date).toLocaleDateString()}
                          </Typography>
                        </Box>
                      ))}
                    </Grid>
                  )}

                  {/* Update Status Buttons */}
                  <Grid item xs={12}>
                    <Box display="flex" gap={1} sx={{ mt: 2 }}>
                      {scannedItem.status === 'Available' && (
                        <Button
                          variant="contained"
                          color="warning"
                          onClick={() => handleUpdateStatus('Borrowed')}
                          fullWidth
                        >
                          Mark as Borrowed
                        </Button>
                      )}
                      {scannedItem.status === 'Borrowed' && (
                        <Button
                          variant="contained"
                          color="success"
                          onClick={() => handleUpdateStatus('Available')}
                          fullWidth
                        >
                          Mark as Returned
                        </Button>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ) : (
            <Paper sx={{ p: 4, textAlign: 'center', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
              <Box>
                <QRIcon sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
                <Typography variant="h6" color="textSecondary" gutterBottom>
                  No QR Code Scanned
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Scan a QR code to view item details
                </Typography>
              </Box>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Manual Input Dialog */}
      <Dialog 
        open={manualInputOpen} 
        onClose={() => setManualInputOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            Enter QR Code Manually
          </Typography>
          <TextField
            fullWidth
            label="QR Code"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="e.g., ITEM-LAP-001"
            sx={{ mb: 2 }}
            autoFocus
          />
          <Box display="flex" gap={1} justifyContent="flex-end">
            <Button onClick={() => setManualInputOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={handleManualScan}
              disabled={!manualCode.trim()}
            >
              Scan
            </Button>
          </Box>
        </Box>
      </Dialog>
    </Box>
    </DashboardLayout>
  );
};

export default QRScanner;
