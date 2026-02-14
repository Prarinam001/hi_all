import React from 'react';
import { Tooltip, Box, Typography, IconButton } from '@mui/material';
import { Copy, Check } from 'lucide-react';

const styles = {
    tooltipTitle: {
        display: 'flex',
        alignItems: 'center',
        gap: 1
    },
    copyButton: {
        color: 'white',
        p: 0.5
    }
};

export default function EmailTooltip({ email, copiedEmail, onCopy, children }) {
    return (
        <Tooltip
            title={
                <Box sx={styles.tooltipTitle}>
                    <Typography variant="body2">{email}</Typography>
                    <IconButton
                        size="small"
                        onClick={(e) => {
                            e.stopPropagation();
                            onCopy && onCopy(email);
                        }}
                        sx={styles.copyButton}
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
