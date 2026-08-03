import { SMS_MESSAGES_PAGE_SIZE, fetchBusinessSmsMessages } from '../api/fetchBusinessSmsMessages';

const mockRange = jest.fn();
const mockOrder = jest.fn();
const mockEqDirection = jest.fn();
const mockEqBusiness = jest.fn();

jest.mock('../../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: mockEqBusiness,
      })),
    })),
  },
}));

describe('fetchBusinessSmsMessages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRange.mockResolvedValue({ data: [{ id: '1' }], error: null });
    mockOrder.mockReturnValue({
      range: mockRange,
    });
    mockEqDirection.mockReturnValue({
      order: mockOrder,
    });
    mockEqBusiness.mockReturnValue({
      eq: mockEqDirection,
    });
  });

  it('returns an empty list when business id is missing', async () => {
    await expect(fetchBusinessSmsMessages('')).resolves.toEqual({ data: [], error: null });
  });

  it('queries the newest outbound page for the business', async () => {
    const result = await fetchBusinessSmsMessages('biz-1');
    expect(mockEqBusiness).toHaveBeenCalledWith('business_id', 'biz-1');
    expect(mockEqDirection).toHaveBeenCalledWith('direction', 'outbound');
    expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(mockRange).toHaveBeenCalledWith(0, SMS_MESSAGES_PAGE_SIZE - 1);
    expect(result).toEqual({ data: [{ id: '1' }], error: null });
  });

  it('supports offset pages for load older', async () => {
    await fetchBusinessSmsMessages('biz-1', { offset: 25, limit: 25 });
    expect(mockRange).toHaveBeenCalledWith(25, 49);
  });
});
