/**
 * SCORING ENGINE — Srichakra Career Assessment
 *
 * Converts raw student answers into the full ReportData object
 * consumed by reportTemplate.tsx.
 *
 * Input:  { aptitudeAnswers: Record<questionId, selectedIndex>, preferenceAnswers: Record<questionId, likertValue> }
 * Output: ReportData
 */

import {
  APTITUDE_QUESTIONS,
  PREFERENCE_QUESTIONS,
  TOTAL_QUESTIONS,
  AptitudeQuestion,
  AptitudeDomain,
  PreferenceDomain,
} from '../data/questionBank';
import type { ReportData } from '../pages/reportTemplate';
import { CAREER_CLUSTERS, scoreClusterMatch } from '../data/careerClusters';
import { estimateAbility, abilityStandardError } from './irt';

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

export interface RawAnswers {
  studentName: string;
  /** questionId → selected option index (0-based) */
  aptitude: Record<number, number>;
  /** questionId → likert value (1-5) */
  preference: Record<number, number>;
}

// ────────────────────────────────────────────
// Aptitude Scoring (IRT-based)
// ────────────────────────────────────────────

interface AptitudeResult {
  domain: AptitudeDomain;
  theta: number; // The student's estimated ability level (-3 to 3)
  score: number; // A user-friendly percentile score (0-100)
  /** Approx. 95% confidence interval on `score` (percentile points). */
  scoreCi95: { low: number; high: number };
  /** Number of items the student actually answered for this domain. */
  itemsAnswered: number;
  /** True when the 95% CI is too wide (>40 pts) for the score to be trusted. */
  lowInformation: boolean;
  level: 'Developing' | 'Moderate' | 'Strong' | 'Exceptional';
  readiness: 'EXPLORATORY' | 'WITH DEVELOPMENT' | 'READY NOW';
  skills: string;
}

const APTITUDE_SKILLS: Record<AptitudeDomain, string> = {
  'Numerical Reasoning': 'Calculations, data interpretation, number patterns',
  'Logical Reasoning': 'Pattern recognition, sequencing, deduction',
  'Verbal Ability': 'Reading comprehension, vocabulary, grammar',
  'Spatial Intelligence': 'Visual-spatial reasoning, mental rotation, design',
};

/**
 * Converts a theta score (from IRT, typically -3 to +3) to a more intuitive
 * percentile-like score (0-100) using a standard normal distribution's CDF.
 */
function thetaToPercentile(theta: number): number {
  // A simplified error function approximation for the CDF of a normal distribution
  const erf = (x: number) => {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;
    const sign = x >= 0 ? 1 : -1;
    const t = 1.0 / (1.0 + p * Math.abs(x));
    const poly = t * (a1 + t * (a2 + t * (a3 + t * (a4 + t * a5))));
    const result = 1.0 - poly * Math.exp(-x * x);
    return sign * result;
  };

  const cdf = 0.5 * (1 + erf(theta / Math.sqrt(2)));
  return Math.round(cdf * 100);
}


function scoreAptitude(answers: Record<number, number>): AptitudeResult[] {
  const domains: AptitudeDomain[] = [
    'Numerical Reasoning',
    'Logical Reasoning',
    'Verbal Ability',
    'Spatial Intelligence',
  ];

  return domains.map((domain) => {
    const domainQuestions = APTITUDE_QUESTIONS.filter((q) => q.domain === domain);

    const domainAnswers = domainQuestions.map(q => ({
      question: q,
      isCorrect: answers[q.id] === q.correctIndex,
    })).filter(a => answers.hasOwnProperty(a.question.id)); // Only include answered questions

    // Estimate ability (theta) using the IRT engine
    const theta = estimateAbility(domainAnswers);
    const score = thetaToPercentile(theta);
    const se = abilityStandardError(theta, domainAnswers);
    const ciLowTheta = theta - 1.96 * se;
    const ciHighTheta = theta + 1.96 * se;
    const scoreCi95 = {
      low: thetaToPercentile(ciLowTheta),
      high: thetaToPercentile(ciHighTheta),
    };

    // Level bands aligned to the conventional z-score percentile cuts used by
    // Wechsler-style ability batteries: 98 (~+2σ, very superior), 84 (~+1σ,
    // above average), 50 (mean). Anything below the mean is flagged for
    // development, which is the appropriate stance for a career assessment.
    const level =
      score >= 98 ? 'Exceptional' : score >= 84 ? 'Strong' : score >= 50 ? 'Moderate' : 'Developing';
    const readiness =
      score >= 84 ? 'READY NOW' : score >= 50 ? 'WITH DEVELOPMENT' : 'EXPLORATORY';
    // If the 95% CI spans more than 40 percentile points the score is mostly
    // measurement noise — too few items answered, or items at wrong difficulty.
    const lowInformation = scoreCi95.high - scoreCi95.low > 40;

    return {
      domain,
      theta,
      score,
      scoreCi95,
      itemsAnswered: domainAnswers.length,
      lowInformation,
      level,
      readiness,
      skills: APTITUDE_SKILLS[domain],
    };
  });
}

