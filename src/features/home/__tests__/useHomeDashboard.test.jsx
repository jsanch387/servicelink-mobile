import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useAuth } from '../../auth';
import * as homeApi from '../api/homeDashboard';
import * as restOfTodayApi from '../api/restOfToday';
import { useHomeDashboard } from '../hooks/useHomeDashboard';
import { localYyyyMmDd } from '../utils/bookingStart';
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

jest.mock('../api/restOfToday', () => ({
  fetchBookingsForTodayTimeline: jest.fn(),
}));

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
      data: { id: 'biz-1', business_slug: 'acme' },
      error: null,
    });
    homeApi.fetchConfirmedBookingsFromToday.mockResolvedValue({ data: [], error: null });
    restOfTodayApi.fetchBookingsForTodayTimeline.mockResolvedValue({
      data: [],
      error: null,
    });
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
    expect(result.current.nextSubtitle).toBe('');
    expect(result.current.spotlightMode).toBe('none');
    expect(result.current.todaysEarnings).toEqual({
      jobCount: 0,
      potentialCents: 0,
      collectedCents: 0,
      remainingCents: 0,
    });
  });

  it('derives earnings from today bookings and payments', async () => {
    const today = localYyyyMmDd();
    restOfTodayApi.fetchBookingsForTodayTimeline.mockResolvedValue({
      data: [
        {
          id: 'today-1',
          scheduled_date: today,
          start_time: '10:00:00',
          status: 'confirmed',
          service_name: 'Full detail',
          subtotal_cents: 20000,
          discount_cents: 0,
          booking_payments: {
            total_amount_cents: 20000,
            paid_online_amount_cents: 5000,
            session_fees_total_cents: 0,
            session_payment_amount_cents: 0,
          },
        },
        {
          id: 'today-2',
          scheduled_date: today,
          start_time: '14:00:00',
          status: 'completed',
          service_name: 'Interior detail',
          subtotal_cents: 15000,
          discount_cents: 0,
          booking_payments: {
            total_amount_cents: 15000,
            paid_online_amount_cents: 0,
            session_fees_total_cents: 0,
            session_payment_amount_cents: 15000,
          },
        },
      ],
      error: null,
    });

    const { result } = renderHook(() => useHomeDashboard(), { wrapper });

    await waitFor(() => {
      expect(result.current.todaysEarnings.jobCount).toBe(2);
    });

    expect(result.current.todaysEarnings).toEqual({
      jobCount: 2,
      potentialCents: 35000,
      collectedCents: 20000,
      remainingCents: 15000,
    });
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
    expect(result.current.nextSubtitle).toMatch(/Jun|2030|at/i);

    Date.now.mockRestore();
  });

  it('surfaces in-progress visit as next booking when start is in the past but within duration', async () => {
    const nowMs = new Date('2026-06-15T15:00:00').getTime();
    jest.spyOn(Date, 'now').mockReturnValue(nowMs);

    homeApi.fetchConfirmedBookingsFromToday.mockResolvedValue({
      data: [
        {
          id: 'live',
          scheduled_date: '2026-06-15',
          start_time: '14:00:00',
          status: 'confirmed',
          duration_minutes: 120,
          service_name: 'Detail',
          customer_name: 'Sam',
          customer_phone: null,
          customer_street_address: null,
          customer_unit_apt: null,
          customer_city: null,
          customer_state: null,
          customer_zip: null,
        },
        {
          id: 'later',
          scheduled_date: '2026-06-15',
          start_time: '18:00:00',
          status: 'confirmed',
          duration_minutes: 60,
          service_name: 'Wash',
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
      expect(result.current.nextBooking?.id).toBe('live');
    });

    expect(result.current.spotlightMode).toBe('in_progress');
    expect(result.current.upcomingCount).toBe(1);
    expect(result.current.nextSubtitle).toMatch(/^Started at /);

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
    expect(restOfTodayApi.fetchBookingsForTodayTimeline).not.toHaveBeenCalled();
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
