import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';
import { useAuth } from '../../auth';
import * as homeApi from '../../home/api/homeDashboard';
import * as bookingsApi from '../api/bookings';
import { BOOKINGS_FILTER_CANCELLED, BOOKINGS_FILTER_PAST } from '../constants';
import { useBookingsList } from '../hooks/useBookingsList';
import { createTestQueryClient } from '../../home/__tests__/testUtils';

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

jest.mock('../../home/api/homeDashboard', () => ({
  fetchBusinessProfileForUser: jest.fn(),
}));

jest.mock('../api/bookings', () => {
  const actual = jest.requireActual('../api/bookings');
  return {
    ...actual,
    fetchConfirmedBookingsFromToday: jest.fn(),
    fetchCancelledBookingsForBusiness: jest.fn(),
    fetchBookingsForListWindow: jest.fn(),
  };
});

const mockedUseAuth = useAuth;

describe('useBookingsList', () => {
  let queryClient;

  function wrapper({ children }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = createTestQueryClient();
    mockedUseAuth.mockReturnValue({ user: { id: 'user-1' } });
    homeApi.fetchBusinessProfileForUser.mockResolvedValue({
      data: { id: 'biz-1' },
      error: null,
    });
    bookingsApi.fetchConfirmedBookingsFromToday.mockResolvedValue({
      data: [],
      error: null,
    });
    bookingsApi.fetchCancelledBookingsForBusiness.mockResolvedValue({
      data: [],
      error: null,
    });
    bookingsApi.fetchBookingsForListWindow.mockResolvedValue({
      data: [],
      error: null,
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('loads all upcoming appointments in one request', async () => {
    const { result } = renderHook(() => useBookingsList(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(bookingsApi.fetchConfirmedBookingsFromToday).toHaveBeenCalledTimes(1);
    expect(bookingsApi.fetchBookingsForListWindow).not.toHaveBeenCalled();
    expect(result.current.hasNextPage).toBe(false);
  });

  it('paginates past appointments by month with a load-more link', async () => {
    const { result } = renderHook(() => useBookingsList(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      result.current.setListFilter(BOOKINGS_FILTER_PAST);
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(bookingsApi.fetchBookingsForListWindow).toHaveBeenCalled();
      expect(result.current.hasNextPage).toBe(true);
    });
    expect(result.current.loadMorePresentation).toBe('link');
    expect(result.current.loadMoreLabel).toMatch(/^Load /);
  });

  it('loads the previous month on the first past page', async () => {
    const { result } = renderHook(() => useBookingsList(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      result.current.setListFilter(BOOKINGS_FILTER_PAST);
    });

    await waitFor(() => {
      expect(bookingsApi.fetchBookingsForListWindow.mock.calls.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('auto-backfills older past months when the first pages are empty', async () => {
    let call = 0;
    bookingsApi.fetchBookingsForListWindow.mockImplementation(async () => {
      call += 1;
      if (call <= 2) {
        return { data: [], error: null };
      }
      return {
        data: [
          {
            id: 'past-1',
            status: 'completed',
            scheduled_date: '2026-06-15',
            start_time: '09:00:00',
          },
        ],
        error: null,
      };
    });

    const { result } = renderHook(() => useBookingsList(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      result.current.setListFilter(BOOKINGS_FILTER_PAST);
    });

    await waitFor(() => {
      expect(result.current.bookings.some((b) => b.id === 'past-1')).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });
    expect(bookingsApi.fetchBookingsForListWindow.mock.calls.length).toBeGreaterThan(2);
  });

  it('loads all canceled appointments in one request', async () => {
    const { result, rerender } = renderHook(() => useBookingsList(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      result.current.setListFilter(BOOKINGS_FILTER_CANCELLED);
    });
    rerender();

    await waitFor(() => {
      expect(bookingsApi.fetchCancelledBookingsForBusiness).toHaveBeenCalledTimes(1);
      expect(result.current.hasNextPage).toBe(false);
    });
  });

  it('disables list queries when listEnabled is false (calendar mode)', async () => {
    const { result } = renderHook(() => useBookingsList({ listEnabled: false }), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(bookingsApi.fetchConfirmedBookingsFromToday).not.toHaveBeenCalled();
  });

  it('surfaces list query failure for upcoming', async () => {
    bookingsApi.fetchConfirmedBookingsFromToday.mockResolvedValue({
      data: null,
      error: { message: 'Could not load bookings' },
    });

    const { result } = renderHook(() => useBookingsList(), { wrapper });

    await waitFor(() => {
      expect(result.current.listError).toBe('Could not load bookings');
    });
  });
});
