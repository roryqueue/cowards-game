# Retrospective

## Milestone: v1.0 — MVP

**Shipped:** 2026-05-17
**Phases:** 7 | **Plans:** 33

### What Was Built

- Established a strict TypeScript monorepo with canonical spec contracts, package boundaries, local topology, and selected E2E verification in pnpm verify.
- Implemented the deterministic Coward's Game rules engine, covering rounds, activation selection, movement, pushing, Backstab, stoning, contraction, end conditions, and purity tests.
- Built Chronicle and replay infrastructure for deterministic reconstruction, integrity validation, public privacy projection, and owner-only debug data.
- Delivered a replaceable JS/TS strategy runtime boundary with immutable Strategy Revisions, validation, worker-only execution, timeout/failure handling, and no production node:vm execution.
- Added PostgreSQL-backed Match/MatchSet orchestration, job claiming, retries, Chronicle persistence, deterministic scoring, and worker execution.
- Shipped the Strategy Workshop and replay viewer, including Monaco authoring, revision history, Workshop test launch, Pixi replay board, timeline/inspector, owner Awareness Grid, and service-backed edit-to-replay Playwright coverage.

### What Worked

- Phase-by-phase verification caught real integration gaps before closure.
- Keeping the engine pure and Chronicle-centered made later replay and persistence work easier to reason about.
- Service-backed Playwright exposed issues that unit tests missed, including PostgreSQL enum casting and encoded Match id replay lookup.

### What Was Inefficient

- Some summary and validation frontmatter needed retroactive normalization for strict milestone audit compatibility.
- The service-backed E2E required local PostgreSQL setup because Docker was unavailable in the execution environment.

### Patterns Established

- Every phase should end with a passed VERIFICATION.md and complete requirements frontmatter in summaries.
- Replay privacy should be tested both at projection level and browser level.
- Replay demo fixtures should be held to engine-rule legality, not just visual plausibility.
- Test-support routes must fail loudly and remain gated to test environments.

### Key Lessons

- Run service-backed E2E earlier for flows that cross web, persistence, worker, and replay.
- Treat planning metadata as part of the deliverable; strict closure depends on it.
- Runtime hardening should remain explicit technical debt until stronger isolation replaces prototype worker-only safeguards.

### Cost Observations

- Model mix: not recorded.
- Sessions: single milestone thread with phase, review, audit, and closure passes.
- Notable: parallel phase verification was valuable, but final integration still needed one coherent service-backed run.

## Milestone: v1.1 — Trustworthy Simulation Beta

**Shipped:** 2026-05-18
**Phases:** 6 | **Plans:** 29

### What Was Built

- Engine-generated replay fixtures replaced fragile hand-authored demos and now drive visual checks for important mechanics.
- Chronicle validation became strict enough to reject malformed, impossible, private-leaking, and incompatible replay data before rendering.
- Runtime execution gained explicit adapter metadata, subprocess JSON IPC, hostile Strategy coverage, and stronger output/failure boundaries.
- Workshop and replay debugging gained sample Strategies, actionable validation/runtime messages, replay links, and owner-only Soldier inactivity explanations.
- Docker, no-Docker, service-backed E2E, fixture smoke, visual, and fast-test commands became clearer and more repeatable.
- Persisted owner replay debug authorization was closed through Phase 13 and proven with service-backed failing Strategy replay.

### What Worked

- The milestone audit found a real integration gap, and adding Phase 13 was the right way to close it without pretending fixture coverage was enough.
- Layered privacy tests across projection, server DTOs, browser replay, and persisted Workshop flows gave high confidence.
- Focused Playwright screenshots on the replay board caught board-scale and fixture fidelity issues without making full-page snapshots brittle.

### What Was Inefficient

- The available `gsd-sdk` binary did not expose the documented `query` commands, so several workflow updates had to be maintained manually.
- Some Phase 8 summary coverage was plan-level rather than fully normalized across all plans, which made readiness checks less automatic than ideal.
- Manual browser review after the audit still found small but real UI polish issues, so responsive Workshop layout deserves earlier visual scrutiny.

### Patterns Established

