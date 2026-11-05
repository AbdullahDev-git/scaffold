import { z } from 'zod';
import {
  ICON_NAMES,
  pitchPackageSchema,
  type BriefInput,
  type PitchPackage,
  type TemplateType,
} from './schema';

/**
 * Generation path
 *
 *   Gemini 2.5 Flash (JSON-schema-constrained)
 *     └─ Zod validate → fail → one retry with the validation errors appended
 *          └─ 429 / hard failure → Mistral failover → Zod validate
 *               └─ no keys configured → deterministic local package (dev + preview)
 *
 * The model only ever returns content. Layout is hand-written React.
 */

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent';
const MISTRAL_URL = 'https://api.mistral.ai/v1/chat/completions';

export type GenerationTrace = {
  model: 'gemini-3.8-flash' | 'mistral-large-latest' | 'local-fallback';
  attempts: number;
  repaired: boolean;
  ms: number;
};

export type GenerationResult = { pkg: PitchPackage; trace: GenerationTrace };

/* ------------------------------------------------------------- logging */

function log(tag: string, msg: string, data?: unknown) {
  const ts = new Date().toISOString().slice(11, 23);
  console.log(`\n[${ts}] [${tag}] ${msg}`);
  if (data !== undefined) {
    console.log(JSON.stringify(data, null, 2));
  }
}

/* ------------------------------------------------------------- template pick */

const MENU_BOOKING = ['cafe', 'restaurant', 'coffee', 'bakery', 'salon', 'spa', 'dental', 'clinic', 'fitness', 'gym'];
const PORTFOLIO = ['interior', 'design', 'photography', 'architect', 'landscaping', 'tailoring', 'studio'];

export function pickTemplate(industry: string): TemplateType {
  const i = industry.toLowerCase();
  if (MENU_BOOKING.some((k) => i.includes(k))) return 'menu_booking';
  if (PORTFOLIO.some((k) => i.includes(k))) return 'portfolio_showcase';
  return 'service_local';
}

/* --------------------------------------------------- provider response schema */

/** Gemini takes an OpenAPI-ish subset, so the union is resolved before the call. */
function responseSchemaFor(templateType: TemplateType) {
  const section = {
    type: 'object',
    properties: {
      kind: { type: 'string', enum: ['hero', 'featureGrid', 'priceList', 'galleryStrip', 'contact', 'callStrip'] },
      headline: { type: 'string' },
      subhead: { type: 'string' },
      primaryLabel: { type: 'string' },
      secondaryLabel: { type: 'string' },
      primaryTarget: { type: 'string' },
      title: { type: 'string' },
      message: { type: 'string' },
      submitLabel: { type: 'string' },
      fields: { type: 'array', items: { type: 'string' } },
      captions: { type: 'array', items: { type: 'string' } },
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            iconName: { type: 'string', enum: [...ICON_NAMES] },
            title: { type: 'string' },
            body: { type: 'string' },
            name: { type: 'string' },
            detail: { type: 'string' },
            price: { type: 'string' },
          },
          required: ['iconName', 'title', 'body'],
        },
      },
    },
    required: ['kind'],
  };

  const extra: Record<string, unknown> =
    templateType === 'menu_booking'
      ? { bookingNote: { type: 'string' } }
      : templateType === 'portfolio_showcase'
        ? { caseStudyCount: { type: 'integer' } }
        : {};

  const required = ['templateType', 'version', 'business', 'theme', 'screens', 'primaryCta'].concat(
    templateType === 'menu_booking' ? ['bookingNote'] : templateType === 'portfolio_showcase' ? ['caseStudyCount'] : [],
  );

  return {
    type: 'object',
    properties: {
      templateType: { type: 'string', enum: [templateType] },
      version: { type: 'integer' },
      business: {
        type: 'object',
        properties: { name: { type: 'string' }, industry: { type: 'string' }, whatsapp: { type: 'string' } },
        required: ['name', 'industry', 'whatsapp'],
      },
      theme: { type: 'object', properties: { accent: { type: 'string' } }, required: ['accent'] },
      screens: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            sections: { type: 'array', items: section },
          },
          required: ['id', 'name', 'sections'],
        },
      },
      primaryCta: {
        type: 'object',
        properties: { label: { type: 'string' }, target: { type: 'string' } },
        required: ['label', 'target'],
      },
      ...extra,
    },
    required,
  };
}

