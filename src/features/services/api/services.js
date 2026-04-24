import { supabase } from '../../../lib/supabase';

/**
 * Uses broad selects so mobile can keep working as schema evolves.
 * Mapping layer normalizes snake_case/camelCase variants safely.
 */
export async function fetchBusinessServices(businessId) {
  const { data, error } = await supabase
    .from('business_services')
    .select('*')
    .eq('business_id', businessId);

  return { data, error };
}

export async function fetchServiceAddons(businessId) {
  const { data, error } = await supabase
    .from('service_addons')
    .select('*')
    .eq('business_id', businessId);

  return { data, error };
}

/**
 * Optional enrichment only; never block catalog rendering on this call.
 */
export async function fetchAddonAssignmentsByService(businessId) {
  const { data, error } = await supabase
    .from('service_addon_assignments')
    .select('*')
    .eq('business_id', businessId);

  return { data, error };
}
