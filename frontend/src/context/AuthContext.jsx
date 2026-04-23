import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase, isSupabaseReady } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]               = useState(null);
  const [profile, setProfile]         = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const loadingTimerRef               = useRef(null);

  /* ─── Safety net: never spin forever ─── */
  const armSafetyTimer = () => {
    if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
    loadingTimerRef.current = setTimeout(() => {
      console.warn('Auth loading timed out — releasing spinner');
      setAuthLoading(false);
    }, 8000);
  };

  const clearSafetyTimer = () => {
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
      loadingTimerRef.current = null;
    }
  };

  /* ─── Session management ─── */
  useEffect(() => {
    // ── Demo mode: no Supabase credentials ──
    if (!isSupabaseReady) {
      setUser({
        id: 'demo-user',
        email: 'demo@habitflow.app',
        user_metadata: { full_name: 'Alex Morgan' },
      });
      setProfile({ id: 'demo-user', display_name: 'Alex Morgan', total_points: 1240 });
      setAuthLoading(false);
      return;
    }

    // Arm the safety timer so we never block the app
    armSafetyTimer();

    let isMounted = true;

    // ── 1. Immediately restore session from localStorage ──
    // This resolves near-instantly (no network round-trip) and prevents
    // the "blank screen / looks logged out" flash on return visits.
    const restoreSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (!isMounted) return;
        if (error) {
          console.warn('getSession error:', error.message);
          setUser(null);
          setProfile(null);
          setAuthLoading(false);
          clearSafetyTimer();
          return;
        }
        if (session?.user) {
          setUser(session.user);
          await loadProfile(session.user);
        } else {
          setUser(null);
          setProfile(null);
          setAuthLoading(false);
          clearSafetyTimer();
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('restoreSession exception:', err);
        setUser(null);
        setProfile(null);
        setAuthLoading(false);
        clearSafetyTimer();
      }
    };

    restoreSession();

    // ── 2. Listen for ongoing auth events (token refresh, sign-out, etc.) ──
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        // Skip the INITIAL_SESSION event — we already handled it above
        if (event === 'INITIAL_SESSION') return;

        clearSafetyTimer();
        armSafetyTimer();

        setUser(session?.user ?? null);

        if (session?.user) {
          await loadProfile(session.user);
        } else {
          // Signed out or no session
          setProfile(null);
          setAuthLoading(false);
          clearSafetyTimer();
        }
      }
    );

    return () => {
      isMounted = false;
      clearSafetyTimer();
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ─── Load (or auto-create) profile row ─── */
  const loadProfile = async (u) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', u.id)
        .single();

      if (!error && data) {
        setProfile(data);
        return;
      }

      // No row yet (PGRST116) — create one
      if (error?.code === 'PGRST116') {
        const name = u.user_metadata?.full_name || u.email?.split('@')[0] || 'User';
        const { data: newProfile, error: insertErr } = await supabase
          .from('profiles')
          .insert([{ id: u.id, display_name: name, total_points: 0 }])
          .select()
          .single();

        if (insertErr) {
          console.warn('Profile insert error (using local):', insertErr.message);
          setProfile({ id: u.id, display_name: name, total_points: 0 });
        } else {
          setProfile(newProfile);
        }
        return;
      }

      // Any other DB error — use a local profile so the app still works
      console.warn('fetchProfile error (using local):', error?.message);
      setProfile({
        id: u.id,
        display_name: u.user_metadata?.full_name || u.email?.split('@')[0] || 'User',
        total_points: 0,
      });

    } catch (err) {
      console.error('loadProfile exception (using local):', err);
      setProfile({
        id: u.id,
        display_name: u.user_metadata?.full_name || u.email?.split('@')[0] || 'User',
        total_points: 0,
      });
    } finally {
      // ✅ Always release the spinner
      clearSafetyTimer();
      setAuthLoading(false);
    }
  };

  /* ─── SIGN UP ─── */
  const signUp = async ({ email, password, fullName }) => {
    if (!isSupabaseReady)
      return { error: { message: 'Configure Supabase in .env to use authentication.' } };
    return await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
  };

  /* ─── SIGN IN ─── */
  const signIn = async ({ email, password }) => {
    if (!isSupabaseReady)
      return { error: { message: 'Configure Supabase in .env to use authentication.' } };
    return await supabase.auth.signInWithPassword({ email, password });
  };

  /* ─── SIGN OUT ─── */
  const signOut = async () => {
    if (!isSupabaseReady) { setUser(null); setProfile(null); return; }
    await supabase.auth.signOut();
  };

  /* ─── UPDATE PROFILE ─── */
  const updateUserProfile = async (updates) => {
    if (!user) return;
    setProfile(prev => prev ? { ...prev, ...updates } : updates);
    if (!isSupabaseReady) return;
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();
    if (error) console.error('updateUserProfile error:', error.message);
    else if (data) setProfile(data);
  };

  const displayName =
    profile?.display_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'User';

  const avatarInitial = displayName.charAt(0).toUpperCase();

  return (
    <AuthContext.Provider value={{
      user, profile, authLoading,
      displayName, avatarInitial,
      signUp, signIn, signOut, updateUserProfile,
      isDemo: !isSupabaseReady,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
