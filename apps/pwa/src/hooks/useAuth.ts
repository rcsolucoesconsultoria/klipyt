import { useState, useEffect } from 'react';
import { getMe } from '../services/api';

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('pixgo_token');
    if (!token) { setLoading(false); return; }

    getMe()
      .then(setUser)
      .catch(() => localStorage.removeItem('pixgo_token'))
      .finally(() => setLoading(false));
  }, []);

  function setToken(token: string) {
    localStorage.setItem('pixgo_token', token);
  }

  function logout() {
    localStorage.removeItem('pixgo_token');
    setUser(null);
  }

  return { user, loading, setToken, logout };
}
