import {
  filterPastConfirmedRows,
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
    const rows = [
      row('a', '2026-06-01', '10:00:00'),
      row('b', '2026-06-10', '15:00:00'),
    ];
    const out = filterPastConfirmedRows(rows, nowMs);
    expect(out.map((r) => r.id)).toEqual(['b', 'a']);
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
