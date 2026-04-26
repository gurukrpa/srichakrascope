/**
 * EBOOK SALES ADMIN PANEL
 *
 * Embedded inside AdminDashboard as the "E-book Sales" section.
 *
 * Pulls from `ebookLeads` collection (created by /ebooks funnel) and shows:
 *   - Revenue, leads, paid count, conversion %
 *   - Per-ebook breakdown
 *   - UTM source breakdown
 *   - Lead table with CSV export
 */

import React, { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, orderBy, query, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { EBOOK_CATALOG } from '../data/ebookCatalog';

interface EbookLead {
  id: string;
  ebookKey?: string;
  ebookTitle?: string;
  studentName?: string;
  parentName?: string;
  email?: string;
  mobile?: string;
  city?: string;
  schoolName?: string;
  classLevel?: string;
  stream?: string;
  status?: string; // pending_payment | cart_abandoned | paid | payment_failed
  priceRupees?: number;
  amountPaise?: number;
  paymentId?: string;
  assessmentCoupon?: string;
  utm?: Record<string, string>;
  createdAt?: { toDate?: () => Date } | null;
  paidAt?: { toDate?: () => Date } | null;
}

const STATUS_COLORS: Record<string, string> = {
  paid: '#0a7c4a',
  pending_payment: '#8a6500',
  cart_abandoned: '#a02525',
  payment_failed: '#a02525',
};

const EbookSalesPanel: React.FC = () => {
  const [leads, setLeads] = useState<EbookLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending_payment' | 'cart_abandoned' | 'payment_failed'>('all');
  const [ebookFilter, setEbookFilter] = useState<string>('all');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'ebookLeads'), orderBy('createdAt', 'desc'), limit(500));
        const snap = await getDocs(q);
        if (cancelled) return;
        setLeads(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<EbookLead, 'id'>) })));
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || 'Failed to load leads.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => leads.filter((l) =>
    (statusFilter === 'all' || l.status === statusFilter) &&
    (ebookFilter === 'all' || l.ebookKey === ebookFilter)
  ), [leads, statusFilter, ebookFilter]);

  // KPIs
  const totalLeads = leads.length;
  const paid = leads.filter((l) => l.status === 'paid');
  const paidCount = paid.length;
  const revenue = paid.reduce((sum, l) => sum + (l.priceRupees || 0), 0);
  const conversion = totalLeads ? (paidCount / totalLeads) * 100 : 0;
  const abandoned = leads.filter((l) => l.status === 'cart_abandoned').length;

  // Per-ebook
  const perEbook = EBOOK_CATALOG.map((e) => {
    const l = leads.filter((x) => x.ebookKey === e.key);
    const p = l.filter((x) => x.status === 'paid');
    return {
      key: e.key,
      title: e.title,
      icon: e.icon,
      coverColor: e.coverColor,
      leads: l.length,
      paid: p.length,
      revenue: p.reduce((s, x) => s + (x.priceRupees || 0), 0),
      conv: l.length ? (p.length / l.length) * 100 : 0,
    };
  });

  // UTM breakdown
  const utmAgg = useMemo(() => {
    const map: Record<string, { leads: number; paid: number; revenue: number }> = {};
    leads.forEach((l) => {
      const src = l.utm?.utm_source || 'direct';
      const camp = l.utm?.utm_campaign || '—';
      const k = `${src} · ${camp}`;
      if (!map[k]) map[k] = { leads: 0, paid: 0, revenue: 0 };
      map[k].leads += 1;
      if (l.status === 'paid') {
        map[k].paid += 1;
        map[k].revenue += l.priceRupees || 0;
      }
    });
    return Object.entries(map)
      .map(([k, v]) => ({ key: k, ...v }))
      .sort((a, b) => b.leads - a.leads);
  }, [leads]);

  function exportCsv() {
    const headers = [
      'createdAt', 'status', 'ebookKey', 'ebookTitle', 'priceRupees',
      'studentName', 'parentName', 'mobile', 'email',
      'classLevel', 'stream', 'city', 'schoolName',
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_content',
      'paymentId', 'paidAt', 'assessmentCoupon', 'leadId',
    ];
    const rows = filtered.map((l) => [
      l.createdAt?.toDate?.()?.toISOString() || '',
      l.status || '',
      l.ebookKey || '',
      l.ebookTitle || '',
      l.priceRupees || '',
      l.studentName || '',
      l.parentName || '',
      l.mobile || '',
      l.email || '',
      l.classLevel || '',
      l.stream || '',
      l.city || '',
      l.schoolName || '',
      l.utm?.utm_source || '',
      l.utm?.utm_medium || '',
      l.utm?.utm_campaign || '',
      l.utm?.utm_content || '',
      l.paymentId || '',
      l.paidAt?.toDate?.()?.toISOString() || '',
      l.assessmentCoupon || '',
      l.id,
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ebook-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <div style={s.loading}>Loading e-book sales…</div>;
  if (err) return <div style={s.error}>{err}</div>;

  return (
    <div style={{ padding: 8 }}>
      <h2 style={s.h2}>📚 E-book Sales</h2>
      <p style={s.sub}>Funnel data from <code>/ebooks</code> · last 500 leads</p>

      {/* KPIs */}
      <div style={s.kpis}>
        <Kpi label="Revenue (₹)" value={`₹${revenue.toLocaleString('en-IN')}`} accent="#0a7c4a" />
        <Kpi label="Paid orders" value={paidCount} />
        <Kpi label="Total leads" value={totalLeads} />
        <Kpi label="Conversion" value={`${conversion.toFixed(1)}%`} accent={conversion >= 10 ? '#0a7c4a' : '#8a6500'} />
        <Kpi label="Cart abandoned" value={abandoned} accent="#a02525" />
      </div>

      {/* Per-ebook */}
      <h3 style={s.h3}>Per e-book</h3>
      <div style={s.tableWrap}>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>E-book</th>
              <th style={s.thR}>Leads</th>
              <th style={s.thR}>Paid</th>
              <th style={s.thR}>Conv %</th>
              <th style={s.thR}>Revenue</th>
            </tr>
          </thead>
          <tbody>
            {perEbook.map((e) => (
              <tr key={e.key}>
                <td style={s.td}>
                  <span style={{ fontSize: 18, marginRight: 8 }}>{e.icon}</span>
                  <span style={{ color: e.coverColor, fontWeight: 600 }}>{e.title}</span>
                </td>
                <td style={s.tdR}>{e.leads}</td>
                <td style={s.tdR}>{e.paid}</td>
                <td style={s.tdR}>{e.conv.toFixed(1)}%</td>
                <td style={s.tdR}>₹{e.revenue.toLocaleString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* UTM */}
      <h3 style={s.h3}>By traffic source (UTM)</h3>
      <div style={s.tableWrap}>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Source · Campaign</th>
              <th style={s.thR}>Leads</th>
              <th style={s.thR}>Paid</th>
              <th style={s.thR}>Conv %</th>
              <th style={s.thR}>Revenue</th>
            </tr>
          </thead>
          <tbody>
            {utmAgg.length === 0 && (
              <tr><td colSpan={5} style={{ ...s.td, textAlign: 'center', color: '#999' }}>No leads yet.</td></tr>
            )}
            {utmAgg.map((u) => (
              <tr key={u.key}>
                <td style={s.td}>{u.key}</td>
                <td style={s.tdR}>{u.leads}</td>
                <td style={s.tdR}>{u.paid}</td>
                <td style={s.tdR}>{u.leads ? ((u.paid / u.leads) * 100).toFixed(1) : '0.0'}%</td>
                <td style={s.tdR}>₹{u.revenue.toLocaleString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Filters + lead table */}
      <h3 style={s.h3}>Leads</h3>
      <div style={s.filters}>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} style={s.select}>
          <option value="all">All statuses</option>
          <option value="paid">Paid</option>
          <option value="pending_payment">Pending payment</option>
          <option value="cart_abandoned">Cart abandoned</option>
          <option value="payment_failed">Payment failed</option>
        </select>
        <select value={ebookFilter} onChange={(e) => setEbookFilter(e.target.value)} style={s.select}>
          <option value="all">All e-books</option>
          {EBOOK_CATALOG.map((b) => <option key={b.key} value={b.key}>{b.title}</option>)}
        </select>
        <button onClick={exportCsv} style={s.exportBtn}>⬇ Export CSV ({filtered.length})</button>
      </div>

      <div style={s.tableWrap}>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Date</th>
              <th style={s.th}>Status</th>
              <th style={s.th}>E-book</th>
              <th style={s.th}>Student</th>
              <th style={s.th}>Mobile</th>
              <th style={s.th}>Class · Stream</th>
              <th style={s.th}>City</th>
              <th style={s.th}>Source</th>
              <th style={s.thR}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={9} style={{ ...s.td, textAlign: 'center', color: '#999' }}>No leads match the filter.</td></tr>
            )}
            {filtered.map((l) => (
              <tr key={l.id}>
                <td style={s.td}>{l.createdAt?.toDate?.()?.toLocaleString('en-IN') || '—'}</td>
                <td style={s.td}>
                  <span style={{ ...s.badge, background: STATUS_COLORS[l.status || ''] || '#666' }}>
                    {(l.status || '—').replace('_', ' ')}
                  </span>
                </td>
                <td style={s.td}>{l.ebookTitle || l.ebookKey || '—'}</td>
                <td style={s.td}>{l.studentName || '—'}<br /><small style={{ color: '#888' }}>{l.email}</small></td>
                <td style={s.td}>{l.mobile || '—'}</td>
                <td style={s.td}>{l.classLevel || '—'}<br /><small style={{ color: '#888' }}>{l.stream || ''}</small></td>
                <td style={s.td}>{l.city || '—'}</td>
                <td style={s.td}>
                  {l.utm?.utm_source || 'direct'}
                  {l.utm?.utm_campaign && <><br /><small style={{ color: '#888' }}>{l.utm.utm_campaign}</small></>}
                </td>
                <td style={s.tdR}>{l.priceRupees ? `₹${l.priceRupees}` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const Kpi: React.FC<{ label: string; value: string | number; accent?: string }> = ({ label, value, accent }) => (
  <div style={{ ...s.kpi, borderLeft: `4px solid ${accent || '#006D77'}` }}>
    <div style={{ fontSize: 12, color: '#666', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', marginTop: 4 }}>{value}</div>
  </div>
);

const s: Record<string, React.CSSProperties> = {
  loading: { padding: 40, textAlign: 'center', color: '#666' },
  error: { padding: 16, color: '#a02525', background: '#ffebeb', border: '1px solid #ffc1c1', borderRadius: 8 },
  h2: { margin: '4px 0 4px', fontSize: 22, color: '#1a1a1a' },
  sub: { margin: '0 0 18px', color: '#666', fontSize: 13 },
  h3: { fontSize: 15, color: '#2d3748', margin: '24px 0 10px', textTransform: 'uppercase', letterSpacing: 1 },
  kpis: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 },
  kpi: { background: '#fff', padding: '14px 16px', borderRadius: 10, boxShadow: '0 2px 6px rgba(0,0,0,0.04)' },
  tableWrap: { overflowX: 'auto', background: '#fff', borderRadius: 10, boxShadow: '0 2px 6px rgba(0,0,0,0.04)' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: { textAlign: 'left', padding: '10px 12px', background: '#f8faf9', borderBottom: '1px solid #e5e7eb', color: '#444', fontWeight: 600, fontSize: 12, letterSpacing: 0.5 },
  thR: { textAlign: 'right', padding: '10px 12px', background: '#f8faf9', borderBottom: '1px solid #e5e7eb', color: '#444', fontWeight: 600, fontSize: 12, letterSpacing: 0.5 },
  td: { padding: '10px 12px', borderBottom: '1px solid #f0f0f0', verticalAlign: 'top' },
  tdR: { padding: '10px 12px', borderBottom: '1px solid #f0f0f0', textAlign: 'right' },
  badge: { display: 'inline-block', padding: '3px 8px', borderRadius: 12, color: '#fff', fontSize: 11, fontWeight: 700, letterSpacing: 0.3 },
  filters: { display: 'flex', gap: 10, flexWrap: 'wrap', margin: '10px 0 14px' },
  select: { padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, background: '#fff' },
  exportBtn: { padding: '8px 14px', background: '#006D77', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13 },
};

export default EbookSalesPanel;
