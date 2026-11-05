import Link from 'next/link';
import { Mark } from '@/components/icons';
import { getSession } from '@/lib/session';

/**
 * Public marketing chrome. The one place the product is allowed to speak in a
 * centered voice — but the tokens, type and restraint are the same system the
 * app uses, so marketing and shell read as one product.
 */
export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const { signedIn, onboarded } = await getSession();

  return (
    <div className="mkt">
      <header className="mkt-head">
        <Link href="/" className="mkt-brand">
          <Mark className="h-6 w-6 flex-none" />
          <span>Scaffold</span>
        </Link>
        <nav className="mkt-head-nav">
          <Link className="mkt-head-link" href="/pricing">
            Pricing
          </Link>
          {signedIn ? (
            <Link className="btn btn-ghost" href={onboarded ? '/dashboard' : '/onboarding'}>
              Open Scaffold
            </Link>
          ) : (
            <Link className="btn btn-ghost" href="/login">
              Log in
            </Link>
          )}
        </nav>
      </header>

      <main className="mkt-main">{children}</main>

      <footer className="mkt-foot">
        <span>Scaffold 2026. Made for people who bill by the project.</span>
        <span className="mkt-foot-links">
          <Link href="/pricing">Pricing</Link>
          <Link href="/login">Log in</Link>
          <Link href="/signup">Sign up</Link>
        </span>
      </footer>
    </div>
  );
}
