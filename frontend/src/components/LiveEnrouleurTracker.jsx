import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Droplets, CheckCircle2, Clock, Gauge, AlertCircle } from 'lucide-react';
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
            toast.success(`Tour d'eau terminé sur « ${champNom} »`);
            fetchActives();
            if (onStatusChanged) onStatusChanged();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Erreur');
        }
    };

    if (loading || actives.length === 0) return null;

    return (
        <div className="flex flex-col gap-3">
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

                const remainingHours = Math.floor(remainingMs / (3600 * 1000));
                const remainingMins = Math.floor((remainingMs % (3600 * 1000)) / (60 * 1000));

                const vitesseMh = item.distance_deroulee && dureeHours > 0 
                    ? Math.round(parseFloat(item.distance_deroulee) / dureeHours) 
                    : null;

                const currentVolumeM3 = (parseFloat(item.volume_total_m3) * (progressPercent / 100)).toFixed(1);

                return (
                    <div 
                        key={item.id}
                        className="bg-white border border-cyan-200/80 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col gap-3.5"
                    >
                        {/* En-tête statut */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                    Enrouleur en cours
                                </span>
                                <span className="text-xs text-gray-500 font-medium">
                                    Démarré à {startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={() => handleTerminate(item.id, item.champ_nom)}
                                className="text-xs font-semibold text-gray-700 hover:text-red-600 bg-gray-50 hover:bg-red-50 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                            >
                                <CheckCircle2 className="w-3.5 h-3.5 text-gray-400 group-hover:text-red-500" />
                                Terminer la session
                            </button>
                        </div>

                        {/* Infos principales */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                                <h3 className="text-base sm:text-lg font-bold text-gray-900">
                                    {item.champ_nom}
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {item.type_culture}
                                    {item.enrouleur_nom && ` • ${item.enrouleur_nom}`}
                                    {item.pompe_nom && ` • ${item.pompe_nom}`}
                                    {item.dose_mm && ` (${parseFloat(item.dose_mm)} mm)`}
                                </p>
                            </div>

                            <div className="text-left sm:text-right">
                                <span className="text-xs text-gray-400 block">Fin estimée</span>
                                <span className="text-sm sm:text-base font-bold text-gray-900 tabular-nums">
                                    {endDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                    <span className="text-xs font-normal text-gray-500 ml-1">
                                        ({endDate.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })})
                                    </span>
                                </span>
                            </div>
                        </div>

                        {/* Barre de progression sobre */}
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-xs tabular-nums text-gray-600 font-medium">
                                <span>{progressPercent.toFixed(0)}% réalisé ({parseFloat(currentVolumeM3).toLocaleString('fr-FR')} / {parseFloat(item.volume_total_m3).toLocaleString('fr-FR')} m³)</span>
                                <span className={isOverdue ? 'text-amber-600 font-bold' : 'text-cyan-700 font-bold'}>
                                    {isOverdue ? 'Temps dépassé' : `Reste ${remainingHours}h ${String(remainingMins).padStart(2, '0')}m`}
                                </span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                <div 
                                    className="h-full rounded-full bg-cyan-600 transition-all duration-500"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                        </div>

                        {/* Détails complémentaires */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-gray-100 text-xs">
                            <div className="text-gray-600">
                                <span className="text-gray-400 block text-[11px]">Vitesse programmée</span>
                                <span className="font-semibold text-gray-900">{vitesseMh ? `${vitesseMh} m/h` : '-'}</span>
                            </div>
                            <div className="text-gray-600">
                                <span className="text-gray-400 block text-[11px]">Distance déroulée</span>
                                <span className="font-semibold text-gray-900">{item.distance_deroulee ? `${parseFloat(item.distance_deroulee)} m` : '-'}</span>
                            </div>
                            <div className="text-gray-600 col-span-2 sm:col-span-1">
                                <span className="text-gray-400 block text-[11px]">Durée totale</span>
                                <span className="font-semibold text-gray-900">{Math.floor(dureeHours)}h{String(Math.round((dureeHours % 1) * 60)).padStart(2, '0')}</span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default LiveEnrouleurTracker;
