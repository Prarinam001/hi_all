import React, { useState } from 'react';
import { Box, Avatar, IconButton, List, ListItem, ListItemText, Typography, Button, Divider, ListItemIcon, Collapse, ListItemAvatar } from '@mui/material';
import { LogOut, X, Users, MessageSquare, Plus } from 'lucide-react'; // Added icons
import UserSearch from '../components/UserSearch';
import CreateGroupModal from './CreateGroupModal';
import EmailTooltip from './EmailTooltip';
import AppLogo from './AppLogo';

export default function Sidebar({ user, conversations = [], groups = [], onSelect, onLogout, copiedEmail, onCopy, onClose, onGroupCreated }) {
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [showGroups, setShowGroups] = useState(true);
    const [showDirect, setShowDirect] = useState(true);

    if (!user) return null;

    return (
        <Box sx={{ width: { xs: '100%', md: 320 }, minWidth: { md: 280 }, borderRight: 1, borderColor: 'divider', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ height: 64, bgcolor: 'background.paper', display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2 }}>
                <AppLogo size={40} />

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {onClose && (
                        <IconButton onClick={onClose} sx={{ display: { xs: 'inline-flex', md: 'none' } }} aria-label="Close conversations">
                            <X />
                        </IconButton>
                    )}
                    <EmailTooltip email={user?.email} copiedEmail={copiedEmail} onCopy={onCopy}>
                        <Avatar sx={{ cursor: 'pointer' }}>{user?.email?.[0]?.toUpperCase()}</Avatar>
                    </EmailTooltip>
                    <IconButton onClick={onLogout} title="Logout"><LogOut /></IconButton>
                </Box>
            </Box>

            <UserSearch onUserSelect={onSelect} />

            <Box px={2} py={1}>
                <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Plus size={18} />}
                    onClick={() => setShowCreateGroup(true)}
                    sx={{ textTransform: 'none' }}
                >
                    Create Group
                </Button>
            </Box>

            <List sx={{ flex: 1, overflowY: 'auto', px: 1 }}>
                {/* Groups Section */}
                <ListItem button onClick={() => setShowGroups(!showGroups)}>
                    <ListItemIcon sx={{ minWidth: 32 }}><Users size={18} /></ListItemIcon>
                    <ListItemText primary="Groups" />
                </ListItem>
                <Collapse in={showGroups} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                        {groups && groups.length > 0 ? (
                            groups.map(group => (
                                <ListItem key={group.id} button sx={{ pl: 4 }} onClick={() => onSelect({ ...group, isGroup: true })}>
                                    <ListItemAvatar>
                                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>{group.name[0]?.toUpperCase()}</Avatar>
                                    </ListItemAvatar>
                                    <ListItemText primary={group.name} secondary={`${group.members ? group.members.length : ''} members`} />
                                </ListItem>
                            ))
                        ) : (
                            <ListItem sx={{ pl: 4 }}>
                                <ListItemText secondary="No groups yet" />
                            </ListItem>
                        )}
                    </List>
                </Collapse>

                <Divider sx={{ my: 1 }} />

                {/* Direct Messages Section */}
                <ListItem button onClick={() => setShowDirect(!showDirect)}>
                    <ListItemIcon sx={{ minWidth: 32 }}><MessageSquare size={18} /></ListItemIcon>
                    <ListItemText primary="Direct Messages" />
                </ListItem>
                <Collapse in={showDirect} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                        {conversations.length > 0 ? (
                            conversations.map(conv => (
                                <ListItem key={conv.other_user_id} button divider sx={{ pl: 4 }} onClick={() => onSelect({ id: conv.other_user_id, full_name: conv.other_user_name || conv.name, email: conv.other_user_email, isGroup: false })}>
                                    <ListItemText primary={conv.other_user_name || conv.name || `User ${conv.other_user_id}`} secondary={conv.last_message || 'No messages'} secondaryTypographyProps={{ noWrap: true }} />
                                </ListItem>
                            ))
                        ) : (
                            <ListItem sx={{ pl: 4 }}>
                                <ListItemText primary="No conversations yet" secondary="Start a new chat!" />
                            </ListItem>
                        )}
                    </List>
                </Collapse>
            </List>

            <CreateGroupModal
                open={showCreateGroup}
                onClose={() => setShowCreateGroup(false)}
                onGroupCreated={onGroupCreated}
            />
        </Box>
    );
}
