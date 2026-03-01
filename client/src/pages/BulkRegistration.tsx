/**
 * BULK REGISTRATION PAGE
 *
 * For schools & counsellors to register multiple students at once.
 *
 * Two modes:
 *   1. CSV Upload — upload a file with columns: Name, Email, Phone
 *   2. Manual Entry — add students row by row in a table
 *
 * Each student gets a Firebase Auth account + Firestore profile.
 * Default password: first 4 chars of name (lowercase) + last 4 digits of phone.
 * Students can change their password after first login.
 *
 * Access: Admin-only (requires login).
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getFunctions, httpsCallable } from 'firebase/functions';
import app from '../firebase';

// Connect to asia-south1 region (matches Cloud Function deployment)
const functions = getFunctions(app, 'asia-south1');

interface StudentRow {
  name: string;
  email: string;
  phone: string;
  status: 'pending' | 'registering' | 'success' | 'error';
  message: string;
}

function generatePassword(name: string, phone: string): string {
  const namePart = name.replace(/\s/g, '').toLowerCase().slice(0, 4);
  const phonePart = phone.replace(/\D/g, '').slice(-4);
  return `${namePart}${phonePart}`;
}

const BulkRegistration: React.FC = () => {
  const { currentUser, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileRef = useRef<HTMLInputElement>(null);

  const [students, setStudents] = useState<StudentRow[]>([
    { name: '', email: '', phone: '', status: 'pending', message: '' },
  ]);
  const [processing, setProcessing] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [registrationType, setRegistrationType] = useState<'school' | 'individual'>('school');
  const [summary, setSummary] = useState<{ total: number; success: number; failed: number } | null>(null);

  // Pre-fill org name from URL query param (e.g. from Add Academic Partner flow)
  useEffect(() => {
    const org = searchParams.get('org');
    if (org) setOrgName(org);
  }, [searchParams]);

  // Guard
  if (!currentUser || !isAdmin) {
    return (
      <div style={st.container}>
        <div style={st.card}>
          <p style={{ textAlign: 'center', padding: 40, color: '#999' }}>
            Admin access required.{' '}
            <button onClick={() => navigate('/admin/login')} style={st.linkBtn}>
              Login as Admin
            </button>
          </p>
        </div>
      </div>
    );
  }

  // ── Add row ──
  const addRow = () => {
    setStudents((prev) => [
      ...prev,
      { name: '', email: '', phone: '', status: 'pending', message: '' },
    ]);
  };

  // ── Remove row ──
  const removeRow = (index: number) => {
    setStudents((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Update row ──
  const updateRow = (index: number, field: keyof StudentRow, value: string) => {
    setStudents((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  };

  // ── CSV upload ──
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split(/\r?\n/).filter((l) => l.trim());

      // Skip header if it looks like one
      const startIdx = /name/i.test(lines[0]) ? 1 : 0;

      const parsed: StudentRow[] = [];
      for (let i = startIdx; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
        if (cols.length >= 2) {
          parsed.push({
            name: cols[0] || '',
            email: cols[1] || '',
            phone: cols[2] || '',
            status: 'pending',
            message: '',
          });
        }
      }

      if (parsed.length > 0) {
        setStudents(parsed);
      } else {
        alert('No valid rows found. Expected CSV format:\nName, Email, Phone');
      }
    };
    reader.readAsText(file);

    // Reset input so same file can be re-selected
    if (fileRef.current) fileRef.current.value = '';
  };

  // ── Download CSV template ──
  const downloadTemplate = () => {
    const csv = 'Name,Email,Phone\nRahul Kumar,rahul@school.edu,9876543210\nPriya Singh,priya@school.edu,9876543211\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_registration_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Register all (via server-side Cloud Function — no rate limits) ──
  const handleRegisterAll = async () => {
    const valid = students.filter(
      (s) => s.name.trim() && s.email.trim() && s.status !== 'success'
    );
    if (valid.length === 0) {
      alert('No valid students to register. Ensure Name and Email are filled.');
      return;
    }

    setProcessing(true);
    setSummary(null);

    // Mark all valid rows as registering
    setStudents((prev) =>
      prev.map((row) =>
        row.name.trim() && row.email.trim() && row.status !== 'success'
          ? { ...row, status: 'registering', message: 'Creating account...' }
          : row
      )
    );

    try {
      // Build payload for Cloud Function
      const studentPayload = valid.map((s) => ({
        name: s.name.trim(),
        email: s.email.trim(),
        phone: s.phone.trim(),
        password: generatePassword(s.name, s.phone),
      }));

      const bulkRegister = httpsCallable(functions, 'bulkRegisterStudents');
      const result = await bulkRegister({
        students: studentPayload,
        organization: orgName.trim() || '',
        registrationType,
      });

      const data = result.data as {
        results: Array<{ email: string; success: boolean; error?: string; uid?: string }>;
        total: number;
        success: number;
        failed: number;
      };

      // Map server results back to the UI rows
      const resultMap = new Map(data.results.map((r) => [r.email.toLowerCase(), r]));

      setStudents((prev) =>
        prev.map((row) => {
          const res = resultMap.get(row.email.trim().toLowerCase());
          if (!res) return row; // not part of this batch
          if (res.success) {
            const pw = generatePassword(row.name, row.phone);
            return { ...row, status: 'success', message: `✓ Registered (password: ${pw})` };
          } else {
            return { ...row, status: 'error', message: `✗ ${res.error || 'Unknown error'}` };
          }
        })
      );

      setSummary({ total: data.total, success: data.success, failed: data.failed });
    } catch (err: any) {
      console.error('Bulk registration failed:', err);
      const msg = err?.message || 'Bulk registration failed. Please try again.';
      // Mark all registering rows as error
      setStudents((prev) =>
        prev.map((row) =>
          row.status === 'registering'
            ? { ...row, status: 'error', message: `✗ ${msg}` }
            : row
        )
      );
      setSummary({ total: valid.length, success: 0, failed: valid.length });
    }

    setProcessing(false);
  };

  // ── Clear all ──
  const handleClear = () => {
    setStudents([{ name: '', email: '', phone: '', status: 'pending', message: '' }]);
    setSummary(null);
  };

  return (
    <div style={st.container}>
      <div style={st.card}>
        {/* Header */}
        <div style={st.header}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.4em', color: '#fff' }}>Bulk Student Registration</h1>
            <p style={{ margin: '4px 0 0', color: '#83C5BE', fontSize: '0.9em' }}>
              For schools &amp; counsellors
            </p>
          </div>
          <button onClick={() => navigate('/admin')} style={st.backBtn}>
            ← Dashboard
          </button>
        </div>

        {/* Instructions */}
        <div style={st.infoBox}>
          <strong>How it works:</strong>
          <ul style={{ margin: '8px 0 0', paddingLeft: 20, lineHeight: 1.8 }}>
            <li>Upload a CSV file or add students manually below</li>
            <li>Each student gets an account with a default password: <strong>first 4 chars of name + last 4 digits of phone</strong></li>
            <li>Students are registered with <strong>approved</strong> access and can take the assessment immediately</li>
            <li>All accounts are created server-side in one batch — <strong>fast &amp; no rate limits</strong></li>
            <li>Example: "Rahul Kumar" + phone "9876543210" → password: <code>rahu3210</code></li>
          </ul>
        </div>

        {/* Organization name */}
        <div style={{ padding: '0 24px' }}>
          <label style={st.label}>School / Organization Name (optional)</label>
          <input
            type="text"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            placeholder="e.g. Delhi Public School, Coimbatore"
            style={{ ...st.input, maxWidth: 440 }}
          />
        </div>

        {/* Registration type selector */}
        <div style={{ padding: '0 24px', marginTop: 12 }}>
          <label style={st.label}>Registration Type</label>
          <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
            <button
              type="button"
              onClick={() => setRegistrationType('school')}
              style={{
                padding: '8px 20px',
                borderRadius: 8,
                border: registrationType === 'school' ? '2px solid #006D77' : '1px solid #e2e8f0',
                background: registrationType === 'school' ? '#f0fdfa' : '#fff',
                color: registrationType === 'school' ? '#006D77' : '#718096',
                fontWeight: registrationType === 'school' ? 700 : 500,
                cursor: 'pointer',
                fontSize: '0.92em',
              }}
            >
              🏫 School / Partner
            </button>
            <button
              type="button"
              onClick={() => setRegistrationType('individual')}
              style={{
                padding: '8px 20px',
                borderRadius: 8,
                border: registrationType === 'individual' ? '2px solid #006D77' : '1px solid #e2e8f0',
                background: registrationType === 'individual' ? '#f0fdfa' : '#fff',
                color: registrationType === 'individual' ? '#006D77' : '#718096',
                fontWeight: registrationType === 'individual' ? 700 : 500,
                cursor: 'pointer',
                fontSize: '0.92em',
              }}
            >
              👤 Individual
            </button>
          </div>
          <p style={{ margin: '6px 0 0', fontSize: '0.82em', color: '#999' }}>
            {registrationType === 'school'
              ? 'School-registered students — approve after collecting payment from school.'
              : 'Individual students registered by admin — approve after collecting GPay/cash/bank payment.'}
          </p>
        </div>

        {/* CSV upload + template */}
        <div style={st.csvBar}>
          <button onClick={downloadTemplate} style={st.outlineBtn}>
            📥 Download CSV Template
          </button>
          <label style={st.uploadLabel}>
            📤 Upload CSV
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleCSVUpload}
              style={{ display: 'none' }}
            />
          </label>
          <span style={{ color: '#999', fontSize: '0.85em' }}>
            CSV format: Name, Email, Phone
          </span>
        </div>

        {/* Student table */}
        <div style={{ padding: '0 24px', overflowX: 'auto' }}>
          <table style={st.table}>
            <thead>
              <tr>
                <th style={st.th}>#</th>
                <th style={st.th}>Name *</th>
                <th style={st.th}>Email *</th>
                <th style={st.th}>Phone</th>
                <th style={st.th}>Status</th>
                <th style={st.th}></th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, i) => (
                <tr key={i} style={i % 2 === 0 ? st.rowEven : {}}>
                  <td style={st.td}>{i + 1}</td>
                  <td style={st.td}>
                    <input
                      type="text"
                      value={s.name}
                      onChange={(e) => updateRow(i, 'name', e.target.value)}
                      placeholder="Full name"
                      style={st.cellInput}
                      disabled={s.status === 'success' || processing}
                    />
                  </td>
                  <td style={st.td}>
                    <input
                      type="email"
                      value={s.email}
                      onChange={(e) => updateRow(i, 'email', e.target.value)}
                      placeholder="student@email.com"
                      style={st.cellInput}
                      disabled={s.status === 'success' || processing}
                    />
                  </td>
                  <td style={st.td}>
                    <input
                      type="tel"
                      value={s.phone}
                      onChange={(e) => updateRow(i, 'phone', e.target.value)}
                      placeholder="Phone number"
                      style={st.cellInput}
                      disabled={s.status === 'success' || processing}
                    />
                  </td>
                  <td style={st.td}>
                    {s.status === 'pending' && <span style={{ color: '#999' }}>—</span>}
                    {s.status === 'registering' && <span style={{ color: '#3182ce' }}>⏳ Registering...</span>}
                    {s.status === 'success' && <span style={{ color: '#38a169', fontSize: '0.85em' }}>{s.message}</span>}
                    {s.status === 'error' && <span style={{ color: '#e53e3e', fontSize: '0.85em' }}>{s.message}</span>}
                  </td>
                  <td style={st.td}>
                    {s.status !== 'success' && !processing && (
                      <button
                        onClick={() => removeRow(i)}
                        style={st.removeBtn}
                        title="Remove row"
                        disabled={students.length <= 1}
                      >
                        ✕
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Action buttons */}
        <div style={st.actions}>
          <button
            onClick={addRow}
            style={st.outlineBtn}
            disabled={processing}
          >
            + Add Row
          </button>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={handleClear}
              style={{ ...st.outlineBtn, borderColor: '#e53e3e', color: '#e53e3e' }}
              disabled={processing}
            >
              Clear All
            </button>
            <button
              onClick={handleRegisterAll}
              style={st.primaryBtn}
              disabled={processing}
            >
              {processing ? 'Registering...' : `Register ${students.filter((s) => s.name.trim() && s.email.trim() && s.status !== 'success').length} Students`}
            </button>
          </div>
        </div>

        {/* Summary */}
        {summary && (
          <div style={st.summaryBox}>
            <strong>Registration Complete</strong>
            <div style={{ marginTop: 8 }}>
              Total processed: <strong>{summary.total}</strong> &nbsp;|&nbsp;
              <span style={{ color: '#38a169' }}>✓ Success: {summary.success}</span> &nbsp;|&nbsp;
              <span style={{ color: '#e53e3e' }}>✗ Failed: {summary.failed}</span>
            </div>
            {summary.success > 0 && (
              <p style={{ marginTop: 10, fontSize: '0.9em', color: '#555' }}>
                Students can now log in at the assessment portal with their email and default password.
              </p>
            )}
          </div>
        )}

        {/* Password note */}
        <div style={st.noteBox}>
          <strong>🔑 Default Password Formula:</strong>{' '}
          first 4 letters of name (lowercase, no spaces) + last 4 digits of phone.
          <br />
          If no phone is provided, only the name part is used (must be 6+ chars).
          <br />
          Students should change their password after first login.
        </div>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────
// Styles
// ────────────────────────────────────────────
const st: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: '#f0f2f5',
    padding: '30px 20px',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  card: {
    maxWidth: '1000px',
    margin: '0 auto',
    background: '#fff',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    overflow: 'hidden',
    paddingBottom: 24,
  },
  header: {
    background: '#006D77',
    padding: '20px 28px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backBtn: {
    background: '#E29578',
    color: '#fff',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '0.95em',
  },
  infoBox: {
    background: '#f0faf9',
    border: '1px solid #83C5BE',
    borderRadius: '10px',
    padding: '16px 20px',
    margin: '20px 24px',
    fontSize: '0.92em',
    color: '#2d3748',
  },
  label: {
    display: 'block',
    fontSize: '0.9em',
    fontWeight: 600,
    color: '#333',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '0.95em',
    outline: 'none',
    boxSizing: 'border-box' as const,
  },
  csvBar: {
    display: 'flex',
    gap: 12,
    alignItems: 'center',
    padding: '16px 24px',
    flexWrap: 'wrap' as const,
  },
  outlineBtn: {
    background: 'transparent',
    border: '2px solid #006D77',
    color: '#006D77',
    padding: '8px 18px',
    borderRadius: '8px',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '0.9em',
  },
  uploadLabel: {
    background: '#006D77',
    color: '#fff',
    padding: '8px 18px',
    borderRadius: '8px',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '0.9em',
    display: 'inline-block',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: '0.9em',
  },
  th: {
    textAlign: 'left' as const,
    padding: '10px 8px',
    borderBottom: '2px solid #e0e0e0',
    color: '#555',
    fontWeight: 600,
    fontSize: '0.85em',
    textTransform: 'uppercase' as const,
  },
  td: {
    padding: '8px',
    borderBottom: '1px solid #f0f0f0',
    verticalAlign: 'middle' as const,
  },
  rowEven: {
    background: '#fafafa',
  },
  cellInput: {
    width: '100%',
    padding: '8px 10px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '0.95em',
    outline: 'none',
    boxSizing: 'border-box' as const,
    minWidth: 120,
  },
  removeBtn: {
    background: 'none',
    border: 'none',
    color: '#e53e3e',
    fontSize: '1.1em',
    cursor: 'pointer',
    padding: '4px 8px',
  },
  actions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    flexWrap: 'wrap' as const,
    gap: 12,
  },
  primaryBtn: {
    background: '#006D77',
    color: '#fff',
    border: 'none',
    padding: '12px 28px',
    borderRadius: '8px',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '1em',
    transition: 'background 0.2s',
  },
  summaryBox: {
    background: '#f0faf9',
    border: '1px solid #83C5BE',
    borderRadius: '10px',
    padding: '16px 20px',
    margin: '0 24px 16px',
    fontSize: '0.95em',
  },
  noteBox: {
    background: '#fffff0',
    border: '1px solid #ecc94b',
    borderRadius: '10px',
    padding: '14px 20px',
    margin: '0 24px',
    fontSize: '0.88em',
    color: '#744210',
    lineHeight: 1.7,
  },
  linkBtn: {
    background: 'none',
    border: 'none',
    color: '#006D77',
    cursor: 'pointer',
    fontSize: '0.95em',
    textDecoration: 'underline',
  },
};

export default BulkRegistration;
