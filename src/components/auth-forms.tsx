'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useState } from 'react';
import {
  completeOnboardingAction,
  forgotAction,
  resendConfirmationAction,
  resetAction,
  signInAction,
  signUpAction,
} from '@/lib/auth-actions';
import { getBrowserClient } from '@/lib/supabase-browser';
import type { ActionState } from '@/lib/actions';

const carry = (to?: string) => (to ? `?redirect=${encodeURIComponent(to)}` : '');

/* ------------------------------------------------- signup confirmation screen */

function SignupConfirmation({ email }: { email: string }) {
  const router = useRouter();
  const [confirmed, setConfirmed] = useState(false);

  // Poll for session — when the user confirms in the other tab,
  // the session cookie gets set and we detect it here.
  useEffect(() => {
    const supabase = getBrowserClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        setConfirmed(true);
        setTimeout(() => router.push('/dashboard'), 800);
      }
    });

    // Also poll every 2 seconds as a fallback
    const interval = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setConfirmed(true);
        clearInterval(interval);
        router.push('/dashboard');
      }
    }, 2000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, [router]);

  if (confirmed) {
    return (
      <>
        <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
          <svg className="h-8 w-8 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h2 className="text-[23px] font-semibold tracking-[-0.02em]">Email confirmed</h2>
        <p className="muted mt-2 text-sm">Taking you to your dashboard…</p>
      </>
    );
  }

  return (
    <>
      <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10">
        <svg className="h-7 w-7 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
        </svg>
      </div>
      <h2 className="text-[23px] font-semibold tracking-[-0.02em]">Check your email</h2>
      <p className="muted mb-[26px] mt-1.5 text-sm">
        We sent a confirmation link to <span className="font-medium text-[var(--ink)]">{email}</span>.
      </p>
      <div className="rounded-lg border border-[color:var(--hairline)] bg-[color:var(--panel)] p-4 text-[13.5px] leading-relaxed">
        <p>
          Click the link in the email to verify your account. The link expires in <strong>15 minutes</strong>.
        </p>
        <p className="muted mt-2">
          After confirming, this tab will automatically take you to your dashboard.
        </p>
      </div>
      <p className="muted mt-5 text-[13.5px]">
        Already confirmed?{' '}
        <Link className="link" href="/login">
          Log in
        </Link>
      </p>
    </>
  );
}

/* ------------------------------------------------------------------- login */

