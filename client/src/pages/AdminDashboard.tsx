/**
 * ADMIN DASHBOARD
 *
 * Shows:
 * - List of all registered students
 * - Each student's assessment status
 * - "View Report" link for completed assessments
 * - Logout button
 *
 * Reads from Firestore: students, assessments collections
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, getDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import CareerAssessment from './CareerAssessment';
import type { ReportData } from './reportTemplate';

interface StudentRecord {
  uid: string;
  name: string;
  email: string;
  phone: string;
  createdAt: any;
  assessmentCompleted: boolean;
}

const AdminDashboard: React.FC = () => {
  const { currentUser, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Report viewer state
  const [viewingReport, setViewingReport] = useState<ReportData | null>(null);
  const [viewingStudentName, setViewingStudentName] = useState('');
  const [reportLoading, setReportLoading] = useState(false);

  // Guard: redirect non-admin users
  useEffect(() => {
    if (!currentUser) {
      navigate('/admin/login');
    } else if (!isAdmin) {
      navigate('/');
    }
  }, [currentUser, isAdmin, navigate]);

  // Fetch all students
  useEffect(() => {
    async function fetchStudents() {
      try {
        const snap = await getDocs(
          query(collection(db, 'students'), orderBy('createdAt', 'desc'))
        );
        const list: StudentRecord[] = snap.docs.map((d: any) => ({
          uid: d.id,
          ...d.data(),
        })) as StudentRecord[];
        setStudents(list);
      } catch (err: any) {
        console.error('Error fetching students:', err);
        setError('Failed to load students. Check Firestore rules.');
      }
      setLoading(false);
    }
    if (isAdmin) fetchStudents();
  }, [isAdmin]);

  // View a student's report
  const handleViewReport = async (student: StudentRecord) => {
    setReportLoading(true);
    try {
      const assessmentDoc = await getDoc(doc(db, 'assessments', student.uid));
      if (assessmentDoc.exists()) {
        const data = assessmentDoc.data();
        setViewingReport(data.reportData as ReportData);
        setViewingStudentName(student.name);
      } else {
        alert('No assessment data found for this student.');
      }
    } catch (err: any) {
      console.error('Error loading report:', err);
      alert('Failed to load report. Check Firestore rules.');
    }
    setReportLoading(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // ── Report Viewer ──
  if (viewingReport) {
    return (
      <div>
        <div style={styles.reportBar}>
          <button
            onClick={() => { setViewingReport(null); setViewingStudentName(''); }}
            style={styles.backBtn}
          >
            ← Back to Dashboard
          </button>
          <span style={{ color: '#fff', fontWeight: 600 }}>
            Report: {viewingStudentName}
          </span>
        </div>
        <CareerAssessment {...viewingReport} />
      </div>
    );
  }

  // ── Dashboard ──
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.4em', color: '#fff' }}>Admin Dashboard</h1>
            <p style={{ margin: '4px 0 0', color: '#E29578', fontSize: '0.9em' }}>
              Srichakra Academy
            </p>
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
        </div>

        {/* Stats */}
        <div style={styles.statsBar}>
          <div style={styles.statBox}>
            <div style={{ fontSize: '1.6em', fontWeight: 700, color: '#006D77' }}>
              {students.length}
            </div>
            <div style={{ fontSize: '0.85em', color: '#999' }}>Total Students</div>
          </div>
          <div style={styles.statBox}>
            <div style={{ fontSize: '1.6em', fontWeight: 700, color: '#E29578' }}>
              {students.filter((s) => s.assessmentCompleted).length}
            </div>
            <div style={{ fontSize: '0.85em', color: '#999' }}>Completed</div>
          </div>
          <div style={styles.statBox}>
            <div style={{ fontSize: '1.6em', fontWeight: 700, color: '#83C5BE' }}>
              {students.filter((s) => !s.assessmentCompleted).length}
            </div>
            <div style={{ fontSize: '0.85em', color: '#999' }}>Pending</div>
          </div>
        </div>

        {/* Error */}
        {error && <div style={styles.error}>{error}</div>}

        {/* Loading */}
        {loading && (
          <div style={{ padding: '40px', textAlign: 'center' as const, color: '#999' }}>
            Loading students...
          </div>
        )}

        {/* Empty */}
        {!loading && students.length === 0 && !error && (
          <div style={{ padding: '40px', textAlign: 'center' as const, color: '#999' }}>
            No students registered yet.
          </div>
        )}

        {/* Student List */}
        {!loading && students.length > 0 && (
          <div style={{ padding: '0 24px 24px' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>#</th>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Phone</th>
                  <th style={styles.th}>Registered</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Report</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s, i) => (
                  <tr key={s.uid} style={i % 2 === 0 ? styles.rowEven : {}}>
                    <td style={styles.td}>{i + 1}</td>
                    <td style={styles.td}>{s.name}</td>
                    <td style={styles.td}>{s.email}</td>
                    <td style={styles.td}>{s.phone || '—'}</td>
                    <td style={styles.td}>
                      {s.createdAt?.toDate
                        ? s.createdAt.toDate().toLocaleDateString('en-IN')
                        : '—'}
                    </td>
                    <td style={styles.td}>
                      {s.assessmentCompleted ? (
                        <span style={styles.badgeComplete}>✓ Completed</span>
                      ) : (
                        <span style={styles.badgePending}>Pending</span>
                      )}
                    </td>
                    <td style={styles.td}>
                      {s.assessmentCompleted ? (
                        <button
                          style={styles.viewBtn}
                          onClick={() => handleViewReport(s)}
                          disabled={reportLoading}
                        >
                          View
                        </button>
                      ) : (
                        <span style={{ color: '#bbb' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
    background: '#f0f2f5',
    padding: '30px 20px',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  card: {
    maxWidth: '960px',
    margin: '0 auto',
    background: '#fff',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    overflow: 'hidden',
  },
  header: {
    background: '#2C3E50',
    padding: '20px 28px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoutBtn: {
    background: '#E29578',
    color: '#fff',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '0.95em',
  },
  statsBar: {
    display: 'flex',
    gap: '16px',
    padding: '24px 28px',
  },
  statBox: {
    flex: 1,
    textAlign: 'center' as const,
    padding: '16px',
    background: '#f8fafb',
    borderRadius: '10px',
  },
  error: {
    background: '#fff3f3',
    color: '#d32f2f',
    padding: '12px 24px',
    margin: '0 24px',
    borderRadius: '8px',
    border: '1px solid #ffcdd2',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: '0.92em',
  },
  th: {
    textAlign: 'left' as const,
    padding: '12px 10px',
    borderBottom: '2px solid #e0e0e0',
    color: '#555',
    fontWeight: 600,
    fontSize: '0.85em',
    textTransform: 'uppercase' as const,
  },
  td: {
    padding: '12px 10px',
    borderBottom: '1px solid #f0f0f0',
    color: '#333',
  },
  rowEven: {
    background: '#fafafa',
  },
  badgeComplete: {
    background: '#e8f5e9',
    color: '#2e7d32',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '0.85em',
    fontWeight: 600,
  },
  badgePending: {
    background: '#fff8e1',
    color: '#f57f17',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '0.85em',
    fontWeight: 600,
  },
  viewBtn: {
    background: '#006D77',
    color: '#fff',
    border: 'none',
    padding: '6px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.88em',
  },
  reportBar: {
    background: '#2C3E50',
    padding: '14px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    position: 'sticky' as const,
    top: 0,
    zIndex: 100,
  },
  backBtn: {
    background: '#E29578',
    color: '#fff',
    border: 'none',
    padding: '8px 18px',
    borderRadius: '6px',
    fontWeight: 600,
    cursor: 'pointer',
  },
};

export default AdminDashboard;
