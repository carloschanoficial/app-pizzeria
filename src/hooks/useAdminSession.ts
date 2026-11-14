import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export const SUPER_ADMIN_EMAILS = ['carloschan.oficial@gmail.com'];

export interface AdminRecord {
  email: string;
  is_active: boolean;
  expires_at: string;
}

export type AdminAccess =
  | 'loading'
  | 'signed_out'
  | 'no_access'
  | 'inactive'
  | 'expired'
  | 'error'
  | 'granted';

interface AdminLookup {
  email: string;
  record: AdminRecord | null;
  error: boolean;
}

function computeAccess(
  session: Session | null,
  sessionLoading: boolean,
  lookup: AdminLookup | null,
): AdminAccess {
  if (sessionLoading) return 'loading';
  const email = session?.user.email?.toLowerCase();
  if (!email) return 'signed_out';
  if (SUPER_ADMIN_EMAILS.includes(email)) return 'granted';
  if (!lookup || lookup.email !== email) return 'loading';
  if (lookup.error) return 'error';
  if (!lookup.record) return 'no_access';
  if (!lookup.record.is_active) return 'inactive';
  if (new Date(lookup.record.expires_at).getTime() <= Date.now()) return 'expired';
  return 'granted';
}

export function useAdminSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [lookup, setLookup] = useState<AdminLookup | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setSessionLoading(false);
    });
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  const email = session?.user.email?.toLowerCase() ?? null;

  useEffect(() => {
    if (!email || SUPER_ADMIN_EMAILS.includes(email)) return;
    let cancelled = false;
    supabase
      .from('administradores')
      .select('email, is_active, expires_at')
      .eq('email', email)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        setLookup({ email, record: (data as AdminRecord | null) ?? null, error: Boolean(error) });
      });
    return () => {
      cancelled = true;
    };
  }, [email]);

  const access = computeAccess(session, sessionLoading, lookup);

  return {
    session,
    access,
    record: lookup?.email === email ? lookup?.record ?? null : null,
    isSuperAdmin: email !== null && SUPER_ADMIN_EMAILS.includes(email),
    isAdmin: access === 'granted',
    loading: access === 'loading',
  };
}