// ────────────────────────────────────────────
// Preference Scoring
// ────────────────────────────────────────────

function scorePreferences(answers: Record<number, number>) {
  // Group answers by preference domain
  const domainScores: Record<string, number[]> = {};

  // Internal-only domains that should not appear in the RIASEC/MI prefScore list
  const excluded = new Set<string>([
    'Consistency', 'AttentionCheck',
    'MBTI_EI', 'MBTI_SN', 'MBTI_TF', 'MBTI_JP',
  ]);

  for (const q of PREFERENCE_QUESTIONS) {
    if (excluded.has(q.domain)) continue;
    const val = answers[q.id];
    if (val == null) continue;
    if (!domainScores[q.domain]) domainScores[q.domain] = [];
    domainScores[q.domain].push(val);
  }

  // Calculate average per domain (1-5 scale)
  const results: { domain: string; score: number; maxScore: number }[] = [];
  for (const [domain, values] of Object.entries(domainScores)) {
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    results.push({
      domain,
      score: Math.round(avg * 10) / 10, // 1 decimal
      maxScore: 5,
    });
  }

  return results.sort((a, b) => b.score - a.score);
}

// ────────────────────────────────────────────
// RIASEC Mapping
// ────────────────────────────────────────────
// Map our preference domains to RIASEC codes for the report template

function mapToRIASEC(prefScores: { domain: string; score: number; maxScore: number }[]) {
  const riasecMapping: Record<string, string> = {
    'Technical': 'Realistic',
    'Analytical': 'Investigative',
    'Creative': 'Artistic',
    'Social': 'Social',
    'Executive': 'Enterprising',
    'Conscientiousness': 'Conventional',
  };

  const riasec: { domain: string; score: number; maxScore: number }[] = [];

  for (const pref of prefScores) {
    const riasecDomain = riasecMapping[pref.domain];
    if (riasecDomain) {
      riasec.push({ domain: riasecDomain, score: pref.score, maxScore: 5 });
    }
  }

  return riasec.sort((a, b) => b.score - a.score);
}

// ────────────────────────────────────────────
// Derived: Learning Styles
// ────────────────────────────────────────────

function deriveLearningStyles(answers: Record<number, number>): string[] {
  // Questions 343-348 map to specific learning style indicators
  const styleMap: Record<number, string> = {
    343: 'Visual',
    344: 'Auditory',
    345: 'Kinesthetic',
    346: 'Reflective',
    347: 'Sequential',
    348: 'Social',
  };

  const styles: { name: string; score: number }[] = [];
  for (const [qId, name] of Object.entries(styleMap)) {
    const val = answers[Number(qId)] || 3;
    styles.push({ name, score: val });
  }

  styles.sort((a, b) => b.score - a.score);
  return styles.slice(0, 2).map((s) => s.name);
}

// ────────────────────────────────────────────
// Derived: Multiple Intelligence Distribution (Gardner)
// ────────────────────────────────────────────
// Composite view ONLY for the MI distribution chart & learning-style insight.
// MI is intentionally NOT used in stream / course-family / career-cluster scoring.

