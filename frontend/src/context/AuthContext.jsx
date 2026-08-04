import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Warm-up: ping the backend to wake it from Render cold start
// Returns a promise that resolves when the backend is alive
const warmUpBackend = async (maxRetries = 3) => {
    for (let i = 0; i < maxRetries; i++) {
        try {
            await axios.get(`${API_URL.replace(/\/api$/, '')}/`, { timeout: 10000 });
            return true; // Backend is awake
        } catch (err) {
            // If it's a timeout or network error, the server is still waking up
            if (i < maxRetries - 1) {
                await new Promise(r => setTimeout(r, 2000)); // Wait 2s before retry
            }
        }
    }
    return false; // Backend didn't respond after retries
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('irrigplus_token'));
    const [loading, setLoading] = useState(true);
    const [coldStart, setColdStart] = useState(false);
    const coldStartTimer = useRef(null);

    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            // Show cold-start message if auth takes more than 3 seconds
            coldStartTimer.current = setTimeout(() => {
                setColdStart(true);
            }, 3000);

            const fetchUser = async () => {
                try {
                    // First, try the /auth/me call directly with a generous timeout
                    const res = await axios.get(`${API_URL}/auth/me`, { timeout: 15000 });
                    setUser(res.data);
                } catch (err) {
                    // If it timed out or network error, try warming up the backend first
                    if (err.code === 'ECONNABORTED' || !err.response) {
                        setColdStart(true);
                        const isAwake = await warmUpBackend();
                        if (isAwake) {
                            try {
                                const retryRes = await axios.get(`${API_URL}/auth/me`, { timeout: 10000 });
                                setUser(retryRes.data);
                            } catch {
                                logout();
                            }
                        } else {
                            logout();
                        }
                    } else {
                        // 401, 403, etc. — invalid token
                        logout();
                    }
                } finally {
                    clearTimeout(coldStartTimer.current);
                    setColdStart(false);
                    setLoading(false);
                }
            };

            fetchUser();
        } else {
            setLoading(false);
        }

        return () => clearTimeout(coldStartTimer.current);
    }, [token]);

    const login = async (email, mot_de_passe) => {
        
        const cleanEmail = email.trim();
        const res = await axios.post(`${API_URL}/auth/login`, { email: cleanEmail, mot_de_passe });
        const { token: newToken, user: userData } = res.data;
        localStorage.setItem('irrigplus_token', newToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        setToken(newToken);
        setUser(userData);
        return userData;
    };

    const logout = () => {
        localStorage.removeItem('irrigplus_token');
        delete axios.defaults.headers.common['Authorization'];
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, loading, coldStart }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
