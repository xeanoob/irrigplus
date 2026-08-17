import React, { useState, useEffect, useMemo } from 'react';
import { X, Droplets, Gauge, Timer, MapPin, Wrench, Calendar, Sparkles, AlertCircle, Check, Play, CheckCircle2, Zap, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const CULTURE_CHIPS = ['Maïs', 'Blé', 'Soja', 'Tournesol', 'Colza', 'Orge', 'Pois'];
const DOSE_PRESETS = [15, 20, 25, 30, 35];
const DURATION_PRESETS = [2, 4, 6, 8, 12];

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
        statut: 'lance', // 'lance' (en direct) or 'fini' (terminé)
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

    // Selected items
    const selectedChamp = useMemo(() => {
        if (!form.champ_id) return null;
        return champs.find(c => c.id === parseInt(form.champ_id)) || null;
    }, [form.champ_id, champs]);

    const selectedEnrouleur = useMemo(() => {
        if (!form.enrouleur_id) return null;
        return enrouleurs.find(e => e.id === parseInt(form.enrouleur_id)) || null;
    }, [form.enrouleur_id, enrouleurs]);

    const selectedPompe = useMemo(() => {
        if (!form.pompe_id) return null;
        return pompes.find(p => p.id === parseInt(form.pompe_id)) || null;
    }, [form.pompe_id, pompes]);

    // Update largeur_travail when enrouleur changes
    const handleEnrouleurChange = (enrouleurId) => {
        const enr = enrouleurs.find(e => e.id === parseInt(enrouleurId));
        setForm(prev => ({
            ...prev,
            enrouleur_id: enrouleurId,
            largeur_travail: enr?.surface_travail ? String(parseFloat(enr.surface_travail)) : prev.largeur_travail
        }));
    };

    // Live calculation
    const calcDetails = useMemo(() => {
        const startDateTime = new Date(`${form.date_debut}T${form.heure_debut || '12:00'}:00`);

        if (form.methode_calcul === 'dose') {
            const distance = parseFloat(form.distance_deroulee);
            const largeur = parseFloat(form.largeur_travail) || (selectedEnrouleur ? parseFloat(selectedEnrouleur.surface_travail) : 0);
            const dose = parseFloat(form.dose_mm);
            if (distance > 0 && largeur > 0 && dose > 0) {
                const surface_m2 = distance * largeur;
                const surface_ha = surface_m2 / 10000;
                const volume_m3 = surface_ha * (dose * 10);
                const volume_litres = volume_m3 * 1000;
                const debit = selectedPompe ? parseFloat(selectedPompe.debit_m3_h) : 0;
                const heures_estimees = debit > 0 ? volume_m3 / debit : null;

                // Speed calculation (m/h)
                const vitesse_m_h = heures_estimees && heures_estimees > 0 ? distance / heures_estimees : null;

                // End date calculation
                const date_fin_estimee = heures_estimees 
                    ? new Date(startDateTime.getTime() + heures_estimees * 3600 * 1000) 
                    : null;

                return { surface_m2, surface_ha, volume_m3, volume_litres, heures_estimees, vitesse_m_h, date_fin_estimee };
            }
        } else {
            const debit = selectedPompe ? parseFloat(selectedPompe.debit_m3_h) : 0;
            const temps = parseFloat(form.duree_h);
            if (debit > 0 && temps > 0) {
                const volume_m3 = debit * temps;
                const volume_litres = volume_m3 * 1000;
                const date_fin_estimee = new Date(startDateTime.getTime() + temps * 3600 * 1000);
                return { volume_m3, volume_litres, heures_estimees: temps, date_fin_estimee };
            }
        }
        return null;
    }, [form, selectedEnrouleur, selectedPompe]);

    const handleSubmit = (e) => {
        e.preventDefault();

        // Explicit JavaScript validation
        if (!form.champ_id) {
            toast.error('Veuillez sélectionner un champ.');
            return;
        }
        if (!form.type_culture.trim()) {
            toast.error('Veuillez renseigner le type de culture.');
            return;
        }
        if (!form.pompe_id) {
            toast.error('Veuillez sélectionner une pompe.');
            return;
        }
        if (!form.enrouleur_id) {
            toast.error('Veuillez sélectionner un enrouleur.');
            return;
        }

        if (form.methode_calcul === 'dose') {
            if (!form.distance_deroulee || parseFloat(form.distance_deroulee) <= 0) {
                toast.error('Veuillez indiquer la distance déroulée (en mètres).');
                return;
            }
            if (!form.dose_mm || parseFloat(form.dose_mm) <= 0) {
                toast.error('Veuillez indiquer la dose souhaitée (en mm).');
                return;
            }
        } else {
            if (!form.duree_h || parseFloat(form.duree_h) <= 0) {
                toast.error('Veuillez indiquer la durée d\'arrosage (en heures).');
                return;
            }
        }

        const fullDateDebut = new Date(`${form.date_debut}T${form.heure_debut || '12:00'}:00`).toISOString();

        const submitData = {
            champ_id: form.champ_id,
            pompe_id: form.pompe_id,
            enrouleur_id: form.enrouleur_id,
            type_culture: form.type_culture,
            date_debut: fullDateDebut,
            methode_calcul: form.methode_calcul,
            distance_deroulee: form.distance_deroulee || null,
            dose_mm: form.dose_mm || null,
            duree_h: calcDetails?.heures_estimees ? String(calcDetails.heures_estimees) : form.duree_h || null,
            taille_buse_session: selectedEnrouleur?.taille_buse || '',
            largeur_travail: form.largeur_travail || (selectedEnrouleur?.surface_travail ? String(parseFloat(selectedEnrouleur.surface_travail)) : ''),
            statut: form.statut,
        };
        onSubmit(submitData);
    };

    if (!isOpen) return null;

    const inputClass = "w-full bg-white border border-gray-300 rounded-xl px-3.5 py-3 text-base text-gray-900 focus:ring-2 focus:ring-cyan-600 focus:border-cyan-600 outline-none transition-all";
    const labelClass = "block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5";

    const hasNoChamps = champs.length === 0;
    const hasNoPompes = pompes.length === 0;
    const hasNoEnrouleurs = enrouleurs.length === 0;
    const isMissingPrerequisites = hasNoChamps || hasNoPompes || hasNoEnrouleurs;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center animate-in fade-in duration-200">
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
                onClick={onClose} 
                aria-hidden="true"
            />

            {/* Modal Container */}
            <div 
                className="relative bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg z-10 flex flex-col overflow-hidden max-h-[92dvh] sm:max-h-[90vh] animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
            >
                {/* Mobile Pull Handle */}
                <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

                {/* Header (Fixed) */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 shrink-0 bg-white">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-gradient-to-tr from-cyan-600 to-blue-600 text-white rounded-xl shadow-xs">
                            <Droplets className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-gray-900 leading-tight">Nouvelle irrigation</h3>
                            <p className="text-[11px] text-gray-500 font-medium">Calculateur d'enrouleur & minuteur</p>
                        </div>
                    </div>
                    <button 
                        type="button"
                        onClick={onClose} 
                        className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center" 
                        aria-label="Fermer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable Form Body */}
                <div className="modal-scroll-area overflow-y-auto flex-1 min-h-0 overscroll-contain px-4 sm:px-6 py-4 space-y-4">
                    {/* Warning if missing prerequisites */}
                    {isMissingPrerequisites && (
                        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-800 text-xs leading-relaxed">
                            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold">Données incomplètes :</p>
                                <ul className="list-disc list-inside mt-1 space-y-0.5 text-amber-700">
                                    {hasNoChamps && <li>Aucun champ créé</li>}
                                    {hasNoPompes && <li>Aucune pompe créée</li>}
                                    {hasNoEnrouleurs && <li>Aucun enrouleur créé</li>}
                                </ul>
                                <p className="mt-1 font-medium text-amber-900">Veuillez d'abord enregistrer votre matériel.</p>
                            </div>
                        </div>
                    )}

                    <form id="irrigation-form" onSubmit={handleSubmit} className="space-y-4">
                        
                        {/* 0. Choix du statut (Démarrer en direct ou session déjà terminée) */}
                        <div>
                            <label className={labelClass}>Statut du tour d'eau</label>
                            <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-2xl">
                                <button
                                    type="button"
                                    onClick={() => setForm({ ...form, statut: 'lance' })}
                                    className={`py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                        form.statut === 'lance'
                                            ? 'bg-emerald-500 text-gray-950 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    <Play className="w-4 h-4 fill-current" />
                                    Démarrer maintenant (En cours)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setForm({ ...form, statut: 'fini' })}
                                    className={`py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                        form.statut === 'fini'
                                            ? 'bg-white text-gray-900 shadow-sm border border-gray-200/80'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    <CheckCircle2 className="w-4 h-4 text-gray-500" />
                                    Déjà terminée (Historique)
                                </button>
                            </div>
                        </div>

                        {/* 1. Champ & Culture */}
                        <div className="space-y-3 bg-gray-50/80 p-3.5 rounded-2xl border border-gray-100">
                            <div>
                                <label className={labelClass}>
                                    <MapPin className="w-3.5 h-3.5 inline mr-1 text-emerald-600" />
                                    Champ (Parcelle) *
                                </label>
                                <select 
                                    value={form.champ_id} 
                                    onChange={e => setForm({ ...form, champ_id: e.target.value })} 
                                    required 
                                    className={inputClass}
                                >
                                    <option value="">Sélectionner une parcelle...</option>
                                    {champs.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.nom_champ} — {(parseFloat(c.surface_m2) / 10000).toFixed(2)} ha ({parseFloat(c.surface_m2).toLocaleString('fr-FR')} m²)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className={labelClass}>Culture *</label>
                                {/* Quick culture chips */}
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                    {CULTURE_CHIPS.map(cult => (
                                        <button
                                            key={cult}
                                            type="button"
                                            onClick={() => setForm({ ...form, type_culture: cult })}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                                form.type_culture === cult 
                                                    ? 'bg-cyan-600 text-white shadow-xs' 
                                                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100 active:scale-95'
                                            }`}
                                        >
                                            {cult}
                                        </button>
                                    ))}
                                </div>
                                <input 
                                    type="text" 
                                    value={form.type_culture} 
                                    onChange={e => setForm({ ...form, type_culture: e.target.value })} 
                                    required 
                                    placeholder="Ou saisir une autre culture..." 
                                    className={inputClass} 
                                />
                            </div>
                        </div>

                        {/* 2. Matériel (Pompe & Enrouleur) */}
                        <div className="space-y-3 bg-gray-50/80 p-3.5 rounded-2xl border border-gray-100">
                            <div>
                                <label className={labelClass}>
                                    <Gauge className="w-3.5 h-3.5 inline mr-1 text-cyan-600" />
                                    Pompe utilisée *
                                </label>
                                <select 
                                    value={form.pompe_id} 
                                    onChange={e => setForm({ ...form, pompe_id: e.target.value })} 
                                    required 
                                    className={inputClass}
                                >
                                    <option value="">Sélectionner la pompe...</option>
                                    {pompes.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.nom} — {parseFloat(p.debit_m3_h).toLocaleString('fr-FR')} m³/h
                                        </option>
                                    ))}
                                </select>
                                {selectedPompe && (
                                    <p className="text-xs text-cyan-700 font-medium mt-1 pl-1">
                                        Débit de pompage : <span className="font-bold">{parseFloat(selectedPompe.debit_m3_h).toLocaleString('fr-FR')} m³/h</span>
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className={labelClass}>
                                    <Wrench className="w-3.5 h-3.5 inline mr-1 text-blue-600" />
                                    Enrouleur *
                                </label>
                                <select 
                                    value={form.enrouleur_id} 
                                    onChange={e => handleEnrouleurChange(e.target.value)} 
                                    required 
                                    className={inputClass}
                                >
                                    <option value="">Sélectionner l'enrouleur...</option>
                                    {enrouleurs.map(e => (
                                        <option key={e.id} value={e.id}>
                                            {e.nom} (Buse {e.taille_buse}{e.surface_travail ? ` — ${parseFloat(e.surface_travail)}m` : ''})
                                        </option>
                                    ))}
                                </select>
                                {selectedEnrouleur && (
                                    <div className="flex items-center gap-3 mt-1 pl-1 text-xs text-blue-700 font-medium">
                                        <span>Buse : <strong className="font-bold">{selectedEnrouleur.taille_buse}</strong></span>
                                        <span>•</span>
                                        <span>Largeur : <strong className="font-bold">{parseFloat(form.largeur_travail || selectedEnrouleur.surface_travail || 0)}m</strong></span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 3. Date & Heure de départ */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className={labelClass}>
                                    <Calendar className="w-3.5 h-3.5 inline mr-1 text-gray-500" />
                                    Date *
                                </label>
                                <input 
                                    type="date" 
                                    value={form.date_debut} 
                                    onChange={e => setForm({ ...form, date_debut: e.target.value })} 
                                    required 
                                    className={inputClass} 
                                />
                            </div>
                            <div>
                                <label className={labelClass}>
                                    <Clock className="w-3.5 h-3.5 inline mr-1 text-gray-500" />
                                    Heure de départ *
                                </label>
                                <input 
                                    type="time" 
                                    value={form.heure_debut} 
                                    onChange={e => setForm({ ...form, heure_debut: e.target.value })} 
                                    required 
                                    className={inputClass} 
                                />
                            </div>
                        </div>

                        {/* 4. Méthode de calcul Toggle */}
                        <div>
                            <label className={labelClass}>Méthode de calcul</label>
                            <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-2xl">
                                <button
                                    type="button"
                                    onClick={() => setForm({ ...form, methode_calcul: 'dose', duree_h: '' })}
                                    className={`py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                        form.methode_calcul === 'dose'
                                            ? 'bg-white text-gray-900 shadow-sm border border-gray-200/80'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    <Droplets className="w-4 h-4 text-cyan-600" />
                                    Par Dose (mm)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setForm({ ...form, methode_calcul: 'temps', dose_mm: '', distance_deroulee: '' })}
                                    className={`py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                        form.methode_calcul === 'temps'
                                            ? 'bg-white text-gray-900 shadow-sm border border-gray-200/80'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    <Timer className="w-4 h-4 text-blue-600" />
                                    Par Durée (h)
                                </button>
                            </div>
                        </div>

                        {/* 5. Paramètres selon mode */}
                        {form.methode_calcul === 'dose' ? (
                            <div className="space-y-3 bg-cyan-50/40 p-3.5 rounded-2xl border border-cyan-100">
                                <div>
                                    <label className={labelClass}>Distance déroulée (mètres) *</label>
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
                                    {/* Quick dose presets */}
                                    <div className="flex gap-1.5 mb-2 overflow-x-auto pb-1">
                                        {DOSE_PRESETS.map(dose => (
                                            <button
                                                key={dose}
                                                type="button"
                                                onClick={() => setForm({ ...form, dose_mm: String(dose) })}
                                                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                    parseFloat(form.dose_mm) === dose
                                                        ? 'bg-cyan-600 text-white shadow-xs'
                                                        : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                                                }`}
                                            >
                                                {dose} mm
                                            </button>
                                        ))}
                                    </div>
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
                        ) : (
                            <div className="space-y-3 bg-blue-50/40 p-3.5 rounded-2xl border border-blue-100">
                                <div>
                                    <label className={labelClass}>Durée d'arrosage (heures) *</label>
                                    {/* Quick duration presets */}
                                    <div className="flex gap-1.5 mb-2 overflow-x-auto pb-1">
                                        {DURATION_PRESETS.map(h => (
                                            <button
                                                key={h}
                                                type="button"
                                                onClick={() => setForm({ ...form, duree_h: String(h) })}
                                                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                    parseFloat(form.duree_h) === h
                                                        ? 'bg-blue-600 text-white shadow-xs'
                                                        : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                                                }`}
                                            >
                                                {h} h
                                            </button>
                                        ))}
                                    </div>
                                    <input
                                        type="number"
                                        step="0.25"
                                        min="0.25"
                                        inputMode="decimal"
                                        value={form.duree_h}
                                        onChange={e => setForm({ ...form, duree_h: e.target.value })}
                                        required
                                        placeholder="ex: 3.5"
                                        className={inputClass}
                                    />
                                </div>
                            </div>
                        )}

                        {/* 6. Résultat & Calculateur d'enrouleur en direct */}
                        {calcDetails && (
                            <div className="bg-gradient-to-br from-slate-950 via-gray-900 to-cyan-950 rounded-2xl p-4 text-white shadow-lg border border-cyan-500/20 animate-in zoom-in-95 duration-150">
                                <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest flex items-center justify-center gap-1 mb-1">
                                    <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                                    Calculateur de fin d'enrouleur
                                </p>

                                <div className="text-center my-2">
                                    <p className="text-3xl sm:text-4xl font-black text-white tabular-nums tracking-tight">
                                        {calcDetails.volume_litres.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
                                        <span className="text-base font-bold text-cyan-400 ml-1.5">Litres</span>
                                    </p>
                                    <p className="text-xs text-gray-300 mt-0.5 tabular-nums">
                                        soit <strong className="font-bold text-white">{calcDetails.volume_m3.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} m³</strong>
                                        {calcDetails.surface_ha && ` • ${calcDetails.surface_ha.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} ha`}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/10 text-xs">
                                    {/* Durée estimée */}
                                    {calcDetails.heures_estimees != null && (
                                        <div className="bg-white/10 p-2 rounded-xl text-center">
                                            <span className="text-[10px] text-gray-400 uppercase font-semibold block">Durée totale</span>
                                            <span className="font-extrabold text-white tabular-nums text-sm">
                                                {Math.floor(calcDetails.heures_estimees)}h{String(Math.round((calcDetails.heures_estimees % 1) * 60)).padStart(2, '0')}
                                            </span>
                                        </div>
                                    )}

                                    {/* Vitesse recommandée */}
                                    {calcDetails.vitesse_m_h != null && (
                                        <div className="bg-white/10 p-2 rounded-xl text-center">
                                            <span className="text-[10px] text-cyan-300 uppercase font-semibold block flex items-center justify-center gap-0.5">
                                                <Zap className="w-2.5 h-2.5 text-cyan-400" /> Vitesse enrouleur
                                            </span>
                                            <span className="font-extrabold text-cyan-300 tabular-nums text-sm">
                                                {Math.round(calcDetails.vitesse_m_h)} m/h
                                            </span>
                                        </div>
                                    )}

                                    {/* Heure de fin estimée */}
                                    {calcDetails.date_fin_estimee && (
                                        <div className="bg-white/10 p-2 rounded-xl text-center col-span-2 sm:col-span-1">
                                            <span className="text-[10px] text-emerald-400 uppercase font-semibold block flex items-center justify-center gap-0.5">
                                                <Clock className="w-2.5 h-2.5 text-emerald-400" /> Fin prévue à
                                            </span>
                                            <span className="font-extrabold text-emerald-300 tabular-nums text-sm">
                                                {calcDetails.date_fin_estimee.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                {/* Sticky Footer (Always visible above keyboard & safe area) */}
                <div className="shrink-0 px-4 sm:px-6 py-3.5 bg-white border-t border-gray-100 flex gap-3 shadow-[0_-4px_16px_rgba(0,0,0,0.04)] z-20">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-3 px-4 text-sm font-bold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 active:scale-[0.97] transition-all min-h-[48px] flex items-center justify-center"
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        form="irrigation-form"
                        disabled={isSubmitting || isMissingPrerequisites}
                        className={`flex-2 py-3 px-4 text-sm font-bold rounded-xl active:scale-[0.97] transition-all shadow-md min-h-[48px] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                            form.statut === 'lance'
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-gray-950 hover:brightness-105'
                                : 'bg-gradient-to-r from-gray-900 to-gray-800 text-white hover:from-black'
                        }`}
                    >
                        {isSubmitting ? (
                            <span>Enregistrement...</span>
                        ) : form.statut === 'lance' ? (
                            <>
                                <Play className="w-4 h-4 fill-current stroke-[1]" />
                                <span>Démarrer le tour d'eau</span>
                            </>
                        ) : (
                            <>
                                <Check className="w-4 h-4 text-cyan-400 stroke-[3]" />
                                <span>Enregistrer la session</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default IrrigationModal;
