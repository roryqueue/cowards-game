# Feature Landscape: Coward's Game v1.36 Competition Maturity

**Domain:** Deterministic programmable strategy-game competition maturity
**Researched:** 2026-06-15
**Confidence:** HIGH for repo-local contracts and v1.36 requirement candidates; MEDIUM for external product norms because comparable platforms differ in enforcement and rating policy.

## Executive Feature Recommendation

v1.36 should move Coward's Game from "alpha/trial ladder exists" to "public beta competition is understandable, bounded, and auditable." That does not mean durable permanent ratings, production tournament operations, stronger sandbox claims, richer account recovery, or new game rules. It means a player can tell before entry whether a Strategy Revision is eligible, whether a MatchSet will count, what season rules apply, what happens when evidence is degraded or disputed, and what public pages intentionally do not reveal.

The mature posture for this product is: **public beta competition with resettable trial seasons and no permanent rating promise**. Exhibitions should remain flexible public proof and practice surfaces. Trial ladder seasons should be stricter: one active Strategy Revision per Player per Season, provider-proof-backed counted eligibility, no mid-season replacement, deterministic scheduling, replay-backed results, and recomputable standings. Result governance should be stateful and public-safe: `pending`, `counted`, `retrying`, `under_review`, `invalid`, `non_competitive`, and `non_counted` should have distinct visible meanings and standings effects.

Abuse, dispute, and account-recovery work should be policy-surface maturity, not a full moderation or recovery product. v1.36 should add report/flag entry points, public-safe explanations, player expectations, and operator audit events, while clearly saying that private investigation notes, raw diagnostics, account-recovery payloads, Strategy source, StrategyMemory, SoldierMemory, and objective payloads are never public by default.

## Table Stakes

Features users will expect from a public-beta competition surface. Missing these makes the product feel untrustworthy or misleading.

