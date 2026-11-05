import { describe, it, expect } from 'vitest';
import { pitchPackageSchema } from '@/lib/schema';

describe('pitchPackageSchema validation', () => {
  const validPackage = {
    templateType: 'service_local' as const,
    version: 1,
    business: { name: 'Biz', industry: 'Consulting', whatsapp: '+1 555 000 0000' },
    theme: { accent: '#B9903A' },
    screens: [
      {
        id: 'home',
        name: 'Home',
        sections: [
          {
            kind: 'hero' as const,
            headline: 'Test headline',
            subhead: 'Test subhead',
            primaryLabel: 'Contact',
            primaryTarget: 'services',
          },
        ],
      },
      {
        id: 'services',
        name: 'Services',
        sections: [
          {
            kind: 'priceList' as const,
            title: 'Pricing',
            items: [
              { name: 'Basic', detail: 'Basic plan', price: '$500' },
              { name: 'Premium', detail: 'Premium plan', price: '$1000' },
            ],
          },
        ],
      },
    ],
    primaryCta: { label: 'Message', target: 'whatsapp' },
  };

  it('accepts a valid package', () => {
    const result = pitchPackageSchema.safeParse(validPackage);
    expect(result.success).toBe(true);
  });

  it('rejects duplicate screen ids', () => {
    const result = pitchPackageSchema.safeParse({
      ...validPackage,
      screens: [
        { ...validPackage.screens[0], id: 'home' },
        { ...validPackage.screens[0], id: 'home' },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('rejects primaryCta.target that points to non-existent screen', () => {
    const result = pitchPackageSchema.safeParse({
      ...validPackage,
      primaryCta: { label: 'Message', target: 'nonexistent' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects hero.primaryTarget that points to non-existent screen', () => {
    const result = pitchPackageSchema.safeParse({
      ...validPackage,
      screens: [
        {
          ...validPackage.screens[0],
          sections: [
            {
              ...validPackage.screens[0].sections[0],
              primaryTarget: 'nonexistent',
            },
          ],
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('rejects packages without a hero section', () => {
    const result = pitchPackageSchema.safeParse({
      ...validPackage,
      screens: [
        {
          ...validPackage.screens[0],
          sections: [
            {
              kind: 'featureGrid' as const,
              title: 'Features',
              items: [
                { iconName: 'spark', title: 'Test', body: 'Test body' },
              ],
            },
          ],
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid hex accent', () => {
    const result = pitchPackageSchema.safeParse({
      ...validPackage,
      theme: { accent: 'not-hex' },
    });
    expect(result.success).toBe(false);
  });
});
