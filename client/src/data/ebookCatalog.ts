/**
 * E-book Catalog (client-side)
 *
 * Single source of truth for the public e-book funnel
 * (FB ad → /ebooks → checkout → Razorpay → download + assessment CTA).
 *
 * Keep keys / prices in sync with `functions/index.js` EBOOK_CATALOG and
 * with `ebooks/build-ebook.mjs` so URLs / pricing never drift.
 */

export interface EbookCatalogItem {
  /** URL slug — used in /ebooks/checkout/:key */
  key: string;
  /** Display title shown on cards & checkout */
  title: string;
  /** One-liner shown under title */
  subtitle: string;
  /** Long blurb shown on the checkout page */
  description: string;
  /** Hero icon / emoji */
  icon: string;
  /** Number of careers covered (display only) */
  careers: number;
  /** Number of clusters covered (display only) */
  clusters: number;
  /** Price in Rupees (whole number) */
  priceRupees: number;
  /** ₹500 OFF coupon for full assessment, emailed after payment */
  assessmentCoupon: string;
  /** File name (without extension) of the HTML/PDF in /ebooks/output */
  fileSlug: string;
  /** Brand colour */
  coverColor: string;
  /** Accent colour */
  accent: string;
  /** Audience tag for targeting */
  audience: string;
}

export const EBOOK_CATALOG: EbookCatalogItem[] = [
  {
    key: 'health',
    title: 'Health Sector Beyond NEET',
    subtitle: '30+ healthcare careers that do NOT require NEET',
    description:
      'Physiotherapy, Allied Health, Hospital Admin, Public Health, Biotech, Health Tech, Nutrition, Pharma — every rewarding healthcare path that does not need a NEET rank.',
    icon: '🏥',
    careers: 30,
    clusters: 6,
    priceRupees: 99,
    assessmentCoupon: 'NEETFREE500',
    fileSlug: 'health-beyond-neet',
    coverColor: '#0a7c6e',
    accent: '#ffb84d',
    audience: 'Class 9–12 students who like biology but are unsure about NEET',
  },
  {
    key: 'fintech',
    title: 'FinTech & Commerce',
    subtitle: '28 careers at the intersection of finance, technology & business',
    description:
      'UPI product managers, equity research, algo trading, blockchain, RegTech, actuarial, CA, CFA, investment banking and more — for ambitious Commerce and PCM students.',
    icon: '💳',
    careers: 28,
    clusters: 7,
    priceRupees: 99,
    assessmentCoupon: 'FINTECH500',
    fileSlug: 'fintech-and-commerce',
    coverColor: '#1d3557',
    accent: '#f1c40f',
    audience: 'Commerce + PCM students aiming for finance / business careers',
  },
  {
    key: 'future',
    title: 'Future-Ready Tech & Green Careers',
    subtitle: '47 emerging careers in AI, Cyber, Drones, EV, Space & Climate',
    description:
      'AI/ML engineering, cybersecurity, space-tech, drones, electric vehicles, climate tech, green hydrogen — the careers that did not exist 10 years ago and will dominate the next 20.',
    icon: '🚀',
    careers: 47,
    clusters: 9,
    priceRupees: 199,
    assessmentCoupon: 'FUTURE500',
    fileSlug: 'future-ready-tech-and-green',
    coverColor: '#5b2a86',
    accent: '#7ee8c2',
    audience: 'Future-focused students & ambitious parents',
  },
  {
    key: 'engineering',
    title: 'Engineering & IT Careers',
    subtitle: '32 proven career paths across Civil, Mech, EEE, ECE, CSE & Chemical',
    description:
      'PSU engineering jobs, software engineering, semiconductor design, structural engineering, automotive, aerospace, chemical and more — every reliable engineering route after JEE / state CETs.',
    icon: '⚙️',
    careers: 32,
    clusters: 7,
    priceRupees: 149,
    assessmentCoupon: 'ENGG500',
    fileSlug: 'engineering-and-it',
    coverColor: '#0b3d91',
    accent: '#ff8c42',
    audience: 'PCM students, JEE aspirants, parents evaluating engineering branches',
  },
  {
    key: 'arts',
    title: 'Arts & Humanities Careers',
    subtitle: '35 powerful careers for Psychology, Civil Services, Law, Media, Design',
    description:
      'IAS / IPS, lawyers, judges, psychologists, journalists, foreign-language specialists, designers, professors, UN / NGO professionals — the careers that prove Arts is anything but a fallback.',
    icon: '🎭',
    careers: 35,
    clusters: 8,
    priceRupees: 99,
    assessmentCoupon: 'ARTS500',
    fileSlug: 'arts-and-humanities',
    coverColor: '#a83246',
    accent: '#ffd166',
    audience: 'Arts / Humanities / Commerce students & parents',
  },
];

export function getEbook(key: string): EbookCatalogItem | undefined {
  return EBOOK_CATALOG.find((e) => e.key === key);
}
