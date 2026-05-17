import React, { useEffect, useState } from 'react';
import TeaserBanner from '../components/TeaserBanner';
import { useSettings } from '../hooks/useSettings';
import { api } from '../services/api';

export default function WalletPage() {
  const settings = useSettings();
  const [balance, setBalance] = useState<{ wallet_balance: number; can_withdraw: boolean } | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get('/wallet/balance').then(r => setBalance(r.data)).catch(() => {});
  }, []);

  async function handleWithdraw() {
    setWithdrawing(true); setMsg('');
    try {
      const r = await api.post('/wallet/withdraw');
      setMsg(`Saque de R$ ${r.data.amount?.toFixed(2)} solicitado! Status: ${r.data.status}`);
      setBalance(b => b ? { ...b, wallet_balance: 0, can_withdraw: false } : b);
    } catch (err: any) {
      setMsg(err?.response?.data?.message ?? 'Erro ao sacar');
    } finally {
      setWithdrawing(false);
    }
  }

  const showReal = settings.fase_monetizacao_ativa;

  return (
    <div style={S.page}>
      <h1 style={S.title}>Minha Carteira</h1>
      <TeaserBanner visible={!showReal} context="wallet" />

      <div style={S.card}>
        <p style={S.balLabel}>Saldo disponível</p>
        <p style={S.balValue}>
          R$ {showReal ? (balance?.wallet_balance ?? 0).toFixed(2) : '0,00'}
        </p>

        {showReal ? (
          <>
            <button
              style={{ ...S.withdrawBtn, ...(!balance?.can_withdraw ? S.btnDisabled : {}) }}
              onClick={handleWithdraw}
              disabled={!balance?.can_withdraw || withdrawing}
            >
              {withdrawing ? 'Processando...' : balance?.can_withdraw ? '💸 Sacar via Pix' : '🔒 Saldo mínimo R$ 6,00'}
            </button>
            {msg && <p style={S.msg}>{msg}</p>}
          </>
        ) : (
          <button style={S.btnDisabled} disabled>🔒 Sacar via Pix</button>
        )}
        <p style={S.hint}>Mínimo R$ 6,00 para sacar (RF08)</p>
      </div>

      <nav style={S.nav}>
        <a href="/mapa" style={S.navItem}>🗺️ Mapa</a>
        <a href="/album" style={S.navItem}>📖 Álbum</a>
        <a href="/carteira" style={S.navActive}>👛 Carteira</a>
      </nav>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: { height: '100vh', background: '#0a0a14', color: '#fff', paddingBottom: 70 },
  title: { padding: '20px 16px 0', fontSize: 22, fontWeight: 700, color: '#F59E0B' },
  card: { margin: '20px 16px', padding: 24, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 12, textAlign: 'center' },
  balLabel: { fontSize: 13, color: '#9CA3AF', marginBottom: 8 },
  balValue: { fontSize: 40, fontWeight: 700, color: '#F59E0B', marginBottom: 20 },
  withdrawBtn: { width: '100%', padding: '14px 0', background: '#F59E0B', color: '#000', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: 'pointer' },
  btnDisabled: { width: '100%', padding: '14px 0', background: '#374151', color: '#6B7280', border: 'none', borderRadius: 8, fontSize: 16, cursor: 'not-allowed' },
  hint: { marginTop: 8, fontSize: 12, color: '#6B7280' },
  msg: { marginTop: 12, fontSize: 13, color: '#86EFAC' },
  nav: { position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex', background: '#111', borderTop: '1px solid #333' },
  navItem: { flex: 1, textAlign: 'center', padding: '14px 0', color: '#9CA3AF', textDecoration: 'none', fontSize: 12 },
  navActive: { flex: 1, textAlign: 'center', padding: '14px 0', color: '#F59E0B', textDecoration: 'none', fontSize: 12, fontWeight: 700 },
};
