jest.mock('../../../lib/supabase', () => ({
  supabase: { from: jest.fn() },
}));

import { supabase } from '../../../lib/supabase';
import { deleteMaintenanceEnrollmentForBusiness } from '../api/deleteMaintenanceEnrollmentForBusiness';
import { MAINTENANCE_ENROLLMENT_PENDING_STATUS } from '../utils/maintenanceEnrollmentUtils';

describe('deleteMaintenanceEnrollmentForBusiness', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function mockDeleteChain(result) {
    const select = jest.fn().mockResolvedValue(result);
    const eqStatus = jest.fn(() => ({ select }));
    const eqId = jest.fn(() => ({ eq: eqStatus }));
    const eqCustomer = jest.fn(() => ({ eq: eqId }));
    const eqBusiness = jest.fn(() => ({ eq: eqCustomer }));
    const deleteFn = jest.fn(() => ({ eq: eqBusiness }));
    supabase.from.mockReturnValue({ delete: deleteFn });
    return { deleteFn, eqBusiness, eqCustomer, eqId, eqStatus, select };
  }

  it('deletes only pending enrollment for business + customer', async () => {
    const chain = mockDeleteChain({ data: [{ id: 'e1' }], error: null });

    const { deleted, error } = await deleteMaintenanceEnrollmentForBusiness(
      'biz-1',
      'cust-1',
      'e1',
    );

    expect(error).toBeNull();
    expect(deleted).toBe(true);
    expect(supabase.from).toHaveBeenCalledWith('maintenance_enrollments');
    expect(chain.eqBusiness).toHaveBeenCalledWith('business_id', 'biz-1');
    expect(chain.eqCustomer).toHaveBeenCalledWith('customer_id', 'cust-1');
    expect(chain.eqId).toHaveBeenCalledWith('id', 'e1');
    expect(chain.eqStatus).toHaveBeenCalledWith('status', MAINTENANCE_ENROLLMENT_PENDING_STATUS);
  });

  it('returns error when no row deleted', async () => {
    mockDeleteChain({ data: [], error: null });

    const { deleted, error } = await deleteMaintenanceEnrollmentForBusiness(
      'biz-1',
      'cust-1',
      'e1',
    );

    expect(deleted).toBe(false);
    expect(error?.message).toMatch(/could not be removed/i);
  });

  it('returns supabase error', async () => {
    mockDeleteChain({ data: null, error: { message: 'permission denied', code: '42501' } });

    const { deleted, error } = await deleteMaintenanceEnrollmentForBusiness(
      'biz-1',
      'cust-1',
      'e1',
    );

    expect(deleted).toBe(false);
    expect(error?.message).toBe('permission denied');
  });
});
