import React, { useState, useEffect, useMemo } from 'react';
import { X, Droplets, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const CULTURE_PRESETS = ['Maïs', 'Blé', 'Soja', 'Tournesol', 'Colza', 'Orge'];
const DOSE_PRESETS = [15, 20, 25, 30, 35];

const getLocalTime = () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const IrrigationModal = ({ isOpen, onClose, onSubmit, champs = [], pompes = [], enrouleurs = [], isSubmitting = false }) => {
    const [form, setForm] = useState({
        champ_id: '',
        pompe_id: '',
        enrouleur_id: '',
        type_culture: '',
        date_debut: new Date().toISOString().slice(0, 10),
        heure_debut: getLocalTime(),
        methode_calcul: 'dose',
        distance_deroulee: '',
        largeur_travail: '',
        dose_mm: '25',
        duree_h: '',
        statut: 'lance',
    });

    useEffect(() => {
        if (isOpen) {
            setForm({
                champ_id: champs.length === 1 ? String(champs[0].id) : '',
                pompe_id: pompes.length === 1 ? String(pompes[0].id) : '',
                enrouleur_id: enrouleurs.length === 1 ? String(enrouleurs[0].id) : '',
                type_culture: '',
                date_debut: new Date().toISOString().slice(0, 10),
                heure_debut: getLocalTime(),
                methode_calcul: 'dose',
                distance_deroulee: '',
                largeur_travail: enrouleurs.length === 1 && enrouleurs[0].surface_travail ? String(enrouleurs[0].surface_travail) : '',
                dose_mm: '25',
                duree_h: '',
                statut: 'lance',
            });
            document.body.classList.add('modal-open');
        } else {
            document.body.classList.remove('modal-open');
        }
        return () => document.body.classList.remove('modal-open');
    }, [isOpen, champs, pompes, enrouleurs]);

    const selectedEnrouleur = useMemo(() => {
        if (!form.enrouleur_id) return null;
        return enrouleurs.find(e => e.id === parseInt(form.enrouleur_id)) || null;
    }, [form.enrouleur_id, enrouleurs]);

    const selectedPompe = useMemo(() => {
        if (!form.pompe_id) return null;
        return pompes.find(p => p.id === parseInt(form.pompe_id)) || null;
    }, [form.pompe_id, pompes]);

    const handleEnrouleurChange = (enrouleurId) => {
        const enr = enrouleurs.find(e => e.id === parseInt(enrouleurId));
        setForm(prev => ({
            ...prev,
            enrouleur_id: enrouleurId,
            largeur_travail: enr?.surface_travail ? String(parseFloat(enr.surface_travail)) : prev.largeur_travail
        }));
    };

    // Live calculation
    const calc = useMemo(() => {
        const startDateTime = new Date(`${form.date_debut}T${form.heure_debut || '12:00'}:00`);

        if (form.methode_calcul === 'dose') {
            const distance = parseFloat(form.distance_deroulee);
            const largeur = parseFloat(form.largeur_travail) || (selectedEnrouleur ? parseFloat(selectedEnrouleur.surface_travail) : 0);
            const dose = parseFloat(form.dose_mm);
            if (distance > 0 && largeur > 0 && dose > 0) {
                const surface_m2 = distance * largeur;
                const surface_ha = surface_m2 / 10000;
                const volume_m3 = (distance * largeur * dose) / 1000;
                const volume_litres = volume_m3 * 1000;
                const debit = selectedPompe ? parseFloat(selectedPompe.debit_m3_h) : 0;
                const duree_h = debit > 0 ? volume_m3 / debit : null;
                const vitesse_m_h = duree_h && duree_h > 0 ? distance / duree_h : null;
                const date_fin = duree_h ? new Date(startDateTime.getTime() + duree_h * 3600 * 1000) : null;

                return { surface_ha, volume_m3, volume_litres, duree_h, vitesse_m_h, date_fin };
            }
        } else {
            const debit = selectedPompe ? parseFloat(selectedPompe.debit_m3_h) : 0;
            const temps = parseFloat(form.duree_h);
            if (debit > 0 && temps > 0) {
                const volume_m3 = debit * temps;
                const volume_litres = volume_m3 * 1000;
                const date_fin = new Date(startDateTime.getTime() + temps * 3600 * 1000);
                return { volume_m3, volume_litres, duree_h: temps, date_fin };
            }
        }
        return null;
    }, [form, selectedEnrouleur, selectedPompe]);

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!form.champ_id) {
            toast.error('Veuillez sélectionner un champ');
            return;
        }
        if (!form.type_culture.trim()) {
            toast.error('Veuillez indiquer la culture');
            return;
        }
        if (!form.pompe_id) {
            toast.error('Veuillez sélectionner une pompe');
            return;
        }
        if (!form.enrouleur_id) {
            toast.error('Veuillez sélectionner un enrouleur');
            return;
        }

        if (form.methode_calcul === 'dose') {
            if (!form.distance_deroulee || parseFloat(form.distance_deroulee) <= 0) {
                toast.error('Veuillez indiquer la distance déroulée (m)');
                return;
            }
            if (!form.dose_mm || parseFloat(form.dose_mm) <= 0) {
                toast.error('Veuillez indiquer la dose (mm)');
                return;
            }
        } else {
            if (!form.duree_h || parseFloat(form.duree_h) <= 0) {
                toast.error('Veuillez indiquer la durée (heures)');
                return;
            }
        }

        const fullDateDebut = new Date(`${form.date_debut}T${form.heure_debut || '12:00'}:00`).toISOString();

        onSubmit({
            champ_id: form.champ_id,
            pompe_id: form.pompe_id,
            enrouleur_id: form.enrouleur_id,
            type_culture: form.type_culture,
            date_debut: fullDateDebut,
            methode_calcul: form.methode_calcul,
            distance_deroulee: form.distance_deroulee || null,
            dose_mm: form.dose_mm || null,
            duree_h: calc?.duree_h ? String(calc.duree_h) : form.duree_h || null,
            taille_buse_session: selectedEnrouleur?.taille_buse || '',
            largeur_travail: form.largeur_travail || (selectedEnrouleur?.surface_travail ? String(parseFloat(selectedEnrouleur.surface_travail)) : ''),
            statut: form.statut,
        });
    };

    if (!isOpen) return null;

    const inputClass = "w-full min-w-0 max-w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-base sm:text-sm text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all box-border";
    const labelClass = "block text-xs font-bold text-gray-700 mb-1 truncate";
    const hasMissingData = champs.length === 0 || pompes.length === 0 || enrouleurs.length === 0;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden w-full max-w-full">
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity" 
                onClick={onClose} 
                aria-hidden="true"
            />

            {/* Modal Box (Strict width constraints, zero horizontal spill) */}
            <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-full sm:max-w-lg z-10 flex flex-col overflow-hidden max-h-[92dvh] sm:max-h-[88vh] box-border">
                
                {/* Header */}
                <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-gray-200 shrink-0 bg-white min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="p-1.5 bg-gray-100 rounded-lg text-gray-900 shrink-0">
                            <Droplets className="w-4 h-4 text-cyan-600" />
                        </div>
                        <h3 className="text-sm sm:text-base font-bold text-gray-900 truncate">Nouvelle irrigation</h3>
                    </div>
                    <button 
                        type="button"
                        onClick={onClose} 
                        className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors shrink-0"
                        aria-label="Fermer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form Body */}
                <div className="modal-scroll-area overflow-y-auto overflow-x-hidden flex-1 p-3.5 sm:p-5 space-y-3 sm:space-y-3.5 min-w-0 max-w-full">
                    {hasMissingData && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-start gap-2 min-w-0">
                            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <span>Veuillez vous assurer d'avoir configuré au moins un champ, une pompe et un enrouleur.</span>
                        </div>
                    )}

                    <form id="irrigation-form" onSubmit={handleSubmit} className="space-y-3 sm:space-y-3.5 min-w-0 max-w-full">
                        
                        {/* 0. Statut du tour d'eau */}
                        <div className="min-w-0">
                            <label className={labelClass}>Statut du tour d'eau</label>
                            <div className="grid grid-cols-2 gap-1.5 p-1 bg-gray-100 rounded-xl min-w-0">
                                <button
                                    type="button"
                                    onClick={() => setForm({ ...form, statut: 'lance' })}
                                    className={`py-2 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 min-w-0 ${
                                        form.statut === 'lance'
                                            ? 'bg-white text-emerald-800 shadow-xs'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                                    <span className="truncate">En direct (Suivi)</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setForm({ ...form, statut: 'fini' })}
                                    className={`py-2 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 min-w-0 ${
                                        form.statut === 'fini'
                                            ? 'bg-white text-gray-900 shadow-xs'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    <span className="truncate">Session passée</span>
                                </button>
                            </div>
                        </div>

                        {/* 1. Ligne Parcelle & Culture */}
                        <div className="grid grid-cols-2 gap-2 sm:gap-3 min-w-0">
                            <div className="min-w-0">
                                <label className={labelClass}>Parcelle *</label>
                                <select 
                                    value={form.champ_id} 
                                    onChange={e => setForm({ ...form, champ_id: e.target.value })} 
                                    required 
                                    className={inputClass}
                                >
                                    <option value="">Choisir...</option>
                                    {champs.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.nom_champ}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="min-w-0">
                                <label className={labelClass}>Culture *</label>
                                <input 
                                    type="text" 
                                    list="cultures-list"
                                    value={form.type_culture} 
                                    onChange={e => setForm({ ...form, type_culture: e.target.value })} 
                                    required 
                                    placeholder="ex: Maïs" 
                                    className={inputClass} 
                                />
                                <datalist id="cultures-list">
                                    {CULTURE_PRESETS.map(c => <option key={c} value={c} />)}
                                </datalist>
                            </div>
                        </div>

                        {/* 2. Ligne Pompe & Enrouleur */}
                        <div className="grid grid-cols-2 gap-2 sm:gap-3 min-w-0">
                            <div className="min-w-0">
                                <label className={labelClass}>Pompe *</label>
                                <select 
                                    value={form.pompe_id} 
                                    onChange={e => setForm({ ...form, pompe_id: e.target.value })} 
                                    required 
                                    className={inputClass}
                                >
                                    <option value="">Choisir...</option>
                                    {pompes.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.nom} ({parseFloat(p.debit_m3_h)} m³/h)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="min-w-0">
                                <label className={labelClass}>Enrouleur *</label>
                                <select 
                                    value={form.enrouleur_id} 
                                    onChange={e => handleEnrouleurChange(e.target.value)} 
                                    required 
                                    className={inputClass}
                                >
                                    <option value="">Choisir...</option>
                                    {enrouleurs.map(e => (
                                        <option key={e.id} value={e.id}>
                                            {e.nom}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* 3. Ligne Date & Heure */}
                        <div className="grid grid-cols-2 gap-2 sm:gap-3 min-w-0">
                            <div className="min-w-0">
                                <label className={labelClass}>Date *</label>
                                <input 
                                    type="date" 
                                    value={form.date_debut} 
                                    onChange={e => setForm({ ...form, date_debut: e.target.value })} 
                                    required 
                                    className={inputClass} 
                                />
                            </div>
                            <div className="min-w-0">
                                <label className={labelClass}>Heure départ *</label>
                                <input 
                                    type="time" 
                                    value={form.heure_debut} 
                                    onChange={e => setForm({ ...form, heure_debut: e.target.value })} 
                                    required 
                                    className={inputClass} 
                                />
                            </div>
                        </div>

                        {/* 4. Méthode de calcul */}
                        <div className="min-w-0">
                            <label className={labelClass}>Méthode de calcul</label>
                            <div className="grid grid-cols-2 gap-1.5 p-1 bg-gray-100 rounded-xl min-w-0">
                                <button
                                    type="button"
                                    onClick={() => setForm({ ...form, methode_calcul: 'dose', duree_h: '' })}
                                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all truncate ${
                                        form.methode_calcul === 'dose'
                                            ? 'bg-white text-gray-900 shadow-xs'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    Par Dose (mm)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setForm({ ...form, methode_calcul: 'temps', dose_mm: '', distance_deroulee: '' })}
                                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all truncate ${
                                        form.methode_calcul === 'temps'
                                            ? 'bg-white text-gray-900 shadow-xs'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    Par Durée (h)
                                </button>
                            </div>
                        </div>

                        {/* 5. Paramètres selon méthode */}
                        {form.methode_calcul === 'dose' ? (
                            <div className="space-y-2 min-w-0">
                                <div className="grid grid-cols-2 gap-2 sm:gap-3 min-w-0">
                                    <div className="min-w-0">
                                        <label className={labelClass}>Distance (m) *</label>
                                        <input
                                            type="number"
                                            step="1"
                                            min="1"
                                            inputMode="numeric"
                                            value={form.distance_deroulee}
                                            onChange={e => setForm({ ...form, distance_deroulee: e.target.value })}
                                            required
                                            placeholder="ex: 400"
                                            className={inputClass}
                                        />
                                    </div>
                                    <div className="min-w-0">
                                        <label className={labelClass}>Dose (mm) *</label>
                                        <input
                                            type="number"
                                            step="0.5"
                                            min="0.5"
                                            inputMode="decimal"
                                            value={form.dose_mm}
                                            onChange={e => setForm({ ...form, dose_mm: e.target.value })}
                                            required
                                            placeholder="ex: 25"
                                            className={inputClass}
                                        />
                                    </div>
                                </div>
                                {/* Puces de dose réparties en grille fixe sans dépassement */}
                                <div className="grid grid-cols-5 gap-1 min-w-0 w-full">
                                    {DOSE_PRESETS.map(d => (
                                        <button
                                            key={d}
                                            type="button"
                                            onClick={() => setForm({ ...form, dose_mm: String(d) })}
                                            className={`py-1 px-0.5 rounded-lg text-[11px] font-bold border transition-all text-center truncate ${
                                                parseFloat(form.dose_mm) === d 
                                                    ? 'bg-cyan-50 border-cyan-400 text-cyan-900 font-bold' 
                                                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                            }`}
                                        >
                                            {d}mm
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="min-w-0">
                                <label className={labelClass}>Durée d'arrosage (heures) *</label>
                                <input
                                    type="number"
                                    step="0.25"
                                    min="0.25"
                                    inputMode="decimal"
                                    value={form.duree_h}
                                    onChange={e => setForm({ ...form, duree_h: e.target.value })}
                                    required
                                    placeholder="ex: 4.5"
                                    className={inputClass}
                                />
                            </div>
                        )}

                        {/* 6. Résumé du calcul (Compact, zéro débordement) */}
                        {calc && (
                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs space-y-2 min-w-0">
                                <div className="flex items-baseline justify-between border-b border-gray-200/80 pb-2 min-w-0">
                                    <span className="text-gray-500 font-medium truncate">Volume estimé</span>
                                    <span className="font-bold text-gray-900 text-xs sm:text-sm tabular-nums truncate">
                                        {calc.volume_m3.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} m³
                                        <span className="text-[11px] font-normal text-gray-500 ml-1 hidden xs:inline">
                                            ({calc.volume_litres.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} L)
                                        </span>
                                    </span>
                                </div>

                                <div className="grid grid-cols-3 gap-1 text-center pt-0.5 min-w-0">
                                    <div className="min-w-0">
                                        <span className="text-gray-400 block text-[10px] uppercase font-semibold truncate">Vitesse</span>
                                        <span className="font-bold text-cyan-800 text-xs tabular-nums truncate block">
                                            {calc.vitesse_m_h ? `${Math.round(calc.vitesse_m_h)} m/h` : '-'}
                                        </span>
                                    </div>
                                    <div className="min-w-0">
                                        <span className="text-gray-400 block text-[10px] uppercase font-semibold truncate">Durée</span>
                                        <span className="font-bold text-gray-900 text-xs tabular-nums truncate block">
                                            {calc.duree_h ? `${Math.floor(calc.duree_h)}h${String(Math.round((calc.duree_h % 1) * 60)).padStart(2, '0')}` : '-'}
                                        </span>
                                    </div>
                                    <div className="min-w-0">
                                        <span className="text-gray-400 block text-[10px] uppercase font-semibold truncate">Fin</span>
                                        <span className="font-bold text-gray-900 text-xs tabular-nums truncate block">
                                            {calc.date_fin ? calc.date_fin.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                {/* Footer (Grid fixe 3 colonnes) */}
                <div className="shrink-0 px-3.5 sm:px-5 py-3 bg-white border-t border-gray-200 grid grid-cols-3 gap-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] min-w-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="col-span-1 py-2.5 px-2 text-xs sm:text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors text-center truncate"
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        form="irrigation-form"
                        disabled={isSubmitting || hasMissingData}
                        className="col-span-2 py-2.5 px-2 text-xs sm:text-sm font-bold text-white bg-gray-900 hover:bg-black rounded-xl transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 truncate shadow-xs"
                    >
                        {isSubmitting ? (
                            <span className="truncate">Enregistrement...</span>
                        ) : form.statut === 'lance' ? (
                            <span className="truncate">Démarrer le tour</span>
                        ) : (
                            <span className="truncate">Enregistrer</span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default IrrigationModal;
