import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Settings2, Trash2, X, Check, Gauge } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const Pompes = () => {
    const { user } = useAuth();
    const [pompes, setPompes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
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

    const handleOpenModal = () => {
        setForm({ nom: '', debit_m3_h: '' });
        setShowModal(true);
        document.body.classList.add('modal-open');
    };

    const handleCloseModal = () => {
        setShowModal(false);
        document.body.classList.remove('modal-open');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.nom.trim()) {
            toast.error('Veuillez indiquer le nom de la pompe');
            return;
        }
        if (!form.debit_m3_h || parseFloat(form.debit_m3_h) <= 0) {
            toast.error('Veuillez indiquer un débit valide en m³/h');
            return;
        }

        setIsSubmitting(true);
        try {
            await axios.post(`${API_URL}/pompes`, form);
            setForm({ nom: '', debit_m3_h: '' });
            handleCloseModal();
            toast.success('Pompe enregistrée avec succès !');
            fetchPompes();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Erreur lors de la création de la pompe');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id, nom) => {
        if (!window.confirm(`Supprimer la pompe « ${nom} » ?`)) return;
        try {
            await axios.delete(`${API_URL}/pompes/${id}`);
            fetchPompes();
            toast.success('Pompe supprimée');
        } catch (err) {
            toast.error('Erreur lors de la suppression');
        }
    };

    const inputClass = "w-full bg-white border border-gray-300 rounded-xl px-3.5 py-3 text-base text-gray-900 focus:ring-2 focus:ring-cyan-600 focus:border-cyan-600 outline-none transition-all";
    const labelClass = "block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5";

    return (
        <div className="max-w-5xl mx-auto flex flex-col gap-4 sm:gap-6">
            <div className="flex justify-between items-center gap-2 bg-white p-3.5 sm:p-4 rounded-xl shadow-xs border border-gray-100">
                <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 truncate">Mes Pompes</h2>
                    <p className="text-xs text-gray-500 hidden sm:block">Gérez votre matériel de pompage et débits.</p>
                </div>
                <button 
                    onClick={handleOpenModal} 
                    className="bg-cyan-600 text-white px-3.5 sm:px-4 py-2.5 rounded-xl hover:bg-cyan-700 active:scale-95 text-xs sm:text-sm font-bold flex items-center shrink-0 transition-all shadow-xs min-h-[42px]"
                >
                    <Plus className="w-4 h-4 mr-1.5 stroke-[2.5]" /> Nouvelle pompe
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
                                <div className="p-2 bg-cyan-50 text-cyan-600 rounded-xl border border-cyan-100">
                                    <Settings2 className="w-4 h-4" />
                                </div>
                                <h3 className="text-base font-bold text-gray-900">Nouvelle pompe</h3>
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
                            <form id="pompe-form" onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className={labelClass}>Nom de la pompe *</label>
                                    <input
                                        type="text"
                                        value={form.nom}
                                        onChange={e => setForm({ ...form, nom: e.target.value })}
                                        required
                                        autoFocus
                                        placeholder="ex: Pompe Principale, Forage Ouest..."
                                        className={inputClass}
                                    />
                                </div>

                                <div>
                                    <label className={labelClass}>Débit nominal (m³/h) *</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0.1"
                                        inputMode="decimal"
                                        value={form.debit_m3_h}
                                        onChange={e => setForm({ ...form, debit_m3_h: e.target.value })}
                                        required
                                        placeholder="ex: 45"
                                        className={inputClass}
                                    />
                                    <p className="text-xs text-gray-400 mt-1 pl-1">
                                        Sert à calculer le volume pompé quand vous irriguez au temps.
                                    </p>
                                </div>
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
                                form="pompe-form"
                                disabled={isSubmitting}
                                className="flex-2 py-3 px-4 text-sm font-bold text-white bg-cyan-600 hover:bg-cyan-700 rounded-xl active:scale-[0.97] transition-all shadow-md min-h-[48px] flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <span>Enregistrement...</span>
                                ) : (
                                    <>
                                        <Check className="w-4 h-4 stroke-[3]" />
                                        <span>Enregistrer la pompe</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* List of Pompes */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {loading ? (
                    <div className="col-span-full pro-card p-8 text-center text-sm text-gray-400 font-medium">Chargement des pompes...</div>
                ) : pompes.length === 0 ? (
                    <div className="col-span-full pro-card p-10 text-center">
                        <Settings2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 font-medium">Aucune pompe enregistrée</p>
                        <p className="text-xs text-gray-400 mt-0.5">Cliquez sur « Nouvelle pompe » pour en ajouter une.</p>
                    </div>
                ) : (
                    pompes.map(p => (
                        <div key={p.id} className="pro-card p-4 sm:p-5 flex flex-col justify-between gap-3 hover:border-cyan-200 transition-all">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-cyan-50 text-cyan-600 rounded-xl border border-cyan-100">
                                        <Settings2 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-sm sm:text-base">{p.nom}</h4>
                                        <p className="text-xs text-gray-500 font-medium mt-0.5">
                                            Débit : <span className="text-cyan-700 font-bold">{parseFloat(p.debit_m3_h).toLocaleString('fr-FR')} m³/h</span>
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(p.id, p.nom)}
                                    className="p-2 text-gray-400 hover:text-red-500 rounded-xl hover:bg-red-50 transition-colors"
                                    title="Supprimer cette pompe"
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

export default Pompes;
