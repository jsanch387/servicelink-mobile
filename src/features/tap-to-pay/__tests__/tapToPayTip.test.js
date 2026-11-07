import {
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
});
