import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase';
import { store } from '@/lib/db';

/**
 * Create a Lemon Squeezy checkout session for the Pro upgrade.
 *
 * Required env: LEMONSQUEEZY_API_KEY, LEMONSQUEEZY_STORE_ID,
 *               LEMONSQUEEZY_VARIANT_ID, NEXT_PUBLIC_SITE_URL
 */
export async function POST(req: NextRequest) {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  const variantId = process.env.LEMONSQUEEZY_VARIANT_ID;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001';

  if (!apiKey || !storeId || !variantId) {
    return NextResponse.json({ error: 'lemon squeezy not configured' }, { status: 501 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: 'supabase not configured' }, { status: 500 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  const db = await store();
  const profile = await db.getProfile();

  try {
    const res = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        store_id: Number(storeId),
        variant_id: Number(variantId),
        checkout_data: {
          custom: {
            user_id: user.id,
            user_email: profile.email,
          },
          checkout_options: {
            media: false,
            dark_mode: true,
            logo_url: `${siteUrl}/scaffold-logo.png`,
          },
          receipt_text: 'Thank you for upgrading to Scaffold Pro!',
          receipt_link_text: 'View your receipt',
          receipt_link_url: `${siteUrl}/settings`,
          discount_code: undefined,
          tax: undefined,
        },
        checkout_options: {
          media: false,
          dark_mode: true,
          logo_url: `${siteUrl}/scaffold-logo.png`,
        },
        expires_at: undefined,
        store_url: undefined,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      return NextResponse.json({ error: `checkout failed: ${body}` }, { status: 502 });
    }

    const data = await res.json();
    const checkoutUrl = data.data?.attributes?.url;
    if (!checkoutUrl) {
      return NextResponse.json({ error: 'no checkout url returned' }, { status: 502 });
    }

    return NextResponse.json({ url: checkoutUrl });
  } catch {
    return NextResponse.json({ error: 'checkout error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
