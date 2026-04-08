/**
 * ADMIN LOGIN PAGE
 * 
 * Separate login for admin users.
 * After login → checks if email is in admin list → navigates to /admin
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMsg, setResetMsg] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

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
      if (code === 'auth/user-not-found' || code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
        setError('Invalid email or password');
      } else {
        setError('Login failed. Please try again.');
      }
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetMsg('');
    setError('');
    if (!resetEmail) { setError('Please enter your admin email'); return; }
    setResetLoading(true);
    try {
      const sendReset = httpsCallable(functions, 'sendPasswordReset');
      const result: any = await sendReset({ email: resetEmail });
      setResetMsg(result.data?.message || 'Password reset email sent! Check your inbox (and spam folder).');
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('not-found') || msg.includes('No account')) {
        setError('If an account exists with this email, a reset link has been sent.');
      } else {
        setError('Failed to send reset email. Try again.');
      }
    }
    setResetLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Branding */}
        <div style={styles.brandBar}>
          <div style={styles.shield}>🛡️</div>
          <h1 style={{ margin: 0, fontSize: '1.4em', color: '#fff' }}>Admin Portal</h1>
          <p style={{ margin: '4px 0 0', color: '#E29578', fontSize: '0.9em' }}>Srichakra Academy</p>
          <p style={{ margin: '2px 0 0', color: 'rgba(255,255,255,0.6)', fontSize: '0.75em', fontStyle: 'italic' }}>(A Unit of SriKrpa Foundation Trust)</p>
        </div>

        {showForgot ? (
          /* Forgot Password Form */
          <form onSubmit={handleForgotPassword} style={styles.form}>
            <h2 style={{ margin: '0 0 8px', fontSize: '1.15em', color: '#2C3E50' }}>Reset Password</h2>
            <p style={{ margin: '0 0 16px', color: '#666', fontSize: '0.9em' }}>
              Enter your admin email and we'll send a password reset link.
            </p>
            <label style={styles.label}>Admin Email</label>
            <input
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              placeholder="Enter admin email"
              style={styles.input}
              required
            />

            {error && <div style={styles.error}>{error}</div>}
            {resetMsg && <div style={styles.success}>{resetMsg}</div>}

            <button type="submit" style={styles.submitBtn} disabled={resetLoading}>
              {resetLoading ? 'Sending...' : 'Send Reset Link'}
            </button>

            <div style={{ textAlign: 'center' as const, marginTop: '14px' }}>
              <button type="button" onClick={() => { setShowForgot(false); setError(''); setResetMsg(''); }} style={styles.linkBtn}>
                ← Back to Login
              </button>
            </div>
          </form>
        ) : (
          /* Login Form */
          <form onSubmit={handleSubmit} style={styles.form}>
            <label style={styles.label}>Admin Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter admin email"
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

            <div style={{ textAlign: 'center' as const, marginTop: '14px' }}>
              <button type="button" onClick={() => { setShowForgot(true); setResetEmail(''); setError(''); setResetMsg(''); }} style={styles.linkBtn}>
                Forgot Password?
              </button>
            </div>
          </form>
        )}

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
  success: {
    background: '#e8f5e9',
    color: '#2e7d32',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '0.9em',
    marginTop: '14px',
    border: '1px solid #a5d6a7',
  },
};

export default AdminLogin;
