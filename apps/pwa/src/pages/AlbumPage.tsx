import React from 'react';

export default function AlbumPage() {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Álbum da Copa</h1>
      <p style={styles.subtitle}>Colecione as figurinhas nos estabelecimentos parceiros</p>

      <div style={styles.albumGrid}>
        {Array.from({ length: 30 }).map((_, i) => (
          <div key={i} style={styles.stickerSlot}>
            <div style={styles.stickerEmpty}>
              <span style={styles.stickerNumber}>{i + 1}</span>
            </div>
          </div>
        ))}
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
    overflowY: 'auto',
    paddingBottom: 70,
  },
  title: {
    padding: '20px 16px 4px',
    fontSize: 22,
    fontWeight: 700,
    color: '#F59E0B',
  },
  subtitle: {
    padding: '0 16px 16px',
    fontSize: 13,
    color: '#9CA3AF',
  },
  albumGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: 8,
    padding: '0 12px',
  },
  stickerSlot: {
    aspectRatio: '0.7',
  },
  stickerEmpty: {
    width: '100%',
    height: '100%',
    border: '1.5px solid rgba(245,158,11,0.3)',
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(245,158,11,0.05)',
  },
  stickerNumber: {
    fontSize: 11,
    color: 'rgba(245,158,11,0.4)',
    fontWeight: 600,
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
