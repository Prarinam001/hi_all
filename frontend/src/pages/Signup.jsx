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
        justifyContent: 'center',
        background: 'radial-gradient(circle at 15% 50%, rgba(14, 170, 136, 0.1), transparent 25%), radial-gradient(circle at 85% 30%, rgba(12, 160, 42, 0.15), transparent 25%)',
        bgcolor: 'background.default',
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

export default function Signup() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [fullName, setFullName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const { signup } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await signup(email, password, fullName, phoneNumber);
            navigate('/chat');
        } catch (err) {
            setError('Failed to create account');
        }
    };

    return (
        <Container maxWidth="xs" sx={styles.container}>
            <Paper elevation={3} sx={styles.paper}>
                <Box sx={styles.logoBox}>
                    <AppLogo size={56} />
                </Box>
                <Typography variant="h5" align="center" gutterBottom fontWeight="bold" color="primary">
                    Sign Up
                </Typography>
                {error && <Alert severity="error" sx={styles.alert}>{error}</Alert>}
                <Box component="form" onSubmit={handleSubmit} sx={styles.form}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        label="Full Name"
                        autoFocus
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        label="Email Address"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <TextField
                        margin="normal"
                        fullWidth
                        label="Phone Number (Optional)"
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        label="Password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
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
                        Sign Up
                    </Button>
                    <Box display="flex" justifyContent="center">
                        <Link component={RouterLink} to="/login" variant="body2" color="primary">
                            Already have an account? Login
                        </Link>
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
}
