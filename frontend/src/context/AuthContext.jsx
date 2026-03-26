import { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await api.get('/api/account/profile', { withCredentials: true });
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
        const res = await api.post('/api/account/login', { email, password }, { withCredentials: true });
        
        // Fetch user immediately to ensure it's available before navigation
        try {
            const userRes = await api.get('/api/account/profile', { withCredentials: true });
            setUser(userRes.data);
        } catch (error) {
            console.error("Failed to fetch user after login", error);
            throw error;
        }
    };

    const signup = async (email, password, fullName, phoneNumber) => {
        await api.post('/api/account/register', { email, password, full_name: fullName, phone_number: phoneNumber }, { withCredentials: true });
        await login(email, password);
    };

    const logout = async () => {
        try {
            await api.post('/api/account/logout', {}, { withCredentials: true });
        } catch (error) {
            console.error("Logout failed", error);
        } finally {
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, signup, logout, loading, api }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
