import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Box, TextField, IconButton, Typography, Avatar, List, ListItem, ListItemAvatar, ListItemText, CircularProgress, Alert } from '@mui/material';
import { Search, PersonAdd } from '@mui/icons-material';

const styles = {
    container: {
        p: 2,
        borderBottom: 1,
        borderColor: 'divider'
    },
    searchForm: {
        display: 'flex',
        alignItems: 'center'
    },
    searchIcon: {
        mr: 1
    },
    loaderContainer: {
        display: 'flex',
        justifyContent: 'center',
        mt: 1
    },
    alert: {
        mt: 1,
        py: 0
    },
    resultList: {
        mt: 1,
        cursor: 'pointer',
        bgcolor: 'background.paper',
        borderRadius: 1
    }
};

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
            const res = await api.get(`/api/account/search?email=${email}`);
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
        <Box sx={styles.container}>
            <Box component="form" onSubmit={handleSearch} sx={styles.searchForm}>
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Search by email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    InputProps={{
                        startAdornment: <Search color="action" sx={styles.searchIcon} />,
                    }}
                />
            </Box>
            {loading && <Box sx={styles.loaderContainer}><CircularProgress size={20} /></Box>}
            {msg && <Alert severity="info" sx={styles.alert}>{msg}</Alert>}
            {result && (
                <List sx={styles.resultList} onClick={() => onUserSelect({ ...result, full_name: result.name || result.full_name })}>
                    <ListItem alignItems="center" secondaryAction={<PersonAdd color="primary" />}>
                        <ListItemAvatar>
                            <Avatar>{(result.full_name || result.name || '?')[0].toUpperCase()}</Avatar>
                        </ListItemAvatar>
                        <ListItemText primary={result.full_name || result.name} secondary={result.email} />
                    </ListItem>
                </List>
            )}
        </Box>
    );
}
