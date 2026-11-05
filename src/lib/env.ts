const requiredServer = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
] as const;

const requiredClient = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'] as const;

const optionalServer = [
  'GEMINI_API_KEY',
  'MISTRAL_API_KEY',
  'LEMONSQUEEZY_API_KEY',
  'LEMONSQUEEZY_WEBHOOK_SECRET',
  'LEMONSQUEEZY_STORE_ID',
  'LEMONSQUEEZY_VARIANT_ID',
  'NEXT_PUBLIC_LEMONSQUEZY_STORE_URL',
  'DEFAULT_WHATSAPP',
  'NEXT_PUBLIC_SITE_URL',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
] as const;

export type ServerEnv = Record<(typeof requiredServer)[number] | (typeof optionalServer)[number], string | undefined>;

let validatedServer: ServerEnv | null = null;

export function validateServerEnv(): ServerEnv {
  if (validatedServer) return validatedServer;

  const missing = requiredServer.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required server environment variables: ${missing.join(', ')}`);
  }

  validatedServer = {
    ...Object.fromEntries(requiredServer.map((k) => [k, process.env[k]])),
    ...Object.fromEntries(optionalServer.map((k) => [k, process.env[k]])),
  } as ServerEnv;

  return validatedServer;
}

export function validateClientEnv(): void {
  if (typeof window === 'undefined') return;
  const missing = requiredClient.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(`Missing required client environment variables: ${missing.join(', ')}`);
  }
}

export function getServerEnv(): ServerEnv {
  return validateServerEnv();
}