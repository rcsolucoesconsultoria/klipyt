import React, { useEffect, useRef, useState } from 'react';

interface WebARCaptureProps {
  coinValue: number;
  onCapture: () => void;
  onError: (msg: string) => void;
}

/**
 * RF07 — WebAR real:
 *  1. getUserMedia abre câmera traseira como fundo
 *  2. Three.js canvas transparente sobreposto (alpha:true + setClearColor 0 opacity)
 *  3. DeviceOrientationEvent move a moeda conforme o celular gira (efeito AR)
 *  4. Toque na tela captura a moeda
 */
export default function WebARCapture({ coinValue, onCapture, onError }: WebARCaptureProps) {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animRef   = useRef<number>(0);
  const orientRef = useRef({ beta: 0, gamma: 0 });

  const [ready,  setReady]  = useState(false);
  const [tapped, setTapped] = useState(false);
  const [status, setStatus] = useState('Abrindo câmera…');

  async function requestOrientationPermission() {
    const DevOrEv = DeviceOrientationEvent as any;
    if (typeof DevOrEv.requestPermission === 'function') {
      try { await DevOrEv.requestPermission(); } catch { /* usuário negou */ }
    }
  }

  useEffect(() => {
    let mounted = true;

    async function init() {
      /* ── 1. Câmera traseira (RF07: getUserMedia) ── */
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
          onError('Câmera indisponível. Permita o acesso nas configurações do navegador.');
          return;
        }
      }
      if (!mounted) { stream.getTracks().forEach(t => t.stop()); return; }
      streamRef.current = stream;

      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();
      setStatus('Apontando câmera…');

      /* ── 2. Three.js (carregado dinamicamente) ── */
      const THREE = await import('three');
      if (!mounted) return;

      const canvas = canvasRef.current!;
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;

      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setClearColor(0x000000, 0); // transparente — câmera real aparece atrás

      const scene  = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 100);
      camera.position.set(0, 0, 2.5);

      /* ── Moeda dourada ── */
      const coinGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.1, 64);
      const coinMat = new THREE.MeshStandardMaterial({
        color: 0xF59E0B, metalness: 0.95, roughness: 0.05,
        emissive: new THREE.Color(0x7c4a00), emissiveIntensity: 0.3,
      });
      const coinMesh = new THREE.Mesh(coinGeo, coinMat);
      scene.add(coinMesh);

      /* ── Face com canvas 2D (texto PIX GO + valor) ── */
      const fc = document.createElement('canvas');
      fc.width = fc.height = 512;
      const ctx = fc.getContext('2d')!;
      const grd = ctx.createRadialGradient(256, 256, 50, 256, 256, 256);
      grd.addColorStop(0, '#FFD700');
      grd.addColorStop(1, '#B8860B');
      ctx.fillStyle = grd;
      ctx.beginPath(); ctx.arc(256, 256, 256, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#8B6914'; ctx.lineWidth = 14; ctx.stroke();
      ctx.fillStyle = '#3d2600';
      ctx.font = 'bold 110px Arial Black'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('PIX', 256, 170);
      ctx.font = 'bold 80px Arial Black'; ctx.fillText('GO', 256, 275);
      ctx.font = 'bold 58px Arial'; ctx.fillStyle = '#1a0d00';
      ctx.fillText(`R$ ${coinValue.toFixed(2)}`, 256, 385);

      const face = new THREE.Mesh(
        new THREE.CircleGeometry(0.68, 64),
        new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(fc) }),
      );
      face.position.set(0, 0.051, 0);
      face.rotation.x = -Math.PI / 2;
      coinMesh.add(face);

      /* ── Halo pulsante ── */
      const haloMat = new THREE.MeshBasicMaterial({
        color: 0xFFD700, side: THREE.DoubleSide, transparent: true, opacity: 0.35,
      });
      const halo = new THREE.Mesh(new THREE.RingGeometry(0.8, 1.1, 64), haloMat);
      halo.rotation.x = Math.PI / 2;
      scene.add(halo);

      /* ── Partículas orbitais ── */
      const N = 30;
      const pPos = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) {
        const a = (i / N) * Math.PI * 2;
        const r = 0.9 + Math.random() * 0.5;
        pPos[i * 3] = Math.cos(a) * r;
        pPos[i * 3 + 1] = (Math.random() - 0.5) * 0.4;
        pPos[i * 3 + 2] = Math.sin(a) * r;
      }
      const pGeo = new THREE.BufferGeometry();
      pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
      const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({
        color: 0xFFD700, size: 0.045, transparent: true, opacity: 0.85,
      }));
      scene.add(particles);

      /* ── Iluminação ── */
      scene.add(new THREE.AmbientLight(0xffffff, 1.8));
      const sun = new THREE.DirectionalLight(0xfffacd, 3.5);
      sun.position.set(2, 5, 3);
      scene.add(sun);
      const rim = new THREE.DirectionalLight(0xF59E0B, 1.8);
      rim.position.set(-2, -1, -2);
      scene.add(rim);

      /* ── 3. Giroscópio — efeito AR (moeda "prende" no espaço) ── */
      const onOrient = (e: DeviceOrientationEvent) => {
        orientRef.current = { beta: e.beta ?? 0, gamma: e.gamma ?? 0 };
      };
      await requestOrientationPermission();
      window.addEventListener('deviceorientation', onOrient, true);

      setReady(true);
      setStatus('');

      /* ── 4. Loop de animação ── */
      let t = 0;
      function animate() {
        if (!mounted) return;
        animRef.current = requestAnimationFrame(animate);
        t += 0.025;

        /* Flutuação base */
        const floatY = Math.sin(t * 1.2) * 0.14;

        /* Deslocamento pelo giroscópio (suavizado) */
        const { gamma, beta } = orientRef.current;
        const targetX = (gamma / 90) * 0.55;
        const targetY = -(beta / 180) * 0.35 + floatY;
        coinMesh.position.x += (targetX - coinMesh.position.x) * 0.07;
        coinMesh.position.y += (targetY - coinMesh.position.y) * 0.05;

        /* Rotação */
        coinMesh.rotation.y += 0.02;

        /* Halo segue a moeda */
        halo.position.x = coinMesh.position.x;
        halo.position.y = coinMesh.position.y - 0.04;
        haloMat.opacity = 0.25 + Math.sin(t * 2.5) * 0.12;
        const ps = 0.92 + Math.sin(t * 2) * 0.08;
        halo.scale.set(ps, ps, ps);

        /* Partículas giram */
        particles.position.copy(coinMesh.position);
        particles.rotation.y += 0.01;

        renderer.render(scene, camera);
      }
      animate();

      /* Resize */
      const onResize = () => {
        canvas.width = window.innerWidth; canvas.height = window.innerHeight;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };
      window.addEventListener('resize', onResize);

      return () => {
        window.removeEventListener('deviceorientation', onOrient, true);
        window.removeEventListener('resize', onResize);
        renderer.dispose();
      };
    }

    init();

    return () => {
      mounted = false;
      cancelAnimationFrame(animRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [coinValue, onCapture, onError]);

  function handleTap(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    if (!ready || tapped) return;
    setTapped(true);

    /* Flash dourado */
    const flash = document.createElement('div');
    flash.style.cssText =
      'position:fixed;inset:0;background:radial-gradient(circle,#FFD700 0%,transparent 70%);' +
      'opacity:0.85;z-index:9999;pointer-events:none;transition:opacity 0.5s ease-out';
    document.body.appendChild(flash);
    requestAnimationFrame(() => requestAnimationFrame(() => { flash.style.opacity = '0'; }));
    setTimeout(() => flash.remove(), 600);

    setTimeout(() => onCapture(), 400);
  }

  return (
    <div style={S.root} onClick={handleTap} onTouchEnd={handleTap}>

      {/* Feed real da câmera como fundo */}
      <video ref={videoRef} style={S.cam} playsInline muted autoPlay />

      {/* Moeda 3D Three.js — canvas transparente */}
      <canvas ref={canvasRef} style={S.canvas} />

      {/* Mira central */}
      {ready && !tapped && <div style={S.reticle}><div style={S.dot} /></div>}

      {/* HUD inferior */}
      <div style={S.hud}>
        {!ready && (
          <div style={S.pill}>
            <div style={S.spinner} />
            <span style={{ color: '#fff', fontSize: 14 }}>{status}</span>
          </div>
        )}
        {ready && !tapped && (
          <div style={S.tapCard}>
            <span style={{ fontSize: 24 }}>👆</span>
            <div>
              <p style={S.tapLabel}>Toque para capturar</p>
              <p style={S.tapValue}>R$ {coinValue.toFixed(2)}</p>
            </div>
          </div>
        )}
        {tapped && (
          <div style={{ ...S.pill, background: 'rgba(245,158,11,0.9)' }}>
            <span style={{ fontSize: 22 }}>⚡</span>
            <span style={{ color: '#000', fontWeight: 700, fontSize: 16 }}>Capturando…</span>
          </div>
        )}
      </div>

      {/* Instrução topo */}
      {ready && !tapped && (
        <div style={S.topBar}>
          <span style={S.topText}>📷 Aponte para o espaço à sua frente</span>
        </div>
      )}

      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes arPulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(245,158,11,0.5); }
          50%      { box-shadow: 0 0 0 20px rgba(245,158,11,0); }
        }
      `}</style>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  root: {
    position: 'fixed', inset: 0, zIndex: 9000, background: '#000',
    userSelect: 'none', touchAction: 'none', cursor: 'crosshair',
  },
  cam: {
    position: 'absolute', inset: 0,
    width: '100%', height: '100%', objectFit: 'cover',
  },
  canvas: {
    position: 'absolute', inset: 0,
    width: '100%', height: '100%', pointerEvents: 'none',
  },
  reticle: {
    position: 'absolute', top: '50%', left: '50%',
    transform: 'translate(-50%,-50%)',
    width: 60, height: 60, border: '2px solid rgba(245,158,11,0.5)',
    borderRadius: '50%', pointerEvents: 'none',
    animation: 'arPulse 2s ease-in-out infinite',
  },
  dot: {
    position: 'absolute', top: '50%', left: '50%',
    transform: 'translate(-50%,-50%)',
    width: 6, height: 6, background: '#F59E0B', borderRadius: '50%',
  },
  hud: {
    position: 'absolute', bottom: 56, left: 0, right: 0,
    display: 'flex', justifyContent: 'center', pointerEvents: 'none',
  },
  pill: {
    background: 'rgba(0,0,0,0.75)', borderRadius: 24,
    padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 10,
  },
  spinner: {
    width: 18, height: 18, flexShrink: 0,
    border: '3px solid rgba(245,158,11,0.3)', borderTop: '3px solid #F59E0B',
    borderRadius: '50%', animation: 'spin 0.8s linear infinite',
  },
  tapCard: {
    background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(10px)',
    border: '1px solid rgba(245,158,11,0.4)',
    borderRadius: 20, padding: '14px 28px',
    display: 'flex', alignItems: 'center', gap: 14,
  },
  tapLabel: { color: '#fff', fontSize: 14, margin: 0 },
  tapValue: { color: '#F59E0B', fontSize: 26, fontWeight: 700, margin: 0, lineHeight: 1 },
  topBar: {
    position: 'absolute', top: 20, left: 0, right: 0,
    display: 'flex', justifyContent: 'center', pointerEvents: 'none',
  },
  topText: {
    background: 'rgba(0,0,0,0.65)', color: '#fff',
    padding: '8px 18px', borderRadius: 20, fontSize: 13,
  },
};