- Treat Chronicle grammar as a trust contract between engine, persistence, replay, and UI.
- Keep owner debug data DTO-derived and server-authorized; React should render facts, not infer rules.
- Use service-backed E2E for any feature that claims to work on persisted Matches.
- Preserve Docker and no-Docker local paths as parallel first-class workflows.

### Key Lessons

- Fixture coverage and persisted replay coverage are different assurances; both matter.
- Public privacy should be asserted against field names as well as marker values.
- Layout regressions are part of trust when they affect replay/workshop inspection; narrow viewport screenshots should be part of UI review.

### Cost Observations

- Model mix: not recorded.
- Sessions: one extended milestone thread with audit, closure phase, manual browser review, and archive pass.
- Notable: subagent-style review and validation paid off, but the final polish loop benefited from direct user inspection.

## Milestone: v1.2 — Competitive Alpha

**Shipped:** 2026-05-19
**Phases:** 5 | **Plans:** 10

### What Was Built

- Minimal username/password accounts, sessions, handles, and account-owned Strategy Revision saves.
- Session-backed owner authorization for competitive entry and owner-only Strategy source access.
- Competition presets, immutable entrant snapshots, public publication policy, scoring, tie-breakers, and leak-safe public DTOs.
- Unranked exhibition MatchSets with 2-8 distinct owned Strategy Revisions, including same-user multi-revision self-play.
- Public MatchSet result pages with standings, scoring evidence, replay links, provenance, degraded/failed vocabulary, and owner-only source affordances.
- Rate limits, active duplicate detection, valid entry checks, public privacy guards, and runtime isolation boundary preservation.

### What Worked

- The v1.1 trust foundation paid off: result pages could reuse persisted Chronicles, public replay projection, and replay links instead of inventing a new evidence path.
- Letting same-user multi-revision exhibitions be explicit in the model kept alpha testing ergonomic without overfitting early ranked rules.
- Browser verification caught two live integration issues after compile/test success: encoded MatchSet ids and stale MatchSet scoring refresh.

### What Was Inefficient

- The documented `gsd-sdk query` commands were unavailable in the installed SDK, so milestone readiness and archive work required direct file inspection.
- Two parallel implementation slices initially diverged on auth table names and competition preset ids; reconciling around persistence helpers avoided duplicating service logic.
- Next.js generated file churn (`next-env.d.ts`, test results) needed cleanup during final verification.

### Patterns Established

- Web competitive routes should import narrow persistence subpaths, not the package root, to avoid bundling migration filesystem code.
- Public result builders should refresh scoring/status from Match rows before publishing evidence.
- Competitive public DTOs need explicit leak-safety assertions against field names, not just UI discipline.
- Account ownership and public replay privacy can coexist when owner affordances are links to server-authorized routes, not embedded private data.

### Key Lessons

- Run a local browser pass on newly routable pages even when unit, typecheck, and build are green.
- Treat encoded domain ids as first-class route inputs; decode at the boundary before persistence lookup.
- Keep alpha competition unranked until abuse, dispute, and account recovery surfaces have their own milestone-level treatment.

### Cost Observations

- Model mix: not recorded.
- Sessions: one extended milestone implementation and closure thread.
- Notable: the fastest path was a single integration pass after parallel planning; the final fixes came from live UAT rather than additional planning.

## Milestone: v1.3 — Competition Trust Beta

**Shipped:** 2026-05-20
**Phases:** 6 | **Plans:** 6

### What Was Built

- A 10-strategy Starter Library with readable doctrines, Workshop apply/fork flows, source hashes, validation, lineage metadata, and several memory-using examples.
- Resettable trial ladder seasons with one active Strategy Revision per user, immutable snapshots, explicit lifecycle states, next-season replacement, and no durable rating promise.
- Deterministic ladder scheduling, pod MatchSets, counted standings, non-counted/degraded exclusion, public ladder pages, and a completed local v1.3 demo tournament.
- Public player profiles and Strategy cards with privacy-safe lineage, records, tags, runtime compatibility, result links, and replay links.
- Result governance with flags, admin status marking, audit events, public counted-state explanations, and standings exclusion.
- A containerized subprocess production-candidate runtime boundary behind the existing adapter with hostile regression coverage and worker-thread local/dev fallback.

### What Worked

