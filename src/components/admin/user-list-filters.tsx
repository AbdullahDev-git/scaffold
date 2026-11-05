'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import type { UserRole } from '@/lib/schema';

export function UserListFilters({ search, tier, role }: { search: string; tier?: string; role?: UserRole }) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(search);

  const apply = (key: string, value: string) => {
    const sp = new URLSearchParams(params.toString());
    if (value) sp.set(key, value);
    else sp.delete(key);
    sp.delete('page');
    router.push(`/admin/users?${sp.toString()}`);
  };

  const handleSearch = () => {
    apply('search', q);
  };

  return (
    <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap', alignItems: 'center' }}>
      <input
        className="input"
        placeholder="Search users..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        style={{ maxWidth: 280 }}
      />
      <select
        className="select"
        value={tier ?? ''}
        onChange={(e) => apply('tier', e.target.value)}
        style={{ maxWidth: 150 }}
      >
        <option value="">All tiers</option>
        <option value="free">Free</option>
        <option value="pro">Pro</option>
      </select>
      <select
        className="select"
        value={role ?? ''}
        onChange={(e) => apply('role', e.target.value)}
        style={{ maxWidth: 150 }}
      >
        <option value="">All roles</option>
        <option value="user">User</option>
        <option value="admin">Admin</option>
        <option value="super_admin">Super admin</option>
      </select>
    </div>
  );
}
