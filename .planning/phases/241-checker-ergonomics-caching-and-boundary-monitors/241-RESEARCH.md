# Phase 241: Checker Ergonomics, Caching, and Boundary Monitors - Research

**Researched:** 2026-06-14 [VERIFIED: system date]
**Domain:** Workshop checker pacing, ephemeral cache/coalescing, stale-state UI, and runtime boundary monitors [VERIFIED: .planning/phases/241-checker-ergonomics-caching-and-boundary-monitors/241-CONTEXT.md]
**Confidence:** HIGH for repo-local current behavior and implementation targets; MEDIUM for exact post-Phase-239/240 integration points because those phases are planned but not visibly implemented in this checkout. [VERIFIED: codebase grep; VERIFIED: .planning/STATE.md]

<user_constraints>
## User Constraints (from CONTEXT.md)

Source for this section: `.planning/phases/241-checker-ergonomics-caching-and-boundary-monitors/241-CONTEXT.md`. [VERIFIED: .planning/phases/241-checker-ergonomics-caching-and-boundary-monitors/241-CONTEXT.md]

### Locked Decisions

### Rust/Zig Validation Pacing
- **D-01:** Use debounce plus request coalescing/cache for compile-heavy Rust/Zig validation.
- **D-02:** Preserve a responsive Validate source experience instead of forcing Rust/Zig into manual-only validation.
- **D-03:** Long debounce alone is insufficient because identical duplicate compile calls can still churn runtime-service/toolchains.

### Cache Scope
- **D-04:** Checker cache/coalescing should be ephemeral only.
- **D-05:** Cache identity must follow the Phase 238 contract: language, provider id, source hash/bytes, artifact hash/bytes where applicable, provider contract version, runtime ABI version, validation policy, and toolchain/provider compatibility metadata.
- **D-06:** Persisted checker results are out of scope; preflight cache must not become authoritative provenance evidence.
- **D-07:** Submit/save remains authoritative and must revalidate rather than trusting cached checker results.

### Stale State Behavior
- **D-08:** Keep stale results visible while a new check is pending, but clearly mark them stale.
- **D-09:** Stale results must not be treated as current readiness for submit/save.
- **D-10:** Do not block editing while checking; avoid flicker and preserve useful diagnostic context.

### Boundary Monitors
- **D-11:** Phase 241 must add explicit boundary monitors for no Strategy execution in web/API/Go.
- **D-12:** Phase 241 must prove TinyGo remains hidden from production Workshop validation, submit/save, entry, result, replay, and public evidence surfaces.
- **D-13:** Phase 241 must prove runtime-service/provider ownership is preserved and checker responses are schema-validated data before UI/use.

### the agent's Discretion
- Planner may choose whether coalescing/cache lives client-side, server-side, or both, provided the implementation reduces duplicate runtime-service/toolchain churn and does not persist authoritative checker evidence.
- Planner may tune debounce durations by language based on existing UX patterns and testability.

### Deferred Ideas (OUT OF SCOPE)
- Persisted checker evidence is deferred/out of scope.
- Final service-backed proof and privacy scans belong to Phase 242.
- Any TinyGo production support remains future-only and requires an explicit productionization milestone.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CHECKERG-01 | Rust and Zig Workshop validation is debounced, cached, coalesced, or otherwise made realistic enough for ordinary editing without excessive compile/runtime-service calls or stale status flicker. [VERIFIED: .planning/REQUIREMENTS.md] | Use client debounce/state retention plus server-side in-flight coalescing and short TTL cache at `/api/workshop/validate`; Rust compile currently has a 10s `rustc` timeout and Zig compile has a 30s `zig` timeout. [VERIFIED: packages/runtime-wasm-wasi/src/validation.ts:348; VERIFIED: packages/runtime-wasm-wasi/src/validation.ts:504] |
| CHECKERG-02 | Checker cache keys account for language, provider id, source hash/bytes, artifact hash/bytes where applicable, toolchain/provider compatibility metadata, and validation policy so stale or cross-language diagnostics cannot be reused incorrectly. [VERIFIED: .planning/REQUIREMENTS.md] | Implement cache identity from the Phase 238 contract and provider registry fields: provider id, contract version, runtime ABI version, language id, and source format are available in `packages/spec/src/runtime.ts`. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md; VERIFIED: packages/spec/src/runtime.ts:50] |
| CHECKERG-03 | Workshop UI clearly separates checking, checked, unavailable, failed, stale, and ready states across TypeScript, Python, Rust, and Zig without adding TinyGo to production surfaces. [VERIFIED: .planning/REQUIREMENTS.md] | Current UI only models `not-checked`, `checking`, `valid`, and `invalid`; expand state helpers around the checker envelope status and keep `WORKSHOP_EDITOR_SOURCE_FORMATS` limited to TypeScript, Python, Rust, and Zig. [VERIFIED: apps/web/app/workshop/workshop-client-state.ts:6; VERIFIED: apps/web/lib/runtime-labels.ts:12] |
| CHECKERG-04 | Web/API/Go surfaces treat checker responses as validated data and do not execute Strategy source, compiler artifacts, or runtime payloads outside the approved runtime-service/provider boundary. [VERIFIED: .planning/REQUIREMENTS.md] | Add focused monitors for Workshop validate/revision routes plus registry checks; existing runtime provider records already declare `executionOwner: "runtime-service"` and boundary rules for web/API/Go. [VERIFIED: packages/spec/src/runtime.ts:100; VERIFIED: packages/spec/src/runtime.ts:600] |
</phase_requirements>

## Summary

Phase 241 should implement pacing and identity around the existing Workshop checker path, not move validation semantics into React or make submit/save trust preflight results. [VERIFIED: .planning/phases/241-checker-ergonomics-caching-and-boundary-monitors/241-CONTEXT.md] Current Workshop auto-validation uses a 500 ms debounce, clears validation on edit, and derives the current result only when `validationSource` and `validationSourceFormat` exactly match the current draft. [VERIFIED: apps/web/app/workshop/workshop-client.tsx:155; VERIFIED: apps/web/app/workshop/workshop-client.tsx:197; VERIFIED: apps/web/app/workshop/workshop-client.tsx:216; VERIFIED: apps/web/app/workshop/workshop-client.tsx:320] This means the current UI prevents stale submit readiness, but it also discards previous diagnostics instead of displaying an explicit stale state. [VERIFIED: apps/web/app/workshop/workshop-client.tsx:155; VERIFIED: apps/web/app/workshop/workshop-client-state.ts:60]

The best implementation target is a shared checker utility plus server-side in-flight coalescing/short TTL cache at `apps/web/app/api/workshop/validate/route.ts`, with a small client-side state/cache layer for stale display and duplicate local button/debounce requests. [VERIFIED: .planning/phases/241-checker-ergonomics-caching-and-boundary-monitors/241-CONTEXT.md; VERIFIED: apps/web/app/api/workshop/validate/route.ts:45] Server-side coalescing is important because current Rust and Zig provider validation can synchronously spawn compilers under runtime-service with 10s and 30s timeouts. [VERIFIED: packages/runtime-wasm-wasi/src/validation.ts:348; VERIFIED: packages/runtime-wasm-wasi/src/validation.ts:504]