- The resettable trial ladder gave real competitive pressure without prematurely committing to permanent ratings.
- Reusing MatchSet, Chronicle, replay, and scoring infrastructure kept the ladder trustable instead of inventing a separate competition path.
- Live demo replay review after the audit caught product-quality strategy issues that tests would not have judged as failures.

### What Was Inefficient

- The documented `gsd-sdk query` commands remained unavailable, so completion checks and archives needed direct file inspection and manual edits.
- Starter behavior needed a second tuning pass after the first demo because some doctrines technically worked but produced poor-looking early turns.
- Replay event language initially hid the difference between real blocked movement and illegal immediate reversal attempts.

### Patterns Established

- Formal competition should start with resettable seasons and recomputable standings before durable ratings.
- Starter Strategies should be treated as product surface area, not just sample code; replay quality matters.
- Public competition identity can show pride and evidence without exposing source, memory, objectives, or owner debug data.
- Runtime adapter metadata should make production-readiness and fallback boundaries visible to developers.

### Key Lessons

- Include live ladder/replay realism checks in future competition milestones, not just deterministic correctness checks.
- Avoid starter tactics that terminate movement by asking for illegal actions; "legal but boring" beats noisy false pressure.
- Keep governance and standings coupled through recomputable counted/non-counted state.

### Cost Observations

- Model mix: not recorded.
- Sessions: one extended milestone thread with discussion, implementation, audit, demo tournament, live replay tuning, and archive pass.
- Notable: user-guided replay inspection was the highest-signal final validation step.

## Milestone: v1.4 — Cycle-Interleaved Rules Correction

**Shipped:** 2026-05-20
**Phases:** 5 | **Plans:** 5

### What Was Built

- Canonical v1.4 rules and architecture docs for Cycle-interleaved selected Soldier scheduling and Cycle-boundary Backstab.
- A pure engine Round scheduler that opens selected slots once, resolves them by Cycle layer, skips ended slots, and keeps blocked movement non-terminal.
- Chronicle and replay compatibility rebaselined to `chronicle-v1.4`, including selected-slot lifecycle events and stricter validation.
- Starter Strategies refreshed to v1.4 lineage, with an interleaved starter gauntlet proving real Match execution.
- A completed `/ladder/v1-4-demo` tournament with eight seeded starters, 96 replay-backed Chronicles, browser-verified pages, and realistic standings.
- Replay playback speed controls with seven options through `32x`, defaulting to `2x`.

### What Worked

- Writing the rule source of truth first made the engine/replay rewrite less ambiguous.
- Keeping the replay builder dependent on engine `resolveRound` avoided duplicating the scheduler in replay code.
- Demo-tournament validation caught whether the corrected rules produced plausible play, not just passing mechanics.

### What Was Inefficient

- The installed `gsd-sdk` still lacked documented `query` commands, so completion, audit, and archive steps required manual file inspection.
- Replay speed polish emerged only after live replay viewing; dense v1.4 timelines should have playback ergonomics considered during replay-facing phases.
- Planning docs needed an audit-fix pass after implementation because status fields lagged behind completed code.

### Patterns Established

- Rules docs, engine scheduler, Chronicle grammar, replay fixtures, starters, and demo data should be treated as one versioned contract.
- Rule-version corrections should include fresh demo evidence so old standings cannot be mistaken for current proof.
- Replay UX controls should scale with event density, especially when rules create longer event streams.

### Key Lessons

- Do source-of-truth rule correction before touching the engine, then keep all compatibility labels explicit.
- Validate strategy balance/realism with generated tournament evidence whenever scheduler semantics change.
- Keep milestone status docs synchronized during execution, not only at final audit.

### Cost Observations

- Model mix: not recorded.
- Sessions: one extended milestone thread with discussion, implementation, demo generation, audit-fix, replay polish, and archive pass.
- Notable: live replay inspection quickly exposed ergonomic needs that automated correctness tests could not judge.

## Milestone: v1.5 — Strategy Workshop Power Tools and Advanced Strategy Library

**Shipped:** 2026-05-21
**Phases:** 8 | **Plans:** 8

### What Was Built

