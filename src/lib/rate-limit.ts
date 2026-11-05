// Rate limiting utility (not a Server Action)

import { headers } from 'next/headers';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 5;

let ratelimit: Ratelimit | null = null;

function getRatelimit(): Ratelimit {
  if (ratelimit) return ratelimit;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set for rate limiting');
  }

  const redis = new Redis({ url, token });
  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(MAX_REQUESTS, `${WINDOW_MS} ms`),
    analytics: true,
    prefix: 'scaffold:ratelimit',
  });
  return ratelimit;
}

function getKey(identifier: string, action: string): string {
  return `${action}:${identifier}`;
}

async function getIdentifier(): Promise<string> {
  const headersList = await headers();
  const forwarded = headersList.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  return ip;
}

export async function checkRateLimit(action: string): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  try {
    const identifier = await getIdentifier();
    const key = getKey(identifier, action);
    const rl = getRatelimit();
    const result = await rl.limit(key);

    return {
      allowed: result.success,
      remaining: result.remaining,
      resetAt: result.reset,
    };
  } catch (err) {
    console.error('[RATE_LIMIT] Error, allowing request:', (err as Error).message);
    return { allowed: true, remaining: MAX_REQUESTS, resetAt: Date.now() + WINDOW_MS };
  }
}

export function createRateLimitError(resetAt: number): string {
  const seconds = Math.ceil((resetAt - Date.now()) / 1000);
  return `Too many attempts. Try again in ${seconds} second${seconds !== 1 ? 's' : ''}.`;
}