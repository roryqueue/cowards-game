# Domain Pitfalls

**Domain:** Coward's Game v1.36 Competition Maturity
**Researched:** 2026-06-15
**Overall confidence:** HIGH

## Scope

v1.36 should move competition from alpha/trial posture toward mature public beta without changing game rules, moving Strategy execution into web/API/Go, or making stronger runtime/sandbox/package/account-recovery claims than v1.35 proves. The risk profile is not mostly "add moderation." The risks are trust-contract drift: standings that look more durable than they are, counted-entry paths that bypass provider proof, governance states that are not recomputable, public copy that overpromises, and replay/result evidence that is either privacy-unsafe or insufficient to explain outcomes.

Recommended requirement categories for the roadmap:

| Category | Purpose |
| --- | --- |
| `INV` | Inventory all competition surfaces and lock decisions before behavior changes. |
| `POSTURE` | Define honest public beta, resettable trial season, durable rating, and copy claims. |
| `ENTRY` | Tighten counted entry, one-active-revision, same-user, self-play, and provider-proof eligibility. |
| `SEASON` | Define season lifecycle, reset policy, counted/degraded/non-counted behavior, and archive semantics. |
| `RESULT` | Govern result states, recomputation, invalidation, disputes, and public-safe evidence. |
| `ABUSE` | Add minimal abuse/dispute/recovery expectations without implying full moderation maturity. |
| `PUBLIC` | Update standings, result, replay, player, Strategy, and competition pages with accurate trust copy. |
| `VERIFY` | Prove entry -> MatchSet -> execution -> result -> standings -> replay plus negative/privacy/realism drills. |

Recommended phase shape:

1. **Competition Surface Inventory and Posture Contract** - `INV`, `POSTURE`
2. **Counted Entry and Season Eligibility Rules** - `ENTRY`, `SEASON`
3. **Standings, Results, and Governance State Model** - `RESULT`, `SEASON`
4. **Abuse, Dispute, Recovery, and Public Trust UX** - `ABUSE`, `PUBLIC`
5. **End-to-End Competition Proof and Boundary Monitors** - `VERIFY`

## Critical Pitfalls

### Pitfall 1: Public Beta Copy Implies Durable Ratings Or Mature Governance

**What goes wrong:** Public pages describe the competition as ranked, official, permanent, production-ready, abuse-managed, or dispute-resolved when the product still has resettable trial seasons, no durable permanent ratings, and limited moderation/account-recovery maturity.

**Why it happens:** v1.36's goal says "toward mature public beta," and prior milestones already have public standings/results/replay evidence. That makes it easy for copy, badges, or nav labels to outrun the actual governance proof.

**Consequences:** Players treat trial standings as permanent reputation. Disputes create trust damage because the UI implied guarantees the system cannot meet. Future durable rating work inherits ambiguous historical data.

**Prevention:** Create a versioned competition posture contract before UI work. Require exact language for resettable seasons, trial ladders, counted status, degraded states, dispute outcomes, and no durable rating promise. Use conservative public labels such as "trial season," "resettable standings," and "counted for this season" unless stronger behavior is explicitly built and proven.

**Detection:** Search UI/docs/API fixtures for forbidden or ambiguous terms: "permanent rating," "official rating," "Elo," "Glicko," "ranked forever," "moderated," "appealable," "guaranteed recovery," "production sandbox," "certified." Snapshot public pages for reset/dispute/counting explanations.

**Requirement category:** `POSTURE`, `PUBLIC`, `VERIFY`
**Phase:** Phase 1, then enforced in Phase 4 and Phase 5.

### Pitfall 2: Counted Entry Uses Stale Or Partial v1.35 Eligibility Evidence

**What goes wrong:** A Strategy Revision enters counted ladder play with missing, stale, mismatched, unsupported, package-declared, unavailable-runtime, hidden TinyGo, or provider-proof metadata that was valid for a prior save/check but no longer matches current policy.

**Why it happens:** v1.35 fixed provider-proof-backed account save and entry gates. v1.36 adds competition policy on top. If season entry code reuses old display labels or cached checker state instead of the saved immutable provider-proof/readiness tuple, counted eligibility drifts.

**Consequences:** Standings contain results from unproven or ineligible revisions. Later invalidation is hard to explain and can require season reset. It can also create a false runtime/sandbox/package claim.

