/**
 * EBOOK SUCCESS PAGE — post-payment thank-you
 *
 * URL: /ebooks/success?leadId=...&ebook=...
 *
 * Two clear CTAs:
 *   A. Take the Career Assessment now (₹500 OFF) — primary
 *   B. Just download my e-book and exit — secondary
 *
 * The e-book download URL is fetched from the lead doc once the verify
 * function has populated `downloadUrl` (signed URL).
 */

import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../firebase';
import { getEbook } from '../data/ebookCatalog';

interface LeadDoc {
  status?: string;
  downloadUrl?: string;
  studentName?: string;
  email?: string;
  mobile?: string;
}

const EbookSuccess: React.FC = () => {
  const [params] = useSearchParams();
  const leadId = params.get('leadId') || '';
  const ebookKey = params.get('ebook') || '';
  const ebook = getEbook(ebookKey);
  const [lead, setLead] = useState<LeadDoc | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshErr, setRefreshErr] = useState('');

  useEffect(() => {
    if (!leadId) return;
    const unsub = onSnapshot(doc(db, 'ebookLeads', leadId), (snap) => {
      if (snap.exists()) setLead(snap.data() as LeadDoc);
    });
    return unsub;
  }, [leadId]);

  // Auto-recover: if payment is paid but downloadUrl is still empty after 6 s,
  // call refreshEbookDownloadUrl using the email on the lead.
  useEffect(() => {
    if (!lead || lead.status !== 'paid' || lead.downloadUrl || refreshing) return;
    const timer = window.setTimeout(async () => {
      if (!lead.email) return;
      setRefreshing(true);
      try {
        const fn = httpsCallable(functions, 'refreshEbookDownloadUrl');
        await fn({ leadId, email: lead.email });
      } catch (e: any) {
        setRefreshErr(e?.message || 'Could not refresh download link.');
      } finally {
        setRefreshing(false);
      }
    }, 6000);
    return () => window.clearTimeout(timer);
  }, [lead, leadId, refreshing]);

  async function manualRefresh() {
    if (!lead?.email) return;
    setRefreshErr('');
    setRefreshing(true);
    try {
      const fn = httpsCallable(functions, 'refreshEbookDownloadUrl');
      await fn({ leadId, email: lead.email });
    } catch (e: any) {
      setRefreshErr(e?.message || 'Could not refresh download link.');
    } finally {
      setRefreshing(false);
    }
  }

  if (!ebook) {
    return (
      <div style={{ padding: 40, textAlign: 'center', fontFamily: 'Segoe UI' }}>
        <h2>Thank you!</h2>
        <Link to="/ebooks">Back to e-books</Link>
      </div>
    );
  }

  const downloadReady = !!lead?.downloadUrl;
  const assessmentLink = `/login?coupon=${ebook.assessmentCoupon}&leadId=${leadId}`;

  return (
    <div style={S.page}>
      <header style={S.header}>
        <span style={S.logo}>SRICHAKRA ACADEMY</span>
      </header>

      <div style={S.card}>
        <div style={{ fontSize: 64, lineHeight: 1, marginBottom: 8 }}>🎉</div>
        <h1 style={S.title}>Payment confirmed{lead?.studentName ? `, ${lead.studentName.split(' ')[0]}` : ''}!</h1>
        <p style={S.sub}>
          Your copy of <strong>{ebook.title}</strong> has been emailed to{' '}
          <strong>{lead?.email || 'your inbox'}</strong>.
        </p>

        {/* Download button */}
        <div style={S.downloadBox}>
          {downloadReady ? (
            <a href={lead!.downloadUrl} target="_blank" rel="noopener noreferrer" style={{ ...S.downloadBtn, background: ebook.coverColor }}>
              📘 Download {ebook.title} (HTML)
            </a>
          ) : (
            <button
              onClick={manualRefresh}
              disabled={refreshing || !lead?.email}
              style={{ ...S.downloadBtn, background: refreshing ? '#999' : ebook.coverColor, cursor: refreshing ? 'wait' : 'pointer' }}
            >
              {refreshing ? 'Preparing your download…' : '🔄 Get download link'}
            </button>
          )}
          <small style={S.downloadHint}>
            Open in Chrome → Ctrl + P → Save as PDF for a print-ready copy.
            {!downloadReady && lead?.status === 'paid' && (
              <><br />A copy is also being emailed to <strong>{lead?.email}</strong>.</>
            )}
            {refreshErr && <><br /><span style={{ color: '#a02525' }}>{refreshErr}</span></>}
          </small>
        </div>

        {/* Coupon highlight */}
        <div style={S.couponBox}>
          <div style={{ fontSize: 13, color: '#555' }}>Your ₹500 OFF Assessment coupon</div>
          <div style={{ ...S.coupon, background: ebook.accent, color: '#1a1a1a' }}>{ebook.assessmentCoupon}</div>
          <div style={{ fontSize: 12, color: '#888' }}>Valid for 60 days. Use at checkout.</div>
        </div>

        {/* Two CTAs */}
        <h2 style={S.q}>What would you like to do next?</h2>

        <div style={S.ctaRow}>
          <Link to={assessmentLink} style={{ ...S.primaryCta, background: ebook.coverColor }}>
            🚀 Start the Career Assessment now
            <span style={S.ctaSub}>Get a personalised report mapped to {ebook.careers}+ careers</span>
          </Link>

          <a href="https://srichakraacademy.org" style={S.secondaryCta}>
            👋 I’ll just read my e-book for now
            <span style={S.ctaSub}>You can return anytime — coupon valid 60 days</span>
          </a>
        </div>

        <div style={S.contact}>
          Questions? 📞 85903 96662 · ✉️ info.srichakra@gmail.com
        </div>
      </div>
    </div>
  );
};