- Workshop Advanced Library entry point, apply/fork flows, revision comparison, gauntlet/result framing, diagnostics, replay handoff, and performance summaries.
- A distinct 10-strategy Advanced Library with v1.5 lineage, public-safe archetype metadata, memory/stateless diversity, source hashes, and validation.
- Deterministic local evidence model and report artifacts for standings, W-L-D, counted status, rule/Chronicle versions, behavior metrics, representative links, and non-durable framing.
- Five replay-backed example MatchSets and one completed 8-entrant Advanced-only demo tournament.
- Replay-reviewed second-take Strategy retune that added shared tactical fundamentals before archetype-specific bias.
- Formal v1.5 audit, UAT, verification, and archive artifacts.

### What Worked

- Reusing MatchSet, worker, Chronicle, scoring, and replay infrastructure kept the evidence path deterministic and privacy-safe.
- The second-take review produced more credible Strategies than annotated Starter wrappers.
- Evidence metrics made the retune concrete: final reports showed movement, Backstab, contraction, no blocked moves, no direct self-stoning, and no self off-board moves.
- Browser checks on tournament, MatchSet, Strategy card, profile, and replay pages caught local-server/runtime behavior that static docs would not reveal.

### What Was Inefficient

- v1.5 was implemented as one autonomous cross-phase sweep, so phase `SUMMARY.md` and `VERIFICATION.md` files needed retroactive reconciliation for formal audit compatibility.
- The installed `gsd-sdk` still lacked documented `query` commands, so audit and completion had to be performed through direct file inspection.
- In-process deterministic gauntlet tests are long-running and may need lighter fixtures or split coverage later.

### Patterns Established

- Advanced seed libraries should be validated as product evidence, not just code samples.
- Demo tournaments are useful local proof, but their copy and archive must keep non-durable framing explicit.
- Strategy tuning should record source-hash changes, replay evidence, and behavior metrics together.
- Public Strategy/player/evidence pages can show useful doctrine and provenance while preserving replay privacy boundaries.

### Key Lessons

- Strategy libraries benefit from shared tactical fundamentals before archetype specialization.
- Non-degenerate evidence needs both standings review and replay/metric review.
- Keep phase summaries and requirement statuses synchronized during execution, especially for autonomous multi-phase work.

### Cost Observations

- Model mix: not recorded.
- Sessions: one extended milestone thread plus follow-up retune, documentation, and archive pass.
- Notable: user-guided replay/tournament inspection was the highest-signal input for Strategy quality.

## Milestone: v1.6 — Workshop Analytics and Evidence Explorer

**Shipped:** 2026-05-22
**Phases:** 7 | **Plans:** 7

### What Was Built

- Stable analytics contracts for gauntlet profiles, gauntlet runs, MatchSet summaries, matchup records, evidence bands, archetype tags, replay references, compatibility metadata, and owner-safe export DTOs.
- Saved gauntlet profiles with deterministic inputs, immutable Strategy Revision ids, compatibility-aware reruns, and compare-only-when-equivalent behavior.
- Workshop heatmaps showing W-L-D, points, evidence bands, evidence counts, failures, side bias, and replay availability across Starter and Advanced opponents.
- Evidence Explorer drilldowns from Strategy evidence to opponent records, MatchSet ids, Match ids, representative replays, compatibility metadata, and owner-safe exports.
- Replay deep links that target meaningful public moments and focus the replay timeline at or near the selected event.
- Owner JSON/CSV exports with deterministic provenance and explicit privacy guards against Strategy/runtime/replay internals.

### What Worked

- The v1.5 deterministic evidence model gave v1.6 realistic data to study instead of inventing analytics in isolation.
- Subagent review found concrete privacy, persistence, compare/rerun, and export issues before closure.
- Browser checks across heatmap, Evidence Explorer, replay deep links, export endpoints, and awkward responsive widths caught product-quality gaps that tests alone would not judge.

### What Was Inefficient

- Phase artifacts did not include `SUMMARY.md` files even though the completion workflow expects them, so closure had to use UAT, validation, review, and audit artifacts directly.
- The installed `gsd-sdk` still lacks documented `query` subcommands, requiring manual archive and status updates.
- Evidence Explorer desktop spacing needed post-audit live-user polish around intermediate viewport widths.

### Patterns Established

