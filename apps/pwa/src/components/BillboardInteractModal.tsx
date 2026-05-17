import React, { useEffect, useState } from 'react';
import { interactBillboard } from '../services/api';

interface BillboardPin {
  id: string;
  lat: number;
  lon: number;
  title: string;
  density_tier: string;
}

interface BillboardInteractModalProps {
  billboard: BillboardPin;
  userLat: number;
  userLon: number;
  onClose: () => void;
}

function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function BillboardInteractModal({
  billboard,
  userLat,
  userLon,
  onClose,
}: BillboardInteractModalProps) {
  const [distance, setDistance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    creative_video_url: string | null;
    model_glb_url: string;
    impressions_today: number;
  } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setDistance(Math.round(distanceMeters(userLat, userLon, billboard.lat, billboard.lon)));
  }, [userLat, userLon, billboard]);

  async function handleInteract() {
    setLoading(true);
    setError('');
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true, timeout: 8000 }),
      );
      const data = await interactBillboard(
        billboard.id,
        pos.coords.latitude,
        pos.coords.longitude,
      );
      setResult(data);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Não foi possível interagir com o outdoor');
    } finally {
      setLoading(false);
    }
  }

  const tierEmoji = billboard.density_tier === 'OURO' ? '🥇' : billboard.density_tier === 'PRATA' ? '🥈' : '🥉';

  return (
    <div style={S.overlay}>
      <div style={S.sheet}>
        <button type="button" style={S.closeBtn} onClick={onClose}>✕</button>
        <div style={{ fontSize: 48 }}>🪧</div>
        <h2 style={S.title}>{billboard.title}</h2>
        <p style={S.sub}>{tierEmoji} Outdoor {billboard.density_tier}</p>
        <div style={S.pill}>{distance}m de distância (máx. 50m)</div>

        {!result ? (
          <>
            {error && <p style={S.error}>{error}</p>}
            <button
              type="button"
              style={S.btn}
              onClick={handleInteract}
              disabled={loading || distance > 50}
            >
              {loading ? 'Carregando...' : '👁️ Ver outdoor em AR'}
            </button>
            {distance > 50 && (
              <p style={S.hint}>Aproxime-se do painel virtual para interagir</p>
            )}
          </>
        ) : (
          <>
            {result.creative_video_url ? (
              <video
                src={result.creative_video_url}
                controls
                autoPlay
                playsInline
                style={{ width: '100%', borderRadius: 8, maxHeight: 200 }}
              />
            ) : (
              <p style={S.hint}>Criativo 3D: {result.model_glb_url}</p>
            )}
            <p style={S.hint}>Impressões hoje: {result.impressions_today}</p>
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
    alignItems: 'center', gap: 10, position: 'relative',
  },
  closeBtn: {
    position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.1)',
    border: 'none', color: '#fff', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer',
  },
  title: { fontSize: 20, fontWeight: 700, color: '#fff', margin: 0, textAlign: 'center' },
  sub: { color: '#F59E0B', fontSize: 14, margin: 0 },
  pill: {
    border: '1px solid #374151', borderRadius: 20, padding: '6px 16px',
    fontSize: 13, color: '#9CA3AF',
  },
  hint: { color: '#9CA3AF', fontSize: 12, textAlign: 'center', margin: 0 },
  error: { color: '#F87171', fontSize: 13, textAlign: 'center', margin: 0 },
  btn: {
    width: '100%', padding: '14px 0', background: '#F59E0B', color: '#000',
    border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', marginTop: 8,
  },
};
