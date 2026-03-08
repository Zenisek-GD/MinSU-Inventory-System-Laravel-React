import React, { useState, useEffect, useRef } from "react";
import {
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Box,
  Grid,
  Typography,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  alpha,
  Avatar,
  Stack,
  IconButton,
  Tooltip,
  Badge,
  Card,
  CardContent,
  LinearProgress,
  Fade,
  Zoom,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import {
  fetchMemorandumReceipt,
  approveMemorandumReceipt,
  rejectMemorandumReceipt,
  updateProgressMR,
} from "../api/memorandumReceipt";
import PrintIcon from "@mui/icons-material/Print";
import DownloadIcon from "@mui/icons-material/Download";
import BusinessIcon from "@mui/icons-material/Business";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AssignmentIcon from "@mui/icons-material/Assignment";
import InventoryIcon from "@mui/icons-material/Inventory";
import HistoryIcon from "@mui/icons-material/History";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import UpdateIcon from "@mui/icons-material/Update";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PersonIcon from "@mui/icons-material/Person";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import ReceiptIcon from "@mui/icons-material/Receipt";
import FlagIcon from "@mui/icons-material/Flag";
import DescriptionIcon from "@mui/icons-material/Description";
import VerifiedIcon from "@mui/icons-material/Verified";
import PendingIcon from "@mui/icons-material/Pending";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ICSForm from "../components/ICSForm";
import PARForm from "../components/PARForm";

// Status configuration for consistent styling
const STATUS_CONFIG = {
  "pending review": {
    color: "#ed6c02",
    bgColor: "#fff4e5",
    icon: <PendingIcon />,
    label: "Pending Review"
  },
  "approved": {
    color: "#2e7d32",
    bgColor: "#e8f5e9",
    icon: <CheckCircleOutlineIcon />,
    label: "Approved"
  },
  "processing": {
    color: "#0288d1",
    bgColor: "#e1f5fe",
    icon: <UpdateIcon />,
    label: "Processing"
  },
  "ready for release": {
    color: "#7b1fa2",
    bgColor: "#f3e5f5",
    icon: <InventoryIcon />,
    label: "Ready for Release"
  },
  "out for delivery": {
    color: "#ed6c02",
    bgColor: "#fff3e0",
    icon: <LocalShippingIcon />,
    label: "Out for Delivery"
  },
  "for receiving": {
    color: "#0097a7",
    bgColor: "#e0f7fa",
    icon: <AssignmentIcon />,
    label: "For Receiving"
  },
  "completed": {
    color: "#2e7d32",
    bgColor: "#e8f5e9",
    icon: <CheckCircleIcon />,
    label: "Completed"
  },
  "rejected": {
    color: "#d32f2f",
    bgColor: "#ffebee",
    icon: <CancelIcon />,
    label: "Rejected"
  },
  "cancelled": {
    color: "#9e9e9e",
    bgColor: "#f5f5f5",
    icon: <CancelIcon />,
    label: "Cancelled"
  }
};

const MemorandumReceiptDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [mr, setMr] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);

  // Progress Update State
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [progressStatus, setProgressStatus] = useState("");
  const [progressNotes, setProgressNotes] = useState("");
  const [updating, setUpdating] = useState(false);

  // Print preview state
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [printFormType, setPrintFormType] = useState("ics");
  const printRef = useRef(null);

  // Fetch MR details
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetchMemorandumReceipt(id);
        const mrData = response.data.mr;
        setMr(mrData);
        setItems(response.data.items || mrData?.items || []);
        setPrintFormType(mrData?.form_type || "ics");
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load Memorandum Receipt");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const getStatusConfig = (status) => {
    const key = status?.toLowerCase() || "pending review";
    return STATUS_CONFIG[key] || STATUS_CONFIG["pending review"];
  };

  // Handle approve
  const handleApprove = async () => {
    try {
      setUpdating(true);
      await approveMemorandumReceipt(id);
      const response = await fetchMemorandumReceipt(id);
      setMr(response.data.mr);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to approve Memorandum Receipt");
    } finally {
      setUpdating(false);
    }
  };

  // Handle progress update
  const handleUpdateProgress = async () => {
    if (!progressStatus) {
      setError("Please select a status for the progress update");
      return;
    }
    try {
      setUpdating(true);
      await updateProgressMR(id, {
        status: progressStatus,
        notes: progressNotes,
      });
      const response = await fetchMemorandumReceipt(id);
      setMr(response.data.mr);
      setProgressDialogOpen(false);
      setProgressStatus("");
      setProgressNotes("");
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update progress");
    } finally {
      setUpdating(false);
    }
  };

  // Handle reject
  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError("Please provide a reason for rejection");
      return;
    }

    try {
      setUpdating(true);
      await rejectMemorandumReceipt(id, {
        notes: rejectionReason,
      });
      const response = await fetchMemorandumReceipt(id);
      setMr(response.data.mr);
      setRejectionDialogOpen(false);
      setRejectionReason("");
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reject Memorandum Receipt");
    } finally {
      setUpdating(false);
    }
  };

  // Calculate totals
  const calculateGrandTotal = () => {
    if (!items?.length) return "0.00";
    return items.reduce((sum, item) => sum + item.qty * item.unit_cost, 0).toFixed(2);
  };

  // Print handler
  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;
    const content = printRef.current?.innerHTML || "";
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${printFormType.toUpperCase()} - ${mr?.mr_number || ""}</title>
          <meta charset="UTF-8" />
          <style>
            body { margin: 0; padding: 20px; font-family: 'Arial', sans-serif; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          ${content}
          <script>window.onload = function(){ window.print(); window.close(); }<\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: "flex", 
        flexDirection: "column", 
        alignItems: "center", 
        justifyContent: "center", 
        minHeight: "60vh",
        gap: 2
      }}>
        <CircularProgress size={60} thickness={4} sx={{ color: '#006400' }} />
        <Typography variant="body1" color="text.secondary">
          Loading Memorandum Receipt...
        </Typography>
      </Box>
    );
  }

  if (!mr) {
    return (
      <Container maxWidth="lg" sx={{ py: 5 }}>
        <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 3 }}>
          <ReceiptIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h5" gutterBottom>Memorandum Receipt Not Found</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            The MR you're looking for doesn't exist or has been removed.
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => navigate("/memorandum-receipts")}
            startIcon={<ArrowBackIcon />}
            sx={{ borderRadius: 2 }}
          >
            Back to List
          </Button>
        </Paper>
      </Container>
    );
  }

  const statusConfig = getStatusConfig(mr.status);

  return (
    <Fade in={true} timeout={500}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Error Alert */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3, borderRadius: 2 }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        {/* Header Section */}
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            mb: 4, 
            borderRadius: 3,
            background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: alpha('#006400', 0.1),
                    color: '#006400',
                    width: 56,
                    height: 56
                  }}
                >
                  <ReceiptIcon sx={{ fontSize: 32 }} />
                </Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    MR NUMBER
                  </Typography>
                  <Typography variant="h4" component="h1" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                    {mr.mr_number}
                  </Typography>
                </Box>
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip
                  icon={statusConfig.icon}
                  label={statusConfig.label}
                  sx={{
                    bgcolor: statusConfig.bgColor,
                    color: statusConfig.color,
                    fontWeight: 600,
                    '& .MuiChip-icon': { color: statusConfig.color }
                  }}
                />
                <Chip
                  label={mr.form_type === "par" ? "PAR Form" : "ICS Form"}
                  icon={mr.form_type === "par" ? "🏷️" : "📋"}
                  sx={{
                    fontWeight: 600,
                    bgcolor: mr.form_type === "par" ? alpha("#b45309", 0.1) : alpha("#006400", 0.1),
                    color: mr.form_type === "par" ? "#b45309" : "#006400",
                  }}
                />
                <Chip
                  icon={<CalendarTodayIcon />}
                  label={`Created: ${new Date(mr.created_at || mr.date_issued).toLocaleDateString()}`}
                  variant="outlined"
                  sx={{ fontWeight: 500 }}
                />
              </Stack>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                <Tooltip title="Print Form">
                  <IconButton
                    onClick={() => {
                      setPrintFormType(mr.form_type || "ics");
                      setPrintDialogOpen(true);
                    }}
                    sx={{ 
                      bgcolor: alpha('#006400', 0.1),
                      color: '#006400',
                      '&:hover': { bgcolor: alpha('#006400', 0.2) }
                    }}
                  >
                    <PrintIcon />
                  </IconButton>
                </Tooltip>
                <Button
                  variant="outlined"
                  startIcon={<ArrowBackIcon />}
                  onClick={() => navigate("/memorandum-receipts")}
                  sx={{ borderRadius: 2, textTransform: 'none' }}
                >
                  Back
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Info Cards Grid */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Organization Card */}
          <Grid item xs={12} md={4}>
            <Zoom in={true} style={{ transitionDelay: '100ms' }}>
              <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Avatar sx={{ bgcolor: alpha('#006400', 0.1), color: '#006400' }}>
                      <BusinessIcon />
                    </Avatar>
                    <Typography variant="h6" fontWeight={600}>
                      Organization
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2.5 }} />
                  <Stack spacing={2.5}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Entity Name
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {mr.entity_name || "—"}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Fund Cluster
                      </Typography>
                      <Chip 
                        label={mr.fund_cluster || "Not specified"} 
                        size="small"
                        sx={{ mt: 0.5, fontWeight: 500 }}
                      />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Office/Department
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {mr.office || "—"}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>

          {/* Personnel Card */}
          <Grid item xs={12} md={4}>
            <Zoom in={true} style={{ transitionDelay: '200ms' }}>
              <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Avatar sx={{ bgcolor: alpha('#0288d1', 0.1), color: '#0288d1' }}>
                      <PersonIcon />
                    </Avatar>
                    <Typography variant="h6" fontWeight={600}>
                      Personnel
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2.5 }} />
                  <Stack spacing={2.5}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Accountable Officer
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {mr.accountable_officer || "—"}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Position
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {mr.position || "—"}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Received From
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {mr.received_from || "—"}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>

          {/* Details Card */}
          <Grid item xs={12} md={4}>
            <Zoom in={true} style={{ transitionDelay: '300ms' }}>
              <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Avatar sx={{ bgcolor: alpha('#ed6c02', 0.1), color: '#ed6c02' }}>
                      <DescriptionIcon />
                    </Avatar>
                    <Typography variant="h6" fontWeight={600}>
                      Details
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2.5 }} />
                  <Stack spacing={2.5}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Date Issued
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {mr.date_issued ? new Date(mr.date_issued).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        }) : "—"}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Purpose
                      </Typography>
                      <Paper 
                        variant="outlined" 
                        sx={{ 
                          p: 1.5, 
                          mt: 0.5,
                          bgcolor: alpha('#000', 0.02),
                          borderRadius: 2,
                          fontStyle: mr.purpose ? 'normal' : 'italic',
                          color: mr.purpose ? 'text.primary' : 'text.disabled'
                        }}
                      >
                        {mr.purpose || "No purpose specified."}
                      </Paper>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>
        </Grid>

        {/* Items Section */}
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            mb: 4, 
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
            <Avatar sx={{ bgcolor: alpha('#006400', 0.1), color: '#006400' }}>
              <InventoryIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={600}>
                Requested Items
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {items.length} item{items.length !== 1 ? 's' : ''} • Total Value: ₱{calculateGrandTotal()}
              </Typography>
            </Box>
          </Box>

          <TableContainer sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: alpha('#006400', 0.04) }}>
                  <TableCell sx={{ fontWeight: 600 }}>Item</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Qty</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>Unit</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Property #</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Unit Cost</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Total</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Condition</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow 
                    key={item.id}
                    sx={{ 
                      '&:hover': { bgcolor: alpha('#006400', 0.02) },
                      ...(index === items.length - 1 && { borderBottom: 'none' })
                    }}
                  >
                    <TableCell sx={{ fontWeight: 500 }}>{item.item_name}</TableCell>
                    <TableCell align="right">{item.qty}</TableCell>
                    <TableCell align="center">
                      <Chip label={item.unit} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      {item.property_number || <Typography variant="caption" color="text.disabled">—</Typography>}
                    </TableCell>
                    <TableCell align="right">₱{parseFloat(item.unit_cost).toFixed(2)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>₱{(item.qty * item.unit_cost).toFixed(2)}</TableCell>
                    <TableCell>
                      <Chip 
                        label={item.condition} 
                        size="small"
                        color={
                          item.condition?.toLowerCase() === 'good' ? 'success' :
                          item.condition?.toLowerCase() === 'fair' ? 'warning' : 'error'
                        }
                        variant="outlined"
                      />
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ bgcolor: alpha('#006400', 0.08) }}>
                  <TableCell colSpan={5} align="right" sx={{ fontWeight: 700 }}>
                    GRAND TOTAL:
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, color: '#006400', fontSize: '1.1rem' }}>
                    ₱{calculateGrandTotal()}
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Audit Log */}
        {mr.audit_log && mr.audit_log.length > 0 && (
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              mb: 4, 
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <Avatar sx={{ bgcolor: alpha('#7b1fa2', 0.1), color: '#7b1fa2' }}>
                <HistoryIcon />
              </Avatar>
              <Typography variant="h6" fontWeight={600}>
                Progress Timeline
              </Typography>
            </Box>

            <Box sx={{ position: 'relative', ml: 2 }}>
              {mr.audit_log.map((log, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 2, mb: 3 }}>
                  <Box sx={{ position: 'relative' }}>
                    <Avatar
                      sx={{
                        width: 40,
                        height: 40,
                        bgcolor: log.action === 'progress_update' ? alpha('#0288d1', 0.1) : alpha('#9e9e9e', 0.1),
                        color: log.action === 'progress_update' ? '#0288d1' : '#9e9e9e',
                        border: '2px solid',
                        borderColor: 'white',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}
                    >
                      {log.action === 'progress_update' ? <UpdateIcon /> : <HistoryIcon />}
                    </Avatar>
                    {index < mr.audit_log.length - 1 && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 40,
                          left: 19,
                          width: 2,
                          height: 40,
                          bgcolor: 'divider'
                        }}
                      />
                    )}
                  </Box>
                  <Box sx={{ flex: 1, pb: 2 }}>
                    <Paper 
                      variant="outlined" 
                      sx={{ 
                        p: 2, 
                        borderRadius: 2,
                        bgcolor: log.action === 'progress_update' ? alpha('#0288d1', 0.02) : 'transparent'
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Box>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {log.action === 'progress_update' ? 'Progress Update' : log.action}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            by {log.user_name}
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(log.created_at).toLocaleString()}
                        </Typography>
                      </Box>
                      <Typography variant="body2">
                        {log.description}
                      </Typography>
                    </Paper>
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>
        )}

        {/* Action Buttons */}
        <Paper 
          elevation={0} 
          sx={{ 
            p: 2, 
            borderRadius: 3,
            bgcolor: alpha('#006400', 0.02),
            border: '1px dashed',
            borderColor: alpha('#006400', 0.3),
            display: 'flex',
            gap: 2,
            justifyContent: 'flex-end',
            flexWrap: 'wrap'
          }}
        >
          {mr.status === "Pending Review" && (
            <>
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircleIcon />}
                onClick={handleApprove}
                disabled={updating}
                sx={{
                  borderRadius: 2,
                  px: 4,
                  py: 1,
                  textTransform: 'none',
                  fontWeight: 600
                }}
              >
                Approve Request
              </Button>
              <Button
                variant="contained"
                color="error"
                startIcon={<CancelIcon />}
                onClick={() => setRejectionDialogOpen(true)}
                disabled={updating}
                sx={{
                  borderRadius: 2,
                  px: 4,
                  py: 1,
                  textTransform: 'none',
                  fontWeight: 600
                }}
              >
                Reject Request
              </Button>
            </>
          )}

          {["Processing", "Ready for Release", "Out for Delivery"].includes(mr.status) && (
            <Button
              variant="contained"
              startIcon={<UpdateIcon />}
              onClick={() => {
                setProgressStatus(mr.status);
                setProgressDialogOpen(true);
              }}
              disabled={updating}
              sx={{
                borderRadius: 2,
                px: 4,
                py: 1,
                textTransform: 'none',
                fontWeight: 600,
                background: 'linear-gradient(135deg, #006400 0%, #004d00 100%)'
              }}
            >
              Update Progress
            </Button>
          )}
        </Paper>

        {/* Print Preview Dialog */}
        <Dialog
          open={printDialogOpen}
          onClose={() => setPrintDialogOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{ 
            sx: { 
              borderRadius: 3,
              overflow: 'hidden'
            } 
          }}
        >
          <DialogTitle sx={{ 
            pb: 1,
            bgcolor: '#f8f9fa',
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography variant="h6" fontWeight={700}>Print Form Preview</Typography>
              <ToggleButtonGroup
                value={printFormType}
                exclusive
                onChange={(e, val) => { if (val) setPrintFormType(val); }}
                size="small"
              >
                <ToggleButton
                  value="ics"
                  sx={{
                    fontWeight: 700,
                    px: 2,
                    "&.Mui-selected": { 
                      bgcolor: alpha("#006400", 0.15), 
                      color: "#006400", 
                      borderColor: "#006400" 
                    },
                  }}
                >
                  📋 ICS
                </ToggleButton>
                <ToggleButton
                  value="par"
                  sx={{
                    fontWeight: 700,
                    px: 2,
                    "&.Mui-selected": { 
                      bgcolor: alpha("#b45309", 0.12), 
                      color: "#b45309", 
                      borderColor: "#b45309" 
                    },
                  }}
                >
                  🏷️ PAR
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
            {mr.form_type && mr.form_type !== printFormType && (
              <Alert severity="info" sx={{ mt: 2, py: 0.5, fontSize: "0.8rem" }}>
                Original form type: <strong>{mr.form_type.toUpperCase()}</strong>. Previewing: <strong>{printFormType.toUpperCase()}</strong>
              </Alert>
            )}
          </DialogTitle>
          <DialogContent dividers sx={{ p: 0, bgcolor: "#f5f5f5" }}>
            <Box
              sx={{
                overflow: "auto",
                maxHeight: "65vh",
                display: "flex",
                justifyContent: "center",
                py: 3,
              }}
            >
              <Box
                ref={printRef}
                sx={{
                  bgcolor: "white",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                  display: "inline-block",
                  borderRadius: 1,
                  overflow: 'hidden'
                }}
              >
                {printFormType === "ics" ? (
                  <ICSForm mr={mr} items={items} />
                ) : (
                  <PARForm mr={mr} items={items} />
                )}
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1, bgcolor: '#f8f9fa' }}>
            <Button 
              onClick={() => setPrintDialogOpen(false)} 
              sx={{ textTransform: "none", borderRadius: 2 }}
            >
              Close
            </Button>
            <Button
              variant="contained"
              startIcon={<PrintIcon />}
              onClick={handlePrint}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                background: "linear-gradient(135deg, #006400 0%, #004d00 100%)",
                borderRadius: 2,
                px: 3
              }}
            >
              Print {printFormType.toUpperCase()}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Update Progress Dialog */}
        <Dialog 
          open={progressDialogOpen} 
          onClose={() => setProgressDialogOpen(false)} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle sx={{ 
            fontWeight: 700,
            bgcolor: alpha('#006400', 0.04),
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}>
            Update Progress
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <TextField
              select
              fullWidth
              label="Current Status"
              sx={{ mb: 3 }}
              value={progressStatus}
              onChange={(e) => setProgressStatus(e.target.value)}
              SelectProps={{ native: true }}
            >
              <option value="Processing">Processing</option>
              <option value="Ready for Release">Ready for Release</option>
              <option value="Out for Delivery">Out for Delivery</option>
              <option value="For Receiving">For Receiving</option>
            </TextField>
            <TextField
              fullWidth
              label="Progress Notes"
              value={progressNotes}
              onChange={(e) => setProgressNotes(e.target.value)}
              multiline
              rows={4}
              placeholder="Add details about the current progress..."
              variant="outlined"
            />
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button 
              onClick={() => setProgressDialogOpen(false)}
              sx={{ borderRadius: 2 }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateProgress} 
              variant="contained" 
              disabled={updating}
              sx={{ 
                borderRadius: 2,
                background: 'linear-gradient(135deg, #006400 0%, #004d00 100%)'
              }}
            >
              {updating ? <CircularProgress size={24} /> : 'Update Progress'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Rejection Dialog */}
        <Dialog 
          open={rejectionDialogOpen} 
          onClose={() => setRejectionDialogOpen(false)} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle sx={{ 
            fontWeight: 700,
            bgcolor: alpha('#d32f2f', 0.04),
            color: '#d32f2f',
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}>
            Reject Memorandum Receipt
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <TextField
              fullWidth
              label="Reason for Rejection"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              multiline
              rows={4}
              required
              placeholder="Please provide a detailed reason for rejection..."
            />
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button 
              onClick={() => setRejectionDialogOpen(false)}
              sx={{ borderRadius: 2 }}
            >
              Cancel1
            </Button>
            <Button 
              onClick={handleReject} 
              variant="contained" 
              color="error"
              disabled={updating}
              sx={{ borderRadius: 2 }}
            >
              {updating ? <CircularProgress size={24} /> : 'Confirm Rejection'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Fade>
  );
};

export default MemorandumReceiptDetailPage;