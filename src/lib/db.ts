import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { localPackage, pickTemplate } from './generate';
import { validateServerEnv } from './env';
import type { AuditLogEntry, Pitch, PitchStatus, PitchView, Profile, SystemSetting, UserRole } from './schema';

/**
 * One data seam, two implementations.
 *
 *   Supabase (PostgreSQL + RLS)  — used as soon as the env vars exist
 *   In-memory                    — used otherwise, so the shell is clickable with no setup
 *
 * Tables: profiles, pitches, pitch_views, referrals. RLS on every one of them —
 * see supabase/schema.sql.
 */

export interface Store {
  getProfile(): Promise<Profile>;
  listPitches(): Promise<Pitch[]>;
  getPitch(id: string): Promise<Pitch | null>;
  insertPitch(p: Pitch): Promise<void>;
  updatePitch(id: string, patch: Partial<Pitch>): Promise<void>;
  recordView(id: string, view: PitchView): Promise<void>;
  updateViewSeconds(pitchSlug: string, seconds: number): Promise<void>;
  spendCredit(): Promise<void>;
  setTier(tier: 'free' | 'pro'): Promise<void>;
  updateProfile(patch: Partial<Profile>): Promise<void>;
  listReferrals(): Promise<{ name: string; joinedAt: string; credits: number }[]>;
  awardReferral(referralCode: string, inviteeId: string, inviteeName: string): Promise<void>;
  deletePitch(id: string): Promise<void>;
  deleteAccount(): Promise<void>;
}

/* ------------------------------------------------------------------- memory */

const iso = (d: string) => new Date(d).toISOString();

/** Seed briefs, so the demo data reads like real work rather than lorem. */
const BRIEFS: Record<string, string> = {
  'Bilal Motors': 'Family auto workshop on Ferozepur Road. Service booking, a price list, and a number people can call before they drive over.',
  'Saeed Dental Studio': 'Two-chair dental clinic in Gulberg. Wants appointment requests and a clear list of treatments with prices.',
  'Karma Coffee House': 'Small speciality coffee shop on Ferozepur Road. Wants table booking, a menu page and bulk orders for offices. Only has Instagram today.',
  'Lahore Gym Collective': 'Strength gym in Johar Town. Wants trial passes booked online and the monthly plans laid out.',
  'Noor Interiors': 'Interior design studio in DHA. Wants a portfolio of finished rooms and a way to start a project enquiry.',
  'Rehman Law Chamber': 'Small legal chamber on Mall Road. Wants consultation booking and a plain list of what they handle.',
  'Green Leaf Landscaping': 'Garden maintenance crew working across Model Town. Wants quotes requested from the phone.',
  'Fatima Tailors': 'Bridal and formal tailoring on Ferozepur Road. Wants measurements booked and delivery times shown.',
};

function seedPitch(
  id: string,
  clientName: string,
  industry: string,
  status: PitchStatus,
  createdAt: string,
  views: Array<[string, PitchView['device'], number, PitchView['source']]>,
): Pitch {
  const brief = BRIEFS[clientName] ?? `${clientName} is a ${industry.toLowerCase()} that needs a site.`;
  const pkg = localPackage(
    { clientName, industry, brief, mode: 'type' },
    pickTemplate(industry),
    '+92 300 1140 662',
  );
  const viewRecords: PitchView[] = views.map(([at, device, seconds, source], i) => ({
    id: `${id}-v${i + 1}`,
    viewedAt: iso(at),
    device,
    city: 'Lahore',
    seconds,
    source,
  }));
  return {
    id,
    slug: id.toLowerCase(),
    clientName,
    industry,
    brief,
    mode: 'type',
    status,
    statusAt: iso(createdAt),
    createdAt: iso(createdAt),
    sentAt: status === 'created' ? null : iso(createdAt),
    lastViewedAt: viewRecords.length ? viewRecords[0].viewedAt : null,
    hiddenSections: [],
    provider: 'local',
    views: viewRecords,
    pkg,
  };
}

/**
 * In-memory demo data. Next compiles each route into its own bundle, so a plain
 * module-level object would give every route its own copy and a pitch created
 * by a server action would 404 on the page that follows. Hanging it off
 * globalThis keeps one instance per server process (and survives HMR).
 */
