import Link from 'next/link';
import { Back } from '@/components/icons';

export default function NotFound() {
  return (
    <div className="view min-h-screen flex flex-col items-center justify-center text-center">
      <div className="max-w-md w-full p-6">
        <h2 className="h2 mb-3">Pitch not found</h2>
        <p className="muted mb-6">The pitch you’re looking for doesn’t exist or you don’t have access to it.</p>
        <div className="flex flex-col gap-3">
          <Link className="btn btn-primary" href="/dashboard">
            <Back />
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
