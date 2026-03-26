import axios from 'axios';

const backendBaseUrl = import.meta.env.VITE_BACKEND_BASE_URL;

const api = axios.create({
    baseURL: backendBaseUrl,
});

// Request interceptor to attach the access token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('ha_access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor to automatically refresh tokens
api.interceptors.response.use(
    (response) => {
        if (response.headers['content-type'] && response.headers['content-type'].includes('text/html')) {
            return Promise.reject(new Error("API returned HTML instead of JSON."));
        }
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !originalRequest.url?.includes('/api/account/refresh') &&
            !originalRequest.url?.includes('/api/account/login')
        ) {
            originalRequest._retry = true;
            try {
                const refresh_token = localStorage.getItem('ha_refresh_token');
                const res = await api.post('/api/account/refresh', { refresh_token });
                const { tokens } = res.data;
                
                localStorage.setItem('ha_access_token', tokens.access_token);
                // localStorage.setItem('ha_refresh_token', tokens.refresh_token); // Update if server rotates it
                
                return api(originalRequest);
            } catch (refreshError) {
                // If refresh fails, logout
                localStorage.removeItem('ha_access_token');
                localStorage.removeItem('ha_refresh_token');
                if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/signup')) {
                    window.location.href = '/login';
                }
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default api;
