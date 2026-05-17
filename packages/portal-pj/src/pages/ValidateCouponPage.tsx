import React, { useState } from 'react';
import { redeemCoupon } from '../services/api';

export default function ValidateCouponPage() {
  const [token, setToken] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRedeem(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await redeemCoupon(token.trim());
      setResult(res);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Erro ao validar cupom');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={S.page}>
      <h1 style={S.title}>Validar Cupom de Figurinha</h1>
      {error && <div style={S.error}>{error}</div>}
      <form onSubmit={handleRedeem} style={S.card}>
        <label style={S.label}>Código QR / Token do cupom</label>
        <input style={S.input} placeholder="Cole o token aqui" value={token} onChange={e => setToken(e.target.value)} required />
        <button type="submit" style={S.btn} disabled={loading}>{loading ? 'Validando...' : '✅ Validar e Conceder Desconto'}</button>
      </form>
      {result && (
        <div style={S.success}>
          <h2>✅ {result.message}</h2>
          <p>Figurinha: <strong>{result.sticker_title}</strong></p>
          <p>Desconto: <strong>{result.discount_percent}%</strong></p>
        </div>
      )}
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#0f0f1a', color: '#fff', padding: 24, maxWidth: 600, margin: '0 auto' },
  title: { fontSize: 20, color: '#F59E0B', marginBottom: 20 },
  card: { background: '#1a1a2e', borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', gap: 12 },
  label: { fontSize: 13, color: '#9CA3AF' },
  input: { padding: '10px 12px', background: '#0f0f1a', border: '1px solid #374151', borderRadius: 6, color: '#fff', fontSize: 14 },
  btn: { padding: '14px 0', background: '#10B981', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' },
  error: { background: 'rgba(239,68,68,0.15)', border: '1px solid #EF4444', borderRadius: 8, padding: '10px 14px', color: '#FCA5A5', marginBottom: 16 },
  success: { background: 'rgba(16,185,129,0.15)', border: '1px solid #10B981', borderRadius: 12, padding: 24, marginTop: 16, textAlign: 'center' },
};
