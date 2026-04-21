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
  type AptitudeDomain,
  type PreferenceDomain,
} from '../data/questionBank';
import type { ReportData } from '../pages/reportTemplate';
import { CAREER_CLUSTERS, scoreClusterMatch } from '../data/careerClusters';

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
// Aptitude Scoring
// ────────────────────────────────────────────

interface AptitudeResult {
  domain: string;
  score: number;       // percentage 0-100
  maxScore: number;
  correct: number;
  total: number;
  skills: string;
  level: string;
  readiness: string;
}

const APTITUDE_SKILLS: Record<AptitudeDomain, string> = {
  'Numerical Reasoning': 'Calculations, data interpretation, number patterns',
  'Logical Reasoning': 'Pattern recognition, sequencing, deduction',
  'Verbal Ability': 'Reading comprehension, vocabulary, grammar',
  'Spatial Intelligence': 'Visual-spatial reasoning, mental rotation, design',
};

function scoreAptitude(answers: Record<number, number>): AptitudeResult[] {
  const domains: AptitudeDomain[] = [
    'Numerical Reasoning',
    'Logical Reasoning',
    'Verbal Ability',
    'Spatial Intelligence',
  ];

  return domains.map((domain) => {
    const qs = APTITUDE_QUESTIONS.filter((q) => q.domain === domain);
    const total = qs.length;
    const correct = qs.filter(
      (q) => answers[q.id] === q.correctIndex
    ).length;
    const score = Math.round((correct / total) * 100);
    const level =
      score >= 75 ? 'Strong' : score >= 50 ? 'Moderate' : 'Developing';
    const readiness =
      score >= 75 ? 'READY NOW' : score >= 50 ? 'WITH DEVELOPMENT' : 'EXPLORATORY';

    return {
      domain,
      score,
      maxScore: 100,
      correct,
      total,
      skills: APTITUDE_SKILLS[domain],
      level,
      readiness,
    };
  });
}

// ────────────────────────────────────────────
// Preference Scoring
// ────────────────────────────────────────────

function scorePreferences(answers: Record<number, number>) {
  // Group answers by preference domain
  const domainScores: Record<string, number[]> = {};

  for (const q of PREFERENCE_QUESTIONS) {
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
  ];
}

// ────────────────────────────────────────────
// Derived: Course Family Recommendations
// ────────────────────────────────────────────

function deriveCourseFamilies(
  aptitude: AptitudeResult[],
  prefScores: { domain: string; score: number }[]
) {
  const getApt = (domain: string) =>
    aptitude.find((a) => a.domain === domain)?.score || 0;

  // Define domain groupings for the 50/30/20 split
  const interestDomains = ['Creative', 'Technical', 'Naturalistic', 'Musical', 'Entrepreneurial'];
  const personalityMiDomains = ['Analytical', 'Verbal', 'Social', 'Executive', 'Conscientiousness'];

  // Helper to get average score for a set of preference domains
  const getPrefAvg = (domains: string[]) => {
    const scores = prefScores.filter(p => domains.includes(p.domain)).map(p => p.score);
    if (scores.length === 0) return 2.5; // Return neutral score if no domains match
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  };

  // 50% Aptitude, 30% Personality/MI, 20% Interest
  const calcScore = (aptDomains: string[], persDomains: string[], intDomains: string[]) => {
    const aptAvg = aptDomains.length > 0 ? aptDomains.reduce((sum, d) => sum + getApt(d), 0) / aptDomains.length : 0;
    const persAvg = getPrefAvg(persDomains);
    const intAvg = getPrefAvg(intDomains);

    const aptComponent = aptAvg * 0.5;
    const persComponent = (persAvg / 5) * 100 * 0.3;
    const intComponent = (intAvg / 5) * 100 * 0.2;

    return Math.round(aptComponent + persComponent + intComponent);
  };

  const getAlignment = (score: number) =>
    score >= 70 ? 'READY NOW' : score >= 50 ? 'WITH DEVELOPMENT' : 'EXPLORATORY';

  const families = [
    {
      family: 'Engineering / Technology',
      strengths: 'Numerical, Logical, Spatial',
      score: calcScore(['Numerical Reasoning', 'Logical Reasoning', 'Spatial Intelligence'], ['Analytical'], ['Technical']),
      alignment: '',
      guidance: 'Requires strong quantitative and logical base.',
      courses: ['Computer Science', 'Electronics', 'Mechanical', 'Civil'],
      fitScore: 0,
    },
    {
      family: 'Data Science & Analytics',
      strengths: 'Numerical, Logical',
      score: calcScore(['Numerical Reasoning', 'Logical Reasoning'], ['Analytical'], ['Technical']),
      alignment: '',
      guidance: 'Demands analytical precision and pattern recognition.',
      courses: ['Statistics', 'Data Engineering', 'AI/ML', 'Business Analytics'],
      fitScore: 0,
    },
    {
      family: 'Medicine / Life Sciences',
      strengths: 'Numerical, Logical, Verbal',
      score: calcScore(['Numerical Reasoning', 'Logical Reasoning', 'Verbal Ability'], ['Analytical', 'Social'], ['Naturalistic']),
      alignment: '',
      guidance: 'Requires analytical precision and communication.',
      courses: ['MBBS', 'BDS', 'Pharmacy', 'Biotech'],
      fitScore: 0,
    },
    {
      family: 'Business / Commerce',
      strengths: 'Numerical, Verbal, Logical',
      score: calcScore(['Numerical Reasoning', 'Verbal Ability', 'Logical Reasoning'], ['Executive', 'Analytical'], ['Entrepreneurial']),
      alignment: '',
      guidance: 'Balances quantitative analysis with communication.',
      courses: ['BBA', 'B.Com', 'Economics', 'CA'],
      fitScore: 0,
    },
    {
      family: 'Law / Social Sciences',
      strengths: 'Verbal, Logical',
      score: calcScore(['Verbal Ability', 'Logical Reasoning'], ['Verbal', 'Social'], []),
      alignment: '',
      guidance: 'Requires strong argumentation and critical reading.',
      courses: ['BA LLB', 'Political Science', 'Sociology', 'Psychology'],
      fitScore: 0,
    },
    {
      family: 'Arts / Design / Media',
      strengths: 'Spatial, Verbal, Creative',
      score: calcScore(['Spatial Intelligence', 'Verbal Ability'], ['Verbal'], ['Creative', 'Musical']),
      alignment: '',
      guidance: 'Values visual thinking and creative expression.',
      courses: ['B.Des', 'BFA', 'Mass Communication', 'Animation'],
      fitScore: 0,
    },
  ];

  // Assign alignment and fitScore
  for (const f of families) {
    f.alignment = getAlignment(f.score);
    f.fitScore = f.score;
  }

  return families.sort((a, b) => b.score - a.score);
}

