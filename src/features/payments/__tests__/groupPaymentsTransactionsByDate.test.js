import { groupPaymentsTransactionsByDate } from '../utils/groupPaymentsTransactionsByDate';

describe('groupPaymentsTransactionsByDate', () => {
  it('keeps consecutive rows that share a painted date together', () => {
    const groups = groupPaymentsTransactionsByDate([
      { id: 'a', dateLabel: 'Aug 24' },
      { id: 'b', dateLabel: 'Aug 24' },
      { id: 'c', dateLabel: 'Aug 23' },
    ]);
    expect(groups).toHaveLength(2);
    expect(groups[0].dateLabel).toBe('Aug 24');
    expect(groups[0].items.map((item) => item.id)).toEqual(['a', 'b']);
    expect(groups[1].dateLabel).toBe('Aug 23');
  });
});
