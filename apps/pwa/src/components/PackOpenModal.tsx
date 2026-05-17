import React, { useState } from 'react';
import { openPack } from '../services/api';

interface PackOpenModalProps {
  packId: string;
  onClose: () => void;
}

export default function PackOpenModal({ packId, onClose }: PackOpenModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cards, setCards] = useState<Array<{ title: string; rarity: string }>>([]);

  async function handleOpen() {
    setLoading(true);
    setError('');
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true, timeout: 8000 }),
      );
      const result = await openPack(packId, pos.coords.latitude, pos.coords.longitude);
      const drawn = result?.cards ?? result?.stickers ?? [];
      setCards(
        drawn.map((c: any) => ({
          title: c.title ?? c.sticker?.title ?? 'Figurinha',
          rarity: c.rarity ?? c.sticker?.rarity ?? 'COMMON',
        })),
      );
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Não foi possível abrir o pacote');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={S.overlay}>
      <div style={S.sheet}>
        <button type="button" style={S.closeBtn} onClick={onClose}>✕</button>
        <div style={{ fontSize: 48 }}>📦</div>
        <h2 style={S.title}>Pacote de figurinhas</h2>
        {cards.length === 0 ? (
          <>
            <p style={S.hint}>Rasgue o pacote estando a menos de 25 metros do ponto no mapa.</p>
            {error && <p style={S.error}>{error}</p>}
            <button type="button" style={S.btn} onClick={handleOpen} disabled={loading}>
              {loading ? 'Abrindo...' : '🎉 Rasgar pacote'}
            </button>
          </>
        ) : (
          <>
            <p style={S.hint}>Você ganhou {cards.length} figurinha(s)!</p>
            <div style={S.grid}>
              {cards.map((c, i) => (
                <div key={i} style={S.card}>
                  <span>{c.rarity === 'LEGENDARY' ? '⭐' : c.rarity === 'RARE' ? '💎' : '🃏'}</span>
                  <strong style={{ fontSize: 12 }}>{c.title}</strong>
                </div>
              ))}
            </div>
            <button type="button" style={S.btn} onClick={onClose}>Fechar</button>
          </>
        )}
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 8000,
    background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'flex-end',
  },
  sheet: {
    width: '100%', background: '#1a1a2e', borderRadius: '20px 20px 0 0',
    padding: '28px 24px 40px', display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 12, position: 'relative',
  },
  closeBtn: {
    position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.1)',
    border: 'none', color: '#fff', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer',
  },
  title: { fontSize: 20, fontWeight: 700, color: '#fff', margin: 0 },
  hint: { color: '#9CA3AF', fontSize: 13, textAlign: 'center', margin: 0 },
  error: { color: '#F87171', fontSize: 13, textAlign: 'center', margin: 0 },
  btn: {
    width: '100%', padding: '14px 0', background: '#F59E0B', color: '#000',
    border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', marginTop: 8,
  },
  grid: { display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', width: '100%' },
  card: {
    background: '#0a0a14', borderRadius: 8, padding: 10, minWidth: 90,
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
  },
};
