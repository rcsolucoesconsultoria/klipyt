import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';

export const api = axios.create({ baseURL: BASE });
api.interceptors.request.use((c) => {
  const t = localStorage.getItem('pj_token');
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});

export const importCnpj = (cnpj: string, selected?: string[]) =>
  api.post('/merchant/establishments/import-cnpj', { cnpj, selected_cnpjs: selected }).then(r => r.data);

export const createCampaign = (data: any) =>
  api.post('/campaigns', data).then(r => r.data);

export const uploadVideo = (file: File) => {
  const form = new FormData();
  form.append('video', file);
  return api.post('/campaign/upload-video', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
};

export const getAnalytics = (id: string) =>
  api.get(`/campaigns/${id}/analytics`).then(r => r.data);

export const redeemCoupon = (qrToken: string) =>
  api.post('/stickers/redeem', { qr_token: qrToken }).then(r => r.data);
