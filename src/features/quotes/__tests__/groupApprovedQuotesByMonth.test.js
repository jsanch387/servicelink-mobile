import { groupApprovedQuotesByMonth } from '../utils/groupApprovedQuotesByMonth';

describe('groupApprovedQuotesByMonth', () => {
  it('groups newest-first cards into activity months', () => {
    const groups = groupApprovedQuotesByMonth([
      { id: 'jul-2', activityAt: '2026-07-20T10:00:00Z' },
      { id: 'jul-1', activityAt: '2026-07-05T10:00:00Z' },
      { id: 'jun-1', activityAt: '2026-06-28T10:00:00Z' },
    ]);

    expect(groups).toHaveLength(2);
    expect(groups[0].label).toMatch(/July 2026/i);
    expect(groups[0].cards.map((card) => card.id)).toEqual(['jul-2', 'jul-1']);
    expect(groups[1].label).toMatch(/June 2026/i);
    expect(groups[1].cards.map((card) => card.id)).toEqual(['jun-1']);
  });

  it('keeps cards without a valid activity date in an older group', () => {
    const groups = groupApprovedQuotesByMonth([{ id: 'unknown', activityAt: null }]);

    expect(groups).toEqual([
      {
        key: 'older',
        label: 'older quotes',
        cards: [{ id: 'unknown', activityAt: null }],
      },
    ]);
  });
});
