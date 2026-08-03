import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, UserCheck, UserX, Shield, Trash2, Pencil } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ nom: '', email: '', mot_de_passe: '', role: 'agriculteur' });
    const [message, setMessage] = useState({ type: '', text: '' });
    const [showEditModal, setShowEditModal] = useState(false);
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

    const handleCreate = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });
        try {
            await axios.post(`${API_URL}/users`, form);
            setForm({ nom: '', email: '', mot_de_passe: '', role: 'agriculteur' });
            setShowForm(false);
            setMessage({ type: 'success', text: 'Utilisateur créé avec succès.' });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
            fetchUsers();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || 'Erreur' });
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            await axios.put(`${API_URL}/users/${userId}/role`, { role: newRole });
            fetchUsers();
        } catch (err) { console.error(err); }
    };

    const handleOpenEdit = (u) => {
        setUserToEdit(u);
        setEditForm({ nom: u.nom, email: u.email });
        setShowEditModal(true);
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`${API_URL}/users/${userToEdit.id}`, editForm);
            setShowEditModal(false);
            setMessage({ type: 'success', text: 'Utilisateur mis à jour.' });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
            fetchUsers();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || 'Erreur' });
        }
    };

    const handleToggle = async (userId) => {
        try {
            await axios.put(`${API_URL}/users/${userId}/toggle`);
            fetchUsers();
        } catch (err) { console.error(err); }
    };

    const handleDelete = async (userId) => {
        if (!window.confirm('Supprimer définitivement cet utilisateur ?')) return;
        try {
            await axios.delete(`${API_URL}/users/${userId}`);
            fetchUsers();
            setMessage({ type: 'success', text: 'Utilisateur supprimé.' });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || 'Erreur lors de la suppression' });
        }
    };

    return (
        <div className="max-w-5xl mx-auto flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Gestion des Utilisateurs</h2>
                    <p className="text-sm text-gray-500">Créer des comptes et gérer les droits d'accès.</p>
                </div>
                <div className="flex items-center gap-3">
                    {message.text && (
                        <span className={`text-xs font-medium px-2 py-1 rounded border ${message.type === 'success' ? 'text-green-700 bg-green-50 border-green-200' : 'text-red-700 bg-red-50 border-red-200'
                            }`}>{message.text}</span>
                    )}
                    <button onClick={() => setShowForm(!showForm)}
                        className="bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors text-sm font-medium flex items-center shadow-sm">
                        <Plus className="w-4 h-4 mr-2" /> Nouvel Utilisateur
                    </button>
                </div>
            </div>

            {/* Légende des rôles */}
            <div className="pro-card p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Rôles disponibles</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {ROLES.map(r => (
                        <div key={r.value} className="flex items-start gap-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${roleBadge(r.value)} shrink-0 mt-0.5`}>{r.label}</span>
                            <span className="text-xs text-gray-500">{r.desc}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Formulaire de création */}
            {showForm && (
                <div className="pro-card p-5">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Créer un compte</h3>
                    <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Nom complet *</label>
                            <input value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} required placeholder="Jean Dupont"
                                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Email *</label>
                            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required placeholder="jean@erp.local"
                                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Mot de passe *</label>
                            <input type="password" value={form.mot_de_passe} onChange={e => setForm({ ...form, mot_de_passe: e.target.value })} required placeholder="••••••••"
                                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Rôle</label>
                            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900">
                                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                            </select>
                        </div>
                        <div className="sm:col-span-2 flex gap-2 pt-2">
                            <button type="submit" className="bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800">Créer le compte</button>
                            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Annuler</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Table */}
            <div className="mobile-card-grid">
                {loading ? (
                    <div className="p-8 text-center text-sm text-gray-400">Chargement...</div>
                ) : users.length === 0 ? (
                    <div className="p-8 text-center text-sm text-gray-400">Aucun utilisateur.</div>
                ) : users.map(u => {
                    const isSelf = u.id === currentUser?.id;
                    return (
                        <div key={u.id} className={`pro-card p-4 flex flex-col gap-4 ${!u.actif ? 'opacity-60 bg-gray-50' : ''}`}>
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-sm">
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
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700">ACTIF</span>
                                ) : (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-200 text-gray-600">INACTIF</span>
                                )}
                            </div>

                            <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Rôle & Permissions</p>
                                    {isSelf ? (
                                        <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold border ${roleBadge(u.role)}`}>
                                            {ROLES.find(r => r.value === u.role)?.label || u.role}
                                        </span>
                                    ) : (
                                        <select value={u.role} onChange={e => handleRoleChange(u.id, e.target.value)}
                                            className="bg-white border border-gray-200 rounded px-2 py-1 text-xs font-bold text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-900 cursor-pointer">
                                            {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                        </select>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    <button onClick={() => handleOpenEdit(u)}
                                        className="p-2 rounded-md border border-blue-100 text-blue-600 bg-blue-50 transition-all active:scale-95"
                                        title="Modifier">
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    {!isSelf && (
                                        <>
                                            <button onClick={() => handleToggle(u.id)}
                                                className={`p-2 rounded-md border transition-colors ${u.actif ? 'border-amber-100 text-amber-600 bg-amber-50' : 'border-green-100 text-green-600 bg-green-50'}`}
                                                title={u.actif ? 'Désactiver' : 'Réactiver'}>
                                                {u.actif ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                                            </button>
                                            <button onClick={() => handleDelete(u.id)}
                                                className="p-2 rounded-md border border-red-100 text-red-600 bg-red-50 transition-colors"
                                                title="Supprimer">
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
                                                <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center text-xs font-semibold text-gray-600 shrink-0">
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
                                                <select value={u.role} onChange={e => handleRoleChange(u.id, e.target.value)}
                                                    className="bg-white border border-gray-200 rounded px-2 py-1 text-xs font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-900 cursor-pointer">
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
                                            {!isSelf && (
                                                <div className="flex justify-end gap-1">
                                                    <button onClick={() => handleToggle(u.id)}
                                                        className={`p-1.5 rounded transition-colors ${u.actif ? 'text-gray-400 hover:text-amber-600 hover:bg-amber-50' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}`}
                                                        title={u.actif ? 'Désactiver' : 'Réactiver'}>
                                                        {u.actif ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                                                    </button>
                                                    <button onClick={() => handleDelete(u.id)}
                                                        className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                        title="Supprimer">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de modification mobile */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Modifier Profil</h3>
                        </div>
                        <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Nom Complet</label>
                                <input value={editForm.nom} onChange={e => setEditForm({ ...editForm, nom: e.target.value })} required
                                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-gray-900 outline-none" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Email</label>
                                <input type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} required
                                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-gray-900 outline-none" />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="submit" className="flex-1 bg-gray-900 text-white py-2.5 rounded-lg text-xs font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">Enregistrer</button>
                                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 bg-white border border-gray-200 text-gray-400 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-gray-50 active:scale-95 transition-all">Annuler</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Utilisateurs;
