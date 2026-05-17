import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const AuthCallbackPage = React.lazy(() => import('./pages/AuthCallbackPage'));
const MapPage = React.lazy(() => import('./pages/MapPage'));
const AlbumPage = React.lazy(() => import('./pages/AlbumPage'));
const WalletPage = React.lazy(() => import('./pages/WalletPage'));

const Fallback = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#000', color: '#F59E0B', fontSize: 18 }}>
    Carregando...
  </div>
);

export default function App() {
  return (
    <React.Suspense fallback={<Fallback />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/mapa" element={<MapPage />} />
        <Route path="/album" element={<AlbumPage />} />
        <Route path="/carteira" element={<WalletPage />} />
        <Route path="*" element={<Navigate to="/mapa" replace />} />
      </Routes>
    </React.Suspense>
  );
}
