import { insertOwnerBooking } from '../api/insertOwnerBooking';

jest.mock('../../../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock('../api/upsertCustomerForBooking', () => ({
  upsertCustomerForBooking: jest.fn(),
}));

import { supabase } from '../../../../lib/supabase';
import { upsertCustomerForBooking } from '../api/upsertCustomerForBooking';

describe('insertOwnerBooking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    upsertCustomerForBooking.mockResolvedValue({ data: { id: 'cust-uuid' }, error: null });

    const maybeSingle = jest.fn().mockResolvedValue({ data: { id: 'book-uuid' }, error: null });
    const select = jest.fn(() => ({ maybeSingle }));
    const insert = jest.fn(() => ({ select }));
    supabase.from.mockReturnValue({ insert });
  });

  it('upserts customer then inserts booking with customer_id', async () => {
    const payload = {
      businessId: 'biz-1',
      businessSlug: 'slug',
      serviceId: 'svc',
      serviceName: 'Wash',
      servicePriceCents: 5000,
      addonDetails: null,
      durationMinutes: 60,
      scheduledDate: '2026-01-15',
      startTimeHhMmSs: '10:00:00',
      customerName: 'Pat',
      customerEmail: 'p@ex.co',
      customerPhoneDigits: '5551234567',
      street: '1 Main',
      unit: '',
      city: 'Austin',
      state: 'TX',
      zip: '78701',
      vehicleYear: '2021',
      vehicleMake: 'Ford',
      vehicleModel: 'F-150',
      customerNotes: null,
    };

    const { data, error } = await insertOwnerBooking(payload);

    expect(upsertCustomerForBooking).toHaveBeenCalledWith('biz-1', {
      fullName: 'Pat',
      email: 'p@ex.co',
      phone: '5551234567',
    });

    expect(supabase.from).toHaveBeenCalledWith('bookings');
    const bookingInsert = supabase.from().insert;
    expect(bookingInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        business_id: 'biz-1',
        business_slug: 'slug',
        customer_id: 'cust-uuid',
        service_name: 'Wash',
        customer_email: 'p@ex.co',
        customer_notes: null,
      }),
    );

    expect(error).toBeNull();
    expect(data).toEqual({ id: 'book-uuid' });
  });

  it('returns error when customer upsert fails', async () => {
    upsertCustomerForBooking.mockResolvedValue({
      data: null,
      error: new Error('CRM blocked'),
    });

    const { data, error } = await insertOwnerBooking({
      businessId: 'b',
      serviceName: 'S',
      servicePriceCents: 0,
      durationMinutes: 30,
      scheduledDate: '2026-01-01',
      startTimeHhMmSs: '09:00:00',
      customerName: 'x',
      customerEmail: 'x@y.co',
      customerPhoneDigits: '5551112222',
      street: 'a',
      unit: '',
      city: 'c',
      state: 'TX',
      zip: '1',
      vehicleYear: '1',
      vehicleMake: 'm',
      vehicleModel: 'o',
    });

    expect(data).toBeNull();
    expect(error?.message).toBe('CRM blocked');
    expect(supabase.from).not.toHaveBeenCalled();
  });
});