| Feature | Why Expected | Complexity | Exact User-Facing Behavior |
|---------|--------------|------------|----------------------------|
| Competition posture inventory | v1.36 changes trust copy across exhibitions, seasons, standings, results, replays, player pages, and Strategy pages. | MEDIUM | A developer-facing inventory lists every competition surface, current owner, counted behavior, public/private data class, governance states, and proof requirement. Public pages consistently use "public beta", "trial season", "resettable standings", and "no permanent rating" language. |
| Public beta posture decision | Users need to know whether standings are durable or experimental. Mature platforms separate provisional/intermediate standings from final standings; Codeforces explicitly treats intermediate standings as unofficial and final standings as post-system-testing output. | LOW | Competition index and season detail show: "Public beta trial season. Standings reset by season. No permanent rating is promised." Do not use "ranked rating", "Elo", "all-time rating", "official permanent rank", or equivalent copy. |
| Versioned season rules | Players must know when entries open, when scheduling begins, how replacements work, and whether standings reset. | MEDIUM | Every Season page shows status, opened/closed/scheduled/completed/archived timestamps when available, minimum entries, target pod size, scoring policy, one-entry rule, replacement policy, stale-revision policy, standings reset policy, and no-permanent-ratings policy. |
| Strict counted entry eligibility | v1.35 made provider proof the trust source for execution-ready and counted play. v1.36 must use it everywhere counted standings depend on a Strategy Revision. | HIGH | Entering a counted Season succeeds only when the account-owned Strategy Revision has current provider proof, supported language/provider, compatible runtime/engine metadata, valid provenance/artifact evidence, package mode `none`, non-hidden provider, owner authorization, and immutable revision state. Failure messages are public-safe categories, not raw diagnostics. |
| One active Strategy Revision per Player per Season | Prior trial ladder work already chose one active revision and next-season-only replacement to avoid mid-season standings confusion. | MEDIUM | The Season entry screen lets a signed-in Player enter at most one active Strategy Revision. A second entry attempt explains that the current Season is locked to the existing active Entry and revision changes apply to a future Season. |
| Exhibition versus trial ladder rules | v1.2 exhibitions allowed 2-8 distinct owned Strategy Revisions, including same-user multi-revision play. Trial seasons are stricter. | MEDIUM | Exhibition creation may allow same-user, multi-revision, and self-play MatchSets when the entrant count and proof gates pass, but labels them as exhibition proof/practice. Trial ladder counted standings disallow same-user multi-revision counted entries and should classify accidental same-user/self-play counted MatchSets as `non_competitive` or `non_counted`. |
| Immutable lock clarity | The spec requires Strategy Revisions to lock before seed, Arena Variant, and initiative reveal; ranked Sets lock for the entire Set. | MEDIUM | Entry confirmation says the selected Strategy Revision is immutable for submitted Match or Season play. Public result/replay pages show revision id, source hash, runtime label, locked timestamp, and public-safe provider/evidence labels, but never Strategy source or private memory. |
| Counted state taxonomy | Public standings need clear inclusion/exclusion semantics. | HIGH | MatchSet result, ladder Season, player, Strategy, and public discovery pages all show a normalized counted state: `pending`, `counted`, `retrying`, `under_review`, `invalid`, `non_competitive`, or `non_counted`, with a one-sentence public explanation and standings effect. |
| Recomputable standings | Mature standings must derive from replay-backed results and governance state, not stored display order. | HIGH | Standings are recomputed from counted, complete, replay-backed MatchSets using the existing scoring policy and deterministic tie-breakers. Excluded MatchSets remain visible in the MatchSet ledger with their public reason. |
| Degraded result behavior | Runtime/system failures and incomplete evidence should not silently count as clean outcomes. | HIGH | Degraded MatchSets show partial public evidence, but default to not counting unless a future explicit policy proves a safe counted path. Result copy says "Degraded; inspectable, not a clean counted outcome." |
| Dispute/report entry points | Public beta competition needs a visible path to challenge suspect results without exposing investigation data. | MEDIUM | Result pages show "Flag result" only to entrants and admins. A flag creates `under_review`/`governance_hold`, excludes the MatchSet from standings while under review, and shows "Result has been flagged for review." Public pages do not show reporter identity, private notes, operator internals, or raw diagnostics. |
| Admin governance decisions | A flagged or broken result needs a terminal public-safe outcome. | MEDIUM | Admin-only actions can mark MatchSets `counted`, `invalid`, `non_competitive`, or `non_counted`, requiring a private reason and public explanation. Each decision writes an audit event. Public pages show only counted state, public reason, public explanation, and standings effect. |
| Abuse and fair-play policy surface | Public beta competition needs explicit rules against account sharing, multi-account abuse, collusion, result manipulation, exploit abuse, harassment, and attempts to destabilize execution. | MEDIUM | A Competition Fair Play page and entry checkbox state expected behavior. Reports use public-safe categories such as `suspected_multi_account`, `account_sharing`, `collusion`, `exploit_abuse`, `harassment`, `result_manipulation`, and `platform_abuse`. The UI does not promise automated enforcement quality beyond implemented evidence. |
| Account recovery expectations | Competition integrity depends on account ownership, but v1.36 should not build a full recovery product unless scoped. | MEDIUM | Account pages and competition policy say that account recovery is limited to supported sign-in/provider/account flows. If ownership cannot be verified, staff may pause competition access rather than transfer ownership. Recovery requests and payloads are private and never appear on public player/result pages. |
| Public trust UX | Spectators need to understand why a result counts without seeing internals. | MEDIUM | Competition, Season, standings, MatchSet result, replay, player, and Strategy pages include compact trust rows: eligibility, counted state, Season state, replay evidence availability, Chronicle hash when public, public fields excluded, and runtime evidence label. |
| Privacy-safe public projections | The spec and v1.35 proof forbid leaking private Strategy/runtime data. | HIGH | Public/default APIs and UI omit Strategy source, artifact bytes, raw diagnostics, host paths, env values, package paths, tokens, DB details, private runtime internals, StrategyMemory, SoldierMemory, objective payloads, account-recovery payloads, dispute internals, operator-only details, and raw Awareness Grids unless an explicit owner-private path authorizes them. |
| End-to-end counted-flow proof | Requirement definition needs testable proof, not just copy. | HIGH | v1.36 final proof covers entry -> counted MatchSet -> execution -> result -> standings -> replay, plus degraded, non-counted, disputed, invalidated, privacy-scan, boundary-monitor, and board-realism scenarios. |

## Differentiators

Features that make Coward's Game unusually credible for programmable competition.

