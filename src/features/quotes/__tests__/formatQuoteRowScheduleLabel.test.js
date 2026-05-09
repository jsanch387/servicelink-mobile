import { formatQuoteRowScheduleLabel } from '../utils/formatScheduledDateDisplay';

describe('formatQuoteRowScheduleLabel', () => {
  it('returns empty when no schedule fields', () => {
    expect(formatQuoteRowScheduleLabel({})).toBe('');
  });

  it('combines valid date and DB time with a middle dot', () => {
    const s = formatQuoteRowScheduleLabel({
      scheduled_date: '2026-05-08',
      scheduled_start_time: '09:30:00',
    });
    expect(s).toContain('·');
    expect(s).toMatch(/2026|May|8/i);
  });
});
