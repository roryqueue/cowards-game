# Architecture Research: v1.36 Competition Maturity

**Domain:** Deterministic programmable Strategy game competition governance and public-beta trust architecture
**Researched:** 2026-06-15
**Confidence:** HIGH for ownership boundaries, privacy constraints, eligibility baseline, and recomputation shape; MEDIUM for exact schema names until v1.36 roadmap phases lock them.

## Executive Recommendation

v1.36 should integrate as a competition policy and governance layer around the existing Go-owned MatchSet lifecycle, not as a rules-engine, runtime, or Chronicle redesign. Keep the pure engine, Strategy Runtime Sandbox, runtime-service / Runtime Broker / provider boundaries, Chronicle persistence handoff, and public replay projection unchanged. Add v1.36 contracts for seasons, entry eligibility, one-active-revision enforcement, counted-state classification, standings recomputation, governance transitions, public explanations, abuse/dispute/recovery surfaces, and proof monitors.

The correct architectural center is a versioned **Competition Policy Service** owned by Go for normal product behavior and described in `@cowards/spec`. It should read immutable Strategy Revision/provider-proof state from v1.35, lock public-safe entrant snapshots at entry/scheduling time, classify MatchSets into counted/non-counted/degraded/disputed/invalidated states, recompute standings from canonical MatchSet evidence plus governance events, and publish redacted public projections. TypeScript persistence helpers can remain parity/test/rollback references where they already exist, but v1.36 public beta claims should be proven through Go-owned service-backed flows.

Do not add durable permanent ratings in v1.36. The honest product posture is resettable public beta/trial competition: public seasons, public standings, public result explanations, public replay evidence, and public audit explanations where available, with explicit reset and non-durable-rating copy. Durable rating, broad moderation tooling, and full account recovery remain future milestones unless separately scoped.

The most important design rule is to split private decision evidence from public trust evidence. Operators need enough private state to investigate disputes and policy decisions. Public users need clear status, counted impact, reset posture, and replay/result evidence. Public/default projections must not expose Strategy source, StrategyMemory, SoldierMemory, objective payloads, account-recovery payloads, private dispute notes, raw diagnostics, provider internals, host/package paths, tokens, DB details, or operator-only governance internals.

## Recommended Architecture

```text
+--------------------------------------------------------------------+
| Web UI                                                            |
| Competition, Standings, Result, Replay, Player, Strategy, Policy   |
| - Public trust copy and public-safe explanations                   |
| - Signed-in entry/dispute/recovery request surfaces                |
| - No scoring rules, no game rules, no Strategy execution           |
+-------------------------------+------------------------------------+
                                |
                                | public/account API DTOs
+-------------------------------v------------------------------------+
| Web/API Layer                                                     |
| Next routes and generated service clients                         |
| - Transport, auth session, schema validation                       |
| - Delegates normal competition reads/writes to Go where selected   |
| - May retain test/fixture/parity adapters only with explicit gates |
+-------------------------------+------------------------------------+
                                |
                                | selected Go backend
+-------------------------------v------------------------------------+
| Go Backend: Competition Policy and Orchestration Owner             |
| - Entry eligibility and one-active-revision enforcement            |
| - Season lifecycle and resettable public-beta policy               |
| - MatchSet lifecycle, Chronicle persistence handoff, scoring       |
| - Counted-state classifier and standings recomputation             |
| - Governance transitions and audit event writes                    |
| - Public-safe result/replay/player/Strategy/standings projections  |
| - Calls runtime-service; never executes Strategy code              |
+---------------+-------------------------------+--------------------+
                |                               |
                | runtime-service HTTP          | PostgreSQL
+---------------v--------------------+   +------v---------------------+
| Strategy Execution Service /        |   | Canonical Store            |
| Runtime Broker / Providers          |   | - Users, strategies        |
| - Provider validation/build/proof    |   | - immutable revisions      |
| - Strategy execution behind boundary |   | - seasons, entries         |
| - Redacted runtime diagnostics       |   | - MatchSets, Matches       |
+---------------+--------------------+   | - Chronicles, scoring      |
                |                        | - governance/audit events  |
                | schema-validated       +----------------------------+
+---------------v--------------------+
| Pure Engine + Chronicle             |
| - Deterministic rules only           |
| - Serializable replay/event log      |
| - Public/private projection boundary |
+------------------------------------+
```

