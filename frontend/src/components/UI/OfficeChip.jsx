import React from 'react';
import { Chip, Tooltip } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';

export default function OfficeChip({ office, locked = false, sx = {} }){
  if (!office) return null;
  return (
    <Tooltip title={locked ? 'Office enforced by your account' : office.name}>
      <Chip
        label={office.name}
        size="small"
        icon={locked ? <LockIcon fontSize="small" /> : undefined}
        sx={{ borderRadius: 2, bgcolor: 'background.paper', ...sx }}
      />
    </Tooltip>
  );
}
