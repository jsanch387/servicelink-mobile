import { groupCompleteVisitBreakdown } from '../utils/groupCompleteVisitBreakdown';

describe('groupCompleteVisitBreakdown', () => {
  it('keeps services and add-ons in one list and fees and discounts apart', () => {
    const grouped = groupCompleteVisitBreakdown({
      lineItems: [
        { id: 'service', label: 'Exterior Wash', amount: 85, kind: 'service' },
        { id: 'tire', label: 'Tire shine', amount: 15, kind: 'addon' },
        { id: 'pet', label: 'Pet hair removal', amount: 40, kind: 'addon' },
        { id: 'engine', label: 'Engine bay cleaning', amount: 35, kind: 'addon' },
        { id: 'discount', label: 'Returning customer', amount: -10, kind: 'discount' },
      ],
      adjustments: [{ id: 'travel', label: 'Travel fee', amount: 20 }],
    });

    expect(grouped.lines.map((item) => item.label)).toEqual([
      'Exterior Wash',
      'Tire shine',
      'Pet hair removal',
      'Engine bay cleaning',
    ]);
    expect(grouped.adjustments).toEqual([
      expect.objectContaining({ label: 'Returning customer', amount: -10, tone: 'discount' }),
      expect.objectContaining({
        label: 'Travel fee',
        amount: 20,
        tone: 'fee',
        removable: true,
      }),
    ]);
    expect(grouped.itemCount).toBe(6);
    expect(grouped.tax).toBeNull();
  });

  it('keeps stored tax out of the service list and the fee group', () => {
    const grouped = groupCompleteVisitBreakdown({
      lineItems: [
        { id: 'service', label: 'Exterior Wash', amount: 85, kind: 'service' },
        { id: 'tax', label: 'Tax (8.25%)', amount: 7.01, kind: 'tax' },
      ],
      adjustments: [],
    });

    expect(grouped.lines.map((item) => item.label)).toEqual(['Exterior Wash']);
    expect(grouped.tax).toEqual(expect.objectContaining({ label: 'Tax (8.25%)', amount: 7.01 }));
    expect(grouped.adjustments).toEqual([]);
    expect(grouped.itemCount).toBe(2);
  });
});
