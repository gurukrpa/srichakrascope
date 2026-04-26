/**
 * ASSESSMENT WIZARD — Student-facing questionnaire
 *
 * Flow: Student name → Part 1 (24 aptitude MCQ) → Part 2 (50 preference Likert) → Submit → Report
 *
 * Features:
 * - Progress bar with section labels
 * - One question at a time for focus
 * - Back/Next navigation
 * - Cannot proceed without answering
 * - Timer display
 * - Auto-save progress to localStorage (3-day resume window)
 * - Firestore: records start time, blocks re-take, marks completion
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  APTITUDE_QUESTIONS,
  PREFERENCE_QUESTIONS,
  LIKERT_LABELS,
  TOTAL_APTITUDE,
  TOTAL_PREFERENCE,
  TOTAL_QUESTIONS,
  type AptitudeQuestion,
} from '../data/questionBank';
import { buildReportFromAnswers, type RawAnswers } from '../scoring/scoringEngine';
import type { ReportData } from './reportTemplate';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

// ────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
const PROGRESS_KEY = 'srichakra_assessment_progress_v2';

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

type Phase = 'name' | 'aptitude' | 'preference' | 'review' | 'submitting';

interface SavedProgress {
  studentName: string;
  phase: Phase;
  answers: Record<number, number>;
  aptitudeIndex: number;
  preferenceIndex: number;
  /** Persisted shuffled order of question IDs so refresh preserves the sequence. */
  aptitudeOrder?: number[];
  preferenceOrder?: number[];
  startTimeIso: string | null;
  savedAt: number;
}

interface AssessmentProps {
  onComplete: (data: ReportData) => void;
}

// ────────────────────────────────────────────
// Fisher–Yates shuffle (returns a new array)
// ────────────────────────────────────────────

function shuffled<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ────────────────────────────────────────────
// localStorage helpers (lightly obfuscated)
// ────────────────────────────────────────────

function encodeProgress(data: SavedProgress): string {
  return btoa(encodeURIComponent(JSON.stringify(data)));
}

function decodeProgress(encoded: string): SavedProgress | null {
  try {
    return JSON.parse(decodeURIComponent(atob(encoded))) as SavedProgress;
  } catch {
    try {
      return JSON.parse(encoded) as SavedProgress;
    } catch {
      return null;
    }
  }
}

