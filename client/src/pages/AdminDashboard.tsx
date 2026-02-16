/**
 * ADMIN DASHBOARD (restored from old repo layout)
 *
 * Features:
 * - Collapsible sidebar navigation
 * - Overview cards (Total Students, Completed, Pending, Assessments Today)
 * - Recent students table (from Firestore)
 * - Assessment reports progress bars
 * - Report viewer for completed assessments
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');

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

  // Derived stats
  const completedCount = students.filter((s) => s.assessmentCompleted).length;
  const pendingCount = students.filter((s) => !s.assessmentCompleted).length;
  const completionRate = students.length > 0 ? Math.round((completedCount / students.length) * 100) : 0;

  // ── Report Viewer ──
  if (viewingReport) {
    return (
      <div>
        <div style={s.reportBar}>
          <button
            onClick={() => { setViewingReport(null); setViewingStudentName(''); }}
            style={s.backBtn}
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

  // Sidebar nav items
  const navItems = [
    { id: 'dashboard', icon: '🏠', label: 'Dashboard' },
    { id: 'students', icon: '👥', label: 'Students' },
    { id: 'reports', icon: '📄', label: 'Reports' },
    { id: 'analytics', icon: '📊', label: 'Analytics' },
    { id: 'settings', icon: '⚙️', label: 'Settings' },
  ];

  // ── Dashboard ──
  return (
    <div style={s.layout}>
      {/* ── Sidebar ── */}
      <aside
        style={{
          ...s.sidebar,
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          ...(window.innerWidth >= 768 ? { transform: 'translateX(0)', position: 'relative' as const } : {}),
        }}
      >
        {/* Logo & close */}
        <div style={s.sidebarHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img
              src="/images/srichakra-logo.png"
              alt="Srichakra Logo"
              style={{ height: 40, width: 40, borderRadius: '50%', objectFit: 'cover' }}
              onError={(e) => {
                const el = e.target as HTMLImageElement;
                el.style.display = 'none';
                const fallback = el.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
            <div style={{ ...s.logoCircle, display: 'none' }}>S</div>
            <span style={s.logoText}>Srichakra</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            style={s.sidebarClose}
          >
            ✕
          </button>
        </div>

        {/* Admin info */}
        <div style={s.adminInfo}>
          <div style={s.adminAvatar}>
            {currentUser?.email?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.95em' }}>
              Admin
            </div>
            <div style={{ color: '#a0d2db', fontSize: '0.8em' }}>
              {currentUser?.email || 'admin'}
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav style={s.sidebarNav}>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              style={{
                ...s.navItem,
                ...(activeSection === item.id ? s.navItemActive : {}),
              }}
            >
              <span style={{ fontSize: '1.1em' }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Logout at bottom */}
        <div style={s.sidebarFooter}>
          <button onClick={handleLogout} style={s.navItem}>
            <span style={{ fontSize: '1.1em' }}>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div
          style={s.overlay}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Main content ── */}
      <div style={s.mainWrapper}>
        {/* Top bar */}
        <header style={s.topBar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => setSidebarOpen(true)}
              style={s.menuBtn}
            >
              ☰
            </button>
            <h1 style={{ margin: 0, fontSize: '1.25em', fontWeight: 600, color: '#2d3748' }}>
              Admin Dashboard
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={s.onlineBadge}>● Online</span>
            <button style={s.iconBtn} title="Notifications">🔔</button>
            <button style={s.iconBtn} title="Profile">👤</button>
          </div>
        </header>

        {/* Dashboard content */}
        <main style={s.mainContent}>
          {/* Error */}
          {error && <div style={s.error}>{error}</div>}

          {/* Overview Cards */}
          <div style={s.cardGrid}>
            <div style={s.overviewCard}>
              <div style={{ fontSize: '0.85em', color: '#718096', fontWeight: 500 }}>Total Students</div>
              <div style={{ fontSize: '2em', fontWeight: 700, color: '#2d3748' }}>
                {loading ? '…' : students.length}
              </div>
              <div style={{ fontSize: '0.8em', color: '#48bb78', marginTop: '4px' }}>
                ↑ Live from Firestore
              </div>
            </div>

            <div style={s.overviewCard}>
              <div style={{ fontSize: '0.85em', color: '#718096', fontWeight: 500 }}>Completed</div>
              <div style={{ fontSize: '2em', fontWeight: 700, color: '#2d3748' }}>
                {loading ? '…' : completedCount}
              </div>
              <div style={{ fontSize: '0.8em', color: '#48bb78', marginTop: '4px' }}>
                {completionRate}% completion rate
              </div>
            </div>

            <div style={s.overviewCard}>
              <div style={{ fontSize: '0.85em', color: '#718096', fontWeight: 500 }}>Pending</div>
              <div style={{ fontSize: '2em', fontWeight: 700, color: '#2d3748' }}>
                {loading ? '…' : pendingCount}
              </div>
              <div style={{ fontSize: '0.8em', color: '#e53e3e', marginTop: '4px' }}>
                Awaiting assessment
              </div>
            </div>

            <div style={s.overviewCard}>
              <div style={{ fontSize: '0.85em', color: '#718096', fontWeight: 500 }}>Reports Ready</div>
              <div style={{ fontSize: '2em', fontWeight: 700, color: '#2d3748' }}>
                {loading ? '…' : completedCount}
              </div>
              <div style={{ fontSize: '0.8em', color: '#48bb78', marginTop: '4px' }}>
                Available to view
              </div>
            </div>
          </div>

          {/* Two-column: Recent Students + Assessment Reports */}
          <div style={s.twoCol}>
            {/* Recent Students Table */}
            <div style={s.tableCard}>
              <div style={s.tableHeader}>
                <h2 style={{ margin: 0, fontSize: '1.05em', fontWeight: 600, color: '#2d3748' }}>
                  Recent Students
                </h2>
                <button style={s.viewAllBtn}>View All</button>
              </div>

              {loading && (
                <div style={{ padding: '40px', textAlign: 'center' as const, color: '#999' }}>
                  Loading students...
                </div>
              )}

              {!loading && students.length === 0 && !error && (
                <div style={{ padding: '40px', textAlign: 'center' as const, color: '#999' }}>
                  No students registered yet.
                </div>
              )}

              {!loading && students.length > 0 && (
                <div style={{ overflowX: 'auto' as const }}>
                  <table style={s.table}>
                    <thead>
                      <tr>
                        <th style={s.th}>Name</th>
                        <th style={s.th}>Email</th>
                        <th style={s.th}>Phone</th>
                        <th style={s.th}>Registered</th>
                        <th style={s.th}>Status</th>
                        <th style={s.th}>Report</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.slice(0, 10).map((stu, i) => (
                        <tr key={stu.uid} style={i % 2 === 0 ? s.rowEven : {}}>
                          <td style={s.td}>{stu.name}</td>
                          <td style={s.td}>{stu.email}</td>
                          <td style={s.td}>{stu.phone || '—'}</td>
                          <td style={s.td}>
                            {stu.createdAt?.toDate
                              ? stu.createdAt.toDate().toLocaleDateString('en-IN')
                              : '—'}
                          </td>
                          <td style={s.td}>
                            {stu.assessmentCompleted ? (
                              <span style={s.badgeComplete}>✓ Completed</span>
                            ) : (
                              <span style={s.badgePending}>Pending</span>
                            )}
                          </td>
                          <td style={s.td}>
                            {stu.assessmentCompleted ? (
                              <button
                                style={s.viewBtn}
                                onClick={() => handleViewReport(stu)}
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

            {/* Assessment Reports Progress */}
            <div style={s.progressCard}>
              <div style={s.tableHeader}>
                <h2 style={{ margin: 0, fontSize: '1.05em', fontWeight: 600, color: '#2d3748' }}>
                  Assessment Reports
                </h2>
              </div>
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column' as const, gap: '20px' }}>
                <ProgressBar label="DMIT Reports" pct={65} color="#3182ce" />
                <ProgressBar label="Career Counseling" pct={42} color="#48bb78" />
                <ProgressBar label="Overseas Admissions" pct={28} color="#9f7aea" />
                <ProgressBar label="Bridging Courses" pct={15} color="#ecc94b" />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

/* ── Progress Bar component ── */
const ProgressBar: React.FC<{ label: string; pct: number; color: string }> = ({ label, pct, color }) => (
  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
      <span style={{ fontSize: '0.9em', color: '#4a5568' }}>{label}</span>
      <span style={{ fontSize: '0.9em', fontWeight: 600, color: '#2d3748' }}>{pct}%</span>
    </div>
    <div style={{ width: '100%', background: '#e2e8f0', borderRadius: '999px', height: '8px' }}>
      <div
        style={{
          width: `${pct}%`,
          background: color,
          height: '8px',
          borderRadius: '999px',
          transition: 'width 0.6s ease',
        }}
      />
    </div>
  </div>
);

// ────────────────────────────────────────────
// Styles
// ────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  /* Layout */
  layout: {
    display: 'flex',
    height: '100vh',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    background: '#f7fafc',
  },

  /* Sidebar */
  sidebar: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    width: '256px',
    height: '100%',
    background: '#006D77',
    zIndex: 30,
    display: 'flex',
    flexDirection: 'column' as const,
    transition: 'transform 0.3s ease',
  },
  sidebarHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 18px',
    borderBottom: '1px solid #005964',
  },
  logoCircle: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: '#FFDDD2',
    color: '#006D77',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '1.2em',
  },
  logoText: {
    color: '#FFDDD2',
    fontSize: '1.3em',
    fontWeight: 700,
    letterSpacing: '0.5px',
  },
  sidebarClose: {
    background: 'none',
    border: 'none',
    color: '#fff',
    fontSize: '1.2em',
    cursor: 'pointer',
  },
  adminInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 18px',
    borderBottom: '1px solid #005964',
  },
  adminAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: '#FFDDD2',
    color: '#006D77',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '1.1em',
  },
  sidebarNav: {
    padding: '12px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
    flex: 1,
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 14px',
    border: 'none',
    background: 'transparent',
    color: '#fff',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.95em',
    fontWeight: 500,
    width: '100%',
    textAlign: 'left' as const,
  },
  navItemActive: {
    background: '#005964',
  },
  sidebarFooter: {
    padding: '12px',
    borderTop: '1px solid #005964',
  },
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    zIndex: 20,
  },

  /* Main area */
  mainWrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden' as const,
    marginLeft: '256px',
  },
  topBar: {
    background: '#fff',
    borderBottom: '1px solid #e2e8f0',
    padding: '14px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuBtn: {
    background: 'none',
    border: 'none',
    fontSize: '1.5em',
    cursor: 'pointer',
    color: '#4a5568',
    display: 'none', // shown via media query ideally; works on mobile via sidebar toggle
  },
  onlineBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 12px',
    background: '#f0fff4',
    color: '#38a169',
    borderRadius: '999px',
    fontSize: '0.85em',
    fontWeight: 600,
  },
  iconBtn: {
    background: 'none',
    border: 'none',
    fontSize: '1.2em',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '50%',
  },
  mainContent: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '24px',
    background: '#f7fafc',
  },

  /* Overview Cards */
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '28px',
  },
  overviewCard: {
    background: '#fff',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  },

  /* Two column layout */
  twoCol: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '24px',
  },

  /* Table card */
  tableCard: {
    background: '#fff',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    overflow: 'hidden' as const,
  },
  tableHeader: {
    padding: '16px 20px',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewAllBtn: {
    background: 'transparent',
    border: '1px solid #e2e8f0',
    padding: '6px 14px',
    borderRadius: '6px',
    fontSize: '0.85em',
    cursor: 'pointer',
    color: '#4a5568',
    fontWeight: 500,
  },

  /* Progress card */
  progressCard: {
    background: '#fff',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    overflow: 'hidden' as const,
  },

  /* Table */
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: '0.9em',
  },
  th: {
    textAlign: 'left' as const,
    padding: '12px 16px',
    color: '#718096',
    fontWeight: 500,
    fontSize: '0.8em',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  td: {
    padding: '12px 16px',
    borderTop: '1px solid #f0f0f0',
    color: '#2d3748',
    whiteSpace: 'nowrap' as const,
  },
  rowEven: {
    background: '#fafafa',
  },
  badgeComplete: {
    display: 'inline-block',
    background: '#f0fff4',
    color: '#38a169',
    padding: '2px 10px',
    borderRadius: '999px',
    fontSize: '0.85em',
    fontWeight: 600,
  },
  badgePending: {
    display: 'inline-block',
    background: '#fffff0',
    color: '#d69e2e',
    padding: '2px 10px',
    borderRadius: '999px',
    fontSize: '0.85em',
    fontWeight: 600,
  },
  viewBtn: {
    background: '#006D77',
    color: '#fff',
    border: 'none',
    padding: '5px 14px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.85em',
  },

  /* Report viewer */
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
  error: {
    background: '#fff5f5',
    color: '#c53030',
    padding: '12px 20px',
    borderRadius: '8px',
    border: '1px solid #fed7d7',
    marginBottom: '20px',
  },
};

export default AdminDashboard;
