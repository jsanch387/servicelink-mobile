import {
  appointmentDayFillOpacity,
  resolveAppointmentMarkerLayout,
} from '../AppointmentCountMarkers';

describe('resolveAppointmentMarkerLayout', () => {
  it('returns no markers for zero', () => {
    expect(resolveAppointmentMarkerLayout(0)).toEqual({ dotCount: 0, showPlus: false });
  });

  it('uses one dot per appointment up to four', () => {
    expect(resolveAppointmentMarkerLayout(1)).toEqual({ dotCount: 1, showPlus: false });
    expect(resolveAppointmentMarkerLayout(4)).toEqual({ dotCount: 4, showPlus: false });
  });

  it('shows four dots and plus when more than four', () => {
    expect(resolveAppointmentMarkerLayout(5)).toEqual({ dotCount: 4, showPlus: true });
    expect(resolveAppointmentMarkerLayout(12)).toEqual({ dotCount: 4, showPlus: true });
  });
});

describe('appointmentDayFillOpacity', () => {
  it('scales fill with appointment count', () => {
    expect(appointmentDayFillOpacity(0)).toBe(0);
    expect(appointmentDayFillOpacity(1)).toBeGreaterThan(0);
    expect(appointmentDayFillOpacity(4)).toBeGreaterThan(appointmentDayFillOpacity(2));
    expect(appointmentDayFillOpacity(8)).toBe(appointmentDayFillOpacity(5));
  });
});
