import { catalogAddonsForService } from '../../../services/utils/catalogAddonsForService';
import {
  baseServiceDurationMinutes,
  totalBookingDurationMinutes,
} from '../../create-appointment/utils/createFlowDuration';
import {
  buildCreateFlowPricingOptions,
  getSelectedCreateFlowPricingOption,
} from '../../create-appointment/utils/createFlowPricing';
import { buildEditBookingUpdatePayload } from '../utils/buildEditBookingUpdatePayload';
import { mapBookingToEditAppointmentForm } from '../utils/mapBookingToEditAppointmentForm';

/**
 * Simulates load → edit hub prefill → save without changing fields.
 * Catches regressions where prefill and payload builders disagree on formats.
 */
describe('edit appointment save round-trip', () => {
  const catalog = {
    services: [{ id: 'svc-1', name: 'Signature Shine', isEnabled: true }],
    serviceRows: [
      {
        id: 'svc-1',
        price_cents: 12000,
        duration_minutes: 120,
        price_options_enabled: false,
      },
    ],
    addons: [{ id: 'addon-a', name: 'Pet hair removal', priceLabel: '$15' }],
    addonAssignments: [{ service_id: 'svc-1', addon_id: 'addon-a' }],
  };

  const shopAddressForm = {
    street: '100 Shop Way',
    unit: '',
    city: 'Miami',
    state: 'FL',
    zip: '33101',
  };

  const booking = {
    service_id: 'svc-1',
    service_name: 'Signature Shine',
    service_price_cents: 12000,
    scheduled_date: '2026-05-20',
    start_time: '14:30:00',
    addon_details: {
      addons: [{ id: 'addon-a', name: 'Pet hair removal', priceCents: 1500 }],
    },
    customer_name: 'Alex Rivera',
    customer_email: 'alex@example.com',
    customer_phone: '3054441212',
    customer_street_address: '12 Ocean Dr',
    customer_city: 'Miami Beach',
    customer_state: 'FL',
    customer_zip: '33139',
    customer_vehicle_year: 2020,
    customer_vehicle_make: 'Honda',
    customer_vehicle_model: 'Civic',
    customer_notes: 'Side gate',
  };

  it('rebuilds the same bookings columns after prefill', () => {
    const form = mapBookingToEditAppointmentForm({
      booking,
      catalog,
      ownerHasPro: false,
      priceOptionRows: [],
      shopAddressForm,
      businessServiceMode: 'both',
    });

    expect(form).not.toBeNull();

    const selectedService =
      catalog.services.find((s) => String(s.id) === String(form.selectedServiceId)) ?? null;
    const serviceRow =
      catalog.serviceRows.find((r) => String(r.id) === String(form.selectedServiceId)) ?? null;
    const pricingPayload = buildCreateFlowPricingOptions(serviceRow, [], false);
    const selectedPricingOption = getSelectedCreateFlowPricingOption(
      pricingPayload.options,
      form.selectedPricingId,
    );
    const addonRows = catalogAddonsForService(
      form.selectedServiceId,
      catalog.addons,
      catalog.addonAssignments,
    ).filter((a) => form.selectedAddonIds.includes(String(a.id)));
    const totalDurationMinutes = totalBookingDurationMinutes(
      baseServiceDurationMinutes(serviceRow, selectedPricingOption, selectedService),
      addonRows,
    );

    const payload = buildEditBookingUpdatePayload({
      selectedService,
      selectedServiceId: form.selectedServiceId,
      selectedPricingOption,
      selectedAddonRows: addonRows,
      totalDurationMinutes,
      selectedDateKey: form.selectedDateKey,
      selectedTime: form.selectedTime,
      customer: form.customer,
      address: form.address,
      vehicle: form.vehicle,
      notes: form.notes,
      appointmentLocationType: form.appointmentLocationType,
    });

    expect(payload).toMatchObject({
      scheduled_date: '2026-05-20',
      start_time: '14:30:00',
      service_id: 'svc-1',
      service_name: 'Signature Shine',
      service_price_cents: 12000,
      customer_name: 'Alex Rivera',
      customer_email: 'alex@example.com',
      customer_phone: '3054441212',
      customer_street_address: '12 Ocean Dr',
      customer_city: 'Miami Beach',
      customer_state: 'FL',
      customer_zip: '33139',
      customer_vehicle_year: '2020',
      customer_vehicle_make: 'Honda',
      customer_vehicle_model: 'Civic',
      customer_notes: 'Side gate',
      service_location_type: 'mobile',
    });
    expect(payload.addon_details.addons).toHaveLength(1);
    expect(payload.addon_details.addons[0].id).toBe('addon-a');
  });
});