**Primary recommendation:** implement ephemeral request coalescing/cache in the Workshop validate API keyed by Phase 238 `cacheIdentity`, keep stale UI results visible but non-authoritative, and add a checker-specific boundary monitor that extends existing import/registry checks for Workshop validate/revision routes and TinyGo absence. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md; VERIFIED: scripts/check-service-boundary-imports.ts:67]

## Project Constraints (from AGENTS.md)

- Keep the engine pure, deterministic, serializable, and side-effect free. [VERIFIED: AGENTS.md]
- Do not put game rules in React components. [VERIFIED: AGENTS.md]
- Do not execute user Strategy code in the web/API process. [VERIFIED: AGENTS.md]
- Do not execute user Strategy code in Go. [VERIFIED: AGENTS.md]
- Do not use `Math.random`, `Date.now`, system time, filesystem, network, or database access inside engine logic. [VERIFIED: AGENTS.md]
- Do not use Node `vm` as a security boundary for untrusted code. [VERIFIED: AGENTS.md]
- Treat Strategy code as hostile and validate every runtime boundary with schemas. [VERIFIED: AGENTS.md]
- Preserve canonical terminology: Soldier, Match, Phase, Round, Activation, Cycle, Action, Advance, STONE, FALLEN, Chronicle. [VERIFIED: AGENTS.md; VERIFIED: CowardsGameSpec_Full_Consolidated_v1.md]
- Strategy Revisions are immutable once submitted for Match or MatchSet play. [VERIFIED: AGENTS.md; VERIFIED: CowardsGame_Technical_Architecture_Spec_V1.md]
- Public replay output must not expose Strategy source, StrategyMemory, SoldierMemory, or objective payloads by default. [VERIFIED: AGENTS.md; VERIFIED: CowardsGameSpec_Full_Consolidated_v1.md]
- Replay or Match creation changes require board realism checks, but Phase 241 does not create Matches or replays. [VERIFIED: AGENTS.md; VERIFIED: .planning/ROADMAP.md]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|--------------|----------------|-----------|
| Stale result display and editing ergonomics | Browser / Client | API / Backend | The browser owns editor state, visible stale labels, nonblocking editing, and submit gating; API/backend supplies authoritative checker envelope identity. [VERIFIED: apps/web/app/workshop/workshop-client.tsx:155; VERIFIED: .planning/phases/241-checker-ergonomics-caching-and-boundary-monitors/241-CONTEXT.md] |
| In-flight request coalescing | API / Backend | Browser / Client | Server-side coalescing prevents duplicate runtime-service/compiler calls from multiple client triggers; client-side dedupe reduces same-tab churn but cannot protect the server alone. [VERIFIED: apps/web/app/api/workshop/validate/route.ts:37; VERIFIED: .planning/phases/241-checker-ergonomics-caching-and-boundary-monitors/241-CONTEXT.md] |
| Ephemeral checker result cache | API / Backend | Browser / Client | A process-local cache around `/api/workshop/validate` reduces repeat calls but must remain non-authoritative and bounded; submit/save still revalidates independently through `/api/workshop/revisions`. [VERIFIED: apps/web/app/api/workshop/validate/route.ts:45; VERIFIED: apps/web/app/api/workshop/revisions/route.ts:47] |
| Provider validation/build | Runtime-service / Provider | API / Backend transport | Runtime-service `/validate-strategy` dispatches to TypeScript, Python, Rust, or Zig provider validation/build helpers and emits provider metadata; app/API should normalize and validate responses, not own hostile execution/build. [VERIFIED: apps/runtime-service/src/server.ts:108; VERIFIED: apps/runtime-service/src/server.ts:275; VERIFIED: .planning/phases/239-provider-grade-validate-source-parity/239-CONTEXT.md] |
| TinyGo hidden-state proof | Spec/Registry + Monitors | UI/API route tests | Production Workshop source formats list only TypeScript, Python, Rust, and Zig; spec tests already assert TinyGo is absent from supported language lookup. [VERIFIED: apps/web/lib/runtime-labels.ts:12; VERIFIED: packages/spec/src/spec.test.ts:424] |
| No Strategy execution in web/API/Go monitor | Boundary monitor scripts | Unit tests | Existing boundary monitor infrastructure scans strict entry files and forbidden runtime imports; Phase 241 should add checker routes to that strict surface and add cache-specific assertions. [VERIFIED: scripts/check-service-boundary-imports.ts:7; VERIFIED: scripts/check-service-boundary-imports.ts:67] |

## Current Debounce and Stale Behavior

| Area | Current Behavior | Implementation Implication |
|------|------------------|----------------------------|
| Auto-validation debounce | Dirty source triggers `validateSource(source)` after 500 ms. [VERIFIED: apps/web/app/workshop/workshop-client.tsx:216] | Keep a short debounce for TypeScript/Python and use a longer Rust/Zig debounce only if UX tests prove it remains responsive. [VERIFIED: .planning/phases/241-checker-ergonomics-caching-and-boundary-monitors/241-CONTEXT.md] |
| Manual Validate source | Manual button calls the same client `validateSource` path. [VERIFIED: apps/web/app/workshop/workshop-client.tsx:197; VERIFIED: apps/web/app/workshop/workshop-client.tsx:874] | Manual validation should bypass the debounce wait but still use the same in-flight coalescing/cache identity. [VERIFIED: .planning/phases/241-checker-ergonomics-caching-and-boundary-monitors/241-CONTEXT.md] |
| Current freshness check | `currentValidation` is non-null only when `validationSource === source` and `validationSourceFormat === sourceFormat`. [VERIFIED: apps/web/app/workshop/workshop-client.tsx:155] | Preserve this as the submit readiness gate; stale visible diagnostics must not become `currentValidation`. [VERIFIED: .planning/phases/241-checker-ergonomics-caching-and-boundary-monitors/241-CONTEXT.md] |
| Current stale display | On edit, client sets `validation` to null and `validationSource` to an empty string. [VERIFIED: apps/web/app/workshop/workshop-client.tsx:320] | Stop clearing the last response immediately; keep it as `lastChecked` and derive `displayedChecker.status = "stale"` when identity differs. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md] |
| Submit gating | Submit is enabled only when `currentValidation?.valid` is truthy and not submitting. [VERIFIED: apps/web/app/workshop/workshop-client-state.ts:96] | Stale `ready` output must never feed `canSubmitRevision`; readiness must be tied to current source identity. [VERIFIED: .planning/phases/241-checker-ergonomics-caching-and-boundary-monitors/241-CONTEXT.md] |
| API route behavior | `/api/workshop/validate` calls runtime-service for TypeScript/Rust/Zig, local Workshop validation for Python, and returns `{ validation }`. [VERIFIED: apps/web/app/api/workshop/validate/route.ts:69; VERIFIED: apps/web/app/api/workshop/validate/route.ts:81] | Phase 241 should assume Phase 239 may change this to a checker envelope; cache/coalescing should wrap the normalized envelope, not raw runtime-service JSON. [VERIFIED: .planning/phases/239-provider-grade-validate-source-parity/239-CONTEXT.md] |