**Prevention:** Counted entry must consume the immutable Strategy Revision's current provider proof, source/artifact identity, runtime/provider id, engine compatibility, sandbox-readiness label, package mode `none`, owner/account state, and supported-language registry. Do not accept Workshop-local checker state as entry proof. Fail closed or classify as non-counted where proof is unavailable.

**Detection:** Negative tests for stale proof, missing proof, mismatched source/artifact, unsupported provider, package mode not `none`, hidden TinyGo, unavailable runtime, draft/non-execution revision, and provider-policy drift. Public entry errors must be public-safe and must not expose raw provider diagnostics.

**Requirement category:** `ENTRY`, `VERIFY`
**Phase:** Phase 2 and Phase 5.

### Pitfall 3: Same-User, Multi-Revision, And Self-Play Rules Blur Exhibition And Trial Competition

**What goes wrong:** Self-play remains allowed where it should be an explicit exhibition/study feature, or the roadmap blocks self-play globally and breaks legitimate Workshop/gauntlet/exhibition analysis. A user may enter multiple revisions into the same trial standings without a clear one-active-revision rule.

**Why it happens:** Project decisions intentionally allowed same-user multi-revision exhibition entry in alpha because it is useful for doctrine testing. v1.36 must mature competition without changing the value of self-play as a learning tool.

**Consequences:** Trial standings can be manipulated by one user farming their own revisions, or useful self-play workflows regress. Public player/Strategy pages become misleading if same-account results are mixed with public competition evidence.

**Prevention:** Split policy by mode. Exhibitions and private/study MatchSets may allow same-user and multi-revision play with clear non-counted labels. Trial ladder seasons should choose and enforce a one-active-counted-revision-per-user-per-season policy, or explicitly document any exception. Same-user Matches should be non-counted unless the posture contract deliberately permits them for a named season type.

**Detection:** Tests for one user entering two revisions into counted season, self-play counted attempt, same-user exhibition allowed, same-user public result label, and standings recomputation excluding non-counted self-play. UI snapshots should show why the MatchSet is counted or non-counted.

**Requirement category:** `ENTRY`, `SEASON`, `PUBLIC`
**Phase:** Phase 2, reflected in Phase 4.

### Pitfall 4: Degraded, Failed, Disputed, And Invalidated Results Pollute Standings

**What goes wrong:** Standings include MatchSets that are running, degraded, system-failed, stale-artifact, runtime-unavailable, disputed, invalidated, or manually governed without a clean counted/non-counted decision.

**Why it happens:** Prior milestones have rich result states and public evidence. v1.36 adds maturity pressure, which can tempt developers to aggregate "whatever has an outcome" instead of only recomputable counted outcomes.

**Consequences:** Standings become non-deterministic product truth rather than an auditable projection. A later governance action can silently move ranks without clear evidence.

**Prevention:** Define a small result-state lattice: counted, non-counted, degraded-non-counted, disputed-pending, invalidated, system-failed, strategy-failed-counted if policy allows, and archived. Standings must be recomputed from source MatchSet/result/governance events and should explain excluded results in public-safe terms.

**Detection:** Fixture and service-backed tests for each state. Recompute standings twice from the same events and assert identical output. Verify public standings explain exclusions without raw diagnostics, quarantine details, operator action internals, tokens, DB ids, package paths, or Strategy data.

**Requirement category:** `RESULT`, `SEASON`, `VERIFY`
**Phase:** Phase 3 and Phase 5.

### Pitfall 5: Governance Controls Become Private Operator Internals In Public Output

**What goes wrong:** Public result/standings pages expose raw governance events, operator names, internal status notes, quarantine/requeue details, DB identifiers, tokens, runtime diagnostics, package paths, or account-recovery payloads while trying to explain disputes or invalidations.

**Why it happens:** v1.28 and later built operator and quarantine mechanisms behind public-safe boundaries. v1.36 needs public-facing governance explanations, but raw internal evidence is not public evidence.

**Consequences:** Privacy leaks, operational security exposure, and public confusion. Public pages become a debugging console instead of a trust projection.

**Prevention:** Store and expose separate projections. Operator/internal events may include private audit data; public governance evidence should expose only status, reason category, effective time, affected MatchSet/season ids, counted impact, and replay/result availability. Public copy should never display raw diagnostics or operator-only details.

