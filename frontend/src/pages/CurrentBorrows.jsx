import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { fetchBorrows, returnBorrow } from '../api/borrow';
import { useUser } from '../context/UserContext';
import {
	Box, Typography, Grid, Card, CardContent, Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Snackbar, Alert
} from '@mui/material';
import OfficeChip from '../components/UI/OfficeChip';
import PrimaryButton from '../components/UI/PrimaryButton';

export default function CurrentBorrowsPage(){
	const { user } = useUser();
	const [borrows, setBorrows] = useState([]);
	const [loading, setLoading] = useState(true);
	const [selected, setSelected] = useState(null);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [condition, setCondition] = useState('Good');
	const [notes, setNotes] = useState('');
	const [snackbar, setSnackbar] = useState({ open:false, message:'', severity:'success' });

	useEffect(() => { loadMyBorrows(); }, [user]);

	const loadMyBorrows = async () => {
		setLoading(true);
		try{
			// Fetch all borrows for the user, then filter to active statuses client-side
			const params = { user_id: user?.id };
			const data = await fetchBorrows(params);
			const list = Array.isArray(data) ? data : data.data || [];
			// Active statuses are those where the item is still out — treat 'Approved' as active
			const active = list.filter(b => ['Approved','Borrowed'].includes(b.status));
			setBorrows(active);
		}catch(e){
			setBorrows([]);
		}finally{ setLoading(false); }
	};

	const openReturn = (record) => { setSelected(record); setDialogOpen(true); }

	const handleReturn = async () => {
		if (!selected) return;
		try{
			await returnBorrow(selected.id, { condition_after: condition, notes });
			setSnackbar({ open:true, message:'Item returned', severity:'success' });
			setDialogOpen(false);
			loadMyBorrows();
		}catch(e){
			setSnackbar({ open:true, message:'Failed to return', severity:'error' });
		}
	};

	return (
		<DashboardLayout>
			<Box sx={{ p: 3 }}>
				<Box sx={{ mb: 3 }}>
					<Typography variant="h4" fontWeight={700}>My Borrows</Typography>
					<Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
						<Typography variant="body2" color="text.secondary">Active borrows and return actions</Typography>
						{user?.office && <OfficeChip office={user.office} locked />}
					</Box>
				</Box>

				<Grid container spacing={3}>
					{borrows.map(b => (
						<Grid item xs={12} md={6} key={b.id}>
							<Card>
								<CardContent>
									<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
										<Box>
											<Typography variant="h6" fontWeight={600}>{b.item?.name || b.item_id}</Typography>
											<Typography variant="body2" color="text.secondary">Borrowed on: {b.borrow_date ? new Date(b.borrow_date).toLocaleDateString() : 'N/A'}</Typography>
										</Box>
										<Chip label={b.status} size="small" />
									</Box>
									<Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
										<PrimaryButton variant="outlined" onClick={() => openReturn(b)}>Return</PrimaryButton>
									</Box>
								</CardContent>
							</Card>
						</Grid>
					))}
				</Grid>

				<Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
					<DialogTitle>Return Item</DialogTitle>
					<DialogContent>
						<TextField select fullWidth label="Condition" value={condition} onChange={(e)=>setCondition(e.target.value)} sx={{ mt: 1 }}>
							<option value="Good">Good</option>
							<option value="Damaged">Damaged</option>
							<option value="Missing Parts">Missing Parts</option>
						</TextField>
						<TextField fullWidth multiline rows={3} label="Notes" value={notes} onChange={(e)=>setNotes(e.target.value)} sx={{ mt: 2 }} />
					</DialogContent>
					<DialogActions>
						<PrimaryButton variant="outlined" onClick={() => setDialogOpen(false)}>Cancel</PrimaryButton>
						<PrimaryButton onClick={handleReturn}>Confirm Return</PrimaryButton>
					</DialogActions>
				</Dialog>

				<Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({...snackbar, open:false})}>
					<Alert severity={snackbar.severity}>{snackbar.message}</Alert>
				</Snackbar>
			</Box>
		</DashboardLayout>
	);
}

