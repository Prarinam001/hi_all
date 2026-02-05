import React from 'react';
import { Tooltip, Box, Typography, IconButton } from '@mui/material';
import { Copy, Check } from 'lucide-react';

export default function EmailTooltip({ email, copiedEmail, onCopy, children }) {
    return (
        <Tooltip
            title={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2">{email}</Typography>
                    <IconButton
                        size="small"
                        onClick={(e) => {
                            e.stopPropagation();
                            onCopy && onCopy(email);
                        }}
                        sx={{ color: 'white', p: 0.5 }}
                    >
                        {copiedEmail === email ? <Check size={16} /> : <Copy size={16} />}
                    </IconButton>
                </Box>
            }
            arrow
        >
            {children}
        </Tooltip>
    );
}
