import React from 'react';
import { Box, Card, CardContent, Grid, Skeleton, Paper } from '@mui/material';

// Dashboard Skeleton Loader
export const DashboardSkeleton = () => {
  return (
    <Box sx={{ maxWidth: '1400px', mx: 'auto', px: { xs: 2, sm: 3 } }}>
      {/* Header Skeleton */}
      <Box sx={{ mb: 6, textAlign: 'center' }}>
        <Skeleton variant="text" width="60%" height={60} sx={{ mx: 'auto', mb: 2 }} />
        <Skeleton variant="text" width="40%" height={30} sx={{ mx: 'auto' }} />
      </Box>

      {/* Stats Cards Skeleton */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        {[1, 2, 3, 4].map((item) => (
          <Grid item xs={12} sm={6} lg={3} key={item}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="60%" height={20} sx={{ mb: 1 }} />
                    <Skeleton variant="text" width="40%" height={50} sx={{ mb: 1 }} />
                    <Skeleton variant="text" width="70%" height={20} />
                  </Box>
                  <Skeleton variant="circular" width={56} height={56} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Charts Skeleton */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Skeleton variant="text" width="40%" height={30} sx={{ mb: 2 }} />
              <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Skeleton variant="text" width="40%" height={30} sx={{ mb: 2 }} />
              <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

// Table Skeleton Loader
export const TableSkeleton = ({ rows = 5, columns = 5 }) => {
  return (
    <Box>
      {/* Table Header */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} variant="text" width={`${100 / columns}%`} height={30} />
        ))}
      </Box>
      
      {/* Table Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <Box key={rowIndex} sx={{ display: 'flex', gap: 2, mb: 1.5, p: 2 }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} variant="text" width={`${100 / columns}%`} height={25} />
          ))}
        </Box>
      ))}
    </Box>
  );
};

// Card Grid Skeleton
export const CardGridSkeleton = ({ items = 6 }) => {
  return (
    <Grid container spacing={3}>
      {Array.from({ length: items }).map((_, index) => (
        <Grid item xs={12} sm={6} md={4} key={index}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
                <Skeleton variant="text" width="60%" height={25} />
              </Box>
              <Skeleton variant="text" width="100%" height={20} sx={{ mb: 1 }} />
              <Skeleton variant="text" width="80%" height={20} sx={{ mb: 2 }} />
              <Skeleton variant="rectangular" width="100%" height={40} sx={{ borderRadius: 1 }} />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

// Form Skeleton
export const FormSkeleton = ({ fields = 4 }) => {
  return (
    <Box>
      {Array.from({ length: fields }).map((_, index) => (
        <Box key={index} sx={{ mb: 3 }}>
          <Skeleton variant="text" width="30%" height={20} sx={{ mb: 1 }} />
          <Skeleton variant="rectangular" width="100%" height={56} sx={{ borderRadius: 1 }} />
        </Box>
      ))}
      <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
        <Skeleton variant="rectangular" width={120} height={42} sx={{ borderRadius: 1 }} />
        <Skeleton variant="rectangular" width={120} height={42} sx={{ borderRadius: 1 }} />
      </Box>
    </Box>
  );
};

// Generic Page Skeleton
export const PageSkeleton = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Skeleton variant="text" width="40%" height={40} sx={{ mb: 2 }} />
      <Skeleton variant="text" width="60%" height={25} sx={{ mb: 4 }} />
      <Skeleton variant="rectangular" width="100%" height={400} sx={{ borderRadius: 2 }} />
    </Box>
  );
};

export default {
  DashboardSkeleton,
  TableSkeleton,
  CardGridSkeleton,
  FormSkeleton,
  PageSkeleton
};
