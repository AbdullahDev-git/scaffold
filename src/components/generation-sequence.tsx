'use client';

import { useEffect, useState } from 'react';
import { Check } from './icons';

const STEPS: [string, string][] = [
  ['Reading the brief', 'Pulled trade, location and the one action the client wants'],
  ['Building the layout', 'Picked a structure that suits the trade'],
  ['Assembling screens', 'Screens wired together and checked against the schema'],
];

/**
 * The one designed motion moment in the product. Driven by the pending state of
 * the server action that generates the package.
 */
export function GenerationSequence({
  pending,
  clientName = 'this client',
}: {
  pending: boolean;
  clientName?: string;
}) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!pending) {
      setStep(0);
      return;
    }
    const a = setTimeout(() => setStep(1), 2400);
    const b = setTimeout(() => setStep(2), 5000);
    const c = setTimeout(() => setStep(3), 7400);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
      clearTimeout(c);
    };
  }, [pending]);

  if (!pending) return null;
  const pct = Math.min(100, Math.round((step / STEPS.length) * 100));

  return (
    <div className="fixed inset-0 z-[70] bg-[color:var(--ink)]" role="status" aria-live="polite">
      <div className="gen" style={{ marginLeft: 'var(--rail)' }}>
        <div className="mb-10">
          <h1 className="h1">Building the pitch for {clientName}</h1>
          <p className="muted mt-2 text-[14.5px]">Stay on this screen. It takes about ten seconds.</p>
        </div>

        <div className="flex flex-col">
          {STEPS.map(([title, note], i) => {
            const state = i < step ? 'done' : i === step ? 'active' : 'idle';
            return (
              <div className="step" data-state={state} key={title}>
                <div className="step-gutter">
                  <div className="step-num">{i < step ? <Check /> : i + 1}</div>
                  <div className="step-rail" />
                </div>
                <div className="step-body">
                  <div className="step-title">{title}</div>
                  <div className="step-note">{i < step ? note : 'working'}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-3.5 flex items-center gap-[18px]">
          <div className="gen-progress">
            <i style={{ width: `${pct}%` }} />
          </div>
          <span className="gen-pct">{String(pct).padStart(2, '0')}%</span>
        </div>
      </div>
    </div>
  );
}
