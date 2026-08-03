import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Plus, Trash2, Droplets, Filter, ChevronLeft, ChevronRight, Play, CheckCircle2 } from 'lucide-react';
import { useSync } from '../context/SyncContext';
import ExportMenu from '../components/ExportMenu';
import IrrigationModal from '../components/IrrigationModal';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const Irrigations = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { isOnline, saveOfflineIrrigation } = useSync();
    const [irrigations, setIrrigations] = useState([]);
    const [champs, setChamps] = useState([]);
    const [pompes, setPompes] = useState([]);
    const [enrouleurs, setEnrouleurs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 1 });
    
    // Filters
    const [filterChamp, setFilterChamp] = useState('');
    const [filterDateDebut, setFilterDateDebut] = useState('');
    const [filterDateFin, setFilterDateFin] = useState('');

    const fetchAll = async (page = 1) => {
        try {
            const params = new URLSearchParams();
            params.set('page', page);
            params.set('limit', 50);
            if (filterChamp) params.set('champ_id', filterChamp);
            if (filterDateDebut) params.set('dateDebut', filterDateDebut);
            if (filterDateFin) params.set('dateFin', filterDateFin);

            const [iRes, cRes, pRes, eRes] = await Promise.all([
                axios.get(`${API_URL}/irrigations?${params.toString()}`),
                axios.get(`${API_URL}/champs`),
                axios.get(`${API_URL}/pompes`),
                axios.get(`${API_URL}/enrouleurs`),
            ]);
            
            setIrrigations(iRes.data.data);
            setPagination(iRes.data.pagination);
            setChamps(cRes.data);
            setPompes(pRes.data);
            setEnrouleurs(eRes.data);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    useEffect(() => { fetchAll(1); }, [filterChamp, filterDateDebut, filterDateFin]);

    useEffect(() => {
        const handleSyncEvent = () => fetchAll(pagination.page);
        window.addEventListener('irrigations-synced', handleSyncEvent);
        return () => window.removeEventListener('irrigations-synced', handleSyncEvent);
    }, []);

    useEffect(() => {
        if (location.search.includes('new=true')) {
            setShowModal(true);
        }
    }, [location]);

    const handleCloseModal = () => {
        setShowModal(false);
        if (location.search.includes('new=true')) {
            navigate('/irrigations', { replace: true });
        }
    };

    const handleSubmit = async (form) => {
        if (!isOnline) {
            saveOfflineIrrigation(form);
            setShowModal(false);
            if (location.search.includes('new=true')) {
                navigate('/irrigations', { replace: true });
            }
            return;
        }

        try {
            await axios.post(`${API_URL}/irrigations`, form);
            toast.success('Session d\'irrigation enregistrée');
            setShowModal(false);
            if (location.search.includes('new=true')) {
                navigate('/irrigations', { replace: true });
            }
            fetchAll(1);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Erreur');
        }
    };

    const handleDelete = async (id) => {
        toast.error('La suppression de session n\'est pas autorisée par le CdC');
    };

    const handleStatutChange = async (id, newStatut) => {
        try {
            await axios.patch(`${API_URL}/irrigations/${id}/statut`, { statut: newStatut });
            toast.success(newStatut === 'lance' ? 'Irrigation démarrée' : 'Irrigation terminée');
            fetchAll(pagination.page);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Erreur');
        }
    };

    const totalVolumeM3 = irrigations.reduce((sum, i) => sum + parseFloat(i.volume_total_m3), 0);

    const exportCSV = () => {
        const header = 'Date,Champ,Culture,Pompe,Enrouleur,Méthode,Dose (mm),Temps (h),Volume (m3)\n';
        const rows = irrigations.map(i => {
            const date = new Date(i.date_debut).toLocaleDateString('fr-FR');
            return `"${date}","${i.champ_nom}","${i.type_culture}","${i.pompe_nom}","${i.enrouleur_nom}","${i.methode_calcul}",${i.dose_mm || ''},${i.duree_h || ''},${i.volume_total_m3}`;
        }).join('\n');
        const blob = new Blob([header + rows], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'irrigations.csv'; a.click();
    };

    const exportPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text('Historique d\'irrigation — iRRIG+', 14, 22);
        doc.setFontSize(10);
        doc.text(`Total : ${totalVolumeM3.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} m³`, 14, 30);
        autoTable(doc, {
            startY: 36,
            head: [['Date', 'Champ', 'Culture', 'Méthode', 'Volume (m³)', 'Statut']],
            body: irrigations.map(i => [
                new Date(i.date_debut).toLocaleDateString('fr-FR'),
                i.champ_nom,
                i.type_culture,
                i.methode_calcul === 'dose' ? `Dose ${i.dose_mm} mm` : `Temps ${i.duree_h} h`,
                parseFloat(i.volume_total_m3).toLocaleString('fr-FR'),
                i.statut
            ]),
        });
        doc.save('irrigations.pdf');
    };

    if (loading) return <div className="text-sm text-gray-500 font-medium p-4">Chargement...</div>;

    return (
        <div className="max-w-6xl mx-auto flex flex-col gap-4 sm:gap-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-3 sm:p-4 rounded-md shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Droplets className="w-5 h-5 text-cyan-500" />
                    Irrigations
                </h2>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <ExportMenu onExportCSV={exportCSV} onExportPDF={exportPDF} />
                    <button onClick={() => setShowModal(true)} className="bg-gray-900 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-1.5 whitespace-nowrap">
                        <Plus className="w-4 h-4" /> Nouvelle session
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="pro-card p-3 sm:p-5 col-span-1">
                    <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Volume total</p>
                    <p className="text-base sm:text-2xl font-bold text-gray-900 tabular-nums">{totalVolumeM3.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} <span className="text-xs font-normal text-gray-400">m³</span></p>
                </div>
                <div className="pro-card p-3 sm:p-5 col-span-1">
                    <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Sessions</p>
                    <p className="text-base sm:text-2xl font-bold text-gray-900 tabular-nums">{pagination.total}</p>
                </div>
                <div className="pro-card p-3 sm:p-5 col-span-2 sm:col-span-1">
                    <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Vol. moyen / session</p>
                    <p className="text-base sm:text-2xl font-bold text-gray-900 tabular-nums">
                        {irrigations.length > 0 ? (totalVolumeM3 / irrigations.length).toLocaleString('fr-FR', { maximumFractionDigits: 2 }) : '0'} <span className="text-xs font-normal text-gray-400">m³</span>
                    </p>
                </div>
            </div>

            <div className="pro-card p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Filtres</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <select value={filterChamp} onChange={e => setFilterChamp(e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-gray-900 outline-none">
                        <option value="">Tous les champs</option>
                        {champs.map(c => <option key={c.id} value={c.id}>{c.nom_champ}</option>)}
                    </select>
                    <input type="date" value={filterDateDebut} onChange={e => setFilterDateDebut(e.target.value)} placeholder="Date début"
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-gray-900 outline-none" />
                    <input type="date" value={filterDateFin} onChange={e => setFilterDateFin(e.target.value)} placeholder="Date fin"
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-gray-900 outline-none" />
                </div>
            </div>

            <div className="desktop-table-container">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/50">
                            <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date & Statut</th>
                            <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Champ</th>
                            <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Matériel</th>
                            <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Méthode</th>
                            <th className="text-right px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Volume (m³)</th>
                            <th className="text-right px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {irrigations.map(i => (
                            <tr key={i.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3">
                                    <div className="font-medium tabular-nums">{new Date(i.date_debut).toLocaleDateString('fr-FR')}</div>
                                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                        i.statut === 'fini' ? 'bg-green-50 text-green-700' :
                                        i.statut === 'lance' ? 'bg-amber-50 text-amber-700' :
                                        'bg-blue-50 text-blue-700'
                                    }`}>{i.statut === 'programme' ? 'programmé' : i.statut === 'lance' ? 'lancé' : 'fini'}</span>
                                </td>
                                <td className="px-4 py-3 text-gray-700 font-semibold">{i.champ_nom} <br/><span className="text-[10px] font-normal text-gray-400">{i.type_culture}</span></td>
                                <td className="px-4 py-3 text-gray-600">
                                    <span className="block text-xs">{i.pompe_nom}</span>
                                    <span className="block text-xs">{i.enrouleur_nom}</span>
                                </td>
                                <td className="px-4 py-3">
                                    {i.methode_calcul === 'dose' ? (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 uppercase tracking-wider">
                                            Dose {parseFloat(i.dose_mm).toFixed(1)} mm
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 uppercase tracking-wider">
                                            Temps {parseFloat(i.duree_h).toFixed(2)} h
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-right font-bold text-gray-900 tabular-nums">{parseFloat(i.volume_total_m3).toLocaleString('fr-FR')} m³</td>
                                <td className="px-4 py-3 text-right">
                                    {i.statut === 'programme' && (
                                        <button onClick={() => handleStatutChange(i.id, 'lance')}
                                            className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors">
                                            <Play className="w-3 h-3" /> Démarrer
                                        </button>
                                    )}
                                    {i.statut === 'lance' && (
                                        <button onClick={() => handleStatutChange(i.id, 'fini')}
                                            className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors">
                                            <CheckCircle2 className="w-3 h-3" /> Terminer
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {irrigations.length === 0 && (
                            <tr><td colSpan={6} className="text-center py-12 text-gray-400 text-sm">Aucune session d'irrigation</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between bg-white px-4 py-3 rounded-md border border-gray-100 shadow-sm">
                    <p className="text-xs text-gray-500">
                        Page <span className="font-bold text-gray-900">{pagination.page}</span> sur <span className="font-bold text-gray-900">{pagination.totalPages}</span>
                        {' '}— <span className="font-medium">{pagination.total}</span> sessions au total
                    </p>
                    <div className="flex gap-1">
                        <button
                            onClick={() => fetchAll(pagination.page - 1)}
                            disabled={pagination.page <= 1}
                            className="p-2 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => fetchAll(pagination.page + 1)}
                            disabled={pagination.page >= pagination.totalPages}
                            className="p-2 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            <IrrigationModal
                isOpen={showModal}
                onClose={handleCloseModal}
                onSubmit={handleSubmit}
                champs={champs}
                pompes={pompes}
                enrouleurs={enrouleurs}
            />
        </div>
    );
};

export default Irrigations;