function loadSavedProgress(): SavedProgress | null {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return null;
    const decoded = decodeProgress(raw);
    if (!decoded) return null;
    if (Date.now() - decoded.savedAt > THREE_DAYS_MS) {
      localStorage.removeItem(PROGRESS_KEY);
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

// ────────────────────────────────────────────
// Component
// ────────────────────────────────────────────

const Assessment: React.FC<AssessmentProps> = ({ onComplete }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [accessStatus, setAccessStatus] = useState<'checking' | 'allowed' | 'completed' | 'expired'>('checking');
  const [accessMessage, setAccessMessage] = useState('');

  const saved = useRef<SavedProgress | null>(loadSavedProgress());

  const [phase, setPhase] = useState<Phase>(saved.current?.phase ?? 'name');
  const [studentName, setStudentName] = useState<string>(saved.current?.studentName ?? '');
  const [answers, setAnswers] = useState<Record<number, number>>(saved.current?.answers ?? {});
  const [aptitudeIndex, setAptitudeIndex] = useState<number>(saved.current?.aptitudeIndex ?? 0);
  const [preferenceIndex, setPreferenceIndex] = useState<number>(saved.current?.preferenceIndex ?? 0);
  const [startTime, setStartTime] = useState<Date | null>(
    saved.current?.startTimeIso ? new Date(saved.current.startTimeIso) : null
  );
  const [elapsed, setElapsed] = useState<number>(0);

  // True when the student jumped into a question from the review screen via Edit.
  // While true, the question screen shows "Save & Return to Review" / "Cancel"
  // instead of the normal Back / Next flow, so the student doesn't have to walk
  // through every subsequent question to get back to review.
  const [editingFromReview, setEditingFromReview] = useState<boolean>(false);
  // Snapshot of the answer at the moment Edit was clicked, used by Cancel to revert.
  const editSnapshot = useRef<{ qId: number; prevValue: number | undefined } | null>(null);

  // ── Question order (shuffled per student, persisted) ──
  // If saved order exists and references valid IDs, reuse it; otherwise create a new shuffle.
  const aptitudeQs = useMemo(() => {
    const savedOrder = saved.current?.aptitudeOrder;
    if (savedOrder && savedOrder.length === APTITUDE_QUESTIONS.length) {
      const byId = new Map(APTITUDE_QUESTIONS.map((q) => [q.id, q]));
      const ordered = savedOrder.map((id) => byId.get(id)).filter(Boolean) as typeof APTITUDE_QUESTIONS;
      if (ordered.length === APTITUDE_QUESTIONS.length) return ordered;
    }
    return shuffled(APTITUDE_QUESTIONS);
  }, []);

  const preferenceQs = useMemo(() => {
    const savedOrder = saved.current?.preferenceOrder;
    if (savedOrder && savedOrder.length === PREFERENCE_QUESTIONS.length) {
      const byId = new Map(PREFERENCE_QUESTIONS.map((q) => [q.id, q]));
      const ordered = savedOrder.map((id) => byId.get(id)).filter(Boolean) as typeof PREFERENCE_QUESTIONS;
      if (ordered.length === PREFERENCE_QUESTIONS.length) return ordered;
    }
    return shuffled(PREFERENCE_QUESTIONS);
  }, []);

  // ── Access control check ──
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
          if (data.assessmentCompleted === true) {
            setAccessStatus('completed');
            setAccessMessage(
              'You have already completed the assessment. Each student can take it only once. ' +
                'If you need to retake the assessment, please contact your school coordinator or admin@srichakraacademy.org.'
            );
            return;
          }
          if (data.assessmentStartedAt) {
            const startedAt =
              data.assessmentStartedAt instanceof Timestamp
                ? data.assessmentStartedAt.toDate()
                : new Date(data.assessmentStartedAt);
            const elapsedMs = Date.now() - startedAt.getTime();
            if (elapsedMs > THREE_DAYS_MS) {
              setAccessStatus('expired');
              setAccessMessage(
                'Your assessment window has expired. Unfinished assessments must be completed within 3 days of starting. ' +
                  'Please contact your school coordinator or admin@srichakraacademy.org to request a reset.'
              );
              return;
            }
          }
        }
        setAccessStatus('allowed');
      } catch (err) {
        console.error('Error checking assessment access:', err);
        setAccessStatus('allowed');
      }
    };
    checkAccess();
  }, [currentUser]);

  // ── Timer tick ──
  useEffect(() => {
    if (!startTime || phase === 'name' || phase === 'submitting') return;
    const id = setInterval(() => {
      setElapsed(Date.now() - startTime.getTime());
    }, 1000);
    return () => clearInterval(id);
  }, [startTime, phase]);

  // ── Auto-save progress ──
  useEffect(() => {
    if (phase === 'name' || phase === 'submitting') return;
    const snapshot: SavedProgress = {
      studentName,
      phase,
      answers,
      aptitudeIndex,
      preferenceIndex,
      aptitudeOrder: aptitudeQs.map((q) => q.id),
      preferenceOrder: preferenceQs.map((q) => q.id),
      startTimeIso: startTime ? startTime.toISOString() : null,
      savedAt: Date.now(),
    };
    try {
      localStorage.setItem(PROGRESS_KEY, encodeProgress(snapshot));
    } catch {
      /* ignore quota / private-mode errors */
    }
  }, [phase, studentName, answers, aptitudeIndex, preferenceIndex, startTime, aptitudeQs, preferenceQs]);

  // ────────────────────────────────────────────
  // Derived values
  // ────────────────────────────────────────────

  const currentQ =
    phase === 'aptitude'
      ? aptitudeQs[aptitudeIndex]
      : phase === 'preference'
      ? preferenceQs[preferenceIndex]
      : null;

  const answeredCount = Object.keys(answers).length;
  const globalIndex =
    phase === 'aptitude' ? aptitudeIndex : phase === 'preference' ? aptitudeQs.length + preferenceIndex : 0;
  const isCurrentAnswered = currentQ ? answers[currentQ.id] !== undefined : false;

  // ────────────────────────────────────────────
  // Handlers
  // ────────────────────────────────────────────

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const startAssessment = async () => {
    const name = studentName.trim();
    if (!name) {
      alert('Please enter your name to start the assessment.');
      return;
    }
    if (!startTime) setStartTime(new Date());

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

  const handleAptitudeSelect = (qId: number, optionIndex: number) => {
    setAnswers((prev) => ({ ...prev, [qId]: optionIndex }));
  };

  const handlePreferenceSelect = (qId: number, likertValue: number) => {
    setAnswers((prev) => ({ ...prev, [qId]: likertValue }));
  };

  const handleNext = () => {
    if (phase === 'aptitude') {
      if (aptitudeIndex < aptitudeQs.length - 1) {
        setAptitudeIndex(aptitudeIndex + 1);
      } else {
        setPhase('preference');
        setPreferenceIndex(0);
      }
    } else if (phase === 'preference') {
      if (preferenceIndex < preferenceQs.length - 1) {
        setPreferenceIndex(preferenceIndex + 1);
      } else {
        // All questions answered — go to review screen, not direct submit.
        setPhase('review');
      }
    }
  };

  const handleBack = () => {
    if (phase === 'aptitude' && aptitudeIndex > 0) {
      setAptitudeIndex(aptitudeIndex - 1);
    } else if (phase === 'preference') {
      if (preferenceIndex > 0) {
        setPreferenceIndex(preferenceIndex - 1);
      } else {
        setPhase('aptitude');
        setAptitudeIndex(aptitudeQs.length - 1);
      }
    }
  };

  /** Jump from the review screen back into a specific question to change the answer. */
  const handleEditQuestion = (questionId: number) => {
    editSnapshot.current = { qId: questionId, prevValue: answers[questionId] };
    setEditingFromReview(true);
    const aptIdx = aptitudeQs.findIndex((q) => q.id === questionId);
    if (aptIdx >= 0) {
      setPhase('aptitude');
      setAptitudeIndex(aptIdx);
      return;
    }
    const prefIdx = preferenceQs.findIndex((q) => q.id === questionId);
    if (prefIdx >= 0) {
      setPhase('preference');
      setPreferenceIndex(prefIdx);
    }
  };

  /** Save the current answer (already in state via select handler) and return to review. */
  const handleSaveEdit = () => {
    editSnapshot.current = null;
    setEditingFromReview(false);
    setPhase('review');
  };

  /** Discard any change made while editing this question and return to review. */
  const handleCancelEdit = () => {
    const snap = editSnapshot.current;
    if (snap) {
      setAnswers((prev) => {
        const next = { ...prev };
        if (snap.prevValue === undefined) {
          delete next[snap.qId];
        } else {
          next[snap.qId] = snap.prevValue;
        }
        return next;
      });
    }
    editSnapshot.current = null;
    setEditingFromReview(false);
    setPhase('review');
  };

  const handleSubmit = () => {
    setPhase('submitting');

    setTimeout(async () => {
      const aptitudeAnswers: Record<number, number> = {};
      const preferenceAnswers: Record<number, number> = {};
      for (const q of aptitudeQs) {
        if (answers[q.id] !== undefined) aptitudeAnswers[q.id] = answers[q.id];
      }
      for (const q of preferenceQs) {
        if (answers[q.id] !== undefined) preferenceAnswers[q.id] = answers[q.id];
      }

      const rawAnswers: RawAnswers = {
        studentName: studentName.trim(),
        aptitude: aptitudeAnswers,
        preference: preferenceAnswers,
      };

      const reportData = buildReportFromAnswers(rawAnswers);

      if (currentUser) {
        try {
          await setDoc(doc(db, 'assessments', currentUser.uid), {
            uid: currentUser.uid,
            studentName: studentName.trim(),
            rawAnswers,
            reportData,
            completedAt: serverTimestamp(),
          });
          await updateDoc(doc(db, 'students', currentUser.uid), {
            assessmentCompleted: true,
          });
        } catch (err) {
          console.error('Failed to save assessment to Firestore:', err);
        }
      }

      try {
        localStorage.removeItem(PROGRESS_KEY);
      } catch {
        /* ignore */
      }

      onComplete(reportData);
      navigate('/report');
    }, 1500);
  };

  // ────────────────────────────────────────────
  // Render: Access checking / blocked
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
  // Render: Name Entry / Welcome
  // ────────────────────────────────────────────

  if (phase === 'name') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.logo}>
            <h1 style={{ margin: 0, fontSize: '1.8em', color: '#006D77' }}>Srichakra Academy</h1>
            <p style={{ margin: '2px 0 0', color: '#888', fontSize: '0.85em', fontStyle: 'italic' }}>
              (A Unit of SriKrpa Foundation Trust)
            </p>
            <p style={{ margin: '8px 0 0', color: '#666', fontSize: '1.1em' }}>
              SCOPE - Student Career & Opportunity Pathway Evaluation
            </p>
          </div>

          <div style={{ margin: '40px 0' }}>
            <h2 style={{ color: '#006D77', marginBottom: '10px' }}>Welcome!</h2>
            <p style={{ color: '#555', lineHeight: 1.7, fontSize: '1.05em' }}>
              This assessment has <strong>{TOTAL_QUESTIONS} questions</strong> in two parts:
            </p>
            <ul style={{ color: '#555', lineHeight: 2, fontSize: '1.0em', paddingLeft: '20px' }}>
              <li>
                <strong>Part 1:</strong> {TOTAL_APTITUDE} objective aptitude questions (has correct answers)
              </li>
              <li>
                <strong>Part 2:</strong> {TOTAL_PREFERENCE} self-report preference questions (no right or wrong answers)
              </li>
            </ul>
            <p style={{ color: '#555', lineHeight: 1.7, fontSize: '1.0em' }}>
              Estimated time: <strong>25–35 minutes</strong>.
            </p>

            <div
              style={{
                background: '#f0f8f8',
                border: '1px solid #b2d8d8',
                borderRadius: 10,
                padding: '14px 18px',
                marginTop: 16,
              }}
            >
              <p style={{ margin: '0 0 8px', color: '#006D77', fontSize: '0.95em', fontWeight: 700 }}>
                📋 Instructions — Please read before you begin:
              </p>
              <ul style={{ margin: 0, paddingLeft: '18px', color: '#444', fontSize: '0.92em', lineHeight: 1.9 }}>
                <li>
                  Find a <strong>quiet place</strong> free from distractions before starting.
                </li>
                <li>
                  Read each question <strong>carefully</strong> and pay full attention.
                </li>
                <li>
                  Answer every question <strong>genuinely and honestly</strong> — there are no right or wrong answers in
                  Part 2.
                </li>
                <li>
                  Do <strong>not</strong> rush. Take your time to think before selecting an answer.
                </li>
                <li>
                  Do <strong>not</strong> seek help from others — your responses should reflect <strong>your own</strong>{' '}
                  thoughts and preferences.
                </li>
              </ul>
            </div>

            <div
              style={{
                background: '#fff8f0',
                border: '1px solid #f0d8c0',
                borderRadius: 10,
                padding: '12px 16px',
                marginTop: 14,
              }}
            >
              <p style={{ margin: 0, color: '#8B6914', fontSize: '0.93em', lineHeight: 1.6 }}>
                ⚠️ <strong>Important:</strong> You can only take this assessment <strong>once</strong>. If you leave
                mid-way, you can resume within <strong>3 days</strong>. After that, the assessment will expire.
              </p>
            </div>

            <div
              style={{
                background: '#f5f0fa',
                border: '1px solid #d8cce8',
                borderRadius: 10,
                padding: '12px 16px',
                marginTop: 14,
              }}
            >
              <p style={{ margin: 0, color: '#6B5B80', fontSize: '0.88em', lineHeight: 1.6 }}>
                📌 <strong>Disclaimer:</strong> The assessment report and its outcomes are generated{' '}
                <strong>entirely based on your responses</strong>. The accuracy and relevance of the results depend on
                how honestly and attentively you answer. This report is meant for guidance purposes only and should not
                be considered a definitive evaluation of ability or potential.
              </p>
            </div>
          </div>

          <div style={{ marginTop: '30px' }}>
            <label style={{ fontWeight: 600, color: '#333', fontSize: '1.05em' }}>Student Name</label>
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
            onClick={startAssessment}
            disabled={!studentName.trim()}
            style={{
              ...styles.primaryBtn,
              opacity: studentName.trim() ? 1 : 0.5,
              cursor: studentName.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            {saved.current ? 'Resume Assessment →' : 'Start Assessment →'}
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
  // Render: Review (before final submit)
  // ────────────────────────────────────────────

  if (phase === 'review') {
    const aptUnanswered = aptitudeQs.filter((q) => answers[q.id] === undefined);
    const prefUnanswered = preferenceQs.filter((q) => answers[q.id] === undefined);
    const totalUnanswered = aptUnanswered.length + prefUnanswered.length;

    return (
      <div style={styles.container}>
        <div style={{ ...styles.card, maxWidth: 820 }}>
          <div style={styles.logo}>
            <h1 style={{ margin: 0, fontSize: '1.5em', color: '#006D77' }}>Review Your Answers</h1>
            <p style={{ margin: '8px 0 0', color: '#666', fontSize: '0.95em' }}>
              {studentName} — {answeredCount}/{TOTAL_QUESTIONS} answered • ⏱ {formatTime(elapsed)}
            </p>
          </div>

          {totalUnanswered > 0 && (
            <div
              style={{
                background: '#fff3cd',
                border: '1px solid #ffeeba',
                borderRadius: 8,
                padding: '12px 16px',
                margin: '20px 0',
                color: '#856404',
                fontSize: '0.95em',
              }}
            >
              ⚠️ You have <strong>{totalUnanswered}</strong> unanswered question
              {totalUnanswered === 1 ? '' : 's'}. Please answer all questions before submitting.
            </div>
          )}

          <div style={{ marginTop: 20 }}>
            <h3 style={{ color: '#006D77', borderBottom: '2px solid #e0e0e0', paddingBottom: 6 }}>
              Part 1: Aptitude ({aptitudeQs.length} questions)
            </h3>
            <ol style={{ paddingLeft: 20, margin: '12px 0 24px' }}>
              {aptitudeQs.map((q, i) => {
                const sel = answers[q.id];
                const selectedText =
                  sel !== undefined ? `${String.fromCharCode(65 + sel)}. ${q.options[sel]}` : 'Not answered';
                return (
                  <li key={q.id} style={{ marginBottom: 10, lineHeight: 1.5 }}>
                    <div style={{ color: '#333', fontSize: '0.95em' }}>
                      <strong>Q{i + 1}.</strong> {q.question.replace(/\n/g, ' ')}
                    </div>
                    <div
                      style={{
                        marginTop: 4,
                        marginLeft: 8,
                        fontSize: '0.9em',
                        color: sel === undefined ? '#c62828' : '#006D77',
                      }}
                    >
                      Your answer: <strong>{selectedText}</strong>{' '}
                      <button
                        onClick={() => handleEditQuestion(q.id)}
                        style={styles.editBtn}
                      >
                        Edit
                      </button>
                    </div>
                  </li>
                );
              })}
            </ol>

            <h3 style={{ color: '#E29578', borderBottom: '2px solid #e0e0e0', paddingBottom: 6 }}>
              Part 2: Preferences ({preferenceQs.length} questions)
            </h3>
            <ol style={{ paddingLeft: 20, margin: '12px 0 24px' }}>
              {preferenceQs.map((q, i) => {
                const sel = answers[q.id];
                const label = LIKERT_LABELS.find((l) => l.value === sel)?.label;
                const selectedText = sel !== undefined ? `${sel} — ${label}` : 'Not answered';
                return (
                  <li key={q.id} style={{ marginBottom: 10, lineHeight: 1.5 }}>
                    <div style={{ color: '#333', fontSize: '0.95em' }}>
                      <strong>Q{i + 1}.</strong> {q.question}
                    </div>
                    <div
                      style={{
                        marginTop: 4,
                        marginLeft: 8,
                        fontSize: '0.9em',
                        color: sel === undefined ? '#c62828' : '#E29578',
                      }}
                    >
                      Your answer: <strong>{selectedText}</strong>{' '}
                      <button
                        onClick={() => handleEditQuestion(q.id)}
                        style={styles.editBtn}
                      >
                        Edit
                      </button>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          <div style={{ ...styles.navBar, marginTop: 32 }}>
            <button
              onClick={() => {
                setPhase('preference');
                setPreferenceIndex(preferenceQs.length - 1);
              }}
              style={styles.navBtn}
            >
              ← Back to Questions
            </button>
            <button
              onClick={handleSubmit}
              disabled={totalUnanswered > 0}
              style={{
                ...styles.primaryBtn,
                opacity: totalUnanswered > 0 ? 0.5 : 1,
                cursor: totalUnanswered > 0 ? 'not-allowed' : 'pointer',
                margin: 0,
                padding: '12px 32px',
                width: 'auto',
              }}
            >
              Submit Assessment ✓
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────
  // Render: Question (aptitude or preference)
  // ────────────────────────────────────────────

  if (!currentQ) {
    return null;
  }

  const progressPct = ((globalIndex + 1) / TOTAL_QUESTIONS) * 100;
  const sectionLabel = phase === 'aptitude' ? 'Part 1: Aptitude' : 'Part 2: Preferences';
  const currentIndex = phase === 'aptitude' ? aptitudeIndex : preferenceIndex;
  const sectionTotal = phase === 'aptitude' ? aptitudeQs.length : preferenceQs.length;
  const sectionProgress = `Question ${currentIndex + 1} of ${sectionTotal}`;
  const isLastOverall = phase === 'preference' && preferenceIndex === preferenceQs.length - 1;

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
              {answeredCount}/{TOTAL_QUESTIONS} answered
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

          {phase === 'aptitude' && (
            <div style={{ marginTop: '24px' }}>
              {(currentQ as AptitudeQuestion).options.map((opt, idx) => {
                const selected = answers[currentQ.id] === idx;
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
                    <span style={styles.optionLetter}>{String.fromCharCode(65 + idx)}</span>
                    {opt}
                  </button>
                );
              })}
            </div>
          )}

          {phase === 'preference' && (
            <div style={{ marginTop: '24px' }}>
              <div style={styles.likertContainer}>
                {LIKERT_LABELS.map((item) => {
                  const selected = answers[currentQ.id] === item.value;
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
          {editingFromReview ? (
            <>
              <button onClick={handleCancelEdit} style={styles.navBtn}>
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={!isCurrentAnswered}
                style={{
                  ...styles.primaryBtn,
                  opacity: isCurrentAnswered ? 1 : 0.5,
                  cursor: isCurrentAnswered ? 'pointer' : 'not-allowed',
                  margin: 0,
                  padding: '12px 32px',
                  width: 'auto',
                }}
              >
                Save & Return to Review ✓
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleBack}
                disabled={phase === 'aptitude' && aptitudeIndex === 0}
                style={{
                  ...styles.navBtn,
                  opacity: phase === 'aptitude' && aptitudeIndex === 0 ? 0.3 : 1,
                  cursor: phase === 'aptitude' && aptitudeIndex === 0 ? 'not-allowed' : 'pointer',
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
                  width: 'auto',
                }}
              >
                {isLastOverall ? 'Review Answers →' : 'Next →'}
              </button>
            </>
          )}
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
  editBtn: {
    marginLeft: 8,
    padding: '2px 10px',
    background: 'transparent',
    color: '#006D77',
    border: '1px solid #006D77',
    borderRadius: '12px',
    fontSize: '0.78em',
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