## Component Boundaries

| Component | Responsibility in v1.36 | Must Not Do |
| --- | --- | --- |
| `@cowards/spec` | Own versioned competition policy, eligibility, counted-state, public explanation, audit projection, and privacy DTO schemas. | Encode mutable operator-only details in public DTOs. |
| Go backend | Own normal season lifecycle, entry gates, one-active-revision rules, MatchSet orchestration/status refresh, standings recomputation, governance writes, public projections, proof endpoints. | Execute Strategy code, invent game-rule outcomes, leak private dispute/recovery/runtime details. |
| Runtime-service / Runtime Broker / providers | Continue provider validation/build/proof and Strategy execution. Supply v1.35 proof/readiness evidence consumed by entry gates. | Decide standings, season policy, public governance states, or account recovery. |
| Pure engine and Chronicle | Preserve deterministic Match rules and replay reconstruction. | Know about seasons, standings, disputes, abuse, accounts, public beta policy, or durable ratings. |
| PostgreSQL / persistence | Store immutable revision snapshots, season entries, MatchSets, Matches, Chronicles, scoring snapshots, counted-state overrides, result flags, audit events. | Treat public explanation text as the only audit source. |
| Web UI | Render public-safe policy/trust explanations and signed-in request forms. | Own scoring/recomputation semantics, grant private access via query params, or expose source/memory/objective payloads. |
| Boundary monitors and proof scripts | Prove entry -> counted MatchSet -> execution -> result -> standings -> replay and negative governance/privacy cases. | Depend on hidden local shortcuts as public-beta evidence. |

## v1.36 Integration Areas

### 1. Season Policy and Public-Beta Posture

Use a `competitionPolicyVersion`, likely `competition-policy-v1.36`, attached to seasons, MatchSets, public standings, and proof artifacts. This policy should state:

| Policy Field | Recommended Value |
| --- | --- |
| `competitionPosture` | `public_beta_resettable` for trial ladder seasons. |
| `standingsReset` | `true`; standings are season-scoped and resettable. |
| `durableRating` | `none`; no permanent rating promise. |
| `replacementPolicy` | `next-season-only` for counted ladder entries. |
| `oneActiveRevisionPerUser` | `true` within a season. |
| `publicReplayEvidenceRequiredForCounted` | `true` for counted standings impact. |
| `governanceStates` | counted, pending, retrying, non_counted, degraded, disputed, invalidated. |

The season state machine should remain small and explicit:

```text
draft -> open -> scheduling -> active -> completed -> archived
```

Recommended semantics:

- `draft`: operator/admin setup only; not public entry-ready.
- `open`: users may enter exactly one eligible active Strategy Revision.
- `scheduling`: entries frozen while deterministic pods/MatchSets are created.
- `active`: MatchSets execute and standings recompute from evidence.
- `completed`: no new MatchSets; final season standings remain public.
- `archived`: read-only historical public projection, still resettable/non-durable.

Do not overload `archived` to mean deleted or private. Public historical pages can remain visible if their projections stay redacted.

### 2. Entry Eligibility and One-Active-Revision Rules

v1.36 should consume, not redefine, v1.35 provider-proof evidence. Entry eligibility should be a single canonical decision function used by Go entry routes, public/account dashboards, season entry APIs, and monitors.

Recommended gate order:

1. Account/session owns the Strategy Revision.
2. Season is `open`.
3. User has no active entry in the season.
4. Strategy Revision is immutable or can be locked before scheduling.
5. Validation status is valid.
6. Runtime language/provider is supported for counted play.
7. Provider proof is current and matches source/artifact identity.
8. Sandbox-readiness claim is compatible with the public policy, without claiming production certification.
9. Package policy is `none`.
10. TinyGo and unsupported/candidate lanes are rejected.
11. Revision is not already invalidated/suspended for the same season.

Recommended public entry failure categories:

