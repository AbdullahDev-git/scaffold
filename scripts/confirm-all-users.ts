/**
 * Auto-confirm all unconfirmed Supabase users using the service role key.
 * Run once after signup to clear the "email not confirmed" blocker.
 *
 * Usage: npx tsx scripts/confirm-all-users.ts
 */

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log('Fetching all users...');

  let page = 1;
  const perPage = 100;
  let totalConfirmed = 0;
  let totalAlreadyConfirmed = 0;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) {
      console.error('Error listing users:', error.message);
      process.exit(1);
    }

    const users = data?.users ?? [];
    if (users.length === 0) break;

    for (const user of users) {
      const emailConfirmed = user.email_confirmed_at != null;
      if (emailConfirmed) {
        totalAlreadyConfirmed++;
        continue;
      }

      const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
        email_confirm: true,
      });

      if (updateError) {
        console.error(`  ✗ ${user.email}: ${updateError.message}`);
      } else {
        console.log(`  ✓ Confirmed: ${user.email}`);
        totalConfirmed++;
      }
    }

    if (users.length < perPage) break;
    page++;
  }

  console.log('');
  console.log(`Done. Confirmed ${totalConfirmed} users, ${totalAlreadyConfirmed} already confirmed.`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
