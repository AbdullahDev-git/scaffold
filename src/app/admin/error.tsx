'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    setMessage(error.message ?? 'Something went wrong.');
  }, [error.message]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[color:var(--ink)] text-center p-6">
      <div className="max-w-md w-full">
        <h2 className="h2 mb-3">Something went wrong</h2>
        <p className="muted mb-4">{message}</p>
        <div className="flex flex-col gap-3">
          <button
            className="btn btn-primary"
            onClick={() => {
              reset();
              window.location.reload();
            }}
          >
            Try again
          </button>
          <Link className="link-quiet" href="/dashboard">
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
