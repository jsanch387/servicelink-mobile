-- Migration: Add location collection field
-- Description: Adds service_radius to business_profiles for marketplace matching
-- Date: 2026-07-21

-- Add service_radius to business_profiles table
-- This tracks how far (in miles) a business travels to service customers
ALTER TABLE business_profiles
ADD COLUMN IF NOT EXISTS service_radius INTEGER;

COMMENT ON COLUMN business_profiles.service_radius IS 
  'Service radius in miles - how far the business travels to service customers. Used for marketplace matching.';

-- Create index on service_radius for marketplace queries
CREATE INDEX IF NOT EXISTS idx_business_profiles_service_radius 
  ON business_profiles(service_radius) 
  WHERE service_radius IS NOT NULL;

-- Note: service_area column already exists in business_profiles
-- Format: "City, ST" (e.g., "Austin, TX")
-- Used in combination with service_radius for marketplace matching

-- Note: No dismiss tracking needed
-- Modal shows every time until user saves location data
-- This encourages completion and ensures clean data collection
