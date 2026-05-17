import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getAnalytics } from '../services/api';

export default function AnalyticsPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    getAnalytics(id)
      .then(setData)
      .catch((err) => setError(err?.response?.data?.message ?? 'Erro'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={S.page}>Carregando analytics...</div>;
  if (error) return <div style={S.page}><div style={S.error}>{error}</div></div>;

  return (
    <div style={S.page}>
      <h1 style={S.title}>Analytics da Campanha</h1>
      <div style={S.grid}>
        {[
          { label: 'Orçamento Bruto', value: `R$ ${data?.budget_gross?.toFixed(2)}` },
          { label: 'Consumido', value: `R$ ${data?.budget_consumed?.toFixed(2)}` },
          { label: 'Devolvido à carteira PJ', value: `R$ ${data?.budget_returned?.toFixed(2)}` },
          { label: 'Visitas únicas validadas', value: data?.unique_visits },
          { label: 'CPV (Custo por Visita)', value: `R$ ${data?.cpv?.toFixed(2)}` },
        ].map((m) => (
          <div key={m.label} style={S.card}>
            <span style={S.metricLabel}>{m.label}</span>
            <span style={S.metricValue}>{m.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#0f0f1a', color: '#fff', padding: 24 },
  title: { fontSize: 22, color: '#F59E0B', marginBottom: 24 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 },
  card: { background: '#1a1a2e', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 8 },
  metricLabel: { fontSize: 12, color: '#9CA3AF' },
  metricValue: { fontSize: 22, fontWeight: 700, color: '#F59E0B' },
  error: { background: 'rgba(239,68,68,0.15)', padding: '12px 16px', borderRadius: 8, color: '#FCA5A5' },
};
