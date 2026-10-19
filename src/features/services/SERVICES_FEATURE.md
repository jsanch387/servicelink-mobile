# Services Feature Documentation

This document captures the Services feature behavior, data contract, and mutation rules used by mobile.

## Scope

The feature supports:

- Services catalog list (view/sort/reorder/delete/toggle active)
- Add-ons catalog list (create/edit/delete; optional short description stored for self-booking)
- Service create flow (full-screen form)
- Service edit flow (same layout as create; sticky save; header delete)

## Main Screens

- `src/features/services/screens/ServicesScreen.jsx`
  - Segmented view: `services` / `categories` / `add-ons`
  - Service card actions:
    - Edit service (navigates to `ROUTES.SERVICES_EDIT`)
    - Delete service (confirmation)
    - Toggle active/inactive (instant DB update)
    - Sort mode + drag reorder + save order
  - Add-on card actions:
    - Edit add-on (sheet) — optional description editable here only
    - Delete add-on (confirmation)
  - Add-ons tab list shows name / price / duration only (no description preview)
  - Create service navigates to `ROUTES.SERVICES_CREATE` (free-tier cap still checked first)

- `src/features/services/screens/AddServiceScreen.jsx`
  - Full-screen new service: name, description, price, duration
  - Category picker when categories exist (preselects the catalog tab category when provided)
  - Prices and add-ons as summary rows (counts) that open sheets
  - Sticky **Create service** (hidden while keyboard or a sheet is open)

- `src/features/services/screens/ServiceEditScreen.jsx`
  - Same field layout as create
  - Prices / add-ons sheets; sticky **Save changes**
  - Header trash deletes the service after confirmation

## Supporting UI

- `ServicePriceListSheet` — list + in-sheet add/edit form (no second modal)
- `ServiceAddonPickerSheet` — checklist of catalog add-ons; **Add an add-on** opens `AddonEditorSheet`
- `ServiceHeaderDeleteButton` — red trash in the edit header
- `ServiceCategoryPickerField` — optional category on create/edit

## Data Sources and Tables

From Supabase:

- `business_services`
  - service records per business
  - used for: list, create, delete, active toggle, sort order save, service edit details
- `service_price_options`
  - per-service options/tiers
  - used for: fetch, save edits, delete option
- `service_addons`
  - business-wide add-on catalog
  - columns used: `name`, optional `description` (nullable, max 800), `price_cents`, optional `duration_minutes`
  - used for: list, create, update, delete
  - `description` is for self-booking / web customers; mobile does not surface it outside the editor
- `service_addon_assignments`
  - join table (`service_id`, `addon_id`) with no `business_id`
  - used for: service add-on assignment save/fetch
- `service_categories` + `business_services.category_id`
  - optional browsing groups; one category per service
  - see **`categories/docs/service-categories-database.md`** and `docs/sql/service_categories_migration.sql`

## Service categories (mobile module)

UI lives in `src/features/services/categories/` (components, API, tab utils). Import from `categories/index.js`. Database contract: `categories/docs/service-categories-database.md`.

## Query Keys

Defined in `src/features/services/queryKeys.js`:

- `SERVICES_QUERY_ROOT = ['services']`
- `servicesCatalogQueryKey(businessId)`
- `serviceEditorQueryKey(businessId, serviceId)`

Mutations invalidate these keys plus `homeBusinessProfileQueryKey(userId)` where needed.

## API Layer

`src/features/services/api/services.js` contains all table calls for this feature.

### Service APIs

- `fetchBusinessServices(businessId)`
- `insertBusinessService({ businessId, name, description, priceInput, durationMinutes })`
- `deleteBusinessService({ businessId, serviceId })`
- `updateBusinessServiceActive({ businessId, serviceId, isActive })`
- `saveBusinessServicesSortOrder({ businessId, orderedServiceIds })`
  - update-only strategy per row (`sort_order`, `updated_at`)
  - avoids NOT NULL failures from partial upserts on `business_services`

### Pricing Option APIs

- `fetchServicePriceOptions(businessId)`
- `deleteServicePriceOption({ businessId, serviceId, optionId })`
- save path inside `saveServiceEditorChanges(...)`

### Add-on APIs

- `fetchServiceAddons(businessId)` — `select('*')` (includes `description`)
- `insertServiceAddon({ businessId, name, priceInput, durationMinutes, description })`
  - empty/whitespace `description` stored as `NULL`
- `updateServiceAddon({ businessId, addonId, name, priceInput, durationMinutes, description })`
  - same null-empty rule for `description`
