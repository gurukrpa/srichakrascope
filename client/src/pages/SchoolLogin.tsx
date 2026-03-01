/**
 * SCHOOL / BULK LOGIN PAGE
 *
 * Separate login for schools & organizations that use bulk registration.
 * Students registered through school bulk upload login here with their
 * generated credentials (name prefix + phone suffix).
 *
 * After login → navigate to /assessment (same assessment flow).
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const SchoolLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');

  const { login, resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/access-gate');
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
        setError('Invalid credentials. Please check the email and password provided by your school.');
      } else if (code === 'auth/wrong-password') {
        setError('Incorrect password. Use the password given by your school coordinator.');
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
          <div style={{ fontSize: '2.2em', marginBottom: 4 }}>🏫</div>
          <h1 style={{ margin: 0, fontSize: '1.5em', color: '#fff' }}>Academic Partner Login</h1>
          <p style={{ margin: '6px 0 0', color: '#83C5BE', fontSize: '1em' }}>
            Srichakra Academy — SCOPE Assessment Portal
          </p>
        </div>

        {/* Info box */}
        <div style={styles.infoBox}>
          <p style={{ margin: 0, fontSize: '0.95em', color: '#555', lineHeight: 1.7 }}>
            <strong style={{ color: '#006D77' }}>For students registered through their school.</strong><br />
            Use the email and password provided by your school coordinator.
            <br />
            <span style={{ fontSize: '0.88em', color: '#888' }}>
              Default password: first 4 letters of your name (lowercase) + last 4 digits of your phone number.
            </span>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your school-registered email"
            style={styles.input}
            required
          />

          <label style={styles.label}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            style={styles.input}
            required
          />

          {error && <div style={styles.error}>{error}</div>}

          <button type="submit" style={styles.submitBtn} disabled={loading}>
            {loading ? 'Logging in...' : 'Login & Start Assessment'}
          </button>

          {/* Forgot Password link */}
          <button
            type="button"
            onClick={() => { setShowForgotPassword(true); setError(''); setResetMessage(''); setResetEmail(email); }}
            style={{ background: 'none', border: 'none', color: '#006D77', cursor: 'pointer', fontSize: '0.88em', textDecoration: 'underline', marginTop: 12, display: 'block', width: '100%', textAlign: 'center' as const }}
          >
            Forgot Password?
          </button>
        </form>

        {/* Forgot Password Modal */}
        {showForgotPassword && (
          <div style={{
            position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20,
          }}>
            <div style={{
              background: '#fff', borderRadius: 16, padding: '28px 24px', maxWidth: 400, width: '100%',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            }}>
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
                  marginTop: 10, padding: '10px 14px', borderRadius: 8, fontSize: '0.88em',
                  background: resetMessage.startsWith('\u2713') ? '#f0fff4' : '#fff3f3',
                  color: resetMessage.startsWith('\u2713') ? '#276749' : '#d32f2f',
                  border: `1px solid ${resetMessage.startsWith('\u2713') ? '#c6f6d5' : '#ffcdd2'}`,
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
                      setResetMessage('\u2713 Password reset email sent! Check your inbox and spam/junk folder. It may take a minute to arrive.');
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

        {/* Links */}
        <div style={{ textAlign: 'center' as const, padding: '0 0 24px', display: 'flex', flexDirection: 'column' as const, gap: 10, alignItems: 'center' }}>
          <button onClick={() => navigate('/login')} style={styles.linkBtn}>
            Individual student? Login here →
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
    background: 'linear-gradient(135deg, #E29578 0%, #006D77 100%)',
    padding: '20px',
  },
  card: {
    background: '#fff',
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
    width: '100%',
    maxWidth: '480px',
    overflow: 'hidden',
  },
  brandBar: {
    background: 'linear-gradient(135deg, #006D77, #005a63)',
    padding: '28px 30px',
    textAlign: 'center' as const,
  },
  infoBox: {
    background: '#f0f9f9',
    margin: '20px 24px 0',
    padding: '14px 18px',
    borderRadius: 10,
    border: '1px solid #d0e8e8',
  },
  form: {
    padding: '20px 30px',
  },
  label: {
    display: 'block',
    fontSize: '1em',
    fontWeight: 600,
    color: '#333',
    marginBottom: '6px',
    marginTop: '14px',
  },
  input: {
    width: '100%',
    padding: '13px 14px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '1.05em',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box' as const,
  },
  error: {
    background: '#fff3f3',
    color: '#d32f2f',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '0.95em',
    marginTop: '14px',
    border: '1px solid #ffcdd2',
  },
  submitBtn: {
    width: '100%',
    padding: '15px',
    background: '#E29578',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1.1em',
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
    fontSize: '1em',
    textDecoration: 'underline',
  },
};

export default SchoolLogin;
