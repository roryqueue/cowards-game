# Coward's Game

## Current State

**Shipped version:** v1.10 Service Boundary Completion and Go Read-Model Decision on 2026-05-23
**Current milestone:** None; ready for v1.11 selection.
**Status:** Ready for next milestone.
**Last audit:** v1.10 milestone audit passed after audit-fix.

Coward's Game is a deterministic two-player programmable strategy game for the web. Players can author immutable JS/TS Strategy Revisions, save account-owned revisions, fork credible Starter and Advanced Strategies, enter exhibitions or resettable trial ladder seasons, inspect fair standings and replay evidence, study saved gauntlet analytics, and trust that public outputs do not expose private Strategy data. The project now has generated TypeScript service contracts, selected service-backed public/player/account/ladder/workshop analytics reads, read-only Go parity fixtures including a public Strategy read model, runtime isolation readiness evidence gates, experimental non-JS product semantics, repeatable local topology diagnostics, and boundary drift monitors proving future multi-language runtime and backend migration paths without promoting unsafe ownership moves.

## Core Value

Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.

## Current Milestone

No active milestone. v1.10 has shipped and the project is ready to select v1.11.

## Next Milestone Candidates

Likely next moves are:
- Continue service-backed web read migration for remaining public/owner-safe surfaces after the account and Workshop analytics read slices.
- Reduce the 30 remaining broad web report-only direct persistence offenses without hiding ownership behind broad facades.
- Consider live Go-readiness evidence or a second Go public read-model route only after v1.10's Strategy page route remains stable under parity, topology, privacy, and rollback checks.
- Deepen production runtime isolation evidence in a CI or production-equivalent container lane before any counted promotion.
- Improve replay/Workshop product surfaces on top of the steadier service/runtime boundaries.

## Latest Shipped Milestone: v1.10 Service Boundary Completion and Go Read-Model Decision

**Goal:** Continue the v1.9 service-boundary ownership move by migrating high-value web read/user surfaces behind `@cowards/service`, reducing the remaining broad web report-only direct persistence debt from the 34-offense baseline, and implementing exactly one guarded Go public Strategy read-model route only after TypeScript-service-backed parity fixtures and rollback criteria are explicit.

**Delivered:**
- Classified the remaining broad web report-only baseline before migration.
- Moved account Strategy Revision list reads behind `@cowards/service` while keeping save/source/fork/write behavior out of scope.
- Moved the Workshop analytics/Evidence Explorer read slice behind spec/service-owned DTOs while leaving Workshop source/save/test/runtime/rerun/export flows TypeScript-owned.
- Added exactly one Go read-model route, public `GET /public/strategies/{strategyId}`, generated from TypeScript-service-backed parity fixtures.
- Promoted migrated slices to strict import enforcement and reduced broad web report-only direct persistence debt from 34 to 30.
- Kept Go writes, jobs, migrations, Match orchestration, Strategy execution, production web routing to Go, production sandbox promotion, and counted non-JS play out of scope.
- Archived audit: `.planning/milestones/v1.10-MILESTONE-AUDIT.md`.

## Previous Shipped Milestone: v1.9 Backend and Runtime Ownership Split

**Goal:** Use the v1.8 service contracts, Go parity fixtures, runtime semantics, local topology, and boundary monitors to make one deliberate ownership move without blending backend rewrite, production sandbox promotion, and non-JS counted play into one risky change.

**Delivered:**
- Selected the service-backed web read/user branch as the v1.9 ownership move while keeping Go expansion as follow-up-only.
- Moved public player profiles, owner account session/revision-list reads, and public ladder season reads behind `@cowards/service`.
- Widened strict import enforcement and reduced broad web report-only direct persistence debt from 41 to 34 known offenses.
- Added runtime isolation readiness guardrails and monitor evidence without promoting worker, subprocess, container, or other candidates to counted hostile-code execution.
- Added spec-owned non-JS promotion criteria while keeping Python and other non-JS runtimes experimental, disabled for normal play, and non-counted.
- Fixed the audit-found container runtime blocker so the container adapter remains evidence-only and non-counted until explicit promotion criteria are satisfied.
- Archived audit: `.planning/milestones/v1.9-MILESTONE-AUDIT.md`.

## Previous Shipped Milestone: v1.8 Production Boundary Hardening

