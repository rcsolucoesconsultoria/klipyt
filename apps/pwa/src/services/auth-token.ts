const TOKEN_KEY = 'klipyt_token';
const LEGACY_TOKEN_KEY = 'pixgo_token';

export function getToken(): string | null {
  const current = localStorage.getItem(TOKEN_KEY);
  if (current) return current;

  const legacy = localStorage.getItem(LEGACY_TOKEN_KEY);
  if (legacy) {
    localStorage.setItem(TOKEN_KEY, legacy);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
    return legacy;
  }

  return null;
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return !!getToken();
}
