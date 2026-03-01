/**
 * ASSESSMENT WIZARD — Student-facing questionnaire
 *
 * Flow: Student name → Part 1 (16 aptitude MCQ) → Part 2 (60 preference Likert) → Submit → Report
 *
 * Features:
 * - Progress bar with section labels
 * - One question at a time for focus
 * - Back/Next navigation
 * - Cannot proceed without answering
 * - Timer display
 * - Responsive design
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  APTITUDE_QUESTIONS,
  PREFERENCE_QUESTIONS,
  LIKERT_LABELS,
  type AptitudeQuestion,
  type PreferenceQuestion,
} from '../data/questionBank';
import { buildReportFromAnswers, type RawAnswers } from '../scoring/scoringEngine';
import type { ReportData } from './reportTemplate';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

// ────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds

// ────────────────────────────────────────────
// Props
// ────────────────────────────────────────────

interface AssessmentProps {
  onComplete: (data: ReportData) => void;
}

// ────────────────────────────────────────────
// Component
// ────────────────────────────────────────────

const PROGRESS_KEY = 'srichakra_assessment_progress';

const Assessment: React.FC<AssessmentProps> = ({ onComplete }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // ── Access control state ──
  const [accessStatus, setAccessStatus] = useState<'checking' | 'allowed' | 'completed' | 'expired'>('checking');
  const [accessMessage, setAccessMessage] = useState('');

  // ── Check if user already completed / assessment expired ──
  useEffect(() => {
    const checkAccess = async () => {
      if (!currentUser) {
        setAccessStatus('allowed');
        return;
      }

      try {
        const studentDoc = await getDoc(doc(db, 'students', currentUser.uid));
        if (studentDoc.exists()) {
          const data = studentDoc.data();

          // Already completed? Block re-use
          if (data.assessmentCompleted === true) {
            setAccessStatus('completed');
            setAccessMessage('You have already completed the assessment. Each student can take it only once. If you need to retake the assessment, please contact your school coordinator or admin@srichakraacademy.org.');
            return;
          }

          // Started but not completed? Check 3-day window
          if (data.assessmentStartedAt) {
            const startedAt = data.assessmentStartedAt instanceof Timestamp
              ? data.assessmentStartedAt.toDate()
              : new Date(data.assessmentStartedAt);
            const elapsed = Date.now() - startedAt.getTime();

            if (elapsed > THREE_DAYS_MS) {
              setAccessStatus('expired');
              setAccessMessage('Your assessment window has expired. Unfinished assessments must be completed within 3 days of starting. Please contact your school coordinator or admin@srichakraacademy.org to request a reset.');
              return;
            }
          }
        }

        setAccessStatus('allowed');
      } catch (err) {
        console.error('Error checking assessment access:', err);
        setAccessStatus('allowed'); // Allow on error to not block
      }
    };

    checkAccess();
  }, [currentUser]);

  // ── Restore saved progress (survives page refresh) ──
  const [_saved] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}');
    } catch {
      return {};
    }
  });

  // ── State ──
  const [phase, setPhase] = useState<'name' | 'aptitude' | 'preference' | 'submitting'>(
    _saved.phase === 'submitting' ? 'name' : _saved.phase || 'name'
  );
  const [studentName, setStudentName] = useState(_saved.studentName || '');
  const [currentIndex, setCurrentIndex] = useState(_saved.currentIndex || 0);
  const [aptitudeAnswers, setAptitudeAnswers] = useState<Record<number, number>>(_saved.aptitudeAnswers || {});
  const [preferenceAnswers, setPreferenceAnswers] = useState<Record<number, number>>(_saved.preferenceAnswers || {});
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);

  // ── Persist progress on every change ──
  useEffect(() => {
    if (phase !== 'submitting') {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify({
        phase, studentName, currentIndex, aptitudeAnswers, preferenceAnswers,
      }));
    }
  }, [phase, studentName, currentIndex, aptitudeAnswers, preferenceAnswers]);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => setElapsed(Date.now() - startTime), 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  // ── Current question ──
  const questions = phase === 'aptitude' ? APTITUDE_QUESTIONS : PREFERENCE_QUESTIONS;
  const currentQ = questions[currentIndex];
  const answers = phase === 'aptitude' ? aptitudeAnswers : preferenceAnswers;
  const totalQuestions = APTITUDE_QUESTIONS.length + PREFERENCE_QUESTIONS.length;
  const answeredCount = Object.keys(aptitudeAnswers).length + Object.keys(preferenceAnswers).length;
  const globalIndex = phase === 'aptitude' ? currentIndex : APTITUDE_QUESTIONS.length + currentIndex;

  // ── Handlers ──
  const handleAptitudeSelect = useCallback((qId: number, optionIndex: number) => {
    setAptitudeAnswers((prev) => ({ ...prev, [qId]: optionIndex }));
  }, []);

  const handlePreferenceSelect = useCallback((qId: number, value: number) => {
    setPreferenceAnswers((prev) => ({ ...prev, [qId]: value }));
  }, []);

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (phase === 'aptitude') {
      // Move to preference section
      setPhase('preference');
      setCurrentIndex(0);
    } else {
      // Submit
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else if (phase === 'preference') {
      setPhase('aptitude');
      setCurrentIndex(APTITUDE_QUESTIONS.length - 1);
    }
  };

  const handleSubmit = () => {
    setPhase('submitting');
    localStorage.removeItem(PROGRESS_KEY);

    // Small delay for UX
    setTimeout(async () => {
      const rawAnswers: RawAnswers = {
        studentName,
        aptitude: aptitudeAnswers,
        preference: preferenceAnswers,
      };

      const reportData = buildReportFromAnswers(rawAnswers);

      // Save to Firestore if logged in
      if (currentUser) {
        try {
          await setDoc(doc(db, 'assessments', currentUser.uid), {
            uid: currentUser.uid,
            studentName,
            rawAnswers,
            reportData,
            completedAt: serverTimestamp(),
          });
          // Mark student as assessment-completed
          await updateDoc(doc(db, 'students', currentUser.uid), {
            assessmentCompleted: true,
          });
        } catch (err) {
          console.error('Failed to save assessment to Firestore:', err);
        }
      }

      onComplete(reportData);
      navigate('/report');
    }, 1500);
  };

  const isCurrentAnswered =
    currentQ &&
    (phase === 'aptitude'
      ? aptitudeAnswers[currentQ.id] !== undefined
      : preferenceAnswers[currentQ.id] !== undefined);

  // ────────────────────────────────────────────
  // Helper: Record assessment start in Firestore
  // ────────────────────────────────────────────

  const startAssessment = async () => {
    // Record start time in Firestore (only if not already recorded)
    if (currentUser) {
      try {
        const studentDoc = await getDoc(doc(db, 'students', currentUser.uid));
        if (studentDoc.exists() && !studentDoc.data().assessmentStartedAt) {
          await updateDoc(doc(db, 'students', currentUser.uid), {
            assessmentStartedAt: serverTimestamp(),
          });
        }
      } catch (err) {
        console.error('Failed to record assessment start time:', err);
      }
    }
    setPhase('aptitude');
  };

  // ────────────────────────────────────────────
  // Render: Access Blocked (completed or expired)
  // ────────────────────────────────────────────

  if (accessStatus === 'checking') {
    return (
      <div style={styles.container}>
        <div style={{ ...styles.card, textAlign: 'center' as const }}>
          <div style={{ fontSize: '2.5em', marginBottom: '16px' }}>🔍</div>
          <h2 style={{ color: '#006D77' }}>Checking Access...</h2>
          <p style={{ color: '#666', fontSize: '1.05em' }}>Verifying your assessment eligibility.</p>
          <div style={styles.spinner} />
        </div>
      </div>
    );
  }

  if (accessStatus === 'completed' || accessStatus === 'expired') {
    return (
      <div style={styles.container}>
        <div style={{ ...styles.card, textAlign: 'center' as const }}>
          <div style={{ fontSize: '3em', marginBottom: '16px' }}>
            {accessStatus === 'completed' ? '✅' : '⏰'}
          </div>
          <h2 style={{ color: accessStatus === 'completed' ? '#006D77' : '#d32f2f', marginBottom: 12 }}>
            {accessStatus === 'completed' ? 'Assessment Already Completed' : 'Assessment Window Expired'}
          </h2>
          <p style={{ color: '#555', lineHeight: 1.8, fontSize: '1.05em', maxWidth: 480, margin: '0 auto 24px' }}>
            {accessMessage}
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' as const }}>
            {accessStatus === 'completed' && (
              <button
                onClick={() => navigate('/report')}
                style={{ ...styles.primaryBtn, width: 'auto', padding: '12px 28px', margin: 0 }}
              >
                View My Report →
              </button>
            )}
            <button
              onClick={() => navigate('/')}
              style={{ ...styles.primaryBtn, width: 'auto', padding: '12px 28px', margin: 0, background: '#888' }}
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────
  // Render: Name Entry
  // ────────────────────────────────────────────

  if (phase === 'name') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.logo}>
            <h1 style={{ margin: 0, fontSize: '1.8em', color: '#006D77' }}>Srichakra Academy</h1>
            <p style={{ margin: '2px 0 0', color: '#888', fontSize: '0.85em', fontStyle: 'italic' }}>(A Unit of SriKrpa Foundation Trust)</p>
            <p style={{ margin: '8px 0 0', color: '#666', fontSize: '1.1em' }}>SCOPE - Student Career & Opportunity Pathway Evaluation</p>
          </div>

          <div style={{ margin: '40px 0' }}>
            <h2 style={{ color: '#006D77', marginBottom: '10px' }}>Welcome!</h2>
            <p style={{ color: '#555', lineHeight: 1.7, fontSize: '1.05em' }}>
              This assessment has <strong>76 questions</strong> in two parts:
            </p>
            <ul style={{ color: '#555', lineHeight: 2, fontSize: '1.0em', paddingLeft: '20px' }}>
              <li><strong>Part 1:</strong> 16 objective aptitude questions (has correct answers)</li>
              <li><strong>Part 2:</strong> 60 self-report preference questions (no right or wrong answers)</li>
            </ul>
            <p style={{ color: '#555', lineHeight: 1.7, fontSize: '1.0em' }}>
              Estimated time: <strong>25–35 minutes</strong>. Answer honestly for the best results.
            </p>
            <div style={{ background: '#fff8f0', border: '1px solid #f0d8c0', borderRadius: 10, padding: '12px 16px', marginTop: 14 }}>
              <p style={{ margin: 0, color: '#8B6914', fontSize: '0.93em', lineHeight: 1.6 }}>
                ⚠️ <strong>Important:</strong> You can only take this assessment <strong>once</strong>.
                If you leave mid-way, you can resume within <strong>3 days</strong>. After that, the assessment will expire.
              </p>
            </div>
          </div>

          <div style={{ marginTop: '30px' }}>
            <label style={{ fontWeight: 600, color: '#333', fontSize: '1.05em' }}>
              Student Name
            </label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Enter your full name"
              style={styles.input}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && studentName.trim()) {
                  startAssessment();
                }
              }}
            />
          </div>

          <button
            onClick={() => startAssessment()}
            disabled={!studentName.trim()}
            style={{
              ...styles.primaryBtn,
              opacity: studentName.trim() ? 1 : 0.5,
              cursor: studentName.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            Start Assessment →
          </button>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────
  // Render: Submitting
  // ────────────────────────────────────────────

  if (phase === 'submitting') {
    return (
      <div style={styles.container}>
        <div style={{ ...styles.card, textAlign: 'center' as const }}>
          <div style={{ fontSize: '3em', marginBottom: '20px' }}>📊</div>
          <h2 style={{ color: '#006D77' }}>Generating Your Report...</h2>
          <p style={{ color: '#666', fontSize: '1.1em' }}>
            Analyzing {answeredCount} answers for {studentName}
          </p>
          <div style={styles.spinner} />
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────
  // Render: Question
  // ────────────────────────────────────────────

  const progressPct = ((globalIndex + 1) / totalQuestions) * 100;
  const sectionLabel = phase === 'aptitude' ? 'Part 1: Aptitude' : 'Part 2: Preferences';
  const sectionProgress =
    phase === 'aptitude'
      ? `Question ${currentIndex + 1} of ${APTITUDE_QUESTIONS.length}`
      : `Question ${currentIndex + 1} of ${PREFERENCE_QUESTIONS.length}`;

  return (
    <div style={styles.container}>
      <div style={styles.questionCard}>
        {/* ── Header ── */}
        <div style={styles.header}>
          <div>
            <h3 style={{ margin: 0, color: '#006D77', fontSize: '1.0em' }}>{sectionLabel}</h3>
            <p style={{ margin: '4px 0 0', color: '#888', fontSize: '0.85em' }}>{sectionProgress}</p>
          </div>
          <div style={{ textAlign: 'right' as const }}>
            <span style={{ color: '#888', fontSize: '0.85em' }}>⏱ {formatTime(elapsed)}</span>
            <p style={{ margin: '4px 0 0', color: '#888', fontSize: '0.85em' }}>
              {answeredCount}/{totalQuestions} answered
            </p>
          </div>
        </div>

        {/* ── Progress Bar ── */}
        <div style={styles.progressBarOuter}>
          <div
            style={{
              ...styles.progressBarInner,
              width: `${progressPct}%`,
              background: phase === 'aptitude' ? '#006D77' : '#E29578',
            }}
          />
        </div>

        {/* ── Question ── */}
        <div style={styles.questionBody}>
          <h2 style={{ color: '#333', fontSize: '1.25em', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
            {currentQ.question}
          </h2>

          {/* Aptitude MCQ */}
          {phase === 'aptitude' && (
            <div style={{ marginTop: '24px' }}>
              {(currentQ as AptitudeQuestion).options.map((opt, idx) => {
                const selected = aptitudeAnswers[currentQ.id] === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => handleAptitudeSelect(currentQ.id, idx)}
                    style={{
                      ...styles.optionBtn,
                      background: selected ? '#006D77' : '#fff',
                      color: selected ? '#fff' : '#333',
                      borderColor: selected ? '#006D77' : '#ddd',
                    }}
                  >
                    <span style={styles.optionLetter}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
          )}

          {/* Preference Likert */}
          {phase === 'preference' && (
            <div style={{ marginTop: '24px' }}>
              <div style={styles.likertContainer}>
                {LIKERT_LABELS.map((item) => {
                  const selected = preferenceAnswers[currentQ.id] === item.value;
                  return (
                    <button
                      key={item.value}
                      onClick={() => handlePreferenceSelect(currentQ.id, item.value)}
                      style={{
                        ...styles.likertBtn,
                        background: selected ? '#E29578' : '#fff',
                        color: selected ? '#fff' : '#555',
                        borderColor: selected ? '#E29578' : '#ddd',
                        transform: selected ? 'scale(1.05)' : 'scale(1)',
                      }}
                    >
                      <span style={{ fontSize: '1.3em', fontWeight: 700 }}>{item.value}</span>
                      <span style={{ fontSize: '0.75em', marginTop: '4px' }}>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Navigation ── */}
        <div style={styles.navBar}>
          <button
            onClick={handleBack}
            disabled={phase === 'aptitude' && currentIndex === 0}
            style={{
              ...styles.navBtn,
              opacity: phase === 'aptitude' && currentIndex === 0 ? 0.3 : 1,
            }}
          >
            ← Back
          </button>

          <button
            onClick={handleNext}
            disabled={!isCurrentAnswered}
            style={{
              ...styles.primaryBtn,
              opacity: isCurrentAnswered ? 1 : 0.5,
              cursor: isCurrentAnswered ? 'pointer' : 'not-allowed',
              margin: 0,
              padding: '12px 32px',
            }}
          >
            {phase === 'preference' && currentIndex === PREFERENCE_QUESTIONS.length - 1
              ? 'Submit Assessment ✓'
              : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────
// Styles
// ────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #e0f7fa 0%, #f5f5f5 50%, #fce4ec 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  card: {
    background: '#fff',
    borderRadius: '16px',
    padding: '40px',
    maxWidth: '600px',
    width: '100%',
    boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
  },
  questionCard: {
    background: '#fff',
    borderRadius: '16px',
    padding: '32px',
    maxWidth: '720px',
    width: '100%',
    boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
    minHeight: '480px',
    display: 'flex',
    flexDirection: 'column',
  },
  logo: {
    textAlign: 'center' as const,
    paddingBottom: '20px',
    borderBottom: '2px solid #e0e0e0',
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    marginTop: '10px',
    border: '2px solid #ddd',
    borderRadius: '8px',
    fontSize: '1.05em',
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.2s',
  },
  primaryBtn: {
    display: 'block',
    width: '100%',
    marginTop: '24px',
    padding: '14px',
    background: '#006D77',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1.1em',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
  },
  progressBarOuter: {
    height: '6px',
    background: '#eee',
    borderRadius: '3px',
    marginBottom: '28px',
    overflow: 'hidden',
  },
  progressBarInner: {
    height: '100%',
    borderRadius: '3px',
    transition: 'width 0.3s ease',
  },
  questionBody: {
    flex: 1,
  },
  optionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    padding: '14px 18px',
    marginBottom: '10px',
    border: '2px solid #ddd',
    borderRadius: '10px',
    fontSize: '1.05em',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    textAlign: 'left' as const,
    background: '#fff',
  },
  optionLetter: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    background: '#f0f0f0',
    fontWeight: 700,
    fontSize: '0.9em',
    flexShrink: 0,
  },
  likertContainer: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
    flexWrap: 'wrap' as const,
  },
  likertBtn: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100px',
    height: '80px',
    border: '2px solid #ddd',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    background: '#fff',
  },
  navBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '28px',
    paddingTop: '20px',
    borderTop: '1px solid #eee',
  },
  navBtn: {
    padding: '10px 20px',
    background: 'transparent',
    color: '#006D77',
    border: '1px solid #006D77',
    borderRadius: '8px',
    fontSize: '0.95em',
    fontWeight: 600,
    cursor: 'pointer',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #eee',
    borderTop: '4px solid #006D77',
    borderRadius: '50%',
    margin: '30px auto',
    animation: 'spin 1s linear infinite',
  },
};

export default Assessment;
