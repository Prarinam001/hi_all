import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Chat from './pages/Chat';
import Home from './pages/Home';
import { ThemeProvider, createTheme, CssBaseline, Box, CircularProgress } from '@mui/material';
import HeaderBar from './components/HeaderBar';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#0eaa88ff', // WhatsApp Green
    },
    secondary: {
      main: '#0ca02aff',
    },
    background: {
      default: '#111b21',
      paper: '#202c33',
    },
    text: {
      primary: '#e9edef',
      secondary: '#8696a0',
    },
  },
});

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <CircularProgress />
    </Box>
  );
  if (!user) return <Navigate to="/login" />;
  return children;
};

const AuthRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <CircularProgress />
    </Box>
  );
  if (user) return <Navigate to="/chat" replace />;
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={
        <AuthRoute>
          <Login />
        </AuthRoute>
      } />
      <Route path="/signup" element={
        <AuthRoute>
          <Signup />
        </AuthRoute>
      } />
      <Route path="/chat" element={
        <ProtectedRoute>
          <Chat />
        </ProtectedRoute>
      } />

    </Routes>
  );
}

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <CircularProgress />
    </Box>
  );
  return user ? <Navigate to="/chat" replace /> : <Home />;
}

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <HeaderBar />
          <AppRoutes />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
