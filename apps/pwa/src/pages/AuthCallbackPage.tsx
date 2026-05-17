import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { setToken } from '../services/auth-token';

export default function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const status = params.get('status');

    if (token) {
      setToken(token);
      if (status && status !== 'VERIFIED') {
        navigate('/ativar-pix', { replace: true });
      } else {
        navigate('/mapa', { replace: true });
      }
    } else {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#F59E0B' }}>
      Autenticando...
    </div>
  );
}
