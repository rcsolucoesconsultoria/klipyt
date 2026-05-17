import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const MapPage = React.lazy(() => import('./pages/MapPage'));
const AlbumPage = React.lazy(() => import('./pages/AlbumPage'));
const WalletPage = React.lazy(() => import('./pages/WalletPage'));

export default function App() {
  return (
    <React.Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>Carregando...</div>}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/mapa" element={<MapPage />} />
        <Route path="/album" element={<AlbumPage />} />
        <Route path="/carteira" element={<WalletPage />} />
        <Route path="*" element={<Navigate to="/mapa" replace />} />
      </Routes>
    </React.Suspense>
  );
}
