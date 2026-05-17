import React, { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import TeaserBanner from '../components/TeaserBanner';
import CoinCaptureModal from '../components/CoinCaptureModal';
import { useSettings } from '../hooks/useSettings';
import { api } from '../services/api';

interface MapPin {
  id: string;
  lat: number;
  lon: number;
  type: 'PACK' | 'BRONZE' | 'GOLD';
  value?: number;
}

export default function MapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [pins, setPins] = useState<MapPin[]>([]);
  const [userPos, setUserPos] = useState<{ lat: number; lon: number } | null>(null);
  const [selectedCoin, setSelectedCoin] = useState<MapPin | null>(null);
  const settings = useSettings();

  useEffect(() => {
    if (!mapRef.current || leafletRef.current) return;

    import('leaflet').then((L) => {
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
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;
            setUserPos({ lat, lon });
            map.setView([lat, lon], 16);

            // Marcador do usuário
            const userIcon = L.divIcon({
              html: '<div style="width:16px;height:16px;background:#3B82F6;border:3px solid #fff;border-radius:50%;box-shadow:0 0 0 4px rgba(59,130,246,0.3)"></div>',
              className: '',
              iconSize: [16, 16],
              iconAnchor: [8, 8],
            });
            L.marker([lat, lon], { icon: userIcon }).addTo(map);

            fetchPins(lat, lon);
          },
          () => fetchPins(-23.5505, -46.6333),
          { enableHighAccuracy: true },
        );
      }
    });

    return () => {
      leafletRef.current?.remove();
      leafletRef.current = null;
    };
  }, []);

  async function fetchPins(lat: number, lon: number) {
    try {
      if (settings.fase_monetizacao_ativa) {
        const { data } = await api.get(`/map/layers?lat=${lat}&lon=${lon}`);
        const coinPins: MapPin[] = (data.coins ?? []).map((c: any) => ({
          id: c.id,
          lat: c.lat,
          lon: c.lon,
          type: c.coin_type === 'GOLD' ? ('GOLD' as const) : ('BRONZE' as const),
          value: c.value,
        }));
        setPins(coinPins);
      } else {
        const { data } = await api.get(`/album/packs/nearby?lat=${lat}&lon=${lon}`);
        const packPins: MapPin[] = (data.packs ?? []).map((p: any) => ({
          id: p.id,
          lat: p.lat,
          lon: p.lon,
          type: 'PACK' as const,
        }));
        setPins(packPins);
      }
    } catch {
      /* não autenticado — sem pins */
    }
  }

  // Re-renderiza marcadores sempre que os pins mudam
  useEffect(() => {
    const map = leafletRef.current;
    if (!map) return;

    import('leaflet').then((L) => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      for (const pin of pins) {
        const emoji =
          pin.type === 'GOLD' ? '🏆' : pin.type === 'BRONZE' ? '🪙' : '📦';
        const label =
          pin.type !== 'PACK'
            ? `<div style="font-size:11px;color:#F59E0B;font-weight:700;text-align:center;margin-top:2px">R$ ${pin.value?.toFixed(2)}</div>`
            : '';

        const icon = L.divIcon({
          html: `<div style="text-align:center"><span style="font-size:30px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.6))">${emoji}</span>${label}</div>`,
          className: '',
          iconSize: [44, 48],
          iconAnchor: [22, 48],
        });

        const marker = L.marker([pin.lat, pin.lon], { icon }).addTo(map);

        // RF07: clique no marcador de moeda abre o fluxo de captura
        if (pin.type !== 'PACK') {
          marker.on('click', () => setSelectedCoin(pin));
          marker.bindTooltip(
            `${pin.type === 'GOLD' ? 'Baú de Ouro' : 'Moeda Bronze'} · R$ ${pin.value?.toFixed(2)}`,
            { permanent: false, direction: 'top' },
          );
        } else {
          marker.bindPopup('📦 Pacote de figurinhas grátis! Aproxime-se para abrir.');
        }

        markersRef.current.push(marker);
      }
    });
  }, [pins]);

  return (
    <div style={{ height: '100vh', position: 'relative' }}>
      <TeaserBanner visible={!settings.fase_monetizacao_ativa} context="map" />

      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

      {/* RF07: Modal de captura com vídeo + WebAR */}
      {selectedCoin && selectedCoin.type !== 'PACK' && userPos && (
        <CoinCaptureModal
          coin={{ ...selectedCoin, value: selectedCoin.value ?? 0, coin_type: selectedCoin.type as 'BRONZE' | 'GOLD' }}
          userLat={userPos.lat}
          userLon={userPos.lon}
          onClose={() => {
            setSelectedCoin(null);
            // Re-busca pins para remover moeda coletada
            if (userPos) fetchPins(userPos.lat, userPos.lon);
          }}
        />
      )}

      <nav style={S.nav}>
        <a href="/mapa" style={S.navActive}>🗺️ Mapa</a>
        <a href="/album" style={S.navItem}>📖 Álbum</a>
        <a href="/carteira" style={S.navItem}>👛 Carteira</a>
      </nav>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  nav: {
    position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 1000,
    display: 'flex', background: '#111', borderTop: '1px solid #333',
  },
  navItem: {
    flex: 1, textAlign: 'center', padding: '14px 0',
    color: '#9CA3AF', textDecoration: 'none', fontSize: 12,
  },
  navActive: {
    flex: 1, textAlign: 'center', padding: '14px 0',
    color: '#F59E0B', textDecoration: 'none', fontSize: 12, fontWeight: 700,
  },
};