**Detection:** Privacy scans over public JSON, rendered pages, fixtures, logs used as proof, generated artifacts, and public discovery APIs for forbidden markers. Tests should verify internal governance rows can exist without appearing in default public projections.

**Requirement category:** `RESULT`, `ABUSE`, `PUBLIC`, `VERIFY`
**Phase:** Phase 3, Phase 4, and Phase 5.

### Pitfall 6: Dispute UX Promises Investigation Or Appeals The Product Cannot Deliver

**What goes wrong:** The UI invites disputes, appeals, reports, or recovery requests as if there is a staffed moderation workflow, SLA, full audit trail, or account recovery process, when v1.36 only proves limited status controls and expectation surfaces.

**Why it happens:** "Competition maturity" naturally suggests dispute handling. The baseline explicitly says limited abuse/dispute/account recovery maturity unless this milestone proves changes.

**Consequences:** Users submit sensitive information the system is not prepared to protect or act on. Product trust erodes when reports disappear or have unclear outcomes.

**Prevention:** Scope a minimal policy surface: what can be reported, what happens now, what outcomes exist, what data is public, what remains future work, and what account recovery cannot guarantee. If no workflow is built, make the page informational rather than a collection form. If a form is built, schema-limit payloads and keep them private by default.

**Detection:** UX review for overpromising verbs: "appeal," "recover," "restore," "investigate," "moderated," "resolved," "guaranteed." Tests for report/dispute payload redaction and public result pages showing only public-safe dispute states.

**Requirement category:** `ABUSE`, `PUBLIC`, `VERIFY`
**Phase:** Phase 4 and Phase 5.

### Pitfall 7: Season Reset Semantics Are Not Explicit Or Auditable

**What goes wrong:** A trial ladder season resets or archives standings without clear public timing, archived evidence, result inclusion rules, or player-facing explanation. Old pages keep implying current rank, or new season pages mix old counted results with new standings.

**Why it happens:** Resettable seasons are a deliberate compromise before durable ratings. Without a formal season lifecycle, resets become ad hoc data edits.

**Consequences:** Players perceive rank loss as a bug or manipulation. Public discovery links show stale standings without context. Future durable rating work cannot cleanly separate trial histories.

**Prevention:** Define season states and transitions: draft/configured, open, locked/executing, finalized, archived, reset/superseded. Public pages must identify the season, state, reset policy, counted window, archive link, and whether standings are current or historical. Do not delete evidence needed to explain prior results.

**Detection:** Tests for season transition validity, archive/read-only behavior, standings not mixing seasons, reset copy on competition pages, and stable public links to historical result/replay evidence.

**Requirement category:** `SEASON`, `RESULT`, `PUBLIC`
**Phase:** Phase 2 and Phase 3, surfaced in Phase 4.

### Pitfall 8: Public Replay/Result Evidence Is Too Weak To Support Trust

**What goes wrong:** Standings and player/Strategy pages show rank changes or counted results without enough public-safe evidence to trace them to MatchSets, results, Chronicles, and replay availability. Conversely, evidence tries to be complete by leaking private data.

**Why it happens:** Coward's Game is Chronicle-first, and public trust depends on replayable deterministic evidence. v1.36 aggregation surfaces can accidentally flatten evidence into rank rows.

**Consequences:** Users cannot inspect why they moved in standings. Disputes become unresolvable from public evidence. Private Strategy data can leak if pages expose owner/debug projections to fill the explanation gap.

**Prevention:** Every public counted standing/result row should link to public-safe MatchSet result and replay evidence when available, or show an honest unavailable/degraded reason. Public evidence may include hashes, provider ids, contract versions, counted status, season id, result state, and replay availability, but not Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw Awareness Grids, raw diagnostics, artifact bytes, operator internals, or recovery payloads.

**Detection:** E2E path: counted entry -> completed MatchSet -> standings row -> result page -> replay page. Negative paths for missing Chronicle, no result, degraded, disputed, invalidated, and unavailable replay. Privacy scans across the same surfaces.

**Requirement category:** `RESULT`, `PUBLIC`, `VERIFY`
**Phase:** Phase 3, Phase 4, and Phase 5.

### Pitfall 9: Verification Skips Board Realism While Focusing On Policy

**What goes wrong:** Competition proof validates entry/standing states but misses clipped, off-board, empty, or implausible replay boards. Public trust pages then link to replay evidence that visually undermines the result.

