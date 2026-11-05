import { redirect } from 'next/navigation';
import { NavRail } from '@/components/nav-rail';
import { ToastProvider } from '@/components/toast-provider';
import { store } from '@/lib/db';
import { getSession } from '@/lib/session';

/**
 * Authenticated shell. The rail resolves which pitch its Pitch group points at
 * from the current path, remembering the last one for the rest of the session.
 * Middleware is the gatekeeper; this guard is the second lock on the same door.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { signedIn } = await getSession();
  if (!signedIn) redirect('/login');

  const db = await store();
  const [profile, pitches] = await Promise.all([db.getProfile(), db.listPitches()]);

  return (
    <div className="flex min-h-screen">
      <NavRail profile={profile} pitches={pitches.map((p) => ({ id: p.id, clientName: p.clientName }))} />
      <main className="main flex-1">
        <ToastProvider>{children}</ToastProvider>
      </main>
    </div>
  );
}
