import { supabase } from '../../../lib/supabase';
import { MAINTENANCE_ENROLLMENT_PENDING_STATUS } from '../utils/maintenanceEnrollmentUtils';

/**
 * Hard-deletes a pending maintenance enrollment. Confirmed rows are not matched
 * (`.eq('status', pending)`), so paid/accepted enrollments stay in the database.
 *
 * @param {string} businessId
 * @param {string} customerId
 * @param {string} enrollmentId
 * @returns {Promise<{ deleted: boolean; error: Error | null }>}
 */
export async function deleteMaintenanceEnrollmentForBusiness(businessId, customerId, enrollmentId) {
  const bizId = String(businessId ?? '').trim();
  const custId = String(customerId ?? '').trim();
  const id = String(enrollmentId ?? '').trim();

  if (!bizId || !custId || !id) {
    return { deleted: false, error: new Error('Missing maintenance detail context') };
  }

  const { data, error } = await supabase
    .from('maintenance_enrollments')
    .delete()
    .eq('business_id', bizId)
    .eq('customer_id', custId)
    .eq('id', id)
    .eq('status', MAINTENANCE_ENROLLMENT_PENDING_STATUS)
    .select('id');

  if (error) {
    return { deleted: false, error };
  }

  const deleted = Array.isArray(data) && data.length > 0;
  return {
    deleted,
    error: deleted
      ? null
      : new Error(
          'This maintenance detail could not be removed. It may already be confirmed, or you may not have permission.',
        ),
  };
}