## Standard Stack

### Core

| Library / Tool | Local Version | Current Registry Version | Purpose | Why Standard |
|----------------|---------------|--------------------------|---------|--------------|
| Next.js | `^16.2.6` in `apps/web/package.json` [VERIFIED: apps/web/package.json] | `16.2.9`, modified 2026-06-13 [VERIFIED: npm registry] | Workshop API routes and React app shell. [VERIFIED: apps/web/package.json] | Existing web framework; do not introduce a new server layer. [VERIFIED: CowardsGame_Technical_Architecture_Spec_V1.md] |
| React | `^19.2.6` in `apps/web/package.json` [VERIFIED: apps/web/package.json] | `19.2.7`, modified 2026-06-12 [VERIFIED: npm registry] | Workshop client state/rendering. [VERIFIED: apps/web/app/workshop/workshop-client.tsx] | Existing UI framework. [VERIFIED: apps/web/package.json] |
| Vitest | `^4.1.6` in root `package.json` [VERIFIED: package.json] | `4.1.8`, modified 2026-06-12 [VERIFIED: npm registry] | Focused unit tests for state helpers, route utilities, and monitor scripts. [VERIFIED: vitest.config.ts] | Existing project test runner. [VERIFIED: package.json] |
| Playwright | `^1.60.0` in root `package.json` [VERIFIED: package.json] | `1.60.0`, modified 2026-06-14 [VERIFIED: npm registry] | Optional local UI proof for stale/checking state only; full E2E proof is Phase 242. [VERIFIED: playwright.config.ts; VERIFIED: .planning/phases/241-checker-ergonomics-caching-and-boundary-monitors/241-CONTEXT.md] |
| TypeScript | `^6.0.3` in root `package.json` [VERIFIED: package.json] | `6.0.3`, modified 2026-04-16 [VERIFIED: npm registry] | Shared checker types and monitor scripts. [VERIFIED: package.json] | Existing monorepo language. [VERIFIED: CowardsGame_Technical_Architecture_Spec_V1.md] |
| pnpm | `11.1.2` from `packageManager` and local CLI [VERIFIED: package.json; VERIFIED: command output] | not needed for code choice [VERIFIED: package.json] | Package manager and focused script execution. [VERIFIED: package.json] | Existing workspace package manager. [VERIFIED: pnpm-workspace.yaml] |

### Supporting

| Library / Tool | Version | Purpose | When to Use |
|----------------|---------|---------|-------------|
| Node.js | `v24.15.0` local [VERIFIED: command output] | Runs route tests, Vitest, and scripts. [VERIFIED: package.json] | Use for focused unit/monitor commands. [VERIFIED: package.json] |
| `rustc` | `1.95.0` local [VERIFIED: command output] | Rust WASI compile validation. [VERIFIED: packages/runtime-wasm-wasi/src/validation.ts:504] | Needed only for live Rust provider checks; route/cache unit tests can stub `fetch`. [VERIFIED: apps/runtime-service/src/server.test.ts] |
| Zig | `0.16.0` local [VERIFIED: command output] | Zig WASI compile validation. [VERIFIED: packages/runtime-wasm-wasi/src/validation.ts:348] | Needed only for live Zig provider checks; Phase 241 should avoid large live E2E proof. [VERIFIED: user request] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| API-side in-flight coalescing + short TTL cache | Client-only cache | Client-only cache cannot reduce duplicate server/runtime-service calls across multiple tabs, route retries, or rapid manual+auto calls. [VERIFIED: .planning/phases/241-checker-ergonomics-caching-and-boundary-monitors/241-CONTEXT.md] |
| Stale-visible state | Clear diagnostics immediately | Clearing avoids stale confusion but loses useful diagnostics and contradicts the locked stale-state decision. [VERIFIED: .planning/phases/241-checker-ergonomics-caching-and-boundary-monitors/241-CONTEXT.md] |
| Ephemeral in-memory cache | Persistent checker evidence | Persistent checker evidence is explicitly deferred and must not become provenance evidence. [VERIFIED: .planning/phases/241-checker-ergonomics-caching-and-boundary-monitors/241-CONTEXT.md] |

**Installation:** no new package is recommended for Phase 241. [VERIFIED: package.json; VERIFIED: codebase grep]

## Architecture Patterns

### System Architecture Diagram

```text
Workshop editor source/sourceFormat
  -> client debounce + stale-state derivation
  -> /api/workshop/validate
     -> schema-validated checker request
     -> cache identity computed from source/provider/policy/toolchain metadata
     -> in-flight map lookup
        -> hit: await existing Promise
        -> miss: call normalized provider-grade validation
            -> runtime-service /validate-strategy
               -> provider validator/build helper
               -> public-safe normalized checker envelope
     -> short TTL cache write
  -> client receives checker envelope
     -> identity matches current draft: ready/invalid/unavailable/failed current state
     -> identity differs: stale visible state only
  -> submit/save
     -> /api/workshop/revisions
     -> independent provider validation; does not trust checker cache
```

All arrows above are data/control flow for checker preflight, and submit/save remains a separate authoritative validation path. [VERIFIED: apps/web/app/api/workshop/validate/route.ts; VERIFIED: apps/web/app/api/workshop/revisions/route.ts; VERIFIED: .planning/phases/241-checker-ergonomics-caching-and-boundary-monitors/241-CONTEXT.md]

### Recommended Project Structure

```text
apps/web/app/workshop/
├── workshop-checker-state.ts        # checker envelope state, stale derivation, submit readiness helpers
├── workshop-client-state.ts         # existing helpers, can delegate or be extended
└── workshop-client.tsx              # render-only state wiring, debounce, manual trigger

apps/web/app/api/workshop/validate/
├── route.ts                         # route entrypoint
└── checker-cache.ts                 # process-local in-flight coalescing + bounded TTL cache

apps/web/app/api/workshop/
└── checker-contract.ts              # request/response schema helpers if not already added by Phase 239

scripts/
└── check-v1-34-workshop-checker-boundary.ts  # focused Phase 241 monitor, imported by check-boundary-monitors or package script
```

The exact filenames can be adjusted to match Phase 239/240 outputs, but the ownership split should stay outside React for semantics and inside React only for rendering/wiring. [VERIFIED: .planning/phases/240-language-diagnostic-ux-and-availability-states/240-CONTEXT.md; VERIFIED: apps/web/app/workshop/workshop-client.tsx]

### Pattern 1: Stable Checker Identity

**What:** compute a deterministic identity string from the normalized checker contract identity fields. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md]

**When to use:** every `/api/workshop/validate` request and every client stale/readiness comparison. [VERIFIED: .planning/phases/241-checker-ergonomics-caching-and-boundary-monitors/241-CONTEXT.md]

