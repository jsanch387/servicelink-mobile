import {
  TAP_TO_PAY_TIP_LABEL,
  appendTapToPayTipCheckoutFee,
  appendTapToPayTipFee,
  formatTipUsd,
  parseTipAmountInputToCents,
  tipCentsFromPercent,
} from '../utils/tapToPayTip';

describe('tapToPayTip', () => {
  it('rounds percentage tips to the nearest cent', () => {
    expect(tipCentsFromPercent(8000, 15)).toBe(1200);
    expect(tipCentsFromPercent(8000, 20)).toBe(1600);
    expect(tipCentsFromPercent(8000, 25)).toBe(2000);
    expect(tipCentsFromPercent(3333, 15)).toBe(500);
  });

  it('formats cents as USD', () => {
    expect(formatTipUsd(1600)).toBe('$16.00');
    expect(formatTipUsd(8000)).toBe('$80.00');
  });

  it('parses a custom tip and rejects empty or oversized amounts', () => {
    expect(parseTipAmountInputToCents('5.50')).toBe(550);
    expect(parseTipAmountInputToCents('')).toBeNull();
    expect(parseTipAmountInputToCents('0')).toBeNull();
    expect(parseTipAmountInputToCents('10000')).toBeNull();
  });

  it('appends a Tip fee only when the customer left a tip', () => {
    const fees = [{ label: 'Pet hair', amountCents: 2500 }];
    expect(appendTapToPayTipFee(fees, 0)).toEqual(fees);
    expect(appendTapToPayTipFee(fees, 1600)).toEqual([
      { label: 'Pet hair', amountCents: 2500 },
      { label: TAP_TO_PAY_TIP_LABEL, amountCents: 1600 },
    ]);
    expect(appendTapToPayTipCheckoutFee([{ label: 'Pet hair', amount: 25 }], 1600)).toEqual([
      { label: 'Pet hair', amount: 25 },
      { label: TAP_TO_PAY_TIP_LABEL, amount: 16 },
    ]);
  });
});
