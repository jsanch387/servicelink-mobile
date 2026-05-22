import {
  isProOnlyLinkViewsPeriod,
  periodToSinceIso,
  resolveEffectiveLinkViewsPeriod,
} from '../utils/linkViewsPeriod';

describe('periodToSinceIso', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-05-21T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns 24h window start', () => {
    expect(periodToSinceIso('24h')).toBe('2026-05-20T12:00:00.000Z');
  });

  it('returns 7d window start', () => {
    expect(periodToSinceIso('7d')).toBe('2026-05-14T12:00:00.000Z');
  });

  it('returns 30d window start', () => {
    expect(periodToSinceIso('30d')).toBe('2026-04-21T12:00:00.000Z');
  });
});

describe('resolveEffectiveLinkViewsPeriod', () => {
  it('keeps period for Pro', () => {
    expect(resolveEffectiveLinkViewsPeriod('30d', true)).toBe('30d');
  });

  it('forces 24h for free when 7d or 30d selected', () => {
    expect(resolveEffectiveLinkViewsPeriod('7d', false)).toBe('24h');
    expect(resolveEffectiveLinkViewsPeriod('30d', false)).toBe('24h');
  });

  it('allows 24h for free', () => {
    expect(resolveEffectiveLinkViewsPeriod('24h', false)).toBe('24h');
  });
});

describe('isProOnlyLinkViewsPeriod', () => {
  it('marks 7d and 30d as Pro-only', () => {
    expect(isProOnlyLinkViewsPeriod('7d')).toBe(true);
    expect(isProOnlyLinkViewsPeriod('30d')).toBe(true);
    expect(isProOnlyLinkViewsPeriod('24h')).toBe(false);
  });
});
