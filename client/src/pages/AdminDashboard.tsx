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
import { collection, getDocs, doc, getDoc, query, orderBy, addDoc, updateDoc, Timestamp, where, limit, writeBatch } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
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
  accessStatus?: 'pending' | 'paid' | 'approved' | 'rejected' | 'pending_verification';
  registrationType?: 'individual' | 'school';
  organization?: string;
  paymentMethod?: string;
  paymentAmount?: number;
  paidAt?: any;
  upiPaymentClaim?: {
    upiRefId: string;
    amount: number;
    upiId: string;
    submittedAt: any;
    studentName: string;
    studentEmail: string;
    status: string;
  };
}

interface AssessmentRecord {
  uid: string;
  type: string; // e.g., 'DMIT', 'Career Counseling', etc.
}

interface EnquiryRecord {
  id: string;
  name: string;
  phone: string;
  email: string;
  message: string;
  createdAt: any;
  status: string;
}

const AdminDashboard: React.FC = () => {
  const { currentUser, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');

  // Report viewer state
  const [viewingReport, setViewingReport] = useState<ReportData | null>(null);
  const [viewingStudentName, setViewingStudentName] = useState('');
  const [reportLoading, setReportLoading] = useState(false);

  // Enquiries state
  const [enquiries, setEnquiries] = useState<EnquiryRecord[]>([]);
  const [enquiriesLoading, setEnquiriesLoading] = useState(false);

  // Access approval state
  const [approvalFilter, setApprovalFilter] = useState<'all' | 'pending' | 'approved' | 'paid' | 'rejected' | 'pending_verification'>('pending');
  const [approvalLoading, setApprovalLoading] = useState<Record<string, boolean>>({});
  const [bulkApproveLoading, setBulkApproveLoading] = useState(false);
  const [selectedForApproval, setSelectedForApproval] = useState<Set<string>>(new Set());

  // Academic Partner form state
  const [partnerName, setPartnerName] = useState('');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [partnerPassword, setPartnerPassword] = useState('');
  const [partnerStatus, setPartnerStatus] = useState('');
  const [partnerLoading, setPartnerLoading] = useState(false);

  // ── Search & pagination state ──
  const [searchTerm, setSearchTerm] = useState('');
  const [studentPage, setStudentPage] = useState(1);
  const [approvalPage, setApprovalPage] = useState(1);
  const ROWS_PER_PAGE = 25;

  // Add Academic Partner handler
  const handleAddPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    setPartnerStatus('');
    setPartnerLoading(true);
    try {
      // 1. Create user in Firebase Auth
      const cred = await createUserWithEmailAndPassword(auth, partnerEmail, partnerPassword);
      // 2. Add to Firestore partners collection
      await addDoc(collection(db, 'partners'), {
        uid: cred.user.uid,
        name: partnerName,
        email: partnerEmail,
        createdAt: new Date(),
        type: 'academic',
      });
      setPartnerStatus('Partner registered successfully!');
      // Store name before clearing so we can link to bulk-register
      const savedName = partnerName;
      setPartnerName(''); setPartnerEmail(''); setPartnerPassword('');
      // Auto-navigate to bulk registration with org pre-filled after short delay
      setTimeout(() => {
        navigate(`/admin/bulk-register?org=${encodeURIComponent(savedName)}`);
      }, 1200);
    } catch (err: any) {
      setPartnerStatus('Error: ' + (err.message || 'Failed to register partner.'));
    }
    setPartnerLoading(false);
  };

  // Guard: redirect non-admin users
  useEffect(() => {
    if (!currentUser) {
      navigate('/admin/login');
    } else if (!isAdmin) {
      navigate('/');
    }
  }, [currentUser, isAdmin, navigate]);

  // Fetch all students and assessments
  useEffect(() => {
    async function fetchData() {
      try {
        // Students
        const snap = await getDocs(
          query(collection(db, 'students'), orderBy('createdAt', 'desc'))
        );
        const list: StudentRecord[] = snap.docs.map((d: any) => ({
          uid: d.id,
          ...d.data(),
        })) as StudentRecord[];
        setStudents(list);

        // Assessments
        const asnap = await getDocs(collection(db, 'assessments'));
        const alist: AssessmentRecord[] = asnap.docs.map((d: any) => {
          const data = d.data();
          return {
            uid: d.id,
            type: data.type || data.assessmentType || 'Career Counseling', // fallback if not present
          };
        });
        setAssessments(alist);
      } catch (err: any) {
        console.error('Error fetching students/assessments:', err);
        setError('Failed to load students or assessments. Check Firestore rules.');
      }
      setLoading(false);
    }
    if (isAdmin) fetchData();
  }, [isAdmin]);

  // Fetch enquiries
  useEffect(() => {
    async function fetchEnquiries() {
      setEnquiriesLoading(true);
      try {
        const snap = await getDocs(query(collection(db, 'enquiries'), orderBy('createdAt', 'desc')));
        const list: EnquiryRecord[] = snap.docs.map(d => ({ id: d.id, ...d.data() } as EnquiryRecord));
        setEnquiries(list);
      } catch (err) {
        console.error('Failed to fetch enquiries:', err);
      }
      setEnquiriesLoading(false);
    }
    if (isAdmin && activeSection === 'enquiries') fetchEnquiries();
  }, [isAdmin, activeSection]);

  // Mark enquiry as read/resolved
  const handleEnquiryStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'enquiries', id), { status: newStatus });
      setEnquiries(prev => prev.map(e => e.id === id ? { ...e, status: newStatus } : e));
    } catch (err) {
      console.error('Failed to update enquiry:', err);
    }
  };

  // ── Approve a student (grant assessment access) ──
  const handleApproveStudent = async (uid: string) => {
    setApprovalLoading(prev => ({ ...prev, [uid]: true }));
    try {
      await updateDoc(doc(db, 'students', uid), {
        accessStatus: 'approved',
        approvedAt: Timestamp.now(),
        approvedBy: currentUser?.email || 'admin',
      });
      setStudents(prev => prev.map(s => s.uid === uid ? { ...s, accessStatus: 'approved' } : s));
    } catch (err) {
      console.error('Failed to approve student:', err);
      alert('Failed to approve student. Check Firestore rules.');
    }
    setApprovalLoading(prev => ({ ...prev, [uid]: false }));
  };

  // ── Reject a student ──
  const handleRejectStudent = async (uid: string) => {
    if (!window.confirm('Are you sure you want to reject this student\'s access?')) return;
    setApprovalLoading(prev => ({ ...prev, [uid]: true }));
    try {
      await updateDoc(doc(db, 'students', uid), {
        accessStatus: 'rejected',
        rejectedAt: Timestamp.now(),
        rejectedBy: currentUser?.email || 'admin',
      });
      setStudents(prev => prev.map(s => s.uid === uid ? { ...s, accessStatus: 'rejected' } : s));
    } catch (err) {
      console.error('Failed to reject student:', err);
    }
    setApprovalLoading(prev => ({ ...prev, [uid]: false }));
  };

  // ── Bulk approve selected students ──
  const handleBulkApprove = async () => {
    if (selectedForApproval.size === 0) return;
    if (!window.confirm(`Approve ${selectedForApproval.size} student(s)?`)) return;
    setBulkApproveLoading(true);
    try {
      // Firestore batch limit is 500 — chunk large selections
      const uids = Array.from(selectedForApproval);
      const BATCH_LIMIT = 500;
      for (let i = 0; i < uids.length; i += BATCH_LIMIT) {
        const chunk = uids.slice(i, i + BATCH_LIMIT);
        const batch = writeBatch(db);
        chunk.forEach(uid => {
          batch.update(doc(db, 'students', uid), {
            accessStatus: 'approved',
            approvedAt: Timestamp.now(),
            approvedBy: currentUser?.email || 'admin',
          });
        });
        await batch.commit();
      }
      setStudents(prev => prev.map(s =>
        selectedForApproval.has(s.uid) ? { ...s, accessStatus: 'approved' as const } : s
      ));
      setSelectedForApproval(new Set());
    } catch (err) {
      console.error('Bulk approve failed:', err);
      alert('Some approvals may have failed. Please refresh and try again.');
    }
    setBulkApproveLoading(false);
  };

  // ── Toggle student selection for bulk approve ──
  const toggleStudentSelection = (uid: string) => {
    setSelectedForApproval(prev => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  };

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

  // Assessment type mapping
  const ASSESSMENT_TYPES = [
    { key: 'DMIT', label: 'DMIT Reports', color: '#3182ce' },
    { key: 'Career Counseling', label: 'Career Counseling', color: '#48bb78' },
    { key: 'Overseas Admissions', label: 'Overseas Admissions', color: '#9f7aea' },
    { key: 'Bridging Courses', label: 'Bridging Courses', color: '#ecc94b' },
  ];

  // Count completions by type
  const assessmentTypeCounts: Record<string, number> = {};
  ASSESSMENT_TYPES.forEach(t => { assessmentTypeCounts[t.key] = 0; });
  assessments.forEach(a => {
    if (assessmentTypeCounts[a.type] !== undefined) {
      assessmentTypeCounts[a.type]++;
    } else {
      // fallback: count as Career Counseling if unknown
      assessmentTypeCounts['Career Counseling']++;
    }
  });

  // Website registrations: students with no assessment
  const assessedUids = new Set(assessments.map(a => a.uid));
  const websiteRegistrations = students.filter(s => !assessedUids.has(s.uid)).length;

  // For progress bars: percentage of total students
  const pct = (count: number) => students.length > 0 ? Math.round((count / students.length) * 100) : 0;

  // ── Search & Pagination Logic ──
  const matchesSearch = (stu: StudentRecord) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      stu.name?.toLowerCase().includes(term) ||
      stu.email?.toLowerCase().includes(term) ||
      stu.phone?.includes(term) ||
      stu.organization?.toLowerCase().includes(term)
    );
  };

  const searchedStudents = students.filter(matchesSearch);
  const totalStudentPages = Math.ceil(searchedStudents.length / ROWS_PER_PAGE);
  const paginatedStudents = searchedStudents.slice(
    (studentPage - 1) * ROWS_PER_PAGE,
    studentPage * ROWS_PER_PAGE,
  );

  // Reset page when search or filter changes
  useEffect(() => { setStudentPage(1); setApprovalPage(1); }, [searchTerm]);
  useEffect(() => { setApprovalPage(1); }, [approvalFilter]);

  // ── Pagination Controls Renderer ──
  const renderPagination = (page: number, totalPages: number, totalItems: number, onPageChange: (p: number) => void) => {
    if (totalPages <= 1) return null;
    return (
      <div style={{ padding: '12px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const, gap: 8, fontSize: '0.88em', color: '#4a5568' }}>
        <span>Showing {((page - 1) * ROWS_PER_PAGE) + 1}–{Math.min(page * ROWS_PER_PAGE, totalItems)} of {totalItems}</span>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <button
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', cursor: page <= 1 ? 'default' : 'pointer', opacity: page <= 1 ? 0.4 : 1, fontWeight: 500 }}
          >
            ‹ Prev
          </button>
          <span style={{ padding: '5px 12px', fontWeight: 600 }}>Page {page} / {totalPages}</span>
          <button
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', cursor: page >= totalPages ? 'default' : 'pointer', opacity: page >= totalPages ? 0.4 : 1, fontWeight: 500 }}
          >
            Next ›
          </button>
        </div>
      </div>
    );
  };

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

  // Derived: pending approval count
  const pendingApprovalCount = students.filter(s => !s.accessStatus || s.accessStatus === 'pending' || s.accessStatus === 'pending_verification').length;

  // Filter students for approval section (with search)
  const filteredForApproval = students.filter(s => {
    const statusMatch = approvalFilter === 'all' ? true :
      approvalFilter === 'pending' ? (!s.accessStatus || s.accessStatus === 'pending' || s.accessStatus === 'pending_verification') :
      s.accessStatus === approvalFilter;
    return statusMatch && matchesSearch(s);
  });
  const totalApprovalPages = Math.ceil(filteredForApproval.length / ROWS_PER_PAGE);
  const paginatedApprovals = filteredForApproval.slice(
    (approvalPage - 1) * ROWS_PER_PAGE,
    approvalPage * ROWS_PER_PAGE,
  );

  // Sidebar nav items
  const navItems = [
    { id: 'dashboard', icon: '🏠', label: 'Dashboard' },
    { id: 'approvals', icon: '✅', label: `Approvals${pendingApprovalCount > 0 ? ` (${pendingApprovalCount})` : ''}` },
    { id: 'students', icon: '👥', label: 'Students' },
    { id: 'bulk-register', icon: '📋', label: 'Bulk Register' },
    { id: 'enquiries', icon: '📩', label: 'Enquiries' },
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
              onClick={() => {
                if (item.id === 'bulk-register') {
                  navigate('/admin/bulk-register');
                } else {
                  setActiveSection(item.id);
                }
              }}
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

        {/* Add Academic Partner (admin only) */}
        {isAdmin && (
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, marginBottom: 28, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <h2 style={{ margin: 0, fontSize: '1.1em', fontWeight: 600, color: '#2d3748' }}>Add Academic Partner</h2>
            <form onSubmit={handleAddPartner} style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', marginTop: 12 }}>
              <input
                type="text"
                placeholder="Institution Name"
                value={partnerName}
                onChange={e => setPartnerName(e.target.value)}
                required
                style={{ padding: 8, borderRadius: 6, border: '1px solid #e2e8f0', minWidth: 180 }}
              />
              <input
                type="email"
                placeholder="Contact Email"
                value={partnerEmail}
                onChange={e => setPartnerEmail(e.target.value)}
                required
                style={{ padding: 8, borderRadius: 6, border: '1px solid #e2e8f0', minWidth: 180 }}
              />
              <input
                type="password"
                placeholder="Password"
                value={partnerPassword}
                onChange={e => setPartnerPassword(e.target.value)}
                required
                minLength={6}
                style={{ padding: 8, borderRadius: 6, border: '1px solid #e2e8f0', minWidth: 140 }}
              />
              <button
                type="submit"
                disabled={partnerLoading}
                style={{ background: '#006D77', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 600, cursor: 'pointer' }}
              >
                {partnerLoading ? 'Registering…' : 'Add Partner'}
              </button>
              {partnerStatus && partnerStatus.startsWith('Error') && (
                <span style={{ marginLeft: 12, color: '#c53030', fontWeight: 500 }}>{partnerStatus}</span>
              )}
              {partnerStatus && !partnerStatus.startsWith('Error') && (
                <span style={{ marginLeft: 12, color: '#38a169', fontWeight: 500 }}>
                  {partnerStatus} — Redirecting to Bulk Register…
                </span>
              )}
            </form>
          </div>
        )}
        <main style={s.mainContent}>
          {/* Error */}
          {error && <div style={s.error}>{error}</div>}

          {/* ── Student Approvals Section ── */}
          {activeSection === 'approvals' && (
            <div style={s.tableCard}>
              <div style={{ ...s.tableHeader, flexWrap: 'wrap' as const, gap: 12 }}>
                <h2 style={{ margin: 0, fontSize: '1.05em', fontWeight: 600, color: '#2d3748' }}>
                  ✅ Student Access Approvals ({filteredForApproval.length})
                </h2>
                <input
                  type="text"
                  placeholder="🔍 Search by name, email, phone..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ padding: '7px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.9em', minWidth: 220, outline: 'none' }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['pending', 'pending_verification', 'approved', 'paid', 'rejected', 'all'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setApprovalFilter(f)}
                      style={{
                        padding: '5px 12px',
                        borderRadius: 6,
                        border: approvalFilter === f ? '2px solid #006D77' : '1px solid #e2e8f0',
                        background: approvalFilter === f ? '#f0fdfa' : '#fff',
                        color: approvalFilter === f ? '#006D77' : '#718096',
                        fontWeight: approvalFilter === f ? 700 : 500,
                        cursor: 'pointer',
                        fontSize: '0.8em',
                        textTransform: 'capitalize' as const,
                      }}
                    >
                      {f} {f === 'pending' && pendingApprovalCount > 0 ? `(${pendingApprovalCount})` : ''}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bulk actions */}
              {approvalFilter === 'pending' && filteredForApproval.length > 0 && (
                <div style={{ padding: '10px 20px', background: '#f7fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' as const }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.88em', color: '#4a5568', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={selectedForApproval.size === filteredForApproval.length && filteredForApproval.length > 0}
                      onChange={() => {
                        if (selectedForApproval.size === filteredForApproval.length) {
                          setSelectedForApproval(new Set());
                        } else {
                          setSelectedForApproval(new Set(filteredForApproval.map(s => s.uid)));
                        }
                      }}
                    />
                    Select All ({filteredForApproval.length})
                  </label>
                  {selectedForApproval.size > 0 && (
                    <button
                      onClick={handleBulkApprove}
                      disabled={bulkApproveLoading}
                      style={{ ...s.viewBtn, background: '#38a169', fontSize: '0.85em', padding: '6px 16px' }}
                    >
                      {bulkApproveLoading ? 'Approving...' : `✓ Approve Selected (${selectedForApproval.size})`}
                    </button>
                  )}
                </div>
              )}

              {loading && (
                <div style={{ padding: '40px', textAlign: 'center' as const, color: '#999' }}>Loading students...</div>
              )}
              {!loading && filteredForApproval.length === 0 && (
                <div style={{ padding: '40px', textAlign: 'center' as const, color: '#999' }}>
                  No {approvalFilter === 'all' ? '' : approvalFilter} students found{searchTerm ? ` matching "${searchTerm}"` : ''}.
                </div>
              )}
              {!loading && filteredForApproval.length > 0 && (
                <div style={{ overflowX: 'auto' as const }}>
                  <table style={s.table}>
                    <thead>
                      <tr>
                        {approvalFilter === 'pending' && <th style={s.th}></th>}
                        <th style={s.th}>#</th>
                        <th style={s.th}>Name</th>
                        <th style={s.th}>Email</th>
                        <th style={s.th}>Phone</th>
                        <th style={s.th}>Type</th>
                        <th style={s.th}>Organization</th>
                        <th style={s.th}>UPI Payment</th>
                        <th style={s.th}>Registered</th>
                        <th style={s.th}>Access Status</th>
                        <th style={s.th}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedApprovals.map((stu, i) => (
                        <tr key={stu.uid} style={i % 2 === 0 ? s.rowEven : {}}>
                          {approvalFilter === 'pending' && (
                            <td style={s.td}>
                              <input
                                type="checkbox"
                                checked={selectedForApproval.has(stu.uid)}
                                onChange={() => toggleStudentSelection(stu.uid)}
                              />
                            </td>
                          )}
                          <td style={s.td}>{(approvalPage - 1) * ROWS_PER_PAGE + i + 1}</td>
                          <td style={{ ...s.td, fontWeight: 600 }}>{stu.name}</td>
                          <td style={s.td}>{stu.email}</td>
                          <td style={s.td}>
                            <a href={`tel:${stu.phone}`} style={{ color: '#006D77', textDecoration: 'none' }}>{stu.phone || '—'}</a>
                          </td>
                          <td style={s.td}>
                            <span style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: '999px',
                              fontSize: '0.8em',
                              fontWeight: 600,
                              background: stu.registrationType === 'school' ? '#ebf8ff' : '#faf5ff',
                              color: stu.registrationType === 'school' ? '#2b6cb0' : '#6b46c1',
                            }}>
                              {stu.registrationType === 'school' ? '🏫 School' : '👤 Individual'}
                            </span>
                          </td>
                          <td style={s.td}>{stu.organization || '—'}</td>
                          <td style={s.td}>
                            {stu.upiPaymentClaim ? (
                              <div style={{ fontSize: '0.82em', lineHeight: 1.5 }}>
                                <div style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '999px', background: '#ebf8ff', color: '#2b6cb0', fontWeight: 600, fontSize: '0.9em', marginBottom: 2 }}>
                                  💳 UPI Ref: {stu.upiPaymentClaim.upiRefId}
                                </div>
                                <div style={{ color: '#718096' }}>₹{stu.upiPaymentClaim.amount?.toLocaleString('en-IN')}</div>
                                {stu.paymentMethod === 'gpay_upi' && (
                                  <div style={{ color: '#38a169', fontSize: '0.85em' }}>via GPay/UPI</div>
                                )}
                              </div>
                            ) : (
                              <span style={{ color: '#ccc' }}>—</span>
                            )}
                          </td>
                          <td style={s.td}>
                            {stu.createdAt?.toDate
                              ? stu.createdAt.toDate().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                              : '—'}
                          </td>
                          <td style={s.td}>
                            {(!stu.accessStatus || stu.accessStatus === 'pending') && (
                              <span style={{ ...s.badgePending, background: '#fffff0', color: '#d69e2e' }}>⏳ Pending</span>
                            )}
                            {stu.accessStatus === 'approved' && (
                              <span style={s.badgeComplete}>✅ Approved</span>
                            )}
                            {stu.accessStatus === 'paid' && (
                              <span style={{ ...s.badgeComplete, background: '#f0fff4', color: '#276749' }}>💳 Paid</span>
                            )}
                            {stu.accessStatus === 'pending_verification' && (
                              <span style={{ ...s.badgePending, background: '#fffff0', color: '#b7791f' }}>🔍 UPI Pending</span>
                            )}
                            {stu.accessStatus === 'rejected' && (
                              <span style={{ ...s.badgePending, background: '#fff5f5', color: '#e53e3e' }}>❌ Rejected</span>
                            )}
                          </td>
                          <td style={s.td}>
                            {(!stu.accessStatus || stu.accessStatus === 'pending') && (
                              <div style={{ display: 'flex', gap: 4 }}>
                                <button
                                  onClick={() => handleApproveStudent(stu.uid)}
                                  disabled={approvalLoading[stu.uid]}
                                  style={{ ...s.viewBtn, background: '#38a169', fontSize: '0.8em', padding: '4px 10px' }}
                                >
                                  {approvalLoading[stu.uid] ? '...' : '✓ Approve'}
                                </button>
                                <button
                                  onClick={() => handleRejectStudent(stu.uid)}
                                  disabled={approvalLoading[stu.uid]}
                                  style={{ ...s.viewBtn, background: '#e53e3e', fontSize: '0.8em', padding: '4px 10px' }}
                                >
                                  ✕ Reject
                                </button>
                              </div>
                            )}
                            {stu.accessStatus === 'pending_verification' && (
                              <div style={{ display: 'flex', gap: 4 }}>
                                <button
                                  onClick={() => handleApproveStudent(stu.uid)}
                                  disabled={approvalLoading[stu.uid]}
                                  style={{ ...s.viewBtn, background: '#38a169', fontSize: '0.8em', padding: '4px 10px' }}
                                >
                                  {approvalLoading[stu.uid] ? '...' : '✓ Verify & Approve'}
                                </button>
                                <button
                                  onClick={() => handleRejectStudent(stu.uid)}
                                  disabled={approvalLoading[stu.uid]}
                                  style={{ ...s.viewBtn, background: '#e53e3e', fontSize: '0.8em', padding: '4px 10px' }}
                                >
                                  ✕ Reject
                                </button>
                              </div>
                            )}
                            {stu.accessStatus === 'rejected' && (
                              <button
                                onClick={() => handleApproveStudent(stu.uid)}
                                disabled={approvalLoading[stu.uid]}
                                style={{ ...s.viewBtn, background: '#38a169', fontSize: '0.8em', padding: '4px 10px' }}
                              >
                                Re-approve
                              </button>
                            )}
                            {(stu.accessStatus === 'approved' || stu.accessStatus === 'paid') && (
                              <span style={{ color: '#38a169', fontWeight: 600, fontSize: '0.85em' }}>Active</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {renderPagination(approvalPage, totalApprovalPages, filteredForApproval.length, setApprovalPage)}
            </div>
          )}

          {/* ── Enquiries Section ── */}
          {activeSection === 'enquiries' && (
            <div style={s.tableCard}>
              <div style={s.tableHeader}>
                <h2 style={{ margin: 0, fontSize: '1.05em', fontWeight: 600, color: '#2d3748' }}>
                  📩 Enquiries ({enquiries.length})
                </h2>
              </div>
              {enquiriesLoading && (
                <div style={{ padding: '40px', textAlign: 'center' as const, color: '#999' }}>Loading enquiries...</div>
              )}
              {!enquiriesLoading && enquiries.length === 0 && (
                <div style={{ padding: '40px', textAlign: 'center' as const, color: '#999' }}>No enquiries yet.</div>
              )}
              {!enquiriesLoading && enquiries.length > 0 && (
                <div style={{ overflowX: 'auto' as const }}>
                  <table style={s.table}>
                    <thead>
                      <tr>
                        <th style={s.th}>#</th>
                        <th style={s.th}>Name</th>
                        <th style={s.th}>Phone</th>
                        <th style={s.th}>Email</th>
                        <th style={s.th}>Message</th>
                        <th style={s.th}>Date</th>
                        <th style={s.th}>Status</th>
                        <th style={s.th}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enquiries.map((enq, i) => (
                        <tr key={enq.id} style={i % 2 === 0 ? s.rowEven : {}}>
                          <td style={s.td}>{i + 1}</td>
                          <td style={{ ...s.td, fontWeight: 600 }}>{enq.name}</td>
                          <td style={s.td}>
                            <a href={`tel:${enq.phone}`} style={{ color: '#006D77', textDecoration: 'none' }}>{enq.phone}</a>
                          </td>
                          <td style={s.td}>
                            {enq.email ? <a href={`mailto:${enq.email}`} style={{ color: '#006D77', textDecoration: 'none' }}>{enq.email}</a> : '—'}
                          </td>
                          <td style={{ ...s.td, maxWidth: 280, whiteSpace: 'normal' as const, lineHeight: 1.4 }}>{enq.message}</td>
                          <td style={s.td}>
                            {enq.createdAt?.toDate ? enq.createdAt.toDate().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                          </td>
                          <td style={s.td}>
                            {enq.status === 'new' && <span style={{ ...s.badgePending, background: '#fff5f5', color: '#e53e3e' }}>🔴 New</span>}
                            {enq.status === 'contacted' && <span style={{ ...s.badgeComplete, background: '#fffff0', color: '#d69e2e' }}>🟡 Contacted</span>}
                            {enq.status === 'resolved' && <span style={s.badgeComplete}>✅ Resolved</span>}
                            {!['new', 'contacted', 'resolved'].includes(enq.status) && <span style={s.badgePending}>{enq.status}</span>}
                          </td>
                          <td style={s.td}>
                            {enq.status === 'new' && (
                              <button onClick={() => handleEnquiryStatus(enq.id, 'contacted')} style={{ ...s.viewBtn, background: '#d69e2e', marginRight: 4, fontSize: '0.8em' }}>Mark Contacted</button>
                            )}
                            {enq.status === 'contacted' && (
                              <button onClick={() => handleEnquiryStatus(enq.id, 'resolved')} style={{ ...s.viewBtn, background: '#38a169', fontSize: '0.8em' }}>Mark Resolved</button>
                            )}
                            {enq.status === 'resolved' && (
                              <span style={{ color: '#38a169', fontWeight: 600, fontSize: '0.85em' }}>Done</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

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

            <div style={{ ...s.overviewCard, borderLeft: '4px solid #d69e2e' }}>
              <div style={{ fontSize: '0.85em', color: '#718096', fontWeight: 500 }}>Pending Approvals</div>
              <div style={{ fontSize: '2em', fontWeight: 700, color: '#d69e2e' }}>
                {loading ? '…' : pendingApprovalCount}
              </div>
              <div style={{ fontSize: '0.8em', color: '#d69e2e', marginTop: '4px', cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => setActiveSection('approvals')}
              >
                View & Approve →
              </div>
            </div>

            <div style={{ ...s.overviewCard, borderLeft: '4px solid #38a169' }}>
              <div style={{ fontSize: '0.85em', color: '#718096', fontWeight: 500 }}>Active (Paid/Approved)</div>
              <div style={{ fontSize: '2em', fontWeight: 700, color: '#38a169' }}>
                {loading ? '…' : students.filter(s2 => s2.accessStatus === 'paid' || s2.accessStatus === 'approved').length}
              </div>
              <div style={{ fontSize: '0.8em', color: '#38a169', marginTop: '4px' }}>
                Can take assessment
              </div>
            </div>
          </div>

          {/* Two-column: Recent Students + Assessment Reports */}
          <div style={s.twoCol}>
            {/* Recent Students Table */}
            <div style={s.tableCard}>
              <div style={{ ...s.tableHeader, flexWrap: 'wrap' as const, gap: 12 }}>
                <h2 style={{ margin: 0, fontSize: '1.05em', fontWeight: 600, color: '#2d3748' }}>
                  Students ({searchedStudents.length}{searchTerm ? ` matching` : ''})
                </h2>
                <input
                  type="text"
                  placeholder="🔍 Search by name, email, phone..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ padding: '7px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.9em', minWidth: 220, outline: 'none' }}
                />
              </div>

              {loading && (
                <div style={{ padding: '40px', textAlign: 'center' as const, color: '#999' }}>
                  Loading students...
                </div>
              )}

              {!loading && searchedStudents.length === 0 && !error && (
                <div style={{ padding: '40px', textAlign: 'center' as const, color: '#999' }}>
                  {searchTerm ? `No students matching "${searchTerm}"` : 'No students registered yet.'}
                </div>
              )}

              {!loading && searchedStudents.length > 0 && (
                <div style={{ overflowX: 'auto' as const }}>
                  <table style={s.table}>
                    <thead>
                      <tr>
                        <th style={s.th}>#</th>
                        <th style={s.th}>Name</th>
                        <th style={s.th}>Email</th>
                        <th style={s.th}>Phone</th>
                        <th style={s.th}>Registered</th>
                        <th style={s.th}>Access</th>
                        <th style={s.th}>Assessment</th>
                        <th style={s.th}>Report</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedStudents.map((stu, i) => (
                        <tr key={stu.uid} style={i % 2 === 0 ? s.rowEven : {}}>
                          <td style={s.td}>{(studentPage - 1) * ROWS_PER_PAGE + i + 1}</td>
                          <td style={s.td}>{stu.name}</td>
                          <td style={s.td}>{stu.email}</td>
                          <td style={s.td}>{stu.phone || '—'}</td>
                          <td style={s.td}>
                            {stu.createdAt?.toDate
                              ? stu.createdAt.toDate().toLocaleDateString('en-IN')
                              : '—'}
                          </td>
                          <td style={s.td}>
                            {(!stu.accessStatus || stu.accessStatus === 'pending') && (
                              <span style={s.badgePending}>⏳ Pending</span>
                            )}
                            {stu.accessStatus === 'approved' && (
                              <span style={s.badgeComplete}>✅ Approved</span>
                            )}
                            {stu.accessStatus === 'paid' && (
                              <span style={{ ...s.badgeComplete, background: '#f0fff4', color: '#276749' }}>💳 Paid</span>
                            )}
                            {stu.accessStatus === 'pending_verification' && (
                              <span style={{ ...s.badgePending, background: '#fffff0', color: '#b7791f' }}>🔍 UPI Pending</span>
                            )}
                            {stu.accessStatus === 'rejected' && (
                              <span style={{ ...s.badgePending, background: '#fff5f5', color: '#e53e3e' }}>❌</span>
                            )}
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
              {renderPagination(studentPage, totalStudentPages, searchedStudents.length, setStudentPage)}
            </div>

            {/* Assessment Reports Progress */}
            <div style={s.progressCard}>
              <div style={s.tableHeader}>
                <h2 style={{ margin: 0, fontSize: '1.05em', fontWeight: 600, color: '#2d3748' }}>
                  Assessment Reports
                </h2>
              </div>
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column' as const, gap: '20px' }}>
                {ASSESSMENT_TYPES.map(t => (
                  <ProgressBar key={t.key} label={t.label} pct={pct(assessmentTypeCounts[t.key])} color={t.color} />
                ))}
                <ProgressBar label="Website Registrations" pct={pct(websiteRegistrations)} color="#718096" />
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
