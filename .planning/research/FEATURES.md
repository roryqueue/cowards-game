# Feature Research: v1.8 Production Boundary Hardening

**Date:** 2026-05-22
**Milestone:** v1.8 Production Boundary Hardening

## Summary

v1.8 should behave like a boundary-hardening release, not a player-facing expansion. Developers should get generated or generation-ready service contracts, a measurable migration path away from direct persistence imports, read-only Go parity against real Coward's Game evidence, a repeatable multi-process local topology, and monitors that catch privacy or boundary drift before it ships.

Users should see continuity: existing JS/TS Strategy Revisions, Workshop flows, MatchSet evidence, replay viewer behavior, saved gauntlet analytics, and privacy defaults keep working. Any new non-JS language affordance must be presented as experimental, compatibility-scoped, and not eligible for counted play unless explicit promotion criteria are proven in a later milestone.

The core product semantics remain deterministic autonomous play: Strategy Revisions are immutable for Match/MatchSet play; Strategy code never runs in web/API processes; public replay, MatchSet, ladder, analytics, and export surfaces do not expose Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, stderr, sessions, or runtime internals by default.

## Feature Categories

| Category | Audience | Expected Behavior |
| --- | --- | --- |
| Service contract generation and route migration | Developers | API/service schemas produce a contract artifact, and migrated routes consume the typed service layer instead of persistence roots. |
| Go read-only backend parity | Developers, operators | Go serves selected read-only public DTOs with the same ordering, privacy redaction, compatibility fields, and error shape as TypeScript. |
| Runtime sandbox hardening prototype | Developers | Candidate isolation boundaries are evaluated with hostile fixtures and operational notes, but none is declared production-ready by default. |
| Non-JS Strategy product semantics | Users, developers | Language metadata, validation messages, docs/examples, compatibility warnings, and experimental labels are clear without enabling counted non-JS play. |
| Cross-process local deployment harness | Developers, QA | One repeatable local topology runs web, TypeScript service boundary, worker/runtime adapter, and Go read-only service with health checks and smoke requests. |
| Observability and boundary drift monitors | Developers, operators | Lightweight checks catch private DTO leaks, direct runtime/web execution bypasses, stale generated contracts, adapter drift, and Go/TypeScript parity drift. |

## Table Stakes