function deriveMIScores(
  aptitude: AptitudeResult[],
  prefScores: { domain: string; score: number }[],
  rawPref: Record<number, number>
): { name: string; score: number }[] {
  const apt = (d: string) => aptitude.find((a) => a.domain === d)?.score ?? 0;
  const pref = (d: string) => {
    const p = prefScores.find((x) => x.domain === d);
    return p ? (p.score / 5) * 100 : 0;
  };
  // Kinesthetic learning-style indicator (question 345) on a 1-5 scale
  const kinesthetic = ((rawPref[345] ?? 3) / 5) * 100;

  const avg = (...xs: number[]) => Math.round(xs.reduce((s, v) => s + v, 0) / xs.length);

  return [
    { name: 'Linguistic',         score: avg(apt('Verbal Ability'), pref('Verbal')) },
    { name: 'Logical-Mathematical', score: avg(apt('Numerical Reasoning'), apt('Logical Reasoning'), pref('Analytical')) },
    { name: 'Visual-Spatial',     score: avg(apt('Spatial Intelligence'), pref('Creative')) },
    { name: 'Musical',            score: Math.round(pref('Musical')) },
    { name: 'Bodily-Kinesthetic', score: Math.round(kinesthetic) },
    { name: 'Interpersonal',      score: Math.round(pref('Social')) },
    { name: 'Intrapersonal',      score: Math.round(pref('Conscientiousness')) },
    { name: 'Naturalistic',       score: Math.round(pref('Naturalistic')) },
  ];
}

// ────────────────────────────────────────────
// Derived: Brain Hemisphere
// ────────────────────────────────────────────

function deriveDominantHemisphere(
  aptitude: AptitudeResult[],
  prefScores: { domain: string; score: number }[]
): string {
  // Left-brain indicators: Numerical, Logical, Analytical, Verbal, Conscientiousness
  // Right-brain indicators: Spatial, Creative, Musical, Naturalistic
  const leftDomains = ['Numerical Reasoning', 'Logical Reasoning', 'Verbal Ability'];
  const rightDomains = ['Spatial Intelligence'];

  let leftScore = 0;
  let rightScore = 0;

  for (const a of aptitude) {
    if (leftDomains.includes(a.domain)) leftScore += a.score;
    if (rightDomains.includes(a.domain)) rightScore += a.score;
  }

  // Scale right score up since it has fewer domains
  rightScore *= 3;

  const leftPrefs = ['Analytical', 'Verbal', 'Conscientiousness', 'Executive'];
  const rightPrefs = ['Creative', 'Musical', 'Naturalistic'];

  for (const p of prefScores) {
    if (leftPrefs.includes(p.domain)) leftScore += p.score * 10;
    if (rightPrefs.includes(p.domain)) rightScore += p.score * 10;
  }

  if (Math.abs(leftScore - rightScore) < 20) return 'Balanced';
  return leftScore > rightScore ? 'Left' : 'Right';
}

// ────────────────────────────────────────────
// Derived: Stream Recommendations
// ────────────────────────────────────────────

