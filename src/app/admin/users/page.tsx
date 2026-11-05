import Link from 'next/link';
import { adminStore } from '@/lib/db';
import type { UserRole } from '@/lib/schema';
import { UserListFilters } from '@/components/admin/user-list-filters';

export default async function AdminUsers({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? '1', 10));
  const search = params.search ?? '';
  const tier = (params.tier as 'free' | 'pro' | undefined) ?? undefined;
  const role = (params.role as UserRole | undefined) ?? undefined;

  const adb = await adminStore();
  const { users, total } = await adb.listUsers({ page, pageSize: 20, search, tier, role });
  const totalPages = Math.ceil(total / 20);

  return (
    <>
      <div className="view-head">
        <div>
          <h1 className="h1">Users</h1>
          <p className="view-sub">{total} registered users</p>
        </div>
      </div>

      <UserListFilters search={search} tier={tier} role={role} />

      <table className="table" style={{ marginTop: 16 }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Tier</th>
            <th>Credits</th>
            <th>Role</th>
            <th>Joined</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>
                <Link href={`/admin/users/${u.id}`} className="cell cell-client">
                  {u.fullName || '(no name)'}
                </Link>
              </td>
              <td className="cell-meta">{u.email}</td>
              <td>
                <span className={`badge badge-${u.tier === 'pro' ? 'won' : 'created'}`}>
                  {u.tier}
                </span>
              </td>
              <td className="cell-meta">{u.credits}</td>
              <td>
                <span className={`role-badge role-${u.role}`}>{u.role}</span>
              </td>
              <td className="cell-meta">{new Date(u.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr><td colSpan={6} className="cell-meta" style={{ padding: 24, textAlign: 'center' }}>No users found.</td></tr>
          )}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'center' }}>
          {page > 1 && (
            <Link href={`/admin/users?page=${page - 1}${search ? `&search=${search}` : ''}${tier ? `&tier=${tier}` : ''}${role ? `&role=${role}` : ''}`} className="btn btn-ghost btn-sm">
              Previous
            </Link>
          )}
          <span className="cell-meta" style={{ alignSelf: 'center' }}>Page {page} of {totalPages}</span>
          {page < totalPages && (
            <Link href={`/admin/users?page=${page + 1}${search ? `&search=${search}` : ''}${tier ? `&tier=${tier}` : ''}${role ? `&role=${role}` : ''}`} className="btn btn-ghost btn-sm">
              Next
            </Link>
          )}
        </div>
      )}
    </>
  );
}
