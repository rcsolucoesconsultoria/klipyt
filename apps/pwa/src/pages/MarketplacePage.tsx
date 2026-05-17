import React, { useEffect, useState } from 'react';
import {
  buyMarketplaceOrder,
  createMarketplaceListing,
  getMyMarketplaceCoins,
  getMarketplaceChargeStatus,
  listMarketplace,
  simulateMarketplaceCharge,
} from '../services/api';

type Tab = 'buy' | 'sell';

export default function MarketplacePage() {
  const [tab, setTab] = useState<Tab>('buy');
  const [listings, setListings] = useState<any[]>([]);
  const [myCoins, setMyCoins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sellCoinId, setSellCoinId] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [pixModal, setPixModal] = useState<{
    chargeId: string;
    copyPaste: string;
    amount: number;
  } | null>(null);
  const [message, setMessage] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [market, coins] = await Promise.all([listMarketplace(), getMyMarketplaceCoins()]);
      setListings(market);
      setMyCoins(coins);
      if (coins.length && !sellCoinId) setSellCoinId(coins[0].coin_id);
    } catch {
      setListings([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleBuy(orderId: string) {
    setMessage('');
    try {
      const result = await buyMarketplaceOrder(orderId, 'wallet');
      setMessage(`Compra concluída! Moeda ${result.coin_id?.slice(0, 8)}…`);
      load();
    } catch (err: any) {
      if (err?.response?.status === 402) {
        const body = err.response.data;
        setMessage(`Saldo insuficiente (faltam R$ ${body.shortfall?.toFixed(2)}). Iniciando Pix…`);
        try {
          const pix = await buyMarketplaceOrder(orderId, 'pix');
          setPixModal({
            chargeId: pix.charge_id,
            copyPaste: pix.pix_copy_paste,
            amount: pix.amount,
          });
          pollCharge(pix.charge_id);
        } catch (pixErr: any) {
          setMessage(pixErr?.response?.data?.message ?? 'Erro ao gerar cobrança Pix');
        }
      } else {
        setMessage(err?.response?.data?.message ?? 'Erro na compra');
      }
    }
  }

  async function pollCharge(chargeId: string) {
    const maxAttempts = 30;
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      try {
        const status = await getMarketplaceChargeStatus(chargeId);
        if (status.status === 'COMPLETED') {
          setPixModal(null);
          setMessage('Pagamento Pix confirmado! Moeda transferida.');
          load();
          return;
        }
      } catch {
        /* continue polling */
      }
    }
  }

  async function handleSimulatePay() {
    if (!pixModal) return;
    try {
      await simulateMarketplaceCharge(pixModal.chargeId);
      setPixModal(null);
      setMessage('Pagamento simulado com sucesso!');
      load();
    } catch (err: any) {
      setMessage(err?.response?.data?.message ?? 'Erro ao confirmar pagamento');
    }
  }

  async function handleList() {
    setMessage('');
    try {
      await createMarketplaceListing(sellCoinId, parseFloat(sellPrice));
      setMessage('Moeda listada no marketplace (taxa de venda: 10%)');
      setSellPrice('');
      load();
    } catch (err: any) {
      setMessage(err?.response?.data?.message ?? 'Erro ao listar moeda');
    }
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.title}>Marketplace P2P</h1>
        <p style={styles.sub}>Taxa da plataforma: 10% em cada venda</p>
      </header>

      <div style={styles.tabs}>
        <button
          type="button"
          style={tab === 'buy' ? styles.tabActive : styles.tab}
          onClick={() => setTab('buy')}
        >
          Comprar
        </button>
        <button
          type="button"
          style={tab === 'sell' ? styles.tabActive : styles.tab}
          onClick={() => setTab('sell')}
        >
          Vender
        </button>
      </div>

      {message && <p style={styles.msg}>{message}</p>}

      {loading ? (
        <p style={styles.sub}>Carregando…</p>
      ) : tab === 'buy' ? (
        <div style={styles.list}>
          {listings.length === 0 ? (
            <p style={styles.sub}>Nenhum anúncio ativo no momento.</p>
          ) : (
            listings.map((item) => (
              <div key={item.id} style={styles.card}>
                <div>
                  <strong>Moeda {item.coin_type ?? 'RARA'}</strong>
                  <p style={styles.sub}>
                    Valor face: R$ {item.coin_value?.toFixed(2)} · Preço: R${' '}
                    {item.list_price?.toFixed(2)}
                  </p>
                  <p style={styles.fee}>Taxa KLIPYT: R$ {item.platform_fee?.toFixed(2)}</p>
                </div>
                <button type="button" style={styles.buyBtn} onClick={() => handleBuy(item.id)}>
                  Comprar
                </button>
              </div>
            ))
          )}
        </div>
      ) : (
        <div style={styles.sellForm}>
          {myCoins.length === 0 ? (
            <p style={styles.sub}>Você não possui moedas coletadas para vender.</p>
          ) : (
            <>
              <label style={styles.label}>Sua moeda</label>
              <select
                style={styles.input}
                value={sellCoinId}
                onChange={(e) => setSellCoinId(e.target.value)}
              >
                {myCoins.map((c) => (
                  <option key={c.coin_id} value={c.coin_id}>
                    {c.coin_type} — R$ {c.value?.toFixed(2)}
                  </option>
                ))}
              </select>
              <label style={styles.label}>Preço de venda (R$)</label>
              <input
                style={styles.input}
                type="number"
                min="0.01"
                step="0.01"
                value={sellPrice}
                onChange={(e) => setSellPrice(e.target.value)}
                placeholder="100.00"
              />
              <p style={styles.sub}>Você receberá 90% após a venda.</p>
              <button type="button" style={styles.buyBtn} onClick={handleList}>
                Listar moeda
              </button>
            </>
          )}
        </div>
      )}

      {pixModal && (
        <div style={styles.pixOverlay}>
          <div style={styles.pixCard}>
            <h3>Pagar com Pix — R$ {pixModal.amount.toFixed(2)}</h3>
            <p style={styles.copy}>{pixModal.copyPaste}</p>
            <button type="button" style={styles.buyBtn} onClick={() => navigator.clipboard.writeText(pixModal.copyPaste)}>
              Copiar código Pix
            </button>
            <button type="button" style={styles.simBtn} onClick={handleSimulatePay}>
              Simular pagamento (dev)
            </button>
            <button type="button" style={styles.cancelBtn} onClick={() => setPixModal(null)}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      <nav style={styles.nav}>
        <a href="/mapa" style={styles.navItem}>🗺️ Mapa</a>
        <a href="/album" style={styles.navItem}>📖 Álbum</a>
        <a href="/marketplace" style={styles.navActive}>🏪 Loja</a>
        <a href="/carteira" style={styles.navItem}>👛 Carteira</a>
      </nav>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#0a0a14', color: '#fff', paddingBottom: 80 },
  header: { padding: '20px 16px 8px' },
  title: { fontSize: 22, fontWeight: 700, color: '#F59E0B', margin: 0 },
  sub: { fontSize: 13, color: '#9CA3AF', margin: '4px 0 0' },
  tabs: { display: 'flex', gap: 8, padding: '12px 16px' },
  tab: {
    flex: 1, padding: 10, background: '#1a1a2e', border: '1px solid #333',
    borderRadius: 8, color: '#9CA3AF', cursor: 'pointer',
  },
  tabActive: {
    flex: 1, padding: 10, background: '#F59E0B', border: 'none',
    borderRadius: 8, color: '#000', fontWeight: 700, cursor: 'pointer',
  },
  msg: { margin: '0 16px', padding: 10, background: '#1e3a5f', borderRadius: 8, fontSize: 13 },
  list: { padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 },
  card: {
    background: '#1a1a2e', borderRadius: 12, padding: 14,
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
  },
  fee: { fontSize: 11, color: '#6B7280', margin: 0 },
  buyBtn: {
    padding: '10px 16px', background: '#F59E0B', color: '#000',
    border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
  },
  sellForm: { padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 },
  label: { fontSize: 12, color: '#9CA3AF' },
  input: {
    padding: 12, background: '#111', border: '1px solid #333',
    borderRadius: 8, color: '#fff', fontSize: 16,
  },
  pixOverlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000, padding: 16,
  },
  pixCard: {
    background: '#1a1a2e', borderRadius: 16, padding: 24, maxWidth: 400, width: '100%',
    display: 'flex', flexDirection: 'column', gap: 12,
  },
  copy: { fontSize: 11, wordBreak: 'break-all', color: '#D1D5DB', background: '#0a0a14', padding: 10, borderRadius: 8 },
  simBtn: {
    padding: 12, background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer',
  },
  cancelBtn: {
    padding: 12, background: 'transparent', color: '#9CA3AF', border: '1px solid #333', borderRadius: 8, cursor: 'pointer',
  },
  nav: {
    position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex',
    background: '#111', borderTop: '1px solid #333',
  },
  navItem: { flex: 1, textAlign: 'center', padding: '12px 0', color: '#9CA3AF', textDecoration: 'none', fontSize: 11 },
  navActive: { flex: 1, textAlign: 'center', padding: '12px 0', color: '#F59E0B', textDecoration: 'none', fontSize: 11, fontWeight: 700 },
};
