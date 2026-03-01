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

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

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
      { label: 'One-on-One Counselling', desc: 'Personalized expert guidance for stream & career choices' },
      { label: 'Demo Report', desc: 'Preview a sample career guidance report' },
    ],
  },
  {
    label: 'Overseas Admission',
    children: [
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
    image: '/images/dmit.png',
    description: 'DMIT is a scientific study of fingerprint patterns that helps identify a person\'s innate intelligence, strengths, and potential. It reveals your child\'s natural talents through biometric analysis, helping parents and educators guide them towards the right learning path and career choices.',
    features: ['Innate talent discovery', 'Learning style identification', 'Brain dominance analysis', 'Personality profiling'],
    isAssessment: false,
  },
  {
    id: 'career',
    title: 'SCOPE',
    subtitle: 'Student Career & Opportunity Pathway Evaluation',
    image: '/images/career-assessment-1.jpg',
    description: 'Assessing Personality, Aptitude, Interests & Multiple Intelligences to Guide Stream Selection and Career Direction.',
    features: ['76 scientifically designed questions', '10-page personalized report', 'Stream & course recommendations', 'Career cluster mapping'],
    isAssessment: true,
  },
  {
    id: 'overseas',
    title: 'Overseas Admission',
    subtitle: 'Study Abroad Guidance',
    image: '/images/graduate.jpg',
    description: 'Expert global admissions guidance covering university selection, applications, visa documentation, scholarships, education loans, language test preparation, and pre-departure support for top destinations including Australia, UK, USA, Canada, Germany, and more.',
    features: ['University Selection & Shortlisting', 'Application & SOP Assistance', 'Visa Documentation Support', 'Scholarship Guidance', 'Language Test Preparation', 'Education Loan Assistance', 'Accommodation Support', 'Pre-Departure Briefing'],
    isAssessment: false,
  },
  {
    id: 'bridging',
    title: 'Bridging Courses',
    subtitle: 'Foundation, School Enrichment & Skill Enhancement',
    image: '/images/bridging-course.jpg',
    description: 'Bridge the gap between where you are and where you want to be. Our foundation courses include international pathway programs, while school enrichment programs help fill academic gaps. Combined with skill enhancement workshops and focused exam preparation, we build the competencies students need for their chosen career path.',
    features: ['Foundation courses with international pathway programs', 'School enrichment to fill academic gaps', 'Skill enhancement workshops', 'Competitive exam preparation'],
    isAssessment: false,
  },
];

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [showEnquiry, setShowEnquiry] = useState(false);
  const [enquiryForm, setEnquiryForm] = useState({ name: '', phone: '', email: '', message: '' });
  const [enquirySent, setEnquirySent] = useState(false);
  const [enquiryError, setEnquiryError] = useState(false);

  /* ── Handle nav dropdown actions ── */
  const handleNavAction = (parent: string, child: string) => {
    setOpenDropdown(null);
    if (child === 'SCOPE Assessment') navigate('/login');
    else if (child === 'Demo Report') navigate('/demo');
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

      {/* ══════════ HEADER BAR ══════════ */}
      <header style={s.header}>
        <div style={s.headerInner}>
          {/* Logo + Branding */}
          <div style={s.brandRow}>
            <img
              src="/images/srichakra-logo.png"
              alt="Srichakra Logo"
              style={{ height: 52, width: 'auto', borderRadius: 6 }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <div>
              <h1 style={s.brandTitle}>
                <span style={s.pillar}>||</span>{' '}
                <span style={s.brandName}>srichakra</span>{' '}
                <span style={s.pillar}>||</span>
              </h1>
              <p style={{ color: '#E29578', fontSize: '0.65em', margin: '2px 0 0', fontStyle: 'italic' }}>(A Unit of SriKrpa Foundation Trust)</p>
              <p style={s.brandTagline}>The School To identify Your Child's Divine Gift!!</p>
            </div>
          </div>

          {/* Login / Register */}
          <div style={s.authBtns}>
            <button
              style={s.loginBtn}
              onClick={() => navigate('/login')}
              onMouseEnter={e => { e.currentTarget.style.background = '#148088'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
              title="Individual student login or registration"
            >
              👤 Individual Login
            </button>
            <button
              style={{ ...s.registerBtn, background: '#E29578', color: '#fff', borderColor: '#E29578', padding: '15px 34px', fontSize: '1.15em', borderRadius: 8, boxShadow: '0 3px 12px rgba(226,149,120,0.35)' }}
              onClick={() => navigate('/school-login')}
              onMouseEnter={e => { e.currentTarget.style.background = '#d4856a'; e.currentTarget.style.transform = 'scale(1.03)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#E29578'; e.currentTarget.style.transform = 'scale(1)'; }}
              title="Academic Partner Login"
            >
              🏫 Academic Partner Login
            </button>
            <button
              style={{ ...s.loginBtn, fontSize: '0.92em', padding: '10px 16px', borderColor: '#83C5BE', color: '#83C5BE' }}
              onClick={() => navigate('/admin/login')}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(131,197,190,0.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              title="Admin Portal"
            >
              🛡️ Admin
            </button>
          </div>
        </div>
      </header>

      {/* ══════════ NAVIGATION BAR ══════════ */}
      <nav style={s.nav}>
        <div style={s.navInner}>
          {NAV_ITEMS.map((item, idx) => (
            <div
              key={idx}
              style={s.navItem}
              onMouseEnter={() => setOpenDropdown(idx)}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <span style={s.navLabel}>
                {item.label} <span style={s.chevron}>▾</span>
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
          <h2 style={s.heroTitle}>Your Journey to Success Starts Here !!</h2>
          <p style={{ ...s.heroSubtitle, fontWeight: 'bold', fontSize: '1.45em', marginBottom: 8 }}>
            Shaping Futures from Grade 8 to Global Universities
          </p>
          <p style={{ ...s.heroSubtitle, fontWeight: 500, fontSize: '1em', marginTop: 0, marginBottom: 18 }}>
            Data-driven career guidance and overseas admissions pathways after 10th, 12th, graduation or post-graduation.
          </p>
          <a
            href="https://wa.me/918590396662?text=Hi%20Srichakra%20Academy%2C%20I%27d%20like%20to%20know%20more%20about%20your%20services."
            target="_blank"
            rel="noopener noreferrer"
            style={{ ...s.heroCta, textDecoration: 'none', display: 'inline-block', textAlign: 'center' as const }}
            onMouseEnter={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#1A8A94'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#fff'; }}
          >
            Get Started →
          </a>
        </div>
      </section>

      {/* ══════════ SERVICE CARDS ══════════ */}
      <section style={s.cardsSection}>
        <h2 style={s.sectionTitle}>Our Support & Services</h2>
        <p style={s.sectionSubtitle}>Comprehensive support and guidance to shape your child's future</p>
        <div style={s.cardsGrid}>
          {SERVICE_CARDS.map((card) => (
            <div
              key={card.id}
              style={s.card}
              onClick={() => handleCardClick(card)}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-8px)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 16px 48px rgba(0,109,119,0.2)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
              }}
            >
              <div style={s.cardImageWrap}>
                <img
                  src={card.image}
                  alt={card.title}
                  style={s.cardImage}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
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
      <section style={s.statsBar}>
        <div style={s.statItem}>
          <span style={s.statNum}>1000+</span>
          <span style={s.statLabel}>Happy Clients</span>
        </div>
        <div style={s.statItem}>
          <span style={s.statNum}>100+</span>
          <span style={s.statLabel}>Universities Across the Globe</span>
        </div>
        <div style={s.statItem}>
          <span style={s.statNum}>10+</span>
          <span style={s.statLabel}>Years of Experience</span>
        </div>
        <div style={s.statItem}>
          <span style={s.statNum}>✦</span>
          <span style={s.statLabel}>Personalised Support</span>
        </div>
      </section>

      {/* ══════════ WHO WE ARE ══════════ */}
      <section style={s.highlightSection}>
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
              <li><strong>Overseas Education & Admissions:</strong> End-to-end support for Australia, Canada, UK, USA, Germany & more</li>
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
      <section style={{ padding: '60px 24px', background: '#fff' }}>
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
      <section style={{ padding: '60px 24px', background: 'linear-gradient(135deg, #EDF6F9 0%, #f0f9f9 100%)' }}>
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
      <section style={s.contactSection}>
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
              <span style={s.footerLink} onClick={() => navigate('/login')}>SCOPE Assessment</span>
              <span style={s.footerLink} onClick={() => navigate('/demo')}>Demo Report</span>
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

      {/* ══════════ INFO MODAL ══════════ */}
      {activeModal && modalCard && (
        <div style={s.modalOverlay} onClick={() => setActiveModal(null)}>
          <div style={s.modalContent} onClick={e => e.stopPropagation()}>
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
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   STYLES
   ═══════════════════════════════════════════════════ */
const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", color: '#333', background: '#f8fbfc' },

  /* ── Header ── */
  header: { background: '#1A8A94', padding: '18px 0' },
  headerInner: { maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  brandRow: { display: 'flex', alignItems: 'center', gap: 16 },
  logoFallback: { width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(255,255,255,0.3)' },
  brandTitle: { margin: 0, display: 'flex', alignItems: 'center', gap: 8 },
  pillar: { color: '#d4a843', fontSize: '1.8em', fontWeight: 700 },
  brandName: { color: '#c0392b', fontSize: '2.3em', fontWeight: 800, fontFamily: "'Georgia', 'Times New Roman', serif", letterSpacing: 1 },
  brandTagline: { margin: '2px 0 0', color: 'rgba(255,255,255,0.9)', fontSize: '1.15em', fontWeight: 500 },
  authBtns: { display: 'flex', gap: 14, alignItems: 'center' },
  loginBtn: { padding: '14px 30px', background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.4)', borderRadius: 8, fontSize: '1.1em', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' },
  registerBtn: { padding: '14px 30px', background: '#fff', color: '#1A8A94', border: '1.5px solid #fff', borderRadius: 8, fontSize: '1.1em', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' },

  /* ── Nav bar ── */
  nav: { background: '#fff', borderBottom: '1px solid #e0e0e0', position: 'sticky' as const, top: 0, zIndex: 100 },
  navInner: { maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
  navItem: { position: 'relative' as const, padding: '16px 28px', cursor: 'pointer' },
  navLabel: { fontSize: '1.2em', fontWeight: 600, color: '#333', whiteSpace: 'nowrap' as const },
  chevron: { fontSize: '0.8em', marginLeft: 4, color: '#888' },
  dropdown: { position: 'absolute' as const, top: '100%', left: 0, minWidth: 300, background: '#fff', borderRadius: '0 0 8px 8px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 200, overflow: 'hidden' },
  dropdownItem: { padding: '14px 22px', fontSize: '1em', color: '#333', cursor: 'pointer', transition: 'background 0.15s', borderBottom: '1px solid #f5f5f5' },

  /* ── Hero banner ── */
  hero: { position: 'relative' as const, height: 480, overflow: 'hidden', background: '#1A8A94' },
  heroImage: { width: '100%', height: '100%', objectFit: 'cover' as const, display: 'block' },
  heroOverlay: { position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(135deg, rgba(26,138,148,0.50) 0%, rgba(26,138,148,0.30) 100%)', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', padding: 32 },
  heroTitle: { color: '#fff', fontSize: '3.4em', fontWeight: 800, textAlign: 'center' as const, margin: '0 0 16px', maxWidth: 850, lineHeight: 1.3, textShadow: '2px 2px 8px rgba(0,0,0,0.35)' },
  heroSubtitle: { color: 'rgba(255,255,255,0.95)', fontSize: '1.5em', textAlign: 'center' as const, margin: '0 0 28px', maxWidth: 700, lineHeight: 1.6, textShadow: '1px 1px 4px rgba(0,0,0,0.25)' },
  heroCta: { padding: '18px 48px', background: 'transparent', color: '#fff', border: '2px solid #fff', borderRadius: 10, fontSize: '1.35em', fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s' },

  /* ── Service cards ── */
  cardsSection: { padding: '60px 24px', background: '#f8fbfc' },
  sectionTitle: { textAlign: 'center' as const, color: '#1A8A94', fontSize: '2.4em', fontWeight: 800, margin: '0 0 10px' },
  sectionSubtitle: { textAlign: 'center' as const, color: '#777', fontSize: '1.25em', margin: '0 0 40px' },
  cardsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: 28, maxWidth: 1200, margin: '0 auto' },
  card: { background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', cursor: 'pointer', transition: 'transform 0.3s, box-shadow 0.3s', border: '1px solid #f0f0f0' },
  cardImageWrap: { position: 'relative' as const, height: 200, overflow: 'hidden', background: '#f5f5f5' },
  cardImage: { width: '100%', height: '100%', objectFit: 'cover' as const, display: 'block' },
  cardBadge: { position: 'absolute' as const, top: 12, right: 12, background: '#E29578', color: '#fff', padding: '7px 16px', borderRadius: 20, fontSize: '0.9em', fontWeight: 700 },
  cardBody: { padding: '22px 24px 26px' },
  cardTitle: { color: '#1A8A94', fontSize: '1.5em', fontWeight: 700, margin: '0 0 6px' },
  cardSubtitle: { color: '#E29578', fontSize: '1.05em', fontWeight: 600, margin: '0 0 12px' },
  cardDesc: { color: '#666', fontSize: '1.08em', lineHeight: 1.7, margin: '0 0 16px' },
  cardAction: { paddingTop: 4 },
  cardBtn: { color: '#1A8A94', fontWeight: 700, fontSize: '1.05em' },
  cardBtnSecondary: { color: '#E29578', fontWeight: 700, fontSize: '1.05em' },

  /* ── Stats bar ── */
  statsBar: { display: 'flex', justifyContent: 'center', gap: 48, padding: '44px 24px', background: '#1A8A94', flexWrap: 'wrap' as const },
  statItem: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center' },
  statNum: { fontSize: '2.8em', fontWeight: 800, color: '#fff' },
  statLabel: { fontSize: '1.15em', color: 'rgba(255,255,255,0.85)', marginTop: 4 },

  /* ── Highlight section ── */
  highlightSection: { padding: '60px 24px', background: 'linear-gradient(135deg, #EDF6F9 0%, #f0f9f9 100%)' },
  highlightContent: { maxWidth: 1100, margin: '0 auto', display: 'flex', gap: 40, alignItems: 'center', flexWrap: 'wrap' as const },
  highlightText: { flex: 1, minWidth: 300 },
  highlightImageWrap: { flex: 1, minWidth: 300, borderRadius: 16, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' },
  highlightImage: { width: '100%', height: 'auto', display: 'block' },

  /* ── Footer ── */
  footer: { background: '#1a1a2e', padding: '40px 24px 20px' },
  footerInner: { maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 30 },
  footerLink: { color: 'rgba(255,255,255,0.7)', fontSize: '0.9em', cursor: 'pointer' },

  /* ── Contact section ── */
  contactSection: { padding: '60px 24px', background: '#f8fbfc' },
  contactGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24, maxWidth: 1000, margin: '0 auto' },
  contactCard: { background: '#fff', borderRadius: 16, padding: '28px 24px', textAlign: 'center' as const, border: '1px solid #e0f0f0' },
  contactIcon: { fontSize: '2.2em', marginBottom: 12 },
  contactLink: { display: 'block', color: '#1A8A94', fontSize: '1.05em', textDecoration: 'none', lineHeight: 1.8, fontWeight: 500 },

  /* ── Modal ── */
  modalOverlay: { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 },
  modalContent: { background: '#fff', borderRadius: 20, maxWidth: 560, width: '100%', padding: 32, position: 'relative' as const, maxHeight: '90vh', overflowY: 'auto' as const, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' },
  modalClose: { position: 'absolute' as const, top: 16, right: 16, background: 'none', border: 'none', fontSize: '1.5em', color: '#999', cursor: 'pointer', padding: 4 },
  modalImage: { width: '100%', height: 200, objectFit: 'cover' as const, borderRadius: 12, marginBottom: 20 },
  modalCta: { width: '100%', padding: '15px 0', background: '#1A8A94', color: '#fff', border: 'none', borderRadius: 10, fontSize: '1.15em', fontWeight: 700, cursor: 'pointer', transition: 'background 0.2s' },

  /* ── Enquiry form ── */
  enquiryInput: { width: '100%', padding: '13px 16px', border: '1.5px solid #d0e8e8', borderRadius: 10, fontSize: '1.05em', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' as const },
};

export default Landing;
