import { buildTapToPaySessionFees } from '../utils/buildTapToPaySessionFees';

describe('buildTapToPaySessionFees', () => {
  it('maps adjustment dollars to cents for intent API', () => {
    expect(
      buildTapToPaySessionFees([
        { label: 'Pet hair', amount: 25 },
        { label: '  ', amount: 10 },
      ]),
    ).toEqual([
      { label: 'Pet hair', amountCents: 2500 },
      { label: 'Fee 2', amountCents: 1000 },
    ]);
  });
});
