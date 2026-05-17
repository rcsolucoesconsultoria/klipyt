import React, { useEffect, useRef, useState } from 'react';

interface WebARCaptureProps {
  coinValue: number;
  onCapture: () => void;
  onError: (msg: string) => void;
}

/**
 * RF07 — WebAR: abre câmera traseira, renderiza moeda 3D flutuante com Three.js,
 * usuário toca para capturar.
 */
export default function WebARCapture({ coinValue, onCapture, onError }: WebARCaptureProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const [ready, setReady] = useState(false);
  const [tapped, setTapped] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function init() {
      // 1. Câmera traseira (RF07: getUserMedia)
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
      } catch {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        } catch {
          onError('Câmera não disponível. Permita o acesso à câmera nas configurações do navegador.');
          return;
        }
      }
      if (!mounted) { stream.getTracks().forEach(t => t.stop()); return; }
      streamRef.current = stream;

      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();

      // 2. Three.js — carregado dinamicamente para não afetar o bundle inicial
      const THREE = await import('three');
      if (!mounted) return;

      const canvas = canvasRef.current!;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(window.devicePixelRatio);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
      camera.position.set(0, 0, 3);

      // Moeda dourada: cilindro raso (RF07 — moeda Pix GO customizada)
      const coinGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.12, 64);
      const coinMat = new THREE.MeshStandardMaterial({
        color: 0xF59E0B,
        metalness: 0.9,
        roughness: 0.1,
        emissive: 0x7c4a00,
        emissiveIntensity: 0.3,
      });
      const coin = new THREE.Mesh(coinGeo, coinMat);
      coin.rotation.x = Math.PI / 6;
      scene.add(coin);

      // Face da moeda — texto PIX GO
      const faceGeo = new THREE.CircleGeometry(0.75, 64);
      const canvas2d = document.createElement('canvas');
      canvas2d.width = 256; canvas2d.height = 256;
      const ctx = canvas2d.getContext('2d')!;
      ctx.fillStyle = '#F59E0B';
      ctx.fillRect(0, 0, 256, 256);
      ctx.fillStyle = '#000';
      ctx.font = 'bold 52px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('PIX', 128, 100);
      ctx.font = 'bold 36px Arial';
      ctx.fillText('GO', 128, 148);
      ctx.font = '28px Arial';
      ctx.fillText(`R$ ${coinValue.toFixed(2)}`, 128, 200);
      const tex = new THREE.CanvasTexture(canvas2d);
      const faceMat = new THREE.MeshBasicMaterial({ map: tex });
      const faceMesh = new THREE.Mesh(faceGeo, faceMat);
      faceMesh.position.set(0, 0.062, 0);
      faceMesh.rotation.x = -Math.PI / 2;
      coin.add(faceMesh);

      // Halo de brilho
      const haloGeo = new THREE.RingGeometry(0.85, 1.1, 64);
      const haloMat = new THREE.MeshBasicMaterial({ color: 0xFFD700, side: THREE.DoubleSide, transparent: true, opacity: 0.4 });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.rotation.x = Math.PI / 6;
      scene.add(halo);

      // Iluminação
      scene.add(new THREE.AmbientLight(0xffffff, 1.2));
      const dir = new THREE.DirectionalLight(0xffffff, 2);
      dir.position.set(2, 4, 3);
      scene.add(dir);

      setReady(true);

      let t = 0;
      // 3. Loop de animação — moeda flutuante + rotação (RF07)
      function animate() {
        if (!mounted) return;
        animFrameRef.current = requestAnimationFrame(animate);
        t += 0.02;
        coin.position.y = Math.sin(t) * 0.12;
        coin.rotation.y += 0.018;
        halo.position.y = coin.position.y;
        halo.rotation.z += 0.01;
        renderer.render(scene, camera);
      }
      animate();

      // Resize handler
      const onResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      };
      window.addEventListener('resize', onResize);

      return () => {
        window.removeEventListener('resize', onResize);
        renderer.dispose();
      };
    }

    init();

    return () => {
      mounted = false;
      cancelAnimationFrame(animFrameRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [coinValue, onCapture, onError]);

  function handleTap() {
    if (!ready || tapped) return;
    setTapped(true);

    // Feedback visual — flash dourado
    const flash = document.createElement('div');
    flash.style.cssText = 'position:fixed;inset:0;background:#F59E0B;opacity:0.8;z-index:9999;pointer-events:none;transition:opacity 0.4s';
    document.body.appendChild(flash);
    setTimeout(() => { flash.style.opacity = '0'; setTimeout(() => flash.remove(), 400); }, 50);

    setTimeout(() => onCapture(), 300);
  }

  return (
    <div
      ref={containerRef}
      style={S.container}
      onClick={handleTap}
    >
      {/* Feed da câmera como fundo (RF07) */}
      <video
        ref={videoRef}
        style={S.cameraFeed}
        playsInline
        muted
        autoPlay
      />

      {/* Canvas Three.js sobreposto */}
      <canvas ref={canvasRef} style={S.threeCanvas} />

      {/* UI overlay */}
      <div style={S.ui}>
        {!ready && (
          <div style={S.loading}>
            <div style={S.spinner} />
            <p style={S.loadingText}>Abrindo câmera...</p>
          </div>
        )}

        {ready && !tapped && (
          <div style={S.tapHint}>
            <span style={S.tapIcon}>👆</span>
            <p style={S.tapText}>Toque na moeda para capturar!</p>
            <p style={S.coinBadge}>R$ {coinValue.toFixed(2)}</p>
          </div>
        )}

        {tapped && (
          <div style={S.captured}>
            <p style={S.capturedText}>⚡ Capturando...</p>
          </div>
        )}
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed', inset: 0, zIndex: 9000,
    background: '#000',
    cursor: 'crosshair',
    userSelect: 'none',
  },
  cameraFeed: {
    position: 'absolute', inset: 0,
    width: '100%', height: '100%',
    objectFit: 'cover',
  },
  threeCanvas: {
    position: 'absolute', inset: 0,
    width: '100%', height: '100%',
    pointerEvents: 'none',
  },
  ui: {
    position: 'absolute', inset: 0,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'flex-end',
    paddingBottom: 60,
    pointerEvents: 'none',
  },
  loading: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 12,
    position: 'absolute', top: '50%', left: '50%',
    transform: 'translate(-50%,-50%)',
  },
  spinner: {
    width: 40, height: 40,
    border: '4px solid rgba(245,158,11,0.3)',
    borderTop: '4px solid #F59E0B',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: { color: '#F59E0B', fontSize: 14 },
  tapHint: {
    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
    borderRadius: 16, padding: '16px 28px',
    textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
    border: '1px solid rgba(245,158,11,0.4)',
  },
  tapIcon: { fontSize: 28 },
  tapText: { color: '#fff', fontSize: 14, margin: 0 },
  coinBadge: {
    color: '#F59E0B', fontSize: 22, fontWeight: 700, margin: 0,
    textShadow: '0 0 20px rgba(245,158,11,0.8)',
  },
  captured: {
    position: 'absolute', top: '50%', left: '50%',
    transform: 'translate(-50%,-50%)',
    background: 'rgba(245,158,11,0.9)', borderRadius: 16,
    padding: '20px 40px',
  },
  capturedText: {
    color: '#000', fontSize: 24, fontWeight: 700, margin: 0,
  },
};
