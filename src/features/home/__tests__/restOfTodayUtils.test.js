import { mapBookingsToRestOfTodayItems } from '../utils/restOfToday';

describe('mapBookingsToRestOfTodayItems', () => {
  it('maps status to timeline kind and drops vehicle', () => {
    const items = mapBookingsToRestOfTodayItems([
      {
        id: '1',
        scheduled_date: '2026-05-13',
        start_time: '09:00:00',
        status: 'confirmed',
        service_name: 'Paint correction',
      },
      {
        id: '2',
        scheduled_date: '2026-05-13',
        start_time: '13:00:00',
        status: 'completed',
        service_name: 'Full detail',
      },
      {
        id: '3',
        scheduled_date: '2026-05-13',
        start_time: '15:00:00',
        status: 'cancelled',
        service_name: 'Wash',
      },
    ]);
    expect(items).toHaveLength(3);
    expect(items[0].statusKind).toBe('scheduled');
    expect(items[0].title).toBe('Paint correction');
    expect(items[1].statusKind).toBe('completed');
    expect(items[2].statusKind).toBe('cancelled');
    expect(items[0]).not.toHaveProperty('vehicle');
  });
});
