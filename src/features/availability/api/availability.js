import { supabase } from '../../../lib/supabase';

export async function fetchBusinessAvailability(businessId) {
  return supabase
    .from('business_availability')
    .select(
      'id, business_id, accept_bookings, minimum_notice, weekly_schedule, selected_preset, time_off_blocks, created_at, updated_at',
    )
    .eq('business_id', businessId)
    .maybeSingle();
}

export async function saveBusinessAvailability({
  businessId,
  acceptBookings,
  selectedPreset,
  weeklySchedule,
  timeOffBlocks = [],
  minimumNotice = 'none',
}) {
  return supabase
    .from('business_availability')
    .upsert(
      {
        business_id: businessId,
        accept_bookings: acceptBookings,
        minimum_notice: minimumNotice,
        weekly_schedule: weeklySchedule,
        selected_preset: selectedPreset,
        time_off_blocks: timeOffBlocks,
      },
      { onConflict: 'business_id' },
    )
    .select(
      'id, business_id, accept_bookings, minimum_notice, weekly_schedule, selected_preset, time_off_blocks, created_at, updated_at',
    )
    .maybeSingle();
}
