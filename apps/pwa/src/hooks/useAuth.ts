import { useState, useEffect } from 'react';
import { getMe } from '../services/api';
import { clearToken, getToken, setToken } from '../services/auth-token';

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    getMe()
      .then(setUser)
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  function updateToken(token: string) {
    setToken(token);
  }

  function logout() {
    clearToken();
    setUser(null);
  }

  return { user, loading, setToken: updateToken, logout, isVerified: user?.status === 'VERIFIED' };
}
