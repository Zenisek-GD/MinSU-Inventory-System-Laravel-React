import React from 'react';
import { Box, Typography, Grid, Card, CardContent, useTheme, alpha, Stack, Chip } from '@mui/material';
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

export function DashboardCharts({ memorandumReceipts, borrows, items, timeRange = 'Daily' }) {
  const theme = useTheme();

  // Helper: filter by time range based on created_at date
  const filterByRange = (list) => {
    const now = new Date();
    const cutoff = new Date(now);
    if (timeRange === 'Daily') cutoff.setDate(now.getDate() - 1);
    else if (timeRange === 'Monthly') cutoff.setMonth(now.getMonth() - 1);
    else if (timeRange === 'Yearly') cutoff.setFullYear(now.getFullYear() - 1);

    return list.filter(item => {
      const created = item.created_at ? new Date(item.created_at) : null;
      return created && created >= cutoff && created <= now;
    });
  };

  const mrFiltered = filterByRange(memorandumReceipts);
  const brFiltered = filterByRange(borrows);

  // Calculate stats for summary cards
  const totalRequests = mrFiltered.length + brFiltered.length;
  const approvedRequests = 
    mrFiltered.filter(mr => mr.status === 'Approved').length +
    brFiltered.filter(br => br.status === 'Approved').length;
  const pendingRequests = 
    mrFiltered.filter(mr => mr.status === 'Pending').length +
    brFiltered.filter(br => br.status === 'Pending').length;

  // Memorandum Receipts by Status
  const mrStatusCounts = ['Pending', 'Approved', 'Rejected'].map(status =>
    mrFiltered.filter(mr => mr.status === status).length
  );
  const mrStatusData = {
    labels: ['Pending', 'Approved', 'Rejected'],
    datasets: [{
      label: 'Memorandum Receipts',
      data: mrStatusCounts,
      backgroundColor: [
        alpha(theme.palette.warning.main, 0.7),
        alpha(theme.palette.success.main, 0.7),
        alpha(theme.palette.error.main, 0.7)
      ],
      borderColor: [
        theme.palette.warning.dark,
        theme.palette.success.dark,
        theme.palette.error.dark
      ],
      borderWidth: 1,
      borderRadius: 8,
      barPercentage: 0.6,
      categoryPercentage: 0.7,
    }],
  };

  // Borrow Requests by Status
  const brStatusCounts = ['Pending', 'Approved', 'Rejected', 'Returned'].map(status =>
    brFiltered.filter(br => br.status === status).length
  );
  const brStatusData = {
    labels: ['Pending', 'Approved', 'Rejected', 'Returned'],
    datasets: [{
      label: 'Borrow Requests',
      data: brStatusCounts,
      backgroundColor: [
        alpha(theme.palette.warning.main, 0.7),
        alpha(theme.palette.success.main, 0.7),
        alpha(theme.palette.error.main, 0.7),
        alpha(theme.palette.info.main, 0.7)
      ],
      borderColor: [
        theme.palette.warning.dark,
        theme.palette.success.dark,
        theme.palette.error.dark,
        theme.palette.info.dark
      ],
      borderWidth: 1,
      borderRadius: 8,
      barPercentage: 0.6,
      categoryPercentage: 0.7,
    }],
  };

  // Inventory Stock Levels - Pie Chart (better for percentages)
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
        theme.palette.success.dark,
        theme.palette.warning.dark,
        theme.palette.error.dark
      ],
      borderWidth: 2,
      hoverOffset: 15,
      cutout: '70%',
    }],
  };

  // Request Trend (Last 7 Days)
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const prCount = mrFiltered.filter(mr => {
      const mrDate = mr.created_at?.split('T')[0];
      return mrDate === dateStr;
    }).length;

    const brCount = brFiltered.filter(br => {
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
        label: 'Memorandum Receipts',
        data: last7Days.map(d => d.prCount),
        fill: true,
        backgroundColor: alpha(theme.palette.primary.main, 0.08),
        borderColor: theme.palette.primary.main,
        borderWidth: 3,
        tension: 0.3,
        pointBackgroundColor: theme.palette.primary.main,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
      },
      {
        label: 'Borrow Requests',
        data: last7Days.map(d => d.brCount),
        fill: true,
        backgroundColor: alpha(theme.palette.secondary.main, 0.08),
        borderColor: theme.palette.secondary.main,
        borderWidth: 3,
        tension: 0.3,
        pointBackgroundColor: theme.palette.secondary.main,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
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
          padding: 20,
          font: {
            size: 12,
            family: theme.typography.fontFamily,
            weight: '500',
          },
          usePointStyle: true,
          pointStyle: 'circle',
          color: theme.palette.text.secondary,
        },
      },
      tooltip: {
        backgroundColor: alpha(theme.palette.background.paper, 0.95),
        titleColor: theme.palette.text.primary,
        bodyColor: theme.palette.text.secondary,
        padding: 12,
        borderRadius: 8,
        borderColor: theme.palette.divider,
        borderWidth: 1,
        titleFont: {
          size: 13,
          weight: '600',
          family: theme.typography.fontFamily,
        },
        bodyFont: {
          size: 12,
          family: theme.typography.fontFamily,
        },
        boxPadding: 6,
        displayColors: true,
        callbacks: {
          label: (context) => {
            return `${context.dataset.label}: ${context.raw}`;
          }
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          font: {
            size: 11,
            family: theme.typography.fontFamily,
          },
          color: theme.palette.text.secondary,
        },
        grid: {
          color: alpha(theme.palette.divider, 0.3),
          drawBorder: false,
        },
        border: {
          display: false,
        },
      },
      x: {
        ticks: {
          font: {
            size: 11,
            family: theme.typography.fontFamily,
          },
          color: theme.palette.text.secondary,
        },
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
      },
    },
  };

  const barChartOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      legend: {
        display: false,
      },
    },
  };

  const lineChartOptions = {
    ...chartOptions,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      ...chartOptions.plugins,
      legend: {
        position: 'top',
        labels: {
          padding: 15,
          font: {
            size: 12,
            family: theme.typography.fontFamily,
            weight: '500',
          },
          usePointStyle: true,
          pointStyle: 'circle',
          color: theme.palette.text.secondary,
        },
      },
    },
    scales: {
      ...chartOptions.scales,
      y: {
        ...chartOptions.scales.y,
        ticks: {
          ...chartOptions.scales.y.ticks,
          callback: (value) => Math.floor(value) === value ? value : '',
        },
      },
    },
  };

  const doughnutOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      legend: {
        position: 'right',
        labels: {
          padding: 20,
          font: {
            size: 12,
            family: theme.typography.fontFamily,
            weight: '500',
          },
          usePointStyle: true,
          pointStyle: 'circle',
          color: theme.palette.text.secondary,
          generateLabels: (chart) => {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label, i) => {
                const value = data.datasets[0].data[i];
                const percentage = ((value / items.length) * 100).toFixed(1);
                return {
                  text: `${label}: ${value} (${percentage}%)`,
                  fillStyle: data.datasets[0].backgroundColor[i],
                  strokeStyle: data.datasets[0].borderColor[i],
                  lineWidth: 1,
                  hidden: false,
                  index: i,
                };
              });
            }
            return [];
          },
        },
      },
      tooltip: {
        ...chartOptions.plugins.tooltip,
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.raw || 0;
            const percentage = ((value / items.length) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      },
    },
    cutout: '65%',
  };

  return (
    <Box sx={{ mb: 6 }}>
      {/* Header with Stats Summary */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h5" fontWeight={700} sx={{ color: theme.palette.primary.main, mb: 0.5 }}>
              Analytics Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Real-time insights and trends for your inventory management
            </Typography>
          </Box>
          <Chip 
            label={`${timeRange} View`} 
            color="primary" 
            variant="outlined"
            sx={{ fontWeight: 600 }}
          />
        </Box>

        {/* Summary Cards */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              bgcolor: alpha(theme.palette.primary.main, 0.08),
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              boxShadow: 'none',
            }}>
              <CardContent>
                <Typography variant="h3" fontWeight={800} color="primary.main" sx={{ mb: 1 }}>
                  {totalRequests}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Requests
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  {timeRange} period
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              bgcolor: alpha(theme.palette.success.main, 0.08),
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
              boxShadow: 'none',
            }}>
              <CardContent>
                <Typography variant="h3" fontWeight={800} color="success.main" sx={{ mb: 1 }}>
                  {approvedRequests}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Approved Requests
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  {totalRequests > 0 ? `${Math.round((approvedRequests / totalRequests) * 100)}% approval rate` : 'No data'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              bgcolor: alpha(theme.palette.warning.main, 0.08),
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`,
              boxShadow: 'none',
            }}>
              <CardContent>
                <Typography variant="h3" fontWeight={800} color="warning.main" sx={{ mb: 1 }}>
                  {pendingRequests}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pending Requests
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  Requires attention
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              bgcolor: alpha(theme.palette.info.main, 0.08),
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
              boxShadow: 'none',
            }}>
              <CardContent>
                <Typography variant="h3" fontWeight={800} color="info.main" sx={{ mb: 1 }}>
                  {items.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Items
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  In inventory
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Charts Grid */}
      <Grid container spacing={3}>
        {/* Request Trend - Line Chart */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ 
            height: 420,
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            '&:hover': {
              boxShadow: '0 6px 24px rgba(0,0,0,0.08)',
            }
          }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 3 }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Request Trend (Last 7 Days)
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Daily comparison of purchase and borrow requests
                </Typography>
              </Box>
              <Box sx={{ flex: 1, position: 'relative', minHeight: 0 }}>
                <Line data={requestTrendData} options={lineChartOptions} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Inventory Stock Levels - Doughnut */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ 
            height: 420,
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            '&:hover': {
              boxShadow: '0 6px 24px rgba(0,0,0,0.08)',
            }
          }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 3 }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Inventory Stock Status
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Overview of item availability
                </Typography>
              </Box>
              <Box sx={{ 
                flex: 1, 
                position: 'relative', 
                minHeight: 0, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <Doughnut data={inventoryPieData} options={doughnutOptions} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Memorandum Receipts Status - Bar */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            height: 380,
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            '&:hover': {
              boxShadow: '0 6px 24px rgba(0,0,0,0.08)',
            }
          }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 3 }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Memorandum Receipts by Status
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Distribution of memorandum receipt statuses
                </Typography>
              </Box>
              <Box sx={{ flex: 1, position: 'relative', minHeight: 0 }}>
                <Bar data={mrStatusData} options={barChartOptions} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Borrow Requests Status - Bar */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            height: 380,
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            '&:hover': {
              boxShadow: '0 6px 24px rgba(0,0,0,0.08)',
            }
          }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 3 }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Borrow Requests by Status
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Distribution of borrow request statuses
                </Typography>
              </Box>
              <Box sx={{ flex: 1, position: 'relative', minHeight: 0 }}>
                <Bar data={brStatusData} options={barChartOptions} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}