import { describe, it, expect } from 'vitest';
import { slug, stamp, duration } from '@/lib/utils';

describe('slug', () => {
  it('lowercases and replaces non-alphanumeric with dashes', () => {
    expect(slug('Karma Coffee House')).toBe('karma-coffee-house');
    expect(slug('Bilal Motors!')).toBe('bilal-motors');
    expect(slug('  Leading and trailing  ')).toBe('leading-and-trailing');
  });

  it('removes leading and trailing dashes', () => {
    expect(slug('---test---')).toBe('test');
  });
});

describe('stamp', () => {
  it('formats ISO datetime', () => {
    expect(stamp('2026-09-08T14:05:00.000Z')).toBe('2026-09-08 14:05');
  });

  it('returns dash for null', () => {
    expect(stamp(null)).toBe('—');
  });

  it('can omit time', () => {
    expect(stamp('2026-09-08T14:05:00.000Z', false)).toBe('2026-09-08');
  });
});

describe('duration', () => {
  it('formats seconds under a minute', () => {
    expect(duration(30)).toBe('30s');
    expect(duration(0)).toBe('0s');
  });

  it('formats minutes and seconds', () => {
    expect(duration(90)).toBe('1m 30s');
    expect(duration(3661)).toBe('61m 01s');
  });
});
