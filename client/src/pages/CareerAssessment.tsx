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

import React, { useRef, useCallback } from 'react';
import { generateFullReport, ReportData } from './reportTemplate';

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

  // ── Download as HTML file (portable, print-to-PDF from browser) ──
  const handleDownload = useCallback(() => {
    const blob = new Blob([reportHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Career_Assessment_Report_${(props.studentName || 'Student').replace(/\s+/g, '_')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [reportHtml, props.studentName]);

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
          Career Assessment Report — {props.studentName}
        </h2>
        <div style={{ flex: 1 }} />
        <button onClick={handlePrint} style={toolbarBtnStyle}>
          Print / Save PDF
        </button>
        <button onClick={handleDownload} style={toolbarBtnStyle}>
          Download HTML
        </button>
      </div>

      {/* ── Report Preview (sandboxed iframe) ── */}
      <iframe
        ref={iframeRef}
        srcDoc={reportHtml}
        title="Career Assessment Report Preview"
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
