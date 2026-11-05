'use client';

import { useEffect, useState } from 'react';

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
    <div className="min-h-screen flex items-center justify-center bg-[color:var(--ink)]">
      <div className="max-w-md w-full p-6 text-center">
        <h2 className="h2 mb-3">Something went wrong</h2>
        <p className="muted mb-6">{message}</p>
        <button
          className="btn btn-primary"
          onClick={() => {
            reset();
            window.location.reload();
          }}
        >
          Try again
        </button>
      </div>
    </div>
  );
}