**Goal:** Turn the v1.7 service/runtime/backend contracts into sturdier operating boundaries that are boring, observable, repeatable, and hard to accidentally bypass without prematurely rewriting orchestration, backend ownership, or production multi-language runtime support.

**Delivered:**
- Generated `service-api-v1.8` OpenAPI artifacts from canonical `@cowards/spec` service routes and DTO schemas, with stale-output and lint checks.
- Migrated selected public web reads through `@cowards/service` while preserving existing DTO behavior and privacy constraints.
- Promoted the Go backend spike to read-only parity against TypeScript-service-generated fixtures for health, public MatchSet summary, replay metadata, and owner-scoped analytics summary.
- Added an evaluation-only sandbox matrix and hostile probe harness for worker, subprocess, container, WASM/WASI, Deno-style, gVisor, and microVM tradeoffs without promoting a production sandbox.
- Made non-JS Strategy semantics spec-owned: language/adapter labels, readiness, package policy, validation codes, docs/examples references, warnings, and counted eligibility.
- Added `pnpm topology:check` for repeatable local web/service/runtime/Go fixture diagnostics and `pnpm boundary:monitors` for service contract, privacy, import-boundary, runtime adapter, Go parity, sandbox, and topology drift checks.
- Archived audit: `.planning/milestones/v1.8-MILESTONE-AUDIT.md`.

## Previous Shipped Milestone: v1.7 Runtime and Backend Boundary Stabilization

**Goal:** Make Coward's Game ready for a future Go backend and multi-language Strategy runtimes by freezing typed boundaries and proving parity before any major rewrite.

**Delivered:**
- `service-api-v1.7` contracts and `@cowards/service` for health, auth/session, Strategy revisions, MatchSets, replay metadata, analytics, exports, ladders, and public pages.
- `strategy-runtime-abi-v1.7` contracts for language-neutral Strategy execution envelopes, package/source metadata, limits, timeouts, runtime violations, system failures, and deterministic restrictions.
- Golden parity fixtures proving deterministic engine outcomes, Chronicle projection, replay reconstruction, public DTO privacy, runtime failure taxonomy, and ordering.
- Runtime language/adapter registries with first-class Strategy Revision metadata, compatibility keys, counted-play eligibility, and legacy runtime normalization.
- Experimental Python subprocess runtime through the same ABI, clearly disabled for counted play.
- Minimal read-only Go backend spike for health, public MatchSet summary, and replay metadata DTO envelopes.
- Local validation through `pnpm test:fast`, `pnpm build`, Go tests, and HTTP smoke checks for web and Go endpoints.

## Previous Shipped Milestone: v1.6 Workshop Analytics and Evidence Explorer

**Goal:** Turn v1.5's deterministic evidence into studyable Workshop analytics through saved gauntlet profiles, matchup heatmaps, evidence bands, replay deep links, and owner-safe exportable summaries.

**Delivered:**
- Stable analytics evidence contracts for saved gauntlet profiles, gauntlet runs, MatchSet summaries, matchup records, evidence bands, archetype tags, replay references, compatibility metadata, and export-safe DTOs.
- Saved named gauntlet profiles with exact deterministic inputs, immutable Strategy Revision ids, compatibility-aware reruns, and compare-only-when-equivalent behavior.
- Workshop matchup heatmaps across Starter and Advanced opponents showing W-L-D, points, failures, side bias, evidence confidence, evidence counts, and replay availability.
- Evidence Explorer drilldowns from Strategy evidence to opponent records, MatchSet ids, Match ids, compatibility metadata, representative replay links, and owner-safe exports.
- Replay deep links to meaningful public moments such as Backstab, contraction, no-advance cleanup, fall, decisive push, and late-cycle stabilization.
- Owner-only JSON/CSV exports for deterministic gauntlet summaries, with schema and browser checks preventing Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, or private runtime internals from leaking by default.
- Local demo data and browser-verified pages at `http://localhost:3000/` and `http://localhost:3000/workshop/evidence`.

## Validated in v1.4

