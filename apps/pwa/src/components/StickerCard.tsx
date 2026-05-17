import React from 'react';

type Rarity = 'COMMON' | 'RARE' | 'LEGENDARY';

interface StickerCardProps {
  id: string;
  title: string;
  rarity: Rarity;
  image_url: string;
  has_reward: boolean;
  qr_token?: string | null;
  onRedeem?: (qrToken: string) => void;
}

const RARITY_STYLE: Record<Rarity, React.CSSProperties> = {
  COMMON: {
    border: '1.5px solid #CD7F32',
    background: 'linear-gradient(145deg, #1a1008 0%, #2d1f0e 100%)',
  },
  RARE: {
    border: '1.5px solid #C0C0C0',
    background: 'linear-gradient(145deg, #0d0d1a 0%, #1a1a2e 100%)',
    boxShadow: '0 0 12px rgba(192,192,192,0.3)',
  },
  LEGENDARY: {
    border: '2px solid #FFD700',
    background: 'linear-gradient(145deg, #1a0d00 0%, #2d1a00 100%)',
    boxShadow: '0 0 20px rgba(255,215,0,0.5)',
    animation: 'holo 3s ease infinite',
  },
};

const RARITY_LABEL: Record<Rarity, string> = {
  COMMON: '🥉 Comum',
  RARE: '🥈 Rara',
  LEGENDARY: '🥇 Lendária',
};

export default function StickerCard({ id, title, rarity, image_url, has_reward, qr_token, onRedeem }: StickerCardProps) {
  return (
    <div style={{ ...styles.card, ...RARITY_STYLE[rarity] }}>
      <img src={image_url} alt={title} style={styles.img} loading="lazy" />
      <div style={styles.footer}>
        <span style={styles.title}>{title}</span>
        <span style={styles.rarityLabel}>{RARITY_LABEL[rarity]}</span>
        {has_reward && qr_token && (
          <button style={styles.redeemBtn} onClick={() => onRedeem?.(qr_token)}>
            🎁 Resgatar
          </button>
        )}
      </div>

      <style>{`
        @keyframes holo {
          0%, 100% { box-shadow: 0 0 20px rgba(255,215,0,0.4); }
          50% { box-shadow: 0 0 30px rgba(255,215,0,0.8); }
        }
      `}</style>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    borderRadius: 10,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
  img: {
    width: '100%',
    aspectRatio: '0.72',
    objectFit: 'cover',
  },
  footer: {
    padding: '6px 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  title: {
    fontSize: 11,
    fontWeight: 700,
    color: '#fff',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  rarityLabel: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  redeemBtn: {
    marginTop: 4,
    padding: '4px 0',
    background: '#F59E0B',
    color: '#000',
    border: 'none',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 700,
    cursor: 'pointer',
  },
};
