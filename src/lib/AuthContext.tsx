import React, { createContext, useContext, useState, useEffect } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, Auth } from 'firebase/auth';
import { auth, isFirebaseConfigured } from './firebase';

interface AuthContextType {
  user: { uid: string; email: string | null } | null;
  token: string | null;
  sessionRole: 'caregiver' | 'patient';
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  enterPatientMode: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function toBase64Url(value: string): string {
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function createLocalDemoToken(uid: string, email: string): string {
  const header = toBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = toBase64Url(
    JSON.stringify({
      uid,
      email,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
      iss: 'yadira-local-dev',
    })
  );
  return `${header}.${payload}.local-dev-signature`;
}

function parseJwtPayload(token: string): { uid?: string; user_id?: string; sub?: string; email?: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const payload = JSON.parse(atob(padded));
    return payload;
  } catch {
    return null;
  }
}

function startLocalSession(
  email: string,
  setUser: React.Dispatch<React.SetStateAction<{ uid: string; email: string | null } | null>>,
  setToken: React.Dispatch<React.SetStateAction<string | null>>,
  setError: React.Dispatch<React.SetStateAction<string | null>>
) {
  const uid = `local-${email.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'user'}`;
  const localToken = createLocalDemoToken(uid, email);
  setUser({ uid, email });
  setToken(localToken);
  localStorage.setItem('yadira_token', localToken);
  localStorage.setItem('yadira_user_id', uid);
  setError(null);
}

function isFirebaseAuthConfigError(err: any): boolean {
  const code = String(err?.code || '');
  return (
    code === 'auth/configuration-not-found' ||
    code === 'auth/operation-not-allowed' ||
    code === 'auth/invalid-api-key'
  );
}

// Sessions are only resumed within the SAME browser session — the marker
// lives in sessionStorage, which survives reloads (so a mid-conversation
// refresh never logs anyone out) but not new tabs/visits. A fresh visit
// always starts at the role-selection screen, even if a token or Firebase
// user is still lying around from last time.
function activeSessionRole(): 'caregiver' | 'patient' | null {
  if (typeof window === 'undefined') return null;
  const role = sessionStorage.getItem('yadira_session_role');
  return role === 'patient' || role === 'caregiver' ? role : null;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sessionRole, setSessionRole] = useState<'caregiver' | 'patient'>(() => {
    return activeSessionRole() === 'patient' ? 'patient' : 'caregiver';
  });
  const [user, setUser] = useState<{ uid: string; email: string | null } | null>(() => {
    if (!activeSessionRole()) return null;
    const existingToken = localStorage.getItem('yadira_token');
    if (!existingToken) return null;
    const payload = parseJwtPayload(existingToken);
    const uid = payload?.uid || payload?.user_id || payload?.sub;
    if (!uid) return null;
    return { uid, email: payload?.email ?? null };
  });
  const [token, setToken] = useState<string | null>(() => {
    // Load token from localStorage on init — only for a live browser session
    if (activeSessionRole() && typeof window !== 'undefined') {
      return localStorage.getItem('yadira_token');
    }
    return null;
  });
  const [loading, setLoading] = useState(!token); // If we have a token, we're not loading initially
  const [error, setError] = useState<string | null>(null);

