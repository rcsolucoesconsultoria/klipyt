import axios from 'axios';
import { clearToken, getToken, setToken } from './auth-token';

const BASE = import.meta.env.VITE_API_URL ?? '/api/v1';

export const api = axios.create({ baseURL: BASE });

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      clearToken();
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  },
);

export { setToken, getToken, clearToken };

export async function getSettings(): Promise<Record<string, any>> {
  const { data } = await api.get('/settings/public');
  return data;
}

export async function getMe() {
  const { data } = await api.get('/user/me');
  return data;
}

export async function upgradeAccount(cpf: string, pixKey: string) {
  const { data } = await api.post('/users/upgrade', { cpf, pix_key: pixKey });
  if (data.access_token) setToken(data.access_token);
  return data;
}

export async function getMapCoins(lat: number, lon: number) {
  const { data } = await api.get(`/map/coins?lat=${lat}&lon=${lon}`);
  return data as {
    coins: Array<{ id: string; lat: number; lon: number; value: number; coin_type: string }>;
    packs: Array<{ id: string; lat: number; lon: number }>;
    billboards: Array<{ id: string; lat: number; lon: number; title: string; density_tier: string }>;
    fase_monetizacao_ativa: boolean;
  };
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

export async function getMyStickers() {
  const { data } = await api.get('/album/my-stickers');
  return data;
}

export async function redeemCoupon(qrToken: string, establishmentId: string) {
  const { data } = await api.post('/stickers/redeem', {
    qr_token: qrToken,
    establishment_id: establishmentId,
  });
  return data;
}

export async function listMarketplace() {
  const { data } = await api.get('/marketplace');
  return data;
}

export async function getMyMarketplaceCoins() {
  const { data } = await api.get('/marketplace/my-coins');
  return data;
}

export async function createMarketplaceListing(coinId: string, listPrice: number) {
  const { data } = await api.post('/marketplace/list', { coin_id: coinId, list_price: listPrice });
  return data;
}

export async function buyMarketplaceOrder(
  orderId: string,
  paymentMethod: 'wallet' | 'pix' = 'wallet',
) {
  const { data } = await api.post(`/marketplace/${orderId}/buy`, {
    payment_method: paymentMethod,
  });
  return data;
}

export async function getMarketplaceChargeStatus(chargeId: string) {
  const { data } = await api.get(`/marketplace/charges/${chargeId}`);
  return data;
}

export async function confirmMarketplaceCharge(chargeId: string) {
  const { data } = await api.post(`/marketplace/charges/${chargeId}/confirm`);
  return data;
}

export async function simulateMarketplaceCharge(chargeId: string) {
  const { data } = await api.post(`/marketplace/charges/${chargeId}/simulate`);
  return data;
}

export async function interactBillboard(billboardId: string, lat: number, lon: number) {
  const { data } = await api.post('/billboards/interact', {
    billboard_id: billboardId,
    lat,
    lon,
  });
  return data;
}
