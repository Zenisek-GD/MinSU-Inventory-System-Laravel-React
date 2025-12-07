import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { fetchItemsReport } from '../api/reports';
import { fetchOffices } from '../api/office';
import { fetchCategories } from '../api/category';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  MenuItem,
  Button,
  IconButton,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Stack,
  Divider,
  alpha,
  useTheme,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  TablePagination,
  Fade,
  LinearProgress,
  InputAdornment
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  PictureAsPdf as PdfIcon,
  BarChart as ChartIcon,
  Refresh as RefreshIcon,
  DateRange as DateIcon,
  Business as OfficeIcon,
  Category as CategoryIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
  Block as BlockIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  Inventory as InventoryIcon,
  ArrowDropDown as ArrowDropDownIcon,
  Description as DescriptionIcon,
  CloudDownload as CloudDownloadIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const ReportsPage = () => {
  const theme = useTheme();
  const [filters, setFilters] = useState({ 
    start_date: null, 
    end_date: null, 
    office_id: '', 
    category_id: '', 
    status: '' 
  });
  const [data, setData] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [offices, setOffices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [exportLoading, setExportLoading] = useState(false);
  const [reportType, setReportType] = useState('detailed');
  const [chartView, setChartView] = useState(false);

  useEffect(() => {
    loadLookups();
  }, []);

  const loadLookups = async () => {
    try {
      const off = await fetchOffices();
      setOffices(off?.data || off || []);
    } catch (e) {
      setOffices([]);
    }
    try {
      const cat = await fetchCategories();
      setCategories(cat?.data || cat || []);
    } catch (e) {
      setCategories([]);
    }
  };

  const runReport = async () => {
    setLoading(true);
    try {
      const formattedFilters = {
        ...filters,
        start_date: filters.start_date ? new Date(filters.start_date).toISOString().split('T')[0] : '',
        end_date: filters.end_date ? new Date(filters.end_date).toISOString().split('T')[0] : ''
      };
      const res = await fetchItemsReport(formattedFilters);
      setData(res?.data || res || []);
      setStats(res?.stats || {
        total_items: data.length,
        available: data.filter(item => item.status === 'Available').length,
        borrowed: data.filter(item => item.status === 'Borrowed').length,
        inactive: data.filter(item => item.status === 'Inactive').length,
        total_value: data.reduce((sum, item) => sum + (parseFloat(item.purchase_price) || 0), 0)
      });
    } catch (e) {
      console.error('Report error:', e);
      setData([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = async () => {
    if (!data || data.length === 0) return;
    setExportLoading(true);
    try {
      const headers = ['ID', 'Name', 'Category', 'Office', 'Serial Number', 'Status', 'Purchase Date', 'Purchase Price'];
      const rows = data.map(r => [
        r.id,
        r.name,
        r.category?.name || '',
        r.office?.name || '',
        r.serial_number || '',
        r.status || '',
        r.purchase_date || '',
        r.purchase_price || ''
      ]);
      const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `inventory-report-${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setExportLoading(false);
    }
  };

  const exportPDF = () => {
    // Implement PDF export logic
    console.log('Export PDF');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Available': return 'success';
      case 'Borrowed': return 'warning';
      case 'Inactive': return 'error';
      default: return 'default';
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({ start_date: null, end_date: null, office_id: '', category_id: '', status: '' });
    setPage(0);
  };

  return (
    <DashboardLayout>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Box sx={{ p: 4 }}>
          {/* Header */}
          <Box sx={{ mb: 6 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
              <Box>
                <Typography 
                  variant="h4" 
                  fontWeight={800} 
                  gutterBottom
                  sx={{ 
                    color: 'text.primary',
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  Reports Dashboard
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Generate detailed inventory reports and analytics
                </Typography>
              </Box>
              <Stack direction="row" spacing={2}>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={clearFilters}
                  sx={{ borderRadius: 3 }}
                >
                  Clear Filters
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AssessmentIcon />}
                  onClick={runReport}
                  disabled={loading}
                  sx={{
                    borderRadius: 3,
                    fontWeight: 600,
                    bgcolor: theme.palette.primary.main,
                    '&:hover': { bgcolor: theme.palette.primary.dark }
                  }}
                >
                  {loading ? 'Running...' : 'Generate Report'}
                </Button>
              </Stack>
            </Box>

            {/* Report Type Toggle */}
            <Box sx={{ mb: 4 }}>
              <ToggleButtonGroup
                value={reportType}
                exclusive
                onChange={(e, value) => value && setReportType(value)}
                sx={{
                  '& .MuiToggleButton-root': {
                    px: 3,
                    py: 1,
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                    '&.Mui-selected': {
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: theme.palette.primary.main,
                      borderColor: theme.palette.primary.main,
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.15)
                      }
                    }
                  }
                }}
              >
                <ToggleButton value="detailed">
                  <DescriptionIcon sx={{ mr: 1 }} />
                  Detailed Report
                </ToggleButton>
                <ToggleButton value="summary">
                  <ChartIcon sx={{ mr: 1 }} />
                  Summary View
                </ToggleButton>
                <ToggleButton value="analytics">
                  <TrendingUpIcon sx={{ mr: 1 }} />
                  Analytics
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Box>

          {/* Filters Card */}
          <Card 
            elevation={0}
            sx={{
              mb: 4,
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              bgcolor: alpha(theme.palette.primary.main, 0.02)
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <FilterIcon sx={{ mr: 1.5, color: theme.palette.primary.main }} />
                <Typography variant="h6" fontWeight={700}>
                  Report Filters
                </Typography>
              </Box>

              <Grid container spacing={3}>
                {/* Date Filters */}
                <Grid item xs={12} md={6} lg={3}>
                  <DatePicker
                    label="Start Date"
                    value={filters.start_date}
                    onChange={(date) => handleFilterChange('start_date', date)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        size="small"
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <InputAdornment position="start">
                              <DateIcon />
                            </InputAdornment>
                          ),
                        }}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6} lg={3}>
                  <DatePicker
                    label="End Date"
                    value={filters.end_date}
                    onChange={(date) => handleFilterChange('end_date', date)}
                    renderInput={(params) => (
                      <TextField {...params} fullWidth size="small" />
                    )}
                  />
                </Grid>

                {/* Office Filter */}
                <Grid item xs={12} md={6} lg={2}>
                  <TextField
                    select
                    fullWidth
                    label="Office"
                    value={filters.office_id}
                    onChange={(e) => handleFilterChange('office_id', e.target.value)}
                    size="small"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <OfficeIcon />
                        </InputAdornment>
                      ),
                    }}
                  >
                    <MenuItem value="">All Offices</MenuItem>
                    {offices.map((office) => (
                      <MenuItem key={office.id} value={office.id}>
                        {office.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {/* Category Filter */}
                <Grid item xs={12} md={6} lg={2}>
                  <TextField
                    select
                    fullWidth
                    label="Category"
                    value={filters.category_id}
                    onChange={(e) => handleFilterChange('category_id', e.target.value)}
                    size="small"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CategoryIcon />
                        </InputAdornment>
                      ),
                    }}
                  >
                    <MenuItem value="">All Categories</MenuItem>
                    {categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {/* Status Filter */}
                <Grid item xs={12} md={6} lg={2}>
                  <TextField
                    select
                    fullWidth
                    label="Status"
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    size="small"
                  >
                    <MenuItem value="">All Status</MenuItem>
                    <MenuItem value="Available">Available</MenuItem>
                    <MenuItem value="Borrowed">Borrowed</MenuItem>
                    <MenuItem value="Inactive">Inactive</MenuItem>
                  </TextField>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Stats Summary */}
          {stats && (
            <Fade in={!!stats}>
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={2.4}>
                  <Card 
                    elevation={0}
                    sx={{
                      p: 3,
                      borderRadius: 3,
                      border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
                      bgcolor: alpha(theme.palette.info.main, 0.05)
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: alpha(theme.palette.info.main, 0.1),
                          color: theme.palette.info.main
                        }}
                      >
                        <InventoryIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="h4" fontWeight={800}>
                          {stats.total_items}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Items
                        </Typography>
                      </Box>
                    </Box>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={2.4}>
                  <Card 
                    elevation={0}
                    sx={{
                      p: 3,
                      borderRadius: 3,
                      border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
                      bgcolor: alpha(theme.palette.success.main, 0.05)
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: alpha(theme.palette.success.main, 0.1),
                          color: theme.palette.success.main
                        }}
                      >
                        <CheckIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="h4" fontWeight={800}>
                          {stats.available}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Available
                        </Typography>
                      </Box>
                    </Box>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={2.4}>
                  <Card 
                    elevation={0}
                    sx={{
                      p: 3,
                      borderRadius: 3,
                      border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`,
                      bgcolor: alpha(theme.palette.warning.main, 0.05)
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: alpha(theme.palette.warning.main, 0.1),
                          color: theme.palette.warning.main
                        }}
                      >
                        <ScheduleIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="h4" fontWeight={800}>
                          {stats.borrowed}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Borrowed
                        </Typography>
                      </Box>
                    </Box>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={2.4}>
                  <Card 
                    elevation={0}
                    sx={{
                      p: 3,
                      borderRadius: 3,
                      border: `1px solid ${alpha(theme.palette.error.main, 0.1)}`,
                      bgcolor: alpha(theme.palette.error.main, 0.05)
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: alpha(theme.palette.error.main, 0.1),
                          color: theme.palette.error.main
                        }}
                      >
                        <BlockIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="h4" fontWeight={800}>
                          {stats.inactive}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Inactive
                        </Typography>
                      </Box>
                    </Box>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={2.4}>
                  <Card 
                    elevation={0}
                    sx={{
                      p: 3,
                      borderRadius: 3,
                      border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
                      bgcolor: alpha(theme.palette.success.main, 0.05)
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: alpha(theme.palette.success.main, 0.1),
                          color: theme.palette.success.main
                        }}
                      >
                        <MoneyIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="h4" fontWeight={800}>
                          ₱{(stats.total_value || 0).toLocaleString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Value
                        </Typography>
                      </Box>
                    </Box>
                  </Card>
                </Grid>
              </Grid>
            </Fade>
          )}

          {/* Report Table */}
          <Card 
            elevation={0}
            sx={{
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              overflow: 'hidden'
            }}
          >
            <Box sx={{ 
              p: 3, 
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              bgcolor: alpha(theme.palette.background.default, 0.5)
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <AssessmentIcon sx={{ color: theme.palette.primary.main }} />
                  <Box>
                    <Typography variant="h6" fontWeight={700}>
                      Report Results
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {data.length} items found
                    </Typography>
                  </Box>
                </Box>
                <Stack direction="row" spacing={2}>
                  <Tooltip title="Export CSV">
                    <IconButton
                      onClick={exportCsv}
                      disabled={!data.length || exportLoading}
                      sx={{
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
                      }}
                    >
                      {exportLoading ? <CircularProgress size={24} /> : <CloudDownloadIcon />}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Export PDF">
                    <IconButton
                      onClick={exportPDF}
                      disabled={!data.length}
                      sx={{
                        bgcolor: alpha(theme.palette.error.main, 0.1),
                        '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.2) }
                      }}
                    >
                      <PdfIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Print Report">
                    <IconButton
                      onClick={handlePrint}
                      disabled={!data.length}
                      sx={{
                        bgcolor: alpha(theme.palette.grey[500], 0.1),
                        '&:hover': { bgcolor: alpha(theme.palette.grey[500], 0.2) }
                      }}
                    >
                      <PrintIcon />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Box>
            </Box>

            <TableContainer>
              {loading ? (
                <Box sx={{ p: 8, textAlign: 'center' }}>
                  <CircularProgress size={60} sx={{ mb: 3 }} />
                  <Typography variant="h6" color="text.secondary">
                    Generating Report...
                  </Typography>
                  <LinearProgress sx={{ mt: 2, maxWidth: 400, mx: 'auto' }} />
                </Box>
              ) : data.length === 0 ? (
                <Box sx={{ p: 8, textAlign: 'center' }}>
                  <Box
                    sx={{
                      display: 'inline-flex',
                      p: 3,
                      borderRadius: '50%',
                      bgcolor: alpha(theme.palette.divider, 0.1),
                      mb: 3
                    }}
                  >
                    <AssessmentIcon sx={{ fontSize: 64, color: alpha(theme.palette.text.secondary, 0.3) }} />
                  </Box>
                  <Typography variant="h6" color="text.secondary" gutterBottom fontWeight={600}>
                    No Data Available
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 4, maxWidth: 400, mx: 'auto' }}>
                    Run a report using the filters above to see inventory data
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<RefreshIcon />}
                    onClick={runReport}
                    sx={{ borderRadius: 3 }}
                  >
                    Generate Report
                  </Button>
                </Box>
              ) : (
                <>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                        <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>#</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Item Name</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Category</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Office</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Serial No.</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Purchase Date</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Purchase Price</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((row, index) => (
                          <TableRow 
                            key={row.id || index}
                            hover
                            sx={{ 
                              '&:hover': {
                                bgcolor: alpha(theme.palette.primary.main, 0.02)
                              }
                            }}
                          >
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {page * rowsPerPage + index + 1}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body1" fontWeight={600}>
                                {row.name}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={row.category?.name || 'N/A'}
                                size="small"
                                sx={{ 
                                  bgcolor: alpha(theme.palette.info.main, 0.1),
                                  color: theme.palette.info.main
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {row.office?.name || 'N/A'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontFamily="monospace">
                                {row.serial_number || 'N/A'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={row.status || 'N/A'}
                                size="small"
                                color={getStatusColor(row.status)}
                                sx={{ fontWeight: 600 }}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {row.purchase_date ? new Date(row.purchase_date).toLocaleDateString() : 'N/A'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body1" fontWeight={700} color="success.main">
                                ₱{row.purchase_price?.toLocaleString() || '0'}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                  <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    component="div"
                    count={data.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    sx={{
                      borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                    }}
                  />
                </>
              )}
            </TableContainer>
          </Card>

          {/* Export Buttons Footer */}
          {data.length > 0 && (
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<CloudDownloadIcon />}
                onClick={exportCsv}
                disabled={exportLoading}
                sx={{ 
                  px: 4,
                  borderRadius: 3,
                  borderColor: theme.palette.primary.main,
                  color: theme.palette.primary.main
                }}
              >
                {exportLoading ? 'Exporting...' : 'Export CSV'}
              </Button>
              <Button
                variant="contained"
                startIcon={<PdfIcon />}
                onClick={exportPDF}
                sx={{ 
                  px: 4,
                  borderRadius: 3,
                  bgcolor: theme.palette.error.main,
                  '&:hover': { bgcolor: theme.palette.error.dark }
                }}
              >
                Export PDF
              </Button>
              <Button
                variant="contained"
                startIcon={<PrintIcon />}
                onClick={handlePrint}
                sx={{ 
                  px: 4,
                  borderRadius: 3,
                  bgcolor: theme.palette.grey[600],
                  '&:hover': { bgcolor: theme.palette.grey[700] }
                }}
              >
                Print Report
              </Button>
            </Box>
          )}
        </Box>
      </LocalizationProvider>
    </DashboardLayout>
  );
};

// Helper components
const Avatar = ({ children, sx, ...props }) => (
  <Box
    sx={{
      width: 48,
      height: 48,
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      ...sx
    }}
    {...props}
  >
    {children}
  </Box>
);

export default ReportsPage;