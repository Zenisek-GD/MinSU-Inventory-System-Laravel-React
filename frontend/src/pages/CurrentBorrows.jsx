import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { fetchBorrows, returnBorrow } from '../api/borrow';
import { useUser } from '../context/UserContext';
import {
	Box, Typography, Grid, Card, CardContent, Button, Chip,
	Dialog, DialogTitle, DialogContent, DialogActions,
	TextField, MenuItem, Snackbar, Alert, alpha, useTheme,
} from '@mui/material';
import { AssignmentReturn as ReturnIcon, Print as PrintIcon } from '@mui/icons-material';
import OfficeChip from '../components/UI/OfficeChip';
import PrimaryButton from '../components/UI/PrimaryButton';
import BorrowerSlip from '../components/BorrowerSlip';

// Shared print helper — opens popup and prints the Borrower's Slip
const printSlip = (borrowRecord, borrowerName = '', designation = 'Staff') => {
	const win = window.open('', '_blank', 'width=900,height=700');
	if (!win) { alert("Please allow popups to print the Borrower's Slip."); return; }
	win.document.write(`<!DOCTYPE html><html><head><title>Borrower's Slip</title>
		<style>body{margin:0;padding:0;}@media print{@page{size:A4;margin:12mm;}}</style>
		</head><body><div id="slip-root"></div></body></html>`);
	win.document.close();
	const root = ReactDOM.createRoot(win.document.getElementById('slip-root'));
	root.render(
		<BorrowerSlip
			borrows={borrowRecord ? [borrowRecord] : []}
			borrowerName={borrowerName}
			borrowerDesignation={designation}
			availableYes={true}
		/>
	);
	setTimeout(() => { win.focus(); win.print(); }, 600);
};

export default function CurrentBorrowsPage() {
	const theme = useTheme();
	const { user } = useUser();
	const [borrows, setBorrows] = useState([]);
	const [loading, setLoading] = useState(true);
	const [selected, setSelected] = useState(null);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [condition, setCondition] = useState('Good');
	const [notes, setNotes] = useState('');
	const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

	useEffect(() => { loadMyBorrows(); }, [user]);

	const loadMyBorrows = async () => {
		setLoading(true);
		try {
			const params = { user_id: user?.id };
			const data = await fetchBorrows(params);
			const list = Array.isArray(data) ? data : data.data || [];
			const active = list.filter(b => ['Approved', 'Borrowed'].includes(b.status));
			setBorrows(active);
		} catch {
			setBorrows([]);
		} finally {
			setLoading(false);
		}
	};

	const openReturn = (record) => {
		setSelected(record);
		setCondition(record?.item?.condition || 'Good');
		setNotes('');
		setDialogOpen(true);
	};

	const handleReturn = async () => {
		if (!selected) return;
		try {
			await returnBorrow(selected.id, { condition_after: condition, notes });
			setSnackbar({ open: true, message: 'Item returned successfully', severity: 'success' });
			setDialogOpen(false);
			loadMyBorrows();
		} catch {
			setSnackbar({ open: true, message: 'Failed to return item', severity: 'error' });
		}
	};

	const isOverdue = (date) => date && new Date(date) < new Date();

	return (
		<DashboardLayout>
			<Box sx={{ p: { xs: 2, sm: 3 } }}>
				{/* Header */}
				<Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
					<Box>
						<Typography variant="h5" fontWeight={800}>My Active Borrows</Typography>
						<Typography variant="body2" color="text.secondary">Items currently borrowed — return or print your slip here</Typography>
					</Box>
					{user?.office && <OfficeChip office={user.office} locked />}
				</Box>

				{loading ? (
					<Typography color="text.secondary">Loading…</Typography>
				) : borrows.length === 0 ? (
					<Card sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
						<Typography variant="h6" color="text.secondary">No active borrows</Typography>
						<Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
							All of your borrowed items have been returned.
						</Typography>
					</Card>
				) : (
					<Grid container spacing={2.5}>
						{borrows.map(b => {
							const overdue = isOverdue(b.expected_return_date) && b.status === 'Approved';
							return (
								<Grid item xs={12} md={6} key={b.id}>
									<Card sx={{
										borderRadius: 2,
										border: `1px solid ${overdue ? theme.palette.error.light : theme.palette.divider}`,
										borderLeft: `4px solid ${overdue ? theme.palette.error.main : theme.palette.primary.main}`,
									}}>
										<CardContent>
											{/* Item Name + Status */}
											<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
												<Typography variant="h6" fontWeight={700}>{b.item?.name || `Item #${b.item_id}`}</Typography>
												<Chip
													label={overdue ? 'Overdue' : b.status}
													size="small"
													color={overdue ? 'error' : b.status === 'Approved' ? 'success' : 'default'}
													sx={{ fontWeight: 700 }}
												/>
											</Box>

											{/* Details */}
											<Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4, mb: 2 }}>
												<Typography variant="body2" color="text.secondary">
													📅 Borrowed: {b.borrow_date ? new Date(b.borrow_date).toLocaleDateString() : 'N/A'}
												</Typography>
												<Typography variant="body2" color={overdue ? 'error.main' : 'text.secondary'}>
													🔄 Expected Return: {b.expected_return_date ? new Date(b.expected_return_date).toLocaleDateString() : 'N/A'}
												</Typography>
												{b.purpose && (
													<Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
														📋 {b.purpose}
													</Typography>
												)}
											</Box>

											{/* Actions */}
											<Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
												<Button
													variant="contained"
													size="small"
													startIcon={<ReturnIcon sx={{ fontSize: 15 }} />}
													onClick={() => openReturn(b)}
													sx={{ borderRadius: 1.5, fontWeight: 700 }}
												>
													Return
												</Button>
												<Button
													variant="outlined"
													size="small"
													startIcon={<PrintIcon sx={{ fontSize: 15 }} />}
													onClick={() => printSlip(b, user?.name || '', user?.designation || 'Staff')}
													sx={{ borderRadius: 1.5, fontWeight: 700 }}
												>
													Print Slip
												</Button>
											</Box>
										</CardContent>
									</Card>
								</Grid>
							);
						})}
					</Grid>
				)}

				{/* Return Dialog */}
				<Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
					<DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid', borderColor: 'divider' }}>
						Return: {selected?.item?.name}
					</DialogTitle>
					<DialogContent sx={{ pt: 2.5 }}>
						<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
							Select the condition of the item when returning it.
						</Typography>
						<TextField select fullWidth label="Condition After Use" value={condition} onChange={e => setCondition(e.target.value)} sx={{ mb: 2 }}>
							{['Excellent', 'Good', 'Fair', 'Needs Repair', 'Damaged'].map(c => (
								<MenuItem key={c} value={c}>{c}</MenuItem>
							))}
						</TextField>
						<TextField
							fullWidth multiline rows={3} label="Notes (optional)"
							placeholder="Any issues or observations…"
							value={notes} onChange={e => setNotes(e.target.value)}
						/>
					</DialogContent>
					<DialogActions sx={{ p: 2, gap: 1 }}>
						<Button onClick={() => setDialogOpen(false)} sx={{ borderRadius: 1.5 }}>Cancel</Button>
						<PrimaryButton onClick={handleReturn} sx={{ borderRadius: 1.5 }}>Confirm Return</PrimaryButton>
					</DialogActions>
				</Dialog>

				<Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
					<Alert severity={snackbar.severity}>{snackbar.message}</Alert>
				</Snackbar>
			</Box>
		</DashboardLayout>
	);
}
