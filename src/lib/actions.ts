'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { generatePitchPackage } from './generate';
import { store } from './db';
import { briefInputSchema, type PitchStatus, type Pitch } from './schema';
import { slug } from './utils';
import { checkRateLimit, createRateLimitError } from './rate-limit';
import { createClient } from './supabase';

const newId = () => crypto.randomUUID();

export type ActionState = { ok?: boolean; error?: string; fieldErrors?: Record<string, string[]>; emailConfirmation?: boolean; email?: string };

/** New pitch → validate brief → spend a credit → generate → land on review & edit. */
export async function createPitchAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const rateLimit = await checkRateLimit('create-pitch');
  if (!rateLimit.allowed) {
    return { error: createRateLimitError(rateLimit.resetAt) };
  }

  const parsed = briefInputSchema.safeParse({
    clientName: form.get('clientName'),
    industry: form.get('industry'),
    brief: form.get('brief'),
    mode: form.get('mode') ?? 'type',
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const db = await store();
  const profile = await db.getProfile();
  if (profile.credits <= 0) return { error: 'no-credits' };

  const { pkg, trace } = await generatePitchPackage(parsed.data);
  console.log('\n[GENERATION RESULT]', { model: trace.model, attempts: trace.attempts, repaired: trace.repaired, ms: trace.ms });
  console.log('[GENERATED PACKAGE]', { screens: pkg.screens.length, templateType: pkg.templateType, clientName: pkg.business.name });

  // A real model call takes several seconds and the three-step screen paces
  // itself against it. With no key configured generation is instant, so hold
  // the local fallback to the same rhythm rather than flashing the screen.
  if (trace.model === 'local-fallback') {
    await new Promise((r) => setTimeout(r, Math.max(0, 7600 - trace.ms)));
  }
  const id = newId();
  const now = new Date().toISOString();
  const pitch: Pitch = {
    id,
    slug: id,
    clientName: parsed.data.clientName,
    industry: parsed.data.industry,
    brief: parsed.data.brief,
    mode: parsed.data.mode,
    status: 'created',
    statusAt: now,
    createdAt: now,
    sentAt: null,
    lastViewedAt: null,
    hiddenSections: [],
    provider: trace.model === 'local-fallback' ? 'local' : trace.model.startsWith('gemini') ? 'gemini' : 'mistral',
    views: [],
    pkg,
  };

  await db.insertPitch(pitch);
  await db.spendCredit();
  revalidatePath('/dashboard');
  redirect(`/pitch/${id}/edit`);
}

export async function sendPitchAction(id: string) {
  const now = new Date().toISOString();
  const db = await store();
  await db.updatePitch(id, { status: 'sent', sentAt: now, statusAt: now });
  revalidatePath('/dashboard');
  revalidatePath(`/pitch/${id}/edit`);
}

export async function setStatusAction(id: string, status: PitchStatus) {
  const db = await store();
  await db.updatePitch(id, { status, statusAt: new Date().toISOString() });
  revalidatePath('/dashboard');
  revalidatePath(`/pitch/${id}/analytics`);
}

export async function savePackageAction(id: string, pkg: Pitch['pkg']) {
  const db = await store();
  await db.updatePitch(id, { pkg });
  revalidatePath(`/pitch/${id}/edit`);
}

export async function duplicatePitchAction(id: string) {
  const db = await store();
  const source = await db.getPitch(id);
  if (!source) return;
  const newPitchId = newId();
  const now = new Date().toISOString();
  const copy: Pitch = {
    ...source,
    id: newPitchId,
    slug: newPitchId,
    status: 'created',
    statusAt: now,
    createdAt: now,
    sentAt: null,
    lastViewedAt: null,
    hiddenSections: [],
    views: [],
    clientName: `${source.clientName} (copy)`,
  };
  await db.insertPitch(copy);
  revalidatePath('/dashboard');
  redirect(`/pitch/${copy.id}/edit`);
}

export async function regeneratePitchAction(id: string) {
  const rateLimit = await checkRateLimit('regenerate-pitch');
  if (!rateLimit.allowed) {
    return { error: createRateLimitError(rateLimit.resetAt) };
  }

  const db = await store();
  const source = await db.getPitch(id);
  if (!source) return;
  const profile = await db.getProfile();
  if (profile.credits <= 0) return;

  const { pkg, trace } = await generatePitchPackage({
    clientName: source.clientName,
    industry: source.industry,
    brief: source.brief || `${source.clientName} is a ${source.industry.toLowerCase()}. Rebuild the prototype with a different structure.`,
    mode: source.mode,
  });
  await db.updatePitch(id, {
    pkg,
    provider: trace.model === 'local-fallback' ? 'local' : trace.model.startsWith('gemini') ? 'gemini' : 'mistral',
  });
  await db.spendCredit();
  revalidatePath(`/pitch/${id}/edit`);
  redirect(`/pitch/${id}/edit`);
}

export async function upgradeAction(): Promise<{ url?: string; error?: string }> {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  const variantId = process.env.LEMONSQUEEZY_VARIANT_ID;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001';

  if (!apiKey || !storeId || !variantId) {
    return { error: 'lemon squeezy not configured' };
  }

  const supabase = await createClient();
  if (!supabase) {
    return { error: 'supabase not configured' };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'unauthenticated' };
  }

  try {
    const res = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        store_id: Number(storeId),
        variant_id: Number(variantId),
        checkout_data: {
          custom: {
            user_id: user.id,
          },
          checkout_options: {
            media: false,
            dark_mode: true,
            logo_url: `${siteUrl}/scaffold-logo.png`,
          },
          receipt_text: 'Thank you for upgrading to Scaffold Pro!',
          receipt_link_text: 'View your receipt',
          receipt_link_url: `${siteUrl}/settings`,
        },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      return { error: `checkout failed: ${body}` };
    }

    const data = await res.json();
    const checkoutUrl = data.data?.attributes?.url;
    if (!checkoutUrl) {
      return { error: 'no checkout url returned' };
    }

    return { url: checkoutUrl };
  } catch {
    return { error: 'checkout error' };
  }
}

export async function saveProfileAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const whatsapp = String(form.get('whatsapp') ?? '');
  if (whatsapp.replace(/\D/g, '').length < 10) {
    return { fieldErrors: { whatsapp: ['Enter a number clients can actually reach you on.'] } };
  }
  const db = await store();
  await db.updateProfile({
    fullName: String(form.get('fullName') ?? ''),
    businessName: String(form.get('businessName') ?? ''),
    whatsapp,
  });
  revalidatePath('/settings');
  return {};
}

export async function deletePitchAction(id: string) {
  const db = await store();
  await db.deletePitch(id);
  revalidatePath('/dashboard');
}

export async function deleteAccountAction() {
  const db = await store();
  await db.deleteAccount();
  // Sign out after deletion — clear all cookies
  const { cookies } = await import('next/headers');
  const jar = await cookies();
  jar.delete('scaffold_uid');
  jar.delete('scaffold_onboarded');
  jar.delete('scaffold_wa');
  redirect('/login');
}