| Feature | Expected Behavior | Concrete Test Semantics |
| --- | --- | --- |
| Generated service contract artifact | Developers can regenerate an OpenAPI-equivalent or typed schema artifact from the v1.7 service contract source of truth. The artifact includes health, public MatchSet summary, replay metadata, selected analytics summaries, and migrated web/service routes. | A deterministic generation command produces stable output; CI fails when generated contract output is stale; contract examples validate against service DTO schemas. |
| Route migration through service boundary | v1.8 moves a named set of Next routes/loaders away from direct persistence imports without changing user-visible results. | Static import guard fails if migrated routes import persistence roots; parity tests compare old fixture DTOs to service-layer DTOs; browser smoke checks still load Workshop, MatchSet, replay, and analytics pages. |
| Contract privacy defaults | Public and owner DTO categories remain explicit. Public defaults never reveal Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, stderr, sessions, or runtime internals. | Public DTO leak fixtures include forbidden field names and representative nested payloads; contract generation and route migration tests reject leaks. |
| Read-only Go parity endpoints | Go supports health, public MatchSet summary, replay metadata, and one selected analytics summary from real golden fixtures or safe persisted local data. | Go and TypeScript responses compare as canonical parsed DTOs for status, compatibility fields, deterministic ordering, privacy redaction, and public error shape. |
| Go scope boundary | Go is explicitly read-only. It does not own writes, auth mutation, Strategy submission, Match orchestration, job claiming, runtime execution, or database migrations. | Endpoint inventory and route tests fail on mutation verbs outside allowed health/read-only paths; docs list TypeScript-owned responsibilities. |
| Sandbox hardening prototype | Developers can run a harness comparing worker, subprocess/container, WASM/WASI, and microVM-style options where locally practical. Output is an evaluation report, not a promotion. | Hostile fixtures cover time, randomness, filesystem, network, environment, process APIs, dynamic import/eval/Function constructor, stdout/stderr caps, memory/source limits, timeout, crash, malformed IPC, and oversized output. |
| Sandbox failure taxonomy | Runtime results keep Strategy violations separate from system failures and keep public messages safe. | Fixture snapshots prove public messages omit source, memory, objectives, stack traces, stderr, host paths, environment, and private runtime internals. |
| Non-JS language metadata | Strategy Revisions can show immutable language, ABI version, runtime adapter id/version, source/package metadata, capability limits, readiness, and compatibility keys. | Metadata persists on revisions and appears in owner/developer surfaces without changing existing JS/TS behavior or public privacy defaults. |
| Experimental non-JS labels | Python or other non-JS paths are visibly experimental wherever surfaced: validation, registry, docs, examples, compatibility warnings, and diagnostics. | UI/API text includes `experimental` readiness; counted-play eligibility is false unless an explicit future promotion flag and evidence gate are added. |
| Non-JS validation messages | Users get concrete validation/runtime feedback: unsupported language, unsupported package metadata, incompatible adapter, ABI mismatch, source size limit, memory limit, timeout, forbidden capability, and non-counted eligibility. | Validation tests assert stable error codes plus public-safe messages; owner-facing details still avoid host internals. |
| Counted-play guardrails | JS/TS remains the only fully enabled counted runtime in v1.8. Non-JS Strategies may be saved or tested only if the product surface explicitly labels the path experimental and non-counted. | MatchSet, gauntlet, ladder, and compatibility checks fail closed for non-JS counted entries and explain why. |
| Cross-process local topology | A repeatable local command or documented script starts web, TypeScript service boundary, runtime worker/adapter, and Go read-only backend with deterministic fixture loading. | Health checks cover every process; smoke requests exercise web service health, TS service DTOs, Go health, Go public MatchSet summary, Go replay metadata, selected analytics, and runtime adapter diagnostics. |
| Diagnostics without private data | Local harness logs enough to debug process readiness, contract drift, parity mismatch, and runtime adapter failures without printing Strategy source, memories, objectives, raw Awareness Grid, stderr, sessions, or secrets. | Diagnostic snapshots are scanned by privacy guards; failure output points to component, endpoint, contract version, fixture id, and mismatch path. |
| Boundary drift monitors | CI/local checks detect direct persistence imports in migrated web routes, direct runtime execution in web/API paths, stale generated service contracts, adapter compatibility key drift, and Go/TypeScript parity drift. | Each monitor has a positive fixture and a forced-failure fixture; failures are actionable and do not require external services. |

## Differentiators

| Feature | Value Proposition | Why It Matters |
| --- | --- | --- |
| Contract artifact as migration ratchet | Developers can see exactly which public/owner/internal DTO promises exist and when a route has escaped persistence roots. | Makes future Go migration safer without committing to a rewrite now. |
| Real-fixture Go parity | Go proves behavior against actual MatchSet, replay, and analytics evidence instead of toy JSON. | Builds confidence that backend migration preserves Coward's Game semantics, ordering, and privacy. |
| Non-JS semantics before non-JS promotion | The product can explain language support, compatibility, and eligibility before users mistake a spike for competitive support. | Prevents unfair counted play and avoids support promises the runtime cannot yet satisfy. |
| Hostile-runtime evaluation report | Sandbox work produces comparable evidence across isolation options, including operational costs and gaps. | Keeps production sandbox decisions evidence-based rather than aesthetic. |
| Local multi-process rehearsal | Developers can run the future shape of the system on one machine with smoke checks and diagnostics. | Finds integration and configuration failures before deployment or backend ownership transfer. |
| Privacy and drift monitors as product trust | Boundary monitors turn privacy and deterministic fairness rules into continuously checked behavior. | Reinforces the core promise that public evidence is useful without exposing private Strategy internals. |

## Anti-Features

