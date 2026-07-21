// Firebase initialization for Yadira
// ------------------------------------------------------------------
// Cloud sync is on by default: the production Firebase web config is
// committed below (web config is public by design — security lives in
// Firestore rules, see FIREBASE-SETUP.md). VITE_FIREBASE_* env vars
// override it per-field, e.g. to point a dev build at another project.
// If both the default and the env override were ever removed, `db`
// stays null and the data layer falls back to localStorage.
// ------------------------------------------------------------------

import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';

const defaultConfig = {
  apiKey: 'AIzaSyB0byXLSHRNOtGvYH6hxWhNmKZ7U4zkHA0',
  authDomain: 'yadira-1c1dd.firebaseapp.com',
  projectId: 'yadira-1c1dd',
  storageBucket: 'yadira-1c1dd.firebasestorage.app',
  messagingSenderId: '492873564306',
  appId: '1:492873564306:web:18f194c4bba243ba2de64b',
  measurementId: 'G-6MWZQPBKQE',
};

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || defaultConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || defaultConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || defaultConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || defaultConfig.storageBucket,
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || defaultConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || defaultConfig.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || defaultConfig.measurementId,
};

// Firebase is "configured" only when the essentials exist
export const isFirebaseConfigured: boolean = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId
);

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  console.info('[Yadira] Firebase connected — cloud sync active.');
} else {
  console.info('[Yadira] No Firebase config found — running in localStorage mode.');
}

export { app, db, auth };

// Get current user ID (from localStorage or Firebase auth)
export function getCurrentUserId(): string {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('yadira_user_id');
    if (stored) return stored;
  }
  return 'default-circle'; // Fallback for backward compatibility
}

// ------------------------------------------------------------------
// Firestore layout (one "care circle" per user/household):
//
//   careCircles/{userId}/
//     profile        (doc)        — CaregiverProfile
//     memories/{id}  (collection) — Memory
//     faqs/{id}      (collection) — CustomFAQ
//     logs/{id}      (collection) — DailyLog (id = date)
//     routine/{id}   (collection) — RoutineItem
//
// The circle id IS the authenticated user's uid, so every family gets an
// isolated circle — a paying customer must never see another family's
// data. 'default-circle' remains only as the anonymous/demo fallback.
// A patient device joins the family circle by being signed in on the
// caregiver's account (patient mode on an authed device keeps the uid).
// ------------------------------------------------------------------
export function getCircleId(): string {
  return getCurrentUserId();
}
