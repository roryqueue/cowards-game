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

## Cross-Milestone Trends

| Trend | Observation |
| --- | --- |
| Verification depth | Later audit passes became more valuable as cross-phase surfaces appeared; v1.1 showed persisted service-backed flows need explicit proof beyond fixtures, v1.2 showed local browser UAT catches route/scoring issues after build success, v1.3 showed live replay realism checks catch product-quality strategy issues after correctness passes, and v1.4 showed generated tournament evidence is essential after scheduler changes. |
| Metadata hygiene | Summary, validation, UAT, and audit artifacts should be maintained during execution, not repaired at close. |
| UI polish | Narrow viewport/browser review caught issues after automated checks; responsive screenshots, local page checks, and playback ergonomics should move earlier in UI phases. |
| Package boundaries | Keeping runtime execution out of web/API and importing narrow server modules prevents trust and bundling regressions. |
| Competitive trust | Each competition milestone works best when it keeps the promise modest: exhibition before ladder, resettable ladder before durable ratings, governance before official tournaments. |
