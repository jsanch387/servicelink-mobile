import { getQuoteStatusPillTheme } from '../utils/quoteStatusPillTheme';

const lightColors = {
  border: '#e5e5e5',
  borderStrong: '#d4d4d4',
  danger: '#dc2626',
  text: '#171717',
  textMuted: '#737373',
  textSecondary: '#404040',
};

describe('getQuoteStatusPillTheme', () => {
  it('uses green tones for approved (light)', () => {
    const t = getQuoteStatusPillTheme('approved', lightColors, false);
    expect(t.color).toMatch(/15803d|green/i);
    expect(t.backgroundColor).toContain('22,163,74');
  });

  it('uses orange for requests the owner owes and blue while waiting on the customer', () => {
    const req = getQuoteStatusPillTheme('requested', lightColors, false);
    expect(req.color).toMatch(/c2410c|orange/i);
    const sent = getQuoteStatusPillTheme('sent', lightColors, false);
    expect(sent.color).toMatch(/1d4ed8|blue/i);
    expect(sent.backgroundColor).not.toEqual(req.backgroundColor);
  });

  it('uses danger for declined', () => {
    const t = getQuoteStatusPillTheme('declined', lightColors, false);
    expect(t.color).toBe(lightColors.danger);
  });

  it('includes a status icon name', () => {
    expect(getQuoteStatusPillTheme('approved', lightColors, false).iconName).toBe(
      'checkmark-circle',
    );
    expect(getQuoteStatusPillTheme('sent', lightColors, false).iconName).toBe('time');
    expect(getQuoteStatusPillTheme('requested', lightColors, false).iconName).toBe('mail-unread');
  });
});
