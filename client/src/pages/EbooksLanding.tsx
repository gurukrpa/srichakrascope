/**
 * EBOOKS LANDING PAGE — public, FB-ad destination
 *
 * URL: /ebooks  (FB ad: srichakraacademy.org/ebooks?utm_source=fb&utm_campaign=...)
 *
 * Shows all 5 e-books as cards. CTA → /ebooks/checkout/:key
 *
 * No login required. UTM params are auto-captured and forwarded to checkout
 * via sessionStorage.
 */

import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { EBOOK_CATALOG } from '../data/ebookCatalog';

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

const EbooksLanding: React.FC = () => {
  const location = useLocation();

  // Capture UTM params for attribution downstream
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const utm: Record<string, string> = {};
    UTM_KEYS.forEach((k) => {
      const v = params.get(k);
      if (v) utm[k] = v;
    });
    if (Object.keys(utm).length) {
      try {
        sessionStorage.setItem('srichakra_utm', JSON.stringify(utm));
      } catch {
        /* ignore quota */
      }
    }
  }, [location.search]);

  return (
    <div style={S.page}>
      {/* Header */}
      <header style={S.header}>
        <div style={S.brand}>
          <span style={S.logoCircle}>SA</span>
          <div>
            <div style={S.brandName}>SRICHAKRA ACADEMY</div>
            <div style={S.brandTag}>Self Discovery to Success</div>
          </div>
        </div>
        <a href="https://srichakraacademy.org" style={S.headerLink}>
          srichakraacademy.org →
        </a>
      </header>

      {/* Hero */}
      <section style={S.hero}>
        <h1 style={S.heroTitle}>
          Pick the right career — <span style={{ color: '#ffb84d' }}>before</span> you pick the wrong college.
        </h1>
        <p style={S.heroSub}>
          5 hand-curated career e-books mapping <strong>170+ Indian career pathways</strong> across every stream —
          with qualifications, entrance exams, top institutions and salary ranges.
        </p>
        <div style={S.heroBadges}>
          <span style={S.badge}>📘 Instant download</span>
          <span style={S.badge}>🇮🇳 India-first</span>
          <span style={S.badge}>🎁 ₹500 OFF Career Assessment</span>
        </div>
      </section>

      {/* E-book grid */}
      <section style={S.gridWrap}>
        <div style={S.grid}>
          {EBOOK_CATALOG.map((b) => (
            <article
              key={b.key}
              style={{
                ...S.card,
                borderTop: `6px solid ${b.coverColor}`,
              }}
            >
              <div style={{ ...S.cardHeader, background: b.coverColor }}>
                <span style={S.cardIcon}>{b.icon}</span>
                <span style={{ ...S.cardPrice, background: b.accent }}>₹{b.priceRupees}</span>
              </div>
              <div style={S.cardBody}>
                <h3 style={{ ...S.cardTitle, color: b.coverColor }}>{b.title}</h3>
                <p style={S.cardSub}>{b.subtitle}</p>
                <p style={S.cardDesc}>{b.description}</p>
                <div style={S.cardMeta}>
                  <span>📂 {b.clusters} clusters</span>
                  <span>💼 {b.careers} careers</span>
                </div>
                <div style={S.cardCoupon}>
                  🎁 Includes <strong>{b.assessmentCoupon}</strong> — ₹500 OFF Srichakra Career Assessment
                </div>
                <Link
                  to={`/ebooks/checkout/${b.key}${location.search}`}
                  style={{ ...S.cta, background: b.coverColor }}
                >
                  Get this e-book →
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Trust strip */}
      <section style={S.trust}>
        <div>🔒 Secure UPI / Card payment via Razorpay</div>
        <div>📩 Delivered to your email instantly</div>
        <div>📞 Support: 85903 96662 · 98430 30697</div>
      </section>

      <footer style={S.footer}>
        © {new Date().getFullYear()} Srichakra Academy · A unit of SriKrpa Foundation Trust
      </footer>
    </div>
  );
};

const S: Record<string, React.CSSProperties> = {
  page: { fontFamily: "'Segoe UI', system-ui, sans-serif", background: '#f5f7fa', minHeight: '100vh', color: '#1a1a1a' },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 24px', background: '#fff', borderBottom: '1px solid #e5e7eb',
    position: 'sticky', top: 0, zIndex: 10,
  },
  brand: { display: 'flex', alignItems: 'center', gap: 12 },
  logoCircle: {
    width: 42, height: 42, borderRadius: '50%', background: '#006D77', color: '#fff',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, letterSpacing: 1,
  },
  brandName: { fontWeight: 800, letterSpacing: 2, fontSize: 13, color: '#1a1a1a' },
  brandTag: { fontSize: 11, color: '#666', letterSpacing: 0.5 },
  headerLink: { color: '#006D77', textDecoration: 'none', fontWeight: 600, fontSize: 13 },
  hero: {
    background: 'linear-gradient(135deg, #006D77 0%, #03524a 100%)', color: '#fff',
    padding: '48px 24px 56px', textAlign: 'center',
  },
  heroTitle: { margin: 0, fontSize: 'clamp(24px, 4.5vw, 38px)', maxWidth: 900, marginInline: 'auto', lineHeight: 1.25 },
  heroSub: { marginTop: 14, fontSize: 'clamp(14px, 2vw, 17px)', maxWidth: 760, marginInline: 'auto', opacity: 0.92, lineHeight: 1.6 },
  heroBadges: { marginTop: 22, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
  badge: {
    background: 'rgba(255,255,255,0.15)', padding: '8px 14px', borderRadius: 20,
    fontSize: 13, fontWeight: 600, border: '1px solid rgba(255,255,255,0.2)',
  },
  gridWrap: { padding: '36px 16px 16px', maxWidth: 1200, margin: '0 auto' },
  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20,
  },
  card: {
    background: '#fff', borderRadius: 14, overflow: 'hidden',
    boxShadow: '0 4px 14px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column',
  },
  cardHeader: {
    padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  cardIcon: { fontSize: 44, lineHeight: 1 },
  cardPrice: {
    color: '#1a1a1a', padding: '6px 12px', borderRadius: 6,
    fontWeight: 800, fontSize: 16, letterSpacing: 1,
  },
  cardBody: { padding: '18px 20px 22px', display: 'flex', flexDirection: 'column', flex: 1 },
  cardTitle: { margin: 0, fontSize: 18, lineHeight: 1.3 },
  cardSub: { margin: '6px 0 10px', fontSize: 13, color: '#444', lineHeight: 1.5 },
  cardDesc: { margin: 0, fontSize: 13, color: '#555', lineHeight: 1.55, flex: 1 },
  cardMeta: {
    marginTop: 14, display: 'flex', gap: 14, fontSize: 12.5, color: '#666',
    paddingTop: 12, borderTop: '1px dashed #e5e7eb',
  },
  cardCoupon: {
    marginTop: 12, padding: '8px 10px', background: '#fff7e0', border: '1px dashed #d4a017',
    borderRadius: 8, fontSize: 12, color: '#5a4500',
  },
  cta: {
    marginTop: 14, color: '#fff', textAlign: 'center', padding: '12px 18px',
    borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 14,
  },
  trust: {
    padding: '24px 16px', background: '#fff', borderTop: '1px solid #e5e7eb',
    display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 24,
    fontSize: 13, color: '#444',
  },
  footer: { padding: '16px', textAlign: 'center', fontSize: 12, color: '#888' },
};

export default EbooksLanding;