| Public Category | Public Meaning | Private Detail |
| --- | --- | --- |
| `not_owner` | This Strategy Revision is not available for this account. | User/session ids, ownership lookup. |
| `season_not_open` | Entries are not open for this season. | Season transition audit. |
| `one_active_revision` | This account already has an active season entry. | Existing entry id. |
| `revision_not_ready` | Revision is not eligible for counted competition. | Validation/provider/runtime specifics. |
| `provider_proof_missing` | Current provider proof is required before entry. | Provider proof mismatch details. |
| `runtime_unavailable` | Eligibility cannot be proven right now. | Runtime-service/system diagnostics. |
| `unsupported_lane` | This runtime lane is not supported for counted entry. | TinyGo/candidate/provider internals. |
| `package_policy` | Packages or host imports are not supported for this competition. | Package/import path details. |
| `account_policy_hold` | Account policy prevents entry right now. | Abuse/recovery/private account state. |

Public entry DTOs should include the category, user-facing message, season id, policy version, and whether retry is reasonable. They should not include source, raw diagnostics, artifact bytes, provider signing proof, host paths, package paths, or account policy internals.

### 3. Same-User, Multi-Revision, and Self-Play Semantics

Keep exhibitions more permissive than counted seasons while still public-safe:

| Context | Recommended Rule |
| --- | --- |
| Public/non-counted exhibitions | Allow same-user and multi-revision self-play if both revisions pass non-counted execution gates; label as non-counted or exhibition evidence. |
| Counted trial ladder season | One active entry per user per season; no same-user pairings because each user contributes one active revision. |
| Future tournaments | Use the v1.36 policy hook but defer broader rules until tournament scope. |
| Player/Strategy pages | Show public result links and non-counted/counting status; do not expose private source or private reasons. |

The one-active-revision rule belongs at the entry table/index and service layer. The current `unique(season_id, owner_user_id)` is a good baseline; v1.36 should ensure it aligns with replacement policy. If withdrawn entries should allow replacement in the same season, the schema needs a partial unique index. The recommended v1.36 policy is stricter: replacement is next-season-only, so keep uniqueness across the season and make withdrawal non-counted/no replacement.

### 4. Counted-State Governance Model

The existing `match_sets.counted_status`, `public_counted_reason`, `public_counted_explanation`, `review_status`, `result_flags`, and `competition_audit_events` are the right foundation, but v1.36 should make the state model explicit and recomputable.

Recommended counted states:

| State | Meaning | Standings Impact | Set By |
| --- | --- | --- | --- |
| `pending` | MatchSet lacks terminal evidence. | Excluded. | System classifier. |
| `retrying` | Execution is still running/retrying. | Excluded. | System classifier. |
| `counted` | Complete replay-backed evidence satisfies season policy. | Included. | System classifier or admin resolution. |
| `non_counted` | Valid MatchSet but intentionally excluded. | Excluded. | Policy/admin. |
| `degraded` | System failure or missing evidence prevents trustworthy counting. | Excluded by default. | System classifier. |
| `disputed` | Participant/admin review hold. | Excluded while open. | Flag or admin. |
| `invalidated` | Result must not count due to invalid result/evidence/policy violation. | Excluded. | Admin/governance. |

Current stored values such as `under_review`, `invalid`, `non_competitive`, and `failed_system/degraded` can map to this public vocabulary, but the roadmap should decide whether to migrate storage names or introduce a v1.36 projection enum. Prefer adding a projection enum first to avoid risky data migration during roadmap execution.

Public reasons should remain coarse:

| Public Reason | Use For |
| --- | --- |
| `complete_evidence` | Counted result with full replay-backed evidence. |
| `incomplete_evidence` | Pending/running/missing Chronicle evidence. |
| `system_failure` | Runtime/orchestration failure not attributable as a Strategy loss. |
| `governance_hold` | Open dispute/review hold. |
| `invalid_result` | Admin invalidated result or evidence. |
| `non_counted_policy` | Exhibition, self-play, trial, or policy-excluded result. |
| `account_policy` | Public-safe account/recovery/abuse policy hold. |

Do not expose raw result flag notes, admin private notes, operator action rows, quarantine internals, runtime raw diagnostics, or private account recovery evidence.

### 5. Standings Recalculation

Use deterministic recomputation from canonical evidence rather than mutable incremental standings as source of truth.

Recommended model:

