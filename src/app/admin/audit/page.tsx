import Link from 'next/link';
import { adminStore } from '@/lib/db';
import { AuditFilter } from '@/components/admin/audit-filter';

export default async function AdminAudit({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? '1', 10));
  const action = params.action ?? undefined;

  const adb = await adminStore();
  const { entries, total } = await adb.listAuditLog({ page, pageSize: 30, action });
  const totalPages = Math.ceil(total / 30);

  return (
    <>
      <h1 className="h1">Audit Log</h1>
      <p className="view-sub">{total} recorded actions</p>

      <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <AuditFilter action={action} />
      </div>

      <table className="table" style={{ marginTop: 16 }}>
        <thead>
          <tr>
            <th>Time</th>
            <th>Action</th>
            <th>Target</th>
            <th>Actor</th>
            <th>Detail</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.id}>
              <td className="cell-meta">{new Date(e.createdAt).toLocaleString()}</td>
              <td><span className="badge badge-sent">{e.action}</span></td>
              <td className="cell-meta">{e.targetType}{e.targetId ? ` / ${e.targetId.slice(0, 12)}` : ''}</td>
              <td className="cell-meta mono">{e.actorId.slice(0, 12)}</td>
              <td className="cell-meta" style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {Object.keys(e.detail).length > 0 ? JSON.stringify(e.detail) : '—'}
              </td>
            </tr>
          ))}
          {entries.length === 0 && (
            <tr><td colSpan={5} className="cell-meta" style={{ padding: 24, textAlign: 'center' }}>No audit entries found.</td></tr>
          )}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'center' }}>
          {page > 1 && (
            <Link href={`/admin/audit?page=${page - 1}${action ? `&action=${action}` : ''}`} className="btn btn-ghost btn-sm">
              Previous
            </Link>
          )}
          <span className="cell-meta" style={{ alignSelf: 'center' }}>Page {page} of {totalPages}</span>
          {page < totalPages && (
            <Link href={`/admin/audit?page=${page + 1}${action ? `&action=${action}` : ''}`} className="btn btn-ghost btn-sm">
              Next
            </Link>
          )}
        </div>
      )}
    </>
  );
}
