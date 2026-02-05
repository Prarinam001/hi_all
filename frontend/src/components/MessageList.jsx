import React from 'react';
import { Box, Paper, Typography, Avatar } from '@mui/material';

export default function MessageList({ messages = [], selectedUser }) {
    return (
        <Box sx={{ flex: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {messages.map((msg, i) => (
                <Box key={i} sx={{ display: 'flex', justifyContent: msg.isMine ? 'flex-end' : 'flex-start' }}>
                    <Paper sx={{ p: 1, px: 2, maxWidth: '60%', bgcolor: msg.isMine ? 'primary.dark' : 'background.paper', borderRadius: 2 }}>
                        {!msg.isMine && (
                            <Typography variant="caption" sx={{ display: 'block', fontWeight: 'bold', color: 'primary.main', mb: 0.5 }}>
                                {msg.sender_name || selectedUser?.full_name}
                            </Typography>
                        )}
                        <Typography variant="body1">{msg.content}</Typography>
                        <Typography variant="caption" sx={{ display: 'block', textAlign: 'right', opacity: 0.7 }}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                    </Paper>
                </Box>
            ))}
        </Box>
    );
}
