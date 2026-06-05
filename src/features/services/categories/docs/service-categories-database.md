# Service categories — database & data relationships

How categories are stored in Supabase, how they relate to services and add-ons, and how sort order works. For the runnable migration, see `docs/sql/service_categories_migration.sql` at the repo root.

## Mental model

| Layer                                       | Role                                                                       |
| ------------------------------------------- | -------------------------------------------------------------------------- |
| **Service** (`business_services`)           | Main bookable offering — own name, price, duration                         |
| **Category** (`service_categories`)         | Optional browsing group (Cars, RVs, Boats) — not a reusable “service type” |
| **Add-on** (`service_addons` + assignments) | Optional extras attached to one or more services                           |

A service can have **zero or one** category. A service can have **many** add-ons. Categories and add-ons are independent.

```
business_profiles (1)
    │
    ├── service_categories (*)     sort_order → section order on booking link
    │         ▲
    │         │ category_id (nullable FK, ON DELETE SET NULL)
    │         │
    ├── business_services (*)      sort_order → order within category (or flat list if uncategorized)
    │
    ├── service_addons (*)
    │         ▲
    │         │ service_addon_assignments (service_id, addon_id)
    │         │
    └── (same business_services)
```

## Tables

### `service_categories`

Business-owned catalog of group labels.

| Column                     | Type                             | Notes                                                                      |
| -------------------------- | -------------------------------- | -------------------------------------------------------------------------- |
| `id`                       | uuid PK                          |                                                                            |
| `business_id`              | uuid FK → `business_profiles.id` | CASCADE on business delete                                                 |
| `name`                     | text                             | 1–80 chars trimmed; unique per business on `lower(trim(name))`             |
| `sort_order`               | int ≥ 0                          | Order of **sections** (tabs on owner app, sections on public booking link) |
| `created_at`, `updated_at` | timestamptz                      | `updated_at` via trigger                                                   |

### `business_services.category_id`

| Column        | Type                                       | Notes                                      |
| ------------- | ------------------------------------------ | ------------------------------------------ |
| `category_id` | uuid nullable FK → `service_categories.id` | `ON DELETE SET NULL` when category removed |

Trigger `trg_business_services_category_business` rejects assigning a category from another business.

Existing columns unchanged: `sort_order`, `is_active`, price, duration, etc.

## Sort order (two levels)

| Field                           | Scope                                                                            | Example                                  |
| ------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------- |
| `service_categories.sort_order` | Whole business catalog sections                                                  | RVs before Boats on booking link         |
| `business_services.sort_order`  | **Within** `category_id` when set; uncategorized services share their own bucket | Basic wash → premium detail inside “RVs” |

**No categories:** keep current behavior — one flat list ordered by `business_services.sort_order`.

**With categories:** owner **Sort** UI should save order for the **active category tab only** (mobile follow-up; API: pass `categoryId` + `orderedServiceIds`).

Public read today (`fetchBusinessServicesForPublicProfile`): `order by sort_order`. After grouping by category on web/mobile, order services inside each section by `sort_order`.

## RLS

### `service_categories`

| Policy                                             | Role                    | Rule                                                             |
| -------------------------------------------------- | ----------------------- | ---------------------------------------------------------------- |
| Owners manage service categories                   | `authenticated`         | `business_profiles.profile_id = auth.uid()` for ALL              |
| Public read service categories for active catalogs | `anon`, `authenticated` | SELECT when business has ≥1 `business_services.is_active = true` |

### `business_services`

No new table; owners already update rows via existing policies. `category_id` updates use the same owner rules.

## Compare to add-ons

|                           | Categories                                  | Add-ons                           |
| ------------------------- | ------------------------------------------- | --------------------------------- |
| Catalog table             | `service_categories`                        | `service_addons`                  |
| Link to service           | `business_services.category_id` (1:0..1)    | `service_addon_assignments` (M:N) |
| `business_id` on link row | On service (must match category’s business) | Only on addon + service rows      |

## Mobile module

Categories load from Supabase via `useServicesCatalog` and `useServiceEditData`. Mutations use `useMutateServiceCategory` and `useSaveServiceCategoriesOrder`. Service assignment persists `business_services.category_id` on create/edit save.

## Queries

```sql
-- Owner catalog
select * from service_categories
where business_id = $1
order by sort_order asc, created_at asc;

select id, name, category_id, sort_order, is_active, ...
from business_services
where business_id = $1
order by sort_order asc;

-- Public booking (group in app)
-- categories by sort_order; services where is_active and category_id = ? order by sort_order
```

## Related docs

- Repo migration: `docs/sql/service_categories_migration.sql`
- Global schema snapshot: `DATABASE_SCHEMA_REFERENCE.md` (§ `service_categories`)
- Services feature overview: `../SERVICES_FEATURE.md` (parent folder)
