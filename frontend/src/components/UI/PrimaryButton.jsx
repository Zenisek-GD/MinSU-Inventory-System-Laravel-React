import React from 'react';
import { Button, CircularProgress } from '@mui/material';

export default function PrimaryButton({ children, loading=false, variant='contained', color='primary', ...props }){
  return (
    <Button variant={variant} color={color} disabled={loading || props.disabled} {...props}>
      {loading ? <CircularProgress size={18} color="inherit" sx={{ mr: 1 }} /> : null}
      {children}
    </Button>
  );
}
