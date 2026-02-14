import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Container, Paper, Typography, TextField, Button, Box, Link, Alert, InputAdornment, IconButton } from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import AppLogo from '../components/AppLogo';

const styles = {
    container: {
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    paper: {
        p: 4,
        width: '100%'
    },
    logoBox: {
        display: 'flex',
        justifyContent: 'center',
        mb: 1
    },
    alert: {
        mb: 2
    },
    form: {
        mt: 1
    },
    submitButton: {
        mt: 3,
        mb: 2
    }
};

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(email, password);
            navigate('/chat');
        } catch (err) {
            setError('Failed to log in');
        }
    };

    return (
        <Container maxWidth="xs" sx={styles.container}>
            <Paper elevation={3} sx={styles.paper}>
                <Box sx={styles.logoBox}>
                    <AppLogo size={56} />
                </Box>
                <Typography variant="h5" align="center" gutterBottom fontWeight="bold" color="primary">
                    Login
                </Typography>
                {error && <Alert severity="error" sx={styles.alert}>{error}</Alert>}
                <Box component="form" onSubmit={handleSubmit} sx={styles.form}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        label="Email Address"
                        autoComplete="email"
                        autoFocus
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        label="Password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        edge="end"
                                        onClick={() => setShowPassword(s => !s)}
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={styles.submitButton}
                    >
                        Login
                    </Button>
                    <Box display="flex" justifyContent="center">
                        <Link component={RouterLink} to="/signup" variant="body2" color="primary">
                            {"Don't have an account? Sign Up"}
                        </Link>
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
}
