/**
 * STUDENT LOGIN / REGISTER PAGE
 * 
 * Two tabs: Login | Register
 * After login → navigate to /assessment or /report
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const StudentLogin: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isRegister) {
      if (!name.trim()) return setError('Please enter your name');
      if (!phone.trim()) return setError('Please enter your phone number');
      if (password.length < 6) return setError('Password must be at least 6 characters');
      if (password !== confirmPassword) return setError('Passwords do not match');
    }

    setLoading(true);
    try {
      if (isRegister) {
        await register(email, password, name, phone);
      } else {
        await login(email, password);
      }
      navigate('/assessment');
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/email-already-in-use') setError('An account with this email already exists');
      else if (code === 'auth/invalid-email') setError('Invalid email address');
      else if (code === 'auth/user-not-found') setError('No account found with this email');
      else if (code === 'auth/wrong-password') setError('Incorrect password');
      else if (code === 'auth/invalid-credential') setError('Invalid email or password');
      else setError(err?.message || 'Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Branding */}
        <div style={styles.brandBar}>
          <h1 style={{ margin: 0, fontSize: '1.4em', color: '#fff' }}>Srichakra Academy</h1>
          <p style={{ margin: '4px 0 0', color: '#83C5BE', fontSize: '0.9em' }}>Career Assessment Portal</p>
        </div>

        {/* Tab Toggle */}
        <div style={styles.tabRow}>
          <button
            onClick={() => { setIsRegister(false); setError(''); }}
            style={{ ...styles.tab, ...(isRegister ? {} : styles.tabActive) }}
          >
            Login
          </button>
          <button
            onClick={() => { setIsRegister(true); setError(''); }}
            style={{ ...styles.tab, ...(isRegister ? styles.tabActive : {}) }}
          >
            Register
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          {isRegister && (
            <>
              <label style={styles.label}>Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                style={styles.input}
                required
              />

              <label style={styles.label}>Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter your phone number"
                style={styles.input}
                required
              />
            </>
          )}

          <label style={styles.label}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            style={styles.input}
            required
          />

          <label style={styles.label}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isRegister ? 'Create a password (min 6 chars)' : 'Enter your password'}
            style={styles.input}
            required
          />

          {isRegister && (
            <>
              <label style={styles.label}>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                style={styles.input}
                required
              />
            </>
          )}

          {error && <div style={styles.error}>{error}</div>}

          <button type="submit" style={styles.submitBtn} disabled={loading}>
            {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Login'}
          </button>
        </form>

        {/* Back to home */}
        <div style={{ textAlign: 'center' as const, padding: '0 0 24px' }}>
          <button onClick={() => navigate('/')} style={styles.linkBtn}>
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Styles ──
const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #006D77 0%, #83C5BE 100%)',
    padding: '20px',
  },
  card: {
    background: '#fff',
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
    width: '100%',
    maxWidth: '440px',
    overflow: 'hidden',
  },
  brandBar: {
    background: '#006D77',
    padding: '24px 30px',
    textAlign: 'center' as const,
  },
  tabRow: {
    display: 'flex',
    borderBottom: '2px solid #eee',
  },
  tab: {
    flex: 1,
    padding: '14px',
    border: 'none',
    background: '#f8f9fa',
    fontSize: '1em',
    fontWeight: 600,
    color: '#888',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  tabActive: {
    background: '#fff',
    color: '#006D77',
    borderBottom: '3px solid #006D77',
  },
  form: {
    padding: '24px 30px',
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
    transition: 'border-color 0.2s',
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
    background: '#006D77',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1.05em',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '20px',
    transition: 'background 0.2s',
  },
  linkBtn: {
    background: 'none',
    border: 'none',
    color: '#006D77',
    cursor: 'pointer',
    fontSize: '0.95em',
    textDecoration: 'underline',
  },
};

export default StudentLogin;
