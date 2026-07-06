import { fetchOnTheWaySentForBookings } from '../api/fetchOnTheWaySentForBookings';

const mockIn = jest.fn();

jest.mock('../../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        in: mockIn,
      })),
    })),
  },
}));

describe('fetchOnTheWaySentForBookings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns false for all ids when no rows match', async () => {
    mockIn.mockReturnValue({
      eq: jest.fn().mockReturnValue({
        in: jest.fn().mockResolvedValue({ data: [], error: null }),
      }),
    });

    const map = await fetchOnTheWaySentForBookings(['a', 'b']);

    expect(map.get('a')).toBe(false);
    expect(map.get('b')).toBe(false);
  });

  it('marks booking ids present in sms_messages', async () => {
    mockIn.mockReturnValue({
      eq: jest.fn().mockReturnValue({
        in: jest.fn().mockResolvedValue({
          data: [{ booking_id: 'b' }],
          error: null,
        }),
      }),
    });

    const map = await fetchOnTheWaySentForBookings(['a', 'b']);

    expect(map.get('a')).toBe(false);
    expect(map.get('b')).toBe(true);
  });
});
