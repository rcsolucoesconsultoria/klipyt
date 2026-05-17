import React, { useEffect, useRef, useState } from 'react';

interface VideoPlayerProps {
  videoUrl: string;
  onEnded: () => void;
  onError?: () => void;
}

export default function VideoPlayer({ videoUrl, onEnded, onError }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    // Tenta fullscreen (RF07)
    if (v.requestFullscreen) v.requestFullscreen().catch(() => {});

    v.play().catch(() => onError?.());

    const handleEnded = () => {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      onEnded();
    };
    const handleTime = () => {
      setProgress(v.currentTime);
      setDuration(v.duration || 0);
    };

    v.addEventListener('ended', handleEnded);
    v.addEventListener('timeupdate', handleTime);
    v.addEventListener('loadedmetadata', () => setDuration(v.duration));

    return () => {
      v.removeEventListener('ended', handleEnded);
      v.removeEventListener('timeupdate', handleTime);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, [onEnded, onError]);

  // Bloqueia teclas de atalho que pulam o vídeo (RF07)
  useEffect(() => {
    const block = (e: KeyboardEvent) => {
      if (['ArrowRight', 'ArrowLeft', 'Space', 'Escape', 'k', 'l', 'j'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener('keydown', block, true);
    return () => window.removeEventListener('keydown', block, true);
  }, []);

  const pct = duration > 0 ? (progress / duration) * 100 : 0;
  const remaining = Math.max(0, Math.ceil(duration - progress));

  return (
    <div style={S.overlay}>
      {/* RF07: sem controles nativos */}
      <video
        ref={videoRef}
        src={videoUrl}
        style={S.video}
        playsInline
        muted={false}
        controls={false}
        disablePictureInPicture
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* Barra de progresso customizada — sem scrubbing */}
      <div style={S.progressBar}>
        <div style={{ ...S.progressFill, width: `${pct}%` }} />
      </div>

      <div style={S.info}>
        <span style={S.badge}>📢 Anúncio obrigatório</span>
        {remaining > 0 && (
          <span style={S.timer}>{remaining}s</span>
        )}
      </div>

      {/* Camada de bloqueio que impede clique nos controles de vídeo */}
      <div style={S.blocker} onContextMenu={(e) => e.preventDefault()} />
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 9000,
    background: '#000',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  video: {
    width: '100%', height: '100%',
    objectFit: 'contain',
    pointerEvents: 'none',
  },
  progressBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 4, background: 'rgba(255,255,255,0.2)',
  },
  progressFill: {
    height: '100%', background: '#F59E0B',
    transition: 'width 0.5s linear',
  },
  info: {
    position: 'absolute', top: 16, left: 0, right: 0,
    display: 'flex', justifyContent: 'space-between', padding: '0 16px',
    pointerEvents: 'none',
  },
  badge: {
    background: 'rgba(0,0,0,0.6)', color: '#fff',
    padding: '4px 10px', borderRadius: 12, fontSize: 12,
  },
  timer: {
    background: 'rgba(245,158,11,0.9)', color: '#000',
    padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700,
  },
  // Cobre a área de controles do navegador — impede skip (RF07)
  blocker: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 60,
    zIndex: 1,
  },
};
