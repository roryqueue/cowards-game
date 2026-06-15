# Technology Stack

**Project:** Coward's Game v1.36 Competition Maturity  
**Researched:** 2026-06-15  
**Scope:** Stack additions and integration points only for public beta/trial competition maturity  
**Confidence:** HIGH for repo-local stack and mechanisms; MEDIUM for exact schema names until v1.36 requirements lock terminology.

## Executive Recommendation

Do not add a new platform for v1.36. Competition maturity should use the existing TypeScript/Go/PostgreSQL/runtime-service stack and add contracts, schemas, proof harnesses, monitors, and public-safe UI copy around the current competition surfaces.

The work should center on `@cowards/spec`, `packages/persistence`, `apps/go-backend`, public discovery/result/replay pages, and proof scripts. v1.35 already provides provider-proof-backed account save and entry gates for TypeScript, Python, Rust, and Zig. v1.36 should consume that evidence to mature entry eligibility, counted/non-counted/degraded policy, resettable trial seasons, standings recomputation, governance explanations, and public trust UX.

No runtime ownership, game-rule, package ecosystem, sandbox certification, TinyGo, ABI, or durable rating stack should be added.

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| pnpm workspace | `pnpm@11.1.2` | Monorepo scripts, proof runners, package orchestration | Existing verified command path; add v1.36 scripts here instead of new task tooling. |
| TypeScript | `^6.0.3` | Spec contracts, persistence helpers, web UI, proof harnesses | Best place for shared competition-policy schemas and public-safe DTO validation. |
| Next.js / React | Next `^16.2.6`, React `^19.2.6` | Public competition, result, replay, player, Strategy, Learn, and entry surfaces | Existing public site spine; v1.36 needs trust UX, not a new frontend framework. |
| Go backend | Go `1.25.0`, `pgx/v5 v5.9.2` | Normal backend orchestration, MatchSet status/scoring refresh, selected public reads, entry/provider checks | Keep Go as normal backend owner while preserving runtime-service as hostile-code boundary. |
| `apps/runtime-service` | workspace `0.1.0` | Provider validation/build/proof and Strategy execution boundary | v1.36 should consume provider evidence; it should not change runtime ownership or execute Strategy code elsewhere. |

### Database

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| PostgreSQL | local compose-backed | Canonical store for users, Strategy Revisions, MatchSets, Chronicles, trial seasons, result flags, audit events | Existing migrations already include `trial_ladder_seasons`, `trial_ladder_entries`, `result_flags`, `competition_audit_events`, counted status, public counted explanations, and review status. |
| `packages/persistence` | workspace `0.1.0` | Competition, ladder, governance, scoring, account revision reads/writes | Reuse `competition.ts`, `ladder.ts`, `governance.ts`, `matchset-status.ts`, and `scoring.ts`; do not create a parallel competition subsystem. |

### Infrastructure

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Docker Compose | existing `compose.yaml` | Local PostgreSQL/service proof topology | Existing `pnpm services:up`, `preflight`, and service-backed proof pattern are enough. |
| Playwright | `^1.60.0` | Browser E2E and visual/privacy checks | Use for entry -> counted MatchSet -> result -> standings -> replay proof and board realism checks. |
| Vitest | `^4.1.6` | Contract, persistence, view-model, and proof unit tests | Existing TS test stack covers public DTOs and persistence logic. |
| Redocly CLI | `2.31.4` | OpenAPI lint | Keep if public/service route schemas change; no new API tooling needed. |

### Supporting Libraries and Mechanisms

