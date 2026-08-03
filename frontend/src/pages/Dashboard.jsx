import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Droplets, MapPin, Wrench, Calendar, BarChart2, Activity, Users } from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useAuth } from '../context/AuthContext';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const API_URL = import.meta.env.VITE_API_URL || '/api';

const Dashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [range, setRange] = useState('7days');
    const [loading, setLoading] = useState(true);

    const ranges = [
        { value: '7days', label: '7 derniers jours' },
        { value: '30days', label: '30 derniers jours' },
        { value: 'lastMonth', label: 'Mois dernier' },
        { value: '3months', label: '3 derniers mois' },
        { value: 'thisYear', label: 'Cette année' },
        { value: 'lastYear', label: 'L\'année dernière' }
    ];

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const res = await axios.get(`${API_URL}/dashboard/stats?range=${range}`);
                setStats(res.data);
            } catch (err) { console.error(err); }
            setLoading(false);
        };
        fetchStats();
    }, [range]);

    if (!stats || loading) return <div className="text-sm text-gray-500 font-medium p-4">Chargement des données...</div>;

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                mode: 'index',
                intersect: false,
                callbacks: {
                    label: function(context) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            label += context.parsed.y.toLocaleString('fr-FR', { maximumFractionDigits: 1 }) + ' m³';
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            x: {
                grid: { display: false, drawBorder: false },
                ticks: { font: { size: 10 } }
            },
            y: {
                beginAtZero: true,
                grid: { borderDash: [2, 4], color: '#f3f4f6', drawBorder: false },
                ticks: {
                    font: { size: 10 },
                    callback: function(value) {
                        if (value >= 1000) return (value / 1000) + 'k';
                        return value;
                    }
                }
            }
        },
        interaction: { mode: 'nearest', axis: 'x', intersect: false }
    };

    const chartData = {
        labels: stats.trend.map(t => new Date(t.jour).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })),
        datasets: [
            {
                label: 'Volume m³',
                data: stats.trend.map(t => t.volume_m3),
                borderColor: '#06b6d4',
                backgroundColor: 'rgba(6, 182, 212, 0.1)',
                borderWidth: 2,
                pointRadius: 2,
                pointHoverRadius: 5,
                fill: true,
                tension: 0.4
            }
        ]
    };

    return (
        <div className="max-w-6xl mx-auto flex flex-col gap-4 sm:gap-6">
            <div className="flex justify-between items-center bg-white p-3 sm:p-4 rounded-md shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">Tableau de Bord {user?.role === 'admin' && '(Vue Globale)'}</h2>
                <select 
                    value={range} 
                    onChange={e => setRange(e.target.value)}
                    className="bg-gray-50 border border-gray-200 text-gray-900 text-sm font-medium rounded-md focus:ring-gray-900 focus:border-gray-900 block p-2 cursor-pointer"
                >
                    {ranges.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
                <div className="pro-card p-3 sm:p-5 border-blue-50 bg-blue-50/20">
                    <p className="text-[10px] sm:text-xs font-bold text-blue-500 uppercase tracking-widest mb-1 sm:mb-2 line-clamp-1">Aujourd'hui</p>
                    <p className="text-base sm:text-2xl font-bold text-gray-900 truncate tabular-nums">{stats.today.volume_m3.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} <span className="text-xs font-normal text-gray-400">m³</span></p>
                </div>
                <div className="pro-card p-3 sm:p-5 border-cyan-50 bg-cyan-50/20">
                    <p className="text-[10px] sm:text-xs font-bold text-cyan-500 uppercase tracking-widest mb-1 sm:mb-2 line-clamp-1">Volume Total</p>
                    <p className="text-base sm:text-2xl font-bold text-gray-900 truncate tabular-nums">{stats.period.total_volume_m3.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} <span className="text-xs font-normal text-gray-400">m³</span></p>
                </div>
                <div className="pro-card p-3 sm:p-5">
                    <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 sm:mb-2 line-clamp-1">Sessions</p>
                    <p className="text-base sm:text-2xl font-bold text-gray-900 truncate tabular-nums">{stats.period.total_sessions}</p>
                </div>
                <div className="pro-card p-3 sm:p-5">
                    <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 sm:mb-2 line-clamp-1">Champs irrigués</p>
                    <p className="text-base sm:text-2xl font-bold text-gray-900 truncate tabular-nums">{stats.period.champs_irrigues}</p>
                </div>
                <div className="pro-card p-3 sm:p-5">
                    <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 sm:mb-2 line-clamp-1">Vol. moyen / session</p>
                    <p className="text-base sm:text-2xl font-bold text-gray-900 truncate tabular-nums">
                        {stats.period.total_sessions > 0
                            ? (stats.period.total_volume_m3 / stats.period.total_sessions).toLocaleString('fr-FR', { maximumFractionDigits: 1 })
                            : '0'
                        } <span className="text-xs font-normal text-gray-400">m³</span>
                    </p>
                </div>
            </div>

            {/* Resource counts */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
                <div className="pro-card p-4 flex items-center gap-3">
                    <div className="p-2 bg-gray-50 rounded-lg">
                        <MapPin className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                        <p className="text-lg font-bold text-gray-900 leading-tight">{stats.counts?.champs ?? '-'}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Champs</p>
                    </div>
                </div>
                <div className="pro-card p-4 flex items-center gap-3">
                    <div className="p-2 bg-gray-50 rounded-lg">
                        <Activity className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                        <p className="text-lg font-bold text-gray-900 leading-tight">{stats.counts?.pompes ?? '-'}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Pompes</p>
                    </div>
                </div>
                <div className="pro-card p-4 flex items-center gap-3">
                    <div className="p-2 bg-gray-50 rounded-lg">
                        <Wrench className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                        <p className="text-lg font-bold text-gray-900 leading-tight">{stats.counts?.enrouleurs ?? '-'}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Enrouleurs</p>
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="bg-white p-4 sm:p-5 rounded-md shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                    <BarChart2 className="w-4 h-4 text-cyan-600" />
                    <h3 className="text-[10px] font-bold text-cyan-700 uppercase tracking-widest">Évolution de la consommation (m³)</h3>
                </div>
                <div className="h-64 sm:h-80 w-full relative">
                    <Line options={chartOptions} data={chartData} />
                </div>
            </div>

            {/* Lists in 2 columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Top parcelles */}
                {stats.top_champs && stats.top_champs.length > 0 && stats.top_champs.some(p => p.total_volume_m3 > 0) && (
                <div className="pro-card overflow-hidden">
                    <div className="px-4 py-3 bg-cyan-50 border-b border-cyan-100 flex items-center gap-2">
                        <Droplets className="w-4 h-4 text-cyan-600" />
                        <span className="text-[10px] font-bold text-cyan-700 uppercase tracking-widest">Top champs par consommation</span>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {stats.top_champs.filter(p => p.total_volume_m3 > 0).map(p => (
                            <div key={p.id} className="px-4 py-3 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors">
                                <div className="min-w-0 flex-1 mr-4">
                                    <p className="text-sm font-bold text-gray-900 truncate">{p.nom}</p>
                                    <p className="text-[10px] text-gray-400 uppercase font-medium">{parseFloat(p.surface_m2).toLocaleString('fr-FR')} m²</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-sm font-black text-cyan-700 leading-tight tabular-nums">{p.total_volume_m3.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} m³</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{p.nb_sessions} session{p.nb_sessions > 1 ? 's' : ''}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent irrigations */}
            {stats.recent && stats.recent.length > 0 && (
                <div className="pro-card overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Sessions récentes</span>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {stats.recent.map(r => (
                            <div key={r.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                <div className="min-w-0 flex-1 mr-4">
                                    <p className="text-sm font-semibold text-gray-900">{r.champ}</p>
                                    <p className="text-[10px] text-gray-400">{r.pompe} · {new Date(r.date).toLocaleDateString('fr-FR')}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-sm font-bold text-gray-900 tabular-nums">{r.volume_m3.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} m³</p>
                                    <span className={`text-[9px] font-bold uppercase ${r.methode === 'dose' ? 'text-blue-600' : 'text-amber-600'}`}>
                                        {r.methode}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            </div>

            {/* Per-farmer breakdown (admin only) */}
            {stats.par_agriculteur && stats.par_agriculteur.length > 0 && (
                <div className="pro-card overflow-hidden">
                    <div className="px-4 py-3 bg-purple-50 border-b border-purple-100 flex items-center gap-2">
                        <Users className="w-4 h-4 text-purple-600" />
                        <span className="text-[10px] font-bold text-purple-700 uppercase tracking-widest">Volume par agriculteur</span>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {stats.par_agriculteur.map(a => (
                            <div key={a.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-sm">
                                        {a.nom?.charAt(0)?.toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">{a.nom}</p>
                                        <p className="text-[10px] text-gray-400">{a.sessions} session{a.sessions > 1 ? 's' : ''}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`text-sm font-bold tabular-nums ${a.volume_m3 > 0 ? 'text-cyan-700' : 'text-gray-300'}`}>
                                        {a.volume_m3.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} m³
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
