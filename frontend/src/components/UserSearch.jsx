import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Box, TextField, IconButton, Typography, Avatar, List, ListItem, ListItemAvatar, ListItemText, CircularProgress, Alert } from '@mui/material';
import { Search, PersonAdd } from '@mui/icons-material';

export default function UserSearch({ onUserSelect }) {
    const [email, setEmail] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');
    const { api } = useAuth();

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!email) return;
        setLoading(true);
        setMsg('');
        setResult(null);
        try {
            const res = await api.get(`/users/search?email=${email}`);
            setResult(res.data);
        } catch (err) {
            if (err.response && err.response.status === 404) {
                setMsg(`User not found. Invite sent to ${email}`);
            } else {
                setMsg('Error searching user');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', alignItems: 'center' }}>
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Search by email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    InputProps={{
                        startAdornment: <Search color="action" sx={{ mr: 1 }} />,
                    }}
                />
            </Box>
            {loading && <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}><CircularProgress size={20} /></Box>}
            {msg && <Alert severity="info" sx={{ mt: 1, py: 0 }}>{msg}</Alert>}
            {result && (
                <List sx={{ mt: 1, cursor: 'pointer', bgcolor: 'background.paper', borderRadius: 1 }} onClick={() => onUserSelect(result)}>
                    <ListItem alignItems="center" secondaryAction={<PersonAdd color="primary" />}>
                        <ListItemAvatar>
                            <Avatar>{result.full_name[0].toUpperCase()}</Avatar>
                        </ListItemAvatar>
                        <ListItemText primary={result.full_name} secondary={result.email} />
                    </ListItem>
                </List>
            )}
        </Box>
    );
}
