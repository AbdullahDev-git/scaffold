import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Two jobs, both server-side by design:
 *
 * 1. Route protection. Authenticated routes need a session cookie; login and
 *    signup bounce straight to the dashboard once you have one.
 *    When Supabase env vars are set, we check the Supabase session.
 *    Otherwise we fall back to the custom scaffold_uid cookie (demo mode).
 *
 * 2. Server-side pitch-view logging on the public /p/* routes, so a blocked
 *    analytics script or a stripped client bundle cannot hide a real open.
 *    Link unfurlers are filtered out — WhatsApp pre-fetches every link it is
 *    sent, and those are not views.
 */
const BOTS = [
  'WhatsApp/',
  'facebookexternalhit/',
  'Twitterbot/',
  'TelegramBot',
  'LinkedInBot',
  'Slackbot',
  'Discordbot',
  'SkypeUriPreview',
  'vkShare',
  'redditbot',
];

const AUTH_PREFIXES = ['/dashboard', '/pitch', '/referrals', '/settings', '/admin'];
const ENTRY_PAGES = ['/login', '/signup'];

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  /* ------------------------------------------------ public client pitches */
  if (pathname.startsWith('/p/')) {
    const ua = req.headers.get('user-agent') ?? '';
    const isBot = BOTS.some((b) => ua.toLowerCase().includes(b.toLowerCase()));
    const pitchId = pathname.split('/')[2];

    if (!isBot && pitchId) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (url && key) {
        // fire and forget — never make the client wait on analytics
        void fetch(`${url}/rest/v1/pitch_views`, {
          method: 'POST',
          headers: {
            apikey: key,
            authorization: `Bearer ${key}`,
            'content-type': 'application/json',
            prefer: 'return=minimal',
          },
          body: JSON.stringify({
            pitch_slug: pitchId,
            viewed_at: new Date().toISOString(),
            device: /mobile|android|iphone/i.test(ua) ? 'mobile' : 'desktop',
            city: req.headers.get('x-vercel-ip-city') ?? 'unknown',
            source: req.headers.get('referer')?.includes('whatsapp') ? 'whatsapp' : 'direct',
            user_agent: ua.slice(0, 200),
          }),
        }).catch(() => undefined);
      }
    }

    const res = NextResponse.next();
    res.headers.set('x-scaffold-view-logged', String(!isBot));
    return res;
  }

  /* ------------------------------------------------------ route protection */
  const needsAuth = AUTH_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`)) && pathname !== '/admin/login';
  const back = `${pathname}${search}`;

  // A Server Action POST (next-action header) must always run to completion —
  // redirecting one from middleware corrupts the flight response and surfaces
  // as "An unexpected response was received from the server" in the client.
  if (req.headers.get('next-action')) return NextResponse.next();

  // RSC flight requests (client-side navigation) must also not be redirected —
  // same flight-response corruption.
  if (req.headers.get('rsc') === '1' || req.headers.get('next-router-prefetch')) return NextResponse.next();

  // Check for authenticated user — Supabase session or demo cookie.
  let uid: string | undefined;
  let onboarded = false;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    // Production: check Supabase session.
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return req.cookies.getAll().map(({ name, value }) => ({ name, value }));
        },
        setAll() {},
      },
    });
    const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
    uid = user?.id;
    // Also check custom cookie (used by admin login)
    if (!uid) uid = req.cookies.get('scaffold_uid')?.value;
    onboarded = req.cookies.get('scaffold_onboarded')?.value === '1';
  } else {
    // Demo mode: check custom cookie.
    uid = req.cookies.get('scaffold_uid')?.value;
    onboarded = req.cookies.get('scaffold_onboarded')?.value === '1';
  }

  // logged out on an authenticated route → login, remembering where they meant to go
  if (!uid && needsAuth) {
    return NextResponse.redirect(new URL(`/login?redirect=${encodeURIComponent(back)}`, req.url));
  }

  // signed in but onboarding is pending → onboarding, from anywhere in the app
  if (uid && !onboarded && needsAuth && pathname !== '/onboarding') {
    return NextResponse.redirect(new URL(`/onboarding?redirect=${encodeURIComponent(back)}`, req.url));
  }

  // onboarding is once-only — completed users never see it again
  if (uid && onboarded && pathname === '/onboarding') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // a logged-in user should never see the login or signup form again
  if (uid && ENTRY_PAGES.includes(pathname)) {
    return NextResponse.redirect(new URL(onboarded ? '/dashboard' : '/onboarding', req.url));
  }

  // Admin routes require admin or super_admin role — check via cookie
  // But skip the check for /admin/login itself
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const role = req.cookies.get('scaffold_role')?.value;
    if (role !== 'admin' && role !== 'super_admin') {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
  }

  // Redirect logged-in admins away from /admin/login
  if (pathname === '/admin/login') {
    const role = req.cookies.get('scaffold_role')?.value;
    if (role === 'admin' || role === 'super_admin') {
      return NextResponse.redirect(new URL('/admin', req.url));
    }
  }

  return NextResponse.next();
}

// everything except framework assets and any file with an extension
export const config = { matcher: ['/((?!_next|favicon.ico|.*\\..*).*)'] };