```text
Season row
  + active/eligible entry snapshots
  + scheduled MatchSets
  + MatchSet scoring snapshots refreshed by Go
  + counted-state classifier
  + governance/audit events
  -> recompute season standings
  -> optionally persist materialized standings snapshot with input hash
  -> publish public standings projection
```

Authoritative inputs:

- `trial_ladder_seasons`: policy and lifecycle.
- `trial_ladder_entries`: immutable public-safe entrant snapshots and entry status.
- `match_sets`: status, scoring, degraded, counted status, ladder linkage.
- `match_set_matches` / `matches`: terminal evidence and Match outcomes.
- `chronicles`: replay-backed evidence and content hashes.
- `competition_entrants`: MatchSet entrant snapshots.
- `competition_audit_events`: governance transitions and explanations.
- `result_flags`: private dispute requests and review status.

Recomputation should be pure at the service-function level: load canonical rows, classify each MatchSet, include only counted MatchSets, aggregate scoring, sort by deterministic tie-breakers, then build public DTOs. The only side effects should be optional materialization/audit rows:

- `standings_snapshot_version`
- `competition_policy_version`
- `input_evidence_hash`
- `recomputed_at`
- `recompute_reason`
- `included_match_set_ids`
- `excluded_match_set_ids` with public reasons

Recommended tie-breakers should stay aligned with current scoring:

```text
points -> wins -> survivingSoldiers -> survivalTurns -> strategyRevisionId
```

Do not place standings rules in React. Do not make public page rendering lazily mutate governance state in a way that is impossible to audit. Existing Go public reads currently refresh MatchSet status before projection; v1.36 should keep that only as a bounded status/scoring refresh and add an explicit recomputation path for season standings with proof artifacts.

### 6. Audit Model

Use an append-only competition audit log for every policy-significant transition. The current `competition_audit_events` table is a good start; v1.36 should standardize event types and public/private splits.

Recommended audit event types:

| Event | Public Projection | Private Payload |
| --- | --- | --- |
| `season_created` | Season announced/preparing. | Operator setup details. |
| `season_status_changed` | Season moved to public status label. | Actor, reason, before/after raw state. |
| `entry_created` | Entry accepted with public Strategy snapshot. | Eligibility proof ids. |
| `entry_withdrawn` | Entry withdrawn. | Request/session evidence. |
| `entry_suspended` | Entry hidden or held by policy. | Abuse/account policy evidence. |
| `match_set_scheduled` | Pod/MatchSet created. | Scheduling run details. |
| `match_set_counted_state_changed` | Counted/non-counted/disputed/invalidated explanation. | Admin/private reason, flag ids. |
| `result_flagged` | Result under review. | Participant note and reporter id. |
| `result_flag_resolved` | Review completed. | Private moderation details. |
| `standings_recomputed` | Standings refreshed from evidence. | Input hash and included/excluded ids. |
| `account_recovery_notice` | Public-safe account policy status if needed. | Recovery payloads and identity evidence. |

Public audit projections should be optional, coarse, and stable. Operator/private audit rows should remain behind admin authorization and should not be embedded in proof artifacts unless redacted.

## Contracts and Schemas

### Competition Policy Contract

```ts
type CompetitionPolicyV136 = {
  version: "competition-policy-v1.36"
  posture: "public_beta_resettable"
  seasonKind: "trial_ladder"
  standingsReset: true
  durableRating: "none"
  oneActiveRevisionPerUser: true
  replacementPolicy: "next-season-only"
  countedRequiresReplayBackedEvidence: true
  supportedCountedLanguages: ["typescript", "python", "rust", "zig"]
  packageMode: "none"
  productionSandboxCertification: "none"
}
```

This contract belongs in `@cowards/spec` and should be surfaced on public season/competition pages.

### Entry Eligibility Decision

```ts
type CompetitionEntryEligibilityV136 = {
  version: "competition-entry-eligibility-v1.36"
  ok: boolean
  seasonId: string
  strategyRevisionId: string
  policyVersion: "competition-policy-v1.36"
  publicCategory:
    | "eligible"
    | "not_owner"
    | "season_not_open"
    | "one_active_revision"
    | "revision_not_ready"
    | "provider_proof_missing"
    | "runtime_unavailable"
    | "unsupported_lane"
    | "package_policy"
    | "account_policy_hold"
  publicMessage: string
  retryable: boolean
  countedEligible: boolean
}
```