```ts
// Source: .planning/artifacts/v1.34-workshop-checker-contract.md
export const checkerCacheKey = (identity: WorkshopCheckerResponse["cacheIdentity"]) =>
  JSON.stringify({
    languageId: identity.languageId,
    providerId: identity.providerId,
    sourceHash: identity.sourceHash,
    sourceBytes: identity.sourceBytes,
    artifactHash: identity.artifactHash,
    artifactBytes: identity.artifactBytes,
    providerContractVersion: identity.providerContractVersion,
    runtimeAbiVersion: identity.runtimeAbiVersion,
    validationPolicy: identity.validationPolicy,
    toolchainKey: identity.toolchainKey,
  })
```

### Pattern 2: In-Flight Coalescing Before TTL Cache

**What:** keep `Map<string, Promise<WorkshopCheckerResponse>>` for in-flight requests and a separate bounded TTL result map. [VERIFIED: .planning/phases/241-checker-ergonomics-caching-and-boundary-monitors/241-CONTEXT.md]

**When to use:** around normalized provider-grade validation in `/api/workshop/validate`, especially for Rust/Zig. [VERIFIED: apps/web/app/api/workshop/validate/route.ts:37; VERIFIED: packages/runtime-wasm-wasi/src/validation.ts:348]

```ts
// Source: repo-local route pattern + Phase 241 context
const inFlight = new Map<string, Promise<WorkshopCheckerResponse>>()
const cache = new Map<string, { expiresAt: number; value: WorkshopCheckerResponse }>()

export const coalesceCheckerValidation = async (
  key: string,
  validate: () => Promise<WorkshopCheckerResponse>,
) => {
  const cached = cache.get(key)
  if (cached && cached.expiresAt > Date.now()) return cached.value

  const existing = inFlight.get(key)
  if (existing) return existing

  const promise = validate().finally(() => inFlight.delete(key))
  inFlight.set(key, promise)
  const value = await promise
  cache.set(key, { expiresAt: Date.now() + 30_000, value })
  return value
}
```

`Date.now()` is acceptable in route/cache infrastructure but must not be introduced into pure engine logic. [VERIFIED: AGENTS.md; VERIFIED: CowardsGame_Technical_Architecture_Spec_V1.md]

### Pattern 3: Stale Visible, Not Submit-Ready

**What:** keep the last checker envelope visible while the current source identity differs, but derive submit readiness only from current identity. [VERIFIED: .planning/phases/241-checker-ergonomics-caching-and-boundary-monitors/241-CONTEXT.md]

**When to use:** Workshop editor display and status chip. [VERIFIED: apps/web/app/workshop/workshop-client.tsx:155]

```ts
// Source: apps/web/app/workshop/workshop-client.tsx current validationSource pattern
export const deriveDisplayedChecker = (input: {
  latest: WorkshopCheckerResponse | null
  currentIdentity: WorkshopCheckerResponse["cacheIdentity"] | null
  checking: boolean
}) => {
  if (!input.latest) return { status: input.checking ? "checking" : "not_checked" }
  if (!input.currentIdentity || checkerCacheKey(input.latest.cacheIdentity) !== checkerCacheKey(input.currentIdentity)) {
    return { ...input.latest, status: "stale" as const }
  }
  return input.latest
}
```

### Anti-Patterns to Avoid

- **Persisting checker results:** this can blur preflight diagnostics with provider provenance and is explicitly out of scope. [VERIFIED: .planning/phases/241-checker-ergonomics-caching-and-boundary-monitors/241-CONTEXT.md]
- **Using stale ready output for submit/save:** submit/save remains authoritative and currently validates through `/api/workshop/revisions`. [VERIFIED: apps/web/app/api/workshop/revisions/route.ts:47; VERIFIED: .planning/phases/241-checker-ergonomics-caching-and-boundary-monitors/241-CONTEXT.md]
- **Adding runtime package imports to app/API checker routes:** existing boundary monitors treat runtime package imports as forbidden once a file is strict-scanned. [VERIFIED: scripts/check-service-boundary-imports.ts:67]
- **Adding TinyGo to production source-format lists:** TinyGo is spike-only and current Workshop source formats exclude it. [VERIFIED: apps/web/lib/runtime-labels.ts:12; VERIFIED: .planning/artifacts/v1.33-tinygo-wasi-spike-evidence.md]

## Cache and Coalescing Options

| Option | Recommendation | Details |
|--------|----------------|---------|
| Client debounce only | Do not rely on it alone. [VERIFIED: .planning/phases/241-checker-ergonomics-caching-and-boundary-monitors/241-CONTEXT.md] | Current 500 ms debounce does not coalesce identical server/runtime-service calls and currently clears diagnostics on edit. [VERIFIED: apps/web/app/workshop/workshop-client.tsx:216; VERIFIED: apps/web/app/workshop/workshop-client.tsx:320] |
| Client in-memory result cache | Use as a UI optimization only. [VERIFIED: .planning/phases/241-checker-ergonomics-caching-and-boundary-monitors/241-CONTEXT.md] | Helps same-tab stale/ready display and manual button repeats, but cannot protect server/runtime-service across tabs or request retries. [VERIFIED: apps/web/app/workshop/workshop-client.tsx:197] |
| API in-flight coalescing | Use. [VERIFIED: .planning/phases/241-checker-ergonomics-caching-and-boundary-monitors/241-CONTEXT.md] | Best minimal choke point because all Workshop Validate source requests pass through `/api/workshop/validate`. [VERIFIED: apps/web/app/api/workshop/validate/route.ts:45] |
| API short TTL result cache | Use with a small bounded TTL. [VERIFIED: .planning/phases/241-checker-ergonomics-caching-and-boundary-monitors/241-CONTEXT.md] | Good for repeated identical Rust/Zig validation, but response must be clearly preflight and submit/save must revalidate. [VERIFIED: apps/web/app/api/workshop/revisions/route.ts:47] |
| Runtime-service cache | Defer unless API coalescing is insufficient. [VERIFIED: .planning/phases/241-checker-ergonomics-caching-and-boundary-monitors/241-CONTEXT.md] | Runtime-service currently owns provider validation/build and returns full metadata, so adding Workshop preflight cache there risks mixing provider proof and Workshop UX concerns. [VERIFIED: apps/runtime-service/src/server.ts:108; VERIFIED: .planning/phases/239-provider-grade-validate-source-parity/239-CONTEXT.md] |

**Recommended cache bounds:** start with process-local `maxEntries` around 64-128 and TTL around 30-60 seconds for all languages, with Rust/Zig benefiting most. [ASSUMED] The exact TTL is a tuning decision because the phase context delegates debounce duration and cache placement to the planner. [VERIFIED: .planning/phases/241-checker-ergonomics-caching-and-boundary-monitors/241-CONTEXT.md]

## Files To Touch

