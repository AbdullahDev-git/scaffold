import { describe, it, expect } from 'vitest';
import { pickTemplate, localPackage } from '@/lib/generate';
import { pitchPackageSchema, ICON_NAMES } from '@/lib/schema';

describe('pickTemplate', () => {
  it('returns menu_booking for cafe', () => {
    expect(pickTemplate('Cafe')).toBe('menu_booking');
    expect(pickTemplate('Restaurant')).toBe('menu_booking');
    expect(pickTemplate('Coffee shop')).toBe('menu_booking');
  });

  it('returns portfolio_showcase for design industries', () => {
    expect(pickTemplate('Interior design')).toBe('portfolio_showcase');
    expect(pickTemplate('Photography')).toBe('portfolio_showcase');
    expect(pickTemplate('Architect')).toBe('portfolio_showcase');
  });

  it('returns service_local for everything else', () => {
    expect(pickTemplate('Auto workshop')).toBe('service_local');
    expect(pickTemplate('Legal services')).toBe('service_local');
    expect(pickTemplate('Consulting')).toBe('service_local');
    expect(pickTemplate('Plumbing')).toBe('service_local');
  });

  it('is case-insensitive', () => {
    expect(pickTemplate('CAFE')).toBe('menu_booking');
    expect(pickTemplate('Interior Design')).toBe('portfolio_showcase');
  });
});

describe('localPackage', () => {
  it('produces a valid service_local package', () => {
    const pkg = localPackage(
      { clientName: 'Test Biz', industry: 'Consulting', brief: 'A consulting firm in the city.', mode: 'type' },
      'service_local',
      '+1 555 000 0000',
    );

    const parsed = pitchPackageSchema.safeParse(pkg);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.templateType).toBe('service_local');
      expect(parsed.data.business.name).toBe('Test Biz');
      expect(parsed.data.screens.length).toBeGreaterThanOrEqual(2);
      expect(parsed.data.screens.length).toBeLessThanOrEqual(6);
    }
  });

  it('produces a valid menu_booking package', () => {
    const pkg = localPackage(
      { clientName: 'Test Cafe', industry: 'Cafe', brief: 'Coffee and pastries.', mode: 'type' },
      'menu_booking',
      '+1 555 000 0000',
    );

    const parsed = pitchPackageSchema.safeParse(pkg);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.templateType).toBe('menu_booking');
      expect('bookingNote' in parsed.data).toBe(true);
    }
  });

  it('produces a valid portfolio_showcase package', () => {
    const pkg = localPackage(
      { clientName: 'Test Studio', industry: 'Interior design', brief: 'Room designs.', mode: 'type' },
      'portfolio_showcase',
      '+1 555 000 0000',
    );

    const parsed = pitchPackageSchema.safeParse(pkg);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.templateType).toBe('portfolio_showcase');
      expect('caseStudyCount' in parsed.data).toBe(true);
    }
  });

  it('uses whitelisted icon names only', () => {
    const pkg = localPackage(
      { clientName: 'Biz', industry: 'Consulting', brief: 'Consulting services.', mode: 'type' },
      'service_local',
      '+1 555 000 0000',
    );

    const parsed = pitchPackageSchema.safeParse(pkg);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      for (const screen of parsed.data.screens) {
        for (const section of screen.sections) {
          if (section.kind === 'featureGrid') {
            for (const item of section.items) {
              expect(ICON_NAMES).toContain(item.iconName);
            }
          }
        }
      }
    }
  });

  it('every target points to an existing screen', () => {
    const pkg = localPackage(
      { clientName: 'Biz', industry: 'Consulting', brief: 'Consulting services.', mode: 'type' },
      'service_local',
      '+1 555 000 0000',
    );

    const parsed = pitchPackageSchema.safeParse(pkg);
    expect(parsed.success).toBe(true);
  });
});
