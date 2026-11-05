import Link from 'next/link';
import { Back } from '@/components/icons';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[color:var(--ink)] text-center p-6">
      <div className="max-w-md w-full">
        <h2 className="h2 mb-3">Not found</h2>
        <p className="muted mb-6">That admin page doesn’t exist.</p>
        <div className="flex flex-col gap-3">
          <Link className="btn btn-primary" href="/admin">
            <Back />
            Back to admin
          </Link>
        </div>
      </div>
    </div>
  );
}
