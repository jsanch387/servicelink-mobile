import { parseSessionFeeLinesFromBooking } from '../utils/parseSessionFeeLinesFromBooking';

describe('parseSessionFeeLinesFromBooking', () => {
  it('returns empty array for non-array input', () => {
    expect(parseSessionFeeLinesFromBooking(null)).toEqual([]);
    expect(parseSessionFeeLinesFromBooking(undefined)).toEqual([]);
  });

  it('parses snake_case fee lines from Supabase', () => {
    expect(
      parseSessionFeeLinesFromBooking([
        { id: 'fee-1', label: 'Pet hair removal', amount_cents: 2500 },
        { id: 'fee-2', label: 'Extra vacuum', amount_cents: 1500 },
      ]),
    ).toEqual([
      { id: 'fee-1', name: 'Pet hair removal', price: 25, kind: 'fee' },
      { id: 'fee-2', name: 'Extra vacuum', price: 15, kind: 'fee' },
    ]);
  });

  it('keeps a discount amount positive and marks its kind', () => {
    expect(
      parseSessionFeeLinesFromBooking([
        { id: 'd1', label: 'Deposit', amount_cents: 5000, kind: 'discount' },
      ]),
    ).toEqual([{ id: 'd1', name: 'Deposit', price: 50, kind: 'discount' }]);
  });

  it('falls back to a generic label when label is missing', () => {
    expect(parseSessionFeeLinesFromBooking([{ amount_cents: 500 }])).toEqual([
      { id: 'session-fee-1', name: 'Additional fee 1', price: 5, kind: 'fee' },
    ]);
  });
});
