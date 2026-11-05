# Scaffold

Turn a two-line brief into a clickable client prototype, send it on WhatsApp, and see when the client opens it.

Built for freelance developers who pitch local businesses and refuse to build free samples.

---

## Running it

```bash
cd scaffold
npm install
npm run dev          # http://localhost:3000
```

No environment variables are required. With no keys set the app runs on an
in-memory store seeded with a demo account (Zain Abbas / Abbas Digital, 8
pitches, 2 of 5 credits left) and a local package generator, so every screen and
every flow — generate, edit, send, track — is fully clickable out of the box.

Copy `.env.example` to `.env.local` to switch on the real services:

| Variable | What it turns on |
| --- | --- |
| `GEMINI_API_KEY` | Gemini 2.5 Flash as the primary generator |
| `MISTRAL_API_KEY` | Mistral failover on 429 / invalid JSON |
| `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `DEMO_USER_ID` | Supabase Postgres instead of the memory store |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Edge middleware view logging |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Pro subscription + tier sync (the webhook returns 501 until the secret is set) |
| `DEFAULT_WHATSAPP` | Number written into generated prototypes |

Other scripts: `npm run build`, `npm run start`, `npm run typecheck`.

### Cron jobs (production)

The free-tier monthly credit reset runs on a schedule. In Vercel, create a Cron Job:

| Path | Schedule | Header |
|------|----------|--------|
| `/api/cron/reset-credits` | `0 0 1 * *` (first of each month, UTC) | `Authorization: Bearer <CRON_SECRET>` |

Set the `CRON_SECRET` environment variable in your Vercel project settings and use the same value in the cron header. The route calls the `reset_monthly_credits()` SQL function, which resets `credits` to 5 for all free-tier users whose `credits_reset_at` has passed.

---

## Stack

- **Next.js 15 App Router** with TypeScript. Backend is Server Actions and Route
  Handlers only — there is no separate service.
- **Tailwind** over CSS custom properties. Every token lives in
  `src/app/globals.css`; Tailwind reads them through `tailwind.config.ts`.
- **Fonts** self-hosted through `next/font/local`: General Sans (UI) and
  JetBrains Mono (data), both `swap`.
- **Radix primitives** (dialog, switch, select, collapsible) restyled to the
  system — none are left with default styling.
- **Zod** validates form input *and* the model's JSON.
- **Supabase** Postgres + Auth (email/password and GitHub), RLS on every
  user-data table. Schema in `supabase/schema.sql`.
- **Stripe** for Pro, with a webhook that syncs `profiles.tier`.
- **Vercel** deployment; each pitch gets a public page at `/p/[pitchId]`.

---

## How generation works

1. `briefInputSchema` validates the brief before a credit is spent.
2. `pickTemplate()` maps the industry onto one of three template types —
   `service_local`, `menu_local`, `portfolio_local`.
3. Gemini 2.5 Flash is called with a JSON-schema-constrained response. On a 429
   or a network failure, Mistral runs the same prompt.
4. The response is parsed with `pitchPackageSchema`, a discriminated union on
   `templateType` with two `superRefine` passes: every `targetScreenId` must
   point at a screen that exists, and every `iconName` must be one of the 16
   whitelisted icons.
5. If validation fails, the Zod issues are appended to the prompt and the model
   gets exactly one retry before failover.

**The model never emits markup.** `src/components/prototype/frame.tsx` is the
Master Layout Wrapper — header, nav, footer, floating WhatsApp CTA, watermark
and screen routing are hand-written React. The package only fills text slots and
one accent colour, so a bad generation can look wrong but can never look broken.

---

## Tracking

On the public `/p/*` routes `src/middleware.ts` runs at the edge, filters
`WhatsApp/`, `facebookexternalhit/`, `Twitterbot/` and `TelegramBot/` link
previews, and fire-and-forget POSTs a row to `pitch_views`. Logging happens
server-side, so it survives clients who never enable JavaScript, and a link
preview never counts as an open. The same middleware enforces the whole
auth/onboarding redirect matrix on the authenticated routes before anything
renders.

---

## Routing and auth

Three route groups, one middleware gate.

**Public** — `/` (landing / get started), `/pricing`, `/login`, `/signup`,
`/forgot-password`, `/reset-password`, `/p/[pitchId]` (the client-facing link).
The landing is the one screen allowed a centered hero; it carries two ember
"Get started free" CTAs (hero + footer section, both → `/signup`) and a quiet
"Log in" in the page header.

**Authenticated** — `/onboarding`, `/dashboard`, `/pitch/new`,
`/pitch/[id]/edit` (Review & edit), `/pitch/[id]/analytics` (Analytics &
tracking), `/referrals`, `/settings`.

**Click-through contract**

- signup (email or GitHub) → `/onboarding`, always, on first run only
- login → `/dashboard`, unless onboarding is pending, then `/onboarding`
- any gated route while logged out → `/login?redirect=<path>`, honoured after
  login (so a shared analytics link still lands where it meant to)
- `/login` and `/signup` while logged in → straight to `/dashboard`
- completing onboarding → `/dashboard`; it is never shown again
- generation success → `/pitch/[id]/edit` (never back to the dashboard)
- dashboard row click → `/pitch/[id]/analytics` (the tracking view)
- rail "Review & edit" / "Analytics" with no pitch in context →
  `/dashboard?pick=…` with a prompt, never an empty screen

In the demo, sign-in is a stand-in (`src/lib/auth-actions.ts`): any credentials
attach to the seeded workspace. `scaffold_uid` and `scaffold_onboarded` cookies
carry the session state the middleware needs; Supabase Auth replaces them in
production without touching the routing contract.

Signup takes the WhatsApp number as a required field with a one-line reason. A
`?ref=CODE` on `/signup` becomes a confirmation strip above the form — never a
field to re-type. Onboarding is two short steps: confirm the number captured at
signup, then a three-card walkthrough; the last button reads "Go to dashboard".

---

## Navigation

A fixed left rail — 72px of icons, 220px on hover — never a top navbar.

```
Dashboard
Pitch                 ← expands in place, chevron, pushes the rest down
    New pitch
    Review & edit
    Analytics & tracking
    <active client name>
Referrals
Settings
                      credits, pinned near the bottom
```

The group is an accordion, not a flyout. Review & edit and Analytics are
per-pitch: with nothing selected they route to `/dashboard?pick=…`, which asks
you to choose a pitch instead of showing an empty screen. The active sub-item is
ember; the parent gets a quieter active treatment while a child is open.

---

## Design system

**Colour.** Dark and warm-neutral, never navy or purple.

| Token | Value | Used for |
| --- | --- | --- |
| `--ink` | `#15130F` | Page background |
| `--panel` | `#1E1B16` | Rail, panels, inputs |
| `--hairline` | `#35312A` | Borders and dividers — hierarchy is never done with shadow |
| `--paper` | `#F1EDE4` | Primary text |
| `--ash` | `#948C7E` | Secondary text |
| `--ember` | `#E8722C` | Primary CTA, won, active nav, credits and referrals |
| `--signal` | `#3FA9A0` | Generation, viewed, analytics numbers, system activity |

One solid ember element per screen. No gradients, no decorative accent use.

**Type.** General Sans 400–700 for everything you read; JetBrains Mono for data
only — pitch ids, timestamps, credit counts, badge labels, view counts. Sentence
case throughout: no all-caps labels, no tracked-out eyebrows.

**Layout.** Left-aligned headers, asymmetric grids weighted to content (the
pitch list is much wider than any stat block), radius only on interactive
elements, hairline borders on static containers.

**Motion.** Quiet hovers, no lift on cards. The generation screen is the only
place with real animation.

**Status badges.** Dot plus sentence-case label: `created` (ash), `sent`
(muted signal), `viewed` (signal), `in discussion` (muted ember), `won` (solid
ember), `lost` (ash, struck through).

---

## Project layout

```
src/
  app/
    (public)/         landing (/) and /pricing — the centered marketing voice
    (app)/            dashboard, pitch/new, pitch/[id]/edit, pitch/[id]/analytics,
                      referrals, settings — all inside the rail shell
    (auth)/           login, signup, forgot/reset password, onboarding
    p/[pitchId]/      the public link the client opens
    api/stripe/       webhook → profiles.tier
    globals.css       tokens and every component class
  components/
    nav-rail.tsx      the accordion rail
    brief-form.tsx    type or record a brief
    generation-sequence.tsx   the three-step build screen
    review-client.tsx preview, edit panel, send
    auth-forms.tsx    login, signup, forgot, reset, onboarding (client side)
    prototype/frame.tsx       Master Layout Wrapper (hand-written, never generated)
  lib/
    schema.ts         Zod: PitchPackage union, refinements, status vocabulary
    generate.ts       Gemini → Mistral → local fallback
    db.ts             Store interface, MemoryStore, SupabaseStore
    actions.ts        pitch server actions
    auth-actions.ts   demo sign-in/up, onboarding completion, sign-out
    session.ts        cookie session reads, safe redirect parsing
    cookies.ts        session cookie names shared with the middleware
  middleware.ts       route protection + edge view logging
supabase/schema.sql   tables, RLS policies, sign-up trigger, credit reset
```

The phase-one static prototype that this app was built from is kept in
`prototype-v0/`, and screenshots of every screen are in `shots/`.