- ✓ Canonical `cowards-rules-v1.4` rule and architecture docs for Cycle-interleaved selected slots and Cycle-boundary Backstab.
- ✓ Pure engine scheduler now resolves selected Soldier slots by Cycle layer, skips ended slots, treats blocked movement as a non-terminal Cycle cost, and emits Cycle lifecycle summaries.
- ✓ Chronicle and replay stack rebaseline to `chronicle-v1.4`, current compatibility versions, v1.4 lifecycle events, and active replay fixtures.
- ✓ Replay viewer playback now offers seven speed options up to 32x and defaults to 2x the original playback pace for denser v1.4 Cycle timelines.
- ✓ Starter Strategy Library keeps stable IDs while publishing v1.4 lineage, refreshed source hashes, and a real interleaved starter gauntlet.
- ✓ Completed local demo ladder at `/ladder/v1-4-demo` with 8 v1.4 starter entrants, 96 replay-backed Chronicles, counted MatchSets, and browser-verified public pages.

## Validated in v1.5

- ✓ Workshop Advanced Library entry point, apply/fork flows, revision comparison support, gauntlet/result framing, diagnostics, replay handoff, and performance summaries.
- ✓ Distinct 10-strategy Advanced Library with v1.5 lineage, public-safe archetype metadata, memory/stateless diversity, source hashes, and validation.
- ✓ Deterministic evidence model and report artifacts covering standings, W-L-D, counted status, rule/Chronicle versions, runtime adapter, behavior metrics, representative links, and non-durable framing.
- ✓ Five example MatchSets covering anti-backstab stress, wall control under pressure, center control vs mobility, trap breakpoint, and memory adaptation mirror.
- ✓ Completed 8-entrant Advanced-only local demo tournament at `/ladder/v1-5-demo`, with Center Gravity finishing 6-1-0 and no sweep.
- ✓ Second-take Advanced Strategy retune validated across 33 Chronicles: 7103 Moves, 412 Backstab resolutions, 0 blocked moves, 0 direct self-stoning, and 0 self off-board moves.
- ✓ Browser checks for Workshop, tournament, MatchSet, Strategy card, player/profile, and replay pages with public privacy boundaries intact.

## Validated in v1.6

- ✓ Stable analytics contracts for gauntlet profiles, gauntlet runs, MatchSet summaries, matchup records, evidence bands, archetype tags, replay references, compatibility metadata, and owner-safe export DTOs.
- ✓ Saved gauntlet profiles can be named, rerun, compared only when compatibility-equivalent, and stored without executing Strategy code in the web/API process.
- ✓ Workshop heatmaps show W-L-D, points, evidence bands, evidence counts, failures, side bias, and replay availability across Starter and Advanced opponents.
- ✓ Evidence Explorer supports sorting/filtering/drilldown from Strategy evidence to opponent records, MatchSet ids, Match ids, representative replays, compatibility metadata, and owner-safe exports.
- ✓ Replay deep links target meaningful public moments and focus the replay timeline at or near the selected event.
- ✓ Owner JSON/CSV exports preserve deterministic provenance while omitting Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw Awareness Grid, stack traces, owner debug, and private runtime internals by default.
- ✓ Local v1.6 analytics demo and milestone audit pass with realistic mixed outcomes, degraded/system-failed evidence states, runtime isolation checks, browser checks, and no open findings.

## Validated in v1.7

- ✓ `service-api-v1.7` service contracts cover auth/session, Strategy revisions, MatchSets, replay metadata, analytics, exports, ladders, public pages, and health.
- ✓ `@cowards/service` provides a typed service boundary and web MatchSet result reads now pass through it without importing persistence roots.
- ✓ Public service DTO privacy guards reject Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, stack traces, stderr, sessions, and runtime internals.
- ✓ `strategy-runtime-abi-v1.7` defines language-neutral execution envelopes, source/package metadata, limits, deterministic restrictions, versioning, runtime violations, and system failures.
- ✓ Strategy Revisions carry first-class language/runtime adapter metadata, with legacy `runtime-js` normalization and counted-play eligibility checks.
- ✓ Golden parity fixtures cover deterministic Match outcomes, Chronicle/replay behavior, public DTO privacy, runtime failure taxonomy, and deterministic ordering.
- ✓ Experimental Python runtime spike executes through the ABI but remains disabled for normal counted play.
- ✓ Minimal Go backend spike returns v1.7-shaped health, public MatchSet summary, and replay metadata DTOs.
- ✓ Milestone audit fixed boundary issues around runtime worker imports, persistence-root service imports, and schema-drift fallback behavior.

## Validated in v1.8

