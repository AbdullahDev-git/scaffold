'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { adminDeletePitchAction } from '@/lib/admin-actions';

export function PitchActions({ pitchId }: { pitchId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="admin-section">
      <h2 className="admin-section-title">Actions</h2>
      <button
        className="btn"
        disabled={pending}
        style={{ color: 'var(--ember)', borderColor: 'var(--ember-line)' }}
        onClick={() => {
          if (confirm('Delete this pitch? This cannot be undone.')) {
            startTransition(async () => {
              const result = await adminDeletePitchAction(pitchId);
              if (result.error) alert(result.error);
              else router.push('/admin/pitches');
            });
          }
        }}
      >
        Delete pitch
      </button>
    </div>
  );
}
