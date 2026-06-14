# Phase 240: Language Diagnostic UX and Availability States - Research

**Researched:** 2026-06-14 [VERIFIED: current_date]
**Domain:** Workshop checker diagnostic mapping, availability states, and public-safe UX for Python, Rust, and Zig. [VERIFIED: .planning/ROADMAP.md]
**Confidence:** HIGH for repo-local files, requirements, and mapping strategy; MEDIUM for final implementation sequencing because Phase 239 has not been executed in the inspected worktree. [VERIFIED: .planning/STATE.md; VERIFIED: apps/web/app/api/workshop/validate/route.ts]

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

Copied from `.planning/phases/240-language-diagnostic-ux-and-availability-states/240-CONTEXT.md`. [VERIFIED: .planning/phases/240-language-diagnostic-ux-and-availability-states/240-CONTEXT.md]

### Diagnostic Detail Level
- **D-01:** Diagnostics should expose actionable categories, short public-safe messages, constraints, remediation, references, and safe structured line/column when available.
- **D-02:** Default/public Workshop output must not expose raw compiler/runtime diagnostics, host paths, package paths, env values, artifact bytes, source text, tokens, DB details, StrategyMemory, SoldierMemory, objective payloads, or private runtime internals.
- **D-03:** Minimal status-only output is insufficient for Workshop; users need actionable guidance before submit/save.

### Unavailable State Copy
- **D-04:** Runtime-service and toolchain unavailable states should use a shared calm copy template plus language-specific next steps.
- **D-05:** Unavailable copy must communicate that checking could not complete and that the Strategy has not been judged invalid/unsafe.
- **D-06:** Language-specific next steps should be concise and concrete, such as retrying later, starting runtime-service, or configuring the Rust/Zig WASI toolchain.

### Diagnostic Mapping Ownership
- **D-07:** Diagnostic category, actionability, and redaction mapping should live in shared checker utilities/schema outside React components.
- **D-08:** API responses, submit/save normalization, and UI display should consume the same normalized diagnostic contract to avoid drift.
- **D-09:** React components should render already-normalized public checker data rather than deciding provider/runtime failure semantics.

### Line, Column, and References
- **D-10:** Include line, column, and reference fields only when they come from structured public-safe validation fields.
- **D-11:** Do not parse raw compiler/runtime diagnostic text to recover locations or references.
- **D-12:** Rust/Zig diagnostics may omit line/column if safe structured locations are unavailable.

### the agent's Discretion
- Planner may choose exact shared package/module location for checker diagnostic mapping, provided React components remain display-only.
- Planner may tune copy wording for brevity and consistency with existing Workshop tone, provided unavailable states remain calm and non-blaming.

### Deferred Ideas (OUT OF SCOPE)
- Rust/Zig debounce/cache/coalescing belongs to Phase 241.
- Four-language proof and privacy scans belong to Phase 242.
- Raw diagnostics may only be considered later behind an existing private/test-only gate; they are out of scope for default/public Workshop output.

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
| --- | --- | --- |
| CHECKDIAG-01 | Python Workshop diagnostics distinguish policy/capability, forbidden import, package/dependency, syntax/build, provenance, runtime-service unavailable, timeout/limit, and invalid output/schema failures using actionable, public-safe messages. [VERIFIED: .planning/REQUIREMENTS.md] | Map Python host issue codes and provider availability into `WorkshopCheckerDiagnostic.category`; preserve structured line/column only from `python_validation_host.py`. [VERIFIED: packages/runtime-python/src/validation.ts; VERIFIED: packages/runtime-python/src/python_validation_host.py] |
| CHECKDIAG-02 | Rust Workshop diagnostics distinguish compile, artifact/provenance, forbidden WASI/import, runtime-service, toolchain unavailable, timeout/limit, and invalid output/schema failures using actionable, public-safe messages. [VERIFIED: .planning/REQUIREMENTS.md] | Add structured Rust compile/toolchain/import classification before app normalization; current Rust validator collapses compile/toolchain into `TRANSPILE_FAILED`. [VERIFIED: packages/runtime-wasm-wasi/src/validation.ts] |
| CHECKDIAG-03 | Zig Workshop diagnostics distinguish compile, artifact/provenance, forbidden WASI/import, no-std/helper misuse, runtime-service, toolchain unavailable, timeout/limit, and invalid output/schema failures using actionable, public-safe messages. [VERIFIED: .planning/REQUIREMENTS.md] | Add Zig no-std/helper and toolchain categories from structured gates; current Zig source gate already identifies missing `_start`/`main` and forbidden std/helper patterns. [VERIFIED: packages/runtime-wasm-wasi/src/validation.ts] |
| CHECKDIAG-04 | Toolchain-unavailable and runtime-service-unavailable states are honest, calm, non-scary, and explain what the player can do next without implying their Strategy is unsafe or broken. [VERIFIED: .planning/REQUIREMENTS.md] | Treat unavailable states as checker statuses, not invalid-source errors; Phase 238 contract defines `runtime_service_unavailable`, `toolchain_unavailable`, and `system_unavailable`. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md] |
| CHECKDIAG-05 | Diagnostics never expose Strategy source, raw diagnostics, artifact bytes, host paths, env values, package paths, tokens, DB details, private runtime internals, StrategyMemory, SoldierMemory, or objective payloads in public/default Workshop output. [VERIFIED: .planning/REQUIREMENTS.md] | Remove default UI dependence on raw `message`/`forbiddenPatterns` when they are not normalized as public-safe checker diagnostics. [VERIFIED: apps/web/app/workshop/workshop-client.tsx; VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md] |

</phase_requirements>

## Summary

Phase 240 should implement a shared diagnostic mapper for the `workshop-checker-v1.34` envelope, not a React-side interpretation layer. [VERIFIED: .planning/phases/240-language-diagnostic-ux-and-availability-states/240-CONTEXT.md] The mapper should convert provider validation reports and availability states into public-safe categories, actionability, short messages, constraints, remediations, references, and optional structured line/column fields. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md]

The inspected worktree still has the pre-Phase-239 `/api/workshop/validate` shape: it returns `{ validation }`, routes TypeScript/Rust/Zig to runtime-service only when configured, and routes Python to local `workshopServer.validateSource`. [VERIFIED: apps/web/app/api/workshop/validate/route.ts] Phase 240 therefore has a sequencing dependency: the planner should start with a Wave 0 check for the Phase 239 checker envelope and fail early if the shared envelope is absent. [VERIFIED: .planning/phases/239-provider-grade-validate-source-parity/239-CONTEXT.md]

**Primary recommendation:** Put checker diagnostic schemas and pure mapping utilities in `packages/spec` or another non-React shared module, have `/api/workshop/validate` and submit/save normalization emit already-normalized public diagnostics, and keep `apps/web/app/workshop/workshop-client.tsx` display-only. [VERIFIED: .planning/phases/240-language-diagnostic-ux-and-availability-states/240-CONTEXT.md; VERIFIED: packages/spec/src/index.ts; VERIFIED: apps/web/app/workshop/workshop-client.tsx]

