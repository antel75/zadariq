import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);
  const lastCheckedUserId = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const checkAdminRole = async (userId: string, force = false) => {
      if (!force && lastCheckedUserId.current === userId) {
        if (isMounted) {
          setAdminChecked(true);
          setLoading(false);
        }
        return;
      }

      try {
        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .eq('role', 'admin')
          .maybeSingle();

        if (isMounted) {
          setIsAdmin(!!data);
          setAdminChecked(true);
          setLoading(false);
          lastCheckedUserId.current = userId;
        }
      } catch {
        if (isMounted) {
          setIsAdmin(false);
          setAdminChecked(true);
          setLoading(false);
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) return;

      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (nextSession?.user) {
        setTimeout(() => {
          void checkAdminRole(nextSession.user.id);
        }, 0);
      } else {
        lastCheckedUserId.current = null;
        setIsAdmin(false);
        setAdminChecked(true);
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (!isMounted) return;

      setSession(initialSession);
      setUser(initialSession?.user ?? null);

      if (initialSession?.user) {
        void checkAdminRole(initialSession.user.id, true);
      } else {
        lastCheckedUserId.current = null;
        setIsAdmin(false);
        setAdminChecked(true);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { user, session, loading, isAdmin, adminChecked, signIn, signOut };
}

