import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, MapPin, Trash2, Pencil } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const Champs = () => {
    const { user } = useAuth();
    const [champs, setChamps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ nom_champ: '', surface_m2: '' });

    useEffect(() => { fetchChamps(); }, []);

    const fetchChamps = async () => {
        try {
            const res = await axios.get(`${API_URL}/champs`);
            setChamps(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/champs`, form);
            setForm({ nom_champ: '', surface_m2: '' });
            setShowForm(false);
            toast.success('Champ créé avec succès');
            fetchChamps();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Erreur');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Supprimer ce champ ?')) return;
        try {
            await axios.delete(`${API_URL}/champs/${id}`);
            fetchChamps();
            toast.success('Champ supprimé');
        } catch (err) {
            toast.error('Erreur lors de la suppression');
        }
    };

    return (
        <div className="max-w-5xl mx-auto flex flex-col gap-4 sm:gap-6">
            <div className="flex justify-between items-center gap-2 bg-white p-3 sm:p-4 rounded-md shadow-sm border border-gray-100">
                <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 truncate">Mes Champs</h2>
                    <p className="text-xs text-gray-500 hidden sm:block">Gérez vos parcelles à irriguer.</p>
                </div>
                <button onClick={() => setShowForm(!showForm)} className="bg-cyan-600 text-white px-3 sm:px-4 py-2 rounded-md hover:bg-cyan-700 text-xs sm:text-sm font-medium flex items-center shrink-0 transition-colors">
                    <Plus className="w-4 h-4 mr-1.5" /> Nouveau champ
                </button>
            </div>

            {showForm && (
                <div className="pro-card p-4 sm:p-5 border border-cyan-100 bg-white/95 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
                    <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <Plus className="w-4 h-4 text-cyan-600" />
                        Nouveau champ
                    </h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Nom du champ *</label>
                            <input
                                value={form.nom_champ}
                                onChange={e => setForm({ ...form, nom_champ: e.target.value })}
                                required
                                placeholder="ex: Parcelle Nord, Champ du Moulin..."
                                className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-base sm:text-sm focus:ring-2 focus:ring-cyan-600 focus:border-cyan-600 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Surface (m²) *</label>
                            <input
                                type="number"
                                min="1"
                                value={form.surface_m2}
                                onChange={e => setForm({ ...form, surface_m2: e.target.value })}
                                required
                                placeholder="ex: 15000"
                                className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-base sm:text-sm focus:ring-2 focus:ring-cyan-600 focus:border-cyan-600 outline-none transition-all"
                            />
                        </div>
                        <div className="sm:col-span-2 flex gap-2.5 pt-1">
                            <button
                                type="submit"
                                className="bg-cyan-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-cyan-700 active:scale-95 transition-all shadow-xs"
                            >
                                Enregistrer
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="px-4 py-2.5 text-sm font-semibold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 active:scale-95 transition-all"
                            >
                                Annuler
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {loading ? (
                    <div className="col-span-full pro-card p-8 text-center text-sm text-gray-400 font-medium">Chargement...</div>
                ) : champs.length === 0 ? (
                    <div className="col-span-full pro-card p-10 text-center">
                        <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 font-medium">Aucun champ enregistré</p>
                        <p className="text-xs text-gray-400 mt-0.5">Cliquez sur « Nouveau champ » pour en créer un.</p>
                    </div>
                ) : (
                    champs.map(c => (
                        <div key={c.id} className="pro-card p-4 sm:p-5 flex flex-col justify-between gap-3 hover:border-gray-300 transition-all">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-sm sm:text-base">{c.nom_champ}</h4>
                                        <p className="text-xs text-gray-500 font-medium mt-0.5">
                                            {parseFloat(c.surface_m2).toLocaleString('fr-FR')} m²
                                            <span className="text-gray-400 ml-1">({(parseFloat(c.surface_m2) / 10000).toFixed(2)} ha)</span>
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(c.id)}
                                    className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                                    title="Supprimer ce champ"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Champs;