// ────────────────────────────────────────────
// Derived: Career Clusters (from full repository)
// ────────────────────────────────────────────

function deriveCareerClusters(
  aptitude: AptitudeResult[],
  prefScores: { domain: string; score: number }[]
) {
  const getApt = (domain: string) =>
    aptitude.find((a) => a.domain === domain)?.score || 0;
  const getPref = (domain: string) =>
    prefScores.find((p) => p.domain === domain)?.score || 2.5;

  // Build aptitude/preference lookup arrays for scoreClusterMatch
  const aptScores = aptitude.map((a) => ({ domain: a.domain, score: a.score }));
  const prefWithMax = prefScores.map((p) => ({ domain: p.domain, score: p.score, maxScore: 5 }));

  // Score all 18 clusters from the repository
  const scored = CAREER_CLUSTERS.map((cluster) => {
    const matchScore = scoreClusterMatch(cluster, aptScores, prefWithMax);

    // Build a dynamic "whyFits" explanation from the cluster's aptitude/preference domains
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
      streams: cluster.streams,
      pathways: cluster.pathways,
    };
  });

  return scored.sort((a, b) => b.matchScore - a.matchScore).slice(0, 3);
}

// ────────────────────────────────────────────
// NEW: Consistency & Reliability Check
// ────────────────────────────────────────────

function checkConsistency(answers: Record<number, number>): {
  level: 'High' | 'Medium' | 'Low';
  flags: string[];
} {
  const flags: string[] = [];
  let contradictions = 0;

  // Pair 1: Teamwork vs. Solo work (IDs 361, 362)
  const answer1A = answers[361] || 3;
  const answer1B = answers[362] || 3;
  // Contradiction if user agrees/disagrees with both
  if ((answer1A >= 4 && answer1B >= 4) || (answer1A <= 2 && answer1B <= 2)) {
    contradictions++;
    flags.push('Contradictory answers on teamwork vs. solo work preference.');
  }

  // Pair 2: Schedule vs. Spontaneity (IDs 363, 364)
  const answer2A = answers[363] || 3;
  const answer2B = answers[364] || 3;
  if ((answer2A >= 4 && answer2B >= 4) || (answer2A <= 2 && answer2B <= 2)) {
    contradictions++;
    flags.push('Contradictory answers on preference for schedule vs. spontaneity.');
  }

  // Pair 3: Creative vs. Practical (IDs 365, 366)
  const answer3A = answers[365] || 3;
  const answer3B = answers[366] || 3;
  if ((answer3A >= 4 && answer3B >= 4) || (answer3A <= 2 && answer3B <= 2)) {
    contradictions++;
    flags.push('Contradictory answers on creative brainstorming vs. practical tasks.');
  }

  const level = contradictions === 0 ? 'High' : contradictions === 1 ? 'Medium' : 'Low';
  return { level, flags };
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
  const streams = deriveStreamRecommendations(aptitudeResults);
  const families = deriveCourseFamilies(aptitudeResults, prefResults);
  const clusters = deriveCareerClusters(aptitudeResults, prefResults);
  const consistency = checkConsistency(raw.preference);

  const totalAnswered =
    Object.keys(raw.aptitude).length + Object.keys(raw.preference).length;
  const completionRate = Math.round((totalAnswered / 98) * 100); // Updated from 76 to 98

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
    streamRecommendations: streams,
    courseFamilyRecommendations: families,
    careerClusters: clusters,
    totalAnswered,
    completionRate,
    consistency,
  };
}
