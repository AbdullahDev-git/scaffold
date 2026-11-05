import * as React from 'react';
import { store } from '@/lib/db';
import { signOutAction } from '@/lib/auth-actions';
import { ProfileSection, NotificationRow, PasswordSection } from '@/components/settings-forms';
import { UpgradeDialog } from '@/components/upgrade-dialog';
import { DeleteAccountButton } from '@/components/delete-account-button';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const db = await store();
  const profile = await db.getProfile();

  return (
    <div className="view">
      <div className="view-head">
        <div className="min-w-0">
          <h1 className="h1">Settings</h1>
        </div>
      </div>

      <div className="mt-2 max-w-[680px]">
        <section className="sec">
          <div className="sec-head">
            <h2>Profile</h2>
            <p>This is what clients see on the pitch link you send them.</p>
          </div>
          <ProfileSection profile={profile} />
        </section>

        <section className="sec">
          <div className="sec-head">
            <h2>Subscription</h2>
            <p>Credits reset on the first of each month.</p>
          </div>
          <div className="plan">
            <div>
              <h4 className="text-[15px] font-semibold">{profile.tier === 'free' ? 'Free' : 'Pro'}</h4>
              <div className="mono muted mt-1.5 text-[13px]">
                {profile.tier === 'free'
                  ? `${profile.monthlyAllowance} pitches a month, ${profile.credits} left`
                  : 'Unlimited pitches, custom domain'}
              </div>
            </div>
            {profile.tier === 'free' ? (
              <UpgradeDialog credits={profile.credits} trigger={<button className="btn btn-ghost">See Pro</button>} />
            ) : (
              <button className="btn btn-ghost">Manage plan</button>
            )}
          </div>
        </section>

        <section className="sec">
          <div className="sec-head">
            <h2>Password</h2>
            <p>Update your account password.</p>
          </div>
          <PasswordSection />
        </section>

        <section className="sec">
          <div className="sec-head">
            <h2>Notifications</h2>
            <p>Only what tells you a deal is moving.</p>
          </div>
          <NotificationRow title="A client opens a pitch" detail="WhatsApp message, first open only" defaultOn />
          <NotificationRow title="A pitch goes three days without an open" detail="Email reminder to follow up" defaultOn />
          <NotificationRow title="Product updates" detail="Once a month, new features only" />
        </section>

        <section className="sec">
          <div className="sec-head">
            <h2>Session</h2>
            <p>Log out of Scaffold on this device.</p>
          </div>
          <form action={signOutAction}>
            <button className="btn btn-ghost">Log out</button>
          </form>
        </section>

        <section className="sec mt-8 border-t border-[color:var(--hairline)] pt-8">
          <div className="sec-head">
            <h2 className="text-[#c7443c]">Danger zone</h2>
            <p>Permanent and irreversible.</p>
          </div>
          <DeleteAccountButton />
        </section>
      </div>
    </div>
  );
}
