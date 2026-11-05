import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { OnboardingFlow } from '@/components/auth-forms';
import { WA_COOKIE } from '@/lib/cookies';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

/**
 * First-run only. Middleware bounces completed users to the dashboard before
 * this renders; the check below is the same rule enforced at render time.
 */
export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { onboarded } = await getSession();
  if (onboarded) redirect('/dashboard');

  const { redirect: to } = await searchParams;
  const jar = await cookies();
  const initialWhatsapp = jar.get(WA_COOKIE)?.value;

  return <OnboardingFlow initialWhatsapp={initialWhatsapp} redirectTo={to} />;
}
