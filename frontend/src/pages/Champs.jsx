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
                <div className="pro-card p-5">
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Nom du champ *</label>
                            <input value={form.nom_champ} onChange={e => setForm({ ...form, nom_champ: e.target.value })} required
                                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-600 focus:border-cyan-600" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Surface (m²) *</label>
                            <input type="number" min="1" value={form.surface_m2} onChange={e => setForm({ ...form, surface_m2: e.target.value })} required
                                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-600 focus:border-cyan-600" />
                        </div>
                        <div className="sm:col-span-2 flex gap-2">
                            <button type="submit" className="bg-cyan-600 text-white px-4 py-2 rounded-md text-sm font-medium">Enregistrer</button>
                            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 bg-white border rounded-md">Annuler</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? <p>Chargement...</p> : champs.length === 0 ? <p className="text-gray-400">Aucun champ.</p> : champs.map(c => (
                    <div key={c.id} className="pro-card p-4 flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-cyan-50 text-cyan-600 rounded-lg"><MapPin className="w-5 h-5" /></div>
                                <div>
                                    <h4 className="font-bold text-gray-900">{c.nom_champ}</h4>
                                    <p className="text-xs text-gray-500">{parseFloat(c.surface_m2).toLocaleString('fr-FR')} m²</p>
                                </div>
                            </div>
                            <button onClick={() => handleDelete(c.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Champs;
