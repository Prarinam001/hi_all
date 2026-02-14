import React from 'react';
import { Box, Avatar, Typography, IconButton } from '@mui/material';
import { Video, Phone, MoreVertical, Menu } from 'lucide-react';
import EmailTooltip from './EmailTooltip';

const styles = {
    header: {
        height: 64,
        bgcolor: 'background.paper',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2,
        borderBottom: 1,
        borderColor: 'divider'
    },
    userSection: {
        display: 'flex',
        alignItems: 'center',
        gap: 2
    },
    menuButton: {
        display: { xs: 'inline-flex', md: 'none' }
    },
    avatar: {
        cursor: 'pointer'
    },
    actionSection: {
        display: 'flex',
        gap: 1
    }
};

export default function ChatHeader({ user, selectedUser, startCall, startVoiceCall, onLogout, copiedEmail, onCopy, onSidebarToggle }) {
    return (
        <Box sx={styles.header}>
            <Box sx={styles.userSection}>
                <IconButton onClick={onSidebarToggle} sx={styles.menuButton} aria-label="Open conversations">
                    <Menu />
                </IconButton>
                <EmailTooltip email={selectedUser?.email} copiedEmail={copiedEmail} onCopy={onCopy}>
                    <Avatar sx={styles.avatar}>{(selectedUser?.name || selectedUser?.full_name)?.[0]?.toUpperCase()}</Avatar>
                </EmailTooltip>
                <Typography variant="subtitle1" fontWeight="bold">{selectedUser?.name || selectedUser?.full_name}</Typography>
            </Box>
            <Box sx={styles.actionSection}>
                {!selectedUser?.isGroup && (
                    <>
                        <IconButton onClick={() => startCall('video')} title="Start Video Call"><Video /></IconButton>
                        <IconButton onClick={startVoiceCall} title="Start Voice Call"><Phone /></IconButton>
                    </>
                )}
                <IconButton><MoreVertical /></IconButton>
            </Box>
        </Box>
    );
}
