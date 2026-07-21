// Dashboard color themes — color-therapy palettes + dark mode.
// ------------------------------------------------------------------
// A theme swaps the brand-accent CSS variables (see the theme block in
// index.css); the actual recolor happens in CSS, so this module only tracks
// the choice and stamps it onto <html> as data-theme / data-mode. Persisted
// per device (localStorage) like the font scale — appearance belongs to the
// screen in front of someone, never pushed onto another family member's phone.

import { useState, useEffect, useCallback } from 'react';

export type ThemeName = 'green' | 'soothing' | 'happiness' | 'love';

export const THEMES: { id: ThemeName; label: string; blurb: string; swatch: string }[] = [
  { id: 'green', label: 'Yadira Green', blurb: 'The classic, grounding forest green.', swatch: '#3a5d45' },
  { id: 'soothing', label: 'Soothing', blurb: 'Calm blues — for rest and serenity.', swatch: '#2f5f80' },
  { id: 'happiness', label: 'Happiness', blurb: 'Warm honey gold — for joy and optimism.', swatch: '#9a6614' },
  { id: 'love', label: 'Love', blurb: 'Warm rose — for closeness and comfort.', swatch: '#a63a60' },
];

const THEME_KEY = 'yadira_theme';
const MODE_KEY = 'yadira_theme_mode';
const EVENT = 'yadira-theme-change';

function readTheme(): ThemeName {
  try {
    const v = localStorage.getItem(THEME_KEY);
    if (v === 'green' || v === 'soothing' || v === 'happiness' || v === 'love') return v;
  } catch { /* ignore */ }
  return 'green';
}

function readDark(): boolean {
  try {
    return localStorage.getItem(MODE_KEY) === 'dark';
  } catch {
    return false;
  }
}

export function applyTheme(theme: ThemeName, dark: boolean): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  // 'green' is the default (no attribute), so a bare page renders Yadira Green.
  if (theme === 'green') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);
  if (dark) root.setAttribute('data-mode', 'dark');
  else root.removeAttribute('data-mode');
}

export function setThemeStored(theme: ThemeName, dark: boolean): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
    localStorage.setItem(MODE_KEY, dark ? 'dark' : 'light');
  } catch { /* ignore */ }
  applyTheme(theme, dark);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EVENT, { detail: { theme, dark } }));
  }
}

export function useTheme(): {
  theme: ThemeName;
  dark: boolean;
  setTheme: (t: ThemeName) => void;
  setDark: (d: boolean) => void;
} {
  const [theme, setThemeState] = useState<ThemeName>(readTheme);
  const [dark, setDarkState] = useState<boolean>(readDark);

  useEffect(() => {
    applyTheme(theme, dark);
  }, [theme, dark]);

  useEffect(() => {
    const onEvent = (e: Event) => {
      const d = (e as CustomEvent).detail as { theme: ThemeName; dark: boolean };
      setThemeState(d.theme);
      setDarkState(d.dark);
    };
    window.addEventListener(EVENT, onEvent);
    return () => window.removeEventListener(EVENT, onEvent);
  }, []);

  // Side effects live outside the state updaters (React 19 may invoke updater
  // functions twice); deps keep the paired value fresh.
  const setTheme = useCallback((t: ThemeName) => {
    setThemeState(t);
    setThemeStored(t, dark);
  }, [dark]);

  const setDark = useCallback((d: boolean) => {
    setDarkState(d);
    setThemeStored(theme, d);
  }, [theme]);

  return { theme, dark, setTheme, setDark };
}
