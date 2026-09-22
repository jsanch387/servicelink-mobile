import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import { activeBusinessMembershipQueryKey } from '../../queryKeys';
import { useTeamMembershipRealtime } from '../useTeamMembershipRealtime';

const listeners = [];

jest.mock('../../../../lib/supabase', () => ({
  supabase: {
    channel: jest.fn(() => {
      const channel = {
        on: jest.fn((_event, _filter, callback) => {
          listeners.push(callback);
          return channel;
        }),
        subscribe: jest.fn(() => channel),
      };
      return channel;
    }),
    removeChannel: jest.fn(),
  },
}));

describe('useTeamMembershipRealtime', () => {
  beforeEach(() => {
    listeners.length = 0;
    jest.clearAllMocks();
  });

  it('marks the hire removed when their membership row updates', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
    const key = activeBusinessMembershipQueryKey('user-1');
    client.setQueryData(key, { business_id: 'shop', status: 'active' });

    renderHook(() => useTeamMembershipRealtime('user-1'), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    });

    listeners[0]({
      eventType: 'UPDATE',
      new: { business_id: 'shop', status: 'removed', user_id: 'user-1' },
    });

    await waitFor(() => {
      expect(client.getQueryData(key)).toEqual({
        business_id: 'shop',
        status: 'removed',
      });
    });
  });
});
