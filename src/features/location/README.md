# Location Collection Feature

## Overview

The Location Collection feature enables the app to collect service location information from business owners when they first open the app. This is a critical step toward building the detailing marketplace that will connect customers with nearby detailers.

## Purpose

This feature collects two key pieces of information:
1. **Location** - Where the business is based (city and state via single autocomplete input)
2. **Service Radius** - How far (in miles) the business travels to service customers

This information will be used to:
- Match customers with detailers in their area
- Show businesses in local search results
- Help detailers get more bookings from nearby customers

## User Experience

### When the Modal Shows
The location collection modal automatically appears when:
- User is authenticated (logged in)
- User hasn't saved location data yet (no service_area + service_radius)

**Important behavior:**
- "I'll do this later" button just closes the modal temporarily
- Modal will appear again next time user opens the app
- **Only way to stop seeing it: save location data**
- This encourages users to provide their location (critical for marketplace)
- Future: may make it completely undismissable

The modal appears ~800ms after the main app loads, giving the user time to orient themselves.

### Modal Content
- **Clear value proposition**: Explains why we need location (to connect them with customers)
- **Benefits as bullets**: 
  - Get matched with nearby customers looking for detailing
  - Show up in local searches so customers can find you
  - Fill your schedule faster with bookings from your area
- **Simple form**: 
  - Single location input field (will support autocomplete when location service is integrated)
  - Service radius selector (up to 5-200 miles)
  - Helper text explaining what radius means
- **Two actions**: 
  - "Save location" (primary CTA)
  - "I'll do this later" (secondary, dismisses permanently)

### Business Type Considerations
The location collection is designed with the booking link service types in mind:
- **Mobile detailers**: Need location + radius (they travel to customers)
- **Shop-only businesses**: Have a shop address in booking settings (set separately)
- **Both (mobile + shop)**: Need both shop address and service area

Currently, we collect location/radius for all users. Later, when implementing the marketplace, we'll use the `service_location_mode` field to determine how to use the location data.

## Technical Implementation

### Architecture

```
App.js
└── LocationPromptProvider (Context)
    └── MainTabNavigator
        └── LocationCollectionModal (Component)
            └── [Future: LocationAutocompleteInput with service integration]
```

**Design Pattern**: Uses the same announcement modal pattern as `WhatsNewModal` from the app updates feature, ensuring consistency across the app.

### Key Components

#### 1. LocationPromptProvider (`context/LocationPromptContext.jsx`)
- Manages location prompt state globally
- Checks if user has saved location data (service_area + service_radius)
- If no location data → shows modal every time app opens
- Dismiss button just closes modal temporarily (shows again next time)
- Provides handlers for saving location and dismissing
- Auto-shows modal after 800ms delay if needed

#### 2. LocationCollectionModal (`components/LocationCollectionModal.jsx`)
- Uses WhatsNewModal announcement pattern for consistency
- Animated entrance (fade + scale spring)
- Single location input field (prepared for autocomplete integration)
- Service radius dropdown selector
- Save and dismiss actions
- Currently parses manual input ("City, ST" format)
- Ready to integrate with location autocomplete service

#### 3. Location API (`api/locationApi.js`)
Four main functions:
- `checkUserLocationStatus()` - Check if user has provided location
- `saveUserLocation()` - Save location data to database
- `checkLocationPromptDismissed()` - Check if prompt was dismissed
- `markLocationPromptDismissed()` - Mark prompt as dismissed

#### 4. Location Autocomplete Service (`services/locationAutocomplete.js`)
**Status**: Placeholder for future integration

This module is structured to accept a location service API (e.g., Google Places, Mapbox) when ready:
- `searchLocations(query)` - Search for location suggestions
- `formatLocationDisplay(result)` - Format location for display
- `parseLocationResult(result)` - Parse into city/state/country

Currently returns empty array (manual entry only). Modal UI is ready for autocomplete dropdown when service is integrated.

### Database Schema

#### business_profiles
- `service_area` (existing) - Stores "City, ST" format (e.g., "Austin, TX")
- `service_radius` (new) - Integer, miles the business travels

