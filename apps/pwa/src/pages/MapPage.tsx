import React, { useCallback, useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import TeaserBanner from '../components/TeaserBanner';
import CoinCaptureModal from '../components/CoinCaptureModal';
import PackOpenModal from '../components/PackOpenModal';
import BillboardInteractModal from '../components/BillboardInteractModal';
import { getMapCoins } from '../services/api';

interface MapPin {
  id: string;
  lat: number;
  lon: number;
  type: 'PACK' | 'BRONZE' | 'GOLD' | 'BILLBOARD';
  value?: number;
  title?: string;
  density_tier?: string;
}

export default function MapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [pins, setPins] = useState<MapPin[]>([]);
  const [userPos, setUserPos] = useState<{ lat: number; lon: number } | null>(null);
  const [selectedCoin, setSelectedCoin] = useState<MapPin | null>(null);
  const [selectedPack, setSelectedPack] = useState<MapPin | null>(null);
  const [selectedBillboard, setSelectedBillboard] = useState<MapPin | null>(null);
  const [faseAtiva, setFaseAtiva] = useState(false);

  const fetchPins = useCallback(async (lat: number, lon: number) => {
    try {
      const data = await getMapCoins(lat, lon);
      setFaseAtiva(Boolean(data.fase_monetizacao_ativa));

      const coinPins: MapPin[] = (data.coins ?? []).map((c) => ({
        id: c.id,
        lat: c.lat,
        lon: c.lon,
        type: c.coin_type === 'GOLD' ? 'GOLD' : 'BRONZE',
        value: c.value,
      }));

      const packPins: MapPin[] = (data.packs ?? []).map((p) => ({
        id: p.id,
        lat: p.lat,
        lon: p.lon,
        type: 'PACK',
      }));

      const billboardPins: MapPin[] = (data.billboards ?? []).map((b) => ({
        id: b.id,
        lat: b.lat,
        lon: b.lon,
        type: 'BILLBOARD',
        title: b.title,
        density_tier: b.density_tier,
      }));

      setPins([...coinPins, ...packPins, ...billboardPins]);
    } catch {
      setPins([]);
    }
  }, []);

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

            const userIcon = L.divIcon({
              html: '<div style="width:16px;height:16px;background:#3B82F6;border:3px solid #fff;border-radius:50%"></div>',
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
  }, [fetchPins]);

  useEffect(() => {
    const map = leafletRef.current;
    if (!map) return;

    import('leaflet').then((L) => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      for (const pin of pins) {
        const emoji =
          pin.type === 'GOLD'
            ? '🏆'
            : pin.type === 'BRONZE'
              ? '🪙'
              : pin.type === 'BILLBOARD'
                ? '🪧'
                : '📦';

        const label =
          pin.type === 'BRONZE' || pin.type === 'GOLD'
            ? `<div style="font-size:11px;color:#F59E0B;font-weight:700;text-align:center">R$ ${pin.value?.toFixed(2)}</div>`
            : pin.type === 'BILLBOARD'
              ? `<div style="font-size:10px;color:#93C5FD;text-align:center">${pin.title ?? 'Outdoor'}</div>`
              : '';

        const icon = L.divIcon({
          html: `<div style="text-align:center"><span style="font-size:30px">${emoji}</span>${label}</div>`,
          className: '',
          iconSize: [44, 56],
          iconAnchor: [22, 56],
        });

        const marker = L.marker([pin.lat, pin.lon], { icon }).addTo(map);

        if (pin.type === 'GOLD' || pin.type === 'BRONZE') {
          marker.on('click', () => setSelectedCoin(pin));
        } else if (pin.type === 'PACK') {
          marker.on('click', () => setSelectedPack(pin));
        } else if (pin.type === 'BILLBOARD') {
          marker.on('click', () => setSelectedBillboard(pin));
        }

        markersRef.current.push(marker);
      }
    });
  }, [pins]);

  function refreshMap() {
    if (userPos) fetchPins(userPos.lat, userPos.lon);
  }

  return (
    <div style={{ height: '100vh', position: 'relative' }}>
      <TeaserBanner visible={!faseAtiva} context="map" />
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

      {selectedCoin && userPos && (selectedCoin.type === 'GOLD' || selectedCoin.type === 'BRONZE') && (
        <CoinCaptureModal
          coin={{
            id: selectedCoin.id,
            lat: selectedCoin.lat,
            lon: selectedCoin.lon,
            value: selectedCoin.value ?? 0,
            coin_type: selectedCoin.type,
          }}
          userLat={userPos.lat}
          userLon={userPos.lon}
          onClose={() => {
            setSelectedCoin(null);
            refreshMap();
          }}
        />
      )}

      {selectedPack && (
        <PackOpenModal
          packId={selectedPack.id}
          onClose={() => {
            setSelectedPack(null);
            refreshMap();
          }}
        />
      )}

      {selectedBillboard && userPos && (
        <BillboardInteractModal
          billboard={{
            id: selectedBillboard.id,
            lat: selectedBillboard.lat,
            lon: selectedBillboard.lon,
            title: selectedBillboard.title ?? 'Outdoor',
            density_tier: selectedBillboard.density_tier ?? 'PRATA',
          }}
          userLat={userPos.lat}
          userLon={userPos.lon}
          onClose={() => {
            setSelectedBillboard(null);
            refreshMap();
          }}
        />
      )}

      <nav style={S.nav}>
        <a href="/mapa" style={S.navActive}>🗺️ Mapa</a>
        <a href="/album" style={S.navItem}>📖 Álbum</a>
        <a href="/marketplace" style={S.navItem}>🏪 Loja</a>
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
    flex: 1, textAlign: 'center', padding: '12px 0',
    color: '#9CA3AF', textDecoration: 'none', fontSize: 11,
  },
  navActive: {
    flex: 1, textAlign: 'center', padding: '12px 0',
    color: '#F59E0B', textDecoration: 'none', fontSize: 11, fontWeight: 700,
  },
};
