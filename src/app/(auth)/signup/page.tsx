import { SignupForm } from '@/components/auth-forms';

export const dynamic = 'force-dynamic';

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; redirect?: string }>;
}) {
  const { ref, redirect: to } = await searchParams;
  return <SignupForm refCode={ref} redirectTo={to} />;
}
