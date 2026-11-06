import { buildTapToPaySessionFees } from '../utils/buildTapToPaySessionFees';

describe('buildTapToPaySessionFees', () => {
  it('maps adjustment dollars to cents for intent API', () => {
    expect(
      buildTapToPaySessionFees([
        { label: 'Pet hair', amount: 25 },
        { label: '  ', amount: 10 },
      ]),
    ).toEqual([
      { kind: 'fee', label: 'Pet hair', amountCents: 2500 },
      { kind: 'fee', label: 'Fee 2', amountCents: 1000 },
    ]);
  });

  it('keeps a discount kind and sends a positive amount', () => {
    expect(buildTapToPaySessionFees([{ label: 'Deposit', amount: -50, kind: 'discount' }])).toEqual(
      [{ kind: 'discount', label: 'Deposit', amountCents: 5000 }],
    );
  });
});