- Analytics should be summary-first, compatibility-aware, and explicit about evidence strength rather than pretending deterministic demos are durable ratings.
- Owner exports need privacy guards at schema, endpoint, CSV, and browser-verification levels.
- Replay deep links are more useful when they target named public moments and validate the expected moment type at the sequence.
- Responsive UI verification should include awkward intermediate widths, not only mobile and wide desktop.

### Key Lessons

- Study surfaces need evidence vocabulary for thin, degraded, non-counted, and system-failed cases so players do not mistake system state for Strategy weakness.
- Profile compatibility must be a first-class data contract, not a UI convention.
- Keep generated analytics deterministic and public-safe by default; owner authorization can add export access without adding raw runtime artifacts.

### Cost Observations

- Model mix: not recorded.
- Sessions: one extended autonomous milestone implementation plus live responsive-polish and archive pass.
- Notable: the final user-visible quality came from combining automated privacy/runtime checks with manual browser inspection at real window sizes.

## Milestone: v1.7 — Runtime and Backend Boundary Stabilization

**Shipped:** 2026-05-22
**Phases:** 6 | **Plans:** 6

### What Was Built

- Frozen `service-api-v1.7` backend-facing DTO contracts for auth/session, Strategy Revisions, MatchSets, replays, analytics, exports, ladders, and public pages.
- A typed web service-client layer that began moving Next routes away from direct persistence package roots.
- `strategy-runtime-abi-v1.7`, covering language-neutral request/response schemas, metadata, limits, timeout/failure taxonomy, version negotiation, and deterministic capability restrictions.
- Golden parity fixtures for engine outcomes, Chronicle projection, scoring, MatchSet and analytics summaries, replay deep links, exports, privacy redaction, runtime failures, and deterministic ordering.
- Runtime adapter registry metadata on Strategy Revisions and MatchSet compatibility checks, with JS/TS as stable and Python marked experimental.
- A tiny Python subprocess ABI spike and a minimal read-only Go backend spike proving DTO parity and deployment shape without moving orchestration prematurely.

### What Worked

- Contract-first implementation let TypeScript, Python, and Go touch the same boundaries without forcing a rewrite.
- Golden parity fixtures caught behavioral drift across service DTOs, replay projections, exports, and runtime failures.
- Narrow package imports kept Next builds from pulling persistence migrations and filesystem code into web bundles.
- The Go spike proved useful quickly once called through its explicit path at `/usr/local/go/bin/go`.

### What Was Inefficient

- The installed `gsd-sdk` still lacks documented `query` subcommands, so readiness checks, audit, and archive status had to be inspected manually.
- Some service imports initially used persistence package roots and only failed at build time, after unit tests had passed.
- The second-language spike is intentionally tiny; it proves the ABI shape, not production user-facing multi-language support.

### Patterns Established

- Treat backend and runtime boundaries as versioned product contracts before replacing the implementation behind them.
- Keep experimental adapters first-class in metadata but opt-in through compatibility gates and honest labels.
- Use golden fixtures as the shared truth between engine, Chronicle, service DTOs, exports, runtime failure handling, and backend spikes.
- Go backend work should remain read-only until DTO parity, schema access, deployment topology, and client integration are proven.

### Key Lessons

- Boundary rewrites get safer when the old implementation and the spike both answer the same fixture set.
- Runtime isolation tests should forbid accidental web/API process execution paths, including through test helpers.
- Storage-fallback behavior must distinguish real outage cases from schema drift; treating missing tables as "available" helped avoid hiding setup defects.

### Cost Observations

- Model mix: not recorded.
- Sessions: one extended research, discussion, planning, execution, review, validation, audit-fix, and archive loop.
- Notable: the highest-leverage fixes were build and boundary hygiene issues rather than feature surface changes.

## Milestone: v1.10 — Service Boundary Completion and Go Read-Model Decision

**Shipped:** 2026-05-23
**Phases:** 6 | **Plans:** 6

### What Was Built

- Account Strategy Revision list reads now flow through `@cowards/service`, with the save route split away so the read path can be strict import-gated.
- Workshop analytics/Evidence Explorer reads now use spec/service-owned DTOs and service parsing while source/save/test/runtime/rerun/export flows remain TypeScript-owned.
- Go serves exactly one new read-model route, public `GET /public/strategies/{strategyId}`, from TypeScript-service-generated parity fixtures.
- Boundary monitors and import checks now hold the migrated slices strict while broad web report-only debt is reduced from 34 to 30.
- Runtime isolation and non-JS support remain evidence-only/non-counted, with no accidental promotion during the boundary work.

