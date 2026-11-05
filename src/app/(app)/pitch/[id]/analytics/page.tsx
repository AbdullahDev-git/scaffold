import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Back, Pen } from '@/components/icons';
import { CopyButton } from '@/components/copy-button';
import { StatusBadge } from '@/components/status-badge';
import { PitchActions, StatusSelect } from '@/components/pitch-actions';
import { store } from '@/lib/db';
import { duration, slug, stamp } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await store();
  const [pitch, profile] = await Promise.all([db.getPitch(id), db.getProfile()]);
  if (!pitch) notFound();


  const link = `scaffold.app/p/${slug(pitch.clientName)}`;
  const unique = new Set(pitch.views.map((v) => v.device + v.city)).size;
  const avg = pitch.views.length
    ? Math.round(pitch.views.reduce((t, v) => t + v.seconds, 0) / pitch.views.length)
    : 0;

  return (
    <div className="view">
      <Link className="crumb" href="/dashboard">
        <Back />
        All pitches
      </Link>

      <div className="view-head">
        <div className="min-w-0">
          <h1 className="h1">{pitch.clientName}</h1>
          <p className="view-sub">
            {pitch.industry}, {pitch.sentAt ? 'sent' : 'created'} <span className="mono text-[13px]">{stamp(pitch.sentAt ?? pitch.createdAt, false)}</span>
          </p>
        </div>
        <div className="quiet-strip">
          <span className="readout-data">{pitch.id}</span>
          <StatusSelect pitchId={pitch.id} status={pitch.status} />
        </div>
      </div>

      <div className="detail">
        <div>
          <div className="metric-row">
            <div className="metric">
              <div className="metric-n" data-idle={pitch.views.length === 0}>
                {pitch.views.length}
              </div>
              <div className="metric-k">total views</div>
            </div>
            <div className="metric">
              <div className="metric-n" data-idle={unique === 0}>
                {unique}
              </div>
              <div className="metric-k">unique visitors</div>
            </div>
            <div className="metric">
              <div className="metric-n" data-idle={avg === 0}>
                {avg ? duration(avg) : '—'}
              </div>
              <div className="metric-k">average time on page</div>
            </div>
          </div>

          <h2 className="section-title">View history</h2>
          {pitch.views.length ? (
            <ul className="history">
              {pitch.views.map((v) => (
                <li key={v.id}>
                  <span className="ts">{stamp(v.viewedAt)}</span>
                  <span className="what">
                    {v.source === 'whatsapp' ? 'Link opened from WhatsApp' : `Opened on ${v.device}`}, {v.city}
                  </span>
                  <span className="dur">{duration(v.seconds)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted border-t border-[color:var(--hairline)] pt-4 text-[13.5px]">
              No opens yet. Send the link again on WhatsApp — most clients open within a day.
            </p>
          )}
        </div>

        <div>
          <div className="side-block">
            <h3>Shareable link</h3>
            <div className="copyrow">
              <input className="input input-mono" readOnly value={link} aria-label="Shareable link" />
              <CopyButton value={`https://${link}`} />
            </div>
          </div>
          <div className="side-block">
            <h3>Status</h3>
            <div className="flex items-center gap-2.5">
              <StatusBadge status={pitch.status} />
              <span className="readout">
                updated <span className="n">{stamp(pitch.lastViewedAt ?? pitch.sentAt ?? pitch.createdAt, false)}</span>
              </span>
            </div>
          </div>
          <div className="side-block">
            <h3>Actions</h3>
            <PitchActions pitchId={pitch.id} credits={profile.credits} />
            <Link className="btn btn-ghost mt-2 w-full justify-start" href={`/pitch/${pitch.id}/edit`}>
              <Pen />
              Open the editor
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
