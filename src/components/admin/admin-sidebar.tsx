'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bolt, Cog, Chart, Dash, Eye, Layers, Shield } from '../icons';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: Dash },
  { href: '/admin/users', label: 'Users', icon: Eye },
  { href: '/admin/pitches', label: 'Pitches', icon: Layers },
  { href: '/admin/analytics', label: 'Analytics', icon: Chart },
  { href: '/admin/settings', label: 'Settings', icon: Cog },
  { href: '/admin/audit', label: 'Audit log', icon: Shield },
] as const;

export function AdminSidebar() {
  const pathname = usePathname();
  const active = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav className="rail" aria-label="Admin">
      <div className="rail-head">
        <Shield className="h-6 w-6 flex-none text-ember" />
        <span className="rail-word">Admin</span>
      </div>

      <div className="rail-nav">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link key={href} className="rail-item" href={href} data-active={active(href)}>
            <Icon />
            <span className="rail-label">{label}</span>
          </Link>
        ))}
      </div>

      <div className="rail-foot">
        <Link className="rail-item" href="/dashboard">
          <Bolt />
          <span className="rail-label">Back to app</span>
        </Link>
      </div>
    </nav>
  );
}
