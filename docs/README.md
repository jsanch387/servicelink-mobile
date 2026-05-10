# Documentation

Integration and product docs live **with their features** under `src/features/<feature>/docs/`. This folder keeps **cross-cutting** checklists only.

## Feature documentation

| Area                                                           | Location                                                                                                                                                                                                                                                  |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Notifications** (inbox, push, Next.js contract)              | [`src/features/notifications/docs/`](../src/features/notifications/docs/) — [integration](../src/features/notifications/docs/notifications-integration.md), [detailer / events guide](../src/features/notifications/docs/detailer-notifications-guide.md) |
| **More — delete account** (mobile + Next.js, LAN / web origin) | [`src/features/more/docs/delete-account-integration.md`](../src/features/more/docs/delete-account-integration.md)                                                                                                                                         |
| **Stripe** (checkout, portal, Connect, envs)                   | [`src/features/stripe/docs/mobile-stripe-feature-map.md`](../src/features/stripe/docs/mobile-stripe-feature-map.md)                                                                                                                                       |
| **Quotes** (inbox, send API, navigation)                       | [`src/features/quotes/docs/quotes-feature.md`](../src/features/quotes/docs/quotes-feature.md)                                                                                                                                                             |

## Repo-wide (stays in `/docs`)

| Doc                                           | Purpose                        |
| --------------------------------------------- | ------------------------------ |
| [App launch checklist](./app-launch-todos.md) | Pre–App Store progress tracker |

## Redirect

Older links to `docs/notifications.md` should use this README or [`src/features/notifications/README.md`](../src/features/notifications/README.md) instead.
