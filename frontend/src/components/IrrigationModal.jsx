import React, { useState, useEffect, useMemo } from 'react';
import { X, Droplets, Calculator } from 'lucide-react';

const IrrigationModal = ({ isOpen, onClose, onSubmit, champs, pompes, enrouleurs }) => {
    const [form, setForm] = useState({
        champ_id: '',
        pompe_id: '',
        enrouleur_id: '',
        type_culture: '',
        date_debut: new Date().toISOString().slice(0, 16),
        methode_calcul: 'dose',
        dose_mm: '',
        duree_h: '',
        statut: 'fini'
    });

    useEffect(() => {
        if (isOpen) {
            setForm({
                champ_id: '',
                pompe_id: '',
                enrouleur_id: '',
                type_culture: '',
                date_debut: new Date().toISOString().slice(0, 16),
                methode_calcul: 'dose',
                dose_mm: '',
                duree_h: '',
                statut: 'fini'
            });
        }
    }, [isOpen]);

    const volumePreview = useMemo(() => {
        if (form.methode_calcul === 'dose') {
            const enrouleur = enrouleurs.find(e => e.id === parseInt(form.enrouleur_id));
            const dose = parseFloat(form.dose_mm);
            if (enrouleur && enrouleur.surface_travail && dose > 0) {
                return ((parseFloat(enrouleur.surface_travail) * dose) / 1000).toFixed(2);
            }
        } else {
            const pompe = pompes.find(p => p.id === parseInt(form.pompe_id));
            const temps = parseFloat(form.duree_h);
            if (pompe && temps > 0) {
                return (parseFloat(pompe.debit_m3_h) * temps).toFixed(2);
            }
        }
        return null;
    }, [form, enrouleurs, pompes]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(form);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />
            <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-lg max-h-[88dvh] sm:max-h-[90dvh] overflow-y-auto flex flex-col z-10 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
                {/* Mobile Grab Bar */}
                <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-2.5 sm:hidden shrink-0" />

                <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-cyan-50 text-cyan-600 rounded-lg">
                            <Droplets className="w-4 h-4" />
                        </div>
                        <h3 className="text-sm sm:text-base font-bold text-gray-900">Nouvelle session d'irrigation</h3>
                    </div>
                    <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors" aria-label="Fermer">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Champ *</label>
                        <select
                            value={form.champ_id}
                            onChange={e => setForm({ ...form, champ_id: e.target.value })}
                            required
                            className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-base sm:text-sm focus:ring-2 focus:ring-cyan-600 focus:border-cyan-600 outline-none transition-all"
                        >
                            <option value="">Sélectionner un champ</option>
                            {champs.map(c => (
                                <option key={c.id} value={c.id}>{c.nom_champ} — {parseFloat(c.surface_m2).toLocaleString()} m²</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Type de culture *</label>
                        <input
                            type="text"
                            value={form.type_culture}
                            onChange={e => setForm({ ...form, type_culture: e.target.value })}
                            required
                            placeholder="ex: Maïs, Blé..."
                            className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-base sm:text-sm focus:ring-2 focus:ring-cyan-600 focus:border-cyan-600 outline-none transition-all"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Pompe *</label>
                            <select
                                value={form.pompe_id}
                                onChange={e => setForm({ ...form, pompe_id: e.target.value })}
                                required
                                className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-base sm:text-sm focus:ring-2 focus:ring-cyan-600 focus:border-cyan-600 outline-none transition-all"
                            >
                                <option value="">Choisir une pompe</option>
                                {pompes.map(p => (
                                    <option key={p.id} value={p.id}>{p.nom} ({p.debit_m3_h} m³/h)</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Enrouleur *</label>
                            <select
                                value={form.enrouleur_id}
                                onChange={e => setForm({ ...form, enrouleur_id: e.target.value })}
                                required
                                className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-base sm:text-sm focus:ring-2 focus:ring-cyan-600 focus:border-cyan-600 outline-none transition-all"
                            >
                                <option value="">Choisir un enrouleur</option>
                                {enrouleurs.map(e => (
                                    <option key={e.id} value={e.id}>{e.nom} ({e.taille_buse})</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Date de début *</label>
                            <input
                                type="datetime-local"
                                value={form.date_debut}
                                onChange={e => setForm({ ...form, date_debut: e.target.value })}
                                required
                                className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-base sm:text-sm focus:ring-2 focus:ring-cyan-600 focus:border-cyan-600 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Statut *</label>
                            <select
                                value={form.statut}
                                onChange={e => setForm({ ...form, statut: e.target.value })}
                                required
                                className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-base sm:text-sm focus:ring-2 focus:ring-cyan-600 focus:border-cyan-600 outline-none transition-all"
                            >
                                <option value="programme">Programmé</option>
                                <option value="lance">Lancé (en cours)</option>
                                <option value="fini">Fini (terminé)</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2">Méthode de calcul *</label>
                        <div className="grid grid-cols-2 gap-2.5">
                            <button
                                type="button"
                                onClick={() => setForm({ ...form, methode_calcul: 'dose', duree_h: '' })}
                                className={`py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all border ${form.methode_calcul === 'dose'
                                    ? 'bg-gray-900 text-white border-gray-900 shadow-xs'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                Par dose (mm)
                            </button>
                            <button
                                type="button"
                                onClick={() => setForm({ ...form, methode_calcul: 'temps', dose_mm: '' })}
                                className={`py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all border ${form.methode_calcul === 'temps'
                                    ? 'bg-gray-900 text-white border-gray-900 shadow-xs'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                Par temps (h)
                            </button>
                        </div>
                    </div>

                    {form.methode_calcul === 'dose' ? (
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Dose (mm) *</label>
                            <input
                                type="number"
                                step="0.1"
                                min="0.1"
                                value={form.dose_mm}
                                onChange={e => setForm({ ...form, dose_mm: e.target.value })}
                                required
                                placeholder="Ex: 5"
                                className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-base sm:text-sm focus:ring-2 focus:ring-cyan-600 focus:border-cyan-600 outline-none transition-all"
                            />
                            <p className="text-[10px] text-gray-400 mt-1">Formule : Volume (m³) = Surface enrouleur (m²) × Dose (mm) / 1000</p>
                        </div>
                    ) : (
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Temps (heures) *</label>
                            <input
                                type="number"
                                step="0.25"
                                min="0.25"
                                value={form.duree_h}
                                onChange={e => setForm({ ...form, duree_h: e.target.value })}
                                required
                                placeholder="Ex: 2.5"
                                className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-base sm:text-sm focus:ring-2 focus:ring-cyan-600 focus:border-cyan-600 outline-none transition-all"
                            />
                            <p className="text-[10px] text-gray-400 mt-1">Formule : Volume (m³) = Débit (m³/h) × Temps (h)</p>
                        </div>
                    )}

                    {volumePreview && (
                        <div className="bg-cyan-50/80 border border-cyan-200 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-1">
                                <Calculator className="w-4 h-4 text-cyan-600" />
                                <span className="text-[10px] font-bold text-cyan-700 uppercase tracking-widest">Volume estimé</span>
                            </div>
                            <p className="text-2xl sm:text-3xl font-bold text-cyan-900 tabular-nums">
                                {parseFloat(volumePreview).toLocaleString('fr-FR')} <span className="text-sm font-semibold text-cyan-600">m³</span>
                            </p>
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-3 sm:py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 active:scale-95 transition-all">
                            Annuler
                        </button>
                        <button type="submit" className="flex-1 py-3 sm:py-2.5 text-sm font-semibold text-white bg-gray-900 rounded-lg hover:bg-gray-800 active:scale-95 transition-all shadow-sm">
                            Enregistrer
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default IrrigationModal;
