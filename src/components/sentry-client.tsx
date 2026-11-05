'use client';

import { useEffect } from 'react';
import * as SentryClient from '../../sentry.client';

/**
 * Initializes client-side Sentry error and performance tracking.
 * Only active when NEXT_PUBLIC_SENTRY_DSN is configured.
 */
export function SentryClientInitializer() {
  useEffect(() => {
    // Sentry is initialized at import time via sentry.client.ts.
    // This component exists purely as a client-side boundary to mount it.
  }, []);

  return null;
}
