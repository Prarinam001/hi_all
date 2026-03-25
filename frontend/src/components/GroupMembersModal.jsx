import React from 'react';
import { Dialog, DialogTitle, DialogContent, List, ListItem, ListItemAvatar, Avatar, ListItemText, Typography, IconButton, Button, DialogActions } from '@mui/material';
import { UserMinus } from 'lucide-react';

export default function GroupMembersModal({ open, onClose, group, user, onRemoveMember }) {
    if (!group || !group.isGroup) return null;

    const isCreator = group.created_by === user?.id;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>Group Members</DialogTitle>
            <DialogContent dividers>
                <List>
                    {group.members?.map(member => {
                        const memberUser = member.user;
                        if (!memberUser) return null; // Fallback
                        
                        return (
                            <ListItem
                                key={memberUser.id}
                                secondaryAction={
                                    isCreator && memberUser.id !== user?.id && (
                                        <IconButton edge="end" color="error" onClick={() => onRemoveMember(group.id, memberUser.id)} title="Remove Member">
                                            <UserMinus size={18} />
                                        </IconButton>
                                    )
                                }
                            >
                                <ListItemAvatar>
                                    <Avatar>{memberUser.name?.[0]?.toUpperCase()}</Avatar>
                                </ListItemAvatar>
                                <ListItemText 
                                    primary={
                                        <Typography variant="body1">
                                            {memberUser.name} {memberUser.id === group.created_by ? '(Admin)' : ''}
                                        </Typography>
                                    }
                                    secondary={memberUser.email}
                                />
                            </ListItem>
                        );
                    })}
                </List>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
}
