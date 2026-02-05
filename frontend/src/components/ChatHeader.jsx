import React from 'react';
import { Box, Avatar, Typography, IconButton } from '@mui/material';
import { Video, Phone, MoreVertical } from 'lucide-react';
import EmailTooltip from './EmailTooltip';

export default function ChatHeader({ user, selectedUser, startCall, startVoiceCall, onLogout, copiedEmail, onCopy }) {
    return (
        <Box sx={{ height: 64, bgcolor: 'background.paper', display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <EmailTooltip email={selectedUser?.email} copiedEmail={copiedEmail} onCopy={onCopy}>
                    <Avatar sx={{ cursor: 'pointer' }}>{selectedUser?.full_name?.[0]?.toUpperCase()}</Avatar>
                </EmailTooltip>
                <Typography variant="subtitle1" fontWeight="bold">{selectedUser?.full_name}</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton onClick={() => startCall('video')} title="Start Video Call"><Video /></IconButton>
                <IconButton onClick={startVoiceCall} title="Start Voice Call"><Phone /></IconButton>
                <IconButton><MoreVertical /></IconButton>
            </Box>
        </Box>
    );
}
