/**
 * Firebase Configuration & Initialization
 * 
 * Services: Auth (email/password) + Firestore (student data & reports)
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

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

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