function createMemory() {
  return {
  profile: {
    id: 'usr_zain',
    fullName: 'Zain Abbas',
    businessName: 'Abbas Digital',
    city: 'Lahore',
    email: 'zain@abbasdigital.pk',
    whatsapp: '+92 300 1140 662',
    tier: 'free',
    credits: 2,
    monthlyAllowance: 5,
    creditsResetAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    referralCode: 'SCAFFOLD-ZAIN91',
    lemonSqueezyCustomerId: null,
    notifyOnView: true,
    notifyWeekly: false,
    createdAt: '2026-07-01T00:00:00.000Z',
  } as Profile,
  pitches: [
    seedPitch('PT-4193', 'Bilal Motors', 'Auto workshop', 'won', '2026-08-28T10:00:00', [
      ['2026-09-05T16:20:00', 'mobile', 134, 'whatsapp'],
      ['2026-09-02T11:12:00', 'desktop', 242, 'direct'],
    ]),
    seedPitch('PT-4188', 'Saeed Dental Studio', 'Dental clinic', 'in_discussion', '2026-09-02T09:30:00', [
      ['2026-09-07T11:04:00', 'mobile', 91, 'whatsapp'],
      ['2026-09-04T19:41:00', 'mobile', 58, 'whatsapp'],
    ]),
    seedPitch('PT-4181', 'Karma Coffee House', 'Cafe', 'viewed', '2026-09-04T14:10:00', [
      ['2026-09-08T09:41:00', 'mobile', 134, 'whatsapp'],
      ['2026-09-07T21:08:00', 'mobile', 54, 'whatsapp'],
      ['2026-09-07T18:33:00', 'desktop', 242, 'direct'],
      ['2026-09-06T12:19:00', 'mobile', 91, 'whatsapp'],
      ['2026-09-05T17:47:00', 'mobile', 38, 'whatsapp'],
    ]),
    seedPitch('PT-4177', 'Lahore Gym Collective', 'Fitness studio', 'viewed', '2026-09-05T08:00:00', [
      ['2026-09-06T20:12:00', 'mobile', 77, 'whatsapp'],
    ]),
    seedPitch('PT-4172', 'Noor Interiors', 'Interior design', 'sent', '2026-09-06T12:00:00', []),
    seedPitch('PT-4168', 'Rehman Law Chamber', 'Legal services', 'created', '2026-09-07T16:30:00', []),
    seedPitch('PT-4151', 'Green Leaf Landscaping', 'Landscaping', 'lost', '2026-08-19T10:00:00', [
      ['2026-08-22T13:55:00', 'desktop', 46, 'direct'],
    ]),
    seedPitch('PT-4147', 'Fatima Tailors', 'Tailoring', 'won', '2026-08-17T10:00:00', [
      ['2026-08-30T18:07:00', 'mobile', 188, 'whatsapp'],
    ]),
  ] as Pitch[],
  referrals: [
    { name: 'Hamza Q.', joinedAt: '2026-09-03', credits: 2 },
    { name: 'Ayesha R.', joinedAt: '2026-08-27', credits: 2 },
    { name: 'Danish M.', joinedAt: '2026-08-14', credits: 2 },
    { name: 'Owais T.', joinedAt: '2026-07-30', credits: 2 },
  ],
  };
}

type Memory = ReturnType<typeof createMemory>;
const globalState = globalThis as unknown as { __scaffoldMemory?: Memory; __scaffoldStore?: Store };
const memory: Memory = (globalState.__scaffoldMemory ??= createMemory());

class MemoryStore implements Store {
  async getProfile() {
    return memory.profile;
  }
  async listPitches() {
    return [...memory.pitches].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async getPitch(id: string) {
    return memory.pitches.find((p) => p.id === id) ?? null;
  }
  async insertPitch(p: Pitch) {
    memory.pitches.unshift(p);
  }
  async updatePitch(id: string, patch: Partial<Pitch>) {
    const i = memory.pitches.findIndex((p) => p.id === id);
    if (i >= 0) memory.pitches[i] = { ...memory.pitches[i], ...patch };
  }
  async recordView(id: string, view: PitchView) {
    const p = memory.pitches.find((x) => x.id === id);
    if (!p) return;
    p.views = [view, ...p.views];
    p.lastViewedAt = view.viewedAt;
    if (p.status === 'sent') p.status = 'viewed';
  }
  async updateViewSeconds(pitchId: string, seconds: number) {
    const p = memory.pitches.find((x) => x.id === pitchId || x.slug === pitchId);
    if (!p || p.views.length === 0) return;
    // update the most recent view record
    p.views[0] = { ...p.views[0], seconds };
  }
  async spendCredit() {
    memory.profile.credits = Math.max(0, memory.profile.credits - 1);
  }
  async setTier(tier: 'free' | 'pro') {
    memory.profile.tier = tier;
    memory.profile.credits = tier === 'pro' ? 999 : 2;
  }
  async updateProfile(patch: Partial<Profile>) {
    memory.profile = { ...memory.profile, ...patch };
  }
  async listReferrals() {
    return memory.referrals;
  }
  async awardReferral(_referralCode: string, _inviteeId: string, inviteeName: string) {
    // In demo mode, just add to the referral list and award credits.
    memory.referrals.push({ name: inviteeName, joinedAt: new Date().toISOString().slice(0, 10), credits: 2 });
    memory.profile.credits += 2;
  }
  async deletePitch(id: string) {
    memory.pitches = memory.pitches.filter((p) => p.id !== id);
  }
  async deleteAccount() {
    // In demo mode, just clear all data and reset to a fresh state.
    memory.pitches = [];
    memory.referrals = [];
    memory.profile = {
      ...memory.profile,
      fullName: '',
      businessName: '',
      email: '',
      whatsapp: '',
      tier: 'free',
      credits: 5,
    };
  }
}

/* ----------------------------------------------------------------- supabase */

function admin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

type PitchRow = {
  id: string;
  slug: string;
  client_name: string;
  industry: string;
  brief: string;
  mode: 'type' | 'voice';
  status: PitchStatus;
  status_at: string;
  created_at: string;
  sent_at: string | null;
  hidden_sections: string[];
  provider: string | null;
  package: Pitch['pkg'];
  pitch_views?: { id: string; viewed_at: string; device: 'mobile' | 'desktop' | 'tablet'; city: string; seconds: number; source: string }[];
};

const rowToPitch = (r: PitchRow): Pitch => ({
  id: r.id,
  slug: r.slug,
  clientName: r.client_name,
  industry: r.industry,
  brief: r.brief,
  mode: r.mode,
  status: r.status,
  statusAt: r.status_at,
  createdAt: r.created_at,
  sentAt: r.sent_at,
  lastViewedAt:
    r.pitch_views?.length
      ? r.pitch_views
          .map((v) => v.viewed_at)
          .sort((a, b) => b.localeCompare(a))[0]
      : null,
  hiddenSections: r.hidden_sections,
  provider: r.provider as Pitch['provider'],
  pkg: r.package,
  views: (r.pitch_views ?? [])
    .map((v) => ({ id: v.id, viewedAt: v.viewed_at, device: v.device as PitchView['device'], city: v.city, seconds: v.seconds, source: v.source as PitchView['source'] }))
    .sort((a, b) => b.viewedAt.localeCompare(a.viewedAt)),
});

class SupabaseStore implements Store {
  constructor(
    private db: SupabaseClient,
    private userId: string,
  ) {}