- ✓ `service-api-v1.8` OpenAPI artifacts are generated from canonical service metadata, linted, and stale-output checked.
- ✓ Selected public web reads use `@cowards/service` and preserve public DTO shape, ordering, errors, and privacy redaction.
- ✓ Go read-only backend parity is generated from TypeScript service outputs for health, public MatchSet summary, replay metadata, owner-scoped analytics summary, and degraded/system-failed evidence.
- ✓ Sandbox hardening is evaluation-only, with hostile probes and candidate tradeoffs recorded without promoting any boundary to production hostile-code isolation.
- ✓ Non-JS Strategy product semantics are spec-owned, with Python and other non-JS runtimes remaining experimental and non-counted.
- ✓ `pnpm topology:check` validates local topology setup, fixtures, TypeScript service health, runtime adapter metadata, optional live web/Go smoke, and privacy-safe diagnostics.
- ✓ `pnpm boundary:monitors` composes contract, privacy, import-boundary, runtime adapter, Go parity, sandbox, and topology drift checks.

## Validated in v1.9

- ✓ Selected service-backed web read/user surfaces as the deliberate production ownership move.
- ✓ Public player profiles, owner account session/revision-list reads, and public ladder season reads now pass through `@cowards/service`.
- ✓ Strict import enforcement widened while broad web report-only direct persistence debt dropped from 41 to 34 known offenses.
- ✓ Runtime isolation readiness, topology diagnostics, and boundary monitors remain evidence-only, with the container adapter explicitly non-counted after audit-fix.
- ✓ Non-JS promotion criteria are spec-owned; Python and other non-JS runtimes remain experimental, disabled for normal play, and non-counted.
- ✓ Full milestone gate covered package tests, typecheck, boundary monitors, replay smoke privacy, Go parity, topology checks, sandbox evidence checks, code review, audit-fix, and milestone audit.

## Validated in v1.10

- ✓ The remaining broad web report-only baseline was classified before migration, with selected slices and non-goals recorded.
- ✓ Account Strategy Revision list reads now pass through `@cowards/service` while save, source, fork, validation, test, submission, and MatchSet creation remain outside the read migration.
- ✓ Workshop analytics/Evidence Explorer reads now use spec/service-owned DTOs, preserving privacy and leaving Workshop source/save/test/runtime/rerun/export flows TypeScript-owned.
- ✓ Go gained exactly one public read-model route, `GET /public/strategies/{strategyId}`, backed by generated TypeScript-service parity fixtures.
- ✓ Strict import offenses remain 0 and broad web report-only direct persistence debt dropped from 34 to 30.
- ✓ Production web traffic was not routed to Go; Go writes, jobs, migrations, Match orchestration, Strategy execution, and Strategy source retrieval remain TypeScript-owned.
- ✓ Runtime isolation remains evidence-only; Python and other non-JS runtimes remain experimental, disabled for normal counted play, and non-counted.
- ✓ Final verification covered contracts, OpenAPI lint, typecheck, tests, Go parity, topology, boundary monitors, replay smoke, formatting, whitespace checks, audit-fix, and milestone audit.

## Validated in v1.0

- ✓ TypeScript monorepo, local workflow, canonical contracts, and versioning spine.
- ✓ Pure deterministic Coward's Game rules engine and invariant test suite.
- ✓ Chronicle creation, validation, hashing, reconstruction, public projection, and owner-only debug projection.
- ✓ Immutable JS/TS Strategy Revisions with safe validation APIs and worker-only runtime execution.
- ✓ PostgreSQL-backed Match/MatchSet persistence, migrations, worker jobs, retries, Chronicle storage, and deterministic scoring.
- ✓ Strategy Workshop authoring UX with Monaco, templates, validation, submission, revision history, and test launch/status.
- ✓ Replay viewer with Pixi board, timeline scrubber, inspector, event callouts, owner Awareness Grid, and full service-backed Workshop-to-replay E2E coverage.

## Validated in v1.1

