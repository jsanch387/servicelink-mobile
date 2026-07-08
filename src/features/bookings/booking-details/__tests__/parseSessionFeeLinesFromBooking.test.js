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
      { id: 'fee-1', name: 'Pet hair removal', price: 25 },
      { id: 'fee-2', name: 'Extra vacuum', price: 15 },
    ]);
  });

  it('falls back to a generic label when label is missing', () => {
    expect(parseSessionFeeLinesFromBooking([{ amount_cents: 500 }])).toEqual([
      { id: 'session-fee-1', name: 'Additional fee 1', price: 5 },
    ]);
  });
});