## Project Constraints (from AGENTS.md)

- The engine must remain pure, deterministic, serializable, and side-effect free. [VERIFIED: AGENTS.md]
- Game rules must not be placed in React components. [VERIFIED: AGENTS.md]
- User Strategy code must not execute in the web/API process or in Go. [VERIFIED: AGENTS.md]
- Engine logic must not use `Math.random`, `Date.now`, system time, filesystem, network, or database access. [VERIFIED: AGENTS.md]
- Node `vm` must not be used as a security boundary for untrusted Strategy code. [VERIFIED: AGENTS.md]
- Strategy code must be treated as hostile and runtime boundaries must be schema-validated. [VERIFIED: AGENTS.md]
- Canonical terminology must preserve Soldier, Match, Phase, Round, Activation, Cycle, Action, Advance, STONE, FALLEN, and Chronicle. [VERIFIED: AGENTS.md]
- Strategy Revisions are immutable once submitted for Match or MatchSet play. [VERIFIED: AGENTS.md]
- Public replay output must not expose Strategy source, StrategyMemory, SoldierMemory, or objective payloads by default. [VERIFIED: AGENTS.md]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
| --- | --- | --- | --- |
| Provider validation/build signal production | Runtime-service / provider packages | Toolchains | Runtime-service validates TypeScript/Python/Rust/Zig provider paths and provider packages own language validation/build helpers. [VERIFIED: apps/runtime-service/src/server.ts; VERIFIED: packages/runtime-python/src/validation.ts; VERIFIED: packages/runtime-wasm-wasi/src/validation.ts] |
| Public checker envelope and redaction | API / Backend | Shared spec/schema | Phase 239 locks `/api/workshop/validate` as envelope owner and app/API as normalization/redaction owner. [VERIFIED: .planning/phases/239-provider-grade-validate-source-parity/239-CONTEXT.md] |
| Diagnostic category/actionability mapping | Shared schema/utilities | API / Backend | Phase 240 locks mapping outside React and shared by API responses, submit/save normalization, and UI display. [VERIFIED: .planning/phases/240-language-diagnostic-ux-and-availability-states/240-CONTEXT.md] |
| Workshop rendering | Browser / Client | API / Backend | React should render normalized public checker data and not decide provider/runtime failure semantics. [VERIFIED: .planning/phases/240-language-diagnostic-ux-and-availability-states/240-CONTEXT.md; VERIFIED: apps/web/app/workshop/workshop-client.tsx] |
| Privacy enforcement | API / Backend | Browser / Client tests | Default/public checker output must exclude source, raw diagnostics, artifact bytes, host paths, env values, package paths, tokens, DB details, private runtime internals, memory, and objective payloads. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md] |

## Standard Stack

### Core

| Library / Module | Version | Purpose | Why Standard |
| --- | --- | --- | --- |
| TypeScript workspace packages | TypeScript 6.0.3 installed in `package.json`; npm registry reports 6.0.3 modified 2026-04-16. [VERIFIED: package.json; VERIFIED: npm registry] | Shared types, schemas, API routes, runtime-service code, and Workshop UI. [VERIFIED: package.json; VERIFIED: packages/spec/src/index.ts] | Existing repo architecture is TypeScript monorepo with `apps/*` and `packages/*`. [VERIFIED: pnpm-workspace.yaml] |
| Zod via `@cowards/spec` | `zod` ^4.4.3 in `packages/spec`; npm registry reports 4.4.3 modified 2026-05-04. [VERIFIED: packages/spec/package.json; VERIFIED: npm registry] | Schema validation for trust-boundary DTOs and checker envelope. [VERIFIED: packages/spec/src/schemas.ts; VERIFIED: CowardsGame_Technical_Architecture_Spec_V1.md] | Technical architecture requires Zod validation for runtime outputs crossing trust boundaries. [VERIFIED: CowardsGame_Technical_Architecture_Spec_V1.md] |
| Next.js App Router | `next` ^16.2.6 in `apps/web`; npm registry reports 16.2.9 modified 2026-06-13. [VERIFIED: apps/web/package.json; VERIFIED: npm registry] | Workshop page and `/api/workshop/*` routes. [VERIFIED: apps/web/app/workshop/workshop-client.tsx; VERIFIED: apps/web/app/api/workshop/validate/route.ts] | Existing web app uses Next routes and client components. [VERIFIED: apps/web/package.json] |
| React | `react` ^19.2.6 in `apps/web`; npm registry reports 19.2.7 modified 2026-06-12. [VERIFIED: apps/web/package.json; VERIFIED: npm registry] | Workshop diagnostic rendering. [VERIFIED: apps/web/app/workshop/workshop-client.tsx] | Existing Workshop client is a React client component. [VERIFIED: apps/web/app/workshop/workshop-client.tsx] |
| Vitest | `vitest` ^4.1.6 in root; npm registry reports 4.1.8 modified 2026-06-12. [VERIFIED: package.json; VERIFIED: npm registry] | Focused unit/integration tests for mapping, API route, runtime-service, and UI helpers. [VERIFIED: vitest.config.ts; VERIFIED: apps/web/vitest.config.ts] | Existing repo tests are Vitest `*.test.ts` / `*.spec.ts`. [VERIFIED: vitest.config.ts] |

### Supporting

| Tool | Version / Availability | Purpose | When to Use |
| --- | --- | --- | --- |
| Node | v24.15.0 available locally. [VERIFIED: `node --version`] | Run TypeScript tooling and runtime-service tests. [VERIFIED: package.json] | Required for focused Vitest and route tests. [VERIFIED: package.json] |
| pnpm | 11.1.2 in `packageManager` and available locally. [VERIFIED: package.json; VERIFIED: `pnpm --version`] | Workspace package manager. [VERIFIED: pnpm-workspace.yaml] | Use package filters for focused commands. [VERIFIED: package.json] |
| Python | Python 3.9.6 available locally. [VERIFIED: `python3 --version`] | Python validation host availability checks. [VERIFIED: packages/runtime-python/src/validation.ts] | Needed for Python diagnostic tests if they invoke provider validation. [VERIFIED: packages/runtime-python/src/validation.ts] |
| rustc | rustc 1.95.0 available locally. [VERIFIED: `rustc --version`] | Rust WASI compile-path diagnostics. [VERIFIED: packages/runtime-wasm-wasi/src/validation.ts] | Use only in focused Rust diagnostic tests or service-backed proof, not broad suites. [VERIFIED: packages/runtime-wasm-wasi/src/validation.ts] |
| Zig | Zig 0.16.0 available locally. [VERIFIED: `zig version`] | Zig WASI compile-path diagnostics. [VERIFIED: packages/runtime-wasm-wasi/src/validation.ts] | Use only in focused Zig diagnostic tests or service-backed proof, not broad suites. [VERIFIED: packages/runtime-wasm-wasi/src/validation.ts] |
| Wasmtime | Wasmtime 45.0.0 available locally. [VERIFIED: `wasmtime --version`] | WASM/WASI runtime proof if tests execute compiled artifacts. [VERIFIED: packages/runtime-wasm-wasi/src/validation.ts] | Phase 240 should not need runtime execution unless adding invalid output/schema classification coverage. [VERIFIED: .planning/REQUIREMENTS.md] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
| --- | --- | --- |
| Shared spec/schema mapper | React-side diagnostic mapping | Rejected because Phase 240 locks React as display-only and mapping outside React. [VERIFIED: .planning/phases/240-language-diagnostic-ux-and-availability-states/240-CONTEXT.md] |
| Structured category metadata | Regex parsing compiler stderr/stdout | Rejected because raw diagnostic parsing is out of scope and risks host path/package path leakage. [VERIFIED: .planning/phases/240-language-diagnostic-ux-and-availability-states/240-CONTEXT.md; VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md] |
| New UI-only package | Existing `packages/spec` and `apps/web/app/workshop` helpers | Prefer existing workspace modules because `@cowards/spec` already exports schemas/types and Workshop has existing display helpers. [VERIFIED: packages/spec/src/index.ts; VERIFIED: apps/web/app/workshop/workshop-client-state.ts] |