  // Listen for auth state changes
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      const role = activeSessionRole();
      if (firebaseUser && role) {
        // Firebase user with a live browser session — refresh the token and
        // keep the session's existing role (don't force caregiver: the same
        // device may have been handed to a patient).
        const newToken = await firebaseUser.getIdToken();
        setUser({ uid: firebaseUser.uid, email: firebaseUser.email });
        setToken(newToken);
        localStorage.setItem('yadira_token', newToken);
        localStorage.setItem('yadira_user_id', firebaseUser.uid);
        setSessionRole(role);
        setError(null);
      } else if (!firebaseUser && role) {
        // No Firebase user: keep local demo/patient sessions if present.
        const existingToken = localStorage.getItem('yadira_token');
        const payload = existingToken ? parseJwtPayload(existingToken) : null;
        const uid = payload?.uid || payload?.user_id || payload?.sub;
        if (existingToken && uid) {
          setUser({ uid, email: payload?.email ?? null });
          setToken(existingToken);
          setSessionRole(role);
        } else {
          setUser(null);
          setToken(null);
          localStorage.removeItem('yadira_token');
          localStorage.removeItem('yadira_user_id');
          sessionStorage.removeItem('yadira_session_role');
          setSessionRole('caregiver');
        }
      } else {
        // Fresh visit (no session marker): stay on the login/role-selection
        // screen regardless of any lingering token or Firebase user.
        setUser(null);
        setToken(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    if (!isFirebaseConfigured || !auth) {
      // No Firebase → local demo session, same as patient mode already does.
      // The app's design principle is to work fully without Firebase.
      console.warn('[Yadira Auth] Firebase not configured, using local demo auth mode.');
      startLocalSession(email, setUser, setToken, setError);
      sessionStorage.setItem('yadira_session_role', 'caregiver');
      setSessionRole('caregiver');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithEmailAndPassword(auth as Auth, email, password);
      const newToken = await result.user.getIdToken();
      setUser({ uid: result.user.uid, email: result.user.email });
      setToken(newToken);
      localStorage.setItem('yadira_token', newToken);
      localStorage.setItem('yadira_user_id', result.user.uid);
      sessionStorage.setItem('yadira_session_role', 'caregiver');
      setSessionRole('caregiver');
    } catch (err: any) {
      if (isFirebaseAuthConfigError(err)) {
        console.warn('[Yadira Auth] Firebase Auth not fully configured, using local demo auth mode.');
        startLocalSession(email, setUser, setToken, setError);
        return;
      }
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string) => {
    if (!isFirebaseConfigured || !auth) {
      console.warn('[Yadira Auth] Firebase not configured, using local demo auth mode.');
      startLocalSession(email, setUser, setToken, setError);
      sessionStorage.setItem('yadira_session_role', 'caregiver');
      setSessionRole('caregiver');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await createUserWithEmailAndPassword(auth as Auth, email, password);
      const newToken = await result.user.getIdToken();
      setUser({ uid: result.user.uid, email: result.user.email });
      setToken(newToken);
      localStorage.setItem('yadira_token', newToken);
      localStorage.setItem('yadira_user_id', result.user.uid);
      sessionStorage.setItem('yadira_session_role', 'caregiver');
      setSessionRole('caregiver');
    } catch (err: any) {
      if (isFirebaseAuthConfigError(err)) {
        console.warn('[Yadira Auth] Firebase Auth not fully configured, using local demo auth mode.');
        startLocalSession(email, setUser, setToken, setError);
        return;
      }
      setError(err.message || 'Signup failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const enterPatientMode = () => {
    // Always hydrate the user state, not just when no token exists. Since
    // sessions stopped auto-restoring on fresh visits, `user` is null on the
    // login screen even when a valid token sits in localStorage — previously
    // this function skipped setUser in that case and the tap did nothing.
    const existingToken = localStorage.getItem('yadira_token');
    const payload = existingToken ? parseJwtPayload(existingToken) : null;
    const uid = payload?.uid || payload?.user_id || payload?.sub;
    if (existingToken && uid) {
      setUser({ uid, email: payload?.email ?? null });
      setToken(existingToken);
      setError(null);
    } else {
      startLocalSession('patient@yadira.local', setUser, setToken, setError);
    }
    sessionStorage.setItem('yadira_session_role', 'patient');
    setSessionRole('patient');
  };

  const logout = async () => {
    setLoading(true);
    try {
      if (isFirebaseConfigured && auth) {
        await signOut(auth as Auth);
      }
      setUser(null);
      setToken(null);
      localStorage.removeItem('yadira_token');
      localStorage.removeItem('yadira_user_id');
      sessionStorage.removeItem('yadira_session_role');
      setSessionRole('caregiver');
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Logout failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, sessionRole, loading, error, login, signup, enterPatientMode, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
