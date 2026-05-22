import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fetchLinkViewsCount, fetchLinkViewsLastViewedAt } from '../api/linkViewsAnalytics';
import { useLinkViewsAnalytics } from '../hooks/useLinkViewsAnalytics';
import { showWebAccountFeatureAlert } from '../../subscription';

jest.mock('../api/linkViewsAnalytics', () => ({
  fetchLinkViewsCount: jest.fn(),
  fetchLinkViewsLastViewedAt: jest.fn(),
}));

jest.mock('../../subscription', () => ({
  showWebAccountFeatureAlert: jest.fn(),
}));

function wrapper(client) {
  return function Wrapper({ children }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe('useLinkViewsAnalytics', () => {
  let client;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    fetchLinkViewsCount.mockResolvedValue({ count: 5, error: null });
    fetchLinkViewsLastViewedAt.mockResolvedValue({
      lastViewedAt: '2026-05-20T10:00:00.000Z',
      error: null,
    });
  });

  it('loads views and last visit for the business', async () => {
    const { result } = renderHook(() => useLinkViewsAnalytics('biz-1', { hasProAccess: true }), {
      wrapper: wrapper(client),
    });

    await waitFor(() => expect(result.current.views).toBe(5));
    expect(result.current.lastViewedAt).toBe('2026-05-20T10:00:00.000Z');
    expect(fetchLinkViewsCount).toHaveBeenCalledWith('biz-1', '24h', true);
  });

  it('shows Pro alert when free user taps 7d', async () => {
    const { result } = renderHook(() => useLinkViewsAnalytics('biz-1', { hasProAccess: false }), {
      wrapper: wrapper(client),
    });

    await waitFor(() => expect(result.current.views).toBe(5));

    act(() => {
      result.current.onPeriodChange('7d');
    });

    expect(showWebAccountFeatureAlert).toHaveBeenCalled();
    expect(result.current.period).toBe('24h');
  });
});
