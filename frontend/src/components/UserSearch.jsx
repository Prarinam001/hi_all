import { useState, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Box, TextField, IconButton, Typography, Avatar, List, ListItem, ListItemAvatar, ListItemText, CircularProgress, Alert, ToggleButton, ToggleButtonGroup, Button } from '@mui/material';
import { Search, PersonAdd, Email, Phone } from '@mui/icons-material';

const styles = {
    container: {
        p: 2,
        borderBottom: 1,
        borderColor: 'divider'
    },
    searchForm: {
        display: 'flex',
        flexDirection: 'column',
        gap: 1
    },
    toggleGroup: {
        alignSelf: 'center',
        mb: 1
    },
    searchBox: {
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
        borderRadius: 1,
        maxHeight: '400px',
        overflowY: 'auto',
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
    }
};

export default function UserSearch({ onUserSelect }) {
    const [query, setQuery] = useState('');
    const [searchType, setSearchType] = useState('email');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [msg, setMsg] = useState('');
    const [hasMore, setHasMore] = useState(false);
    const [skip, setSkip] = useState(0);
    const LIMIT = 10;
    const { api } = useAuth();

    const observer = useRef();
    const lastUserElementRef = useCallback(node => {
        if (loading || loadingMore) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                fetchUsers(skip, true);
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, loadingMore, hasMore, skip, query, searchType]);

    const handleTypeChange = (event, newType) => {
        if (newType !== null) {
            setSearchType(newType);
            setQuery('');
            setResults([]);
            setMsg('');
            setHasMore(false);
            setSkip(0);
        }
    };

    const fetchUsers = async (currentSkip, isLoadMore = false) => {
        if (!query) return;
        
        if (isLoadMore) setLoadingMore(true);
        else setLoading(true);
        
        setMsg('');
        if (!isLoadMore) setResults([]);

        try {
            const param = searchType === 'email' ? `email=${query}` : `phone_number=${query}`;
            const res = await api.get(`/api/account/search?${param}&skip=${currentSkip}&limit=${LIMIT}`);
            
            const newUsers = res.data;
            if (isLoadMore) {
                setResults(prev => [...prev, ...newUsers]);
            } else {
                setResults(newUsers);
            }
            
            setHasMore(newUsers.length === LIMIT);
            setSkip(currentSkip + LIMIT);
        } catch (err) {
            if (err.response && err.response.status === 404) {
                if (!isLoadMore) setMsg(`No users found for ${query}`);
                setHasMore(false);
            } else {
                setMsg('Error searching users');
            }
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        // Basic validation
        if (searchType === 'phone' && query.includes('@')) {
            setMsg('Please enter a valid phone number (emails are not allowed in phone mode)');
            return;
        }
        if (searchType === 'email' && !query.includes('@')) {
            setMsg('Please enter a valid email address');
            return;
        }
        setSkip(0);
        fetchUsers(0);
    };

    return (
        <Box sx={styles.container}>
            <Box component="form" onSubmit={handleSearch} sx={styles.searchForm}>
                <ToggleButtonGroup
                    value={searchType}
                    exclusive
                    onChange={handleTypeChange}
                    aria-label="search type"
                    size="small"
                    sx={styles.toggleGroup}
                >
                    <ToggleButton value="email" aria-label="email">
                        <Email sx={{ mr: 0.5, fontSize: 18 }} /> Email
                    </ToggleButton>
                    <ToggleButton value="phone" aria-label="phone">
                        <Phone sx={{ mr: 0.5, fontSize: 18 }} /> Phone
                    </ToggleButton>
                </ToggleButtonGroup>
                
                <Box sx={styles.searchBox}>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder={searchType === 'email' ? "Search by email" : "Search by phone number"}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        type={searchType === 'email' ? 'email' : 'tel'}
                        InputProps={{
                            startAdornment: <Search color="action" sx={styles.searchIcon} />,
                        }}
                    />
                </Box>
            </Box>

            {loading && <Box sx={styles.loaderContainer}><CircularProgress size={20} /></Box>}
            {msg && <Alert severity="info" sx={styles.alert}>{msg}</Alert>}
            
            {results.length > 0 && (
                <Box sx={{ mt: 1 }}>
                    <List sx={styles.resultList}>
                        {results.map((user, index) => (
                            <ListItem 
                                ref={results.length === index + 1 ? lastUserElementRef : null}
                                key={user.id} 
                                alignItems="center" 
                                divider
                                sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                                onClick={() => {
                                    onUserSelect({ ...user, full_name: user.name || user.full_name });
                                    setResults([]); // Automatically close results on selection
                                }}
                                secondaryAction={<PersonAdd color="primary" />}
                            >
                                <ListItemAvatar>
                                    <Avatar>{(user.full_name || user.name || '?')[0].toUpperCase()}</Avatar>
                                </ListItemAvatar>
                                <ListItemText 
                                    primary={user.full_name || user.name} 
                                    secondary={`${user.email} • ${user.phone_number}`} 
                                />
                            </ListItem>
                        ))}
                    </List>
                    
                    {loadingMore && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 1 }}>
                            <CircularProgress size={20} />
                        </Box>
                    )}
                </Box>
            )}
        </Box>
    );
}