| File | Touch Type | Why |
|------|------------|-----|
| `apps/web/app/workshop/workshop-client.tsx` | Edit | Preserve last checker result, derive stale display, use language-aware debounce, avoid stale submit readiness, and wire manual Validate source through shared checker state. [VERIFIED: apps/web/app/workshop/workshop-client.tsx:155; VERIFIED: apps/web/app/workshop/workshop-client.tsx:197; VERIFIED: apps/web/app/workshop/workshop-client.tsx:216] |
| `apps/web/app/workshop/workshop-client-state.ts` or new `workshop-checker-state.ts` | Edit/Add | Extend state from `not-checked/checking/valid/invalid` to checker statuses and add identity comparison helpers outside React. [VERIFIED: apps/web/app/workshop/workshop-client-state.ts:6; VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md] |
| `apps/web/app/api/workshop/validate/route.ts` | Edit | Add schema-validated request handling, key computation, in-flight coalescing, short TTL cache, and public-safe response metadata. [VERIFIED: apps/web/app/api/workshop/validate/route.ts:45] |
| `apps/web/app/api/workshop/validate/checker-cache.ts` | Add | Keep cache/coalescing isolated and unit-testable. [VERIFIED: .planning/phases/241-checker-ergonomics-caching-and-boundary-monitors/241-CONTEXT.md] |
| `apps/web/app/api/workshop/checker-contract.ts` or existing Phase 239/240 utility | Add/Edit if missing | Centralize checker request/response schema, cache identity normalization, and redaction checks. [VERIFIED: .planning/phases/239-provider-grade-validate-source-parity/239-CONTEXT.md; VERIFIED: .planning/phases/240-language-diagnostic-ux-and-availability-states/240-CONTEXT.md] |
| `scripts/check-service-boundary-imports.ts` | Edit | Add Workshop validate/revisions checker routes to strict migrated files or add a checker-specific strict list. [VERIFIED: scripts/check-service-boundary-imports.ts:7; VERIFIED: scripts/check-service-boundary-imports.ts:67] |
| `scripts/check-v1-34-workshop-checker-boundary.ts` | Add | Focused monitor for TinyGo absence, no runtime imports in web/API checker files, checker schema validation utility presence, and submit/save revalidation. [VERIFIED: .planning/REQUIREMENTS.md] |
| `scripts/check-boundary-monitors.ts` | Edit | Call the focused Phase 241 monitor from the existing boundary monitor aggregation path. [VERIFIED: package.json; VERIFIED: scripts/check-boundary-monitors.ts] |
| `apps/web/lib/runtime-labels.test.ts` | Possibly edit | Existing test asserts production Workshop formats are TypeScript/Python/Rust/Zig and excludes TinyGo; expand only if new checker source-format utilities are introduced. [VERIFIED: apps/web/lib/runtime-labels.test.ts:54] |
| `apps/web/app/workshop/workshop-client.test.tsx` | Edit | Add focused helper tests for stale display vs submit readiness. [VERIFIED: apps/web/app/workshop/workshop-client.test.tsx] |
| `apps/web/app/api/workshop/validate/route.test.ts` | Add | Test coalescing/cache behavior with mocked fetch; avoid live runtime-service/compiler work. [VERIFIED: apps/web/app/api/workshop/validate/route.ts:37; VERIFIED: user request] |

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Hashing source for cache identity | Ad hoc string length or partial source matching | Existing source hash/provider fields from checker envelope; use Web/API `crypto` only if the envelope is not available yet. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md] | Partial matching risks stale or cross-language reuse. [VERIFIED: .planning/REQUIREMENTS.md] |
| Provider/build validation | Client-side compiler calls or React validation semantics | Runtime-service/provider validation. [VERIFIED: apps/runtime-service/src/server.ts:108] | Web/API must not execute Strategy source or compile hostile artifacts outside approved boundaries. [VERIFIED: AGENTS.md] |
| Boundary scanner | One-off `grep` only | Extend `scripts/check-service-boundary-imports.ts` and/or `scripts/check-boundary-monitors.ts`. [VERIFIED: scripts/check-service-boundary-imports.ts; VERIFIED: scripts/check-boundary-monitors.ts] | Existing monitor infrastructure already normalizes imports and known offenses. [VERIFIED: scripts/check-service-boundary-imports.ts:279] |
| Full service-backed proof | Large Playwright/live-service suite in Phase 241 | Focused unit/monitor tests; leave all-four-language service E2E to Phase 242. [VERIFIED: .planning/phases/241-checker-ergonomics-caching-and-boundary-monitors/241-CONTEXT.md; VERIFIED: .planning/ROADMAP.md] | User explicitly requested not to execute large test suites, and Phase 242 owns final proof. [VERIFIED: user request; VERIFIED: .planning/ROADMAP.md] |

**Key insight:** Phase 241 is an ergonomics and guardrail phase; the checker cache should reduce duplicate preflight cost but must not become a new validation authority. [VERIFIED: .planning/phases/241-checker-ergonomics-caching-and-boundary-monitors/241-CONTEXT.md]

## Common Pitfalls

### Pitfall 1: Stale Ready Becomes Submit-Ready
**What goes wrong:** the UI displays a stale `ready` result and enables submit/save for changed source. [VERIFIED: .planning/phases/241-checker-ergonomics-caching-and-boundary-monitors/241-CONTEXT.md]
**Why it happens:** stale display and readiness gating share the same variable. [VERIFIED: apps/web/app/workshop/workshop-client.tsx:155]
**How to avoid:** keep separate `displayedChecker` and `currentChecker`; only current identity can enable submit/save. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md]
**Warning signs:** tests pass for visible stale label but `canSubmitRevision` accepts stale `ready`. [VERIFIED: apps/web/app/workshop/workshop-client-state.ts:96]

### Pitfall 2: Cross-Language Cache Reuse
**What goes wrong:** identical source text in different languages reuses the wrong diagnostic. [VERIFIED: .planning/REQUIREMENTS.md]
**Why it happens:** cache key uses only source hash. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md]
**How to avoid:** include language id, source format, provider id, provider contract version, runtime ABI version, validation policy, and toolchain key. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md]
**Warning signs:** Python/Rust/Zig toggles show unchanged diagnostics after changing language selector. [VERIFIED: apps/web/app/workshop/workshop-client.tsx:155]

### Pitfall 3: Cache Stores Raw Runtime-Service Payload
**What goes wrong:** artifact bytes, signing proofs, raw diagnostics, or host details leak into public/default Workshop output. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md]
**Why it happens:** runtime-service success metadata can include artifacts internally. [VERIFIED: apps/runtime-service/src/server.ts:184; VERIFIED: packages/runtime-wasm-wasi/src/validation.ts:412]
**How to avoid:** cache only normalized public checker envelopes after schema validation/redaction. [VERIFIED: .planning/phases/239-provider-grade-validate-source-parity/239-CONTEXT.md]
**Warning signs:** cached JSON contains `bytesBase64`, `proof`, `stderr`, host paths, or raw compiler output. [VERIFIED: packages/runtime-wasm-wasi/src/validation.ts:416; VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md]

