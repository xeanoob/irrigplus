import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SyncProvider } from './context/SyncContext';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Champs from './pages/Champs';
import Pompes from './pages/Pompes';
import Enrouleurs from './pages/Enrouleurs';
import Irrigations from './pages/Irrigations';
import Utilisateurs from './pages/Utilisateurs';
import Compensations from './pages/Compensations';
import Logs from './pages/Logs';

/** Splash screen React — même design que le splash HTML natif */
const SplashScreen = () => (
  <div className="fixed inset-0 z-[9998] flex flex-col items-center justify-center"
    style={{ background: 'linear-gradient(160deg, #F9FAFB 0%, #EFF6FF 50%, #F0FDF4 100%)' }}>
    <img
      src="/logotransparent.png"
      alt="iRRIG+"
      className="w-[88px] h-[88px] animate-[splash-pulse_2.4s_ease-in-out_infinite]"
      style={{ filter: 'drop-shadow(0 4px 12px rgba(14, 165, 233, 0.2))' }}
    />
    <div
      className="mt-5 text-[28px] font-bold tracking-tight"
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
    <div className="flex gap-1.5 mt-8">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-[7px] h-[7px] rounded-full"
          style={{
            background: 'linear-gradient(135deg, #0EA5E9, #22C55E)',
            animation: `splash-dot 1.4s ease-in-out ${i * 0.16}s infinite`,
          }}
        />
      ))}
    </div>
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

  // Masquer le splash screen HTML natif dès que React a fini de charger
  useEffect(() => {
    if (!loading) {
      const splash = document.getElementById('splash-screen');
      if (splash) {
        splash.classList.add('hide');
        setTimeout(() => splash.remove(), 500);
      }
    }
  }, [loading]);

  if (loading) return <SplashScreen />;

  return (
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
