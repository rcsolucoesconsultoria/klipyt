import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const CampaignPage = React.lazy(() => import('./pages/CampaignPage'));
const ImportCnpjPage = React.lazy(() => import('./pages/ImportCnpjPage'));
const AnalyticsPage = React.lazy(() => import('./pages/AnalyticsPage'));
const ValidateCouponPage = React.lazy(() => import('./pages/ValidateCouponPage'));

export default function App() {
  return (
    <React.Suspense fallback={<div style={S.loading}>Carregando...</div>}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/campanhas/nova" element={<CampaignPage />} />
        <Route path="/estabelecimentos/importar" element={<ImportCnpjPage />} />
        <Route path="/campanhas/:id/analytics" element={<AnalyticsPage />} />
        <Route path="/cupom/validar" element={<ValidateCouponPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </React.Suspense>
  );
}

const S = {
  loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0f0f1a', color: '#F59E0B' } as React.CSSProperties,
};
