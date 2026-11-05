import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ReviewClient } from '@/components/review-client';
import { Back } from '@/components/icons';
import { store } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await store();
  const pitch = await db.getPitch(id);
  if (!pitch) notFound();


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
            {pitch.status === 'created' ? 'Prototype ready. Look it over, then send it.' : 'Sent. Edit and resend any time.'}
          </p>
        </div>
        <div className="quiet-strip">
          <span className="readout-data">{pitch.id}</span>
        </div>
      </div>

      <ReviewClient
        pitchId={pitch.id}
        clientName={pitch.clientName}
        initialPackage={pitch.pkg}
        alreadySent={pitch.status !== 'created'}
      />
    </div>
  );
}
