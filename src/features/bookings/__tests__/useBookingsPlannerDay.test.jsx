import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';
import { useAuth } from '../../auth';
import * as homeApi from '../../home/api/homeDashboard';
import * as bookingsApi from '../api/bookings';
import { useBookingsPlannerDay } from '../hooks/useBookingsPlannerDay';
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
  fetchBookingsForPlannerDay: jest.fn(),
}));

const mockedUseAuth = useAuth;

describe('useBookingsPlannerDay', () => {
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
    bookingsApi.fetchBookingsForPlannerDay.mockResolvedValue({
      data: [{ id: 'bk-1', scheduled_date: '2026-05-21', start_time: '10:00:00' }],
      error: null,
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('loads planner rows for the given day', async () => {
    const { result } = renderHook(() => useBookingsPlannerDay('2026-05-21'), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(bookingsApi.fetchBookingsForPlannerDay).toHaveBeenCalledWith('biz-1', '2026-05-21');
    expect(result.current.bookings).toHaveLength(1);
    expect(result.current.isDayPending).toBe(false);
  });

  it('does not fetch when date is null (calendar inactive)', async () => {
    const { result } = renderHook(() => useBookingsPlannerDay(null), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(bookingsApi.fetchBookingsForPlannerDay).not.toHaveBeenCalled();
    expect(result.current.bookings).toEqual([]);
  });

  it('sets isDayPending while the day query has no cached data', async () => {
    bookingsApi.fetchBookingsForPlannerDay.mockImplementation(
      () =>
        new Promise(() => {
          /* never resolves */
        }),
    );

    const { result } = renderHook(() => useBookingsPlannerDay('2026-05-29'), { wrapper });

    await waitFor(() => {
      expect(result.current.business?.id).toBe('biz-1');
      expect(result.current.isDayPending).toBe(true);
      expect(result.current.isLoading).toBe(true);
    });
  });
});
