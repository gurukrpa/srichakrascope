/**
 * MI Assessment — Admin section for entering Multiple Intelligence & Learning Style scores
 * and generating printable/downloadable reports per student.
 *
 * Data stored in Firestore collection: mi_assessments
 */

import React, { useEffect, useState, useRef } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

// ─── Types ───
interface MIStudent {
  id?: string;
  name: string;
  grade: string;
  doa: string;
  mi: number[];   // 7 scores: linguistic, logicalMath, musical, bodilyKinesthetic, visualSpatial, interpersonal, intrapersonal
  ls: number[];   // 3 scores: visual, auditory, kinesthetic
  createdAt?: any;
}

// ─── Constants ───
const MI_MAX = 25;
const LS_MAX = 10;

const MI_LABELS = ['Linguistic', 'Logical-Math', 'Musical', 'Bodily-Kinesthetic', 'Visual-Spatial', 'Interpersonal', 'Intrapersonal'];
const MI_ICONS  = ['📖', '🧮', '🎵', '⚽', '🎨', '🤝', '🧘'];
const MI_COLORS = ['#E63946', '#457B9D', '#F4A261', '#2A9D8F', '#9B59B6', '#E76F51', '#264653'];
const MI_AKA    = ['Word Smart', 'Number/Logic Smart', 'Music Smart', 'Body Smart', 'Picture Smart', 'People Smart', 'Self Smart'];

const LS_LABELS = ['Visual', 'Auditory', 'Kinesthetic'];
const LS_ICONS  = ['👁️', '👂', '✋'];
const LS_COLORS = ['#9B59B6', '#3498DB', '#2ECC71'];

const MI_DESC: Record<number, { desc: string; parentTips: string[]; schoolTips: string[] }> = {
  0: { desc: 'Excels in reading, writing, storytelling, and verbal expression.', parentTips: ['Encourage daily reading of diverse genres','Provide journals and encourage creative writing','Play word games — Scrabble, crosswords, word puzzles','Encourage participation in debates and storytelling'], schoolTips: ['Assign creative writing and verbal presentations','Encourage participation in literary clubs and debates','Allow oral expression alongside written work'] },
  1: { desc: 'Strong in reasoning, problem-solving, patterns, and calculations.', parentTips: ['Provide puzzles, Sudoku, and chess','Encourage science experiments at home','Explore beginner-friendly coding activities','Discuss cause-and-effect in everyday situations'], schoolTips: ['Challenge with advanced problem-solving tasks','Assign investigative and analytical projects','Introduce logic and coding clubs'] },
  2: { desc: 'Natural sensitivity to rhythm, melody, tone, and sound patterns.', parentTips: ['Explore music lessons — vocal or instrumental','Sing together and attend musical events','Use songs and rhymes to aid memorization','Allow background music during study time'], schoolTips: ['Integrate rhythmic mnemonics into lessons','Encourage participation in school music programs','Use audio-based learning resources'] },
  3: { desc: 'Learns through movement, touch, and physical coordination.', parentTips: ['Encourage sports, dance, or martial arts','Provide hands-on craft and building activities','Allow movement breaks during homework','Try gardening, cooking, or model-building together'], schoolTips: ['Include movement-based activities in lessons','Offer hands-on lab work and physical demonstrations','Encourage participation in sports and drama'] },
  4: { desc: 'Thinks in pictures and understands spatial relationships well.', parentTips: ['Provide art supplies, sketch books, and building kits','Use mind maps and diagrams for study topics','Encourage jigsaw puzzles and LEGO building','Visit museums, art galleries, and nature trails'], schoolTips: ['Use diagrams, charts, and visual aids in teaching','Assign art-based and design projects','Encourage map-making and spatial reasoning tasks'] },
  5: { desc: 'Socially intelligent — understands and connects well with others.', parentTips: ['Encourage group activities and team sports','Discuss different perspectives and feelings of others','Involve in community service or group volunteering','Allow collaborative study with friends'], schoolTips: ['Assign group leadership and collaborative roles','Encourage peer tutoring and mentoring','Create opportunities for team-based projects'] },
  6: { desc: 'Strong self-awareness and capacity for deep reflection.', parentTips: ['Provide a personal journal or diary','Encourage goal-setting and self-reflection time','Allow independent study and quiet time','Discuss emotions openly and support self-expression'], schoolTips: ['Allow independent study and self-paced work','Provide reflection journals and self-assessment tasks','Respect preference for individual over group work'] },
};

