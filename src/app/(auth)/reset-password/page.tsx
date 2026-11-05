import Link from 'next/link';
import { ResetForm } from '@/components/auth-forms';

/**
 * Reached only through the emailed link — no token, no form. The demo honours
 * any token; Supabase Auth validates the real one.
 */
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <>
        <h2 className="text-[23px] font-semibold tracking-[-0.02em]">This link is not valid</h2>
        <p className="muted mb-[26px] mt-1.5 text-sm">
          Reset links are single-use and expire after 30 minutes. Request a fresh one.
        </p>
        <Link className="btn btn-primary btn-lg w-full justify-center" href="/forgot-password">
          Request a new reset link
        </Link>
      </>
    );
  }

  return <ResetForm token={token} />;
}
