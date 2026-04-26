/**
 * COUNSELLING BOOKING — paid 1:1 post-assessment
 *
 * URL: /counselling
 *
 * Flow:
 *   1. Student logs in (uses currentUser from AuthContext)
 *   2. Picks a preferred slot, enters mobile
 *   3. Pays ₹1,399 via Razorpay
 *   4. On success → confirmation, admin gets emailed
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { httpsCallable } from 'firebase/functions';
import { useAuth } from '../contexts/AuthContext';
import { functions } from '../firebase';

const COUNSELLING_FEE = 1399;
const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || '';

declare global {
  interface Window { Razorpay: any }
}

const SLOTS = [
  'Weekday morning (10 AM – 1 PM)',
  'Weekday evening (5 PM – 8 PM)',
  'Weekend morning (10 AM – 1 PM)',
  'Weekend afternoon (2 PM – 5 PM)',
];

const Counselling: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [mobile, setMobile] = useState('');
  const [slot, setSlot] = useState(SLOTS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  if (!currentUser) {
    return (
      <div style={S.page}>
        <div style={S.card}>
          <h2>Please log in to book a counselling session</h2>
          <Link to="/login?next=/counselling" style={S.primaryBtn}>Login</Link>
        </div>
      </div>
    );
  }

  async function pay() {
    setError('');
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    setLoading(true);
    try {
      const create = httpsCallable(functions, 'createCounsellingOrder');
      const res: any = await create({
        studentName: currentUser?.displayName || '',
        studentEmail: currentUser?.email || '',
        mobile,
        slot,
      });
      const { orderId, amount, currency } = res.data;

      if (typeof window.Razorpay !== 'function') {
        setError('Payment gateway failed to load. Please refresh and try again.');
        setLoading(false);
        return;
      }

      const rzp = new window.Razorpay({
        key: RAZORPAY_KEY_ID,
        amount,
        currency,
        order_id: orderId,
        name: 'Srichakra Academy',
        description: 'Career Counselling — 1:1 session',
        prefill: {
          name: currentUser?.displayName || '',
          email: currentUser?.email || '',
          contact: mobile,
        },
        theme: { color: '#006D77' },
        handler: async (resp: any) => {
          try {
            const verify = httpsCallable(functions, 'verifyCounsellingPayment');
            await verify({
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
            });
            setDone(true);
          } catch (e: any) {
            setError('Payment was received but verification failed. Please contact support.');
          } finally {
            setLoading(false);
          }
        },
        modal: { ondismiss: () => setLoading(false) },
      });
      rzp.on('payment.failed', (r: any) => {
        setError('Payment failed: ' + (r?.error?.description || 'Please try again.'));
        setLoading(false);
      });
      rzp.open();
    } catch (e: any) {
      setError(e?.message || 'Could not start payment.');
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div style={S.page}>
        <div style={S.card}>
          <div style={{ fontSize: 56 }}>✅</div>
          <h2 style={{ color: '#0a7c4a', margin: '8px 0 6px' }}>Booking confirmed!</h2>
          <p style={{ color: '#555' }}>
            Our counsellor will contact you on <strong>{mobile}</strong> within 24 hours
            to schedule your session ({slot}).
          </p>
          <p style={{ color: '#666', fontSize: 14 }}>
            A confirmation email is on its way to <strong>{currentUser?.email}</strong>.
          </p>
          <button onClick={() => navigate('/')} style={S.primaryBtn}>Back to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={{ fontSize: 36 }}>🧭</div>
        <h1 style={S.title}>Book a 1:1 Career Counselling Session</h1>
        <p style={S.sub}>
          A senior counsellor walks you through your assessment report,
          answers your questions, and maps out the next 12 months of action.
        </p>

        <ul style={S.bullets}>
          <li>45-minute personalised session (phone / video)</li>
          <li>Detailed walk-through of your SCOPE report</li>
          <li>Stream, course & exam roadmap tailored to you</li>
          <li>Parent participation welcome</li>
        </ul>

        <div style={S.feeBox}>
          <span>Counselling fee</span>
          <span style={S.fee}>₹{COUNSELLING_FEE.toLocaleString('en-IN')}</span>
        </div>

        <label style={S.label}>Your mobile number</label>
        <input
          value={mobile}
          onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
          placeholder="10-digit mobile"
          style={S.input}
        />

        <label style={S.label}>Preferred slot</label>
        <select value={slot} onChange={(e) => setSlot(e.target.value)} style={S.input}>
          {SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        {error && <div style={S.err}>{error}</div>}

        <button onClick={pay} disabled={loading} style={S.primaryBtn}>
          {loading ? 'Processing…' : `Pay ₹${COUNSELLING_FEE.toLocaleString('en-IN')} & book`}
        </button>

        <div style={{ marginTop: 16, textAlign: 'center', fontSize: 12, color: '#888' }}>
          🔒 Secured by Razorpay · Need help? 📞 85903 96662
        </div>
      </div>
    </div>
  );
};

const S: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#f5f7fa', fontFamily: 'Segoe UI, system-ui, sans-serif', padding: '24px 12px' },
  card: { maxWidth: 560, margin: '24px auto', background: '#fff', borderRadius: 14, boxShadow: '0 4px 18px rgba(0,0,0,0.08)', padding: '28px 26px' },
  title: { fontSize: 22, color: '#1a1a1a', margin: '8px 0 6px' },
  sub: { color: '#555', marginBottom: 16, lineHeight: 1.6 },
  bullets: { color: '#333', lineHeight: 1.9, paddingLeft: 18, marginBottom: 18 },
  feeBox: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#f6fafa', borderRadius: 8, marginBottom: 18 },
  fee: { fontSize: 22, fontWeight: 800, color: '#006D77' },
  label: { display: 'block', fontSize: 13, color: '#444', marginTop: 12, marginBottom: 4, fontWeight: 600 },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' },
  err: { background: '#ffebeb', color: '#a02525', padding: '10px 12px', borderRadius: 8, marginTop: 12, fontSize: 13 },
  primaryBtn: { display: 'block', width: '100%', marginTop: 18, padding: '14px', background: '#006D77', color: '#fff', border: 'none', borderRadius: 30, fontWeight: 700, fontSize: 15, cursor: 'pointer', textDecoration: 'none', textAlign: 'center' },
};

export default Counselling;
