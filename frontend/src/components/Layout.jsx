import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, MapPin, Settings2, Replace, Droplets, Users, LogOut, Plus, WifiOff, CloudUpload, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSync } from '../context/SyncContext';

const Layout = ({ children }) => {
    const location = useLocation();
    const { user, logout } = useAuth();
    const { isOnline, pendingCount, syncPendingIrrigations } = useSync();

    const allNavItems = [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['agriculteur', 'admin'] },
        { path: '/champs', label: 'Champs', icon: MapPin, roles: ['agriculteur'] },
        { path: '/pompes', label: 'Pompes', icon: Settings2, roles: ['agriculteur'] },
        { path: '/enrouleurs', label: 'Enrouleurs', icon: Replace, roles: ['agriculteur'] },
        { path: '/irrigations', label: 'Irrigations', icon: Droplets, roles: ['agriculteur', 'admin'] },
        { path: '/compensations', label: 'Restitution', icon: Activity, roles: ['admin'] },
        { path: '/utilisateurs', label: 'Comptes', icon: Users, roles: ['admin'] },
    ];

    const navItems = allNavItems.filter(item => item.roles.includes(user?.role));

    const NavContent = () => (
        <>
            <div className="px-5 py-5 border-b border-gray-800">
                <div className="flex items-center gap-3">
                    <img src="/logotransparent.png" alt="iRRIG+" className="h-8 w-auto object-contain" />
                    <div className="flex flex-col">
                        <span className="text-sm font-bold tracking-widest text-white uppercase leading-none">iRRIG+</span>
                        <span className="text-[10px] text-gray-500 font-medium tracking-wider uppercase mt-1">Irrigation</span>
                    </div>
                </div>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                {navItems.map(item => {
                    const Icon = item.icon;
                    const active = location.pathname === item.path;
                    return (
                        <Link key={item.path} to={item.path}
                            className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${active ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                                }`}>
                            <Icon className="w-4 h-4 shrink-0" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>
            <div className="px-4 py-4 border-t border-gray-800">
                <div className="flex items-center justify-between">
                    <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-400 truncate">{user?.nom}</p>
                        <p className="text-[10px] text-gray-600 truncate capitalize">{user?.role}</p>
                    </div>
                    <button onClick={logout} className="p-1.5 text-gray-600 hover:text-red-400 transition-colors shrink-0" title="Déconnexion">
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </>
    );

    return (
        <div className="flex h-screen bg-[#F9FAFB] font-sans selection:bg-gray-200">
            <aside className="hidden lg:flex flex-col w-56 bg-[#111111] shrink-0">
                <NavContent />
            </aside>


            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 shrink-0 sticky top-0 z-30">
                    <div className="flex items-center gap-3 min-w-0">
                        <img src="/logotransparent.png" alt="Logo" className="h-7 w-auto object-contain hidden sm:block mr-2" />
                        <h2 className="text-sm font-semibold text-gray-800 capitalize truncate">
                            {navItems.find(n => n.path === location.pathname)?.label || 'iRRIG+'}
                        </h2>
                    </div>
                    <div className="flex items-center gap-4">
                        {!isOnline && (
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-red-50 text-red-600 rounded-md border border-red-100" title="Hors-ligne">
                                <WifiOff className="w-4 h-4" />
                                <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">Hors-ligne</span>
                            </div>
                        )}
                        {pendingCount > 0 && (
                            <button onClick={isOnline ? syncPendingIrrigations : undefined} className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 text-amber-600 rounded-md border border-amber-100 hover:bg-amber-100 transition-colors" title={`${pendingCount} en attente`}>
                                <CloudUpload className="w-4 h-4" />
                                <span className="text-[10px] font-bold">{pendingCount}</span>
                            </button>
                        )}
                        <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400">
                            <span className="font-medium text-gray-600">{user?.nom}</span>
                            <span className="text-gray-300">·</span>
                            <span className="capitalize">{user?.role}</span>
                        </div>
                    </div>
                </header>
                <main className={`flex-1 overflow-y-auto p-4 lg:p-8 pb-safe-nav lg:pb-8`}>
                    {children}
                </main>
            </div>

            <nav className="bottom-nav pb-safe-nav lg:hidden flex justify-around items-center relative bg-white border-t border-gray-200">
                {navItems.map((item, index) => {
                    const Icon = item.icon;
                    const active = location.pathname === item.path && !location.search.includes('new=true');
                    const middleIndex = Math.floor(navItems.length / 2);

                    return (
                        <React.Fragment key={item.path}>
                            {index === middleIndex && user?.role === 'agriculteur' && (
                                <div className="flex justify-center -mt-6">
                                    <Link to="/irrigations?new=true" className="bg-cyan-600 text-white p-3 rounded-full shadow-lg border-[4px] border-[#F9FAFB] hover:bg-cyan-700 transition-colors z-10">
                                        <Plus className="w-6 h-6" />
                                    </Link>
                                </div>
                            )}
                            <Link to={item.path} className={`flex-1 py-3 flex flex-col items-center justify-center gap-1 ${active ? 'text-gray-900 border-t-2 border-gray-900' : 'text-gray-400'}`}>
                                <Icon className="w-5 h-5" />
                                <span className="text-[9px] font-medium truncate w-full text-center px-1 leading-none">{item.label}</span>
                            </Link>
                        </React.Fragment>
                    );
                })}
            </nav>
        </div>
    );
};

export default Layout;
