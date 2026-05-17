import React from 'react';
import { Link } from 'react-router-dom';

const MENU = [
  { label: '📦 Importar Estabelecimentos', to: '/estabelecimentos/importar', desc: 'Cadastro automático via CNPJ' },
  { label: '🎯 Nova Campanha', to: '/campanhas/nova', desc: 'Upload de vídeo + orçamento + Smart Blending' },
  { label: '🎁 Validar Cupom', to: '/cupom/validar', desc: 'Escanear QR de figurinha no PDV' },
];

export default function DashboardPage() {
  return (
    <div style={S.page}>
      <h1 style={S.title}>Portal Lojista</h1>
      <div style={S.grid}>
        {MENU.map((m) => (
          <Link key={m.to} to={m.to} style={S.card}>
            <span style={S.label}>{m.label}</span>
            <span style={S.desc}>{m.desc}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#0f0f1a', color: '#fff', padding: 24 },
  title: { fontSize: 24, color: '#F59E0B', marginBottom: 24 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 },
  card: { display: 'flex', flexDirection: 'column', gap: 8, padding: 20, background: '#1a1a2e', borderRadius: 12, textDecoration: 'none', border: '1px solid #374151' },
  label: { fontSize: 16, fontWeight: 700, color: '#fff' },
  desc: { fontSize: 13, color: '#9CA3AF' },
};
