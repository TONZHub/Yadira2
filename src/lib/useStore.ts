// useStore — Yadira's universal persistence hook
// ------------------------------------------------------------------
// Drop-in replacement for the localStorage useState pattern.
//
// Behavior:
//   • No Firebase config  → behaves exactly like the old localStorage code
//   • Firebase configured → real-time Firestore sync across devices
//     (caregiver's phone + patient's tablet see the same data live)
//
// Usage (replaces the old pattern 1:1):
//   const [memories, setMemories] = useStoreList<Memory>('memories', INITIAL_MEMORIES);
//   const [profile, setProfile]   = useStoreDoc<CaregiverProfile>('profile', DEFAULT_PROFILE);
// ------------------------------------------------------------------

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { db, isFirebaseConfigured, CIRCLE_ID } from './firebase';

const LS_PREFIX = 'yadira_';

// ---------- shared localStorage helpers ----------

function readLocal<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(LS_PREFIX + key);
    return saved ? (JSON.parse(saved) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal<T>(key: string, value: T) {
  try {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify(value));
  } catch {
    /* storage full or unavailable — non-fatal */
  }
}

// ---------- LIST store (memories, faqs, logs, routine) ----------
// Items MUST have a stable `id` field (logs use `date` — see idField).

type Updater<T> = T[] | ((prev: T[]) => T[]);

export function useStoreList<T extends Record<string, any>>(
  key: string,
  initial: T[],
  idField: keyof T = 'id' as keyof T
): [T[], (next: Updater<T>) => void, boolean] {
  const [items, setItems] = useState<T[]>(() => readLocal(key, initial));
  // Ref mirror so functional updaters resolve against latest state
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const [synced, setSynced] = useState(false);
  // Guard so our own writes don't loop back through the snapshot listener
  const pendingWrite = useRef(false);

  // Subscribe to Firestore (real-time, cross-device)
  useEffect(() => {
    if (!isFirebaseConfigured || !db) return;

    const colRef = collection(db, 'careCircles', CIRCLE_ID, key);
    const unsub = onSnapshot(
      colRef,
      (snap) => {
        if (pendingWrite.current) {
          pendingWrite.current = false;
          return;
        }
        if (!snap.empty) {
          const remote = snap.docs.map((d) => d.data() as T);
          setItems(remote);
          writeLocal(key, remote); // keep local cache warm for offline
        }
        setSynced(true);
      },
      (err) => console.warn(`[Yadira] Firestore listen failed for "${key}"`, err)
    );
    return unsub;
  }, [key]);

  const update = useCallback(
    (updater: Updater<T>) => {
      const next =
        typeof updater === 'function' ? updater(itemsRef.current) : updater;
      setItems(next);
      writeLocal(key, next); // always mirror locally

      if (isFirebaseConfigured && db) {
        pendingWrite.current = true;
        const batch = writeBatch(db);
        next.forEach((item) => {
          const id = String(item[idField]);
          batch.set(doc(db!, 'careCircles', CIRCLE_ID, key, id), item);
        });
        batch
          .commit()
          .catch((err) =>
            console.warn(`[Yadira] Firestore write failed for "${key}"`, err)
          );
      }
    },
    [key, idField]
  );

  return [items, update, synced];
}

// ---------- DOC store (caregiver profile, settings) ----------

export function useStoreDoc<T extends Record<string, any>>(
  key: string,
  initial: T
): [T, (next: T) => void, boolean] {
  const [value, setValue] = useState<T>(() => readLocal(key, initial));
  const [synced, setSynced] = useState(false);
  const pendingWrite = useRef(false);

  useEffect(() => {
    if (!isFirebaseConfigured || !db) return;

    const docRef = doc(db, 'careCircles', CIRCLE_ID, 'meta', key);
    const unsub = onSnapshot(
      docRef,
      (snap) => {
        if (pendingWrite.current) {
          pendingWrite.current = false;
          return;
        }
        if (snap.exists()) {
          const remote = snap.data() as T;
          setValue(remote);
          writeLocal(key, remote);
        }
        setSynced(true);
      },
      (err) => console.warn(`[Yadira] Firestore listen failed for "${key}"`, err)
    );
    return unsub;
  }, [key]);

  const update = useCallback(
    (next: T) => {
      setValue(next);
      writeLocal(key, next);

      if (isFirebaseConfigured && db) {
        pendingWrite.current = true;
        setDoc(doc(db, 'careCircles', CIRCLE_ID, 'meta', key), next).catch(
          (err) =>
            console.warn(`[Yadira] Firestore write failed for "${key}"`, err)
        );
      }
    },
    [key]
  );

  return [value, update, synced];
}
