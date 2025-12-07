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
  Container,
  IconButton,
  Divider,
  Stack,
  alpha,
  useTheme,
  Fade,
  CircularProgress,
  LinearProgress,
  Avatar,
  Tooltip
} from '@mui/material';
import {
  QrCodeScanner as QRIcon,
  CameraAlt as CameraIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  Upload as UploadIcon,
  Keyboard as KeyboardIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  ArrowForward as ArrowForwardIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material';
import { Scanner } from '@yudiel/react-qr-scanner';
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
  const [scanning, setScanning] = useState(true);

  const theme = useTheme();

  const handleScan = async (qrCode) => {
    if (!qrCode || typeof qrCode !== 'string') return;
    
    const cleanedCode = qrCode.trim();
    if (scannedData === cleanedCode) return; // Prevent duplicate scans
    
    setScannedData(cleanedCode);
    setLoading(true);
    setError('');
    setInfo('');
    setScanning(false);

    try {
      console.log('[QRScanner] Scanning QR code:', cleanedCode);
      const response = await fetchItemByQr(cleanedCode);
      console.log('[QRScanner] Item found:', response);
      setScannedItem(response);
      setInfo('Item found successfully!');
    } catch (error) {
      console.error('[QRScanner] Error fetching item:', error);
      setError(`Item not found. Please try a different QR code.`);
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
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          try {
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            if (code) {
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

  const resetScanner = () => {
    setScannedData('');
    setScannedItem(null);
    setError('');
    setInfo('');
    setScanning(true);
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

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setInfo('Copied to clipboard!');
    setTimeout(() => setInfo(''), 2000);
  };

  return (
    <DashboardLayout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 6 }}>
          <Typography 
            variant="h4" 
            fontWeight={800} 
            gutterBottom
            sx={{ 
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            QR Code Scanner
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600 }}>
            Scan QR codes to instantly access and manage item information. Use camera, upload, or manual entry.
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {/* Left Column: Scanner */}
          <Grid item xs={12} lg={6}>
            <Card 
              elevation={0}
              sx={{
                height: '100%',
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                borderRadius: 4,
                background: alpha(theme.palette.background.paper, 0.8),
                backdropFilter: 'blur(10px)',
                overflow: 'hidden'
              }}
            >
              <CardContent sx={{ p: 4 }}>
                {/* Scanner Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                  <Avatar
                    sx={{
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: theme.palette.primary.main,
                      width: 56,
                      height: 56
                    }}
                  >
                    <QRIcon fontSize="large" />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight={700}>
                      Real-time Scanner
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Point camera at QR code
                    </Typography>
                  </Box>
                </Box>

                {/* Camera Preview */}
                <Paper
                  elevation={0}
                  sx={{
                    position: 'relative',
                    height: 300,
                    mb: 3,
                    borderRadius: 3,
                    overflow: 'hidden',
                    border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    bgcolor: '#000'
                  }}
                >
                  {scanning ? (
                    <Scanner
                      onDecode={(result) => handleScan(result)}
                      onError={() => {}}
                      constraints={{ facingMode: 'environment' }}
                      style={{ width: '100%', height: '100%' }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: alpha(theme.palette.primary.main, 0.05)
                      }}
                    >
                      <QRIcon sx={{ fontSize: 80, color: alpha(theme.palette.primary.main, 0.3) }} />
                    </Box>
                  )}
                  
                  {/* Scanner Overlay */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      pointerEvents: 'none'
                    }}
                  >
                    <Box
                      sx={{
                        width: 200,
                        height: 200,
                        border: '2px solid',
                        borderColor: alpha(theme.palette.primary.main, 0.6),
                        borderRadius: 2,
                        position: 'relative',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: -2,
                          left: -2,
                          right: -2,
                          bottom: -2,
                          border: '2px solid',
                          borderColor: alpha(theme.palette.primary.main, 0.3),
                          borderRadius: 3,
                          animation: 'pulse 2s infinite'
                        }
                      }}
                    />
                  </Box>
                </Paper>

                {/* Alternative Methods */}
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 3, color: 'text.secondary' }}>
                  ALTERNATIVE METHODS
                </Typography>

                <Grid container spacing={2} sx={{ mb: 4 }}>
                  <Grid item xs={12} sm={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      size="large"
                      startIcon={<KeyboardIcon />}
                      onClick={() => setManualInputOpen(true)}
                      sx={{
                        py: 2,
                        borderRadius: 2,
                        borderColor: alpha(theme.palette.divider, 0.3),
                        '&:hover': {
                          borderColor: theme.palette.primary.main,
                          bgcolor: alpha(theme.palette.primary.main, 0.04)
                        }
                      }}
                    >
                      Manual Entry
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      size="large"
                      component="label"
                      startIcon={<UploadIcon />}
                      sx={{
                        py: 2,
                        borderRadius: 2,
                        borderColor: alpha(theme.palette.divider, 0.3),
                        '&:hover': {
                          borderColor: theme.palette.primary.main,
                          bgcolor: alpha(theme.palette.primary.main, 0.04)
                        }
                      }}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={handleFileUpload}
                      />
                      Upload Image
                    </Button>
                  </Grid>
                </Grid>

                {/* Scanner Status */}
                <Box sx={{ mb: 3 }}>
                  {scannedData && (
                    <Alert 
                      severity="info" 
                      icon={<CheckCircleIcon />}
                      sx={{ 
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.info.main, 0.1),
                        color: theme.palette.info.main
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" fontWeight={600}>
                          Scanned: {scannedData}
                        </Typography>
                        <Tooltip title="Copy">
                          <IconButton 
                            size="small" 
                            onClick={() => copyToClipboard(scannedData)}
                            sx={{ ml: 1 }}
                          >
                            <CopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Alert>
                  )}

                  {loading && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.info.main, 0.1) }}>
                      <CircularProgress size={20} />
                      <Typography variant="body2" color="text.secondary">
                        Loading item details...
                      </Typography>
                    </Box>
                  )}

                  {error && (
                    <Alert 
                      severity="error"
                      icon={<ErrorIcon />}
                      sx={{ borderRadius: 2 }}
                    >
                      {error}
                    </Alert>
                  )}

                  {info && !scannedData && (
                    <Alert 
                      severity="success" 
                      icon={<InfoIcon />}
                      sx={{ borderRadius: 2 }}
                    >
                      {info}
                    </Alert>
                  )}
                </Box>

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<RefreshIcon />}
                    onClick={resetScanner}
                    disabled={loading}
                    sx={{
                      py: 1.5,
                      borderRadius: 2,
                      fontWeight: 600,
                      bgcolor: theme.palette.primary.main,
                      '&:hover': {
                        bgcolor: theme.palette.primary.dark
                      }
                    }}
                  >
                    Scan New Code
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Right Column: Item Details */}
          <Grid item xs={12} lg={6}>
            {scannedItem ? (
              <Fade in={!!scannedItem} timeout={500}>
                <Card
                  elevation={0}
                  sx={{
                    height: '100%',
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    borderRadius: 4,
                    overflow: 'hidden'
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    {/* Item Header */}
                    <Box sx={{ mb: 4 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                        <Box>
                          <Typography variant="h5" fontWeight={800} gutterBottom>
                            {scannedItem.name}
                          </Typography>
                          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                            <Chip 
                              label={scannedItem.status} 
                              color={getStatusColor(scannedItem.status)}
                              size="small"
                              sx={{ fontWeight: 700 }}
                            />
                            {scannedItem.condition && (
                              <Chip 
                                label={scannedItem.condition} 
                                color={getConditionColor(scannedItem.condition)}
                                size="small"
                                sx={{ fontWeight: 700 }}
                              />
                            )}
                          </Stack>
                        </Box>
                        <Avatar
                          sx={{
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            color: theme.palette.primary.main,
                            width: 48,
                            height: 48
                          }}
                        >
                          {scannedItem.category?.name?.charAt(0) || 'I'}
                        </Avatar>
                      </Box>

                      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                        {scannedItem.description}
                      </Typography>
                    </Box>

                    <Divider sx={{ my: 3 }} />

                    {/* Item Details Grid */}
                    <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 3 }}>
                      Item Details
                    </Typography>

                    <Grid container spacing={3}>
                      {/* Category and Office */}
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                          <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            Category
                          </Typography>
                          <Typography variant="body1" fontWeight={600}>
                            {scannedItem.category?.name || 'N/A'}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.secondary.main, 0.05) }}>
                          <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            Office
                          </Typography>
                          <Typography variant="body1" fontWeight={600}>
                            {scannedItem.office?.name || 'N/A'}
                          </Typography>
                        </Box>
                      </Grid>

                      {/* Serial Number and QR */}
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.grey[500], 0.05) }}>
                          <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            Serial Number
                          </Typography>
                          <Typography variant="body1" fontFamily="monospace" fontWeight={600}>
                            {scannedItem.serial_number || 'N/A'}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.grey[500], 0.05) }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                QR Code
                              </Typography>
                              <Typography variant="body1" fontFamily="monospace" fontWeight={600}>
                                {scannedItem.qr_code || 'N/A'}
                              </Typography>
                            </Box>
                            <Tooltip title="Copy QR Code">
                              <IconButton 
                                size="small" 
                                onClick={() => copyToClipboard(scannedItem.qr_code)}
                              >
                                <CopyIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                      </Grid>

                      {/* Purchase Details */}
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.info.main, 0.05) }}>
                          <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            Purchase Date
                          </Typography>
                          <Typography variant="body1" fontWeight={600}>
                            {scannedItem.purchase_date ? new Date(scannedItem.purchase_date).toLocaleDateString() : 'N/A'}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.success.main, 0.05) }}>
                          <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            Purchase Price
                          </Typography>
                          <Typography variant="body1" fontWeight={700} color="success.main">
                            ₱{scannedItem.purchase_price?.toLocaleString() || '0'}
                          </Typography>
                        </Box>
                      </Grid>

                      {/* Warranty */}
                      {scannedItem.warranty_expiry && (
                        <Grid item xs={12}>
                          <Alert 
                            severity="info"
                            icon={<InfoIcon />}
                            sx={{ borderRadius: 2 }}
                          >
                            <Typography variant="body2" fontWeight={600}>
                              Warranty Expires: {new Date(scannedItem.warranty_expiry).toLocaleDateString()}
                            </Typography>
                          </Alert>
                        </Grid>
                      )}

                      {/* Borrow Status */}
                      {scannedItem.current_borrow && (
                        <Grid item xs={12}>
                          <Alert 
                            severity="warning"
                            icon={<ArrowForwardIcon />}
                            sx={{ borderRadius: 2 }}
                          >
                            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                              Currently Borrowed
                            </Typography>
                            <Typography variant="body2">
                              <strong>By:</strong> {scannedItem.current_borrow.borrowed_by?.name || 'Unknown'}<br />
                              <strong>Since:</strong> {new Date(scannedItem.current_borrow.borrow_date).toLocaleDateString()}<br />
                              <strong>Expected Return:</strong> {new Date(scannedItem.current_borrow.expected_return_date).toLocaleDateString()}
                            </Typography>
                          </Alert>
                        </Grid>
                      )}

                      {/* Notes */}
                      {scannedItem.notes && (
                        <Grid item xs={12}>
                          <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.grey[100], 0.5) }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                              Notes
                            </Typography>
                            <Typography variant="body2">
                              {scannedItem.notes}
                            </Typography>
                          </Box>
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>
                </Card>
              </Fade>
            ) : (
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  border: `2px dashed ${alpha(theme.palette.divider, 0.3)}`,
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 500,
                  bgcolor: alpha(theme.palette.background.paper, 0.5)
                }}
              >
                <Box sx={{ textAlign: 'center', p: 4 }}>
                  <Box
                    sx={{
                      display: 'inline-flex',
                      p: 3,
                      borderRadius: '50%',
                      bgcolor: alpha(theme.palette.divider, 0.1),
                      mb: 3
                    }}
                  >
                    <QRIcon sx={{ fontSize: 64, color: alpha(theme.palette.text.secondary, 0.3) }} />
                  </Box>
                  <Typography variant="h6" color="text.secondary" gutterBottom fontWeight={600}>
                    Ready to Scan
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300, mx: 'auto' }}>
                    Scan a QR code using the camera, upload an image, or enter the code manually to view item details.
                  </Typography>
                </Box>
              </Card>
            )}
          </Grid>
        </Grid>
      </Container>

      {/* Manual Input Dialog */}
      <Dialog 
        open={manualInputOpen} 
        onClose={() => setManualInputOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'hidden'
          }
        }}
      >
        <Box sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Box>
              <Typography variant="h6" fontWeight={800} gutterBottom>
                Manual QR Code Entry
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Enter the QR code to look up item details
              </Typography>
            </Box>
            <IconButton 
              onClick={() => setManualInputOpen(false)} 
              sx={{ color: 'text.secondary' }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
          
          <TextField
            fullWidth
            label="QR Code"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && manualCode.trim() && handleManualScan()}
            placeholder="e.g., ITEM-LAP-001"
            sx={{ mb: 4 }}
            autoFocus
            InputProps={{
              sx: { 
                fontFamily: 'monospace',
                fontSize: '1.1rem',
                py: 1.5
              }
            }}
          />
          
          <Box display="flex" gap={2} justifyContent="flex-end">
            <Button 
              onClick={() => setManualInputOpen(false)}
              variant="outlined"
              sx={{ 
                px: 4,
                borderRadius: 2,
                fontWeight: 600
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={handleManualScan}
              disabled={!manualCode.trim()}
              sx={{ 
                px: 4,
                borderRadius: 2,
                fontWeight: 600,
                bgcolor: theme.palette.primary.main,
                '&:hover': {
                  bgcolor: theme.palette.primary.dark
                }
              }}
            >
              Lookup Item
            </Button>
          </Box>
        </Box>
      </Dialog>
    </DashboardLayout>
  );
};

export default QRScanner;