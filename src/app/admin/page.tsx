import { adminStore } from '@/lib/db';

export default async function AdminDashboard() {
  const adb = await adminStore();
  const stats = await adb.getSystemStats();

  return (
    <>
      <h1 className="h1">Admin Dashboard</h1>
      <p className="view-sub">Platform overview and key metrics.</p>

      <div className="admin-stat-grid">
        <div className="admin-stat">
          <div className="label">Total users</div>
          <div className="value">{stats.totalUsers}</div>
          <div className="trend" data-up={stats.recentSignups > 0}>
            {stats.recentSignups} new this week
          </div>
        </div>
        <div className="admin-stat">
          <div className="label">Total pitches</div>
          <div className="value">{stats.totalPitches}</div>
          <div className="trend" data-up={stats.recentPitches > 0}>
            {stats.recentPitches} created this week
          </div>
        </div>
        <div className="admin-stat">
          <div className="label">Total views</div>
          <div className="value">{stats.totalViews}</div>
        </div>
        <div className="admin-stat">
          <div className="label">Free users</div>
          <div className="value">{stats.freeUsers}</div>
        </div>
        <div className="admin-stat">
          <div className="label">Pro users</div>
          <div className="value" style={{ color: 'var(--ember)' }}>{stats.proUsers}</div>
        </div>
      </div>

      <div className="admin-section">
        <h2 className="admin-section-title">Quick links</h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <a href="/admin/users" className="btn btn-ghost">Manage users</a>
          <a href="/admin/pitches" className="btn btn-ghost">Browse pitches</a>
          <a href="/admin/analytics" className="btn btn-ghost">View analytics</a>
          <a href="/admin/settings" className="btn btn-ghost">System settings</a>
          <a href="/admin/audit" className="btn btn-ghost">Audit log</a>
        </div>
      </div>
    </>
  );
}
