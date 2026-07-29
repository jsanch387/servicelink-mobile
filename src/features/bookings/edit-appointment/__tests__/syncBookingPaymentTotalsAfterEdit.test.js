import { syncBookingPaymentTotalsAfterEdit } from '../api/syncBookingPaymentTotalsAfterEdit';

const mockMaybeSingle = jest.fn();
const mockSelect = jest.fn(() => ({ maybeSingle: mockMaybeSingle }));
const mockUpdateEq = jest.fn(() => ({ eq: mockUpdateEq2, select: mockSelect }));
const mockUpdateEq2 = jest.fn(() => ({ select: mockSelect }));
const mockUpdate = jest.fn(() => ({ eq: mockUpdateEq }));
const mockReadMaybeSingle = jest.fn();
const mockReadEq2 = jest.fn(() => ({ maybeSingle: mockReadMaybeSingle }));
const mockReadEq = jest.fn(() => ({ eq: mockReadEq2, maybeSingle: mockReadMaybeSingle }));
const mockReadSelect = jest.fn(() => ({ eq: mockReadEq }));

jest.mock('../../../../lib/supabase', () => ({
  supabase: {
    from: jest.fn((table) => {
      if (table === 'booking_payments') {
        return {
          select: mockReadSelect,
          update: mockUpdate,
        };
      }
      return {};
    }),
  },
}));

describe('syncBookingPaymentTotalsAfterEdit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdateEq.mockImplementation(() => ({ eq: mockUpdateEq2, select: mockSelect }));
    mockUpdateEq2.mockImplementation(() => ({ select: mockSelect }));
  });

  it('updates total and remaining from visit net minus paid online', async () => {
    mockReadMaybeSingle.mockResolvedValue({
      data: {
        id: 'pay-1',
        paid_online_amount_cents: 1000,
        total_amount_cents: 39900,
        remaining_amount_cents: 39900,
      },
      error: null,
    });
    mockMaybeSingle.mockResolvedValue({ data: { id: 'pay-1' }, error: null });

    const result = await syncBookingPaymentTotalsAfterEdit('booking-1', 51000, 'biz-1');

    expect(result.error).toBeNull();
    expect(mockUpdate).toHaveBeenCalledWith({
      total_amount_cents: 51000,
      remaining_amount_cents: 50000,
    });
  });

  it('no-ops when totals already match', async () => {
    mockReadMaybeSingle.mockResolvedValue({
      data: {
        id: 'pay-1',
        paid_online_amount_cents: 0,
        total_amount_cents: 51000,
        remaining_amount_cents: 51000,
      },
      error: null,
    });

    const result = await syncBookingPaymentTotalsAfterEdit('booking-1', 51000);

    expect(result.error).toBeNull();
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