**Installation:** No new packages are recommended for Phase 240. [VERIFIED: package.json; VERIFIED: packages/spec/package.json; VERIFIED: apps/web/package.json]

## Diagnostic Mapping Strategy

### Recommended Shape

Define these shared artifacts before changing UI rendering. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md]

```ts
// Source: .planning/artifacts/v1.34-workshop-checker-contract.md
type WorkshopCheckerDiagnosticCategory =
  | "source_too_large"
  | "syntax_or_parse"
  | "strategy_api_shape"
  | "forbidden_capability"
  | "forbidden_import"
  | "package_or_dependency"
  | "compile_failed"
  | "artifact_missing"
  | "artifact_stale"
  | "artifact_mismatch"
  | "provenance_missing"
  | "provenance_mismatch"
  | "provenance_unverifiable"
  | "provider_proof_invalid"
  | "runtime_service_unavailable"
  | "toolchain_unavailable"
  | "timeout_or_limit"
  | "invalid_output_schema"
  | "unsupported_provider"
  | "system_unavailable"
```

Use `WorkshopCheckerDiagnostic.code` as a stable public code such as `PYTHON_FORBIDDEN_IMPORT`, `RUST_TOOLCHAIN_UNAVAILABLE`, or `ZIG_NO_STD_HELPER_MISUSE`; do not reuse raw compiler text as code. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md; VERIFIED: packages/runtime-wasm-wasi/src/validation.ts]

### Python Mapping

| Input Signal | Category | Actionability | Public Copy Strategy |
| --- | --- | --- | --- |
| `SOURCE_TOO_LARGE` | `source_too_large` | `edit_source` | State the byte limit and suggest removing unused code. [VERIFIED: packages/runtime-python/src/validation.ts] |
| `IMPORT_NOT_ALLOWED` | `forbidden_import` | `edit_source` | Say Python Strategies must be self-contained and cannot import modules. [VERIFIED: packages/runtime-python/src/validation.ts; VERIFIED: packages/runtime-python/src/python_validation_host.py] |
| `FORBIDDEN_PATTERN` / `FORBIDDEN_CAPABILITY` | `forbidden_capability` unless the structured pattern is package/import-only | `edit_source` | Use existing constraint/remediation, but only expose allowlisted pattern labels. [VERIFIED: packages/runtime-python/src/validation.ts] |
| `TRANSPILE_FAILED` with structured `pattern: "syntax"` or `pattern: "compile"` | `syntax_or_parse` | `edit_source` | Include safe line/column from Python host when present. [VERIFIED: packages/runtime-python/src/python_validation_host.py] |
| `MISSING_SELECT_ACTIVATIONS`, `MISSING_SOLDIER_BRAIN`, `ASYNC_METHOD_NOT_ALLOWED` | `strategy_api_shape` | `edit_source` | Use existing API requirement remediation. [VERIFIED: packages/runtime-python/src/validation.ts] |
| Runtime-service missing/unreachable/malformed | `runtime_service_unavailable` or `system_unavailable` | `check_runtime_service` or `retry_later` | Say checking could not complete and the Strategy has not been judged invalid. [VERIFIED: .planning/phases/239-provider-grade-validate-source-parity/239-CONTEXT.md; VERIFIED: .planning/phases/240-language-diagnostic-ux-and-availability-states/240-CONTEXT.md] |
| Provenance/artifact mismatch from Phase 239 envelope | `provenance_mismatch`, `provenance_unverifiable`, or `provider_proof_invalid` | `retry_later` or `contact_operator` | Say validation proof could not be verified without exposing proof/signing internals. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md] |

### Rust Mapping

| Input Signal | Category | Actionability | Public Copy Strategy |
| --- | --- | --- | --- |
| Source size exceeds limit | `source_too_large` | `edit_source` | State that Rust source or artifact exceeds the configured limit. [VERIFIED: packages/runtime-wasm-wasi/src/validation.ts] |
| Missing `fn main()` | `strategy_api_shape` | `edit_source` | Point to the Rust WASI starter and stdin/stdout JSON envelope. [VERIFIED: packages/runtime-wasm-wasi/src/validation.ts] |
| Source-level forbidden patterns such as `std::fs`, `std::net`, `std::time`, `env::var`, `extern crate`, or Cargo dependency markers | `forbidden_capability` or `package_or_dependency` | `edit_source` | Preserve deterministic restriction copy and hide raw source snippets. [VERIFIED: packages/runtime-wasm-wasi/src/validation.ts] |
| WASM import table parse failure | `compile_failed` or `artifact_mismatch` based on Phase 239 artifact state | `edit_source` or `retry_later` | Say the compiled artifact could not be inspected. [VERIFIED: packages/runtime-wasm-wasi/src/validation.ts] |
| Forbidden WASI import | `forbidden_import` | `edit_source` | Say only approved WASI Preview 1 stdin/stdout/process-exit/empty-environment imports are allowed. [VERIFIED: packages/runtime-wasm-wasi/src/validation.ts] |
| `spawnSync("rustc", ...)` returns ENOENT or toolchain probe fails | `toolchain_unavailable` | `install_or_configure_toolchain` | Say the Rust WASI checker needs a local Rust WASI toolchain and the draft was not judged invalid. [VERIFIED: packages/runtime-wasm-wasi/src/validation.ts; VERIFIED: .planning/phases/240-language-diagnostic-ux-and-availability-states/240-CONTEXT.md] |
| `rustc` exits nonzero after toolchain exists | `compile_failed` | `edit_source` | Use calm compile-failed copy and do not include stderr. [VERIFIED: packages/runtime-wasm-wasi/src/validation.ts] |

### Zig Mapping

