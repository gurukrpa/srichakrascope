/**
 * Srichakra E-book Builder
 * ─────────────────────────
 * Generates branded, print-ready HTML e-books from the existing
 * career repositories in client/src/data/specializedRepositories.ts.
 *
 * Output HTML files are PDF-ready: open in Chrome → Ctrl+P → "Save as PDF"
 * (Layout: Portrait, Margins: None, Background graphics: ON).
 *
 * Usage:
 *   node ebooks/build-ebook.mjs                 # build all configured e-books
 *   node ebooks/build-ebook.mjs health          # build only health
 *   node ebooks/build-ebook.mjs fintech future  # build multiple
 *
 * Add a new title by appending to EBOOK_CATALOG below.
 */

import { build } from 'esbuild';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SRC = join(ROOT, 'client', 'src', 'data', 'specializedRepositories.ts');
const OUT_DIR = join(__dirname, 'output');
const LOGO_PATH = join(ROOT, 'client', 'public', 'images', 'srichakra-logo.png');

// ───────────────── Brand constants ─────────────────
const BRAND = {
  name: 'Srichakra Academy',
  tagline: 'Self Discovery to Success',
  website: 'https://srichakraacademy.org',
  websiteDisplay: 'srichakraacademy.org',
  phones: ['85903 96662', '98430 30697'],
  email: 'info.srichakra@gmail.com',
  instagram: { handle: '@eswari_srichakra', url: 'https://www.instagram.com/eswari_srichakra/' },
  linkedin: { handle: 'eswari-k', url: 'https://www.linkedin.com/in/eswari-k-00ab581ba' },
};

let LOGO_DATA_URI = '';
try {
  const buf = readFileSync(LOGO_PATH);
  LOGO_DATA_URI = `data:image/png;base64,${buf.toString('base64')}`;
} catch {
  console.warn('⚠  Logo not found at', LOGO_PATH, '— continuing without it.');
}

// ───────────────── Catalog config ─────────────────
const EBOOK_CATALOG = [
  {
    key: 'health',
    exportName: 'HEALTH_BEYOND_NEET',
    file: 'health-beyond-neet',
    price: '₹99',
    coverColor: '#0a7c6e',
    coverColor2: '#03524a',
    accent: '#ffb84d',
    coupon: 'NEETFREE500',
    audience: 'Class 9–12 students, parents & counsellors',
    promise: '30+ rewarding healthcare careers — without writing NEET.',
  },
  {
    key: 'fintech',
    exportName: 'FINTECH_COMMERCE',
    file: 'fintech-and-commerce',
    price: '₹99',
    coverColor: '#1d3557',
    coverColor2: '#0a1c33',
    accent: '#f1c40f',
    coupon: 'FINTECH500',
    audience: 'Commerce + Science (PCM) students, parents',
    promise: '35+ careers at the intersection of finance, technology & business.',
  },
  {
    key: 'future',
    exportName: 'FUTURE_READY_GREEN',
    file: 'future-ready-tech-and-green',
    price: '₹199',
    coverColor: '#5b2a86',
    coverColor2: '#311755',
    accent: '#7ee8c2',
    coupon: 'FUTURE500',
    audience: 'Future-focused students & ambitious parents',
    promise: '50+ emerging careers in AI, Cyber, Drones, EV, Space, Climate & more.',
  },
  {
    key: 'engineering',
    exportName: 'ENGINEERING_IT',
    file: 'engineering-and-it',
    price: '₹149',
    coverColor: '#0b3d91',
    coverColor2: '#061f4d',
    accent: '#ff8c42',
    coupon: 'ENGG500',
    audience: 'PCM students, JEE aspirants, parents evaluating engineering branches',
    promise: '40+ proven careers across Civil, Mechanical, Electrical, ECE, CSE, Chemical & specialised branches.',
  },
  {
    key: 'arts',
    exportName: 'ARTS_HUMANITIES',
    file: 'arts-and-humanities',
    price: '₹99',
    coverColor: '#a83246',
    coverColor2: '#651b2a',
    accent: '#ffd166',
    coupon: 'ARTS500',
    audience: 'Arts / Humanities / Commerce students, parents who think Arts is "less serious"',
    promise: '35+ powerful careers across Psychology, Civil Services, Law, Media, Languages, Design & more.',
  },
];