  async getProfile(): Promise<Profile> {
    const [{ data: profile }, { data: authUser }] = await Promise.all([
      this.db.from('profiles').select('*').eq('id', this.userId).maybeSingle(),
      this.db.auth.getUser(),
    ]);

    // Profile row might not exist yet (trigger hasn't fired, or first login).
    // Create it on the fly so the rest of the app doesn't crash.
    if (!profile) {
      const email = authUser?.user?.email ?? '';
      const fallback = {
        id: this.userId,
        full_name: email.split('@')[0] || 'User',
        business_name: '',
        city: '',
        whatsapp: '',
        tier: 'free' as const,
        credits: 5,
        credits_reset_at: new Date().toISOString(),
        referral_code: `ref_${this.userId.slice(0, 8)}`,
        notify_on_view: true,
        notify_weekly: true,
        created_at: new Date().toISOString(),
      };
      await this.db.from('profiles').upsert(fallback, { onConflict: 'id' });
      return {
        id: fallback.id,
        fullName: fallback.full_name,
        businessName: '',
        city: '',
        email,
        whatsapp: '',
        tier: 'free',
        credits: 5,
        monthlyAllowance: 0,
        creditsResetAt: fallback.credits_reset_at,
        referralCode: fallback.referral_code,
        lemonSqueezyCustomerId: null,
        notifyOnView: true,
        notifyWeekly: true,
        createdAt: fallback.created_at,
      };
    }

    return {
      id: profile.id,
      fullName: profile.full_name,
      businessName: profile.business_name,
      city: profile.city ?? '',
      email: authUser?.user?.email ?? '',
      whatsapp: profile.whatsapp ?? '',
      tier: profile.tier,
      credits: profile.credits,
      monthlyAllowance: profile.monthly_allowance ?? 0,
      creditsResetAt: profile.credits_reset_at ?? '',
      referralCode: profile.referral_code ?? '',
      lemonSqueezyCustomerId: profile.lemonsqueezy_customer_id ?? null,
      notifyOnView: profile.notify_on_view ?? true,
      notifyWeekly: profile.notify_weekly ?? true,
      createdAt: profile.created_at,
    };
  }
  async listPitches() {
    const { data } = await this.db
      .from('pitches')
      .select('*, pitch_views(*)')
      .eq('owner', this.userId)
      .order('created_at', { ascending: false });
    return (data ?? []).map(rowToPitch);
  }
  async getPitch(id: string) {
    const { data } = await this.db.from('pitches').select('*, pitch_views(*)').eq('id', id).maybeSingle();
    return data ? rowToPitch(data) : null;
  }
  async insertPitch(p: Pitch) {
    await this.db.from('pitches').insert({
      id: p.id,
      slug: p.slug,
      owner: this.userId,
      client_name: p.clientName,
      industry: p.industry,
      brief: p.brief,
      mode: p.mode,
      status: p.status,
      status_at: p.statusAt,
      package: p.pkg,
      hidden_sections: p.hiddenSections,
      provider: p.provider,
      created_at: p.createdAt,
    });
  }
  async updatePitch(id: string, patch: Partial<Pitch>) {
    const update: Record<string, unknown> = {};
    if (patch.status !== undefined) update.status = patch.status;
    if (patch.statusAt !== undefined) update.status_at = patch.statusAt;
    if (patch.sentAt !== undefined) update.sent_at = patch.sentAt;
    if (patch.pkg !== undefined) update.package = patch.pkg;
    if (patch.hiddenSections !== undefined) update.hidden_sections = patch.hiddenSections;
    if (patch.provider !== undefined) update.provider = patch.provider;
    await this.db.from('pitches').update(update).eq('id', id);
  }
  async recordView(id: string, view: PitchView) {
    await this.db.from('pitch_views').insert({
      pitch_slug: id,
      viewed_at: view.viewedAt,
      device: view.device,
      city: view.city,
      seconds: view.seconds,
      source: view.source,
    });
  }
  async updateViewSeconds(pitchSlug: string, seconds: number) {
    // Update the most recent view for this pitch slug
    const { data: views } = await this.db
      .from('pitch_views')
      .select('id')
      .eq('pitch_slug', pitchSlug)
      .order('viewed_at', { ascending: false })
      .limit(1);
    if (views && views.length > 0) {
      await this.db.from('pitch_views').update({ seconds }).eq('id', views[0].id);
    }
  }
  async spendCredit() {
    await this.db.rpc('spend_credit', { p_user: this.userId });
  }
  async setTier(tier: 'free' | 'pro') {
    await this.db.from('profiles').update({ tier }).eq('id', this.userId);
  }
  async updateProfile(patch: Partial<Profile>) {
    const update: Record<string, unknown> = {};
    if (patch.fullName !== undefined) update.full_name = patch.fullName;
    if (patch.businessName !== undefined) update.business_name = patch.businessName;
    if (patch.city !== undefined) update.city = patch.city;
    if (patch.whatsapp !== undefined) update.whatsapp = patch.whatsapp;
    if (patch.tier !== undefined) update.tier = patch.tier;
    if (patch.credits !== undefined) update.credits = patch.credits;
    if (patch.lemonSqueezyCustomerId !== undefined) update.lemonsqueezy_customer_id = patch.lemonSqueezyCustomerId;
    if (patch.notifyOnView !== undefined) update.notify_on_view = patch.notifyOnView;
    if (patch.notifyWeekly !== undefined) update.notify_weekly = patch.notifyWeekly;
    await this.db.from('profiles').update(update).eq('id', this.userId);
  }
  async listReferrals() {
    const { data } = await this.db.from('referrals').select('*').eq('referrer', this.userId);
    return (data ?? []).map((r) => ({ name: r.invitee_name, joinedAt: r.created_at, credits: r.credits }));
  }
  async awardReferral(referralCode: string, inviteeId: string, inviteeName: string) {
    // Find the referrer by their referral code.
    const { data: referrer } = await this.db.from('profiles').select('id').eq('referral_code', referralCode).maybeSingle();
    if (!referrer) return;

    // Insert the referral record.
    await this.db.from('referrals').insert({
      referrer: referrer.id,
      invitee: inviteeId,
      invitee_name: inviteeName,
      status: 'credited',
      credits: 2,
    });

    // Award 2 credits to the referrer.
    const { data: profile } = await this.db.from('profiles').select('credits').eq('id', referrer.id).single();
    if (profile) {
      await this.db.from('profiles').update({ credits: profile.credits + 2 }).eq('id', referrer.id);
    }
  }
  async deletePitch(id: string) {
    await this.db.from('pitches').delete().eq('id', id);
  }
  async deleteAccount() {
    // Delete the auth user — cascades to profiles, pitches, pitch_views, referrals
    // via foreign key constraints in the schema.
    await this.db.auth.admin.deleteUser(this.userId);
  }
}


export async function store(): Promise<Store> {
  // If server env vars aren't configured, use the shared in-memory store.
  if (!admin()) {
    if (!globalState.__scaffoldStore) {
      globalState.__scaffoldStore = new MemoryStore();
    }
    return globalState.__scaffoldStore;
  }

  // If env vars exist but validation fails, fall back to MemoryStore.
  try {
    validateServerEnv();
  } catch {
    if (!globalState.__scaffoldStore) {
      globalState.__scaffoldStore = new MemoryStore();
    }
    return globalState.__scaffoldStore;
  }

  // Supabase mode — create a fresh store per request (don't cache globally;
  // it reads cookies per request and would leak user data across warm instances).
  const db = admin();
  if (!db) {
    if (!globalState.__scaffoldStore) {
      globalState.__scaffoldStore = new MemoryStore();
    }
    return globalState.__scaffoldStore;
  }

  const { cookies } = await import('next/headers');
  const { createServerClient } = await import('@supabase/ssr');
  const jar = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const client = createServerClient(url, key, {
    cookies: {
      getAll() { return jar.getAll().map(({ name, value }) => ({ name, value })); },
      setAll() {},
    },
  });
  const { data: { user } } = await client.auth.getUser().catch(() => ({ data: { user: null } }));
  if (user) {
    return new SupabaseStore(db, user.id);
  }

  if (!globalState.__scaffoldStore) {
    globalState.__scaffoldStore = new MemoryStore();
  }
  return globalState.__scaffoldStore;
}

export const usingSupabase = () => Boolean(admin());

/* ================================================================
   AdminStore — cross-user data access for the admin panel
   ================================================================ */

export interface AdminStore {
  getSystemStats(): Promise<{
    totalUsers: number;
    totalPitches: number;
    totalViews: number;
    freeUsers: number;
    proUsers: number;
    recentSignups: number;
    recentPitches: number;
  }>;
  listUsers(params: {
    page: number;
    pageSize: number;
    search?: string;
    tier?: 'free' | 'pro';
    role?: UserRole;
    sortBy?: 'created_at' | 'full_name' | 'credits';
    sortDir?: 'asc' | 'desc';
  }): Promise<{ users: (Profile & { role: UserRole })[]; total: number }>;
  getUser(userId: string): Promise<(Profile & { role: UserRole }) | null>;
  getUserPitches(userId: string): Promise<Pitch[]>;
  updateUserRole(userId: string, role: UserRole): Promise<void>;
  updateUserCredits(userId: string, credits: number): Promise<void>;
  updateUserTier(userId: string, tier: 'free' | 'pro'): Promise<void>;
  deleteUser(userId: string): Promise<void>;
  listAllPitches(params: {
    page: number;
    pageSize: number;
    status?: PitchStatus;
    search?: string;
    sortBy?: 'created_at' | 'client_name' | 'status';
    sortDir?: 'asc' | 'desc';
  }): Promise<{ pitches: Pitch[]; total: number }>;
  adminGetPitch(pitchId: string): Promise<Pitch | null>;
  adminDeletePitch(pitchId: string): Promise<void>;
  getSettings(): Promise<SystemSetting[]>;
  updateSetting(key: string, value: unknown, actorId: string): Promise<void>;
  logAuditEntry(entry: { actorId: string; action: string; targetType: string; targetId?: string; detail?: Record<string, unknown> }): Promise<void>;
  listAuditLog(params: { page: number; pageSize: number; action?: string }): Promise<{ entries: AuditLogEntry[]; total: number }>;
}

/* ------------------------------------------------------------------- memory */

type AdminMemory = {
  users: (Profile & { role: UserRole })[];
  pitches: Pitch[];
  settings: SystemSetting[];
  auditLog: AuditLogEntry[];
};

const ADMIN_USERS: (Profile & { role: UserRole })[] = [
  { id: 'usr_zain', fullName: 'Zain Abbas', businessName: 'Abbas Digital', city: 'Lahore', email: 'zain@abbasdigital.pk', whatsapp: '+92 300 1140 662', tier: 'pro', credits: 999, monthlyAllowance: 999, creditsResetAt: '2026-10-01T00:00:00.000Z', referralCode: 'SCAFFOLD-ZAIN91', lemonSqueezyCustomerId: null, notifyOnView: true, notifyWeekly: false, createdAt: '2026-07-01T00:00:00.000Z', role: 'super_admin' },
  { id: 'usr_bilal', fullName: 'Bilal Ahmed', businessName: 'Bilal Motors', city: 'Lahore', email: 'bilal@motors.pk', whatsapp: '+92 301 1234567', tier: 'free', credits: 3, monthlyAllowance: 5, creditsResetAt: '2026-10-01T00:00:00.000Z', referralCode: 'SCAFFOLD-BILAL', lemonSqueezyCustomerId: null, notifyOnView: true, notifyWeekly: false, createdAt: '2026-08-15T00:00:00.000Z', role: 'user' },
  { id: 'usr_saeed', fullName: 'Saeed Khan', businessName: 'Saeed Dental', city: 'Gulberg', email: 'saeed@dental.pk', whatsapp: '+92 321 9876543', tier: 'pro', credits: 999, monthlyAllowance: 999, creditsResetAt: '2026-10-01T00:00:00.000Z', referralCode: 'SCAFFOLD-SAEED', lemonSqueezyCustomerId: 'ls_cust_saeed', notifyOnView: true, notifyWeekly: true, createdAt: '2026-08-20T00:00:00.000Z', role: 'user' },
  { id: 'usr_karma', fullName: 'Karma Ali', businessName: 'Karma Coffee', city: 'Ferozepur Road', email: 'karma@coffee.pk', whatsapp: '+92 300 5551234', tier: 'free', credits: 0, monthlyAllowance: 5, creditsResetAt: '2026-10-01T00:00:00.000Z', referralCode: 'SCAFFOLD-KARMA', lemonSqueezyCustomerId: null, notifyOnView: false, notifyWeekly: false, createdAt: '2026-09-01T00:00:00.000Z', role: 'user' },
  { id: 'usr_noor', fullName: 'Noor Fatima', businessName: 'Noor Interiors', city: 'DHA', email: 'noor@interiors.pk', whatsapp: '+92 333 7778899', tier: 'free', credits: 4, monthlyAllowance: 5, creditsResetAt: '2026-10-01T00:00:00.000Z', referralCode: 'SCAFFOLD-NOOR', lemonSqueezyCustomerId: null, notifyOnView: true, notifyWeekly: false, createdAt: '2026-09-05T00:00:00.000Z', role: 'user' },
];

function createAdminMemory(): AdminMemory {
  return {
    users: [...ADMIN_USERS],
    pitches: [],
    settings: [
      { key: 'free_monthly_credits', value: 5, description: 'Number of credits free-tier users receive each month', updatedBy: null, updatedAt: '2026-09-01T00:00:00.000Z' },
      { key: 'referral_bonus_credits', value: 2, description: 'Credits awarded to referrer and invitee per successful referral', updatedBy: null, updatedAt: '2026-09-01T00:00:00.000Z' },
      { key: 'max_free_pitches', value: 5, description: 'Monthly pitch allowance for free-tier accounts', updatedBy: null, updatedAt: '2026-09-01T00:00:00.000Z' },
      { key: 'pro_price_monthly', value: '$19/mo', description: 'Display price for Pro plan', updatedBy: null, updatedAt: '2026-09-01T00:00:00.000Z' },
      { key: 'maintenance_mode', value: false, description: 'When true, the app shows a maintenance banner', updatedBy: null, updatedAt: '2026-09-01T00:00:00.000Z' },
    ],
    auditLog: [],
  };
}

type AdminMem = ReturnType<typeof createAdminMemory>;
const globalAdminState = globalThis as unknown as { __scaffoldAdminMemory?: AdminMem };
const adminMemory: AdminMem = (globalAdminState.__scaffoldAdminMemory ??= createAdminMemory());

class MemoryAdminStore implements AdminStore {
  async getSystemStats() {
    const users = adminMemory.users;
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    return {
      totalUsers: users.length,
      totalPitches: memory.pitches.length,
      totalViews: memory.pitches.reduce((sum, p) => sum + p.views.length, 0),
      freeUsers: users.filter((u) => u.tier === 'free').length,
      proUsers: users.filter((u) => u.tier === 'pro').length,
      recentSignups: users.filter((u) => new Date(u.createdAt).getTime() > weekAgo).length,
      recentPitches: memory.pitches.filter((p) => new Date(p.createdAt).getTime() > weekAgo).length,
    };
  }
  async listUsers(params: { page: number; pageSize: number; search?: string; tier?: 'free' | 'pro'; role?: UserRole; sortBy?: 'created_at' | 'full_name' | 'credits'; sortDir?: 'asc' | 'desc' }) {
    const { page, pageSize, search, tier, role, sortBy = 'created_at', sortDir = 'desc' } = params;
    const sortMap: Record<string, keyof (Profile & { role: UserRole })> = { created_at: 'createdAt', full_name: 'fullName', credits: 'credits' };
    const sortKey = sortMap[sortBy] ?? 'createdAt';
    let filtered = [...adminMemory.users];
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((u) => u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.businessName.toLowerCase().includes(q));
    }
    if (tier) filtered = filtered.filter((u) => u.tier === tier);
    if (role) filtered = filtered.filter((u) => u.role === role);
    filtered.sort((a, b) => {
      const av = a[sortKey] ?? '';
      const bv = b[sortKey] ?? '';
      const cmp = String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });
    const total = filtered.length;
    const users = filtered.slice((page - 1) * pageSize, page * pageSize);
    return { users, total };
  }
  async getUser(userId: string) {
    return adminMemory.users.find((u) => u.id === userId) ?? null;
  }
  async getUserPitches(userId: string) {
    return memory.pitches.filter((p) => p.id.startsWith(userId.slice(4)));
  }
  async updateUserRole(userId: string, role: UserRole) {
    const u = adminMemory.users.find((x) => x.id === userId);
    if (u) u.role = role;
  }
  async updateUserCredits(userId: string, credits: number) {
    const u = adminMemory.users.find((x) => x.id === userId);
    if (u) u.credits = credits;
  }
  async updateUserTier(userId: string, tier: 'free' | 'pro') {
    const u = adminMemory.users.find((x) => x.id === userId);
    if (u) { u.tier = tier; u.credits = tier === 'pro' ? 999 : 5; }
  }
  async deleteUser(userId: string) {
    adminMemory.users = adminMemory.users.filter((u) => u.id !== userId);
  }
  async listAllPitches(params: { page: number; pageSize: number; status?: PitchStatus; search?: string; sortBy?: 'created_at' | 'client_name' | 'status'; sortDir?: 'asc' | 'desc' }) {
    const { page, pageSize, status, search, sortBy = 'created_at', sortDir = 'desc' } = params;
    const sortMap: Record<string, keyof Pitch> = { created_at: 'createdAt', client_name: 'clientName', status: 'status' };
    const sortKey = sortMap[sortBy] ?? 'createdAt';
    let filtered = [...memory.pitches];
    if (status) filtered = filtered.filter((p) => p.status === status);
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((p) => p.clientName.toLowerCase().includes(q) || p.industry.toLowerCase().includes(q));
    }
    filtered.sort((a, b) => {
      const av = a[sortKey] ?? '';
      const bv = b[sortKey] ?? '';
      const cmp = String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });
    const total = filtered.length;
    const pitches = filtered.slice((page - 1) * pageSize, page * pageSize);
    return { pitches, total };
  }
  async adminGetPitch(pitchId: string) {
    return memory.pitches.find((p) => p.id === pitchId) ?? null;
  }
  async adminDeletePitch(pitchId: string) {
    memory.pitches = memory.pitches.filter((p) => p.id !== pitchId);
  }
  async getSettings() {
    return adminMemory.settings;
  }
  async updateSetting(key: string, value: unknown, actorId: string) {
    const s = adminMemory.settings.find((x) => x.key === key);
    if (s) { s.value = value; s.updatedBy = actorId; s.updatedAt = new Date().toISOString(); }
  }
  async logAuditEntry(entry: { actorId: string; action: string; targetType: string; targetId?: string; detail?: Record<string, unknown> }) {
    adminMemory.auditLog.unshift({
      id: adminMemory.auditLog.length + 1,
      actorId: entry.actorId,
      action: entry.action,
      targetType: entry.targetType,
      targetId: entry.targetId ?? null,
      detail: entry.detail ?? {},
      createdAt: new Date().toISOString(),
    });
  }
  async listAuditLog(params: { page: number; pageSize: number; action?: string }) {
    const { page, pageSize, action } = params;
    let filtered = [...adminMemory.auditLog];
    if (action) filtered = filtered.filter((e) => e.action === action);
    const total = filtered.length;
    const entries = filtered.slice((page - 1) * pageSize, page * pageSize);
    return { entries, total };
  }
}

