/**
 * CAREER ASSESSMENT - Runtime Report Consumer
 *
 * Single responsibility: wire pre-computed assessment data into the
 * report engine and present the output.
 *
 * - NO report HTML lives here
 * - NO scoring, question logic, or calculation
 * - Data flows IN, report HTML flows OUT
 */

import React, { useRef, useCallback, useState } from 'react';
import { generateFullReport, ReportData } from './reportTemplate';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Props accepted by CareerAssessment.
 * Every field mirrors ReportData — the caller supplies already-computed values.
 */
interface CareerAssessmentProps {
  // Student info
  studentName?: string;
  assessmentDate?: string;

  // Pre-computed scores
  aptitudeScores?: ReportData['aptitudeScores'];
  preferenceScores?: ReportData['preferenceScores'];
  dominantHemisphere?: ReportData['dominantHemisphere'];
  learningStyles?: ReportData['learningStyles'];

  // Pre-computed recommendations
  streamRecommendations?: ReportData['streamRecommendations'];
  courseFamilyRecommendations?: ReportData['courseFamilyRecommendations'];
  careerClusters?: ReportData['careerClusters'];

  // Stats
  totalAnswered?: ReportData['totalAnswered'];
  completionRate?: ReportData['completionRate'];
}

/**
 * Map props directly to a ReportData object — no transformation, no defaults.
 */
function buildReportData(props: CareerAssessmentProps): ReportData {
  return {
    studentName: props.studentName,
    assessmentDate: props.assessmentDate,
    aptitudeScores: props.aptitudeScores,
    preferenceScores: props.preferenceScores,
    dominantHemisphere: props.dominantHemisphere,
    learningStyles: props.learningStyles,
    streamRecommendations: props.streamRecommendations,
    courseFamilyRecommendations: props.courseFamilyRecommendations,
    careerClusters: props.careerClusters,
    totalAnswered: props.totalAnswered,
    completionRate: props.completionRate,
  };
}

const CareerAssessment: React.FC<CareerAssessmentProps> = (props) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // ── Generate the full HTML report string ──
  const reportData = buildReportData(props);
  const reportHtml = generateFullReport(reportData);

  // ── Auth context for student email ──
  const { currentUser } = useAuth();
  const studentEmail = currentUser?.email || '';

  // ── Send report via email (saves request to Firestore) ──
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const handleSendEmail = useCallback(async () => {
    if (!studentEmail) {
      alert('No email address found for this student.');
      return;
    }
    setEmailStatus('sending');
    try {
      await addDoc(collection(db, 'emailRequests'), {
        to: studentEmail,
        studentName: props.studentName || 'Student',
        reportHtml,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      setEmailStatus('sent');
    } catch (err) {
      console.error('Failed to queue email:', err);
      setEmailStatus('error');
      alert('Failed to send email. Please try again or use Print / Save PDF to download your report.');
    }
  }, [reportHtml, props.studentName, studentEmail]);

  // ── Print the iframe content (triggers browser print dialog / Save as PDF) ──
  const handlePrint = useCallback(() => {
    const iframe = iframeRef.current;
    if (iframe?.contentWindow) {
      iframe.contentWindow.print();
    }
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* ── Toolbar ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 20px',
          background: '#006D77',
          color: '#fff',
        }}
      >
        <h2 style={{ margin: 0, fontSize: '1.1em' }}>
          SCOPE Report — {props.studentName}
        </h2>
        <div style={{ flex: 1 }} />
        <button onClick={handlePrint} style={toolbarBtnStyle}>
          Print / Save PDF
        </button>
        <button
          onClick={handleSendEmail}
          disabled={emailStatus === 'sending'}
          style={{
            ...toolbarBtnStyle,
            ...(emailStatus === 'sent' ? { background: '#38a169', color: '#fff', border: '1px solid #38a169' } : {}),
            ...(emailStatus === 'error' ? { background: '#e53e3e', color: '#fff', border: '1px solid #e53e3e' } : {}),
          }}
        >
          {emailStatus === 'idle' && '📧 Send Report on Email'}
          {emailStatus === 'sending' && 'Sending…'}
          {emailStatus === 'sent' && '✓ Email Queued!'}
          {emailStatus === 'error' && '✗ Failed — Retry'}
        </button>
      </div>

      {/* ── Report Preview (sandboxed iframe) ── */}
      <iframe
        ref={iframeRef}
        srcDoc={reportHtml}
        title="SCOPE Assessment Report Preview"
        style={{ flex: 1, border: 'none', width: '100%' }}
      />
    </div>
  );
};

const toolbarBtnStyle: React.CSSProperties = {
  padding: '8px 16px',
  background: '#fff',
  color: '#006D77',
  border: '1px solid #fff',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: '0.9em',
};

export default CareerAssessment;
