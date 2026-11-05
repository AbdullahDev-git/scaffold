import Link from 'next/link';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase';

export const metadata: Metadata = { title: 'Pricing — Scaffold' };

/**
 * Public pricing. Pro price is read from system_settings so the admin can
 * update it without a deploy. Falls back to $12 if not configured.
 */
export default async function PricingPage() {
  const supabase = await createClient();
  let proPrice = '$12';

  if (supabase) {
    const { data } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'pro_price_monthly')
      .maybeSingle();
    if (data?.value) {
      const raw = String(data.value);
      // strip surrounding quotes if stored as a JSON string
      proPrice = raw.replace(/^"(.*)"$/, '$1');
    }
  }

  return (
    <>
      <section className="hero hero-tight">
        <h1>Free until the work proves itself</h1>
        <p className="hero-sub">
          Start on the free plan, pitch real clients, upgrade when the retainers land. No card to
          start, no contract to leave.
        </p>
      </section>

      <section className="mkt-sec mkt-sec-plans">
        <div className="mkt-plans">
          <div className="mkt-plan">
            <div className="mkt-plan-head">
              <h3>Free</h3>
              <p className="muted">For the first pitches</p>
            </div>
            <p className="mkt-price">
              <span className="price-amt">$0</span>
              <span className="muted text-[13.5px]">a month</span>
            </p>
            <ul>
              <li>5 pitches a month, reset on the 1st</li>
              <li>Three-screen clickable prototypes</li>
              <li>Scaffold watermark on the client page</li>
              <li>Open and view tracking</li>
              <li>Referral credits — 2 per friend who joins</li>
            </ul>
            <Link className="btn btn-ghost w-full justify-center" href="/signup">
              Get started free
            </Link>
          </div>

          <div className="mkt-plan" data-pro>
            <div className="mkt-plan-head">
              <h3>Pro</h3>
              <p className="muted">When the work keeps coming</p>
            </div>
            <p className="mkt-price">
              <span className="price-amt">{proPrice}</span>
              <span className="muted text-[13.5px]">a month, cancel any time</span>
            </p>
            <ul>
              <li>Unlimited pitches, no monthly cap</li>
              <li>Your name and logo on every prototype — watermark gone</li>
              <li>Full view analytics, per client</li>
              <li>Everything in Free</li>
            </ul>
            <Link className="btn btn-primary w-full justify-center" href="/signup">
              Get started free
            </Link>
          </div>
        </div>

        <p className="mkt-fineprint">
          Prices in USD. The free plan needs no card. Referrals earn credits on both sides — see{' '}
          <Link className="link" href="/signup">
            sign up
          </Link>{' '}
          and mention your code.
        </p>
      </section>

      <section className="mkt-cta">
        <h2>Still deciding? Send one real pitch first.</h2>
        <p className="hero-sub">The free plan is not a trial — it is five working pitches, every month.</p>
        <div className="hero-cta">
          <Link className="btn btn-primary btn-lg" href="/signup">
            Get started free
          </Link>
          <p className="hero-note">
            Already with us?{' '}
            <Link className="link" href="/login">
              Log in
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
