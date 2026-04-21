import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useAuth } from '../../auth';
import * as homeApi from '../api/homeDashboard';
import { useHomeDashboard } from '../hooks/useHomeDashboard';
import { createTestQueryClient } from './testUtils';

jest.mock('@react-navigation/native', () => {
  const ReactNav = require('react');
  return {
    useFocusEffect: (cb) => {
      ReactNav.useEffect(() => {
        cb();
      }, []);
    },
  };
});

jest.mock('../../auth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../api/homeDashboard', () => {
  const actual = jest.requireActual('../api/homeDashboard');
  return {
    ...actual,
    fetchBusinessProfileForUser: jest.fn(),
    fetchConfirmedBookingsFromToday: jest.fn(),
  };
});

const mockedUseAuth = useAuth;

describe('useHomeDashboard', () => {
  let queryClient;

  function wrapper({ children }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  afterEach(() => {
    queryClient.clear();
  });

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
    mockedUseAuth.mockReturnValue({ user: { id: 'user-1' } });
    homeApi.fetchBusinessProfileForUser.mockResolvedValue({
      data: { id: 'biz-1', business_slug: 'acme', profile_views: 5 },
      error: null,
    });
    homeApi.fetchConfirmedBookingsFromToday.mockResolvedValue({ data: [], error: null });
  });

  it('loads business and empty bookings', async () => {
    const { result } = renderHook(() => useHomeDashboard(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.business?.id).toBe('biz-1');
    expect(result.current.businessError).toBeNull();
    expect(result.current.bookingsError).toBeNull();
    expect(result.current.nextBooking).toBeNull();
    expect(result.current.upcomingCount).toBe(0);
    expect(result.current.nextBookingTitle).toBe('');
  });

  it('derives next booking and count from confirmed future rows', async () => {
    const nowMs = 0;
    jest.spyOn(Date, 'now').mockReturnValue(nowMs);

    homeApi.fetchConfirmedBookingsFromToday.mockResolvedValue({
      data: [
        {
          id: 'a',
          scheduled_date: '2030-06-02',
          start_time: '14:00:00',
          status: 'confirmed',
          service_name: 'Cut',
          customer_name: 'Sam',
          customer_phone: null,
          customer_street_address: null,
          customer_unit_apt: null,
          customer_city: null,
          customer_state: null,
          customer_zip: null,
        },
        {
          id: 'b',
          scheduled_date: '2030-06-01',
          start_time: '10:00:00',
          status: 'confirmed',
          service_name: 'Color',
          customer_name: 'Kim',
          customer_phone: null,
          customer_street_address: null,
          customer_unit_apt: null,
          customer_city: null,
          customer_state: null,
          customer_zip: null,
        },
      ],
      error: null,
    });

    const { result } = renderHook(() => useHomeDashboard(), { wrapper });

    await waitFor(() => {
      expect(result.current.upcomingCount).toBe(2);
    });

    expect(result.current.nextBooking?.id).toBe('b');
    expect(result.current.nextBookingTitle).toBe('Kim — Color');

    Date.now.mockRestore();
  });

  it('surfaces business fetch errors', async () => {
    homeApi.fetchBusinessProfileForUser.mockResolvedValue({
      data: null,
      error: { message: 'RLS blocked' },
    });

    const { result } = renderHook(() => useHomeDashboard(), { wrapper });

    await waitFor(() => {
      expect(result.current.businessError).toBe('RLS blocked');
    });

    expect(result.current.business).toBeNull();
  });

  it('does not load bookings when there is no signed-in user', async () => {
    mockedUseAuth.mockReturnValue({ user: null });

    const { result } = renderHook(() => useHomeDashboard(), { wrapper });

    await waitFor(() => {
      expect(result.current.isPendingBusiness).toBe(false);
    });

    expect(homeApi.fetchBusinessProfileForUser).not.toHaveBeenCalled();
    expect(homeApi.fetchConfirmedBookingsFromToday).not.toHaveBeenCalled();
  });

  it('refetch forces API calls again', async () => {
    const { result } = renderHook(() => useHomeDashboard(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const n1 = homeApi.fetchBusinessProfileForUser.mock.calls.length;

    await result.current.refetch();

    await waitFor(() => {
      expect(homeApi.fetchBusinessProfileForUser.mock.calls.length).toBeGreaterThan(n1);
    });
  });
});
