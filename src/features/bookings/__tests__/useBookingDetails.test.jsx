import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';
import { fetchBookingDetailsById } from '../booking-details/api/bookingDetails';
import { useBookingDetails } from '../booking-details/hooks/useBookingDetails';
import { createTestQueryClient } from '../../home/__tests__/testUtils';

jest.mock('../booking-details/api/bookingDetails', () => ({
  fetchBookingDetailsById: jest.fn(),
}));

describe('useBookingDetails', () => {
  let queryClient;

  function wrapper({ children }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = createTestQueryClient();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('loads booking details successfully', async () => {
    fetchBookingDetailsById.mockResolvedValue({
      data: { id: 'b-1', status: 'confirmed', service_name: 'Paint correction' },
      error: null,
    });

    const { result } = renderHook(() => useBookingDetails('b-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.booking?.id).toBe('b-1');
    expect(result.current.errorMessage).toBeNull();
  });

  it('surfaces API error and does not retry deterministic messages', async () => {
    fetchBookingDetailsById.mockResolvedValue({
      data: null,
      error: { message: 'Booking not found' },
    });

    const { result } = renderHook(() => useBookingDetails('missing'), { wrapper });

    await waitFor(() => {
      expect(result.current.errorMessage).toBe('Booking not found');
    });

    expect(fetchBookingDetailsById).toHaveBeenCalledTimes(1);
  });

  it('retries transient failures once', async () => {
    fetchBookingDetailsById
      .mockResolvedValueOnce({ data: null, error: { message: 'Network request failed' } })
      .mockResolvedValueOnce({ data: { id: 'b-2', status: 'confirmed' }, error: null });

    const { result } = renderHook(() => useBookingDetails('b-2'), { wrapper });

    await waitFor(() => {
      expect(result.current.booking?.id).toBe('b-2');
    });

    expect(fetchBookingDetailsById).toHaveBeenCalledTimes(2);
  });
});
