'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setStatusAction, duplicatePitchAction, regeneratePitchAction } from '@/lib/actions';
import { PITCH_STATUSES, STATUS_LABEL, type PitchStatus } from '@/lib/schema';
import { Dup, Refresh } from './icons';

export function StatusSelect({ pitchId, status }: { pitchId: string; status: PitchStatus }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <select
      className="select w-auto min-w-[168px]"
      defaultValue={status}
      disabled={pending}
      aria-label="Pitch status"
      onChange={(e) =>
        start(async () => {
          await setStatusAction(pitchId, e.target.value as PitchStatus);
          router.refresh();
        })
      }
    >
      {PITCH_STATUSES.map((s) => (
        <option key={s} value={s}>
          {STATUS_LABEL[s]}
        </option>
      ))}
    </select>
  );
}

export function PitchActions({ pitchId, credits }: { pitchId: string; credits: number }) {
  const [pending, start] = useTransition();
  return (
    <div className="stack-actions">
      <button
        className="btn btn-ghost"
        disabled={pending || credits <= 0}
        title={credits <= 0 ? 'No credits left this month' : undefined}
        onClick={() => start(async () => {
          await regeneratePitchAction(pitchId);
        })}
      >
        <Refresh />
        Regenerate prototype
      </button>
      <button className="btn btn-ghost" disabled={pending} onClick={() => start(() => duplicatePitchAction(pitchId))}>
        <Dup />
        Duplicate for another client
      </button>
    </div>
  );
}