### What Worked

- Starting with a 34-offense classification made the slice selection honest and prevented cleanup-by-hiding through broad facades.
- The account read/save split produced a small but durable ownership win: reads can be strict while writes stay in their existing boundary.
- Generated Go fixtures kept the Go route boring in the right way: read-only, parity-backed, checksum-checked, and easy to roll back.
- The final audit-fix caught a planning consistency issue before archive, so the requirement checklist and traceability table now agree.

### What Was Inefficient

- The installed `gsd-sdk` still lacks documented `query` subcommands, so audit and completion had to be driven by direct artifact inspection.
- Workshop still has mixed read/write/runtime gravity in `server.ts` and broader type imports, which makes the next debt reductions more surgical.
- The milestone completed with a large uncommitted tree, so the final archive commit needs to carry both implementation and planning closure together.

### Patterns Established

- Service-boundary migrations should name the exact web files, service methods, DTOs, strict import targets, and explicit defer criteria before code moves.
- Broad direct-persistence debt should shrink by deleting normalized fingerprints for proven migrations, not by masking paths.
- Go read-model expansion should stay one route at a time until live topology, privacy, parity, and rollback evidence are routine.

### Key Lessons

- Split mixed route ownership before enforcing imports; otherwise the read path inherits write-surface risk.
- Public read-model Go work is safest when generated from the TypeScript service rather than separately authored DTO examples.
- Runtime and non-JS work benefits from being visible in every boundary milestone, even when deliberately not promoted.

### Cost Observations

- Model mix: not recorded.
- Sessions: one extended milestone with research, planning, execution, audit-fix, milestone audit, and archive pass.
- Notable: the highest-signal outcome was reducing boundary debt without weakening privacy, runtime, or Go ownership constraints.

## Milestone: v1.11 — Remaining Web Read Boundary Burn-Down and Live Go Readiness Evidence

**Shipped:** 2026-05-23
**Phases:** 6 | **Plans:** 6

### What Was Built

- Re-baselined the remaining 30 broad web report-only persistence offenses and selected two narrow Workshop read surfaces.
- Moved Workshop test-summary GET and analytics-compare GET reads behind `@cowards/service` with spec-owned input/output validation.
- Added route tests for success, missing data, local gate behavior, storage-unavailable behavior, and service DTO privacy rejection.
- Promoted selected Workshop read routes and the safe read-boundary helper to strict import enforcement.
- Reduced broad web report-only direct persistence debt from 30 to 29 by removing a real Workshop type fingerprint.
- Made live Go readiness a required evidence-only validation lane, including no-fallback proof when Go is unavailable.

### What Worked

- Research-first slicing kept the milestone focused on public/owner-safe reads instead of drifting into writes or runtime execution.
- The subagent review found concrete issues that mattered: type-only imports, canonical outcome validation, storage-unavailable behavior, input validation, and planning consistency.
- Required live Go topology evidence made the Go readiness claim more realistic without promoting production routing.

### What Was Inefficient

- The installed `gsd-sdk` still lacks documented `query` subcommands, so complete-milestone and audit-open steps required manual file inspection.
- The first e2e smoke failed because the local database was missing Workshop analytics migrations; preflight migrations fixed the realism problem before replay smoke passed.
- The real report-only reduction came from source-free type cleanup rather than the migrated route imports themselves, which was easy to underestimate at planning time.

### Patterns Established

- Public-safe Workshop read DTOs should parse both params and outputs at the service boundary.
- Route-level storage-unavailable handling should be tested for every migrated read route that touches local persistence.
- Live Go evidence should prove both positive readiness and negative no-fallback behavior before any production routing discussion.

### Key Lessons

- Tightening schemas can expose useful type mismatches where persistence still returns broader JSON; treat that as a feature of the boundary, not friction.
- Do not count a read migration as boundary debt reduction until an exact report-only fingerprint is removed.
- The next Go milestone should be one decisive readiness/cutover plan, not a bundled rewrite of reads, writes, orchestration, auth, and Strategy execution.

### Cost Observations

