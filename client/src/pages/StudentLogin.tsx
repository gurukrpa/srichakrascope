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
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register, resetPassword } = useAuth();
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
      navigate('/access-gate');
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
          <p style={{ margin: '2px 0 0', color: 'rgba(255,255,255,0.7)', fontSize: '0.75em', fontStyle: 'italic' }}>(A Unit of SriKrpa Foundation Trust)</p>
          <p style={{ margin: '4px 0 0', color: '#83C5BE', fontSize: '0.9em' }}>SCOPE Assessment Portal</p>
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

          {/* Forgot Password link (login mode only) */}
          {!isRegister && (
            <button
              type="button"
              onClick={() => { setShowForgotPassword(true); setError(''); setResetMessage(''); setResetEmail(email); }}
              style={{ ...styles.linkBtn, marginTop: 12, fontSize: '0.88em' }}
            >
              Forgot Password?
            </button>
          )}
        </form>

        {/* Forgot Password Modal */}
        {showForgotPassword && (
          <div style={styles.forgotOverlay}>
            <div style={styles.forgotCard}>
              <h3 style={{ margin: '0 0 8px', color: '#006D77', fontSize: '1.1em' }}>Reset Password</h3>
              <p style={{ margin: '0 0 16px', color: '#666', fontSize: '0.9em', lineHeight: 1.6 }}>
                Enter your registered email. We'll send a password reset link.
              </p>
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="Enter your email"
                style={styles.input}
              />
              {resetMessage && (
                <div style={{
                  marginTop: 10,
                  padding: '10px 14px',
                  borderRadius: 8,
                  fontSize: '0.88em',
                  background: resetMessage.startsWith('✓') ? '#f0fff4' : '#fff3f3',
                  color: resetMessage.startsWith('✓') ? '#276749' : '#d32f2f',
                  border: `1px solid ${resetMessage.startsWith('✓') ? '#c6f6d5' : '#ffcdd2'}`,
                }}>
                  {resetMessage}
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button
                  onClick={async () => {
                    if (!resetEmail.trim()) { setResetMessage('Please enter an email address'); return; }
                    setResetMessage('');
                    try {
                      await resetPassword(resetEmail.trim());
                      setResetMessage('✓ Password reset email sent! Check your inbox and spam/junk folder. It may take a minute to arrive.');
                    } catch (err: any) {
                      const code = err?.code || '';
                      if (code === 'auth/user-not-found') setResetMessage('No account found with this email.');
                      else if (code === 'auth/invalid-email') setResetMessage('Invalid email address.');
                      else setResetMessage(err?.message || 'Failed to send reset email. Try again.');
                    }
                  }}
                  style={{ ...styles.submitBtn, flex: 1, marginTop: 0 }}
                >
                  Send Reset Link
                </button>
                <button
                  onClick={() => setShowForgotPassword(false)}
                  style={{ ...styles.submitBtn, flex: 1, marginTop: 0, background: '#999' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Back to home */}
        <div style={{ textAlign: 'center' as const, padding: '0 0 24px', display: 'flex', flexDirection: 'column' as const, gap: 10, alignItems: 'center' }}>
          <button onClick={() => navigate('/school-login')} style={styles.linkBtn}>
            Academic Partner Login →
          </button>
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
  forgotOverlay: {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  forgotCard: {
    background: '#fff',
    borderRadius: '16px',
    padding: '28px 24px',
    maxWidth: '400px',
    width: '100%',
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
  },
};

export default StudentLogin;
