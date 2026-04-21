/**
 * VINAYAGAR AGAVAL ENROLLMENT PAGE
 * Theme: "My Friend Ganesha" — Playful, child-friendly design
 * Bilingual: Tamil & English
 * 
 * Features:
 * - Warm saffron/orange/golden color palette
 * - Playful Ganesha-themed elements
 * - Enrollment form for children aged 3-16
 * - Program overview with 56-day schedule
 * - World record aspiration banner
 * - WhatsApp integration info
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { PROGRAM_INFO, AGE_GROUPS, GRAND_CHANTING_EVENT } from '../data/vinayagarAgaval';

type Lang = 'ta' | 'en' | 'both';

const VinayagarAgavalEnroll: React.FC = () => {
  const navigate = useNavigate();
  const [lang, setLang] = useState<Lang>('both');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    childName: '',
    age: '',
    ageGroup: '',
    grade: '',
    schoolName: '',
    parentName: '',
    phone: '',
    altPhone: '',
    email: '',
    preferredLang: 'both' as Lang,
    city: '',
  });

  const t = (obj: { ta: string; en: string }) => {
    if (lang === 'ta') return obj.ta;
    if (lang === 'en') return obj.en;
    return `${obj.ta}\n${obj.en}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'age') {
        const age = parseInt(value);
        const group = AGE_GROUPS.find(g => age >= g.minAge && age <= g.maxAge);
        updated.ageGroup = group?.id || '';
      }
      return updated;
    });
  };

  const validate = (): string => {
    if (!form.childName.trim()) return lang === 'ta' ? 'குழந்தையின் பெயரை உள்ளிடவும்' : 'Please enter child\'s name';
    if (!form.age || parseInt(form.age) < 3 || parseInt(form.age) > 16) return lang === 'ta' ? 'வயது 3 முதல் 16 வரை இருக்க வேண்டும்' : 'Age must be between 3 and 16';
    if (!form.grade) return lang === 'ta' ? 'படிக்கும் வகுப்பைத் தேர்ந்தெடுக்கவும்' : 'Please select the grade/class';
    if (!form.parentName.trim()) return lang === 'ta' ? 'பெற்றோர் பெயரை உள்ளிடவும்' : 'Please enter parent/guardian name';
    if (!form.phone.match(/^\d{10,15}$/)) return lang === 'ta' ? 'சரியான தொலைபேசி எண்ணை உள்ளிடவும்' : 'Please enter a valid phone number (10-15 digits)';
    if (form.altPhone && !form.altPhone.match(/^\d{10,15}$/)) return lang === 'ta' ? 'சரியான மாற்று தொலைபேசி எண்ணை உள்ளிடவும்' : 'Please enter a valid alternate phone number';
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return lang === 'ta' ? 'சரியான மின்னஞ்சலை உள்ளிடவும்' : 'Please enter a valid email';
    if (!form.city.trim()) return lang === 'ta' ? 'நகரத்தை உள்ளிடவும்' : 'Please enter city';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }

    setLoading(true);
    setError('');
    try {
      await addDoc(collection(db, 'agaval_enrollments'), {
        childName: form.childName.trim(),
        age: parseInt(form.age),
        ageGroup: form.ageGroup,
        grade: form.grade,
        schoolName: form.schoolName.trim() || null,
        parentName: form.parentName.trim(),
        phone: form.phone.trim(),
        altPhone: form.altPhone.trim() || null,
        email: form.email.trim(),
        preferredLang: form.preferredLang,
        city: form.city.trim(),
        enrolledAt: serverTimestamp(),
        currentDay: 0,
        completedDays: [],
        badges: [],
        recordings: 0,
        streak: 0,
        status: 'active',
      });
      setSubmitted(true);
    } catch {
      setError(lang === 'ta' ? 'பதிவு தோல்வியுற்றது. மீண்டும் முயற்சிக்கவும்.' : 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Grand Chanting Countdown ──
  const eventDate = new Date(GRAND_CHANTING_EVENT.eventDate);
  const now = new Date();
  const daysUntilEvent = Math.max(0, Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  if (submitted) {
    return (
      <div style={styles.page}>
        <div style={styles.successCard}>
          <div style={{ fontSize: '5rem', textAlign: 'center' as const }}>🐘✨</div>
          <h1 style={{ ...styles.heading, color: '#FF6B35', textAlign: 'center' as const }}>
            {lang === 'ta' ? '🎉 பதிவு வெற்றிகரமாக முடிந்தது!' : '🎉 Registration Successful!'}
          </h1>
          <p style={{ textAlign: 'center' as const, fontSize: '1.15rem', color: '#5D4037', lineHeight: 1.7 }}>
            {lang === 'ta'
              ? `வணக்கம் ${form.childName}! விநாயகர் அகவல் கற்றல் பயணத்தில் நீங்கள் இணைந்துள்ளீர்கள். உங்கள் WhatsApp எண்ணுக்கு (${form.phone}) தினசரி பாடங்கள் அனுப்பப்படும்.`
              : `Welcome ${form.childName}! You have joined the Vinayagar Agaval Learning Journey. Daily lessons will be sent to your WhatsApp number (${form.phone}).`}
          </p>
          <div style={{ textAlign: 'center' as const, marginTop: 24 }}>
            <button onClick={() => navigate('/agaval/learn')} style={styles.primaryBtn}>
              {lang === 'ta' ? '📖 கற்றலைத் தொடங்கு' : '📖 Start Learning'}
            </button>
            <button onClick={() => navigate('/')} style={{ ...styles.secondaryBtn, marginLeft: 12 }}>
              {lang === 'ta' ? '🏠 முகப்பு' : '🏠 Home'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* ── Language Toggle ── */}
      <div style={styles.langToggle}>
        {(['ta', 'both', 'en'] as Lang[]).map(l => (
          <button
            key={l}
            onClick={() => setLang(l)}
            style={lang === l ? { ...styles.langBtn, ...styles.langBtnActive } : styles.langBtn}
          >
            {l === 'ta' ? 'தமிழ்' : l === 'en' ? 'English' : 'Both'}
          </button>
        ))}
      </div>

      {/* ── Hero Section with Ganesha Theme ── */}
      <div style={styles.hero}>
        <img
          src="/images/ganesha.png"
          alt="My Friend Ganesha"
          style={styles.ganeshaImage}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <h1 style={styles.heroTitle}>
          {t({ ta: 'என் நண்பன் கணேசா! 🙏', en: 'My Friend Ganesha! 🙏' })}
        </h1>
        <h2 style={styles.heroSubtitle}>
          {t(PROGRAM_INFO.title)}
        </h2>
        <p style={styles.heroDesc}>
          {t(PROGRAM_INFO.description)}
        </p>

        {/* Animated Stats */}
        <div style={styles.statsRow}>
          <div style={styles.statCard}>
            <span style={styles.statNum}>56</span>
            <span style={styles.statLabel}>{lang === 'ta' ? 'நாட்கள்' : 'Days'}</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statNum}>72</span>
            <span style={styles.statLabel}>{lang === 'ta' ? 'வரிகள்' : 'Lines'}</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statNum}>4</span>
            <span style={styles.statLabel}>{lang === 'ta' ? 'வரி/நாள்' : 'Lines/Day'}</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statNum}>🏆</span>
            <span style={styles.statLabel}>{lang === 'ta' ? 'உலக சாதனை' : 'World Record'}</span>
          </div>
        </div>
      </div>

      {/* ── World Record Banner ── */}
      <div style={styles.worldRecordBanner}>
        <div style={{ fontSize: '2.5rem' }}>🏆</div>
        <h3 style={{ margin: '8px 0 4px', fontSize: '1.2rem', color: '#fff' }}>
          {t(GRAND_CHANTING_EVENT.title)}
        </h3>
        <p style={{ margin: 0, fontSize: '0.95rem', color: '#FFE0B2' }}>
          {t(GRAND_CHANTING_EVENT.description)}
        </p>
        <div style={styles.countdownBox}>
          <span style={{ fontSize: '2rem', fontWeight: 700 }}>{daysUntilEvent}</span>
          <span style={{ fontSize: '0.85rem' }}>{lang === 'ta' ? 'நாட்கள் மீதம்' : 'days to go'}</span>
        </div>
        <p style={{ margin: '8px 0 0', fontSize: '0.9rem', color: '#FFE0B2', fontStyle: 'italic' }}>
          📅 {t(GRAND_CHANTING_EVENT.eventDateDisplay)}
        </p>
      </div>

      {/* ── Program Journey ── */}
      <div style={styles.journeySection}>
        <h2 style={styles.sectionTitle}>
          {t({ ta: '🗺️ 56 நாள் பயண வரைபடம்', en: '🗺️ 56-Day Journey Map' })}
        </h2>
        <div style={styles.phaseGrid}>
          {[
            { emoji: '🌱', days: '1-18', ta: 'கற்றல் — தினம் 4 புதிய வரிகள்', en: 'Learning — 4 new lines daily' },
            { emoji: '🔄', days: '19-36', ta: 'மீட்டல் — பழைய வரிகளை மீண்டும்', en: 'Revision — Reinforce past lines' },
            { emoji: '💪', days: '37-50', ta: 'பயிற்சி — பகுதிகளை இணைத்து சொல்', en: 'Practice — Combine sections' },
            { emoji: '⭐', days: '51-55', ta: 'ஒத்திகை — முழு அகவல் ஒப்பிக்கை', en: 'Rehearsal — Full Agaval recitation' },
            { emoji: '🏆', days: '56', ta: 'மகா ஒலிப்பு நாள் — உலக சாதனை!', en: 'Grand Chanting Day — World Record!' },
          ].map((phase, i) => (
            <div key={i} style={styles.phaseCard}>
              <span style={{ fontSize: '2rem' }}>{phase.emoji}</span>
              <div style={{ fontWeight: 700, color: '#E65100', fontSize: '0.9rem' }}>
                {lang === 'ta' ? `நாள் ${phase.days}` : `Day ${phase.days}`}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#5D4037' }}>
                {t({ ta: phase.ta, en: phase.en })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Why Vinayagar Agaval — Benefits ── */}
      <div style={styles.benefitsSection}>
        <h2 style={styles.sectionTitle}>
          {t({ ta: '✨ விநாயகர் அகவல் ஏன் கற்க வேண்டும்?', en: '✨ Why Learn Vinayagar Agaval?' })}
        </h2>
        <p style={{ textAlign: 'center' as const, color: '#5D4037', fontSize: '0.95rem', maxWidth: 600, margin: '0 auto 24px', lineHeight: 1.7, whiteSpace: 'pre-line' as const }}>
          {t({
            ta: 'அவ்வையாரின் விநாயகர் அகவல் குழந்தைகளின் அறிவு, மன, ஆளுமை மற்றும் ஆன்மீக வளர்ச்சிக்கு ஒரு அற்புதமான கருவியாகும்.',
            en: 'Avvaiyar\'s Vinayagar Agaval is a powerful tool for a child\'s intellectual, mental, personality, and spiritual development.',
          })}
        </p>
        <div style={styles.benefitCategoryGrid}>
          {PROGRAM_INFO.benefitCategories.map((cat, i) => (
            <div key={i} style={styles.benefitCategoryCard}>
              <span style={{ fontSize: '2.5rem' }}>{cat.icon}</span>
              <h3 style={{ margin: '8px 0 10px', color: '#E65100', fontSize: '1.05rem' }}>
                {t(cat.title)}
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {cat.items[lang === 'ta' ? 'ta' : 'en'].map((item, j) => (
                  <li key={j} style={{ fontSize: '0.9rem', color: '#4E342E', padding: '4px 0', lineHeight: 1.5 }}>
                    ✦ {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ── How It Works ── */}
      <div style={{ ...styles.journeySection, background: '#FFF3E0' }}>
        <h2 style={styles.sectionTitle}>
          {t({ ta: '📱 இது எப்படி வேலை செய்கிறது?', en: '📱 How Does It Work?' })}
        </h2>
        <div style={styles.stepsGrid}>
          {[
            { emoji: '📝', ta: 'இங்கே பதிவு செய்யுங்கள்', en: 'Register here' },
            { emoji: '🌅', ta: 'காலையில் 4 வரிகள் கற்றுக்கொள்ளுங்கள்', en: 'Learn 4 lines in the morning' },
            { emoji: '🌙', ta: 'மாலையில் அதே வரிகளை மீண்டும் சொல்லுங்கள்', en: 'Repeat the same lines in the evening' },
            { emoji: '🎤', ta: 'ஒலிப்பதிவு செய்து அனுப்புங்கள்', en: 'Record and send your recitation' },
            { emoji: '📲', ta: 'WhatsApp வழியாக பாடம் & ஆடியோ', en: 'Lessons & audio via WhatsApp' },
            { emoji: '🏅', ta: 'பேட்ஜ்கள் & பாராட்டுகள் பெறுங்கள்', en: 'Earn badges & appreciation' },
          ].map((step, i) => (
            <div key={i} style={styles.stepCard}>
              <div style={styles.stepNum}>{i + 1}</div>
              <span style={{ fontSize: '1.8rem' }}>{step.emoji}</span>
              <span style={{ fontSize: '0.9rem', color: '#4E342E', textAlign: 'center' as const }}>
                {t({ ta: step.ta, en: step.en })}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Age Groups ── */}
      <div style={styles.ageSection}>
        <h2 style={styles.sectionTitle}>
          {t({ ta: '👶 வயதுப் பிரிவுகள்', en: '👶 Age Groups' })}
        </h2>
        <div style={styles.ageGrid}>
          {AGE_GROUPS.map(g => (
            <div key={g.id} style={styles.ageCard}>
              <span style={{ fontSize: '2rem' }}>{g.emoji}</span>
              <div style={{ fontWeight: 700, color: '#E65100' }}>{t(g.label)}</div>
              <div style={{ fontSize: '0.85rem', color: '#795548' }}>
                {g.minAge}-{g.maxAge} {lang === 'ta' ? 'வயது' : 'years'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Enrollment Form ── */}
      <div style={styles.formSection}>
        <div style={styles.formCard}>
          <div style={{ fontSize: '3rem', textAlign: 'center' as const }}>🐘📖</div>
          <h2 style={{ ...styles.sectionTitle, marginTop: 8 }}>
            {t({ ta: '✍️ இப்போதே பதிவு செய்யுங்கள்!', en: '✍️ Enroll Now!' })}
          </h2>
          <p style={{ textAlign: 'center' as const, color: '#795548', fontSize: '0.95rem', marginBottom: 24 }}>
            {t({ ta: 'உங்கள் குழந்தையை விநாயகர் அகவல் கற்றல் பயணத்தில் இணையுங்கள்', en: 'Join your child in the Vinayagar Agaval learning journey' })}
          </p>

          <form onSubmit={handleSubmit}>
            {/* Child's Name */}
            <div style={styles.formGroup}>
              <label style={styles.label}>
                {t({ ta: '👦 குழந்தையின் பெயர்', en: '👦 Child\'s Name' })} *
              </label>
              <input
                type="text"
                name="childName"
                value={form.childName}
                onChange={handleChange}
                placeholder={lang === 'ta' ? 'குழந்தையின் பெயர்' : 'Enter child\'s name'}
                style={styles.input}
                maxLength={100}
              />
            </div>

            {/* Age */}
            <div style={styles.formGroup}>
              <label style={styles.label}>
                {t({ ta: '🎂 வயது', en: '🎂 Age' })} *
              </label>
              <select name="age" value={form.age} onChange={handleChange} style={styles.input}>
                <option value="">{lang === 'ta' ? 'வயதைத் தேர்ந்தெடுக்கவும்' : 'Select age'}</option>
                {Array.from({ length: 14 }, (_, i) => i + 3).map(a => (
                  <option key={a} value={a}>{a} {lang === 'ta' ? 'வயது' : 'years'}</option>
                ))}
              </select>
              {form.ageGroup && (
                <div style={styles.ageGroupTag}>
                  {AGE_GROUPS.find(g => g.id === form.ageGroup)?.emoji}{' '}
                  {t(AGE_GROUPS.find(g => g.id === form.ageGroup)!.label)}
                </div>
              )}
            </div>

            {/* Grade / Class */}
            <div style={styles.formGroup}>
              <label style={styles.label}>
                {t({ ta: '🏫 படிக்கும் வகுப்பு', en: '🏫 Grade / Class' })} *
              </label>
              <select name="grade" value={form.grade} onChange={handleChange} style={styles.input}>
                <option value="">{lang === 'ta' ? 'வகுப்பைத் தேர்ந்தெடுக்கவும்' : 'Select grade/class'}</option>
                <option value="pre-kg">Pre-KG</option>
                <option value="lkg">LKG</option>
                <option value="ukg">UKG</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(g => (
                  <option key={g} value={`${g}`}>{lang === 'ta' ? `${g}-ம் வகுப்பு` : `Class ${g}`}</option>
                ))}
              </select>
            </div>

            {/* School Name (Optional) */}
            <div style={styles.formGroup}>
              <label style={styles.label}>
                {t({ ta: '🏫 பள்ளி பெயர் (விரும்பினால்)', en: '🏫 School Name (Optional)' })}
              </label>
              <input
                type="text"
                name="schoolName"
                value={form.schoolName}
                onChange={handleChange}
                placeholder={lang === 'ta' ? 'பள்ளியின் பெயர்' : 'Enter school name'}
                style={styles.input}
                maxLength={150}
              />
              <div style={{ fontSize: '0.8rem', color: '#FF6B35', marginTop: 4 }}>
                🏆 {t({ ta: 'பள்ளிகளுக்கு உரிய அங்கீகாரம் வழங்கப்படும்', en: 'Schools will receive due recognition & credits' })}
              </div>
            </div>

            {/* Parent Name */}
            <div style={styles.formGroup}>
              <label style={styles.label}>
                {t({ ta: '👨‍👩‍👧 பெற்றோர்/காப்பாளர் பெயர்', en: '👨‍👩‍👧 Parent/Guardian Name' })} *
              </label>
              <input
                type="text"
                name="parentName"
                value={form.parentName}
                onChange={handleChange}
                placeholder={lang === 'ta' ? 'பெற்றோர் பெயர்' : 'Enter parent/guardian name'}
                style={styles.input}
                maxLength={100}
              />
            </div>

            {/* WhatsApp Phone */}
            <div style={styles.formGroup}>
              <label style={styles.label}>
                {t({ ta: '📱 WhatsApp எண்', en: '📱 WhatsApp Number' })} *
              </label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder={lang === 'ta' ? '98XXXXXXXX' : '98XXXXXXXX'}
                style={styles.input}
                maxLength={15}
              />
              <div style={{ fontSize: '0.8rem', color: '#FF6B35', marginTop: 4 }}>
                📲 {t({ ta: 'தினசரி பாடங்கள் இந்த எண்ணுக்கு அனுப்பப்படும்', en: 'Daily lessons will be sent to this number' })}
              </div>
            </div>

            {/* Alternate Mobile (Optional) */}
            <div style={styles.formGroup}>
              <label style={styles.label}>
                {t({ ta: '📞 மாற்று தொலைபேசி எண் (விரும்பினால்)', en: '📞 Alternate Mobile Number (Optional)' })}
              </label>
              <input
                type="tel"
                name="altPhone"
                value={form.altPhone}
                onChange={handleChange}
                placeholder={lang === 'ta' ? '98XXXXXXXX' : '98XXXXXXXX'}
                style={styles.input}
                maxLength={15}
              />
            </div>

            {/* Email */}
            <div style={styles.formGroup}>
              <label style={styles.label}>
                {t({ ta: '📧 மின்னஞ்சல்', en: '📧 Email' })} *
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder={lang === 'ta' ? 'minnanjal@example.com' : 'email@example.com'}
                style={styles.input}
              />
            </div>

            {/* City */}
            <div style={styles.formGroup}>
              <label style={styles.label}>
                {t({ ta: '🏙️ நகரம்', en: '🏙️ City' })} *
              </label>
              <input
                type="text"
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder={lang === 'ta' ? 'சென்னை' : 'Chennai'}
                style={styles.input}
                maxLength={100}
              />
            </div>

            {/* Preferred Language */}
            <div style={styles.formGroup}>
              <label style={styles.label}>
                {t({ ta: '🗣️ விருப்பமான மொழி', en: '🗣️ Preferred Language' })}
              </label>
              <div style={styles.langOptions}>
                {[
                  { val: 'ta' as Lang, label: 'தமிழ் (Tamil)' },
                  { val: 'en' as Lang, label: 'English' },
                  { val: 'both' as Lang, label: 'Both / இரண்டும்' },
                ].map(opt => (
                  <label key={opt.val} style={styles.radioLabel}>
                    <input
                      type="radio"
                      name="preferredLang"
                      value={opt.val}
                      checked={form.preferredLang === opt.val}
                      onChange={handleChange}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            {error && <div style={styles.errorMsg}>{error}</div>}

            <button type="submit" disabled={loading} style={styles.submitBtn}>
              {loading
                ? (lang === 'ta' ? '⏳ பதிவு செய்கிறது...' : '⏳ Enrolling...')
                : (lang === 'ta' ? '🐘 இப்போதே இணையுங்கள்!' : '🐘 Join Now!')}
            </button>
          </form>

          {/* WhatsApp Direct Link */}
          <div style={styles.whatsappBox}>
            <p style={{ margin: 0, fontWeight: 600, color: '#1B5E20' }}>
              {t({ ta: '📞 உதவி தேவையா?', en: '📞 Need Help?' })}
            </p>
            <a
              href="https://wa.me/919876543210?text=I%20want%20to%20enroll%20my%20child%20for%20Vinayagar%20Agaval"
              target="_blank"
              rel="noopener noreferrer"
              style={styles.whatsappLink}
            >
              💬 {t({ ta: 'WhatsApp-ல் தொடர்பு கொள்ளுங்கள்', en: 'Contact us on WhatsApp' })}
            </a>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={styles.footer}>
        <div style={{ fontSize: '2rem' }}>🐘🙏</div>
        <p style={{ margin: '8px 0 0', color: '#BF360C' }}>
          {t({ ta: 'ஸ்ரீ சக்ரா அகாடமி | Srichakra Academy', en: 'Srichakra Academy' })}
        </p>
        <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#D84315' }}>
          {t({ ta: 'குழந்தைகளின் நினைவாற்றலை வளர்ப்போம்', en: 'Building children\'s memory through structured learning' })}
        </p>
        <button onClick={() => navigate('/')} style={{ ...styles.secondaryBtn, marginTop: 12, fontSize: '0.85rem' }}>
          ← {lang === 'ta' ? 'முகப்புக்குத் திரும்பு' : 'Back to Home'}
        </button>
      </div>
    </div>
  );
};

/* ── Inline Styles — My Friend Ganesha Theme ── */

const styles: Record<string, React.CSSProperties> = {
  page: {
    fontFamily: "'Segoe UI', 'Noto Sans Tamil', Tahoma, sans-serif",
    background: 'linear-gradient(180deg, #FFF8E1 0%, #FFF3E0 30%, #FFECB3 100%)',
    minHeight: '100vh',
    color: '#3E2723',
  },
  langToggle: {
    display: 'flex',
    justifyContent: 'center',
    gap: 8,
    padding: '12px 16px',
    background: 'rgba(255,107,53,0.1)',
  },
  langBtn: {
    padding: '6px 18px',
    border: '2px solid #FF6B35',
    borderRadius: 20,
    background: 'transparent',
    color: '#FF6B35',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '0.85rem',
  },
  langBtnActive: {
    background: '#FF6B35',
    color: '#fff',
  },

  // Hero
  hero: {
    textAlign: 'center' as const,
    padding: '40px 20px 30px',
    background: 'linear-gradient(135deg, #FF6B35 0%, #FF9800 50%, #FFD54F 100%)',
    color: '#fff',
    position: 'relative' as const,
  },
  ganeshaImage: {
    width: 160,
    height: 'auto' as const,
    borderRadius: '50%',
    border: '4px solid rgba(255,255,255,0.4)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
    objectFit: 'cover' as const,
  },
  heroTitle: {
    fontSize: '2rem',
    fontWeight: 800,
    margin: '12px 0 4px',
    textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
  },
  heroSubtitle: {
    fontSize: '1.15rem',
    fontWeight: 400,
    margin: '4px 0 16px',
    opacity: 0.95,
    whiteSpace: 'pre-line' as const,
  },
  heroDesc: {
    fontSize: '0.95rem',
    maxWidth: 600,
    margin: '0 auto 24px',
    lineHeight: 1.7,
    opacity: 0.9,
    whiteSpace: 'pre-line' as const,
  },
  statsRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: 16,
    flexWrap: 'wrap' as const,
  },
  statCard: {
    background: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    padding: '12px 20px',
    minWidth: 80,
    textAlign: 'center' as const,
    backdropFilter: 'blur(10px)',
  },
  statNum: {
    display: 'block',
    fontSize: '1.8rem',
    fontWeight: 800,
  },
  statLabel: {
    display: 'block',
    fontSize: '0.75rem',
    opacity: 0.9,
    marginTop: 2,
  },

  // World Record Banner
  worldRecordBanner: {
    textAlign: 'center' as const,
    padding: '24px 20px',
    background: 'linear-gradient(135deg, #BF360C 0%, #E65100 50%, #FF6D00 100%)',
    color: '#fff',
  },
  countdownBox: {
    display: 'inline-flex',
    flexDirection: 'column' as const,
    alignItems: 'center' as const,
    background: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    padding: '8px 24px',
    marginTop: 12,
  },

  // Journey Section
  journeySection: {
    padding: '32px 20px',
    background: '#FFF8E1',
  },
  sectionTitle: {
    textAlign: 'center' as const,
    fontSize: '1.4rem',
    fontWeight: 700,
    color: '#E65100',
    marginBottom: 20,
    whiteSpace: 'pre-line' as const,
  },
  phaseGrid: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    justifyContent: 'center',
    gap: 12,
    maxWidth: 800,
    margin: '0 auto',
  },
  phaseCard: {
    background: '#fff',
    borderRadius: 16,
    padding: '16px',
    minWidth: 140,
    maxWidth: 200,
    textAlign: 'center' as const,
    boxShadow: '0 2px 8px rgba(230,81,0,0.12)',
    border: '2px solid #FFCC80',
    flex: '1 1 140px',
  },

  // Benefits
  benefitsSection: {
    padding: '32px 20px',
    background: '#fff',
  },
  benefitCategoryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: 20,
    maxWidth: 900,
    margin: '0 auto',
  },
  benefitCategoryCard: {
    background: '#FFF8E1',
    borderRadius: 20,
    padding: '24px 20px',
    textAlign: 'center' as const,
    boxShadow: '0 3px 12px rgba(230,81,0,0.1)',
    border: '2px solid #FFCC80',
    transition: 'transform 0.2s',
  },

  // Steps
  stepsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: 16,
    maxWidth: 700,
    margin: '0 auto',
  },
  stepCard: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 8,
    background: '#fff',
    borderRadius: 16,
    padding: '20px 12px',
    boxShadow: '0 2px 8px rgba(230,81,0,0.1)',
    position: 'relative' as const,
  },
  stepNum: {
    position: 'absolute' as const,
    top: -10,
    left: -10,
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: '#FF6B35',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '0.85rem',
  },

  // Age Groups
  ageSection: {
    padding: '32px 20px',
    background: '#fff',
  },
  ageGrid: {
    display: 'flex',
    justifyContent: 'center',
    gap: 16,
    flexWrap: 'wrap' as const,
  },
  ageCard: {
    textAlign: 'center' as const,
    padding: '16px 24px',
    background: '#FFF8E1',
    borderRadius: 16,
    border: '2px solid #FFCC80',
    minWidth: 120,
  },

  // Form
  formSection: {
    padding: '32px 20px',
    background: 'linear-gradient(180deg, #FFF3E0, #FFECB3)',
  },
  formCard: {
    maxWidth: 500,
    margin: '0 auto',
    background: '#fff',
    borderRadius: 24,
    padding: '32px 28px',
    boxShadow: '0 8px 32px rgba(230,81,0,0.15)',
    border: '3px solid #FFCC80',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    display: 'block',
    fontWeight: 600,
    color: '#5D4037',
    marginBottom: 6,
    fontSize: '0.95rem',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    border: '2px solid #FFCC80',
    borderRadius: 12,
    fontSize: '1rem',
    fontFamily: 'inherit',
    color: '#3E2723',
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.2s',
  },
  ageGroupTag: {
    display: 'inline-block',
    marginTop: 8,
    padding: '4px 14px',
    background: '#FFF8E1',
    borderRadius: 20,
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#E65100',
    border: '1px solid #FFCC80',
  },
  langOptions: {
    display: 'flex',
    gap: 16,
    flexWrap: 'wrap' as const,
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    cursor: 'pointer',
    fontSize: '0.95rem',
    color: '#5D4037',
  },
  errorMsg: {
    background: '#FBE9E7',
    color: '#BF360C',
    padding: '10px 16px',
    borderRadius: 8,
    fontSize: '0.9rem',
    marginBottom: 16,
    textAlign: 'center' as const,
  },
  submitBtn: {
    width: '100%',
    padding: '14px 24px',
    background: 'linear-gradient(135deg, #FF6B35, #FF9800)',
    color: '#fff',
    border: 'none',
    borderRadius: 16,
    fontSize: '1.15rem',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    boxShadow: '0 4px 16px rgba(255,107,53,0.3)',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  primaryBtn: {
    padding: '12px 28px',
    background: 'linear-gradient(135deg, #FF6B35, #FF9800)',
    color: '#fff',
    border: 'none',
    borderRadius: 16,
    fontSize: '1.05rem',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    boxShadow: '0 4px 12px rgba(255,107,53,0.25)',
  },
  secondaryBtn: {
    padding: '10px 24px',
    background: 'transparent',
    color: '#FF6B35',
    border: '2px solid #FF6B35',
    borderRadius: 16,
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },

  // WhatsApp
  whatsappBox: {
    textAlign: 'center' as const,
    marginTop: 24,
    padding: '16px',
    background: '#E8F5E9',
    borderRadius: 16,
    border: '2px solid #A5D6A7',
  },
  whatsappLink: {
    display: 'inline-block',
    marginTop: 8,
    padding: '8px 20px',
    background: '#25D366',
    color: '#fff',
    borderRadius: 20,
    fontWeight: 600,
    textDecoration: 'none',
    fontSize: '0.95rem',
  },

  // Success
  successCard: {
    maxWidth: 500,
    margin: '60px auto',
    background: '#fff',
    borderRadius: 24,
    padding: '40px 28px',
    boxShadow: '0 8px 32px rgba(230,81,0,0.15)',
    border: '3px solid #FFD54F',
  },
  heading: {
    fontSize: '1.5rem',
    fontWeight: 700,
    margin: '16px 0',
  },

  // Footer
  footer: {
    textAlign: 'center' as const,
    padding: '32px 20px',
    background: '#FFE0B2',
  },
};

export default VinayagarAgavalEnroll;
