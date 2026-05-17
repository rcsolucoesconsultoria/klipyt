import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { upgradeAccount } from '../services/api';

export default function UpgradePage() {
  const [cpf, setCpf] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await upgradeAccount(cpf, pixKey);
      navigate('/mapa', { replace: true });
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg ?? 'Erro ao ativar Pix Real');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={S.page}>
      <div style={S.card}>
        <h1 style={S.title}>Ativar Pix Real</h1>
        <p style={S.sub}>Para coletar moedas com dinheiro real, precisamos validar sua identidade.</p>
        {error && <div style={S.error}>{error}</div>}
        <form onSubmit={handleSubmit} style={S.form}>
          <label style={S.label}>CPF</label>
          <input
            style={S.input}
            type="text"
            inputMode="numeric"
            placeholder="000.000.000-00"
            value={cpf}
            onChange={(e) => setCpf(e.target.value)}
            required
          />
          <label style={S.label}>Chave Pix (deve ser o seu CPF)</label>
          <input
            style={S.input}
            type="text"
            inputMode="numeric"
            placeholder="Apenas números do CPF"
            value={pixKey}
            onChange={(e) => setPixKey(e.target.value)}
            required
          />
          <p style={S.hint}>A chave Pix deve ser do tipo CPF correspondente ao CPF informado acima (RF05).</p>
          <button type="submit" style={S.btn} disabled={loading}>
            {loading ? 'Validando...' : 'Ativar Modo Pix Real'}
          </button>
        </form>
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: { height: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 },
  card: { background: '#1a1a2e', borderRadius: 16, padding: 28, width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 16 },
  title: { fontSize: 22, fontWeight: 700, color: '#F59E0B' },
  sub: { fontSize: 14, color: '#9CA3AF' },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  label: { fontSize: 13, color: '#9CA3AF' },
  input: { padding: '12px 14px', background: '#0a0a14', border: '1px solid #374151', borderRadius: 8, color: '#fff', fontSize: 16 },
  hint: { fontSize: 11, color: '#6B7280' },
  btn: { padding: '14px 0', background: '#F59E0B', color: '#000', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: 'pointer' },
  error: { background: 'rgba(239,68,68,0.15)', border: '1px solid #EF4444', borderRadius: 8, padding: '10px 12px', color: '#FCA5A5', fontSize: 13 },
};
