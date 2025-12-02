import React from 'react';
import { Box, Typography, Grid, Card, CardContent, useTheme, alpha } from '@mui/material';
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

export function DashboardCharts({ purchaseRequests, borrows, items }) {
  const theme = useTheme();

  // Purchase Requests by Status
  const prStatusCounts = ['Pending', 'Approved', 'Rejected'].map(status =>
    purchaseRequests.filter(pr => pr.status === status).length
  );
  const prStatusData = {
    labels: ['Pending', 'Approved', 'Rejected'],
    datasets: [{
      label: 'Purchase Requests',
      data: prStatusCounts,
      backgroundColor: [
        alpha(theme.palette.warning.main, 0.8),
        alpha(theme.palette.success.main, 0.8),
        alpha(theme.palette.error.main, 0.8)
      ],
      borderColor: [
        theme.palette.warning.main,
        theme.palette.success.main,
        theme.palette.error.main
      ],
      borderWidth: 2,
      borderRadius: 8,
    }],
  };

  // Borrow Requests by Status
  const brStatusCounts = ['Pending', 'Approved', 'Rejected', 'Returned'].map(status =>
    borrows.filter(br => br.status === status).length
  );
  const brStatusData = {
    labels: ['Pending', 'Approved', 'Rejected', 'Returned'],
    datasets: [{
      label: 'Borrow Requests',
      data: brStatusCounts,
      backgroundColor: [
        alpha(theme.palette.info.main, 0.8),
        alpha(theme.palette.success.main, 0.8),
        alpha(theme.palette.error.main, 0.8),
        alpha(theme.palette.grey[600], 0.8)
      ],
      borderColor: [
        theme.palette.info.main,
        theme.palette.success.main,
        theme.palette.error.main,
        theme.palette.grey[600]
      ],
      borderWidth: 2,
      borderRadius: 8,
    }],
  };

  // Inventory Stock Levels - Doughnut Chart
  const lowStock = items.filter(it => it.stock <= (it.low_stock_threshold || 10) && it.stock > 0).length;
  const outStock = items.filter(it => it.stock === 0).length;
  const normalStock = items.length - lowStock - outStock;
  const inventoryPieData = {
    labels: ['Normal Stock', 'Low Stock', 'Out of Stock'],
    datasets: [{
      data: [normalStock, lowStock, outStock],
      backgroundColor: [
        alpha(theme.palette.success.main, 0.8),
        alpha(theme.palette.warning.main, 0.8),
        alpha(theme.palette.error.main, 0.8)
      ],
      borderColor: [
        theme.palette.success.main,
        theme.palette.warning.main,
        theme.palette.error.main
      ],
      borderWidth: 2,
    }],
  };

  // Request Trend (Last 7 Days)
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const prCount = purchaseRequests.filter(pr => {
      const prDate = pr.created_at?.split('T')[0];
      return prDate === dateStr;
    }).length;

    const brCount = borrows.filter(br => {
      const brDate = br.created_at?.split('T')[0];
      return brDate === dateStr;
    }).length;

    last7Days.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      prCount,
      brCount,
    });
  }

  const requestTrendData = {
    labels: last7Days.map(d => d.date),
    datasets: [
      {
        label: 'Purchase Requests',
        data: last7Days.map(d => d.prCount),
        fill: true,
        backgroundColor: alpha(theme.palette.primary.main, 0.1),
        borderColor: theme.palette.primary.main,
        borderWidth: 3,
        tension: 0.4,
        pointBackgroundColor: theme.palette.primary.main,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
      {
        label: 'Borrow Requests',
        data: last7Days.map(d => d.brCount),
        fill: true,
        backgroundColor: alpha(theme.palette.info.main, 0.1),
        borderColor: theme.palette.info.main,
        borderWidth: 3,
        tension: 0.4,
        pointBackgroundColor: theme.palette.info.main,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
      }
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 15,
          font: {
            size: 12,
            weight: '600',
          },
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        borderRadius: 8,
        titleFont: {
          size: 14,
          weight: 'bold',
        },
        bodyFont: {
          size: 13,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          font: {
            size: 11,
          },
        },
        grid: {
          color: alpha(theme.palette.divider, 0.5),
        },
      },
      x: {
        ticks: {
          font: {
            size: 11,
          },
        },
        grid: {
          display: false,
        },
      },
    },
  };

  const lineChartOptions = {
    ...chartOptions,
    interaction: {
      mode: 'index',
      intersect: false,
    },
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" fontWeight="700" gutterBottom sx={{ mb: 3 }}>
        📊 Analytics Overview
      </Typography>
      <Grid container spacing={3}>
        {/* Request Trend - Line Chart */}
        <Grid item xs={12} lg={8}>
          <Card 
            sx={{ 
              height: 400,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              borderRadius: 3,
            }}
          >
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" fontWeight="600" gutterBottom>
                Request Trend (Last 7 Days)
              </Typography>
              <Box sx={{ flex: 1, position: 'relative', minHeight: 0 }}>
                <Line data={requestTrendData} options={lineChartOptions} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Inventory Stock Levels - Doughnut */}
        <Grid item xs={12} lg={4}>
          <Card 
            sx={{ 
              height: 400,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              borderRadius: 3,
            }}
          >
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" fontWeight="600" gutterBottom>
                Inventory Stock Status
              </Typography>
              <Box sx={{ flex: 1, position: 'relative', minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Doughnut data={inventoryPieData} options={chartOptions} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Purchase Requests Status - Bar */}
        <Grid item xs={12} md={6}>
          <Card 
            sx={{ 
              height: 350,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              borderRadius: 3,
            }}
          >
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" fontWeight="600" gutterBottom>
                Purchase Requests by Status
              </Typography>
              <Box sx={{ flex: 1, position: 'relative', minHeight: 0 }}>
                <Bar data={prStatusData} options={chartOptions} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Borrow Requests Status - Bar */}
        <Grid item xs={12} md={6}>
          <Card 
            sx={{ 
              height: 350,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              borderRadius: 3,
            }}
          >
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" fontWeight="600" gutterBottom>
                Borrow Requests by Status
              </Typography>
              <Box sx={{ flex: 1, position: 'relative', minHeight: 0 }}>
                <Bar data={brStatusData} options={chartOptions} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
