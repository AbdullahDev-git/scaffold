import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { SentryClientInitializer } from '@/components/sentry-client';
import './globals.css';

const generalSans = localFont({
  variable: '--font-sans',
  display: 'swap',
  src: [
    { path: '../fonts/gs-400.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/gs-500.woff2', weight: '500', style: 'normal' },
    { path: '../fonts/gs-600.woff2', weight: '600', style: 'normal' },
    { path: '../fonts/gs-700.woff2', weight: '700', style: 'normal' },
  ],
});

const jetbrainsMono = localFont({
  variable: '--font-mono',
  display: 'swap',
  src: [{ path: '../fonts/jb-400.woff2', weight: '100 800', style: 'normal' }],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001';

export const metadata: Metadata = {
  title: 'Scaffold — brief to prototype in under a minute',
  description:
    'Scaffold turns a short client brief into an interactive multi-screen prototype in under 60 seconds, so freelancers can pitch without unpaid sample work.',
  openGraph: {
    title: 'Scaffold — brief to prototype in under a minute',
    description:
      'Scaffold turns a short client brief into an interactive multi-screen prototype in under 60 seconds, so freelancers can pitch without unpaid sample work.',
    url: siteUrl,
    siteName: 'Scaffold',
    images: [
      {
        url: `${siteUrl}/scaffold-logo.png`,
        width: 1200,
        height: 630,
        alt: 'Scaffold',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Scaffold — brief to prototype in under a minute',
    description:
      'Scaffold turns a short client brief into an interactive multi-screen prototype in under 60 seconds.',
    images: [`${siteUrl}/scaffold-logo.png`],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${generalSans.variable} ${jetbrainsMono.variable}`}>
      <body suppressHydrationWarning>
        <SentryClientInitializer />
        {children}
      </body>
    </html>
  );
}