Private diagnostics can exist in operator logs or internal test-only proof, but must not appear in the public/default response.

### Counted-State Projection

```ts
type PublicCountedStateV136 = {
  version: "public-counted-state-v1.36"
  matchSetId: string
  countedState:
    | "pending"
    | "retrying"
    | "counted"
    | "non_counted"
    | "degraded"
    | "disputed"
    | "invalidated"
  publicReason:
    | "complete_evidence"
    | "incomplete_evidence"
    | "system_failure"
    | "governance_hold"
    | "invalid_result"
    | "non_counted_policy"
    | "account_policy"
  publicExplanation: string
  standingsImpact: "included" | "excluded"
  replayEvidence: "available" | "partial" | "unavailable"
}
```

### Standings Snapshot

```ts
type PublicStandingsSnapshotV136 = {
  version: "public-standings-v1.36"
  seasonId: string
  policyVersion: "competition-policy-v1.36"
  recomputedAt: string
  inputEvidenceHash: string
  resettable: true
  durableRating: false
  rows: PublicStandingDto[]
  explanation: {
    includedMatchSetCount: number
    excludedMatchSetCount: number
    tieBreakerPath: string[]
  }
}
```

The `inputEvidenceHash` should hash public-safe canonical identifiers and evidence hashes, not private Strategy/runtime payloads.

### Public Dispute and Abuse Surface

```ts
type PublicResultFlagRequestV136 = {
  matchSetId: string
  category:
    | "result_looks_wrong"
    | "replay_missing_or_corrupt"
    | "eligibility_concern"
    | "abuse_or_policy"
  note: string
}

type PublicResultFlagResponseV136 = {
  flagId: string
  publicStatus: "received" | "under_review"
  publicMessage: string
}
```

The note is private. Public pages should show only that a result is under review where policy requires standings exclusion.

### Account Recovery Surface

v1.36 should expose expectation surfaces, not a full recovery product, unless the roadmap explicitly scopes recovery implementation. Recommended public schema:

```ts
type PublicAccountRecoveryPolicyV136 = {
  version: "account-recovery-policy-v1.36"
  recoveryPosture: "limited_support_expectations"
  affectsCompetitionEntry: boolean
  publicMessage: string
  privateFieldsExcluded: [
    "identity evidence",
    "contact data",
    "operator notes",
    "account security details"
  ]
}
```

Any actual recovery payloads must be private/no-store and excluded from public player, Strategy, result, replay, and standings projections.

## Public vs Private Projections

| Surface | Public-Safe Fields | Private/Operator-Only Fields |
| --- | --- | --- |
| Season page | status, reset policy, no durable rating, entries, standings, MatchSet counted states, public explanations. | Admin setup notes, private audit before/after, abuse/recovery evidence. |
| Entry dashboard | eligibility category, provider-proof readiness label, package policy label, one-entry status. | Strategy source, artifact bytes, raw provider diagnostics, exact proof signatures. |
| Result page | counted state, standings impact, public reason, replay availability, entrant snapshots, scoring. | result flag notes, private admin notes, quarantine details, raw runtime diagnostics. |
| Replay page | public Chronicle projection, Chronicle hash, public evidence counts, privacy exclusions. | StrategyMemory, SoldierMemory, objective payloads, raw Awareness Grids by default, owner-debug unless authorized. |
| Player page | public Strategy cards, public season history, public result links. | account recovery payloads, abuse holds, private ownership/debug data. |
| Strategy page | public summary, runtime labels, source hash/bytes, public record. | source, compiled/source artifact bytes, private validation diagnostics, owner-only notes. |
| Admin/governance | allowed only with admin auth; detailed state transitions and private notes. | Never default-public. |

Public/default privacy exclusions should include:

```text
Strategy source, artifact bytes/base64, provider signing material,
StrategyMemory, SoldierMemory, objective payloads, raw Awareness Grid,
raw diagnostics, stderr/stdout, stack traces, host paths, package paths,
env values, tokens, DB details, quarantine/operator internals,
private dispute notes, account-recovery payloads, identity evidence
```

## Data Flows

### Entry to Season

