/**
 * DMIT FINGERPRINT CAPTURE — Browser-Based Guided Capture
 * 
 * Uses phone rear camera to capture fingerprints one by one
 * with an overlay guide circle and step-by-step instructions.
 * Falls back to file upload if camera access is denied.
 * 
 * Route: /dmit/capture
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { db, storage } from '../firebase';
import { ref, uploadString } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/* ── Types ── */

interface FingerInfo {
  id: string;
  label: { en: string; ta: string };
  hand: 'right' | 'left';
  emoji: string;
}

interface CapturedFinger {
  id: string;
  imageDataUrl: string;
  timestamp: number;
}

/* ── Finger Sequence (Standard DMIT order) ── */

const FINGERS: FingerInfo[] = [
  { id: 'R1', label: { en: 'Right Thumb', ta: 'வலது கட்டை விரல்' }, hand: 'right', emoji: '👍' },
  { id: 'R2', label: { en: 'Right Index', ta: 'வலது ஆள்காட்டி விரல்' }, hand: 'right', emoji: '👆' },
  { id: 'R3', label: { en: 'Right Middle', ta: 'வலது நடு விரல்' }, hand: 'right', emoji: '🖕' },
  { id: 'R4', label: { en: 'Right Ring', ta: 'வலது மோதிர விரல்' }, hand: 'right', emoji: '💍' },
  { id: 'R5', label: { en: 'Right Pinky', ta: 'வலது சுண்டு விரல்' }, hand: 'right', emoji: '🤙' },
  { id: 'L1', label: { en: 'Left Thumb', ta: 'இடது கட்டை விரல்' }, hand: 'left', emoji: '👍' },
  { id: 'L2', label: { en: 'Left Index', ta: 'இடது ஆள்காட்டி விரல்' }, hand: 'left', emoji: '👆' },
  { id: 'L3', label: { en: 'Left Middle', ta: 'இடது நடு விரல்' }, hand: 'left', emoji: '🖕' },
  { id: 'L4', label: { en: 'Left Ring', ta: 'இடது மோதிர விரல்' }, hand: 'left', emoji: '💍' },
  { id: 'L5', label: { en: 'Left Pinky', ta: 'இடது சுண்டு விரல்' }, hand: 'left', emoji: '🤙' },
];

/* ── Component ── */

