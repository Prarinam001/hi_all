import React, { useState } from 'react';
import { Box, Avatar, IconButton, List, ListItem, ListItemText, Typography, Button, Divider, ListItemIcon, Collapse, ListItemAvatar, Badge, Menu, MenuItem } from '@mui/material';
import { LogOut, X, Users, MessageSquare, Plus, MoreVertical } from 'lucide-react'; // Added icons
import UserSearch from '../components/UserSearch';
import CreateGroupModal from './CreateGroupModal';
import EmailTooltip from './EmailTooltip';
import AppLogo from './AppLogo';

const styles = {
    sidebarContainer: {
        width: { xs: '100%', md: 320 },
        minWidth: { md: 280 },
        borderRight: 1,
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column'
    },
    header: {
        height: 64,
        bgcolor: 'background.paper',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2
    },
    headerActions: {
        display: 'flex',
        alignItems: 'center',
        gap: 1
    },
    closeButton: {
        display: { xs: 'inline-flex', md: 'none' }
    },
    avatar: {
        cursor: 'pointer'
    },
    createGroupButton: {
        textTransform: 'none'
    },
    list: {
        flex: 1,
        overflowY: 'auto',
        px: 1
    },
    listItemIcon: {
        minWidth: 32
    },
    groupAvatar: {
        width: 32,
        height: 32,
        bgcolor: 'secondary.main'
    }
};

export default function Sidebar({ user, conversations = [], groups = [], unreads = {}, onSelect, onLogout, copiedEmail, onCopy, onClose, onGroupCreated, onDeleteConversation }) {
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [showGroups, setShowGroups] = useState(true);
    const [showDirect, setShowDirect] = useState(true);

    const [convOptionsAnchor, setConvOptionsAnchor] = useState(null);
    const [selectedConv, setSelectedConv] = useState(null);

    const handleMenuOpen = (e, conv) => {
        e.stopPropagation();
        setConvOptionsAnchor(e.currentTarget);
        setSelectedConv(conv);
    }
    const handleMenuClose = (e) => {
        if (e) e.stopPropagation();
        setConvOptionsAnchor(null);
        setSelectedConv(null);
    }
    const handleDelete = (e) => {
        e.stopPropagation();
        if (selectedConv && onDeleteConversation) {
            onDeleteConversation(selectedConv.id, selectedConv.other_user_id);
        }
        handleMenuClose();
    }

    if (!user) return null;

    return (
        <Box sx={styles.sidebarContainer}>
            <Box sx={styles.header}>
                <AppLogo size={40} />

                <Box sx={styles.headerActions}>
                    {onClose && (
                        <IconButton onClick={onClose} sx={styles.closeButton} aria-label="Close conversations">
                            <X />
                        </IconButton>
                    )}
                    <EmailTooltip email={user?.email} copiedEmail={copiedEmail} onCopy={onCopy}>
                        <Avatar sx={styles.avatar}>{user?.email?.[0]?.toUpperCase()}</Avatar>
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
                    sx={styles.createGroupButton}
                >
                    Create Group
                </Button>
            </Box>

            <List sx={styles.list}>
                {/* Groups Section */}
                <ListItem button onClick={() => setShowGroups(!showGroups)}>
                    <ListItemIcon sx={styles.listItemIcon}><Users size={18} /></ListItemIcon>
                    <ListItemText primary="Groups" />
                </ListItem>
                <Collapse in={showGroups} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                        {groups && groups.length > 0 ? (
                            groups.map(group => (
                                <ListItem key={group.id} button sx={{ pl: 4 }} onClick={() => onSelect({ ...group, isGroup: true })}>
                                    <ListItemAvatar>
                                        <Badge color="error" variant="dot" invisible={!unreads[`group_${group.id}`]}>
                                            <Avatar sx={styles.groupAvatar}>{group.name[0]?.toUpperCase()}</Avatar>
                                        </Badge>
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
                    <ListItemIcon sx={styles.listItemIcon}><MessageSquare size={18} /></ListItemIcon>
                    <ListItemText primary="Direct Messages" />
                </ListItem>
                <Collapse in={showDirect} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                        {conversations.length > 0 ? (
                            conversations.map(conv => (
                                <ListItem 
                                    key={conv.other_user_id} 
                                    button 
                                    divider 
                                    sx={{ pl: 4, pr: 7, "&:hover .conv-options": { opacity: 1 } }} 
                                    onClick={() => onSelect({ id: conv.other_user_id, full_name: conv.other_user_name || conv.name, email: conv.other_user_email, isGroup: false })}
                                    secondaryAction={
                                        <IconButton
                                            edge="end"
                                            className="conv-options"
                                            onClick={(e) => handleMenuOpen(e, conv)}
                                        >
                                            <MoreVertical size={18} />
                                        </IconButton>
                                    }
                                >
                                    <Badge color="error" variant="dot" invisible={!unreads[conv.other_user_id]} sx={{ width: '100%', '& .MuiBadge-badge': { right: 10, top: 20 } }}>
                                        <ListItemText 
                                            primary={conv.other_user_name || conv.name || `User ${conv.other_user_id}`} 
                                            secondary={
                                                <Box component="span" sx={{ display: 'flex', flexDirection: 'column', mt: 0.5 }}>
                                                    <Typography component="span" variant="body2" color="text.secondary">
                                                        {conv.other_user_email || 'No email'}
                                                    </Typography>
                                                    <Typography component="span" variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', mt: 0.25 }}>
                                                        {conv.other_user_phone_number || 'No phone number'}
                                                    </Typography>
                                                </Box>
                                            } 
                                            secondaryTypographyProps={{ component: 'div' }} 
                                        />
                                    </Badge>
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

            <Menu
                anchorEl={convOptionsAnchor}
                open={Boolean(convOptionsAnchor)}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>Delete Chat</MenuItem>
            </Menu>
        </Box>
    );
}