```text
Signed-in user selects Strategy Revision
  -> entry eligibility decision
  -> v1.35 provider-proof/readiness/package gates
  -> one-active-revision check
  -> immutable entry snapshot
  -> Strategy Revision locked
  -> competition audit event: entry_created
```

### Season Scheduling

```text
Admin/system schedules open season
  -> stable entry ordering from season seed + entry snapshots
  -> deterministic pods/MatchSets
  -> Match jobs created by existing orchestration
  -> MatchSets linked to season/schedule run
  -> counted state starts pending
  -> audit events: season_status_changed, match_set_scheduled
```

### MatchSet Execution and Evidence

```text
Go Match job lifecycle
  -> runtime-service executes Strategy code behind provider boundary
  -> pure engine produces deterministic Chronicle
  -> Chronicle persisted
  -> Go refreshes MatchSet status/scoring
  -> counted-state classifier evaluates replay-backed evidence
```

No v1.36 code should alter Match rules, runtime ABI, provider proof semantics, or Chronicle privacy model.

### Governance/Dispute

```text
Participant flags result
  -> private result_flags row
  -> MatchSet public state becomes disputed / governance hold
  -> standings recompute excludes MatchSet
  -> admin resolves counted/non_counted/invalidated
  -> append-only audit event
  -> standings recompute again
```

### Public Standings Read

```text
Public season request
  -> load season policy
  -> load entries and linked MatchSets
  -> bounded MatchSet status/scoring refresh if needed
  -> classify counted state
  -> aggregate only included MatchSets
  -> build public-safe standings snapshot
  -> scan/validate public projection
```

## Recalculation Semantics

v1.36 should define two related but separate operations:

| Operation | Purpose | Side Effects |
| --- | --- | --- |
| `classifyMatchSetCountedState` | Pure classification of one MatchSet from status, Chronicle count, scoring, policy, and governance state. | None. |
| `recomputeSeasonStandings` | Aggregate all counted MatchSets into deterministic standings. | Optional materialized snapshot and audit event. |

Recommended rules:

- Complete MatchSet with all expected Chronicles and no governance hold: `counted`.
- Running/retryable MatchSet: `retrying`, excluded.
- Pending/not fully evidenced MatchSet: `pending`, excluded.
- System failure/degraded/missing Chronicle: `degraded`, excluded by default.
- User flag or admin review hold: `disputed`, excluded while open.
- Admin invalid result/evidence/policy issue: `invalidated`, excluded.
- Exhibition/self-play/policy-excluded result: `non_counted`, excluded from season standings but can remain visible as public evidence.

Store enough data to explain every exclusion publicly without exposing internals. A standings row should never depend on reading Strategy source or runtime private payloads.

## Build Order Implications

### Phase 249: Competition Surface Inventory and Policy Lock

Inventory all v1.36-affected surfaces: exhibition MatchSets, trial ladder seasons, entry APIs, Go public reads, TypeScript parity paths, counted status fields, result flags, audit events, player/Strategy pages, replay/result trust panels, abuse/dispute/recovery copy, and proof monitors. Lock the public-beta posture and policy vocabulary before changing behavior.

Why first: v1.36 touches already-existing alpha/trial surfaces. A policy lock prevents public copy, entry gates, standings, and governance states from drifting.

### Phase 250: Entry Eligibility and One-Active-Revision Enforcement

Implement the canonical v1.36 entry decision against v1.35 provider-proof/readiness/package evidence. Enforce one active Strategy Revision per user per season, next-season-only replacement, stale/invalid proof rejection, and public-safe entry failure categories.

Depends on: policy lock.
Avoids: stale artifacts, unsupported providers, hidden TinyGo, invalid provenance, package-policy bypass, same-user counted ambiguity.

### Phase 251: Season Lifecycle and Scheduling Policy

Tighten season lifecycle transitions, resettable posture, deterministic scheduling, active/completed/archive semantics, and schedule audit events. Preserve Go ownership for normal scheduling and MatchSet creation.

Depends on: entry snapshots and policy.
Avoids: entering closed seasons, mutating entrants after scheduling, confusing public beta with durable ratings.

### Phase 252: Counted-State Classifier and Standings Recompute

