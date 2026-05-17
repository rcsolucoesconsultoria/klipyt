import React, { useEffect, useState } from 'react';
import StickerCard from '../components/StickerCard';
import TradePinModal from '../components/TradePinModal';
import { api, redeemCoupon } from '../services/api';

interface UserSticker {
  id: string;
  sticker: {
    id: string;
    title: string;
    rarity: 'COMMON' | 'RARE' | 'LEGENDARY';
    image_url: string;
    has_reward: boolean;
  };
  quantity: number;
  qr_token: string | null;
  reward_status: 'NOT_REDEEMED' | 'REDEEMED';
}

export default function AlbumPage() {
  const [stickers, setStickers] = useState<UserSticker[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPinModal, setShowPinModal] = useState(false);

  useEffect(() => {
    api.get('/user/me').then(() => {
      // After verifying auth, we'd fetch user stickers — placeholder for now
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  async function handleRedeem(qrToken: string) {
    try {
      const result = await redeemCoupon(qrToken);
      alert(`✅ ${result.message} (${result.discount_percent}% desconto)`);
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Erro ao resgatar cupom');
    }
  }

  const totalSlots = 30;
  const collectedIds = new Set(stickers.map((s) => s.sticker.id));

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Álbum da Copa</h1>
        <span style={styles.progress}>{stickers.length}/{totalSlots}</span>
      </div>
      <p style={styles.subtitle}>Visite os estabelecimentos parceiros para colecionar</p>

      <div style={styles.grid}>
        {stickers.map((us) => (
          <StickerCard
            key={us.id}
            id={us.sticker.id}
            title={us.sticker.title}
            rarity={us.sticker.rarity}
            image_url={us.sticker.image_url}
            has_reward={us.sticker.has_reward}
            qr_token={us.qr_token}
            onRedeem={handleRedeem}
          />
        ))}

        {Array.from({ length: Math.max(0, totalSlots - stickers.length) }).map((_, i) => (
          <div key={`empty-${i}`} style={styles.emptySlot}>
            <span style={styles.emptyNumber}>{stickers.length + i + 1}</span>
          </div>
        ))}
      </div>

      <div style={styles.fab}>
        <button style={styles.tradePinBtn} onClick={() => setShowPinModal(true)}>
          🔄 Usar PIN de Troca
        </button>
      </div>

      {showPinModal && (
        <TradePinModal
          onClose={() => setShowPinModal(false)}
          onSuccess={(stickerId) => {
            setShowPinModal(false);
            alert(`Figurinha recebida com sucesso! ID: ${stickerId}`);
          }}
        />
      )}

      <nav style={styles.bottomNav}>
        <a href="/mapa" style={styles.navItem}>🗺️ Mapa</a>
        <a href="/album" style={styles.navItemActive}>📖 Álbum</a>
        <a href="/carteira" style={styles.navItem}>👛 Carteira</a>
      </nav>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { height: '100vh', background: '#0a0a14', color: '#fff', overflowY: 'auto', paddingBottom: 80 },
  header: { padding: '20px 16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 700, color: '#F59E0B' },
  progress: { fontSize: 14, color: '#6B7280', fontWeight: 600 },
  subtitle: { padding: '4px 16px 16px', fontSize: 13, color: '#9CA3AF' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, padding: '0 12px' },
  emptySlot: {
    aspectRatio: '0.72', border: '1.5px dashed rgba(245,158,11,0.2)', borderRadius: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(245,158,11,0.03)',
  },
  emptyNumber: { fontSize: 13, color: 'rgba(245,158,11,0.25)', fontWeight: 700 },
  fab: { position: 'fixed', bottom: 72, left: '50%', transform: 'translateX(-50%)', zIndex: 100 },
  tradePinBtn: {
    padding: '12px 24px', background: '#1d4ed8', color: '#fff',
    border: 'none', borderRadius: 24, fontSize: 14, fontWeight: 600, cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(29,78,216,0.4)',
  },
  bottomNav: { position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex', background: '#111', borderTop: '1px solid #333' },
  navItem: { flex: 1, textAlign: 'center', padding: '14px 0', color: '#9CA3AF', textDecoration: 'none', fontSize: 12 },
  navItemActive: { flex: 1, textAlign: 'center', padding: '14px 0', color: '#F59E0B', textDecoration: 'none', fontSize: 12, fontWeight: 700 },
};
