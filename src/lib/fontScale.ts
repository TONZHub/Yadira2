// Large-font accessibility toggle — shared across every surface.
// ------------------------------------------------------------------
// The lever is the root <html> font-size as a *percentage*, so it scales
// relative to whatever default the viewer's browser/OS is set to (an elder
// who already bumped their system font to 20px gets 25px in large mode, not
// a fight with 16px). Because Tailwind's type AND spacing utilities are
// rem-based, scaling the root enlarges text and touch targets together —
// exactly what this audience needs.
//
// Persisted per device (localStorage), not per care circle: font size is a
// property of the eyes in front of the screen, never something one family
// member should push onto another's phone.

import { useState, useEffect, useCallback } from 'react';

const KEY = 'yadira_large_font';
const LARGE_SCALE = '125%';
const EVENT = 'yadira-font-scale';

export function isLargeFont(): boolean {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export function applyLargeFont(large: boolean): void {
  if (typeof document === 'undefined') return;
  document.documentElement.style.fontSize = large ? LARGE_SCALE : '';
}

export function setLargeFont(large: boolean): void {
  try {
    localStorage.setItem(KEY, large ? '1' : '0');
  } catch {
    /* storage blocked — the applied size still holds for this session */
  }
  applyLargeFont(large);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EVENT, { detail: large }));
  }
}

// React hook — reactive, and kept in sync across any other toggle instance
// (or another tab) so the button always reflects the true state.
export function useLargeFont(): [boolean, () => void] {
  const [large, setLarge] = useState(isLargeFont);

  useEffect(() => {
    applyLargeFont(large);
  }, [large]);

  useEffect(() => {
    const onEvent = (e: Event) => setLarge(!!(e as CustomEvent).detail);
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setLarge(e.newValue === '1');
    };
    window.addEventListener(EVENT, onEvent);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(EVENT, onEvent);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  // Side effects (localStorage, DOM, event dispatch) must live OUTSIDE the
  // state updater — React 19 may invoke updater functions twice, which would
  // toggle the preference twice and net to no change.
  const toggle = useCallback(() => {
    const next = !large;
    setLargeFont(next); // writes storage, applies to <html>, notifies others
    setLarge(next);
  }, [large]);

  return [large, toggle];
}
