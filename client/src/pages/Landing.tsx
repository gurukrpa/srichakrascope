/**
 * LANDING PAGE — Srichakra Academy
 *
 * - Teal header bar with Srichakra branding, Login/Register
 * - Navigation bar with dropdown menus
 * - Hero banner with graduate image
 * - Service cards (DMIT, Career Assessment, Overseas Admission, Bridging Courses)
 *   → Career Assessment card opens /login for assessment login
 *   → Other cards show an info modal with service explanation
 * - Footer
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

/* ── Trusted-by / partner logos strip ── */
const TRUST_LOGOS = [
  { name: 'Spring Days International School', icon: '🏫' },
  { name: '100+ Global Universities', icon: '🌍' },
  { name: '1000+ Happy Students', icon: '🎓' },
  { name: '29 Years of Experience', icon: '⭐' },
  { name: 'Certified Career Counsellors', icon: '✅' },
];

/* ── Inline CSS for responsive + scroll-reveal (injected once) ── */
const LANDING_CSS = `
  .reveal { opacity: 0; transform: translateY(28px); transition: opacity 0.7s ease-out, transform 0.7s ease-out; }
  .reveal.is-visible { opacity: 1; transform: translateY(0); }

  /* Stop pulse on hover so users can read the button */
  .hero-cta-primary:hover { animation: none !important; }

  /* Service card image polish — uniform tint + zoom on hover */
  .svc-card-img { transition: transform 0.5s ease; }
  .svc-card:hover .svc-card-img { transform: scale(1.06); }
  .svc-card-tint { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(14,107,115,0) 50%, rgba(14,107,115,0.18) 100%); pointer-events: none; }

  /* Nav: chevron fades in on hover for cleaner default state */
  .nav-item:hover .nav-chevron { opacity: 1 !important; color: #0E6B73 !important; }
  .nav-item:hover .nav-label { color: #0E6B73 !important; }

  /* Testimonials */
  .testimonial-card { transition: transform 0.3s ease, box-shadow 0.3s ease; }
  .testimonial-card:hover { transform: translateY(-4px); box-shadow: 0 18px 40px rgba(14,107,115,0.14); }

  /* Sticky floating CTA */
  .float-cta { position: fixed; bottom: 24px; right: 24px; z-index: 900; padding: 14px 22px; background: #E29578; color: #fff; border: none; border-radius: 999px; font-weight: 700; font-size: 0.98em; font-family: inherit; cursor: pointer; box-shadow: 0 8px 28px rgba(226,149,120,0.55); display: inline-flex; align-items: center; gap: 8px; transition: transform 0.2s, background 0.2s; opacity: 0; pointer-events: none; transform: translateY(20px); }
  .float-cta.is-visible { opacity: 1; pointer-events: auto; transform: translateY(0); }
  .float-cta:hover { background: #d4856a; transform: translateY(-2px); }

  /* Mobile menu toggle (hidden on desktop) */
  .mobile-toggle { display: none; }

  @media (max-width: 960px) {
    .header-inner { flex-direction: column; align-items: flex-start !important; gap: 14px !important; }
    .auth-btns { width: 100%; justify-content: flex-start; }
    .brand-name { font-size: 1.8em !important; }
    .brand-tagline { font-size: 0.95em !important; }
    .hero-title { font-size: 2.4em !important; }
    .hero-subtitle { font-size: 1.1em !important; }
    .nav-inner { gap: 0 !important; overflow-x: auto; justify-content: flex-start !important; -webkit-overflow-scrolling: touch; }
    .nav-item { padding: 14px 16px !important; }
    .section-title { font-size: 1.9em !important; }
    .promo-title { font-size: 1.7em !important; }
    .promo-new-price { font-size: 2em !important; }
    .stats-bar { gap: 28px !important; padding: 36px 24px !important; }
    .stat-num { font-size: 2em !important; }
  }
  @media (max-width: 600px) {
    .auth-btns { gap: 8px !important; }
    .auth-btns button, .auth-btns a { font-size: 0.85em !important; padding: 9px 14px !important; }
    .hero-cta-primary { font-size: 1em !important; padding: 14px 26px !important; }
    .hero-cta-secondary { font-size: 0.95em !important; padding: 12px 22px !important; }
    .promo-inner { gap: 28px !important; }
    .promo-features { flex: 1 1 auto !important; }
    .float-cta span.float-label { display: none; }
    .float-cta { padding: 14px 16px; }
    /* Brand block: prevent overflow on narrow screens */
    .brand-row { gap: 10px !important; }
    .brand-row > div { min-width: 0; flex: 1 1 auto; }
    .brand-name { font-size: 1.4em !important; letter-spacing: 0 !important; }
    .brand-pillar { font-size: 1.3em !important; }
    .brand-tagline { font-size: 0.82em !important; white-space: normal !important; }
    .brand-subline { font-size: 0.6em !important; white-space: normal !important; }
    /* CCC banner stacks */
    .ccc-inner { flex-direction: column !important; gap: 28px !important; }
    /* Modal padding tighter on mobile */
    .modal-content { padding: 18px !important; }
    /* Partner pills wrap nicely */
    .partner-pill { font-size: 0.74em !important; padding: 3px 8px !important; }
  }
`;

