'use client';

import { useState } from 'react';
import { Check, Copy } from './icons';

export function CopyButton({ value, label = 'Copy link', variant = 'btn-primary' }: { value: string; label?: string; variant?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      className={`btn ${variant}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
        } catch {
          /* clipboard blocked — the field is selectable either way */
        }
        setDone(true);
        setTimeout(() => setDone(false), 1800);
      }}
    >
      {done ? <Check /> : <Copy />}
      {done ? 'Copied' : label}
    </button>
  );
}
