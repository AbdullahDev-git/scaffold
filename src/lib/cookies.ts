/**
 * Session cookie names. Kept in their own module — with no server-only
 * imports — so the edge middleware can read the same names the server
 * actions write. Supabase Auth issues the real session in production;
 * these carry the demo identity until then.
 */
export const UID_COOKIE = 'scaffold_uid';
export const ONB_COOKIE = 'scaffold_onboarded';
export const WA_COOKIE = 'scaffold_wa';
export const ROLE_COOKIE = 'scaffold_role';
