import React from 'react';
import { Box, TextField, IconButton, Popover } from '@mui/material';
import { Send, Smile } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';

export default function MessageInput({ input, setInput, onSend, onEmojiClick, showEmojiPicker, emojiAnchorEl, handleEmojiButtonClick, handleEmojiClose }) {
    return (
        <>
            <Box component="form" onSubmit={onSend} sx={{ height: 64, bgcolor: 'background.paper', display: 'flex', alignItems: 'center', px: 2, gap: 2 }}>
                <TextField
                    fullWidth
                    variant="outlined"
                    size="small"
                    placeholder="Type a message"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    sx={{ bgcolor: 'background.default', borderRadius: 1 }}
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
                <Box sx={{ p: 0 }}>
                    <EmojiPicker onEmojiClick={onEmojiClick} theme="dark" />
                </Box>
            </Popover>
        </>
    );
}
