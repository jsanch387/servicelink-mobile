import {
  filterPastConfirmedRows,
  partitionUpcomingConfirmed,
  sortCancelledBookingsForList,
} from '../api/bookings';

function row(id, scheduled_date, start_time, status = 'confirmed') {
  return {
    id,
    scheduled_date,
    start_time,
    status,
    service_name: null,
    customer_name: null,
    customer_phone: null,
    customer_street_address: null,
    customer_unit_apt: null,
    customer_city: null,
    customer_state: null,
    customer_zip: null,
  };
}

describe('filterPastConfirmedRows', () => {
  const nowMs = new Date('2026-06-15T12:00:00').getTime();

  it('keeps confirmed and completed rows strictly before nowMs', () => {
    const rows = [
      row('f', '2026-06-15', '14:00:00'),
      row('p', '2026-06-15', '09:00:00'),
      row('old', '2026-06-01', '10:00:00'),
      row('x', '2026-06-15', '12:00:00'),
      row('can', '2026-06-10', '10:00:00', 'cancelled'),
      row('done', '2026-06-02', '11:00:00', 'completed'),
    ];
    const out = filterPastConfirmedRows(rows, nowMs);
    expect(out.map((r) => r.id)).toEqual(['p', 'done', 'old']);
  });

  it('sorts newest-first by start instant', () => {
    const rows = [row('a', '2026-06-01', '10:00:00'), row('b', '2026-06-10', '15:00:00')];
    const out = filterPastConfirmedRows(rows, nowMs);
    expect(out.map((r) => r.id)).toEqual(['b', 'a']);
  });
});

describe('partitionUpcomingConfirmed', () => {
  const nowMs = new Date('2026-05-21T14:00:00').getTime();

  it('keeps only confirmed rows at or after nowMs sorted ascending', () => {
    const rows = [
      row('later', '2026-05-22', '09:00:00'),
      row('past', '2026-05-21', '09:00:00'),
      row('now', '2026-05-21', '14:00:00'),
      row('cancel', '2026-05-30', '10:00:00', 'cancelled'),
    ];
    const { upcoming, next } = partitionUpcomingConfirmed(rows, nowMs);
    expect(upcoming.map((r) => r.id)).toEqual(['now', 'later']);
    expect(next?.id).toBe('now');
  });

  it('excludes confirmed rows on today before the current instant', () => {
    const rows = [row('morning', '2026-05-21', '08:00:00')];
    expect(partitionUpcomingConfirmed(rows, nowMs).upcoming).toEqual([]);
  });
});

describe('sortCancelledBookingsForList', () => {
  it('orders by start instant descending', () => {
    const rows = [
      row('a', '2026-06-01', '10:00:00', 'cancelled'),
      row('b', '2026-06-10', '15:00:00', 'cancelled'),
    ];
    const out = sortCancelledBookingsForList(rows);
    expect(out.map((r) => r.id)).toEqual(['b', 'a']);
  });
});
