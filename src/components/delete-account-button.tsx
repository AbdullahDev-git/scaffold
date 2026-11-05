'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteAccountAction } from '@/lib/actions';

export function DeleteAccountButton() {
  const [pending, start] = useTransition();
  const router = useRouter();

  const handleDelete = () => {
    if (!window.confirm('Delete your account? All your pitches, data, and credits will be permanently removed. This cannot be undone.')) return;
    start(async () => {
      await deleteAccountAction();
      router.push('/login');
    });
  };

  return (
    <button
      className="btn btn-ghost text-[#c7443c] hover:bg-[#c7443c]/10"
      onClick={handleDelete}
      disabled={pending}
    >
      {pending ? 'Deleting…' : 'Delete account'}
    </button>
  );
}
