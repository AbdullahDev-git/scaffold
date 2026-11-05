'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export function AuditFilter({ action }: { action?: string }) {
  const router = useRouter();
  const params = useSearchParams();

  const apply = (value: string) => {
    const sp = new URLSearchParams(params.toString());
    if (value) sp.set('action', value);
    else sp.delete('action');
    sp.delete('page');
    router.push(`/admin/audit?${sp.toString()}`);
  };

  return (
    <select
      className="select"
      value={action ?? ''}
      onChange={(e) => apply(e.target.value)}
      style={{ maxWidth: 220 }}
    >
      <option value="">All actions</option>
      <option value="user.promote">User promote</option>
      <option value="user.demote">User demote</option>
      <option value="user.delete">User delete</option>
      <option value="credit.grant">Credit grant</option>
      <option value="tier.change">Tier change</option>
      <option value="pitch.delete">Pitch delete</option>
      <option value="system.setting_update">Setting update</option>
    </select>
  );
}
