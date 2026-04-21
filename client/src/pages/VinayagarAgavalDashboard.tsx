/**
 * VINAYAGAR AGAVAL LEARNING DASHBOARD
 * Theme: "My Friend Ganesha" — Playful, child-friendly
 * Bilingual: Tamil & English
 *
 * Features:
 * - Daily lesson display (Tamil + Transliteration + Meaning)
 * - Morning / Evening session toggle
 * - Audio playback with lyrics highlight
 * - Audio recording & re-recording (MediaRecorder API)
 * - Progress tracker (Day X of 56)
 * - Badge collection & appreciation
 * - WhatsApp share button
 * - Grand Chanting Day countdown & join
 * - Full verse reference view
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PROGRAM_SCHEDULE,
  ALL_VERSES,
  BADGES,
  GRAND_CHANTING_EVENT,
  PROGRAM_INFO,
} from '../data/vinayagarAgaval';
import type { DayLesson, Badge } from '../data/vinayagarAgaval';

type Lang = 'ta' | 'en' | 'both';
type Session = 'morning' | 'evening';
type Tab = 'today' | 'progress' | 'badges' | 'all-verses' | 'event';

const STORAGE_KEY = 'agaval_learner_state';

interface LearnerState {
  currentDay: number;
  completedDays: number[];
  morningDone: Record<number, boolean>;
  eveningDone: Record<number, boolean>;
  recordings: number;
  streak: number;
  lastActiveDate: string;
  badges: string[];
  joinedGrandChanting: boolean;
}

const defaultState: LearnerState = {
  currentDay: 1,
  completedDays: [],
  morningDone: {},
  eveningDone: {},
  recordings: 0,
  streak: 0,
  lastActiveDate: '',
  badges: [],
  joinedGrandChanting: false,
};

function loadState(): LearnerState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...defaultState, ...JSON.parse(saved) } : defaultState;
  } catch {
    return defaultState;
  }
}

const VinayagarAgavalDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [lang, setLang] = useState<Lang>('both');
  const [tab, setTab] = useState<Tab>('today');
  const [session, setSession] = useState<Session>(() => new Date().getHours() < 14 ? 'morning' : 'evening');
  const [state, setState] = useState<LearnerState>(loadState);

  // Audio recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [recordingError, setRecordingError] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Playback
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState(-1);
  const playIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioAvailable, setAudioAvailable] = useState<boolean | null>(null);

  // Save state on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Check and update streak
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (state.lastActiveDate && state.lastActiveDate !== today) {
      const lastDate = new Date(state.lastActiveDate);
      const diff = Math.floor((new Date(today).getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diff > 1) {
        setState(s => ({ ...s, streak: 0 }));
      }
    }
  }, [state.lastActiveDate]);

  const t = (obj: { ta: string; en: string }) => {
    if (lang === 'ta') return obj.ta;
    if (lang === 'en') return obj.en;
    return `${obj.ta}\n${obj.en}`;
  };

  const today = PROGRAM_SCHEDULE.find(d => d.day === state.currentDay) || PROGRAM_SCHEDULE[0];
  const progress = Math.round((state.currentDay / 56) * 100);

  // ── Badge Checking ──
  const checkBadges = useCallback((newState: LearnerState): string[] => {
    const earned: string[] = [...newState.badges];
    const add = (id: string) => { if (!earned.includes(id)) earned.push(id); };

    if (newState.completedDays.includes(1)) add('first-step');
    if (newState.recordings >= 1) add('melody-maker');
    if (newState.streak >= 7) add('week-champion');
    if (newState.streak >= 14) add('streak-star');
    if (newState.completedDays.includes(28)) add('halfway-hero');
    if (newState.completedDays.length >= 18) add('diamond-learner');
    if (newState.recordings >= 10) add('voice-devotion');
    if (newState.completedDays.length >= 55) add('agaval-master');
    if (newState.joinedGrandChanting) add('world-record');
    // Random appreciation — 10% chance after each recording
    if (newState.recordings > 0 && Math.random() < 0.1 && !earned.includes('star-performer')) add('star-performer');

    return earned;
  }, []);

  // ── Mark Session Complete ──
  const markSessionDone = () => {
    const todayDate = new Date().toISOString().split('T')[0];
    setState(prev => {
      const updated = { ...prev };
      if (session === 'morning') {
        updated.morningDone = { ...prev.morningDone, [prev.currentDay]: true };
      } else {
        updated.eveningDone = { ...prev.eveningDone, [prev.currentDay]: true };
      }

      // If both morning & evening done, mark day complete
      if (updated.morningDone[prev.currentDay] && updated.eveningDone[prev.currentDay]) {
        if (!updated.completedDays.includes(prev.currentDay)) {
          updated.completedDays = [...prev.completedDays, prev.currentDay];
          // Update streak
          if (prev.lastActiveDate === todayDate) {
            // Already active today
          } else {
            const lastDate = new Date(prev.lastActiveDate || todayDate);
            const diff = Math.floor((new Date(todayDate).getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
            updated.streak = diff <= 1 ? prev.streak + 1 : 1;
          }
          updated.lastActiveDate = todayDate;
          // Advance to next day
          if (prev.currentDay < 56) {
            updated.currentDay = prev.currentDay + 1;
          }
        }
      }

      updated.badges = checkBadges(updated);
      return updated;
    });
  };

  // ── Audio Recording ──
  const startRecording = async () => {
    setRecordingError('');
    setRecordingBlob(null);
    setRecordingUrl(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setRecordingBlob(blob);
        setRecordingUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
        setState(prev => {
          const updated = { ...prev, recordings: prev.recordings + 1 };
          updated.badges = checkBadges(updated);
          return updated;
        });
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch {
      setRecordingError(lang === 'ta'
        ? 'ஒலிப்பதிவு அனுமதி தேவை. உலாவி அனுமதியை சரிபார்க்கவும்.'
        : 'Microphone permission required. Please check browser settings.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const reRecord = () => {
    setRecordingBlob(null);
    setRecordingUrl(null);
  };

  // ── Audio Playback with Line Highlight ──
  // Check if audio file exists for current day
  useEffect(() => {
    const dayNum = String(state.currentDay).padStart(2, '0');
    const url = `/audio/day-${dayNum}.mp3`;
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.src = url;
    audio.onloadedmetadata = () => setAudioAvailable(true);
    audio.onerror = () => setAudioAvailable(false);
    return () => { audio.src = ''; };
  }, [state.currentDay]);

  const startPlayback = () => {
    if (isPlaying) {
      stopPlayback();
      return;
    }

    const dayNum = String(state.currentDay).padStart(2, '0');
    const audioUrl = `/audio/day-${dayNum}.mp3`;

    // Try playing real audio file
    if (audioAvailable) {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      setIsPlaying(true);
      setCurrentLineIndex(0);

      // Sync line highlighting to audio duration
      const lineCount = today.lines.length;
      audio.onloadedmetadata = () => {
        const interval = (audio.duration / lineCount) * 1000;
        let idx = 0;
        playIntervalRef.current = setInterval(() => {
          idx++;
          if (idx >= lineCount) {
            stopPlayback();
          } else {
            setCurrentLineIndex(idx);
          }
        }, interval);
      };

      audio.onended = () => stopPlayback();
      audio.onerror = () => stopPlayback();
      audio.play().catch(() => stopPlayback());
    } else {
      // Fallback: visual highlight only (3s per line)
      setIsPlaying(true);
      setCurrentLineIndex(0);
      let idx = 0;
      playIntervalRef.current = setInterval(() => {
        idx++;
        if (idx >= today.lines.length) {
          stopPlayback();
        } else {
          setCurrentLineIndex(idx);
        }
      }, 3000);
    }
  };

  const stopPlayback = () => {
    if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current);
      playIntervalRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    setIsPlaying(false);
    setCurrentLineIndex(-1);
  };

  useEffect(() => {
    return () => {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; }
    };
  }, []);

  // ── WhatsApp Share ──
  const shareWhatsApp = () => {
    const lines = today.lines.map(l => l.tamil).join('\n');
    const text = encodeURIComponent(
      `🐘 Vinayagar Agaval - Day ${state.currentDay}\n\n${lines}\n\n${t(today.instruction)}\n\n#MyFriendGanesha #VinayagarAgaval`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  // ── Grand Chanting Countdown ──
  const eventDate = new Date(GRAND_CHANTING_EVENT.eventDate);
  const now = new Date();
  const daysUntilEvent = Math.max(0, Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  const isMorningDone = state.morningDone[state.currentDay] || false;
  const isEveningDone = state.eveningDone[state.currentDay] || false;
  const isSessionDone = session === 'morning' ? isMorningDone : isEveningDone;

  return (
    <div style={styles.page}>
      {/* ── Header ── */}
      <div style={styles.header}>
        <button onClick={() => navigate('/')} style={styles.backBtn}>←</button>
        <div style={{ flex: 1, textAlign: 'center' as const }}>
          <div style={{ fontSize: '1.5rem' }}>🐘</div>
          <div style={{ fontSize: '1rem', fontWeight: 700 }}>
            {t({ ta: 'என் நண்பன் கணேசா', en: 'My Friend Ganesha' })}
          </div>
        </div>
        <div style={styles.langMini}>
          {(['ta', 'both', 'en'] as Lang[]).map(l => (
            <button
              key={l}
              onClick={() => setLang(l)}
              style={lang === l ? { ...styles.langDot, background: '#fff', color: '#FF6B35' } : styles.langDot}
            >
              {l === 'ta' ? 'த' : l === 'en' ? 'En' : '⇄'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Progress Ring ── */}
      <div style={styles.progressSection}>
        <div style={styles.progressRing}>
          <svg width="100" height="100" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#FFE0B2" strokeWidth="8" />
            <circle
              cx="50" cy="50" r="42" fill="none" stroke="#FF6B35" strokeWidth="8"
              strokeDasharray={`${(progress / 100) * 264} 264`}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div style={styles.progressText}>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FF6B35' }}>{state.currentDay}</span>
            <span style={{ fontSize: '0.7rem', color: '#795548' }}>/56</span>
          </div>
        </div>
        <div style={{ textAlign: 'center' as const }}>
          <div style={{ fontWeight: 700, color: '#E65100' }}>
            {today.phaseEmoji} {t(today.phaseName)}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#795548' }}>
            🔥 {state.streak} {lang === 'ta' ? 'நாள் தொடர்' : 'day streak'} | 🎤 {state.recordings} {lang === 'ta' ? 'பதிவுகள்' : 'recordings'}
          </div>
        </div>
      </div>

      {/* ── Tab Navigation ── */}
      <div style={styles.tabBar}>
        {([
          { key: 'today' as Tab, ta: "📖 இன்று", en: '📖 Today' },
          { key: 'progress' as Tab, ta: '📊 முன்னேற்றம்', en: '📊 Progress' },
          { key: 'badges' as Tab, ta: '🏅 பேட்ஜ்', en: '🏅 Badges' },
          { key: 'all-verses' as Tab, ta: '📜 அனைத்து', en: '📜 All Verses' },
          { key: 'event' as Tab, ta: '🏆 நிகழ்வு', en: '🏆 Event' },
        ]).map(tb => (
          <button
            key={tb.key}
            onClick={() => setTab(tb.key)}
            style={tab === tb.key ? { ...styles.tabBtn, ...styles.tabBtnActive } : styles.tabBtn}
          >
            {lang === 'ta' ? tb.ta : tb.en}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <div style={styles.content}>
        {/* TODAY TAB */}
        {tab === 'today' && (
          <>
            {/* Morning / Evening Toggle */}
            <div style={styles.sessionToggle}>
              <button
                onClick={() => setSession('morning')}
                style={session === 'morning' ? { ...styles.sessionBtn, ...styles.sessionBtnActive } : styles.sessionBtn}
              >
                🌅 {lang === 'ta' ? 'காலை' : 'Morning'}
                {isMorningDone && ' ✅'}
              </button>
              <button
                onClick={() => setSession('evening')}
                style={session === 'evening' ? { ...styles.sessionBtn, ...styles.sessionBtnActive } : styles.sessionBtn}
              >
                🌙 {lang === 'ta' ? 'மாலை' : 'Evening'}
                {isEveningDone && ' ✅'}
              </button>
            </div>

            {/* Session Instruction */}
            <div style={styles.instructionCard}>
              <p style={{ margin: 0, whiteSpace: 'pre-line' as const, lineHeight: 1.7 }}>
                {session === 'morning'
                  ? t({ ta: '🌅 காலை நேரம்: புதிய வரிகளை கற்றுக்கொள்ளுங்கள்', en: '🌅 Morning Session: Learn the new lines' })
                  : t({ ta: '🌙 மாலை நேரம்: காலையில் கற்ற வரிகளை மீண்டும் சொல்லுங்கள்', en: '🌙 Evening Session: Repeat what you learned this morning' })}
              </p>
            </div>

            {/* Verse Display Card */}
            <div style={styles.verseCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, color: '#E65100', fontSize: '1.1rem' }}>
                  {t({ ta: `நாள் ${state.currentDay} — வரிகள்`, en: `Day ${state.currentDay} — Verses` })}
                </h3>
                <button onClick={startPlayback} style={styles.playBtn}>
                  {isPlaying ? '⏸️' : '▶️'} {lang === 'ta' ? 'கேளு' : 'Listen'}
                </button>
              </div>

              {/* Verses — Tamil */}
              <div style={styles.versesBlock}>
                {today.lines.map((line, i) => (
                  <div
                    key={i}
                    style={{
                      ...styles.verseLine,
                      ...(currentLineIndex === i ? styles.verseLineActive : {}),
                    }}
                  >
                    <div style={styles.tamilLine}>{line.tamil}</div>
                    <div style={styles.transLine}>{line.transliteration}</div>
                  </div>
                ))}
              </div>

              {/* Meaning */}
              <div style={styles.meaningBox}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#E65100', marginBottom: 4 }}>
                  {lang === 'ta' ? '📖 பொருள்:' : '📖 Meaning:'}
                </div>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#5D4037', lineHeight: 1.6, whiteSpace: 'pre-line' as const }}>
                  {t(today.meaning)}
                </p>
              </div>
            </div>

            {/* Recording Section */}
            <div style={styles.recordSection}>
              <h3 style={{ margin: '0 0 12px', color: '#E65100', fontSize: '1rem' }}>
                🎤 {t({ ta: 'உங்கள் ஒலிப்பதிவு', en: 'Your Recording' })}
              </h3>

              {recordingError && (
                <div style={{ ...styles.instructionCard, background: '#FBE9E7', color: '#BF360C', marginBottom: 12 }}>
                  {recordingError}
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const, justifyContent: 'center' }}>
                {!isRecording && !recordingBlob && (
                  <button onClick={startRecording} style={styles.recordBtn}>
                    🎙️ {t({ ta: 'பதிவு தொடங்கு', en: 'Start Recording' })}
                  </button>
                )}
                {isRecording && (
                  <button onClick={stopRecording} style={{ ...styles.recordBtn, background: '#E23D28' }}>
                    ⏹️ {t({ ta: 'நிறுத்து', en: 'Stop' })}
                    <span style={styles.recordingDot}>●</span>
                  </button>
                )}
                {recordingBlob && (
                  <>
                    <audio controls src={recordingUrl || undefined} style={{ borderRadius: 12, maxWidth: '100%' }} />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={reRecord} style={styles.reRecordBtn}>
                        🔄 {t({ ta: 'மீண்டும் பதிவு', en: 'Re-record' })}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={styles.actionRow}>
              {!isSessionDone ? (
                <button onClick={markSessionDone} style={styles.doneBtn}>
                  ✅ {session === 'morning'
                    ? t({ ta: 'காலை பாடம் முடிந்தது', en: 'Morning Lesson Done' })
                    : t({ ta: 'மாலை பாடம் முடிந்தது', en: 'Evening Lesson Done' })}
                </button>
              ) : (
                <div style={styles.completedBadge}>
                  🎉 {session === 'morning'
                    ? t({ ta: 'காலை பாடம் முடிந்தது!', en: 'Morning session completed!' })
                    : t({ ta: 'மாலை பாடம் முடிந்தது!', en: 'Evening session completed!' })}
                </div>
              )}
              <button onClick={shareWhatsApp} style={styles.whatsappBtn}>
                📲 {t({ ta: 'WhatsApp-ல் பகிர்', en: 'Share on WhatsApp' })}
              </button>
            </div>
          </>
        )}

        {/* PROGRESS TAB */}
        {tab === 'progress' && (
          <div style={styles.progressTab}>
            <h3 style={{ color: '#E65100', textAlign: 'center' as const }}>
              {t({ ta: '📊 உங்கள் கற்றல் முன்னேற்றம்', en: '📊 Your Learning Progress' })}
            </h3>
            <div style={styles.progressGrid}>
              {PROGRAM_SCHEDULE.map(day => {
                const isDone = state.completedDays.includes(day.day);
                const isCurrent = day.day === state.currentDay;
                const isFuture = day.day > state.currentDay;
                return (
                  <div
                    key={day.day}
                    style={{
                      ...styles.dayCell,
                      background: isDone ? '#4CAF50' : isCurrent ? '#FF6B35' : isFuture ? '#FFE0B2' : '#FFF8E1',
                      color: isDone || isCurrent ? '#fff' : '#795548',
                      border: isCurrent ? '3px solid #BF360C' : '2px solid transparent',
                      fontWeight: isCurrent ? 800 : 500,
                    }}
                    title={`${t(day.phaseName)} — ${day.phaseEmoji}`}
                  >
                    {isDone ? '✅' : day.day}
                  </div>
                );
              })}
            </div>
            <div style={styles.legendRow}>
              <span style={styles.legendItem}><span style={{ ...styles.legendDot, background: '#4CAF50' }} /> {lang === 'ta' ? 'முடிந்தது' : 'Completed'}</span>
              <span style={styles.legendItem}><span style={{ ...styles.legendDot, background: '#FF6B35' }} /> {lang === 'ta' ? 'இன்று' : 'Today'}</span>
              <span style={styles.legendItem}><span style={{ ...styles.legendDot, background: '#FFE0B2' }} /> {lang === 'ta' ? 'வரவிருக்கிறது' : 'Upcoming'}</span>
            </div>

            {/* Stats */}
            <div style={styles.statsGrid}>
              <div style={styles.statBox}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FF6B35' }}>{state.completedDays.length}</div>
                <div style={{ fontSize: '0.8rem', color: '#795548' }}>{lang === 'ta' ? 'நாட்கள் முடிந்தன' : 'Days Completed'}</div>
              </div>
              <div style={styles.statBox}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#4CAF50' }}>{state.streak}</div>
                <div style={{ fontSize: '0.8rem', color: '#795548' }}>{lang === 'ta' ? 'நாள் தொடர்' : 'Day Streak'}</div>
              </div>
              <div style={styles.statBox}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#9C27B0' }}>{state.recordings}</div>
                <div style={{ fontSize: '0.8rem', color: '#795548' }}>{lang === 'ta' ? 'ஒலிப்பதிவுகள்' : 'Recordings'}</div>
              </div>
              <div style={styles.statBox}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FFD700' }}>{state.badges.length}</div>
                <div style={{ fontSize: '0.8rem', color: '#795548' }}>{lang === 'ta' ? 'பேட்ஜ்கள்' : 'Badges'}</div>
              </div>
            </div>
          </div>
        )}

        {/* BADGES TAB */}
        {tab === 'badges' && (
          <div style={styles.badgesTab}>
            <h3 style={{ color: '#E65100', textAlign: 'center' as const, marginBottom: 20 }}>
              {t({ ta: '🏅 எனது பேட்ஜ்கள்', en: '🏅 My Badges' })}
            </h3>
            <div style={styles.badgesGrid}>
              {BADGES.map(badge => {
                const earned = state.badges.includes(badge.id);
                return (
                  <div
                    key={badge.id}
                    style={{
                      ...styles.badgeCard,
                      opacity: earned ? 1 : 0.4,
                      border: earned ? `3px solid ${badge.color}` : '3px solid #E0E0E0',
                      background: earned ? '#fff' : '#F5F5F5',
                    }}
                  >
                    <span style={{ fontSize: '2.5rem' }}>{badge.emoji}</span>
                    <div style={{ fontWeight: 700, color: earned ? badge.color : '#9E9E9E', fontSize: '0.9rem' }}>
                      {t(badge.name)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: earned ? '#5D4037' : '#BDBDBD', textAlign: 'center' as const }}>
                      {t(badge.description)}
                    </div>
                    {earned && <div style={styles.earnedTag}>✨ {lang === 'ta' ? 'பெற்றது!' : 'Earned!'}</div>}
                    {!earned && <div style={styles.lockedTag}>🔒 {lang === 'ta' ? 'பூட்டப்பட்டது' : 'Locked'}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ALL VERSES TAB */}
        {tab === 'all-verses' && (
          <div style={styles.allVersesTab}>
            <h3 style={{ color: '#E65100', textAlign: 'center' as const, marginBottom: 20 }}>
              {t({ ta: '📜 முழு விநாயகர் அகவல்', en: '📜 Complete Vinayagar Agaval' })}
            </h3>
            <div style={{ maxWidth: 600, margin: '0 auto' }}>
              {ALL_VERSES.map((verse, i) => {
                const dayNum = Math.floor(i / 4) + 1;
                const isLearned = state.completedDays.some(d => d >= dayNum);
                return (
                  <div key={i} style={{ marginBottom: 2 }}>
                    {i % 4 === 0 && (
                      <div style={styles.dayDivider}>
                        {lang === 'ta' ? `~ நாள் ${dayNum} ~` : `~ Day ${dayNum} ~`}
                        {isLearned && ' ✅'}
                      </div>
                    )}
                    <div style={{
                      ...styles.allVerseLine,
                      background: isLearned ? '#E8F5E9' : i < state.currentDay * 4 ? '#FFF8E1' : '#FAFAFA',
                    }}>
                      <span style={{ fontSize: '0.7rem', color: '#BDBDBD', minWidth: 24 }}>{i + 1}</span>
                      <div>
                        <div style={{ ...styles.tamilLine, fontSize: '1rem' }}>{verse.tamil}</div>
                        <div style={{ ...styles.transLine, fontSize: '0.8rem' }}>{verse.transliteration}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* EVENT TAB */}
        {tab === 'event' && (
          <div style={styles.eventTab}>
            <div style={{ textAlign: 'center' as const, fontSize: '4rem' }}>🏆</div>
            <h2 style={{ textAlign: 'center' as const, color: '#BF360C', whiteSpace: 'pre-line' as const }}>
              {t(GRAND_CHANTING_EVENT.title)}
            </h2>
            <p style={{ textAlign: 'center' as const, color: '#5D4037', lineHeight: 1.7, whiteSpace: 'pre-line' as const }}>
              {t(GRAND_CHANTING_EVENT.description)}
            </p>

            <div style={styles.eventCountdown}>
              <div style={{ fontSize: '3rem', fontWeight: 800, color: '#BF360C' }}>{daysUntilEvent}</div>
              <div style={{ fontSize: '1rem', color: '#E65100' }}>{lang === 'ta' ? 'நாட்கள் மீதம்' : 'days remaining'}</div>
            </div>

            <div style={{ textAlign: 'center' as const, margin: '16px 0', color: '#795548' }}>
              📅 {t(GRAND_CHANTING_EVENT.eventDateDisplay)}
            </div>

            <div style={{ textAlign: 'center' as const, padding: '20px', background: '#FFF3E0', borderRadius: 16, margin: '20px 0' }}>
              <h3 style={{ color: '#E65100', margin: '0 0 12px' }}>
                {t({ ta: '🌍 உலக சாதனை இலக்கு', en: '🌍 World Record Goal' })}
              </h3>
              <p style={{ color: '#5D4037', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-line' as const }}>
                {t(PROGRAM_INFO.worldRecord)}
              </p>
            </div>

            {!state.joinedGrandChanting ? (
              <button
                onClick={() => setState(prev => {
                  const updated = { ...prev, joinedGrandChanting: true };
                  updated.badges = checkBadges(updated);
                  return updated;
                })}
                style={styles.joinEventBtn}
              >
                🙏 {t({ ta: 'மகா ஒலிப்பில் இணையுங்கள்!', en: 'Join the Grand Chanting!' })}
              </button>
            ) : (
              <div style={styles.joinedBadge}>
                ✅ {t({ ta: 'நீங்கள் மகா ஒலிப்பில் இணைந்துள்ளீர்கள்!', en: 'You have joined the Grand Chanting!' })}
              </div>
            )}

            <div style={{ textAlign: 'center' as const, marginTop: 20 }}>
              <button onClick={shareWhatsApp} style={styles.whatsappBtn}>
                📲 {t({ ta: 'நண்பர்களை அழையுங்கள்', en: 'Invite Friends via WhatsApp' })}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom Nav ── */}
      <div style={styles.bottomNav}>
        <button onClick={() => navigate('/agaval')} style={styles.bottomNavBtn}>🏠</button>
        <button onClick={() => setTab('today')} style={styles.bottomNavBtn}>📖</button>
        <button onClick={() => setTab('badges')} style={styles.bottomNavBtn}>🏅</button>
        <button onClick={() => setTab('event')} style={styles.bottomNavBtn}>🏆</button>
      </div>
    </div>
  );
};

/* ── Styles ── */

const styles: Record<string, React.CSSProperties> = {
  page: {
    fontFamily: "'Segoe UI', 'Noto Sans Tamil', Tahoma, sans-serif",
    background: '#FFF8E1',
    minHeight: '100vh',
    paddingBottom: 70,
    color: '#3E2723',
  },

  // Header
  header: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    background: 'linear-gradient(135deg, #FF6B35, #FF9800)',
    color: '#fff',
    position: 'sticky' as const,
    top: 0,
    zIndex: 100,
  },
  backBtn: {
    background: 'rgba(255,255,255,0.2)',
    border: 'none',
    color: '#fff',
    fontSize: '1.2rem',
    width: 36,
    height: 36,
    borderRadius: '50%',
    cursor: 'pointer',
  },
  langMini: {
    display: 'flex',
    gap: 4,
  },
  langDot: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.5)',
    background: 'transparent',
    color: '#fff',
    fontSize: '0.7rem',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Progress
  progressSection: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    padding: '20px',
    background: '#fff',
  },
  progressRing: {
    position: 'relative' as const,
    width: 100,
    height: 100,
  },
  progressText: {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    textAlign: 'center' as const,
  },

  // Tabs
  tabBar: {
    display: 'flex',
    overflowX: 'auto' as const,
    background: '#fff',
    borderBottom: '2px solid #FFE0B2',
    padding: '0 8px',
  },
  tabBtn: {
    flex: '0 0 auto',
    padding: '10px 14px',
    border: 'none',
    background: 'transparent',
    color: '#795548',
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer',
    borderBottom: '3px solid transparent',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap' as const,
  },
  tabBtnActive: {
    color: '#FF6B35',
    borderBottom: '3px solid #FF6B35',
  },

  // Content
  content: {
    padding: '16px',
    maxWidth: 700,
    margin: '0 auto',
  },

  // Session Toggle
  sessionToggle: {
    display: 'flex',
    gap: 8,
    marginBottom: 16,
  },
  sessionBtn: {
    flex: 1,
    padding: '12px',
    border: '2px solid #FFCC80',
    borderRadius: 12,
    background: '#fff',
    color: '#795548',
    fontSize: '0.95rem',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  sessionBtnActive: {
    background: '#FF6B35',
    color: '#fff',
    border: '2px solid #FF6B35',
  },

  // Instruction
  instructionCard: {
    padding: '12px 16px',
    background: '#FFF3E0',
    borderRadius: 12,
    fontSize: '0.9rem',
    color: '#E65100',
    marginBottom: 16,
    textAlign: 'center' as const,
  },

  // Verse Card
  verseCard: {
    background: '#fff',
    borderRadius: 20,
    padding: '20px',
    boxShadow: '0 4px 16px rgba(230,81,0,0.1)',
    border: '2px solid #FFCC80',
    marginBottom: 16,
  },
  playBtn: {
    padding: '8px 16px',
    background: '#FF6B35',
    color: '#fff',
    border: 'none',
    borderRadius: 20,
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  versesBlock: {
    marginBottom: 16,
  },
  verseLine: {
    padding: '10px 14px',
    borderRadius: 10,
    marginBottom: 6,
    transition: 'all 0.3s',
    border: '2px solid transparent',
  },
  verseLineActive: {
    background: '#FFF3E0',
    border: '2px solid #FF6B35',
    borderRadius: 10,
  },
  tamilLine: {
    fontSize: '1.15rem',
    fontWeight: 600,
    color: '#3E2723',
    lineHeight: 1.6,
  },
  transLine: {
    fontSize: '0.85rem',
    color: '#8D6E63',
    fontStyle: 'italic' as const,
    lineHeight: 1.4,
  },
  meaningBox: {
    background: '#FFF8E1',
    borderRadius: 12,
    padding: '12px 16px',
    borderLeft: '4px solid #FFD54F',
  },

  // Recording
  recordSection: {
    background: '#fff',
    borderRadius: 20,
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    marginBottom: 16,
    textAlign: 'center' as const,
  },
  recordBtn: {
    padding: '14px 28px',
    background: '#4CAF50',
    color: '#fff',
    border: 'none',
    borderRadius: 28,
    fontSize: '1rem',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  recordingDot: {
    color: '#fff',
    animation: 'blink 1s infinite',
    fontSize: '0.8rem',
  },
  reRecordBtn: {
    padding: '10px 20px',
    background: '#FF9800',
    color: '#fff',
    border: 'none',
    borderRadius: 20,
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },

  // Actions
  actionRow: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 12,
    alignItems: 'center',
  },
  doneBtn: {
    width: '100%',
    padding: '14px 24px',
    background: 'linear-gradient(135deg, #4CAF50, #66BB6A)',
    color: '#fff',
    border: 'none',
    borderRadius: 16,
    fontSize: '1.05rem',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  completedBadge: {
    width: '100%',
    padding: '14px 24px',
    background: '#E8F5E9',
    color: '#2E7D32',
    borderRadius: 16,
    textAlign: 'center' as const,
    fontSize: '1rem',
    fontWeight: 700,
    border: '2px solid #A5D6A7',
  },
  whatsappBtn: {
    padding: '12px 24px',
    background: '#25D366',
    color: '#fff',
    border: 'none',
    borderRadius: 16,
    fontSize: '0.95rem',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },

  // Progress Tab
  progressTab: {
    padding: '8px 0',
  },
  progressGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: 6,
    maxWidth: 400,
    margin: '0 auto 20px',
  },
  dayCell: {
    width: '100%',
    aspectRatio: '1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    fontSize: '0.8rem',
  },
  legendRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 20,
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: '0.8rem',
    color: '#795548',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 4,
    display: 'inline-block',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 12,
  },
  statBox: {
    background: '#fff',
    borderRadius: 16,
    padding: '16px',
    textAlign: 'center' as const,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },

  // Badges Tab
  badgesTab: {
    padding: '8px 0',
  },
  badgesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: 12,
  },
  badgeCard: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 6,
    padding: '16px 12px',
    borderRadius: 16,
    textAlign: 'center' as const,
    transition: 'transform 0.2s',
  },
  earnedTag: {
    fontSize: '0.7rem',
    fontWeight: 700,
    color: '#4CAF50',
    marginTop: 4,
  },
  lockedTag: {
    fontSize: '0.7rem',
    color: '#BDBDBD',
    marginTop: 4,
  },

  // All Verses Tab
  allVersesTab: {
    padding: '8px 0',
  },
  dayDivider: {
    textAlign: 'center' as const,
    fontSize: '0.8rem',
    fontWeight: 700,
    color: '#FF6B35',
    padding: '8px 0 4px',
    margin: '8px 0 4px',
    borderTop: '1px solid #FFCC80',
  },
  allVerseLine: {
    display: 'flex',
    gap: 8,
    padding: '6px 10px',
    borderRadius: 6,
    marginBottom: 2,
  },

  // Event Tab
  eventTab: {
    padding: '8px 0',
  },
  eventCountdown: {
    textAlign: 'center' as const,
    padding: '24px',
    background: 'linear-gradient(135deg, #FFF3E0, #FFE0B2)',
    borderRadius: 20,
    margin: '20px 0',
  },
  joinEventBtn: {
    display: 'block',
    width: '100%',
    padding: '16px 24px',
    background: 'linear-gradient(135deg, #BF360C, #E65100)',
    color: '#fff',
    border: 'none',
    borderRadius: 16,
    fontSize: '1.1rem',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    boxShadow: '0 4px 16px rgba(191,54,12,0.3)',
  },
  joinedBadge: {
    padding: '16px 24px',
    background: '#E8F5E9',
    color: '#2E7D32',
    borderRadius: 16,
    textAlign: 'center' as const,
    fontSize: '1rem',
    fontWeight: 700,
    border: '2px solid #A5D6A7',
  },

  // Bottom Nav
  bottomNav: {
    position: 'fixed' as const,
    bottom: 0,
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'space-around',
    background: '#fff',
    borderTop: '2px solid #FFE0B2',
    padding: '8px 0',
    zIndex: 100,
  },
  bottomNavBtn: {
    background: 'none',
    border: 'none',
    fontSize: '1.4rem',
    cursor: 'pointer',
    padding: '4px 12px',
  },
};

export default VinayagarAgavalDashboard;
