/**
 * ACCESS GATE PAGE
 *
 * Shown to students who registered but haven't paid / been approved.
 *
 * Payment via Razorpay (automated):
 *   1. Student pays ₹1,099 (10th Anniversary Offer) via Razorpay
 *   2. Payment is verified server-side (HMAC-SHA256)
 *   3. Access is granted instantly — no admin intervention needed
 *
 * Once accessStatus becomes 'paid' or 'approved' → redirect to /assessment
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../firebase';

// ─── Config ───
const ORIGINAL_FEE = 2999;     // ₹2,999 (original price)
const OFFER_FEE = 1099;        // ₹1,099 (10th anniversary offer)
const OFFER_EXPIRY = new Date('2026-04-30T23:59:59+05:30');

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || '';

// Razorpay window type
declare global {
  interface Window {
    Razorpay: any;
  }
}

// Check if offer is still active
function isOfferActive(): boolean {
  return new Date() <= OFFER_EXPIRY;
}

// Get current fee
function getCurrentFee(): number {
  return isOfferActive() ? OFFER_FEE : ORIGINAL_FEE;
}

// Savings percentage
function getSavingsPercent(): number {
  return Math.round(((ORIGINAL_FEE - OFFER_FEE) / ORIGINAL_FEE) * 100);
}

// Days remaining for offer
function getOfferDaysRemaining(): number {
  const now = new Date();
  const diff = OFFER_EXPIRY.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

const AccessGate: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, accessStatus, accessLoading, hasAssessmentAccess, logout } = useAuth();
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  const offerActive = isOfferActive();
  const currentFee = getCurrentFee();
  const daysLeft = getOfferDaysRemaining();

  // Real-time listener: detect existing UPI claim & auto-redirect on approval
  useEffect(() => {
    if (!currentUser?.uid) return;
    const unsub = onSnapshot(doc(db, 'students', currentUser.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        // If already approved/paid → redirect to assessment
        if (data.accessStatus === 'approved' || data.accessStatus === 'paid') {
          navigate('/assessment', { replace: true });
          return;
        }
      }
    });
    return unsub;
  }, [currentUser, navigate]);

  // Redirect if already has access
  useEffect(() => {
    if (!accessLoading && hasAssessmentAccess) {
      navigate('/assessment', { replace: true });
    }
  }, [accessLoading, hasAssessmentAccess, navigate]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!currentUser && !accessLoading) {
      navigate('/login', { replace: true });
    }
  }, [currentUser, accessLoading, navigate]);

  // Handle Razorpay payment (automated verification)
  const handleRazorpayPayment = async () => {
    setPaymentError('');
    setPaymentLoading(true);

    try {
      // 1. Create order on server
      const createOrder = httpsCallable(functions, 'createRazorpayOrder');
      const result = await createOrder({
        studentName: currentUser?.displayName || '',
        studentEmail: currentUser?.email || '',
      });
      const { orderId, amount, currency } = result.data as { orderId: string; amount: number; currency: string };

      // 2. Open Razorpay checkout
      const options = {
        key: RAZORPAY_KEY_ID,
        amount,
        currency,
        name: 'Srichakra Academy',
        description: 'SCOPE Career Assessment Fee',
        order_id: orderId,
        prefill: {
          name: currentUser?.displayName || '',
          email: currentUser?.email || '',
        },
        theme: {
          color: '#006D77',
        },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          // 3. Verify payment on server (cryptographic verification)
          try {
            const verifyPayment = httpsCallable(functions, 'verifyRazorpayPayment');
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            // Access is automatically granted — real-time listener will redirect
          } catch (verifyErr: any) {
            setPaymentError('Payment was received but verification failed. Please contact support.');
          }
          setPaymentLoading(false);
        },
        modal: {
          ondismiss: () => {
            setPaymentLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response: any) => {
        setPaymentError('Payment failed: ' + (response.error?.description || 'Please try again.'));
        setPaymentLoading(false);
      });
      rzp.open();
    } catch (err: any) {
      const msg = err?.code || 'Unknown error';
      setPaymentError(`Failed to start payment. Please try again.`);
      setPaymentLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Loading state
  if (accessLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={{ padding: 60, textAlign: 'center', color: '#006D77' }}>
            <div style={styles.spinner} />
            <p>Checking access status...</p>
          </div>
        </div>
      </div>
    );
  }

  // Rejected state
  if (accessStatus === 'rejected') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.brandBar}>
            <h1 style={{ margin: 0, fontSize: '1.4em', color: '#fff' }}>Srichakra Academy</h1>
            <p style={{ margin: '2px 0 0', color: 'rgba(255,255,255,0.7)', fontSize: '0.75em', fontStyle: 'italic' }}>(A Unit of SriKrpa Foundation Trust)</p>
            <p style={{ margin: '4px 0 0', color: '#83C5BE', fontSize: '0.9em' }}>SCOPE Assessment Portal</p>
          </div>
          <div style={{ padding: '40px 30px', textAlign: 'center' }}>
            <div style={{ fontSize: '3em', marginBottom: 16 }}>❌</div>
            <h2 style={{ color: '#c53030', margin: '0 0 12px' }}>Access Denied</h2>
            <p style={{ color: '#666', lineHeight: 1.7 }}>
              Your access request has been declined. If you believe this is an error,
              please contact your school coordinator or email us at{' '}
              <a href="mailto:admin@srichakraacademy.org" style={{ color: '#006D77' }}>
                admin@srichakraacademy.org
              </a>
            </p>
            <button onClick={handleLogout} style={styles.secondaryBtn}>
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main: Pending state — show payment + waiting
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Branding */}
        <div style={styles.brandBar}>
          <h1 style={{ margin: 0, fontSize: '1.4em', color: '#fff' }}>Srichakra Academy</h1>
          <p style={{ margin: '2px 0 0', color: 'rgba(255,255,255,0.7)', fontSize: '0.75em', fontStyle: 'italic' }}>(A Unit of SriKrpa Foundation Trust)</p>
          <p style={{ margin: '4px 0 0', color: '#83C5BE', fontSize: '0.9em' }}>SCOPE Assessment Portal</p>
        </div>

        {/* 🎉 Anniversary Offer Banner */}
        {offerActive && (
          <div style={styles.offerBanner}>
            <div style={{ fontSize: '1.3em', marginBottom: 4 }}>🎉</div>
            <div style={{ fontWeight: 800, fontSize: '1.1em', color: '#fff' }}>
              10th Year Anniversary Offer!
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, margin: '8px 0' }}>
              <span style={{ textDecoration: 'line-through', color: 'rgba(255,255,255,0.65)', fontSize: '1.2em' }}>
                ₹{ORIGINAL_FEE.toLocaleString('en-IN')}
              </span>
              <span style={{ fontSize: '2em', fontWeight: 900, color: '#fff' }}>
                ₹{OFFER_FEE.toLocaleString('en-IN')}
              </span>
              <span style={styles.savingsBadge}>
                SAVE {getSavingsPercent()}%
              </span>
            </div>
            <div style={{ fontSize: '0.82em', color: 'rgba(255,255,255,0.85)' }}>
              ⏰ Offer valid till 30th April 2026 · <strong>{daysLeft} days left</strong>
            </div>
          </div>
        )}

        {/* Welcome */}
        <div style={{ padding: '24px 30px 0' }}>
          <h2 style={{ color: '#2d3748', margin: '0 0 4px', fontSize: '1.2em' }}>
            Welcome, {currentUser?.displayName || 'Student'}! 👋
          </h2>
          <p style={{ color: '#718096', margin: 0, fontSize: '0.95em' }}>
            Complete payment to access your SCOPE assessment.
          </p>
        </div>

        {/* Pay Online (Razorpay — automated, instant access) */}
        <div style={styles.section}>
            <div style={styles.optionCard}>
              <div style={styles.optionBadge}>RECOMMENDED</div>
              <h3 style={{ margin: '0 0 8px', color: '#006D77', fontSize: '1.1em' }}>
                💳 Pay Online (UPI / Card / Net Banking)
              </h3>
              <p style={{ margin: '0 0 16px', color: '#555', fontSize: '0.92em', lineHeight: 1.6 }}>
                Secure online payment with <strong>instant access</strong>.
                Supports GPay, PhonePe, Paytm, UPI, cards, and net banking.
              </p>

              {/* Fee details */}
              <div style={styles.feeBox}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#333', fontWeight: 500 }}>SCOPE Assessment Fee</span>
                  <div style={{ textAlign: 'right' as const }}>
                    {offerActive && (
                      <span style={{ textDecoration: 'line-through', color: '#999', fontSize: '0.9em', marginRight: 8 }}>
                        ₹{ORIGINAL_FEE.toLocaleString('en-IN')}
                      </span>
                    )}
                    <span style={{ fontSize: '1.5em', fontWeight: 700, color: '#006D77' }}>
                      ₹{currentFee.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
                <div style={{ marginTop: 8, fontSize: '0.82em', color: '#888' }}>
                  76 questions · 10-page personalized report · Stream + Career recommendations
                </div>
              </div>

              <button
                onClick={handleRazorpayPayment}
                disabled={paymentLoading}
                style={{
                  ...styles.payBtn,
                  background: 'linear-gradient(135deg, #006D77 0%, #0a8f9a 100%)',
                  opacity: paymentLoading ? 0.7 : 1,
                  cursor: paymentLoading ? 'not-allowed' : 'pointer',
                }}
              >
                {paymentLoading ? 'Processing...' : `Pay ₹${currentFee.toLocaleString('en-IN')} — Instant Access`}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10 }}>
                <span style={{ fontSize: '0.78em', color: '#38a169' }}>🔒 Secured by Razorpay</span>
              </div>

              {paymentError && (
                <div style={{ ...styles.errorBox, marginTop: 12 }}>
                  {paymentError}
                </div>
              )}

              {/* Payment method logos */}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap' }}>
                {['GPay', 'PhonePe', 'Paytm', 'UPI', 'Cards', 'Net Banking'].map((m) => (
                  <span key={m} style={styles.payMethodBadge}>{m}</span>
                ))}
              </div>
            </div>
          </div>

        {/* School / Offline Payment */}
        <div style={styles.section}>
          <div style={{ ...styles.optionCard, background: '#f8f9fa', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 8px', color: '#2d3748', fontSize: '1.05em' }}>
              🏫 Registered via School / Academic Partner?
            </h3>
            <p style={{ margin: '0 0 12px', color: '#666', fontSize: '0.90em', lineHeight: 1.6 }}>
              If your school has arranged the assessment, your access will be activated by the admin.
            </p>
            <div style={styles.waitingBadge}>
              <span style={{ fontSize: '1.2em' }}>⏳</span>
              <span>Waiting for Approval</span>
            </div>
          </div>
        </div>

        {/* Help & Actions */}
        <div style={styles.footer}>
          <p style={{ margin: '0 0 12px', fontSize: '0.88em', color: '#999' }}>
            Need help? Contact{' '}
            <a href="mailto:admin@srichakraacademy.org" style={{ color: '#006D77' }}>
              admin@srichakraacademy.org
            </a>
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/')} style={styles.linkBtn}>
              ← Back to Home
            </button>
            <button onClick={handleLogout} style={styles.linkBtn}>
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Styles ───
const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #006D77 0%, #83C5BE 100%)',
    padding: '20px',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  card: {
    background: '#fff',
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
    width: '100%',
    maxWidth: '560px',
    overflow: 'hidden',
  },
  brandBar: {
    background: '#006D77',
    padding: '24px 30px',
    textAlign: 'center' as const,
  },
  offerBanner: {
    background: 'linear-gradient(135deg, #e53e3e 0%, #c53030 100%)',
    padding: '16px 24px',
    textAlign: 'center' as const,
    color: '#fff',
  },
  savingsBadge: {
    background: '#ffd700',
    color: '#333',
    padding: '3px 10px',
    borderRadius: '999px',
    fontSize: '0.72em',
    fontWeight: 800,
  },
  section: {
    padding: '0 24px',
    marginBottom: 4,
  },
  optionCard: {
    background: '#fff',
    borderRadius: '12px',
    padding: '20px',
    border: '2px solid #006D77',
    position: 'relative' as const,
  },
  optionBadge: {
    position: 'absolute' as const,
    top: '-10px',
    right: '16px',
    background: '#E29578',
    color: '#fff',
    padding: '3px 12px',
    borderRadius: '999px',
    fontSize: '0.72em',
    fontWeight: 700,
    letterSpacing: '0.5px',
  },
  feeBox: {
    background: '#f0fdfa',
    border: '1px solid #83C5BE',
    borderRadius: '8px',
    padding: '14px 16px',
    marginBottom: '16px',
  },

  payBtn: {
    width: '100%',
    padding: '14px',
    background: '#006D77',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1.05em',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'background 0.2s, transform 0.1s',
  },
  payMethodBadge: {
    display: 'inline-block',
    background: '#f0fdfa',
    color: '#006D77',
    padding: '3px 10px',
    borderRadius: '999px',
    fontSize: '0.78em',
    fontWeight: 600,
    border: '1px solid #83C5BE',
  },

  waitingBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: '#fffff0',
    color: '#d69e2e',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '0.92em',
    fontWeight: 600,
    border: '1px solid #fefcbf',
  },

  errorBox: {
    background: '#fff3f3',
    color: '#d32f2f',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '0.88em',
    marginBottom: '12px',
    border: '1px solid #ffcdd2',
  },

  footer: {
    textAlign: 'center' as const,
    padding: '16px 24px 24px',
    borderTop: '1px solid #f0f0f0',
    marginTop: '12px',
  },
  linkBtn: {
    background: 'none',
    border: 'none',
    color: '#006D77',
    cursor: 'pointer',
    fontSize: '0.9em',
    textDecoration: 'underline',
  },
  secondaryBtn: {
    padding: '10px 28px',
    background: '#f7fafc',
    color: '#4a5568',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '0.95em',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '20px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #e2e8f0',
    borderTopColor: '#006D77',
    borderRadius: '50%',
    margin: '0 auto 16px',
    animation: 'spin 1s linear infinite',
  },
};

export default AccessGate;
