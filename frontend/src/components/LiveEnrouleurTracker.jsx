import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Timer, CheckCircle2, Droplets, Gauge, AlertTriangle, ArrowRight, Zap, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const LiveEnrouleurTracker = ({ onStatusChanged }) => {
    const [actives, setActives] = useState([]);
    const [loading, setLoading] = useState(true);
    const [now, setNow] = useState(new Date());

    const fetchActives = async () => {
        try {
            const res = await axios.get(`${API_URL}/irrigations/actives`);
            setActives(res.data);
        } catch (err) {
            console.error('Erreur chargement irrigations actives:', err);
        } finally {
            setLoading(false);
        }
    };

    // Auto-refresh data every 30s, and update clock every 1s for ultra-smooth countdown
    useEffect(() => {
        fetchActives();
        const dataInterval = setInterval(fetchActives, 30000);
        const clockInterval = setInterval(() => setNow(new Date()), 1000);

        const handleSyncEvent = () => fetchActives();
        window.addEventListener('irrigations-synced', handleSyncEvent);

        return () => {
            clearInterval(dataInterval);
            clearInterval(clockInterval);
            window.removeEventListener('irrigations-synced', handleSyncEvent);
        };
    }, []);

    const handleTerminate = async (id, champNom) => {
        try {
            await axios.patch(`${API_URL}/irrigations/${id}/statut`, { statut: 'fini' });
            toast.success(`Tour d'eau terminé sur « ${champNom} » !`);
            fetchActives();
            if (onStatusChanged) onStatusChanged();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Erreur');
        }
    };

    if (loading || actives.length === 0) return null;

    return (
        <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-3 duration-300">
            {actives.map(item => {
                const startDate = new Date(item.date_debut);
                const dureeHours = parseFloat(item.duree_h) || 
                    (item.pompe_debit && parseFloat(item.volume_total_m3) > 0 
                        ? parseFloat(item.volume_total_m3) / parseFloat(item.pompe_debit) 
                        : 0);

                const totalDurationMs = dureeHours * 3600 * 1000;
                const endDate = new Date(startDate.getTime() + totalDurationMs);
                const elapsedMs = Math.max(0, now.getTime() - startDate.getTime());
                const remainingMs = Math.max(0, endDate.getTime() - now.getTime());

                const progressPercent = totalDurationMs > 0 
                    ? Math.min(100, Math.max(0, (elapsedMs / totalDurationMs) * 100)) 
                    : 0;

                const isOverdue = now.getTime() > endDate.getTime() && totalDurationMs > 0;

                // Formatting countdown
                const remainingHours = Math.floor(remainingMs / (3600 * 1000));
                const remainingMins = Math.floor((remainingMs % (3600 * 1000)) / (60 * 1000));
                const remainingSecs = Math.floor((remainingMs % (60 * 1000)) / 1000);

                // Speed calculation
                const vitesseMh = item.distance_deroulee && dureeHours > 0 
                    ? Math.round(parseFloat(item.distance_deroulee) / dureeHours) 
                    : null;

                // Current sprayed volume estimation
                const currentVolumeM3 = (parseFloat(item.volume_total_m3) * (progressPercent / 100)).toFixed(1);

                return (
                    <div 
                        key={item.id}
                        className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-gray-900 to-cyan-950 text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-cyan-500/30"
                    >
                        {/* Background glow decoration */}
                        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

                        {/* Top Bar : Badges & Status */}
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5">
                            <div className="flex items-center gap-2">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                </span>
                                <span className="text-xs font-black tracking-wider uppercase text-emerald-400">
                                    Enrouleur en cours
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                {vitesseMh && (
                                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white/10 text-cyan-200 border border-white/10 flex items-center gap-1">
                                        <Zap className="w-3 h-3 text-cyan-400" />
                                        {vitesseMh} m/h
                                    </span>
                                )}
                                <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/10 text-gray-300">
                                    {item.pompe_nom}
                                </span>
                            </div>
                        </div>

                        {/* Middle Info : Field & Crop */}
                        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-4 mb-4">
                            <div>
                                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight leading-tight">
                                    {item.champ_nom}
                                </h3>
                                <p className="text-xs text-cyan-300 font-medium mt-0.5">
                                    Culture : <span className="text-white font-bold">{item.type_culture}</span>
                                    {item.enrouleur_nom && <span> • {item.enrouleur_nom}</span>}
                                    {item.dose_mm && <span> • Dose {parseFloat(item.dose_mm)} mm</span>}
                                </p>
                            </div>

                            {/* End estimation time */}
                            <div className="text-left sm:text-right mt-2 sm:mt-0">
                                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Fin estimée</p>
                                <p className="text-base sm:text-lg font-black text-cyan-300 tabular-nums">
                                    {endDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                    <span className="text-xs font-semibold text-gray-400 ml-1">
                                        ({endDate.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })})
                                    </span>
                                </p>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1.5 mb-4">
                            <div className="flex justify-between text-xs font-bold tabular-nums">
                                <span className="text-cyan-300">{progressPercent.toFixed(0)}% effectué</span>
                                <span className={isOverdue ? 'text-amber-400 font-black' : 'text-gray-300'}>
                                    {isOverdue ? (
                                        <span className="flex items-center gap-1">
                                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Temps dépassé
                                        </span>
                                    ) : (
                                        `Reste ${remainingHours}h ${String(remainingMins).padStart(2, '0')}m`
                                    )}
                                </span>
                            </div>

                            <div className="w-full bg-white/10 rounded-full h-3.5 p-0.5 overflow-hidden border border-white/10">
                                <div 
                                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 transition-all duration-1000 shadow-sm"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                        </div>

                        {/* Bottom Stats & Action */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-white/10">
                            <div className="flex items-center gap-4 text-xs text-gray-300">
                                <div>
                                    <span className="text-[10px] text-gray-400 uppercase block">Volume pompé</span>
                                    <span className="font-bold text-white tabular-nums">
                                        {parseFloat(currentVolumeM3).toLocaleString('fr-FR')} / {parseFloat(item.volume_total_m3).toLocaleString('fr-FR')} m³
                                    </span>
                                </div>
                                {item.distance_deroulee && (
                                    <div>
                                        <span className="text-[10px] text-gray-400 uppercase block">Distance</span>
                                        <span className="font-bold text-white tabular-nums">
                                            {parseFloat(item.distance_deroulee)} m
                                        </span>
                                    </div>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={() => handleTerminate(item.id, item.champ_nom)}
                                className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-gray-950 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md min-h-[42px]"
                            >
                                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                                <span>Arrêter / Terminer le tour d'eau</span>
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default LiveEnrouleurTracker;