function deriveStreamRecommendations(aptitude: AptitudeResult[]) {
  const getScore = (domain: string) =>
    aptitude.find((a) => a.domain === domain)?.score || 0;

  const num = getScore('Numerical Reasoning');
  const log = getScore('Logical Reasoning');
  const ver = getScore('Verbal Ability');
  const spa = getScore('Spatial Intelligence');

  // Science readiness
  const scienceAvg = Math.round((num + log + spa) / 3);
  const scienceReadiness =
    scienceAvg >= 70 ? 'READY NOW' : scienceAvg >= 50 ? 'WITH DEVELOPMENT' : 'EXPLORATORY';

  // Commerce readiness
  const commerceAvg = Math.round((num + ver + log) / 3);
  const commerceReadiness =
    commerceAvg >= 70 ? 'READY NOW' : commerceAvg >= 50 ? 'WITH DEVELOPMENT' : 'EXPLORATORY';

  // Arts readiness
  const artsAvg = Math.round((ver + log) / 2);
  const artsReadiness =
    artsAvg >= 70 ? 'READY NOW' : artsAvg >= 50 ? 'WITH DEVELOPMENT' : 'EXPLORATORY';

  return [
    {
      stream: 'Science',
      readiness: scienceReadiness,
      match: `Numerical (${num}) + Logical (${log}) + Spatial (${spa})`,
      confidence: scienceAvg,
      guidance:
        scienceReadiness === 'READY NOW'
          ? 'Strong fit for PCM; consider PCB if biology interest is high.'
          : scienceReadiness === 'WITH DEVELOPMENT'
          ? 'Science is achievable with focused practice in numerical and logical reasoning.'
          : 'Science stream may require significant support; consider alternatives.',
      reason: `Based on numerical (${num}%), logical (${log}%), and spatial (${spa}%) aptitude`,
    },
    {
      stream: 'Commerce',
      readiness: commerceReadiness,
      match: `Numerical (${num}) + Verbal (${ver}) + Logical (${log})`,
      confidence: commerceAvg,
      guidance:
        commerceReadiness === 'READY NOW'
          ? 'Good fit with Maths option; supports business/economics pathways.'
          : commerceReadiness === 'WITH DEVELOPMENT'
          ? 'Commerce is viable with strengthened numerical and verbal skills.'
          : 'Commerce may require significant development; explore with support.',
      reason: `Based on numerical (${num}%), verbal (${ver}%), and logical (${log}%) aptitude`,
    },
    {
      stream: 'Arts / Humanities',
      readiness: artsReadiness,
      match: `Verbal (${ver}) + Logical (${log})`,
      confidence: artsAvg,
      guidance:
        artsReadiness === 'READY NOW'
          ? 'Strong verbal and reasoning abilities support humanities depth.'
          : artsReadiness === 'WITH DEVELOPMENT'
          ? 'Viable with verbal strengths; explore economics, psychology, or political science.'
          : 'Arts pathway benefits from stronger verbal and analytical development.',
      reason: `Based on verbal (${ver}%) and logical (${log}%) aptitude`,
    },
  ].map((s, _, arr) => {
    // Tie-zone: streams within 5 confidence pts of the leader are equally viable.
    const top = Math.max(...arr.map((x) => x.confidence));
    return { ...s, tied: top - s.confidence <= 5 };
  });
}

// ────────────────────────────────────────────
// Derived: Course Family Recommendations
// ────────────────────────────────────────────

/**
 * Compute a small MBTI fit bonus (-5..+5) for a target type pattern.
 * Each axis preference adds up to ±1.25 weighted by the student's strength on that axis.
 * Use '*' on any axis to indicate "neutral / either pole acceptable".
 */
function mbtiFitBonus(target: { EI?: 'E'|'I'|'*'; SN?: 'S'|'N'|'*'; TF?: 'T'|'F'|'*'; JP?: 'J'|'P'|'*' }, mbti: MBTIResult): number {
  let bonus = 0;
  for (const axis of mbti.axes) {
    const want = target[axis.axis];
    if (!want || want === '*') continue;
    // strengthFactor: 0..1 where 0 = balanced, 1 = max leaning
    const strengthFactor = (axis.strength - 50) / 50;
    bonus += axis.leaning === want ? +1.25 * strengthFactor : -1.25 * strengthFactor;
  }
  // Cap at ±5 points (strict — MBTI is one input among several)
  return Math.max(-5, Math.min(5, Math.round(bonus * 4)));
}