| Input Signal | Category | Actionability | Public Copy Strategy |
| --- | --- | --- | --- |
| Source size exceeds limit | `source_too_large` | `edit_source` | State that Zig source or artifact exceeds the configured limit. [VERIFIED: packages/runtime-wasm-wasi/src/validation.ts] |
| Missing `pub fn main()` / `export fn _start()` | `strategy_api_shape` or `compile_failed` | `edit_source` | Point to the Zig WASI starter and stdin/stdout JSON envelope. [VERIFIED: packages/runtime-wasm-wasi/src/validation.ts] |
| `@import("std")`, `std.fs`, `std.net`, `std.time`, `std.crypto.random`, `std.process.*`, `@embedFile` | `forbidden_capability` or `no_std_helper_misuse` represented as `forbidden_capability` with `code: "ZIG_NO_STD_HELPER_MISUSE"` | `edit_source` | Say Zig Strategies must use the approved no-std/helper pattern and deterministic input data. [VERIFIED: packages/runtime-wasm-wasi/src/validation.ts; VERIFIED: .planning/REQUIREMENTS.md] |
| Forbidden WASI import after compile | `forbidden_import` | `edit_source` | Say the artifact imports a forbidden WASI capability without exposing raw import dumps. [VERIFIED: packages/runtime-wasm-wasi/src/validation.ts] |
| Zig executable missing or probe fails | `toolchain_unavailable` | `install_or_configure_toolchain` | Say the Zig WASI checker needs the local Zig toolchain and the draft was not judged invalid. [VERIFIED: packages/runtime-wasm-wasi/src/validation.ts; VERIFIED: .planning/artifacts/v1.22-zig-readiness-evidence.md] |
| Zig compile exits nonzero after toolchain exists | `compile_failed` | `edit_source` | Use compile-failed copy and do not expose stderr, cache paths, or source snippets. [VERIFIED: packages/runtime-wasm-wasi/src/validation.ts; VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md] |

## Files To Touch

| File | Change | Reason |
| --- | --- | --- |
| `packages/spec/src/workshop-checker.ts` | Add `WorkshopCheckerResponse` / `WorkshopCheckerDiagnostic` types, Zod schemas, category/actionability/status enums, privacy exclusion constants, and pure mapping helpers. [ASSUMED] | `packages/spec` already exports shared schemas/types and is importable from app/runtime code. [VERIFIED: packages/spec/src/index.ts; VERIFIED: packages/spec/src/schemas.ts] |
| `packages/spec/src/index.ts` | Export the new checker module. [ASSUMED] | Existing spec public API re-exports modules from `src/index.ts`. [VERIFIED: packages/spec/src/index.ts] |
| `apps/web/app/api/workshop/validate/route.ts` | Consume Phase 239 checker envelope and normalize diagnostics with shared mapper; do not return raw `{ validation }` as the primary UI contract. [VERIFIED: apps/web/app/api/workshop/validate/route.ts; VERIFIED: .planning/phases/239-provider-grade-validate-source-parity/239-CONTEXT.md] | Phase 239 assigns envelope ownership to this route. [VERIFIED: .planning/phases/239-provider-grade-validate-source-parity/239-CONTEXT.md] |
| `apps/web/app/api/workshop/revisions/route.ts` | Reuse the same public diagnostic normalization for submit/save failures where the route surfaces validation failures. [VERIFIED: apps/web/app/api/workshop/revisions/route.ts; VERIFIED: .planning/phases/240-language-diagnostic-ux-and-availability-states/240-CONTEXT.md] | CHECKDIAG requires consistent public-safe messages before submit/save. [VERIFIED: .planning/REQUIREMENTS.md] |
| `packages/runtime-wasm-wasi/src/validation.ts` | Add structured, non-raw failure kind metadata for `toolchain_unavailable`, `compile_failed`, forbidden WASI imports, artifact inspection, and Zig no-std/helper misuse. [VERIFIED: packages/runtime-wasm-wasi/src/validation.ts] | Current Rust/Zig compile/toolchain paths collapse into `TRANSPILE_FAILED`. [VERIFIED: packages/runtime-wasm-wasi/src/validation.ts] |
| `packages/runtime-python/src/validation.ts` | Ensure Python issue metadata maps package/dependency, syntax/build, forbidden import, and capability categories without exposing unsafe patterns. [VERIFIED: packages/runtime-python/src/validation.ts] | Python host already provides structured issue codes, pattern, line, and column. [VERIFIED: packages/runtime-python/src/python_validation_host.py] |
| `apps/web/app/workshop/workshop-client-state.ts` | Replace legacy validation state helpers with checker status, copy, actionability, and display helper functions. [VERIFIED: apps/web/app/workshop/workshop-client-state.ts] | Existing helpers only support `not-checked`, `checking`, `valid`, and `invalid`. [VERIFIED: apps/web/app/workshop/workshop-client-state.ts] |
| `apps/web/app/workshop/workshop-client.tsx` | Render normalized checker status/diagnostics, unavailable states, and public-safe advanced details; stop rendering `forbiddenPatterns` values by default. [VERIFIED: apps/web/app/workshop/workshop-client.tsx] | Current advanced details display `forbiddenPatterns`, and current issue rows render legacy validation issues. [VERIFIED: apps/web/app/workshop/workshop-client.tsx] |
| `apps/runtime-service/src/server.ts` | If Phase 239 did not already add structured invalid-response metadata, expose provider-safe failure kind fields without Workshop-specific copy. [VERIFIED: apps/runtime-service/src/server.ts; VERIFIED: .planning/phases/239-provider-grade-validate-source-parity/239-CONTEXT.md] | Runtime-service currently returns invalid provider responses with `validation` but no availability/toolchain metadata. [VERIFIED: apps/runtime-service/src/server.ts] |

## UI Impacts

- The validation panel should show checker statuses equivalent to `not_checked`, `checking`, `ready`, `invalid`, `stale`, `runtime_service_unavailable`, `toolchain_unavailable`, and `system_unavailable`. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md]
- `runtime_service_unavailable` and `toolchain_unavailable` should disable submit/save but should not use “Invalid draft” copy. [VERIFIED: .planning/phases/240-language-diagnostic-ux-and-availability-states/240-CONTEXT.md]
- Diagnostic rows should use category/actionability labels and public messages from `WorkshopCheckerDiagnostic`, with legacy raw codes relegated to `data-diagnostic-code` if useful for tests. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md; VERIFIED: apps/web/app/workshop/workshop-client.tsx]
- Advanced details should show source hash/bytes, provider id, provider contract version, artifact hash/bytes when present, ABI posture, and public availability reasons, but should not show artifact bytes, signing proof, raw diagnostics, source text, or raw `forbiddenPatterns`. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md; VERIFIED: apps/web/app/workshop/workshop-client.tsx]
- Stale display should continue to compare checked source/sourceFormat to current draft, and Phase 241 will expand cache identity. [VERIFIED: apps/web/app/workshop/workshop-client.tsx; VERIFIED: .planning/phases/241-checker-ergonomics-caching-and-boundary-monitors/241-CONTEXT.md]

