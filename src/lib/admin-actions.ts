'use server';

import { revalidatePath } from 'next/cache';
import { adminStore, store } from './db';
import { getAdminUserId } from './supabase';
import type { UserRole } from './schema';

async function verifyAdmin(): Promise<string | null> {
  const adminUserId = await getAdminUserId();
  if (!adminUserId) return null;
  const db = await store();
  const profile = await db.getProfile();
  return profile.id;
}

/* ---- user actions ---- */

export async function promoteUserAction(userId: string): Promise<{ error?: string }> {
  const actorId = await verifyAdmin();
  if (!actorId) return { error: 'Unauthorized' };
  const adb = await adminStore();
  await adb.updateUserRole(userId, 'admin');
  await adb.logAuditEntry({ actorId, action: 'user.promote', targetType: 'profile', targetId: userId });
  revalidatePath('/admin/users');
  revalidatePath(`/admin/users/${userId}`);
  return {};
}

export async function demoteUserAction(userId: string): Promise<{ error?: string }> {
  const actorId = await verifyAdmin();
  if (!actorId) return { error: 'Unauthorized' };
  const adb = await adminStore();
  await adb.updateUserRole(userId, 'user');
  await adb.logAuditEntry({ actorId, action: 'user.demote', targetType: 'profile', targetId: userId });
  revalidatePath('/admin/users');
  revalidatePath(`/admin/users/${userId}`);
  return {};
}

export async function grantCreditsAction(userId: string, amount: number): Promise<{ error?: string }> {
  const actorId = await verifyAdmin();
  if (!actorId) return { error: 'Unauthorized' };
  if (amount <= 0 || amount > 100) return { error: 'Amount must be between 1 and 100' };
  const adb = await adminStore();
  const user = await adb.getUser(userId);
  if (!user) return { error: 'User not found' };
  await adb.updateUserCredits(userId, user.credits + amount);
  await adb.logAuditEntry({ actorId, action: 'credit.grant', targetType: 'profile', targetId: userId, detail: { amount, newTotal: user.credits + amount } });
  revalidatePath('/admin/users');
  revalidatePath(`/admin/users/${userId}`);
  return {};
}

export async function changeUserTierAction(userId: string, tier: 'free' | 'pro'): Promise<{ error?: string }> {
  const actorId = await verifyAdmin();
  if (!actorId) return { error: 'Unauthorized' };
  const adb = await adminStore();
  await adb.updateUserTier(userId, tier);
  await adb.logAuditEntry({ actorId, action: 'tier.change', targetType: 'profile', targetId: userId, detail: { tier } });
  revalidatePath('/admin/users');
  revalidatePath(`/admin/users/${userId}`);
  return {};
}

export async function adminDeleteUserAction(userId: string): Promise<{ error?: string }> {
  const actorId = await verifyAdmin();
  if (!actorId) return { error: 'Unauthorized' };
  const adb = await adminStore();
  await adb.deleteUser(userId);
  await adb.logAuditEntry({ actorId, action: 'user.delete', targetType: 'profile', targetId: userId });
  revalidatePath('/admin/users');
  return {};
}

/* ---- pitch actions ---- */

export async function adminDeletePitchAction(pitchId: string): Promise<{ error?: string }> {
  const actorId = await verifyAdmin();
  if (!actorId) return { error: 'Unauthorized' };
  const adb = await adminStore();
  await adb.adminDeletePitch(pitchId);
  await adb.logAuditEntry({ actorId, action: 'pitch.delete', targetType: 'pitch', targetId: pitchId });
  revalidatePath('/admin/pitches');
  return {};
}

/* ---- settings actions ---- */

export async function updateSystemSettingAction(key: string, value: string): Promise<{ error?: string }> {
  const actorId = await verifyAdmin();
  if (!actorId) return { error: 'Unauthorized' };
  const adb = await adminStore();
  let parsed: unknown;
  try { parsed = JSON.parse(value); } catch { parsed = value; }
  await adb.updateSetting(key, parsed, actorId);
  await adb.logAuditEntry({ actorId, action: 'system.setting_update', targetType: 'system', targetId: key, detail: { value: parsed } });
  revalidatePath('/admin/settings');
  return {};
}