function deriveCourseFamilies(
  aptitude: AptitudeResult[],
  prefScores: { domain: string; score: number }[],
  mbti: MBTIResult,
) {
  const getApt = (domain: string) =>
    aptitude.find((a) => a.domain === domain)?.score || 0;

  // Helper to get average score for a set of preference domains
  const getPrefAvg = (domains: string[]) => {
    const scores = prefScores.filter(p => domains.includes(p.domain)).map(p => p.score);
    if (scores.length === 0) return 2.5; // Return neutral score if no domains match
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  };

  // 50% Aptitude, 30% Personality (RIASEC-aligned), 20% Interest (RIASEC-aligned)
  // + small MBTI fit bonus (±5 pts).
  // MI domains (Naturalistic, Musical, Entrepreneurial) remain excluded from this scoring.
  const calcScore = (aptDomains: string[], persDomains: string[], intDomains: string[]) => {
    const aptAvg = aptDomains.length > 0 ? aptDomains.reduce((sum, d) => sum + getApt(d), 0) / aptDomains.length : 0;
    const persAvg = getPrefAvg(persDomains);
    const intAvg = getPrefAvg(intDomains);

    const aptComponent = aptAvg * 0.5;
    const persComponent = (persAvg / 5) * 100 * 0.3;
    const intComponent = (intAvg / 5) * 100 * 0.2;

    return aptComponent + persComponent + intComponent;
  };

  const getAlignment = (score: number) =>
    score >= 70 ? 'READY NOW' : score >= 50 ? 'WITH DEVELOPMENT' : 'EXPLORATORY';

  // Per-family MBTI pattern preferences. Use '*' for "either pole works".
  const familyDefs: {
    family: string;
    strengths: string;
    apt: string[]; pers: string[]; int: string[];
    mbti: { EI?: 'E'|'I'|'*'; SN?: 'S'|'N'|'*'; TF?: 'T'|'F'|'*'; JP?: 'J'|'P'|'*' };
    guidance: string; courses: string[];
  }[] = [
    {
      family: 'Engineering / Technology',
      strengths: 'Numerical, Logical, Spatial',
      apt: ['Numerical Reasoning', 'Logical Reasoning', 'Spatial Intelligence'],
      pers: ['Analytical'], int: ['Technical'],
      mbti: { SN: '*', TF: 'T', JP: 'J', EI: '*' },
      guidance: 'Requires strong quantitative and logical base.',
      courses: ['Computer Science', 'Electronics', 'Mechanical', 'Civil'],
    },
    {
      family: 'Data Science & Analytics',
      strengths: 'Numerical, Logical',
      apt: ['Numerical Reasoning', 'Logical Reasoning'],
      pers: ['Analytical'], int: ['Technical'],
      mbti: { SN: 'N', TF: 'T', JP: 'J', EI: '*' },
      guidance: 'Demands analytical precision and pattern recognition.',
      courses: ['Statistics', 'Data Engineering', 'AI/ML', 'Business Analytics'],
    },
    {
      family: 'Medicine / Life Sciences',
      strengths: 'Numerical, Logical, Verbal',
      apt: ['Numerical Reasoning', 'Logical Reasoning', 'Verbal Ability'],
      pers: ['Analytical', 'Social'], int: ['Analytical'],
      mbti: { SN: 'S', TF: '*', JP: 'J', EI: '*' },
      guidance: 'Requires analytical precision and communication.',
      courses: ['MBBS', 'BDS', 'Pharmacy', 'Biotech'],
    },
    {
      family: 'Business / Commerce',
      strengths: 'Numerical, Verbal, Logical',
      apt: ['Numerical Reasoning', 'Verbal Ability', 'Logical Reasoning'],
      pers: ['Executive', 'Analytical'], int: ['Executive'],
      mbti: { EI: 'E', TF: '*', JP: 'J', SN: '*' },
      guidance: 'Balances quantitative analysis with communication.',
      courses: ['BBA', 'B.Com', 'Economics', 'CA'],
    },
    {
      family: 'Law / Social Sciences',
      strengths: 'Verbal, Logical',
      apt: ['Verbal Ability', 'Logical Reasoning'],
      pers: ['Verbal', 'Social'], int: [],
      mbti: { EI: '*', SN: '*', TF: '*', JP: 'J' },
      guidance: 'Requires strong argumentation and critical reading.',
      courses: ['BA LLB', 'Political Science', 'Sociology', 'Psychology'],
    },
    {
      family: 'Arts / Design / Media',
      strengths: 'Spatial, Verbal, Creative',
      apt: ['Spatial Intelligence', 'Verbal Ability'],
      pers: ['Verbal'], int: ['Creative'],
      mbti: { SN: 'N', TF: 'F', JP: 'P', EI: '*' },
      guidance: 'Values visual thinking and creative expression.',
      courses: ['B.Des', 'BFA', 'Mass Communication', 'Animation'],
    },
  ];

  const families = familyDefs.map((f) => {
    const base = calcScore(f.apt, f.pers, f.int);
    const mbtiBonus = mbti.reliable ? mbtiFitBonus(f.mbti, mbti) : 0;
    const score = Math.max(0, Math.min(100, Math.round(base + mbtiBonus)));
    return {
      family: f.family,
      strengths: f.strengths,
      score,
      alignment: getAlignment(score),
      guidance: f.guidance,
      courses: f.courses,
      fitScore: score,
      mbtiBonus,
    };
  });

  const sorted = families.sort((a, b) => b.score - a.score);
  const top = sorted[0]?.score ?? 0;
  // Tie-zone: families within 5 pts of the leader are equally viable.
  return sorted.map((f) => ({ ...f, tied: top - f.score <= 5 }));
}

