import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { fetchMemorandumReceipts } from '../api/memorandumReceipt';
import { getMyBorrowRequests } from '../api/borrowRequests';
import { fetchItems } from '../api/item';
import { fetchDashboardMrTimeline } from '../api/dashboard';
import { useUser } from '../context/UserContext';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
  Divider,
  LinearProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  CheckCircle as ApprovedIcon,
  Pending as PendingIcon,
  Cancel as RejectedIcon,
  ShoppingCart as CartIcon,
  Inventory as ItemsIcon,
  Assignment as RequestIcon,
  Description as TimelineIcon,
} from '@mui/icons-material';
import OfficeChip from '../components/UI/OfficeChip';
import PrimaryButton from '../components/UI/PrimaryButton';

export default function StaffDashboardPage() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [memoRequests, setMemoRequests] = useState([]);
  const [borrowRequests, setBorrowRequests] = useState([]);
  const [availableItems, setAvailableItems] = useState([]);
  const [mrTimeline, setMrTimeline] = useState([]);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      // Load data with individual error handling
      let memoList = [];
      let borrowList = [];
      let itemsList = [];

      // Load memorandum receipts
      try {
        const memoResp = await fetchMemorandumReceipts({ requested_by: user?.id });
        memoList = Array.isArray(memoResp) ? memoResp : [];
      } catch (e) {
        console.warn('Failed to load memorandum receipts:', e);
        memoList = [];
      }

      // Load borrow requests
      try {
        const borrowResp = await getMyBorrowRequests();
        borrowList = Array.isArray(borrowResp) ? borrowResp : [];
      } catch (e) {
        console.warn('Failed to load borrow requests:', e);
        borrowList = [];
      }

      // Load available items
      try {
        const itemsResp = await fetchItems({ office_id: user?.office?.id });
        itemsList = Array.isArray(itemsResp) ? itemsResp : itemsResp?.data || [];
      } catch (e) {
        console.warn('Failed to load items:', e);
        itemsList = [];
      }

      // Load MR timeline (recent audit log entries)
      try {
        const tl = await fetchDashboardMrTimeline({ limit: 10 });
        setMrTimeline(Array.isArray(tl) ? tl : []);
      } catch (e) {
        console.warn('Failed to load MR timeline:', e);
        setMrTimeline([]);
      }

      setMemoRequests(memoList);
      setBorrowRequests(borrowList);
      setAvailableItems(itemsList);
      setError(null);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Some data could not be loaded. This may be a temporary issue.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
      case 'cancelled':
        return 'error';
      case 'draft':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return <ApprovedIcon sx={{ fontSize: 16 }} />;
      case 'pending':
        return <PendingIcon sx={{ fontSize: 16 }} />;
      case 'rejected':
      case 'cancelled':
        return <RejectedIcon sx={{ fontSize: 16 }} />;
      default:
        return null;
    }
  };

  const totalRequests = memoRequests.length + borrowRequests.length;
  const pendingCount = memoRequests.filter(r => r.status === 'Pending').length +
    borrowRequests.filter(r => r.status === 'pending').length;
  const approvedCount = memoRequests.filter(r => r.status === 'Approved').length +
    borrowRequests.filter(r => r.status === 'approved' || r.status === 'borrowed').length;
  const rejectedCount = memoRequests.filter(r => r.status === 'Rejected').length +
    borrowRequests.filter(r => r.status === 'rejected').length;

  const recentRequests = [
    ...memoRequests.map(r => ({ ...r, type: 'memorandum', status: r.status })),
    ...borrowRequests.map(r => ({ ...r, type: 'borrow', status: r.status })),
  ].sort((a, b) => new Date(b.created_at || b.requested_at) - new Date(a.created_at || a.requested_at)).slice(0, 5);

  const handleRequestItem = () => navigate('/request-item');
  const handleBorrowItem = () => navigate('/borrows');
  const handleViewAllRequests = () => navigate('/my-requests');
  const handleViewTimeline = (mrId) => navigate(`/memorandum-receipts/${mrId}`);

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight="700" gutterBottom>
            Welcome back, {user?.name?.split(' ')[0]}! 👋
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Manage your item requests and borrowing in one place
          </Typography>
          {user?.office && <OfficeChip office={user.office} locked />}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Quick Stats */}
            <Grid container spacing={2} sx={{ mb: 4 }}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card sx={{ borderRadius: 2, position: 'relative', overflow: 'hidden' }}>
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      width: 100,
                      height: 100,
                      background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
                      opacity: 0.1,
                      borderRadius: '50%',
                      transform: 'translate(30%, -30%)',
                    }}
                  />
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Total Requests
                    </Typography>
                    <Typography variant="h6" fontWeight="700" gutterBottom>
                      {totalRequests}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip
                        icon={<PendingIcon />}
                        label={pendingCount}
                        size="small"
                        variant="outlined"
                        color="warning"
                      />
                      <Chip
                        icon={<ApprovedIcon />}
                        label={approvedCount}
                        size="small"
                        variant="outlined"
                        color="success"
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card sx={{ borderRadius: 2, position: 'relative', overflow: 'hidden' }}>
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      width: 100,
                      height: 100,
                      background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
                      opacity: 0.1,
                      borderRadius: '50%',
                      transform: 'translate(30%, -30%)',
                    }}
                  />
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Pending Approval
                    </Typography>
                    <Typography variant="h6" fontWeight="700">
                      {pendingCount}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Awaiting supply officer review
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card sx={{ borderRadius: 2, position: 'relative', overflow: 'hidden' }}>
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      width: 100,
                      height: 100,
                      background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
                      opacity: 0.1,
                      borderRadius: '50%',
                      transform: 'translate(30%, -30%)',
                    }}
                  />
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Approved
                    </Typography>
                    <Typography variant="h6" fontWeight="700">
                      {approvedCount}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Ready for pickup
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card sx={{ borderRadius: 2, position: 'relative', overflow: 'hidden' }}>
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      width: 100,
                      height: 100,
                      background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
                      opacity: 0.1,
                      borderRadius: '50%',
                      transform: 'translate(30%, -30%)',
                    }}
                  />
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Available Items
                    </Typography>
                    <Typography variant="h6" fontWeight="700">
                      {availableItems.length}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Ready to request
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Recent MR Timeline */}
            <Card sx={{ borderRadius: 2, mb: 4 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 2 }}>
                  <Box>
                    <Typography variant="h6" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TimelineIcon sx={{ fontSize: 20 }} /> Recent MR Timeline
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Latest updates on your memorandum receipts
                    </Typography>
                  </Box>
                  <Button size="small" variant="outlined" onClick={handleViewAllRequests}>
                    View All
                  </Button>
                </Box>

                {mrTimeline.length === 0 ? (
                  <Alert severity="info">No timeline activity yet.</Alert>
                ) : (
                  <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 800 }}>MR</TableCell>
                          <TableCell sx={{ fontWeight: 800 }}>Update</TableCell>
                          <TableCell sx={{ fontWeight: 800 }}>When</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800 }}>Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {mrTimeline.map((log) => (
                          <TableRow key={log.id} hover>
                            <TableCell sx={{ fontWeight: 700 }}>
                              {log.mr_number ? `MR#${log.mr_number}` : `MR#${log.mr_id}`}
                              {log.mr_status && (
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                  {log.mr_status}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight={600}>
                                {log.description || log.action}
                              </Typography>
                              {log.user_name && (
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                  By: {log.user_name}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>
                              {log.created_at ? new Date(log.created_at).toLocaleString() : '—'}
                            </TableCell>
                            <TableCell align="right">
                              <Button size="small" variant="outlined" onClick={() => handleViewTimeline(log.mr_id)}>
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card sx={{ mb: 4, borderRadius: 2, background: 'linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%)' }}>
              <CardContent>
                <Typography variant="h6" fontWeight="600" gutterBottom>
                  Quick Actions
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <PrimaryButton
                      fullWidth
                      startIcon={<CartIcon />}
                      onClick={handleRequestItem}
                      variant="contained"
                    >
                      Request Item
                    </PrimaryButton>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <PrimaryButton
                      fullWidth
                      startIcon={<AddIcon />}
                      onClick={handleBorrowItem}
                      variant="outlined"
                    >
                      Borrow Item
                    </PrimaryButton>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <PrimaryButton
                      fullWidth
                      startIcon={<RequestIcon />}
                      onClick={handleViewAllRequests}
                      variant="outlined"
                    >
                      View All Requests
                    </PrimaryButton>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <PrimaryButton
                      fullWidth
                      startIcon={<ItemsIcon />}
                      onClick={() => navigate('/available-items')}
                      variant="outlined"
                    >
                      Browse Inventory
                    </PrimaryButton>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Recent Requests */}
            <Grid container spacing={3}>
              <Grid size={{ xs: 12 }}>
                <Card sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" fontWeight="600">
                        Recent Requests
                      </Typography>
                      <Button size="small" onClick={handleViewAllRequests}>
                        View All
                      </Button>
                    </Box>
                    <Divider sx={{ mb: 2 }} />

                    {recentRequests.length === 0 ? (
                      <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                        No requests yet. Start by requesting an item!
                      </Typography>
                    ) : (
                      <TableContainer sx={{ borderRadius: 1 }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                              <TableCell sx={{ fontWeight: 600 }}>Request ID</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Details</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                              <TableCell sx={{ fontWeight: 600, textAlign: 'right' }}>Date</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {recentRequests.map((req) => (
                              <TableRow key={`${req.type}-${req.id}`} sx={{ '&:hover': { bgcolor: '#fafafa' } }}>
                                <TableCell sx={{ fontWeight: 500 }}>
                                  {req.type === 'memorandum' ? `MR#${req.pr_number}` : `BR#${req.id}`}
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={req.type === 'memorandum' ? 'Memorandum' : 'Borrow'}
                                    size="small"
                                    variant="outlined"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2">
                                    {req.purpose || req.item?.name || 'N/A'}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    icon={getStatusIcon(req.status)}
                                    label={typeof req.status === 'string' ? req.status.charAt(0).toUpperCase() + req.status.slice(1) : 'Unknown'}
                                    size="small"
                                    color={getStatusColor(req.status)}
                                  />
                                </TableCell>
                                <TableCell sx={{ textAlign: 'right' }}>
                                  <Typography variant="caption" color="text.secondary">
                                    {new Date(req.created_at || req.requested_at).toLocaleDateString()}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Request Status Guide */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Card sx={{ borderRadius: 2, background: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)' }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight="600" gutterBottom>
                      📖 Request Status Guide
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box>
                        <Chip icon={<PendingIcon />} label="Pending" color="warning" size="small" sx={{ mb: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                          Your request is waiting for supply officer review
                        </Typography>
                      </Box>
                      <Box>
                        <Chip icon={<ApprovedIcon />} label="Approved" color="success" size="small" sx={{ mb: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                          Your request is approved and ready for pickup
                        </Typography>
                      </Box>
                      <Box>
                        <Chip icon={<RejectedIcon />} label="Rejected" color="error" size="small" sx={{ mb: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                          Your request was not approved. Check the reason and try again.
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* How to Request */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Card sx={{ borderRadius: 2, background: 'linear-gradient(135deg, #f0f4c3 0%, #fff9e6 100%)' }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight="600" gutterBottom>
                      ❓ How to Request Items
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Typography sx={{ fontWeight: 700, color: 'primary.main', minWidth: 24 }}>1.</Typography>
                        <Typography variant="body2">
                          Click <strong>"Request Item"</strong> or browse <strong>"Available Items"</strong>
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Typography sx={{ fontWeight: 700, color: 'primary.main', minWidth: 24 }}>2.</Typography>
                        <Typography variant="body2">
                          Fill in item details, quantity, unit, and urgency level
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Typography sx={{ fontWeight: 700, color: 'primary.main', minWidth: 24 }}>3.</Typography>
                        <Typography variant="body2">
                          Submit your request for supply officer approval
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Typography sx={{ fontWeight: 700, color: 'primary.main', minWidth: 24 }}>4.</Typography>
                        <Typography variant="body2">
                          Track status in <strong>"My Requests"</strong> and get notified
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Typography sx={{ fontWeight: 700, color: 'primary.main', minWidth: 24 }}>5.</Typography>
                        <Typography variant="body2">
                          Pick up approved items from your office supply area
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </>
        )}
      </Box>
    </DashboardLayout>
  );
}
