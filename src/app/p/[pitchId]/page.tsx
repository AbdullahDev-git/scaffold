import { notFound } from 'next/navigation';
import { PublicPrototype } from '@/components/public-prototype';
import { store } from '@/lib/db';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001';

export const dynamic = 'force-dynamic';

export function generateMetadata({ params }: { params: Promise<{ pitchId: string }> }): Promise<{
  title: string;
  description: string;
  openGraph: {
    title: string;
    description: string;
    url: string;
    images: Array<{ url: string; width: number; height: number; alt: string }>;
  };
}> {
  return (async () => {
    const { pitchId } = await params;
    const db = await store();
    const pitch = await db.getPitch(pitchId);
    if (!pitch) {
      notFound();
    }

    const url = `${siteUrl.replace(/\/$/, '')}/p/${pitch.slug}`;
    return {
      title: `${pitch.clientName} — Pitch Prototype`,
      description: `See the pitch prototype for ${pitch.clientName}, a ${pitch.industry} business.`,
      openGraph: {
        title: `${pitch.clientName} — Pitch Prototype`,
        description: `See the pitch prototype for ${pitch.clientName}, a ${pitch.industry} business.`,
        url,
        images: [
          {
            url: `${siteUrl}/scaffold-logo.png`,
            width: 1200,
            height: 630,
            alt: `${pitch.clientName} pitch prototype`,
          },
        ],
      },
    };
  })();
}

/**
 * Public pitch link. Views are logged by edge middleware before this renders,
 * so ad blockers and stripped client scripts cannot hide a real open.
 */
export default async function PublicPitchPage({ params }: { params: Promise<{ pitchId: string }> }) {
  const { pitchId } = await params;
  const db = await store();
  const pitch = await db.getPitch(pitchId);
  if (!pitch) notFound();

  return (
    <main className="min-h-screen bg-[#0f0e0b]">
      <PublicPrototype pkg={pitch.pkg} pitchId={pitch.id} />
    </main>
  );
}
