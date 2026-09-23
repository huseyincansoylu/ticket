# 3. Payment provider: iyzico, not Stripe

## Status

Accepted

## Context

`CLAUDE.md` originally specified Stripe (test mode) as the payment provider, matching the
project owner's prior professional experience. During milestone 4 setup, Stripe signup was
attempted and blocked: Stripe only supports merchant accounts registered in a fixed list of
~46 countries, and Turkey is not among them. This is not a live/test-mode distinction — even
Stripe's test mode requires completing the same country-gated signup flow, so there is no way to
obtain API keys, sandbox or otherwise, from a Turkey-registered account.

The only documented workaround (forming a US LLC with an EIN, US address, and US bank account) is
disproportionate for a portfolio project, and misrepresenting the account's country during signup
was ruled out — that's providing false registration information to a regulated financial
services company, which is both a Terms of Service violation and a real (if small) compliance
risk, for no benefit proportionate to a learning project.

Alternatives considered:

- **iyzico** — Turkey-based payment provider (comparable to Stripe in the Turkish market).
  Sandbox accounts (`sandbox-merchant.iyzipay.com`) are self-serve, require no business
  verification, and provide immediate API key + secret key access. Supports webhooks with header-
  based signature verification (`X-IYZ-SIGNATURE-V3`), directly analogous to Stripe's webhook
  signing secret. Full API and webhook documentation available.
- **Stripe SDK against fixture payloads, no live account** — keep Stripe's actual npm SDK and API
  shapes, but never make a live network call; test webhook handling against hand-built JSON
  payloads matching Stripe's real event schema. Rejected as the primary path because it never
  proves an actual end-to-end integration — a real concern for a portfolio project meant to
  demonstrate working systems, not just code that type-checks.
- **Paddle / Lemon Squeezy** — merchant-of-record providers with broad payout coverage, but
  Turkey's status as a *seller* location wasn't confirmed with confidence during research; not
  pursued further given iyzico's clear fit.

## Decision

Use **iyzico** (sandbox mode) as the payment provider for `payment-service`.

## Consequences

- The specific SDK and payload shapes in `payment-service` are iyzico's, not Stripe's. The
  concepts this milestone exists to teach — webhook signature verification, idempotency keys,
  payment/reservation consistency — transfer directly regardless of provider; only the wire
  format changes.
- `CLAUDE.md`'s architecture section and roadmap (milestone 4) updated to say iyzico instead of
  Stripe.
- If this project is ever extended to a real US-based entity, or if Stripe expands support to
  Turkey, swapping the payment provider is a contained change if `payment-service` keeps its
  provider-specific code behind a narrow interface (e.g. `createPayment`, `verifyWebhookSignature`)
  rather than scattering iyzico-specific types through the rest of the codebase.
