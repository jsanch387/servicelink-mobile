# Services Feature Documentation

This document captures the Services feature behavior, data contract, and mutation rules used by mobile.

## Scope

The feature supports:

- Services catalog list (view/sort/reorder/delete/toggle active)
- Add-ons catalog list (create/edit/delete)
- Service edit flow (details, pricing options, add-on assignments)
- Service create flow (name, description, price, duration)

## Main Screens

- `src/features/services/screens/ServicesScreen.jsx`
  - Segmented view: `services` / `add-ons`
  - Service card actions:
    - Edit service (navigates to service editor)
    - Delete service (confirmation)
    - Toggle active/inactive (instant DB update)
    - Sort mode + drag reorder + save order
  - Add-on card actions:
    - Edit add-on (sheet)
    - Delete add-on (confirmation)
    - Assign/unassign in service editor context
  - Create service sheet (full-screen slide-up panel)

- `src/features/services/screens/ServiceEditScreen.jsx`
  - Service details edit
  - Pricing options create/edit/delete
  - Add-on assignment + add-on create/edit/delete in context
  - Save changes for service/pricing/assignments

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
  - used for: list, create, update, delete
- `service_addon_assignments`
  - join table (`service_id`, `addon_id`) with no `business_id`
  - used for: service add-on assignment save/fetch

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

- `fetchServiceAddons(businessId)`
- `insertServiceAddon(...)`
- `updateServiceAddon(...)`
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
- `useDeleteServicePriceOption`
  - deletes persisted price options; skips remote delete for unsaved local IDs
- `useMutateServiceAddon`
  - create/update add-on
- `useDeleteServiceAddon`
  - delete add-on
- `useCreateBusinessService`
  - create service from quick add sheet
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

Default behavior:

- created as `is_active: true`
- duration is stored as minutes (minimum 30 minutes in API guard)

### Service Delete

- Confirmation required before delete.
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
- Deleting option requires confirmation.

### Add-ons

- Add-on duration is optional (`''` means no extra time).
- Duration display is human-readable (e.g. `30 min`, `1 hr`, `1 hr 30 min`) without `+`.
- Add-on delete confirmation explains cross-service removal behavior.

## UI/Interaction Notes

- Sort mode drag is long-press on the full service card.
- Haptics (`expo-haptics`) trigger a subtle tactile tick on drag start.
- Service create uses full-screen slide-up panel (no new route required).
- Description fields in editor/create include:
  - bullet insert action
  - live char counter

## Testing

Current service tests live in `src/features/services/__tests__/`:

- `buildServicesCatalogModel.test.js`
  - service/add-on mapping, sort behavior, helper normalization
- `serviceAddonModel.test.js`
  - add-on model mapping and duration normalization
- `servicesApiSortOrder.test.js`
  - verifies reorder write path uses per-row update + business scoping

## Known Follow-ups (if needed later)

- add explicit success toast/snackbar for sort save
- add broader integration tests for Services screen interactions
- add e2e coverage for create/edit/delete flows
