'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Back } from '@/components/icons';

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  const [message, setMessage] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    setMessage(error.message ?? 'Something went wrong.');
  }, [error.message]);

  return (
    <div className="view min-h-screen flex flex-col items-center justify-center text-center">
      <div className="max-w-md w-full p-6">
        <h2 className="h2 mb-3">Something went wrong</h2>
        <p className="muted mb-4">{message}</p>
        <div className="flex flex-col gap-3">
          <button
            className="btn btn-primary"
            onClick={() => {
              reset();
              router.refresh();
            }}
          >
            Try again
          </button>
          <Link className="btn btn-ghost" href="/dashboard">
            <Back />
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
