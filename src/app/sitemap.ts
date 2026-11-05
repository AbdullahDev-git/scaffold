import { MetadataRoute } from 'next';
import { store } from '@/lib/db';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl.replace(/\/$/, '');

  const staticRoutes = [
    '',
    '/pricing',
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'monthly' as const,
    priority: path === '' ? 1 : 0.5,
  }));

  let pitches: Array<{ url: string; lastModified: string }> = [];
  try {
    const db = await store();
    const allPitches = await db.listPitches();
    pitches = allPitches.map((p) => ({
      url: `${base}/p/${p.slug}`,
      lastModified: p.lastViewedAt ?? p.createdAt,
    }));
  } catch {
    // store may fall back to memory; still include seeded public pitches
  }

  return [...staticRoutes, ...pitches];
}
