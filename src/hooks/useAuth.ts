import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

type AuthState = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  adminChecked: boolean;
};

let authState: AuthState = {
  user: null,
  session: null,
  loading: true,
  isAdmin: false,
  adminChecked: false,
};

let initialized = false;
let initializingPromise: Promise<void> | null = null;
const subscribers = new Set<(state: AuthState) => void>();

const emit = () => {
  subscribers.forEach((listener) => listener(authState));
};

const checkAdminRole = async (userId: string) => {
  try {
    const { data, error } = await supabase.rpc('has_role', {
      _user_id: userId,
      _role: 'admin',
    });

    return error ? false : !!data;
  } catch {
    return false;
  }
};

const applySession = async (session: Session | null, shouldRecheckRole = true) => {
  authState = {
    ...authState,
    session,
    user: session?.user ?? null,
  };

  if (!session?.user) {
    authState = {
      ...authState,
      isAdmin: false,
      adminChecked: true,
      loading: false,
    };
    emit();
    return;
  }

  if (!shouldRecheckRole && authState.adminChecked) {
    authState = {
      ...authState,
      loading: false,
    };
    emit();
    return;
  }

  const isAdmin = await checkAdminRole(session.user.id);
  authState = {
    ...authState,
    isAdmin,
    adminChecked: true,
    loading: false,
  };
  emit();
};

const ensureInitialized = async () => {
  if (initialized) return;

  if (initializingPromise) {
    await initializingPromise;
    return;
  }

  initializingPromise = (async () => {
    const { data: { session } } = await supabase.auth.getSession();
    await applySession(session, true);

    supabase.auth.onAuthStateChange((event, nextSession) => {
      const shouldRecheckRole = event !== 'TOKEN_REFRESHED';
      void applySession(nextSession, shouldRecheckRole);
    });

    initialized = true;
  })();

  await initializingPromise;
};

export function useAuth() {
  const [state, setState] = useState<AuthState>(authState);

  useEffect(() => {
    const listener = (nextState: AuthState) => setState(nextState);
    subscribers.add(listener);

    void ensureInitialized();

    return () => {
      subscribers.delete(listener);
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return {
    user: state.user,
    session: state.session,
    loading: state.loading,
    isAdmin: state.isAdmin,
    adminChecked: state.adminChecked,
    signIn,
    signOut,
  };
}

