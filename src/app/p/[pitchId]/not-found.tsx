import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0e0b] text-center p-6">
      <div className="max-w-md w-full">
        <h2 className="h2 mb-3">Prototype not found</h2>
        <p className="muted mb-6">This client link doesn’t exist or has been removed.</p>
        <Link className="link-quiet" href="/">
          Back to home
        </Link>
      </div>
    </div>
  );
}
