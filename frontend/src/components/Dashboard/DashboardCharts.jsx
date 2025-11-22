import React from 'react';
import { Box, Typography } from '@mui/material';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export function DashboardCharts({ purchaseRequests, borrows, items }) {
  // Purchase Requests by Status
  const prStatusCounts = ['Pending', 'Approved', 'Rejected'].map(status =>
    purchaseRequests.filter(pr => pr.status === status).length
  );
  const prStatusData = {
    labels: ['Pending', 'Approved', 'Rejected'],
    datasets: [{
      label: 'Purchase Requests',
      data: prStatusCounts,
      backgroundColor: ['#fbc02d', '#388e3c', '#d32f2f'],
    }],
  };

  // Borrow Requests by Status
  const brStatusCounts = ['Pending', 'Approved', 'Rejected'].map(status =>
    borrows.filter(br => br.status === status).length
  );
  const brStatusData = {
    labels: ['Pending', 'Approved', 'Rejected'],
    datasets: [{
      label: 'Borrow Requests',
      data: brStatusCounts,
      backgroundColor: ['#0288d1', '#388e3c', '#d32f2f'],
    }],
  };

  // Inventory Pie: Low, Out, Normal
  const lowStock = items.filter(it => it.stock <= (it.low_stock_threshold || 10)).length;
  const outStock = items.filter(it => it.stock === 0).length;
  const normalStock = items.length - lowStock - outStock;
  const inventoryPieData = {
    labels: ['Low Stock', 'Out of Stock', 'Normal'],
    datasets: [{
      data: [lowStock, outStock, normalStock],
      backgroundColor: ['#fbc02d', '#d32f2f', '#388e3c'],
    }],
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Monitoring Overview
      </Typography>
      <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        <Box sx={{ width: 320 }}>
          <Typography variant="subtitle2" gutterBottom>Purchase Requests Status</Typography>
          <Bar data={prStatusData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
        </Box>
        <Box sx={{ width: 320 }}>
          <Typography variant="subtitle2" gutterBottom>Borrow Requests Status</Typography>
          <Bar data={brStatusData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
        </Box>
        <Box sx={{ width: 320 }}>
          <Typography variant="subtitle2" gutterBottom>Inventory Stock Levels</Typography>
          <Pie data={inventoryPieData} options={{ responsive: true }} />
        </Box>
      </Box>
    </Box>
  );
}
