# Vercel Deployment Guide — Scaffold

## 1. Install Vercel CLI (apni machine par)

```bash
npm install -g vercel
```

## 2. Login aur project link karein

Apne project folder mein jayein:

```bash
cd scaffold
vercel login
vercel
```

- `vercel` command se project link hoga.
- Jab pooche: **"Set up and deploy"?** → `Yes`
- **"Which scope?"** → apna account select karein
- **"Link to existing project?"** → `No` (naya project banayega)
- **"Project name"** → `scaffold`
- **"Directory"** → `.` (current folder)
- **"Override settings?"** → `No`

Yeh `vercel.json` aur environment variables ko read karega.

## 3. Environment Variables set karein (Vercel Dashboard)

Vercel dashboard mein jayein: **Project Settings → Environment Variables**. Ye saare add karein:

| Key | Value | Required |
|-----|-------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Apna Supabase URL | ✅ Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Apna Supabase Anon Key | ✅ Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Apna Supabase Service Role Key | ✅ Yes |
| `LEMONSQUEEZY_API_KEY` | Lemon Squeezy API Key | ⚠️ For payments |
| `LEMONSQUEEZY_STORE_ID` | Lemon Squeezy Store ID | ⚠️ For payments |
| `LEMONSQUEEZY_VARIANT_ID` | Lemon Squeezy Variant ID | ⚠️ For payments |
| `LEMONSQUEEZY_WEBHOOK_SECRET` | Lemon Squeezy Webhook Secret | ⚠️ For payments |
| `CRON_SECRET` | Koi bhi raaz password (e.g. `scaffold_cron_2026`) | ✅ Yes |
| `GEMINI_API_KEY` | Gemini API Key | ⚠️ Optional (demo works without) |
| `MISTRAL_API_KEY` | Mistral API Key | ⚠️ Optional (failover) |
| `DEFAULT_WHATSAPP` | Apna WhatsApp number | ⚠️ Optional |
| `DEFAULT_CURRENCY` | `USD` ya apna currency | ⚠️ Optional |
| `NEXT_PUBLIC_SITE_URL` | `https://scaffold.vercel.app` (apni domain) | ⚠️ Optional |
| `SENTRY_DSN` | Sentry DSN | ⚠️ Optional |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry Client DSN | ⚠️ Optional |

> **Zaroori:** `.env` file git mein nahi jaani chahiye (pehle se `.gitignore` mein hai). Sirf `.env.example` tracked hai.

## 4. Supabase Schema Run Karein

Supabase dashboard mein jayein → **SQL Editor** → `supabase/schema.sql` ka pura content paste karke **Run** karein.

Ye create karega:
- `profiles`, `pitches`, `pitch_views`, `referrals` tables
- `admin_audit_log`, `system_settings` tables
- RLS policies
- Sign-up trigger (default role = `user`)
- `reset_monthly_credits()` function

## 5. Cron Job Set Karein (Monthly Credit Reset)

Vercel dashboard mein: **Project Settings → Crons** (ya `vercel.json` mein pehle se hai).

Confirm karein:
- **Path:** `/api/cron/reset-credits`
- **Schedule:** `0 0 1 * *` (1st of every month, midnight UTC)
- **Header:** `Authorization: Bearer <CRON_SECRET>`

`vercel.json` mein ye pehle se configure hai:
```json
"crons": [
  {
    "path": "/api/cron/reset-credits",
    "schedule": "0 0 1 * *"
  }
]
```

## 6. Lemon Squeezy Webhook (Sirf Payments ke liye)

Agar Pro subscription chahiye toh:

Lemon Squeezy dashboard mein: **Settings → Webhooks**
- **URL:** `https://scaffold.vercel.app/api/lemonsqueezy/webhook`
- **Secret:** `LEMONSQUEEZY_WEBHOOK_SECRET` (jo env mein set kiya hai)

## 7. Deploy Karein

```bash
vercel --prod
```

Yeh production build banayega aur deploy karega.

---

## Kya Pehle Se Configure Hai (Code mein)

Ye sab pehle se code mein likha gaya hai, aapko sirf upar ke env vars aur Supabase setup karna hai:

- ✅ Security headers (CSP, X-Frame-Options, etc.) — `next.config.mjs`
- ✅ Sitemap + robots.txt — `src/app/sitemap.ts`, `src/app/robots.ts`
- ✅ Open Graph tags — `src/app/layout.tsx`, `src/app/p/[pitchId]/page.tsx`
- ✅ Error/loading/not-found pages — sabhi route groups mein
- ✅ Lemon Squeezy checkout + webhook — `src/app/api/checkout/`, `src/app/api/lemonsqueezy/webhook/`
- ✅ Cron reset route — `src/app/api/cron/reset-credits/`
- ✅ Sentry error tracking (optional, DSN se enable hoga)
- ✅ Unit tests (22 tests) — `npm test` ya `npx vitest run`
- ✅ Build clean — `npm run build` passes

---

## Quick Checklist

- [ ] `npm install -g vercel` kiya
- [ ] `vercel login` kiya
- [ ] `vercel` se project link kiya
- [ ] Sabhi environment variables Vercel dashboard mein add kiye
- [ ] Supabase schema run kiya (SQL Editor)
- [ ] Cron job confirm kiya (`/api/cron/reset-credits`)
- [ ] Lemon Squeezy webhook set kiya (agar payments chahiye)
- [ ] `vercel --prod` run kiya

Deploy hone ke baad aapki site live ho jayegi: `https://scaffold.vercel.app`
