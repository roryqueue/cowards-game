# Feature Research: v1.7 Runtime and Backend Boundary Stabilization

**Date:** 2026-05-22
**Milestone:** v1.7 Runtime and Backend Boundary Stabilization

## Table Stakes

### Service Boundary Contract

- Typed endpoint/client coverage for auth/session, account Strategy Revisions, Workshop validation/submission/source retrieval, exhibitions, MatchSets, replay metadata, analytics profiles/runs/exports, ladders, player profiles, public Strategy cards, governance/public pages, and health.
- Route handlers use a typed app service/client layer instead of importing persistence functions directly.
- DTO schemas live at the boundary and enforce privacy exclusions by default.
- Public DTOs never expose Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, or private runtime internals.
- Minimal contract fixtures prove existing Next pages still receive equivalent data after service indirection.

### Strategy Runtime ABI

- Language-neutral JSON request/response schema for `selectActivations` and `soldierBrain`.
- Version negotiation fields: ABI version, strategy language, runtime adapter id/version, rules/spec compatibility, engine version, and supported capabilities.
- Memory/source/objective/package metadata limits are explicit and schema-validated.
- Runtime violations remain distinct from system failures.
- Timeout, stdout/stderr cap, malformed IPC, process exit, signal, invalid output, forbidden capability, oversized output, and thrown exception behavior are specified.
- Deterministic capability restrictions explicitly forbid filesystem, network, system time, randomness, environment inheritance, shell access, and live model inference inside Strategy execution.

### Golden Parity Harness

- Golden fixtures cover engine outcomes, Chronicle projection, scoring, MatchSet summaries, analytics summaries, replay deep links, exports, runtime failures, privacy redaction, deterministic ordering, and DTO/API shape.
- Fixtures are stable enough for TypeScript, Go, and non-JS runtime adapters to consume.
- Tests compare canonical parsed values and known hashes where hashing is part of the contract.
- Failure fixtures distinguish Strategy failure from system failure.

### Runtime Adapter Registry

- Registry lists supported languages/adapters and their production readiness.
- Strategy Revisions carry language/runtime adapter metadata as first-class immutable fields.
- MatchSet compatibility keys include adapter id/version and language/runtime version.
- JS/TS remains fully enabled; any second runtime remains explicitly experimental.

### One Non-JS Runtime Spike

- One tiny second-language Strategy adapter exercises the same ABI.
- Python is the likely best first spike for player reach; Go remains a reasonable alternative for backend/runtime symmetry.
- Spike includes valid and failure fixtures, but not full Workshop authoring support or package dependency management.

### Go Backend Spike

- Minimal Go service implements health and one or two read-only endpoints from the frozen contract.
- Candidate endpoints: public MatchSet summary, replay metadata, analytics summary, or health.
- Spike proves schema access, DTO parity, fixture compatibility, and client integration without moving orchestration.

## Differentiators

- Contract-first work makes a future Go backend possible without destabilizing the web app.
- Language-neutral ABI makes multi-language Strategies credible while preserving deterministic fairness.
- Golden fixtures turn boundary work into visible trust evidence, not abstract refactoring.
- Adapter metadata lets future MatchSets explain why comparisons are compatible or not.

## Anti-Features

- Full backend migration.
- Production-grade hostile-code runtime replacement.
- Multi-language package ecosystem.
- Public user-facing runtime language switcher unless the experimental path needs a small private/dev affordance.
- Durable ratings or official tournaments piggybacking on backend work.

## Research Notes

- The current codebase already has strong schema ownership in `@cowards/spec`; v1.7 should amplify that instead of splitting truth between languages.
- Existing privacy leak checks in analytics and replay projection should become golden fixture categories.
- The existing subprocess IPC shape is a useful starting point but is JS-shaped: `source`, `methodName`, `input`. v1.7 should make this an ABI document with language/runtime metadata and negotiated capabilities.
