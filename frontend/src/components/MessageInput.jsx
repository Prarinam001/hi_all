import React from 'react';
import { Box, TextField, IconButton, Popover, Typography } from '@mui/material';
import { Send, Smile, X } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';

const styles = {
    inputContainer: {
        height: 64,
        bgcolor: 'background.paper',
        display: 'flex',
        alignItems: 'center',
        px: 2,
        gap: 2
    },
    textField: {
        bgcolor: 'background.default',
        borderRadius: 1
    },
    popoverContent: {
        p: 0
    }
};

export default function MessageInput({ input, setInput, replyTo, onCancelReply, onSend, onEmojiClick, showEmojiPicker, emojiAnchorEl, handleEmojiButtonClick, handleEmojiClose }) {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
            {replyTo && (
                <Box sx={{ 
                    px: 2, 
                    py: 1, 
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <Box sx={{ borderLeft: '4px solid', borderColor: 'primary.main', pl: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                            Replying to {replyTo.isMine ? 'Yourself' : (replyTo.sender_name || 'Unknown')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 300 }}>
                            {replyTo.content}
                        </Typography>
                    </Box>
                    <IconButton size="small" onClick={onCancelReply}><X size={16} /></IconButton>
                </Box>
            )}
            <Box component="form" onSubmit={onSend} sx={styles.inputContainer}>
                <TextField
                    fullWidth
                    variant="outlined"
                    size="small"
                    placeholder="Type a message"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    sx={styles.textField}
                />
                <IconButton type="button" onClick={handleEmojiButtonClick} title="Add emoji"><Smile size={20} /></IconButton>
                <IconButton type="submit" color="primary"><Send /></IconButton>
            </Box>

            <Popover
                open={showEmojiPicker}
                anchorEl={emojiAnchorEl}
                onClose={handleEmojiClose}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Box sx={styles.popoverContent}>
                    <EmojiPicker onEmojiClick={onEmojiClick} theme="dark" />
                </Box>
            </Popover>
        </Box>
    );
}