| Library / Mechanism | Version | Purpose | When to Use |
|---------------------|---------|---------|-------------|
| `@cowards/spec` | workspace `0.1.0` | Canonical public DTOs, runtime labels, competition statuses, privacy guards | Add v1.36 competition-posture, counted-policy, entry-policy, and governance DTO schemas here. |
| `packages/spec/src/public-output-privacy.ts` | current | Public leak guard | Extend forbidden markers for dispute internals, account-recovery payloads, provider proof strings, package paths, and operator-only governance details. |
| `packages/spec/src/public-discovery.ts` | `public-discovery-v1` | Public Home/Watch/Competition/entry discovery DTOs | Add public beta/trial/resettable posture fields if discovery pages need them. Keep separate from `match-execution-app-v1`. |
| `packages/spec/src/competition.ts` | current | Competition presets, ladder season DTOs, counted statuses, public result shape | Formalize current `metadata` into typed public governance/counting fields instead of free-form `JsonValue` where v1.36 needs proof. |
| `packages/persistence/src/competition.ts` | current | Exhibitions, entrant snapshots, counted entry checks, public MatchSet DTOs | Reuse for exhibitions and result DTOs; harden same-user/multi-revision/self-play policy here. |
| `packages/persistence/src/ladder.ts` | current | Trial seasons, one-entry-per-user, scheduling, standings recomputation | Primary integration point for resettable trial ladder maturity and recomputable standings. |
| `packages/persistence/src/governance.ts` | current | Result flags, admin counted-status changes, public explanations, private notes, audit events | Mature this for disputes and invalidation explanations; do not add a broad moderation platform. |
| `apps/go-backend/matchset_status.go`, `scoring.go`, `provider_readiness.go` | current | Go parity for status/scoring/provider-readiness | Add Go tests/fixtures for v1.36 counted/degraded/governance states if public reads depend on Go. |
| `apps/web/app/matchsets/*` | current | Public result and trust workbench | Add counted/non-counted/disputed/invalidated explanations here without leaking private data. |
| `apps/web/app/ladder/[seasonId]/page.tsx` | current | Public ladder page | Add resettable/trial/public-beta posture, standings explanation, entry eligibility summaries, and governance state explanations. |
| `apps/web/lib/public-discovery-service.ts` | current | Public competition discovery | Surface public beta/trial posture and entry availability using configured public ladder ids and preset cards. |

## Required Stack Additions

### 1. Add a v1.36 Competition Maturity Contract in `@cowards/spec`

Add a versioned contract, preferably near `packages/spec/src/competition.ts`, for:

| Contract | Required Values |
|----------|-----------------|
| `competitionMaturityContractVersion` | `competition-maturity-v1.36` |
| `competitionPosture` | `public-beta-trial`, `resettable-trial`, `exhibition`, `future-durable-rating` as future-only/non-active |
| `seasonDurability` | `resettable`, `archived-public-evidence`, `no-durable-rating` |
| `countedResultPolicy` | `pending`, `counted`, `retrying`, `under_review`, `invalid`, `non_competitive`, `non_counted` |
| `nonCountedReason` | existing reasons plus any needed public-safe v1.36 reason such as `entry_ineligible` only if requirements demand it |
| `entryPolicy` | provider proof required, package mode `none`, TinyGo hidden, current runtime lane required, one active entry per user per trial season |
| `sameUserPolicy` | exhibitions allow same-user multi-revision where explicitly modeled; trial ladder uses one active revision per user; self-play/mirror drills are policy-labeled, not game-rule changes |
| `privacyExclusions` | Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw diagnostics, private runtime internals, account-recovery payloads, dispute internals, operator-only governance details |

Use Zod schemas for any public DTO additions. Avoid burying the posture in UI strings only; the roadmap needs one contract that web, persistence, Go fixtures, and proof scripts can assert.

### 2. Type Public Governance Metadata Instead of Free-Form Result Metadata

`PublicMatchSetResultDto.metadata` currently carries counted status, public reason, public explanation, and review status as `JsonValue`. v1.36 should add a typed public structure such as:

