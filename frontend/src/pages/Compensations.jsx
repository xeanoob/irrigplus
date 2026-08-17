import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, Download, Save, FileText, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const API_URL = import.meta.env.VITE_API_URL || '/api';

const Compensations = () => {
    const [compensations, setCompensations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dateJour, setDateJour] = useState(new Date().toISOString().split('T')[0]);
    const [calculJour, setCalculJour] = useState(null);
    const [volumeRestitue, setVolumeRestitue] = useState('');
    const [trendData, setTrendData] = useState([]);
    const [parAgriculteur, setParAgriculteur] = useState([]);

    useEffect(() => { 
        fetchCompensations(); 
        fetchCalcul(dateJour);
        fetchTrend();
        fetchParAgriculteur(dateJour);
    }, [dateJour]);

    const fetchCompensations = async () => {
        try {
            const res = await axios.get(`${API_URL}/compensations`);
            setCompensations(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const fetchCalcul = async (date) => {
        try {
            const res = await axios.get(`${API_URL}/compensations/calcul/${date}`);
            setCalculJour(res.data.total_m3);
            setVolumeRestitue(res.data.total_m3);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchTrend = async () => {
        try {
            const res = await axios.get(`${API_URL}/compensations/trend`);
            setTrendData(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchParAgriculteur = async (date) => {
        try {
            const res = await axios.get(`${API_URL}/compensations/par-agriculteur/${date}`);
            setParAgriculteur(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (volumeRestitue === '' || parseFloat(volumeRestitue) < 0) {
            toast.error('Veuillez indiquer un volume à restituer valide');
            return;
        }
        try {
            await axios.post(`${API_URL}/compensations`, {
                date_jour: dateJour,
                volume_total_pompe_m3: calculJour || 0,
                volume_restitue_m3: parseFloat(volumeRestitue)
            });
            toast.success('Compensation validée avec succès !');
            fetchCompensations();
            fetchTrend();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Erreur lors de la sauvegarde');
        }
    };

    const handleExportCSV = () => {
        let csvContent = "data:text/csv;charset=utf-8,Date,Volume Pompé (m3),Volume Restitué (m3),Validé par\n";
        compensations.forEach(c => {
            csvContent += `${c.date_jour},${c.volume_total_pompe_m3},${c.volume_restitue_m3},${c.admin_nom}\n`;
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "compensations_ddt.csv");
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    const handleExportPDF = async () => {
        try {
            const res = await axios.get(`${API_URL}/compensations/export-pdf`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'rapport_ddt_irrigplus.pdf');
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success('Rapport PDF téléchargé');
        } catch (err) {
            toast.error('Erreur lors du téléchargement du PDF');
        }
    };

    // Chart config
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top', labels: { font: { size: 11 }, usePointStyle: true, pointStyle: 'rect' } },
            tooltip: {
                mode: 'index',
                intersect: false,
                callbacks: {
                    label: (ctx) => `${ctx.dataset.label}: ${parseFloat(ctx.parsed.y).toLocaleString('fr-FR')} m³`
                }
            }
        },
        scales: {
            x: { grid: { display: false }, ticks: { font: { size: 10 } } },
            y: {
                beginAtZero: true,
                grid: { borderDash: [2, 4], color: '#f3f4f6' },
                ticks: { font: { size: 10 }, callback: (v) => v >= 1000 ? (v / 1000) + 'k' : v }
            }
        }
    };

    const chartData = {
        labels: trendData.map(t => new Date(t.date_jour).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })),
        datasets: [
            {
                label: 'Volume Pompé',
                data: trendData.map(t => parseFloat(t.volume_total_pompe_m3)),
                backgroundColor: 'rgba(239, 68, 68, 0.6)',
                borderColor: '#ef4444',
                borderWidth: 1,
                borderRadius: 3,
            },
            {
                label: 'Volume Restitué',
                data: trendData.map(t => parseFloat(t.volume_restitue_m3)),
                backgroundColor: 'rgba(34, 197, 94, 0.6)',
                borderColor: '#22c55e',
                borderWidth: 1,
                borderRadius: 3,
            }
        ]
    };

    return (
        <div className="max-w-5xl mx-auto flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Restitution Rivière (DDT)</h2>
                    <p className="text-sm text-gray-500">Pilotage du volume d'eau à compenser.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleExportCSV} className="bg-white text-gray-700 px-3 py-2 rounded-md hover:bg-gray-50 text-sm font-medium flex items-center border border-gray-200 transition-colors">
                        <Download className="w-4 h-4 mr-2" /> CSV
                    </button>
                    <button onClick={handleExportPDF} className="bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-800 text-sm font-medium flex items-center transition-colors">
                        <FileText className="w-4 h-4 mr-2" /> Rapport PDF DDT
                    </button>
                </div>
            </div>

            {/* Saisie Journalière */}
            <div className="pro-card p-4 sm:p-5 bg-blue-50/30 border-blue-100">
                <h3 className="font-bold text-gray-900 mb-3.5 flex items-center gap-2 text-sm sm:text-base">
                    <Activity className="w-5 h-5 text-blue-600" /> Saisie Journalière
                </h3>
                <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-end">
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Date</label>
                        <input
                            type="date"
                            value={dateJour}
                            onChange={e => setDateJour(e.target.value)}
                            required
                            className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-base sm:text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Total Pompé (m³)</label>
                        <div className="w-full bg-gray-100/90 border border-gray-200 rounded-lg px-3.5 py-2.5 text-base sm:text-sm font-bold text-gray-900 flex items-center">
                            {calculJour !== null ? parseFloat(calculJour).toLocaleString('fr-FR') : '-'} m³
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Volume à Restituer (m³)</label>
                        <input
                            type="number"
                            step="0.1"
                            min="0"
                            inputMode="decimal"
                            value={volumeRestitue}
                            onChange={e => setVolumeRestitue(e.target.value)}
                            required
                            placeholder="ex: 1200"
                            className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-base sm:text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                        />
                    </div>
                    <div>
                        <button
                            type="submit"
                            className="w-full bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 active:scale-95 text-sm font-semibold flex justify-center items-center gap-2 transition-all shadow-xs"
                        >
                            <Save className="w-4 h-4" /> Valider
                        </button>
                    </div>
                </form>
            </div>

            {/* Récap par agriculteur */}
            {parAgriculteur.length > 0 && (
                <div className="pro-card overflow-hidden">
                    <div className="px-4 py-3 bg-purple-50 border-b border-purple-100 flex items-center gap-2">
                        <Users className="w-4 h-4 text-purple-600" />
                        <span className="text-[10px] font-bold text-purple-700 uppercase tracking-widest">
                            Détail par agriculteur — {new Date(dateJour).toLocaleDateString('fr-FR')}
                        </span>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {parAgriculteur.map(a => (
                            <div key={a.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                        {a.nom?.charAt(0)?.toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">{a.nom}</p>
                                        <p className="text-[10px] text-gray-400">{a.sessions} session{parseInt(a.sessions) > 1 ? 's' : ''}</p>
                                    </div>
                                </div>
                                <p className={`text-sm font-bold tabular-nums ${parseFloat(a.volume_m3) > 0 ? 'text-blue-700' : 'text-gray-300'}`}>
                                    {parseFloat(a.volume_m3).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} m³
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Graphique Pompé vs Restitué */}
            {trendData.length > 0 && (
                <div className="pro-card p-4 sm:p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Activity className="w-4 h-4 text-blue-600" />
                        <h3 className="text-[10px] font-bold text-blue-700 uppercase tracking-widest">Pompé vs Restitué</h3>
                    </div>
                    <div className="h-64 sm:h-80 w-full">
                        <Bar options={chartOptions} data={chartData} />
                    </div>
                </div>
            )}

            {/* Table historique */}
            <div className="mobile-card-grid sm:hidden">
                {compensations.map(c => (
                    <div key={c.id} className="pro-card p-4 flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-sm text-gray-900">{new Date(c.date_jour).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                            <span className="text-[10px] text-gray-400">Validé par {c.admin_nom}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 bg-gray-50/70 p-2.5 rounded border border-gray-100 text-xs">
                            <div>
                                <span className="text-[10px] text-gray-400 uppercase font-medium block">Pompé</span>
                                <span className="font-bold text-red-600 tabular-nums">{parseFloat(c.volume_total_pompe_m3).toLocaleString('fr-FR')} m³</span>
                            </div>
                            <div>
                                <span className="text-[10px] text-gray-400 uppercase font-medium block">Restitué</span>
                                <span className="font-bold text-green-600 tabular-nums">{parseFloat(c.volume_restitue_m3).toLocaleString('fr-FR')} m³</span>
                            </div>
                        </div>
                    </div>
                ))}
                {compensations.length === 0 && (
                    <div className="pro-card p-8 text-center text-gray-400 text-sm">
                        Aucune compensation enregistrée.
                    </div>
                )}
            </div>

            <div className="hidden sm:block pro-card overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                            <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Volume Pompé</th>
                            <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Volume Restitué</th>
                            <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Validé par</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                        {loading ? <tr><td colSpan="4" className="px-4 py-4 text-center">Chargement...</td></tr> : 
                        compensations.map(c => (
                            <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3 text-sm">{new Date(c.date_jour).toLocaleDateString('fr-FR')}</td>
                                <td className="px-4 py-3 text-sm font-bold">{parseFloat(c.volume_total_pompe_m3).toLocaleString('fr-FR')} m³</td>
                                <td className="px-4 py-3 text-sm font-bold text-blue-600">{parseFloat(c.volume_restitue_m3).toLocaleString('fr-FR')} m³</td>
                                <td className="px-4 py-3 text-sm text-gray-500">{c.admin_nom}</td>
                            </tr>
                        ))}
                        {!loading && compensations.length === 0 && (
                            <tr><td colSpan="4" className="px-4 py-8 text-center text-sm text-gray-400">Aucune compensation enregistrée.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Compensations;
