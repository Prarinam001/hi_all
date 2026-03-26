import { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            const token = localStorage.getItem('ha_access_token');
            if (!token) {
                setLoading(false);
                return;
            }
            try {
                const res = await api.get('/api/account/profile');
                setUser(res.data);
            } catch (error) {
                console.error("Auth check failed", error);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    const login = async (email, password) => {
        const res = await api.post('/api/account/login', { email, password });
        const { tokens } = res.data;
        
        localStorage.setItem('ha_access_token', tokens.access_token);
        localStorage.setItem('ha_refresh_token', tokens.refresh_token);
        
        // Fetch user immediately to ensure it's available before navigation
        try {
            const userRes = await api.get('/api/account/profile');
            setUser(userRes.data);
        } catch (error) {
            console.error("Failed to fetch user after login", error);
            throw error;
        }
    };

    const signup = async (email, password, fullName, phoneNumber) => {
        await api.post('/api/account/register', { email, password, full_name: fullName, phone_number: phoneNumber });
        await login(email, password);
    };

    const logout = async () => {
        try {
            const refresh_token = localStorage.getItem('ha_refresh_token');
            await api.post('/api/account/logout', { refresh_token });
        } catch (error) {
            console.error("Logout failed", error);
        } finally {
            localStorage.removeItem('ha_access_token');
            localStorage.removeItem('ha_refresh_token');
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, signup, logout, loading, api }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