export function LoginForm({ redirectTo, authError }: { redirectTo?: string; authError?: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(signInAction, {});
  const [resendState, resendAction, resendPending] = useActionState<ActionState, FormData>(resendConfirmationAction, {});
  const [showResend, setShowResend] = useState(false);
  const [email, setEmail] = useState('');

  const needsConfirmation =
    state.error?.toLowerCase().includes('email not confirmed') ||
    authError?.toLowerCase().includes('email not confirmed');

  return (
    <>
      <h2 className="text-[23px] font-semibold tracking-[-0.02em]">Log in</h2>
      <p className="muted mb-[26px] mt-1.5 text-sm">Pick up where you left off.</p>

      {authError ? <p className="form-error mb-4">{authError}</p> : null}
      {state.error ? <p className="form-error mb-4">{state.error}</p> : null}

      {needsConfirmation ? (
        <div className="mb-4 rounded-lg border border-amber-500/25 bg-amber-500/5 p-4">
          <p className="text-sm text-amber-600">
            Your email hasn&apos;t been confirmed yet. Check your inbox (and spam folder) for a
            confirmation link.
          </p>
          {showResend ? (
            <form action={resendAction} className="mt-3">
              <input type="hidden" name="email" value={email} />
              <button className="btn btn-primary btn-sm" disabled={resendPending || resendState.ok}>
                {resendPending ? 'Sending…' : resendState.ok ? 'Link sent ✓' : 'Resend confirmation email'}
              </button>
              {resendState.error ? <p className="form-error mt-2">{resendState.error}</p> : null}
            </form>
          ) : (
            <button
              className="link mt-2 text-[13px] text-amber-600"
              onClick={() => setShowResend(true)}
            >
              Resend confirmation email
            </button>
          )}
        </div>
      ) : null}

      <form action={action}>
        {redirectTo ? <input type="hidden" name="redirect" value={redirectTo} /> : null}
        <label className="field">
          <span className="field-label">Email</span>
          <input
            className="input"
            type="email"
            name="email"
            placeholder="you@studio.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="field">
          <span className="field-label">Password</span>
          <input className="input" type="password" name="password" placeholder="••••••••" required />
          <Link className="field-hint link mt-1.5 inline-block" href="/forgot-password">
            Forgot password?
          </Link>
        </label>
        <button className="btn btn-primary btn-lg w-full justify-center" disabled={pending}>
          {pending ? 'Logging in' : 'Log in'}
        </button>
      </form>

      <p className="muted mt-5 text-[13.5px]">
        Don&apos;t have an account?{' '}
        <Link className="link" href={`/signup${carry(redirectTo)}`}>
          Sign up
        </Link>
      </p>
    </>
  );
}

/* ------------------------------------------------------------------ signup */

export function SignupForm({ refCode, redirectTo }: { refCode?: string; redirectTo?: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(signUpAction, {});

  if (state.ok && state.emailConfirmation) {
    return <SignupConfirmation email={state.email!} />;
  }

  return (
    <>
      <h2 className="text-[23px] font-semibold tracking-[-0.02em]">Create your account</h2>
      <p className="muted mb-[26px] mt-1.5 text-sm">Five free pitches a month. No card.</p>

      {refCode ? (
        <p className="ref-strip">
          Referral code applied — <span className="mono">{refCode}</span>
        </p>
      ) : null}

      {state.error ? <p className="form-error mb-4">{state.error}</p> : null}

      <form action={action}>
        {refCode ? <input type="hidden" name="ref" value={refCode} /> : null}
        {redirectTo ? <input type="hidden" name="redirect" value={redirectTo} /> : null}
        <label className="field">
          <span className="field-label">Full name</span>
          <input className="input" name="fullName" placeholder="Zain Abbas" required />
        </label>
        <label className="field">
          <span className="field-label">Email</span>
          <input className="input" type="email" name="email" placeholder="you@studio.com" required />
        </label>
        <label className="field">
          <span className="field-label">WhatsApp number</span>
          <input className="input input-mono" name="whatsapp" placeholder="+92 300 0000 000" required />
          <span className="field-hint">This is how your clients will reach you when they open a pitch.</span>
        </label>
        <label className="field">
          <span className="field-label">Password</span>
          <input className="input" type="password" name="password" placeholder="At least 8 characters" required />
        </label>
        <button className="btn btn-primary btn-lg w-full justify-center" disabled={pending}>
          {pending ? 'Creating account' : 'Create account'}
        </button>
      </form>

      <p className="muted mt-5 text-[13.5px]">
        Already have an account?{' '}
        <Link className="link" href={`/login${carry(redirectTo)}`}>
          Log in
        </Link>
      </p>
    </>
  );
}

/* --------------------------------------------------------- forgot password */

export function ForgotForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(forgotAction, {});
  const [email, setEmail] = useState('');

  if (state.ok) {
    return (
      <>
        <h2 className="text-[23px] font-semibold tracking-[-0.02em]">Check your inbox</h2>
        <p className="muted mb-[26px] mt-1.5 text-sm">
          A reset link is on its way to {email}. It expires in 30 minutes.
        </p>
        <p className="muted text-[13.5px]">
          Didn&apos;t get it? Check your spam folder, or{' '}
          <button className="link" onClick={() => window.location.reload()}>
            try again
          </button>
          .
        </p>
      </>
    );
  }

  return (
    <>
      <h2 className="text-[23px] font-semibold tracking-[-0.02em]">Reset your password</h2>
      <p className="muted mb-[26px] mt-1.5 text-sm">One field, one link, back to work.</p>

      {state.error ? <p className="form-error mb-4">{state.error}</p> : null}

      <form action={action}>
        <label className="field">
          <span className="field-label">Email</span>
          <input
            className="input"
            type="email"
            name="email"
            placeholder="you@studio.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <button className="btn btn-primary btn-lg w-full justify-center" disabled={pending}>
          {pending ? 'Sending link' : 'Send reset link'}
        </button>
      </form>

      <p className="muted mt-5 text-[13.5px]">
        Remembered it after all?{' '}
        <Link className="link" href="/login">
          Log in
        </Link>
      </p>
    </>
  );
}

/* ---------------------------------------------------------- reset password */

export function ResetForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(resetAction, {});

  if (state.ok) {
    return (
      <>
        <h2 className="text-[23px] font-semibold tracking-[-0.02em]">Password updated</h2>
        <p className="muted mb-[26px] mt-1.5 text-sm">Your password is new. Use it to log in.</p>
        <Link className="btn btn-primary btn-lg w-full justify-center" href="/login">
          Go to log in
        </Link>
      </>
    );
  }

  return (
    <>
      <h2 className="text-[23px] font-semibold tracking-[-0.02em]">Set a new password</h2>
      <p className="muted mb-[26px] mt-1.5 text-sm">
        Reset link accepted — token <span className="mono text-[12.5px]">{token.slice(0, 10)}…</span>
      </p>

      {state.error ? <p className="form-error mb-4">{state.error}</p> : null}

      <form action={action}>
        <input type="hidden" name="token" value={token} />
        <label className="field">
          <span className="field-label">New password</span>
          <input className="input" type="password" name="password" placeholder="At least 8 characters" required />
        </label>
        <label className="field">
          <span className="field-label">Confirm password</span>
          <input className="input" type="password" name="confirm" placeholder="Once more" required />
        </label>
        <button className="btn btn-primary btn-lg w-full justify-center" disabled={pending}>
          {pending ? 'Saving' : 'Set new password'}
        </button>
      </form>
    </>
  );
}

