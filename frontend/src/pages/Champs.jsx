import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, MapPin, Trash2, X, Check, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const Champs = () => {
    const { user } = useAuth();
    const [champs, setChamps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
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

    const handleOpenModal = () => {
        setForm({ nom_champ: '', surface_m2: '' });
        setShowModal(true);
        document.body.classList.add('modal-open');
    };

    const handleCloseModal = () => {
        setShowModal(false);
        document.body.classList.remove('modal-open');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.nom_champ.trim()) {
            toast.error('Veuillez indiquer le nom du champ');
            return;
        }
        if (!form.surface_m2 || parseFloat(form.surface_m2) <= 0) {
            toast.error('Veuillez indiquer une surface valide en m²');
            return;
        }

        setIsSubmitting(true);
        try {
            await axios.post(`${API_URL}/champs`, form);
            setForm({ nom_champ: '', surface_m2: '' });
            handleCloseModal();
            toast.success('Champ créé avec succès !');
            fetchChamps();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Erreur lors de la création du champ');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id, nom) => {
        if (!window.confirm(`Supprimer le champ « ${nom} » ?`)) return;
        try {
            await axios.delete(`${API_URL}/champs/${id}`);
            fetchChamps();
            toast.success('Champ supprimé');
        } catch (err) {
            toast.error('Erreur lors de la suppression');
        }
    };

    const surfaceHa = form.surface_m2 && parseFloat(form.surface_m2) > 0 
        ? (parseFloat(form.surface_m2) / 10000).toFixed(2) 
        : null;

    const inputClass = "w-full bg-white border border-gray-300 rounded-xl px-3.5 py-3 text-base text-gray-900 focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none transition-all";
    const labelClass = "block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5";

    return (
        <div className="max-w-5xl mx-auto flex flex-col gap-4 sm:gap-6">
            <div className="flex justify-between items-center gap-2 bg-white p-3.5 sm:p-4 rounded-xl shadow-xs border border-gray-100">
                <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 truncate">Mes Champs (Parcelles)</h2>
                    <p className="text-xs text-gray-500 hidden sm:block">Gérez vos parcelles à irriguer et leurs surfaces.</p>
                </div>
                <button 
                    onClick={handleOpenModal} 
                    className="bg-emerald-600 text-white px-3.5 sm:px-4 py-2.5 rounded-xl hover:bg-emerald-700 active:scale-95 text-xs sm:text-sm font-bold flex items-center shrink-0 transition-all shadow-xs min-h-[42px]"
                >
                    <Plus className="w-4 h-4 mr-1.5 stroke-[2.5]" /> Nouveau champ
                </button>
            </div>

            {/* Modal de création (Mobile & Desktop) */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center animate-in fade-in duration-200">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={handleCloseModal} />
                    
                    <div className="relative bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md z-10 flex flex-col overflow-hidden max-h-[90dvh] animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
                        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

                        {/* Fixed Header */}
                        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 shrink-0 bg-white">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                                    <MapPin className="w-4 h-4" />
                                </div>
                                <h3 className="text-base font-bold text-gray-900">Nouveau champ</h3>
                            </div>
                            <button 
                                onClick={handleCloseModal} 
                                className="p-2 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Scrollable Body */}
                        <div className="modal-scroll-area overflow-y-auto flex-1 min-h-0 px-5 py-4 space-y-4">
                            <form id="champ-form" onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className={labelClass}>Nom du champ (Parcelle) *</label>
                                    <input
                                        type="text"
                                        value={form.nom_champ}
                                        onChange={e => setForm({ ...form, nom_champ: e.target.value })}
                                        required
                                        autoFocus
                                        placeholder="ex: Champ du Moulin, Parcelle Nord..."
                                        className={inputClass}
                                    />
                                </div>

                                <div>
                                    <label className={labelClass}>Surface (en m²) *</label>
                                    <input
                                        type="number"
                                        min="1"
                                        step="1"
                                        inputMode="numeric"
                                        value={form.surface_m2}
                                        onChange={e => setForm({ ...form, surface_m2: e.target.value })}
                                        required
                                        placeholder="ex: 25000 (pour 2.5 ha)"
                                        className={inputClass}
                                    />
                                </div>

                                {surfaceHa && (
                                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-900 text-center animate-in zoom-in-95">
                                        <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Surface calculée</p>
                                        <p className="text-xl font-extrabold text-emerald-900 mt-0.5 tabular-nums">
                                            {surfaceHa} <span className="text-sm font-semibold">hectares</span>
                                        </p>
                                    </div>
                                )}
                            </form>
                        </div>

                        {/* Fixed Sticky Footer */}
                        <div className="shrink-0 px-5 py-3.5 bg-white border-t border-gray-100 flex gap-3 shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
                            <button
                                type="button"
                                onClick={handleCloseModal}
                                className="flex-1 py-3 px-4 text-sm font-bold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 active:scale-[0.97] transition-all min-h-[48px]"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                form="champ-form"
                                disabled={isSubmitting}
                                className="flex-2 py-3 px-4 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl active:scale-[0.97] transition-all shadow-md min-h-[48px] flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <span>Enregistrement...</span>
                                ) : (
                                    <>
                                        <Check className="w-4 h-4 stroke-[3]" />
                                        <span>Enregistrer le champ</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* List of Champs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {loading ? (
                    <div className="col-span-full pro-card p-8 text-center text-sm text-gray-400 font-medium">Chargement des parcelles...</div>
                ) : champs.length === 0 ? (
                    <div className="col-span-full pro-card p-10 text-center">
                        <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 font-medium">Aucun champ enregistré</p>
                        <p className="text-xs text-gray-400 mt-0.5">Cliquez sur « Nouveau champ » pour en créer un.</p>
                    </div>
                ) : (
                    champs.map(c => (
                        <div key={c.id} className="pro-card p-4 sm:p-5 flex flex-col justify-between gap-3 hover:border-emerald-200 transition-all">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-sm sm:text-base">{c.nom_champ}</h4>
                                        <p className="text-xs text-gray-500 font-medium mt-0.5">
                                            {parseFloat(c.surface_m2).toLocaleString('fr-FR')} m²
                                            <span className="text-emerald-600 font-semibold ml-1.5">
                                                ({(parseFloat(c.surface_m2) / 10000).toFixed(2)} ha)
                                            </span>
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(c.id, c.nom_champ)}
                                    className="p-2 text-gray-400 hover:text-red-500 rounded-xl hover:bg-red-50 transition-colors"
                                    title="Supprimer ce champ"
                                    aria-label="Supprimer"
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
