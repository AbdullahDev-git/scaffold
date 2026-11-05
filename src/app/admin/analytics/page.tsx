import { adminStore } from '@/lib/db';
import { AnalyticsCharts } from '@/components/admin/analytics-charts';

export default async function AdminAnalytics() {
  const adb = await adminStore();
  const stats = await adb.getSystemStats();

  const wonRate = stats.totalPitches > 0
    ? Math.round((0 / stats.totalPitches) * 100)
    : 0;

  return (
    <>
      <h1 className="h1">Analytics</h1>
      <p className="view-sub">Platform-wide metrics and trends.</p>

      <div className="admin-stat-grid" style={{ marginTop: 24 }}>
        <div className="admin-stat">
          <div className="label">Total users</div>
          <div className="value">{stats.totalUsers}</div>
        </div>
        <div className="admin-stat">
          <div className="label">Total pitches</div>
          <div className="value">{stats.totalPitches}</div>
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
        <div className="admin-stat">
          <div className="label">Recent signups (7d)</div>
          <div className="value">{stats.recentSignups}</div>
        </div>
        <div className="admin-stat">
          <div className="label">Recent pitches (7d)</div>
          <div className="value">{stats.recentPitches}</div>
        </div>
      </div>

      <AnalyticsCharts stats={stats} />
    </>
  );
}
