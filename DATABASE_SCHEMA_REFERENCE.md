# ServiceLink Database Schema Reference

This file documents the Supabase/Postgres schema shared by the product team for app development reference.

It is a **read-only reference** for implementation alignment and should not be executed as a migration.

## Primary App Tables

### `business_profiles`
- `id` (PK)
- `profile_id` (FK -> `profiles.user_id`)
- `business_name` (text, required)
- `business_slug` (text, unique)
- `profile_views` (integer)
- contact/branding fields (`phone_number_call`, `phone_number_text`, `logo_path`, `banner_path`)

### `bookings`
- `id` (PK)
- `business_id` (FK -> `business_profiles.id`)
- scheduling: `scheduled_date`, `start_time`, `duration_minutes`
- service: `service_id`, `service_name`, `service_price_cents`
- customer core: `customer_name`, `customer_email`, `customer_phone`
- customer address: `customer_street_address`, `customer_unit_apt`, `customer_city`, `customer_state`, `customer_zip`
- vehicle fields (important for mobile cards):
  - `customer_vehicle_year`
  - `customer_vehicle_make`
  - `customer_vehicle_model`
- `status` in `confirmed | completed | cancelled`

### `booking_requests`
- lead/request intake table before confirmation
- vehicle fields:
  - `customer_vehicle_year`
  - `customer_vehicle_make`
  - `customer_vehicle_model`
- `status` in `pending | approved | declined | cancelled`

### `business_services`
- service catalog per business
- includes price and duration (`price_cents`, `duration_minutes`)

### `customers`
- customer CRM table (`full_name`, `phone`, `email`, `notes`)

## Payments

### `payment_accounts`
- per-business connected Stripe account
- onboarding and capability flags (`charges_enabled`, `payouts_enabled`)

### `payment_settings`
- per-business checkout/deposit behavior
- includes `payments_enabled`, `deposit_type`, `deposit_value`

## Quotes

### `quotes`
- supports pricing, schedule proposal, and status lifecycle
- includes vehicle fields (`vehicle_year`, `vehicle_make`, `vehicle_model`)

### `quote_public_links`
- tokenized public link records for quote response flow

## Add-ons / Service Options

### `service_addons`
### `service_addon_assignments`
### `service_price_options`

These support optional add-ons and multi-price-tier service configurations.

## Other Supporting Tables

- `business_availability`
- `business_images`
- `notifications`
- `profiles`
- `stripe_webhook_events`

## Notes For Mobile Development

- Prefer `business_profiles.business_name` for display names (not slug-derived text).
- For booking vehicle UI, use:
  - `bookings.customer_vehicle_year`
  - `bookings.customer_vehicle_make`
  - `bookings.customer_vehicle_model`
- Booking `status` values used by UI should align to:
  - `confirmed`
  - `completed`
  - `cancelled`
