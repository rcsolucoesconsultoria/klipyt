import React, { useEffect, useRef, useState } from 'react';
import TeaserBanner from '../components/TeaserBanner';
import { useSettings } from '../hooks/useSettings';
import { api } from '../services/api';

interface MapPin { id: string; lat: number; lon: number; type: 'PACK' | 'BRONZE' | 'GOLD'; value?: number; }

export default function MapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [pins, setPins] = useState<MapPin[]>([]);
  const settings = useSettings();

  useEffect(() => {
    if (!mapRef.current || leafletRef.current) return;

    import('leaflet').then(async (L) => {
      // @ts-ignore
      await import('leaflet/dist/leaflet.css');
      if (!mapRef.current) return;

      const map = L.map(mapRef.current, { center: [-23.5505, -46.6333], zoom: 15, zoomControl: false });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OSM' }).addTo(map);
      leafletRef.current = map;

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
          const { latitude: lat, longitude: lon } = pos.coords;
          map.setView([lat, lon], 16);
          fetchPins(lat, lon);
        }, () => fetchPins(-23.5505, -46.6333));
      }
    });

    return () => { leafletRef.current?.remove(); leafletRef.current = null; };
  }, []);

  async function fetchPins(lat: number, lon: number) {
    try {
      if (settings.fase_monetizacao_ativa) {
        const { data } = await api.get(`/map/layers?lat=${lat}&lon=${lon}`);
        const coinPins: MapPin[] = data.coins.map((c: any) => ({
          id: c.id, lat: c.lat, lon: c.lon,
          type: c.coin_type === 'GOLD' ? 'GOLD' : 'BRONZE',
          value: c.value,
        }));
        setPins(coinPins);
      } else {
        const { data } = await api.get(`/album/packs/nearby?lat=${lat}&lon=${lon}`);
        const packPins: MapPin[] = data.packs.map((p: any) => ({ id: p.id, lat: p.lat, lon: p.lon, type: 'PACK' as const }));
        setPins(packPins);
      }
    } catch { /* sem auth ainda */ }
  }

  useEffect(() => {
    const map = leafletRef.current;
    if (!map) return;
    import('leaflet').then((L) => {
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
      for (const pin of pins) {
        const emoji = pin.type === 'GOLD' ? '🏆' : pin.type === 'BRONZE' ? '🪙' : '📦';
        const icon = L.divIcon({ html: `<span style="font-size:28px">${emoji}</span>`, className: '', iconSize: [32, 32] });
        const marker = L.marker([pin.lat, pin.lon], { icon }).addTo(map);
        marker.bindPopup(pin.type === 'PACK' ? 'Pacote de figurinhas grátis!' : `Moeda: R$ ${pin.value?.toFixed(2)}`);
        markersRef.current.push(marker);
      }
    });
  }, [pins]);

  return (
    <div style={{ height: '100vh', position: 'relative' }}>
      <TeaserBanner visible={!settings.fase_monetizacao_ativa} context="map" />
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      <nav style={S.nav}>
        <a href="/mapa" style={S.navActive}>🗺️ Mapa</a>
        <a href="/album" style={S.navItem}>📖 Álbum</a>
        <a href="/carteira" style={S.navItem}>👛 Carteira</a>
      </nav>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  nav: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 1000, display: 'flex', background: '#111', borderTop: '1px solid #333' },
  navItem: { flex: 1, textAlign: 'center', padding: '14px 0', color: '#9CA3AF', textDecoration: 'none', fontSize: 12 },
  navActive: { flex: 1, textAlign: 'center', padding: '14px 0', color: '#F59E0B', textDecoration: 'none', fontSize: 12, fontWeight: 700 },
};
