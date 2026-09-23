# 2. NestJS services use CommonJS, not ESM

## Status

Accepted

## Context

The monorepo was set up with `"type": "module"` (ESM) everywhere by default — `shared-types`
and the other placeholder packages all use ESM with `NodeNext` module resolution.

When `booking-service` was scaffolded as a real NestJS app, its `dev` script initially used
`tsx` (an esbuild-based TypeScript runner) to keep things simple and fast. This broke NestJS's
constructor-based dependency injection: `HoldsController`'s constructor
(`constructor(private readonly holds: HoldsService) {}`) has no explicit `@Inject()` token, so
NestJS relies on TypeScript's `emitDecoratorMetadata` to read the parameter's type at runtime and
resolve it automatically. `esbuild` (and therefore `tsx`) does not implement
`emitDecoratorMetadata` — it transpiles per-file without full type information. The symptom was
silent: the app booted with no errors, routes resolved, but `this.holds` was `undefined` at
request time.

## Decision

`booking-service` (and by extension every future NestJS service) uses the official `@nestjs/cli`
(`nest build` / `nest start --watch`) and compiles as **CommonJS**, not ESM. This is NestJS's own
default and the path most NestJS projects use; `nest build` uses the real TypeScript compiler
(`tsc` by default), which fully supports `emitDecoratorMetadata`.

`shared-types` and any future non-NestJS package keep using ESM — there is no requirement for the
whole monorepo to share one module system. Interop between them only needs to work at the type
level: `booking-service` currently only imports `type`-only declarations from `@ticket/shared-types`
(e.g. `import type { Hold } from "@ticket/shared-types"`), which are erased at compile time, so
CJS/ESM interop is a non-issue in practice. If a NestJS service ever needs a *runtime* value from
an ESM-only package, that will need revisiting (e.g. dynamic `import()`).

## Consequences

- Two module systems coexist in this monorepo: ESM (`shared-types`, non-NestJS packages) and
  CommonJS (NestJS services). This is intentional, not an oversight — flagged here so it doesn't
  look like inconsistency later.
- Relative imports inside NestJS services do **not** use `.js` extensions (CommonJS/`moduleResolution:
  "node"` convention), unlike ESM packages elsewhere in the repo, which do (`NodeNext` requires
  them).
- `tsx`/`ts-node`-style fast dev runners are avoided for NestJS services specifically, because of
  the `emitDecoratorMetadata` gap. `nest start --watch` is slightly slower to restart than `tsx
  watch` but is correct.

## Update (milestone 3, adding Jest)

`@nestjs/common`/`@nestjs/core`/`@nestjs/platform-express` were initially installed at `^12`.
`nest build`/`nest start` ran fine — `node` can `require()` an ESM package transparently on
Node 24 — but **Jest** could not: `@nestjs/common@12.x` ships `"type": "module"`, and
`jest-runtime` refuses to `require()` an ESM file from a CommonJS test, even with
`transformIgnorePatterns` adjusted for pnpm's nested `.pnpm/` store layout and a `babel-jest`
transform added specifically for it. Rather than fight a very recent (and still ecosystem-fragile)
NestJS major version's ESM migration, **all `@nestjs/*` packages are pinned to `^11`**, which is
still CommonJS (no `"type"` field). This sidesteps the whole class of problem for this project's
purposes; revisit when NestJS 12's ESM support and its tooling (Jest, ts-jest) have matured.
