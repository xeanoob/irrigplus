import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Replace, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const Enrouleurs = () => {
    const { user } = useAuth();
    const [enrouleurs, setEnrouleurs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ nom: '', surface_travail: '', taille_buse: '' });

    useEffect(() => { fetchEnrouleurs(); }, []);

    const fetchEnrouleurs = async () => {
        try {
            const res = await axios.get(`${API_URL}/enrouleurs`);
            setEnrouleurs(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/enrouleurs`, form);
            setForm({ nom: '', surface_travail: '', taille_buse: '' });
            setShowForm(false);
            toast.success('Enrouleur créé avec succès');
            fetchEnrouleurs();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Erreur');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Supprimer cet enrouleur ?')) return;
        try {
            await axios.delete(`${API_URL}/enrouleurs/${id}`);
            fetchEnrouleurs();
            toast.success('Enrouleur supprimé');
        } catch (err) {
            toast.error('Erreur');
        }
    };

    return (
        <div className="max-w-5xl mx-auto flex flex-col gap-4 sm:gap-6">
            <div className="flex justify-between items-center gap-2 bg-white p-3 sm:p-4 rounded-md shadow-sm border border-gray-100">
                <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 truncate">Mes Enrouleurs</h2>
                    <p className="text-xs text-gray-500 hidden sm:block">Gérez vos enrouleurs et buses.</p>
                </div>
                <button onClick={() => setShowForm(!showForm)} className="bg-cyan-600 text-white px-3 sm:px-4 py-2 rounded-md hover:bg-cyan-700 text-xs sm:text-sm font-medium flex items-center shrink-0 transition-colors">
                    <Plus className="w-4 h-4 mr-1.5" /> Nouvel enrouleur
                </button>
            </div>

            {showForm && (
                <div className="pro-card p-5">
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Nom de l'enrouleur *</label>
                            <input value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} required
                                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-600 focus:border-cyan-600" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Taille de buse *</label>
                            <input value={form.taille_buse} onChange={e => setForm({ ...form, taille_buse: e.target.value })} required placeholder="ex: 22mm"
                                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-600 focus:border-cyan-600" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Surface de travail (optionnel)</label>
                            <input type="number" value={form.surface_travail} onChange={e => setForm({ ...form, surface_travail: e.target.value })}
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
                {loading ? <p>Chargement...</p> : enrouleurs.length === 0 ? <p className="text-gray-400">Aucun enrouleur.</p> : enrouleurs.map(e => (
                    <div key={e.id} className="pro-card p-4 flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-green-50 text-green-600 rounded-lg"><Replace className="w-5 h-5" /></div>
                                <div>
                                    <h4 className="font-bold text-gray-900">{e.nom}</h4>
                                    <p className="text-xs text-gray-500">Buse : {e.taille_buse}</p>
                                </div>
                            </div>
                            <button onClick={() => handleDelete(e.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Enrouleurs;
