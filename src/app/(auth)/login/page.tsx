import { LoginForm } from '@/components/auth-forms';

export const dynamic = 'force-dynamic';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string }>;
}) {
  const { redirect: to, error } = await searchParams;
  return <LoginForm redirectTo={to} authError={error === 'invalid-token' ? 'Invalid or expired confirmation link. Please log in.' : undefined} />;
}
