/**
 * ACCESS GATE PAGE
 *
 * Shown to students who registered but haven't paid / been approved.
 *
 * Two paths to access:
 *   1. Pay ₹2,999 via Razorpay (UPI, Card, Netbanking, Wallet)
 *   2. Wait for admin/school approval (after offline GPay/cash payment)
 *
 * Once accessStatus becomes 'paid' or 'approved' → redirect to /assessment
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, type AccessStatus } from '../contexts/AuthContext';
import { httpsCallable } from 'firebase/functions';
import { getFunctions } from 'firebase/functions';
import app from '../firebase';

// ─── Config ───
const ASSESSMENT_FEE = 2999; // ₹2,999
const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_XXXXXXXXXX';

// ─── Load Razorpay script ───
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const AccessGate: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, accessStatus, accessLoading, hasAssessmentAccess, logout, isAdmin } = useAuth();
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);

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

  // Handle Razorpay payment
  const handlePayment = async () => {
    setPaymentError('');
    setPaymentLoading(true);

    try {
      // 1. Load Razorpay SDK
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        setPaymentError('Failed to load payment gateway. Please check your internet connection.');
        setPaymentLoading(false);
        return;
      }

      // 2. Create order via Cloud Function
      const functions = getFunctions(app, 'asia-south1');
      const createOrder = httpsCallable(functions, 'createRazorpayOrder');
      const result = await createOrder({
        amount: ASSESSMENT_FEE,
        studentName: currentUser?.displayName || 'Student',
        studentEmail: currentUser?.email || '',
      });
      const orderData = result.data as { orderId: string; amount: number; currency: string };

      // 3. Open Razorpay checkout
      const options = {
        key: RAZORPAY_KEY_ID,
        amount: orderData.amount, // in paise
        currency: orderData.currency,
        name: 'Srichakra Academy',
        description: 'SCOPE Assessment Fee',
        order_id: orderData.orderId,
        prefill: {
          name: currentUser?.displayName || '',
          email: currentUser?.email || '',
        },
        theme: {
          color: '#006D77',
        },
        handler: async function (response: any) {
          // 4. Verify payment via Cloud Function
          try {
            const verifyPayment = httpsCallable(functions, 'verifyRazorpayPayment');
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            setPaymentSuccess(true);
            // accessStatus will update via real-time listener → auto-redirect
          } catch (err: any) {
            setPaymentError('Payment verification failed. Please contact support with your payment ID: ' + response.razorpay_payment_id);
          }
          setPaymentLoading(false);
        },
        modal: {
          ondismiss: function () {
            setPaymentLoading(false);
          },
        },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.on('payment.failed', function (response: any) {
        setPaymentError('Payment failed: ' + (response.error?.description || 'Unknown error'));
        setPaymentLoading(false);
      });
      razorpay.open();
    } catch (err: any) {
      console.error('Payment error:', err);
      setPaymentError(err?.message || 'Failed to initiate payment. Please try again.');
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

        {/* Welcome */}
        <div style={{ padding: '24px 30px 0' }}>
          <h2 style={{ color: '#2d3748', margin: '0 0 4px', fontSize: '1.2em' }}>
            Welcome, {currentUser?.displayName || 'Student'}! 👋
          </h2>
          <p style={{ color: '#718096', margin: 0, fontSize: '0.95em' }}>
            Complete payment to access your SCOPE assessment.
          </p>
        </div>

        {/* Payment success */}
        {paymentSuccess && (
          <div style={styles.successBox}>
            <div style={{ fontSize: '2em', marginBottom: 8 }}>✅</div>
            <strong>Payment Successful!</strong>
            <p style={{ margin: '8px 0 0', fontSize: '0.9em' }}>
              Verifying and activating your access... You'll be redirected shortly.
            </p>
          </div>
        )}

        {/* Option 1: Pay Online */}
        {!paymentSuccess && (
          <div style={styles.section}>
            <div style={styles.optionCard}>
              <div style={styles.optionBadge}>RECOMMENDED</div>
              <h3 style={{ margin: '0 0 8px', color: '#006D77', fontSize: '1.1em' }}>
                💳 Pay Online — Instant Access
              </h3>
              <p style={{ margin: '0 0 16px', color: '#555', fontSize: '0.92em', lineHeight: 1.6 }}>
                Pay securely via UPI, Debit/Credit Card, Netbanking, or Wallets.
                Access is granted instantly after payment.
              </p>

              {/* Fee details */}
              <div style={styles.feeBox}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#333', fontWeight: 500 }}>SCOPE Assessment Fee</span>
                  <span style={{ fontSize: '1.5em', fontWeight: 700, color: '#006D77' }}>
                    ₹{ASSESSMENT_FEE.toLocaleString('en-IN')}
                  </span>
                </div>
                <div style={{ marginTop: 8, fontSize: '0.82em', color: '#888' }}>
                  76 questions · 10-page personalized report · Stream + Career recommendations
                </div>
              </div>

              {paymentError && (
                <div style={styles.errorBox}>
                  {paymentError}
                </div>
              )}

              <button
                onClick={handlePayment}
                disabled={paymentLoading}
                style={{
                  ...styles.payBtn,
                  opacity: paymentLoading ? 0.7 : 1,
                  cursor: paymentLoading ? 'not-allowed' : 'pointer',
                }}
              >
                {paymentLoading ? 'Processing...' : `Pay ₹${ASSESSMENT_FEE.toLocaleString('en-IN')} & Start Assessment`}
              </button>

              {/* Payment methods */}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 12, flexWrap: 'wrap' }}>
                {['UPI', 'Cards', 'Netbanking', 'Wallets'].map((m) => (
                  <span key={m} style={styles.payMethodBadge}>{m}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Divider */}
        {!paymentSuccess && (
          <div style={styles.divider}>
            <span style={styles.dividerText}>OR</span>
          </div>
        )}

        {/* Option 2: School / Offline Payment */}
        {!paymentSuccess && (
          <div style={styles.section}>
            <div style={{ ...styles.optionCard, background: '#f8f9fa', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 8px', color: '#2d3748', fontSize: '1.05em' }}>
                🏫 Already Paid via School / GPay?
              </h3>
              <p style={{ margin: '0 0 12px', color: '#666', fontSize: '0.90em', lineHeight: 1.6 }}>
                If your school has arranged the assessment or you've made payment via GPay/UPI to your 
                coordinator, your access will be activated by the admin. This usually takes a few hours.
              </p>
              <div style={styles.waitingBadge}>
                <span style={{ fontSize: '1.2em' }}>⏳</span>
                <span>Waiting for Approval</span>
              </div>
              <p style={{ margin: '12px 0 0', color: '#999', fontSize: '0.83em' }}>
                You'll be notified once your access is activated. You can check back here anytime.
              </p>
            </div>
          </div>
        )}

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
    maxWidth: '520px',
    overflow: 'hidden',
  },
  brandBar: {
    background: '#006D77',
    padding: '24px 30px',
    textAlign: 'center' as const,
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
  divider: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 30px',
    gap: '16px',
  },
  dividerText: {
    flex: 1,
    textAlign: 'center' as const,
    color: '#bbb',
    fontSize: '0.85em',
    fontWeight: 600,
    position: 'relative' as const,
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
  successBox: {
    background: '#f0fff4',
    color: '#276749',
    padding: '20px',
    margin: '20px 24px',
    borderRadius: '12px',
    textAlign: 'center' as const,
    border: '1px solid #c6f6d5',
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
