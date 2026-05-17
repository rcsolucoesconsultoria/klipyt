import React, { useEffect, useRef } from 'react';

export default function MapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || leafletRef.current) return;

    import('leaflet').then((L) => {
      import('leaflet/dist/leaflet.css');

      if (!mapRef.current) return;

      const map = L.map(mapRef.current, {
        center: [-23.5505, -46.6333],
        zoom: 15,
        zoomControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
      }).addTo(map);

      leafletRef.current = map;

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            map.setView([pos.coords.latitude, pos.coords.longitude], 16);
          },
          () => {},
        );
      }
    });

    return () => {
      leafletRef.current?.remove();
      leafletRef.current = null;
    };
  }, []);

  return (
    <div style={{ height: '100vh', position: 'relative' }}>
      {/* RF14: Banner teaser "Em breve Pix Real" */}
      <div style={styles.teaserBanner}>
        <span>🔒 Em breve: caça moedas com <strong>Pix Real</strong> nesta tela!</span>
      </div>

      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

      <nav style={styles.bottomNav}>
        <a href="/mapa" style={styles.navItem}>🗺️ Mapa</a>
        <a href="/album" style={styles.navItem}>📖 Álbum</a>
        <a href="/carteira" style={styles.navItem}>👛 Carteira</a>
      </nav>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  teaserBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    background: 'linear-gradient(90deg, #1e3a5f, #2563eb)',
    color: '#fff',
    padding: '10px 16px',
    textAlign: 'center',
    fontSize: 13,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
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
