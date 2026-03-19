import React, { useState } from 'react';
import { Box, Avatar, Typography, IconButton, Menu, MenuItem, Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button } from '@mui/material';
import { Video, Phone, MoreVertical, Menu as MenuIcon, UserPlus, LogOut } from 'lucide-react';
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

export default function ChatHeader({
    user,
    selectedUser,
    startCall,
    startVoiceCall,
    onLogout,
    copiedEmail,
    onCopy,
    onSidebarToggle,
    onAddMember,
    onLeaveGroup
}) {
    const [anchorEl, setAnchorEl] = useState(null);
    const [addMemberOpen, setAddMemberOpen] = useState(false);
    const [email, setEmail] = useState('');

    const isCreator = selectedUser?.isGroup && user?.id === selectedUser?.created_by;

    const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
    const handleMenuClose = () => setAnchorEl(null);

    const handleAddMember = async () => {
        if (!email) return;
        try {
            await onAddMember(selectedUser.id, email);
            setAddMemberOpen(false);
            setEmail('');
            handleMenuClose();
            alert("Member added successfully");
        } catch (err) {
            alert(err.response?.data?.detail || "Failed to add member");
        }
    };

    return (
        <Box sx={styles.header}>
            <Box sx={styles.userSection}>
                <IconButton onClick={onSidebarToggle} sx={styles.menuButton} aria-label="Open conversations">
                    <MenuIcon />
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
                <IconButton onClick={handleMenuOpen}><MoreVertical /></IconButton>
                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                >
                    {selectedUser?.isGroup && isCreator && (
                        <MenuItem onClick={() => setAddMemberOpen(true)}>
                            <UserPlus size={18} style={{ marginRight: 8 }} /> Add Member
                        </MenuItem>
                    )}
                    {selectedUser?.isGroup && (
                        <MenuItem onClick={() => { handleMenuClose(); onLeaveGroup(selectedUser.id); }} sx={{ color: 'error.main' }}>
                            <LogOut size={18} style={{ marginRight: 8 }} /> {isCreator ? "Delete Group" : "Leave Group"}
                        </MenuItem>
                    )}
                    <MenuItem onClick={onLogout}>Logout</MenuItem>
                </Menu>
            </Box>

            <Dialog open={addMemberOpen} onClose={() => setAddMemberOpen(false)}>
                <DialogTitle>Add Member to Group</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="User Email"
                        type="email"
                        fullWidth
                        variant="outlined"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAddMemberOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddMember} variant="contained">Add</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
