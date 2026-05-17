import React, { useState } from 'react';
import { uploadVideo, createCampaign } from '../services/api';

export default function CampaignPage() {
  const [step, setStep] = useState<'video' | 'config' | 'done'>('video');
  const [videoUrl, setVideoUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ establishment_id: '', budget_gross: '', start_time: '', end_time: '', age_restriction: '' });
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  async function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const res = await uploadVideo(file);
      setVideoUrl(res.video_url);
      setStep('config');
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Erro no upload');
    } finally {
      setUploading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const payload: any = {
        establishment_id: form.establishment_id,
        budget_gross: parseFloat(form.budget_gross),
        video_url: videoUrl,
        start_time: form.start_time,
        end_time: form.end_time,
      };
      if (form.age_restriction) payload.age_restriction = parseInt(form.age_restriction);
      const res = await createCampaign(payload);
      setResult(res);
      setStep('done');
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Erro ao criar campanha');
    }
  }

  return (
    <div style={S.page}>
      <h1 style={S.title}>Nova Campanha</h1>
      {error && <div style={S.error}>{error}</div>}

      {step === 'video' && (
        <div style={S.card}>
          <h2 style={S.h2}>1. Upload do Vídeo Promocional</h2>
          <p style={S.hint}>Vertical 9:16, H.264, 15–30s, máx. 15MB</p>
          <input type="file" accept="video/mp4,video/quicktime" onChange={handleVideoUpload} disabled={uploading} />
          {uploading && <p>Validando e fazendo upload...</p>}
        </div>
      )}

      {step === 'config' && (
        <form onSubmit={handleCreate} style={S.card}>
          <h2 style={S.h2}>2. Configurar Campanha</h2>
          <label style={S.label}>ID do Estabelecimento</label>
          <input style={S.input} required value={form.establishment_id} onChange={e => setForm({...form, establishment_id: e.target.value})} />
          <label style={S.label}>Orçamento Bruto (R$)</label>
          <input style={S.input} type="number" min="1" step="0.01" required value={form.budget_gross} onChange={e => setForm({...form, budget_gross: e.target.value})} />
          <label style={S.label}>Início</label>
          <input style={S.input} type="datetime-local" required value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} />
          <label style={S.label}>Término (máx. 6h após início)</label>
          <input style={S.input} type="datetime-local" required value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})} />
          <label style={S.label}>Restrição de idade (opcional, ex: 35)</label>
          <input style={S.input} type="number" min="18" max="99" value={form.age_restriction} onChange={e => setForm({...form, age_restriction: e.target.value})} />
          <button type="submit" style={S.btn}>Criar Campanha</button>
        </form>
      )}

      {step === 'done' && result && (
        <div style={S.card}>
          <h2 style={S.h2}>Campanha Criada!</h2>
          <p>ID: <code>{result.campaignId}</code></p>
          <p>Receita plataforma: R$ {result.platformRevenue?.toFixed(2)}</p>
          <p>Moedas qualificadas (Baú): {result.qualifiedCoinCount}</p>
          <p>Moedas de volume (Bronze): {result.volumeCoinCount}</p>
        </div>
      )}
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#0f0f1a', color: '#fff', padding: 24, maxWidth: 600, margin: '0 auto' },
  title: { fontSize: 22, color: '#F59E0B', marginBottom: 20 },
  card: { background: '#1a1a2e', borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', gap: 12 },
  h2: { fontSize: 17, color: '#F59E0B', marginBottom: 8 },
  hint: { color: '#9CA3AF', fontSize: 13 },
  label: { fontSize: 13, color: '#9CA3AF' },
  input: { padding: '10px 12px', background: '#0f0f1a', border: '1px solid #374151', borderRadius: 6, color: '#fff', fontSize: 14 },
  btn: { padding: '14px 0', background: '#F59E0B', color: '#000', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', marginTop: 8 },
  error: { background: 'rgba(239,68,68,0.15)', border: '1px solid #EF4444', borderRadius: 8, padding: '10px 14px', color: '#FCA5A5', marginBottom: 16 },
};
