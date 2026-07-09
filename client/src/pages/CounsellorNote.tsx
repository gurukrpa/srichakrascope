/**
 * COUNSELLOR'S NOTE — standalone download page.
 *
 * Renders the one-page interpretation guide in an iframe with a single
 * "Download PDF" button. Lives at /counsellor-note (uses cached reportData)
 * and /counsellor-note/demo (uses DEMO_DATA). Not linked from the student
 * report — counsellors navigate here directly.
 */

import React, { useCallback, useMemo, useRef } from 'react';
import { generateCounsellorNote, ReportData } from './reportTemplate';

interface Props {
  data: ReportData;
}

const CounsellorNote: React.FC<Props> = ({ data }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const noteHtml = useMemo(() => generateCounsellorNote(data), [data]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([noteHtml], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const win = window.open(blobUrl, '_blank');
    if (!win) {
      alert('Pop-up blocked. Please allow pop-ups to download the counsellor\u2019s note.');
      URL.revokeObjectURL(blobUrl);
      return;
    }
    win.addEventListener(
      'load',
      () => {
        win.focus();
        win.print();
        URL.revokeObjectURL(blobUrl);
      },
      { once: true }
    );
  }, [noteHtml]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '10px 18px',
          background: '#006D77',
          color: '#fff',
          flexWrap: 'wrap',
        }}
      >
        <h2 style={{ margin: 0, fontSize: '1.05em' }}>
          Counsellor&rsquo;s Note &mdash; {data.studentName || 'Student'}
        </h2>
        <div style={{ flex: 1 }} />
        <button
          onClick={handleDownload}
          style={{
            padding: '8px 16px',
            background: '#fff',
            color: '#006D77',
            border: 'none',
            borderRadius: 4,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          &#x1f4e5; Download PDF
        </button>
      </div>

      <iframe
        ref={iframeRef}
        srcDoc={noteHtml}
        title="Counsellor's Note Preview"
        style={{ border: 'none', flex: 1, width: '100%', display: 'block' }}
      />
    </div>
  );
};

export default CounsellorNote;
