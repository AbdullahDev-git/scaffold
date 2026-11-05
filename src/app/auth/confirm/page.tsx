import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { ConfirmClient } from '@/components/confirm-client';

export const dynamic = 'force-dynamic';

/**
 * Email confirmation route. Supabase can send users here in two ways:
 *
 * 1. PKCE flow (default):  ?code=...              → exchangeCodeForSession
 * 2. Implicit flow:        ?token_hash=...&type=signup → verifyOtp
 *
 * We handle both, then show a "confirmed" screen that auto-redirects
 * to the dashboard after a short pause.
 */
export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{
    token_hash?: string;
    type?: string;
    code?: string;
    next?: string;
  }>;
}) {
  const { token_hash, type, code, next } = await searchParams;

  if (!token_hash && !code) {
    redirect('/login');
  }

  const supabase = await createClient();

  if (supabase) {
    // PKCE flow — Supabase default with @supabase/ssr
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error('[CONFIRM PKCE ERROR]', error.message);
        redirect('/login?error=invalid-token');
      }
    } else if (token_hash && type) {
      // Implicit flow — token_hash + type
      const { error } = await supabase.auth.verifyOtp({
        token_hash,
        type: type as 'signup' | 'recovery' | 'magiclink' | 'email_change',
      });
      if (error) {
        console.error('[CONFIRM OTP ERROR]', error.message);
        redirect('/login?error=invalid-token');
      }
    }
  }

  const redirectTo = next || '/dashboard';

  return <ConfirmClient redirectTo={redirectTo} />;
}