- ✓ Engine-generated canonical replay fixtures for push, fall, contraction, legal Backstab, runtime failure, and endgame paths.
- ✓ Strict Chronicle grammar, compatibility checks, snapshot boundary validation, and impossible-state rejection before replay rendering.
- ✓ Public replay projection privacy gates for Strategy source, StrategyMemory, SoldierMemory, objectives, Awareness Grid details, and runtime internals.
- ✓ Replaceable Strategy execution adapter boundary with worker-thread metadata, subprocess JSON IPC spike, hostile Strategy matrix, timeouts, output caps, and failure taxonomy.
- ✓ Workshop debugging UX with actionable validation/runtime messages, sample Strategies, replay handoff links, and owner-only Soldier inactivity explanations.
- ✓ Persisted owner replay debug authorization for local Workshop Matches, proven through service-backed failing Strategy E2E.
- ✓ Docker and no-Docker local preflight paths plus service-backed, smoke, visual, and fast CI command slices.

## Validated in v1.2

- ✓ Username/password account creation, sign-in, sign-out, session persistence, display name, and public handle for competitive ownership.
- ✓ Stable User identity attached to account-owned immutable Strategy Revisions.
- ✓ Session-backed authorization for saving account revisions, entering owned revisions into exhibitions, and retrieving owner-only Strategy source.
- ✓ Competition presets, immutable entrant snapshots, MatchSet publication policy, deterministic scoring, tie-breakers, and public result DTO privacy checks.
- ✓ Unranked public exhibition MatchSets supporting 2-8 distinct owned revisions, including multiple revisions from the same user for alpha self-play.
- ✓ Public MatchSet result pages with status, standings, scoring policy, replay links, provenance, owner-only source affordances, and privacy-safe output.
- ✓ Abuse and fairness guardrails for rate limits, active duplicate submissions, valid entry criteria, public leak rejection, and runtime/web isolation boundaries.

## Validated in v1.3

- ✓ Forkable 10-strategy Starter Library with readable doctrine notes, source hashes, validation, memory-using starters, and Workshop apply/fork flows.
- ✓ Resettable trial ladder seasons with no permanent Elo/Glicko promise, explicit lifecycle states, one active Strategy Revision per user per season, immutable snapshots, next-season replacement, and stale revision policy.
- ✓ Deterministic ladder scheduling, pod MatchSet generation, counted standings, retry/degraded/non-counted handling, replay-backed evidence, and a completed local demo ladder at `/ladder/v13-demo`.
- ✓ Public player handle pages and public Strategy cards with lineage, records, tags, runtime compatibility, result links, and private-source/memory/debug exclusions.
- ✓ Focused competition governance with result flags, admin status marking, standings exclusion, public counted-state explanations, and audit logs.
- ✓ Containerized subprocess production-candidate Strategy runtime boundary behind `StrategyExecutionAdapter`, with worker-thread retained as local/dev fallback and hostile regression coverage.

## Context

Source specifications are archived in the repository root:

- `./CowardsGameSpec_Full_Consolidated_v1.md`
- `./CowardsGame_Technical_Architecture_Spec_V1.md`

Planning archives live under `.planning/milestones/`:

