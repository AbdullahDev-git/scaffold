import { createHmac, timingSafeEqual } from 'crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase';

/**
 * Lemon Squeezy webhook → profiles.tier.
 *
 * Lemon Squeezy sends a JSON payload with meta.event_name indicating the event type.
 * Signature verification uses HMAC-SHA256 of the raw body with the webhook secret.
 * Idempotency: processed event IDs (meta.id) are tracked so duplicate deliveries
 * don't double-toggle a user's tier.
 */
const processed = new Set<string>();
const MAX_PROCESSED = 1000;

export async function POST(req: NextRequest) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  const raw = await req.text();

  if (!secret) {
    return NextResponse.json({ error: 'lemon squeezy not configured' }, { status: 501 });
  }

  // ---- HMAC-SHA256 signature verification ----
  const signature = req.headers.get('x-signature') ?? '';
  const expected = createHmac('sha256', secret).update(raw).digest('hex');

  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 });
  }

  // ---- parse payload ----
  let payload: {
    meta: { id: string; event_name: string };
    data: { attributes?: Record<string, unknown> };
  };

  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const eventId = payload.meta.id;
  const eventName = payload.meta.event_name;

  // ---- idempotency ----
  if (processed.has(eventId)) {
    return NextResponse.json({ received: true, duplicate: true });
  }
  if (processed.size >= MAX_PROCESSED) {
    processed.clear();
  }
  processed.add(eventId);

  // ---- dispatch ----
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: 'supabase not configured' }, { status: 500 });
  }

  // Lemon Squeezy v2 webhooks expose the external user id under data.attributes.user_id.
  const externalUserId = String(payload.data.attributes?.user_id ?? '');
  const customerId = String(payload.data.attributes?.customer_id ?? '');

  switch (eventName) {
    case 'order_created':
    case 'subscription_created':
    case 'subscription_updated': {
      if (externalUserId) {
        await supabase
          .from('profiles')
          .update({ tier: 'pro' })
          .eq('id', externalUserId);
      } else if (customerId) {
        await supabase
          .from('profiles')
          .update({ tier: 'pro' })
          .eq('lemonsqueezy_customer_id', customerId);
      }
      break;
    }
    case 'subscription_cancelled':
    case 'subscription_expired':
    case 'order_refunded': {
      if (externalUserId) {
        await supabase
          .from('profiles')
          .update({ tier: 'free', credits: 5 })
          .eq('id', externalUserId);
      } else if (customerId) {
        await supabase
          .from('profiles')
          .update({ tier: 'free', credits: 5 })
          .eq('lemonsqueezy_customer_id', customerId);
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}

export const dynamic = 'force-dynamic';
