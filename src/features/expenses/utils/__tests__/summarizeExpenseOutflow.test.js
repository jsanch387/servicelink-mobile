import { EXPENSE_CATEGORY } from '../../constants/expenseCategories';
import { EXPENSE_RANGE } from '../../constants/expenseRanges';
import {
  expenseOverviewFetchWindow,
  expensePriorWindow,
  expenseRangeWindow,
} from '../expenseWindows';
import { summarizeExpenseOutflow } from '../summarizeExpenseOutflow';

const NOW = new Date(2026, 8, 7);

const EXPENSES = [
  { id: 'a', name: 'Gas', amount: 70, chargedOn: '2026-09-06', category: EXPENSE_CATEGORY.FUEL },
  {
    id: 'b',
    name: 'Towels',
    amount: 30,
    chargedOn: '2026-09-02',
    category: EXPENSE_CATEGORY.SUPPLIES,
  },
  { id: 'c', name: 'Gas', amount: 40, chargedOn: '2026-08-04', category: EXPENSE_CATEGORY.FUEL },
  {
    id: 'd',
    name: 'Insurance',
    amount: 200,
    chargedOn: '2026-08-20',
    category: EXPENSE_CATEGORY.INSURANCE,
  },
  {
    id: 'e',
    name: 'Buffer',
    amount: 100,
    chargedOn: '2025-11-02',
    category: EXPENSE_CATEGORY.EQUIPMENT,
  },
];

describe('expenseRangeWindow', () => {
  it('uses this week from Sunday through today', () => {
    expect(expenseRangeWindow(EXPENSE_RANGE.WEEK, NOW)).toEqual({
      fromYmd: '2026-09-06',
      toYmd: '2026-09-07',
    });
  });

  it('uses this month through today', () => {
    expect(expenseRangeWindow(EXPENSE_RANGE.MONTH, NOW)).toEqual({
      fromYmd: '2026-09-01',
      toYmd: '2026-09-07',
    });
  });

  it('uses the selected custom dates', () => {
    expect(
      expenseRangeWindow(EXPENSE_RANGE.CUSTOM, NOW, EXPENSES, {
        fromYmd: '2026-03-03',
        toYmd: '2026-03-18',
      }),
    ).toEqual({
      fromYmd: '2026-03-03',
      toYmd: '2026-03-18',
    });
  });

  it('uses the earliest charge through today for all time', () => {
    expect(expenseRangeWindow(EXPENSE_RANGE.ALL, NOW, EXPENSES)).toEqual({
      fromYmd: '2025-11-02',
      toYmd: '2026-09-07',
    });
  });
});

describe('expensePriorWindow', () => {
  it('uses the previous full week', () => {
    expect(expensePriorWindow(EXPENSE_RANGE.WEEK, NOW)).toEqual({
      fromYmd: '2026-08-30',
      toYmd: '2026-09-05',
    });
  });

  it('uses the same-length window before a custom range', () => {
    expect(
      expensePriorWindow(EXPENSE_RANGE.CUSTOM, NOW, {
        fromYmd: '2026-03-03',
        toYmd: '2026-03-18',
      }),
    ).toEqual({
      fromYmd: '2026-02-15',
      toYmd: '2026-03-02',
    });
  });
});

describe('expenseOverviewFetchWindow', () => {
  it('includes this month and the prior comparison window', () => {
    expect(expenseOverviewFetchWindow(EXPENSE_RANGE.MONTH, NOW)).toEqual({
      fromYmd: '2026-08-01',
      toYmd: '2026-09-07',
    });
  });

  it('has no bound for all time', () => {
    expect(expenseOverviewFetchWindow(EXPENSE_RANGE.ALL, NOW)).toBeNull();
  });
});

