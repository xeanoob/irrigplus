import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SyncProvider } from './context/SyncContext';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';

// Lazy loading des pages pour un chargement instantané
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Champs = lazy(() => import('./pages/Champs'));
const Pompes = lazy(() => import('./pages/Pompes'));
const Enrouleurs = lazy(() => import('./pages/Enrouleurs'));
const Irrigations = lazy(() => import('./pages/Irrigations'));
const Utilisateurs = lazy(() => import('./pages/Utilisateurs'));
const Compensations = lazy(() => import('./pages/Compensations'));
const Logs = lazy(() => import('./pages/Logs'));

/** Splash screen React — minimaliste et rapide */
const SplashScreen = () => (
  <div className="fixed inset-0 z-[9998] flex flex-col items-center justify-center transition-opacity duration-300"
    style={{ background: 'linear-gradient(160deg, #F9FAFB 0%, #EFF6FF 50%, #F0FDF4 100%)' }}>
    <img
      src="/logotransparent.png"
      alt="iRRIG+"
      className="w-[72px] h-[72px] animate-pulse"
      style={{ filter: 'drop-shadow(0 4px 12px rgba(14, 165, 233, 0.2))' }}
    />
    <div
      className="mt-4 text-2xl font-bold tracking-tight"
      style={{
        letterSpacing: '-0.5px',
        background: 'linear-gradient(135deg, #0EA5E9, #22C55E)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}
    >
      iRRIG+
    </div>
    <div className="flex gap-2 mt-6">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-2 h-2 rounded-full"
          style={{
            background: 'linear-gradient(135deg, #0EA5E9, #22C55E)',
            animation: `splash-dot 1.4s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </div>
  </div>
);

const PageFallback = () => (
  <div className="flex items-center justify-center p-8 min-h-[50vh]">
    <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <SplashScreen />;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return children;
};

function AppRoutes() {
  const { user, loading } = useAuth();

  // Suppression immédiate et fluide du splash natif dès que l'authentification est prête
  useEffect(() => {
    if (!loading) {
      const splash = document.getElementById('splash-screen');
      if (splash) {
        splash.classList.add('hide');
        const timer = setTimeout(() => {
          splash.remove();
        }, 260);
        return () => clearTimeout(timer);
      }
    }
  }, [loading]);

  if (loading) return <SplashScreen />;

  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />

        <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
        
        {/* Configuration & Matériel Routes */}
        <Route path="/champs" element={<ProtectedRoute roles={['agriculteur', 'admin']}><Layout><Champs /></Layout></ProtectedRoute>} />
        <Route path="/pompes" element={<ProtectedRoute roles={['agriculteur', 'admin']}><Layout><Pompes /></Layout></ProtectedRoute>} />
        <Route path="/enrouleurs" element={<ProtectedRoute roles={['agriculteur', 'admin']}><Layout><Enrouleurs /></Layout></ProtectedRoute>} />
        
        {/* Shared Route */}
        <Route path="/irrigations" element={<ProtectedRoute><Layout><Irrigations /></Layout></ProtectedRoute>} />
        
        {/* Admin Routes */}
        <Route path="/utilisateurs" element={<ProtectedRoute roles={['admin']}><Layout><Utilisateurs /></Layout></ProtectedRoute>} />
        <Route path="/compensations" element={<ProtectedRoute roles={['admin']}><Layout><Compensations /></Layout></ProtectedRoute>} />
        <Route path="/logs" element={<ProtectedRoute roles={['admin']}><Layout><Logs /></Layout></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <SyncProvider>
          <AppRoutes />
          <Toaster position="bottom-center" />
        </SyncProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