Create the v1.36 counted-state projection and recomputation service. Include counted/non-counted/degraded/disputed/invalidated states, replay-backed evidence checks, public explanations, deterministic tie-breakers, optional materialized standings snapshots, and parity tests against existing scoring.

Depends on: MatchSet/season linkage and policy.
Avoids: stale standings, lazy UI-owned scoring, counting degraded/system-failed evidence, unexplained exclusions.

### Phase 253: Governance, Dispute, Abuse, and Recovery Surfaces

Mature result flags, admin governance status transitions, audit event types, public dispute explanations, abuse expectation copy, and limited account-recovery policy surfaces. Keep private notes and recovery evidence private.

Depends on: counted-state classifier so dispute/invalidated transitions have standings impact.
Avoids: public leakage of dispute internals, unsupported moderation/recovery promises, un-audited standings changes.

### Phase 254: Public Trust UX Projections

Update standings, competition, result, replay, player, and Strategy pages to render policy version, resettable posture, counted status, public explanation, replay evidence availability, privacy exclusions, runtime readiness labels, and source-safe Strategy summaries.

Depends on: stable public DTOs.
Avoids: contradictory copy, public overclaims, leaking private runtime/account/governance data.

### Phase 255: Service-Backed E2E Proof and Monitors

Prove entry -> counted MatchSet -> execution -> result -> standings -> replay, plus negative scenarios for non-counted, degraded, disputed, invalidated, stale-proof entry rejection, one-active-revision rejection, privacy boundaries, public copy posture, and replay board realism.

Depends on: all previous phases.
Avoids: roadmap completion based only on fixtures or UI copy.

## Patterns to Follow

### Pattern: Policy-Backed Public DTOs

**What:** Every public season/result/standings projection includes a policy version and privacy exclusions.
**When:** All public competition surfaces.
**Why:** Users can distinguish resettable public beta standings from durable ratings, and tests can lock vocabulary.

```ts
type PublicCompetitionProjection = {
  policyVersion: "competition-policy-v1.36"
  publication: {
    publicResults: true
    publicReplayEvidence: true
    privateFieldsExcluded: string[]
  }
}
```

### Pattern: System Classifier Plus Governance Override

**What:** A deterministic system classifier computes default counted state; governance events can override with audited public/private reasons.
**When:** MatchSet counted-state projection and standings recomputation.
**Why:** System states remain recomputable, while human review remains auditable.

### Pattern: Snapshot Entrants, Recompute Standings

**What:** Lock entrant snapshots at entry/scheduling time and recompute standings from MatchSet evidence.
**When:** Trial ladder seasons and future tournament-like competitions.
**Why:** Public standings remain stable even if Strategy profiles or account metadata later change.

## Anti-Patterns to Avoid

### Anti-Pattern: UI-Owned Competition Truth

**What goes wrong:** React components infer counted state from status strings or hide disputed results locally.
**Consequence:** Standings become inconsistent across pages and impossible to audit.
**Instead:** Use Go/spec-owned counted-state DTOs and render them.

### Anti-Pattern: Public Explanation as Audit Source

**What goes wrong:** Only a public text explanation is stored for invalidated/disputed results.
**Consequence:** Operators cannot review why standings changed, and public copy may leak too much.
**Instead:** Store private before/after/reason/note in audit events and publish a redacted explanation.

### Anti-Pattern: Counting Degraded Evidence

**What goes wrong:** Failed-system or missing-Chronicle MatchSets are counted because partial scoring exists.
**Consequence:** Players receive false losses/wins and lose trust.
**Instead:** Count only complete replay-backed evidence by default; degraded is excluded with a public reason.

### Anti-Pattern: Runtime/Provider Recertification in Competition Code

**What goes wrong:** Entry code duplicates provider proof logic or infers readiness from language labels.
**Consequence:** v1.35 gates drift and unsupported lanes enter competition.
**Instead:** Call shared v1.35 eligibility/proof helpers and keep provider validation behind runtime-service.

### Anti-Pattern: Public Beta Overclaim

**What goes wrong:** Copy implies permanent ratings, production sandbox certification, full moderation, or guaranteed account recovery.
**Consequence:** Public trust breaks when reset/trial limitations appear.
**Instead:** State resettable public beta, no durable ratings, evidence-scoped runtime readiness, and limited policy surfaces.

## Scalability Considerations