describe('summarizeExpenseOutflow', () => {
  it('totals this month and compares to the same days last month', () => {
    const outflow = summarizeExpenseOutflow(EXPENSES, EXPENSE_RANGE.MONTH, NOW);
    expect(outflow.total).toBe(100);
    expect(outflow.caption).toBe('This month');
    expect(outflow.yearToDate).toBe(340);
    expect(outflow.showYearToDate).toBe(true);
    expect(outflow.changeSentence).toBe('150% more than last month');
  });

  it('totals this week and hides year-to-date when viewing the year', () => {
    const week = summarizeExpenseOutflow(EXPENSES, EXPENSE_RANGE.WEEK, NOW);
    expect(week.total).toBe(70);
    expect(week.caption).toBe('This week');
    expect(week.bars).toHaveLength(7);
    expect(week.bars[0]).toMatchObject({
      key: '2026-09-06',
      label: 'Su',
      fullLabel: 'Sun, Sep 6',
      amount: 70,
    });
    expect(week.bars.map((bar) => bar.label)).toEqual(['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']);
    expect(week.windowCaption).toBe('Sep 6 – Sep 12');

    const year = summarizeExpenseOutflow(EXPENSES, EXPENSE_RANGE.YEAR, NOW);
    expect(year.total).toBe(340);
    expect(year.showYearToDate).toBe(false);
    expect(year.bars).toHaveLength(12);
    expect(year.bars.map((bar) => bar.label)).toEqual([
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ]);
    expect(year.bars[8].fullLabel).toBe('Sep 2026');
  });

  it('labels month buckets like revenue: Wk 1–4 with date tooltips', () => {
    const outflow = summarizeExpenseOutflow(EXPENSES, EXPENSE_RANGE.MONTH, NOW);
    expect(outflow.bars.map((bar) => bar.label)).toEqual(['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4']);
    expect(outflow.bars.map((bar) => bar.fullLabel)).toEqual([
      'Sep 1–7',
      'Sep 8–14',
      'Sep 15–21',
      'Sep 22–30',
    ]);
    expect(outflow.windowCaption).toBe('Sep 1 – Sep 30');
    expect(outflow.compareLabel).toBe('vs last month');
  });

  it('plots all time by month when history is under three years', () => {
    const outflow = summarizeExpenseOutflow(EXPENSES, EXPENSE_RANGE.ALL, NOW);
    expect(outflow.total).toBe(440);
    expect(outflow.caption).toBe('All time');
    expect(outflow.compareLabel).toBeNull();
    expect(outflow.showYearToDate).toBe(false);
    expect(outflow.windowCaption).toBe('Nov 2, 2025 – Sep 7, 2026');
    expect(outflow.bars[0]).toMatchObject({
      label: 'Nov',
      fullLabel: 'Nov 2025',
      amount: 100,
    });
    expect(outflow.bars[2]).toMatchObject({
      label: 'Jan',
      fullLabel: 'Jan 2026',
    });
    expect(outflow.bars[outflow.bars.length - 1]).toMatchObject({
      label: 'Sep',
      fullLabel: 'Sep 2026',
      amount: 100,
    });
    expect(outflow.bars).toHaveLength(11);
  });

  it('plots all time by year when history spans three or more years', () => {
    const outflow = summarizeExpenseOutflow(
      [
        ...EXPENSES,
        {
          id: 'f',
          name: 'Old wax',
          amount: 20,
          chargedOn: '2024-03-01',
          category: EXPENSE_CATEGORY.SUPPLIES,
        },
      ],
      EXPENSE_RANGE.ALL,
      NOW,
    );
    expect(outflow.total).toBe(460);
    expect(outflow.bars.map((bar) => [bar.label, bar.amount])).toEqual([
      ['2024', 20],
      ['2025', 100],
      ['2026', 340],
    ]);
  });

  it('totals a custom range and compares to the same-length prior period', () => {
    const outflow = summarizeExpenseOutflow(EXPENSES, EXPENSE_RANGE.CUSTOM, NOW, {
      customFromYmd: '2026-08-20',
      customToYmd: '2026-09-06',
    });
    expect(outflow.total).toBe(300);
    expect(outflow.caption).toBe('Custom');
    expect(outflow.compareLabel).toBe('vs prior period');
    expect(outflow.windowCaption).toBe('Aug 20 – Sep 6');
    expect(outflow.bars).toHaveLength(18);
    expect(outflow.bars[0]).toMatchObject({ label: 'Aug 20', amount: 200 });
    expect(outflow.bars[outflow.bars.length - 1]).toMatchObject({ label: 'Sep 6', amount: 70 });
    expect(outflow.showYearToDate).toBe(false);
  });

  it('breaks down the selected range by category', () => {
    const outflow = summarizeExpenseOutflow(EXPENSES, EXPENSE_RANGE.MONTH, NOW);
    expect(outflow.categories.map((row) => [row.key, row.amount])).toEqual([
      [EXPENSE_CATEGORY.FUEL, 70],
      [EXPENSE_CATEGORY.SUPPLIES, 30],
    ]);
  });
});