/* --------------------------------------------------------------------- prompt */

function systemPrompt(templateType: TemplateType, whatsapp: string) {
  const sectionGuide =
    templateType === 'menu_booking'
      ? `The hero screen should hook the reader with the business name, trade, and area — one strong headline, a short subhead, two CTA buttons.
The menu/pricing screen should list 3-5 items with short descriptions and prices in local currency.
The contact screen should have a fake form with placeholder fields and a WhatsApp CTA.`
      : templateType === 'portfolio_showcase'
        ? `The hero screen should hook the reader with the business name, trade, and area — one strong headline, a short subhead, two CTA buttons.
The portfolio screen should show 3-4 work samples as a gallery grid with short captions.
The contact screen should have a fake form with placeholder fields and a WhatsApp CTA.`
        : `The hero screen should hook the reader with the business name, trade, and area — one strong headline, a short subhead, two CTA buttons.
The services screen should list 3-5 service items with short descriptions and prices.
A call strip section should appear on one screen with a one-line message and the WhatsApp number.`;

  return [
    'You are a copywriter and UX designer creating a high-converting pitch prototype for a freelance web developer.',
    `Template type: "${templateType}".`,
    '',
    'OUTPUT STRUCTURE:',
    '- 2 to 4 screens, each with 2-4 sections.',
    '- First screen MUST have a hero section at the top.',
    '- Screen ids are lowercase slugs: "home", "services", "menu", "portfolio", "contact".',
    '- primaryCta.target is either "whatsapp" or a screen id you created.',
    '',
    'SECTION RULES:',
    '- hero: headline (6-12 words, punchy, specific), subhead (1-2 sentences, plain English), primaryLabel (short CTA), secondaryLabel (optional second CTA).',
    '- featureGrid: title + 3 items, each with an iconName, title (3-5 words), body (1 sentence).',
    '- priceList: title + 3-5 items, each with name, detail (1 sentence), price (local currency or "Free").',
    '- galleryStrip: captions array with 3-4 short labels.',
    '- contact: headline + fields array (3-4 placeholder strings) + submitLabel.',
    '- callStrip: message (one short sentence).',
    '',
    'CONTENT RULES:',
    '- Write as if pitching to the business owner — show them what their website could look like.',
    '- Use specific local details from the brief (street name, area, specific services mentioned).',
    '- headlines: active voice, concrete, no jargon. "Fresh bread, baked before 7am" not "Quality baked goods".',
    '- body copy: short sentences, plain English, no filler words like "innovative" or "solutions".',
    `- iconName must be one of: ${ICON_NAMES.join(', ')}.`,
    `- business.whatsapp is exactly "${whatsapp}".`,
    '- theme.accent is a 6-digit hex colour that suits the trade. Never use #E8722C.',
    '- Sentence case. No ALL CAPS. No emoji. No exclamation marks.',
    '',
    `${sectionGuide}`,
  ].join('\n');
}

function userPrompt(input: BriefInput) {
  return [
    `Business: ${input.clientName}`,
    `Industry: ${input.industry}`,
    '',
    'Brief from the developer:',
    input.brief,
    '',
    'Generate a complete pitch prototype with 2-4 screens. Write original headlines and copy — do not echo the brief back. Use the specific details from the brief (location, services, pain points) to create compelling, concrete content.',
  ].join('\n');
}

/* ------------------------------------------------------------------ providers */

class RateLimited extends Error {}

