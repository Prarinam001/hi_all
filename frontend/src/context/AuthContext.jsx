import { createContext, useState, useEffect, useContext } from 'react';
import api, { setAuthToken } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    // use shared api instance
    if (token) setAuthToken(token);

    useEffect(() => {
        const fetchUser = async () => {
            if (!token) {
                setLoading(false);
                return;
            }
            try {
                    const res = await api.get('/users/me');
                setUser(res.data);
            } catch (error) {
                console.error("Auth check failed", error);
                logout();
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, [token]);

    const login = async (email, password) => {
        const formData = new FormData();
        formData.append('username', email); // OAuth2 expects username
        formData.append('password', password);
        const res = await api.post('/token', formData);
        const newToken = res.data.access_token;
        setToken(newToken);
        localStorage.setItem('token', newToken);
        setAuthToken(newToken);
        
        // Fetch user immediately to ensure it's available before navigation
        try {
            const userRes = await api.get('/users/me', {
                headers: { Authorization: `Bearer ${newToken}` }
            });
            setUser(userRes.data);
        } catch (error) {
            console.error("Failed to fetch user after login", error);
            throw error;
        }
    };

    const signup = async (email, password, fullName, phoneNumber) => {
        await api.post('/signup', { email, password, full_name: fullName, phone_number: phoneNumber });
        await login(email, password);
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
        setAuthToken(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, signup, logout, loading, token, api }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