- Model mix: not recorded.
- Sessions: one extended v1.11 thread with discussion, planning, execution, review, validation, audit-fix, live Go evidence, and archive pass.
- Notable: the most useful late-stage checks were subagent audit passes paired with full lint/type/test/boundary gates.

## Milestone: v1.14 — Generic Strategy Artifact and Runtime Boundary Contract

**Shipped:** 2026-05-23
**Phases:** 7 | **Plans:** 7

### What Was Built

- Generic Strategy Artifact and Strategy Revision schemas for source-bearing artifacts, public summaries, runtime metadata, validation, lineage, future language variants, and immutable Match eligibility.
- A generated `strategy-artifact-manifest-v1.14` from TypeScript-owned Starter, Advanced, and template registries, with stale-output checks and Go data-only consumption.
- `strategy-runtime-abi-v1.14` as the public request/response boundary for `selectActivations` and `soldierBrain`.
- A runtime JS ABI conformance bridge that validates original revision source hash/bytes while passing transpiled executable code only to adapters.
- Go-owned Starter/Advanced fork routes and lineage-preserving account saves backed by generated artifacts, without executing Strategy source in Go.
- Centralized public-output privacy checks, replay projection leak guards, topology/ownership monitor hardening, and canonical replay board realism validation.

### What Worked

- Research-first phase ordering kept artifact contracts, manifest generation, ABI definition, runtime conformance, Go consumption, and privacy gates from collapsing into one risky change.
- Subagent review found real correctness issues around ABI source signing, artifact invariants, Go runtime metadata exposure, lineage hashes, and public replay leak safety.
- Live page smoke caught a realistic canonical-board mismatch that unit tests did not: canonical Soldiers use `player:bottom` / `player:top` owner IDs while canonical identity is better derived from Soldier IDs and positions.

### What Was Inefficient

- The installed `gsd-sdk` still lacks documented `query` subcommands, so complete-milestone, audit-open, and archive steps required direct artifact inspection and manual updates.
- Static topology remains fixture-ID based, so live web-through-Go evidence is manual smoke evidence rather than a first-class monitor path.
- Local seed data exposed older/null public identity and runtime metadata shapes after the milestone, requiring compatibility cleanup before example pages were pleasant to browse.

### Patterns Established

- Go can consume Strategy source artifacts as signed, generated data without becoming a hostile-code execution boundary.
- ABI envelopes must preserve original revision source/hash even when adapters execute transpiled code.
- Public-output privacy should be centralized in spec-owned deny-list helpers and reused in service, Go, replay, analytics, topology, and monitors.
- Replay realism checks should validate canonical starting layout, declared bounds, visible piece sanity, and terrain overlap before rendering.

### Key Lessons

- The next backend milestone can be ambitious, but should keep Go orchestration separate from Strategy execution until a production sandbox is promoted.
- Schema validation is most valuable when it rejects older local data loudly, but public projections should normalize compatible legacy metadata where safe.
- Manifest lineage checks need to verify parent existence and source hash, not just copy shape-compatible metadata.

### Cost Observations

- Model mix: not recorded.
- Sessions: one long v1.14 thread with research, discussion, implementation, multiple reviews, audit-fix, live smoke, local browsing fixes, and archive pass.
- Notable: the highest-signal checks were subagent reviews paired with live page validation against actual local data.

## Milestone: v1.15 — Go Backend Ownership Completion

**Shipped:** 2026-05-24
**Phases:** 7 | **Plans:** 7

### What Was Built

- A v1.15 lifecycle ownership manifest and boundary baseline separating Go primary ownership from TypeScript runtime-only, parity-only, rollback-only, test-only, frontend, and deferred surfaces.
- Go-owned Match job lifecycle contracts for claim, lease, heartbeat, retry, failure, attempt rows, diagnostics redaction, duplicate-claim prevention, and rollback/no-fallback behavior.
- `runtime-execution-service-v1.15`, a DB-free TypeScript execution service invoked by Go through `strategy-runtime-abi-v1.14` while keeping hostile Strategy execution outside Go and web/API.
- Go-owned Match completion and Chronicle persistence handoff with lease validation, Chronicle metadata/hash checks, idempotency, atomic persistence, replay compatibility, and failure-safe behavior.
- Go-owned MatchSet scoring/status refresh with parity for complete, degraded, failed-system, strategy-failure penalty, survivor totals, survival turns, and tie-breakers.
- Go-owned selected public evidence and normal web paths, strict topology/monitor/rollback/failure/page-smoke gates, replay realism checks, and Docker/OrbStack retest evidence.

