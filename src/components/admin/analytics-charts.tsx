'use client';

type Stats = {
  totalUsers: number;
  totalPitches: number;
  totalViews: number;
  freeUsers: number;
  proUsers: number;
  recentSignups: number;
  recentPitches: number;
};

export function AnalyticsCharts({ stats }: { stats: Stats }) {
  const maxUsers = Math.max(stats.freeUsers, stats.proUsers, 1);
  const freeWidth = Math.round((stats.freeUsers / maxUsers) * 100);
  const proWidth = Math.round((stats.proUsers / maxUsers) * 100);

  return (
    <>
      <div className="admin-section">
        <h2 className="admin-section-title">User breakdown</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400 }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, marginBottom: 4 }}>
              <span style={{ color: 'var(--ash)' }}>Free</span>
              <span className="mono">{stats.freeUsers}</span>
            </div>
            <div style={{ height: 8, background: 'var(--hairline)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${freeWidth}%`, background: 'var(--ash)', borderRadius: 4, transition: 'width 0.3s' }} />
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, marginBottom: 4 }}>
              <span style={{ color: 'var(--ember)' }}>Pro</span>
              <span className="mono">{stats.proUsers}</span>
            </div>
            <div style={{ height: 8, background: 'var(--hairline)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${proWidth}%`, background: 'var(--ember)', borderRadius: 4, transition: 'width 0.3s' }} />
            </div>
          </div>
        </div>
      </div>

      <div className="admin-section">
        <h2 className="admin-section-title">Activity (last 7 days)</h2>
        <div className="admin-stat-grid">
          <div className="admin-stat">
            <div className="label">New signups</div>
            <div className="value" style={{ color: 'var(--signal)' }}>{stats.recentSignups}</div>
          </div>
          <div className="admin-stat">
            <div className="label">New pitches</div>
            <div className="value" style={{ color: 'var(--signal)' }}>{stats.recentPitches}</div>
          </div>
        </div>
      </div>
    </>
  );
}
