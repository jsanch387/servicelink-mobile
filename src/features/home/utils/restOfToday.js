function vehicleLabel(row) {
  const parts = [
    row?.customer_vehicle_year,
    row?.customer_vehicle_make?.trim(),
    row?.customer_vehicle_model?.trim(),
  ].filter(Boolean);
  return parts.join(' ');
}

/**
 * Convert bookings rows into UI timeline items.
 *
 * @param {object[] | null | undefined} rows
 * @returns {{ id: string; time: string; title: string; vehicle: string }[]}
 */
export function mapBookingsToRestOfTodayItems(rows) {
  return (rows ?? []).map((row) => {
    const time = new Date(`${row.scheduled_date}T${row.start_time}`)
      .toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    return {
      id: row.id,
      time,
      title: row.service_name?.trim() || 'Service',
      vehicle: vehicleLabel(row),
    };
  });
}
