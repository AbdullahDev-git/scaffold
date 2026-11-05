'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export function PitchListFilters({ search, status }: { search: string; status?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(search);

  const apply = (key: string, value: string) => {
    const sp = new URLSearchParams(params.toString());
    if (value) sp.set(key, value);
    else sp.delete(key);
    sp.delete('page');
    router.push(`/admin/pitches?${sp.toString()}`);
  };

  return (
    <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap', alignItems: 'center' }}>
      <input
        className="input"
        placeholder="Search pitches..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && apply('search', q)}
        style={{ maxWidth: 280 }}
      />
      <select
        className="select"
        value={status ?? ''}
        onChange={(e) => apply('status', e.target.value)}
        style={{ maxWidth: 180 }}
      >
        <option value="">All statuses</option>
        <option value="created">Created</option>
        <option value="sent">Sent</option>
        <option value="viewed">Viewed</option>
        <option value="in_discussion">In discussion</option>
        <option value="won">Won</option>
        <option value="lost">Lost</option>
      </select>
    </div>
  );
}
