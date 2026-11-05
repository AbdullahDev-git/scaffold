import { BriefForm } from '@/components/brief-form';
import { store } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function NewPitchPage() {
  const db = await store();
  const profile = await db.getProfile();

  return (
    <div className="view">
      <div className="view-head">
        <div className="min-w-0">
          <h1 className="h1">New pitch</h1>
          <p className="view-sub">Describe the client. Scaffold builds the prototype.</p>
        </div>
        <div className="quiet-strip">
          <span className="readout">
            {profile.credits === 0 ? (
              <>
                <span className="out">0</span> credits left
              </>
            ) : (
              <>
                <b>{profile.credits}</b> credits left
              </>
            )}
          </span>
        </div>
      </div>

      <BriefForm credits={profile.credits} />
    </div>
  );
}