## Public-Safe Privacy Risks

| Risk | Why It Matters | Mitigation |
| --- | --- | --- |
| Raw compiler/runtime diagnostics can contain host paths, cache paths, package paths, or source snippets. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md] | Rust/Zig compile uses temp dirs and toolchain output is not currently exposed, but parsing it would create leakage risk. [VERIFIED: packages/runtime-wasm-wasi/src/validation.ts] | Do not parse or display raw diagnostics; add structured failure kinds at provider boundaries. [VERIFIED: .planning/phases/240-language-diagnostic-ux-and-availability-states/240-CONTEXT.md] |
| Current UI displays `forbiddenPatterns` in advanced details. [VERIFIED: apps/web/app/workshop/workshop-client.tsx] | Python host can flag strings such as `/users/`, `/home/`, `token`, and `database_url`; default/public output excludes host paths, env values, and tokens. [VERIFIED: packages/runtime-python/src/python_validation_host.py; VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md] | Display safe categories/counts instead of raw forbidden pattern values. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md] |
| Runtime-service success metadata includes artifacts and provider proof internals. [VERIFIED: apps/runtime-service/src/server.ts] | Default/public checker output must not expose artifact bytes, signing proofs, or private runtime internals. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md] | API normalization should strip `bytesBase64`, proof strings, and raw metadata before UI consumption. [VERIFIED: .planning/phases/239-provider-grade-validate-source-parity/239-CONTEXT.md] |
| Unavailable states can look like user-authored unsafe code if mapped to invalid. [VERIFIED: .planning/phases/240-language-diagnostic-ux-and-availability-states/240-CONTEXT.md] | Requirements say unavailable copy must not imply the Strategy is unsafe or broken. [VERIFIED: .planning/REQUIREMENTS.md] | Use status-specific copy with `retry_later`, `check_runtime_service`, or `install_or_configure_toolchain` actionability. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md] |

## Architecture Patterns

### System Architecture Diagram

```text
Workshop editor source
  -> /api/workshop/validate
  -> Phase 239 provider-grade validation envelope
  -> shared checker diagnostic mapper
      -> ready
      -> invalid source/policy/compile/provenance diagnostic
      -> runtime-service unavailable
      -> toolchain unavailable
      -> system unavailable
  -> Workshop client renders normalized status and diagnostics
  -> submit/save routes reuse public normalization for failed gates
```

The diagram reflects the locked envelope ownership and display-only React boundary. [VERIFIED: .planning/phases/239-provider-grade-validate-source-parity/239-CONTEXT.md; VERIFIED: .planning/phases/240-language-diagnostic-ux-and-availability-states/240-CONTEXT.md]

### Recommended Project Structure

```text
packages/spec/src/
├── workshop-checker.ts          # checker envelope schemas, categories, mapping helpers [ASSUMED]
├── index.ts                     # exports checker module [VERIFIED: packages/spec/src/index.ts]
└── spec.test.ts                 # schema/mapping unit coverage or split new test [VERIFIED: packages/spec/src/spec.test.ts]

apps/web/app/workshop/
├── workshop-client-state.ts     # status/copy/display helpers [VERIFIED: apps/web/app/workshop/workshop-client-state.ts]
├── workshop-client.tsx          # render normalized checker data [VERIFIED: apps/web/app/workshop/workshop-client.tsx]
└── workshop-client.test.tsx     # focused helper tests [VERIFIED: apps/web/app/workshop/workshop-client.test.tsx]
```

### Pattern: Normalize Before Rendering

**What:** Route/runtime-service outputs should be schema-checked and converted to public `WorkshopCheckerDiagnostic` objects before the client renders them. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md]

**When to use:** Use for Validate source, submit/save public failures, unavailable states, and any provider diagnostic displayed in Workshop. [VERIFIED: .planning/REQUIREMENTS.md]

### Anti-Patterns to Avoid

- **Raw diagnostic parsing:** Do not parse Rust/Zig stderr/stdout for locations because Phase 240 locks line/column to structured-safe fields only. [VERIFIED: .planning/phases/240-language-diagnostic-ux-and-availability-states/240-CONTEXT.md]
- **React-side semantic mapping:** Do not make React decide whether `TRANSPILE_FAILED` means compile, toolchain, or system failure. [VERIFIED: .planning/phases/240-language-diagnostic-ux-and-availability-states/240-CONTEXT.md]
- **Unavailable-as-invalid:** Do not mark runtime-service or toolchain outages as invalid Strategy source. [VERIFIED: .planning/phases/239-provider-grade-validate-source-parity/239-CONTEXT.md; VERIFIED: .planning/phases/240-language-diagnostic-ux-and-availability-states/240-CONTEXT.md]
- **Raw forbidden pattern display:** Do not display raw `forbiddenPatterns` values in default Workshop output. [VERIFIED: apps/web/app/workshop/workshop-client.tsx; VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
| --- | --- | --- | --- |
| Trust-boundary checker validation | Ad hoc `as` casts from runtime-service JSON | Zod schemas in `@cowards/spec` | Architecture requires Zod validation across trust boundaries. [VERIFIED: CowardsGame_Technical_Architecture_Spec_V1.md; VERIFIED: packages/spec/src/schemas.ts] |
| Compiler diagnostic sanitization | Regex scrubbers over raw compiler output | Structured failure kinds and public messages | Raw diagnostics are excluded from default/public checker output. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md] |
| Availability classification | Reusing `TRANSPILE_FAILED` for outages | Explicit checker statuses and categories | Phase 238 contract defines unavailable statuses and categories. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md] |
| Language labels/provider IDs | New hard-coded UI labels | `getSupportedStrategyLanguageBySourceFormat` and provider registry | Provider records already define language labels, provider ids, contract versions, ABI posture, and public semantics. [VERIFIED: packages/spec/src/runtime.ts] |

**Key insight:** Phase 240 is a normalization and presentation phase; creating a second diagnostic model in React would conflict with the locked shared-contract direction. [VERIFIED: .planning/phases/240-language-diagnostic-ux-and-availability-states/240-CONTEXT.md]

## Common Pitfalls

### Pitfall 1: Depending On Phase 239 Without Checking It
**What goes wrong:** Phase 240 code assumes `workshop-checker-v1.34` exists, but the current route still returns `{ validation }`. [VERIFIED: apps/web/app/api/workshop/validate/route.ts]
**How to avoid:** Add a Wave 0 planning task that verifies Phase 239 landed the envelope before Phase 240 edits start. [VERIFIED: .planning/phases/239-provider-grade-validate-source-parity/239-CONTEXT.md]

### Pitfall 2: Losing Toolchain Unavailable Semantics
**What goes wrong:** Rust/Zig missing compiler, compiler error, timeout, and import failure all become `TRANSPILE_FAILED`. [VERIFIED: packages/runtime-wasm-wasi/src/validation.ts]
**How to avoid:** Add non-raw structured failure kinds in the provider validation result before mapping to checker diagnostics. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md]

