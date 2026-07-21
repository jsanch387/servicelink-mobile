# Location Collection Database Schema

## Overview

This document describes the database schema changes required to support the location collection feature for the detailing marketplace.

## Required Database Changes

### business_profiles table

Add a new column to track the service radius (how far a business travels to service customers):

```sql
ALTER TABLE business_profiles
ADD COLUMN IF NOT EXISTS service_radius INTEGER;

COMMENT ON COLUMN business_profiles.service_radius IS 'Service radius in miles - how far the business travels to service customers';
```

**Notes:**
- The `service_area` column already exists and stores location as "City, ST" format
- The new `service_radius` column stores the radius in miles as an integer
- This will be used for marketplace matching to connect customers with nearby detailers
- **No dismiss tracking**: Modal shows every time until user saves data (encourages completion)

## Data Flow

### Location Check
1. App checks `business_profiles.service_area` and `business_profiles.service_radius`
2. App checks `profiles.location_prompt_dismissed`
3. If location is incomplete AND prompt not dismissed → show modal

### Location Save
1. User enters location and radius in modal
2. App saves to `business_profiles`:
   - `service_area` = "City, ST" (e.g., "Austin, TX")
   - `service_radius` = miles (e.g., 15)
   - `updated_at` = current timestamp
3. Modal stops showing after successful save

### Prompt Dismiss
1. User clicks "I'll do this later"
2. Modal closes (no database write)
3. **Modal will show again next time user opens app**
4. Only way to stop seeing it: save location data
5. Future: May make completely undismissable

## Future Considerations

### Marketplace Matching Algorithm
When implementing the marketplace:
- Use `service_area` to get the business's base location
- Use `service_radius` to determine service boundary
- Match customers within the radius
- Consider implementing PostGIS for accurate distance calculations

### Geocoding
- Currently storing city/state as text
- Future: Consider geocoding to lat/lng for more accurate distance calculations
- Could add `latitude` and `longitude` columns to `business_profiles`

### Service Types
- Mobile detailers need location + radius
- Shop-only businesses need shop address but not radius
- "Both" type businesses may need special handling
- The `service_location_mode` column (mobile/shop/both) already exists for this

## Migration Checklist

- [ ] Add `service_radius` column to `business_profiles`
- [ ] Update RLS policies if needed
- [ ] Test that existing data isn't affected
- [ ] Verify indexes are in place for location queries
- [ ] Note: No dismiss tracking needed (modal persists until data saved)
