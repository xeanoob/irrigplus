import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { MapPin, Wrench, BarChart2, Activity, Users } from 'lucide-react';
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
import LiveEnrouleurTracker from '../components/LiveEnrouleurTracker';

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

    const fetchStats = async () => {
        try {
            const res = await axios.get(`${API_URL}/dashboard/stats?range=${range}`);
            setStats(res.data);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    useEffect(() => {
        setLoading(true);
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
            {/* Live Active Enrouleurs Tracker */}
            <LiveEnrouleurTracker onStatusChanged={fetchStats} />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-3.5 sm:p-4 rounded-xl shadow-xs border border-gray-100">
                <h2 className="text-base sm:text-lg font-bold text-gray-900">Tableau de Bord {user?.role === 'admin' && <span className="text-xs font-normal text-purple-600 ml-1">(Vue Globale)</span>}</h2>
                <select 
                    value={range} 
                    onChange={e => setRange(e.target.value)}
                    className="w-full sm:w-auto bg-gray-50 border border-gray-200 text-gray-900 text-xs sm:text-sm font-medium rounded-lg focus:ring-gray-900 focus:border-gray-900 block p-2 cursor-pointer"
                >
                    {ranges.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4">
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
                <div className="pro-card p-3 sm:p-5 col-span-2 sm:col-span-1">
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
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
                <div className="pro-card p-2.5 sm:p-4 flex items-center gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2 bg-gray-50 rounded-lg shrink-0">
                        <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-base sm:text-lg font-bold text-gray-900 leading-tight">{stats.counts?.champs ?? '-'}</p>
                        <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-tight truncate">Champs</p>
                    </div>
                </div>
                <div className="pro-card p-2.5 sm:p-4 flex items-center gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2 bg-gray-50 rounded-lg shrink-0">
                        <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-base sm:text-lg font-bold text-gray-900 leading-tight">{stats.counts?.pompes ?? '-'}</p>
                        <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-tight truncate">Pompes</p>
                    </div>
                </div>
                <div className="pro-card p-2.5 sm:p-4 flex items-center gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2 bg-gray-50 rounded-lg shrink-0">
                        <Wrench className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-base sm:text-lg font-bold text-gray-900 leading-tight">{stats.counts?.enrouleurs ?? '-'}</p>
                        <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-tight truncate">Enrouleurs</p>
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
