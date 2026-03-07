import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);
  useEffect(() => {
    let isMounted = true;
    const checkAdminRole = async (userId: string) => {
      try {
        const { data, error } = await supabase.rpc('has_role', {
          _user_id: userId,
          _role: 'admin',
        });
        if (isMounted) {
          setIsAdmin(error ? false : !!data);
          setAdminChecked(true);
          setLoading(false);
        }
      } catch {
        if (isMounted) {
          setIsAdmin(false);
          setAdminChecked(true);
          setLoading(false);
        }
      }
    };
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminRole(session.user.id);
      } else {
        setAdminChecked(true);
        setLoading(false);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!isMounted) return;
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          checkAdminRole(session.user.id);
        } else {
          setIsAdmin(false);
          setAdminChecked(true);
          setLoading(false);
        }
      }
    );
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
