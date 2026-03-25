import axios from 'axios';

const backendBaseUrl = import.meta.env.VITE_BACKEND_BASE_URL;

const api = axios.create({
    baseURL: backendBaseUrl,
    //baseURL: 'http://localhost:8000',
    withCredentials: true, // Enable cookies for auth
});

// Response interceptor to automatically refresh tokens and protect against SPA routing traps
api.interceptors.response.use(
    (response) => {
        // Protect against accidental Cloudflare Page SPA catch-all returns (HTML instead of JSON API responses)
        if (response.headers['content-type'] && response.headers['content-type'].includes('text/html')) {
            return Promise.reject(new Error("API returned HTML instead of JSON. Your VITE_BACKEND_BASE_URL is likely missing or misconfigured in Cloudflare."));
        }
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // If error is 401 Unauthorized, we haven't retried yet, and we aren't already trying to login/refresh
        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            // avoid refreshing if the request is already a refresh/login req
            // check for both with and without trailing slash or baseurl
            !originalRequest.url?.includes('/api/account/refresh') &&
            !originalRequest.url?.includes('/api/account/login')
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