| Anti-Feature | Why Avoid | Do Instead |
| --- | --- | --- |
| Full Go backend rewrite | Too much ownership transfer before read-only parity and deployment behavior are proven. | Keep Go read-only and parity-tested against real fixtures. |
| Go mutation endpoints or job claiming | Risks splitting orchestration, persistence, and Match execution semantics across services too early. | Leave writes, jobs, auth mutation, Strategy submission, and Match orchestration in TypeScript. |
| Declaring a sandbox production-ready | A prototype cannot prove hostile public-scale isolation without deeper resource, kernel, deployment, and abuse validation. | Produce an evaluation report with explicit gaps and promotion criteria. |
| Counted non-JS MatchSets, ladders, or gauntlets by default | Non-JS sandbox, package policy, compatibility, and product support are not proven. | Allow only explicitly experimental, non-counted flows when surfaced. |
| Public language picker that implies support parity | Users will read a normal picker as production support. | Use owner/developer affordances with experimental badges and compatibility warnings. |
| Package installation ecosystem | Reproducible lockfiles, supply-chain policy, native modules, and sandbox rules are larger than this milestone. | Accept/display package metadata only where schema-backed; reject unsupported dependencies clearly. |
| Public exposure of private runtime diagnostics | Stack traces, stderr, host paths, source, memory, objectives, and raw Awareness Grid leak Strategy or infrastructure secrets. | Keep public diagnostics summarized and owner/developer diagnostics privacy-scanned. |
| Telemetry that captures Strategy internals | Observability must not become a side channel for source, memories, objectives, or secrets. | Monitor schema versions, endpoint names, fixture ids, mismatch paths, counts, and safe error codes. |
| Rule or Chronicle format changes as part of boundary hardening | Rule changes would invalidate parity findings and blur the purpose of v1.8. | Keep `Soldier`, `Match`, `Phase`, `Round`, `Activation`, `Cycle`, `Action`, `Advance`, `STONE`, `FALLEN`, and `Chronicle` semantics stable. |
| External services required for local verification | Boundary checks should be reliable in local/CI environments. | Use local fixtures, local processes, and deterministic smoke requests. |

## Requirement Seeds

| Seed | Requirement |
| --- | --- |
| V18-FEAT-01 | Developer can regenerate a deterministic service contract artifact from the canonical service schemas, and CI detects stale generated output. |
| V18-FEAT-02 | Migrated web routes/loaders use the typed service boundary and are protected by import guards against direct persistence-root access. |
| V18-FEAT-03 | Public and owner DTO contract fixtures preserve existing privacy defaults through generation and route migration. |
| V18-FEAT-04 | Go read-only health, public MatchSet summary, replay metadata, and selected analytics summary endpoints match TypeScript canonical DTOs for real fixtures or safe local persisted data. |
| V18-FEAT-05 | Go backend documentation and tests prove it has no mutation, orchestration, job-claiming, Strategy execution, or migration ownership. |
| V18-FEAT-06 | Developer can run a sandbox hardening harness against candidate runtime boundaries and receive a scored report covering containment, determinism, limits, failure taxonomy, startup cost, and unresolved risks. |
| V18-FEAT-07 | Runtime hardening fixtures distinguish Strategy runtime violations from system failures while preserving public-safe failure output. |
| V18-FEAT-08 | Non-JS Strategy surfaces expose language/runtime/package metadata, validation messages, compatibility warnings, docs/examples, and experimental labels without enabling counted play. |
| V18-FEAT-09 | Counted MatchSet, ladder, and gauntlet eligibility checks fail closed for experimental non-JS adapters with stable user-facing reasons. |
| V18-FEAT-10 | Developer can launch a local cross-process topology for web, TypeScript service boundary, runtime adapter, and Go read-only backend with health checks, fixture loading, smoke requests, and privacy-safe diagnostics. |
| V18-FEAT-11 | Boundary drift monitors fail on private DTO leaks, web/API runtime execution bypasses, migrated-route persistence imports, stale generated contracts, adapter compatibility drift, and Go/TypeScript parity drift. |
| V18-FEAT-12 | v1.8 verification proves existing JS/TS Workshop, immutable Strategy Revision, exhibition/trial evidence, replay viewer, saved gauntlet analytics, golden parity, and public privacy behavior remain unchanged. |