/* -------------------------------------------------------------- onboarding */

const HOW = [
  {
    n: '01',
    t: 'Write the brief',
    d: 'Two or three sentences about the client. That is genuinely all Scaffold needs.',
  },
  {
    n: '02',
    t: 'Send the link',
    d: 'A clickable prototype with your name on it, one WhatsApp message away.',
  },
  {
    n: '03',
    t: 'See it open',
    d: 'You get the timing of every view, so you follow up while it is still hot.',
  },
];

export function OnboardingFlow({
  initialWhatsapp,
  redirectTo,
}: {
  initialWhatsapp?: string;
  redirectTo?: string;
}) {
  const [step, setStep] = useState(0);
  const [whatsapp, setWhatsapp] = useState(initialWhatsapp ?? '');
  const [state, action, pending] = useActionState<ActionState, FormData>(completeOnboardingAction, {});

  return (
    <>
      <div className="onb-dots" aria-hidden>
        <span className="onb-dot" data-on={step === 0} />
        <span className="onb-dot" data-on={step === 1} />
      </div>

      {step === 0 ? (
        <>
          <h2 className="text-[23px] font-semibold tracking-[-0.02em]">Confirm your WhatsApp number</h2>
          <p className="muted mb-[26px] mt-1.5 text-sm">
            Clients reach you here the moment they open a pitch.
          </p>

          {state.error ? <p className="form-error mb-4">{state.error}</p> : null}

          <label className="field">
            <span className="field-label">WhatsApp number</span>
            <input
              className="input input-mono"
              name="whatsapp-preview"
              placeholder="+92 300 0000 000"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
            />
          </label>
          <button
            className="btn btn-primary btn-lg mt-2 w-full justify-center"
            onClick={() => setStep(1)}
          >
            Continue
          </button>
          <p className="muted mt-5 text-[13.5px]">Step 1 of 2 — the number is editable later in settings.</p>
        </>
      ) : (
        <>
          <h2 className="text-[23px] font-semibold tracking-[-0.02em]">How Scaffold works</h2>
          <p className="muted mb-[26px] mt-1.5 text-sm">Three moves. Then straight to the dashboard.</p>

          <div className="onb-cards">
            {HOW.map((s) => (
              <div className="onb-card" key={s.n}>
                <span className="mkt-step-n">{s.n}</span>
                <div>
                  <h3 className="h3">{s.t}</h3>
                  <p className="muted mt-1 text-[13.5px] leading-relaxed">{s.d}</p>
                </div>
              </div>
            ))}
          </div>

          <form action={action}>
            <input type="hidden" name="whatsapp" value={whatsapp} />
            {redirectTo ? <input type="hidden" name="redirect" value={redirectTo} /> : null}
            <button className="btn btn-primary btn-lg mt-6 w-full justify-center" disabled={pending}>
              {pending ? 'Setting up' : 'Go to dashboard'}
            </button>
          </form>
        </>
      )}
    </>
  );
}
