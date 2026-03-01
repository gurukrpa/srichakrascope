/**
 * Auth Context - Provides authentication state across the app
 * 
 * Handles: login, register, logout, auth state persistence, access status
 * 
 * Access Status Flow:
 *   - Individual students register → accessStatus = 'pending'
 *   - Pay via Razorpay → accessStatus = 'paid'
 *   - Admin approves (school/GPay) → accessStatus = 'approved'
 *   - Only 'paid' or 'approved' can take the assessment
 */

import React, { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  type User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';

/** Access status values */
export type AccessStatus = 'pending' | 'paid' | 'approved' | 'rejected' | null;

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  isAdmin: boolean;
  accessStatus: AccessStatus;
  accessLoading: boolean;
  register: (email: string, password: string, name: string, phone: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshAccessStatus: () => Promise<void>;
  hasAssessmentAccess: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

/** Admin email addresses — hardcoded for simplicity */
const ADMIN_EMAILS = [
  'admin@srichakraacademy.org',
  // Add more admin emails as needed
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [accessStatus, setAccessStatus] = useState<AccessStatus>(null);
  const [accessLoading, setAccessLoading] = useState(true);

  // Derived: does the user have assessment access?
  const hasAssessmentAccess = accessStatus === 'paid' || accessStatus === 'approved' || isAdmin;

  // Fetch access status from Firestore
  const refreshAccessStatus = useCallback(async () => {
    if (!currentUser) {
      setAccessStatus(null);
      setAccessLoading(false);
      return;
    }
    try {
      const studentDoc = await getDoc(doc(db, 'students', currentUser.uid));
      if (studentDoc.exists()) {
        const data = studentDoc.data();
        setAccessStatus((data.accessStatus as AccessStatus) || 'pending');
      } else {
        setAccessStatus('pending');
      }
    } catch (err) {
      console.error('Error fetching access status:', err);
      setAccessStatus('pending');
    }
    setAccessLoading(false);
  }, [currentUser]);

  // Listen to auth state changes
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user: User | null) => {
      setCurrentUser(user);
      if (user) {
        setIsAdmin(ADMIN_EMAILS.includes(user.email || ''));
      } else {
        setIsAdmin(false);
        setAccessStatus(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  // Listen to access status changes in real-time (so approval shows immediately)
  useEffect(() => {
    if (!currentUser || isAdmin) {
      setAccessLoading(false);
      return;
    }
    setAccessLoading(true);
    const unsub = onSnapshot(doc(db, 'students', currentUser.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setAccessStatus((data.accessStatus as AccessStatus) || 'pending');
      } else {
        setAccessStatus('pending');
      }
      setAccessLoading(false);
    }, (err) => {
      console.error('Error listening to access status:', err);
      setAccessLoading(false);
    });
    return unsub;
  }, [currentUser, isAdmin]);

  // Register a new student (individual — starts as 'pending')
  async function register(email: string, password: string, name: string, phone: string) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    await setDoc(doc(db, 'students', cred.user.uid), {
      name,
      email,
      phone,
      createdAt: serverTimestamp(),
      assessmentCompleted: false,
      assessmentStartedAt: null,
      accessStatus: 'pending',        // ← NEW: must pay or be approved
      registrationType: 'individual',  // ← NEW: individual vs school
    });
  }

  // Login existing user
  async function login(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  // Logout
  async function logout() {
    await signOut(auth);
  }

  // Reset password
  async function resetPassword(email: string) {
    await sendPasswordResetEmail(auth, email);
  }

  const value: AuthContextType = {
    currentUser,
    loading,
    isAdmin,
    accessStatus,
    accessLoading,
    register,
    login,
    logout,
    resetPassword,
    refreshAccessStatus,
    hasAssessmentAccess,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
