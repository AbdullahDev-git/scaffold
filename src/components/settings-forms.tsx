'use client';

import { useFormStatus } from 'react-dom';
import { useActionState, useState, useEffect } from 'react';
import * as Switch from '@radix-ui/react-switch';
import { saveProfileAction, type ActionState } from '@/lib/actions';
import { changePasswordAction } from '@/lib/auth-actions';
import { Check, Eye, EyeOff } from './icons';
import type { Profile } from '@/lib/schema';

export function ProfileSection({ profile }: { profile: Profile }) {
  const [state, action] = useActionState<ActionState, FormData>(saveProfileAction, {});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (state.fieldErrors) setSaved(false);
  }, [state]);

  return (
    <form action={(formData) => {
      setSaved(false);
      action(formData);
      // Assume success if no immediate error
      setTimeout(() => {
        if (!document.querySelector('.field-error')) setSaved(true);
      }, 600);
    }}>
      <div className="pair">
        <label className="field">
          <span className="field-label">Full name</span>
          <input className="input" name="fullName" defaultValue={profile.fullName} />
        </label>
        <label className="field">
          <span className="field-label">Studio or company</span>
          <input className="input" name="businessName" defaultValue={profile.businessName} />
        </label>
      </div>
      <label className="field">
        <span className="field-label">Email</span>
        <input className="input" type="email" defaultValue={profile.email} readOnly />
      </label>
      <label className="field">
        <span className="field-label">WhatsApp number</span>
        <input className="input input-mono" name="whatsapp" defaultValue={profile.whatsapp} />
        {state.fieldErrors?.whatsapp ? (
          <span className="field-error">{state.fieldErrors.whatsapp[0]}</span>
        ) : (
          <span className="field-hint">Clients reply here when they open a pitch.</span>
        )}
      </label>
      <SaveButton saved={saved} />
    </form>
  );
}

function SaveButton({ saved }: { saved: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-primary" disabled={pending}>
      {saved && !pending ? <Check /> : null}
      {pending ? 'Saving' : saved ? 'Saved' : 'Save changes'}
    </button>
  );
}

export function NotificationRow({ title, detail, defaultOn = false }: { title: string; detail: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="notif">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <span className="muted mt-0.5 block text-[13px]">{detail}</span>
      </div>
      <Switch.Root className="switch-root" checked={on} onCheckedChange={setOn} aria-label={title}>
        <Switch.Thumb className="switch-thumb" />
      </Switch.Root>
    </div>
  );
}

export function PasswordSection() {
  const [state, action] = useActionState<ActionState, FormData>(changePasswordAction, {});
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  return (
    <form action={action}>
      <div className="pair">
        <label className="field">
          <span className="field-label">Current password</span>
          <div style={{ position: 'relative' }}>
            <input className="input" name="currentPassword" type={showCurrent ? 'text' : 'password'} autoComplete="current-password" style={{ paddingRight: 36 }} />
            <button type="button" onClick={() => setShowCurrent((v) => !v)} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ash)' }} aria-label="Toggle current password visibility">
              {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </label>
      </div>
      <div className="pair">
        <label className="field">
          <span className="field-label">New password</span>
          <div style={{ position: 'relative' }}>
            <input className="input" name="newPassword" type={showNew ? 'text' : 'password'} autoComplete="new-password" style={{ paddingRight: 36 }} />
            <button type="button" onClick={() => setShowNew((v) => !v)} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ash)' }} aria-label="Toggle new password visibility">
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </label>
        <label className="field">
          <span className="field-label">Confirm new password</span>
          <input className="input" name="confirmPassword" type="password" autoComplete="new-password" />
        </label>
      </div>
      {state.error && <p className="field-error" style={{ marginBottom: 12 }}>{state.error}</p>}
      {state.ok && <p style={{ color: 'var(--signal)', fontSize: 13.5, marginBottom: 12 }}>Password updated.</p>}
      <PasswordSaveButton />
    </form>
  );
}

function PasswordSaveButton() {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-primary" disabled={pending}>
      {pending ? 'Updating...' : 'Update password'}
    </button>
  );
}