/* ── IntersectionObserver hook: adds .is-visible to .reveal elements as they enter ── */
function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('.reveal');
    if (!('IntersectionObserver' in window)) {
      els.forEach(el => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/* ── Nav menu items with dropdown children ── */
const NAV_ITEMS = [
  {
    label: 'DMIT',
    children: [
      { label: 'What is DMIT?', desc: 'Scientific fingerprint-based intelligence profiling' },
      { label: 'Benefits', desc: 'Discover innate talents, learning style & brain dominance' },
      { label: 'Book DMIT Test', desc: 'Schedule a session for your child today' },
    ],
  },
  {
    label: 'Career Counseling',
    children: [
      { label: 'SCOPE Assessment', desc: 'Student Career & Opportunity Pathway Evaluation' },
      { label: 'Counsellor Certification', desc: 'Become a certified Career Counsellor in 3 months — SCOPE-backed' },
      { label: 'One-on-One Counselling', desc: 'Personalized expert guidance for stream & career choices' },
      { label: 'Demo Report', desc: 'Preview a sample career guidance report' },
    ],
  },
  {
    label: 'Overseas Admission',
    children: [
      { label: 'MBBS Abroad', desc: 'Georgia, Kazakhstan, Kyrgyzstan & Russia (NMC-aligned guidance)' },
      { label: 'Study in Australia', desc: 'Top universities, PR pathways & scholarship options' },
      { label: 'Study in UK', desc: 'Russell Group universities & post-study work visa' },
      { label: 'Study in USA', desc: 'Ivy League & state universities with financial aid' },
      { label: 'Study in Canada', desc: 'Affordable education with immigration pathways' },
      { label: 'Study in Germany', desc: 'Tuition-free public universities & STEM programs' },
      { label: 'More Countries', desc: 'New Zealand, Ireland, Singapore & beyond' },
    ],
  },
  {
    label: 'Bridging Courses',
    children: [
      { label: 'Foundation Courses', desc: 'Includes international pathway programs for all streams' },
      { label: 'School Enrichment', desc: 'Fill academic gaps and strengthen core subject skills' },
      { label: 'Skill Enhancement', desc: 'Build competencies for your chosen career path' },
      { label: 'Exam Preparation', desc: 'Focused coaching for competitive and board exams' },
    ],
  },
];

/* ── Service cards data ── */
const SERVICE_CARDS = [
  {
    id: 'dmit',
    title: 'DMIT',
    subtitle: 'Dermatoglyphics Multiple Intelligence Test',
    image: '/images/svc-dmit.svg',
    description: 'DMIT is a scientific study of fingerprint patterns that helps identify a person\'s innate intelligence, strengths, and potential. It reveals your child\'s natural talents through biometric analysis, helping parents and educators guide them towards the right learning path and career choices.',
    features: ['Innate talent discovery', 'Learning style identification', 'Brain dominance analysis', 'Personality profiling'],
    isAssessment: false,
  },
  {
    id: 'career',
    title: 'SCOPE',
    subtitle: 'Student Career & Opportunity Pathway Evaluation',
    image: '/images/svc-scope.jpg',
    description: 'Assessing Personality, Aptitude, Interests & Multiple Intelligences to Guide Stream Selection and Career Direction.',
    features: ['Scientifically designed questions', '10-page personalized report', 'Stream & course recommendations', 'Career cluster mapping'],
    isAssessment: true,
  },
  {
    id: 'overseas',
    title: 'Overseas Admission',
    subtitle: 'Study Abroad & MBBS Abroad Guidance',
    image: '/images/svc-overseas.jpg',
    description: 'Expert global admissions guidance covering university selection, applications, visa documentation, scholarships, education loans, language test preparation, and pre-departure support. We also provide MBBS Abroad guidance for NMC-aligned pathways in Georgia, Kazakhstan, Kyrgyzstan, and Russia.',
    features: ['University Selection & Shortlisting', 'Application & SOP Assistance', 'Visa Documentation Support', 'Scholarship Guidance', 'Language Test Preparation', 'Education Loan Assistance', 'Accommodation Support', 'Pre-Departure Briefing', 'MBBS Abroad: Georgia, Kazakhstan, Kyrgyzstan & Russia'],
    partners: [
      { name: 'TIO Business School', country: 'Netherlands', highlight: "Bachelor's and Master's programmes in Hotel Management, Event Management, Tourism, Business and Marketing" },
      { name: 'AURA International School of Management', country: 'France (Paris & Lyon)', highlight: '6 months course + 6 months paid internship · BBA · MBA · EMBA · Scholarships up to €3,000/yr · Fall 2026' },
    ],
    isAssessment: false,
  },
  {
    id: 'bridging',
    title: 'Bridging Courses',
    subtitle: 'Foundation, School Enrichment & Skill Enhancement',
    image: '/images/svc-bridging.jpg',
    description: 'Bridge the gap between where you are and where you want to be. Our foundation courses include international pathway programs, while school enrichment programs help fill academic gaps. Combined with skill enhancement workshops and focused exam preparation, we build the competencies students need for their chosen career path.',
    features: ['Foundation courses with international pathway programs', 'School enrichment to fill academic gaps', 'Skill enhancement workshops', 'Competitive exam preparation'],
    isAssessment: false,
  },
];

const TESTIMONIALS = [
  {
    quote: "Hello Mam, will need more assistance from you till she settles down on something. Will definitely refer you further because I personally feel you don't push the \"Sell\" button and your suggestions come from deep knowledge and experience.",
    name: 'Parent',
    role: 'WhatsApp feedback',
    initials: 'P',
  },
  {
    quote: "I used to feel that I can do anything as I was academically strong, but was unsure about what career will suit me. The counselling helped me identify what I really did not want to do — and finally I have decided on what I want to do.",
    name: 'SCOPE Student',
    role: 'Recent feedback',
    initials: 'S',
  },
  {
    quote: "Srichakra guided us through the entire overseas admissions journey. Our daughter is now in Australia — and the best part was the excellent scholarship she received from a Group of Eight university.",
    name: 'Parent',
    role: 'Overseas Admission · Australia',
    initials: 'P',
  },
  {
    quote: "A valuable Career Counselling Session was conducted at school for Grades 8 to 11, led by Ms. Eshwari. She introduced the Six Thinking Hats technique, helping students analyse career choices creatively, logically, emotionally and critically. The session was highly informative and empowering — helping our students take confident steps towards a bright future.",
    name: 'Spring Days International School',
    role: 'Odyssey · Monthly Magazine',
    initials: 'SD',
  },
];

const MBBS_POPUP_END_TS = new Date('2027-01-09T23:59:59+05:30').getTime();
const MBBS_POPUP_DISMISS_KEY = 'srichakra_mbbs_abroad_popup_dismiss_until_v2';
const MBBS_POPUP_LAST_SHOWN_DATE_KEY = 'srichakra_mbbs_abroad_popup_last_shown_date_v2';

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [showEnquiry, setShowEnquiry] = useState(false);
  const [enquiryForm, setEnquiryForm] = useState({ name: '', phone: '', email: '', message: '' });
  const [enquirySent, setEnquirySent] = useState(false);
  const [enquiryError, setEnquiryError] = useState(false);
  const [showFloatCta, setShowFloatCta] = useState(false);
  const [showMbbsPopup, setShowMbbsPopup] = useState(false);

  useScrollReveal();

  /* ── Show floating CTA after the user scrolls past the hero ── */
  useEffect(() => {
    const onScroll = () => setShowFloatCta(window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ── Time-bound campaign popup: show for 6 months with local dismiss windows ── */
  useEffect(() => {
    const now = Date.now();
    if (now > MBBS_POPUP_END_TS) return;

    const today = new Date().toISOString().slice(0, 10);

    try {
      const dismissedUntilRaw = localStorage.getItem(MBBS_POPUP_DISMISS_KEY);
      const dismissedUntil = dismissedUntilRaw ? Number(dismissedUntilRaw) : 0;
      if (dismissedUntil && now < dismissedUntil) return;

      const lastShownDate = localStorage.getItem(MBBS_POPUP_LAST_SHOWN_DATE_KEY);
      if (lastShownDate === today) return;
    } catch {
      // Ignore localStorage access issues and continue to show popup.
    }

    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(MBBS_POPUP_LAST_SHOWN_DATE_KEY, today);
      } catch {
        // Ignore localStorage access issues.
      }
      setShowMbbsPopup(true);
    }, 1500);
    return () => window.clearTimeout(timer);
  }, []);

  const dismissMbbsPopup = (days: number) => {
    setShowMbbsPopup(false);
    try {
      const dismissUntil = Date.now() + days * 24 * 60 * 60 * 1000;
      localStorage.setItem(MBBS_POPUP_DISMISS_KEY, String(dismissUntil));
    } catch {
      // Ignore localStorage access issues.
    }
  };

  /* ── Handle nav dropdown actions ── */
  const handleNavAction = (parent: string, child: string) => {
    setOpenDropdown(null);
    if (child === 'SCOPE Assessment') navigate('/login');
    else if (child === 'Demo Report') navigate('/demo');
    else if (child === 'Counsellor Certification') { window.location.href = '/career-counsellor-certification/'; return; }
    else if (child === 'Book DMIT Test') setActiveModal('dmit');
    else if (child === 'One-on-One Counselling') navigate('/login');
    else if (parent === 'Bridging Courses') setActiveModal('bridging');
    else if (parent === 'DMIT') setActiveModal('dmit');
    else if (parent === 'Overseas Admission') setActiveModal('overseas');
    else navigate('/login');
  };

  /* ── Handle card click ── */
  const handleCardClick = (card: typeof SERVICE_CARDS[0]) => {
    if (card.isAssessment) {
      navigate('/login');
    } else {
      setActiveModal(card.id);
    }
  };

  /* ── Get modal card data ── */
  const modalCard = SERVICE_CARDS.find(c => c.id === activeModal);

  return (
    <div style={s.page}>
      <style>{LANDING_CSS}</style>

      {/* ══════════ HEADER BAR ══════════ */}
      <header style={s.header}>
        <div style={s.headerInner} className="header-inner">
          {/* Logo + Branding */}
          <div style={s.brandRow} className="brand-row">
            <img
              src="/images/srichakra-logo.png"
              alt="Srichakra Logo"
              style={{ height: 52, width: 'auto', borderRadius: 6 }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <div>
              <h1 style={s.brandTitle}>
                <span style={s.pillar} className="brand-pillar">||</span>{' '}
                <span style={s.brandName} className="brand-name">srichakra</span>{' '}
                <span style={s.pillar} className="brand-pillar">||</span>
              </h1>
              <p className="brand-subline" style={{ color: '#E29578', fontSize: '0.65em', margin: '2px 0 0', fontStyle: 'italic' }}>(A Unit of SriKrpa Foundation Trust)</p>
              <p style={s.brandTagline} className="brand-tagline">The School To identify Your Child's Divine Gift!!</p>
            </div>
          </div>

          {/* Login / Register */}
          <div style={s.authBtns} className="auth-btns">
            <a
              href="https://lms.srichakraacademy.org"
              target="_blank"
              rel="noopener noreferrer"
              style={s.loginBtn}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.22)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
              title="Access Srichakra Learning Portal (Moodle)"
            >
              🎓 Learning Portal
            </a>
            <button
              style={s.loginBtn}
              onClick={() => navigate('/school-login')}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.22)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
              title="Academic Partner Login"
            >
              🏫 Academic Partner
            </button>
            <button
              style={s.registerBtn}
              onClick={() => navigate('/login')}
              onMouseEnter={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#0E6B73'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#E29578'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.transform = 'translateY(0)'; }}
              title="Individual student login or registration"
            >
              👤 Login / Register
            </button>
            <button
              style={s.adminLink}
              onClick={() => navigate('/admin/login')}
              title="Admin Portal"
            >
              Admin
            </button>
          </div>
        </div>
      </header>

      {/* ══════════ NAVIGATION BAR ══════════ */}
      <nav style={s.nav}>
        <div style={s.navInner} className="nav-inner">
          {NAV_ITEMS.map((item, idx) => (
            <div
              key={idx}
              style={s.navItem}
              className="nav-item"
              onMouseEnter={() => setOpenDropdown(idx)}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <span style={s.navLabel} className="nav-label">
                {item.label} <span style={s.chevron} className="nav-chevron">▾</span>
              </span>
              {openDropdown === idx && (
                <div style={s.dropdown}>
                  {item.children.map((child, ci) => (
                    <div
                      key={ci}
                      style={child.desc ? { ...s.dropdownItem, padding: '10px 20px' } : s.dropdownItem}
                      onClick={() => handleNavAction(item.label, child.label)}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = '#f0f9f9'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = '#fff'; }}
                    >
                      <div style={{ fontWeight: 600, color: '#333', fontSize: '0.92em' }}>{child.label}</div>
                      {child.desc && (
                        <div style={{ fontSize: '0.78em', color: '#888', marginTop: 2, lineHeight: 1.4 }}>{child.desc}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </nav>

      {/* ══════════ HERO BANNER ══════════ */}
      <section style={s.hero}>
        <img
          src="/images/graduate.jpg"
          alt="Srichakra Academy"
          style={s.heroImage}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <div style={s.heroOverlay}>
          <h2 style={s.heroTitle} className="hero-title">Your Journey to Success Starts Here !!</h2>
          <p style={{ ...s.heroSubtitle, fontWeight: 'bold', fontSize: '1.45em', marginBottom: 8 }} className="hero-subtitle">
            Shaping Futures from Grade 8 to Global Universities
          </p>
          <p style={{ ...s.heroSubtitle, fontWeight: 500, fontSize: '1em', marginTop: 0, marginBottom: 18 }} className="hero-subtitle">
            Data-driven career guidance and overseas admissions pathways after 10th, 12th, graduation or post-graduation.
          </p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' as const, justifyContent: 'center' }}>
            <button
              style={s.heroCtaPrimary}
              className="hero-cta-primary"
              onClick={() => navigate('/login')}
              onMouseEnter={e => { e.currentTarget.style.background = '#d4856a'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#E29578'; }}
            >
              📝 Take the Assessment
            </button>
            <a
              href="https://wa.me/918590396662?text=Hi%20Srichakra%20Academy%2C%20I%27d%20like%20to%20know%20more%20about%20your%20services."
              target="_blank"
              rel="noopener noreferrer"
              style={{ ...s.heroCta, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}
              className="hero-cta-secondary"
              onMouseEnter={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#0E6B73'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#fff'; }}
            >
              💬 Talk to a Counsellor
            </a>
          </div>
        </div>
      </section>

      {/* ══════════ PROMOTION BANNER ══════════ */}
      <section style={s.promoBanner} className="reveal">
        <div style={s.promoInner} className="promo-inner">
          <div style={s.promoContent}>
            <div style={s.promoBadge}>🎉 LIMITED TIME OFFER</div>
            <h2 style={s.promoTitle} className="promo-title">SCOPE Career Assessment</h2>
            <p style={s.promoDesc}>
              Discover your child's ideal career path with our scientifically designed assessment.
              Get a comprehensive 10-page personalized report with stream recommendations & career cluster mapping.
            </p>
            <div style={s.promoPriceRow}>
              <span style={s.promoOldPrice}>₹2999</span>
              <span style={s.promoNewPrice} className="promo-new-price">₹1599/-</span>
            </div>
            <button
              style={s.promoBtn}
              onClick={() => navigate('/login')}
              onMouseEnter={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#E29578'; e.currentTarget.style.transform = 'scale(1.04)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#E29578'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.transform = 'scale(1)'; }}
            >
              Take Assessment Now →
            </button>
          </div>
          <div style={s.promoFeatures} className="promo-features">
            <div style={s.promoFeature}>✅ Scientifically Designed Questions</div>
            <div style={s.promoFeature}>✅ 10-Page Personalized Report</div>
            <div style={s.promoFeature}>✅ Stream & Course Recommendations</div>
            <div style={s.promoFeature}>✅ Career Cluster Mapping</div>
            <div style={s.promoFeature}>✅ Aptitude & Personality Analysis</div>
            <div style={s.promoFeature}>✅ Instant Digital Report</div>
          </div>
        </div>
      </section>

      {/* ══════════ E-BOOKS PROMO BANNER ══════════ */}
      <section
        className="reveal"
        style={{
          background: 'linear-gradient(135deg, #006D77 0%, #00838F 50%, #0097A7 100%)',
          padding: '32px 20px',
          textAlign: 'center' as const,
          cursor: 'pointer',
          transition: 'transform 0.2s',
        }}
        onClick={() => navigate('/ebooks')}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.01)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
      >
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ fontSize: '3rem' }}>📚</div>
          <h2 style={{ color: '#fff', fontSize: '1.6em', margin: '8px 0 4px', textShadow: '2px 2px 4px rgba(0,0,0,0.2)' }}>
            Career Discovery E-Books
          </h2>
          <p style={{ color: '#fff', fontSize: '1.05em', margin: '4px 0 8px', opacity: 0.95 }}>
            5 stream-wise guides covering 175+ careers in NEET-Plus, Engineering, Commerce, Arts &amp; Future-Ready Tech
          </p>
          <p style={{ color: '#E0F7FA', fontSize: '0.9em', margin: '0 0 16px', lineHeight: 1.6 }}>
            Starting at ₹99 • Instant download • <strong>Includes ₹500 OFF coupon</strong> for the full Career Assessment
          </p>
          <button
            style={{
              padding: '14px 36px',
              background: '#fff',
              color: '#006D77',
              border: 'none',
              borderRadius: 28,
              fontSize: '1.1em',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
              fontFamily: 'inherit',
            }}
            onClick={(e) => { e.stopPropagation(); navigate('/ebooks'); }}
          >
            📖 Browse E-Books
          </button>
        </div>
      </section>

      {/* ══════════ SERVICE CARDS ══════════ */}
      <section style={s.cardsSection} className="reveal">
        <h2 style={s.sectionTitle} className="section-title">Our Support & Services</h2>
        <p style={s.sectionSubtitle}>Comprehensive support and guidance to shape your child's future</p>
        <div style={s.cardsGrid}>
          {SERVICE_CARDS.map((card) => (
            <div
              key={card.id}
              style={s.card}
              className="svc-card"
              onClick={() => handleCardClick(card)}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-8px)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 16px 48px rgba(14,107,115,0.18)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(14,107,115,0.07)';
              }}
            >
              <div style={s.cardImageWrap}>
                <img
                  src={card.image}
                  alt={card.title}
                  style={s.cardImage}
                  className="svc-card-img"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <div className="svc-card-tint" />
                {card.isAssessment && (
                  <div style={s.cardBadge}>Take Assessment</div>
                )}
              </div>
              <div style={s.cardBody}>
                <h3 style={s.cardTitle}>{card.title}</h3>
                <p style={s.cardSubtitle}>{card.subtitle}</p>
                <p style={s.cardDesc}>
                  {card.description.substring(0, 160)}...
                </p>
                {(card as any).partners && (
                  <div style={s.partnerRow}>
                    <span style={s.partnerLabel}>Direct tie-ups:</span>
                    {(card as any).partners.map((p: any, i: number) => (
                      <span key={i} style={s.partnerPill} className="partner-pill" title={p.highlight}>
                        🤝 {p.name.split(' ')[0]} <span style={s.partnerCountry}>· {p.country.split(' ')[0]}</span>
                      </span>
                    ))}
                  </div>
                )}
                <div style={s.cardAction}>
                  {card.isAssessment ? (
                    <span style={s.cardBtn}>Login & Start →</span>
                  ) : (
                    <span style={s.cardBtnSecondary}>Learn More →</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════ QUICK STATS BAR ══════════ */}
      <section style={s.statsBar} className="stats-bar reveal">
        <div style={s.statItem}>
          <span style={s.statNum} className="stat-num">1000+</span>
          <span style={s.statLabel}>Happy Clients</span>
        </div>
        <div style={s.statItem}>
          <span style={s.statNum} className="stat-num">100+</span>
          <span style={s.statLabel}>Universities Across the Globe</span>
        </div>
        <div style={s.statItem}>
          <span style={s.statNum} className="stat-num">10+</span>
          <span style={s.statLabel}>Years of Experience</span>
        </div>
        <div style={s.statItem}>
          <span style={s.statNum} className="stat-num">✦</span>
          <span style={s.statLabel}>Personalised Support</span>
        </div>
      </section>

      {/* ══════════ TRUSTED-BY STRIP ══════════ */}
      <section style={s.trustStrip} className="reveal">
        <p style={s.trustLabel}>TRUSTED BY FAMILIES • PARTNERED WITH SCHOOLS</p>
        <div style={s.trustRow}>
          {TRUST_LOGOS.map((l, i) => (
            <div key={i} style={s.trustItem}>
              <span style={s.trustIcon}>{l.icon}</span>
              <span style={s.trustText}>{l.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════ CAREER COUNSELLOR CERTIFICATION PROMO ══════════ */}
      <section style={s.cccBanner} className="reveal">
        <div style={s.cccInner} className="ccc-inner">
          <div style={s.cccContent}>
            <div style={s.cccEyebrow}>🎓 NEW · PROFESSIONAL CERTIFICATION</div>
            <h2 style={s.cccTitle}>Become a Certified Career Counsellor</h2>
            <p style={s.cccDesc}>
              Live online program backed by the science of <strong>SCOPE</strong>. 6 modules, 2 classes a week,
              certified in just <strong>3 months</strong>. Only <strong>15 seats</strong> per batch.
            </p>
            <div style={s.cccPriceRow}>
              <span style={s.cccNewPrice}>₹11,999</span>
              <span style={s.cccOldPrice}>₹14,999</span>
              <span style={s.cccSaveBadge}>Save ₹3,000</span>
            </div>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' as const, marginTop: 24 }}>
              <a
                href="/career-counsellor-certification/"
                style={s.cccBtnPrimary}
                onMouseEnter={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#e8720c'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#e8720c'; e.currentTarget.style.color = '#fff'; }}
              >
                View Program Details →
              </a>
              <a
                href="https://wa.me/918590396662?text=Hi%20Srichakra%2C%20I'd%20like%20to%20know%20more%20about%20the%20Career%20Counsellor%20Certification%20program."
                target="_blank"
                rel="noopener noreferrer"
                style={s.cccBtnSecondary}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.16)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                💬 Ask a Question
              </a>
            </div>
          </div>
          <div style={s.cccHighlights}>
            <div style={s.cccHl}><span style={s.cccHlIcon}>📚</span><div><strong>6 Modules</strong><div style={s.cccHlSub}>Psychometrics · Counselling · Career Architecture · Practice</div></div></div>
            <div style={s.cccHl}><span style={s.cccHlIcon}>⏱️</span><div><strong>3 Months · 2 Classes/Week</strong><div style={s.cccHlSub}>Live online · Recorded sessions</div></div></div>
            <div style={s.cccHl}><span style={s.cccHlIcon}>🎯</span><div><strong>SCOPE-Backed Methodology</strong><div style={s.cccHlSub}>India's most comprehensive assessment framework</div></div></div>
            <div style={s.cccHl}><span style={s.cccHlIcon}>💼</span><div><strong>Earn ₹1,500–₹3,000/session</strong><div style={s.cccHlSub}>Payback within your first week of practice</div></div></div>
          </div>
        </div>
      </section>

      {/* ══════════ TESTIMONIALS ══════════ */}
      <section style={s.testimonials} className="reveal">
        <h2 style={s.sectionTitle} className="section-title">What Families & Schools Say</h2>
        <p style={s.sectionSubtitle}>Trusted by parents and educators across South India</p>
        <div style={s.testimonialGrid}>
          {TESTIMONIALS.map((t, i) => (
            <div key={i} style={s.testimonialCard} className="testimonial-card">
              <div style={s.testimonialQuoteMark}>“</div>
              <p style={s.testimonialQuote}>{t.quote}</p>
              <div style={s.testimonialAuthorRow}>
                <div style={s.testimonialAvatar}>{t.initials}</div>
                <div>
                  <div style={s.testimonialName}>{t.name}</div>
                  <div style={s.testimonialRole}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════ WHO WE ARE ══════════ */}
      <section style={s.highlightSection} className="reveal">
        <div style={s.highlightContent}>
          <div style={s.highlightText}>
            <h2 style={{ color: '#1A8A94', margin: '0 0 6px', fontSize: '1.9em' }}>
              Who We Are
            </h2>
            <p style={{ color: '#888', fontStyle: 'italic', margin: '0 0 14px', fontSize: '1.15em' }}>
              Srichakra — The School To Identify Your Child's Divine Gift!!
            </p>
            <p style={{ color: '#555', lineHeight: 1.8, margin: '0 0 20px' }}>
              Srichakra is an educational support organization dedicated to complementing diverse
              curricula and learner needs through personalized and holistic learning solutions.
              We believe every child has a unique potential waiting to be discovered — and our mission
              is to help them enhance their abilities, overcome learning challenges, and achieve their
              fullest potential through inclusive and strength-based approaches.
            </p>

            <h3 style={{ color: '#1A8A94', margin: '0 0 12px', fontSize: '1.3em' }}>What We Do</h3>
            <ul style={{ color: '#555', lineHeight: 2.2, margin: 0, paddingLeft: 20, fontSize: '1.05em' }}>
              <li><strong>Multiple Intelligence–Based Enrichment:</strong> Discover unique learning styles, build confidence & life skills</li>
              <li><strong>Career Counselling & Guidance:</strong> MI, MBTI, Holland RIASEC & Aptitude-based expert counselling</li>
              <li><strong>Overseas Education & Admissions:</strong> End-to-end support for Australia, Canada, UK, USA, Germany & more, plus MBBS Abroad in Georgia, Kazakhstan, Kyrgyzstan and Russia</li>
              <li><strong>School Partnership Programs:</strong> On-campus & virtual career guidance for students</li>
            </ul>
            <p style={{ color: '#1A8A94', fontWeight: 700, margin: '18px 0 0', fontSize: '1.05em', letterSpacing: 1 }}>
              Discover &bull; Decide &bull; Develop!!
            </p>
          </div>
          <div style={s.highlightImageWrap}>
            <img
              src="/images/overseas-admission.jpg"
              alt="100+ Universities Across the Globe"
              style={s.highlightImage}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        </div>
      </section>

      {/* ══════════ VISION & MISSION ══════════ */}
      <section style={{ padding: '80px 24px', background: '#fff' }} className="reveal">
        <h2 style={{ textAlign: 'center' as const, color: '#1A8A94', fontSize: '2.1em', fontWeight: 800, margin: '0 0 8px' }}>Our Vision & Mission</h2>
        <p style={{ textAlign: 'center' as const, color: '#777', margin: '0 0 40px', fontSize: '1.15em' }}>The guiding principles behind everything we do</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32, maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ background: 'linear-gradient(135deg, #EDF6F9 0%, #f0f9f9 100%)', borderRadius: 16, padding: '36px 30px', border: '1px solid #d0e8e8' }}>
            <div style={{ fontSize: '2.2em', marginBottom: 12 }}>🔭</div>
            <h3 style={{ color: '#1A8A94', margin: '0 0 12px', fontSize: '1.4em', fontWeight: 700 }}>Our Vision</h3>
            <p style={{ color: '#555', lineHeight: 1.8, margin: 0, fontSize: '1.1em' }}>
              To create an inclusive and inspired learning ecosystem where every child's individuality is recognized, nurtured, and celebrated.
            </p>
          </div>
          <div style={{ background: 'linear-gradient(135deg, #EDF6F9 0%, #f0f9f9 100%)', borderRadius: 16, padding: '36px 30px', border: '1px solid #d0e8e8' }}>
            <div style={{ fontSize: '2.2em', marginBottom: 12 }}>🎯</div>
            <h3 style={{ color: '#1A8A94', margin: '0 0 12px', fontSize: '1.4em', fontWeight: 700 }}>Our Mission</h3>
            <p style={{ color: '#555', lineHeight: 1.8, margin: 0, fontSize: '1.1em' }}>
              To empower every child to access education in the way they learn best, nurturing their confidence and potential through personalized learning approaches — and to help them find career paths that align with their unique strengths and aspirations.
            </p>
          </div>
        </div>
        <blockquote style={{ borderLeft: '4px solid #E29578', paddingLeft: 20, margin: '36px auto 0', maxWidth: 700, color: '#1A8A94', fontStyle: 'italic', fontSize: '1.05em', lineHeight: 1.7, textAlign: 'center' as const }}>
          "Education is every child's right — and it is our responsibility to ensure that every child learns in the way they are most receptive to."
        </blockquote>
      </section>

      {/* ══════════ FOUNDER ══════════ */}
      <section style={{ padding: '80px 24px', background: 'linear-gradient(135deg, #EDF6F9 0%, #f0f9f9 100%)' }} className="reveal">
        <h2 style={{ textAlign: 'center' as const, color: '#1A8A94', fontSize: '2.1em', fontWeight: 800, margin: '0 0 8px' }}>Our Founder</h2>
        <p style={{ textAlign: 'center' as const, color: '#777', margin: '0 0 40px', fontSize: '1.15em' }}>The driving force behind Srichakra Academy</p>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', gap: 36, alignItems: 'flex-start', flexWrap: 'wrap' as const }}>
          <div style={{ flex: '0 0 180px', textAlign: 'center' as const }}>
            <img src="/images/founder.jpg" alt="Eswari — Founder & Director" style={{ width: 160, height: 160, borderRadius: '50%', objectFit: 'cover', margin: '0 auto 16px', border: '4px solid #E29578', display: 'block' }} />
            <h3 style={{ color: '#1A8A94', margin: '0 0 4px', fontSize: '1.15em' }}>Eswari</h3>
            <p style={{ color: '#E29578', margin: 0, fontSize: '0.85em', fontWeight: 600 }}>Founder & Director</p>
            <p style={{ color: '#888', margin: '4px 0 0', fontSize: '0.8em', lineHeight: 1.4 }}>
              Certified Career Counsellor<br />International Education Advisor<br />Special Educator
            </p>
          </div>
          <div style={{ flex: 1, minWidth: 280 }}>
            <p style={{ color: '#555', lineHeight: 1.9, margin: '0 0 16px', fontSize: '0.95em' }}>
              With 29 years of cross-sector experience since 1996, Eswari brings together corporate leadership, educational psychology, and international academic guidance into a unified mission — to help every learner realize their strengths and shape a meaningful future.
            </p>
            <p style={{ color: '#555', lineHeight: 1.9, margin: '0 0 16px', fontSize: '0.95em' }}>
              She founded Srichakra with the sole intention of enriching every child's potential through inclusive and personalized educational practices. Her deep involvement in supporting students with Specific Learning Differences (SLD) — a hidden challenge often unidentified at an early stage — led to gaps in learning being addressed through strength-based approaches.
            </p>
            <p style={{ color: '#555', lineHeight: 1.9, margin: '0 0 16px', fontSize: '0.95em' }}>
              Over the years, this initiative has evolved into a comprehensive educational support system that spans every stage of a student's journey — from early learning and academic development to career identification and professional goal achievement. Her unique approach blends traditional wisdom with modern pedagogical tools, ensuring that each learner discovers their individuality, confidence, and capability.
            </p>
            <p style={{ color: '#555', lineHeight: 1.9, margin: '0 0 16px', fontSize: '0.95em' }}>
              As a natural extension of this vision, <strong>Sri Overseas</strong> was established — an initiative dedicated to helping students explore and pursue global education opportunities in countries such as Australia, Canada, New Zealand, Germany, France, USA, UK, Ireland, and several Asian countries.
            </p>
            <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', border: '1px solid #d0e8e8', marginTop: 8 }}>
              <p style={{ color: '#1A8A94', margin: 0, fontSize: '0.9em', fontWeight: 600 }}>
                🤝 Proud Career Counselling Partner of <strong>Spring Days International School</strong>, offering on-campus guidance programs that help students explore possibilities and build meaningful futures.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ CONTACT SECTION ══════════ */}
      <section style={s.contactSection} className="reveal">
        <h2 style={{ textAlign: 'center' as const, color: '#1A8A94', fontSize: '2.1em', fontWeight: 800, margin: '0 0 8px' }}>Get In Touch</h2>
        <p style={{ textAlign: 'center' as const, color: '#777', margin: '0 0 36px', fontSize: '1.15em' }}>Have questions? We'd love to hear from you.</p>
        <div style={s.contactGrid}>
          <div style={s.contactCard}>
            <div style={s.contactIcon}>📞</div>
            <h4 style={{ color: '#1A8A94', margin: '0 0 8px' }}>Phone</h4>
            <a href="tel:8590396662" style={s.contactLink}>85903 96662</a>
            <a href="tel:9843030697" style={s.contactLink}>98430 30697</a>
          </div>
          <div style={s.contactCard}>
            <div style={s.contactIcon}>✉️</div>
            <h4 style={{ color: '#1A8A94', margin: '0 0 8px' }}>Email</h4>
            <a href="mailto:admin@srichakraacademy.org" style={s.contactLink}>admin@srichakraacademy.org</a>
          </div>
          <div style={{ ...s.contactCard, cursor: 'pointer' }} onClick={() => { setShowEnquiry(true); setEnquirySent(false); setEnquiryError(false); }}>
            <div style={s.contactIcon}>📝</div>
            <h4 style={{ color: '#1A8A94', margin: '0 0 8px' }}>Enquiry</h4>
            <span style={s.contactLink}>Send us a message</span>
          </div>
          <div style={s.contactCard}>
            <div style={s.contactIcon}>💬</div>
            <h4 style={{ color: '#1A8A94', margin: '0 0 8px' }}>WhatsApp</h4>
            <a href="https://wa.me/918590396662?text=Hi%20Srichakra%20Academy%2C%20I%27d%20like%20to%20know%20more%20about%20your%20services." target="_blank" rel="noopener" style={s.contactLink}>Chat with us</a>
          </div>
        </div>
      </section>

      {/* ══════════ FOOTER ══════════ */}
      <footer style={s.footer}>
        <div style={s.footerInner}>
          <div>
            <h3 style={{ color: '#fff', margin: '0 0 4px' }}>Srichakra Academy</h3>
            <p style={{ color: 'rgba(255,255,255,0.6)', margin: '0 0 8px', fontSize: '0.8em', fontStyle: 'italic' }}>(A Unit of SriKrpa Foundation Trust)</p>
            <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0, fontSize: '0.9em', lineHeight: 1.7 }}>
              Empowering students with data-driven career guidance,<br />
              overseas admissions, and professional counselling.
            </p>
          </div>
          <div>
            <h4 style={{ color: '#83C5BE', margin: '0 0 10px' }}>Quick Links</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={s.footerLink} onClick={() => navigate('/login')}>SCOPE Assessment</span>              <a href="/career-counsellor-certification/" style={{ ...s.footerLink, textDecoration: 'none' }}>Counsellor Certification</a>
              <span style={s.footerLink} onClick={() => navigate('/ebooks')}>Career E-Books</span>              <span style={s.footerLink} onClick={() => navigate('/demo')}>Demo Report</span>
              <span style={s.footerLink} onClick={() => navigate('/login')}>Login / Register</span>
              <span style={s.footerLink} onClick={() => navigate('/admin/login')}>Admin</span>
            </div>
          </div>
          <div>
            <h4 style={{ color: '#83C5BE', margin: '0 0 10px' }}>Contact Us</h4>
            <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0, fontSize: '0.9em', lineHeight: 2 }}>
              📞 <a href="tel:8590396662" style={{ color: '#83C5BE', textDecoration: 'none' }}>85903 96662</a><br />
              📞 <a href="tel:9843030697" style={{ color: '#83C5BE', textDecoration: 'none' }}>98430 30697</a><br />
              ✉️ <a href="mailto:admin@srichakraacademy.org" style={{ color: '#83C5BE', textDecoration: 'none' }}>admin@srichakraacademy.org</a><br />
              🌐 <a href="https://srichakraacademy.org" style={{ color: '#83C5BE', textDecoration: 'none' }}>srichakraacademy.org</a>
            </p>
          </div>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', marginTop: 24, paddingTop: 16, textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0, fontSize: '0.85em' }}>
            © {new Date().getFullYear()} Srichakra Academy. All rights reserved.
          </p>
        </div>
      </footer>

      {/* ══════════ MBBS ABROAD CAMPAIGN POPUP (6-MONTH WINDOW) ══════════ */}
      {showMbbsPopup && (
        <div style={s.modalOverlay} onClick={() => dismissMbbsPopup(1)}>
          <div style={s.mbbsPopupCard} onClick={e => e.stopPropagation()}>
            <button style={s.modalClose} onClick={() => dismissMbbsPopup(1)} aria-label="Close MBBS Abroad popup">✕</button>
            <div style={s.mbbsPopupBadge}>SERVICE SPOTLIGHT</div>
            <h2 style={s.mbbsPopupTitle}>MBBS Abroad Admissions 2026-27</h2>
            <p style={s.mbbsPopupText}>
              End-to-end counselling for NMC-aligned MBBS pathways with focused support for admission,
              documentation, visa, and pre-departure.
            </p>
            <div style={s.mbbsCountryRow}>
              <span style={s.mbbsCountryPill}>Georgia</span>
              <span style={s.mbbsCountryPill}>Kazakhstan</span>
              <span style={s.mbbsCountryPill}>Kyrgyzstan</span>
              <span style={s.mbbsCountryPill}>Russia</span>
            </div>
            <div style={s.mbbsPopupActions}>
              <button
                style={s.mbbsPrimaryBtn}
                onClick={() => {
                  setShowMbbsPopup(false);
                  setActiveModal('overseas');
                  dismissMbbsPopup(3);
                }}
              >
                Enquire Now
              </button>
              <button style={s.mbbsSecondaryBtn} onClick={() => dismissMbbsPopup(1)}>
                Remind Me Tomorrow
              </button>
              <button style={s.mbbsGhostBtn} onClick={() => dismissMbbsPopup(7)}>
                Hide For 7 Days
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ INFO MODAL ══════════ */}
      {activeModal && modalCard && (
        <div style={s.modalOverlay} onClick={() => setActiveModal(null)}>
          <div style={s.modalContent} className="modal-content" onClick={e => e.stopPropagation()}>
            <button style={s.modalClose} onClick={() => setActiveModal(null)}>✕</button>
            <img
              src={modalCard.image}
              alt={modalCard.title}
              style={s.modalImage}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <h2 style={{ color: '#1A8A94', margin: '0 0 4px', fontSize: '1.4em' }}>{modalCard.title}</h2>
            <p style={{ color: '#E29578', margin: '0 0 16px', fontSize: '0.95em', fontWeight: 600 }}>{modalCard.subtitle}</p>
            <p style={{ color: '#555', lineHeight: 1.8, margin: '0 0 20px', fontSize: '0.95em' }}>{modalCard.description}</p>
            {(modalCard as any).partners && (
              <div style={s.modalPartners}>
                <h4 style={{ color: '#e8720c', margin: '0 0 12px', fontSize: '1em', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>🤝</span> Direct University Tie-ups
                </h4>
                {(modalCard as any).partners.map((p: any, i: number) => (
                  <div key={i} style={s.modalPartnerCard}>
                    <div style={s.modalPartnerName}>{p.name} <span style={s.modalPartnerCountry}>· {p.country}</span></div>
                    <div style={s.modalPartnerHighlight}>{p.highlight}</div>
                  </div>
                ))}
              </div>
            )}
            <h4 style={{ color: '#1A8A94', margin: '0 0 10px' }}>Key Features</h4>
            <ul style={{ color: '#555', lineHeight: 2, margin: '0 0 24px', paddingLeft: 20 }}>
              {modalCard.features.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
            <button
              style={s.modalCta}
              onClick={() => {
                if (modalCard.isAssessment) {
                  setActiveModal(null);
                  navigate('/login');
                } else {
                  setActiveModal(null);
                  setShowEnquiry(true);
                  setEnquirySent(false);
                }
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#148088'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#1A8A94'; }}
            >
              {modalCard.isAssessment ? 'Login & Start Assessment' : 'Enquire Now'}
            </button>
          </div>
        </div>
      )}

      {/* ══════════ ENQUIRY MODAL ══════════ */}
      {showEnquiry && (
        <div style={s.modalOverlay} onClick={() => setShowEnquiry(false)}>
          <div style={{ ...s.modalContent, maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <button style={s.modalClose} onClick={() => setShowEnquiry(false)}>✕</button>
            <h2 style={{ color: '#1A8A94', margin: '0 0 4px', fontSize: '1.4em' }}>📝 Enquiry Form</h2>
            <p style={{ color: '#777', margin: '0 0 20px', fontSize: '0.9em' }}>Fill in your details and we'll get back to you soon.</p>
            {enquirySent ? (
              <div style={{ textAlign: 'center' as const, padding: '30px 0' }}>
                <div style={{ fontSize: '3em', marginBottom: 12 }}>✅</div>
                <h3 style={{ color: '#1A8A94', margin: '0 0 8px' }}>Thank You!</h3>
                <p style={{ color: '#555' }}>We've received your enquiry. We'll contact you shortly.</p>
              </div>
            ) : enquiryError ? (
              <div style={{ textAlign: 'center' as const, padding: '30px 0' }}>
                <div style={{ fontSize: '3em', marginBottom: 12 }}>❌</div>
                <h3 style={{ color: '#e53e3e', margin: '0 0 8px' }}>Submission Failed</h3>
                <p style={{ color: '#555' }}>Something went wrong. Please try again or call us directly at <a href="tel:8590396662" style={{ color: '#1A8A94' }}>85903 96662</a>.</p>
                <button
                  onClick={() => { setEnquiryError(false); }}
                  style={{ ...s.modalCta, marginTop: 12, display: 'inline-block' }}
                >
                  Try Again
                </button>
              </div>
            ) : (
              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await addDoc(collection(db, 'enquiries'), {
                    name: enquiryForm.name,
                    phone: enquiryForm.phone,
                    email: enquiryForm.email || '',
                    message: enquiryForm.message,
                    createdAt: serverTimestamp(),
                    status: 'new',
                  });
                  setEnquirySent(true);
                } catch (err) {
                  console.error('Failed to save enquiry:', err);
                  setEnquiryError(true);
                }
              }} style={{ display: 'flex', flexDirection: 'column' as const, gap: 14 }}>
                <input
                  type="text" required placeholder="Your Name"
                  value={enquiryForm.name}
                  onChange={e => setEnquiryForm(p => ({ ...p, name: e.target.value }))}
                  style={s.enquiryInput}
                />
                <input
                  type="tel" required placeholder="Phone Number"
                  value={enquiryForm.phone}
                  onChange={e => setEnquiryForm(p => ({ ...p, phone: e.target.value }))}
                  style={s.enquiryInput}
                />
                <input
                  type="email" placeholder="Email (optional)"
                  value={enquiryForm.email}
                  onChange={e => setEnquiryForm(p => ({ ...p, email: e.target.value }))}
                  style={s.enquiryInput}
                />
                <textarea
                  required placeholder="Your message or enquiry..."
                  value={enquiryForm.message}
                  onChange={e => setEnquiryForm(p => ({ ...p, message: e.target.value }))}
                  rows={4}
                  style={{ ...s.enquiryInput, resize: 'vertical' as const }}
                />
                <button
                  type="submit"
                  style={s.modalCta}
                  onMouseEnter={e => { e.currentTarget.style.background = '#148088'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#1A8A94'; }}
                >
                  Submit Enquiry
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ══════════ STICKY FLOATING CTA ══════════ */}
      <button
        className={`float-cta${showFloatCta ? ' is-visible' : ''}`}
        onClick={() => navigate('/login')}
        aria-label="Take Assessment for ₹1599"
      >
        📝 <span className="float-label">Take Assessment</span> <strong>₹1599</strong>
      </button>
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   STYLES
   ═══════════════════════════════════════════════════ */
const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', fontFamily: "'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", color: '#1f2933', background: '#f6fafb' },

  /* ── Header ── */
  header: { background: 'linear-gradient(135deg, #0E6B73 0%, #1A8A94 60%, #148088 100%)', padding: '18px 0', boxShadow: '0 2px 16px rgba(14,107,115,0.18)' },
  headerInner: { maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' as const },
  brandRow: { display: 'flex', alignItems: 'center', gap: 16 },
  logoFallback: { width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(255,255,255,0.3)' },
  brandTitle: { margin: 0, display: 'flex', alignItems: 'center', gap: 8 },
  pillar: { color: '#F1C97A', fontSize: '1.8em', fontWeight: 700 },
  brandName: { color: '#FFE9D6', fontSize: '2.3em', fontWeight: 700, fontFamily: "'Fraunces', 'Georgia', serif", letterSpacing: 0.5 },
  brandTagline: { margin: '2px 0 0', color: 'rgba(255,255,255,0.92)', fontSize: '1.05em', fontWeight: 500, letterSpacing: 0.2 },
  authBtns: { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' as const },
  loginBtn: { padding: '11px 20px', background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.35)', borderRadius: 10, fontSize: '0.98em', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' },
  registerBtn: { padding: '12px 24px', background: '#E29578', color: '#fff', border: '1px solid #E29578', borderRadius: 10, fontSize: '1em', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 14px rgba(226,149,120,0.4)', fontFamily: 'inherit' },
  adminLink: { padding: '8px 12px', background: 'transparent', color: 'rgba(255,255,255,0.75)', border: 'none', borderBottom: '1px dotted rgba(255,255,255,0.5)', borderRadius: 0, fontSize: '0.85em', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: 0.5 },

  /* ── Nav bar ── */
  nav: { background: '#fff', borderBottom: '1px solid #e6eef0', position: 'sticky' as const, top: 0, zIndex: 100, boxShadow: '0 1px 8px rgba(0,0,0,0.03)' },
  navInner: { maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
  navItem: { position: 'relative' as const, padding: '12px 18px', cursor: 'pointer' },
  navLabel: { fontSize: '0.82em', fontWeight: 600, color: '#1f2933', whiteSpace: 'nowrap' as const, letterSpacing: 0.9, textTransform: 'uppercase' as const },
  chevron: { fontSize: '0.65em', marginLeft: 5, color: '#9aa5ad', opacity: 0.55, transition: 'opacity 0.18s' },
  dropdown: { position: 'absolute' as const, top: '100%', left: 0, minWidth: 300, background: '#fff', borderRadius: '0 0 12px 12px', boxShadow: '0 12px 32px rgba(14,107,115,0.14)', zIndex: 200, overflow: 'hidden', border: '1px solid #eef4f5' },
  dropdownItem: { padding: '14px 22px', fontSize: '0.98em', color: '#1f2933', cursor: 'pointer', transition: 'background 0.15s', borderBottom: '1px solid #f3f7f8' },

  /* ── Hero banner ── */
  hero: { position: 'relative' as const, height: 520, overflow: 'hidden', background: '#0E6B73' },
  heroImage: { width: '100%', height: '100%', objectFit: 'cover' as const, display: 'block', filter: 'saturate(0.95)' },
  heroOverlay: { position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(120deg, rgba(14,107,115,0.85) 0%, rgba(14,107,115,0.55) 55%, rgba(14,107,115,0.30) 100%)', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', padding: 32, animation: 'fadeUp 0.7s ease-out' },
  heroTitle: { color: '#fff', fontSize: '3.6em', fontWeight: 700, textAlign: 'center' as const, margin: '0 0 14px', maxWidth: 900, lineHeight: 1.15, textShadow: '0 4px 24px rgba(0,0,0,0.35)', fontFamily: "'Fraunces', 'Georgia', serif", letterSpacing: -0.5 },
  heroSubtitle: { color: 'rgba(255,255,255,0.96)', fontSize: '1.4em', textAlign: 'center' as const, margin: '0 0 26px', maxWidth: 720, lineHeight: 1.55, textShadow: '0 2px 8px rgba(0,0,0,0.25)' },
  heroCta: { padding: '16px 36px', background: 'transparent', color: '#fff', border: '1.5px solid rgba(255,255,255,0.85)', borderRadius: 12, fontSize: '1.1em', fontWeight: 600, cursor: 'pointer', transition: 'all 0.25s', fontFamily: 'inherit' },
  heroCtaPrimary: { padding: '18px 42px', background: '#E29578', color: '#fff', border: 'none', borderRadius: 12, fontSize: '1.15em', fontWeight: 700, cursor: 'pointer', transition: 'background 0.25s', boxShadow: '0 6px 24px rgba(226,149,120,0.45)', letterSpacing: 0.3, animation: 'pulse 2.6s ease-in-out infinite', fontFamily: 'inherit' },

  /* ── Promo banner ── */
  promoBanner: { background: 'linear-gradient(135deg, #006D77 0%, #1A8A94 50%, #148088 100%)', padding: '72px 24px', position: 'relative' as const, overflow: 'hidden' },
  promoInner: { maxWidth: 1100, margin: '0 auto', display: 'flex', gap: 48, alignItems: 'center', flexWrap: 'wrap' as const },
  promoContent: { flex: 1, minWidth: 300 },
  promoBadge: { display: 'inline-block', background: '#E29578', color: '#fff', padding: '7px 18px', borderRadius: 24, fontSize: '0.85em', fontWeight: 700, marginBottom: 18, letterSpacing: 1.2 },
  promoTitle: { color: '#fff', fontSize: '2.4em', fontWeight: 700, margin: '0 0 12px', lineHeight: 1.15, fontFamily: "'Fraunces', 'Georgia', serif" },
  promoDesc: { color: 'rgba(255,255,255,0.92)', fontSize: '1.05em', lineHeight: 1.75, margin: '0 0 22px' },
  promoPriceRow: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, flexWrap: 'wrap' as const },
  promoOldPrice: { color: 'rgba(255,255,255,0.5)', fontSize: '1.5em', fontWeight: 500, textDecoration: 'line-through' },
  promoNewPrice: { color: '#fff', fontSize: '2.6em', fontWeight: 800, fontFamily: "'Fraunces', 'Georgia', serif" },
  promoSaveBadge: { background: '#ffd166', color: '#333', padding: '6px 16px', borderRadius: 20, fontSize: '1em', fontWeight: 700 },
  promoBtn: { padding: '16px 40px', background: '#E29578', color: '#fff', border: 'none', borderRadius: 12, fontSize: '1.15em', fontWeight: 700, cursor: 'pointer', transition: 'all 0.25s', boxShadow: '0 6px 20px rgba(226,149,120,0.4)', fontFamily: 'inherit' },
  promoFeatures: { flex: '0 0 340px', display: 'flex', flexDirection: 'column' as const, gap: 12 },
  promoFeature: { background: 'rgba(255,255,255,0.10)', color: '#fff', padding: '13px 18px', borderRadius: 12, fontSize: '1em', fontWeight: 500, backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.12)' },

  /* ── Career Counsellor Certification banner (saffron + deep teal, matches CCC page palette) ── */
  cccBanner: { background: 'radial-gradient(ellipse at 85% 15%, rgba(245,166,35,0.22) 0%, transparent 55%), radial-gradient(ellipse at 10% 90%, rgba(0,109,119,0.25) 0%, transparent 55%), linear-gradient(135deg, #1a1a2e 0%, #0d2137 60%, #004D55 100%)', padding: '72px 24px', position: 'relative' as const, overflow: 'hidden' },
  cccInner: { maxWidth: 1100, margin: '0 auto', display: 'flex', gap: 48, alignItems: 'center', flexWrap: 'wrap' as const },
  cccContent: { flex: 1, minWidth: 300 },
  cccEyebrow: { display: 'inline-block', background: 'rgba(245,166,35,0.16)', border: '1px solid rgba(245,166,35,0.40)', color: '#f5a623', padding: '7px 16px', borderRadius: 999, fontSize: '0.78em', fontWeight: 700, letterSpacing: 1.5, marginBottom: 18 },
  cccTitle: { color: '#fff', fontSize: '2.5em', fontWeight: 700, margin: '0 0 14px', lineHeight: 1.15, fontFamily: "'Fraunces', 'Georgia', serif" },
  cccDesc: { color: 'rgba(255,255,255,0.88)', fontSize: '1.05em', lineHeight: 1.75, margin: '0 0 22px' },
  cccPriceRow: { display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' as const },
  cccNewPrice: { color: '#fff', fontSize: '2.4em', fontWeight: 800, fontFamily: "'Fraunces', 'Georgia', serif" },
  cccOldPrice: { color: 'rgba(255,255,255,0.5)', fontSize: '1.3em', fontWeight: 500, textDecoration: 'line-through' },
  cccSaveBadge: { background: '#f5a623', color: '#1a1a2e', padding: '5px 14px', borderRadius: 999, fontSize: '0.85em', fontWeight: 700, letterSpacing: 0.5 },
  cccBtnPrimary: { padding: '15px 32px', background: '#e8720c', color: '#fff', border: 'none', borderRadius: 12, fontSize: '1.05em', fontWeight: 700, cursor: 'pointer', transition: 'all 0.25s', boxShadow: '0 6px 20px rgba(232,114,12,0.45)', textDecoration: 'none', display: 'inline-block', fontFamily: 'inherit' },
  cccBtnSecondary: { padding: '15px 28px', background: 'transparent', color: '#fff', border: '1.5px solid rgba(255,255,255,0.6)', borderRadius: 12, fontSize: '1em', fontWeight: 600, cursor: 'pointer', transition: 'all 0.25s', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' },
  cccHighlights: { flex: '0 0 360px', display: 'flex', flexDirection: 'column' as const, gap: 14 },
  cccHl: { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 14, padding: '14px 18px', color: '#fff', display: 'flex', gap: 14, alignItems: 'flex-start', backdropFilter: 'blur(4px)' },
  cccHlIcon: { fontSize: '1.6em', lineHeight: 1, flexShrink: 0 },
  cccHlSub: { color: 'rgba(255,255,255,0.65)', fontSize: '0.85em', marginTop: 2, fontWeight: 400, lineHeight: 1.5 },

  /* ── Service cards ── */
  cardsSection: { padding: '80px 24px', background: '#f6fafb' },
  sectionTitle: { textAlign: 'center' as const, color: '#0E6B73', fontSize: '2.4em', fontWeight: 700, margin: '0 0 10px', fontFamily: "'Fraunces', 'Georgia', serif", letterSpacing: -0.3 },
  sectionSubtitle: { textAlign: 'center' as const, color: '#6b7a82', fontSize: '1.1em', margin: '0 0 48px' },
  cardsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: 28, maxWidth: 1200, margin: '0 auto' },
  card: { background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(14,107,115,0.07)', cursor: 'pointer', transition: 'transform 0.3s, box-shadow 0.3s', border: '1px solid #eef4f5' },
  cardImageWrap: { position: 'relative' as const, height: 200, overflow: 'hidden', background: '#f5f5f5' },
  cardImage: { width: '100%', height: '100%', objectFit: 'cover' as const, display: 'block' },
  cardBadge: { position: 'absolute' as const, top: 12, right: 12, background: '#E29578', color: '#fff', padding: '6px 14px', borderRadius: 20, fontSize: '0.82em', fontWeight: 700, letterSpacing: 0.3 },
  cardBody: { padding: '24px 24px 26px' },
  cardTitle: { color: '#0E6B73', fontSize: '1.4em', fontWeight: 700, margin: '0 0 4px', fontFamily: "'Fraunces', 'Georgia', serif" },
  cardSubtitle: { color: '#E29578', fontSize: '0.95em', fontWeight: 600, margin: '0 0 12px' },
  cardDesc: { color: '#5a6b73', fontSize: '0.98em', lineHeight: 1.7, margin: '0 0 16px' },
  cardAction: { paddingTop: 4 },
  cardBtn: { color: '#0E6B73', fontWeight: 700, fontSize: '0.98em' },
  cardBtnSecondary: { color: '#E29578', fontWeight: 700, fontSize: '0.98em' },

  /* ── Direct tie-up pills on overseas card ── */
  partnerRow: { display: 'flex', alignItems: 'center', flexWrap: 'wrap' as const, gap: 6, margin: '6px 0 14px' },
  partnerLabel: { fontSize: '0.74em', fontWeight: 700, color: '#e8720c', letterSpacing: 0.6, textTransform: 'uppercase' as const, marginRight: 2 },
  partnerPill: { display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.8em', fontWeight: 600, color: '#1f2933', background: 'linear-gradient(135deg, #fff4e6 0%, #fde8d2 100%)', border: '1px solid #f5a623', borderRadius: 999, padding: '4px 10px', whiteSpace: 'nowrap' as const },
  partnerCountry: { color: '#6b7a82', fontWeight: 500 },

  /* ── Modal: partner tie-up section ── */
  modalPartners: { background: 'linear-gradient(135deg, #fff8ed 0%, #fff1dc 100%)', border: '1px solid #f5a62366', borderRadius: 12, padding: '14px 18px 4px', margin: '0 0 22px' },
  modalPartnerCard: { padding: '10px 0', borderTop: '1px dashed #f5a62355' },
  modalPartnerName: { fontWeight: 700, color: '#1f2933', fontSize: '0.98em' },
  modalPartnerCountry: { color: '#6b7a82', fontWeight: 500, fontSize: '0.88em' },
  modalPartnerHighlight: { color: '#555', fontSize: '0.88em', marginTop: 2 },

  /* ── Stats bar ── */
  statsBar: { display: 'flex', justifyContent: 'center', gap: 48, padding: '52px 24px', background: 'linear-gradient(135deg, #0E6B73 0%, #1A8A94 100%)', flexWrap: 'wrap' as const },
  statItem: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center' },
  statNum: { fontSize: '2.6em', fontWeight: 800, color: '#fff', fontFamily: "'Fraunces', 'Georgia', serif" },
  statLabel: { fontSize: '1.05em', color: 'rgba(255,255,255,0.85)', marginTop: 4 },

  /* ── Trust strip ── */
  trustStrip: { padding: '40px 24px 48px', background: '#fff', borderBottom: '1px solid #eef4f5' },
  trustLabel: { textAlign: 'center' as const, color: '#8b9aa3', fontSize: '0.78em', fontWeight: 700, letterSpacing: 2, margin: '0 0 22px' },
  trustRow: { maxWidth: 1100, margin: '0 auto', display: 'flex', flexWrap: 'wrap' as const, justifyContent: 'center', gap: '20px 44px' },
  trustItem: { display: 'inline-flex', alignItems: 'center', gap: 10, color: '#4a5b63', fontSize: '0.98em', fontWeight: 500 },
  trustIcon: { fontSize: '1.4em' },
  trustText: { whiteSpace: 'nowrap' as const },

  /* ── Testimonials ── */
  testimonials: { padding: '76px 24px 84px', background: 'linear-gradient(180deg, #fff 0%, #f7fbfb 100%)' },
  testimonialGrid: { maxWidth: 1200, margin: '36px auto 0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 },
  testimonialCard: { position: 'relative' as const, background: '#fff', border: '1px solid #e6eff0', borderRadius: 14, padding: '28px 26px 24px', boxShadow: '0 6px 18px rgba(14,107,115,0.06)', display: 'flex', flexDirection: 'column' as const },
  testimonialQuoteMark: { position: 'absolute' as const, top: -8, left: 18, fontSize: '4.5em', lineHeight: 1, color: '#1A8A94', opacity: 0.18, fontFamily: 'Fraunces, Georgia, serif', pointerEvents: 'none' as const },
  testimonialQuote: { position: 'relative' as const, margin: '12px 0 22px', color: '#2c3e50', fontSize: '1.02em', lineHeight: 1.65, fontStyle: 'italic' as const, flex: 1 },
  testimonialAuthorRow: { display: 'flex', alignItems: 'center', gap: 12, paddingTop: 16, borderTop: '1px solid #eef4f5' },
  testimonialAvatar: { width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #1A8A94 0%, #0E6B73 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.95em', letterSpacing: 0.5, flexShrink: 0 },
  testimonialName: { fontWeight: 700, color: '#1f2933', fontSize: '0.98em' },
  testimonialRole: { color: '#6b7a82', fontSize: '0.85em', marginTop: 2 },

  /* ── Highlight section ── */
  highlightSection: { padding: '80px 24px', background: 'linear-gradient(135deg, #EDF6F9 0%, #f0f9f9 100%)' },
  highlightContent: { maxWidth: 1100, margin: '0 auto', display: 'flex', gap: 48, alignItems: 'center', flexWrap: 'wrap' as const },
  highlightText: { flex: 1, minWidth: 300 },
  highlightImageWrap: { flex: 1, minWidth: 300, borderRadius: 16, overflow: 'hidden', boxShadow: '0 12px 36px rgba(14,107,115,0.14)' },
  highlightImage: { width: '100%', height: 'auto', display: 'block' },

  /* ── Footer ── */
  footer: { background: '#0f1828', padding: '48px 24px 20px' },
  footerInner: { maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 30 },
  footerLink: { color: 'rgba(255,255,255,0.7)', fontSize: '0.9em', cursor: 'pointer' },

  /* ── Contact section ── */
  contactSection: { padding: '80px 24px', background: '#f6fafb' },
  contactGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24, maxWidth: 1000, margin: '0 auto' },
  contactCard: { background: '#fff', borderRadius: 16, padding: '28px 24px', textAlign: 'center' as const, border: '1px solid #e6eef0', boxShadow: '0 4px 16px rgba(14,107,115,0.05)' },
  contactIcon: { fontSize: '2em', marginBottom: 12 },
  contactLink: { display: 'block', color: '#0E6B73', fontSize: '1em', textDecoration: 'none', lineHeight: 1.8, fontWeight: 500 },

  /* ── Modal ── */
  modalOverlay: { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,24,40,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24, backdropFilter: 'blur(4px)' },
  modalContent: { background: '#fff', borderRadius: 20, maxWidth: 560, width: '100%', padding: 32, position: 'relative' as const, maxHeight: '90vh', overflowY: 'auto' as const, boxShadow: '0 24px 64px rgba(15,24,40,0.28)' },
  modalClose: { position: 'absolute' as const, top: 16, right: 16, background: 'none', border: 'none', fontSize: '1.5em', color: '#9aa5ad', cursor: 'pointer', padding: 4 },
  modalImage: { width: '100%', height: 200, objectFit: 'cover' as const, borderRadius: 12, marginBottom: 20 },
  modalCta: { width: '100%', padding: '15px 0', background: '#0E6B73', color: '#fff', border: 'none', borderRadius: 10, fontSize: '1.1em', fontWeight: 700, cursor: 'pointer', transition: 'background 0.2s', fontFamily: 'inherit' },

  /* ── MBBS campaign popup ── */
  mbbsPopupCard: { background: '#fff', borderRadius: 20, maxWidth: 620, width: '100%', padding: '34px 30px 28px', position: 'relative' as const, boxShadow: '0 24px 64px rgba(15,24,40,0.28)', border: '1px solid #eaf2f4' },
  mbbsPopupBadge: { display: 'inline-block', background: '#fff3cd', color: '#8a5a00', border: '1px solid #f5d487', borderRadius: 999, padding: '6px 14px', fontSize: '0.78em', fontWeight: 700, letterSpacing: 1.1, marginBottom: 12 },
  mbbsPopupTitle: { color: '#0E6B73', margin: '0 0 10px', fontSize: '1.8em', lineHeight: 1.2, fontFamily: "'Fraunces', 'Georgia', serif" },
  mbbsPopupText: { color: '#4a5b63', margin: '0 0 16px', lineHeight: 1.7, fontSize: '1em' },
  mbbsCountryRow: { display: 'flex', flexWrap: 'wrap' as const, gap: 8, marginBottom: 20 },
  mbbsCountryPill: { background: 'linear-gradient(135deg, #edf7f8 0%, #e7f1f4 100%)', color: '#0E6B73', border: '1px solid #cfe4e8', borderRadius: 999, padding: '7px 12px', fontSize: '0.9em', fontWeight: 700 },
  mbbsPopupActions: { display: 'flex', flexWrap: 'wrap' as const, gap: 10 },
  mbbsPrimaryBtn: { padding: '12px 20px', background: '#0E6B73', color: '#fff', border: 'none', borderRadius: 10, fontSize: '0.95em', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  mbbsSecondaryBtn: { padding: '12px 16px', background: '#E29578', color: '#fff', border: 'none', borderRadius: 10, fontSize: '0.95em', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  mbbsGhostBtn: { padding: '12px 16px', background: 'transparent', color: '#5a6b73', border: '1px solid #cfdde1', borderRadius: 10, fontSize: '0.95em', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },

  /* ── Enquiry form ── */
  enquiryInput: { width: '100%', padding: '13px 16px', border: '1.5px solid #d6e7ea', borderRadius: 10, fontSize: '1em', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' as const, color: '#1f2933' },
};

export default Landing;
