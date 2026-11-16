import { catalogAddonsForService } from '../../../services/utils/catalogAddonsForService';
import {
  baseServiceDurationMinutes,
  totalBookingDurationMinutes,
} from '../../create-appointment/utils/createFlowDuration';
import {
  buildCreateFlowPricingOptions,
  getSelectedCreateFlowPricingOption,
} from '../../create-appointment/utils/createFlowPricing';
import { resolveBookingPaymentTotals } from '../../utils/resolveBookingPaymentTotals';
import { visitGrossCentsFromEditJobs } from '../utils/commitAddedEditJob';
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

describe('edit appointment payment sync after a price change', () => {
  const job = (id, priceCents, addons = []) => ({
    localId: id,
    selectedServiceId: 'svc-1',
    isCustomJob: false,
    serviceName: 'Detail',
    selectedPricingOption: { label: 'Standard', priceCents, durationMinutes: 60 },
    selectedAddonRows: addons,
    totalDurationMinutes: 60,
    vehicle: { year: '2020', make: 'Honda', model: 'Civic' },
  });

  const customer = { fullName: 'Alex', email: '', phone: '5125550101' };
  const address = { street: '1 Main', unit: '', city: 'Austin', state: 'TX', zip: '78701' };

  function totalsForJobs(jobs, { discountCents = 0, taxRateBps = 700, paidOnlineCents = 0 } = {}) {
    const payload = buildEditBookingUpdatePayload({
      selectedService: { name: 'Detail' },
      selectedServiceId: 'svc-1',
      selectedPricingOption: jobs[0].selectedPricingOption,
      selectedAddonRows: jobs[0].selectedAddonRows,
      totalDurationMinutes: 60,
      selectedDateKey: '2026-09-13',
      selectedTime: '9:00 AM',
      customer,
      address,
      vehicle: jobs[0].vehicle,
      notes: '',
      appointmentLocationType: 'shop',
      jobs,
    });
    const visitNetCents = Math.max(0, visitGrossCentsFromEditJobs(jobs) - discountCents);
    return {
      servicePriceCents: payload.service_price_cents,
      payment: resolveBookingPaymentTotals({
        taxableBaseCents: visitNetCents,
        taxRateBps,
        paidOnlineCents,
      }),
    };
  }

  it('writes 7% tax on a $600 visit after a third $300 vehicle is added', () => {
    const saved = totalsForJobs([job('j1', 15000), job('j2', 15000), job('j3', 30000)]);

    expect(saved.servicePriceCents).toBe(60000);
    expect(saved.payment).toEqual({
      taxCents: 4200,
      totalCents: 64200,
      remainingCents: 64200,
    });
  });

  it('lowers tax when a vehicle is removed, a price is overridden, or an add-on changes', () => {
    expect(totalsForJobs([job('j1', 15000), job('j2', 15000)]).payment.taxCents).toBe(2100);

    expect(totalsForJobs([job('j1', 15000), job('j2', 20000)]).payment).toMatchObject({
      taxCents: 2450,
      totalCents: 37450,
    });

    const withAddon = [job('j1', 15000, [{ id: 'wax', name: 'Wax', priceCents: 2500 }])];
    expect(totalsForJobs(withAddon).payment.taxCents).toBe(1225);
    expect(totalsForJobs([job('j1', 15000)]).payment.taxCents).toBe(1050);
  });

  it('taxes the net after a frozen discount and rounds an odd rate', () => {
    expect(totalsForJobs([job('j1', 30000)], { discountCents: 5000 }).payment).toMatchObject({
      taxCents: 1750,
      totalCents: 26750,
      remainingCents: 26750,
    });

    expect(totalsForJobs([job('j1', 15000)], { taxRateBps: 825 }).payment.taxCents).toBe(1238);
    expect(totalsForJobs([job('j1', 333)], { taxRateBps: 700 }).payment.taxCents).toBe(23);

    expect(totalsForJobs([job('j1', 15000)], { taxRateBps: 0 }).payment).toEqual({
      taxCents: 0,
      totalCents: 15000,
      remainingCents: 15000,
    });
  });
});
