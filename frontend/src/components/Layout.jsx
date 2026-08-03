import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSync } from '../context/SyncContext';
import {
    LayoutDashboard,
    MapPin,
    Droplets,
    Settings2,
    Replace,
    Users,
    Activity,
    LogOut,
    Plus,
    WifiOff,
    CloudUpload,
    ScrollText,
    Menu,
    X
} from 'lucide-react';

const Layout = ({ children }) => {
    const { user, logout } = useAuth();
    const { isOnline, pendingCount, syncPendingIrrigations } = useSync();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const allNavItems = [
        { path: '/', label: 'Tableau de Bord', icon: LayoutDashboard, roles: ['agriculteur', 'admin'] },
        { path: '/champs', label: 'Champs', icon: MapPin, roles: ['agriculteur', 'admin'] },
        { path: '/pompes', label: 'Pompes', icon: Settings2, roles: ['agriculteur', 'admin'] },
        { path: '/enrouleurs', label: 'Enrouleurs', icon: Replace, roles: ['agriculteur', 'admin'] },
        { path: '/irrigations', label: 'Irrigations', icon: Droplets, roles: ['agriculteur', 'admin'] },
        { path: '/compensations', label: 'Restitution', icon: Activity, roles: ['admin'] },
        { path: '/utilisateurs', label: 'Comptes', icon: Users, roles: ['admin'] },
        { path: '/logs', label: 'Logs', icon: ScrollText, roles: ['admin'] },
    ];

    const sidebarItems = allNavItems.filter(item => item.roles.includes(user?.role));

    // Mobile bottom nav: 4 clean distinct shortcuts + central + FAB (no duplicate irrigations)
    const mobileNavLeft = user?.role === 'admin'
        ? [
            { path: '/', label: 'Accueil', icon: LayoutDashboard },
            { path: '/compensations', label: 'Restit.', icon: Activity },
        ]
        : [
            { path: '/', label: 'Accueil', icon: LayoutDashboard },
            { path: '/champs', label: 'Champs', icon: MapPin },
        ];

    const mobileNavRight = user?.role === 'admin'
        ? [
            { path: '/utilisateurs', label: 'Comptes', icon: Users },
            { path: '/logs', label: 'Logs', icon: ScrollText },
        ]
        : [
            { path: '/pompes', label: 'Pompes', icon: Settings2 },
            { path: '/enrouleurs', label: 'Enroul.', icon: Replace },
        ];

    const NavContent = ({ onNavigate }) => (
        <>
            <div className="px-5 py-5 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <img src="/logotransparent.png" alt="iRRIG+" className="h-8 w-auto object-contain" />
                    <div className="flex flex-col">
                        <span className="text-sm font-bold tracking-widest text-white uppercase leading-none">iRRIG+</span>
                        <span className="text-[10px] text-gray-500 font-medium tracking-wider uppercase mt-1">Irrigation</span>
                    </div>
                </div>
                {onNavigate && (
                    <button onClick={onNavigate} className="p-1.5 text-gray-400 hover:text-white rounded-lg lg:hidden">
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>
            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                {sidebarItems.map(item => {
                    const Icon = item.icon;
                    const active = location.pathname === item.path;
                    return (
                        <Link key={item.path} to={item.path}
                            onClick={onNavigate}
                            className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${active ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
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
                        <p className="text-xs font-medium text-gray-300 truncate">{user?.nom}</p>
                        <p className="text-[10px] text-gray-500 truncate capitalize">{user?.role}</p>
                    </div>
                    <button onClick={logout} className="p-2 text-gray-400 hover:text-red-400 transition-colors shrink-0 rounded-lg hover:bg-white/5" title="Déconnexion">
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </>
    );

    const MobileTab = ({ item }) => {
        const Icon = item.icon;
        const active = location.pathname === item.path;
        return (
            <Link to={item.path} className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 transition-colors ${active ? 'text-cyan-600' : 'text-gray-400'}`}>
                <Icon className={`w-5 h-5 ${active ? 'stroke-[2.5]' : ''}`} />
                <span className={`text-[9px] font-semibold leading-none ${active ? 'text-cyan-600 font-bold' : 'text-gray-400'}`}>{item.label}</span>
            </Link>
        );
    };

    return (
        <div className="flex h-screen bg-[#F9FAFB] font-sans selection:bg-gray-200">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex flex-col w-56 bg-[#111111] shrink-0">
                <NavContent />
            </aside>

            {/* Mobile Drawer Overlay */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-50 lg:hidden flex">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setMobileMenuOpen(false)} />
                    <div className="relative w-64 max-w-[80vw] bg-[#111111] h-full flex flex-col z-10 shadow-2xl animate-in slide-in-from-left duration-200">
                        <NavContent onNavigate={() => setMobileMenuOpen(false)} />
                    </div>
                </div>
            )}

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-3 sm:px-4 lg:px-8 shrink-0 sticky top-0 z-30">
                    <div className="flex items-center gap-2 min-w-0">
                        <button
                            onClick={() => setMobileMenuOpen(true)}
                            className="p-1.5 -ml-1 text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100 lg:hidden"
                            aria-label="Ouvrir le menu"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <img src="/logotransparent.png" alt="Logo" className="h-6 sm:h-7 w-auto object-contain mr-1" />
                        <h2 className="text-sm font-semibold text-gray-800 capitalize truncate">
                            {sidebarItems.find(n => n.path === location.pathname)?.label || 'iRRIG+'}
                        </h2>
                    </div>
                    <div className="flex items-center gap-2.5 sm:gap-4">
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
                    </div>
                </header>
                <main className={`flex-1 overflow-y-auto p-3 sm:p-4 lg:p-8 pb-safe-nav lg:pb-8`}>
                    {children}
                </main>
            </div>

            {/* Mobile Bottom Nav */}
            <nav className="bottom-nav lg:hidden">
                {/* Left tabs */}
                {mobileNavLeft.map(item => (
                    <MobileTab key={item.path} item={item} />
                ))}

                {/* Center FAB spacer */}
                <div className="flex items-center justify-center" style={{ width: '64px' }}>
                    {/* Empty spacer in nav bar */}
                </div>

                {/* Right tabs */}
                {mobileNavRight.map(item => (
                    <MobileTab key={item.path} item={item} />
                ))}

                {/* Floating Action Button — central standout '+' for new irrigation */}
                <Link
                    to="/irrigations?new=true"
                    aria-label="Nouvelle irrigation"
                    title="Nouvelle irrigation"
                    className="absolute left-1/2 -translate-x-1/2 -top-5 z-20 flex items-center justify-center rounded-full shadow-[0_6px_20px_rgba(14,165,233,0.45)] border-[3.5px] border-[#F9FAFB] active:scale-90 transition-all hover:brightness-105"
                    style={{ background: 'linear-gradient(135deg, #0EA5E9, #06B6D4)', width: '52px', height: '52px' }}
                >
                    <Plus className="w-6 h-6 text-white stroke-[2.8]" />
                </Link>
            </nav>
        </div>
    );
};

export default Layout;
