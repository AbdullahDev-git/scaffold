'use client';

import { useState } from 'react';

export function ConfirmClient({ redirectTo }: { redirectTo: string }) {
  const [status, setStatus] = useState<'idle' | 'confirming' | 'done'>('idle');
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    setStatus('confirming');

    // The token is already verified server-side when this page loaded.
    // The session cookie is now set. We just need to close this tab
    // and let the original tab detect the session.
    try {
      // Small delay so the user sees the "confirmed" state
      await new Promise((r) => setTimeout(r, 500));
      setStatus('done');
      await new Promise((r) => setTimeout(r, 1000));
      window.close();
    } catch {
      setError('Could not close this tab. You can close it manually.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f0e0b]">
      <div className="w-full max-w-sm text-center">
        {status === 'done' ? (
          <>
            <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
              <svg className="h-8 w-8 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h1 className="text-[23px] font-semibold tracking-[-0.02em] text-[var(--ink)]">Email confirmed</h1>
            <p className="muted mt-2 text-sm">
              This tab will close automatically. Your dashboard is ready in the other tab.
            </p>
          </>
        ) : (
          <>
            <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10">
              <svg className="h-7 w-7 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <h1 className="text-[23px] font-semibold tracking-[-0.02em] text-[var(--ink)]">Confirm your email</h1>
            <p className="muted mt-2 text-sm">
              Click below to verify your account and close this tab.
            </p>
            {error ? <p className="form-error mt-4">{error}</p> : null}
            <button
              className="btn btn-primary btn-lg mt-6 w-full justify-center"
              onClick={handleConfirm}
              disabled={status === 'confirming'}
            >
              {status === 'confirming' ? 'Confirming…' : 'Confirm email'}
            </button>
            <p className="muted mt-4 text-[13.5px]">
              This tab will close after confirmation. Your dashboard will appear in the original tab.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