- `.planning/milestones/v1.0-ROADMAP.md`
- `.planning/milestones/v1.0-REQUIREMENTS.md`
- `.planning/milestones/v1.0-MILESTONE-AUDIT.md`
- `.planning/milestones/v1.0-phases/`
- `.planning/milestones/v1.1-ROADMAP.md`
- `.planning/milestones/v1.1-REQUIREMENTS.md`
- `.planning/milestones/v1.1-MILESTONE-AUDIT.md`
- `.planning/milestones/v1.1-INTEGRATION-CHECK.md`
- `.planning/milestones/v1.1-phases/`
- `.planning/milestones/v1.2-ROADMAP.md`
- `.planning/milestones/v1.2-REQUIREMENTS.md`
- `.planning/milestones/v1.2-MILESTONE-AUDIT.md`
- `.planning/milestones/v1.2-phases/`
- `.planning/milestones/v1.3-ROADMAP.md`
- `.planning/milestones/v1.3-REQUIREMENTS.md`
- `.planning/milestones/v1.3-MILESTONE-AUDIT.md`
- `.planning/milestones/v1.3-phases/`
- `.planning/milestones/v1.4-ROADMAP.md`
- `.planning/milestones/v1.4-REQUIREMENTS.md`
- `.planning/milestones/v1.4-MILESTONE-AUDIT.md`
- `.planning/milestones/v1.4-AUDIT-FIX.md`
- `.planning/milestones/v1.4-phases/`
- `.planning/milestones/v1.5-ROADMAP.md`
- `.planning/milestones/v1.5-REQUIREMENTS.md`
- `.planning/milestones/v1.5-MILESTONE-AUDIT.md`
- `.planning/milestones/v1.5-AUDIT-FIX.md`
- `.planning/milestones/v1.5-phases/`
- `.planning/milestones/v1.6-ROADMAP.md`
- `.planning/milestones/v1.6-REQUIREMENTS.md`
- `.planning/milestones/v1.6-MILESTONE-AUDIT.md`
- `.planning/milestones/v1.6-phases/`
- `.planning/milestones/v1.7-ROADMAP.md`
- `.planning/milestones/v1.7-REQUIREMENTS.md`
- `.planning/milestones/v1.7-MILESTONE-AUDIT.md`
- `.planning/milestones/v1.7-phases/`
- `.planning/milestones/v1.8-ROADMAP.md`
- `.planning/milestones/v1.8-REQUIREMENTS.md`
- `.planning/milestones/v1.8-MILESTONE-AUDIT.md`
- `.planning/milestones/v1.8-phases/`
- `.planning/milestones/v1.9-ROADMAP.md`
- `.planning/milestones/v1.9-REQUIREMENTS.md`
- `.planning/milestones/v1.9-MILESTONE-AUDIT.md`
- `.planning/milestones/v1.9-phases/`
- `.planning/milestones/v1.10-ROADMAP.md`
- `.planning/milestones/v1.10-REQUIREMENTS.md`
- `.planning/milestones/v1.10-MILESTONE-AUDIT.md`
- `.planning/milestones/v1.10-phases/`

## Out of Scope Until Replanned

- Durable all-time ratings, permanent Elo/Glicko contracts, ranked prize ladders, public tournaments, and broad spectator/community surfaces beyond profiles, public Strategy cards, standings, results, and replay links.
- Randomized arena generation and custom user-created maps.
- Full production multi-language runtime support beyond experimental non-JS semantics and runtime boundary prototypes.
- Wholesale backend rewrite, mutation endpoints, job claiming, or migration of orchestration before read-only service and parity boundaries are proven.
- Enterprise-grade authentication features such as email verification, password reset, OAuth, organizations, and account recovery.
- Live model inference or live human control during Matches.
- Monetization, cosmetics, strategy marketplace, and reinforcement-learning harnesses.

## Key Decisions

