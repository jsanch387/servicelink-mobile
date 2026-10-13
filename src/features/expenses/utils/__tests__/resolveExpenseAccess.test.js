import { resolveExpenseAccess } from '../resolveExpenseAccess';

const hidden = { canSeeExpenses: false, canUseExpenses: false, showUpsell: false };

describe('resolveExpenseAccess', () => {
  it('shows expenses to an owner with Pro', () => {
    expect(
      resolveExpenseAccess({
        canSeeOffice: true,
        hasProAccess: true,
        profileLoaded: true,
      }),
    ).toEqual({ canSeeExpenses: true, canUseExpenses: true, showUpsell: false, isReady: true });
  });

  it('shows the subscribe card to an owner without Pro', () => {
    expect(
      resolveExpenseAccess({
        canSeeOffice: true,
        hasProAccess: false,
        profileLoaded: true,
      }),
    ).toEqual({ canSeeExpenses: true, canUseExpenses: false, showUpsell: true, isReady: true });
  });

  it('waits for the owner profile before showing expenses', () => {
    expect(
      resolveExpenseAccess({
        canSeeOffice: true,
        hasProAccess: true,
        profileLoaded: false,
      }),
    ).toEqual({ ...hidden, isReady: false });
  });

  it('keeps expenses off for shop members', () => {
    expect(
      resolveExpenseAccess({
        canSeeOffice: false,
        hasProAccess: true,
        profileLoaded: true,
      }),
    ).toEqual({ ...hidden, isReady: true });
  });
});
