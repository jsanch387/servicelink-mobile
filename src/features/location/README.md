# Location Collection Feature

## Overview

The Location Collection feature enables the app to collect service location information from business owners when they first open the app. This is a critical step toward building the detailing marketplace that will connect customers with nearby detailers.

## Purpose

This feature collects three key pieces of information:
1. **City** - Where the business is based
2. **State** - The state where the business operates
3. **Service Radius** - How far (in miles) the business travels to service customers

This information will be used to:
- Match customers with detailers in their area
- Show businesses in local search results
- Help detailers get more bookings from nearby customers

## User Experience

### When the Modal Shows
The location collection modal automatically appears when:
- User has successfully completed onboarding
- User hasn't provided their service location yet
- User hasn't previously dismissed the prompt

The modal appears ~800ms after the main app loads, giving the user time to orient themselves.

### Modal Content
- **Clear value proposition**: Explains why we need location (to connect them with customers)
- **Benefits highlighted**: 
  - Get matched with nearby customers
  - Show up in local searches
  - Fill schedule faster
- **Simple form**: City, State (2-letter), and Radius dropdown
- **Two actions**: 
  - "Save location" (primary CTA)
  - "I'll do this later" (dismisses permanently)

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
```

### Key Components

#### 1. LocationPromptProvider (`context/LocationPromptContext.jsx`)
- Manages location prompt state globally
- Checks if user needs to see the prompt on mount
- Provides handlers for saving location and dismissing
- Auto-shows modal after 800ms delay if needed

#### 2. LocationCollectionModal (`components/LocationCollectionModal.jsx`)
- Styled modal matching app's design system
- Form with city, state, and radius fields
- Save and dismiss actions
- Responsive and accessible

#### 3. Location API (`api/locationApi.js`)
Four main functions:
- `checkUserLocationStatus()` - Check if user has provided location
- `saveUserLocation()` - Save location data to database
- `checkLocationPromptDismissed()` - Check if prompt was dismissed
- `markLocationPromptDismissed()` - Mark prompt as dismissed

### Database Schema

#### business_profiles
- `service_area` (existing) - Stores "City, ST" format (e.g., "Austin, TX")
- `service_radius` (new) - Integer, miles the business travels

#### profiles  
- `location_prompt_dismissed` (new) - Boolean, tracks if user dismissed prompt

See `docs/DATABASE_SCHEMA.md` for full details.

## Integration Points

### App Entry Point
The `LocationPromptProvider` is added to the provider tree in `App.js`, wrapping the navigator but inside the auth/onboarding gates. This ensures:
- It only runs for authenticated users
- It doesn't interfere with onboarding
- It has access to user context

### Main Tab Navigator
The `LocationCollectionModal` is rendered in `MainTabNavigator.jsx` so it:
- Appears above all tab content
- Is visible as soon as the main app loads
- Doesn't block navigation if dismissed

## Future Enhancements

### Phase 2: Marketplace Integration
- Geocoding: Convert city/state to lat/lng for accurate distance calculations
- Search radius: Allow customers to search for detailers within X miles
- Distance calculations: Use PostGIS or similar for geo queries
- Service area display: Show detailers' service areas on maps

### Phase 3: Smart Location
- Auto-detect location from device GPS (with permission)
- Multiple service areas for businesses that cover multiple cities
- Adjust radius based on service type (mobile needs radius, shop doesn't)

### Phase 4: Re-prompting
- Allow re-prompting users who skipped (e.g., after 30 days)
- In-app settings to update location later
- Banner/reminder for users who dismissed but haven't set location

## Testing Considerations

### Manual Testing Checklist
- [ ] Modal appears on first app launch after onboarding
- [ ] Form validates (requires city, state, radius)
- [ ] Save button disabled when fields empty
- [ ] State field converts to uppercase
- [ ] Save successfully stores data to database
- [ ] Modal doesn't reappear after saving
- [ ] Dismiss prevents modal from showing again
- [ ] Modal doesn't show if location already set
- [ ] Modal respects dark/light theme

### Edge Cases
- User closes app while modal is open (should reappear next launch)
- Network error during save (should show error, allow retry)
- User changes location later (would need Settings UI - future)

## Files Created

```
src/features/location/
├── README.md (this file)
├── index.js (exports)
├── components/
│   └── LocationCollectionModal.jsx
├── context/
│   └── LocationPromptContext.jsx
├── api/
│   └── locationApi.js
├── docs/
│   └── DATABASE_SCHEMA.md
└── migrations/
    └── 001_add_location_fields.sql
```

## Related Features

- **Booking Link** (`src/features/bookingLink/`) - Already collects service_area in Edit mode
- **Onboarding** (`src/features/onboarding/`) - Location prompt appears after onboarding
- **Business Profiles** - Location data stored in `business_profiles` table

## Notes

- Location collection is **not mandatory** - users can dismiss and continue using the app
- We track dismissal to avoid annoying users with repeated prompts
- The feature is built to be extended later with marketplace functionality
- No external location library integrated yet (as requested)
- Database migration must be run before deploying this feature
