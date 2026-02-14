/**
 * LANDING PAGE — Srichakra Academy
 * Original welcome card with academy branding, assessment info, and CTA buttons.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';

const Landing: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={styles.page}>
      <div style={styles.welcomeSection}>
        <div style={styles.card}>
          {/* Academy Branding */}
          <div style={styles.headerBand}>
            <h1 style={styles.academy}>Srichakra Academy</h1>
            <p style={styles.tagline}>Empowering Futures, One Decision at a Time</p>
          </div>

          {/* Assessment Info */}
          <div style={styles.cardBody}>
            <h2 style={styles.cardTitle}>Career Assessment</h2>
            <p style={styles.cardDesc}>
              Discover your cognitive strengths, interest patterns, and recommended academic pathways
              with our comprehensive psychometric assessment.
            </p>

            <div style={styles.infoRow}>
              <div style={styles.infoBadge}>
                <span style={styles.infoBadgeNum}>76</span>
                <span style={styles.infoBadgeLabel}>Questions</span>
              </div>
              <div style={styles.infoBadge}>
                <span style={styles.infoBadgeNum}>25–35</span>
                <span style={styles.infoBadgeLabel}>Minutes</span>
              </div>
              <div style={styles.infoBadge}>
                <span style={styles.infoBadgeNum}>10</span>
                <span style={styles.infoBadgeLabel}>Page Report</span>
              </div>
            </div>

            {/* Two parts */}
            <div style={styles.partRow}>
              <div style={styles.partCard}>
                <div style={{ fontSize: '1.4em', marginBottom: '6px' }}>🧠</div>
                <strong style={{ color: '#006D77' }}>Part 1 — Aptitude</strong>
                <p style={styles.partDesc}>16 objective MCQs covering Numerical, Logical, Verbal, and Spatial reasoning.</p>
              </div>
              <div style={styles.partCard}>
                <div style={{ fontSize: '1.4em', marginBottom: '6px' }}>💡</div>
                <strong style={{ color: '#E29578' }}>Part 2 — Preferences</strong>
                <p style={styles.partDesc}>60 self-report questions about your interests, learning style, and motivations.</p>
              </div>
            </div>

            {/* CTA Buttons */}
            <div style={styles.ctaRow}>
              <button
                onClick={() => navigate('/assessment')}
                style={styles.btnPrimary}
                onMouseEnter={e => (e.currentTarget.style.background = '#005a63')}
                onMouseLeave={e => (e.currentTarget.style.background = '#006D77')}
              >
                Start Assessment →
              </button>
              <button
                onClick={() => navigate('/demo')}
                style={styles.btnSecondary}
                onMouseEnter={e => { e.currentTarget.style.background = '#006D77'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#006D77'; }}
              >
                View Demo Report
              </button>
            </div>

            <p style={styles.loginHint}>
              Already have an account?{' '}
              <span style={styles.loginLink} onClick={() => navigate('/login')}>Login / Register</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    color: '#333',
  },
  welcomeSection: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    background: 'linear-gradient(135deg, #006D77 0%, #83C5BE 50%, #EDF6F9 100%)',
  },
  card: {
    background: '#fff',
    borderRadius: '20px',
    boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
    maxWidth: '640px',
    width: '100%',
    overflow: 'hidden',
  },
  headerBand: {
    background: '#006D77',
    padding: '28px 32px',
    textAlign: 'center' as const,
  },
  academy: {
    color: '#fff',
    fontSize: '1.6em',
    fontWeight: 800,
    margin: '0 0 4px',
    letterSpacing: '0.5px',
  },
  tagline: {
    color: '#83C5BE',
    margin: 0,
    fontSize: '0.95em',
    fontWeight: 500,
  },
  cardBody: {
    padding: '32px',
  },
  cardTitle: {
    color: '#006D77',
    fontSize: '1.35em',
    fontWeight: 700,
    margin: '0 0 12px',
    textAlign: 'center' as const,
  },
  cardDesc: {
    color: '#555',
    fontSize: '0.95em',
    lineHeight: 1.7,
    textAlign: 'center' as const,
    margin: '0 0 24px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    marginBottom: '24px',
    flexWrap: 'wrap' as const,
  },
  infoBadge: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    padding: '12px 20px',
    background: '#f0f9f9',
    borderRadius: '12px',
    minWidth: '80px',
  },
  infoBadgeNum: {
    fontSize: '1.4em',
    fontWeight: 800,
    color: '#006D77',
  },
  infoBadgeLabel: {
    fontSize: '0.8em',
    color: '#777',
    marginTop: '2px',
  },
  partRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginBottom: '28px',
  },
  partCard: {
    padding: '16px',
    background: '#fafafa',
    borderRadius: '12px',
    textAlign: 'center' as const,
    border: '1px solid #eee',
  },
  partDesc: {
    color: '#777',
    fontSize: '0.85em',
    lineHeight: 1.5,
    margin: '6px 0 0',
  },
  ctaRow: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    flexWrap: 'wrap' as const,
    marginBottom: '16px',
  },
  btnPrimary: {
    padding: '14px 32px',
    background: '#006D77',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '1.05em',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  btnSecondary: {
    padding: '14px 32px',
    background: 'transparent',
    color: '#006D77',
    border: '2px solid #006D77',
    borderRadius: '10px',
    fontSize: '1.05em',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  loginHint: {
    textAlign: 'center' as const,
    color: '#999',
    fontSize: '0.88em',
    margin: 0,
  },
  loginLink: {
    color: '#006D77',
    fontWeight: 600,
    cursor: 'pointer',
    textDecoration: 'underline',
  },
};

export default Landing;
