/**
 * EBOOK CHECKOUT — public, no login required
 *
 * URL: /ebooks/checkout/:key
 *
 * Steps:
 *   1. Demographic form (name, mobile, email, class, stream, city)
 *   2. Razorpay payment (createEbookOrder → checkout → verifyEbookPayment)
 *   3. On success → /ebooks/success?leadId=...
 *
 * Stores lead in `ebookLeads/{leadId}` so we can retarget abandoned carts.
 */

import React, { useState } from 'react';
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom';
import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../firebase';
import { getEbook } from '../data/ebookCatalog';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || '';

const CLASS_OPTIONS = ['Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12', 'College / Other'];
const STREAM_OPTIONS = [
  'Undecided',
  'Science (PCM)',
  'Science (PCB)',
  'Science (PCMB)',
  'Commerce',
  'Arts / Humanities',
  'Vocational',
];

interface FormState {
  studentName: string;
  parentName: string;
  mobile: string;
  email: string;
  classLevel: string;
  stream: string;
  city: string;
  schoolName: string;
}

const EMPTY: FormState = {
  studentName: '',
  parentName: '',
  mobile: '',
  email: '',
  classLevel: '',
  stream: '',
  city: '',
  schoolName: '',
};

const EbookCheckout: React.FC = () => {
  const { key } = useParams<{ key: string }>();
  const ebook = getEbook(key || '');
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!ebook) {
    return (
      <div style={{ padding: 40, textAlign: 'center', fontFamily: 'Segoe UI' }}>
        <h2>E-book not found</h2>
        <Link to="/ebooks" style={{ color: '#006D77' }}>← Back to all e-books</Link>
      </div>
    );
  }

  const update = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
  };

  function validate(): string | null {
    if (form.studentName.trim().length < 2) return 'Please enter the student name.';
    if (!/^[6-9]\d{9}$/.test(form.mobile)) return 'Please enter a valid 10-digit Indian mobile number.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Please enter a valid email address.';
    if (!form.classLevel) return 'Please select the class.';
    if (!form.stream) return 'Please select the stream.';
    if (form.city.trim().length < 2) return 'Please enter your city.';
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    if (!ebook) return;

    setLoading(true);

    let utm: Record<string, string> = {};
    try {
      utm = JSON.parse(sessionStorage.getItem('srichakra_utm') || '{}');
    } catch { /* ignore */ }

    try {
      // 1. Create lead doc
      const leadRef = await addDoc(collection(db, 'ebookLeads'), {
        ebookKey: ebook.key,
        ebookTitle: ebook.title,
        priceRupees: ebook.priceRupees,
        ...form,
        utm,
        status: 'pending_payment',
        createdAt: serverTimestamp(),
      });

      // 2. Create Razorpay order on server
      const createOrder = httpsCallable(functions, 'createEbookOrder');
      const result = await createOrder({
        ebookKey: ebook.key,
        leadId: leadRef.id,
        studentName: form.studentName,
        studentEmail: form.email,
        mobile: form.mobile,
      });
      const { orderId, amount, currency } = result.data as { orderId: string; amount: number; currency: string };

      // 3. Open Razorpay checkout
      const options = {
        key: RAZORPAY_KEY_ID,
        amount,
        currency,
        name: 'Srichakra Academy',
        description: ebook.title,
        order_id: orderId,
        prefill: {
          name: form.studentName,
          email: form.email,
          contact: form.mobile,
        },
        theme: { color: ebook.coverColor },
        handler: async (resp: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            const verify = httpsCallable(functions, 'verifyEbookPayment');
            await verify({
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
              leadId: leadRef.id,
            });
            navigate(`/ebooks/success?leadId=${leadRef.id}&ebook=${ebook.key}`, { replace: true });
          } catch (err: any) {
            setError('Payment received but verification failed. Please contact support: 85903 96662');
            setLoading(false);
          }
        },
        modal: {
          ondismiss: async () => {
            try {
              await updateDoc(doc(db, 'ebookLeads', leadRef.id), { status: 'cart_abandoned' });
            } catch { /* ignore */ }
            setLoading(false);
          },
        },
      };

      if (typeof window.Razorpay !== 'function') {
        setError('Payment gateway failed to load. Please refresh and try again.');
        setLoading(false);
        return;
      }

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => {
        setError('Payment failed. Please try again or use a different method.');
        setLoading(false);
      });
      rzp.open();
    } catch (err: any) {
      console.error('[EbookCheckout] error:', err);
      setError(err?.message || 'Could not start payment. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div style={S.page}>
      <header style={S.header}>
        <Link to={`/ebooks${location.search}`} style={S.backLink}>← All e-books</Link>
        <span style={S.logo}>SRICHAKRA ACADEMY</span>
      </header>

      <div style={S.layout}>
        {/* Left: Order summary */}
        <aside style={{ ...S.summary, borderTop: `6px solid ${ebook.coverColor}` }}>
          <div style={{ fontSize: 56, lineHeight: 1 }}>{ebook.icon}</div>
          <h2 style={{ ...S.summaryTitle, color: ebook.coverColor }}>{ebook.title}</h2>
          <p style={S.summarySub}>{ebook.subtitle}</p>
          <ul style={S.includes}>
            <li>📂 {ebook.clusters} career clusters</li>
            <li>💼 {ebook.careers} career pathways</li>
            <li>🇮🇳 India-specific exams, colleges & salary ranges</li>
            <li>📩 Instant email delivery (PDF + HTML)</li>
            <li>🎁 ₹500 OFF Career Assessment coupon: <strong>{ebook.assessmentCoupon}</strong></li>
          </ul>
          <div style={{ ...S.priceBox, background: ebook.coverColor }}>
            <span>You pay</span>
            <strong>₹{ebook.priceRupees}</strong>
          </div>
        </aside>

        {/* Right: Form */}
        <form onSubmit={handleSubmit} style={S.formCard}>
          <h1 style={S.formTitle}>Tell us where to send it</h1>
          <p style={S.formSub}>So we can email the e-book and reach you with your assessment results.</p>

          <Row>
            <Field label="Student Name *" value={form.studentName} onChange={update('studentName')} placeholder="As on school records" />
            <Field label="Parent Name" value={form.parentName} onChange={update('parentName')} placeholder="Optional" />
          </Row>
          <Row>
            <Field label="Mobile (10-digit) *" value={form.mobile} onChange={update('mobile')} placeholder="98XXXXXXXX" type="tel" maxLength={10} />
            <Field label="Email *" value={form.email} onChange={update('email')} placeholder="parent@example.com" type="email" />
          </Row>
          <Row>
            <Select label="Class *" value={form.classLevel} onChange={update('classLevel')} options={CLASS_OPTIONS} />
            <Select label="Stream *" value={form.stream} onChange={update('stream')} options={STREAM_OPTIONS} />
          </Row>
          <Row>
            <Field label="City *" value={form.city} onChange={update('city')} placeholder="Chennai" />
            <Field label="School Name" value={form.schoolName} onChange={update('schoolName')} placeholder="Optional" />
          </Row>

          {error && <div style={S.error}>{error}</div>}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...S.payBtn,
              background: ebook.coverColor,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'wait' : 'pointer',
            }}
          >
            {loading ? 'Processing…' : `Pay ₹${ebook.priceRupees} & download →`}
          </button>

          <p style={S.legal}>
            🔒 Secure payment via Razorpay. By continuing you agree to our terms.
            We will only use your contact details to deliver this e-book and follow up about
            your career assessment.
          </p>
        </form>
      </div>
    </div>
  );
};

