import React, { createContext, useContext, useState, useEffect } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, Auth } from 'firebase/auth';
import { auth, isFirebaseConfigured } from './firebase';

interface AuthContextType {
  user: { uid: string; email: string | null } | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ uid: string; email: string | null } | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    // Load token from localStorage on init
    if (typeof window !== 'undefined') {
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
      if (firebaseUser) {
        // User is logged in
        const newToken = await firebaseUser.getIdToken();
        setUser({ uid: firebaseUser.uid, email: firebaseUser.email });
        setToken(newToken);
        localStorage.setItem('yadira_token', newToken);
        localStorage.setItem('yadira_user_id', firebaseUser.uid);
        setError(null);
      } else {
        // User is logged out
        setUser(null);
        setToken(null);
        localStorage.removeItem('yadira_token');
        localStorage.removeItem('yadira_user_id');
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase not configured');
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
    } catch (err: any) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string) => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase not configured');
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
    } catch (err: any) {
      setError(err.message || 'Signup failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (!isFirebaseConfigured || !auth) {
      return;
    }
    setLoading(true);
    try {
      await signOut(auth as Auth);
      setUser(null);
      setToken(null);
      localStorage.removeItem('yadira_token');
      localStorage.removeItem('yadira_user_id');
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Logout failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, error, login, signup, logout }}>
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
