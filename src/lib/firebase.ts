// Firebase initialization for Yadira
// ------------------------------------------------------------------
// Design principle: the app must work WITHOUT Firebase configured.
// If env vars are missing, `db` is null and the data layer silently
// falls back to localStorage. Paste real config in .env and the app
// becomes cloud-synced with zero code changes.
// ------------------------------------------------------------------

import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
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
// When Auth is wired in, userId comes from Firebase Auth.
// For local-only/localStorage mode, userId = 'default-circle'.
// ------------------------------------------------------------------
export const CIRCLE_ID = 'default-circle';