const Row: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>{children}</div>
);

const Field: React.FC<{
  label: string; value: string; onChange: any; placeholder?: string; type?: string; maxLength?: number;
}> = ({ label, value, onChange, placeholder, type = 'text', maxLength }) => (
  <label style={S.label}>
    <span>{label}</span>
    <input value={value} onChange={onChange} placeholder={placeholder} type={type} maxLength={maxLength} style={S.input} />
  </label>
);

const Select: React.FC<{ label: string; value: string; onChange: any; options: string[] }> = ({
  label, value, onChange, options,
}) => (
  <label style={S.label}>
    <span>{label}</span>
    <select value={value} onChange={onChange} style={S.input}>
      <option value="">Select…</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  </label>
);

const S: Record<string, React.CSSProperties> = {
  page: { fontFamily: "'Segoe UI', system-ui, sans-serif", background: '#f5f7fa', minHeight: '100vh' },
  header: {
    padding: '14px 24px', background: '#fff', borderBottom: '1px solid #e5e7eb',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  backLink: { color: '#006D77', textDecoration: 'none', fontWeight: 600, fontSize: 14 },
  logo: { fontSize: 12, letterSpacing: 2, fontWeight: 800, color: '#006D77' },
  layout: {
    maxWidth: 1100, margin: '24px auto', padding: '0 16px',
    display: 'grid', gridTemplateColumns: 'minmax(260px, 360px) 1fr', gap: 24, alignItems: 'start',
  },
  summary: { background: '#fff', borderRadius: 14, padding: 22, boxShadow: '0 4px 14px rgba(0,0,0,0.06)' },
  summaryTitle: { fontSize: 20, margin: '10px 0 4px' },
  summarySub: { fontSize: 13, color: '#555', margin: 0 },
  includes: { listStyle: 'none', padding: 0, margin: '16px 0', fontSize: 13, color: '#333', lineHeight: 1.9 },
  priceBox: {
    color: '#fff', padding: '14px 18px', borderRadius: 10,
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 15,
  },
  formCard: { background: '#fff', borderRadius: 14, padding: 26, boxShadow: '0 4px 14px rgba(0,0,0,0.06)' },
  formTitle: { margin: 0, fontSize: 22, color: '#1a1a1a' },
  formSub: { marginTop: 4, marginBottom: 18, color: '#555', fontSize: 13 },
  label: { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: '#333' },
  input: {
    padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8,
    fontSize: 14, fontFamily: 'inherit', outline: 'none',
  },
  error: { background: '#ffebeb', border: '1px solid #ffc1c1', color: '#a02525', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginBottom: 12 },
  payBtn: {
    width: '100%', color: '#fff', padding: '14px 20px', border: 'none', borderRadius: 10,
    fontSize: 16, fontWeight: 700, marginTop: 8,
  },
  legal: { fontSize: 11.5, color: '#888', marginTop: 14, lineHeight: 1.6 },
};

export default EbookCheckout;
