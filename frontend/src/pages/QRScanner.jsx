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
import jsQR from 'jsqr';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { fetchItemByQr, updateItemStatus } from '../api/item';
import { useUser } from '../context/UserContext';

const QRScanner = () => {
  const { user } = useUser();
  const [scannedData, setScannedData] = useState('');
  const [scannedItem, setScannedItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [manualInputOpen, setManualInputOpen] = useState(false);
  const [manualCode, setManualCode] = useState('');

  const handleScan = async (qrCode) => {
    if (!qrCode || typeof qrCode !== 'string') return;
    
    const cleanedCode = qrCode.trim();
    setScannedData(cleanedCode);
    setLoading(true);
    setError('');
    setInfo('');

    try {
      console.log('[QRScanner] Scanning QR code:', cleanedCode);
      // Get data from backend API
      const response = await fetchItemByQr(cleanedCode);
      console.log('[QRScanner] Item found:', response);
      setScannedItem(response);
      setInfo('Item found successfully!');
    } catch (error) {
      console.error('[QRScanner] Error fetching item:', error);
      console.error('[QRScanner] Error response:', error.response?.data);
      setError(`Item not found. Please try a different QR code. (${cleanedCode})`);
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
      const reader = new FileReader();
      reader.onload = async (e) => {
        // Create an image element to load the file
        const img = new Image();
        img.onload = () => {
          // Create a canvas and draw the image
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          
          // Get image data
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          // Decode QR code using jsQR
          try {
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            if (code) {
              console.log('[QRScanner] QR decoded from image:', code.data);
              handleScan(code.data);
            } else {
              setError('No QR code found in the uploaded image.');
            }
          } catch (err) {
            console.error('[QRScanner] QR decoder error:', err);
            setError('Error decoding QR code. Please try another image.');
          }
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!scannedItem) return;
    setLoading(true);
    try {
      console.log(`[QRScanner] Updating item ${scannedItem.id} status to ${newStatus}`);
      await updateItemStatus(scannedItem.id, { status: newStatus });
      console.log(`[QRScanner] Status updated successfully`);
      // Update the scanned item with new status
      const updatedItem = { ...scannedItem, status: newStatus };
      setScannedItem(updatedItem);
      setInfo(`Item marked as ${newStatus} successfully!`);
      // Clear error if any
      setError('');
    } catch (err) {
      console.error('[QRScanner] Error updating status:', err);
      setError(`Failed to update item status to ${newStatus}. Please try again.`);
    } finally {
      setLoading(false);
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
