/**
 * Configure Supabase Auth SMTP + email templates via the Management API.
 *
 * Usage:
 *   1. Get a Personal Access Token from https://supabase.com/dashboard/account/tokens
 *   2. Set SUPABASE_ACCESS_TOKEN env var (or paste when prompted)
 *   3. Run: npx tsx scripts/configure-smtp.ts
 *
 * This configures Gmail SMTP for auth emails (confirmation, recovery, etc.).
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://mmgegocyxitgreyhuohj.supabase.co';
const PROJECT_REF = new URL(SUPABASE_URL).hostname.split('.')[0];

// Gmail SMTP — you need a Gmail App Password (not your regular password).
// Create one at: https://myaccount.google.com/apppasswords
// Requires 2-Step Verification to be enabled on the Google account.
const SMTP_HOST = process.env.SMTP_HOST ?? 'smtp.gmail.com';
const SMTP_PORT = Number(process.env.SMTP_PORT ?? 587);
const SMTP_USER = process.env.SMTP_USER ?? '';
const SMTP_PASS = process.env.SMTP_PASS ?? '';
const SMTP_SENDER = process.env.SMTP_SENDER ?? SMTP_USER;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001';

async function main() {
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
  if (!accessToken) {
    console.error('Error: SUPABASE_ACCESS_TOKEN is not set.');
    console.error('');
    console.error('Steps to get one:');
    console.error('  1. Go to https://supabase.com/dashboard/account/tokens');
    console.error('  2. Click "Generate new token"');
    console.error('  3. Copy the token and set it:');
    console.error('       $env:SUPABASE_ACCESS_TOKEN = "sbp_..."');
    console.error('');
    console.error('Then also set SMTP credentials:');
    console.error('       $env:SMTP_USER = "your@gmail.com"');
    console.error('       $env:SMTP_PASS = "your-app-password"');
    process.exit(1);
  }

  if (!SMTP_USER || !SMTP_PASS) {
    console.error('Error: SMTP_USER and SMTP_PASS must be set.');
    console.error('');
    console.error('For Gmail:');
    console.error('  1. Enable 2-Step Verification on your Google account');
    console.error('  2. Go to https://myaccount.google.com/apppasswords');
    console.error('  3. Generate an App Password');
    console.error('  4. Set:');
    console.error('       $env:SMTP_USER = "your@gmail.com"');
    console.error('       $env:SMTP_PASS = "16-character-app-password"');
    process.exit(1);
  }

  console.log(`Configuring SMTP for project: ${PROJECT_REF}`);
  console.log(`  Host: ${SMTP_HOST}:${SMTP_PORT}`);
  console.log(`  User: ${SMTP_USER}`);
  console.log(`  Sender: ${SMTP_SENDER}`);
  console.log(`  Site URL: ${SITE_URL}`);
  console.log('');

  // 1. Configure SMTP provider
  const smtpRes = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        smtp: {
          enabled: true,
          host: SMTP_HOST,
          port: SMTP_PORT,
          user: SMTP_USER,
          pass: SMTP_PASS,
          sender: SMTP_SENDER,
        },
        // Auto-confirm emails so users don't need to click a link in dev.
        // Set to true for production if you want real email confirmation.
        autoconfirm: process.env.AUTO_CONFIRM === 'true',
      }),
    },
  );

  if (!smtpRes.ok) {
    const body = await smtpRes.text();
    console.error(`SMTP config failed (${smtpRes.status}):`);
    console.error(body);
    process.exit(1);
  }
  console.log('✓ SMTP provider configured');

  // 2. Set site URL (used in email links)
  const siteRes = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        site_url: SITE_URL,
        uri_allow_list: SITE_URL,
      }),
    },
  );
  if (!siteRes.ok) {
    console.warn(`Site URL config warning: ${siteRes.status}`);
  } else {
    console.log('✓ Site URL configured');
  }

  // 3. Update email templates for branded emails
  const templates = [
    {
      name: 'confirmation',
      subject: 'Confirm your email — Scaffold',
      content: `
<div style="font-family:system-ui,-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
  <div style="margin-bottom:24px;">
    <h1 style="font-size:22px;font-weight:700;color:#15130f;margin:0 0 8px;">Confirm your email</h1>
    <p style="color:#6b6560;font-size:14px;margin:0;">Welcome to Scaffold — the fastest way to generate client pitch prototypes.</p>
  </div>
  <div style="background:#f8f6f1;border:1px solid #e8e4dc;border-radius:12px;padding:24px;margin:24px 0;">
    <p style="color:#15130f;font-size:14px;margin:0 0 16px;">Click the button below to confirm your email and activate your account.</p>
    <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#e8722c;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Confirm email</a>
  </div>
  <p style="color:#948c7e;font-size:12px;margin:0;">This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
</div>`,
    },
    {
      name: 'recovery',
      subject: 'Reset your password — Scaffold',
      content: `
<div style="font-family:system-ui,-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
  <div style="margin-bottom:24px;">
    <h1 style="font-size:22px;font-weight:700;color:#15130f;margin:0 0 8px;">Reset your password</h1>
    <p style="color:#6b6560;font-size:14px;margin:0;">We received a request to reset your Scaffold password.</p>
  </div>
  <div style="background:#f8f6f1;border:1px solid #e8e4dc;border-radius:12px;padding:24px;margin:24px 0;">
    <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#e8722c;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Reset password</a>
  </div>
  <p style="color:#948c7e;font-size:12px;margin:0;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
</div>`,
    },
  ];

  for (const tpl of templates) {
    const res = await fetch(
      `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth/email_templates/${tpl.name}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subject: tpl.subject, content: tpl.content }),
      },
    );
    if (!res.ok) {
      console.warn(`Template "${tpl.name}" warning: ${res.status}`);
    } else {
      console.log(`✓ Email template "${tpl.name}" updated`);
    }
  }

  console.log('');
  console.log('Done! Now test signup + login in the app.');
  console.log(`Auto-confirm is ${process.env.AUTO_CONFIRM === 'true' ? 'ON' : 'OFF'}.`);
  if (process.env.AUTO_CONFIRM !== 'true') {
    console.log('Tip: Set $env:AUTO_CONFIRM = "true" to skip email confirmation in dev.');
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
