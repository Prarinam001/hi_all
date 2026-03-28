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
        px: 1,
        '&::-webkit-scrollbar': {
            width: '6px'
        },
        '&::-webkit-scrollbar-track': {
            backgroundColor: 'transparent'
        },
        '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#90ee90', // Light green
            borderRadius: '10px',
            border: '2px solid transparent',
            backgroundClip: 'content-box'
        },
        '&::-webkit-scrollbar-thumb:hover': {
            backgroundColor: '#7cfc00' // slightly darker on hover
        }
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

export default function Sidebar({ user, conversations = [], groups = [], unreads = {}, userStatuses = {}, onSelect, onLogout, copiedEmail, onCopy, onClose, onGroupCreated, onDeleteConversation }) {
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
                                    <ListItemAvatar sx={{ position: 'relative' }}>
                                        <Badge
                                            overlap="circular"
                                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                            variant="dot"
                                            sx={{
                                                '& .MuiBadge-badge': {
                                                    backgroundColor: '#44b700',
                                                    color: '#44b700',
                                                    boxShadow: `0 0 0 2px ${styles.sidebarContainer.bgcolor || '#111b21'}`,
                                                    '&::after': {
                                                        position: 'absolute',
                                                        top: 0,
                                                        left: 0,
                                                        width: '100%',
                                                        height: '100%',
                                                        borderRadius: '50%',
                                                        animation: 'ripple 1.2s infinite ease-in-out',
                                                        border: '1px solid currentColor',
                                                        content: '""',
                                                    },
                                                },
                                                '@keyframes ripple': {
                                                    '0%': { transform: 'scale(.8)', opacity: 1 },
                                                    '100%': { transform: 'scale(2.4)', opacity: 0 },
                                                },
                                            }}
                                            invisible={!userStatuses[conv.other_user_id]?.is_online}
                                        >
                                            <Avatar>{(conv.other_user_name || conv.name || '?')[0].toUpperCase()}</Avatar>
                                        </Badge>
                                    </ListItemAvatar>
                                    <Badge color="error" variant="dot" invisible={!unreads[conv.other_user_id]} sx={{ width: '100%', '& .MuiBadge-badge': { right: 10, top: 10 } }}>
                                        <ListItemText 
                                            primary={conv.other_user_name || conv.name || `User ${conv.other_user_id}`} 
                                            secondary={
                                                <Box component="span" sx={{ display: 'flex', flexDirection: 'column', mt: 0.5 }}>
                                                    <Typography component="span" variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', opacity: 0.9 }}>
                                                        {conv.other_user_email}
                                                    </Typography>
                                                    {conv.other_user_phone_number && (
                                                        <Typography component="span" variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', mt: 0.25 }}>
                                                            {conv.other_user_phone_number}
                                                        </Typography>
                                                    )}
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