const LS_DESC: Record<number, { desc: string; tips: string[] }> = {
  0: { desc: 'Learns best through seeing — diagrams, charts, videos, colours, and written instructions.', tips: ['Use colourful notes, highlighters, and mind maps','Watch educational videos and visual tutorials','Draw diagrams and flowcharts while studying','Use flashcards with images for revision'] },
  1: { desc: 'Learns best through hearing — discussions, lectures, audio, and verbal explanations.', tips: ['Read lessons aloud and discuss topics verbally','Use audiobooks, podcasts, and recorded notes','Encourage group discussions about study topics','Set information to songs or rhythmic patterns'] },
  2: { desc: 'Learns best through doing — hands-on activities, experiments, movement, and touch.', tips: ['Use hands-on experiments and physical models','Take short movement breaks while studying','Act out concepts through role play or drama','Use manipulatives for math and science learning'] },
};

// ─── Helpers ───
function pct(score: number, max: number) { return Math.round((score / max) * 100); }
function miLevel(score: number) {
  const p = pct(score, MI_MAX);
  if (p >= 80) return { label: 'Dominant', color: '#27AE60' };
  if (p >= 60) return { label: 'Strong', color: '#2980B9' };
  if (p >= 40) return { label: 'Developing', color: '#F39C12' };
  return { label: 'Emerging', color: '#E74C3C' };
}
function lsLevel(score: number) {
  const p = pct(score, LS_MAX);
  if (p >= 80) return { label: 'Dominant', color: '#27AE60', bg: '#E8F5E9' };
  if (p >= 60) return { label: 'Strong', color: '#2980B9', bg: '#E3F2FD' };
  if (p >= 40) return { label: 'Moderate', color: '#F39C12', bg: '#FFF8E1' };
  return { label: 'Low', color: '#E74C3C', bg: '#FFEBEE' };
}

function getTopMI(mi: number[]) {
  return mi.map((s, i) => ({ idx: i, score: s })).sort((a, b) => b.score - a.score).slice(0, 3);
}

function getDominantLS(ls: number[]) {
  const sorted = ls.map((s, i) => ({ idx: i, score: s })).sort((a, b) => b.score - a.score);
  return { sorted, isBalanced: sorted[0].score - sorted[sorted.length - 1].score <= 1 };
}

// ─── SVG Radar Chart (inline) ───
function RadarChart({ scores }: { scores: number[] }) {
  const size = 320, cx = size / 2, cy = size / 2, R = 105, n = 7;
  function pt(i: number, val: number) {
    const a = (2 * Math.PI / n) * i - Math.PI / 2;
    const r = (val / MI_MAX) * R;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  }
  const gridLevels = [1, 2, 3, 4, 5];
  const dataPts = scores.map((s, i) => pt(i, s));
  const poly = dataPts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: 280, height: 280 }}>
      <circle cx={cx} cy={cy} r={R + 8} fill="#FAFCFD" />
      {gridLevels.map(level => {
        const pts = Array.from({ length: n }, (_, i) => pt(i, MI_MAX * level / 5));
        return <polygon key={level} points={pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}
          fill="none" stroke="#E0E8EC" strokeWidth={level === 5 ? 1.2 : 0.6} strokeDasharray={level < 5 ? '3,3' : 'none'} />;
      })}
      {Array.from({ length: n }, (_, i) => {
        const p = pt(i, MI_MAX);
        return <line key={i} x1={cx} y1={cy} x2={p.x.toFixed(1)} y2={p.y.toFixed(1)} stroke="#D5DEE3" strokeWidth={0.6} />;
      })}
      <polygon points={poly} fill="rgba(0,109,119,0.15)" stroke="#006D77" strokeWidth={2.2} strokeLinejoin="round" />
      {dataPts.map((p, i) => (
        <React.Fragment key={i}>
          <circle cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r={4.5} fill={MI_COLORS[i]} stroke="white" strokeWidth={2} />
          <text x={cx + (R + 30) * Math.cos((2 * Math.PI / n) * i - Math.PI / 2)}
                y={cy + (R + 30) * Math.sin((2 * Math.PI / n) * i - Math.PI / 2)}
                textAnchor="middle" dominantBaseline="middle" fontSize={9} fontWeight={700} fill={MI_COLORS[i]}>
            {MI_ICONS[i]} {scores[i]}
          </text>
        </React.Fragment>
      ))}
    </svg>
  );
}