// ────────────────────────────────────────────
// Derived: Career Clusters (from full repository)
// ────────────────────────────────────────────

function deriveCareerClusters(
  aptitude: AptitudeResult[],
  prefScores: { domain: string; score: number }[],
  mbti: MBTIResult,
) {
  const getApt = (domain: string) =>
    aptitude.find((a) => a.domain === domain)?.score || 0;
  const getPref = (domain: string) =>
    prefScores.find((p) => p.domain === domain)?.score || 2.5;

  // Build aptitude/preference lookup arrays for scoreClusterMatch
  const aptScores = aptitude.map((a) => ({ domain: a.domain, score: a.score }));
  const prefWithMax = prefScores.map((p) => ({ domain: p.domain, score: p.score, maxScore: 5 }));

  // Map RIASEC-aligned cluster preferenceFit -> typical MBTI poles
  const mbtiPatternFor = (prefFit: string[]): { EI?: 'E'|'I'|'*'; SN?: 'S'|'N'|'*'; TF?: 'T'|'F'|'*'; JP?: 'J'|'P'|'*' } => {
    const has = (d: string) => prefFit.includes(d);
    const pat: { EI?: 'E'|'I'|'*'; SN?: 'S'|'N'|'*'; TF?: 'T'|'F'|'*'; JP?: 'J'|'P'|'*' } = {};
    if (has('Social') || has('Verbal') || has('Executive')) pat.EI = 'E';
    if (has('Analytical') && !has('Social')) pat.EI = pat.EI ?? '*';
    if (has('Creative') || has('Analytical')) pat.SN = 'N';
    if (has('Technical') || has('Conscientiousness')) pat.SN = pat.SN === 'N' ? '*' : 'S';
    if (has('Analytical') || has('Technical')) pat.TF = 'T';
    if (has('Social') || has('Verbal') || has('Creative')) pat.TF = pat.TF === 'T' ? '*' : 'F';
    if (has('Conscientiousness') || has('Executive')) pat.JP = 'J';
    if (has('Creative')) pat.JP = pat.JP === 'J' ? '*' : 'P';
    return pat;
  };

  // Score all clusters. Prefer the cluster's curated `mbtiFit` (Holland-MBTI
  // correspondence — Tieger / Barron-Tieger; Hammer & Macdaid) and fall back to
  // the heuristic only if a cluster has no curated pattern.
  const scored = CAREER_CLUSTERS.map((cluster) => {
    const baseScore = scoreClusterMatch(cluster, aptScores, prefWithMax);
    const pattern = cluster.mbtiFit ?? mbtiPatternFor(cluster.preferenceFit);
    const bonus = mbti.reliable ? mbtiFitBonus(pattern, mbti) : 0;
    const matchScore = Math.max(0, Math.min(100, baseScore + bonus));

    const aptParts = cluster.aptitudeFit
      .map((d) => `${d} (${getApt(d)}%)`)
      .join(', ');
    const topPref = cluster.preferenceFit[0];
    const prefLevel = topPref && getPref(topPref) >= 3.5 ? 'strong' : 'moderate';
    const prefLabel = topPref ? ` with ${prefLevel} ${topPref.toLowerCase()} interest` : '';

    return {
      name: cluster.name,
      icon: cluster.icon,
      roles: cluster.pathways.slice(0, 5).map((p) => p.role),
      whyFits: `${aptParts}${prefLabel}`,
      skills: cluster.keySkills.join(', '),
      matchScore,
      mbtiBonus: bonus,
      streams: cluster.streams,
      pathways: cluster.pathways,
    };
  });

  const sorted = scored.sort((a, b) => b.matchScore - a.matchScore);
  const top = sorted[0]?.matchScore ?? 0;
  // Mark items within 5 points of the leader as tied — they should be
  // presented as equally viable rather than as a strict ranking.
  return sorted.slice(0, 3).map((c) => ({ ...c, tied: top - c.matchScore <= 5 }));
}

