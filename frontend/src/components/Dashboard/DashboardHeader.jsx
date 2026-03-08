import React from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  alpha,
  useTheme,
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';

/**
 * Modern dashboard header with title and actions
 */
export const DashboardHeader = ({
  title,
  subtitle,
  onRefresh,
  actions = [],
  loading = false,
}) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        mb: 4,
        pb: 3,
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: 2,
      }}
    >
      <Box>
        <Typography
          variant="h4"
          fontWeight="700"
          sx={{
            background: 'linear-gradient(135deg, #006400 0%, #004d00 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 0.5,
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontWeight: '500' }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>

      <Stack
        direction="row"
        spacing={1.5}
        sx={{
          alignItems: 'center',
        }}
      >
        {onRefresh && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={onRefresh}
            disabled={loading}
            sx={{
              borderColor: '#006400',
              color: '#006400',
              '&:hover': {
                borderColor: '#004d00',
                backgroundColor: alpha('#006400', 0.04),
              },
            }}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        )}
        {actions.map((action, idx) => (
          <Button
            key={idx}
            variant={action.variant || 'outlined'}
            size="small"
            startIcon={action.icon}
            onClick={action.onClick}
            sx={action.sx}
          >
            {action.label}
          </Button>
        ))}
      </Stack>
    </Box>
  );
};

export default DashboardHeader;