### What Worked

- The milestone audit found a real gap: Go lifecycle primitives existed before the Go orchestration runner tied them into a normal path. Fixing that before closure made the promotion evidence much stronger.
- Keeping Strategy execution in the TypeScript runtime service let Go own orchestration without crossing the hostile-code boundary.
- OrbStack retesting caught and fixed container sandbox IPC details after the temporary local Postgres path had already passed.
- The final representative page-smoke addition converted a live browser surprise on `/players/local` into a reusable milestone gate.

### What Was Inefficient

- The installed `gsd-sdk` still lacks the documented `query` interface, so milestone completion required the legacy `gsd-tools.cjs` path plus manual cleanup of MILESTONES, ROADMAP, PROJECT, and STATE.
- The archive helper extracted weak accomplishments from summaries, so milestone narrative still needed a human-quality rewrite.
- Live local topology depends on several processes and environment switches, which makes the final proof valuable but somewhat ceremony-heavy.

### Patterns Established

- Backend ownership migration should include both positive topology evidence and stopped-service/no-fallback drills.
- Public route promotion must include page-load smoke, not only DTO/route smoke.
- Remaining TypeScript surfaces need explicit labels so "frontend/runtime/parity/test/rollback/deferred" stays inspectable.
- Go can own normal backend persistence/orchestration while TypeScript remains a strict runtime execution island.

### Key Lessons

- Do not mark backend-ownership milestones done until at least one representative route for every major page shape returns a real page.
- Treat final audit findings as product truth, not paperwork; the Go orchestration runner was the difference between primitives and ownership.
- Docker/OrbStack evidence should be part of closure whenever runtime/container claims are involved.

### Cost Observations

- Model mix: not recorded.
- Sessions: one extended v1.15 thread with research, phase execution, code review, audit-fix, Docker retest, browser repair, page-smoke hardening, and archive pass.
- Notable: the highest-signal final checks were the milestone audit, live local topology, browser page inspection, and Docker/OrbStack retest.

## Cross-Milestone Trends

| Trend | Observation |
| --- | --- |
| Verification depth | Later audit passes became more valuable as cross-phase surfaces appeared; v1.1 showed persisted service-backed flows need explicit proof beyond fixtures, v1.2 showed local browser UAT catches route/scoring issues after build success, v1.3 showed live replay realism checks catch product-quality strategy issues after correctness passes, v1.4 showed generated tournament evidence is essential after scheduler changes, v1.5 showed Strategy library quality needs replay/metric review beyond validation, v1.6 showed analytics needs privacy/runtime/export/browser verification together, v1.7 showed contract parity fixtures are the right bridge before backend/runtime rewrites, and v1.15 showed every major page shape needs a smoke check before milestone closure. |
| Metadata hygiene | Summary, validation, UAT, and audit artifacts should be maintained during execution, not repaired at close. |
| UI polish | Narrow viewport/browser review caught issues after automated checks; responsive screenshots, local page checks, awkward intermediate widths, and playback ergonomics should move earlier in UI phases. |
| Package boundaries | Keeping runtime execution out of web/API and importing narrow server modules prevents trust and bundling regressions. |
| Competitive trust | Each competition milestone works best when it keeps the promise modest: exhibition before ladder, resettable ladder before durable ratings, governance before official tournaments. |
| Boundary evolution | Freeze contracts and prove parity before changing implementation ownership; this keeps Go backend and multi-language runtime work incremental instead of cliff-shaped. v1.10 reinforced the pattern by moving two service-backed read slices and exactly one Go read-model route while keeping writes and runtime promotion deferred. v1.11 added required live Go evidence and no-fallback proof while still avoiding production Go routing. v1.14 turned Strategy artifacts and runtime ABI into explicit contracts, making Go orchestration a plausible next ambitious move without moving hostile Strategy execution into Go. v1.15 then promoted normal backend orchestration to Go while keeping Strategy execution isolated in the TypeScript runtime service. |