```ts
type PublicCompetitionGovernanceDto = {
  countedStatus: LadderMatchSetCountedStatus
  publicReason?: LadderNonCountedReason
  publicExplanation: string
  reviewStatus: "none" | "under_review" | "resolved"
  posture: "exhibition" | "resettable-trial-public-beta"
  durableRating: false
  standingsImpact: "included" | "excluded" | "pending"
}
```

Keep private notes, flag notes, operator action details, and account recovery details out of public DTOs. If this changes public service schemas, regenerate and lint the existing OpenAPI artifact rather than adding a second API contract system.

### 3. Add a v1.36 Proof Evaluator

Add a script modeled after the existing milestone evaluators:

```bash
pnpm exec tsx scripts/evaluate-v1-36-competition-maturity.ts --write
pnpm exec tsx scripts/evaluate-v1-36-competition-maturity.ts --check
```

Recommended root scripts:

```json
"v1.36:competition-maturity": "pnpm exec tsx scripts/evaluate-v1-36-competition-maturity.ts --write",
"v1.36:competition-maturity:check": "pnpm exec tsx scripts/evaluate-v1-36-competition-maturity.ts --check"
```

Artifacts should be:

- `.planning/artifacts/v1.36-competition-maturity-proof.json`
- `.planning/artifacts/v1.36-competition-maturity-proof.md`

Required proof cases:

- Exhibition policy inventory: public exhibition, counted/non-counted/degraded policy, same-user multi-revision behavior.
- Trial ladder policy: resettable season, one active entry per user, next-season replacement, no durable rating promise.
- Eligibility: TypeScript/Python/Rust/Zig require v1.35 provider-proof/language/runtime/provenance/package evidence; TinyGo and stale/missing/mismatched proof fail closed.
- Standings recomputation: counted results included; pending/retrying/under_review/invalid/non_competitive/non_counted/degraded/system-failure results excluded with public explanations.
- Governance: entrant flag -> under review -> admin counted/invalid/non-counted resolution writes audit event and public-safe explanation.
- Privacy: public result/replay/player/Strategy/competition/ladder DTOs omit source, memory, objective payloads, raw diagnostics, dispute private notes, recovery payloads, provider proofs, package paths, host paths, tokens, DB details, and operator-only internals.
- Board realism: public replay proof still shows in-bounds Soldier/terrain positions and plausible canonical Match starts.

### 4. Extend Boundary Monitors

Update `scripts/check-boundary-monitors.ts` and `pnpm boundary:monitors` to include the v1.36 check. Add monitor rules for:

- No durable permanent rating claim unless a future explicit milestone promotes it.
- No production sandbox certification, TinyGo production support, package ecosystem support, ABI migration, or runtime ownership migration.
- Public beta copy must say resettable/trial/no durable rating where standings are trial-only.
- Public/default DTOs and generated artifacts must not contain private Strategy/runtime/dispute/recovery markers.
- `match-execution-app-v1` remains separate; public discovery and competition maturity additions must not mutate frozen execution DTOs without an explicit compatibility decision.
- Counted standings use recomputable policy, not cached UI-only state.

### 5. Add Service-Backed E2E Proof

Add one focused Playwright spec, for example:

```bash
PLAYWRIGHT_TEST=1 RUN_V1_36_PROOF=1 playwright test --project=desktop --workers=1 v1-36-competition-maturity-proof.spec.ts
```

Proof should exercise:

1. Signed-in account with provider-proof-backed eligible revision.
2. Enter exhibition or trial season.
3. Create/schedule counted MatchSet.
4. Run execution through existing service-backed topology.
5. Open public result, standings, replay, player, and Strategy pages.
6. Flag/dispute or use fixture-backed governance state if full live mutation is too expensive.
7. Scan pages/API JSON for private markers.
8. Confirm replay board realism and public copy posture.

Use fixture-backed public states for rare governance branches, but keep at least one service-backed happy path.

## Code Areas to Touch

