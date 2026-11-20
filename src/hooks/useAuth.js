/* eslint-disable import/prefer-default-export */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import PropTypes from 'prop-types';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

const AuthContext = createContext(null);

const fetchProfile = async (userId) => {
  if (!supabase || !userId) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, role, password_set')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
};

/** Clear expired/invalid OTP hash so the app does not stay on an error URL. */
const clearAuthErrorHash = () => {
  try {
    const { hash } = window.location;
    if (!hash || !hash.includes('error=')) return;
    window.history.replaceState({}, '', window.location.pathname + window.location.search);
  } catch (error) {
    // ignore
  }
};

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [authError, setAuthError] = useState(null);

  const loadProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null);
      return;
    }
    try {
      const data = await fetchProfile(userId);
      setProfile(data || {
        id: userId,
        email: null,
        role: 'member',
        password_set: false,
      });
    } catch (error) {
      setAuthError(error.message);
      setProfile({
        id: userId,
        email: null,
        role: 'member',
        password_set: false,
      });
    }
  }, []);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return undefined;
    }

    let mounted = true;
    clearAuthErrorHash();

    const finishLoading = () => {
      if (mounted) setLoading(false);
    };

    // Safety: never spin forever if Supabase hangs.
    const loadingTimeout = window.setTimeout(finishLoading, 8000);

    const isRefreshFailure = (message) => /refresh token|invalid.*jwt|session.*expired/i.test(
      String(message || ''),
    );

    supabase.auth.getSession()
      .then(async ({ data, error }) => {
        if (!mounted) return;
        if (error) {
          const message = isRefreshFailure(error.message)
            ? 'Tu sesión expiró o fue invalidada. Vuelve a iniciar sesión.'
            : error.message;
          setAuthError(message);
          // Stale refresh tokens leave the UI half-logged-in; clear local session only.
          await supabase.auth.signOut({ scope: 'local' });
          setSession(null);
          setProfile(null);
          return;
        }
        const nextSession = data.session || null;
        setSession(nextSession);
        if (nextSession?.user?.id) {
          await loadProfile(nextSession.user.id);
        } else {
          setProfile(null);
        }
      })
      .catch(async (error) => {
        if (!mounted) return;
        const message = isRefreshFailure(error.message)
          ? 'Tu sesión expiró o fue invalidada. Vuelve a iniciar sesión.'
          : (error.message || 'Error de autenticación');
        setAuthError(message);
        try {
          await supabase.auth.signOut({ scope: 'local' });
        } catch (signOutError) {
          // ignore
        }
        setSession(null);
        setProfile(null);
      })
      .finally(() => {
        window.clearTimeout(loadingTimeout);
        finishLoading();
      });

    // Do not make this callback async — awaiting inside onAuthStateChange
    // can deadlock with getSession in supabase-js.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, nextSession) => {
        setSession(nextSession);
        if (event === 'SIGNED_OUT' || !nextSession) {
          setProfile(null);
          finishLoading();
          return;
        }
        if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
          setAuthError(null);
        }
        if (nextSession?.user?.id) {
          loadProfile(nextSession.user.id).finally(finishLoading);
        } else {
          setProfile(null);
          finishLoading();
        }
      },
    );

    return () => {
      mounted = false;
      window.clearTimeout(loadingTimeout);
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  /** Create account with email + password (no magic link / email confirmation). */
  const signUpWithPassword = useCallback(async (email, password) => {
    if (!supabase) {
      throw new Error('Supabase no está configurado. Completa el archivo .env');
    }
    setAuthError(null);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    if (error) {
      setAuthError(error.message);
      throw error;
    }
    // With "Confirm email" disabled in Supabase, signup returns a session.
    if (data.session?.user?.id) {
      const { error: markError } = await supabase.rpc('mark_password_set');
      if (markError) {
        setAuthError(markError.message);
        throw markError;
      }
      await loadProfile(data.session.user.id);
      return;
    }
    const pending = new Error(
      'Cuenta creada, pero falta sesión. En Supabase → Authentication → Providers → Email, desactiva "Confirm email".',
    );
    setAuthError(pending.message);
    throw pending;
  }, [loadProfile]);

  const signInWithPassword = useCallback(async (email, password) => {
    if (!supabase) {
      throw new Error('Supabase no está configurado. Completa el archivo .env');
    }
    setAuthError(null);
    // Drop any stale local tokens before login (common after a failed refresh on mobile).
    await supabase.auth.signOut({ scope: 'local' });
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      setAuthError(error.message);
      throw error;
    }
    if (!data.session?.user?.id) {
      const missing = new Error('Login OK pero sin sesión. Revisa Confirm email / sesiones en Supabase.');
      setAuthError(missing.message);
      throw missing;
    }
    await loadProfile(data.session.user.id);
  }, [loadProfile]);

  const setPassword = useCallback(async (password) => {
    if (!supabase) {
      throw new Error('Supabase no está configurado. Completa el archivo .env');
    }
    setAuthError(null);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setAuthError(updateError.message);
      throw updateError;
    }
    const { error: markError } = await supabase.rpc('mark_password_set');
    if (markError) {
      setAuthError(markError.message);
      throw markError;
    }
    await loadProfile(session?.user?.id);
  }, [loadProfile, session?.user?.id]);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    setAuthError(null);
    // Local only: do not revoke sessions on other devices (phone vs computer).
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error) {
      setAuthError(error.message);
      throw error;
    }
    setSession(null);
    setProfile(null);
  }, []);

  const needsPassword = Boolean(session?.user) && profile != null && !profile.password_set;

  const value = useMemo(() => ({
    session,
    user: session?.user || null,
    profile,
    role: profile?.role || 'member',
    isAdmin: profile?.role === 'admin',
    needsPassword,
    loading,
    authError,
    configured: isSupabaseConfigured,
    signUpWithPassword,
    signInWithPassword,
    setPassword,
    signOut,
    refreshProfile: () => loadProfile(session?.user?.id),
  }), [
    session,
    profile,
    needsPassword,
    loading,
    authError,
    signUpWithPassword,
    signInWithPassword,
    setPassword,
    signOut,
    loadProfile,
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};

export default useAuth;
