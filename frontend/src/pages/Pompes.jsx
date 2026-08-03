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
        <div className="max-w-5xl mx-auto flex flex-col gap-4 sm:gap-6">
            <div className="flex justify-between items-center gap-2 bg-white p-3 sm:p-4 rounded-md shadow-sm border border-gray-100">
                <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 truncate">Mes Pompes</h2>
                    <p className="text-xs text-gray-500 hidden sm:block">Gérez votre matériel de pompage.</p>
                </div>
                <button onClick={() => setShowForm(!showForm)} className="bg-cyan-600 text-white px-3 sm:px-4 py-2 rounded-md hover:bg-cyan-700 text-xs sm:text-sm font-medium flex items-center shrink-0 transition-colors">
                    <Plus className="w-4 h-4 mr-1.5" /> Nouvelle pompe
                </button>
            </div>

            {showForm && (
                <div className="pro-card p-4 sm:p-5 border border-cyan-100 bg-white/95 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
                    <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <Plus className="w-4 h-4 text-cyan-600" />
                        Nouvelle pompe
                    </h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Nom de la pompe *</label>
                            <input
                                value={form.nom}
                                onChange={e => setForm({ ...form, nom: e.target.value })}
                                required
                                placeholder="ex: Pompe Forage Est, Pompe Rivière..."
                                className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-base sm:text-sm focus:ring-2 focus:ring-cyan-600 focus:border-cyan-600 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Débit nominal (m³/h) *</label>
                            <input
                                type="number"
                                step="0.1"
                                min="1"
                                value={form.debit_m3_h}
                                onChange={e => setForm({ ...form, debit_m3_h: e.target.value })}
                                required
                                placeholder="ex: 45"
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
                ) : pompes.length === 0 ? (
                    <div className="col-span-full pro-card p-10 text-center">
                        <Settings2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 font-medium">Aucune pompe enregistrée</p>
                        <p className="text-xs text-gray-400 mt-0.5">Cliquez sur « Nouvelle pompe » pour en ajouter une.</p>
                    </div>
                ) : (
                    pompes.map(p => (
                        <div key={p.id} className="pro-card p-4 sm:p-5 flex flex-col justify-between gap-3 hover:border-gray-300 transition-all">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-cyan-50 text-cyan-600 rounded-xl border border-cyan-100">
                                        <Settings2 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-sm sm:text-base">{p.nom}</h4>
                                        <p className="text-xs text-gray-500 font-medium mt-0.5">
                                            Débit : <span className="text-gray-800 font-bold">{parseFloat(p.debit_m3_h).toLocaleString('fr-FR')} m³/h</span>
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(p.id)}
                                    className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                                    title="Supprimer cette pompe"
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

export default Pompes;