// ════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════
const MIAssessment: React.FC = () => {
  const [records, setRecords] = useState<MIStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [viewReport, setViewReport] = useState<MIStudent | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formGrade, setFormGrade] = useState('');
  const [formDoa, setFormDoa] = useState(new Date().toISOString().slice(0, 10));
  const [formMI, setFormMI] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [formLS, setFormLS] = useState<number[]>([0, 0, 0]);
  const [formError, setFormError] = useState('');

  // ─── Fetch records ───
  useEffect(() => {
    fetchRecords();
  }, []);

  async function fetchRecords() {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'mi_assessments'), orderBy('createdAt', 'desc')));
      const list: MIStudent[] = snap.docs.map(d => ({ id: d.id, ...d.data() } as MIStudent));
      setRecords(list);
    } catch (err) {
      console.error('Error loading MI assessments:', err);
    }
    setLoading(false);
  }

  // ─── Save new record ───
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    if (!formName.trim() || !formGrade.trim()) { setFormError('Name and Grade are required.'); return; }
    if (formMI.some(v => v < 0 || v > MI_MAX)) { setFormError(`MI scores must be between 0 and ${MI_MAX}.`); return; }
    if (formLS.some(v => v < 0 || v > LS_MAX)) { setFormError(`LS scores must be between 0 and ${LS_MAX}.`); return; }

    setSaving(true);
    try {
      await addDoc(collection(db, 'mi_assessments'), {
        name: formName.trim(),
        grade: formGrade.trim(),
        doa: formDoa,
        mi: formMI,
        ls: formLS,
        createdAt: Timestamp.now(),
      });
      setFormName(''); setFormGrade(''); setFormDoa(new Date().toISOString().slice(0, 10));
      setFormMI([0, 0, 0, 0, 0, 0, 0]); setFormLS([0, 0, 0]);
      setShowForm(false);
      await fetchRecords();
    } catch (err: any) {
      setFormError('Failed to save: ' + (err.message || 'Unknown error'));
    }
    setSaving(false);
  }

  // ─── Delete record ───
  async function handleDelete(id: string) {
    if (!window.confirm('Delete this MI assessment record?')) return;
    try {
      await deleteDoc(doc(db, 'mi_assessments', id));
      setRecords(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error('Error deleting:', err);
    }
  }

  // ─── Print report ───
  function handlePrint() {
    if (!printRef.current) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>MI Report — ${viewReport?.name}</title>${PRINT_STYLES}</head><body>${printRef.current.innerHTML}</body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 400);
  }

  // ─── Render ───
  if (viewReport) return <ReportView student={viewReport} onBack={() => setViewReport(null)} printRef={printRef} onPrint={handlePrint} />;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: '1.15em', fontWeight: 700, color: '#006D77' }}>🧠 Multiple Intelligence Assessments</h2>
        <button onClick={() => setShowForm(!showForm)} style={btn('#006D77')}>
          {showForm ? '✕ Close Form' : '＋ Add Student Scores'}
        </button>
      </div>

      {/* Entry Form */}
      {showForm && (
        <form onSubmit={handleSave} style={card}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={labelSt}>Student Name *</label>
              <input value={formName} onChange={e => setFormName(e.target.value)} required style={inputSt} placeholder="e.g. Nandinee" />
            </div>
            <div>
              <label style={labelSt}>Grade *</label>
              <input value={formGrade} onChange={e => setFormGrade(e.target.value)} required style={inputSt} placeholder="e.g. 6" />
            </div>
            <div>
              <label style={labelSt}>Date of Assessment</label>
              <input type="date" value={formDoa} onChange={e => setFormDoa(e.target.value)} style={inputSt} />
            </div>
          </div>

          <h3 style={{ fontSize: '0.95em', color: '#006D77', margin: '8px 0' }}>Multiple Intelligence Scores (max {MI_MAX})</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(165px, 1fr))', gap: 10, marginBottom: 16 }}>
            {MI_LABELS.map((label, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '1.1em' }}>{MI_ICONS[i]}</span>
                <div style={{ flex: 1 }}>
                  <label style={{ ...labelSt, color: MI_COLORS[i] }}>{label}</label>
                  <input type="number" min={0} max={MI_MAX} value={formMI[i]} onChange={e => { const v = [...formMI]; v[i] = Number(e.target.value); setFormMI(v); }} style={{ ...inputSt, width: '100%' }} />
                </div>
              </div>
            ))}
          </div>

          <h3 style={{ fontSize: '0.95em', color: '#006D77', margin: '8px 0' }}>Learning Style Scores (max {LS_MAX})</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(165px, 1fr))', gap: 10, marginBottom: 16 }}>
            {LS_LABELS.map((label, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '1.1em' }}>{LS_ICONS[i]}</span>
                <div style={{ flex: 1 }}>
                  <label style={{ ...labelSt, color: LS_COLORS[i] }}>{label}</label>
                  <input type="number" min={0} max={LS_MAX} value={formLS[i]} onChange={e => { const v = [...formLS]; v[i] = Number(e.target.value); setFormLS(v); }} style={{ ...inputSt, width: '100%' }} />
                </div>
              </div>
            ))}
          </div>

          {formError && <div style={{ color: '#E53E3E', fontWeight: 600, marginBottom: 10, fontSize: '0.9em' }}>{formError}</div>}
          <button type="submit" disabled={saving} style={btn('#006D77')}>
            {saving ? 'Saving…' : '💾 Save Assessment'}
          </button>
        </form>
      )}

      {/* Records Table */}
      {loading ? (
        <div style={{ textAlign: 'center', color: '#999', padding: 40 }}>Loading…</div>
      ) : records.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', color: '#999' }}>No MI assessment records yet. Click "Add Student Scores" to begin.</div>
      ) : (
        <div style={{ ...card, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88em' }}>
            <thead>
              <tr style={{ background: '#F7FAFC' }}>
                <th style={th}>#</th>
                <th style={th}>Name</th>
                <th style={th}>Grade</th>
                <th style={th}>Date</th>
                {MI_LABELS.map((l, i) => <th key={i} style={{ ...th, color: MI_COLORS[i] }}>{MI_ICONS[i]} {l}</th>)}
                {LS_LABELS.map((l, i) => <th key={i} style={{ ...th, color: LS_COLORS[i] }}>{LS_ICONS[i]} {l}</th>)}
                <th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r, idx) => {
                const top = getTopMI(r.mi)[0];
                return (
                  <tr key={r.id} style={idx % 2 === 0 ? { background: '#FAFCFD' } : {}}>
                    <td style={td}>{idx + 1}</td>
                    <td style={{ ...td, fontWeight: 600 }}>{r.name}</td>
                    <td style={td}>{r.grade}</td>
                    <td style={td}>{r.doa}</td>
                    {r.mi.map((s, i) => {
                      const lv = miLevel(s);
                      return <td key={i} style={td}><span style={{ fontWeight: 600 }}>{s}</span> <span style={{ fontSize: '0.75em', color: lv.color }}>{lv.label}</span></td>;
                    })}
                    {r.ls.map((s, i) => {
                      const lv = lsLevel(s);
                      return <td key={i} style={td}><span style={{ fontWeight: 600 }}>{s}</span> <span style={{ fontSize: '0.75em', color: lv.color }}>{lv.label}</span></td>;
                    })}
                    <td style={td}>
                      <button onClick={() => setViewReport(r)} style={btn('#006D77', true)} title="View Report">📊</button>
                      <button onClick={() => r.id && handleDelete(r.id)} style={{ ...btn('#E53E3E', true), marginLeft: 6 }} title="Delete">🗑️</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════
//  REPORT VIEW (full-page printable report)
// ════════════════════════════════════════════════════════════════════
function ReportView({ student, onBack, printRef, onPrint }: { student: MIStudent; onBack: () => void; printRef: React.RefObject<HTMLDivElement>; onPrint: () => void }) {
  const top3 = getTopMI(student.mi);
  const lsResult = getDominantLS(student.ls);

  return (
    <div>
      {/* Action bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={onBack} style={btn('#718096')}>← Back to List</button>
        <button onClick={onPrint} style={btn('#006D77')}>🖨️ Print / Download PDF</button>
        <span style={{ color: '#718096', fontSize: '0.9em' }}>Use "Save as PDF" in the print dialog to download</span>
      </div>

      {/* Printable content */}
      <div ref={printRef as any}>
        {/* ══════ PAGE 1: Score Dashboard ══════ */}
        <div style={reportPage}>
          {/* Header Banner */}
          <div style={headerBanner}>
            <div style={logoCircle}>SA</div>
            <div>
              <div style={{ fontSize: '1.3em', fontWeight: 700 }}>Multiple Intelligence &amp; Learning Style Profile</div>
              <div style={{ fontSize: '0.82em', opacity: 0.9 }}>Srichakra Academy — The School To Identify Your Child's Divine Gift!</div>
              <div style={{ fontSize: '0.72em', opacity: 0.7, fontStyle: 'italic' }}>(A Unit of SriKrpa Foundation Trust)</div>
            </div>
          </div>

          {/* Student bar */}
          <div style={studentBar}>
            <span style={{ color: '#006D77', fontWeight: 700, fontSize: '1.1em' }}>👤 {student.name}</span>
            <span style={{ fontWeight: 600 }}>Grade: {student.grade}</span>
            <span style={{ fontWeight: 600 }}>Date: {student.doa}</span>
          </div>

          {/* Chart + Bars */}
          <div style={{ display: 'flex', gap: 10, padding: '8px 24px 4px', alignItems: 'flex-start' }}>
            <div style={{ flexShrink: 0 }}>
              <RadarChart scores={student.mi} />
            </div>
            <div style={{ flex: 1, paddingTop: 4 }}>
              {student.mi.map((score, i) => {
                const p = pct(score, MI_MAX);
                const lv = miLevel(score);
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: 5, fontSize: '0.82em' }}>
                    <div style={{ width: 105, fontWeight: 600, textAlign: 'right', paddingRight: 10, color: MI_COLORS[i], fontSize: '0.85em' }}>{MI_ICONS[i]} {MI_LABELS[i]}</div>
                    <div style={{ flex: 1, height: 20, background: '#F0F0F0', borderRadius: 10, overflow: 'hidden' }}>
                      <div style={{ width: `${p}%`, height: '100%', borderRadius: 10, background: `linear-gradient(90deg, ${MI_COLORS[i]}CC, ${MI_COLORS[i]})`, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 8, fontWeight: 700, color: 'white', fontSize: '0.8em', minWidth: 38 }}>{p}%</div>
                    </div>
                    <div style={{ width: 48, textAlign: 'center', fontWeight: 600, fontSize: '0.85em', color: '#555' }}>{score}/{MI_MAX}</div>
                    <div style={{ width: 85, fontSize: '0.72em', fontWeight: 600, paddingLeft: 4, color: lv.color }}>{lv.label}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top 3 Strengths */}
          <div style={sectionTitle}>🏆 Top 3 Dominant Intelligences</div>
          <div style={{ display: 'flex', gap: 12, padding: '0 30px 6px', justifyContent: 'center' }}>
            {top3.map((item, rank) => {
              const p = pct(item.score, MI_MAX);
              return (
                <div key={rank} style={{ flex: 1, maxWidth: 200, borderRadius: 12, padding: '12px 10px', textAlign: 'center', color: 'white', background: `linear-gradient(135deg, ${MI_COLORS[item.idx]}, ${MI_COLORS[item.idx]}DD)`, position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 6, left: 10, fontSize: '0.72em', background: 'rgba(255,255,255,0.3)', borderRadius: 10, padding: '1px 8px', fontWeight: 700 }}>#{rank + 1}</div>
                  <div style={{ fontSize: '1.8em' }}>{MI_ICONS[item.idx]}</div>
                  <div style={{ fontWeight: 700, fontSize: '0.88em' }}>{MI_LABELS[item.idx]}</div>
                  <div style={{ fontSize: '1.5em', fontWeight: 800 }}>{p}%</div>
                  <div style={{ fontSize: '0.7em', opacity: 0.9 }}>{MI_AKA[item.idx]}</div>
                </div>
              );
            })}
          </div>

          {/* Learning Styles */}
          <div style={sectionTitle}>📚 Learning Style Profile</div>
          <div style={{ padding: '0 30px 10px' }}>
            {student.ls.map((score, i) => {
              const p = pct(score, LS_MAX);
              const lv = lsLevel(score);
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: 7 }}>
                  <div style={{ fontSize: '1.4em', width: 36, textAlign: 'center' }}>{LS_ICONS[i]}</div>
                  <div style={{ width: 95 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88em' }}>{LS_LABELS[i]}</div>
                    <div style={{ fontSize: '0.75em', color: '#888' }}>{score}/{LS_MAX}</div>
                  </div>
                  <div style={{ flex: 1, height: 26, background: '#F0F0F0', borderRadius: 13, overflow: 'hidden', margin: '0 10px' }}>
                    <div style={{ width: `${p}%`, height: '100%', borderRadius: 13, background: `linear-gradient(90deg, ${LS_COLORS[i]}CC, ${LS_COLORS[i]})`, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 10, fontWeight: 700, color: 'white', fontSize: '0.85em' }}>{p}%</div>
                  </div>
                  <div style={{ fontSize: '0.78em', fontWeight: 700, padding: '3px 10px', borderRadius: 12, color: lv.color, background: lv.bg }}>{lv.label}</div>
                </div>
              );
            })}
            {lsResult.isBalanced ? (
              <div style={lsInsight}>🌟 <strong>Balanced Learner!</strong> {student.name} adapts well across Visual, Auditory, and Kinesthetic modes. Use a mix of learning methods for best results.</div>
            ) : (
              <div style={lsInsight}>🌟 <strong>Primarily a {LS_LABELS[lsResult.sorted[0].idx]} Learner</strong> — {LS_DESC[lsResult.sorted[0].idx].desc}</div>
            )}
          </div>

          <div style={footer}>
            <strong style={{ color: '#006D77' }}>Srichakra Academy</strong> — Comprehensive Psychometric Profile &nbsp;|&nbsp; Page 1 of 2
          </div>
        </div>

        {/* ══════ PAGE 2: Guidance ══════ */}
        <div style={{ ...reportPage, pageBreakBefore: 'always' }}>
          <div style={headerBanner}>
            <div style={logoCircle}>SA</div>
            <div>
              <div style={{ fontSize: '1.15em', fontWeight: 700 }}>Understanding {student.name}'s Unique Strengths</div>
              <div style={{ fontSize: '0.82em', opacity: 0.85 }}>Personalised guidance for parents and teachers</div>
            </div>
          </div>
          <div style={studentBar}>
            <span style={{ color: '#006D77', fontWeight: 700 }}>👤 {student.name} — Grade {student.grade}</span>
            <span style={{ fontWeight: 600 }}>Assessment: {student.doa}</span>
          </div>

          {/* Intelligence details */}
          <div style={sectionTitle}>🧠 Your Child's Top Intelligence Areas</div>
          <div style={{ padding: '14px 26px 6px' }}>
            {top3.map((item, rank) => {
              const p = pct(item.score, MI_MAX);
              const def = MI_DESC[item.idx];
              return (
                <div key={rank} style={{ display: 'flex', gap: 14, padding: 12, borderRadius: 10, marginBottom: 10, borderLeft: `5px solid ${MI_COLORS[item.idx]}`, background: `${MI_COLORS[item.idx]}08` }}>
                  <div style={{ fontSize: '2em', flexShrink: 0 }}>{MI_ICONS[item.idx]}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95em' }}>{MI_LABELS[item.idx]} Intelligence <span style={{ color: MI_COLORS[item.idx], fontSize: '0.85em' }}>({p}%)</span></div>
                    <div style={{ fontSize: '0.78em', color: '#888', fontStyle: 'italic' }}>{MI_AKA[item.idx]}</div>
                    <div style={{ fontSize: '0.85em', marginTop: 4, lineHeight: 1.5 }}>{def.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tips grid */}
          <div style={sectionTitle}>💡 Actionable Recommendations</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '6px 26px 10px' }}>
            <div style={tipBox('#E8F5E9', '#A5D6A7', '#2E7D32')}>
              <h3 style={{ fontSize: '0.95em', marginBottom: 8, color: '#2E7D32', display: 'flex', alignItems: 'center', gap: 6 }}>🏠 Tips for Parents</h3>
              <ul style={{ paddingLeft: 18, margin: 0 }}>
                {top3.flatMap(item => MI_DESC[item.idx].parentTips.slice(0, 2).map(t => `${MI_ICONS[item.idx]} ${t}`)).map((t, i) => <li key={i} style={{ marginBottom: 4, lineHeight: 1.5 }}>{t}</li>)}
              </ul>
            </div>
            <div style={tipBox('#E3F2FD', '#90CAF9', '#1565C0')}>
              <h3 style={{ fontSize: '0.95em', marginBottom: 8, color: '#1565C0', display: 'flex', alignItems: 'center', gap: 6 }}>🏫 Tips for School</h3>
              <ul style={{ paddingLeft: 18, margin: 0 }}>
                {top3.flatMap(item => MI_DESC[item.idx].schoolTips.slice(0, 2).map(t => `${MI_ICONS[item.idx]} ${t}`)).map((t, i) => <li key={i} style={{ marginBottom: 4, lineHeight: 1.5 }}>{t}</li>)}
              </ul>
            </div>
            <div style={tipBox('#FFF3E0', '#FFCC80', '#E65100')}>
              <h3 style={{ fontSize: '0.95em', marginBottom: 8, color: '#E65100', display: 'flex', alignItems: 'center', gap: 6 }}>{LS_ICONS[lsResult.sorted[0].idx]} Learning Style Tips</h3>
              <ul style={{ paddingLeft: 18, margin: 0 }}>
                {LS_DESC[lsResult.sorted[0].idx].tips.map((t, i) => <li key={i} style={{ marginBottom: 4, lineHeight: 1.5 }}>{t}</li>)}
              </ul>
            </div>
            <div style={tipBox('#F3E5F5', '#CE93D8', '#7B1FA2')}>
              <h3 style={{ fontSize: '0.95em', marginBottom: 8, color: '#7B1FA2', display: 'flex', alignItems: 'center', gap: 6 }}>✨ General Guidance</h3>
              <ul style={{ paddingLeft: 18, margin: 0 }}>
                <li style={{ marginBottom: 4, lineHeight: 1.5 }}>Every intelligence can be nurtured with the right environment</li>
                <li style={{ marginBottom: 4, lineHeight: 1.5 }}>Focus on strengths while gently developing other areas</li>
                <li style={{ marginBottom: 4, lineHeight: 1.5 }}>Avoid comparing children — each has a unique intelligence profile</li>
                <li style={{ marginBottom: 4, lineHeight: 1.5 }}>Regular practice and encouragement make the biggest difference</li>
              </ul>
            </div>
          </div>

          <div style={footer}>
            <strong style={{ color: '#006D77' }}>Srichakra Academy</strong> — (A Unit of SriKrpa Foundation Trust)<br />
            Based on Howard Gardner's Theory of Multiple Intelligences &nbsp;|&nbsp; This report is a guidance tool, not a definitive assessment. &nbsp;|&nbsp; Page 2 of 2
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  PRINT STYLES (injected into popup window)
// ════════════════════════════════════════════════════════════════════
const PRINT_STYLES = `<style>
  @page { size: A4; margin: 6mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #2D3436; }
</style>`;

// ════════════════════════════════════════════════════════════════════
//  INLINE STYLES
// ════════════════════════════════════════════════════════════════════
const btn = (bg: string, small?: boolean): React.CSSProperties => ({
  background: bg, color: '#fff', border: 'none', borderRadius: small ? 6 : 8,
  padding: small ? '5px 10px' : '9px 20px', fontWeight: 600, cursor: 'pointer',
  fontSize: small ? '0.85em' : '0.92em',
});

const card: React.CSSProperties = {
  background: '#fff', borderRadius: 12, padding: 24, marginBottom: 20,
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
};

const labelSt: React.CSSProperties = { display: 'block', fontSize: '0.82em', fontWeight: 600, marginBottom: 4, color: '#4A5568' };
const inputSt: React.CSSProperties = { padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: '0.92em', width: '100%' };

const th: React.CSSProperties = { padding: '10px 8px', textAlign: 'left', fontWeight: 600, fontSize: '0.82em', borderBottom: '2px solid #E2E8F0', whiteSpace: 'nowrap' };
const td: React.CSSProperties = { padding: '8px', borderBottom: '1px solid #F0F0F0', whiteSpace: 'nowrap' };

const reportPage: React.CSSProperties = { width: '210mm', margin: '0 auto 30px', background: 'white', boxShadow: '0 4px 25px rgba(0,0,0,0.1)', overflow: 'hidden' };
const headerBanner: React.CSSProperties = { background: 'linear-gradient(135deg, #006D77 0%, #009B8D 50%, #83C5BE 100%)', color: 'white', padding: '14px 30px', display: 'flex', alignItems: 'center', gap: 18 };
const logoCircle: React.CSSProperties = { width: 54, height: 54, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.2em', color: 'white', flexShrink: 0 };
const studentBar: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FFFE', borderBottom: '2px solid #E0F2F1', padding: '10px 30px', fontSize: '0.92em' };
const sectionTitle: React.CSSProperties = { fontSize: '1em', fontWeight: 700, color: '#006D77', padding: '6px 30px 4px', borderBottom: '2px solid #E0F2F1', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 8 };
const lsInsight: React.CSSProperties = { background: '#FFF8E1', borderLeft: '4px solid #FFB300', padding: '8px 14px', borderRadius: '0 8px 8px 0', fontSize: '0.85em', marginTop: 6, color: '#5D4037' };
const footer: React.CSSProperties = { background: '#F8FFFE', borderTop: '2px solid #E0F2F1', padding: '12px 30px', textAlign: 'center', fontSize: '0.75em', color: '#888', marginTop: 12 };

function tipBox(bg: string, border: string, _textColor: string): React.CSSProperties {
  return { borderRadius: 10, padding: 14, fontSize: '0.85em', background: bg, border: `1px solid ${border}` };
}

export default MIAssessment;
