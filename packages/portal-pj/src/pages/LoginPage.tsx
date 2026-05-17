import React from 'react';

export default function LoginPage() {
  const handleGoogle = () => {
    const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';
    window.location.href = `${apiUrl}/auth/google`;
  };

  return (
    <div style={S.page}>
      <h1 style={S.title}>PIX GO</h1>
      <p style={S.sub}>Portal Lojista</p>
      <button style={S.btn} onClick={handleGoogle}>Entrar com Google (PJ)</button>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: { height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0f0f1a', gap: 16 },
  title: { fontSize: 40, color: '#F59E0B', fontWeight: 900 },
  sub: { color: '#6B7280', marginBottom: 24 },
  btn: { padding: '14px 28px', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, cursor: 'pointer' },
};