// ────────────────────────────────────────────
// NEW: Consistency & Reliability Check
// ────────────────────────────────────────────

function checkConsistency(answers: Record<number, number>): {
  level: 'High' | 'Medium' | 'Low';
  flags: string[];
  attentionCheckPassed: boolean;
} {
  const flags: string[] = [];
  let contradictions = 0;

  // Mirror pairs across original (361-374) and new (380-389) consistency items.
  const pairs = [
    { id1: 361, id2: 362, msg: 'Contradictory answers on teamwork vs. solo work preference.' },
    { id1: 363, id2: 364, msg: 'Contradictory answers on preference for schedule vs. spontaneity.' },
    { id1: 365, id2: 366, msg: 'Contradictory answers on creative brainstorming vs. practical tasks.' },
    { id1: 367, id2: 368, msg: 'Contradictory answers on intuitive vs. analytical decision-making.' },
    { id1: 373, id2: 374, msg: 'Contradictory answers on being outgoing vs. quiet with strangers.' },
    { id1: 380, id2: 381, msg: 'Contradictory answers on planning vs. figuring things out as you go.' },
    { id1: 382, id2: 383, msg: 'Contradictory answers on energy after social interaction.' },
    { id1: 384, id2: 385, msg: 'Contradictory answers on concrete facts vs. exploring possibilities.' },
    { id1: 386, id2: 387, msg: 'Contradictory answers on logic vs. feelings in decision-making.' },
    { id1: 388, id2: 389, msg: 'Contradictory answers on scheduled vs. flexible days.' },
  ];

  let answeredPairs = 0;
  for (const pair of pairs) {
    const a1 = answers[pair.id1];
    const a2 = answers[pair.id2];
    if (a1 !== undefined && a2 !== undefined) {
      answeredPairs++;
      const isContradictory = (a1 >= 4 && a2 >= 4) || (a1 <= 2 && a2 <= 2);
      if (isContradictory) {
        contradictions++;
        flags.push(pair.msg);
      }
    }
  }

  // Attention checks (IDs 395, 396) — answers must match expectedValue ±1
  const attentionItems = PREFERENCE_QUESTIONS.filter((q) => q.domain === 'AttentionCheck');
  let attentionFails = 0;
  let attentionAnswered = 0;
  for (const q of attentionItems) {
    const ans = answers[q.id];
    if (ans === undefined || q.expectedValue === undefined) continue;
    attentionAnswered++;
    if (Math.abs(ans - q.expectedValue) > 1) attentionFails++;
  }
  const attentionCheckPassed = attentionFails === 0;
  if (attentionFails > 0) {
    flags.push(
      `Attention check failed (${attentionFails} of ${attentionAnswered}). Responses may have been entered without careful reading.`,
    );
  }

  const contradictionRate = answeredPairs > 0 ? contradictions / answeredPairs : 0;

  // Bias level downward if attention checks fail.
  let level: 'High' | 'Medium' | 'Low';
  if (!attentionCheckPassed && attentionFails >= 2) {
    level = 'Low';
  } else if (contradictionRate === 0 && attentionCheckPassed) {
    level = 'High';
  } else if (contradictionRate <= 0.3 && attentionFails <= 1) {
    level = 'Medium';
  } else {
    level = 'Low';
  }

  return { level, flags, attentionCheckPassed };
}

// ────────────────────────────────────────────
// NEW: MBTI Scoring (16 forced-Likert items)
// ────────────────────────────────────────────

