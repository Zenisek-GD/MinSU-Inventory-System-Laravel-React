import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Stack,
} from '@mui/material';
import {
  QrCodeScanner as QRIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { Scanner } from '@yudiel/react-qr-scanner';
import jsQR from 'jsqr';

const MobileScannerPage = () => {
  const [searchParams] = useSearchParams();
  const [sessionCode, setSessionCode] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [sessionJoined, setSessionJoined] = useState(false);
  const [scannedCodes, setScannedCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [scanning, setScanning] = useState(false);
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

  // Auto-join session if URL parameter is present
  useEffect(() => {
    const codeFromUrl = searchParams.get('sessionCode');
    if (codeFromUrl && !sessionJoined && !sessionId) {
      setSessionCode(codeFromUrl);
      // Trigger join after state is set
      setTimeout(() => {
        handleJoinSessionWithCode(codeFromUrl);
      }, 100);
    }
  }, [searchParams, sessionJoined, sessionId]);

  // Helper function to join session with code
  const handleJoinSessionWithCode = async (codeToJoin) => {
    if (!codeToJoin.trim()) {
      setError('Please enter a session code');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${backendUrl}/api/v1/scanner-sessions/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_code: codeToJoin.trim().toUpperCase() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to join session');
        return;
      }

      setSessionId(data.session_id);
      setSessionJoined(true);
      setSuccess('Connected to scanner session!');
      setScanning(true);
      setSessionCode('');
    } catch (err) {
      setError('Error joining session: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Join session with code from input
  const handleJoinSession = async () => {
    await handleJoinSessionWithCode(sessionCode);
  };

  // Handle QR code scan
  const handleScan = async (qrCode) => {
    if (!qrCode || !sessionJoined || sessionId === null) return;

    const cleanedCode = qrCode.trim();
    
    // Avoid duplicate scans - check if code was already sent
    if (scannedCodes.some(item => item.qr_code === cleanedCode)) {
      return; // Prevent scanning the same code twice
    }

    setScanning(false);
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${backendUrl}/api/v1/scanner-sessions/submit-scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          qr_code: cleanedCode,
          notes: '',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to send scan');
        setScanning(true);
        return;
      }

      // Add to scanned list
      setScannedCodes(prev => [{
        id: data.scan_id,
        qr_code: cleanedCode,
        sent: true,
        timestamp: new Date().toLocaleTimeString(),
      }, ...prev]);

      setSuccess('QR code sent to desktop!');
      setTimeout(() => {
        setSuccess('');
        setScanning(true);
      }, 1000);

    } catch (err) {
      setError('Error sending scan: ' + err.message);
      setScanning(true);
    } finally {
      setLoading(false);
    }
  };

  // Handle file upload for QR detection
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
              setError('No QR code found in the image.');
            }
          } catch (err) {
            setError('Error decoding QR code: ' + err.message);
          }
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLeaveSession = () => {
    setSessionJoined(false);
    setSessionId(null);
    setScannedCodes([]);
    setScanning(false);
    setSuccess('');
    setError('');
  };

  // Auto-reload page every 5 minutes to maintain fresh connection
  useEffect(() => {
    if (!sessionJoined) return;

    const autoReloadTimer = setTimeout(() => {
      window.location.reload();
    }, 300000); // 5 minutes

    return () => clearTimeout(autoReloadTimer);
  }, [sessionJoined]);

  // Keep mobile page awake and polling
  useEffect(() => {
    if (!sessionJoined) return;

    let wakeLockSentinel = null;

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockSentinel = await navigator.wakeLock.request('screen');
        }
      } catch (err) {
        console.log('Wake lock request failed:', err);
      }
    };

    const releaseWakeLock = () => {
      if (wakeLockSentinel !== null) {
        wakeLockSentinel.release().then(() => {
          wakeLockSentinel = null;
        });
      }
    };

    requestWakeLock();

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        requestWakeLock();
      } else {
        releaseWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      releaseWakeLock();
    };
  }, [sessionJoined]);

  if (!sessionJoined) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
        }}
      >
        <Container maxWidth="sm">
          <Card elevation={3} sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <QRIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                  Mobile Scanner
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Join a desktop scanner session
                </Typography>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <TextField
                fullWidth
                label="Session Code"
                placeholder="e.g., ABC123"
                value={sessionCode}
                onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && handleJoinSession()}
                disabled={loading}
                variant="outlined"
                sx={{ mb: 3 }}
                inputProps={{ maxLength: 8, style: { textAlign: 'center', fontSize: '1.5rem', letterSpacing: '2px' } }}
              />

              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleJoinSession}
                disabled={loading || !sessionCode.trim()}
                sx={{ mb: 2 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Join & Scan'}
              </Button>

              <Typography variant="caption" display="block" textAlign="center" color="text.secondary">
                Ask the supply officer for the 6-digit session code
              </Typography>
            </CardContent>
          </Card>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', background: '#f5f5f5', pt: 2, pb: 4 }}>
      <Container maxWidth="sm">
        {/* Header */}
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Mobile Scanner Active
          </Typography>
          <Chip label={`Session: ${sessionCode || 'Connected'}`} color="primary" />
        </Box>

        {/* Scanner */}
        {scanning && (
          <Card sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ bgcolor: '#000', aspect: '1', position: 'relative' }}>
              <Scanner
                onScan={(result) => {
                  if (result) handleScan(result);
                }}
                components={{
                  loader: <CircularProgress sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />,
                }}
                styles={{ container: { width: '100%', height: '100%' } }}
              />
            </Box>
          </Card>
        )}

        {/* Messages */}
        {success && (
          <Alert icon={<CheckCircleIcon />} severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {error && (
          <Alert icon={<ErrorIcon />} severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading && (
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <CircularProgress size={40} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Sending to desktop...
            </Typography>
          </Box>
        )}

        {/* Scanned items */}
        {scannedCodes.length > 0 && (
          <Card sx={{ mb: 3, borderRadius: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Scanned Items ({scannedCodes.length})
              </Typography>
              <Divider sx={{ my: 2 }} />
              <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                {scannedCodes.map((item, idx) => (
                  <ListItem key={idx} dense>
                    <ListItemText
                      primary={item.qr_code}
                      secondary={item.timestamp}
                      primaryTypographyProps={{ variant: 'body2', component: 'code', sx: { fontSize: '0.8rem' } }}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        )}

        {/* Upload alternative */}
        <Paper sx={{ p: 2, mb: 3, textAlign: 'center', bgcolor: '#fafafa', borderRadius: 2 }}>
          <Typography variant="caption" display="block" gutterBottom>
            Or upload QR code image
          </Typography>
          <Button
            variant="text"
            component="label"
            size="small"
          >
            Upload Image
            <input type="file" accept="image/*" onChange={handleFileUpload} hidden />
          </Button>
        </Paper>

        {/* Leave session */}
        <Button
          fullWidth
          variant="outlined"
          color="error"
          onClick={handleLeaveSession}
        >
          Leave Session
        </Button>
      </Container>
    </Box>
  );
};

export default MobileScannerPage;