async function callGemini(system: string, user: string, templateType: TemplateType, key: string) {
  log('GEMINI', 'Calling Gemini 3.8 Flash...', { templateType });

  let res: Response | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    res = await fetch(`${GEMINI_URL}?key=${key}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: user }] }],
        generationConfig: {
          temperature: 0.6,
          responseMimeType: 'application/json',
          responseSchema: responseSchemaFor(templateType),
        },
      }),
    });

    log('GEMINI', `Response status: ${res.status} (attempt ${attempt + 1})`);

    if (res.status === 503 || res.status === 429) {
      if (attempt < 2) {
        const delay = 1500 * (attempt + 1);
        log('GEMINI', `Retryable error (${res.status}), waiting ${delay}ms...`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
    }
    break;
  }

  if (!res) throw new Error('gemini: no response');

  if (res.status === 429) {
    log('GEMINI', 'Rate limited!');
    throw new RateLimited('gemini rate limited');
  }
  if (!res.ok) {
    const body = await res.text();
    log('GEMINI', `Error response:`, body);
    throw new Error(`gemini ${res.status}: ${body}`);
  }

  const json = await res.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    log('GEMINI', 'No content in response:', json);
    throw new Error('gemini returned no content');
  }

  log('GEMINI', 'Raw response text:', text.slice(0, 500));
  const parsed = JSON.parse(text);
  log('GEMINI', 'Parsed JSON:', { screens: parsed.screens?.length, sections: parsed.screens?.map((s: { id: string; sections: unknown[] }) => `${s.id}(${s.sections.length})`) });
  return parsed as unknown;
}

async function callMistral(system: string, user: string, templateType: TemplateType, key: string) {
  log('MISTRAL', 'Calling Mistral Large...', { templateType });
  log('MISTRAL', 'System prompt:', system.slice(0, 300));
  log('MISTRAL', 'User prompt:', user);

  const res = await fetch(MISTRAL_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: 'mistral-large-latest',
      temperature: 0.6,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `${system}\n\nReturn a single JSON object matching this schema:\n${JSON.stringify(
            responseSchemaFor(templateType),
          )}`,
        },
        { role: 'user', content: user },
      ],
    }),
  });

  log('MISTRAL', `Response status: ${res.status}`);

  if (!res.ok) {
    const body = await res.text();
    log('MISTRAL', `Error response:`, body);
    throw new Error(`mistral ${res.status}: ${body}`);
  }

  const json = await res.json();
  const text = json.choices[0].message.content;
  log('MISTRAL', 'Raw response text:', text.slice(0, 500));
  const parsed = JSON.parse(text);
  log('MISTRAL', 'Parsed JSON — screens:', parsed.screens?.length);
  return parsed as unknown;
}

/* -------------------------------------------------------------------- public */

function issuesToFeedback(err: z.ZodError) {
  return err.issues
    .slice(0, 8)
    .map((i) => `- ${i.path.join('.') || '(root)'}: ${i.message}`)
    .join('\n');
}

/**
 * Fill missing fields with sensible defaults before Zod validation.
 * Models sometimes skip optional-looking fields — this keeps the package usable.
 */
function normalizePackage(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') return raw;
  const pkg = raw as Record<string, unknown>;
  if (!Array.isArray(pkg.screens)) return pkg;

  const fallbackIcons = ['spark', 'clock', 'pin', 'star'];
  let iconIdx = 0;

  pkg.screens = pkg.screens.map((screen) => {
    if (!screen || typeof screen !== 'object') return screen;
    const sc = screen as Record<string, unknown>;
    if (!Array.isArray(sc.sections)) return sc;

    sc.sections = sc.sections.map((section) => {
      if (!section || typeof section !== 'object') return section;
      const s = section as Record<string, unknown>;
      const kind = s.kind;

      if (kind === 'hero') {
        if (!s.headline || typeof s.headline !== 'string') s.headline = 'A modern experience built for you';
        if (!s.subhead || typeof s.subhead !== 'string') s.subhead = 'Designed to help customers find you and get in touch.';
        if (!s.primaryLabel || typeof s.primaryLabel !== 'string') s.primaryLabel = 'Get in touch';
        if (!s.primaryTarget || typeof s.primaryTarget !== 'string') s.primaryTarget = 'whatsapp';
      }
      if (kind === 'featureGrid') {
        if (!Array.isArray(s.items) || s.items.length === 0) {
          s.items = [
            { iconName: fallbackIcons[iconIdx++ % 4], title: 'Quality first', body: 'We focus on doing the work right.' },
            { iconName: fallbackIcons[iconIdx++ % 4], title: 'Fast response', body: 'We get back to you the same day.' },
            { iconName: fallbackIcons[iconIdx++ % 4], title: 'Trusted locally', body: 'Real clients, real results.' },
          ];
        } else {
          s.items = (s.items as Array<Record<string, unknown>>).map((item) => ({
            iconName: item.iconName ?? fallbackIcons[iconIdx++ % 4],
            title: item.title ?? 'Feature',
            body: item.body ?? 'A benefit worth knowing about.',
          }));
        }
      }
      if (kind === 'priceList') {
        if (!Array.isArray(s.items) || s.items.length === 0) {
          s.items = [
            { name: 'Basic', detail: 'A simple starting point.', price: 'Free' },
            { name: 'Standard', detail: 'Most popular choice.', price: `${DEFAULT_CURRENCY} 45` },
            { name: 'Premium', detail: 'The full package.', price: `${DEFAULT_CURRENCY} 120` },
          ];
        } else {
          s.items = (s.items as Array<Record<string, unknown>>).map((item) => ({
            name: item.name ?? 'Service',
            detail: item.detail ?? 'Details coming soon.',
            price: item.price ?? 'On request',
          }));
        }
      }
      if (kind === 'galleryStrip') {
        if (!Array.isArray(s.captions) || s.captions.length === 0) {
          s.captions = ['Recent project', 'Happy client', 'Our work'];
        }
      }
      if (kind === 'contact') {
        if (!s.headline || typeof s.headline !== 'string') s.headline = 'Get in touch';
        if (!Array.isArray(s.fields) || s.fields.length === 0) {
          s.fields = ['Your name', 'Phone number', 'What you need'];
        }
        if (!s.submitLabel || typeof s.submitLabel !== 'string') s.submitLabel = 'Send request';
      }
      if (kind === 'callStrip') {
        if (!s.message || typeof s.message !== 'string') s.message = 'Need help? Send us a message.';
      }
      return s;
    });
    return sc;
  });

  if (!pkg.business || typeof pkg.business !== 'object') {
    pkg.business = { name: 'Your Business', industry: 'Local', whatsapp: process.env.DEFAULT_WHATSAPP ?? '+92 300 0000 000' };
  } else {
    const b = pkg.business as Record<string, unknown>;
    if (!b.name) b.name = 'Your Business';
    if (!b.industry) b.industry = 'Local';
    if (!b.whatsapp) b.whatsapp = process.env.DEFAULT_WHATSAPP ?? '+92 300 0000 000';
  }
  if (!pkg.theme || typeof pkg.theme !== 'object') {
    pkg.theme = { accent: '#C7443C' };
  }
  if (!pkg.primaryCta || typeof pkg.primaryCta !== 'object') {
    pkg.primaryCta = { label: 'Message on WhatsApp', target: 'whatsapp' };
  }
  return pkg;
}

export async function generatePitchPackage(input: BriefInput): Promise<GenerationResult> {
  const started = Date.now();
  const templateType = pickTemplate(input.industry);
  const whatsapp = process.env.DEFAULT_WHATSAPP ?? '+92 300 1140 662';
  const system = systemPrompt(templateType, whatsapp);
  const user = userPrompt(input);

  log('PIPELINE', '=== Generation started ===', {
    clientName: input.clientName,
    industry: input.industry,
    mode: input.mode,
    templateType,
    whatsapp,
  });

  const gemini = process.env.GEMINI_API_KEY;
  const mistral = process.env.MISTRAL_API_KEY;
  let attempts = 0;

  log('PIPELINE', `Providers — Gemini: ${gemini ? 'YES' : 'NO'}, Mistral: ${mistral ? 'YES' : 'NO'}`);

  if (gemini) {
    try {
      attempts++;
      log('PIPELINE', `Attempt ${attempts}: Calling Gemini...`);
      const first = await callGemini(system, user, templateType, gemini);
      const normalized = normalizePackage(first);
      const parsed = pitchPackageSchema.safeParse(normalized);
      if (parsed.success) {
        log('PIPELINE', `✅ Gemini succeeded on attempt ${attempts}`, { screens: parsed.data.screens.length });
        return { pkg: parsed.data, trace: { model: 'gemini-3.8-flash', attempts, repaired: false, ms: Date.now() - started } };
      }

      log('PIPELINE', `⚠️ Gemini response failed validation:`, issuesToFeedback(parsed.error));

      // one repair pass, feeding the validation errors back to the model
      attempts++;
      log('PIPELINE', `Attempt ${attempts}: Repair pass — feeding errors back to Gemini...`);
      const repaired = await callGemini(
        system,
        `${user}\n\nYour previous answer failed validation. Fix exactly these problems and return the whole object again:\n${issuesToFeedback(
          parsed.error,
        )}`,
        templateType,
        gemini,
      );
      const second = pitchPackageSchema.safeParse(normalizePackage(repaired));
      if (second.success) {
        log('PIPELINE', `✅ Gemini repair succeeded on attempt ${attempts}`, { screens: second.data.screens.length });
        return { pkg: second.data, trace: { model: 'gemini-3.8-flash', attempts, repaired: true, ms: Date.now() - started } };
      }
      log('PIPELINE', `❌ Gemini repair also failed:`, issuesToFeedback(second.error));
      throw new Error(`gemini failed validation twice:\n${issuesToFeedback(second.error)}`);
    } catch (err) {
      log('PIPELINE', `Gemini error:`, (err as Error).message);
      if (!mistral) {
        if (process.env.NODE_ENV === 'production') throw err;
        log('PIPELINE', '⚠️ No Mistral key — falling back to LOCAL template');
        return { pkg: localPackage(input, templateType, whatsapp), trace: { model: 'local-fallback', attempts, repaired: false, ms: Date.now() - started } };
      }
    }
  }

  if (mistral) {
    attempts++;
    log('PIPELINE', `Attempt ${attempts}: Calling Mistral...`);
    const raw = await callMistral(system, user, templateType, mistral);
    const parsed = pitchPackageSchema.safeParse(raw);
    if (parsed.success) {
      log('PIPELINE', `✅ Mistral succeeded on attempt ${attempts}`, { screens: parsed.data.screens.length });
      return { pkg: parsed.data, trace: { model: 'mistral-large-latest', attempts, repaired: false, ms: Date.now() - started } };
    }
    log('PIPELINE', `❌ Mistral failed validation:`, issuesToFeedback(parsed.error));
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`mistral failed validation:\n${issuesToFeedback(parsed.error)}`);
    }
  }

  // No providers configured — keep the shell fully clickable in dev and preview.
  log('PIPELINE', '⚠️ No providers configured — using LOCAL template');
  return {
    pkg: localPackage(input, templateType, whatsapp),
    trace: { model: 'local-fallback', attempts, repaired: false, ms: Date.now() - started },
  };
}

/* --------------------------------------------------------- local dev fallback */

const ACCENTS = ['#B9903A', '#C7443C', '#7A9C3E', '#3FA9A0', '#8C5A3C', '#C08A2E'];

const DEFAULT_CURRENCY = process.env.DEFAULT_CURRENCY ?? 'USD';

export function localPackage(input: BriefInput, templateType: TemplateType, whatsapp: string): PitchPackage {
  const accent = ACCENTS[input.clientName.length % ACCENTS.length];
  const trade = input.industry.toLowerCase();
  // capture a location mention ("Main Street", "Downtown", etc.) without assuming a country
  const where =
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\s+(?:Road|Street|Ave|Avenue|Market|Town|District|Area))|(?:Downtown|Uptown|Central|City Center)/i.exec(input.brief)?.[0] ??
    'the neighbourhood';

  // Extract actionable details from the brief
  const briefLower = input.brief.toLowerCase();
  const hasBooking = /book|reservation|table|appointment|schedule/.test(briefLower);
  const hasMenu = /menu|food|dish|meal|coffee|bakery|cake/.test(briefLower);
  const hasPhotos = /photo|gallery|portfolio|work|design|interior/.test(briefLower);
  const hasPricing = /price|cost|rate|afford|budget/.test(briefLower);
  const hasUrgency = /today|fast|quick|same.day|asap|urgent/.test(briefLower);

  // Generate headline from brief — never echo the brief itself
  const headlineVariants = [
    `${input.clientName} — ${trade} in ${where}`,
    `${trade.charAt(0).toUpperCase() + trade.slice(1)}, built for ${where}`,
    `Welcome to ${input.clientName}`,
  ];
  const headline = headlineVariants[input.clientName.length % headlineVariants.length];

  // Generate subhead from brief — extract the core value prop, never echo
  const valueProps: string[] = [];
  if (hasBooking) valueProps.push('Book online in seconds');
  if (hasMenu) valueProps.push('Browse the full menu');
  if (hasPhotos) valueProps.push('See our latest work');
  if (hasPricing) valueProps.push('Clear pricing, no surprises');
  if (hasUrgency) valueProps.push('Same-day service');
  if (valueProps.length === 0) valueProps.push('Get in touch, we make it easy');
  const subhead = `${input.clientName} is a ${trade} in ${where}. ${valueProps.join(', ')} — all from your phone.`;

  // Feature grid items based on brief keywords
  const featureItems = [
    { iconName: 'pin' as const, title: `Located in ${where}`, body: `Easy to find, right in ${where}. Walk in or message us first.` },
    { iconName: 'clock' as const, title: hasUrgency ? 'Same-day service' : 'Open when you need us', body: hasUrgency ? 'Need it today? We can usually turn it around the same day.' : 'Flexible hours — we work around your schedule.' },
    { iconName: 'star' as const, title: 'Trusted by locals', body: `Real clients in ${where}, real reviews, real results.` },
  ];

  // Service/menu items based on trade
  const serviceItems = (() => {
    if (templateType === 'menu_booking') {
      if (hasMenu) {
        return [
          { name: 'Signature item', detail: 'Our most popular choice, fresh daily.', price: `${DEFAULT_CURRENCY} 8.50` },
          { name: 'Quick bite', detail: 'Something light, ready in minutes.', price: `${DEFAULT_CURRENCY} 4.50` },
          { name: 'Family platter', detail: 'Feeds 3-4, great for sharing.', price: `${DEFAULT_CURRENCY} 22` },
          { name: 'Bulk order', detail: 'Office catering, 20+ people.', price: 'On request' },
        ];
      }
      return [
        { name: 'First visit', detail: 'We look at the job and tell you what it needs.', price: 'Free' },
        { name: 'Standard service', detail: 'Most jobs done the same day.', price: `${DEFAULT_CURRENCY} 45` },
        { name: 'Monthly plan', detail: 'Regular work, one invoice at month end.', price: `${DEFAULT_CURRENCY} 120` },
      ];
    }
    if (templateType === 'portfolio_showcase') {
      return [
        { name: 'Consultation', detail: 'We discuss your vision and scope.', price: 'Free' },
        { name: 'Standard project', detail: 'Design + build, 2-4 weeks.', price: `${DEFAULT_CURRENCY} 450` },
        { name: 'Full package', detail: 'End to end, including revisions.', price: `${DEFAULT_CURRENCY} 850` },
      ];
    }
    return [
      { name: 'Quick fix', detail: 'Small jobs, done today.', price: `${DEFAULT_CURRENCY} 20` },
      { name: 'Standard job', detail: 'Most jobs finish same day.', price: `${DEFAULT_CURRENCY} 45` },
      { name: 'Monthly retainer', detail: 'Priority service, one monthly bill.', price: `${DEFAULT_CURRENCY} 120` },
    ];
  })();

  const base = {
    version: 1 as const,
    business: { name: input.clientName, industry: input.industry, whatsapp },
    theme: { accent },
    primaryCta: { label: hasBooking ? 'Book now' : 'Message on WhatsApp', target: 'whatsapp' as const },
    screens: [
      {
        id: 'home',
        name: 'Home',
        sections: [
          {
            kind: 'hero' as const,
            headline,
            subhead,
            primaryLabel: hasBooking ? 'Book a table' : 'Get a quote',
            secondaryLabel: 'See what we do',
            primaryTarget: 'services',
          },
          {
            kind: 'featureGrid' as const,
            title: 'Why people choose us',
            items: featureItems,
          },
          ...(hasPricing ? [] : [{ kind: 'callStrip' as const, message: 'Need it today? Send a message and we will confirm in minutes.' }]),
        ],
      },
      {
        id: 'services',
        name: templateType === 'menu_booking' ? 'Menu' : templateType === 'portfolio_showcase' ? 'Work' : 'Services',
        sections: [
          {
            kind: 'priceList' as const,
            title: hasMenu ? 'Our menu' : hasPhotos ? 'Recent work' : 'What it costs',
            items: serviceItems,
          },
          { kind: 'callStrip' as const, message: 'Not sure which one you need? Ask and we will tell you straight.' },
        ],
      },
      {
        id: 'contact',
        name: 'Contact',
        sections: [
          {
            kind: 'contact' as const,
            headline: `Talk to ${input.clientName}`,
            fields: ['Your name', 'WhatsApp number', 'What you need'],
            submitLabel: 'Send request',
          },
        ],
      },
    ],
  };

  if (templateType === 'menu_booking') {
    return pitchPackageSchema.parse({ templateType, ...base, bookingNote: 'Tables held for fifteen minutes after the booking time.' });
  }
  if (templateType === 'portfolio_showcase') {
    return pitchPackageSchema.parse({ templateType, ...base, caseStudyCount: 6 });
  }
  return pitchPackageSchema.parse({ templateType, ...base });
}
