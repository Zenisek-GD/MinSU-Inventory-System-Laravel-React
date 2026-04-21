import React from 'react';
import { Chip, Tooltip } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import { formatOfficeLabel, formatOfficeTooltip } from '../../utils/formatOfficeLabel';

export default function OfficeChip({ office, locked = false, sx = {} }){
  if (!office) return null;
  const label = formatOfficeLabel(office);
  const tooltip = locked ? 'Office enforced by your account' : (formatOfficeTooltip(office) || label);
  return (
    <Tooltip title={tooltip}>
      <Chip
        label={label}
        size="small"
        icon={locked ? <LockIcon fontSize="small" /> : undefined}
        sx={{ borderRadius: 2, bgcolor: 'background.paper', ...sx }}
      />
    </Tooltip>
  );
}
