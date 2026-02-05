import React from 'react';
import { Box, Avatar, IconButton, List, ListItem, ListItemText, Typography } from '@mui/material';
import { LogOut, X } from 'lucide-react';
import UserSearch from '../components/UserSearch';
import EmailTooltip from './EmailTooltip';
import AppLogo from './AppLogo';

export default function Sidebar({ user, conversations, onSelect, onLogout, copiedEmail, onCopy, onClose }) {
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

            <List sx={{ flex: 1, overflowY: 'auto', px: 1 }}>
                {conversations.length > 0 ? (
                    conversations.map(conv => (
                        <ListItem key={conv.other_user_id} button divider onClick={() => onSelect({ id: conv.other_user_id, full_name: conv.other_user_name, email: conv.other_user_email })}>
                            <ListItemText primary={conv.other_user_name || `User ${conv.other_user_id}`} secondary={conv.last_message || 'No messages'} secondaryTypographyProps={{ noWrap: true }} />
                        </ListItem>
                    ))
                ) : (
                    <ListItem>
                        <ListItemText primary="No conversations yet" secondary="Start a new chat!" />
                    </ListItem>
                )}
            </List>
        </Box>
    );
}
