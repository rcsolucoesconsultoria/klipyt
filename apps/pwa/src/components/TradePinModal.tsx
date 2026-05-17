import React, { useState } from 'react';
import { confirmPin } from '../services/api';

interface TradePinModalProps {
  onClose: () => void;
  onSuccess: (stickerId: string) => void;
}

export default function TradePinModal({ onClose, onSuccess }: TradePinModalProps) {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleConfirm() {
    if (pin.length !== 4) { setError('PIN deve ter 4 dígitos'); return; }
    setLoading(true);
    setError('');

    try {
      if (!navigator.geolocation) throw new Error('GPS não disponível');
      const position = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 }),
      );

      const result = await confirmPin(
        pin,
        position.coords.latitude,
        position.coords.longitude,
      );
      onSuccess(result.sticker_id);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Erro ao confirmar troca';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={styles.title}>Confirmar Troca</h2>
        <p style={styles.subtitle}>Digite o PIN de 4 dígitos do ofertante</p>

        <input
          style={styles.input}
          type="number"
          inputMode="numeric"
          maxLength={4}
          placeholder="0000"
          value={pin}
          onChange={(e) => setPin(e.target.value.slice(0, 4))}
        />

        {error && <p style={styles.error}>{error}</p>}

        <div style={styles.buttons}>
          <button style={styles.cancelBtn} onClick={onClose}>Cancelar</button>
          <button style={styles.confirmBtn} onClick={handleConfirm} disabled={loading}>
            {loading ? 'Verificando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
    display: 'flex', alignItems: 'flex-end', zIndex: 9999,
  },
  modal: {
    width: '100%', background: '#1a1a2e', borderRadius: '16px 16px 0 0',
    padding: 24, display: 'flex', flexDirection: 'column', gap: 16,
  },
  title: { fontSize: 20, fontWeight: 700, color: '#F59E0B', textAlign: 'center' },
  subtitle: { fontSize: 13, color: '#9CA3AF', textAlign: 'center' },
  input: {
    textAlign: 'center', fontSize: 32, fontWeight: 700, letterSpacing: 12,
    padding: '12px 0', background: '#0d0d14', border: '1px solid #374151',
    borderRadius: 8, color: '#fff', width: '100%',
  },
  error: { color: '#F87171', fontSize: 13, textAlign: 'center' },
  buttons: { display: 'flex', gap: 12 },
  cancelBtn: {
    flex: 1, padding: 14, background: '#374151', color: '#9CA3AF',
    border: 'none', borderRadius: 8, fontSize: 15, cursor: 'pointer',
  },
  confirmBtn: {
    flex: 1, padding: 14, background: '#F59E0B', color: '#000',
    border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer',
  },
};
