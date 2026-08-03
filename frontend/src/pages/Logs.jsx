import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ScrollText, Droplets, MapPin, Settings2, Replace, Users, LogIn, CheckCircle, Activity, Trash2, Pencil, Plus, FileText, ChevronLeft, ChevronRight, Filter, Clock } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Icons & colors per action/entity
const getLogMeta = (log) => {
    const map = {
        'create:irrigation': { icon: Droplets, color: 'bg-cyan-50 text-cyan-600 border-cyan-100', accent: 'border-l-cyan-500' },
        'status_change:irrigation': { icon: Activity, color: 'bg-amber-50 text-amber-600 border-amber-100', accent: 'border-l-amber-500' },
        'create:champ': { icon: MapPin, color: 'bg-emerald-50 text-emerald-600 border-emerald-100', accent: 'border-l-emerald-500' },
        'update:champ': { icon: Pencil, color: 'bg-blue-50 text-blue-600 border-blue-100', accent: 'border-l-blue-500' },
        'delete:champ': { icon: Trash2, color: 'bg-red-50 text-red-600 border-red-100', accent: 'border-l-red-500' },
        'create:pompe': { icon: Settings2, color: 'bg-emerald-50 text-emerald-600 border-emerald-100', accent: 'border-l-emerald-500' },
        'update:pompe': { icon: Pencil, color: 'bg-blue-50 text-blue-600 border-blue-100', accent: 'border-l-blue-500' },
        'delete:pompe': { icon: Trash2, color: 'bg-red-50 text-red-600 border-red-100', accent: 'border-l-red-500' },
        'create:enrouleur': { icon: Replace, color: 'bg-emerald-50 text-emerald-600 border-emerald-100', accent: 'border-l-emerald-500' },
        'update:enrouleur': { icon: Pencil, color: 'bg-blue-50 text-blue-600 border-blue-100', accent: 'border-l-blue-500' },
        'delete:enrouleur': { icon: Trash2, color: 'bg-red-50 text-red-600 border-red-100', accent: 'border-l-red-500' },
        'validate:compensation': { icon: CheckCircle, color: 'bg-purple-50 text-purple-600 border-purple-100', accent: 'border-l-purple-500' },
        'login:auth': { icon: LogIn, color: 'bg-gray-50 text-gray-500 border-gray-200', accent: 'border-l-gray-400' },
        'create:user': { icon: Users, color: 'bg-indigo-50 text-indigo-600 border-indigo-100', accent: 'border-l-indigo-500' },
        'update:user': { icon: Pencil, color: 'bg-blue-50 text-blue-600 border-blue-100', accent: 'border-l-blue-500' },
        'delete:user': { icon: Trash2, color: 'bg-red-50 text-red-600 border-red-100', accent: 'border-l-red-500' },
    };
    const key = `${log.action}:${log.entite}`;
    return map[key] || { icon: Activity, color: 'bg-gray-50 text-gray-500 border-gray-200', accent: 'border-l-gray-400' };
};

const entityLabels = {
    irrigation: 'Irrigation',
    champ: 'Champ',
    pompe: 'Pompe',
    enrouleur: 'Enrouleur',
    compensation: 'Compensation',
    user: 'Utilisateur',
    auth: 'Connexion',
};

const actionLabels = {
    create: 'Création',
    update: 'Modification',
    delete: 'Suppression',
    login: 'Connexion',
    validate: 'Validation',
    status_change: 'Statut',
    export: 'Export',
};

const formatTimeAgo = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    const diffH = Math.floor(diffMs / 3600000);
    const diffD = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return "À l'instant";
    if (diffMin < 60) return `Il y a ${diffMin} min`;
    if (diffH < 24) return `Il y a ${diffH}h`;
    if (diffD < 7) return `Il y a ${diffD}j`;
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
};

