import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Settings2, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const Pompes = () => {
    const { user } = useAuth();
    const [pompes, setPompes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ nom: '', debit_m3_h: '' });

    useEffect(() => { fetchPompes(); }, []);

    const fetchPompes = async () => {
        try {
            const res = await axios.get(`${API_URL}/pompes`);
            setPompes(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/pompes`, form);
            setForm({ nom: '', debit_m3_h: '' });
            setShowForm(false);
            toast.success('Pompe créée avec succès');
            fetchPompes();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Erreur');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Supprimer cette pompe ?')) return;
        try {
            await axios.delete(`${API_URL}/pompes/${id}`);
            fetchPompes();
            toast.success('Pompe supprimée');
        } catch (err) {
            toast.error('Erreur');
        }
    };

    return (
        <div className="max-w-5xl mx-auto flex flex-col gap-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Mes Pompes</h2>
                    <p className="text-sm text-gray-500">Gérez votre matériel de pompage.</p>
                </div>
                <button onClick={() => setShowForm(!showForm)} className="bg-cyan-600 text-white px-4 py-2 rounded-md hover:bg-cyan-700 text-sm font-medium flex items-center">
                    <Plus className="w-4 h-4 mr-2" /> Nouvelle
                </button>
            </div>

            {showForm && (
                <div className="pro-card p-5">
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Nom de la pompe *</label>
                            <input value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} required
                                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-600 focus:border-cyan-600" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Débit nominal (m³/h) *</label>
                            <input type="number" step="0.1" min="1" value={form.debit_m3_h} onChange={e => setForm({ ...form, debit_m3_h: e.target.value })} required
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
                {loading ? <p>Chargement...</p> : pompes.length === 0 ? <p className="text-gray-400">Aucune pompe.</p> : pompes.map(p => (
                    <div key={p.id} className="pro-card p-4 flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Settings2 className="w-5 h-5" /></div>
                                <div>
                                    <h4 className="font-bold text-gray-900">{p.nom}</h4>
                                    <p className="text-xs text-gray-500">Débit : {parseFloat(p.debit_m3_h).toLocaleString('fr-FR')} m³/h</p>
                                </div>
                            </div>
                            <button onClick={() => handleDelete(p.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Pompes;
