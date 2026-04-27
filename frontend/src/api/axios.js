import axios from 'axios';
import { showToast } from '../components/NotificationToast';

// ══════════════════════════════════════════════════════
// API Client — Real Backend (Django REST Framework)
// Base URL points to Django via Vite proxy
// ══════════════════════════════════════════════════════

const API_URL = '/api/';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// ── Request Interceptor: Attach JWT Token ───────────────────
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => Promise.reject(error));

// ── Response Interceptor: Auto-refresh expired tokens + Error toasts ───────
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const statusCode = error.response?.status;

        // If 401 and we haven't retried yet
        if (statusCode === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (refreshToken) {
                    const res = await axios.post(`${API_URL}accounts/token/refresh/`, {
                        refresh: refreshToken
                    });

                    if (res.data && res.data.access) {
                        localStorage.setItem('accessToken', res.data.access);
                        localStorage.setItem('token', res.data.access);

                        // If server rotates refresh tokens
                        if (res.data.refresh) {
                            localStorage.setItem('refreshToken', res.data.refresh);
                        }

                        originalRequest.headers['Authorization'] = `Bearer ${res.data.access}`;
                        return api(originalRequest);
                    }
                }
            } catch (refreshError) {
                console.error('Token refresh failed:', refreshError);
                // Clear everything and redirect to login
                localStorage.removeItem('token');
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('role');
                localStorage.removeItem('username');
                localStorage.removeItem('name');
                window.location.href = '/login';
            }
        }

        // Show toast for server errors (4xx and 5xx) — skip 401 (handled above)
        if (statusCode && statusCode !== 401) {
            const errorMsg = error.response?.data?.error
                || error.response?.data?.detail
                || error.response?.data?.message
                || (typeof error.response?.data === 'string' ? error.response.data : null)
                || `Request failed (${statusCode})`;

            // Only show toast for non-silent errors (skip if caller handles it)
            if (!originalRequest._silentError) {
                showToast.error(`[${statusCode}] ${errorMsg}`);
            }
        }

        return Promise.reject(error);
    }
);

export default api;

