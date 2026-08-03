import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('irrigplus_token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            axios.get(`${API_URL}/auth/me`)
                .then(res => { setUser(res.data); setLoading(false); })
                .catch(() => { logout(); setLoading(false); });
        } else {
            setLoading(false);
        }
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
        <AuthContext.Provider value={{ user, token, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