**Why it happens:** v1.36 is policy-heavy. Prior milestones established board realism checks, but roadmap pressure can move validation toward database/state tests only.

**Consequences:** A counted MatchSet appears mathematically valid but visually broken. Players cannot trust replay evidence, and regressions in canonical arena/start positions slip through.

**Prevention:** Keep replay/result realism checks mandatory in final proof. Validate visible Soldier and terrain positions are inside declared board bounds, STONE and FALLEN rendering semantics are preserved, canonical arenas contain canonical starting positions, and local browser validation shows a plausible full Match start.

**Detection:** Automated replay projection checks plus Playwright screenshot/canvas checks for result/replay pages. Include at least one completed counted MatchSet and one degraded/non-counted state in browser proof.

**Requirement category:** `VERIFY`, `RESULT`, `PUBLIC`
**Phase:** Phase 5, with test requirements seeded in earlier phases.

### Pitfall 10: Competition Maturity Accidentally Changes Game Rules

**What goes wrong:** A standings, dispute, fairness, or anti-abuse fix changes Match rules, MatchSet scoring, Soldier outcomes, contraction, STONE/FALLEN handling, seed/arena reveal timing, or deterministic tiebreakers.

**Why it happens:** It can feel easier to improve fairness by changing the simulation or MatchSet scoring than by clarifying policy. The milestone boundary explicitly says no game-rule changes unless approved.

**Consequences:** Existing Chronicle/replay compatibility, engine determinism, fixtures, strategy expectations, and prior public evidence drift. Roadmap work becomes rule migration rather than competition maturity.

**Prevention:** Treat the engine, Chronicle grammar, canonical terminology, and MatchSet scoring as locked inputs. Competition maturity should classify and aggregate existing deterministic outcomes, not alter rules. Any proposed rule change must be separated into an explicit approved rules milestone.

**Detection:** Boundary monitor for engine/spec changes, scoring changes, Chronicle schema drift, canonical terminology drift, and fixture rebaselines. Re-run deterministic replay tests: same seed + same Strategy Revisions + same engine version = same Chronicle.

**Requirement category:** `INV`, `RESULT`, `VERIFY`
**Phase:** Phase 1 and Phase 5.

### Pitfall 11: Competition Work Pulls Strategy Execution Or Validation Into Web/API/Go

**What goes wrong:** To make eligibility, disputes, or standings faster, code runs Strategy validation/build/execution in web/API/Go, uses Node `vm` as a security boundary, or adds local fallback when runtime-service is unavailable.

**Why it happens:** Competition flows need quick answers: "is this revision eligible?", "can this MatchSet count?", "why did this fail?" v1.35 proved the correct answer is provider/runtime evidence, not local hostile-code shortcuts.

**Consequences:** Hostile Strategy code crosses the trusted process boundary. Public beta posture becomes materially unsafe and contradicts core project constraints.

**Prevention:** Eligibility and result governance consume stored provider proof, provider-safe metadata, runtime-service outcomes, and validated public projections. Runtime-service unavailable means unavailable/non-eligible/non-counted, not local fallback. Keep all runtime outputs crossing trust boundaries schema validated.

**Detection:** Boundary monitors for Strategy execution imports/calls in web/API/Go, Node `vm`, subprocess fallbacks, direct provider execution, and runtime-service bypass. Tests for runtime unavailable producing honest non-eligibility rather than local validation.

**Requirement category:** `ENTRY`, `RESULT`, `VERIFY`
**Phase:** Phase 2, Phase 3, and Phase 5.

### Pitfall 12: Player And Strategy Public Pages Leak Private Competition Context

**What goes wrong:** Public player/Strategy pages expose Strategy source, private memory, objective payloads, owner-debug evidence, private analytics, account-recovery state, dispute internals, or raw diagnostics while adding competition history and standing context.

**Why it happens:** v1.31 added public discovery pages, and v1.36 will likely enrich them with eligibility, counted status, season participation, and result evidence. Those pages sit close to account-owned Strategy and owner-private data.

**Consequences:** Opponents can infer private doctrine internals. Account and dispute data leaks through profile/history surfaces.

**Prevention:** Public pages should consume only public-safe projections. Strategy cards can show publication state, language/provider labels, counted eligibility category, season participation, public result links, and replay evidence availability. Owner-only source/debug/analytics must stay behind authenticated account routes and no-store/private responses.

