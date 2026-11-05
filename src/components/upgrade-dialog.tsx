'use client';

import * as Dialog from '@radix-ui/react-dialog';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { upgradeAction } from '@/lib/actions';
import { Check, X } from './icons';

/** Fires at zero credits, or from the credits readout. Direct, not apologetic. */
export function UpgradeDialog({
  trigger,
  open,
  onOpenChange,
  credits = 0,
}: {
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
  /** drives the copy: out of pitches reads differently from browsing the plan */
  credits?: number;
}) {
  const [internal, setInternal] = useState(false);
  const isOpen = open ?? internal;
  const setOpen = onOpenChange ?? setInternal;
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <Dialog.Root open={isOpen} onOpenChange={setOpen}>
      {trigger ? <Dialog.Trigger asChild>{trigger}</Dialog.Trigger> : null}
      <Dialog.Portal>
        <Dialog.Overlay className="scrim">
          <Dialog.Content className="modal on-panel">
            <div className="flex items-start justify-between gap-4">
              <Dialog.Title className="text-[21px] font-semibold tracking-[-0.02em]">
                {credits > 0 ? 'Pitch as often as the work comes in.' : 'You are out of free pitches.'}
              </Dialog.Title>
              <Dialog.Close className="x-btn" aria-label="Close">
                <X />
              </Dialog.Close>
            </div>
            <Dialog.Description className="muted mt-[9px] text-sm leading-relaxed">
              {credits > 0
                ? `The free plan gives you 5 pitches a month and you have ${credits} left. Pro drops the cap and puts your own name on every prototype.`
                : 'You have used all 5 pitches on the free plan this month. They reset on 1 October. Move to Pro now and keep pitching today.'}
            </Dialog.Description>

            <ul className="unlocks">
              {[
                'Unlimited pitches, no monthly cap',
                'Your own domain and logo on every prototype',
                'Client view alerts on WhatsApp within seconds',
                '6 screens per prototype instead of 3',
              ].map((line) => (
                <li key={line}>
                  <Check />
                  <span>{line}</span>
                </li>
              ))}
            </ul>

            <div className="mb-5 flex items-baseline gap-2">
              <span className="price-amt">$12</span>
              <span className="muted text-[13.5px]">a month, cancel any time</span>
            </div>

            <div className="flex items-center gap-4">
              <button
                className="btn btn-primary btn-lg"
                disabled={pending}
                onClick={async () => {
                  setPending(true);
                  setError(null);
                  const result = await upgradeAction();
                  setPending(false);
                  if (result.url) {
                    setOpen(false);
                    router.push(result.url);
                  } else if (result.error) {
                    setError(result.error);
                  }
                }}
              >
                {pending ? 'Opening checkout' : 'Upgrade to Pro'}
              </button>
              {error ? (
                <span className="form-error mt-2">{error}</span>
              ) : null}
              <Link className="link-quiet" href="/referrals" onClick={() => setOpen(false)}>
                Or invite a developer for 2 credits
              </Link>
            </div>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