- `deleteServiceAddon(...)`
- `fetchAddonAssignmentsByService(businessId)`
- `fetchAddonAssignmentsForService(serviceId)`

## Hooks and Responsibilities

- `useServicesCatalog`
  - loads business profile + services/add-ons/assignment model
- `useServiceEditData`
  - loads service editor data model for one service
- `useSaveServiceEdits`
  - persists service details, pricing options, and add-on assignments
- `useCreateCatalogService`
  - create service, then optional price options + selected add-ons / pending add-ons
- `useDeleteServicePriceOption`
  - deletes persisted price options; skips remote delete for unsaved local IDs
- `useMutateServiceAddon`
  - create/update add-on
- `useDeleteServiceAddon`
  - delete add-on
- `useDeleteBusinessService`
  - delete service
- `useUpdateBusinessServiceActive`
  - toggle `is_active`
- `useSaveBusinessServicesOrder`
  - persist drag reorder to `sort_order`

## Business Rules and Conditions

### Service Create

Required:

- name
- description
- price
- duration

Optional:

- category (when categories exist)
- other prices (`service_price_options`) — enabled when at least one option exists and pricing is not locked
- add-ons — selected catalog add-ons and newly created pending add-ons that remain selected

Default behavior:

- created as `is_active: true`
- duration is stored as minutes (minimum 30 minutes in API guard)
- free-tier service cap still blocks opening create when at the limit

Validation: `validateNewServiceDraft` (also used conceptually for edit required fields).

### Service Delete

- Confirmation required before delete (catalog card or edit header trash).
- Copy intentionally states only that service is deleted (user-friendly wording).

### Service Active Toggle

- Writes immediately to DB (`is_active`) without waiting for a separate save action.
- Failed toggle re-fetches catalog to restore consistent UI state.

### Reorder

- Enabled only in services view.
- Enter sort mode -> drag cards -> Save order.
- Save writes `sort_order` increments of 10 in current visual order.
- No order changes: exits sort mode without write.

### Pricing Options

- Deployment differences in label column handled by `detectPriceOptionLabelColumn`.
- New local option IDs follow `option-new-*` and are inserted on save.
- Persisted options are upserted by `id`.
- Multiple prices may be locked for non-Pro accounts (`serviceMultiplePricingAccessCopy`); UI shows web-account guidance instead of the prices sheet.
- On create/edit, manage options inside `ServicePriceListSheet` (list ↔ form in one sheet).

### Add-ons

- Required: name, price. Duration and description are optional.
- Add-on duration is optional (`''` means no extra time).
- Duration display is human-readable (e.g. `30 min`, `1 hr`, `1 hr 30 min`) without `+`.
- Optional `description` (max 800 chars via `ADDON_DESCRIPTION_MAX_LENGTH`):
  - Editable only in `AddonEditorSheet` (create/edit add-on; not on pricing-option sheets)
  - Loaded into catalog/editor models so edit can prefill
  - **Not** shown on add-ons tab cards, create/edit appointment, or quotes
  - **Not** included in booking payloads (`selectedAddOns` / `addon_details`); web self-booking reads `service_addons.description` directly
- On create, unchecked pending add-ons are not inserted.
- On edit, creating an add-on from the picker persists immediately and selects it for the service.
- Add-on delete confirmation (catalog) explains cross-service removal behavior.

## UI/Interaction Notes

- Sort mode drag is long-press on the full service card.
- Haptics (`expo-haptics`) trigger a subtle tactile tick on drag start.
- Create and edit use full-screen routes (`SERVICES_CREATE` / `SERVICES_EDIT`), not a create sheet.
- Service description fields include a bullet insert action; char count shows near the limit.
- Add-on description is an optional multiline input with an 800-char counter (no bullet toolbar).
- Prefer `Button` `secondary` / `surfaceLight` / `ghost` over outline for these flows.
- Tappable rows: `flexDirection: 'row'` on an inner `View`, not on `Pressable`; `flex` / `minWidth: 0` on a `View`, not on `AppText`.

## Testing

Current service tests live in `src/features/services/__tests__/`:

- `buildServicesCatalogModel.test.js`
  - service/add-on mapping, sort behavior, helper normalization
- `serviceAddonModel.test.js`
  - add-on model mapping (including `description`) and duration normalization
- `servicesApiSortOrder.test.js`
  - verifies reorder write path uses per-row update + business scoping
- `validateNewServiceDraft.test.js`
  - required fields and other-price option validation for create

## Known Follow-ups (if needed later)

- add explicit success toast/snackbar for sort save
- add broader integration tests for Services screen interactions
- add e2e coverage for create/edit/delete flows