| Feature | Value Proposition | Complexity | Exact User-Facing Behavior |
|---------|-------------------|------------|----------------------------|
| Evidence-first counted standings | Players can inspect why a result counts or does not count. | HIGH | Each ledger row links to public result and replay evidence. Counted rows say "Counts for trial ladder standings." Excluded rows show the exclusion state and public reason. |
| Public-safe governance trail | The product can be transparent without leaking moderation or runtime internals. | MEDIUM | Result pages expose the public decision and timestamp where available; admin/private notes stay internal. |
| Trial posture honesty | The product earns trust by not overclaiming permanence. | LOW | Season pages prominently state reset behavior and no durable rating promise. Player pages label ladder history by Season, not all-time rating. |
| Provider-proof-aware entry UX | Strategy authors learn exactly which proof category blocks entry without seeing unsafe diagnostics. | MEDIUM | Entry cards show "Counted eligible" or "Not counted" with reason categories such as stale proof, unsupported provider, unavailable runtime, invalid provenance, package mode not supported, hidden provider, owner mismatch, or draft/non-execution revision. |
| Same-user/self-play separation | Players can use exhibitions for learning without contaminating standings. | MEDIUM | Exhibition result cards may say "Same-user exhibition" or "Self-play exhibition" and remain public/replayable, but any such MatchSet is excluded from trial Season standings. |
| Chronicle-centered trust | The game can explain competition outcomes through deterministic replay instead of opaque adjudication. | HIGH | Counted MatchSets require replay/Chronicle evidence. Replays show board states, Soldier positions/statuses, Activations, Actions, and outcomes; private memory/objectives remain excluded by default. |

## Anti-Features

Features to explicitly avoid in v1.36.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Durable permanent rating promise | The milestone context explicitly says no durable rating promise unless planned and proven. Rating systems create recovery, refund, dispute, decay, calibration, and anti-abuse obligations. | Use resettable Season-scoped standings and per-Season history. |
| Hidden Elo/Glicko/MMR | Even if not shown, hidden durable ratings create the same trust burden once they affect matching or rank. | Deterministic pods/scheduling and transparent standings only. |
| Mid-season Strategy Revision replacement | Enables reactive counterpicking and makes standings hard to explain. | Keep next-season-only replacement for counted trial ladder entries. |
| Counting degraded/system-failure outcomes as clean wins | Users will not trust standings if incomplete evidence affects rank. | Mark as `retrying`, `under_review`, or `non_counted` until complete replay-backed evidence exists. |
| Public raw diagnostics or dispute details | Leaks private runtime, operator, account, or security information. | Show public-safe reason categories and private owner/admin-only details behind authorization. |
| Using reports as automatic punishment | False positives and abuse reports can weaponize governance. | Reports place results under review; admin/system decisions create terminal counted states. |
| Public accusation labels on player pages | Publicly branding Players without a mature enforcement process is risky and escalates disputes. | Show only result-level public counted state. Keep account sanctions private unless a future policy explicitly scopes public sanctions. |
| Broad account recovery promise | Account recovery requires identity, abuse, privacy, and ownership operations that are larger than this milestone. | Publish limited recovery expectations and competition access pause behavior. |
| Same-user/multi-revision counted ladder entries | Lets one Player occupy multiple standings slots and manipulate pairings. | Allow in exhibitions only; counted Seasons remain one active Entry per Player. |
| New runtime/sandbox/package claims | v1.35 explicitly bounded runtime, sandbox, TinyGo, and package support. | Reuse v1.35 evidence exactly; add no stronger public claims. |
| Strategy execution in web/API/Go | Violates project non-negotiables and security architecture. | Keep hostile Strategy validation/build/execution behind runtime-service / Runtime Broker / provider boundaries. |
| Game-rule changes to solve governance issues | v1.36 is competition maturity, not rules redesign. | Use eligibility, counted-state, scheduling, and governance policy around the existing deterministic rules. |

## Future or Deferred

These are valuable but should not be v1.36 requirements unless explicitly re-scoped.

