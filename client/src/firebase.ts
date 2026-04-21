/**
 * Firebase Configuration & Initialization
 * 
 * Services: Auth (email/password) + Firestore (student data & reports)
 * App Check: reCAPTCHA v3 for request verification
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage as _getStorage } from 'firebase/storage';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

const firebaseConfig = {
  apiKey: "AIzaSyBTMNRw4GunDNynbIbMkwVJuLx6rgKabc8",
  authDomain: "srichakraacademy-3f745.firebaseapp.com",
  projectId: "srichakraacademy-3f745",
  storageBucket: "srichakraacademy-3f745.firebasestorage.app",
  messagingSenderId: "607428505344",
  appId: "1:607428505344:web:1bdc1c4bc5122fc5ad0de5",
  measurementId: "G-GY0XQMP0T5",
};

const app = initializeApp(firebaseConfig);

// Enable App Check debug mode in development
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}

// Initialize App Check with reCAPTCHA v3 to protect backend resources
if (typeof window !== 'undefined') {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider('6LeVyIssAAAAADODSLKv1vamOxsCKsWWTxpfsYRU'),
    isTokenAutoRefreshEnabled: true,
  });
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app, 'asia-south1');
export const storage = _getStorage(app);
export default app;