### Pitfall 4: Boundary Monitor Is Too Broad or Too Slow
**What goes wrong:** Phase 241 adds a monitor that effectively runs the whole suite or requires live services. [VERIFIED: user request]
**Why it happens:** existing `boundary:monitors` chains many commands, including Go parity and topology checks. [VERIFIED: package.json]
**How to avoid:** add a focused script with unit tests; wire it into aggregate boundary checks later without making Phase 241 verification depend on the aggregate command. [VERIFIED: package.json; VERIFIED: .planning/ROADMAP.md]
**Warning signs:** implementation plan asks to run `pnpm boundary:monitors` or full Playwright proof during this phase. [VERIFIED: package.json; VERIFIED: user request]

## Monitor and Test Targets

| Target | Test / Monitor | Command |
|--------|----------------|---------|
| Stale display and submit gating | Unit tests for checker state helpers: stale visible, stale not ready, checking while stale retains diagnostics, sourceFormat change invalidates readiness. [VERIFIED: apps/web/app/workshop/workshop-client-state.ts] | `pnpm --filter @cowards/web test -- workshop-client.test.tsx` [VERIFIED: apps/web/package.json] |
| API coalescing/cache | Route/cache unit tests with mocked provider validation/fetch: identical Rust/Zig requests coalesce to one call, cache hit avoids second call, cache miss on language/provider/source/policy/toolchain change. [VERIFIED: apps/web/app/api/workshop/validate/route.ts] | `pnpm --filter @cowards/web test -- app/api/workshop/validate/route.test.ts` [VERIFIED: apps/web/package.json] |
| TinyGo hidden production surfaces | Existing label/spec tests plus checker monitor assertion that no production checker source-format list includes `tinygo`. [VERIFIED: apps/web/lib/runtime-labels.test.ts:60; VERIFIED: packages/spec/src/spec.test.ts:424] | `pnpm --filter @cowards/web test -- runtime-labels.test.ts` and `pnpm --filter @cowards/spec test -- spec.test.ts` [VERIFIED: package scripts] |
| No runtime execution in web/API checker surfaces | Extend strict boundary import scanner or add focused monitor to reject `@cowards/runtime-*`, `node:vm`, direct compiler/spawn, runtime adapter, and `buildStrategyRevision` imports in Workshop checker API/client helper files. [VERIFIED: scripts/check-service-boundary-imports.ts:67] | `pnpm exec tsx scripts/check-v1-34-workshop-checker-boundary.ts` [VERIFIED: package.json supports tsx] |
| Submit/save remains authoritative | Route test or monitor asserts `/api/workshop/revisions` still calls runtime-service validation and does not accept checker cache/proof from request body as authoritative. [VERIFIED: apps/web/app/api/workshop/revisions/route.ts:47] | `pnpm --filter @cowards/web test -- app/api/workshop/revisions/route.test.ts` if added. [VERIFIED: apps/web/package.json] |
| Runtime-service/provider ownership | Spec-level assertions for provider records `executionOwner: "runtime-service"` and Rust/Zig ABI posture unchanged. [VERIFIED: packages/spec/src/runtime.ts:600; VERIFIED: packages/spec/src/runtime.ts:650] | `pnpm --filter @cowards/spec test -- spec.test.ts` [VERIFIED: packages/spec/package.json] |

Do not run full `pnpm test`, `pnpm test:fast`, `pnpm boundary:monitors`, or service-backed Playwright proof for this research task. [VERIFIED: user request; VERIFIED: package.json]

## Code Examples

### Cache Identity Fields

```ts
// Source: .planning/artifacts/v1.34-workshop-checker-contract.md
const requiredCheckerIdentityFields = [
  "languageId",
  "providerId",
  "sourceHash",
  "sourceBytes",
  "artifactHash",
  "artifactBytes",
  "providerContractVersion",
  "runtimeAbiVersion",
  "validationPolicy",
  "toolchainKey",
] as const
```

### Boundary Monitor Shape

