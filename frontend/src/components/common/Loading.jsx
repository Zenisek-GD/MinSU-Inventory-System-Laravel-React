// src/components/Common/Loading.jsx
import React, { useState, useEffect } from 'react';
import { Box, Typography, LinearProgress, Fade, keyframes } from '@mui/material';
import { styled } from '@mui/material/styles';

const loadingTips = [
  "Preparing your dashboard...",
  "Loading inventory data...",
  "Syncing with database...",
  "Almost there...",
  "Setting up your workspace..."
];

// Animated gradient background
const gradientAnimation = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

// Pulse animation for logo
const pulseAnimation = keyframes`
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.8; }
`;

// Shimmer animation
const shimmerAnimation = keyframes`
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
`;

const LoadingContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
  backgroundSize: '200% 200%',
  animation: `${gradientAnimation} 15s ease infinite`,
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'radial-gradient(circle at 50% 50%, rgba(0, 100, 0, 0.05) 0%, transparent 50%)',
    pointerEvents: 'none'
  }
}));

const LogoContainer = styled(Box)(({ theme }) => ({
  width: 120,
  height: 120,
  borderRadius: '50%',
  background: 'linear-gradient(135deg, #006400 0%, #004d00 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 20px 60px rgba(0, 100, 0, 0.3)',
  marginBottom: theme.spacing(3),
  animation: `${pulseAnimation} 2s ease-in-out infinite`,
  position: 'relative',
  overflow: 'hidden',
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
    animation: `${shimmerAnimation} 2s infinite`
  }
}));

const ContentBox = styled(Box)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  borderRadius: theme.spacing(3),
  padding: theme.spacing(4, 6),
  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
  textAlign: 'center',
  minWidth: 320,
  border: '1px solid rgba(255, 255, 255, 0.8)'
}));

const Loading = ({ message }) => {
  const [currentTip, setCurrentTip] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Rotate loading tips
    const tipInterval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % loadingTips.length);
    }, 2000);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 10;
      });
    }, 300);

    return () => {
      clearInterval(tipInterval);
      clearInterval(progressInterval);
    };
  }, []);

  return (
    <LoadingContainer>
      <Fade in={true} timeout={800}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <LogoContainer>
            <Typography
              variant="h2"
              sx={{
                color: 'white',
                fontWeight: 900,
                textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
                position: 'relative',
                zIndex: 1
              }}
            >
              M
            </Typography>
          </LogoContainer>

          <ContentBox>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: '#006400',
                mb: 1,
                letterSpacing: '-0.5px'
              }}
            >
              MinSU Inventory System
            </Typography>

            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                mb: 3,
                fontSize: '0.875rem'
              }}
            >
              Bongabong Campus
            </Typography>

            <Box sx={{ width: '100%', mb: 2 }}>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: 'rgba(0, 100, 0, 0.1)',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 3,
                    background: 'linear-gradient(90deg, #006400 0%, #00a000 100%)',
                    boxShadow: '0 2px 10px rgba(0, 100, 0, 0.3)'
                  }
                }}
              />
            </Box>

            <Fade in={true} key={currentTip} timeout={500}>
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  fontWeight: 500,
                  minHeight: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {message || loadingTips[currentTip]}
              </Typography>
            </Fade>
          </ContentBox>

          <Typography
            variant="caption"
            sx={{
              mt: 3,
              color: 'rgba(0, 0, 0, 0.4)',
              fontWeight: 500
            }}
          >
            Please wait while we load your data...
          </Typography>
        </Box>
      </Fade>
    </LoadingContainer>
  );
};

export default Loading;