# Service categories (mobile)

Optional browsing groups for the services catalog (e.g. Cars, RVs, Boats). Lives under the parent **services** feature.

## Docs

- **[Database & relationships](./docs/service-categories-database.md)** — tables, FKs, sort order, RLS, vs add-ons
- SQL migration (repo root): `docs/sql/service_categories_migration.sql`

## Layout

```
categories/
  api/            service_categories CRUD + sort order
  components/     CategoryEditorSheet, ServiceCategoryTabs, editor section + how-it-works sheet
  constants/      copy, UNCATEGORIZED_SERVICES_GROUP_ID
  docs/           service-categories-database.md
  hooks/          useServiceCategoryTabs, useMutateServiceCategory, useSaveServiceCategoriesOrder
  utils/          groupServicesByCategory, buildServiceCategoryTabs
  index.js        public exports — import from here
```

## Catalog UI rules

| Situation                           | Services list                                                           |
| ----------------------------------- | ----------------------------------------------------------------------- |
| No categories                       | Flat list, header **Add service**, count + **Reorder** link above cards |
| One category, all services assigned | Flat list (tabs hidden — one group adds no value)                       |
| One category + unassigned services  | Tabs: `Cars` \| **No category**                                         |
| Two+ categories                     | Tabs per category + **No category** when needed                         |

**No category** = services with no `category_id` (owner-friendly tab label).

**Reorder:** categories and services each have a **Reorder** link when 2+ items; bottom **Cancel** / **Save order** while dragging.

## Usage

```js
import {
  ServiceCategoryTabs,
  useServiceCategoryTabs,
  useMutateServiceCategory,
  useSaveServiceCategoriesOrder,
} from '../categories';
```

Data loads via `useServicesCatalog` (list) and `useServiceEditData` (editor).
