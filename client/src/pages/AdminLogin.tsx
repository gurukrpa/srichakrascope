/**
 * ADMIN LOGIN PAGE
 * 
 * Separate login for admin users.
 * After login → checks if email is in admin list → navigates to /admin
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      // Auth context will set isAdmin flag — redirect happens via App.tsx
      navigate('/admin');
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
        setError('Invalid admin credentials');
      } else if (code === 'auth/wrong-password') {
        setError('Incorrect password');
      } else {
        setError(err?.message || 'Login failed. Please try again.');
      }
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Branding */}
        <div style={styles.brandBar}>
          <div style={styles.shield}>🛡️</div>
          <h1 style={{ margin: 0, fontSize: '1.4em', color: '#fff' }}>Admin Portal</h1>
          <p style={{ margin: '4px 0 0', color: '#E29578', fontSize: '0.9em' }}>Srichakra Academy</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Admin Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@srichakraacademy.org"
            style={styles.input}
            required
          />

          <label style={styles.label}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter admin password"
            style={styles.input}
            required
          />

          {error && <div style={styles.error}>{error}</div>}

          <button type="submit" style={styles.submitBtn} disabled={loading}>
            {loading ? 'Authenticating...' : 'Login as Admin'}
          </button>
        </form>

        {/* Back */}
        <div style={{ textAlign: 'center' as const, padding: '0 0 24px' }}>
          <button onClick={() => navigate('/')} style={styles.linkBtn}>
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #2C3E50 0%, #4CA1AF 100%)',
    padding: '20px',
  },
  card: {
    background: '#fff',
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
    width: '100%',
    maxWidth: '400px',
    overflow: 'hidden',
  },
  brandBar: {
    background: '#2C3E50',
    padding: '28px 30px',
    textAlign: 'center' as const,
  },
  shield: {
    fontSize: '2em',
    marginBottom: '8px',
  },
  form: {
    padding: '28px 30px',
  },
  label: {
    display: 'block',
    fontSize: '0.9em',
    fontWeight: 600,
    color: '#333',
    marginBottom: '6px',
    marginTop: '14px',
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '1em',
    outline: 'none',
    boxSizing: 'border-box' as const,
  },
  error: {
    background: '#fff3f3',
    color: '#d32f2f',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '0.9em',
    marginTop: '14px',
    border: '1px solid #ffcdd2',
  },
  submitBtn: {
    width: '100%',
    padding: '14px',
    background: '#2C3E50',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1.05em',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '20px',
  },
  linkBtn: {
    background: 'none',
    border: 'none',
    color: '#2C3E50',
    cursor: 'pointer',
    fontSize: '0.95em',
    textDecoration: 'underline',
  },
};

export default AdminLogin;
