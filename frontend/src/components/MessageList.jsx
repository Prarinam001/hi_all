import React from 'react';
import { Box, Paper, Typography, Avatar, IconButton } from '@mui/material';
import { Reply } from 'lucide-react';

const styles = {
    container: {
        flex: 1,
        overflowY: 'auto',
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 1
    },
    messageRow: {
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        maxWidth: '100%',
        '&:hover .reply-btn': {
            opacity: 1
        }
    },
    replyBtn: (isMine) => ({
        opacity: 0,
        transition: 'opacity 0.2s',
        order: isMine ? -1 : 1
    }),
    messageWrapper: (isMine) => ({
        display: 'flex',
        justifyContent: isMine ? 'flex-end' : 'flex-start',
        width: '100%'
    }),
    messagePaper: (isMine) => ({
        p: 1,
        px: 2,
        maxWidth: '60%',
        bgcolor: isMine ? 'primary.dark' : 'background.paper',
        borderRadius: 2
    }),
    replyBox: {
        bgcolor: 'rgba(0, 0, 0, 0.1)',
        borderLeft: '4px solid',
        borderColor: 'primary.main',
        p: 1,
        mb: 1,
        borderRadius: 1,
        fontSize: '0.85rem'
    },
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

export default function MessageList({ messages = [], selectedUser, onReplyClick }) {
    return (
        <Box sx={styles.container}>
            {messages.map((msg, i) => {
                const hasInlineReply = !!msg.reply_to_content;
                let repliedMsg = null;
                if (hasInlineReply) {
                    repliedMsg = {
                        content: msg.reply_to_content,
                        sender_name: msg.reply_to_sender,
                        isMine: false
                    };
                } else if (msg.reply_to_id) {
                    repliedMsg = messages.find(m => m.id === msg.reply_to_id);
                }
                return (
                    <Box key={i} sx={{
                        display: 'flex',
                        width: '100%',
                        justifyContent: msg.isMine ? 'flex-end' : 'flex-start',
                        mb: 1
                    }}>
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center', // Vertically center reply button
                            gap: 1,
                            maxWidth: '85%',
                            '&:hover .reply-btn': { opacity: 1 }
                        }}>
                            {/* Render reply button explicitly on the left for sender messages */}
                            {msg.isMine && (
                                <IconButton 
                                    className="reply-btn" 
                                    size="small" 
                                    sx={{ opacity: 0, transition: '0.2s', flexShrink: 0 }}
                                    onClick={() => onReplyClick(msg)}
                                >
                                    <Reply size={16} />
                                </IconButton>
                            )}

                            <Paper sx={{
                                p: 1, px: 2,
                                bgcolor: msg.isMine ? 'primary.dark' : 'background.paper',
                                borderRadius: 2,
                                wordBreak: 'break-word',
                                maxWidth: '100%'
                            }}>
                                {repliedMsg && (
                                    <Box sx={styles.replyBox}>
                                        <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                            {hasInlineReply ? repliedMsg.sender_name : (repliedMsg.isMine ? 'You' : (repliedMsg.sender_name || 'Unknown'))}
                                        </Typography>
                                        <Typography variant="body2" sx={{ opacity: 0.8, fontSize: '0.8rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {repliedMsg.content}
                                        </Typography>
                                    </Box>
                                )}
                                {!msg.isMine && (
                                    <Typography variant="caption" sx={styles.senderName}>
                                        {msg.sender_name || selectedUser?.full_name || selectedUser?.name || 'Unknown'}
                                    </Typography>
                                )}
                                <Typography variant="body1">{msg.content}</Typography>
                                <Typography variant="caption" sx={styles.timestamp}>
                                    {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                </Typography>
                            </Paper>

                            {/* Render reply button explicitly on the right for receiver messages */}
                            {!msg.isMine && (
                                <IconButton 
                                    className="reply-btn" 
                                    size="small" 
                                    sx={{ opacity: 0, transition: '0.2s', flexShrink: 0 }}
                                    onClick={() => onReplyClick(msg)}
                                >
                                    <Reply size={16} />
                                </IconButton>
                            )}
                        </Box>
                    </Box>
                );
            })}
        </Box>
    );
}