| Area | Use for v1.36 | Notes |
|------|---------------|-------|
| `packages/spec/src/competition.ts` | Add v1.36 posture/governance/counting schemas and types | Primary contract source. |
| `packages/spec/src/public-discovery.ts` | Add competition posture fields if index/detail/entry pages need them | Keep `public-discovery-v1` or deliberately version if shape changes require it. |
| `packages/spec/src/public-output-privacy.ts` | Add forbidden markers for dispute/recovery/operator-private leakage | Use in evaluator and tests. |
| `packages/persistence/src/competition.ts` | Exhibition policy, entrant snapshots, public result governance DTO | Preserve current provider-proof entry gate. |
| `packages/persistence/src/ladder.ts` | Trial season posture, one-active-revision rule, standings recomputation | Existing unique constraints already support one active entry per user per season; verify behavior and public copy. |
| `packages/persistence/src/governance.ts` | Dispute/flag/resolution/audit behavior | Harden public/private splits; avoid full moderation workflow. |
| `packages/persistence/migrations/0004_competition_trust_beta.sql` | Existing schema baseline | Prefer using existing statuses before adding migration churn. |
| `apps/go-backend/*scoring*`, `matchset_status.go`, `provider_readiness.go` | Go parity and service-backed status proof | Add fixtures/tests if v1.36 public reads depend on Go responses. |
| `apps/web/app/competitions/*`, `ladder/[seasonId]`, `matchsets/*`, `players/*`, `strategies/*`, `matches/*/replay` | Public trust UX | Display public-safe policy and evidence only. |
| `apps/web/e2e` | v1.36 proof | Add focused desktop proof and reuse replay realism helpers. |
| `scripts/check-boundary-monitors.ts` | Drift prevention | Add v1.36 no-overclaim/no-leak/no-runtime-creep checks. |

## What Should NOT Be Added

| Do Not Add | Why | Use Instead |
|------------|-----|-------------|
| Durable permanent ratings | v1.36 target asks for honest resettable/trial/public-beta posture, not durable ratings. | Explicit `noPermanentRatings: true`, resettable seasons, archived evidence. |
| New rating engine like Elo/Glicko/TrueSkill | Would imply a durable competitive promise and extra calibration work. | Existing points/W-L-D/survivor/survival-turn deterministic standings. |
| New runtime, Runtime Broker ownership, or Strategy execution path | Runtime-service/provider boundary is non-negotiable and v1.35 just cleaned it up. | Existing runtime-service provider proof and Go orchestration. |
| Package ecosystem support | v1.35 enforced package mode `none`; packages need a future supply-chain milestone. | Reject non-`none` package mode with public-safe diagnostics. |
| TinyGo production support | TinyGo remains spike-only and hidden. | Keep TinyGo out of production UI, entry, result, replay, and public evidence. |
| Production sandbox certification | Current evidence is provider/runtime readiness, not certification. | Evidence-scoped labels and no-certification monitors. |
| ABI migration to direct exports or Component Model/WIT | Out of scope and previously deferred. | Keep WASI Preview 1 stdin/stdout JSON for Rust/Zig. |
| External moderation/dispute platform | v1.36 needs expectation surfaces and minimal governance proof, not a full trust-and-safety system. | Existing `result_flags`, `competition_audit_events`, admin counted-status route, and public explanations. |
| Account recovery product/vendor | Scope is assumptions/expectation surfaces, not recovery workflow implementation. | Public copy that says what is and is not available now; no recovery payloads in public output. |
| New auth provider | Account ownership gates already exist. | Tighten existing session/admin/entrant authorization checks. |
| Public raw diagnostics or private governance notes | Violates privacy boundaries. | Public-safe categories, public explanations, and private audit notes only. |
| Game-rule changes | v1.36 is competition maturity. | Keep engine/Chronicle deterministic and unchanged unless separately approved. |

## Existing Project Mechanisms to Reuse

