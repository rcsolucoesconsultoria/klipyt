import React from 'react';

interface TeaserBannerProps {
  visible: boolean;
  context: 'map' | 'wallet';
}

const MESSAGES = {
  map: [
    'Treine o seu radar: Em breve você vai caçar Pix de verdade nesta tela!',
    'Em breve: Pix Real neste mapa. Fique de olho! 👀',
  ],
  wallet: [
    'Carteira em modo de demonstração. Em breve saques automáticos a partir de R$ 6,00',
  ],
};

export default function TeaserBanner({ visible, context }: TeaserBannerProps) {
  if (!visible) return null;

  const messages = MESSAGES[context];
  const msg = messages[Math.floor(Date.now() / 10000) % messages.length];

  return (
    <div style={styles.banner}>
      <span style={styles.icon}>🔒</span>
      <span style={styles.text}>{msg}</span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  banner: {
    background: 'linear-gradient(90deg, #1e3a5f 0%, #1d4ed8 100%)',
    color: '#BFDBFE',
    padding: '10px 14px',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 12,
    lineHeight: 1.4,
  },
  icon: {
    fontSize: 16,
    flexShrink: 0,
  },
  text: {
    flex: 1,
  },
};