| Decision | Rationale | Outcome |
| --- | --- | --- |
| Build simulation-first | Deterministic engine, replay correctness, sandboxed execution, and Strategy API clarity were foundational. | ✓ Good |
| Use a TypeScript monorepo | Shared contracts and package boundaries kept engine, runtime, replay, worker, and web code separated. | ✓ Good |
| Keep engine pure and runtime-agnostic | The engine consumes a StrategyRuntime interface without database/network/clock dependencies. | ✓ Good |
| Make Chronicle the canonical replay artifact | Enabled deterministic replay, strict validation, privacy projection, persistence, and visual replay. | ✓ Good |
| Replace hand-authored replay demos with engine-generated fixtures | Legal scenario fixtures caught mismatch between visual demos and actual rules. | ✓ Good |
| Treat Chronicle grammar as a trust contract | Invalid order, payload, snapshot, privacy, and version failures are rejected before rendering. | ✓ Good |
| Keep Strategy code out of web/API processes | Runtime execution stays behind worker/runtime boundaries with explicit adapter metadata and tests. | ✓ Good |
| Preserve JS/TS runtime while hardening boundary | Worker-thread execution remains prototype containment; subprocess adapter and hostile matrix clarify next sandbox direction. | ✓ Revisit for production sandbox |
| Keep owner debug server-authorized | Query params may request owner debug, but server-side participant checks decide whether owner DTOs are returned. | ✓ Good |
| Defer ladders until trust base is sharp | Avoids replay disputes, sandbox abuse, stale revisions, compatibility confusion, and privacy leaks before the platform is ready. | ✓ Good |
| Start competition with exhibition MatchSets | Unranked or seeded MatchSets provide real competitive evidence without committing to durable ratings too early. | ✓ Good |
| Add only minimal production ownership first | Competitive submissions need stable User identity and private-source authorization, but email/OAuth/recovery can wait. | ✓ Good |
| Allow same-user multi-revision exhibition entry in alpha | Self-play is valuable for doctrine testing; one-strategy-per-user belongs with ranked or more formal competition. | ✓ Good |
| Publish result evidence without Strategy internals | Public standings, replay links, hashes, and provenance are enough for alpha disputes while source/memory/objective data stays private. | ✓ Good |
| Use resettable trial ladders before durable ratings | Ranking pressure is useful, but permanent ratings should wait until abuse, moderation, and sandbox behavior are better understood. | ✓ Good |
| Seed starter Strategies as forkable templates | Players should begin with readable, credible doctrines they choose to fork, not opaque auto-submissions. | ✓ Good |
| Treat containerized subprocess as the production-candidate runtime path | It preserves the JS/TS Strategy API while adding a clearer process and container boundary than worker threads. | ✓ Revisit before real hostile public scale |
| Interleave selected Soldiers by Cycle, not full Activation | The intended game is simultaneous-feeling tactical pressure where selected Soldiers respond between Cycles instead of one Soldier consuming its whole Cycle budget before the next slot acts. | ✓ Implemented in v1.4 |
| Check Backstab at every Cycle boundary | Backstab should be a tactical contact rule checked before and after each SoldierBrain Cycle, not only at Activation boundaries. | ✓ Implemented in v1.4 |
| Treat advanced seed quality as product evidence | Advanced Strategies should have shared tactical fundamentals and replay-backed archetype roles, not merely stronger source comments around Starters. | ✓ Implemented in v1.5 |
| Keep demo tournaments non-durable | v1.5 tournament evidence is useful for validation and onboarding, but does not create official public operations or permanent rankings. | ✓ Good |
| Treat Workshop analytics as study evidence, not rating truth | Saved gauntlet profiles, heatmaps, evidence bands, and exports should help players inspect deterministic MatchSet evidence without creating durable balance or ranking claims. | ✓ Implemented in v1.6 |
| Keep analytics summary-oriented and public-safe | Evidence Explorer, replay references, and owner exports should expose deterministic summaries and provenance while omitting Strategy source, memories, objectives, raw Awareness Grid, stack traces, owner debug, and private runtime internals by default. | ✓ Good |
| Freeze contracts before rewrites | Service and runtime boundaries should be specified, tested, and proven with small spikes before moving orchestration or production language support. | ✓ Implemented in v1.7 |
| Keep non-JS runtimes experimental until sandbox/product semantics are real | Python can prove ABI shape, but counted play should remain JS/TS until isolation, package policy, Workshop UX, and compatibility are designed. | ✓ Good |
| Keep Go backend migration read-only first | A static/read-only Go spike proves DTO/deployment shape without prematurely moving writes, jobs, or Strategy execution. | ✓ Good |
| Move service-backed web reads before Go route ownership | v1.9 showed that reducing direct web persistence debt is the cleanest first backend ownership move and preserves the TypeScript service as the contract source. | ✓ Good |
| Keep Go expansion follow-up-only until fixtures and rollback are explicit | A future Go read-model route needs generated TypeScript-service-backed parity fixtures, GET-only routing, topology diagnosis, auth/error semantics, and rollback scope before ownership moves. | ✓ Good |
| Keep production runtime promotion evidence-only | The container adapter and other runtime candidates must not become counted hostile-code boundaries until live isolation evidence and promotion criteria are satisfied. | ✓ Good |

## Constraints

The active constraints remain: deterministic engine behavior, engine purity, Strategy Revision immutability, hostile Strategy treatment, runtime isolation, memory/source/output limits, package boundaries, replay privacy, Chronicle compatibility, and competitive integrity.

Future competition work must preserve exhibition self-play, avoid durable rating promises until governance and abuse data support them, keep all counted standings backed by replay/provenance evidence, and keep public player/Strategy/analytics surfaces free of Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, and private runtime internals by default. v1.5 created local example MatchSets and a completed example tournament for demonstration, and v1.6 created saved gauntlet analytics for study; neither establishes official public tournament operations or durable ratings.

Future rule-correction work must treat the rules docs, engine, Chronicle/replay grammar, fixtures, starter Strategies, and demo competition data as one contract. It should not leave stale timing assumptions in samples, tests, or public explanatory text.

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each milestone** (via `$gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check -> still the right priority?
3. Audit Out of Scope -> reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-23 after starting v1.10 milestone*
