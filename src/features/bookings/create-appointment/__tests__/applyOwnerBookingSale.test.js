import { DEPOSIT_AMOUNT_MODE } from '../../../payments/constants/depositAmount';
import {
  buildAppliedSaleDiscount,
  computeSaleDiscountCents,
  pickActiveSaleForAppointmentDate,
  saleQualifiesForAppointmentDate,
} from '../utils/applyOwnerBookingSale';

function sale(overrides = {}) {
  return {
    id: 'sale-1',
    kind: 'sale',
    name: 'Summer Sale',
    discountMode: DEPOSIT_AMOUNT_MODE.PERCENTAGE,
    discountAmount: '20',
    startDateYyyyMmDd: '2026-07-01',
    endDateYyyyMmDd: '2026-07-31',
    isEnabled: true,
    createdAtIso: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('applyOwnerBookingSale', () => {
  it('qualifies when appointment is inside the sale window', () => {
    expect(saleQualifiesForAppointmentDate(sale(), '2026-07-15')).toBe(true);
  });

  it('does not qualify when sale is off', () => {
    expect(saleQualifiesForAppointmentDate(sale({ isEnabled: false }), '2026-07-15')).toBe(false);
  });

  it('does not qualify outside the window', () => {
    expect(saleQualifiesForAppointmentDate(sale(), '2026-08-01')).toBe(false);
  });

  it('qualifies open-ended active sales with no dates', () => {
    expect(
      saleQualifiesForAppointmentDate(
        sale({ startDateYyyyMmDd: '', endDateYyyyMmDd: '' }),
        '2026-12-01',
      ),
    ).toBe(true);
  });

  it('picks the first qualifying sale', () => {
    const picked = pickActiveSaleForAppointmentDate(
      [sale({ id: 'a', isEnabled: false }), sale({ id: 'b' })],
      '2026-07-10',
    );
    expect(picked?.id).toBe('b');
  });

  it('computes percentage discount cents', () => {
    expect(computeSaleDiscountCents(23500, sale({ discountAmount: '20' }))).toBe(4700);
  });

  it('computes fixed discount cents capped at subtotal', () => {
    expect(
      computeSaleDiscountCents(
        2000,
        sale({ discountMode: DEPOSIT_AMOUNT_MODE.FIXED, discountAmount: '50' }),
      ),
    ).toBe(2000);
  });

  it('builds applied discount payload for review and API', () => {
    const applied = buildAppliedSaleDiscount({
      subtotalCents: 10000,
      sale: sale(),
    });
    expect(applied).toMatchObject({
      discountCents: 2000,
      totalCents: 8000,
      discountLabel: '20% OFF',
      lineLabel: 'Summer Sale · 20% OFF',
      discountType: 'percentage',
      discountValue: 20,
    });
  });
});
