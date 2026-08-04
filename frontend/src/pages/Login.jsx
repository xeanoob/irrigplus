import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Droplets } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const Login = () => {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [waking, setWaking] = useState(false);

    // Warm up backend as soon as Login page is shown
    useEffect(() => {
        const wakeUp = async () => {
            try {
                await axios.get(`${API_URL.replace(/\/api$/, '')}/`, { timeout: 5000 });
            } catch {
                // Backend is probably still asleep — that's okay, login will retry
                setWaking(true);
                try {
                    await axios.get(`${API_URL.replace(/\/api$/, '')}/`, { timeout: 15000 });
                } catch {
                    // Still down — login will handle errors
                }
                setWaking(false);
            }
        };
        wakeUp();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            toast.success('Connexion réussie !');
        } catch (err) {
            let msg;
            if (err.code === 'ECONNABORTED' || !err.response) {
                msg = 'Le serveur met du temps à répondre. Réessayez dans quelques secondes.';
            } else {
                msg = err.response?.data?.error || 'Erreur de connexion';
            }
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-[#0A0A0A] flex items-center justify-center p-4 overflow-auto">
            <div className="w-full max-w-sm">
                <div className="mb-8 text-center flex flex-col items-center">
                    <img src="/logotransparent.png" alt="Logo iRRIG+" className="h-20 w-auto object-contain mb-3 drop-shadow" />
                    <h1 className="text-xl font-bold text-white uppercase tracking-widest">iRRIG+</h1>
                    <p className="text-sm text-gray-400 mt-1">Gestion d'irrigation agricole</p>
                    {waking && (
                        <div className="mt-3 flex items-center gap-2 text-xs text-amber-400">
                            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                            Réveil du serveur en cours…
                        </div>
                    )}
                </div>

                <div className="bg-white border border-gray-100 shadow-xl rounded-2xl p-6 sm:p-7 backdrop-blur-xs">
                    {error && (
                        <div className="mb-4 px-3.5 py-2.5 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl animate-in fade-in">
                            {error}
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                autoFocus
                                placeholder="votre@email.fr"
                                className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-base sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-600 focus:border-cyan-600 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Mot de passe</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                                className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-base sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-600 focus:border-cyan-600 transition-all"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-4 py-3 rounded-lg text-sm font-bold hover:from-cyan-700 hover:to-blue-700 active:scale-95 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Connexion en cours...' : 'Se connecter'}
                        </button>
                    </form>
                </div>
                <p className="text-center text-xs text-gray-500 mt-6 font-medium">
                    iRRIG+ • Plateforme de gestion d'irrigation
                </p>
            </div>
        </div>
    );
};

export default Login;
