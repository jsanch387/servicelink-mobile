import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';
import { useAuth } from '../../auth';
import * as homeApi from '../../home/api/homeDashboard';
import * as bookingsApi from '../api/bookings';
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
    fetchPastConfirmedBookingsForBusiness: jest.fn(),
    fetchCancelledBookingsForBusiness: jest.fn(),
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
    bookingsApi.fetchPastConfirmedBookingsForBusiness.mockResolvedValue({
      data: [],
      error: null,
    });
    bookingsApi.fetchCancelledBookingsForBusiness.mockResolvedValue({
      data: [],
      error: null,
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('loads bookings list normally', async () => {
    const { result } = renderHook(() => useBookingsList(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.business?.id).toBe('biz-1');
    expect(result.current.listError).toBeNull();
  });

  it('surfaces list query failure', async () => {
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
