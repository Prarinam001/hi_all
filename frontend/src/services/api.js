import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000',
    withCredentials: true, // Enable cookies for auth
});

// Response interceptor to automatically refresh tokens
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If error is 401 Unauthorized, we haven't retried yet, and we aren't already trying to login/refresh
        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            originalRequest.url !== '/api/account/refresh' &&
            originalRequest.url !== '/api/account/login'
        ) {
            originalRequest._retry = true;
            try {
                // Attempt to refresh token
                await api.post('/api/account/refresh');

                // If refresh is successful, retry the original request
                return api(originalRequest);
            } catch (refreshError) {
                // Refresh failed (e.g. refresh token expired), return the error
                // The frontend will naturally log the user out because the request will fail
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default api;