| Concern | At 100 users | At 10K users | At 1M users |
| --- | --- | --- | --- |
| Standings recompute | Recompute on every public read is acceptable. | Materialize standings snapshots after MatchSet/governance transitions. | Queue recompute jobs by season and cache public snapshots by input hash. |
| Audit events | Single table with target index is fine. | Add event type indexes and admin filters. | Partition by season/time and stream to analytics/audit storage. |
| Result disputes | Simple participant flag plus admin route is enough. | Add queues, SLA/status categories, duplicate grouping. | Dedicated moderation/recovery service, still redacted from public DTOs. |
| Public projections | Direct Go reads are fine. | Cache season/result/player/Strategy projections with privacy scan tests. | CDN cache public projections; keep private/admin uncached/no-store. |
| Proof monitors | Local service-backed proof per milestone. | CI service-backed smoke plus fixture matrix. | Production canaries with synthetic seasons and private-safe telemetry. |

## Open Questions for Roadmap

- Should storage enum names migrate from current `under_review`/`invalid` to public `disputed`/`invalidated`, or should v1.36 add only a projection enum? Recommendation: projection enum first.
- Should withdrawn entries allow same-season replacement? Recommendation: no; keep next-season-only to preserve one-active-revision simplicity.
- Should season standings be materialized in v1.36 or recomputed on read with audit artifacts? Recommendation: recompute service first, optional materialized snapshot if implementation cost is low.
- How much admin UI is in scope? Recommendation: minimal admin route/control plus audit proof, not a broad moderation console.
- What account recovery behavior exists beyond expectation copy? Recommendation: policy surface only unless explicitly scoped as a separate phase.

## Sources

Primary local sources:

- `.planning/PROJECT.md` - v1.36 goal, hard boundaries, v1.35 shipped baseline.
- `.planning/STATE.md` - active milestone state, deferred durable ratings/moderation/recovery/runtime/package/TinyGo/ABI items.
- `.planning/MILESTONES.md` - v1.35 shipped constraints and historical competition/ranking posture.
- `.planning/milestones/v1.35-REQUIREMENTS.md` - provider-proof, entry gate, privacy, sandbox-readiness, package-policy requirements.
- `.planning/milestones/v1.35-ROADMAP.md` - v1.35 phase ordering and proof gates.
- `.planning/research/SUMMARY.md` - current architecture baseline and v1.35 trust-boundary findings.
- `CowardsGameSpec_Full_Consolidated_v1.md` - deterministic rules, Strategy Revision immutability, Chronicle, memory privacy, runtime constraints.
- `CowardsGame_Technical_Architecture_Spec_V1.md` - pure engine, runtime isolation, MatchSet scoring, replay visibility, persistence, test strategy.
- `packages/spec/src/competition.ts` - current public competition, ladder, counted-status, standings DTOs.
- `packages/persistence/migrations/0004_competition_trust_beta.sql` - current season, entry, counted status, result flags, audit event schema.
- `packages/persistence/src/ladder.ts` - current trial ladder eligibility, scheduling, public DTO, counted classification, standings aggregation.
- `packages/persistence/src/governance.ts` - current flag and governance mutation primitives.
- `apps/go-backend/live_backend.go` - Go public ladder/result projection and scoring/status refresh ownership.
- `apps/web/lib/public-service-adapter.ts` - selected Go public-read ownership and no-fallback posture.

## Confidence Assessment

| Area | Confidence | Notes |
| --- | --- | --- |
| Component ownership | HIGH | Repeatedly established across project docs and Go/runtime-service code. |
| Privacy constraints | HIGH | Explicit in specs, v1.35 requirements, public DTO tests, and project hard boundaries. |
| Entry eligibility architecture | HIGH | v1.35 already established provider-proof gates; v1.36 consumes them. |
| Counted-state vocabulary | MEDIUM | Concepts exist, but exact public/storage enum names need roadmap lock. |
| Recompute/materialization choice | MEDIUM | Recompute shape is clear; performance-driven materialization can be phased. |
| Abuse/dispute/recovery scope | MEDIUM | Result flags/audit exist, but public beta policy depth needs product decision. |

**Overall confidence:** HIGH for the integration architecture; MEDIUM for final enum names and admin/recovery scope.