const S: Record<string, React.CSSProperties> = {
  page: { fontFamily: "'Segoe UI', system-ui, sans-serif", background: '#f5f7fa', minHeight: '100vh' },
  header: { padding: '14px 24px', background: '#fff', borderBottom: '1px solid #e5e7eb' },
  logo: { fontSize: 12, letterSpacing: 2, fontWeight: 800, color: '#006D77' },
  card: {
    maxWidth: 720, margin: '32px auto', padding: '32px 28px',
    background: '#fff', borderRadius: 16, boxShadow: '0 4px 18px rgba(0,0,0,0.08)', textAlign: 'center',
  },
  title: { margin: '8px 0 6px', fontSize: 26, color: '#0a7c4a' },
  sub: { color: '#555', fontSize: 15, lineHeight: 1.6, marginBottom: 22 },
  downloadBox: { padding: '18px', background: '#f8faf9', borderRadius: 12, marginBottom: 22 },
  downloadBtn: {
    display: 'inline-block', color: '#fff', padding: '14px 28px', borderRadius: 30,
    textDecoration: 'none', fontWeight: 700, fontSize: 15, border: 'none',
  },
  downloadHint: { display: 'block', marginTop: 10, fontSize: 12, color: '#666' },
  couponBox: {
    padding: 14, marginBottom: 26, border: '1px dashed #d4a017', borderRadius: 10, background: '#fffdf6',
  },
  coupon: {
    display: 'inline-block', padding: '8px 18px', borderRadius: 6, margin: '6px 0',
    fontFamily: 'Courier New, monospace', fontSize: 18, fontWeight: 800, letterSpacing: 3,
  },
  q: { fontSize: 18, marginTop: 8 },
  ctaRow: {
    display: 'grid', gridTemplateColumns: '1fr', gap: 12, marginTop: 12,
  },
  primaryCta: {
    color: '#fff', padding: '16px 22px', borderRadius: 12, textDecoration: 'none',
    fontWeight: 700, fontSize: 16, display: 'flex', flexDirection: 'column', gap: 4,
  },
  secondaryCta: {
    color: '#1a1a1a', padding: '16px 22px', borderRadius: 12, textDecoration: 'none',
    fontWeight: 600, fontSize: 15, background: '#f0f2f5', border: '1px solid #e5e7eb',
    display: 'flex', flexDirection: 'column', gap: 4,
  },
  ctaSub: { fontSize: 12, fontWeight: 400, opacity: 0.9 },
  contact: { marginTop: 24, fontSize: 13, color: '#666' },
};

export default EbookSuccess;
