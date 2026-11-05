import { z } from 'zod';

/**
 * PitchPackage — the only thing the LLM is allowed to produce.
 *
 * The Master Layout Wrapper (header, footer, floating WhatsApp CTA, watermark,
 * screen routing) is hand-written React in components/prototype/. The model never
 * emits markup or class names — it emits validated content that gets injected into
 * that wrapper.
 */

/** Whitelist — anything outside this set fails validation rather than rendering a blank box. */
export const ICON_NAMES = [
  'clock', 'phone', 'pin', 'star', 'shield', 'truck', 'wrench', 'leaf',
  'cup', 'scissors', 'tooth', 'dumbbell', 'brush', 'gavel', 'camera', 'spark',
] as const;
export type IconName = (typeof ICON_NAMES)[number];

const iconName = z.enum(ICON_NAMES);
const hex = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'accent must be a 6-digit hex colour');
const screenId = z.string().regex(/^[a-z][a-z0-9-]{1,30}$/, 'screen ids are lowercase slugs');
const shortText = z.string().min(1).max(80);
const bodyText = z.string().min(1).max(240);

/* ---------------------------------------------------------------- sections */

const heroSection = z.object({
  kind: z.literal('hero'),
  headline: z.string().min(4).max(90),
  subhead: bodyText,
  primaryLabel: shortText,
  secondaryLabel: shortText.optional(),
  /** must resolve to a screen in this package, or be the WhatsApp action */
  primaryTarget: z.union([screenId, z.literal('whatsapp')]),
});

const featureGridSection = z.object({
  kind: z.literal('featureGrid'),
  title: shortText.optional(),
  items: z
    .array(z.object({ iconName, title: shortText, body: bodyText }))
    .min(2)
    .max(4),
});

const priceListSection = z.object({
  kind: z.literal('priceList'),
  title: shortText.optional(),
  items: z
    .array(z.object({ name: shortText, detail: bodyText, price: z.string().min(1).max(24) }))
    .min(2)
    .max(8),
});

const galleryStripSection = z.object({
  kind: z.literal('galleryStrip'),
  title: shortText.optional(),
  captions: z.array(shortText).min(2).max(6),
});

const contactSection = z.object({
  kind: z.literal('contact'),
  headline: z.string().min(4).max(90),
  fields: z.array(shortText).min(2).max(5),
  submitLabel: shortText,
});

const callStripSection = z.object({
  kind: z.literal('callStrip'),
  message: bodyText,
});

export const sectionSchema = z.discriminatedUnion('kind', [
  heroSection,
  featureGridSection,
  priceListSection,
  galleryStripSection,
  contactSection,
  callStripSection,
]);
export type Section = z.infer<typeof sectionSchema>;
export type SectionKind = Section['kind'];

const screenSchema = z.object({
  id: screenId,
  name: shortText,
  sections: z.array(sectionSchema).min(1).max(5),
});

/* --------------------------------------------------------------- templates */

const base = {
  version: z.literal(1),
  business: z.object({
    name: z.string().min(1).max(60),
    industry: z.string().min(1).max(40),
    whatsapp: z.string().min(6).max(24),
  }),
  theme: z.object({ accent: hex }),
  screens: z.array(screenSchema).min(2).max(6),
  /** the single action the prototype is built to drive */
  primaryCta: z.object({ label: shortText, target: z.union([screenId, z.literal('whatsapp')]) }),
};

const rawPackage = z.discriminatedUnion('templateType', [
  z.object({ templateType: z.literal('service_local'), ...base }),
  z.object({ templateType: z.literal('menu_booking'), ...base, bookingNote: bodyText }),
  z.object({ templateType: z.literal('portfolio_showcase'), ...base, caseStudyCount: z.number().int().min(2).max(12) }),
]);

/* ------------------------------------------------------- referential checks */

/** Every `targetScreenId` has to point at a screen that actually exists in this package. */
export const pitchPackageSchema = rawPackage.superRefine((pkg, ctx) => {
  const ids = new Set(pkg.screens.map((s) => s.id));

  if (ids.size !== pkg.screens.length) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['screens'], message: 'screen ids must be unique' });
  }

  if (pkg.primaryCta.target !== 'whatsapp' && !ids.has(pkg.primaryCta.target)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['primaryCta', 'target'],
      message: `primaryCta.target "${pkg.primaryCta.target}" does not match any screen id (${[...ids].join(', ')})`,
    });
  }

  pkg.screens.forEach((screen, si) =>
    screen.sections.forEach((section, xi) => {
      if (section.kind !== 'hero') return;
      if (section.primaryTarget !== 'whatsapp' && !ids.has(section.primaryTarget)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['screens', si, 'sections', xi, 'primaryTarget'],
          message: `primaryTarget "${section.primaryTarget}" does not match any screen id (${[...ids].join(', ')})`,
        });
      }
    }),
  );

  if (!pkg.screens.some((s) => s.sections.some((x) => x.kind === 'hero'))) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['screens'], message: 'at least one screen needs a hero section' });
  }
});

export type PitchPackage = z.infer<typeof pitchPackageSchema>;
export type TemplateType = PitchPackage['templateType'];

/* ------------------------------------------------------------ record types */

export const PITCH_STATUSES = ['created', 'sent', 'viewed', 'in_discussion', 'won', 'lost'] as const;
export type PitchStatus = (typeof PITCH_STATUSES)[number];

export const STATUS_LABEL: Record<PitchStatus, string> = {
  created: 'created',
  sent: 'sent',
  viewed: 'viewed',
  in_discussion: 'in discussion',
  won: 'won',
  lost: 'lost',
};

export type PitchView = {
  id: string;
  viewedAt: string;
  device: 'mobile' | 'desktop' | 'tablet';
  city: string;
  seconds: number;
  source: 'whatsapp' | 'direct' | 'referral';
};

export type Pitch = {
  id: string;
  slug: string;
  clientName: string;
  industry: string;
  brief: string;
  mode: 'type' | 'voice';
  status: PitchStatus;
  statusAt: string;
  createdAt: string;
  sentAt: string | null;
  lastViewedAt: string | null;
  hiddenSections: string[];
  provider: 'gemini' | 'mistral' | 'local' | null;
  views: PitchView[];
  pkg: PitchPackage;
};

export type Profile = {
  id: string;
  fullName: string;
  businessName: string;
  city: string;
  email: string;
  whatsapp: string;
  tier: 'free' | 'pro';
  credits: number;
  monthlyAllowance: number;
  creditsResetAt: string;
  referralCode: string;
  lemonSqueezyCustomerId: string | null;
  notifyOnView: boolean;
  notifyWeekly: boolean;
  createdAt: string;
};

/** Shape the brief form posts to the generator. */
export const briefInputSchema = z.object({
  clientName: z.string().min(2, 'Add the client name.').max(60),
  industry: z.string().min(2, 'Pick an industry.').max(40),
  brief: z.string().min(20, 'Give the model two or three sentences to work with.').max(1200),
  mode: z.enum(['type', 'voice']),
});
export type BriefInput = z.infer<typeof briefInputSchema>;

/* ------------------------------------------------------------ admin types */

export const USER_ROLES = ['user', 'admin', 'super_admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export type AuditLogEntry = {
  id: number;
  actorId: string;
  action: string;
  targetType: string;
  targetId: string | null;
  detail: Record<string, unknown>;
  createdAt: string;
};

export type SystemSetting = {
  key: string;
  value: unknown;
  description: string;
  updatedBy: string | null;
  updatedAt: string;
};