### Pitfall 3: Leaking Forbidden Patterns
**What goes wrong:** The current UI displays `forbiddenPatterns`, and Python host patterns include path/token/env-like markers. [VERIFIED: apps/web/app/workshop/workshop-client.tsx; VERIFIED: packages/runtime-python/src/python_validation_host.py]
**How to avoid:** Render category and safe remediation only; display pattern values only if mapped through an allowlist. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md]

### Pitfall 4: Treating Diagnostics As Public Because They Are Useful
**What goes wrong:** Raw compiler/runtime detail can improve debugging but violates the public/default privacy boundary. [VERIFIED: .planning/phases/240-language-diagnostic-ux-and-availability-states/240-CONTEXT.md]
**How to avoid:** Keep raw diagnostics out of v1.34 default/public Workshop; private/test-only raw gates are deferred. [VERIFIED: .planning/phases/240-language-diagnostic-ux-and-availability-states/240-CONTEXT.md]

## Code Examples

### Public Diagnostic Builder

```ts
// Source: .planning/artifacts/v1.34-workshop-checker-contract.md
export const checkerDiagnostic = (input: {
  code: string
  category: WorkshopCheckerDiagnosticCategory
  severity: "info" | "warning" | "error"
  actionability: WorkshopCheckerDiagnosticActionability
  message: string
  constraint?: string | null
  remediation?: string | null
  reference?: string | null
  line?: number | null
  column?: number | null
}): WorkshopCheckerDiagnostic => ({
  code: input.code,
  category: input.category,
  severity: input.severity,
  actionability: input.actionability,
  message: input.message,
  constraint: input.constraint ?? null,
  remediation: input.remediation ?? null,
  reference: input.reference ?? null,
  line: input.line ?? null,
  column: input.column ?? null,
  publicSafe: true,
})
```

### Toolchain Unavailable Copy

```ts
// Source: .planning/phases/240-language-diagnostic-ux-and-availability-states/240-CONTEXT.md
{
  code: "RUST_TOOLCHAIN_UNAVAILABLE",
  category: "toolchain_unavailable",
  severity: "warning",
  actionability: "install_or_configure_toolchain",
  message: "Rust checking could not run because the WASI toolchain is unavailable.",
  constraint: "Rust Strategies are checked through the Rust WASI provider toolchain.",
  remediation: "Configure the Rust wasm32-wasip1 toolchain, then retry validation.",
  reference: "examples/rust-wasi-exhibition-beta",
  line: null,
  column: null,
  publicSafe: true,
}
```

## State of the Art

| Old Approach | Current / Required Approach | When Changed | Impact |
| --- | --- | --- | --- |
| Workshop Validate source returns `{ validation }`. [VERIFIED: apps/web/app/api/workshop/validate/route.ts] | Phase 239 should return `workshop-checker-v1.34`; Phase 240 should map diagnostics inside that contract. [VERIFIED: .planning/phases/239-provider-grade-validate-source-parity/239-CONTEXT.md; VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md] | Planned for v1.34 Phases 239-240. [VERIFIED: .planning/ROADMAP.md] | Planner must sequence Phase 240 after envelope availability. [VERIFIED: .planning/STATE.md] |
| Rust/Zig compile/toolchain issues collapse into `TRANSPILE_FAILED`. [VERIFIED: packages/runtime-wasm-wasi/src/validation.ts] | Distinguish compile, toolchain unavailable, forbidden WASI/import, artifact/provenance, timeout/limit, invalid output/schema. [VERIFIED: .planning/REQUIREMENTS.md] | Phase 240. [VERIFIED: .planning/ROADMAP.md] | Provider validators need structured public-safe categories. [VERIFIED: .planning/phases/240-language-diagnostic-ux-and-availability-states/240-CONTEXT.md] |
| Python local Workshop validation differs from submit-grade provider validation. [VERIFIED: apps/web/app/api/workshop/validate/route.ts; VERIFIED: apps/web/app/api/workshop/revisions/route.ts] | Phase 239 should route Python Validate source through provider semantics. [VERIFIED: .planning/phases/239-provider-grade-validate-source-parity/239-CONTEXT.md] | Phase 239. [VERIFIED: .planning/ROADMAP.md] | Phase 240 mapping should assume Python diagnostics arrive through the same public checker envelope. [VERIFIED: .planning/phases/240-language-diagnostic-ux-and-availability-states/240-CONTEXT.md] |

**Deprecated/outdated:** Displaying raw `forbiddenPatterns` in default Workshop advanced details is inconsistent with v1.34 public-safe checker exclusions. [VERIFIED: apps/web/app/workshop/workshop-client.tsx; VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
| --- | --- | --- | --- |
| A1 | New checker schemas/mappers should live in `packages/spec/src/workshop-checker.ts`. | Files To Touch | If maintainers prefer app-local ownership, planner should place the pure module under `apps/web/app/workshop/` and keep it non-React. |

## Open Questions

1. **Did Phase 239 already land before implementation begins?** [VERIFIED: .planning/STATE.md]
   - What we know: The inspected worktree still shows the old `{ validation }` route. [VERIFIED: apps/web/app/api/workshop/validate/route.ts]
   - What's unclear: Whether Phase 239 will be executed before Phase 240 in the same planning cycle. [VERIFIED: .planning/STATE.md]
   - Recommendation: Add a Wave 0 prerequisite check and block implementation if the checker envelope is absent. [VERIFIED: .planning/phases/239-provider-grade-validate-source-parity/239-CONTEXT.md]

2. **Should structured provider failure kind live in validation reports or runtime-service invalid responses?** [VERIFIED: packages/spec/src/types.ts; VERIFIED: apps/runtime-service/src/server.ts]
   - What we know: `StrategyRevisionValidationIssue.code` is a closed legacy enum, while `WorkshopCheckerDiagnostic.code` is an open string. [VERIFIED: packages/spec/src/types.ts; VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md]
   - What's unclear: Whether maintainers want to extend legacy validation issue schema or keep checker-only categories separate. [ASSUMED]
   - Recommendation: Keep checker categories separate and add provider-safe supplemental failure metadata rather than expanding legacy issue codes unless Phase 239 already chose otherwise. [ASSUMED]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
| --- | --- | --- | --- | --- |
| Node | TypeScript tooling and Vitest | yes | v24.15.0 [VERIFIED: `node --version`] | none needed |
| pnpm | Workspace scripts | yes | 11.1.2 [VERIFIED: `pnpm --version`; VERIFIED: package.json] | none needed |
| Python | Python provider diagnostics | yes | 3.9.6 [VERIFIED: `python3 --version`] | Route unavailable if provider host unavailable. [VERIFIED: packages/runtime-python/src/validation.ts] |
| rustc | Rust toolchain diagnostics | yes | 1.95.0 [VERIFIED: `rustc --version`] | Toolchain unavailable checker status. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md] |
| Zig | Zig toolchain diagnostics | yes | 0.16.0 [VERIFIED: `zig version`] | Toolchain unavailable checker status. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md] |
| Wasmtime | WASM/WASI runtime proof if needed | yes | 45.0.0 [VERIFIED: `wasmtime --version`] | Phase 240 should not require broad runtime proof. [VERIFIED: .planning/ROADMAP.md] |