export interface MBTIAxis {
  axis: 'EI' | 'SN' | 'TF' | 'JP';
  /** The dominant pole for this student. */
  leaning: 'E' | 'I' | 'S' | 'N' | 'T' | 'F' | 'J' | 'P';
  /** 0-100 strength of that leaning vs. the opposite pole. 50 = balanced. */
  strength: number;
  /** Items used (answered) on this axis. */
  itemsAnswered: number;
}

export interface MBTIResult {
  /** 4-letter type code (e.g. 'INTJ'). */
  type: string;
  axes: MBTIAxis[];
  /** True if every axis has at least 2 items answered. */
  reliable: boolean;
}

function scoreMBTI(answers: Record<number, number>): MBTIResult {
  const axes: { axis: MBTIAxis['axis']; pos: MBTIAxis['leaning']; neg: MBTIAxis['leaning'] }[] = [
    { axis: 'EI', pos: 'E', neg: 'I' },
    { axis: 'SN', pos: 'S', neg: 'N' },
    { axis: 'TF', pos: 'T', neg: 'F' },
    { axis: 'JP', pos: 'J', neg: 'P' },
  ];

  const axisResults: MBTIAxis[] = axes.map(({ axis, pos, neg }) => {
    const items = PREFERENCE_QUESTIONS.filter(
      (q) => q.domain === `MBTI_${axis}` && q.mbtiPole !== undefined,
    );
    let net = 0; // positive = leans `pos`; negative = leans `neg`
    let answered = 0;
    for (const q of items) {
      const ans = answers[q.id];
      if (ans === undefined) continue;
      answered++;
      // (ans - 3) is in [-2, +2]. If item polarity is `neg`, flip its sign.
      const signed = q.mbtiPole === pos ? ans - 3 : -(ans - 3);
      net += signed;
    }
    const maxPossible = answered * 2; // 2 = max signed magnitude per item
    const ratio = maxPossible > 0 ? net / maxPossible : 0; // -1..+1
    // Map [-1..+1] to [0..100] strength of the leaning side (50 = balanced)
    const strength = Math.round(50 + Math.abs(ratio) * 50);
    const leaning = ratio >= 0 ? pos : neg;
    return { axis, leaning, strength, itemsAnswered: answered };
  });

  const type = axisResults.map((a) => a.leaning).join('');
  const reliable = axisResults.every((a) => a.itemsAnswered >= 2);

  return { type, axes: axisResults, reliable };
}


// ────────────────────────────────────────────
// MAIN: Build ReportData from raw answers
// ────────────────────────────────────────────

export function buildReportFromAnswers(raw: RawAnswers): ReportData {
  const aptitudeResults = scoreAptitude(raw.aptitude);
  const prefResults = scorePreferences(raw.preference);
  const riasecScores = mapToRIASEC(prefResults);
  const learningStyles = deriveLearningStyles(raw.preference);
  const hemisphere = deriveDominantHemisphere(aptitudeResults, prefResults);
  const miScores = deriveMIScores(aptitudeResults, prefResults, raw.preference);
  const mbti = scoreMBTI(raw.preference);
  const streams = deriveStreamRecommendations(aptitudeResults);
  const families = deriveCourseFamilies(aptitudeResults, prefResults, mbti);
  const clusters = deriveCareerClusters(aptitudeResults, prefResults, mbti);
  const consistency = checkConsistency(raw.preference);

  const totalAnswered =
    Object.keys(raw.aptitude).length + Object.keys(raw.preference).length;
  const completionRate =
    TOTAL_QUESTIONS > 0 ? Math.round((totalAnswered / TOTAL_QUESTIONS) * 100) : 0;

  return {
    studentName: raw.studentName,
    assessmentDate: new Date().toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    aptitudeScores: aptitudeResults,
    preferenceScores: riasecScores,
    dominantHemisphere: hemisphere,
    learningStyles,
    miScores,
    mbti,
    streamRecommendations: streams,
    courseFamilyRecommendations: families,
    careerClusters: clusters,
    totalAnswered,
    completionRate,
    consistency,
  };
}
