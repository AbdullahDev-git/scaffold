import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase';

/**
 * Cron route: resets monthly credits for free-tier users.
 *
 * Protect with a cron secret. In Vercel, configure a Cron Job pointing at
 * this path and set the `Authorization: Bearer <CRON_SECRET>` header.
 *
 * Required env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, CRON_SECRET
 */
export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace(/^Bearer\s*/i, '');
  const expected = process.env.CRON_SECRET;

  if (!expected || secret !== expected) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: 'supabase not configured' }, { status: 500 });
  }

  const { error } = await supabase.rpc('reset_monthly_credits');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export const dynamic = 'force-dynamic';
