'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { ONB_COOKIE, ROLE_COOKIE, UID_COOKIE, WA_COOKIE } from './cookies';
import { store } from './db';
import { createClient, withRetry } from './supabase';
import type { ActionState } from './actions';
import { safeRedirect } from './session';
import { checkRateLimit, createRateLimitError } from './rate-limit';

/**
 * Auth layer. When Supabase env vars are set, this uses real Supabase Auth
 * (email/password). Otherwise it falls back to the demo cookie identity.
 *
 * The routing contract stays the same either way:
 *   signup → onboarding first, login → dashboard (unless onboarding pending),
 *   every login honours ?redirect=.
 */

const cookieBase = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 30,
};

const whatsapp = z
  .string()
  .regex(/^\+?[0-9][0-9\s-]{6,14}$/, 'Enter a valid WhatsApp number.');

const firstError = (issues: z.ZodIssue[]) => issues[0]?.message ?? 'Something is missing.';

/* ------------------------------------------------------------------ sign in */

export async function signInAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const rateLimit = await checkRateLimit('signin');
  if (!rateLimit.allowed) {
    return { error: createRateLimitError(rateLimit.resetAt) };
  }

  const parsed = z
    .object({
      email: z.string().email('Enter a valid email address.'),
      password: z.string().min(1, 'Enter your password.'),
    })
    .safeParse({ email: form.get('email'), password: form.get('password') });
  if (!parsed.success) return { error: firstError(parsed.error.issues) };

  const supabase = await createClient();

  if (supabase) {
    const result = await withRetry(
      () => supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password }),
      'SIGNIN',
    );
    const error = result?.error;
    if (error) {
      console.error('[SIGNIN ERROR]', error.message);
      return { error: error.message.includes('Invalid login') ? 'Invalid email or password.' : error.message };
    }
    if (result === null) {
      return { error: 'Network error. Check your connection and try again.' };
    }
    // Fetch role from profile and set cookie
    const db = await store();
    const profile = await db.getProfile();
    const jar = await cookies();
    jar.set(ROLE_COOKIE, 'user', cookieBase);
  } else {
    // Demo fallback
    const jar = await cookies();
    jar.set(UID_COOKIE, 'usr_zain', cookieBase);
    jar.set(ONB_COOKIE, '1', cookieBase);
    jar.set(ROLE_COOKIE, 'user', cookieBase);
  }

  redirect(safeRedirect(form.get('redirect')));
}

/* ------------------------------------------------------------------- sign up */

export async function signUpAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const rateLimit = await checkRateLimit('signup');
  if (!rateLimit.allowed) {
    return { error: createRateLimitError(rateLimit.resetAt) };
  }

  const parsed = z
    .object({
      fullName: z.string().min(2, 'Enter your name.'),
      email: z.string().email('Enter a valid email address.'),
      whatsapp,
      password: z.string().min(8, 'Use at least 8 characters.'),
      ref: z.string().optional(),
    })
    .safeParse({
      fullName: form.get('fullName'),
      email: form.get('email'),
      whatsapp: form.get('whatsapp'),
      password: form.get('password'),
      ref: form.get('ref') || undefined,
    });
  if (!parsed.success) return { error: firstError(parsed.error.issues) };

  const supabase = await createClient();

  if (supabase) {
    const result = await withRetry(
      () => supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
          data: { full_name: parsed.data.fullName, whatsapp: parsed.data.whatsapp },
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001'}/auth/confirm`,
        },
      }),
      'SIGNUP',
    );
    if (result?.error) {
      console.error('[SIGNUP ERROR]', result.error.message);
      return { error: result.error.message.includes('already registered') ? 'An account with this email already exists.' : result.error.message };
    }
    if (!result) {
      return { error: 'Network error. Check your connection and try again.' };
    }

    const data = result.data;

    // If email confirmation is required, data.session will be null.
    if (!data.session) {
      return { ok: true, emailConfirmation: true, email: parsed.data.email };
    }

    // Handle referral: store the referral code for later credit awarding.
    if (parsed.data.ref && data.user) {
      const db = await store();
      await db.awardReferral(parsed.data.ref, data.user.id, parsed.data.fullName);
    }
  } else {
    // Demo fallback
    const jar = await cookies();
    jar.set(UID_COOKIE, 'usr_zain', cookieBase);
    jar.set(WA_COOKIE, parsed.data.whatsapp, { ...cookieBase, maxAge: 60 * 60 });
    jar.set(ROLE_COOKIE, 'user', cookieBase);
  }

  const to = safeRedirect(form.get('redirect'), '/onboarding');
  redirect(to === '/onboarding' ? to : `/onboarding?redirect=${encodeURIComponent(to)}`);
}

/* ------------------------------------------------------------- onboarding */

