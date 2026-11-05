import { CopyButton } from '@/components/copy-button';
import { store } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function ReferralsPage() {
  const db = await store();
  const [profile, referrals] = await Promise.all([db.getProfile(), db.listReferrals()]);
  const earned = referrals.reduce((t, r) => t + r.credits, 0);
  const link = `scaffold.app/r/${profile.referralCode}`;

  return (
    <div className="view">
      <div className="view-head">
        <div className="min-w-0">
          <h1 className="h1">Referrals</h1>
          <p className="view-sub">Every developer who signs up with your link gives you two pitch credits.</p>
        </div>
      </div>

      <div className="mt-[26px] max-w-[720px]">
        <div className="mb-[26px] flex flex-wrap items-center gap-2.5">
          <input className="input input-mono flex-1" readOnly value={link} aria-label="Referral link" />
          <CopyButton value={`https://${link}`} label="Share your link" />
        </div>

        <div className="metric-row mb-[30px]">
          <div className="metric">
            <div className="metric-n">{referrals.length}</div>
            <div className="metric-k">developers signed up</div>
          </div>
          <div className="metric">
            <div className="metric-n">{earned}</div>
            <div className="metric-k">credits earned</div>
          </div>
          <div className="metric">
            <div className="metric-n" data-idle={profile.credits === 0}>
              {profile.credits}
            </div>
            <div className="metric-k">credits still unused</div>
          </div>
        </div>

        <div className="ref-steps">
          <div className="ref-step">
            <span className="i">1</span>
            <p>Send your link to a developer who pitches local clients.</p>
          </div>
          <div className="ref-step">
            <span className="i">2</span>
            <p>They sign up and generate their first pitch.</p>
          </div>
          <div className="ref-step">
            <span className="i">3</span>
            <p>
              <b>You both get two credits.</b> Credits never expire and stack on top of your plan.
            </p>
          </div>
        </div>

        <h2 className="section-title">Who joined</h2>
        <ul className="ref-list">
          {referrals.map((r) => (
            <li key={r.name}>
              <span>{r.name}</span>
              <span className="mono muted text-[12.5px]">{r.joinedAt}</span>
              <span className="mono muted text-[13px]">{r.credits} credits</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