const DMITCapture: React.FC = () => {
  const [lang, setLang] = useState<'en' | 'ta'>('en');
  const [step, setStep] = useState<'intro' | 'capture' | 'review'>('intro');
  const [currentFingerIdx, setCurrentFingerIdx] = useState(0);
  const [captures, setCaptures] = useState<CapturedFinger[]>([]);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [flash, setFlash] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = (obj: { en: string; ta: string }) => obj[lang];
  const currentFinger = FINGERS[currentFingerIdx];

  /* ── Camera Controls ── */

  const startCamera = useCallback(async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);

      // Try enabling torch/flash
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities?.() as MediaTrackCapabilities & { torch?: boolean };
      if (capabilities?.torch) {
        setFlash(true);
      }
    } catch {
      setCameraError(
        lang === 'ta'
          ? 'கேமரா அனுமதி தேவை. உலாவி அமைப்புகளை சரிபார்க்கவும்.'
          : 'Camera permission required. Please allow camera access and try again.'
      );
    }
  }, [lang]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const toggleFlash = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    try {
      await track.applyConstraints({
        advanced: [{ torch: !flash } as MediaTrackConstraintSet & { torch: boolean }],
      } as MediaTrackConstraints);
      setFlash(!flash);
    } catch { /* torch not supported */ }
  };

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  /* ── Capture Photo ── */

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Capture center crop (square) for fingerprint area
    const size = Math.min(video.videoWidth, video.videoHeight);
    const sx = (video.videoWidth - size) / 2;
    const sy = (video.videoHeight - size) / 2;

    canvas.width = 800;
    canvas.height = 800;
    ctx.drawImage(video, sx, sy, size, size, 0, 0, 800, 800);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    const newCapture: CapturedFinger = {
      id: currentFinger.id,
      imageDataUrl: dataUrl,
      timestamp: Date.now(),
    };

    setCaptures(prev => {
      const filtered = prev.filter(c => c.id !== currentFinger.id);
      return [...filtered, newCapture];
    });

    // Auto-advance to next finger
    if (currentFingerIdx < FINGERS.length - 1) {
      setCurrentFingerIdx(currentFingerIdx + 1);
    } else {
      stopCamera();
      setStep('review');
    }
  };

  /* ── File Upload Fallback ── */

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const newCapture: CapturedFinger = {
        id: currentFinger.id,
        imageDataUrl: dataUrl,
        timestamp: Date.now(),
      };
      setCaptures(prev => {
        const filtered = prev.filter(c => c.id !== currentFinger.id);
        return [...filtered, newCapture];
      });

      if (currentFingerIdx < FINGERS.length - 1) {
        setCurrentFingerIdx(currentFingerIdx + 1);
      } else {
        setStep('review');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  /* ── Retake a specific finger ── */

  const retakeFinger = (idx: number) => {
    setCurrentFingerIdx(idx);
    setCaptures(prev => prev.filter(c => c.id !== FINGERS[idx].id));
    setStep('capture');
    if (!cameraActive) startCamera();
  };

  /* ── Submit ── */

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const [errorDetail, setErrorDetail] = useState('');

  const handleSubmit = async () => {
    if (captures.length === 0 || isSubmitting) return;
    setIsSubmitting(true);
    setSubmitStatus('uploading');

    try {
      const submissionId = `DMIT_${Date.now()}_${customerPhone.replace(/\D/g, '')}`;
      const storagePaths: Record<string, string> = {};

      // Upload each fingerprint image to Firebase Storage
      for (const cap of captures) {
        const path = `dmit/${submissionId}/${cap.id}.jpg`;
        const storageRef = ref(storage, path);
        await uploadString(storageRef, cap.imageDataUrl, 'data_url', {
          contentType: 'image/jpeg',
        });
        storagePaths[cap.id] = path;
      }

      // Save metadata to Firestore (store paths, not URLs — admin will access via console)
      await addDoc(collection(db, 'dmit_submissions'), {
        submissionId,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        fingerCount: captures.length,
        fingerIds: captures.map(c => c.id),
        storagePaths: storagePaths,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      setSubmitStatus('done');
    } catch (err: any) {
      console.error('DMIT upload error:', err);
      const msg = err?.message || err?.code || String(err);
      setSubmitStatus('error');
      setErrorDetail(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Styles ── */

  const langBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 16px',
    borderRadius: 20,
    border: 'none',
    background: active ? '#fff' : 'rgba(255,255,255,0.2)',
    color: active ? '#1a237e' : '#fff',
    fontWeight: 700,
    fontSize: '0.8rem',
    cursor: 'pointer',
  });

  const fingerDotStyle = (captured: boolean, active: boolean): React.CSSProperties => ({
    width: 32,
    height: 32,
    borderRadius: '50%',
    border: active ? '3px solid #1a237e' : '2px solid #ccc',
    background: captured ? '#4CAF50' : active ? '#E3F2FD' : '#f5f5f5',
    color: captured ? '#fff' : '#999',
    fontSize: '0.7rem',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  });

  const stepDotStyle = (active: boolean): React.CSSProperties => ({
    width: active ? 24 : 8,
    height: 8,
    borderRadius: 4,
    background: active ? '#fff' : 'rgba(255,255,255,0.4)',
    transition: 'all 0.3s',
  });

  const styles: Record<string, React.CSSProperties> = {
    page: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 50%, #01579b 100%)',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    },
    container: {
      maxWidth: 480,
      margin: '0 auto',
      padding: '16px',
    },
    header: {
      textAlign: 'center',
      padding: '20px 0 12px',
      color: '#fff',
    },
    logo: {
      fontSize: '2.5rem',
      marginBottom: 4,
    },
    title: {
      fontSize: '1.4rem',
      fontWeight: 800,
      margin: '4px 0',
    },
    subtitle: {
      fontSize: '0.85rem',
      opacity: 0.85,
    },
    langToggle: {
      display: 'flex',
      justifyContent: 'center',
      gap: 8,
      marginTop: 12,
    },
    card: {
      background: '#fff',
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    },
    input: {
      width: '100%',
      padding: '12px 14px',
      borderRadius: 10,
      border: '2px solid #e0e0e0',
      fontSize: '1rem',
      marginBottom: 12,
      boxSizing: 'border-box' as const,
      outline: 'none',
    },
    primaryBtn: {
      width: '100%',
      padding: '14px',
      borderRadius: 12,
      border: 'none',
      background: 'linear-gradient(135deg, #1a237e, #0d47a1)',
      color: '#fff',
      fontSize: '1.05rem',
      fontWeight: 700,
      cursor: 'pointer',
      marginTop: 8,
    },
    fingerIndicator: {
      textAlign: 'center',
      marginBottom: 16,
    },
    fingerName: {
      fontSize: '1.2rem',
      fontWeight: 800,
      color: '#1a237e',
      marginBottom: 4,
    },
    fingerCount: {
      fontSize: '0.85rem',
      color: '#666',
    },
    cameraContainer: {
      position: 'relative' as const,
      width: '100%',
      paddingBottom: '100%',
      background: '#000',
      borderRadius: 16,
      overflow: 'hidden',
      marginBottom: 16,
    },
    video: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover' as const,
    },
    overlay: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      pointerEvents: 'none' as const,
    },
    guideCircle: {
      width: '60%',
      height: '60%',
      border: '3px dashed rgba(255,255,255,0.8)',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    guideText: {
      color: 'rgba(255,255,255,0.9)',
      fontSize: '0.75rem',
      textAlign: 'center' as const,
      textShadow: '0 1px 3px rgba(0,0,0,0.8)',
      fontWeight: 600,
    },
    captureBtn: {
      width: 72,
      height: 72,
      borderRadius: '50%',
      border: '4px solid #1a237e',
      background: '#fff',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto',
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    },
    captureBtnInner: {
      width: 56,
      height: 56,
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #1a237e, #0d47a1)',
    },
    controlRow: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 20,
      marginBottom: 16,
    },
    iconBtn: {
      width: 44,
      height: 44,
      borderRadius: '50%',
      border: 'none',
      background: 'rgba(26,35,126,0.1)',
      fontSize: '1.2rem',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    handMap: {
      display: 'flex',
      justifyContent: 'center',
      gap: 6,
      marginBottom: 16,
    },
    thumbGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(5, 1fr)',
      gap: 8,
      marginBottom: 16,
    },
    reviewCard: {
      border: '2px solid #e0e0e0',
      borderRadius: 12,
      overflow: 'hidden',
      textAlign: 'center' as const,
    },
    reviewImg: {
      width: '100%',
      aspectRatio: '1',
      objectFit: 'cover' as const,
    },
    reviewLabel: {
      padding: '6px 4px',
      fontSize: '0.7rem',
      fontWeight: 700,
      color: '#1a237e',
      background: '#E8EAF6',
    },
    tipBox: {
      background: '#FFF8E1',
      borderRadius: 12,
      padding: '12px 16px',
      marginBottom: 16,
      border: '1px solid #FFE082',
    },
    tipTitle: {
      fontWeight: 700,
      fontSize: '0.85rem',
      color: '#F57F17',
      marginBottom: 6,
    },
    tipText: {
      fontSize: '0.8rem',
      color: '#5D4037',
      lineHeight: 1.6,
      margin: 0,
    },
    errorBox: {
      background: '#FBE9E7',
      borderRadius: 12,
      padding: '12px 16px',
      marginBottom: 16,
      color: '#BF360C',
      textAlign: 'center' as const,
      fontSize: '0.9rem',
    },
    stepDots: {
      display: 'flex',
      justifyContent: 'center',
      gap: 8,
      marginBottom: 20,
    },
  };

  /* ── Render: Intro Step ── */

  const renderIntro = () => (
    <>
      <div style={styles.card}>
        <h2 style={{ margin: '0 0 16px', color: '#1a237e', fontSize: '1.1rem' }}>
          {t({ en: '📋 Customer Details', ta: '📋 வாடிக்கையாளர் விவரங்கள்' })}
        </h2>
        <input
          style={styles.input}
          placeholder={t({ en: 'Full Name *', ta: 'முழு பெயர் *' })}
          value={customerName}
          onChange={e => setCustomerName(e.target.value)}
        />
        <input
          style={styles.input}
          placeholder={t({ en: 'Phone / WhatsApp *', ta: 'தொலைபேசி / வாட்ஸ்அப் *' })}
          type="tel"
          value={customerPhone}
          onChange={e => setCustomerPhone(e.target.value)}
        />
      </div>

      <div style={styles.card}>
        <h2 style={{ margin: '0 0 12px', color: '#1a237e', fontSize: '1.1rem' }}>
          {t({ en: '📸 How It Works', ta: '📸 எப்படி செயல்படுகிறது' })}
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { emoji: '🔦', en: 'Use a bright side light (desk lamp or phone flash)', ta: 'பக்க ஒளி பயன்படுத்தவும் (டெஸ்க் லேம்ப் அல்லது ஃப்ளாஷ்)' },
            { emoji: '🖐️', en: 'Place fingertip inside the guide circle', ta: 'விரல் நுனியை வழிகாட்டி வட்டத்தில் வைக்கவும்' },
            { emoji: '📷', en: 'We\'ll capture all 10 fingers one by one', ta: '10 விரல்களையும் ஒவ்வொன்றாக படம் பிடிப்போம்' },
            { emoji: '✅', en: 'Review & submit — report in 24 hours!', ta: 'சரிபார்த்து சமர்ப்பிக்கவும் — 24 மணி நேரத்தில் அறிக்கை!' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>{item.emoji}</span>
              <span style={{ fontSize: '0.9rem', color: '#333', lineHeight: 1.5 }}>{t(item)}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.tipBox}>
        <div style={styles.tipTitle}>
          💡 {t({ en: 'Tip for Best Results', ta: 'சிறந்த முடிவுகளுக்கு குறிப்பு' })}
        </div>
        <p style={styles.tipText}>
          {t({
            en: 'Clean & dry your fingers. Use a bright light from the SIDE (not above) — this makes fingerprint ridges clearly visible to the camera.',
            ta: 'விரல்களை சுத்தமாகவும் உலர்வாகவும் வைக்கவும். பக்கத்திலிருந்து (மேலிருந்து அல்ல) ஒரு பிரகாசமான ஒளியை பயன்படுத்தவும் — இது விரல் ரேகை நெளிவுகளை கேமராவுக்கு தெளிவாகக் காட்டும்.',
          })}
        </p>
      </div>

      <button
        style={{
          ...styles.primaryBtn,
          opacity: customerName.trim() && customerPhone.trim() ? 1 : 0.5,
        }}
        disabled={!customerName.trim() || !customerPhone.trim()}
        onClick={() => { setStep('capture'); startCamera(); }}
      >
        {t({ en: '🖐️ Start Fingerprint Capture', ta: '🖐️ விரல் ரேகை பதிவு தொடங்கு' })}
      </button>
    </>
  );

  /* ── Render: Capture Step ── */

  const renderCapture = () => {
    const captured = captures.find(c => c.id === currentFinger.id);

    return (
      <>
        {/* Finger progress dots */}
        <div style={styles.handMap}>
          {FINGERS.map((f, i) => {
            const isCaptured = captures.some(c => c.id === f.id);
            const isActive = i === currentFingerIdx;
            return (
              <div
                key={f.id}
                style={fingerDotStyle(isCaptured, isActive)}
                onClick={() => { if (isCaptured) retakeFinger(i); }}
                title={t(f.label)}
              >
                {isCaptured ? '✓' : i + 1}
              </div>
            );
          })}
        </div>

        <div style={styles.card}>
          {/* Current finger indicator */}
          <div style={styles.fingerIndicator}>
            <div style={{ fontSize: '2rem', marginBottom: 4 }}>{currentFinger.emoji}</div>
            <div style={styles.fingerName}>{t(currentFinger.label)}</div>
            <div style={styles.fingerCount}>
              {t({ en: `Finger ${currentFingerIdx + 1} of 10`, ta: `விரல் ${currentFingerIdx + 1} / 10` })}
            </div>
          </div>

          {cameraError && (
            <div style={styles.errorBox}>
              {cameraError}
              <br />
              <button
                style={{ ...styles.iconBtn, margin: '10px auto 0', background: '#FBE9E7', fontSize: '0.85rem', width: 'auto', padding: '8px 16px', borderRadius: 8 }}
                onClick={() => fileInputRef.current?.click()}
              >
                📁 {t({ en: 'Upload Photo Instead', ta: 'புகைப்படத்தை பதிவேற்றவும்' })}
              </button>
            </div>
          )}

          {/* Camera viewfinder with capture button overlaid */}
          {!cameraError && (
            <>
              <div style={{ ...styles.cameraContainer, paddingBottom: '75%' }}>
                <video
                  ref={videoRef}
                  style={styles.video}
                  autoPlay
                  playsInline
                  muted
                />
                <div style={styles.overlay}>
                  <div style={{ ...styles.guideCircle, width: '50%', height: '70%' }}>
                    <div style={styles.guideText}>
                      {t({ en: 'Place fingertip here', ta: 'விரல் நுனியை இங்கே வைக்கவும்' })}
                    </div>
                  </div>
                </div>
                {/* Capture button overlaid at bottom of camera */}
                <div style={{
                  position: 'absolute', bottom: 12, left: 0, right: 0,
                  display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20,
                  zIndex: 10,
                }}>
                  <button style={{ ...styles.iconBtn, background: 'rgba(255,255,255,0.85)' }} onClick={toggleFlash} title="Toggle flash">
                    {flash ? '🔦' : '💡'}
                  </button>
                  <button style={{ ...styles.captureBtn, boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }} onClick={capturePhoto} title="Capture">
                    <div style={styles.captureBtnInner} />
                  </button>
                  <button
                    style={{ ...styles.iconBtn, background: 'rgba(255,255,255,0.85)' }}
                    onClick={() => fileInputRef.current?.click()}
                    title="Upload photo"
                  >
                    📁
                  </button>
                </div>
              </div>

              {/* Label below camera */}
              <div style={{ textAlign: 'center', margin: '8px 0 4px', color: '#1a237e', fontWeight: 700, fontSize: '0.9rem' }}>
                👆 {t({ en: 'Tap the round button to capture', ta: 'படம் பிடிக்க வட்ட பொத்தானை தட்டவும்' })}
              </div>
            </>
          )}

          {/* Preview of just-captured finger */}
          {captured && (
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <img
                src={captured.imageDataUrl}
                alt={t(currentFinger.label)}
                style={{ width: 100, height: 100, borderRadius: 12, objectFit: 'cover', border: '3px solid #4CAF50' }}
              />
              <div style={{ fontSize: '0.8rem', color: '#4CAF50', fontWeight: 700, marginTop: 4 }}>
                ✓ {t({ en: 'Captured!', ta: 'படம் பிடிக்கப்பட்டது!' })}
              </div>
            </div>
          )}

          {/* Tip reminder */}
          <div style={{ ...styles.tipBox, marginTop: 12 }}>
            <p style={{ ...styles.tipText, textAlign: 'center' }}>
              {t({
                en: '💡 Hold finger 2 inches from camera. Use side lighting for best ridge visibility.',
                ta: '💡 கேமராவிலிருந்து 2 அங்குலம் தூரத்தில் விரலை வைக்கவும். சிறந்த ரேகை தெரிவுக்கு பக்க ஒளி பயன்படுத்தவும்.',
              })}
            </p>
          </div>

          {/* Navigation */}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button
              style={{ ...styles.primaryBtn, flex: 1, background: '#f5f5f5', color: '#333', marginTop: 0 }}
              onClick={() => {
                if (currentFingerIdx > 0) setCurrentFingerIdx(currentFingerIdx - 1);
              }}
              disabled={currentFingerIdx === 0}
            >
              ← {t({ en: 'Previous', ta: 'முந்தையது' })}
            </button>

            {currentFingerIdx < FINGERS.length - 1 ? (
              <button
                style={{ ...styles.primaryBtn, flex: 1, marginTop: 0 }}
                onClick={() => setCurrentFingerIdx(currentFingerIdx + 1)}
              >
                {t({ en: 'Skip', ta: 'தவிர்' })} →
              </button>
            ) : (
              <button
                style={{ ...styles.primaryBtn, flex: 1, marginTop: 0, background: captures.length >= 10 ? 'linear-gradient(135deg, #2E7D32, #4CAF50)' : undefined }}
                onClick={() => { stopCamera(); setStep('review'); }}
              >
                {t({ en: 'Review All', ta: 'அனைத்தையும் பார்' })} ✓
              </button>
            )}
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />

        {/* Hidden canvas for photo capture */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </>
    );
  };

  /* ── Render: Review Step ── */

  const renderReview = () => (
    <>
      <div style={styles.card}>
        <h2 style={{ margin: '0 0 4px', color: '#1a237e', fontSize: '1.1rem', textAlign: 'center' }}>
          {t({ en: '✅ Review Fingerprints', ta: '✅ விரல் ரேகைகளை சரிபார்க்கவும்' })}
        </h2>
        <p style={{ textAlign: 'center', color: '#666', fontSize: '0.85rem', marginBottom: 16 }}>
          {t({
            en: `${captures.length} of 10 captured. Tap any image to retake.`,
            ta: `10 இல் ${captures.length} படம் பிடிக்கப்பட்டது. மறுபடியும் எடுக்க படத்தை தட்டவும்.`,
          })}
        </p>

        {/* Right Hand */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#666', marginBottom: 8, textAlign: 'center' }}>
            🤚 {t({ en: 'Right Hand', ta: 'வலது கை' })}
          </div>
          <div style={styles.thumbGrid}>
            {FINGERS.filter(f => f.hand === 'right').map((f, i) => {
              const cap = captures.find(c => c.id === f.id);
              return (
                <div key={f.id} style={styles.reviewCard} onClick={() => retakeFinger(i)}>
                  {cap ? (
                    <img src={cap.imageDataUrl} alt={t(f.label)} style={styles.reviewImg} />
                  ) : (
                    <div style={{ ...styles.reviewImg, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', aspectRatio: '1' }}>
                      <span style={{ fontSize: '1.5rem', opacity: 0.3 }}>?</span>
                    </div>
                  )}
                  <div style={styles.reviewLabel}>{t(f.label).split(' ').pop()}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Left Hand */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#666', marginBottom: 8, textAlign: 'center' }}>
            🖐️ {t({ en: 'Left Hand', ta: 'இடது கை' })}
          </div>
          <div style={styles.thumbGrid}>
            {FINGERS.filter(f => f.hand === 'left').map((f, i) => {
              const cap = captures.find(c => c.id === f.id);
              const globalIdx = i + 5;
              return (
                <div key={f.id} style={styles.reviewCard} onClick={() => retakeFinger(globalIdx)}>
                  {cap ? (
                    <img src={cap.imageDataUrl} alt={t(f.label)} style={styles.reviewImg} />
                  ) : (
                    <div style={{ ...styles.reviewImg, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', aspectRatio: '1' }}>
                      <span style={{ fontSize: '1.5rem', opacity: 0.3 }}>?</span>
                    </div>
                  )}
                  <div style={styles.reviewLabel}>{t(f.label).split(' ').pop()}</div>
                </div>
              );
            })}
          </div>
        </div>

        {captures.length < 10 && (
          <div style={{ ...styles.tipBox, textAlign: 'center' }}>
            <p style={styles.tipText}>
              {t({
                en: `⚠️ ${10 - captures.length} finger(s) missing. Tap "?" boxes to capture them.`,
                ta: `⚠️ ${10 - captures.length} விரல்(கள்) இல்லை. அவற்றை படம் பிடிக்க "?" பெட்டிகளை தட்டவும்.`,
              })}
            </p>
          </div>
        )}

        {submitStatus === 'done' ? (
          <div style={{ ...styles.tipBox, background: '#E8F5E9', border: '1px solid #A5D6A7', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>✅</div>
            <div style={{ fontWeight: 700, color: '#2E7D32', fontSize: '1rem', marginBottom: 4 }}>
              {t({ en: 'Fingerprints submitted successfully!', ta: 'விரல் ரேகைகள் வெற்றிகரமாக சமர்ப்பிக்கப்பட்டன!' })}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#555' }}>
              {t({ en: 'Your DMIT report will be ready within 24 hours.', ta: 'உங்கள் DMIT அறிக்கை 24 மணி நேரத்தில் தயாராகும்.' })}
            </div>
          </div>
        ) : submitStatus === 'error' ? (
          <div style={{ ...styles.errorBox, marginBottom: 12 }}>
            {t({ en: 'Upload failed. Please check your connection and try again.', ta: 'பதிவேற்றம் தோல்வியடைந்தது. இணைப்பை சரிபார்த்து மீண்டும் முயற்சிக்கவும்.' })}
            {errorDetail && <div style={{ fontSize: '0.75rem', marginTop: 8, wordBreak: 'break-all' }}>Error: {errorDetail}</div>}
          </div>
        ) : null}

        {submitStatus !== 'done' && (
          <button
            style={{
              ...styles.primaryBtn,
              background: isSubmitting ? '#9E9E9E' : captures.length >= 10 ? 'linear-gradient(135deg, #2E7D32, #4CAF50)' : 'linear-gradient(135deg, #1a237e, #0d47a1)',
              opacity: isSubmitting ? 0.7 : 1,
            }}
            onClick={handleSubmit}
            disabled={captures.length === 0 || isSubmitting}
          >
            {isSubmitting
              ? t({ en: '⏳ Uploading...', ta: '⏳ பதிவேற்றுகிறது...' })
              : captures.length >= 10
                ? t({ en: '🚀 Submit All Fingerprints', ta: '🚀 அனைத்து விரல் ரேகைகளையும் சமர்ப்பிக்கவும்' })
                : t({ en: `Submit ${captures.length} Fingerprints`, ta: `${captures.length} விரல் ரேகைகளை சமர்ப்பிக்கவும்` })
            }
          </button>
        )}

        <button
          style={{ ...styles.primaryBtn, background: '#f5f5f5', color: '#333' }}
          onClick={() => { setStep('capture'); startCamera(); }}
        >
          {t({ en: '← Back to Capture', ta: '← படம் பிடிக்கப் போகவும்' })}
        </button>
      </div>
    </>
  );

  /* ── Main Render ── */

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logo}>🧠</div>
          <div style={styles.title}>
            {t({ en: 'DMIT Fingerprint Scan', ta: 'DMIT விரல் ரேகை ஸ்கேன்' })}
          </div>
          <div style={styles.subtitle}>
            {t({ en: 'Srichakra Academy — Dermatoglyphics Multiple Intelligence Test', ta: 'ஸ்ரீசக்ரா அகாடமி — டெர்மட்டோகிளிஃபிக்ஸ் மல்டிபிள் இன்டெலிஜென்ஸ் டெஸ்ட்' })}
          </div>

          {/* Language toggle */}
          <div style={styles.langToggle}>
            <button style={langBtnStyle(lang === 'en')} onClick={() => setLang('en')}>English</button>
            <button style={langBtnStyle(lang === 'ta')} onClick={() => setLang('ta')}>தமிழ்</button>
          </div>
        </div>

        {/* Step indicators */}
        <div style={styles.stepDots}>
          {['intro', 'capture', 'review'].map(s => (
            <div key={s} style={stepDotStyle(s === step)} />
          ))}
        </div>

        {/* Step content */}
        {step === 'intro' && renderIntro()}
        {step === 'capture' && renderCapture()}
        {step === 'review' && renderReview()}

        {/* Footer */}
        <div style={{ textAlign: 'center', padding: '20px 0', color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
          © 2026 Srichakra Academy | DMIT Assessment
        </div>
      </div>
    </div>
  );
};

export default DMITCapture;
