import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL ?? '/api/v1';

export const api = axios.create({ baseURL: BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pixgo_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function getSettings(): Promise<Record<string, any>> {
  const { data } = await api.get('/settings/public');
  return data;
}

export async function getMe() {
  const { data } = await api.get('/user/me');
  return data;
}

export async function openPack(packId: string, lat: number, lon: number) {
  const { data } = await api.post('/album/open-pack', { pack_id: packId, lat, lon });
  return data;
}

export async function generatePin(stickerId: string, lat: number, lon: number) {
  const { data } = await api.post('/album/trade/generate-pin', {
    sticker_id: stickerId, lat, lon,
  });
  return data;
}

export async function confirmPin(pin: string, lat: number, lon: number) {
  const { data } = await api.post('/album/trade/confirm-pin', { pin, lat, lon });
  return data;
}

export async function redeemCoupon(qrToken: string) {
  const { data } = await api.post('/stickers/redeem', { qr_token: qrToken });
  return data;
}
