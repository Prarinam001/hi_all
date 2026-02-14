import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { Menu } from 'lucide-react';
import AppLogo from './AppLogo';

const styles = {
    mobileHeader: {
        height: 64,
        bgcolor: 'background.paper',
        display: { xs: 'flex', md: 'none' },
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2,
        borderBottom: 1,
        borderColor: 'divider'
    },
    emptyChatPlaceholder: {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    }
};

export default function EmptyChatState({ onSidebarToggle }) {
    return (
        <>
            {/* Mobile header with menu button when no user selected */}
            <Box sx={styles.mobileHeader}>
                <AppLogo size={40} />
                <IconButton onClick={onSidebarToggle} aria-label="Open conversations">
                    <Menu />
                </IconButton>
            </Box>
            <Box sx={styles.emptyChatPlaceholder}>
                <Typography color="text.secondary">Select a user to start chatting</Typography>
            </Box>
        </>
    );
}
