/**
 * Auth Context - Provides authentication state across the app
 * 
 * Handles: login, register, logout, auth state persistence
 */

import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  isAdmin: boolean;
  register: (email: string, password: string, name: string, phone: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
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

  // Listen to auth state changes
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user: User | null) => {
      setCurrentUser(user);
      if (user) {
        // Check admin status
        setIsAdmin(ADMIN_EMAILS.includes(user.email || ''));
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  // Register a new student
  async function register(email: string, password: string, name: string, phone: string) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    // Update display name
    await updateProfile(cred.user, { displayName: name });
    // Save profile to Firestore
    await setDoc(doc(db, 'students', cred.user.uid), {
      name,
      email,
      phone,
      createdAt: serverTimestamp(),
      assessmentCompleted: false,
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

  const value: AuthContextType = {
    currentUser,
    loading,
    isAdmin,
    register,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
