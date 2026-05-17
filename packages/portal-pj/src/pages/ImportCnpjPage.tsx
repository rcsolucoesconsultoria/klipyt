import React, { useState } from 'react';
import { importCnpj } from '../services/api';

export default function ImportCnpjPage() {
  const [cnpj, setCnpj] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await importCnpj(cnpj);
      setResult(res);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Erro ao importar CNPJ');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={S.page}>
      <h1 style={S.title}>Importar Estabelecimentos via CNPJ</h1>
      {error && <div style={S.error}>{error}</div>}
      <form onSubmit={handleImport} style={S.card}>
        <label style={S.label}>CNPJ da Matriz</label>
        <input style={S.input} placeholder="00.000.000/0001-00" value={cnpj} onChange={e => setCnpj(e.target.value)} required />
        <button type="submit" style={S.btn} disabled={loading}>{loading ? 'Buscando...' : 'Buscar Filiais'}</button>
      </form>
      {result && (
        <div style={S.card}>
          <h3 style={S.h3}>Resultado</h3>
          <p>Importadas: {result.imported} | Ignoradas: {result.skipped}</p>
          {result.branches?.map((b: any) => (
            <div key={b.cnpj} style={S.branch}>
              <strong>{b.trade_name}</strong><br />
              <small>CNPJ: {b.cnpj} | Lat: {b.lat?.toFixed(6)}, Lon: {b.lon?.toFixed(6)}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#0f0f1a', color: '#fff', padding: 24, maxWidth: 600, margin: '0 auto' },
  title: { fontSize: 20, color: '#F59E0B', marginBottom: 20 },
  card: { background: '#1a1a2e', borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 },
  label: { fontSize: 13, color: '#9CA3AF' },
  input: { padding: '10px 12px', background: '#0f0f1a', border: '1px solid #374151', borderRadius: 6, color: '#fff', fontSize: 14 },
  btn: { padding: '12px 0', background: '#F59E0B', color: '#000', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' },
  error: { background: 'rgba(239,68,68,0.15)', border: '1px solid #EF4444', borderRadius: 8, padding: '10px 14px', color: '#FCA5A5', marginBottom: 16 },
  h3: { fontSize: 16, color: '#F59E0B' },
  branch: { padding: '8px 0', borderBottom: '1px solid #374151', fontSize: 13 },
};
