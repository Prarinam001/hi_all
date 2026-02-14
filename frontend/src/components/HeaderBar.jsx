import React from 'react';
import { Box, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import AppLogo from './AppLogo';
import { useAuth } from '../context/AuthContext';

const styles = {
    header: {
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        p: 2,
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider'
    }
};

export default function HeaderBar() {
    const { user, logout, loading } = useAuth();

    // Hide header while auth is loading or when user is already logged in
    if (loading || user) return null;

    return (
        <Box sx={styles.header}>
            <AppLogo size={40} />

            <Box>
                <Button component={RouterLink} to="/login" color="primary">Login</Button>
                <Button component={RouterLink} to="/signup" color="primary">Sign Up</Button>
            </Box>
        </Box>
    );
}
