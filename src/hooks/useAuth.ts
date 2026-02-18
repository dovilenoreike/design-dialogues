import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { setSentryUser } from '@/lib/sentry';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session first
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        setSentryUser(session.user.id, session.user.is_anonymous);
        setLoading(false);
      } else {
        // No session - sign in anonymously
        supabase.auth.signInAnonymously().then(({ data, error }) => {
          if (!error && data.user) {
            setUser(data.user);
            setSentryUser(data.user.id, true);
          } else if (error) {
            console.error('Anonymous auth failed:', error.message);
          }
          setLoading(false);
        });
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          setSentryUser(session.user.id, session.user.is_anonymous);
        } else {
          setSentryUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}
