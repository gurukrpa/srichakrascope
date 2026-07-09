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

const PAGE_TITLES = [
  '1. Executive Summary',
  '2. Aptitude Snapshot',
  '3. Preference Analysis',
  '4. Brain & Learning',
  '5. Class 10 Stream',
  '6. Class 12 Course Family',
  '7. Career Clusters',
  '8. Action Steps',
];
const TOTAL_PAGES = PAGE_TITLES.length;
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

  // Multiple Intelligences, MBTI, and validity — pre-computed
  miScores?: ReportData['miScores'];
  mbti?: ReportData['mbti'];
  consistency?: ReportData['consistency'];
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
    miScores: props.miScores,
    mbti: props.mbti,
    consistency: props.consistency,
  };
}

const CareerAssessment: React.FC<CareerAssessmentProps> = (props) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // ── Generate the full HTML report string ──
  const reportData = buildReportData(props);
  const reportHtml = generateFullReport(reportData);

  // ── Auth context for student email + admin flag ──
  const { currentUser, isAdmin } = useAuth();
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

  // ── Print the report in a new window (reliable across Chrome / Firefox / Edge) ──
  // Calling iframe.contentWindow.print() stopped working in modern Chrome — the
  // browser either ignores the call or prints the parent page instead. Opening a
  // Blob URL in a new tab and calling print() there is the safest cross-browser fix.
  const handlePrint = useCallback(() => {
    const blob = new Blob([reportHtml], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const printWin = window.open(blobUrl, '_blank');
    if (!printWin) {
      // Popup blocked — tell the user rather than silently failing
      alert(
        'Your browser blocked the print window.\n\n' +
        'Please allow pop-ups for this site, then try again.\n\n' +
        'Alternatively, use "Download HTML" and open the file in Chrome to print.'
      );
      URL.revokeObjectURL(blobUrl);
      return;
    }
    printWin.addEventListener(
      'load',
      () => {
        printWin.focus();
        printWin.print();
        URL.revokeObjectURL(blobUrl);
      },
      { once: true }
    );
  }, [reportHtml]);

  // ── Page navigation inside the iframe ──
  const [currentPage, setCurrentPage] = useState(1);
  const [showScrollHint, setShowScrollHint] = useState(true);

  const goToPage = useCallback((n: number) => {
    const clamped = Math.max(1, Math.min(TOTAL_PAGES, n));
    const doc = iframeRef.current?.contentWindow?.document;
    const target = doc?.getElementById(`report-page-${clamped}`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setCurrentPage(clamped);
      setShowScrollHint(false);
    }
  }, []);

  // Sync currentPage as the user scrolls inside the iframe.
  const handleIframeLoad = useCallback(() => {
    const win = iframeRef.current?.contentWindow;
    const doc = win?.document;
    if (!win || !doc) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      let topMost = 1;
      for (let i = 1; i <= TOTAL_PAGES; i++) {
        const el = doc.getElementById(`report-page-${i}`);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        // The page whose top is closest to the viewport top (but not below it
        // by more than half a viewport) is the "current" page.
        if (rect.top <= win.innerHeight * 0.4) {
          topMost = i;
        } else {
          break;
        }
      }
      setCurrentPage(topMost);
    };
    const onScroll = () => {
      if (raf) return;
      raf = win.requestAnimationFrame(update);
      setShowScrollHint(false);
    };
    win.addEventListener('scroll', onScroll, { passive: true });
    update();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}>
      {/* ── Toolbar ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 16px',
          background: '#006D77',
          color: '#fff',
          flexWrap: 'wrap',
        }}
      >
        <h2 style={{ margin: 0, fontSize: '1.05em' }}>
          SCOPE Report — {props.studentName}
        </h2>

        {/* Page navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            style={{ ...navBtnStyle, opacity: currentPage <= 1 ? 0.5 : 1 }}
            aria-label="Previous page"
          >
            ◀ Prev
          </button>
          <select
            value={currentPage}
            onChange={(e) => goToPage(Number(e.target.value))}
            style={pageSelectStyle}
            aria-label="Jump to page"
          >
            {PAGE_TITLES.map((title, idx) => (
              <option key={idx} value={idx + 1}>{title}</option>
            ))}
          </select>
          <span style={{ fontSize: '0.85em', opacity: 0.9, whiteSpace: 'nowrap' }}>
            Page {currentPage} of {TOTAL_PAGES}
          </span>
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= TOTAL_PAGES}
            style={{ ...navBtnStyle, opacity: currentPage >= TOTAL_PAGES ? 0.5 : 1 }}
            aria-label="Next page"
          >
            Next ▶
          </button>
        </div>

        <div style={{ flex: 1 }} />
        <button onClick={handlePrint} style={toolbarBtnStyle}>
          Print / Save PDF
        </button>
        {isAdmin && (
          <button
            onClick={() => window.open('/counsellor-note', '_blank', 'noopener')}
            style={toolbarBtnStyle}
            title="Open the counsellor-only interpretation note in a new tab"
          >
            📋 Counsellor's Note
          </button>
        )}
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
      <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
        <iframe
          ref={iframeRef}
          srcDoc={reportHtml}
          title="SCOPE Assessment Report Preview"
          onLoad={handleIframeLoad}
          scrolling="yes"
          style={{ border: 'none', width: '100%', height: '100%', display: 'block' }}
        />
        {showScrollHint && (
          <div
            onClick={() => goToPage(currentPage + 1)}
            style={{
              position: 'absolute',
              right: 24,
              bottom: 24,
              padding: '10px 16px',
              background: 'rgba(0, 109, 119, 0.92)',
              color: '#fff',
              borderRadius: 24,
              fontSize: '0.9em',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
              userSelect: 'none',
            }}
          >
            Scroll for more ↓ ({TOTAL_PAGES - 1} more pages)
          </div>
        )}
      </div>
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

const navBtnStyle: React.CSSProperties = {
  padding: '6px 10px',
  background: 'rgba(255,255,255,0.15)',
  color: '#fff',
  border: '1px solid rgba(255,255,255,0.4)',
  borderRadius: 4,
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: '0.85em',
};

const pageSelectStyle: React.CSSProperties = {
  padding: '6px 8px',
  background: '#fff',
  color: '#006D77',
  border: '1px solid #fff',
  borderRadius: 4,
  fontWeight: 600,
  fontSize: '0.85em',
  cursor: 'pointer',
};

export default CareerAssessment;
