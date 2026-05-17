import React, { useEffect, useState } from 'react';
import VideoPlayer from './VideoPlayer';
import WebARCapture from './WebARCapture';
import { api } from '../services/api';

type Step = 'proximity' | 'video' | 'webar' | 'success' | 'error';

interface CoinPin {
  id: string;
  lat: number;
  lon: number;
  value: number;
  coin_type: 'BRONZE' | 'GOLD';
}

interface CampaignDetail {
  video_url: string;
}

interface CoinCaptureModalProps {
  coin: CoinPin;
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

export default function CoinCaptureModal({
  coin,
  userLat,
  userLon,
  onClose,
}: CoinCaptureModalProps) {
  const [step, setStep] = useState<Step>('proximity');
  const [distance, setDistance] = useState(0);
  const [videoUrl, setVideoUrl] = useState('');
  const [collectToken, setCollectToken] = useState('');
  const [timestampMs, setTimestampMs] = useState(0);
  const [creditedValue, setCreditedValue] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const d = distanceMeters(userLat, userLon, coin.lat, coin.lon);
    setDistance(Math.round(d));
  }, [userLat, userLon, coin.lat, coin.lon]);

  async function handleUnlock() {
    try {
      // Busca o vídeo da campanha associada à moeda
      const { data } = await api.get(`/map/coin/${coin.id}/campaign`);
      setVideoUrl(data.video_url || 'https://www.w3schools.com/html/mov_bbb.mp4');
    } catch {
      // fallback para demo sem campanha configurada
      setVideoUrl('https://www.w3schools.com/html/mov_bbb.mp4');
    }
    setStep('video');
  }

  // RF07 — chamado pelo VideoPlayer quando onEnded dispara
  async function handleVideoEnded() {
    try {
      const { data } = await api.post('/campaigns/video-watched', { coin_id: coin.id });
      setCollectToken(data.collect_token);
      setTimestampMs(data.timestamp_ms);
      setStep('webar');
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message ?? 'Erro ao confirmar vídeo');
      setStep('error');
    }
  }

  // RF07 — chamado pelo WebARCapture quando o usuário toca na moeda
  async function handleCapture() {
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000, enableHighAccuracy: true }),
      );

      const { data } = await api.post('/campaigns/collect', {
        coin_id: coin.id,
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
        timestamp_ms: timestampMs,
        hmac: collectToken,
      });

      setCreditedValue(data.credited);
      setStep('success');
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message ?? 'Erro ao capturar moeda');
      setStep('error');
    }
  }

  // ---- STEP: PROXIMIDADE ----
  if (step === 'proximity') {
    const inRange = distance <= 25;
    return (
      <div style={S.overlay}>
        <div style={S.sheet}>
          <button style={S.closeBtn} onClick={onClose}>✕</button>

          <div style={S.coinIcon}>{coin.coin_type === 'GOLD' ? '🏆' : '🪙'}</div>
          <h2 style={S.title}>
            {coin.coin_type === 'GOLD' ? 'Baú de Ouro' : 'Moeda Bronze'}
          </h2>
          <p style={S.value}>R$ {coin.value.toFixed(2)}</p>

          <div style={{ ...S.distancePill, background: inRange ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)', borderColor: inRange ? '#10B981' : '#EF4444' }}>
            <span style={{ color: inRange ? '#34D399' : '#F87171' }}>
              {inRange ? '✅' : '📍'} {distance}m de distância
            </span>
          </div>

          {inRange ? (
            <button style={S.primaryBtn} onClick={handleUnlock}>
              🔓 Desbloquear Recompensa
            </button>
          ) : (
            <>
              <p style={S.hint}>Aproxime-se a menos de 25 metros para desbloquear</p>
              <div style={S.compass}>
                <div style={S.compassRing}>
                  <span style={S.compassDist}>{distance}m</span>
                </div>
                <p style={S.compassHint}>Caminhe na direção da moeda</p>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ---- STEP: VÍDEO (RF07) ----
  if (step === 'video') {
    return (
      <VideoPlayer
        videoUrl={videoUrl}
        onEnded={handleVideoEnded}
        onError={() => { setErrorMsg('Erro ao reproduzir vídeo'); setStep('error'); }}
      />
    );
  }

  // ---- STEP: WEBAR (RF07) ----
  if (step === 'webar') {
    return (
      <WebARCapture
        coinValue={coin.value}
        onCapture={handleCapture}
        onError={(msg) => { setErrorMsg(msg); setStep('error'); }}
      />
    );
  }

  // ---- STEP: SUCESSO ----
  if (step === 'success') {
    return (
      <div style={S.overlay}>
        <div style={S.sheet}>
          <div style={S.successIcon}>⚡</div>
          <h2 style={S.title}>Moeda Capturada!</h2>
          <p style={S.successValue}>+ R$ {creditedValue.toFixed(2)}</p>
          <p style={S.hint}>O valor foi adicionado à sua carteira</p>
          <button style={S.primaryBtn} onClick={onClose}>Ver minha carteira</button>
        </div>
      </div>
    );
  }

  // ---- STEP: ERRO ----
  return (
    <div style={S.overlay}>
      <div style={S.sheet}>
        <div style={{ fontSize: 48, textAlign: 'center' as const }}>❌</div>
        <h2 style={S.title}>Ops!</h2>
        <p style={{ ...S.hint, color: '#F87171', textAlign: 'center' as const }}>{errorMsg}</p>
        <button style={S.primaryBtn} onClick={onClose}>Fechar</button>
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 8000,
    background: 'rgba(0,0,0,0.7)',
    display: 'flex', alignItems: 'flex-end',
  },
  sheet: {
    width: '100%', background: '#1a1a2e',
    borderRadius: '20px 20px 0 0', padding: '28px 24px 40px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute', top: 16, right: 16,
    background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff',
    width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', fontSize: 14,
  },
  coinIcon: { fontSize: 52 },
  title: { fontSize: 22, fontWeight: 700, color: '#fff', margin: 0 },
  value: { fontSize: 32, fontWeight: 700, color: '#F59E0B', margin: 0 },
  distancePill: {
    border: '1px solid', borderRadius: 20,
    padding: '8px 20px', fontSize: 14,
  },
  primaryBtn: {
    width: '100%', padding: '16px 0',
    background: '#F59E0B', color: '#000',
    border: 'none', borderRadius: 12,
    fontSize: 17, fontWeight: 700, cursor: 'pointer',
    marginTop: 8,
  },
  hint: { color: '#9CA3AF', fontSize: 13, margin: 0, textAlign: 'center' },
  compass: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginTop: 8,
  },
  compassRing: {
    width: 80, height: 80, borderRadius: '50%',
    border: '3px solid rgba(245,158,11,0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 0 20px rgba(245,158,11,0.2)',
  },
  compassDist: { color: '#F59E0B', fontWeight: 700, fontSize: 14 },
  compassHint: { color: '#6B7280', fontSize: 12, margin: 0 },
  successIcon: { fontSize: 64 },
  successValue: { fontSize: 40, fontWeight: 700, color: '#10B981', margin: 0 },
};
