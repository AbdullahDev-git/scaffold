'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { promoteUserAction, demoteUserAction, grantCreditsAction, changeUserTierAction, adminDeleteUserAction } from '@/lib/admin-actions';
import type { Profile, UserRole } from '@/lib/schema';

export function UserActions({ user }: { user: Profile & { role: UserRole } }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const act = (fn: () => Promise<{ error?: string }>) => {
    startTransition(async () => {
      const result = await fn();
      if (result.error) {
        alert(result.error);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div className="admin-section">
      <h2 className="admin-section-title">Actions</h2>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {user.role === 'user' ? (
          <button className="btn btn-ghost" disabled={pending} onClick={() => act(() => promoteUserAction(user.id))}>
            Promote to admin
          </button>
        ) : user.role === 'admin' ? (
          <button className="btn btn-ghost" disabled={pending} onClick={() => act(() => demoteUserAction(user.id))}>
            Demote to user
          </button>
        ) : null}

        {user.tier === 'free' ? (
          <button className="btn btn-ghost" disabled={pending} onClick={() => act(() => changeUserTierAction(user.id, 'pro'))}>
            Upgrade to Pro
          </button>
        ) : (
          <button className="btn btn-ghost" disabled={pending} onClick={() => act(() => changeUserTierAction(user.id, 'free'))}>
            Downgrade to Free
          </button>
        )}

        <button className="btn btn-ghost" disabled={pending} onClick={() => {
          const amount = prompt('Credits to grant (1-100):');
          if (amount) act(() => grantCreditsAction(user.id, parseInt(amount, 10)));
        }}>
          Grant credits
        </button>

        <button
          className="btn"
          disabled={pending}
          style={{ color: 'var(--ember)', borderColor: 'var(--ember-line)' }}
          onClick={() => {
            if (confirm(`Delete ${user.fullName || user.email}? This cannot be undone.`)) {
              act(() => adminDeleteUserAction(user.id));
            }
          }}
        >
          Delete user
        </button>
      </div>
    </div>
  );
}