// ───────────────── Helpers ─────────────────
function escapeHtml(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function loadRepoData() {
  // Bundle the TS file to ESM in tmp, then dynamic-import.
  const outFile = join(tmpdir(), `srichakra-ebook-${Date.now()}.mjs`);
  await build({
    entryPoints: [SRC],
    outfile: outFile,
    format: 'esm',
    platform: 'node',
    bundle: true,
    target: 'node18',
    logLevel: 'silent',
  });
  const mod = await import(pathToFileURL(outFile).href);
  return mod;
}

// ───────────────── Template ─────────────────
function renderEbook(repo, meta) {
  const totalCareers = repo.clusters.reduce((n, c) => n + c.pathways.length, 0);
  const tocItems = repo.clusters
    .map(
      (c, i) => `
        <li>
          <span class="toc-num">${String(i + 1).padStart(2, '0')}</span>
          <span class="toc-title">${c.icon} ${escapeHtml(c.name)}</span>
          <span class="toc-dots"></span>
          <span class="toc-count">${c.pathways.length} careers</span>
        </li>`
    )
    .join('');

  const chapters = repo.clusters
    .map((c, i) => renderCluster(c, i + 1, meta))
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(repo.title)} — Srichakra E-book</title>
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a1a; background: #f4f4f4; }
  .page {
    width: 210mm; min-height: 297mm; padding: 18mm 16mm; margin: 0 auto 8mm;
    background: #fff; position: relative; page-break-after: always;
    box-shadow: 0 4px 18px rgba(0,0,0,0.08);
  }
  .page:last-child { page-break-after: auto; }
  h1, h2, h3, h4 { margin: 0 0 10px; line-height: 1.25; }
  p { line-height: 1.6; margin: 0 0 10px; }

  /* ── Cover ── */
  .cover {
    background: linear-gradient(160deg, ${meta.coverColor} 0%, ${meta.coverColor2} 100%);
    color: #fff; padding: 0; display: flex; flex-direction: column; justify-content: space-between;
  }
  .cover-inner { padding: 22mm 18mm; flex: 1; display: flex; flex-direction: column; justify-content: space-between; }
  .brand { display: flex; align-items: center; gap: 16px; font-weight: 700; letter-spacing: 2px; font-size: 13px; opacity: 0.98; }
  .brand-mark { width: 90px; height: 90px; border-radius: 50%; background: #fff; padding: 2px; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(0,0,0,0.22); overflow: hidden; }
  .brand-mark img { width: 102%; height: 102%; object-fit: cover; }
  .brand-text { display: flex; flex-direction: column; line-height: 1.1; }
  .brand-text .b-name { font-size: 18px; letter-spacing: 2.5px; }
  .brand-text .b-tag { font-size: 12px; opacity: 0.88; letter-spacing: 1.5px; font-weight: 500; margin-top: 5px; }
  .cover-icon { font-size: 100px; line-height: 1; margin: 24px 0; }
  .cover h1 { font-size: 44px; font-weight: 800; max-width: 16ch; }
  .cover .subtitle { font-size: 18px; opacity: 0.95; max-width: 36ch; margin-top: 12px; }
  .cover .promise { font-size: 16px; opacity: 0.85; margin-top: 16px; max-width: 40ch; }
  .cover-meta { display: flex; gap: 24px; font-size: 12px; opacity: 0.85; border-top: 1px solid rgba(255,255,255,0.25); padding-top: 14px; }
  .cover-meta strong { display: block; font-size: 18px; opacity: 1; margin-bottom: 4px; color: ${meta.accent}; }
  .cover-price-tag {
    position: absolute; top: 18mm; right: 18mm; background: ${meta.accent}; color: #1a1a1a;
    padding: 10px 16px; border-radius: 6px; font-weight: 800; font-size: 18px; letter-spacing: 1px;
    box-shadow: 0 4px 14px rgba(0,0,0,0.25);
  }

  /* ── TOC / intro pages ── */
  .page-title { font-size: 32px; color: ${meta.coverColor}; border-bottom: 4px solid ${meta.accent}; padding-bottom: 10px; margin-bottom: 22px; }
  .lead { font-size: 17px; color: #333; max-width: 65ch; }
  .toc { list-style: none; padding: 0; margin: 22px 0 0; }
  .toc li { display: flex; align-items: baseline; padding: 12px 0; border-bottom: 1px dashed #ddd; font-size: 16px; }
  .toc-num { font-weight: 800; color: ${meta.coverColor}; width: 38px; }
  .toc-title { flex: 0 1 auto; padding-right: 8px; }
  .toc-dots { flex: 1; border-bottom: 2px dotted #bbb; transform: translateY(-4px); margin: 0 6px; }
  .toc-count { font-size: 13px; color: #666; white-space: nowrap; }

  /* ── Chapter divider ── */
  .chapter-divider {
    background: linear-gradient(135deg, ${meta.coverColor} 0%, ${meta.coverColor2} 100%);
    color: #fff; display: flex; flex-direction: column; justify-content: center; align-items: flex-start;
    padding-left: 24mm;
  }
  .chapter-divider .ch-no { font-size: 14px; letter-spacing: 4px; opacity: 0.7; }
  .chapter-divider h2 { font-size: 56px; font-weight: 800; margin-top: 8px; max-width: 14ch; }
  .chapter-divider .ch-desc { font-size: 18px; opacity: 0.92; max-width: 40ch; margin-top: 16px; }
  .chapter-divider .ch-skills { margin-top: 24px; }
  .chapter-divider .ch-skills span { display: inline-block; background: rgba(255,255,255,0.15); padding: 6px 12px; border-radius: 20px; font-size: 13px; margin: 0 6px 6px 0; }

  /* ── Career card ── */
  .career-card {
    border: 1px solid #e3e3e3; border-radius: 12px; padding: 16px 18px; margin-bottom: 16px;
    background: #fff; page-break-inside: avoid;
  }
  .career-card .role-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
  .career-card h3 { font-size: 18px; color: ${meta.coverColor}; margin-bottom: 4px; }
  .career-card .desc { font-size: 14px; color: #333; margin: 6px 0 12px; }
  .badges { display: flex; gap: 6px; flex-wrap: wrap; }
  .badge { font-size: 11px; padding: 4px 9px; border-radius: 12px; font-weight: 700; letter-spacing: 0.5px; }
  .badge-growth-High { background: #e6f7ee; color: #0a7c4a; border: 1px solid #b6e6c9; }
  .badge-growth-Moderate { background: #fff7e0; color: #8a6500; border: 1px solid #ffe28a; }
  .badge-growth-Stable { background: #eef2ff; color: #2740a8; border: 1px solid #c7d2fe; }
  .badge-cat { background: #f3eaff; color: #5b2a86; border: 1px solid #e0ccff; }
  .badge-neet { background: #ffebeb; color: #a02525; border: 1px solid #ffc1c1; }
  .meta-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 8px 18px; font-size: 12.5px; color: #333;
    border-top: 1px dashed #e6e6e6; padding-top: 10px;
  }
  .meta-grid div strong { display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #666; margin-bottom: 2px; }
  .salary-row {
    display: flex; justify-content: space-between; align-items: center; margin-top: 10px;
    padding: 8px 12px; background: #f8faf9; border-left: 4px solid ${meta.coverColor}; border-radius: 6px; font-size: 13px;
  }
  .salary-row strong { color: ${meta.coverColor}; font-size: 16px; }

  /* ── CTA / coupon ── */
  .cta-page {
    background: linear-gradient(160deg, #fff 0%, #f4f9f8 100%);
    display: flex; flex-direction: column; justify-content: center;
  }
  .cta-card {
    border: 3px dashed ${meta.coverColor}; border-radius: 18px; padding: 28px; margin: 12px 0;
    text-align: center; background: #fff;
  }
  .cta-card h2 { color: ${meta.coverColor}; font-size: 28px; }
  .coupon {
    display: inline-block; margin: 18px 0; padding: 14px 28px; border-radius: 8px;
    background: ${meta.accent}; color: #1a1a1a; font-family: 'Courier New', monospace;
    font-size: 24px; font-weight: 800; letter-spacing: 4px;
    box-shadow: 0 4px 14px rgba(0,0,0,0.12);
  }
  .cta-button {
    display: inline-block; margin-top: 12px; padding: 14px 32px; background: ${meta.coverColor};
    color: #fff; border-radius: 30px; font-weight: 700; text-decoration: none; font-size: 16px;
  }

  /* ── Footer ── */
  .pg-footer {
    position: absolute; bottom: 8mm; left: 16mm; right: 16mm;
    display: flex; justify-content: space-between; font-size: 11px; color: #888;
    border-top: 1px solid #eee; padding-top: 6px;
  }

  /* ── Print tweaks ── */
  @media print {
    body { background: #fff; }
    .page { margin: 0; box-shadow: none; }
  }
</style>
</head>
<body>

<!-- ──────── COVER ──────── -->
<section class="page cover">
  <div class="cover-price-tag">${meta.price}</div>
  <div class="cover-inner">
    <div class="brand">
      <span class="brand-mark">${LOGO_DATA_URI ? `<img src="${LOGO_DATA_URI}" alt="${BRAND.name}" />` : ''}</span>
      <span class="brand-text">
        <span class="b-name">${BRAND.name.toUpperCase()}</span>
        <span class="b-tag">${BRAND.tagline}</span>
      </span>
    </div>
    <div>
      <div class="cover-icon">${repo.icon}</div>
      <h1>${escapeHtml(repo.title)}</h1>
      <p class="subtitle">${escapeHtml(repo.subtitle)}</p>
      <p class="promise">${escapeHtml(meta.promise)}</p>
    </div>
    <div class="cover-meta">
      <div><strong>${totalCareers}+</strong> Careers Mapped</div>
      <div><strong>${repo.clusters.length}</strong> Career Clusters</div>
      <div><strong>India</strong> Focused (Exams · Colleges · Salaries)</div>
    </div>
    <div style="font-size:12px; opacity:0.85; margin-top:14px;">
      ${BRAND.websiteDisplay} · ${BRAND.phones.join(' · ')}
    </div>
  </div>
</section>

<!-- ──────── INTRO ──────── -->
<section class="page">
  <h1 class="page-title">Why this e-book?</h1>
  <p class="lead">${escapeHtml(repo.description)}</p>

  <div style="margin-top: 28px;">
    <h3 style="color: ${meta.coverColor};">Who is this for?</h3>
    <p>${escapeHtml(meta.audience)}</p>
  </div>

  <div style="margin-top: 22px;">
    <h3 style="color: ${meta.coverColor};">What you will get</h3>
    <ul style="line-height: 1.9;">
      <li><strong>${totalCareers}+ career pathways</strong> — each with qualifications, exams, top institutions and salary ranges</li>
      <li><strong>${repo.clusters.length} career clusters</strong> — organised so you can scan and compare</li>
      <li><strong>India-first context</strong> — JEE, NEET-alternatives, CUET, CAT, state CETs, ICAI and more</li>
      <li><strong>Honest growth outlook</strong> — High / Moderate / Stable, not marketing fluff</li>
      <li><strong>A free ₹500 coupon</strong> for the full Srichakra Career Assessment (page ${4 + repo.clusters.length * 2})</li>
    </ul>
  </div>

  <div class="pg-footer"><span>${BRAND.name} · ${escapeHtml(repo.title)}</span><span>Page 2</span></div>
</section>

<!-- ──────── TOC ──────── -->
<section class="page">
  <h1 class="page-title">Inside this e-book</h1>
  <ol class="toc">${tocItems}</ol>
  <div style="margin-top: 28px; padding: 16px; background: #f4f9f8; border-left: 5px solid ${meta.coverColor}; border-radius: 8px; font-size: 14px;">
    <strong>How to read:</strong> Skim the cluster dividers first to find what excites you,
    then deep-dive into 2–3 careers per cluster. Mark roles you would like to explore further —
    you will use that shortlist with the Srichakra Career Assessment.
  </div>
  <div class="pg-footer"><span>${BRAND.name} · ${BRAND.websiteDisplay}</span><span>Page 3</span></div>
</section>

<!-- ──────── CLUSTERS ──────── -->
${chapters}

<!-- ──────── STUDY ABROAD ──────── -->
<section class="page">
  <h1 class="page-title">🌍 Dreaming of Studying Abroad?</h1>
  <p class="lead">
    From <strong>MBBS in Russia, Georgia, Uzbekistan & the Philippines</strong> to <strong>Engineering, Business, Design and Liberal Arts</strong>
    in the UK, Germany, Ireland, Canada, Australia, USA, Singapore and the UAE — Srichakra Academy guides you end-to-end.
  </p>

  <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 22px;">
    <div style="border:1px solid #e3e3e3; border-radius:12px; padding:16px; background:#fff;">
      <h3 style="color:${meta.coverColor}; margin-bottom:8px;">🩺 MBBS Abroad</h3>
      <p style="font-size:13.5px; line-height:1.6; margin:0;">
        NMC-approved universities in <strong>Georgia & Uzbekistan</strong> · FMGE/NEXT preparation guidance ·
        transparent fee structure · hostel, food & cultural orientation. Affordable alternatives to private Indian medical colleges.
      </p>
    </div>
    <div style="border:1px solid #e3e3e3; border-radius:12px; padding:16px; background:#fff;">
      <h3 style="color:${meta.coverColor}; margin-bottom:8px;">🎓 UG / PG Courses</h3>
      <p style="font-size:13.5px; line-height:1.6; margin:0;">
        Engineering, Business, Computer Science, Data Science, Design, Nursing, Allied Health, Hospitality, Liberal Arts —
        bachelor and master programmes worldwide.
      </p>
    </div>
  </div>

  <div style="margin-top:22px; padding:18px 20px; background:linear-gradient(135deg, ${meta.coverColor} 0%, ${meta.coverColor2} 100%); color:#fff; border-radius:12px;">
    <h3 style="margin:0 0 6px; color:#fff;">Choose your destination — we will handle the rest</h3>
    <p style="margin:0; font-size:14px; opacity:0.95;">
      �🇺 Australia · 🇳🇿 New Zealand · 🇺🇸 USA · 🇬🇧 UK · 🇨🇦 Canada ·
      🇩🇪 Germany · 🇳🇱 Netherlands · 🇫🇷 France · 🇬🇪 Georgia · 🇺🇿 Uzbekistan      &nbsp;&amp; more    </p>
  </div>

  <h3 style="margin-top:26px; color:${meta.coverColor};">What our Study Abroad service includes</h3>
  <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 10px 20px; font-size:13.5px; line-height:1.7;">
    <div>✅ Country & university shortlisting</div>
    <div>✅ Course & specialisation guidance</div>
    <div>✅ Application & SOP support</div>
    <div>✅ IELTS / TOEFL / GRE / GMAT prep tie-ups</div>
    <div>✅ Scholarship & education-loan assistance</div>
    <div>✅ Visa documentation & interview prep</div>
    <div>✅ Pre-departure & travel orientation</div>
    <div>✅ Forex, accommodation & on-arrival support</div>
    <div>✅ MBBS: NMC compliance & FMGE coaching tie-ups</div>
    <div>✅ Post-study work-visa pathway counselling</div>
  </div>

  <div style="margin-top:24px; text-align:center; padding:16px 18px; background:#fff9e6; border:2px dashed ${meta.accent}; border-radius:12px;">
    <p style="margin:0; font-size:15px; line-height:1.6;">
      📞 Talk to our Study Abroad counsellor:
      <strong style="color:${meta.coverColor};">${BRAND.phones.join(' &nbsp;·&nbsp; ')}</strong><br/>
      🌐 <strong>${BRAND.websiteDisplay}</strong> &nbsp;·&nbsp; ✉️ <strong>${BRAND.email}</strong>
    </p>
  </div>

  <div class="pg-footer"><span>${BRAND.name} · Study Abroad Guidance</span><span>Choose your destination</span></div>
</section>

<!-- ──────── CTA ──────── -->
<section class="page cta-page">
  <h1 class="page-title" style="text-align:center; border:none;">Your next step</h1>
  <p class="lead" style="text-align:center; margin: 0 auto 14px;">
    Reading about careers is step 1. Knowing which careers fit <em>you</em> is step 2.
  </p>

  <div class="cta-card">
    <h2>Take the Srichakra Career Assessment</h2>
    <p>A research-grade assessment that maps your <strong>Multiple Intelligences</strong>,
    <strong>Aptitudes</strong>, <strong>Interests</strong>, <strong>Work Interests</strong> and <strong>Personality</strong>
    against ${totalCareers}+ Indian career pathways.</p>

    <p style="margin-top: 14px;">Use this coupon at checkout to save <strong>₹500</strong>:</p>
    <div class="coupon">${meta.coupon}</div>

    <p style="font-size: 13px; color: #666;">Valid for 60 days from purchase of this e-book.</p>
    <a class="cta-button" href="${BRAND.website}">Visit ${BRAND.websiteDisplay} →</a>
  </div>

  <div style="display:flex; align-items:center; justify-content:center; gap:18px; margin-top:24px;">
    ${LOGO_DATA_URI ? `<img src="${LOGO_DATA_URI}" alt="${BRAND.name}" style="width:120px; height:120px; object-fit:contain;" />` : ''}
    <div style="text-align:left;">
      <div style="font-size:22px; font-weight:800; color:${meta.coverColor};">${BRAND.name}</div>
      <div style="font-size:14px; color:#555; margin-top:4px;">${BRAND.tagline}</div>
    </div>
  </div>

  <div style="text-align:center; margin-top: 22px; font-size: 14px; color: #333; line-height:2;">
    <div>🌐 <strong>${BRAND.websiteDisplay}</strong></div>
    <div>📞 <strong>${BRAND.phones.join('</strong> &nbsp;·&nbsp; <strong>')}</strong></div>
    <div>✉️ <strong>${BRAND.email}</strong></div>
    <div>📷 Instagram <strong>${BRAND.instagram.handle}</strong> &nbsp;·&nbsp; 💼 LinkedIn <strong>${BRAND.linkedin.handle}</strong></div>
  </div>

  <div class="pg-footer"><span>© ${new Date().getFullYear()} ${BRAND.name} · All rights reserved</span><span>Coupon: ${meta.coupon}</span></div>
</section>

</body>
</html>`;
}

function renderCluster(cluster, idx, meta) {
  const skills = (cluster.keySkills || []).map(s => `<span>${escapeHtml(s)}</span>`).join('');

  const cards = cluster.pathways
    .map(p => {
      const neetBadge = p.neetRequired === false
        ? '<span class="badge badge-neet">NEET NOT REQUIRED</span>'
        : '';
      return `
      <div class="career-card">
        <div class="role-head">
          <div>
            <h3>${escapeHtml(p.role)}</h3>
            <p class="desc">${escapeHtml(p.description)}</p>
          </div>
          <div class="badges">
            <span class="badge badge-growth-${p.growthOutlook}">${escapeHtml(p.growthOutlook)} growth</span>
            <span class="badge badge-cat">${escapeHtml(p.category)}</span>
            ${neetBadge}
          </div>
        </div>
        <div class="meta-grid">
          <div><strong>Qualifications</strong>${(p.qualifications || []).map(escapeHtml).join(' · ')}</div>
          <div><strong>Entrance Exams</strong>${(p.entranceExams || []).map(escapeHtml).join(' · ')}</div>
          <div><strong>Top Institutions</strong>${(p.topInstitutions || []).map(escapeHtml).join(' · ')}</div>
          <div><strong>Eligible Streams</strong>${(p.eligibleStreams || []).map(escapeHtml).join(' · ')}</div>
        </div>
        <div class="salary-row">
          <span>Typical salary range (India)</span>
          <strong>${escapeHtml(p.salaryRange)}</strong>
        </div>
      </div>`;
    })
    .join('');

  return `
<section class="page chapter-divider">
  <div class="ch-no">CHAPTER ${String(idx).padStart(2, '0')}</div>
  <h2>${cluster.icon} ${escapeHtml(cluster.name)}</h2>
  <p class="ch-desc">${escapeHtml(cluster.description)}</p>
  <div class="ch-skills">${skills}</div>
</section>

<section class="page">
  <h1 class="page-title">${cluster.icon} ${escapeHtml(cluster.name)}</h1>
  ${cards}
  <div class="pg-footer"><span>${BRAND.name} · Chapter ${idx} · ${escapeHtml(cluster.name)}</span><span>${cluster.pathways.length} careers</span></div>
</section>`;
}

// ───────────────── Main ─────────────────
async function main() {
  const args = process.argv.slice(2);
  const targets = args.length
    ? EBOOK_CATALOG.filter(b => args.includes(b.key))
    : EBOOK_CATALOG;

  if (!targets.length) {
    console.error('No matching e-book keys. Available:', EBOOK_CATALOG.map(b => b.key).join(', '));
    process.exit(1);
  }

  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  console.log('📚 Loading career repositories...');
  const data = await loadRepoData();

  for (const meta of targets) {
    const repo = data[meta.exportName];
    if (!repo) {
      console.warn(`⚠  ${meta.exportName} not found, skipping.`);
      continue;
    }
    const html = renderEbook(repo, meta);
    const outPath = join(OUT_DIR, `${meta.file}.html`);
    writeFileSync(outPath, html, 'utf8');
    const careers = repo.clusters.reduce((n, c) => n + c.pathways.length, 0);
    console.log(`✅ ${meta.file}.html  ·  ${repo.clusters.length} clusters · ${careers} careers · ${meta.price}`);
  }

  console.log(`\n📂 Output: ${OUT_DIR}`);
  console.log('💡 Open any .html in Chrome → Ctrl+P → "Save as PDF" (Margins: None, Background graphics: ON)');
}

main().catch(err => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});