#### profiles  
- `location_prompt_dismissed` (new) - Boolean, tracks if user dismissed prompt

See `docs/DATABASE_SCHEMA.md` for full details.

## Integration Points

### App Entry Point
The `LocationPromptProvider` is added to the provider tree in `App.js`, wrapping the navigator but inside the auth gates. This ensures:
- It only runs for authenticated users
- Works completely independently of onboarding status
- Shows for any authenticated user who hasn't provided location
- It has access to user context

Note: Onboarding happens on web only. Mobile users come to the app already onboarded, so the location prompt isn't tied to onboarding at all.

### Main Tab Navigator
The `LocationCollectionModal` is rendered in `MainTabNavigator.jsx` so it:
- Appears above all tab content
- Is visible as soon as the main app loads
- Doesn't block navigation if dismissed

## Future Enhancements

### Phase 1.5: Location Autocomplete Service
- Integrate with location API (Google Places, Mapbox, or similar)
- Add autocomplete dropdown to location input field
- Auto-populate city, state from selected result
- Add debounced search (300-500ms)
- Handle edge cases (network errors, no results, etc.)
- Optionally store lat/lng for accurate distance calculations

### Phase 2: Marketplace Integration
- Geocoding: Convert city/state to lat/lng for accurate distance calculations
- Search radius: Allow customers to search for detailers within X miles
- Distance calculations: Use PostGIS or similar for geo queries
- Service area display: Show detailers' service areas on maps

### Phase 3: Enhanced Location Features
- Auto-detect location from device GPS (with permission)
- "Use my current location" button
- Multiple service areas for businesses that cover multiple cities
- Adjust radius based on service type (mobile needs radius, shop doesn't)
- Location validation (ensure business location is valid)

### Phase 4: Re-prompting
- Allow re-prompting users who skipped (e.g., after 30 days)
- In-app settings to update location later
- Banner/reminder for users who dismissed but haven't set location

## Testing Considerations

### Manual Testing Checklist
- [ ] Modal appears on first app launch after onboarding with animated entrance
- [ ] Form validates (requires location text and radius)
- [ ] Save button disabled when location field is empty
- [ ] Manual input "Austin, TX" correctly parses to city="Austin", state="TX"
- [ ] Save successfully stores data to database
- [ ] Modal doesn't reappear after saving
- [ ] Dismiss prevents modal from showing again
- [ ] Modal doesn't show if location already set
- [ ] Modal matches WhatsNewModal styling and animation
- [ ] Modal respects dark/light theme

### Edge Cases
- User closes app while modal is open (reappears next launch - no data saved)
- Network error during save (shows error, allow retry)
- User enters invalid format (currently accepts any text, validation happens server-side)
- User enters only city without state (saves city, state empty - acceptable for now)
- User dismisses without saving (modal shows again next time - persistent until data saved)
- User changes location later (would need Settings UI - future)
- Typos in manual entry (why autocomplete service is needed!)

## Files Created

```
src/features/location/
├── README.md (this file)
├── index.js (exports)
├── components/
│   └── LocationCollectionModal.jsx (announcement pattern modal)
├── context/
│   └── LocationPromptContext.jsx (state management)
├── api/
│   └── locationApi.js (database operations)
├── services/
│   └── locationAutocomplete.js (placeholder for future location service)
├── docs/
│   └── DATABASE_SCHEMA.md (schema documentation)
└── migrations/
    └── 001_add_location_fields.sql (database migration)
```

## Related Features

- **Booking Link** (`src/features/bookingLink/`) - Already collects service_area in Edit mode
- **Onboarding** (`src/features/onboarding/`) - Location prompt appears after onboarding
- **Business Profiles** - Location data stored in `business_profiles` table

## Notes

- Location collection is **not mandatory** - users can dismiss and continue using the app
- We track dismissal to avoid annoying users with repeated prompts
- The feature is built to be extended later with marketplace functionality
- **Single input field** prevents typos that would occur with separate city/state fields
- **Location service integration ready**: Just plug in the API when available
- Uses the same **announcement modal pattern** as other app features for consistency
- No external location library integrated yet - UI is ready for when it's added
- Database migration must be run before deploying this feature
