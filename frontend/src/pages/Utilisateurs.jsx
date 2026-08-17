import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, UserCheck, UserX, Shield, Trash2, Pencil, X, Check, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const ROLES = [
    { value: 'agriculteur', label: 'Agriculteur', desc: 'Accès champs, pompes, enrouleurs et irrigations' },
    { value: 'admin', label: 'Admin', desc: 'Accès complet + gestion utilisateurs et restitution' },
];

const roleBadge = (role) => {
    const styles = {
        admin: 'bg-purple-50 text-purple-700 border-purple-200',
        agriculteur: 'bg-blue-50 text-blue-700 border-blue-200',
    };
    return styles[role] || styles.agriculteur;
};

const Utilisateurs = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [form, setForm] = useState({ nom: '', email: '', mot_de_passe: '', role: 'agriculteur' });
    const [userToEdit, setUserToEdit] = useState(null);
    const [editForm, setEditForm] = useState({ nom: '', email: '' });

    useEffect(() => { fetchUsers(); }, []);

    const fetchUsers = async () => {
        try {
            const res = await axios.get(`${API_URL}/users`);
            setUsers(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleOpenCreate = () => {
        setForm({ nom: '', email: '', mot_de_passe: '', role: 'agriculteur' });
        setShowCreateModal(true);
        document.body.classList.add('modal-open');
    };

    const handleCloseCreate = () => {
        setShowCreateModal(false);
        document.body.classList.remove('modal-open');
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!form.nom.trim()) { toast.error('Veuillez indiquer le nom complet'); return; }
        if (!form.email.trim()) { toast.error('Veuillez indiquer un email valide'); return; }
        if (!form.mot_de_passe || form.mot_de_passe.length < 6) { toast.error('Le mot de passe doit faire au moins 6 caractères'); return; }

        setIsSubmitting(true);
        try {
            await axios.post(`${API_URL}/users`, form);
            setForm({ nom: '', email: '', mot_de_passe: '', role: 'agriculteur' });
            handleCloseCreate();
            toast.success('Utilisateur créé avec succès !');
            fetchUsers();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Erreur lors de la création');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenEdit = (u) => {
        setUserToEdit(u);
        setEditForm({ nom: u.nom, email: u.email });
        setShowEditModal(true);
        document.body.classList.add('modal-open');
    };

    const handleCloseEdit = () => {
        setShowEditModal(false);
        setUserToEdit(null);
        document.body.classList.remove('modal-open');
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        if (!editForm.nom.trim()) { toast.error('Veuillez indiquer le nom'); return; }
        if (!editForm.email.trim()) { toast.error('Veuillez indiquer un email valide'); return; }

        setIsSubmitting(true);
        try {
            await axios.put(`${API_URL}/users/${userToEdit.id}`, editForm);
            handleCloseEdit();
            toast.success('Utilisateur mis à jour !');
            fetchUsers();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Erreur lors de la modification');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            await axios.put(`${API_URL}/users/${userId}/role`, { role: newRole });
            toast.success('Rôle mis à jour');
            fetchUsers();
        } catch (err) {
            toast.error('Erreur lors du changement de rôle');
        }
    };

    const handleToggle = async (userId) => {
        try {
            await axios.put(`${API_URL}/users/${userId}/toggle`);
            toast.success('Statut du compte mis à jour');
            fetchUsers();
        } catch (err) {
            toast.error('Erreur lors de la modification du statut');
        }
    };

    const handleDelete = async (userId, nom) => {
        if (!window.confirm(`Supprimer définitivement le compte de « ${nom} » ?`)) return;
        try {
            await axios.delete(`${API_URL}/users/${userId}`);
            fetchUsers();
            toast.success('Utilisateur supprimé');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Erreur lors de la suppression');
        }
    };

    const inputClass = "w-full bg-white border border-gray-300 rounded-xl px-3.5 py-3 text-base text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all";
    const labelClass = "block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5";

    return (
        <div className="max-w-5xl mx-auto flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-3.5 sm:p-4 rounded-xl shadow-xs border border-gray-100">
                <div>
                    <h2 className="text-base sm:text-lg font-bold text-gray-900">Gestion des Utilisateurs</h2>
                    <p className="text-xs text-gray-500">Créer des comptes et gérer les droits d'accès.</p>
                </div>
                <button 
                    onClick={handleOpenCreate}
                    className="bg-gray-900 text-white px-4 py-2.5 rounded-xl hover:bg-gray-800 active:scale-95 transition-all text-xs sm:text-sm font-bold flex items-center shadow-sm min-h-[42px]"
                >
                    <Plus className="w-4 h-4 mr-1.5 stroke-[2.5]" /> Nouvel Utilisateur
                </button>
            </div>

            {/* Légende des rôles */}
            <div className="pro-card p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Rôles disponibles</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {ROLES.map(r => (
                        <div key={r.value} className="flex items-start gap-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold border ${roleBadge(r.value)} shrink-0 mt-0.5`}>{r.label}</span>
                            <span className="text-xs text-gray-500">{r.desc}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal Création Utilisateur */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center animate-in fade-in duration-200">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={handleCloseCreate} />
                    
                    <div className="relative bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md z-10 flex flex-col overflow-hidden max-h-[90dvh] animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
                        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

                        {/* Fixed Header */}
                        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 shrink-0 bg-white">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-gray-100 text-gray-900 rounded-xl">
                                    <Users className="w-4 h-4" />
                                </div>
                                <h3 className="text-base font-bold text-gray-900">Créer un compte</h3>
                            </div>
                            <button onClick={handleCloseCreate} className="p-2 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Scrollable Body */}
                        <div className="modal-scroll-area overflow-y-auto flex-1 min-h-0 px-5 py-4 space-y-4">
                            <form id="create-user-form" onSubmit={handleCreate} className="space-y-3.5">
                                <div>
                                    <label className={labelClass}>Nom complet *</label>
                                    <input
                                        type="text"
                                        value={form.nom}
                                        onChange={e => setForm({ ...form, nom: e.target.value })}
                                        required
                                        autoFocus
                                        placeholder="Jean Dupont"
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Email *</label>
                                    <input
                                        type="email"
                                        value={form.email}
                                        onChange={e => setForm({ ...form, email: e.target.value })}
                                        required
                                        placeholder="jean@agriculteur.fr"
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Mot de passe *</label>
                                    <input
                                        type="password"
                                        value={form.mot_de_passe}
                                        onChange={e => setForm({ ...form, mot_de_passe: e.target.value })}
                                        required
                                        placeholder="••••••••"
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Rôle</label>
                                    <select
                                        value={form.role}
                                        onChange={e => setForm({ ...form, role: e.target.value })}
                                        className={inputClass}
                                    >
                                        {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                    </select>
                                </div>
                            </form>
                        </div>

                        {/* Fixed Sticky Footer */}
                        <div className="shrink-0 px-5 py-3.5 bg-white border-t border-gray-100 flex gap-3 shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
                            <button
                                type="button"
                                onClick={handleCloseCreate}
                                className="flex-1 py-3 px-4 text-sm font-bold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 active:scale-[0.97] transition-all min-h-[48px]"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                form="create-user-form"
                                disabled={isSubmitting}
                                className="flex-2 py-3 px-4 text-sm font-bold text-white bg-gray-900 hover:bg-black rounded-xl active:scale-[0.97] transition-all shadow-md min-h-[48px] flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <span>Création...</span>
                                ) : (
                                    <>
                                        <Check className="w-4 h-4 stroke-[3]" />
                                        <span>Créer le compte</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Modification Utilisateur */}
            {showEditModal && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center animate-in fade-in duration-200">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={handleCloseEdit} />
                    
                    <div className="relative bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md z-10 flex flex-col overflow-hidden max-h-[90dvh] animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
                        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

                        {/* Fixed Header */}
                        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 shrink-0 bg-white">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                                    <Pencil className="w-4 h-4" />
                                </div>
                                <h3 className="text-base font-bold text-gray-900">Modifier l'utilisateur</h3>
                            </div>
                            <button onClick={handleCloseEdit} className="p-2 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Scrollable Body */}
                        <div className="modal-scroll-area overflow-y-auto flex-1 min-h-0 px-5 py-4 space-y-4">
                            <form id="edit-user-form" onSubmit={handleSaveEdit} className="space-y-3.5">
                                <div>
                                    <label className={labelClass}>Nom complet</label>
                                    <input
                                        type="text"
                                        value={editForm.nom}
                                        onChange={e => setEditForm({ ...editForm, nom: e.target.value })}
                                        required
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Email</label>
                                    <input
                                        type="email"
                                        value={editForm.email}
                                        onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                        required
                                        className={inputClass}
                                    />
                                </div>
                            </form>
                        </div>

                        {/* Fixed Sticky Footer */}
                        <div className="shrink-0 px-5 py-3.5 bg-white border-t border-gray-100 flex gap-3 shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
                            <button
                                type="button"
                                onClick={handleCloseEdit}
                                className="flex-1 py-3 px-4 text-sm font-bold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 active:scale-[0.97] transition-all min-h-[48px]"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                form="edit-user-form"
                                disabled={isSubmitting}
                                className="flex-2 py-3 px-4 text-sm font-bold text-white bg-gray-900 hover:bg-black rounded-xl active:scale-[0.97] transition-all shadow-md min-h-[48px] flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Cards */}
            <div className="mobile-card-grid sm:hidden">
                {loading ? (
                    <div className="p-8 text-center text-sm text-gray-400">Chargement...</div>
                ) : users.length === 0 ? (
                    <div className="p-8 text-center text-sm text-gray-400">Aucun utilisateur.</div>
                ) : users.map(u => {
                    const isSelf = u.id === currentUser?.id;
                    return (
                        <div key={u.id} className={`pro-card p-4 flex flex-col gap-3.5 ${!u.actif ? 'opacity-60 bg-gray-50' : ''}`}>
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-xs">
                                        {u.nom?.charAt(0)?.toUpperCase()}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                                            {u.nom}
                                            {isSelf && <span className="text-[10px] font-medium bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">VOUS</span>}
                                        </h4>
                                        <p className="text-xs text-gray-500">{u.email}</p>
                                    </div>
                                </div>
                                {u.actif ? (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">ACTIF</span>
                                ) : (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-200">INACTIF</span>
                                )}
                            </div>

                            <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Rôle</p>
                                    {isSelf ? (
                                        <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold border ${roleBadge(u.role)}`}>
                                            {ROLES.find(r => r.value === u.role)?.label || u.role}
                                        </span>
                                    ) : (
                                        <select 
                                            value={u.role} 
                                            onChange={e => handleRoleChange(u.id, e.target.value)}
                                            className="bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-xs font-bold text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-900"
                                        >
                                            {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                        </select>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => handleOpenEdit(u)}
                                        className="p-2 rounded-xl border border-blue-100 text-blue-600 bg-blue-50 transition-all active:scale-95 min-w-[38px] min-h-[38px] flex items-center justify-center"
                                        title="Modifier"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    {!isSelf && (
                                        <>
                                            <button 
                                                onClick={() => handleToggle(u.id)}
                                                className={`p-2 rounded-xl border transition-colors min-w-[38px] min-h-[38px] flex items-center justify-center ${u.actif ? 'border-amber-100 text-amber-600 bg-amber-50' : 'border-green-100 text-green-600 bg-green-50'}`}
                                                title={u.actif ? 'Désactiver' : 'Réactiver'}
                                            >
                                                {u.actif ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(u.id, u.nom)}
                                                className="p-2 rounded-xl border border-red-100 text-red-600 bg-red-50 transition-colors min-w-[38px] min-h-[38px] flex items-center justify-center"
                                                title="Supprimer"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block pro-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Utilisateur</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rôle</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Statut</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {loading ? (
                                <tr><td colSpan="5" className="px-4 py-8 text-center text-sm text-gray-500">Chargement...</td></tr>
                            ) : users.length === 0 ? (
                                <tr><td colSpan="5" className="px-4 py-8 text-center text-sm text-gray-500">Aucun utilisateur.</td></tr>
                            ) : users.map(u => {
                                const isSelf = u.id === currentUser?.id;
                                return (
                                    <tr key={u.id} className={`transition-colors ${!u.actif ? 'opacity-50' : 'hover:bg-gray-50/50'}`}>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs font-semibold shrink-0">
                                                    {u.nom?.charAt(0)?.toUpperCase()}
                                                </div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {u.nom} {isSelf && <span className="text-xs text-gray-400">(vous)</span>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                                        <td className="px-4 py-3">
                                            {isSelf ? (
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${roleBadge(u.role)}`}>
                                                    {ROLES.find(r => r.value === u.role)?.label || u.role}
                                                </span>
                                            ) : (
                                                <select 
                                                    value={u.role} 
                                                    onChange={e => handleRoleChange(u.id, e.target.value)}
                                                    className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-900"
                                                >
                                                    {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                                </select>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {u.actif ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-200">Actif</span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">Désactivé</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-1">
                                                <button 
                                                    onClick={() => handleOpenEdit(u)}
                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                                    title="Modifier"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                {!isSelf && (
                                                    <>
                                                        <button 
                                                            onClick={() => handleToggle(u.id)}
                                                            className={`p-1.5 rounded-lg transition-colors ${u.actif ? 'text-gray-400 hover:text-amber-600 hover:bg-amber-50' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}`}
                                                            title={u.actif ? 'Désactiver' : 'Réactiver'}
                                                        >
                                                            {u.actif ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(u.id, u.nom)}
                                                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                            title="Supprimer"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Utilisateurs;
