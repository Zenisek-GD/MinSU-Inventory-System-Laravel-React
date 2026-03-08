import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  alpha,
  useTheme,
} from '@mui/material';

/**
 * Modern reusable stat card with gradient background
 */
export const DashboardCard = ({
  title,
  value,
  icon,
  subtitle,
  trend,
  trendColor = 'success',
  onClick,
  variant = 'default',
  color = '#006400',
}) => {
  const theme = useTheme();

  const variantStyles = {
    default: {
      background: `linear-gradient(135deg, #ffffff 0%, ${alpha(color, 0.02)} 100%)`,
      borderTop: `4px solid ${color}`,
    },
    success: {
      background: `linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%)`,
      borderTop: '4px solid #4caf50',
    },
    warning: {
      background: `linear-gradient(135deg, #fff3e0 0%, #fffde7 100%)`,
      borderTop: '4px solid #ff9800',
    },
    danger: {
      background: `linear-gradient(135deg, #ffebee 0%, #fff3e0 100%)`,
      borderTop: '4px solid #f44336',
    },
    info: {
      background: `linear-gradient(135deg, #e3f2fd 0%, #e0f2f1 100%)`,
      borderTop: '4px solid #2196f3',
    },
  };

  const styles = variantStyles[variant] || variantStyles.default;

  return (
    <Card
      sx={{
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        background: styles.background,
        border: '1px solid',
        borderColor: alpha(color, 0.1),
        borderTop: styles.borderTop,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          right: 0,
          width: '100px',
          height: '100px',
          background: `radial-gradient(circle, ${alpha(color, 0.05)} 0%, transparent 100%)`,
          borderRadius: '50%',
          pointerEvents: 'none',
        },
        '&:hover': onClick ? {
          transform: 'translateY(-4px)',
          boxShadow: `0 12px 24px ${alpha(color, 0.15)}`,
          borderColor: color,
        } : {},
      }}
      onClick={onClick}
    >
      <CardContent sx={{ p: 2.5, position: 'relative', zIndex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1 }}>
            <Typography
              gutterBottom
              variant="overline"
              fontWeight="600"
              sx={{
                color: 'text.secondary',
                fontSize: '0.7rem',
                letterSpacing: '0.5px',
              }}
            >
              {title}
            </Typography>
            <Typography
              variant="h3"
              component="div"
              fontWeight="700"
              sx={{ color, mb: 0.5, lineHeight: 1.2 }}
            >
              {typeof value === 'number' ? value.toLocaleString() : value}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              {subtitle && (
                <Typography
                  variant="body2"
                  sx={{ color: 'text.secondary', fontWeight: '500' }}
                >
                  {subtitle}
                </Typography>
              )}
              {trend && (
                <Chip
                  label={trend}
                  size="small"
                  color={trendColor}
                  variant="outlined"
                  sx={{
                    height: '20px',
                    fontSize: '0.6rem',
                    fontWeight: '600',
                  }}
                />
              )}
            </Box>
          </Box>
          {icon && (
            <Box
              sx={{
                color: color,
                fontSize: 48,
                opacity: 0.8,
                ml: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {icon}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default DashboardCard;