| Deferred Feature | Why Deferred | Future Requirement Shape |
|------------------|--------------|--------------------------|
| Durable ratings | Requires rating math, season carryover, provisional status, refunds, decay, abuse handling, and public policy. | Separate rating milestone with simulation proof and dispute/refund policy. |
| Formal tournament brackets/prizes | Prize/tournament rules raise legal, eligibility, audit, and operator requirements. | Separate tournament governance milestone. |
| Full moderation console | Useful, but larger than public-beta policy surfaces. | Dedicated abuse operations milestone with queues, roles, SLAs, evidence retention, appeals, and sanctions. |
| Automated abuse detection | Risk of opaque false positives. | Add after telemetry, labels, human review, and appeal process exist. |
| Account ownership transfer/recovery product | Needs strong identity proof and fraud controls. | Separate account recovery milestone. |
| Rating refunds or retroactive standings repair | Complex once rankings are durable. | Only consider with a durable rating system; for v1.36 use recomputation and visible invalidation/exclusion. |
| Public sanction history | High privacy and defamation risk without mature policy. | Keep out unless legal/product policy explicitly approves. |
| Player-published private Chronicle details | Could be useful for learning, but risks source/memory/objective leaks. | Future opt-in publishing design with owner confirmation and scans. |

## Requirement Candidate Categories

### POSTURE: Competition Posture and Surface Inventory

- `POSTURE-01`: Inventory all v1.36 competition surfaces: exhibitions, trial ladder seasons, entry dashboards, Season pages, standings, MatchSet results, replays, player pages, Strategy pages, governance/admin routes, public discovery, proof artifacts, privacy scans, and boundary monitors.
- `POSTURE-02`: Classify each surface by counted behavior, public/private data class, authority owner, source contract, public copy, and proof requirement.
- `POSTURE-03`: Publish one product posture contract: public beta, resettable trial seasons, no durable permanent rating, no stronger runtime/sandbox/package claims than v1.35, no game-rule changes.

### SEASON: Entry and Season Rules

- `SEASON-01`: Season policy DTOs must expose one-entry-per-user, next-season-only replacement, stale revision policy, standings reset, no permanent ratings, minimum entries, target pod size, scoring policy, and Season status.
- `SEASON-02`: Counted Season entry must require current v1.35 provider proof and reject draft/non-execution, invalid, stale-proof, missing-proof, mismatched-proof, unsupported-provider, hidden TinyGo, unavailable-runtime, package-declared, owner-mismatch, and incompatible engine/runtime cases.
- `SEASON-03`: Entry UI must show public-safe block reasons and never expose raw diagnostics, Strategy source, artifact bytes, package paths, host paths, env values, tokens, DB details, or provider internals.
- `SEASON-04`: Counted trial ladder permits one active Entry per Player per Season. Replacement is next-season-only.
- `SEASON-05`: Exhibitions may allow same-user/multi-revision/self-play where existing entrant rules allow it, but must label those MatchSets as exhibition-only and not counted for trial ladder standings.

### RESULT: Standings and Result Governance

- `RESULT-01`: Define public counted-state semantics for `pending`, `counted`, `retrying`, `under_review`, `invalid`, `non_competitive`, and `non_counted`.
- `RESULT-02`: Standings must aggregate only counted, complete, replay-backed MatchSets and deterministic scoring/tie-breakers.
- `RESULT-03`: Degraded, incomplete, under-review, invalid, non-competitive, and non-counted MatchSets must remain visible in public ledgers with public explanations and excluded standings effect.
- `RESULT-04`: Admin governance marking must require counted status, public reason, public explanation, private reason/note, actor identity, and audit event.
- `RESULT-05`: Public MatchSet result pages must show lifecycle state, counted state, scoring policy, replay availability, Chronicle evidence, and public privacy exclusions.

### DISPUTE: Reports, Disputes, and Appeals

- `DISPUTE-01`: Entrants and admins can flag a MatchSet result. Non-entrants can use a generic report path only if scoped; otherwise public users see policy/contact copy.
- `DISPUTE-02`: A result flag places the MatchSet under review or governance hold and excludes it from standings until resolved.
- `DISPUTE-03`: Public pages show only "under review" and public-safe explanation; reporter identity, private notes, operator internals, raw diagnostics, and account/provider evidence remain private.
- `DISPUTE-04`: Admin resolution can restore counted status or mark invalid/non-competitive/non-counted with a public explanation and private audit details.
- `DISPUTE-05`: Appeals/dispute copy must explain that review can change counted status and standings, but does not promise rating refunds or permanent rating repair.

