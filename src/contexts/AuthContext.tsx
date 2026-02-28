import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { get, post, isUnauthorized, ApiError } from '../services/api';
import type { Profile } from '../types';

type AuthUser = {
  id: string;
  email: string;
  created_at: string;
};

type AuthPayload = {
  user: AuthUser;
  profile: Profile;
};

interface AuthContextType {
  user: AuthUser | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    nombre: string,
    apellido: string,
    telefono: string
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadSession() {
      try {
        const data = await get<AuthPayload>('/api/auth/me');
        if (!active) return;
        setUser(data.user);
        setProfile(data.profile);
      } catch (error) {
        if (!active) return;
        if (!isUnauthorized(error)) {
          console.error('Error fetching session:', error);
        }
        setUser(null);
        setProfile(null);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadSession();

    return () => {
      active = false;
    };
  }, []);

  function applyAuthPayload(payload: AuthPayload) {
    setUser(payload.user);
    setProfile(payload.profile);
  }

  function resolveErrorMessage(error: unknown, fallback: string) {
    if (error instanceof ApiError) {
      return error.message || fallback;
    }
    return fallback;
  }

  async function signIn(email: string, password: string) {
    try {
      const data = await post<AuthPayload>('/api/auth/signin', { email, password });
      applyAuthPayload(data);
      return { error: null };
    } catch (error) {
      if (isUnauthorized(error)) {
        return { error: 'unauthorized' };
      }

      return { error: resolveErrorMessage(error, 'signin_failed') };
    }
  }

  async function signUp(email: string, password: string, nombre: string, apellido: string, telefono: string) {
    try {
      const data = await post<AuthPayload>('/api/auth/signup', {
        email,
        password,
        nombre,
        apellido,
        telefono
      });
      applyAuthPayload(data);
      return { error: null };
    } catch (error) {
      return { error: resolveErrorMessage(error, 'signup_failed') };
    }
  }

  async function signOut() {
    try {
      await post('/api/auth/signout');
    } catch (error) {
      if (!isUnauthorized(error)) {
        console.error('Error signing out:', error);
      }
    } finally {
      setUser(null);
      setProfile(null);
    }
  }

  async function refreshProfile() {
    try {
      const data = await get<AuthPayload>('/api/auth/me');
      applyAuthPayload(data);
    } catch (error) {
      if (!isUnauthorized(error)) {
        console.error('Error refreshing profile:', error);
      }
    }
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
