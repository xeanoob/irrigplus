import React from 'react';
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

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen text-sm text-gray-500">Chargement...</div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return children;
};

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex items-center justify-center h-screen text-sm text-gray-500">Chargement...</div>;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />

      <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
      
      {/* Agriculteur Routes */}
      <Route path="/champs" element={<ProtectedRoute roles={['agriculteur']}><Layout><Champs /></Layout></ProtectedRoute>} />
      <Route path="/pompes" element={<ProtectedRoute roles={['agriculteur']}><Layout><Pompes /></Layout></ProtectedRoute>} />
      <Route path="/enrouleurs" element={<ProtectedRoute roles={['agriculteur']}><Layout><Enrouleurs /></Layout></ProtectedRoute>} />
      
      {/* Shared Route */}
      <Route path="/irrigations" element={<ProtectedRoute><Layout><Irrigations /></Layout></ProtectedRoute>} />
      
      {/* Admin Routes */}
      <Route path="/utilisateurs" element={<ProtectedRoute roles={['admin']}><Layout><Utilisateurs /></Layout></ProtectedRoute>} />
      <Route path="/compensations" element={<ProtectedRoute roles={['admin']}><Layout><Compensations /></Layout></ProtectedRoute>} />

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