**Detection:** Public route tests as anonymous, owner, and other signed-in user. Snapshot/JSON scans for Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw Awareness Grid, owner debug, account recovery, dispute internals, package paths, host paths, tokens, DB details, and private runtime internals.

**Requirement category:** `PUBLIC`, `ABUSE`, `VERIFY`
**Phase:** Phase 4 and Phase 5.

### Pitfall 13: Recomputability Is Sacrificed For Cached Standings Convenience

**What goes wrong:** Standings are stored as mutable rows that cannot be regenerated from seasons, entries, MatchSets, results, and governance events. Manual status changes update the visible rank but not the source evidence.

**Why it happens:** Public standings need to be fast and stable. Mature-looking tables can mask an unauditable write model.

**Consequences:** Bugs and disputes cannot be repaired deterministically. Reset/archive behavior becomes data surgery. Public evidence links disagree with rank totals.

**Prevention:** Treat standings as projections over immutable or append-only source facts: season config, entry eligibility snapshot, MatchSet ids, result states, governance events, and invalidation/dispute status. Caches are acceptable only with invalidation rules and a recomputation test oracle.

**Detection:** Recompute test that drops cached standings and regenerates identical public output. Mutating a governance event should trigger or require standings refresh. Public row totals must match linked counted MatchSets.

**Requirement category:** `RESULT`, `SEASON`, `VERIFY`
**Phase:** Phase 3 and Phase 5.

### Pitfall 14: Account Recovery Expectations Undermine Strategy Immutability And Ownership

**What goes wrong:** Recovery copy or tooling implies users can regain, reassign, mutate, or replace Strategy Revisions after submission to a Match/season. Recovery payloads may appear in public pages or governance evidence.

**Why it happens:** Public beta expectations often include account recovery. The project explicitly defers enterprise-grade recovery unless scoped and proven.

**Consequences:** Immutable competition assets lose trust. Disputes can become claims to revise or reassign historical entries. Private account data leaks.

**Prevention:** Keep recovery expectations narrow. Explain that Strategy Revisions submitted for Match or MatchSet play are immutable. If recovery is informational only, do not build public collection forms. If limited recovery controls exist, keep them separate from competition result mutation and public projections.

**Detection:** Tests and copy review for "restore revision," "edit submitted," "replace counted entry," or public recovery status. Privacy scans for account-recovery payloads on result/replay/player/Strategy/standings pages.

**Requirement category:** `ABUSE`, `POSTURE`, `PUBLIC`
**Phase:** Phase 4.

### Pitfall 15: Abuse Controls Create Hidden Eligibility Or Ranking Penalties

**What goes wrong:** A report, dispute, or admin status silently suppresses a player, Strategy, or MatchSet from standings without public-safe explanation or auditable state. Alternatively, abuse controls expose too much and become public shaming.

**Why it happens:** Minimal abuse controls are often implemented as ad hoc flags. Competition maturity needs clear outcomes, not hidden table filters.

**Consequences:** Players cannot understand why results count or do not count. Operators cannot audit actions. Public trust decreases because standings look manipulated.

**Prevention:** Define explicit public-safe governance states: under review, disputed, invalidated, non-counted by policy, removed from public discovery, or archived. Separate private reasons from public categories. Do not create hidden rank penalties without a public state and internal audit event.

**Detection:** Tests that each abuse/governance state has a public-safe projection, standings impact, audit record, and privacy scan. Anonymous users should see status categories, not private allegations or operator notes.

**Requirement category:** `ABUSE`, `RESULT`, `PUBLIC`, `VERIFY`
**Phase:** Phase 3, Phase 4, and Phase 5.

## Moderate Pitfalls

### Pitfall 16: Eligibility Labels Drift Across Entry, Strategy Cards, Results, Replays, And Standings

**What goes wrong:** One page says a Strategy is counted eligible, another says non-counted/degraded, and a replay result uses a third language/provider/sandbox label.

**Prevention:** Derive labels from one spec-owned eligibility/posture contract and one public projection adapter. Add snapshot tests across competition index/detail, entry dashboard, player page, Strategy page, result, replay, and standings.

**Requirement category:** `ENTRY`, `PUBLIC`, `VERIFY`
**Phase:** Phase 2, Phase 4, and Phase 5.

