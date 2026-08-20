import { advanceRevenueDateSelection } from '../utils/advanceRevenueDateSelection';

describe('advanceRevenueDateSelection', () => {
  it('starts a range, completes it, and restarts after a full selection', () => {
    expect(advanceRevenueDateSelection(null, null, '2026-03-03')).toEqual({
      startKey: '2026-03-03',
      endKey: null,
    });
    expect(advanceRevenueDateSelection('2026-03-03', null, '2026-03-18')).toEqual({
      startKey: '2026-03-03',
      endKey: '2026-03-18',
    });
    expect(advanceRevenueDateSelection('2026-03-03', '2026-03-18', '2026-04-01')).toEqual({
      startKey: '2026-04-01',
      endKey: null,
    });
  });

  it('swaps when the second tap is before the start, and clears on same-day retap', () => {
    expect(advanceRevenueDateSelection('2026-03-18', null, '2026-03-03')).toEqual({
      startKey: '2026-03-03',
      endKey: '2026-03-18',
    });
    expect(advanceRevenueDateSelection('2026-03-03', null, '2026-03-03')).toEqual({
      startKey: null,
      endKey: null,
    });
  });
});
