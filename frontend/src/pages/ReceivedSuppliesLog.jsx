import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { fetchReceivedSuppliesLogs } from '../api/receivedSupplies';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
} from '@mui/material';

export default function ReceivedSuppliesLogPage() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await fetchReceivedSuppliesLogs({ per_page: 50 });
      const list = Array.isArray(res) ? res : res?.data || [];
      setLogs(list);
    } catch (e) {
      setLogs([]);
    }
    setLoading(false);
  };

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" fontWeight={700} sx={{ mb: 2 }}>
          Received Supplies Log
        </Typography>

        <Card>
          <CardContent>
            {loading ? (
              <CircularProgress />
            ) : logs.length === 0 ? (
              <Typography color="text.secondary">No received supplies found</Typography>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Received At</TableCell>
                    <TableCell>MR No.</TableCell>
                    <TableCell>Received By</TableCell>
                    <TableCell>Accountable Officer</TableCell>
                    <TableCell align="right">Items</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.map((log) => {
                    const mr = log.memorandum_receipt || log.memorandumReceipt;
                    const itemsCount = Array.isArray(mr?.items) ? mr.items.length : 0;

                    return (
                      <TableRow key={log.id} hover>
                        <TableCell>
                          {log.created_at ? new Date(log.created_at).toLocaleString() : '-'}
                        </TableCell>
                        <TableCell>{mr?.mr_number || '-'}</TableCell>
                        <TableCell>{log.user_name || '-'}</TableCell>
                        <TableCell>{mr?.accountable_officer || '-'}</TableCell>
                        <TableCell align="right">{itemsCount}</TableCell>
                        <TableCell>{mr?.status || '-'}</TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => {
                              if (mr?.id) navigate(`/memorandum-receipts/${mr.id}`);
                            }}
                          >
                            View MR
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </Box>
    </DashboardLayout>
  );
}
