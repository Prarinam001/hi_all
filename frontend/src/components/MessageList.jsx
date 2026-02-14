import React from 'react';
import { Box, Paper, Typography, Avatar } from '@mui/material';

const styles = {
    container: {
        flex: 1,
        overflowY: 'auto',
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 1
    },
    messageWrapper: (isMine) => ({
        display: 'flex',
        justifyContent: isMine ? 'flex-end' : 'flex-start'
    }),
    messagePaper: (isMine) => ({
        p: 1,
        px: 2,
        maxWidth: '60%',
        bgcolor: isMine ? 'primary.dark' : 'background.paper',
        borderRadius: 2
    }),
    senderName: {
        display: 'block',
        fontWeight: 'bold',
        color: 'primary.main',
        mb: 0.5
    },
    timestamp: {
        display: 'block',
        textAlign: 'right',
        opacity: 0.7
    }
};

export default function MessageList({ messages = [], selectedUser }) {
    return (
        <Box sx={styles.container}>
            {messages.map((msg, i) => (
                <Box key={i} sx={styles.messageWrapper(msg.isMine)}>
                    <Paper sx={styles.messagePaper(msg.isMine)}>
                        {!msg.isMine && (
                            <Typography variant="caption" sx={styles.senderName}>
                                {msg.sender_name || selectedUser?.full_name || selectedUser?.name || 'Unknown'}
                            </Typography>
                        )}
                        <Typography variant="body1">{msg.content}</Typography>
                        <Typography variant="caption" sx={styles.timestamp}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                    </Paper>
                </Box>
            ))}
        </Box>
    );
}
