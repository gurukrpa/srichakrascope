import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Assessment from './pages/Assessment';
import CareerAssessment from './pages/CareerAssessment';
import CounsellorNote from './pages/CounsellorNote';
import MethodologyHandbook from './pages/MethodologyHandbook';
import StudentLogin from './pages/StudentLogin';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import BulkRegistration from './pages/BulkRegistration';
import SchoolLogin from './pages/SchoolLogin';
import AccessGate from './pages/AccessGate';

import DMITCapture from './pages/DMITCapture';
import EbooksLanding from './pages/EbooksLanding';
import EbookCheckout from './pages/EbookCheckout';
import EbookSuccess from './pages/EbookSuccess';
import Counselling from './pages/Counselling';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import type { ReportData } from './pages/reportTemplate';
import { buildReportFromAnswers, type RawAnswers } from './scoring/scoringEngine';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

/** Error Boundary to catch and display runtime errors */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, fontFamily: 'monospace', color: '#c00' }}>
          <h2>Something went wrong:</h2>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{this.state.error?.message}</pre>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.85em', color: '#555' }}>{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Protected Route — requires logged-in user.
 * Redirects to /login if not authenticated.
 */
function RequireAuth({ children }: { children: React.ReactElement }) {
  const { currentUser, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#006D77', fontFamily: 'Segoe UI' }}>Loading...</div>;
  return currentUser ? children : <Navigate to="/login" replace />;
}

/**
 * Admin Route — requires logged-in admin user.
 * Redirects to /admin/login if not admin.
 */
function RequireAdmin({ children }: { children: React.ReactElement }) {
  const { currentUser, isAdmin, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#2C3E50', fontFamily: 'Segoe UI' }}>Loading...</div>;
  if (!currentUser) return <Navigate to="/admin/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}

/**
 * Access Gate — requires logged-in user WITH paid/approved access.
 * If logged in but no access → redirect to /access-gate (payment page).
 * Admins bypass access check.
 */
function RequireAccess({ children }: { children: React.ReactElement }) {
  const { currentUser, loading, hasAssessmentAccess, accessLoading, isAdmin } = useAuth();
  if (loading || accessLoading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#006D77', fontFamily: 'Segoe UI' }}>Loading...</div>;
  if (!currentUser) return <Navigate to="/login" replace />;
  if (isAdmin) return children;
  if (!hasAssessmentAccess) return <Navigate to="/access-gate" replace />;
  return children;
}

const REPORT_STORAGE_KEY = 'srichakra_report_data';

/**
 * Demo / default report data — shown at /demo route for testing.
 * The live assessment flow at /assessment generates real data via the scoring engine.
 */
const DEMO_DATA: ReportData = {
  studentName: 'Demo Student',
  assessmentDate: new Date().toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }),

  /* ─── Aptitude (objective ability, IRT-scored with 95% CI bands) ─── */
  aptitudeScores: [
    { domain: 'Numerical Reasoning', score: 78, scoreCi95: { low: 64, high: 88 }, itemsAnswered: 4, lowInformation: false, maxScore: 100, skills: 'Calculations, data interpretation, number patterns', level: 'Moderate', readiness: 'WITH DEVELOPMENT' },
    { domain: 'Logical Reasoning', score: 84, scoreCi95: { low: 71, high: 92 }, itemsAnswered: 4, lowInformation: false, maxScore: 100, skills: 'Pattern recognition, sequencing, deduction', level: 'Strong', readiness: 'READY NOW' },
    { domain: 'Verbal Ability', score: 71, scoreCi95: { low: 56, high: 83 }, itemsAnswered: 4, lowInformation: false, maxScore: 100, skills: 'Reading comprehension, vocabulary, grammar', level: 'Moderate', readiness: 'WITH DEVELOPMENT' },
    { domain: 'Spatial Intelligence', score: 68, scoreCi95: { low: 53, high: 81 }, itemsAnswered: 4, lowInformation: false, maxScore: 100, skills: 'Visual-spatial reasoning, mental rotation, design', level: 'Moderate', readiness: 'WITH DEVELOPMENT' },
  ],

  /* ─── Preferences (RIASEC self-report, 1-5 scale) ─── */
  preferenceScores: [
    { domain: 'Investigative', score: 4.2, maxScore: 5 },
    { domain: 'Realistic', score: 3.8, maxScore: 5 },
    { domain: 'Conventional', score: 3.5, maxScore: 5 },
    { domain: 'Enterprising', score: 3.2, maxScore: 5 },
    { domain: 'Artistic', score: 2.4, maxScore: 5 },
    { domain: 'Social', score: 2.1, maxScore: 5 },
  ],

  /* ─── Multiple Intelligences (display-only, 0-100) ─── */
  miScores: [
    { name: 'Logical-Mathematical', score: 82 },
    { name: 'Linguistic', score: 70 },
    { name: 'Visual-Spatial', score: 68 },
    { name: 'Naturalistic', score: 55 },
    { name: 'Intrapersonal', score: 60 },
    { name: 'Interpersonal', score: 45 },
    { name: 'Bodily-Kinesthetic', score: 40 },
    { name: 'Musical', score: 38 },
  ],

  /* ─── MBTI Step-I-style (4 axes × 4 items) ─── */
  mbti: {
    type: 'INTJ',
    reliable: true,
    axes: [
      { axis: 'EI', leaning: 'I', strength: 72, itemsAnswered: 4 },
      { axis: 'SN', leaning: 'N', strength: 78, itemsAnswered: 4 },
      { axis: 'TF', leaning: 'T', strength: 80, itemsAnswered: 4 },
      { axis: 'JP', leaning: 'J', strength: 70, itemsAnswered: 4 },
    ],
  },

  /* ─── Validity / Response Reliability ─── */
  consistency: {
    level: 'High',
    flags: [],
    attentionCheckPassed: true,
  },

  dominantHemisphere: 'Left',
  learningStyles: ['Visual', 'Logical'],

  /* ─── Class 10 stream readiness ─── */
  streamRecommendations: [
    {
      stream: 'Science',
      readiness: 'READY NOW',
      match: 'Numerical (78) + Logical (84) + Spatial (68)',
      confidence: 77,
      tied: false,
      guidance: 'Strong fit for PCM; consider PCB if biology interest is high.',
      reason: 'Strong numerical and logical aptitude with science preference',
    },
    {
      stream: 'Commerce',
      readiness: 'WITH DEVELOPMENT',
      match: 'Numerical (78) + Verbal (71) + Logical (84)',
      confidence: 77,
      tied: true,
      guidance: 'Good fit with Maths option; supports business/economics pathways.',
      reason: 'Good analytical skills with commerce interest',
    },
    {
      stream: 'Arts / Humanities',
      readiness: 'WITH DEVELOPMENT',
      match: 'Verbal (71) + Logical (84)',
      confidence: 77,
      tied: true,
      guidance: 'Viable with verbal strengths; explore economics, psychology, or political science.',
      reason: 'Verbal aptitude supports humanities exploration',
    },
  ],

  /* ─── Class 12 course family alignment (50/30/20 + ±5 MBTI bonus) ─── */
  courseFamilyRecommendations: [
    {
      family: 'Engineering / Technology',
      strengths: 'Numerical, Logical, Spatial',
      score: 86,
      alignment: 'READY NOW',
      tied: false,
      mbtiBonus: 4,
      guidance: 'Strong quantitative and logical base supports engineering pathways.',
      courses: ['Computer Science', 'Electronics', 'Mechanical'],
      fitScore: 86,
    },
    {
      family: 'Data Science & Analytics',
      strengths: 'Numerical, Logical',
      score: 83,
      alignment: 'READY NOW',
      tied: true,
      mbtiBonus: 5,
      guidance: 'Excellent analytical skills match data-intensive programmes.',
      courses: ['Statistics', 'Data Engineering', 'AI/ML'],
      fitScore: 83,
    },
    {
      family: 'Business / Commerce',
      strengths: 'Numerical, Verbal, Logical',
      score: 70,
      alignment: 'WITH DEVELOPMENT',
      tied: false,
      mbtiBonus: 0,
      guidance: 'Balanced skills support business studies with additional verbal practice.',
      courses: ['BBA', 'B.Com', 'Economics'],
      fitScore: 70,
    },
    {
      family: 'Medicine / Life Sciences',
      strengths: 'Numerical, Logical, Verbal',
      score: 64,
      alignment: 'WITH DEVELOPMENT',
      tied: false,
      mbtiBonus: -2,
      guidance: 'Requires strong analytical precision; review biology interest before committing.',
      courses: ['MBBS', 'BDS', 'Pharmacy'],
      fitScore: 64,
    },
    {
      family: 'Law / Social Sciences',
      strengths: 'Verbal, Logical',
      score: 58,
      alignment: 'WITH DEVELOPMENT',
      tied: false,
      mbtiBonus: 1,
      guidance: 'Strong verbal ability supports legal/social science pathways with development.',
      courses: ['BA LLB', 'Political Science', 'Sociology'],
      fitScore: 58,
    },
    {
      family: 'Arts / Design / Media',
      strengths: 'Spatial, Verbal, Creative',
      score: 50,
      alignment: 'EXPLORATORY',
      tied: false,
      mbtiBonus: -3,
      guidance: 'Consider if creative interests are strong; spatial skills provide a foundation.',
      courses: ['B.Des', 'BFA', 'Mass Communication'],
      fitScore: 50,
    },
  ],

  /* ─── Career exploration clusters (top 3 from 18-cluster repository) ─── */
  careerClusters: [
    {
      name: 'Engineering & Technology',
      icon: '⚙️',
      roles: ['Software Developer', 'Data Scientist / AI Engineer', 'Mechanical Engineer', 'Cybersecurity Analyst', 'Robotics Engineer'],
      whyFits: 'Numerical Reasoning (78%), Logical Reasoning (84%), Spatial Intelligence (68%) with strong analytical interest',
      skills: 'Problem-solving, Mathematical modelling, Systems thinking, Programming, Technical communication',
      matchScore: 85,
      mbtiBonus: 4,
      tied: false,
    },
    {
      name: 'Pure Sciences & Research',
      icon: '🔬',
      roles: ['Research Scientist', 'Mathematician / Statistician', 'Biotechnologist', 'Space Scientist'],
      whyFits: 'Numerical Reasoning (78%), Logical Reasoning (84%) with strong analytical interest',
      skills: 'Research methodology, Quantitative analysis, Critical thinking, Scientific writing, Lab techniques',
      matchScore: 82,
      mbtiBonus: 5,
      tied: true,
    },
    {
      name: 'Finance & Accounting',
      icon: '💰',
      roles: ['Chartered Accountant (CA)', 'Financial Analyst', 'Company Secretary (CS)', 'Tax Consultant'],
      whyFits: 'Numerical Reasoning (78%), Logical Reasoning (84%) with moderate conscientiousness interest',
      skills: 'Numerical accuracy, Financial analysis, Regulatory knowledge, Attention to detail',
      matchScore: 73,
      mbtiBonus: 3,
      tied: false,
    },
  ],

  totalAnswered: 103,
  completionRate: 100,
};

function App() {
  const [reportData, setReportData] = useState<ReportData | null>(() => {
    try {
      const saved = localStorage.getItem(REPORT_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Persist report data so /report survives page refresh
  useEffect(() => {
    if (reportData) {
      localStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(reportData));
    }
  }, [reportData]);

  return (
    <BrowserRouter>
      <AuthProvider>
        <ErrorBoundary>
          <AppRoutes reportData={reportData} setReportData={setReportData} />
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  );
}

/**
 * Inner routes component — lives inside <AuthProvider> so it can use useAuth().
 * Auto-rehydrates stale cached report data: if the cached report is missing
 * fields added by a newer scoring-engine version (currently `consistency`), and
 * the signed-in user has raw answers in Firestore, we rebuild the report from
 * the raw answers using the current scoring engine.
 */
function AppRoutes({
  reportData,
  setReportData,
}: {
  reportData: ReportData | null;
  setReportData: (d: ReportData | null) => void;
}) {
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;

    const cachedNeedsRefresh = reportData !== null && (reportData as ReportData).consistency === undefined;
    const noCacheButLoggedIn = reportData === null;

    if (!cachedNeedsRefresh && !noCacheButLoggedIn) return;

    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'assessments', currentUser.uid));
        if (cancelled || !snap.exists()) return;
        const data = snap.data() as { rawAnswers?: RawAnswers; reportData?: ReportData };
        if (!data.rawAnswers) return;
        const fresh = buildReportFromAnswers(data.rawAnswers);
        setReportData(fresh);
      } catch (err) {
        console.warn('[App] Could not rehydrate report from Firestore:', err);
      }
    })();

    return () => {
      cancelled = true;
    };
    // Intentionally re-run only when auth user changes; reportData is read but
    // we don't want to loop on our own setState.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  return (
    <Routes>
          {/* Landing page — start here */}
          <Route path="/" element={<ErrorBoundary><Landing /></ErrorBoundary>} />

          {/* Student login / register */}
          <Route path="/login" element={<StudentLogin />} />

          {/* School / Bulk student login */}
          <Route path="/school-login" element={<SchoolLogin />} />

          {/* Admin login */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Admin dashboard — protected */}
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <AdminDashboard />
              </RequireAdmin>
            }
          />

          {/* Bulk registration — admin only */}
          <Route
            path="/admin/bulk-register"
            element={
              <RequireAdmin>
                <BulkRegistration />
              </RequireAdmin>
            }
          />

          {/* Access gate — payment / approval page */}
          <Route
            path="/access-gate"
            element={
              <RequireAuth>
                <AccessGate />
              </RequireAuth>
            }
          />

          {/* Live assessment wizard — requires login + paid/approved access */}
          <Route
            path="/assessment"
            element={
              <RequireAccess>
                <Assessment onComplete={(data) => setReportData(data)} />
              </RequireAccess>
            }
          />

          {/* Report generated from live assessment */}
          <Route
            path="/report"
            element={
              reportData ? (
                <CareerAssessment {...reportData} />
              ) : (
                <Landing />
              )
            }
          />

          {/* Demo report with hardcoded data (for testing) */}
          <Route
            path="/demo"
            element={<CareerAssessment {...DEMO_DATA} />}
          />

          {/* Counsellor's Note — standalone one-page interpretation guide (PDF) — ADMIN ONLY */}
          <Route
            path="/counsellor-note"
            element={
              <RequireAdmin>
                {reportData ? <CounsellorNote data={reportData} /> : <CounsellorNote data={DEMO_DATA} />}
              </RequireAdmin>
            }
          />
          <Route
            path="/counsellor-note/demo"
            element={
              <RequireAdmin>
                <CounsellorNote data={DEMO_DATA} />
              </RequireAdmin>
            }
          />

          {/* Methodology & References Handbook — counsellor L&D reference (PDF) */}
          <Route
            path="/methodology-handbook"
            element={<MethodologyHandbook />}
          />

          {/* Legacy route — redirects to demo */}
          <Route
            path="/career-assessment"
            element={<CareerAssessment {...DEMO_DATA} />}
          />

          {/* DMIT — Fingerprint Capture & Assessment */}
          <Route path="/dmit/capture" element={<DMITCapture />} />

          {/* E-books — public storefront */}
          <Route path="/ebooks" element={<ErrorBoundary><EbooksLanding /></ErrorBoundary>} />
          <Route path="/ebooks/checkout/:key" element={<ErrorBoundary><EbookCheckout /></ErrorBoundary>} />
          <Route path="/ebooks/success" element={<ErrorBoundary><EbookSuccess /></ErrorBoundary>} />

          {/* Counselling — paid 1:1 post-assessment */}
          <Route path="/counselling" element={<ErrorBoundary><Counselling /></ErrorBoundary>} />
        </Routes>
  );
}

export default App;