- Provider-proof entry gates from v1.35: `apps/go-backend/provider_readiness.go`, `packages/persistence/src/competition.ts`, and `packages/persistence/src/ladder.ts`.
- Counted status and review schema from `packages/persistence/migrations/0004_competition_trust_beta.sql`.
- Trial ladder season/entry policy from `packages/persistence/src/ladder.ts` and `PublicTrialLadderSeasonDto`.
- Result flagging and audit events from `packages/persistence/src/governance.ts`.
- Public discovery separation through `public-discovery-v1`, explicitly not `match-execution-app-v1`.
- Result/replay trust copy and view-model patterns in `apps/web/app/matchsets/evidence-copy.ts` and `result-view-model.ts`.
- Replay board realism checks from existing Playwright replay proof.
- Boundary monitor pattern from v1.35 scripts and `pnpm boundary:monitors`.

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Competition posture | Resettable public beta/trial contract | Durable official rating ladder | Durability requires future governance, abuse, recovery, and calibration proof. |
| Standings | Recompute from counted MatchSets and governance status | Store authoritative mutable leaderboard only | Mutable cached standings are harder to audit and explain. |
| Governance | Existing flags/audit/status fields plus public explanations | Full moderation/dispute case-management system | Too large for v1.36 and not required for honest beta posture. |
| Proof | Local evaluator plus Playwright service-backed E2E | External observability/compliance tooling | Repo-local deterministic proof is enough and aligns with existing milestone practice. |
| Entry eligibility | Consume v1.35 provider-proof gates | Revalidate/recompile source at entry in UI | UI state is not authority; runtime-service proof and immutable revision metadata are. |

## Installation

No dependency installation is recommended.

```bash
# Add scripts only; no new packages.
pnpm v1.36:competition-maturity
pnpm v1.36:competition-maturity:check
pnpm boundary:monitors
pnpm test:fast
```

## Sources

- `.planning/PROJECT.md` - v1.36 goal, boundaries, v1.35 shipped baseline. Confidence: HIGH.
- `.planning/STATE.md` - active v1.36 state and deferred durable ratings/moderation/recovery/runtime/package/TinyGo/ABI items. Confidence: HIGH.
- `.planning/MILESTONES.md` - v1.35 active constraints and prior competition/language/runtime decisions. Confidence: HIGH.
- `.planning/milestones/v1.35-REQUIREMENTS.md` and `.planning/milestones/v1.35-ROADMAP.md` - provider-proof, sandbox-label, package-policy, privacy, and boundary monitor baseline. Confidence: HIGH.
- `.planning/research/SUMMARY.md` - v1.35 stack/architecture/pitfall baseline now superseded for v1.36 stack scope. Confidence: HIGH.
- `CowardsGameSpec_Full_Consolidated_v1.md` - immutable Strategy Revisions, ranked Set lock, Chronicle privacy, runtime restrictions, competitive structures. Confidence: HIGH.
- `CowardsGame_Technical_Architecture_Spec_V1.md` - pure engine, runtime isolation, MatchSet scoring, replay, PostgreSQL, testing, observability, security boundaries. Confidence: HIGH.
- `packages/spec/src/competition.ts`, `public-discovery.ts`, `public-output-privacy.ts` - current public competition/discovery/privacy contracts. Confidence: HIGH.
- `packages/persistence/src/competition.ts`, `ladder.ts`, `governance.ts`, `scoring.ts`, `matchset-status.ts` - current exhibition, ladder, governance, standing, and status mechanisms. Confidence: HIGH.
- `packages/persistence/migrations/0004_competition_trust_beta.sql` - current competition trust beta tables/status columns. Confidence: HIGH.
- `apps/go-backend/provider_readiness.go`, `matchset_status.go`, `scoring.go` - Go provider/readiness/status/scoring parity areas. Confidence: HIGH.
- `apps/web/app/competitive/server.ts`, public competition/ladder/result/replay routes, and `apps/web/lib/public-discovery-service.ts` - existing web integration points. Confidence: HIGH.