### Pitfall 17: Trial Season Pages Hide Limited Abuse And Recovery Maturity

**What goes wrong:** Public pages are accurate in small print but the primary status language feels like a fully mature competitive league.

**Prevention:** Put resettable/trial posture, counted-status meaning, degraded-state treatment, dispute limitations, and account-recovery limitations in first-class page copy near entry and standings actions.

**Requirement category:** `POSTURE`, `PUBLIC`
**Phase:** Phase 1 and Phase 4.

### Pitfall 18: Non-Counted Exhibitions Become Discovery-Equivalent To Counted Competition

**What goes wrong:** Public discovery surfaces rank or highlight exhibition/self-play/degraded MatchSets beside counted season results with the same visual treatment.

**Prevention:** Use distinct labels and filters. Discovery may show exhibitions, but standings and player/Strategy competitive summaries must separate counted season evidence from non-counted study evidence.

**Requirement category:** `SEASON`, `PUBLIC`
**Phase:** Phase 2 and Phase 4.

### Pitfall 19: MatchSet Scoring And Tie-Breakers Are Reimplemented In UI

**What goes wrong:** React pages or client utilities duplicate scoring logic and drift from deterministic backend/spec behavior.

**Prevention:** UI consumes public result/standing projections. Shared scoring/tie-breaker contracts stay outside React, with tests for deterministic ordering.

**Requirement category:** `RESULT`, `VERIFY`
**Phase:** Phase 3 and Phase 5.

### Pitfall 20: Historical Public Links Break During Season Reset Or Result Invalidation

**What goes wrong:** Result/replay/player/Strategy links 404 or change meaning after reset, archive, dispute, or invalidation.

**Prevention:** Keep immutable public identifiers for MatchSets/results/replays and season archive pages. Invalidation changes status and counted impact, not evidence addressability unless privacy/security requires removal.

**Requirement category:** `SEASON`, `RESULT`, `PUBLIC`
**Phase:** Phase 3 and Phase 4.

## Minor Pitfalls

### Pitfall 21: Canonical Terminology Drifts In Competition Copy

**What goes wrong:** Public pages say turn, piece, dead, bot, game, or move where the canonical terms are Round/Activation/Cycle, Soldier, STONE/FALLEN, Strategy, Match, and Action/Advance.

**Prevention:** Add copy review or snapshot scan for forbidden terminology on new competition pages.

**Requirement category:** `PUBLIC`, `VERIFY`
**Phase:** Phase 4 and Phase 5.

### Pitfall 22: Public Copy Uses Security Language As Marketing

**What goes wrong:** Copy says "secure sandbox," "safe code," or "certified runtime" while the actual claim is provider proof, provenance evidence, runtime containment evidence, and no-package policy.

**Prevention:** Reuse v1.35 sandbox-readiness labels. Keep security claims boring and evidence-scoped.

**Requirement category:** `POSTURE`, `PUBLIC`, `VERIFY`
**Phase:** Phase 1, Phase 4, and Phase 5.

### Pitfall 23: Proof Artifacts Leak Local Paths Or Operator Data

**What goes wrong:** Final markdown proof, screenshots, JSON fixtures, or logs include `/Users/...`, `/tmp/...`, DB DSNs, tokens, package paths, raw diagnostics, operator notes, or private payload keys.

**Prevention:** Treat proof artifacts as public-output-adjacent and scan them with the same forbidden-marker list.

**Requirement category:** `VERIFY`
**Phase:** Phase 5.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
| --- | --- | --- |
| Competition inventory and posture | Starting with UI copy before deciding reset/durable/dispute claims | Lock a posture contract and forbidden-claim list before implementation. |
| Counted entry and seasons | Reusing checker-ready or display-ready state as counted eligibility | Gate counted entry on immutable provider-proof/readiness metadata from v1.35. |
| Same-user and multi-revision policy | Breaking useful self-play or allowing counted self-play manipulation | Split exhibition/study policy from counted trial season policy. |
| Standings projection | Cached mutable rank rows become product truth | Build recomputable projections from season entries, MatchSets, results, and governance events. |
| Result governance | Degraded/disputed/invalidated states are vague or private-only | Define public-safe state lattice and standings impact for every status. |
| Abuse/dispute/recovery | Public UX overpromises staffed moderation or account recovery | Publish limited expectations and collect no sensitive payloads unless private handling exists. |
| Public player/Strategy pages | Competition enrichment leaks private owner/debug/source context | Use public-safe projections only and test anonymous/owner/other-user views. |
| Replay/result proof | Policy tests pass while replay visuals are broken | Keep board realism and browser replay proof mandatory. |
| Boundary monitors | Competition shortcuts bypass runtime-service | Monitor no Strategy execution in web/API/Go and no local fallback. |
| Final proof | Generated evidence leaks internals | Scan pages, APIs, fixtures, logs, screenshots metadata where practical, and proof markdown. |

