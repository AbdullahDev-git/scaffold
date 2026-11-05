import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Create a Supabase client that uses the request's cookies for auth.
 * Returns null when the env vars are missing (demo mode).
 */
export async function createClient(): Promise<SupabaseClient | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  const jar = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return jar.getAll().map(({ name, value }) => ({ name, value }));
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => jar.set(name, value, options as Parameters<typeof jar.set>[2]));
        } catch {
          // Called from a Server Component — safe to ignore.
        }
      },
    },
  });
}

/**
 * Check if the current user is an admin or super_admin by querying the profiles table.
 * Returns the user ID if admin, null otherwise.
 */
export async function getAdminUserId(): Promise<string | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role === 'admin' || profile?.role === 'super_admin') {
    return user.id;
  }
  return null;
}

/**
 * Retry a Supabase auth call on transient DNS/network errors.
 * Returns null on permanent failure.
 */
export async function withRetry<T>(fn: () => Promise<T>, label: string, retries = 2): Promise<T | null> {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err) {
      const msg = (err as Error).message ?? String(err);
      const isTransient = /ENOTFOUND|ECONNRESET|ETIMEDOUT|fetch failed/i.test(msg);
      if (!isTransient || i === retries) {
        console.error(`[${label}] ${msg}`);
        return null;
      }
      console.warn(`[${label}] attempt ${i + 1} failed (${msg}), retrying...`);
      await new Promise((r) => setTimeout(r, 500 * (i + 1)));
    }
  }
  return null;
}