const Logs = () => {
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 1 });

    // Filters
    const [filterAction, setFilterAction] = useState('');
    const [filterEntite, setFilterEntite] = useState('');
    const [filterDateDebut, setFilterDateDebut] = useState('');
    const [filterDateFin, setFilterDateFin] = useState('');

    const fetchLogs = async (page = 1) => {
        try {
            const params = new URLSearchParams();
            params.set('page', page);
            params.set('limit', 50);
            if (filterAction) params.set('action', filterAction);
            if (filterEntite) params.set('entite', filterEntite);
            if (filterDateDebut) params.set('dateDebut', filterDateDebut);
            if (filterDateFin) params.set('dateFin', filterDateFin);

            const [logsRes, statsRes] = await Promise.all([
                axios.get(`${API_URL}/logs?${params.toString()}`),
                axios.get(`${API_URL}/logs/stats`),
            ]);

            setLogs(logsRes.data.data);
            setPagination(logsRes.data.pagination);
            setStats(statsRes.data);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    useEffect(() => { fetchLogs(1); }, [filterAction, filterEntite, filterDateDebut, filterDateFin]);

    // Group logs by date
    const groupedLogs = logs.reduce((groups, log) => {
        const date = new Date(log.created_at).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        if (!groups[date]) groups[date] = [];
        groups[date].push(log);
        return groups;
    }, {});

    if (loading) return <div className="text-sm text-gray-500 font-medium p-4">Chargement...</div>;

    return (
        <div className="max-w-4xl mx-auto flex flex-col gap-4 sm:gap-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-3 sm:p-4 rounded-md shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <ScrollText className="w-5 h-5 text-gray-400" />
                    Journal d'activité
                </h2>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="pro-card p-3 sm:p-4">
                        <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total</p>
                        <p className="text-lg sm:text-2xl font-bold text-gray-900 tabular-nums">{parseInt(stats.total).toLocaleString('fr-FR')}</p>
                    </div>
                    <div className="pro-card p-3 sm:p-4 bg-blue-50/20 border-blue-50">
                        <p className="text-[10px] sm:text-xs font-bold text-blue-500 uppercase tracking-widest mb-1">Aujourd'hui</p>
                        <p className="text-lg sm:text-2xl font-bold text-gray-900 tabular-nums">{parseInt(stats.today).toLocaleString('fr-FR')}</p>
                    </div>
                    <div className="pro-card p-3 sm:p-4">
                        <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Utilisateurs actifs</p>
                        <p className="text-lg sm:text-2xl font-bold text-gray-900 tabular-nums">{parseInt(stats.users_actifs).toLocaleString('fr-FR')}</p>
                    </div>
                    <div className="pro-card p-3 sm:p-4 bg-cyan-50/20 border-cyan-50">
                        <p className="text-[10px] sm:text-xs font-bold text-cyan-500 uppercase tracking-widest mb-1">Irrigations (auj.)</p>
                        <p className="text-lg sm:text-2xl font-bold text-gray-900 tabular-nums">{parseInt(stats.irrigations_today).toLocaleString('fr-FR')}</p>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="pro-card p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Filtres</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <select value={filterAction} onChange={e => setFilterAction(e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-gray-900 outline-none">
                        <option value="">Toutes les actions</option>
                        {Object.entries(actionLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <select value={filterEntite} onChange={e => setFilterEntite(e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-gray-900 outline-none">
                        <option value="">Toutes les entités</option>
                        {Object.entries(entityLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <input type="date" value={filterDateDebut} onChange={e => setFilterDateDebut(e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-gray-900 outline-none" />
                    <input type="date" value={filterDateFin} onChange={e => setFilterDateFin(e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-gray-900 outline-none" />
                </div>
            </div>

            {/* Timeline */}
            <div className="flex flex-col gap-6">
                {Object.entries(groupedLogs).map(([date, dateLogs]) => (
                    <div key={date}>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="h-px flex-1 bg-gray-200" />
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap capitalize">{date}</span>
                            <div className="h-px flex-1 bg-gray-200" />
                        </div>

                        <div className="flex flex-col gap-2">
                            {dateLogs.map(log => {
                                const meta = getLogMeta(log);
                                const Icon = meta.icon;
                                return (
                                    <div key={log.id}
                                        className={`pro-card p-3 sm:p-4 border-l-[3px] ${meta.accent} hover:shadow-md transition-shadow`}>
                                        <div className="flex items-start gap-3">
                                            <div className={`p-2 rounded-lg border shrink-0 ${meta.color}`}>
                                                <Icon className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-sm font-semibold text-gray-900">{log.user_nom || 'Système'}</span>
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{log.user_role}</span>
                                                </div>
                                                <p className="text-sm text-gray-700 mt-0.5 leading-relaxed">{log.description}</p>
                                                <div className="flex items-center gap-3 mt-2">
                                                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${meta.color}`}>
                                                        {entityLabels[log.entite] || log.entite}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-[10px] text-gray-400">
                                                        <Clock className="w-3 h-3" />
                                                        {formatTimeAgo(log.created_at)}
                                                    </span>
                                                    <span className="text-[10px] text-gray-300 tabular-nums hidden sm:inline">
                                                        {new Date(log.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}

                {logs.length === 0 && (
                    <div className="pro-card p-12 text-center">
                        <ScrollText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                        <p className="text-sm text-gray-400">Aucune activité enregistrée</p>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between bg-white px-4 py-3 rounded-md border border-gray-100 shadow-sm">
                    <p className="text-xs text-gray-500">
                        Page <span className="font-bold text-gray-900">{pagination.page}</span> sur <span className="font-bold text-gray-900">{pagination.totalPages}</span>
                        {' '}— <span className="font-medium">{pagination.total}</span> événements
                    </p>
                    <div className="flex gap-1">
                        <button
                            onClick={() => fetchLogs(pagination.page - 1)}
                            disabled={pagination.page <= 1}
                            className="p-2 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => fetchLogs(pagination.page + 1)}
                            disabled={pagination.page >= pagination.totalPages}
                            className="p-2 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Logs;
