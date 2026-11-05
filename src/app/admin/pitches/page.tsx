import Link from 'next/link';
import { adminStore } from '@/lib/db';
import type { PitchStatus } from '@/lib/schema';
import { PitchListFilters } from '@/components/admin/pitch-list-filters';

export default async function AdminPitches({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? '1', 10));
  const search = params.search ?? '';
  const status = (params.status as PitchStatus | undefined) ?? undefined;

  const adb = await adminStore();
  const { pitches, total } = await adb.listAllPitches({ page, pageSize: 20, search, status });
  const totalPages = Math.ceil(total / 20);

  return (
    <>
      <div className="view-head">
        <div>
          <h1 className="h1">Pitches</h1>
          <p className="view-sub">{total} total pitches across all users</p>
        </div>
      </div>

      <PitchListFilters search={search} status={status} />

      <table className="table" style={{ marginTop: 16 }}>
        <thead>
          <tr>
            <th>Client</th>
            <th>Industry</th>
            <th>Owner</th>
            <th>Status</th>
            <th>Provider</th>
            <th>Views</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {pitches.map((p) => (
            <tr key={p.id}>
              <td>
                <Link href={`/admin/pitches/${p.id}`} className="cell cell-client">
                  {p.clientName}
                </Link>
              </td>
              <td className="cell-meta">{p.industry}</td>
              <td className="cell-meta">{p.id.slice(0, 12)}</td>
              <td><span className={`badge badge-${p.status}`}>{p.status}</span></td>
              <td className="cell-meta">{p.provider ?? '—'}</td>
              <td className="cell-meta">{p.views.length}</td>
              <td className="cell-meta">{new Date(p.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
          {pitches.length === 0 && (
            <tr><td colSpan={7} className="cell-meta" style={{ padding: 24, textAlign: 'center' }}>No pitches found.</td></tr>
          )}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'center' }}>
          {page > 1 && (
            <Link href={`/admin/pitches?page=${page - 1}${search ? `&search=${search}` : ''}${status ? `&status=${status}` : ''}`} className="btn btn-ghost btn-sm">
              Previous
            </Link>
          )}
          <span className="cell-meta" style={{ alignSelf: 'center' }}>Page {page} of {totalPages}</span>
          {page < totalPages && (
            <Link href={`/admin/pitches?page=${page + 1}${search ? `&search=${search}` : ''}${status ? `&status=${status}` : ''}`} className="btn btn-ghost btn-sm">
              Next
            </Link>
          )}
        </div>
      )}
    </>
  );
}
