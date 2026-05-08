# Stripe feature hub

This folder is a **navigation hub** for Stripe functionality used across mobile features.

It currently re-exports Stripe APIs/constants from existing feature-first locations so we get:

- one obvious place to discover Stripe code
- no risky file moves/import churn right now
- backward compatibility with current imports

## Use this when

- You are adding or debugging Stripe checkout, portal, connect, or payment enable flows.
- You need to see all Stripe endpoints/constants in one spot.

## Sources of truth

- Product/flow map: `docs/mobile-stripe-feature-map.md`
- Re-exports: `src/features/stripe/index.js`