export async function completeOnboardingAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const parsed = whatsapp.safeParse(form.get('whatsapp'));
  if (!parsed.success) return { error: firstError(parsed.error.issues) };

  const supabase = await createClient();

  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const db = await store();
      await db.updateProfile({ whatsapp: parsed.data });
    }
  } else {
    const db = await store();
    await db.updateProfile({ whatsapp: parsed.data });
  }

  const jar = await cookies();
  jar.set(ONB_COOKIE, '1', cookieBase);
  jar.delete(WA_COOKIE);
  redirect(safeRedirect(form.get('redirect')));
}

/* ---------------------------------------------------------------- sign out */

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();

  if (supabase) {
    await supabase.auth.signOut();
  }

  const jar = await cookies();
  jar.delete(UID_COOKIE);
  jar.delete(ONB_COOKIE);
  jar.delete(WA_COOKIE);
  jar.delete(ROLE_COOKIE);
  redirect('/login');
}

/* ------------------------------------------------------------ forgot password */

export async function forgotAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const rateLimit = await checkRateLimit('forgot');
  if (!rateLimit.allowed) {
    return { error: createRateLimitError(rateLimit.resetAt) };
  }

  const parsed = z.string().email('Enter a valid email address.').safeParse(form.get('email'));
  if (!parsed.success) return { error: firstError(parsed.error.issues) };

  const supabase = await createClient();

  if (supabase) {
    const result = await withRetry(
      () => supabase.auth.resetPasswordForEmail(parsed.data, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001'}/reset-password`,
      }),
      'FORGOT',
    );
    if (result?.error) {
      console.error('[FORGOT ERROR]', result.error.message);
      return { error: result.error.message };
    }
    if (!result) {
      return { error: 'Network error. Check your connection and try again.' };
    }
  }

  return { ok: true };
}

/* ------------------------------------------------------------ reset password */

export async function resetAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const rateLimit = await checkRateLimit('reset');
  if (!rateLimit.allowed) {
    return { error: createRateLimitError(rateLimit.resetAt) };
  }

  const parsed = z.string().min(8, 'Use at least 8 characters.').safeParse(form.get('password'));
  if (!parsed.success) return { error: firstError(parsed.error.issues) };
  if (form.get('confirm') !== parsed.data) return { error: 'Passwords do not match.' };

  const supabase = await createClient();

  if (supabase) {
    const result = await withRetry(
      () => supabase.auth.updateUser({ password: parsed.data }),
      'RESET',
    );
    if (result?.error) {
      console.error('[RESET ERROR]', result.error.message);
      return { error: result.error.message };
    }
    if (!result) {
      return { error: 'Network error. Check your connection and try again.' };
    }
  }

  return { ok: true };
}

/* ---------------------------------------------------------- resend confirmation */

export async function resendConfirmationAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const rateLimit = await checkRateLimit('resend');
  if (!rateLimit.allowed) {
    return { error: createRateLimitError(rateLimit.resetAt) };
  }

  const parsed = z.string().email('Enter a valid email address.').safeParse(form.get('email'));
  if (!parsed.success) return { error: firstError(parsed.error.issues) };

  const supabase = await createClient();
  if (!supabase) return { error: 'Resend requires Supabase.' };

  const result = await withRetry(
    () => supabase.auth.resend({
      type: 'signup',
      email: parsed.data,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001'}/auth/confirm`,
      },
    }),
    'RESEND',
  );
  if (result?.error) {
    console.error('[RESEND ERROR]', result.error.message);
    return { error: result.error.message };
  }
  if (!result) return { error: 'Network error. Check your connection and try again.' };

  return { ok: true };
}

/* ------------------------------------------------------------ change password (logged in) */

export async function changePasswordAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const rateLimit = await checkRateLimit('change-password');
  if (!rateLimit.allowed) {
    return { error: createRateLimitError(rateLimit.resetAt) };
  }

  const current = String(form.get('currentPassword') ?? '');
  const newPassword = String(form.get('newPassword') ?? '');
  const confirm = String(form.get('confirmPassword') ?? '');

  if (!current) return { error: 'Enter your current password.' };
  if (newPassword.length < 8) return { error: 'New password must be at least 8 characters.' };
  if (newPassword !== confirm) return { error: 'Passwords do not match.' };
  if (current === newPassword) return { error: 'New password must be different from current.' };

  const supabase = await createClient();
  if (!supabase) return { error: 'Password change requires Supabase. Demo mode password is always "demo".' };

  const sessionResult = await withRetry(() => supabase.auth.getSession(), 'SESSION');
  const email = sessionResult?.data?.session?.user?.email;
  if (!email) return { error: 'No active session.' };

  const signInResult = await withRetry(
    () => supabase.auth.signInWithPassword({ email, password: current }),
    'CHANGE_PWD',
  );
  if (signInResult?.error) return { error: 'Current password is incorrect.' };
  if (!signInResult) return { error: 'Network error. Check your connection and try again.' };

  const result = await withRetry(
    () => supabase.auth.updateUser({ password: newPassword }),
    'CHANGE_PWD',
  );
  if (result?.error) {
    console.error('[CHANGE PASSWORD ERROR]', result.error.message);
    return { error: result.error.message };
  }
  if (!result) return { error: 'Network error. Check your connection and try again.' };

  return { ok: true };
}