## Validation Targets For Requirements

The roadmap should require these validation targets explicitly:

- Entry: valid counted entry for TypeScript, Python, Rust, and Zig with current provider proof; rejection for stale/missing/mismatched proof, unsupported provider, package mode not `none`, hidden TinyGo, draft/non-execution revision, unavailable runtime, same-user counted self-play if disallowed, and multi-active-revision conflict.
- Season: open/finalize/archive/reset lifecycle; counted window; historical archive links; no cross-season standings contamination.
- Results: completed counted, completed non-counted, degraded, system-failed, strategy-failed if counted by policy, disputed-pending, invalidated, missing Chronicle, no result, and unavailable replay.
- Standings: recomputation from source evidence produces stable output; excluded results are explainable; invalidation/dispute changes counted impact deterministically.
- Privacy: public/default output excludes Strategy source, artifact bytes, raw diagnostics, host paths, env values, package paths, tokens, DB details, private runtime internals, StrategyMemory, SoldierMemory, objective payloads, raw Awareness Grid, owner-debug data, operator internals, quarantine details, dispute internals, and account-recovery payloads.
- Copy: public beta/trial/reset/durable-rating/dispute/recovery/sandbox/package claims match the posture contract and v1.35 evidence.
- Replay realism: visible Soldier, STONE, FALLEN, and terrain positions stay inside board bounds; canonical arenas contain canonical starts; browser proof shows a plausible full Match start and replay evidence for counted results.
- Boundary: no Strategy execution in web/API/Go, no Node `vm` security boundary, no runtime-service fallback, no game-rule changes, no package/TinyGo/sandbox overclaim.

## Sources

- `.planning/PROJECT.md` - v1.36 goal, hard boundaries, prior decisions, out-of-scope durable ratings/recovery/tournaments, and current competition baseline. HIGH confidence.
- `.planning/STATE.md` - v1.36 planning status, deferred durable ratings/moderation/recovery/runtime/package/TinyGo/ABI items. HIGH confidence.
- `.planning/MILESTONES.md` - shipped v1.35 baseline and prior competition/runtime/replay decisions. HIGH confidence.
- `.planning/milestones/v1.35-REQUIREMENTS.md` - provider-proof, entry, ownership, privacy, sandbox-readiness, and package-policy gates now available to v1.36. HIGH confidence.
- `.planning/milestones/v1.35-ROADMAP.md` - delivered phases 243-248 and proof expectations. HIGH confidence.
- `.planning/research/SUMMARY.md` - v1.35 research synthesis and carried-forward trust-boundary risks. HIGH confidence.
- `CowardsGameSpec_Full_Consolidated_v1.md` - deterministic Match/Set, Strategy Revision immutability, Chronicle, privacy, runtime constraints, competitive structures, and canonical terminology. HIGH confidence.
- `CowardsGame_Technical_Architecture_Spec_V1.md` - pure engine, web/API/runtime boundaries, MatchSet scoring, replay visibility, persistence, runtime validation, and test expectations. HIGH confidence.

## Confidence Assessment

| Area | Confidence | Notes |
| --- | --- | --- |
| Competition posture risks | HIGH | Directly grounded in v1.36 milestone goal, current deferred items, and prior public standings/replay baseline. |
| Entry eligibility risks | HIGH | v1.35 provider-proof/package/sandbox/account gates are explicit and shipped. |
| Governance/standings risks | MEDIUM-HIGH | The exact v1.36 implementation is not designed yet, but recomputable projection and public-safe status needs are strongly implied by existing result/replay/governance surfaces. |
| Abuse/dispute/recovery risks | MEDIUM | The product has limited current maturity by design; exact feature scope must be decided in requirements. |
| Verification risks | HIGH | Prior milestones repeatedly require privacy scans, boundary monitors, signed-in proof, and replay board realism checks. |
