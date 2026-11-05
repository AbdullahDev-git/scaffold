import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

/**
 * Referral link resolver. /r/<code> redirects to /signup?ref=<code>.
 * The signup flow handles the actual credit awarding.
 */
export default async function ReferralPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  redirect(`/signup?ref=${encodeURIComponent(code)}`);
}
