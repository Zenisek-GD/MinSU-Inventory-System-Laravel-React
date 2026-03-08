import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  Paper,
  Grid,
  alpha,
  useTheme,
  Avatar,
  Tooltip,
  Modal,
  IconButton,
} from '@mui/material';
import {
  QrCodeScanner as QRIcon,
  Phonelink as PhonelinkIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Close as CloseIcon,
  ContentCopy as CopyIcon,
  Refresh as RefreshIcon,
  Smartphone as SmartphoneIcon,
  Done as DoneIcon,
} from '@mui/icons-material';
import QRCode from 'react-qr-code';
import DashboardLayout from '../components/Layout/DashboardLayout';
import {
  createScannerSession,
  getNewScans,
  markScanProcessed,
  closeScannerSession,
  getScannerSessionStatus,
} from '../api/scannerSession';
import { fetchItemByQr } from '../api/item';
import { parseQr } from '../shared/qr';
import { useUser } from '../context/UserContext';

const DesktopScannerWithMobile = () => {
  const { user } = useUser();
  const theme = useTheme();

  // Session state
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [sessionCode, setSessionCode] = useState('');
  const [mobileConnected, setMobileConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Scan data
  const [scannedItems, setScannedItems] = useState([]);
  const [scannedQRCodes, setScannedQRCodes] = useState(new Set()); // Track unique QR codes
  const [pollingActive, setPollingActive] = useState(false);

  // Ref to track processed scan IDs to prevent duplicates
  const processedScansRef = useRef(new Set());

  // Detail modal
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // QR Code modal
  const [showQRModal, setShowQRModal] = useState(false);

  // Session expiry timer
  const [timeRemaining, setTimeRemaining] = useState(1800); // 30 minutes

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

  // Generate mobile scanner URL with session code
  const getMobileScannerUrl = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/scanner/mobile?sessionCode=${sessionCode}`;
  };

  // Create session
  const handleCreateSession = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await createScannerSession();
      setSessionId(response.session_id);
      setSessionCode(response.session_code);
      setSessionActive(true);
      setPollingActive(true);
      setSuccess(`Session created! Share code: ${response.session_code}`);
      setTimeRemaining(1800);
    } catch (err) {
      setError('Failed to create session: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  // Ensure polling continues even when page is not in focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, but we want polling to continue in background
      } else {
        // Page is visible again, ensure polling is active
        if (sessionActive && sessionId && !pollingActive) {
          setPollingActive(true);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [sessionActive, sessionId, pollingActive]);

  // Poll for new scans from mobile
  useEffect(() => {
    if (!pollingActive || !sessionId) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await getNewScans(sessionId);
        
        if (response.scans && response.scans.length > 0) {
          // Process new scans - only add unique QR codes
          for (const scan of response.scans) {
            // Check if this scan has already been processed
            if (processedScansRef.current.has(scan.id)) {
              continue; // Skip if already processed
            }

            // Mark as processed immediately to prevent double processing
            processedScansRef.current.add(scan.id);
            
            // Check if QR code already exists in scanned items
            const isDuplicate = scannedQRCodes.has(scan.qr_code);
            
            if (!isDuplicate) {
              try {
                // Fetch item details using QR code
                const itemData = await fetchItemByQr(scan.qr_code);
                
                setScannedItems(prev => [{
                  id: scan.id,
                  qr_code: scan.qr_code,
                  item: itemData,
                  timestamp: new Date(scan.created_at).toLocaleTimeString(),
                  processed: false,
                }, ...prev]);

                // Add to scanned codes set to prevent duplicates
                setScannedQRCodes(prev => new Set([...prev, scan.qr_code]));

                // Mark as processed on backend
                await markScanProcessed(scan.id);
                
              } catch (itemErr) {
                console.error('Error fetching item:', itemErr);
                setScannedItems(prev => [{
                  id: scan.id,
                  qr_code: scan.qr_code,
                  item: null,
                  timestamp: new Date(scan.created_at).toLocaleTimeString(),
                  error: 'Item not found',
                  processed: false,
                }, ...prev]);

                // Add to scanned codes set even if error
                setScannedQRCodes(prev => new Set([...prev, scan.qr_code]));
              }
            }
          }

          // Update mobile connection status
          if (response.scans.length > 0) {
            setMobileConnected(true);
          }
        }
      } catch (err) {
        console.error('Poll error:', err);
      }
    }, 500); // Poll every 500ms for faster response

    return () => clearInterval(pollInterval);
  }, [pollingActive, sessionId]);

  // Timer countdown
  useEffect(() => {
    if (!sessionActive) return;

    const timerInterval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 0) {
          setSessionActive(false);
          setPollingActive(false);
          setError('Session expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [sessionActive]);

  const handleCloseSession = async () => {
    setLoading(true);
    try {
      await closeScannerSession(sessionId);
      setSessionActive(false);
      setPollingActive(false);
      setSessionId(null);
      setSessionCode('');
      setScannedItems([]);
      setScannedQRCodes(new Set()); // Clear scanned codes
      processedScansRef.current.clear(); // Clear processed scans ref
      setMobileConnected(false);
      setSuccess('Session closed');
    } catch (err) {
      setError('Failed to close session: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (item) => {
    setSelectedItem(item);
    setDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setDetailModalOpen(false);
    setSelectedItem(null);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sessionCode);
    setSuccess('Session code copied!');
    setTimeout(() => setSuccess(''), 2000);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!sessionActive) {
    return (
      <DashboardLayout>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box sx={{ mb: 6 }}>
            <Typography variant="h4" fontWeight={800} gutterBottom>
              Mobile-to-Desktop QR Scanner
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Start a session and use your mobile phone to scan QR codes remotely
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

          <Grid container spacing={3}>
            {/* Start Session Card */}
            <Grid item xs={12} sm={6}>
              <Card sx={{ h: '100%', borderRadius: 3 }}>
                <CardContent sx={{ p: 4, textAlign: 'center' }}>
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: theme.palette.primary.main,
                      margin: '0 auto',
                      mb: 2,
                    }}
                  >
                    <QRIcon sx={{ fontSize: 48 }} />
                  </Avatar>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Desktop Scanner
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Start a mobile scanning session and receive QR scans from your phone in real-time
                  </Typography>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleCreateSession}
                    disabled={loading}
                    fullWidth
                  >
                    {loading ? <CircularProgress size={24} /> : 'Start Mobile Session'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            {/* Info Card */}
            <Grid item xs={12} sm={6}>
              <Card sx={{ h: '100%', borderRadius: 3, bgcolor: alpha(theme.palette.info.main, 0.05) }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    How it works:
                  </Typography>
                  <Box component="ol" sx={{ pl: 2, mb: 2 }}>
                    <li>
                      <Typography variant="body2" gutterBottom>
                        Click "Start Mobile Session" to create a session code
                      </Typography>
                    </li>
                    <li>
                      <Typography variant="body2" gutterBottom>
                        Share the 6-digit code with a mobile device
                      </Typography>
                    </li>
                    <li>
                      <Typography variant="body2" gutterBottom>
                        Open the mobile scanner and enter the code
                      </Typography>
                    </li>
                    <li>
                      <Typography variant="body2">
                        Scans from the phone appear here in real-time
                      </Typography>
                    </li>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header with Session Info */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                Scanner Session Active
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip
                  icon={<QRIcon />}
                  label={`Code: ${sessionCode}`}
                  color="primary"
                  variant="outlined"
                />
                <Chip
                  label={`Time: ${formatTime(timeRemaining)}`}
                  variant={timeRemaining < 300 ? 'filled' : 'outlined'}
                  color={timeRemaining < 300 ? 'error' : 'default'}
                />
                {mobileConnected && (
                  <Chip
                    icon={<SmartphoneIcon />}
                    label="Mobile Connected"
                    color="success"
                    variant="filled"
                  />
                )}
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Tooltip title="Copy session code">
                <Button
                  variant="outlined"
                  startIcon={<CopyIcon />}
                  onClick={copyToClipboard}
                  size="small"
                >
                  Copy Code
                </Button>
              </Tooltip>
              <Tooltip title="Show QR code for mobile">
                <Button
                  variant="outlined"
                  startIcon={<QRIcon />}
                  onClick={() => setShowQRModal(true)}
                  size="small"
                >
                  QR Code
                </Button>
              </Tooltip>
              <Button
                variant="contained"
                color="error"
                onClick={handleCloseSession}
                disabled={loading}
              >
                Close Session
              </Button>
            </Box>
          </Box>
          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}
        </Box>

        {/* Scanned Items */}
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Scanned Items ({scannedItems.length})
              </Typography>
              {scannedItems.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  Waiting for mobile scans... Share the code {sessionCode} with your phone
                </Typography>
              )}
            </Box>

            <Divider sx={{ my: 2 }} />

            {scannedItems.length > 0 && (
              <List sx={{ maxHeight: 600, overflow: 'auto' }}>
                {scannedItems.map((item, idx) => (
                  <Box key={item.qr_code || idx} sx={{ mb: 2 }}>
                    <Paper
                      sx={{
                        bgcolor: item.error ? alpha(theme.palette.error.main, 0.05) : alpha(theme.palette.success.main, 0.05),
                        borderRadius: 2,
                        p: 2,
                        border: `1px solid ${item.error ? theme.palette.error.light : theme.palette.success.light}`,
                        cursor: !item.error ? 'pointer' : 'default',
                        transition: 'all 0.3s ease',
                        '&:hover': !item.error ? {
                          boxShadow: `0 4px 12px ${alpha(theme.palette.success.main, 0.2)}`,
                          transform: 'translateY(-2px)',
                        } : {},
                      }}
                      onClick={() => !item.error && handleViewDetails(item)}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
                        <Box sx={{ flex: 1 }}>
                          {/* QR Code and Timestamp */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            {item.error ? (
                              <ErrorIcon color="error" fontSize="small" />
                            ) : (
                              <CheckCircleIcon color="success" fontSize="small" />
                            )}
                            <Typography variant="body2" fontWeight="bold" component="code" sx={{ fontSize: '0.75rem', bgcolor: alpha(theme.palette.primary.main, 0.1), p: 0.5, borderRadius: 1 }}>
                              {item.qr_code}
                            </Typography>
                            <Chip size="small" label={item.timestamp} variant="outlined" />
                          </Box>

                          {/* Item Details */}
                          {item.item && !item.error && (
                            <Box sx={{ pl: 0, ml: 0 }}>
                              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5 }}>
                                {item.item.name}
                              </Typography>

                              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 1 }}>
                                <Box>
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    Category
                                  </Typography>
                                  <Typography variant="body2" fontWeight={500}>
                                    {item.item.category?.name || 'N/A'}
                                  </Typography>
                                </Box>
                                <Box>
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    Office
                                  </Typography>
                                  <Typography variant="body2" fontWeight={500}>
                                    {item.item.office?.name || 'N/A'}
                                  </Typography>
                                </Box>
                              </Box>

                              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                                <Box>
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    Status
                                  </Typography>
                                  <Chip 
                                    label={item.item.status} 
                                    size="small" 
                                    color={item.item.status === 'Good' ? 'success' : item.item.status === 'Damaged' ? 'error' : 'warning'}
                                    variant="outlined"
                                  />
                                </Box>
                                <Box>
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    Condition
                                  </Typography>
                                  <Chip 
                                    label={item.item.condition || 'N/A'} 
                                    size="small"
                                    variant="outlined"
                                  />
                                </Box>
                              </Box>

                              {item.item.description && (
                                <Box sx={{ mt: 1 }}>
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    Description
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
                                    {item.item.description.substring(0, 100)}{item.item.description.length > 100 ? '...' : ''}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          )}

                          {/* Error Message */}
                          {item.error && (
                            <Typography variant="body2" color="error">
                              {item.error}
                            </Typography>
                          )}
                        </Box>

                        {/* View Details Button */}
                        {item.item && !item.error && (
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleViewDetails(item)}
                          >
                            View All Details
                          </Button>
                        )}
                      </Box>
                    </Paper>
                  </Box>
                ))}
              </List>
            )}

            {/* Detail Modal */}
            <Dialog 
              open={detailModalOpen} 
              onClose={handleCloseDetailModal}
              maxWidth="sm"
              fullWidth
            >
              <DialogTitle sx={{ fontWeight: 'bold', bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                Item Details
              </DialogTitle>
              <DialogContent sx={{ pt: 3 }}>
                {selectedItem?.item && (
                  <Box>
                    {/* QR Code */}
                    <Box sx={{ mb: 3, pb: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                        QR CODE
                      </Typography>
                      <Typography variant="body1" fontWeight="bold" component="code">
                        {selectedItem.qr_code}
                      </Typography>
                    </Box>

                    {/* Item Name */}
                    <Box sx={{ mb: 3, pb: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                        ITEM NAME
                      </Typography>
                      <Typography variant="h6" fontWeight="bold">
                        {selectedItem.item.name}
                      </Typography>
                    </Box>

                    {/* Description */}
                    {selectedItem.item.description && (
                      <Box sx={{ mb: 3, pb: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                          DESCRIPTION
                        </Typography>
                        <Typography variant="body2">
                          {selectedItem.item.description}
                        </Typography>
                      </Box>
                    )}

                    {/* Serial Number */}
                    {selectedItem.item.serial_number && (
                      <Box sx={{ mb: 3, pb: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                          SERIAL NUMBER
                        </Typography>
                        <Typography variant="body2" component="code">
                          {selectedItem.item.serial_number}
                        </Typography>
                      </Box>
                    )}

                    {/* Category and Office */}
                    <Box sx={{ mb: 3, pb: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                            CATEGORY
                          </Typography>
                          <Typography variant="body2" fontWeight={500}>
                            {selectedItem.item.category?.name || 'N/A'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                            OFFICE
                          </Typography>
                          <Typography variant="body2" fontWeight={500}>
                            {selectedItem.item.office?.name || 'N/A'}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>

                    {/* Status and Condition */}
                    <Box sx={{ mb: 3, pb: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                            STATUS
                          </Typography>
                          <Chip 
                            label={selectedItem.item.status} 
                            color={selectedItem.item.status === 'Good' ? 'success' : selectedItem.item.status === 'Damaged' ? 'error' : 'warning'}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                            CONDITION
                          </Typography>
                          <Chip label={selectedItem.item.condition || 'N/A'} variant="outlined" />
                        </Grid>
                      </Grid>
                    </Box>

                    {/* Purchase Date and Assigned User */}
                    <Box>
                      <Grid container spacing={2}>
                        {selectedItem.item.purchase_date && (
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                              PURCHASE DATE
                            </Typography>
                            <Typography variant="body2">
                              {new Date(selectedItem.item.purchase_date).toLocaleDateString()}
                            </Typography>
                          </Grid>
                        )}
                        {selectedItem.item.assignedUser && (
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                              ASSIGNED TO
                            </Typography>
                            <Typography variant="body2">
                              {selectedItem.item.assignedUser.name}
                            </Typography>
                          </Grid>
                        )}
                      </Grid>
                    </Box>
                  </Box>
                )}
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCloseDetailModal}>Close</Button>
              </DialogActions>
            </Dialog>
          </CardContent>
        </Card>

        {/* QR Code Modal */}
        <Modal
          open={showQRModal}
          onClose={() => setShowQRModal(false)}
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Card sx={{ p: 4, maxWidth: 500, borderRadius: 3, boxShadow: 5 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" fontWeight="bold">
                  Mobile Scanner QR Code
                </Typography>
                <IconButton size="small" onClick={() => setShowQRModal(false)}>
                  <CloseIcon />
                </IconButton>
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Scan this QR code with your mobile device to connect to the scanning session
              </Typography>

              {/* QR Code */}
              <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                p: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.05),
                borderRadius: 2,
                mb: 3,
              }}>
                <QRCode
                  value={getMobileScannerUrl()}
                  size={250}
                  level="H"
                />
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Or visit this link on mobile:
              </Typography>

              <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50', wordBreak: 'break-all' }}>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                  {getMobileScannerUrl()}
                </Typography>
              </Paper>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<CopyIcon />}
                  onClick={() => {
                    navigator.clipboard.writeText(getMobileScannerUrl());
                    setSuccess('Mobile URL copied!');
                    setTimeout(() => setSuccess(''), 2000);
                  }}
                >
                  Copy URL
                </Button>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => setShowQRModal(false)}
                >
                  Done
                </Button>
              </Box>
            </Box>
          </Card>
        </Modal>
      </Container>
    </DashboardLayout>
  );
};

export default DesktopScannerWithMobile;
