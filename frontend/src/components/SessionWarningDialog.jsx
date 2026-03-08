import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  LinearProgress,
  Alert,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Timer as TimerIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useUser } from '../context/UserContext';

const SessionWarningDialog = () => {
  const { sessionWarning, handleExtendSession, lastActivity, SESSION_TIMEOUT } = useUser();

  if (!sessionWarning) return null;

  // Calculate time remaining (5 minutes)
  const timeRemaining = 5 * 60 * 1000; // 5 minutes before logout
  const progress = 100; // Full progress since warning shows when 5 min remain

  return (
    <Dialog
      open={sessionWarning}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: 4,
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1.5,
        bgcolor: 'warning.light',
        color: 'warning.dark',
        fontWeight: 700,
        borderBottom: '1px solid',
        borderColor: 'warning.main'
      }}>
        <WarningIcon sx={{ fontSize: 28 }} />
        Your Session Will Expire Soon
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Alert 
            severity="warning" 
            icon={<TimerIcon />}
            sx={{ mb: 1 }}
          >
            <Typography variant="body2" fontWeight={600}>
              Due to inactivity, your session will expire in 5 minutes.
            </Typography>
          </Alert>

          <Typography variant="body2" color="text.secondary">
            Your session is automatically logged out after 30 minutes of inactivity for security purposes. 
            Click <strong>Continue Session</strong> to stay logged in.
          </Typography>

          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
              Session timeout helps protect your account from unauthorized access.
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button
          variant="outlined"
          color="inherit"
          startIcon={<LogoutIcon />}
          sx={{ borderRadius: 1 }}
          onClick={() => {
            // Logout will be handled by session timeout
            window.location.href = '/login';
          }}
        >
          Logout
        </Button>
        <Button
          variant="contained"
          color="warning"
          sx={{ borderRadius: 1, fontWeight: 600 }}
          onClick={handleExtendSession}
          autoFocus
        >
          Continue Session
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SessionWarningDialog;
