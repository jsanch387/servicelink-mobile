jest.mock('../../../../lib/supabase', () => ({
  supabase: { from: jest.fn() },
}));

jest.mock('../../edit-appointment/api/updateBookingById', () => ({
  updateBookingById: jest.fn(),
}));

import { supabase } from '../../../../lib/supabase';
import { updateBookingCustomerEmail } from '../api/updateBookingCustomerEmail';
import { updateBookingById } from '../../edit-appointment/api/updateBookingById';

function mockSelectChain(result) {
  const maybeSingle = jest.fn().mockResolvedValue(result);
  const neq = jest.fn(() => ({ maybeSingle }));
  const secondEq = jest.fn(() => ({ neq, maybeSingle }));
  const firstEq = jest.fn(() => ({ eq: secondEq, neq, maybeSingle }));
  const select = jest.fn(() => ({ eq: firstEq, neq, maybeSingle }));
  return { select, firstEq, secondEq, neq, maybeSingle };
}

function mockUpdateChain(result) {
  const maybeSingle = jest.fn().mockResolvedValue(result);
  const select = jest.fn(() => ({ maybeSingle }));
  const secondEq = jest.fn(() => ({ select }));
  const firstEq = jest.fn(() => ({ eq: secondEq, select }));
  const update = jest.fn(() => ({ eq: firstEq }));
  return { update, firstEq, secondEq, select, maybeSingle };
}

describe('updateBookingCustomerEmail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates booking customer_email', async () => {
    updateBookingById.mockResolvedValue({ data: { id: 'book-1' }, error: null });

    const { data, error } = await updateBookingCustomerEmail('book-1', 'jane@example.com');

    expect(error).toBeNull();
    expect(data).toEqual({ id: 'book-1' });
    expect(updateBookingById).toHaveBeenCalledWith(
      'book-1',
      { customer_email: 'jane@example.com' },
      undefined,
    );
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('updates linked CRM customer when email is not owned elsewhere', async () => {
    updateBookingById.mockResolvedValue({ data: { id: 'book-1' }, error: null });
    const lookupChain = mockSelectChain({ data: null, error: null });
    const updateChain = mockUpdateChain({ data: { id: 'cust-1' }, error: null });

    supabase.from
      .mockReturnValueOnce({ select: lookupChain.select })
      .mockReturnValueOnce({ update: updateChain.update });

    const { error } = await updateBookingCustomerEmail('book-1', 'Jane@Example.com', {
      businessId: 'biz-1',
      customerId: 'cust-1',
    });

    expect(error).toBeNull();
    expect(updateBookingById).toHaveBeenCalledWith(
      'book-1',
      { customer_email: 'Jane@Example.com' },
      'biz-1',
    );
    expect(supabase.from).toHaveBeenNthCalledWith(1, 'customers');
    expect(supabase.from).toHaveBeenNthCalledWith(2, 'customers');
    expect(updateChain.update).toHaveBeenCalledWith({
      email: 'Jane@Example.com',
      email_normalized: 'jane@example.com',
    });
  });

  it('succeeds when email is already owned by another CRM customer', async () => {
    updateBookingById.mockResolvedValue({ data: { id: 'book-1' }, error: null });
    const lookupChain = mockSelectChain({ data: { id: 'other-cust' }, error: null });
    supabase.from.mockReturnValueOnce({ select: lookupChain.select });

    const { data, error } = await updateBookingCustomerEmail('book-1', 'jane@example.com', {
      businessId: 'biz-1',
      customerId: 'cust-1',
    });

    expect(error).toBeNull();
    expect(data).toEqual({ id: 'book-1' });
    expect(supabase.from).toHaveBeenCalledTimes(1);
  });

  it('succeeds when CRM update hits unique constraint', async () => {
    updateBookingById.mockResolvedValue({ data: { id: 'book-1' }, error: null });
    const lookupChain = mockSelectChain({ data: null, error: null });
    const updateChain = mockUpdateChain({
      data: null,
      error: {
        code: '23505',
        message:
          'duplicate key value violates unique constraint customer_business_email_normalized_unique',
      },
    });

    supabase.from
      .mockReturnValueOnce({ select: lookupChain.select })
      .mockReturnValueOnce({ update: updateChain.update });

    const { data, error } = await updateBookingCustomerEmail('book-1', 'jane@example.com', {
      businessId: 'biz-1',
      customerId: 'cust-1',
    });

    expect(error).toBeNull();
    expect(data).toEqual({ id: 'book-1' });
  });

  it('passes through booking update errors', async () => {
    updateBookingById.mockResolvedValue({ data: null, error: { message: 'RLS denied' } });

    const { error } = await updateBookingCustomerEmail('book-1', 'jane@example.com');

    expect(error?.message).toBe('RLS denied');
    expect(supabase.from).not.toHaveBeenCalled();
  });
});
