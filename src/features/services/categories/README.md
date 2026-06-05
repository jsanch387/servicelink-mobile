# Service categories (mobile)

Optional browsing groups for the services catalog (e.g. Cars, RVs, Boats). Lives under the parent **services** feature until API wiring is complete.

## Docs

- **[Database & relationships](./docs/service-categories-database.md)** — tables, FKs, sort order, RLS, vs add-ons
- SQL migration (repo root): `docs/sql/service_categories_migration.sql`

## Layout

```
categories/
  components/     CategoryEditorSheet, ServiceCategoryTabs, editor section + how-it-works sheet
  constants/      mock data (temporary), copy, UNCATEGORIZED_SERVICES_GROUP_ID
  context/        ServiceCategoriesMockProvider — replace with API + React Query
  docs/           service-categories-database.md
  hooks/          useServiceCategoryTabs (list tab state)
  utils/          groupServicesByCategory, buildServiceCategoryTabs
  index.js        public exports — import from here
```

## Catalog UI rules

| Situation                            | Services list                                                           |
| ------------------------------------ | ----------------------------------------------------------------------- |
| No categories                        | Flat list, header **Add service**, count + **Reorder** link above cards |
| One category, all services assigned  | Flat list (tabs hidden — one group adds no value)                       |
| One category + services in **Other** | Tabs: `Cars` \| `Other`                                                 |
| Two+ categories                      | Tabs per category + **Other** when needed                               |

**Other** = services with no category (owner-friendly; not “Uncategorized”). Booking link can use the same label.

**Reorder:** count row shows an underlined **Reorder** link when 2+ services; bottom **Cancel** / **Save** while dragging; tabs stay visible.

## Usage

```js
import {
  ServiceCategoriesMockProvider,
  useServiceCategoriesMock,
  ServiceCategoryTabs,
  useServiceCategoryTabs,
} from '../categories';
```

Provider wraps `MoreNavigator` (services + service edit screens).

## Next (API)

1. `fetchServiceCategories` / CRUD in `api/services.js` (or `api/categories.js`)
2. Include `category_id` on `business_services` in catalog + editor save
3. `saveBusinessServicesSortOrder({ businessId, categoryId, orderedServiceIds })`
4. Remove mock context; extend `useServicesCatalog`
