import Link from 'next/link';
import { notFound } from 'next/navigation';
import { adminStore } from '@/lib/db';
import { UserActions } from '@/components/admin/user-actions';

export default async function AdminUserDetail({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const adb = await adminStore();
  const user = await adb.getUser(userId);

  if (!user) notFound();

  const pitches = await adb.getUserPitches(userId);

  return (
    <>
      <Link href="/admin/users" className="crumb">
        ← Back to users
      </Link>

      <div className="view-head" style={{ marginTop: 14 }}>
        <div>
          <h1 className="h1">{user.fullName || '(no name)'}</h1>
          <p className="view-sub">{user.email}</p>
        </div>
        <span className={`role-badge role-${user.role}`} style={{ fontSize: 13, height: 28, padding: '0 12px' }}>
          {user.role}
        </span>
      </div>

      <div className="admin-stat-grid" style={{ marginTop: 24 }}>
        <div className="admin-stat">
          <div className="label">Tier</div>
          <div className="value" style={{ fontSize: 20 }}>{user.tier}</div>
        </div>
        <div className="admin-stat">
          <div className="label">Credits</div>
          <div className="value" style={{ fontSize: 20 }}>{user.credits}</div>
        </div>
        <div className="admin-stat">
          <div className="label">Pitches</div>
          <div className="value" style={{ fontSize: 20 }}>{pitches.length}</div>
        </div>
        <div className="admin-stat">
          <div className="label">Joined</div>
          <div className="value" style={{ fontSize: 16 }}>{new Date(user.createdAt).toLocaleDateString()}</div>
        </div>
      </div>

      <div className="admin-section">
        <h2 className="admin-section-title">Details</h2>
        <table className="table">
          <tbody>
            <tr><td className="cell-meta" style={{ width: 180 }}>Business</td><td>{user.businessName || '—'}</td></tr>
            <tr><td className="cell-meta">City</td><td>{user.city || '—'}</td></tr>
            <tr><td className="cell-meta">WhatsApp</td><td>{user.whatsapp}</td></tr>
            <tr><td className="cell-meta">Referral code</td><td className="mono">{user.referralCode}</td></tr>
            <tr><td className="cell-meta">Notify on view</td><td>{user.notifyOnView ? 'Yes' : 'No'}</td></tr>
            <tr><td className="cell-meta">Weekly digest</td><td>{user.notifyWeekly ? 'Yes' : 'No'}</td></tr>
          </tbody>
        </table>
      </div>

      <UserActions user={user} />

      {pitches.length > 0 && (
        <div className="admin-section">
          <h2 className="admin-section-title">Pitches ({pitches.length})</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Industry</th>
                <th>Status</th>
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
                  <td><span className={`badge badge-${p.status}`}>{p.status}</span></td>
                  <td className="cell-meta">{new Date(p.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
