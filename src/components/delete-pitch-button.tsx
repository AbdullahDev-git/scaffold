'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deletePitchAction } from '@/lib/actions';
import { Trash } from './icons';

export function DeletePitchButton({ pitchId, clientName }: { pitchId: string; clientName: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();

  const handleDelete = () => {
    if (!window.confirm(`Delete "${clientName}"? This cannot be undone.`)) return;
    start(async () => {
      await deletePitchAction(pitchId);
      router.refresh();
    });
  };

  return (
    <button
      className="btn-icon text-[var(--ash)] hover:text-[#c7443c]"
      onClick={handleDelete}
      disabled={pending}
      title={`Delete ${clientName}`}
      aria-label={`Delete ${clientName}`}
    >
      <Trash className="h-4 w-4" />
    </button>
  );
}
