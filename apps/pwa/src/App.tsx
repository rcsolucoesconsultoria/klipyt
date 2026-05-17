import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import RequireAuth from './components/RequireAuth';

const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const AuthCallbackPage = React.lazy(() => import('./pages/AuthCallbackPage'));
const MapPage = React.lazy(() => import('./pages/MapPage'));
const AlbumPage = React.lazy(() => import('./pages/AlbumPage'));
const WalletPage = React.lazy(() => import('./pages/WalletPage'));
const UpgradePage = React.lazy(() => import('./pages/UpgradePage'));
const MarketplacePage = React.lazy(() => import('./pages/MarketplacePage'));

const Fallback = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#000', color: '#F59E0B', fontSize: 18 }}>
    Carregando...
  </div>
);

function Protected({ children }: { children: React.ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}

export default function App() {
  return (
    <React.Suspense fallback={<Fallback />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/ativar-pix" element={<Protected><UpgradePage /></Protected>} />
        <Route path="/mapa" element={<Protected><MapPage /></Protected>} />
        <Route path="/album" element={<Protected><AlbumPage /></Protected>} />
        <Route path="/marketplace" element={<Protected><MarketplacePage /></Protected>} />
        <Route path="/carteira" element={<Protected><WalletPage /></Protected>} />
        <Route path="*" element={<Navigate to="/mapa" replace />} />
      </Routes>
    </React.Suspense>
  );
}
