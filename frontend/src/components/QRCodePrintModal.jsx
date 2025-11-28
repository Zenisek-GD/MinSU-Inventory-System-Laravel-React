import React, { useRef, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  TextField,
  FormControlLabel,
  Checkbox,
  Alert,
} from '@mui/material';
import QRCode from 'qrcode';
import { Print as PrintIcon, Download as DownloadIcon } from '@mui/icons-material';

const QRCodePrintModal = ({ open, onClose, item }) => {
  const [copies, setCopies] = React.useState(1);
  const [showLabel, setShowLabel] = React.useState(true);
  const [qrImage, setQrImage] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  // Generate QR code on mount or when item changes
  useEffect(() => {
    if (open && item) {
      generateQRCode();
    }
  }, [open, item]);

  const generateQRCode = async () => {
    setLoading(true);
    setError(null);
    try {
      const dataUrl = await QRCode.toDataURL(item.qr_code || 'ITEM-000-000', {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        quality: 0.95,
        margin: 1,
        width: 200,
      });
      setQrImage(dataUrl);
    } catch (err) {
      console.error('Error generating QR code:', err);
      setError('Failed to generate QR code: ' + err.message);
      setQrImage(null);
    } finally {
      setLoading(false);
    }
  };

  if (!item) return null;

  const handlePrint = () => {
    if (!qrImage) return;
    
    const printWindow = window.open('', '', 'height=600,width=600');
    let printContent = '';
    
    for (let i = 0; i < copies; i++) {
      printContent += `
        <div style="page-break-after: always; padding: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh;">
          <img src="${qrImage}" style="width: 200px; height: 200px; margin: 10px 0;" />
          ${
            showLabel
              ? `
            <div style="text-align: center; margin-top: 10px;">
              <h3 style="margin: 5px 0; font-size: 18px;">${item.name}</h3>
              <p style="margin: 3px 0; font-size: 12px; color: #666;">QR Code: ${item.qr_code}</p>
              <p style="margin: 3px 0; font-size: 12px; color: #666;">Serial: ${item.serial_number || 'N/A'}</p>
            </div>
          `
              : ''
          }
        </div>
      `;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR Code - ${item.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; }
            @page { margin: 0; }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 250);
  };

  const handleDownload = () => {
    if (!qrImage) return;
    
    const link = document.createElement('a');
    link.href = qrImage;
    link.download = `QR-${item.qr_code}.png`;
    link.click();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Print QR Code</DialogTitle>
      <DialogContent>
        <Box sx={{ py: 2 }}>
          <Typography variant="subtitle2" gutterBottom fontWeight={600}>
            Item: {item.name}
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
            QR Code: {item.qr_code}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              mb: 3,
              p: 2,
              bgcolor: '#f5f5f5',
              borderRadius: 1,
              minHeight: 250,
            }}
          >
            {loading ? (
              <Typography color="textSecondary">Generating QR Code...</Typography>
            ) : qrImage ? (
              <img src={qrImage} alt="QR Code" style={{ maxWidth: '200px', height: 'auto' }} />
            ) : (
              <Typography color="error">Failed to generate QR code</Typography>
            )}
          </Box>

          {/* Options */}
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Number of Copies"
                type="number"
                value={copies}
                onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                inputProps={{ min: 1, max: 10 }}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={showLabel}
                    onChange={(e) => setShowLabel(e.target.checked)}
                  />
                }
                label="Include Item Label (Name, QR Code, Serial)"
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleDownload} 
          variant="outlined"
          disabled={!qrImage}
        >
          Download PNG
        </Button>
        <Button 
          onClick={handlePrint} 
          variant="contained" 
          startIcon={<PrintIcon />}
          disabled={!qrImage}
        >
          Print
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QRCodePrintModal;
