-- Migration: Add location collection fields
-- Description: Adds service_radius to business_profiles and location_prompt_dismissed to profiles
-- Date: 2026-07-21

-- Add service_radius to business_profiles table
-- This tracks how far (in miles) a business travels to service customers
ALTER TABLE business_profiles
ADD COLUMN IF NOT EXISTS service_radius INTEGER;

COMMENT ON COLUMN business_profiles.service_radius IS 
  'Service radius in miles - how far the business travels to service customers. Used for marketplace matching.';

-- Add location_prompt_dismissed to profiles table  
-- This tracks whether the user has dismissed the location collection prompt
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS location_prompt_dismissed BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN profiles.location_prompt_dismissed IS 
  'Whether the user has dismissed the location collection prompt. Prevents repeated prompts.';

-- Create index on service_radius for marketplace queries
CREATE INDEX IF NOT EXISTS idx_business_profiles_service_radius 
  ON business_profiles(service_radius) 
  WHERE service_radius IS NOT NULL;

-- Note: service_area column already exists in business_profiles
-- Format: "City, ST" (e.g., "Austin, TX")
-- Used in combination with service_radius for marketplace matching
