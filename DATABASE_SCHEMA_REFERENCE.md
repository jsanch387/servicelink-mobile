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

### `service_price_options`

Per-service pricing tiers (e.g. Truck vs SUV). **Human-readable tier title is `label` (not `name`).**

- `id` (uuid, PK, default `gen_random_uuid()`)
- `service_id` (uuid, FK → `business_services.id`, on delete CASCADE)
- `business_id` (uuid, FK → `business_profiles.id`, on delete CASCADE) — synced from `service_id` via trigger `trg_service_price_options_sync_business`
- `label` (text, NOT NULL, trimmed length 1–80)
- `price_cents` (integer, NOT NULL, ≥ 0)
- `duration_minutes` (integer, NOT NULL, **CHECK `> 0`**)
- `sort_order` (integer, NOT NULL, default 0, ≥ 0)
- `is_active` (boolean, NOT NULL, default true)
- `created_at`, `updated_at` (timestamptz, NOT NULL; `updated_at` maintained by `trg_service_price_options_updated_at`)

Indexes (examples): `(service_id, sort_order)`, `(business_id)`, partial `(service_id) WHERE is_active = true`.

### `service_addons`

Business-wide add-on catalog (not tied to a single service until assigned).

- `id` (uuid, PK)
- `business_id` (uuid, FK → `business_profiles.id`, on delete CASCADE)
- `name` (text, NOT NULL)
- `price_cents` (integer, NOT NULL, default 0)
- `duration_minutes` (integer, **nullable** — extra time optional)
- `created_at`, `updated_at` (timestamptz)

### `service_addon_assignments`

Maps which add-ons apply to which service. **Composite PK only; there is no `business_id` column.**

- `service_id` (uuid, FK → `business_services.id`, on delete CASCADE)
- `addon_id` (uuid, FK → `service_addons.id`, on delete CASCADE)
- `created_at` (timestamptz, NOT NULL)
- Primary key: `(service_id, addon_id)`

## Other Supporting Tables

- `business_availability` (detailed contract below)
- `business_images`
- `notifications`
- `profiles`
- `stripe_webhook_events`

### `business_availability`

Single row per business controlling booking availability behavior and time-off blocks.

- `id` (uuid, PK, default `gen_random_uuid()`)
- `business_id` (uuid, FK -> `business_profiles.id`, `ON DELETE CASCADE`, UNIQUE)
- `accept_bookings` (boolean, NOT NULL, default `false`)
- `minimum_notice` (text, NOT NULL, default `none`)
  - check constraint: one of `none | 1h | 2h | 4h | 24h`
- `weekly_schedule` (jsonb, NOT NULL)
  - default schedule includes:
    - weekdays enabled with `09:00` -> `17:00`
    - saturday/sunday disabled with `09:00` -> `17:00`
  - shape by day key, e.g.:
    - `monday: { start: "09:00", end: "17:00", enabled: true }`
- `selected_preset` (text, NOT NULL, default `mon_fri_9_5`)
  - check constraint: one of
    - `mon_fri_9_5`
    - `mon_sat_8_6`
    - `weekends_only`
    - `custom`
- `time_off_blocks` (jsonb, NOT NULL, default `[]`)
  - check constraint: must be a JSON array
- `created_at` (timestamptz, NOT NULL, default `now()`)
- `updated_at` (timestamptz, NOT NULL, default `now()`)

Trigger behavior:

- `trigger_business_availability_updated_at`
  - `BEFORE UPDATE` on `business_availability`
  - executes `set_business_availability_updated_at()`

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