### ABUSE: Public Beta Fair Play and Abuse Policy

- `ABUSE-01`: Add a Competition Fair Play policy covering account sharing, multi-account manipulation, collusion, harassment, exploit abuse, result manipulation, platform abuse, and attempts to destabilize execution.
- `ABUSE-02`: Entry flow must require acceptance of Season rules and fair-play policy before counted entry.
- `ABUSE-03`: Abuse report categories must be public-safe and must not collect Strategy source, private memory, objective payloads, tokens, raw diagnostics, or account recovery secrets in public forms.
- `ABUSE-04`: Public-facing enforcement copy must be conservative: reports are reviewed, results may be held/excluded/invalidated, and accounts may lose competition access according to policy. Do not promise full moderation operations beyond implemented paths.

### RECOVERY: Account Recovery Expectations

- `RECOVERY-01`: Public account/competition copy must state what happens if a Player loses account access during a Season: existing entries remain locked unless governance suspends them; new entries require recovered/authorized account access.
- `RECOVERY-02`: Recovery requests and identity/account evidence are private. Public player, Strategy, result, and replay pages must not expose recovery payloads or account-provider internals.
- `RECOVERY-03`: If ownership cannot be verified, competition access can be paused/suspended, but Strategy Revision ownership must not be transferred through an ad hoc public workflow.

### TRUST: Public Trust UX

- `TRUST-01`: Competition index and Season pages must show posture, Season status, reset policy, no-permanent-rating policy, entry rule summary, standings effect definitions, and evidence availability.
- `TRUST-02`: Public player and Strategy pages must label records as Season-scoped/trial where applicable and show only privacy-safe Strategy metadata, source hash, runtime label, and public result/replay links.
- `TRUST-03`: Result/replay pages must include public privacy exclusions so users know Strategy source, StrategyMemory, SoldierMemory, and objective payloads are intentionally absent by default.
- `TRUST-04`: Copy snapshots or tests must prevent drift into forbidden claims such as durable rating, production sandbox certification, TinyGo production support, package ecosystem support, raw diagnostics, or private memory publication.

### PROOF: Verification and Boundary Monitors

- `PROOF-01`: Prove entry -> counted MatchSet -> execution -> result -> standings -> replay for at least one normal counted flow.
- `PROOF-02`: Prove negative counted flows: stale proof, missing proof, mismatched proof, unsupported provider, hidden TinyGo, package mode not `none`, unavailable runtime, owner mismatch, draft/non-execution revision, same-user counted ladder attempt, and mid-season replacement attempt.
- `PROOF-03`: Prove result governance states: pending, retrying, counted, degraded/non-counted, under-review, invalid, non-competitive, and non-counted, including standings recomputation.
- `PROOF-04`: Prove privacy scans across public competition, Season, standings, MatchSet result, replay, player, Strategy, report/dispute, account-recovery copy, fixtures, logs, and proof artifacts.
- `PROOF-05`: Prove boundary monitors: no Strategy execution in web/API/Go, no new runtime/sandbox/package/TinyGo claims, no public raw diagnostics/private internals, and no game-rule changes.
- `PROOF-06`: Include board realism checks for counted/replay proof: visible Soldier and terrain positions stay inside board bounds, canonical arenas contain canonical starting positions, and browser validation shows plausible Match starts rather than clipped/off-screen pieces.

## Feature Dependencies

```text
Competition Surface Inventory
  -> Posture Contract
  -> Season Rule Contract
  -> Counted-State Contract
  -> Public Trust Copy

v1.35 Provider Proof
  -> Counted Entry Eligibility
  -> Public Runtime/Eligibility Labels
  -> Counted Flow Proof

Season Rule Contract
  -> One Active Entry Per Player
  -> Next-Season Replacement
  -> Deterministic Scheduling
  -> Recomputable Standings

Counted-State Contract
  -> Result Governance
  -> Dispute/Flag Behavior
  -> Public Ledger Explanations
  -> Standings Exclusion Rules

Privacy Contract
  -> Public Trust UX
  -> Dispute/Recovery Surfaces
  -> Privacy Scans
  -> Boundary Monitors
```

