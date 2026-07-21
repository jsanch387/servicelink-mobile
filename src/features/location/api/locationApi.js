import { supabase } from '../../../lib/supabase';

/**
 * Check if user has provided location information
 * @param {string} userId - The user's profile ID
 * @returns {Promise<{ hasLocation: boolean, data: { city: string | null, state: string | null, radius: number | null } | null, error: Error | null }>}
 */
export async function checkUserLocationStatus(userId) {
  if (!userId) {
    return { hasLocation: false, data: null, error: new Error('Not signed in') };
  }

  try {
    const { data, error } = await supabase
      .from('business_profiles')
      .select('service_area, service_radius')
      .eq('profile_id', userId)
      .maybeSingle();

    if (error) {
      return { hasLocation: false, data: null, error: new Error(error.message) };
    }

    if (!data) {
      return { hasLocation: false, data: null, error: null };
    }

    const serviceArea = data.service_area ?? null;
    const serviceRadius = data.service_radius ?? null;

    // Parse service_area (format: "City, ST")
    let city = null;
    let state = null;

    if (serviceArea) {
      const parts = serviceArea.split(',').map((p) => p.trim());
      if (parts.length >= 2) {
        city = parts[0];
        state = parts[1];
      }
    }

    const hasLocation = Boolean(city && state && serviceRadius);

    return {
      hasLocation,
      data: {
        city,
        state,
        radius: serviceRadius,
      },
      error: null,
    };
  } catch (err) {
    return {
      hasLocation: false,
      data: null,
      error: err instanceof Error ? err : new Error('Failed to check location'),
    };
  }
}

/**
 * Save user location information
 * @param {string} userId - The user's profile ID
 * @param {{ location: string, city: string, state: string, radius: number }} locationData
 * @returns {Promise<{ ok: boolean, error: Error | null }>}
 */
export async function saveUserLocation(userId, locationData) {
  if (!userId) {
    return { ok: false, error: new Error('Not signed in') };
  }

  if (!locationData?.city || !locationData?.state || !locationData?.radius) {
    return { ok: false, error: new Error('Invalid location data') };
  }

  // Use the formatted location string, or build from city/state
  const serviceArea = locationData.location || `${locationData.city}, ${locationData.state}`;

  try {
    const { error } = await supabase
      .from('business_profiles')
      .update({
        service_area: serviceArea,
        service_radius: locationData.radius,
        updated_at: new Date().toISOString(),
      })
      .eq('profile_id', userId);

    if (error) {
      return { ok: false, error: new Error(error.message) };
    }

    return { ok: true, error: null };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err : new Error('Failed to save location'),
    };
  }
}

// Note: We don't persist dismiss state anymore
// Users can dismiss the modal, but it will show again next time they open the app
// The only way to stop seeing it is to save location data
// Future: May make it completely undismissable
