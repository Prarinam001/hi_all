import React, { useState } from 'react';
import { Box, Avatar, IconButton, List, ListItem, ListItemText, Typography, Button, Divider, ListItemIcon, Collapse, ListItemAvatar, Badge } from '@mui/material';
import { LogOut, X, Users, MessageSquare, Plus } from 'lucide-react'; // Added icons
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

export default function Sidebar({ user, conversations = [], groups = [], unreads = {}, onSelect, onLogout, copiedEmail, onCopy, onClose, onGroupCreated }) {
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [showGroups, setShowGroups] = useState(true);
    const [showDirect, setShowDirect] = useState(true);

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
                                <ListItem key={conv.other_user_id} button divider sx={{ pl: 4 }} onClick={() => onSelect({ id: conv.other_user_id, full_name: conv.other_user_name || conv.name, email: conv.other_user_email, isGroup: false })}>
                                    <Badge color="error" variant="dot" invisible={!unreads[conv.other_user_id]} sx={{ width: '100%', '& .MuiBadge-badge': { right: 10, top: 20 } }}>
                                        <ListItemText primary={conv.other_user_name || conv.name || `User ${conv.other_user_id}`} secondary={conv.last_message || 'No messages'} secondaryTypographyProps={{ noWrap: true }} />
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
        </Box>
    );
}
