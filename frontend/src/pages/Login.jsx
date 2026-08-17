import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const Login = () => {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [waking, setWaking] = useState(false);

    useEffect(() => {
        const wakeUp = async () => {
            try {
                await axios.get(`${API_URL.replace(/\/api$/, '')}/`, { timeout: 5000 });
            } catch {
                setWaking(true);
                try {
                    await axios.get(`${API_URL.replace(/\/api$/, '')}/`, { timeout: 15000 });
                } catch {
                    // Still asleep
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
        <div className="fixed inset-0 bg-[#0A0A0A] flex items-center justify-center p-4 overflow-y-auto">
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

                <div className="bg-[#141414] border border-white/10 shadow-2xl rounded-2xl p-6 sm:p-7">
                    {error && (
                        <div className="mb-4 px-3.5 py-2.5 bg-red-950/60 border border-red-800/80 text-red-300 text-xs font-semibold rounded-xl animate-in fade-in">
                            {error}
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                autoFocus
                                placeholder="votre@email.fr"
                                className="w-full bg-[#1F1F1F] border border-white/10 rounded-xl px-3.5 py-3 text-base sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Mot de passe</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                                className="w-full bg-[#1F1F1F] border border-white/10 rounded-xl px-3.5 py-3 text-base sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-3.5 rounded-xl text-sm font-bold active:scale-[0.98] transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed mt-2"
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
