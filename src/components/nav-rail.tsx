'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as Collapsible from '@radix-ui/react-collapsible';
import { useEffect, useState } from 'react';
import { Chart, Chevron, Cog, Dash, Gift, Layers, Mark, Pen, Plus } from './icons';
import { UpgradeDialog } from './upgrade-dialog';
import type { Profile } from '@/lib/schema';

/**
 * Fixed slim rail. Pitch is an expandable group holding the three stages of one
 * workflow — the sub-items are contextual to whichever pitch you last opened,
 * and fall back to a "pick one" prompt on the dashboard when there is none.
 */
export function NavRail({
  profile,
  pitches,
}: {
  profile: Profile;
  pitches: { id: string; clientName: string }[];
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const inPitch = pathname.startsWith('/pitch');
  const [groupOpen, setGroupOpen] = useState(inPitch);

  // whichever pitch you are inside wins; otherwise fall back to the last one
  // you opened this session, so the group's sub-items stay pointed somewhere real
  const fromPath = /^\/pitch\/([^/]+)\/(review|analytics)/.exec(pathname)?.[1] ?? null;
  const [remembered, setRemembered] = useState<string | null>(null);

  useEffect(() => {
    if (inPitch) setGroupOpen(true);
  }, [inPitch]);

  useEffect(() => {
    if (fromPath) {
      setRemembered(fromPath);
      sessionStorage.setItem('scaffold:lastPitch', fromPath);
    } else {
      setRemembered(sessionStorage.getItem('scaffold:lastPitch'));
    }
  }, [fromPath]);

  const activeId = fromPath ?? remembered;
  const activePitch = pitches.find((p) => p.id === activeId) ?? null;
  const id = activePitch?.id;
  const editHref = id ? `/pitch/${id}/edit` : '/pitch/edit';
  const analyticsHref = id ? `/pitch/${id}/analytics` : '/pitch/analytics';

  const is = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const onEdit = pathname.endsWith('/edit');
  const onAnalytics = pathname.endsWith('/analytics');

  return (
    <nav
      className="rail"
      aria-label="Primary"
      data-open={open}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <div className="rail-head">
        <Mark className="h-6 w-6 flex-none" />
        <span className="rail-word">Scaffold</span>
      </div>

      <div className="rail-nav">
        <Link className="rail-item" href="/dashboard" data-active={is('/dashboard')}>
          <Dash />
          <span className="rail-label">Dashboard</span>
        </Link>

        {/* collapsed rail shows icons only, so the group folds with it and the
            parent carries the active state instead of the sub-items */}
        <Collapsible.Root open={groupOpen && open} onOpenChange={setGroupOpen}>
          <Collapsible.Trigger asChild>
            <button className="rail-item" data-active={inPitch && !open} data-parent-active={inPitch && open} aria-label="Pitch" aria-expanded={groupOpen && open}>
              <Layers />
              <span className="rail-label">Pitch</span>
              <Chevron className="rail-chevron h-3.5 w-3.5" data-open={groupOpen} />
            </button>
          </Collapsible.Trigger>

          <Collapsible.Content>
            <div className="rail-sub">
              <Link className="rail-subitem" href="/pitch/new" data-active={is('/pitch/new')}>
                <Plus className="h-4 w-4 flex-none" />
                <span className="rail-label">New pitch</span>
              </Link>
              <Link className="rail-subitem" href={editHref} data-active={onEdit} data-disabled={!id}>
                <Pen className="h-4 w-4 flex-none" />
                <span className="rail-label">Review &amp; edit</span>
              </Link>
              <Link className="rail-subitem" href={analyticsHref} data-active={onAnalytics} data-disabled={!id}>
                <Chart className="h-4 w-4 flex-none" />
                <span className="rail-label">Analytics &amp; tracking</span>
              </Link>
              {activePitch && open ? (
                <p className="rail-context">{activePitch.clientName}</p>
              ) : null}
            </div>
          </Collapsible.Content>
        </Collapsible.Root>

        <Link className="rail-item" href="/referrals" data-active={is('/referrals')}>
          <Gift />
          <span className="rail-label">Referrals</span>
        </Link>
        <Link className="rail-item" href="/settings" data-active={is('/settings')}>
          <Cog />
          <span className="rail-label">Settings</span>
        </Link>
      </div>

      <div className="rail-foot">
        <UpgradeDialog
          credits={profile.credits}
          trigger={
            <button className="credit-chip" title={`${profile.credits} pitch credits left`}>
              <span className="credit-num" data-out={profile.credits === 0}>
                {profile.tier === 'pro' ? '∞' : profile.credits}
              </span>
              <span className="credit-text">
                {profile.tier === 'pro' ? 'unlimited pitches' : profile.credits === 1 ? 'pitch credit left' : 'pitch credits left'}
              </span>
            </button>
          }
        />
        {profile.tier === 'free' ? (
          <div className="nudge">
            <p>
              Free plan. {profile.credits} of {profile.monthlyAllowance} monthly pitches left.
            </p>
            <UpgradeDialog credits={profile.credits} trigger={<button className="btn">Upgrade to Pro</button>} />
          </div>
        ) : null}
      </div>
    </nav>
  );
}