**Missing dependencies with no fallback:** None found for research and focused diagnostic planning. [VERIFIED: local environment audit]

**Missing dependencies with fallback:** None found in the audited local environment. [VERIFIED: local environment audit]

## Validation Architecture

### Test Framework

| Property | Value |
| --- | --- |
| Framework | Vitest 4.1.6 in root package; npm registry latest checked as 4.1.8. [VERIFIED: package.json; VERIFIED: npm registry] |
| Config file | `vitest.config.ts` includes `**/*.test.{ts,tsx}` and `**/*.spec.{ts,tsx}`. [VERIFIED: vitest.config.ts] |
| Quick run command | `pnpm --filter @cowards/spec test -- workshop-checker` or `pnpm --filter @cowards/web test -- workshop-client` depending on final file placement. [VERIFIED: packages/spec/package.json; VERIFIED: apps/web/package.json] |
| Full suite command | Do not run during research; normal repo command is `pnpm test`. [VERIFIED: package.json] |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
| --- | --- | --- | --- | --- |
| CHECKDIAG-01 | Python category mapping and safe line/column handling. [VERIFIED: .planning/REQUIREMENTS.md] | unit | `pnpm --filter @cowards/spec test -- workshop-checker` [ASSUMED] | No; Wave 0 if new file. [VERIFIED: packages/spec/src] |
| CHECKDIAG-02 | Rust compile/toolchain/import categories. [VERIFIED: .planning/REQUIREMENTS.md] | unit/integration | `pnpm --filter @cowards/runtime-wasm-wasi test -- validation` [VERIFIED: packages/runtime-wasm-wasi/package.json] | Existing package test file covers adapter, not checker categories. [VERIFIED: packages/runtime-wasm-wasi/src/wasm-wasi-subprocess-adapter.test.ts] |
| CHECKDIAG-03 | Zig compile/toolchain/no-std/import categories. [VERIFIED: .planning/REQUIREMENTS.md] | unit/integration | `pnpm --filter @cowards/runtime-wasm-wasi test -- validation` [VERIFIED: packages/runtime-wasm-wasi/package.json] | Existing package test file covers adapter, not checker categories. [VERIFIED: packages/runtime-wasm-wasi/src/wasm-wasi-subprocess-adapter.test.ts] |
| CHECKDIAG-04 | Calm unavailable state copy and actionability. [VERIFIED: .planning/REQUIREMENTS.md] | unit/UI helper | `pnpm --filter @cowards/web test -- workshop-client` [VERIFIED: apps/web/package.json] | Existing `workshop-client.test.tsx` covers legacy helper labels only. [VERIFIED: apps/web/app/workshop/workshop-client.test.tsx] |
| CHECKDIAG-05 | Public-safe redaction of raw diagnostics, source, artifacts, paths, tokens, memory, objective payloads. [VERIFIED: .planning/REQUIREMENTS.md] | unit/API route | `pnpm --filter @cowards/web test -- workshop` [VERIFIED: apps/web/package.json] | Needs focused additions for checker output. [VERIFIED: apps/web/app/workshop/workshop-client.test.tsx] |

### Sampling Rate

- **Per task commit:** Run focused Vitest files only, not `pnpm test`. [VERIFIED: user request; VERIFIED: package.json]
- **Per wave merge:** Run affected package tests such as `pnpm --filter @cowards/spec test`, `pnpm --filter @cowards/web test -- workshop-client`, and runtime-wasm-wasi validation tests if touched. [VERIFIED: package.json; VERIFIED: packages/spec/package.json; VERIFIED: apps/web/package.json; VERIFIED: packages/runtime-wasm-wasi/package.json]
- **Phase gate:** Defer service-backed E2E and broad privacy proof to Phase 242 unless Phase 240 changes demand a small smoke proof. [VERIFIED: .planning/ROADMAP.md]

### Wave 0 Gaps

- [ ] `packages/spec/src/workshop-checker.ts` and companion tests if schema/mapping goes in spec. [ASSUMED]
- [ ] Focused Rust/Zig provider classification tests if `packages/runtime-wasm-wasi/src/validation.ts` changes. [VERIFIED: packages/runtime-wasm-wasi/src/validation.ts]
- [ ] Workshop helper tests for unavailable status copy and public-safe diagnostic rendering. [VERIFIED: apps/web/app/workshop/workshop-client.test.tsx]
- [ ] API route tests for normalized checker diagnostics and privacy exclusions if Phase 239 did not add them. [VERIFIED: apps/web/app/api/workshop/validate/route.ts]

## Recommended Tests

- Add pure mapping tests for Python codes: `IMPORT_NOT_ALLOWED`, `FORBIDDEN_PATTERN`, `FORBIDDEN_CAPABILITY`, `TRANSPILE_FAILED` with syntax line/column, `MISSING_SELECT_ACTIVATIONS`, and runtime-service unavailable. [VERIFIED: packages/runtime-python/src/validation.ts; VERIFIED: packages/runtime-python/src/python_validation_host.py]
- Add pure mapping tests for Rust: missing `fn main`, forbidden source capability, forbidden WASI import, rustc unavailable, rustc compile failure, artifact oversized, and artifact inspection failure. [VERIFIED: packages/runtime-wasm-wasi/src/validation.ts]
- Add pure mapping tests for Zig: missing `_start`/`main`, forbidden std/helper usage, Zig unavailable, Zig compile failure, forbidden WASI import, artifact oversized, and artifact inspection failure. [VERIFIED: packages/runtime-wasm-wasi/src/validation.ts]
- Add Workshop UI helper tests for `runtime_service_unavailable`, `toolchain_unavailable`, `system_unavailable`, `invalid`, `ready`, and `stale` status copy. [VERIFIED: apps/web/app/workshop/workshop-client-state.ts]
- Add privacy assertions that normalized checker JSON and rendered rows do not contain sample private markers: `bytesBase64`, `hmac-sha256`, `/Users/`, `/home/`, `site-packages`, `DATABASE_URL`, `token`, `StrategyMemory`, `SoldierMemory`, `objective`. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md; VERIFIED: packages/runtime-python/src/python_validation_host.py]
- Do not execute large suites during Phase 240 planning or research. [VERIFIED: user request]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
| --- | --- | --- |
| V2 Authentication | no direct Phase 240 change | Workshop checker diagnostics are not an auth feature. [VERIFIED: .planning/ROADMAP.md] |
| V3 Session Management | no direct Phase 240 change | No session behavior is in Phase 240 scope. [VERIFIED: .planning/ROADMAP.md] |
| V4 Access Control | yes, for public/default vs private/test-only diagnostic surfaces | Default/public output must exclude private source, memory, objective payloads, raw diagnostics, and internals. [VERIFIED: .planning/REQUIREMENTS.md] |
| V5 Input Validation | yes | Use Zod schemas and treat runtime-service checker responses as untrusted data. [VERIFIED: CowardsGame_Technical_Architecture_Spec_V1.md; VERIFIED: .planning/phases/239-provider-grade-validate-source-parity/239-CONTEXT.md] |
| V6 Cryptography | yes, but do not expose proofs | Provider validation proof exists internally and default checker output must not expose signing proofs. [VERIFIED: apps/runtime-service/src/server.ts; VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md] |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
| --- | --- | --- |
| Raw diagnostic leakage of host paths/env/package paths | Information Disclosure | Structured public diagnostics only; no raw diagnostic parsing/display. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md] |
| Trusting runtime-service JSON without validation | Tampering | Zod-validate checker envelope before UI consumption. [VERIFIED: CowardsGame_Technical_Architecture_Spec_V1.md; VERIFIED: .planning/phases/239-provider-grade-validate-source-parity/239-CONTEXT.md] |
| Strategy execution boundary creep | Elevation of Privilege | Keep hostile validation/build semantics behind runtime-service/provider boundaries; do not execute Strategy source in web/API/Go. [VERIFIED: AGENTS.md; VERIFIED: .planning/REQUIREMENTS.md] |
| Public exposure of provider proof/artifact bytes | Information Disclosure | Strip `proof`, `bytesBase64`, source text, raw metadata, and private runtime internals at API normalization. [VERIFIED: apps/runtime-service/src/server.ts; VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md] |