/* ------------------------------------------------------------------- supabase */

function rowToAdminProfile(row: Record<string, unknown>): Profile & { role: UserRole } {
  return {
    id: row.id as string,
    fullName: row.full_name as string,
    businessName: row.business_name as string,
    city: row.city as string,
    email: (row.email as string) ?? '',
    whatsapp: row.whatsapp as string,
    tier: row.tier as 'free' | 'pro',
    credits: row.credits as number,
    monthlyAllowance: row.monthly_allowance as number ?? 5,
    creditsResetAt: row.credits_reset_at as string,
    referralCode: row.referral_code as string,
    lemonSqueezyCustomerId: row.lemonsqueezy_customer_id as string | null,
    notifyOnView: row.notify_on_view as boolean,
    notifyWeekly: row.notify_weekly as boolean,
    createdAt: row.created_at as string,
    role: (row.role as UserRole) ?? 'user',
  };
}

class SupabaseAdminStore implements AdminStore {
  constructor(private db: SupabaseClient) {}

  async getSystemStats() {
    const [usersCount, pitchesCount, viewsCount, freeCount, proCount, recentUsers, recentPitches] = await Promise.all([
      this.db.from('profiles').select('id', { count: 'exact', head: true }),
      this.db.from('pitches').select('id', { count: 'exact', head: true }),
      this.db.from('pitch_views').select('id', { count: 'exact', head: true }),
      this.db.from('profiles').select('id', { count: 'exact', head: true }).eq('tier', 'free'),
      this.db.from('profiles').select('id', { count: 'exact', head: true }).eq('tier', 'pro'),
      this.db.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      this.db.from('pitches').select('id', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    ]);
    return {
      totalUsers: usersCount.count ?? 0,
      totalPitches: pitchesCount.count ?? 0,
      totalViews: viewsCount.count ?? 0,
      freeUsers: freeCount.count ?? 0,
      proUsers: proCount.count ?? 0,
      recentSignups: recentUsers.count ?? 0,
      recentPitches: recentPitches.count ?? 0,
    };
  }

  async listUsers(params: { page: number; pageSize: number; search?: string; tier?: 'free' | 'pro'; role?: UserRole; sortBy?: 'created_at' | 'full_name' | 'credits'; sortDir?: 'asc' | 'desc' }) {
    const { page, pageSize, search, tier, role, sortBy = 'created_at', sortDir = 'desc' } = params;
    let query = this.db.from('profiles').select('*', { count: 'exact' });
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,business_name.ilike.%${search}%`);
    }
    if (tier) query = query.eq('tier', tier);
    if (role) query = query.eq('role', role);
    const sortColumn = sortBy === 'full_name' ? 'full_name' : sortBy;
    query = query.order(sortColumn, { ascending: sortDir === 'asc' });
    const from = (page - 1) * pageSize;
    query = query.range(from, from + pageSize - 1);
    const { data, count } = await query;
    return { users: (data ?? []).map(rowToAdminProfile), total: count ?? 0 };
  }

  async getUser(userId: string) {
    const { data } = await this.db.from('profiles').select('*').eq('id', userId).maybeSingle();
    return data ? rowToAdminProfile(data) : null;
  }

  async getUserPitches(userId: string) {
    const { data } = await this.db.from('pitches').select('*, pitch_views(*)').eq('owner', userId).order('created_at', { ascending: false });
    return (data ?? []).map(rowToPitch);
  }

  async updateUserRole(userId: string, role: UserRole) {
    await this.db.from('profiles').update({ role }).eq('id', userId);
  }
  async updateUserCredits(userId: string, credits: number) {
    await this.db.from('profiles').update({ credits }).eq('id', userId);
  }
  async updateUserTier(userId: string, tier: 'free' | 'pro') {
    await this.db.from('profiles').update({ tier, credits: tier === 'pro' ? 999 : 5 }).eq('id', userId);
  }
  async deleteUser(userId: string) {
    await this.db.auth.admin.deleteUser(userId);
  }

  async listAllPitches(params: { page: number; pageSize: number; status?: PitchStatus; search?: string; sortBy?: 'created_at' | 'client_name' | 'status'; sortDir?: 'asc' | 'desc' }) {
    const { page, pageSize, status, search, sortBy = 'created_at', sortDir = 'desc' } = params;
    let query = this.db.from('pitches').select('*, pitch_views(*)', { count: 'exact' });
    if (status) query = query.eq('status', status);
    if (search) {
      query = query.or(`client_name.ilike.%${search}%,industry.ilike.%${search}%`);
    }
    const sortColumn = sortBy === 'client_name' ? 'client_name' : sortBy === 'status' ? 'status' : 'created_at';
    query = query.order(sortColumn, { ascending: sortDir === 'asc' });
    const from = (page - 1) * pageSize;
    query = query.range(from, from + pageSize - 1);
    const { data, count } = await query;
    return { pitches: (data ?? []).map(rowToPitch), total: count ?? 0 };
  }

  async adminGetPitch(pitchId: string) {
    const { data } = await this.db.from('pitches').select('*, pitch_views(*)').eq('id', pitchId).maybeSingle();
    return data ? rowToPitch(data) : null;
  }

  async adminDeletePitch(pitchId: string) {
    await this.db.from('pitches').delete().eq('id', pitchId);
  }

  async getSettings() {
    const { data } = await this.db.from('system_settings').select('*');
    return (data ?? []).map((r: Record<string, unknown>) => ({
      key: r.key as string,
      value: r.value,
      description: r.description as string,
      updatedBy: r.updated_by as string | null,
      updatedAt: r.updated_at as string,
    }));
  }

  async updateSetting(key: string, value: unknown, actorId: string) {
    await this.db.from('system_settings').update({ value, updated_by: actorId, updated_at: new Date().toISOString() }).eq('key', key);
  }

  async logAuditEntry(entry: { actorId: string; action: string; targetType: string; targetId?: string; detail?: Record<string, unknown> }) {
    await this.db.from('admin_audit_log').insert({
      actor_id: entry.actorId,
      action: entry.action,
      target_type: entry.targetType,
      target_id: entry.targetId ?? null,
      detail: entry.detail ?? {},
    });
  }

  async listAuditLog(params: { page: number; pageSize: number; action?: string }) {
    const { page, pageSize, action } = params;
    let query = this.db.from('admin_audit_log').select('*', { count: 'exact' });
    if (action) query = query.eq('action', action);
    query = query.order('created_at', { ascending: false });
    const from = (page - 1) * pageSize;
    query = query.range(from, from + pageSize - 1);
    const { data, count } = await query;
    return {
      entries: (data ?? []).map((r: Record<string, unknown>) => ({
        id: r.id as number,
        actorId: r.actor_id as string,
        action: r.action as string,
        targetType: r.target_type as string,
        targetId: r.target_id as string | null,
        detail: (r.detail as Record<string, unknown>) ?? {},
        createdAt: r.created_at as string,
      })),
      total: count ?? 0,
    };
  }
}

/* ------------------------------------------------------------------- factory */

let __adminStore: AdminStore | null = null;

export async function adminStore(): Promise<AdminStore> {
  // If server env vars aren't configured, use the shared in-memory admin store.
  if (!admin()) {
    if (!__adminStore) {
      __adminStore = new MemoryAdminStore() as unknown as AdminStore;
    }
    return __adminStore;
  }

  try {
    validateServerEnv();
  } catch {
    if (!__adminStore) {
      __adminStore = new MemoryAdminStore() as unknown as AdminStore;
    }
    return __adminStore;
  }

  const db = admin();
  if (db) {
    // Supabase admin store — don't cache globally (request-scoped).
    return new SupabaseAdminStore(db) as unknown as AdminStore;
  }

  if (!__adminStore) {
    __adminStore = new MemoryAdminStore() as unknown as AdminStore;
  }
  return __adminStore;
}