```ts
// Source: scripts/check-service-boundary-imports.ts pattern
const checkerStrictFiles = [
  "apps/web/app/api/workshop/validate/route.ts",
  "apps/web/app/api/workshop/revisions/route.ts",
  "apps/web/app/workshop/workshop-checker-state.ts",
]

const forbiddenCheckerPatterns = [
  "@cowards/runtime-js",
  "@cowards/runtime-python",
  "@cowards/runtime-wasm-wasi",
  "node:vm",
  "buildStrategyRevision",
  "StrategyExecutionAdapter",
  "spawn(",
  "execFile",
]
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Validate source returns `{ validation }` with coarse valid/invalid UI. [VERIFIED: apps/web/app/api/workshop/validate/route.ts:78; VERIFIED: apps/web/app/workshop/workshop-client-state.ts:6] | Phase 238 contract requires `workshop-checker-v1.34` status, diagnostics, cache identity, provider metadata, and privacy fields. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md] | v1.34 Phase 238 planning artifact dated 2026-06-01. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md] | Phase 241 cache/stale logic should target the checker envelope, not legacy `{ validation }`. [VERIFIED: .planning/phases/239-provider-grade-validate-source-parity/239-CONTEXT.md] |
| Rust/Zig Validate source can call runtime-service per request with no coalescing. [VERIFIED: apps/web/app/api/workshop/validate/route.ts:37] | Phase 241 should add debounce plus in-flight coalescing/cache. [VERIFIED: .planning/phases/241-checker-ergonomics-caching-and-boundary-monitors/241-CONTEXT.md] | v1.34 Phase 241 context dated 2026-06-14. [VERIFIED: .planning/phases/241-checker-ergonomics-caching-and-boundary-monitors/241-CONTEXT.md] | Duplicate compile/toolchain churn becomes bounded for ordinary editing. [VERIFIED: packages/runtime-wasm-wasi/src/validation.ts:348; VERIFIED: packages/runtime-wasm-wasi/src/validation.ts:504] |
| TinyGo spike evidence exists as artifact/docs only. [VERIFIED: .planning/artifacts/v1.33-tinygo-wasi-spike-evidence.md] | TinyGo remains absent from production Workshop source formats and spec supported-language lookups. [VERIFIED: apps/web/lib/runtime-labels.ts:12; VERIFIED: packages/spec/src/spec.test.ts:424] | v1.33 shipped baseline and v1.34 hard boundary. [VERIFIED: .planning/PROJECT.md; VERIFIED: .planning/REQUIREMENTS.md] | Phase 241 monitor must prevent accidental production surfacing. [VERIFIED: .planning/REQUIREMENTS.md] |

**Deprecated/outdated:**
- Treating Rust/Zig unavailable runtime-service or toolchain failures as generic `TRANSPILE_FAILED` is a v1.34 gap, not the target end state. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-parity-matrix.md; VERIFIED: apps/web/app/api/workshop/validate/route.ts:20]
- Treating stale source mismatch as `not checked` only is insufficient for the locked Phase 241 UX decision. [VERIFIED: apps/web/app/workshop/workshop-client.tsx:155; VERIFIED: .planning/phases/241-checker-ergonomics-caching-and-boundary-monitors/241-CONTEXT.md]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Initial API TTL should be around 30-60 seconds and max entries around 64-128. [ASSUMED] | Cache and Coalescing Options | Too short may not reduce churn; too long may display stale infrastructure/toolchain availability longer than desired. |

## Open Questions

1. **Where did Phase 239/240 place the final checker schema utilities?** [VERIFIED: .planning/phases/239-provider-grade-validate-source-parity/239-CONTEXT.md]
   - What we know: Phase 239/240 planned shared checker envelope/diagnostic utilities outside React. [VERIFIED: .planning/phases/239-provider-grade-validate-source-parity/239-CONTEXT.md; VERIFIED: .planning/phases/240-language-diagnostic-ux-and-availability-states/240-CONTEXT.md]
   - What's unclear: this checkout still shows legacy `{ validation }` route behavior, so the actual utility filenames may not exist yet. [VERIFIED: apps/web/app/api/workshop/validate/route.ts:78]
   - Recommendation: planner should first detect Phase 239/240 outputs and reuse them; if missing, make Phase 241 depend on or include the minimal checker-contract utility needed for cache identity. [VERIFIED: .planning/ROADMAP.md]

2. **Should TypeScript/Python use the same TTL as Rust/Zig?** [VERIFIED: .planning/phases/241-checker-ergonomics-caching-and-boundary-monitors/241-CONTEXT.md]
   - What we know: Rust/Zig are the compile-heavy target. [VERIFIED: .planning/phases/241-checker-ergonomics-caching-and-boundary-monitors/241-CONTEXT.md]
   - What's unclear: exact UX duration is delegated to the planner. [VERIFIED: .planning/phases/241-checker-ergonomics-caching-and-boundary-monitors/241-CONTEXT.md]
   - Recommendation: one shared cache implementation with language-aware debounce defaults is simpler than separate cache implementations. [ASSUMED]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | Unit tests and scripts | yes [VERIFIED: command output] | `v24.15.0` [VERIFIED: command output] | none needed |
| pnpm | Workspace commands | yes [VERIFIED: command output] | `11.1.2` [VERIFIED: command output] | none needed |
| Rust `rustc` | Live Rust provider validation | yes [VERIFIED: command output] | `1.95.0` [VERIFIED: command output] | Mock runtime-service/fetch for Phase 241 route/cache tests. [VERIFIED: user request] |
| Zig | Live Zig provider validation | yes [VERIFIED: command output] | `0.16.0` [VERIFIED: command output] | Mock runtime-service/fetch for Phase 241 route/cache tests. [VERIFIED: user request] |
| Docker | Full local topology or broader monitor chains | yes [VERIFIED: command output] | `29.4.0` [VERIFIED: command output] | Not needed for focused Phase 241 tests. [VERIFIED: user request] |

**Missing dependencies with no fallback:** none found for focused Phase 241 research and unit/monitor planning. [VERIFIED: command output]

**Missing dependencies with fallback:** no missing dependencies found; live Rust/Zig compiler use should still be avoided in default Phase 241 unit tests by stubbing provider fetch. [VERIFIED: command output; VERIFIED: user request]

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest `^4.1.6` locally, current registry `4.1.8`; Playwright `^1.60.0` locally/current for optional browser proof. [VERIFIED: package.json; VERIFIED: npm registry] |
| Config file | `vitest.config.ts` and `playwright.config.ts`. [VERIFIED: vitest.config.ts; VERIFIED: playwright.config.ts] |
| Quick run command | `pnpm --filter @cowards/web test -- workshop-client.test.tsx app/api/workshop/validate/route.test.ts` [VERIFIED: apps/web/package.json] |
| Full suite command | Do not use during Phase 241 research; broader commands exist as `pnpm test`, `pnpm test:fast`, and `pnpm boundary:monitors`. [VERIFIED: package.json; VERIFIED: user request] |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| CHECKERG-01 | Rust/Zig duplicate Validate source calls are debounced/coalesced/cached without stale flicker. [VERIFIED: .planning/REQUIREMENTS.md] | unit/integration with mocked fetch | `pnpm --filter @cowards/web test -- app/api/workshop/validate/route.test.ts` [VERIFIED: apps/web/package.json] | no, Wave 0 [VERIFIED: codebase grep] |
| CHECKERG-02 | Cache identity changes on language/provider/source/artifact/policy/toolchain fields. [VERIFIED: .planning/REQUIREMENTS.md] | unit | `pnpm --filter @cowards/web test -- app/api/workshop/validate/route.test.ts` [VERIFIED: apps/web/package.json] | no, Wave 0 [VERIFIED: codebase grep] |
| CHECKERG-03 | UI separates checking, checked, unavailable, failed, stale, and ready; stale not submit-ready; TinyGo absent. [VERIFIED: .planning/REQUIREMENTS.md] | unit | `pnpm --filter @cowards/web test -- workshop-client.test.tsx runtime-labels.test.ts` [VERIFIED: apps/web/package.json] | partial: client helper and runtime-label tests exist. [VERIFIED: apps/web/app/workshop/workshop-client.test.tsx; VERIFIED: apps/web/lib/runtime-labels.test.ts] |
| CHECKERG-04 | Web/API/Go checker surfaces treat responses as validated data and do not execute Strategy source outside runtime-service/provider boundary. [VERIFIED: .planning/REQUIREMENTS.md] | monitor/unit | `pnpm exec tsx scripts/check-v1-34-workshop-checker-boundary.ts` [VERIFIED: package.json] | no, Wave 0 [VERIFIED: codebase grep] |

### Sampling Rate

- **Per task commit:** focused Vitest target for changed helper/route plus the focused checker boundary monitor. [VERIFIED: package.json; VERIFIED: user request]
- **Per wave merge:** package-level `pnpm --filter @cowards/web test -- ...changed tests...` and `pnpm --filter @cowards/spec test -- spec.test.ts` if registry fields change. [VERIFIED: apps/web/package.json; VERIFIED: packages/spec/package.json]
- **Phase gate:** focused tests plus no large suite; Phase 242 owns service-backed all-language proof and final privacy scans. [VERIFIED: .planning/ROADMAP.md; VERIFIED: user request]

### Wave 0 Gaps

- [ ] `apps/web/app/api/workshop/validate/checker-cache.ts` - coalescing/cache utility. [VERIFIED: codebase grep]
- [ ] `apps/web/app/api/workshop/validate/route.test.ts` - route/cache/coalescing identity tests. [VERIFIED: codebase grep]
- [ ] `apps/web/app/workshop/workshop-checker-state.ts` or equivalent - stale/current status helpers. [VERIFIED: apps/web/app/workshop/workshop-client-state.ts]
- [ ] `scripts/check-v1-34-workshop-checker-boundary.ts` - focused Phase 241 monitor. [VERIFIED: codebase grep]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | no direct Phase 241 auth change [VERIFIED: .planning/ROADMAP.md] | Keep existing account/session routes unchanged. [VERIFIED: apps/web/app/api/account/revisions/save/route.ts] |
| V3 Session Management | no direct Phase 241 session change [VERIFIED: .planning/ROADMAP.md] | No new session storage in checker cache. [VERIFIED: .planning/phases/241-checker-ergonomics-caching-and-boundary-monitors/241-CONTEXT.md] |
| V4 Access Control | yes, indirectly for submit/save authority [VERIFIED: .planning/REQUIREMENTS.md] | Do not let preflight checker cache authorize submit/save; `/api/workshop/revisions` revalidates. [VERIFIED: apps/web/app/api/workshop/revisions/route.ts:47] |
| V5 Input Validation | yes [VERIFIED: .planning/REQUIREMENTS.md] | Schema-validate checker requests/responses and normalize public-safe diagnostics before UI use. [VERIFIED: .planning/phases/239-provider-grade-validate-source-parity/239-CONTEXT.md] |
| V6 Cryptography | yes for provider proof integrity, but Phase 241 must not create a new proof authority. [VERIFIED: apps/runtime-service/src/server.ts:75; VERIFIED: .planning/phases/241-checker-ergonomics-caching-and-boundary-monitors/241-CONTEXT.md] | Provider proof remains runtime-service/provider-owned; checker cache stores only public preflight envelope. [VERIFIED: apps/runtime-service/src/server.ts:75; VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md] |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Stale preflight result accepted as current readiness | Tampering / Elevation of privilege | Bind readiness to current cache identity and make submit/save revalidate. [VERIFIED: apps/web/app/workshop/workshop-client.tsx:155; VERIFIED: apps/web/app/api/workshop/revisions/route.ts:47] |
| Cross-language cache poisoning | Tampering | Include language id, provider id, source hash/bytes, policy, ABI, and toolchain key in cache identity. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md] |
| Private diagnostic/artifact leak from cached response | Information disclosure | Cache only public-safe normalized envelopes and scan for excluded fields. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md] |
| Strategy execution boundary creep into web/API | Elevation of privilege | Strict import/runtime monitor for Workshop checker files; runtime-service remains execution owner. [VERIFIED: scripts/check-service-boundary-imports.ts:67; VERIFIED: packages/spec/src/runtime.ts:600] |
| TinyGo production surfacing | Spoofing / Policy drift | Keep production source-format registry limited to TypeScript/Python/Rust/Zig and monitor for `tinygo` in production checker surfaces. [VERIFIED: apps/web/lib/runtime-labels.ts:12; VERIFIED: packages/spec/src/spec.test.ts:424] |

## Risks and Blockers

| Risk / Blocker | Status | Mitigation |
|----------------|--------|------------|
| Phase 239/240 implementation may change route/contract filenames. [VERIFIED: .planning/STATE.md] | Open integration risk. [VERIFIED: codebase grep] | Planner should start with a code scan for checker contract utilities and adapt file names. [VERIFIED: .planning/phases/239-provider-grade-validate-source-parity/239-CONTEXT.md] |
| In-memory cache in Next route modules is process-local and may reset across dev/hot reload or multi-instance deployments. [ASSUMED] | Acceptable because cache is explicitly ephemeral and non-authoritative. [VERIFIED: .planning/phases/241-checker-ergonomics-caching-and-boundary-monitors/241-CONTEXT.md] | Do not persist; submit/save revalidates. [VERIFIED: apps/web/app/api/workshop/revisions/route.ts:47] |
| Toolchain availability may change during TTL. [VERIFIED: packages/runtime-wasm-wasi/src/validation.ts:231; VERIFIED: packages/runtime-wasm-wasi/src/validation.ts:244] | Low for short TTL, but possible. [ASSUMED] | Include toolchain key/compatibility metadata and keep TTL short. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md] |
| Full `boundary:monitors` is too large for Phase 241 verification. [VERIFIED: package.json; VERIFIED: user request] | Not a blocker. [VERIFIED: user request] | Use focused monitor and targeted Vitest commands. [VERIFIED: package.json] |

## Sources

### Primary (HIGH confidence)

- `AGENTS.md` - project non-negotiables, testing expectations, and build order. [VERIFIED: AGENTS.md]
- `.planning/PROJECT.md` - v1.34 milestone baseline and hard boundaries. [VERIFIED: .planning/PROJECT.md]
- `.planning/REQUIREMENTS.md` - CHECKERG and boundary requirements. [VERIFIED: .planning/REQUIREMENTS.md]
- `.planning/ROADMAP.md` - Phase 241 scope and success criteria. [VERIFIED: .planning/ROADMAP.md]
- `.planning/phases/241-checker-ergonomics-caching-and-boundary-monitors/241-CONTEXT.md` - locked Phase 241 decisions. [VERIFIED: .planning/phases/241-checker-ergonomics-caching-and-boundary-monitors/241-CONTEXT.md]
- `.planning/artifacts/v1.34-workshop-checker-contract.md` - checker envelope, cache identity, stale semantics, privacy exclusions. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md]
- `apps/web/app/workshop/workshop-client.tsx` - current debounce, validation freshness, stale clearing, and submit wiring. [VERIFIED: apps/web/app/workshop/workshop-client.tsx]
- `apps/web/app/api/workshop/validate/route.ts` - current Validate source route. [VERIFIED: apps/web/app/api/workshop/validate/route.ts]
- `apps/web/app/api/workshop/revisions/route.ts` - authoritative submit/save validation route. [VERIFIED: apps/web/app/api/workshop/revisions/route.ts]
- `packages/runtime-wasm-wasi/src/validation.ts` - Rust/Zig compile/toolchain-heavy validation. [VERIFIED: packages/runtime-wasm-wasi/src/validation.ts]
- `packages/spec/src/runtime.ts` - provider registry, ABI version, supported production language records, TinyGo absence. [VERIFIED: packages/spec/src/runtime.ts]
- `scripts/check-service-boundary-imports.ts` and `scripts/check-boundary-monitors.ts` - existing monitor infrastructure. [VERIFIED: scripts/check-service-boundary-imports.ts; VERIFIED: scripts/check-boundary-monitors.ts]

### Secondary (MEDIUM confidence)

- npm registry version lookups for Next.js, React, Vitest, Playwright, and TypeScript on 2026-06-14. [VERIFIED: npm registry]
- Local command probes for Node, pnpm, rustc, Zig, and Docker on 2026-06-14. [VERIFIED: command output]

### Tertiary (LOW confidence)

- Cache TTL/max-entry starting recommendation, because it is a tuning heuristic rather than a locked project decision. [ASSUMED]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - existing package files and npm registry versions were checked. [VERIFIED: package.json; VERIFIED: npm registry]
- Architecture: HIGH - route/client/runtime boundaries are repo-local and match planning/spec constraints. [VERIFIED: apps/web/app/api/workshop/validate/route.ts; VERIFIED: CowardsGame_Technical_Architecture_Spec_V1.md]
- Pitfalls: HIGH for stale/cache/boundary risks derived from code and locked requirements; MEDIUM for TTL tuning. [VERIFIED: .planning/REQUIREMENTS.md; ASSUMED]

**Research date:** 2026-06-14 [VERIFIED: system date]
**Valid until:** 2026-06-21 for package/version details and local environment probes; repo-local architecture remains valid until Phase 239/240/241 implementation changes these files. [VERIFIED: npm registry; VERIFIED: .planning/STATE.md]