## Blockers

| Blocker | Severity | Evidence | Planner Action |
| --- | --- | --- | --- |
| Phase 239 envelope is not present in inspected code. | HIGH | `/api/workshop/validate` returns `{ validation }` today. [VERIFIED: apps/web/app/api/workshop/validate/route.ts] | Add Wave 0 dependency check; do not implement Phase 240 until the route returns/normalizes `workshop-checker-v1.34`. [VERIFIED: .planning/phases/239-provider-grade-validate-source-parity/239-CONTEXT.md] |
| Rust/Zig toolchain unavailable cannot be reliably distinguished from compile failure using only current legacy issue code. | HIGH | Rust/Zig compile failures currently return `TRANSPILE_FAILED` for `result.error` and nonzero status. [VERIFIED: packages/runtime-wasm-wasi/src/validation.ts] | Add structured failure kind before public mapping; do not parse stderr. [VERIFIED: .planning/phases/240-language-diagnostic-ux-and-availability-states/240-CONTEXT.md] |
| Current advanced UI displays raw forbidden pattern values. | MEDIUM | Workshop details render `validation.forbiddenPatterns.join(", ")`. [VERIFIED: apps/web/app/workshop/workshop-client.tsx] | Replace with safe category/count or allowlisted public labels. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md] |

## Sources

### Primary (HIGH confidence)

- `AGENTS.md` - project non-negotiables and testing expectations. [VERIFIED: AGENTS.md]
- `.planning/PROJECT.md` - v1.34 current milestone and runtime/language baseline. [VERIFIED: .planning/PROJECT.md]
- `.planning/REQUIREMENTS.md` - CHECKDIAG requirements and hard boundaries. [VERIFIED: .planning/REQUIREMENTS.md]
- `.planning/ROADMAP.md` - Phase 240 scope and success criteria. [VERIFIED: .planning/ROADMAP.md]
- `.planning/STATE.md` - current milestone state and sequencing. [VERIFIED: .planning/STATE.md]
- `.planning/phases/238-workshop-checker-path-inventory-and-public-contract/238-CONTEXT.md` - checker contract decisions. [VERIFIED: .planning/phases/238-workshop-checker-path-inventory-and-public-contract/238-CONTEXT.md]
- `.planning/phases/239-provider-grade-validate-source-parity/239-CONTEXT.md` - Phase 239 envelope and unavailable semantics decisions. [VERIFIED: .planning/phases/239-provider-grade-validate-source-parity/239-CONTEXT.md]
- `.planning/phases/240-language-diagnostic-ux-and-availability-states/240-CONTEXT.md` - locked Phase 240 diagnostic decisions. [VERIFIED: .planning/phases/240-language-diagnostic-ux-and-availability-states/240-CONTEXT.md]
- `.planning/artifacts/v1.34-workshop-checker-contract.md` - target envelope, categories, statuses, privacy rules. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md]
- `apps/web/app/api/workshop/validate/route.ts` - current Validate source behavior. [VERIFIED: apps/web/app/api/workshop/validate/route.ts]
- `apps/web/app/workshop/workshop-client.tsx` and `workshop-client-state.ts` - current UI state and diagnostic rendering. [VERIFIED: apps/web/app/workshop/workshop-client.tsx; VERIFIED: apps/web/app/workshop/workshop-client-state.ts]
- `packages/runtime-python/src/validation.ts` and `python_validation_host.py` - Python validator signals. [VERIFIED: packages/runtime-python/src/validation.ts; VERIFIED: packages/runtime-python/src/python_validation_host.py]
- `packages/runtime-wasm-wasi/src/validation.ts` - Rust/Zig validator/toolchain/import signals. [VERIFIED: packages/runtime-wasm-wasi/src/validation.ts]
- `apps/runtime-service/src/server.ts` - runtime-service validation response shape and provider proof metadata. [VERIFIED: apps/runtime-service/src/server.ts]

### Secondary (MEDIUM confidence)

- npm registry version checks for `next`, `react`, `zod`, `vitest`, and `typescript`. [VERIFIED: npm registry]
- Local command version checks for Node, pnpm, Python, rustc, Zig, and Wasmtime. [VERIFIED: local environment audit]

### Tertiary (LOW confidence)

- None. [VERIFIED: sources list]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - package versions and registry checks were verified in this session. [VERIFIED: package.json; VERIFIED: npm registry]
- Architecture: HIGH - phase contexts and current code paths agree on ownership boundaries. [VERIFIED: .planning/phases/239-provider-grade-validate-source-parity/239-CONTEXT.md; VERIFIED: .planning/phases/240-language-diagnostic-ux-and-availability-states/240-CONTEXT.md; VERIFIED: apps/web/app/api/workshop/validate/route.ts]
- Diagnostic mapping: HIGH for Python and current Rust/Zig signals; MEDIUM for exact implementation shape because Phase 239 may introduce envelope/schema choices first. [VERIFIED: packages/runtime-python/src/validation.ts; VERIFIED: packages/runtime-wasm-wasi/src/validation.ts; VERIFIED: .planning/STATE.md]
- Pitfalls/privacy: HIGH - privacy exclusions are explicit in requirements and current UI has identified raw-pattern display. [VERIFIED: .planning/REQUIREMENTS.md; VERIFIED: apps/web/app/workshop/workshop-client.tsx]

**Research date:** 2026-06-14 [VERIFIED: current_date]
**Valid until:** 2026-06-21 for phase sequencing and npm registry versions; repo-local findings remain valid until Phase 239/240 code changes land. [ASSUMED]
