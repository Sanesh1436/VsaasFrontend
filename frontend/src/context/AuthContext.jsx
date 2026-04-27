import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { showToast } from '../components/NotificationToast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTicketsCount, setActiveTicketsCount] = useState(0);

    // ── Fetch active ticket count (for logout restriction) ──
    const fetchActiveCount = useCallback(async () => {
        try {
            const res = await api.get('tickets/?active=true');
            if (Array.isArray(res.data)) {
                const myTickets = res.data.filter(t =>
                    t.assigned_to === user?.user_id && t.status !== 'RESOLVED'
                );
                setActiveTicketsCount(myTickets.length);
            }
        } catch (err) {
            console.error('Failed to fetch active ticket count:', err);
        }
    }, [user]);

    // ── Restore session from localStorage on mount ──────────
    useEffect(() => {
        const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
        const role = localStorage.getItem('role');
        const username = localStorage.getItem('username');
        const name = localStorage.getItem('name');
        const userId = localStorage.getItem('userId');

        if (token && role) {
            setUser({ token, role, username, name, user_id: userId ? parseInt(userId) : null });
        }
        setLoading(false);
    }, []);

    // ── Login ───────────────────────────────────────────────
    const login = async (username, password) => {
        const response = await api.post('accounts/login/', { username, password });
        const data = response.data;

        // Store tokens securely
        localStorage.setItem('token', data.token || data.access_token);
        localStorage.setItem('accessToken', data.access_token || data.token);
        if (data.refresh_token) {
            localStorage.setItem('refreshToken', data.refresh_token);
        }

        // Store user info
        localStorage.setItem('role', data.role);
        localStorage.setItem('username', data.username || username);
        localStorage.setItem('name', data.name || username);
        localStorage.setItem('userId', data.user_id);

        const userData = {
            token: data.token || data.access_token,
            role: data.role,
            username: data.username || username,
            name: data.name || username,
            user_id: data.user_id,
        };

        setUser(userData);
        return data;
    };

    // ── Signup ──────────────────────────────────────────────
    const signup = async (formData) => {
        const response = await api.post('accounts/register/', formData);
        return response.data;
    };

    // ── Logout ──────────────────────────────────────────────
    const logout = async () => {
        // Call backend logout — server checks for active tickets
        try {
            await api.post('accounts/logout/');
        } catch (err) {
            if (err.response?.status === 403) {
                const msg = err.response?.data?.error || 'Cannot sign out with active tickets';
                showToast.error(msg);
                throw new Error(msg);
            }
            // If backend is down, still allow logout for team leads
            if (user?.role === 'TEAM_LEAD') {
                // Allow team leads to logout even if backend fails
            } else {
                // For agents, try client-side check as fallback
                try {
                    const res = await api.get('tickets/?active=true');
                    if (Array.isArray(res.data)) {
                        const myTickets = res.data.filter(t =>
                            t.assigned_to === user.user_id && !['RESOLVED'].includes(t.status)
                        );
                        if (myTickets.length > 0) {
                            const msg = `Cannot sign out: You have ${myTickets.length} active ticket(s). Resolve all tickets before logging out.`;
                            showToast.error(msg);
                            throw new Error(msg);
                        }
                    }
                } catch (innerErr) {
                    if (innerErr.message && innerErr.message.includes('Cannot sign out')) {
                        throw innerErr;
                    }
                    // If all checks fail, allow logout
                }
            }
        }

        showToast.success('Logged out successfully');

        localStorage.removeItem('token');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('role');
        localStorage.removeItem('username');
        localStorage.removeItem('name');
        localStorage.removeItem('userId');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, signup, logout, loading, activeTicketsCount, fetchActiveCount }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
