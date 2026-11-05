import Link from 'next/link';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

/**
 * The landing / "Get started" screen. Centered hero is deliberate here — the
 * public marketing entry, not the authenticated shell. Both CTAs go to
 * /signup; the quiet "Log in" lives in the page header, never buried in the
 * hero.
 */
export default async function LandingPage() {
  const { signedIn, onboarded } = await getSession();
  const appHref = onboarded ? '/dashboard' : '/onboarding';

  return (
    <>
      <section className="hero">
        <h1>
          From client brief to a pitch they can click through&nbsp;— in under 60&nbsp;seconds
        </h1>
        <p className="hero-sub">
          Scaffold turns two sentences about a local business into a working, three-screen prototype
          with your name on it. Send it the same day — no unpaid sample work.
        </p>
        <div className="hero-cta">
          {signedIn ? (
            <Link className="btn btn-primary btn-lg" href={appHref}>
              Open Scaffold
            </Link>
          ) : (
            <Link className="btn btn-primary btn-lg" href="/signup">
              Get started free
            </Link>
          )}
          <p className="hero-note">5 free pitches a month. No card.</p>
        </div>
      </section>

      <section className="mkt-sec">
        <h2>How it works</h2>
        <p className="mkt-sec-sub">Three steps, one coffee&apos;s worth of time.</p>
        <div className="mkt-steps">
          <div className="mkt-step">
            <span className="mkt-step-n">01</span>
            <h3>Describe the client</h3>
            <p>Two or three sentences about their business. Pick the industry and a voice — that is the whole brief.</p>
          </div>
          <div className="mkt-step">
            <span className="mkt-step-n">02</span>
            <h3>Get a pitch you can send</h3>
            <p>A three-screen clickable prototype in about ten seconds. Swap the accent colour or headlines if you want.</p>
          </div>
          <div className="mkt-step">
            <span className="mkt-step-n">03</span>
            <h3>Send it, then see it open</h3>
            <p>One link for WhatsApp. You see the moment they open it, and every screen they tap after.</p>
          </div>
        </div>
      </section>

      <section className="mkt-sec">
        <h2>A pitch a client actually opens</h2>
        <p className="mkt-sec-sub">
          Their name, their trade, their colours — wrapped around a prototype that works on a phone.
        </p>

        {/* hand-written miniature of the generated client site — static, never LLM-built */}
        <div className="showcase" aria-hidden>
          <div className="showcase-bar">
            <span className="showcase-dot" />
            <span className="showcase-dot" />
            <span className="showcase-dot" />
            <span className="showcase-url">scaffold.app/p/karma-coffee-house</span>
          </div>
          <div className="showcase-body">
            <div className="sc-nav">
              <span className="sc-brand">Karma Coffee House</span>
              <span className="sc-links">
                <span>Home</span>
                <span>Menu</span>
                <span>Contact</span>
              </span>
              <span className="sc-chip">Book a table</span>
            </div>
            <div className="sc-hero">
              <h3>Karma Coffee House, cafe on Ferozepur Road</h3>
              <p>Small speciality coffee shop. Table booking, a full menu, and bulk orders for offices.</p>
            </div>
            <div className="sc-tiles">
              <div>
                <h4>Open early</h4>
                <p>Pour-overs from 7:30am, every day.</p>
              </div>
              <div>
                <h4>Office runs</h4>
                <p>Ten cups or a hundred, delivered.</p>
              </div>
              <div>
                <h4>Find us fast</h4>
                <p>Ten minutes from Kalma Chowk.</p>
              </div>
            </div>
          </div>
        </div>

        <p className="mkt-sec-foot">
          <Link className="link" href="/p/karma-coffee-house">
            Open a live sample pitch
          </Link>
        </p>
      </section>

      <section className="mkt-sec">
        <h2>Pricing that waits for the work to land</h2>
        <p className="mkt-sec-sub">
          Free gets you 5 pitches a month. Pro is $12 a month, unlimited, for when the work keeps
          coming.
        </p>
        <p className="mkt-sec-foot">
          <Link className="link" href="/pricing">
            See full pricing
          </Link>
        </p>
      </section>

      <section className="mkt-cta">
        <h2>The next brief deserves a prototype.</h2>
        <p className="hero-sub">Write it in the morning, send it by lunch.</p>
        <div className="hero-cta">
          {signedIn ? (
            <Link className="btn btn-primary btn-lg" href={appHref}>
              Open Scaffold
            </Link>
          ) : (
            <Link className="btn btn-primary btn-lg" href="/signup">
              Get started free
            </Link>
          )}
        </div>
      </section>
    </>
  );
}
