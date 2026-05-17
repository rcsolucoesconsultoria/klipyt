import React from 'react';

export default function WalletPage() {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Minha Carteira</h1>

      {/* RF14: Banner teaser carteira em modo demonstração */}
      <div style={styles.demoBanner}>
        <span>🔒 Carteira em modo demonstração.</span>
        <strong> Em breve saques automáticos a partir de R$ 6,00!</strong>
      </div>

      <div style={styles.balanceCard}>
        <p style={styles.balanceLabel}>Saldo disponível</p>
        <p style={styles.balanceValue}>R$ 0,00</p>
        <button style={styles.withdrawBtn} disabled>
          🔒 Sacar via Pix
        </button>
        <p style={styles.withdrawHint}>Mínimo R$ 6,00 para sacar</p>
      </div>

      <nav style={styles.bottomNav}>
        <a href="/mapa" style={styles.navItem}>🗺️ Mapa</a>
        <a href="/album" style={styles.navItem}>📖 Álbum</a>
        <a href="/carteira" style={styles.navItem}>👛 Carteira</a>
      </nav>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: '100vh',
    background: '#0a0a14',
    color: '#fff',
    paddingBottom: 70,
  },
  title: {
    padding: '20px 16px 4px',
    fontSize: 22,
    fontWeight: 700,
    color: '#F59E0B',
  },
  demoBanner: {
    margin: '0 16px',
    padding: '10px 14px',
    background: 'rgba(37, 99, 235, 0.15)',
    border: '1px solid rgba(37, 99, 235, 0.4)',
    borderRadius: 8,
    fontSize: 13,
    color: '#93C5FD',
  },
  balanceCard: {
    margin: '20px 16px',
    padding: 24,
    background: 'rgba(245, 158, 11, 0.08)',
    border: '1px solid rgba(245, 158, 11, 0.2)',
    borderRadius: 12,
    textAlign: 'center',
  },
  balanceLabel: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  balanceValue: {
    fontSize: 40,
    fontWeight: 700,
    color: '#F59E0B',
    marginBottom: 20,
  },
  withdrawBtn: {
    width: '100%',
    padding: '14px 0',
    background: '#374151',
    color: '#6B7280',
    border: 'none',
    borderRadius: 8,
    fontSize: 16,
    fontWeight: 600,
    cursor: 'not-allowed',
  },
  withdrawHint: {
    marginTop: 8,
    fontSize: 12,
    color: '#6B7280',
  },
  bottomNav: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    display: 'flex',
    background: '#111',
    borderTop: '1px solid #333',
  },
  navItem: {
    flex: 1,
    textAlign: 'center',
    padding: '14px 0',
    color: '#fff',
    textDecoration: 'none',
    fontSize: 12,
  },
};
