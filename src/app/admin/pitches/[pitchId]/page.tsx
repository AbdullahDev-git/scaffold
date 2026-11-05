import Link from 'next/link';
import { notFound } from 'next/navigation';
import { adminStore } from '@/lib/db';
import { PitchActions } from '@/components/admin/pitch-actions';

export default async function AdminPitchDetail({ params }: { params: Promise<{ pitchId: string }> }) {
  const { pitchId } = await params;
  const adb = await adminStore();
  const pitch = await adb.adminGetPitch(pitchId);

  if (!pitch) notFound();

  return (
    <>
      <Link href="/admin/pitches" className="crumb">
        ← Back to pitches
      </Link>

      <div className="view-head" style={{ marginTop: 14 }}>
        <div>
          <h1 className="h1">{pitch.clientName}</h1>
          <p className="view-sub">{pitch.industry} · {pitch.id}</p>
        </div>
        <span className={`badge badge-${pitch.status}`}>{pitch.status}</span>
      </div>

      <div className="admin-stat-grid" style={{ marginTop: 24 }}>
        <div className="admin-stat">
          <div className="label">Views</div>
          <div className="value" style={{ fontSize: 20 }}>{pitch.views.length}</div>
        </div>
        <div className="admin-stat">
          <div className="label">Provider</div>
          <div className="value" style={{ fontSize: 16 }}>{pitch.provider ?? '—'}</div>
        </div>
        <div className="admin-stat">
          <div className="label">Mode</div>
          <div className="value" style={{ fontSize: 16 }}>{pitch.mode}</div>
        </div>
        <div className="admin-stat">
          <div className="label">Screens</div>
          <div className="value" style={{ fontSize: 20 }}>{pitch.pkg.screens.length}</div>
        </div>
      </div>

      <div className="admin-section">
        <h2 className="admin-section-title">Brief</h2>
        <p style={{ color: 'var(--ash)', lineHeight: 1.6 }}>{pitch.brief}</p>
      </div>

      <PitchActions pitchId={pitch.id} />

      {pitch.views.length > 0 && (
        <div className="admin-section">
          <h2 className="admin-section-title">View history ({pitch.views.length})</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Device</th>
                <th>City</th>
                <th>Source</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              {pitch.views.map((v) => (
                <tr key={v.id}>
                  <td className="cell-meta">{new Date(v.viewedAt).toLocaleString()}</td>
                  <td className="cell-meta">{v.device}</td>
                  <td className="cell-meta">{v.city}</td>
                  <td className="cell-meta">{v.source}</td>
                  <td className="cell-meta">{v.seconds}s</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="admin-section">
        <h2 className="admin-section-title">Package JSON</h2>
        <pre style={{
          background: 'var(--ink)',
          border: '1px solid var(--hairline)',
          padding: 16,
          borderRadius: 8,
          overflow: 'auto',
          fontSize: 12.5,
          maxHeight: 400,
          color: 'var(--ash)',
        }}>
          {JSON.stringify(pitch.pkg, null, 2)}
        </pre>
      </div>
    </>
  );
}
