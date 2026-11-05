import 'server-only';
import { cookies } from 'next/headers';
import { store } from './db';
import { createClient } from './supabase';
import type { Profile } from './schema';

/**
 * Read-side session helpers for server components.
 *
 * In production (Supabase env vars set), the identity comes from the Supabase
 * Auth session cookie. In demo mode, it reads the custom scaffold_uid cookie.
 */
export async function getSession(): Promise<{
  profile: Profile;
  signedIn: boolean;
  onboarded: boolean;
}> {
  const jar = await cookies();
  const supabase = await createClient();

  let signedIn = false;
  let onboarded = false;

  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
    signedIn = Boolean(user);
    onboarded = jar.get('scaffold_onboarded')?.value === '1';
  } else {
    signedIn = Boolean(jar.get('scaffold_uid')?.value);
    onboarded = jar.get('scaffold_onboarded')?.value === '1';
  }

  const db = await store();
  const profile = await db.getProfile();
  return { profile, signedIn, onboarded };
}

/**
 * Only same-site relative paths may act as a post-login destination — no
 * protocol-relative and no external URLs, so a crafted ?redirect= cannot
 * leave the app.
 */
export function safeRedirect(target: FormDataEntryValue | null | undefined, fallback = '/dashboard'): string {
  if (typeof target !== 'string' || !target.startsWith('/') || target.startsWith('//')) return fallback;
  return target;
}
