import React, { useState, useEffect, useMemo } from 'react';
import { X, Droplets, ChevronDown } from 'lucide-react';

const IrrigationModal = ({ isOpen, onClose, onSubmit, champs, pompes, enrouleurs }) => {
    const [form, setForm] = useState({
        champ_id: '',
        pompe_id: '',
        enrouleur_id: '',
        type_culture: '',
        date_debut: new Date().toISOString().slice(0, 10),
        methode_calcul: 'dose',
        distance_deroulee: '',
        dose_mm: '',
        duree_h: '',
    });

    useEffect(() => {
        if (isOpen) {
            setForm({
                champ_id: '',
                pompe_id: '',
                enrouleur_id: '',
                type_culture: '',
                date_debut: new Date().toISOString().slice(0, 10),
                methode_calcul: 'dose',
                distance_deroulee: '',
                dose_mm: '',
                duree_h: '',
            });
            document.body.classList.add('modal-open');
        } else {
            document.body.classList.remove('modal-open');
        }
        return () => document.body.classList.remove('modal-open');
    }, [isOpen]);

    // L'enrouleur sélectionné (pour récupérer buse + largeur automatiquement)
    const selectedEnrouleur = useMemo(() => {
        if (!form.enrouleur_id) return null;
        return enrouleurs.find(e => e.id === parseInt(form.enrouleur_id)) || null;
    }, [form.enrouleur_id, enrouleurs]);

    // La pompe sélectionnée (pour le débit en mode temps)
    const selectedPompe = useMemo(() => {
        if (!form.pompe_id) return null;
        return pompes.find(p => p.id === parseInt(form.pompe_id)) || null;
    }, [form.pompe_id, pompes]);

    // Calcul en temps réel
    const calcDetails = useMemo(() => {
        if (form.methode_calcul === 'dose') {
            const distance = parseFloat(form.distance_deroulee);
            const largeur = selectedEnrouleur ? parseFloat(selectedEnrouleur.surface_travail) : 0;
            const dose = parseFloat(form.dose_mm);
            if (distance > 0 && largeur > 0 && dose > 0) {
                const surface_m2 = distance * largeur;
                const surface_ha = surface_m2 / 10000;
                const volume_m3 = surface_ha * (dose * 10);
                const volume_litres = volume_m3 * 1000;
                // Estimation du temps si la pompe est sélectionnée
                const debit = selectedPompe ? parseFloat(selectedPompe.debit_m3_h) : 0;
                const heures_estimees = debit > 0 ? volume_m3 / debit : null;
                return { surface_m2, surface_ha, volume_m3, volume_litres, heures_estimees };
            }
        } else {
            const debit = selectedPompe ? parseFloat(selectedPompe.debit_m3_h) : 0;
            const temps = parseFloat(form.duree_h);
            if (debit > 0 && temps > 0) {
                const volume_m3 = debit * temps;
                const volume_litres = volume_m3 * 1000;
                return { volume_m3, volume_litres };
            }
        }
        return null;
    }, [form, selectedEnrouleur, selectedPompe]);

    const handleSubmit = (e) => {
        e.preventDefault();
        // On envoie les données avec les infos de l'enrouleur auto-remplies
        const submitData = {
            ...form,
            taille_buse_session: selectedEnrouleur?.taille_buse || '',
            largeur_travail: selectedEnrouleur?.surface_travail ? String(parseFloat(selectedEnrouleur.surface_travail)) : '',
            statut: 'fini',
        };
        onSubmit(submitData);
    };

    if (!isOpen) return null;

    const inputClass = "w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-base sm:text-sm focus:ring-2 focus:ring-cyan-600 focus:border-cyan-600 outline-none transition-all";
    const labelClass = "block text-xs font-semibold text-gray-700 mb-1";

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center animate-in fade-in duration-200">
            <div className="fixed inset-0 bg-black/60" onClick={onClose} />
            <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg z-10 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 flex flex-col" style={{ maxHeight: 'calc(100dvh - env(safe-area-inset-top, 0px) - 20px)' }}>
                
                {/* Mobile Grab Bar */}
                <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-2 sm:hidden shrink-0" />

                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-cyan-50 text-cyan-600 rounded-lg">
                            <Droplets className="w-4 h-4" />
                        </div>
                        <h3 className="text-sm font-bold text-gray-900">Nouvelle irrigation</h3>
                    </div>
                    <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors" aria-label="Fermer">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable form body */}
                <div className="overflow-y-auto overscroll-contain flex-1 min-h-0">
                    <form onSubmit={handleSubmit} className="p-4 space-y-3">
                        
                        {/* Champ + Culture */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div>
                                <label className={labelClass}>Champ *</label>
                                <select value={form.champ_id} onChange={e => setForm({ ...form, champ_id: e.target.value })} required className={inputClass}>
                                    <option value="">Choisir un champ</option>
                                    {champs.map(c => (
                                        <option key={c.id} value={c.id}>{c.nom_champ}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Culture *</label>
                                <input type="text" value={form.type_culture} onChange={e => setForm({ ...form, type_culture: e.target.value })} required placeholder="Maïs, Blé..." className={inputClass} />
                            </div>
                        </div>

                        {/* Pompe + Enrouleur */}
                        <div className="grid grid-cols-2 gap-2.5">
                            <div>
                                <label className={labelClass}>Pompe *</label>
                                <select value={form.pompe_id} onChange={e => setForm({ ...form, pompe_id: e.target.value })} required className={inputClass}>
                                    <option value="">Pompe</option>
                                    {pompes.map(p => (
                                        <option key={p.id} value={p.id}>{p.nom}</option>
                                    ))}
                                </select>
                                {selectedPompe && (
                                    <p className="text-[10px] text-gray-400 mt-0.5 pl-0.5">
                                        Débit : {parseFloat(selectedPompe.debit_m3_h).toLocaleString('fr-FR')} m³/h
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className={labelClass}>Enrouleur *</label>
                                <select value={form.enrouleur_id} onChange={e => setForm({ ...form, enrouleur_id: e.target.value })} required className={inputClass}>
                                    <option value="">Enrouleur</option>
                                    {enrouleurs.map(e => (
                                        <option key={e.id} value={e.id}>{e.nom}</option>
                                    ))}
                                </select>
                                {selectedEnrouleur && (
                                    <p className="text-[10px] text-gray-400 mt-0.5 pl-0.5">
                                        Buse : {selectedEnrouleur.taille_buse} — Largeur : {parseFloat(selectedEnrouleur.surface_travail).toLocaleString('fr-FR')}m
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Date */}
                        <div>
                            <label className={labelClass}>Date *</label>
                            <input type="date" value={form.date_debut} onChange={e => setForm({ ...form, date_debut: e.target.value })} required className={inputClass} />
                        </div>

                        {/* Méthode toggle */}
                        <div>
                            <label className={labelClass}>Comment calculer le volume ?</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setForm({ ...form, methode_calcul: 'dose', duree_h: '' })}
                                    className={`py-2.5 rounded-lg text-xs font-semibold transition-all border ${form.methode_calcul === 'dose'
                                        ? 'bg-gray-900 text-white border-gray-900'
                                        : 'bg-white text-gray-700 border-gray-300'
                                        }`}
                                >
                                    Par dose (mm)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setForm({ ...form, methode_calcul: 'temps', dose_mm: '', distance_deroulee: '' })}
                                    className={`py-2.5 rounded-lg text-xs font-semibold transition-all border ${form.methode_calcul === 'temps'
                                        ? 'bg-gray-900 text-white border-gray-900'
                                        : 'bg-white text-gray-700 border-gray-300'
                                        }`}
                                >
                                    Par temps (h)
                                </button>
                            </div>
                        </div>

                        {/* === MODE DOSE === */}
                        {form.methode_calcul === 'dose' ? (
                            <div className="grid grid-cols-2 gap-2.5">
                                <div>
                                    <label className={labelClass}>Distance déroulée (m) *</label>
                                    <input
                                        type="number"
                                        step="1"
                                        min="1"
                                        inputMode="numeric"
                                        value={form.distance_deroulee}
                                        onChange={e => setForm({ ...form, distance_deroulee: e.target.value })}
                                        required
                                        placeholder="ex: 450"
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Dose souhaitée (mm) *</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0.1"
                                        inputMode="decimal"
                                        value={form.dose_mm}
                                        onChange={e => setForm({ ...form, dose_mm: e.target.value })}
                                        required
                                        placeholder="ex: 25"
                                        className={inputClass}
                                    />
                                </div>
                            </div>
                        ) : (
                            /* === MODE TEMPS === */
                            <div>
                                <label className={labelClass}>Durée d'arrosage (heures) *</label>
                                <input
                                    type="number"
                                    step="0.25"
                                    min="0.25"
                                    inputMode="decimal"
                                    value={form.duree_h}
                                    onChange={e => setForm({ ...form, duree_h: e.target.value })}
                                    required
                                    placeholder="ex: 2.5"
                                    className={inputClass}
                                />
                            </div>
                        )}

                        {/* === RÉSULTAT === */}
                        {calcDetails && (
                            <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-4 text-center">
                                <p className="text-[10px] font-bold text-cyan-600 uppercase tracking-widest mb-2">Eau utilisée</p>
                                <p className="text-3xl font-black text-cyan-900 tabular-nums leading-tight">
                                    {calcDetails.volume_litres.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
                                    <span className="text-base font-bold text-cyan-600 ml-1">L</span>
                                </p>
                                <p className="text-xs text-cyan-600 mt-1 tabular-nums">
                                    soit {calcDetails.volume_m3.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} m³
                                </p>
                                {calcDetails.surface_ha && (
                                    <p className="text-[10px] text-cyan-500 mt-1 tabular-nums">
                                        Surface arrosée : {calcDetails.surface_ha.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} ha
                                    </p>
                                )}
                                {calcDetails.heures_estimees != null && (
                                    <div className="mt-2.5 pt-2.5 border-t border-cyan-200">
                                        <p className="text-[10px] font-bold text-cyan-600 uppercase tracking-widest mb-1">Durée estimée</p>
                                        <p className="text-xl font-bold text-cyan-900 tabular-nums">
                                            {Math.floor(calcDetails.heures_estimees)}h{String(Math.round((calcDetails.heures_estimees % 1) * 60)).padStart(2, '0')}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Boutons */}
                        <div className="flex gap-2.5 pt-1 pb-2">
                            <button type="button" onClick={onClose} className="flex-1 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 active:scale-[0.97] transition-all">
                                Annuler
                            </button>
                            <button type="submit" className="flex-1 py-2.5 text-sm font-semibold text-white bg-gray-900 rounded-lg hover:bg-gray-800 active:scale-[0.97] transition-all shadow-sm">
                                Enregistrer
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default IrrigationModal;
