import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';
import { useAuth } from '../../auth';
import * as homeApi from '../../home/api/homeDashboard';
import * as bookingsApi from '../api/bookings';
import { useBookingsCalendarCounts } from '../hooks/useBookingsCalendarCounts';
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

jest.mock('../api/bookings', () => ({
  fetchBookingsCountsForCalendarRange: jest.fn(),
}));

const mockedUseAuth = useAuth;

describe('useBookingsCalendarCounts', () => {
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
    bookingsApi.fetchBookingsCountsForCalendarRange.mockResolvedValue({
      data: [
        { scheduled_date: '2026-05-20', status: 'confirmed' },
        { scheduled_date: '2026-05-20', status: 'confirmed' },
      ],
      error: null,
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('fetches counts for the requested range and builds bookingCountByDateKey', async () => {
    const { result } = renderHook(
      () =>
        useBookingsCalendarCounts({
          rangeStart: '2026-05-01',
          rangeEnd: '2026-05-31',
          enabled: true,
        }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(bookingsApi.fetchBookingsCountsForCalendarRange).toHaveBeenCalledWith(
      'biz-1',
      '2026-05-01',
      '2026-05-31',
    );
    expect(result.current.bookingCountByDateKey).toEqual({ '2026-05-20': 2 });
  });

  it('does not fetch counts when disabled (business may still load)', async () => {
    const { result } = renderHook(
      () =>
        useBookingsCalendarCounts({
          rangeStart: '2026-05-01',
          rangeEnd: '2026-05-31',
          enabled: false,
        }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.business?.id).toBe('biz-1');
    });

    expect(bookingsApi.fetchBookingsCountsForCalendarRange).not.toHaveBeenCalled();
    expect(result.current.bookingCountByDateKey).toEqual({});
  });

  it('surfaces counts query errors', async () => {
    bookingsApi.fetchBookingsCountsForCalendarRange.mockResolvedValue({
      data: null,
      error: { message: 'Could not load calendar' },
    });

    const { result } = renderHook(
      () =>
        useBookingsCalendarCounts({
          rangeStart: '2026-05-01',
          rangeEnd: '2026-05-31',
          enabled: true,
        }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.countsError).toBe('Could not load calendar');
    });
  });
});
