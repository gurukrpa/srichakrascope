import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Assessment from './pages/Assessment';
import CareerAssessment from './pages/CareerAssessment';
import StudentLogin from './pages/StudentLogin';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import type { ReportData } from './pages/reportTemplate';

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

const REPORT_STORAGE_KEY = 'srichakra_report_data';

/**
 * Demo / default report data — shown at /demo route for testing.
 * The live assessment flow at /assessment generates real data via the scoring engine.
 */
const DEMO_DATA = {
  studentName: 'Demo Student',
  assessmentDate: new Date().toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }),

  /* ─── Aptitude (objective ability) ─── */
  aptitudeScores: [
    { domain: 'Numerical Reasoning', score: 78, maxScore: 100, skills: 'Calculations, data interpretation, number patterns', level: 'Strong', readiness: 'READY NOW' },
    { domain: 'Verbal Ability', score: 85, maxScore: 100, skills: 'Reading comprehension, vocabulary, grammar', level: 'Strong', readiness: 'READY NOW' },
    { domain: 'Logical Reasoning', score: 72, maxScore: 100, skills: 'Pattern recognition, sequencing, deduction', level: 'Moderate', readiness: 'WITH DEVELOPMENT' },
    { domain: 'Spatial Intelligence', score: 65, maxScore: 100, skills: 'Visual-spatial reasoning, mental rotation, design', level: 'Moderate', readiness: 'WITH DEVELOPMENT' },
    { domain: 'Clerical Speed', score: 60, maxScore: 100, skills: 'Data entry accuracy, speed processing, detail attention', level: 'Moderate', readiness: 'WITH DEVELOPMENT' },
    { domain: 'Mechanical Reasoning', score: 55, maxScore: 100, skills: 'Physical principles, mechanical concepts, tool use', level: 'Developing', readiness: 'EXPLORATORY' },
  ],

  /* ─── Preferences (RIASEC self-report, 1-5 scale) ─── */
  preferenceScores: [
    { domain: 'Investigative', score: 4.1, maxScore: 5 },
    { domain: 'Realistic', score: 3.5, maxScore: 5 },
    { domain: 'Enterprising', score: 3.4, maxScore: 5 },
    { domain: 'Conventional', score: 2.8, maxScore: 5 },
    { domain: 'Artistic', score: 2.2, maxScore: 5 },
    { domain: 'Social', score: 2.0, maxScore: 5 },
  ],

  dominantHemisphere: 'Left',
  learningStyles: ['Visual', 'Logical'],

  /* ─── Class 10 stream readiness ─── */
  streamRecommendations: [
    {
      stream: 'Science',
      readiness: 'READY NOW',
      match: 'Strong numerical (78) + logical (72) aptitude',
      confidence: 88,
      guidance: 'Strong fit for PCM; consider PCB if biology interest is high.',
      reason: 'Strong numerical and logical aptitude with science preference',
    },
    {
      stream: 'Commerce',
      readiness: 'READY NOW',
      match: 'Strong verbal (85) + moderate numerical (78) aptitude',
      confidence: 72,
      guidance: 'Good fit with Maths option; supports business/economics pathways.',
      reason: 'Good analytical skills with commerce interest',
    },
    {
      stream: 'Arts / Humanities',
      readiness: 'WITH DEVELOPMENT',
      match: 'Strong verbal (85) aptitude',
      confidence: 55,
      guidance: 'Viable with verbal strengths; explore economics, psychology, or political science.',
      reason: 'Verbal aptitude supports humanities exploration',
    },
  ],

  /* ─── Class 12 course family alignment ─── */
  courseFamilyRecommendations: [
    {
      family: 'Engineering / Technology',
      strengths: 'Numerical, Logical, Spatial',
      score: 85,
      alignment: 'READY NOW',
      guidance: 'Strong quantitative and logical base supports engineering pathways.',
      courses: ['Computer Science', 'Electronics', 'Mechanical'],
      fitScore: 85,
    },
    {
      family: 'Data Science & Analytics',
      strengths: 'Numerical, Logical',
      score: 80,
      alignment: 'READY NOW',
      guidance: 'Excellent analytical skills match data-intensive programmes.',
      courses: ['Statistics', 'Data Engineering', 'AI/ML'],
      fitScore: 80,
    },
    {
      family: 'Business / Commerce',
      strengths: 'Numerical, Verbal, Logical',
      score: 72,
      alignment: 'WITH DEVELOPMENT',
      guidance: 'Balanced skills support business studies with additional verbal practice.',
      courses: ['BBA', 'B.Com', 'Economics'],
      fitScore: 72,
    },
    {
      family: 'Medicine / Life Sciences',
      strengths: 'Numerical, Logical, Verbal',
      score: 65,
      alignment: 'WITH DEVELOPMENT',
      guidance: 'Requires strong analytical precision; review biology interest before committing.',
      courses: ['MBBS', 'BDS', 'Pharmacy'],
      fitScore: 65,
    },
    {
      family: 'Law / Social Sciences',
      strengths: 'Verbal, Logical',
      score: 58,
      alignment: 'WITH DEVELOPMENT',
      guidance: 'Strong verbal ability supports legal/social science pathways with development.',
      courses: ['BA LLB', 'Political Science', 'Sociology'],
      fitScore: 58,
    },
    {
      family: 'Arts / Design / Media',
      strengths: 'Spatial, Verbal, Creative',
      score: 50,
      alignment: 'EXPLORATORY',
      guidance: 'Consider if creative interests are strong; spatial skills provide a foundation.',
      courses: ['B.Des', 'BFA', 'Mass Communication'],
      fitScore: 50,
    },
  ],

  /* ─── Career exploration clusters ─── */
  careerClusters: [
    {
      name: 'STEM & Technology',
      icon: '🔬',
      roles: ['Software Developer', 'Data Scientist', 'Systems Architect', 'AI Engineer', 'Cybersecurity Analyst'],
      whyFits: 'Strong numerical and logical aptitude combined with investigative interests',
      skills: 'Analytical thinking, problem-solving, technical proficiency',
      matchScore: 90,
    },
    {
      name: 'Engineering & Design',
      icon: '⚙️',
      roles: ['Design Engineer', 'Project Manager', 'Quality Analyst', 'Civil Engineer', 'Robotics Engineer'],
      whyFits: 'Combines spatial intelligence with logical reasoning and realistic interests',
      skills: 'Technical drawing, system design, project management',
      matchScore: 78,
    },
    {
      name: 'Business, Finance & Management',
      icon: '📊',
      roles: ['Financial Analyst', 'Marketing Manager', 'Entrepreneur', 'Chartered Accountant', 'HR Manager'],
      whyFits: 'Leverages numerical ability with enterprising and organizational interests',
      skills: 'Quantitative analysis, communication, leadership',
      matchScore: 70,
    },
    {
      name: 'Healthcare & Life Sciences',
      icon: '🏥',
      roles: ['Doctor', 'Pharmacist', 'Physiotherapist', 'Clinical Researcher', 'Public Health Specialist'],
      whyFits: 'Combines scientific aptitude with social and helping motivations',
      skills: 'Attention to detail, empathy, scientific reasoning',
      matchScore: 60,
    },
    {
      name: 'Social Sciences & Education',
      icon: '📚',
      roles: ['Teacher', 'Psychologist', 'Social Worker', 'Policy Analyst', 'Journalist'],
      whyFits: 'Matches strong verbal ability with social and investigative interests',
      skills: 'Communication, critical thinking, empathy, writing',
      matchScore: 50,
    },
  ],

  totalAnswered: 120,
  completionRate: 96,
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
        <Routes>
          {/* Landing page — start here */}
          <Route path="/" element={<Landing />} />

          {/* Student login / register */}
          <Route path="/login" element={<StudentLogin />} />

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

          {/* Live assessment wizard — requires login */}
          <Route
            path="/assessment"
            element={
              <RequireAuth>
                <Assessment onComplete={(data) => setReportData(data)} />
              </RequireAuth>
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

          {/* Legacy route — redirects to demo */}
          <Route
            path="/career-assessment"
            element={<CareerAssessment {...DEMO_DATA} />}
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
