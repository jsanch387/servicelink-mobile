jest.mock('../../../lib/supabase', () => ({
  supabase: { from: jest.fn() },
}));

import { supabase } from '../../../lib/supabase';
import { fetchLinkViewsCount, fetchLinkViewsLastViewedAt } from '../api/linkViewsAnalytics';

function thenableQuery(result) {
  const resolved = Promise.resolve(result);
  const builder = {
    select: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    gte: jest.fn(() => builder),
    order: jest.fn(() => builder),
    limit: jest.fn(() => builder),
    maybeSingle: jest.fn(() => resolved),
    then: (onFulfilled, onRejected) => resolved.then(onFulfilled, onRejected),
  };
  return builder;
}

describe('fetchLinkViewsCount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-05-21T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('counts page_view rows in the rolling window', async () => {
    const c = thenableQuery({ count: 9, error: null });
    supabase.from.mockReturnValue(c);

    const out = await fetchLinkViewsCount('biz-1', '7d', true);

    expect(supabase.from).toHaveBeenCalledWith('public_analytics_events');
    expect(c.eq).toHaveBeenCalledWith('business_profile_id', 'biz-1');
    expect(c.eq).toHaveBeenCalledWith('event_type', 'page_view');
    expect(c.gte).toHaveBeenCalledWith('occurred_at', '2026-05-14T12:00:00.000Z');
    expect(out).toEqual({ count: 9, error: null });
  });

  it('queries 24h for free users even when 30d is selected', async () => {
    const c = thenableQuery({ count: 2, error: null });
    supabase.from.mockReturnValue(c);

    await fetchLinkViewsCount('biz-1', '30d', false);

    expect(c.gte).toHaveBeenCalledWith('occurred_at', '2026-05-20T12:00:00.000Z');
  });
});

describe('fetchLinkViewsLastViewedAt', () => {
  it('returns newest occurred_at', async () => {
    const c = thenableQuery({ data: { occurred_at: '2026-05-20T08:00:00.000Z' }, error: null });
    supabase.from.mockReturnValue(c);

    const out = await fetchLinkViewsLastViewedAt('biz-1');

    expect(c.order).toHaveBeenCalledWith('occurred_at', { ascending: false });
    expect(c.limit).toHaveBeenCalledWith(1);
    expect(out).toEqual({ lastViewedAt: '2026-05-20T08:00:00.000Z', error: null });
  });
});
