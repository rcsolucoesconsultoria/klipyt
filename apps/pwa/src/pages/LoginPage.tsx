import React from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

export default function LoginPage() {
  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE}/auth/google`;
  };

  return (
    <div style={styles.container}>
      <div style={styles.logo}>
        <span style={styles.logoText}>PIX GO</span>
        <p style={styles.tagline}>Caça Pix na rua. Ganhe dinheiro real.</p>
      </div>
      <button style={styles.googleBtn} onClick={handleGoogleLogin}>
        <img
          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
          alt="Google"
          width={20}
          height={20}
        />
        Entrar com o Google
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #000 0%, #1a1a2e 100%)',
    gap: 40,
  },
  logo: {
    textAlign: 'center',
  },
  logoText: {
    fontSize: 48,
    fontWeight: 900,
    color: '#F59E0B',
    letterSpacing: 4,
  },
  tagline: {
    color: '#9CA3AF',
    marginTop: 8,
    fontSize: 14,
  },
  googleBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '14px 28px',
    background: '#fff',
    color: '#333',
    border: 'none',
    borderRadius: 8,
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
  },
};
