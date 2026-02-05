import React from 'react';
import { Box, Avatar, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AppLogo({ size = 40 }) {
    const px = typeof size === 'number' ? size : 40;
    const { user } = useAuth();

    const content = (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: user ? 'default' : 'pointer' }}>
            <Avatar sx={{
                bgcolor: 'primary.main',
                width: px,
                height: px,
                fontWeight: 'bold',
                animation: 'pulse 2.4s ease-in-out infinite',
                '@keyframes pulse': {
                    '0%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.08)' },
                    '100%': { transform: 'scale(1)' }
                }
            }}>HI!</Avatar>

            <Typography variant="h6" component="div" sx={{
                fontWeight: 'bold',
                animation: 'slideIn 600ms ease',
                '@keyframes slideIn': {
                    '0%': { opacity: 0, transform: 'translateX(-8px)' },
                    '100%': { opacity: 1, transform: 'translateX(0)' }
                }
            }}>ALL</Typography>
        </Box>
    );

    if (!user) {
        return (
            <RouterLink to="/" style={{ textDecoration: 'none', color: 'inherit' }}>{content}</RouterLink>
        );
    }

    return content;
}