## MVP Recommendation

Prioritize:

1. `POSTURE`, `SEASON`, and `RESULT` first. These define what public beta means, who can enter counted competition, and what counts.
2. `DISPUTE`, `ABUSE`, and `RECOVERY` second. These add public-beta policy surfaces without pretending to be a full operations platform.
3. `TRUST` and `PROOF` throughout, with final proof last. Copy and tests must prove the posture, privacy, governance, and replay realism.

Defer durable ratings, rating refunds, public sanction histories, full moderation tooling, and account ownership transfer. Those are larger trust systems and should not be implied by v1.36.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Existing Coward's Game contracts | HIGH | Read `.planning/PROJECT.md`, `.planning/STATE.md`, `.planning/MILESTONES.md`, v1.35 requirements/roadmap, primary specs, v1.35 proof, and prior ladder/governance phase docs. |
| Table stakes | HIGH | Directly follows existing Season/entry/governance DTOs plus common competition platform norms. |
| Differentiators | MEDIUM | Evidence-first public programmable competition is product-specific; exact UI cost depends on surface inventory. |
| Abuse/dispute/recovery scope | MEDIUM | Public policy surfaces are clear, but full enforcement/recovery operations are intentionally deferred. |
| External platform comparison | MEDIUM | Official sources agree on rules, eligibility, standings finalization, fair-play reporting, and appeals, but exact enforcement varies. |

## Sources

Primary repo sources:

- `.planning/PROJECT.md`
- `.planning/STATE.md`
- `.planning/MILESTONES.md`
- `.planning/milestones/v1.35-REQUIREMENTS.md`
- `.planning/milestones/v1.35-ROADMAP.md`
- `.planning/artifacts/v1.35-account-provider-entry-proof.md`
- `.planning/milestones/v1.2-phases/15-matchset-competition-model/15-SUMMARY.md`
- `.planning/milestones/v1.2-phases/16-exhibition-queue-and-entry/16-SUMMARY.md`
- `.planning/milestones/v1.3-phases/20-trial-ladder-season-model/20-RESEARCH.md`
- `.planning/milestones/v1.3-phases/21-ladder-scheduling-and-standings/21-RESEARCH.md`
- `.planning/milestones/v1.3-phases/23-disputes-and-competition-governance/23-RESEARCH.md`
- `CowardsGameSpec_Full_Consolidated_v1.md`
- `CowardsGame_Technical_Architecture_Spec_V1.md`
- `packages/spec/src/competition.ts`
- `packages/spec/src/service.ts`
- `packages/persistence/src/governance.ts`
- `apps/web/app/matchsets/[matchSetId]/page.tsx`

External comparison sources:

- Codeforces Contest Rules: https://codeforces.com/blog/entry/4088 - registration, allowed behavior, monitoring/disqualification, unofficial intermediate standings, final system-tested standings.
- Kaggle Competitions Documentation: https://www.kaggle.com/docs/competitions - public/private leaderboard and final-ranking pattern. The page was accessible only as rendered HTML without extracted lines in this environment; search snippets corroborated the public/private leaderboard semantics.
- Kaggle Community Guidelines: https://www.kaggle.com/community-guidelines - public community conduct baseline. The page was accessible only as rendered HTML without extracted lines in this environment.
- Chess.com Fair Play Policy: https://www.chess.com/legal/fair-play - current fair-play categories including account sharing, outside help, rating/result manipulation, and reporting.
- Lichess Fair Play: https://lichess.org/page/fair-play - fair-play categories and allowed/disallowed assistance by game type.
- Lichess Appeal: https://lichess.org/page/appeal - appeal path, affected-account-only appeals, and public-safe restriction categories.
- Google Account Help, compromised-account recovery: https://support.google.com/accounts/answer/6294825 - recovery/security expectations around suspicious activity, recovery email/phone, and device review.
- League of Legends ranked update: https://www.leagueoflegends.com/en-us/news/dev/dev-ranked-update-season-one-2025/ - reset frequency, ranked fatigue, and reset/decay communication as a mature ranked-system concern.

---
*Feature research for: Coward's Game v1.36 Competition Maturity*
*Ready for requirements definition: yes*
