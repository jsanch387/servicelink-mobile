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
        tax_cents: 0,
        tax_rate_bps: 0,
      },
      error: null,
    });
    mockMaybeSingle.mockResolvedValue({ data: { id: 'pay-1' }, error: null });

    const result = await syncBookingPaymentTotalsAfterEdit('booking-1', 51000, 'biz-1');

    expect(result.error).toBeNull();
    expect(mockUpdate).toHaveBeenCalledWith({
      tax_cents: 0,
      total_amount_cents: 51000,
      remaining_amount_cents: 50000,
    });
  });

  it('recalculates 7% tax when a third vehicle raises the visit to $600', async () => {
    mockReadMaybeSingle.mockResolvedValue({
      data: {
        id: 'pay-1',
        paid_online_amount_cents: 0,
        total_amount_cents: 32100,
        remaining_amount_cents: 32100,
        tax_cents: 2100,
        tax_rate_bps: 700,
        session_fees_total_cents: 0,
        session_discounts_total_cents: 0,
        session_payment_amount_cents: 0,
        payment_method_selected: 'none',
      },
      error: null,
    });
    mockMaybeSingle.mockResolvedValue({ data: { id: 'pay-1' }, error: null });

    const result = await syncBookingPaymentTotalsAfterEdit('booking-1', 60000, 'biz-1');

    expect(result.error).toBeNull();
    expect(mockUpdate).toHaveBeenCalledWith({
      tax_cents: 4200,
      total_amount_cents: 64200,
      remaining_amount_cents: 64200,
    });
  });

  it('keeps a deposit out of the tax base and out of remaining', async () => {
    mockReadMaybeSingle.mockResolvedValue({
      data: {
        id: 'pay-1',
        paid_online_amount_cents: 10000,
        total_amount_cents: 32100,
        remaining_amount_cents: 22100,
        tax_cents: 2100,
        tax_rate_bps: 700,
        session_discounts_total_cents: 0,
        session_payment_amount_cents: 0,
      },
      error: null,
    });
    mockMaybeSingle.mockResolvedValue({ data: { id: 'pay-1' }, error: null });

    await syncBookingPaymentTotalsAfterEdit('booking-1', 60000, 'biz-1');

    expect(mockUpdate).toHaveBeenCalledWith({
      tax_cents: 4200,
      total_amount_cents: 64200,
      remaining_amount_cents: 54200,
    });
  });

  it('no-ops when totals already match', async () => {
    mockReadMaybeSingle.mockResolvedValue({
      data: {
        id: 'pay-1',
        paid_online_amount_cents: 0,
        total_amount_cents: 51000,
        remaining_amount_cents: 51000,
        tax_cents: 0,
        tax_rate_bps: 0,
      },
      error: null,
    });

    const result = await syncBookingPaymentTotalsAfterEdit('booking-1', 51000);

    expect(result.error).toBeNull();
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
