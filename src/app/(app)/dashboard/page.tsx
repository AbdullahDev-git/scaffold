import Link from 'next/link';
import { store } from '@/lib/db';
import { StatusBadge } from '@/components/status-badge';
import { DeletePitchButton } from '@/components/delete-pitch-button';
import { Plus } from '@/components/icons';
import { stamp } from '@/lib/utils';

export const dynamic = 'force-dynamic';

/**
 * The list is the entire screen. One ember action top right, credits as a quiet
 * mono readout beside it, win rate as a single line — no stats panel.
 */
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ pick?: string }>;
}) {
  const { pick } = await searchParams;
  const db = await store();
  const [pitches, profile] = await Promise.all([db.listPitches(), db.getProfile()]);

  const won = pitches.filter((p) => p.status === 'won').length;
  const closed = pitches.filter((p) => p.status === 'won' || p.status === 'lost').length;
  const rate = closed ? Math.round((won / closed) * 100) : 0;

  const pickPrompt =
    pick === 'review'
      ? 'Pick a pitch to open its preview and editor.'
      : pick === 'analytics'
        ? 'Pick a pitch to see who opened it.'
        : null;

  return (
    <div className="view">
      <div className="view-head">
        <div className="min-w-0">
          <h1 className="h1">Pitches</h1>
          {pickPrompt ? <p className="view-sub">{pickPrompt}</p> : null}
        </div>
        <div className="quiet-strip">
          <span className="readout">
            {profile.tier === 'pro' ? (
              <>
                <b>Pro</b>, unlimited pitches
              </>
            ) : profile.credits === 0 ? (
              <>
                <span className="out">0</span> credits left
              </>
            ) : (
              <>
                <b>{profile.credits}</b> credits left
              </>
            )}
          </span>
          {pitches.length ? (
            <Link className="btn btn-primary btn-lg" href="/pitch/new">
              <Plus />
              New pitch
            </Link>
          ) : null}
        </div>
      </div>

      {pitches.length === 0 ? (
        <div className="empty">
          <h2>Write your first brief and send a working prototype today.</h2>
          <p>
            Describe a local business in two or three sentences. Scaffold builds a clickable multi-screen site you can
            send to the client in under a minute — no unpaid sample work.
          </p>
          <Link className="btn btn-primary btn-lg" href="/pitch/new">
            <Plus />
            Create your first pitch
          </Link>
          <ol>
            <li>Type or record a short brief with the client name and trade.</li>
            <li>Review the prototype and swap the accent colour or headlines.</li>
            <li>Send the link on WhatsApp and watch when they open it.</li>
          </ol>
        </div>
      ) : (
        <>
          <p className="stat-line">
            You have won <span className="n">{won}</span> of <span className="n">{closed}</span> closed pitches, a{' '}
            <span className="n">{rate}%</span> win rate.
          </p>

          <table className="table">
            <thead>
              <tr>
                <th>Client</th>
                <th className="col-industry">Industry</th>
                <th>Status</th>
                <th className="num">Views</th>
                <th className="num col-last">Last viewed</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {pitches.map((p) => {
                // a row click always opens the tracking view for that pitch
                const href = `/pitch/${p.id}/analytics`;
                return (
                  <tr key={p.id} data-lost={p.status === 'lost'}>
                    <td>
                      <Link href={href} className="cell-client">
                        {p.clientName}
                      </Link>
                    </td>
                    <td className="col-industry">
                      <Link href={href} className="muted text-[13px]">
                        {p.industry}
                      </Link>
                    </td>
                    <td>
                      <Link href={href}>
                        <StatusBadge status={p.status} />
                      </Link>
                    </td>
                    <td className="num">
                      <Link href={href} className="cell-views" data-has={p.views.length > 0}>
                        {p.views.length}
                      </Link>
                    </td>
                    <td className="num col-last">
                      <Link href={href} className="cell-meta">
                        {p.lastViewedAt ? stamp(p.lastViewedAt) : 'not yet'}
                      </Link>
                    </td>
                    <td>
                      <DeletePitchButton pitchId={p.id} clientName={p.clientName} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
