import * as Sentry from '@sentry/nextjs';

const sentry = Sentry.init({
  dsn: process.env.SENTRY_DSN || '',
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  debug: process.env.NODE_ENV !== 'production',
  environment: process.env.NODE_ENV,
  // Only capture errors in production if DSN is set
  enabled: !!process.env.SENTRY_DSN,
  integrations: [
    Sentry.httpContextIntegration(),
  ],
  // Ignore Next.js hydration errors that are expected
  ignoreErrors: [
    'The script has an unsupported MIME type',
    'Non-Error promise rejection captured',
    'Hydration failed',
  ],
  beforeSend(event, hint) {
    // Don't send errors without a DSN configured
    if (!process.env.SENTRY_DSN) return null;
    return event;
  },
});

export default sentry;
