# 1. Monorepo tooling: pnpm workspaces + Turborepo

## Status

Accepted

## Context

The system is split into a web app and up to four backend services (api-gateway,
booking-service, payment-service, notification-service), plus shared packages (e.g. domain
types). They need to be developed, built, linted, and tested together, with a CI pipeline that
does not redo work unnecessarily as the number of packages grows.

Options considered:

- **pnpm workspaces only** — simplest option, no task orchestration or caching. Build/test order
  across packages would need to be managed manually or via ad-hoc scripts.
- **pnpm workspaces + Turborepo** — adds a task graph (`turbo run build`) that respects
  inter-package dependencies and caches task outputs, so unchanged packages are not rebuilt.
- **Nx** — more comprehensive (code generation, dependency graph visualization, plugins), but
  more machinery than this project's scope (3 backend services, no Kubernetes/Kafka) justifies.

## Decision

Use **pnpm workspaces** for dependency management and linking, and **Turborepo** for running
`build` / `dev` / `lint` / `test` / `typecheck` across packages with caching and correct task
ordering.

## Consequences

- One more config file (`turbo.json`) and concept to understand, in exchange for CI speed and a
  concrete answer to "how do you manage a multi-service repo" in interviews.
- Package boundaries are enforced by workspace structure (`apps/*`, `services/*`, `packages/*`)
  rather than a single flat `src/`.
- If the project later needs generators or a dependency graph UI, migrating to Nx remains
  possible but is not planned (non-goal for this project's scope).
