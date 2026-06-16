# Phase 250: Counted Entry and One-Active-Revision Enforcement - Research

**Researched:** 2026-06-16  
**Domain:** Counted competition entry eligibility, provider-proof validation, public-safe error projection, and Season entry invariants  
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

Source: `.planning/phases/250-counted-entry-and-one-active-revision-enforcement/250-CONTEXT.md` [VERIFIED: 250-CONTEXT.md]

#### Scope
- **D-01:** Cover the full Phase 250 decision space, not a narrow MVP. The approved scope includes stale artifacts, missing or mismatched provider proof, unsupported providers, hidden TinyGo, invalid provenance, unavailable runtime lanes, owner mismatch, mutable drafts, non-`none` package modes, one-active-entry rules, mid-season replacement blocking, and exhibition separation.
- **D-02:** Reuse existing v1.35 evidence and readiness semantics. Phase 250 must consume current provider-proof/runtime/provenance/package/engine compatibility signals instead of inventing broader runtime or sandbox claims.
- **D-03:** Keep Strategy execution behind runtime-service / Runtime Broker / provider boundaries. No Strategy execution belongs in web, API route handlers, Go backend request handlers, or Phase 250 proof scripts.

#### Counted Entry Policy
- **D-04:** Counted trial entry requires an immutable account-owned Strategy Revision with valid validation status, current provider proof, matching source/provenance artifacts, supported production language/provider lane, current ABI/runtime metadata, package mode `none`, no required capabilities, and compatible engine metadata.
- **D-05:** TinyGo remains hidden and unsupported for counted competition. Any TinyGo source format or runtime language is rejected with a public-safe unsupported-provider category.
- **D-06:** TypeScript and Python remain provider-proven source-language lanes; Rust and Zig remain provider-proven WASM/WASI Preview 1 artifact-backed lanes. None of these decisions imply production sandbox certification.
- **D-07:** Counted entry rejection must return stable, coarse eligibility categories plus remediation-oriented public copy. It must not expose Strategy source, artifact bytes, raw diagnostics, host paths, env values, package paths, tokens, database details, provider signing material, private runtime internals, StrategyMemory, SoldierMemory, objective payloads, or operator-only data.

#### One Active Revision
- **D-08:** A Player may have only one active counted Strategy Revision entry per counted Season.
- **D-09:** Counted mid-season replacement is blocked. Replacement belongs to a future Season or a non-counted/exhibition path.
- **D-10:** Withdrawn or invalidated entries remain historical Season evidence and should not silently permit standings-affecting replacement inside the same Season.
- **D-11:** The database should enforce the one-active-entry invariant where practical, and persistence should also return a public-safe category before callers see low-level constraint details.

#### Exhibition Separation
- **D-12:** Exhibition MatchSets remain permissive for explicitly labeled same-user, self-play, and multi-revision workflows when they are non-counted or otherwise cannot affect counted trial standings.
- **D-13:** Counted trial entry must not admit same-user multi-revision or self-play tricks that create more than one active revision for the same Player in the same Season.
- **D-14:** Existing exhibition UI may keep using runtime semantics for helpful labels, but counted ladder entry truth belongs in persistence/spec-owned eligibility logic and public-safe API projections.

### the agent's Discretion
The planner may choose exact helper names, error category enum names, migration shape, route response shape, tests, and whether to factor shared eligibility utilities in `@cowards/spec` or persistence. Prefer the smallest shared contract that keeps public categories stable and avoids duplicating fragile provider-proof logic.

### Deferred Ideas (OUT OF SCOPE)
- Season lifecycle/status window copy belongs to Phase 251.
- Counted-state classifier and standings recomputation belong to Phase 252.
- Governance/dispute/abuse/recovery mutation and public projections belong to Phase 253.
- Broad public UX rendering across standings/result/replay/player/Strategy pages belongs to Phase 254.
- Full service-backed E2E proof and replay realism belong to Phase 255.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ELIG-01 | Counted trial entry only with immutable account-owned Strategy Revision satisfying provider proof, language/provider support, provenance/artifact evidence, runtime readiness, engine compatibility, and package mode policy. | Existing ladder code checks ownership, validation, runtime counted eligibility, and provider artifact/provenance before insert, but should be refactored into a category-returning preflight before mutation. [VERIFIED: `.planning/REQUIREMENTS.md`; `packages/persistence/src/ladder.ts:444`] |
| ELIG-02 | Reject stale artifacts, missing/mismatched provider proof, unsupported providers, hidden TinyGo, invalid provenance, unavailable runtime lanes, owner mismatch, mutable drafts, and non-`none` package modes. | Go readiness already names most public categories; TypeScript persistence currently throws text messages and needs parity category mapping. [VERIFIED: `apps/go-backend/provider_readiness.go:29`; `packages/persistence/src/ladder.ts:42`] |
| ELIG-03 | Return public-safe eligibility categories/remediation without exposing private Strategy/provider/runtime/system details. | Public discovery has a leak-safe boundary and private-field exclusion list; entry API currently returns `{ error: message }` only. [VERIFIED: `packages/spec/src/public-discovery.ts:5`; `apps/web/app/competitive/http.ts:12`] |
| ELIG-04 | One active Strategy Revision entry per counted Season. | The database already has `unique(season_id, owner_user_id)`, which prevents more than one historical entry per owner per Season, not just active entries. [VERIFIED: `packages/persistence/migrations/0004_competition_trust_beta.sql:53`] |
| ELIG-05 | Counted Season entry cannot be replaced mid-season; replacement only for a future Season or non-counted/exhibition path. | `withdrawTrialLadderEntry` only changes status to `withdrawn`; the full unique constraint still blocks another Season row for the owner. [VERIFIED: `packages/persistence/src/ladder.ts:562`; `packages/persistence/migrations/0004_competition_trust_beta.sql:68`] |
| ELIG-06 | Exhibition MatchSets preserve labeled same-user/self-play/multi-revision workflows without affecting counted trial standings. | Exhibition creation remains separate from ladder entry and has a counted/unranked UI toggle; Phase 250 should relabel/isolate it, not route it into trial ladder standings. [VERIFIED: `apps/web/app/exhibitions/new/exhibition-client.tsx:44`; `apps/go-backend/live_backend.go:2837`] |
</phase_requirements>

## Summary

Phase 250 should make counted trial ladder entry a canonical eligibility decision, not a collection of thrown strings spread across UI, API, persistence, and Go readiness code. The existing system already has strong raw ingredients: spec-owned runtime eligibility, provider-proof validation for TypeScript/Python/Rust/Zig, Go public readiness categories, a ladder entry table, and a full `(season_id, owner_user_id)` uniqueness invariant. [VERIFIED: `packages/spec/src/runtime.ts:1687`; `packages/persistence/src/ladder.ts:42`; `apps/go-backend/provider_readiness.go:29`; `packages/persistence/migrations/0004_competition_trust_beta.sql:68`]

The primary implementation recommendation is to add a small spec-owned counted-entry category contract, a persistence-owned eligibility evaluator that returns structured public-safe decisions, and API/server mapping that preserves those categories without leaking raw provider, artifact, database, or runtime internals. [VERIFIED: `250-CONTEXT.md`; `apps/web/app/competitive/server.ts:96`; `apps/web/app/competitive/http.ts:12`]

One important planning caveat: `packages/spec/src/runtime.ts` still records JavaScript as counted eligible, while the Phase 250 context and milestone constraints name TypeScript, Python, Rust, and Zig as the counted production Strategy languages. The planner should not silently widen counted trial entry to JavaScript unless this is confirmed as intentional for v1.36. [VERIFIED: `packages/spec/src/runtime.ts:430`; `250-CONTEXT.md`; `.planning/PROJECT.md`]

**Primary recommendation:** Use the existing provider-proof checks, but wrap them in a stable `CountedEntryEligibilityCategory` result that is shared by spec, persistence, API responses, web entry projection, Go readiness parity tests, and Phase 255 proof. [VERIFIED: `apps/go-backend/provider_readiness.go:29`; `packages/persistence/src/ladder.ts:42`]

## Project Constraints (from AGENTS.md)

- Keep engine logic pure, deterministic, serializable, and side-effect free. [VERIFIED: `AGENTS.md`]
- Do not put game rules in React components. [VERIFIED: `AGENTS.md`]
- Do not execute user Strategy code in web/API/Go; Strategy execution remains behind runtime-service / Runtime Broker / provider boundaries. [VERIFIED: `AGENTS.md`; `250-CONTEXT.md`]
- Do not use `Math.random`, `Date.now`, system time, filesystem, network, or database access inside engine logic. [VERIFIED: `AGENTS.md`]
- Do not use Node `vm` as a security boundary for untrusted code. [VERIFIED: `AGENTS.md`]
- Treat Strategy code as hostile and validate every runtime boundary with schemas. [VERIFIED: `AGENTS.md`; `CowardsGame_Technical_Architecture_Spec_V1.md`]
- Preserve canonical terminology: Soldier, Match, Phase, Round, Activation, Cycle, Action, Advance, STONE, FALLEN, Chronicle. [VERIFIED: `AGENTS.md`]
- Strategy Revisions are immutable once submitted for Match or MatchSet play. [VERIFIED: `AGENTS.md`; `CowardsGameSpec_Full_Consolidated_v1.md:96`]
- Public replay/default output must not expose Strategy source, StrategyMemory, SoldierMemory, objective payloads, artifact bytes, raw diagnostics, host paths, env values, package paths, tokens, DB details, private runtime internals, dispute internals, account-recovery payloads, or operator-only data. [VERIFIED: `AGENTS.md`; `packages/spec/src/competition-policy-v1-36.ts:92`]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|--------------|----------------|-----------|
| Counted entry eligibility truth | Persistence / API backend | `@cowards/spec` contract | Persistence has the account-owned revision row, validation metadata, provider proof metadata, Season row, and insert constraint; spec should define stable public categories. [VERIFIED: `packages/persistence/src/ladder.ts:444`; `packages/spec/src/runtime.ts:335`] |
| Provider validation/build/execution evidence | runtime-service / Runtime Broker / providers | Go readiness projection | Phase 250 consumes stored provider proof and readiness metadata; it must not execute Strategy code or rebuild artifacts. [VERIFIED: `250-CONTEXT.md`; `apps/go-backend/provider_readiness.go:29`] |
| One-entry Season invariant | Database / Persistence | API error mapping | PostgreSQL already enforces one owner row per Season; persistence should check first and map constraint failures into public-safe categories. [VERIFIED: `packages/persistence/migrations/0004_competition_trust_beta.sql:68`; CITED: https://www.postgresql.org/docs/current/ddl-constraints.html] |
| Entry API response | Frontend server / API route | Persistence | The route should authenticate, call persistence, and return structured category/status fields without owning eligibility logic. [VERIFIED: `apps/web/app/api/ladder/seasons/[seasonId]/entries/route.ts:1`] |
| Signed-in entry dashboard | Web projection | Public discovery service | The dashboard can render eligibility and remediation, but should not decide counted truth. [VERIFIED: `apps/web/lib/public-discovery-service.ts:492`; `apps/web/app/competitions/[competitionId]/enter/page.tsx:1`] |
| Exhibition separation | Web projection + Go/TS exhibition creation | Persistence | Exhibition MatchSets can remain permissive and labeled; they must stay isolated from trial ladder entries and standings. [VERIFIED: `apps/web/app/exhibitions/new/exhibition-client.tsx:44`; `apps/go-backend/live_backend.go:2837`] |

## Standard Stack

### Core

| Library / Tool | Local Version | Registry / Tool Version | Purpose | Why Standard |
|----------------|---------------|-------------------------|---------|--------------|
| pnpm | 11.1.2 | 11.1.2 installed | Workspace scripts and package orchestration. | Existing root package manager and script runner. [VERIFIED: `package.json`; `pnpm --version`] |
| TypeScript | `^6.0.3` | 6.0.3, modified 2026-04-16 | Spec contracts, persistence helpers, tests, and proof scripts. | Existing contract/persistence/web language; no new language layer needed. [VERIFIED: npm registry; `package.json`] |
| Zod | `^4.4.3` | 4.4.3, modified 2026-05-04 | Public DTO schemas and leak-safe discovery validation. | Existing spec schema library for public discovery DTOs. [VERIFIED: npm registry; `packages/spec/package.json`; `packages/spec/src/public-discovery.ts:1`] |
| Next.js | `^16.2.6` | 16.2.9, modified 2026-06-16 | Signed-in entry pages and API route surface. | Existing web framework for route handlers and server components. [VERIFIED: npm registry; `apps/web/package.json`] |
| React | `^19.2.6` | 19.2.7, modified 2026-06-15 | Entry/exhibition UI rendering only. | Existing UI library; React must render projections, not own rules. [VERIFIED: npm registry; `apps/web/package.json`; `AGENTS.md`] |
| pg | `^8.20.0` | 8.21.0, modified 2026-05-18 | TypeScript PostgreSQL access in persistence package. | Existing persistence client used by ladder and competition helpers. [VERIFIED: npm registry; `packages/persistence/package.json`; `packages/persistence/src/ladder.ts:19`] |
| Go + pgx | Go module 1.25.0, `pgx/v5 v5.9.2` | Local Go 1.26.3 | Go readiness/service parity and selected normal backend behavior. | Existing Go backend owns readiness and selected competition reads/writes. [VERIFIED: `apps/go-backend/go.mod`; `go version`; `apps/go-backend/provider_readiness.go`] |
| PostgreSQL | schema in migrations; local client 16.14 | Server currently not responding on default socket | Canonical Season entry and uniqueness storage. | Existing migration stores `trial_ladder_entries` and unique invariants. [VERIFIED: `packages/persistence/migrations/0004_competition_trust_beta.sql`; `psql --version`; `pg_isready`] |

### Supporting

| Library / Tool | Local Version | Registry / Tool Version | Purpose | When to Use |
|----------------|---------------|-------------------------|---------|-------------|
| Vitest | `^4.1.6` | 4.1.9, modified 2026-06-15 | Fast unit/contract tests for spec, persistence, web helpers, and scripts. | Use for category contract tests, ladder eligibility matrix, public discovery DTO tests, and monitor tests. [VERIFIED: npm registry; `package.json`; `vitest.config.ts`] |
| Playwright | `^1.60.0` | 1.61.0, modified 2026-06-15 | Browser proof and later entry UX/regression checks. | Phase 250 can keep browser proof light; full service-backed E2E is Phase 255. [VERIFIED: npm registry; `package.json`; `.planning/REQUIREMENTS.md`] |
| Docker / Compose | Docker 29.4.0, Compose v5.1.2 | Installed locally | Local PostgreSQL/service topology when service-backed tests need it. | Use `pnpm services:up` before database-backed proof if local PostgreSQL is not already running. [VERIFIED: `docker info`; `docker compose version`; `package.json`] |
| rustc / Zig | rustc 1.95.0, Zig 0.16.0 | Installed locally | Provider artifact fixture compatibility for Rust/Zig lanes. | Use only for existing runtime/provider proof paths; do not execute Strategy code in web/API/Go. [VERIFIED: `rustc --version`; `zig version`; `250-CONTEXT.md`] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Full unique `(season_id, owner_user_id)` | Partial unique index on active rows only | Partial active-only uniqueness would permit withdrawn replacement, contradicting D-10; current full uniqueness matches next-season-only replacement. [VERIFIED: `250-CONTEXT.md`; `packages/persistence/migrations/0004_competition_trust_beta.sql:68`; CITED: https://www.postgresql.org/docs/current/ddl-constraints.html] |
| Spec-owned category enum | Web-local strings | Web-local strings would duplicate eligibility truth and make Go/persistence/API parity fragile. [VERIFIED: `apps/go-backend/provider_readiness.go`; `apps/web/app/competitive/http.ts`] |
| Re-running runtime validation on entry | Use stored provider proof and readiness metadata | Re-running validation risks Strategy execution/build creeping into web/API/Go; Phase 250 is scoped to consuming v1.35 evidence. [VERIFIED: `250-CONTEXT.md`; `AGENTS.md`] |
| New moderation/rating package | Existing policy/proof layers | Durable ratings and mature moderation are deferred, so new rating/governance libraries are out of scope. [VERIFIED: `.planning/REQUIREMENTS.md`] |

**Installation:**
```bash
# No new packages are recommended for Phase 250.
pnpm install
```

**Version verification:** `npm view typescript`, `npm view vitest`, `npm view next`, `npm view react`, `npm view pg`, `npm view zod`, `npm view @playwright/test`, `pnpm --version`, `go version`, `psql --version`, `docker info`, `rustc --version`, and `zig version` were checked during research. [VERIFIED: npm registry; local commands]

## Architecture Patterns

### System Architecture Diagram

```text
Signed-in Player
  -> Next entry page / API route
  -> competitiveServer.enterTrialLadderSeason
  -> persistence counted-entry evaluator
     -> Season status check
     -> account-owned Strategy Revision read
     -> validation status / locked-state check
     -> runtime metadata policy check
     -> provider proof + source/artifact hash check
     -> one-entry Season preflight
     -> insert trial_ladder_entries
        -> PostgreSQL unique(season_id, owner_user_id)
        -> lock Strategy Revision
  -> public-safe success or eligibility category response

Runtime-service / providers
  -> produce provider proof and readiness evidence before entry
  -> never execute Strategy code inside web/API/Go during entry

Exhibition path
  -> separate exhibition creation route
  -> explicit counted/unranked exhibition labels
  -> no trial ladder Season entry or standings effect
```

The primary data flow above reflects current route, server, persistence, and migration surfaces. [VERIFIED: `apps/web/app/api/ladder/seasons/[seasonId]/entries/route.ts`; `apps/web/app/competitive/server.ts:539`; `packages/persistence/src/ladder.ts:444`; `packages/persistence/migrations/0004_competition_trust_beta.sql:53`]

### Recommended Project Structure

```text
packages/spec/src/
├── competition-entry-eligibility.ts   # stable category/remediation contract
├── competition.ts                     # existing ladder DTOs and status vocabulary
└── runtime.ts                         # existing runtime counted eligibility

packages/persistence/src/
├── ladder.ts                          # counted entry evaluator + insertion
└── ladder.test.ts                     # eligibility matrix and one-entry tests

apps/web/app/api/ladder/seasons/[seasonId]/entries/
└── route.ts                           # API response shape, no eligibility truth

apps/web/lib/
└── public-discovery-service.ts        # signed-in entry dashboard projection

apps/go-backend/
├── provider_readiness.go              # category parity source
└── provider_readiness_test.go         # Go readiness parity coverage
```

This structure follows existing package ownership and avoids moving game rules or Strategy execution into React/API code. [VERIFIED: `AGENTS.md`; `250-CONTEXT.md`; listed code files]

### Pattern 1: Category-Returning Eligibility

**What:** Return `{ ok, category, publicMessage, remediation }` from a pure evaluator before insertion; only the insertion path mutates database rows. [VERIFIED: `250-CONTEXT.md`; `packages/persistence/src/ladder.ts:444`]  
**When to use:** Use for all counted trial entry preflight, API rejection responses, signed-in dashboard status, and tests. [VERIFIED: `.planning/REQUIREMENTS.md`]  
**Example:**
```typescript
// Source: packages/persistence/src/ladder.ts and apps/go-backend/provider_readiness.go
type CountedEntryEligibilityCategory =
  | "eligible"
  | "season_not_open"
  | "owner_mismatch"
  | "invalid_strategy_revision"
  | "mutable_draft"
  | "unsupported_source_format"
  | "hidden_unsupported_provider"
  | "incompatible_runtime_metadata"
  | "package_policy_violation"
  | "provider_proof_missing"
  | "provider_proof_mismatched"
  | "runtime_service_unavailable"
  | "already_entered_season"
```

The exact names are planner discretion, but the category set should align with Go readiness categories and Phase 250 requirements. [VERIFIED: `apps/go-backend/provider_readiness.go:29`; `250-CONTEXT.md`]

### Pattern 2: Full-Season Uniqueness, Friendly Preflight

**What:** Keep or explicitly preserve full `(season_id, owner_user_id)` uniqueness and add a pre-insert query that returns `already_entered_season`; still catch PostgreSQL `23505` as a race fallback. [VERIFIED: `packages/persistence/migrations/0004_competition_trust_beta.sql:68`; `apps/web/app/competitive/server.ts:121`]  
**When to use:** Use for ELIG-04 and ELIG-05 because withdrawn/invalidated entries remain historical Season evidence. [VERIFIED: `250-CONTEXT.md`]  
**Example:**
```typescript
// Source: packages/persistence/migrations/0004_competition_trust_beta.sql
const existing = await pool.query(
  "select id, status from trial_ladder_entries where season_id = $1 and owner_user_id = $2",
  [seasonId, userId],
)
if (existing.rows[0]) {
  return { ok: false, category: "already_entered_season" }
}
```

### Pattern 3: Public-Safe API Errors

**What:** API routes should emit stable public fields, not raw exception messages or database constraint text. [VERIFIED: `apps/web/app/competitive/http.ts:12`; `250-CONTEXT.md`]  
**When to use:** Use for `POST /api/ladder/seasons/[seasonId]/entries` and dashboard mutation failures. [VERIFIED: `apps/web/app/api/ladder/seasons/[seasonId]/entries/route.ts:8`]  
**Example:**
```typescript
// Source: apps/web/app/competitive/http.ts
return Response.json(
  {
    ok: false,
    category: error.category,
    publicMessage: error.publicMessage,
    remediation: error.remediation,
  },
  { status: error.status },
)
```

### Anti-Patterns to Avoid

- **React-owned eligibility:** React should render categories returned by spec/persistence/API, not infer eligibility from runtime labels. [VERIFIED: `AGENTS.md`; `apps/web/app/competitions/[competitionId]/enter/page.tsx:104`]
- **Active-only uniqueness:** A partial unique index on active entries would conflict with D-10 unless accompanied by a separate no-replacement historical constraint. [VERIFIED: `250-CONTEXT.md`; `packages/persistence/migrations/0004_competition_trust_beta.sql:68`]
- **Raw provider messages:** Returning provider proof, HMAC, artifact, database, or runtime internals would violate ELIG-03 and policy privacy exclusions. [VERIFIED: `.planning/REQUIREMENTS.md`; `packages/spec/src/competition-policy-v1-36.ts:92`]
- **Entry-time Strategy execution:** Entry should consume stored proof; it must not compile/run Strategy code in web/API/Go. [VERIFIED: `AGENTS.md`; `250-CONTEXT.md`]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Runtime metadata policy | Custom per-route runtime checks | `evaluateStrategyRuntimeCountedEligibility` plus existing provider proof helpers | The spec function already checks ABI/language/adapter/package/capability counted eligibility. [VERIFIED: `packages/spec/src/runtime.ts:1687`] |
| Provider proof verification | Ad hoc string or hash checks in API/UI | Existing source artifact and WASM artifact provider proof helpers | Existing helpers validate source/artifact hashes, artifact bytes, provider id, contract version, and HMAC proof. [VERIFIED: `packages/persistence/src/ladder.ts:103`; `apps/go-backend/live_backend.go:2674`] |
| One-entry enforcement | UI disabled states only | PostgreSQL uniqueness plus persistence preflight | Database constraints protect races and non-web callers; PostgreSQL unique constraints enforce multicolumn uniqueness. [VERIFIED: `packages/persistence/migrations/0004_competition_trust_beta.sql:68`; CITED: https://www.postgresql.org/docs/current/ddl-constraints.html] |
| Privacy scanning | Manual eyeballing | Existing public output leak guard and boundary monitors | Spec/public discovery already runs leak-safe assertions, and boundary monitor scripts are the existing drift gate. [VERIFIED: `packages/spec/src/public-discovery.ts:225`; `scripts/check-boundary-monitors.ts`] |
| Exhibition separation | New competition subsystem | Existing exhibition route/client plus explicit labels and counted-state isolation | Exhibition creation already has separate flow and counted/non-counted status derivation. [VERIFIED: `apps/web/app/exhibitions/new/exhibition-client.tsx`; `apps/go-backend/live_backend.go:2837`] |

**Key insight:** Phase 250 is an enforcement and projection phase around existing evidence; custom runtime execution, new rating systems, or broad competition rewrites would add risk without satisfying the locked requirements. [VERIFIED: `250-CONTEXT.md`; `.planning/REQUIREMENTS.md`]

## Common Pitfalls

### Pitfall 1: Accepting Runtime Eligibility Without Provider Proof
**What goes wrong:** `evaluateStrategyRuntimeCountedEligibility` can return ok for metadata that still lacks provider proof artifacts. [VERIFIED: `packages/spec/src/runtime.ts:1687`; `packages/persistence/src/ladder.ts:50`]  
**Why it happens:** Spec runtime metadata policy and provider-proof artifact validation are separate layers. [VERIFIED: `packages/persistence/src/ladder.ts:57`]  
**How to avoid:** Counted entry must require both normalized runtime eligibility and provider proof match against stored source hash/bytes. [VERIFIED: `packages/persistence/src/ladder.ts:503`]  
**Warning signs:** Tests only cover `evaluateStrategyRuntimeCountedEligibility` and not missing/stale/mismatched `providerValidation` metadata. [VERIFIED: `packages/persistence/src/ladder.test.ts:76`]

### Pitfall 2: Treating Withdraw as Replacement Permission
**What goes wrong:** A withdrawn entry could become a loophole for mid-season replacement. [VERIFIED: `250-CONTEXT.md`]  
**Why it happens:** `withdrawTrialLadderEntry` changes active rows to `withdrawn`, but product policy says historical entries still block replacement. [VERIFIED: `packages/persistence/src/ladder.ts:562`; `250-CONTEXT.md`]  
**How to avoid:** Preserve full owner-per-Season uniqueness and add tests for withdrawn/invalidated replacement attempts. [VERIFIED: `packages/persistence/migrations/0004_competition_trust_beta.sql:68`]  
**Warning signs:** A migration replaces full uniqueness with `where status = 'active'`. [CITED: https://www.postgresql.org/docs/current/ddl-constraints.html]

### Pitfall 3: Returning Raw Error Messages
**What goes wrong:** Public API/UI output can expose raw diagnostics, database details, provider internals, or inconsistent copy. [VERIFIED: `.planning/REQUIREMENTS.md`; `apps/web/app/competitive/http.ts:12`]  
**Why it happens:** Current mapping turns several persistence errors into one message-shaped `CompetitiveInputError`. [VERIFIED: `apps/web/app/competitive/server.ts:121`]  
**How to avoid:** Add typed public categories and status codes; redact all low-level details before API response. [VERIFIED: `250-CONTEXT.md`; `packages/spec/src/competition-policy-v1-36.ts:92`]  
**Warning signs:** API tests assert exact raw persistence messages instead of categories. [VERIFIED: `apps/web/app/api/ladder/seasons/[seasonId]/entries/route.ts:18`]

### Pitfall 4: Competition Entry Page Only Supports Exhibitions
**What goes wrong:** `/competitions/[competitionId]/enter` currently routes only exhibition presets into `ExhibitionClient`; ladder competitions return `entryMode: "unavailable"`. [VERIFIED: `apps/web/lib/public-discovery-service.ts:508`; `apps/web/app/competitions/[competitionId]/enter/page.tsx:67`]  
**Why it happens:** Public discovery was built before counted ladder entry UX matured. [VERIFIED: `.planning/research/SUMMARY.md`]  
**How to avoid:** Add a ladder entry projection/mode that posts to `/api/ladder/seasons/[seasonId]/entries` while leaving exhibition creation separate. [VERIFIED: `apps/web/app/api/ladder/seasons/[seasonId]/entries/route.ts:8`]  
**Warning signs:** Phase 250 tests pass persistence but no signed-in dashboard can reach counted ladder entry. [VERIFIED: `apps/web/lib/public-discovery-service.test.ts:167`]

### Pitfall 5: JavaScript Counted Eligibility Drift
**What goes wrong:** The spec lists JavaScript as counted eligible, but Phase 250 decisions and project constraints emphasize TypeScript/Python/Rust/Zig provider-proof lanes. [VERIFIED: `packages/spec/src/runtime.ts:430`; `250-CONTEXT.md`; `.planning/PROJECT.md`]  
**Why it happens:** JavaScript is legacy/current runtime support, while v1.35/v1.36 policy language focuses on provider-proof-backed counted lanes. [VERIFIED: `.planning/PROJECT.md`; `packages/spec/src/runtime.ts:430`]  
**How to avoid:** Planner must either explicitly include JavaScript with a provider-proof rationale or restrict counted trial entry to the four named lanes. [VERIFIED: `250-CONTEXT.md`]  
**Warning signs:** Tests assert JS entry without provider proof while ELIG-01/ELIG-02 require current provider proof and provenance/artifact evidence. [VERIFIED: `.planning/REQUIREMENTS.md`; `apps/go-backend/live_backend.go:2628`]

## Code Examples

Verified patterns from current sources:

### Current Ladder Provider-Proof Gate
```typescript
// Source: packages/persistence/src/ladder.ts:42
export const assertLadderEligibleRuntime = (
  runtime: unknown,
  provenance: { metadata?: unknown; sourceHash?: string; sourceBytes?: number } = {},
) => {
  const eligibility = evaluateStrategyRuntimeCountedEligibility(runtime)
  if (!eligibility.ok) {
    throw new LadderInputError(eligibility.publicMessage ?? "Strategy Revision runtime is not eligible for trial ladder entry.")
  }
  // TypeScript/Python require sourceArtifact provider validation;
  // Rust/Zig require compiledArtifact provider validation.
}
```

This helper should be retained or refactored, not bypassed. [VERIFIED: `packages/persistence/src/ladder.ts:42`]

### Existing Go Category Vocabulary
```go
// Source: apps/go-backend/provider_readiness.go:29
func classifyRevisionReadiness(input revisionReadinessInput) revisionReadinessResult {
  // runtime_service_unavailable
  // hidden_unsupported_provider
  // unsupported_source_format
  // incompatible_runtime_metadata
  // invalid_strategy_revision
  // package_policy_violation
  // provider_proof_missing
  // provider_proof_mismatched
  // provider_validated
}
```

Use these names as the first parity target for the spec-owned category contract unless the planner chooses clearer public names. [VERIFIED: `apps/go-backend/provider_readiness.go:29`]

### Existing One-Entry Storage Invariant
```sql
-- Source: packages/persistence/migrations/0004_competition_trust_beta.sql:53
create table if not exists trial_ladder_entries (
  season_id text not null references trial_ladder_seasons(id) on delete cascade,
  owner_user_id text not null references users(id),
  strategy_revision_id text not null references strategy_revisions(id),
  unique(season_id, owner_user_id),
  unique(season_id, strategy_revision_id),
  unique(season_id, entry_index)
);
```

The full `(season_id, owner_user_id)` uniqueness should be treated as a product invariant for next-season-only replacement. [VERIFIED: `250-CONTEXT.md`; `packages/persistence/migrations/0004_competition_trust_beta.sql:68`]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Text-only entry errors | Stable public eligibility categories with remediation copy | Phase 250 target | Enables API/UI/Go parity and public-safe negative proof. [VERIFIED: `250-CONTEXT.md`; `.planning/REQUIREMENTS.md`] |
| Runtime label implies entry eligibility | Persistence-owned counted entry evaluator consumes stored proof | Phase 250 target | Prevents stale/missing/mismatched proof from entering counted Seasons. [VERIFIED: `packages/persistence/src/ladder.ts:42`] |
| One active row policy | One historical owner row per Season | Already present in migration 0004 | Matches D-10 and blocks withdrawn replacement attempts. [VERIFIED: `packages/persistence/migrations/0004_competition_trust_beta.sql:68`; `250-CONTEXT.md`] |
| Exhibition entry mixed with counted language | Explicit exhibition/non-counted separation | Phase 250 target | Preserves self-play/multi-revision learning workflows without standings pollution. [VERIFIED: `apps/web/app/exhibitions/new/exhibition-client.tsx`; `250-CONTEXT.md`] |

**Deprecated/outdated:**
- Message-only `LadderInputError` responses for counted entry should be replaced or wrapped with category-bearing errors. [VERIFIED: `packages/persistence/src/ladder.ts:33`; `apps/web/app/competitive/server.ts:121`]
- `entryMode: "unavailable"` for ladder competitions is insufficient once Phase 250 exposes counted trial entry through competition pages. [VERIFIED: `apps/web/lib/public-discovery-service.ts:508`]
- Public copy that says `Competitive Alpha` on exhibition creation should be reviewed because Phase 249 locked `public beta trial competition` posture where counted/trial evidence appears. [VERIFIED: `apps/web/app/exhibitions/new/exhibition-client.tsx:120`; `.planning/artifacts/v1.36-competition-surface-inventory.md`]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | No new dependency installation is needed for Phase 250. [ASSUMED] | Standard Stack | If a hidden route/proof need requires a new helper library, the planner must add explicit version verification. |

## Open Questions

1. **Should JavaScript remain counted-trial eligible in Phase 250?**
   - What we know: `runtime.ts` lists JavaScript as counted eligible, but Phase 250 decisions name TypeScript/Python/Rust/Zig provider-proof lanes. [VERIFIED: `packages/spec/src/runtime.ts:430`; `250-CONTEXT.md`]
   - What's unclear: Whether JavaScript should be grandfathered for counted trial entry or excluded from v1.36 counted trial Seasons. [VERIFIED: `.planning/PROJECT.md`]
   - Recommendation: Default to the locked Phase 250 lane list unless the planner records an explicit decision. [VERIFIED: `250-CONTEXT.md`]

2. **Should Phase 250 add Go-owned trial ladder entry mutation, or only Go readiness parity?**
   - What we know: Next API currently calls TypeScript persistence for ladder entry, while Go has readiness classification and selected backend ownership elsewhere. [VERIFIED: `apps/web/app/api/ladder/seasons/[seasonId]/entries/route.ts`; `apps/go-backend/provider_readiness.go`]
   - What's unclear: Whether v1.36 wants counted entry mutation moved to Go in this phase or left in TypeScript persistence with parity checks. [VERIFIED: `.planning/research/SUMMARY.md`]
   - Recommendation: Keep mutation ownership unchanged unless existing architecture docs require Go migration; enforce parity through categories/tests. [VERIFIED: `250-CONTEXT.md`]

3. **What exact API shape should negative entry responses use?**
   - What we know: Current API returns `{ error }`; Phase 250 requires categories and remediation copy. [VERIFIED: `apps/web/app/competitive/http.ts:12`; `.planning/REQUIREMENTS.md`]
   - What's unclear: Whether response shape should be `{ ok:false, category, publicMessage, remediation }` or nested under `eligibility`. [ASSUMED]
   - Recommendation: Use the smallest stable shape and add leak-safe assertions. [VERIFIED: `packages/spec/src/public-discovery.ts:225`]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | TypeScript/Vitest scripts | yes | v24.15.0 | none needed [VERIFIED: `node --version`] |
| pnpm | Workspace commands | yes | 11.1.2 | none needed [VERIFIED: `pnpm --version`] |
| Go | Go readiness/parity tests | yes | go1.26.3 local, module declares 1.25.0 | Use existing module setting for tests [VERIFIED: `go version`; `apps/go-backend/go.mod`] |
| Docker / Compose | Local services | yes | Docker 29.4.0, Compose v5.1.2 | Use non-service unit tests when service proof is deferred [VERIFIED: `docker info`; `docker compose version`] |
| PostgreSQL client | DB-backed migration/proof commands | yes | psql 16.14 | none for unit tests [VERIFIED: `psql --version`] |
| PostgreSQL server | Service-backed persistence proof | no on default socket | `/tmp:5432 - no response` | Start via `pnpm services:up` / Docker Compose [VERIFIED: `pg_isready`; `package.json`] |
| rustc | Rust provider fixture/proof compatibility | yes | 1.95.0 | Use existing fixture tests if not compiling [VERIFIED: `rustc --version`] |
| Zig | Zig provider fixture/proof compatibility | yes | 0.16.0 | Use existing fixture tests if not compiling [VERIFIED: `zig version`] |

**Missing dependencies with no fallback:**
- None for planning and unit-level Phase 250 research. [VERIFIED: local environment probes]

**Missing dependencies with fallback:**
- PostgreSQL server is not responding on the default socket; planner should include `pnpm services:up` or fixture/unit-only fallback for non-service tasks. [VERIFIED: `pg_isready`; `package.json`]

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest `^4.1.6` local / 4.1.9 registry; Go test; Playwright `^1.60.0` local / 1.61.0 registry. [VERIFIED: npm registry; `package.json`; `apps/go-backend/go.mod`] |
| Config file | `vitest.config.ts`, `apps/web/vitest.config.ts`, `playwright.config.ts`, `apps/go-backend/go.mod`. [VERIFIED: repository file scan] |
| Quick run command | `pnpm --filter @cowards/persistence test -- ladder.test.ts` or `pnpm exec vitest packages/persistence/src/ladder.test.ts packages/spec/src/spec.test.ts apps/web/lib/public-discovery-service.test.ts` [VERIFIED: repository scripts and test files] |
| Full suite command | `pnpm test:fast` plus targeted Go tests `cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./... -run 'Test.*Provider.*Readiness|Test.*Counted' -count=1` [VERIFIED: `package.json`; `apps/go-backend/provider_readiness_test.go`] |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| ELIG-01 | Valid immutable account-owned TS/Python/Rust/Zig provider-proof entries pass. | unit/integration | `pnpm exec vitest packages/persistence/src/ladder.test.ts` | yes, extend [VERIFIED: `packages/persistence/src/ladder.test.ts`] |
| ELIG-02 | Missing/mismatched/stale proof, TinyGo, package violation, invalid revision, owner mismatch, unavailable runtime lane reject by category. | unit + Go parity | `pnpm exec vitest packages/persistence/src/ladder.test.ts && cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./... -run TestProviderReadiness -count=1` | yes, extend [VERIFIED: `packages/persistence/src/ladder.test.ts`; `apps/go-backend/provider_readiness_test.go`] |
| ELIG-03 | API/dashboard rejection output is public-safe and category-shaped. | unit/API | `pnpm exec vitest apps/web/lib/public-discovery-service.test.ts apps/web/app/api/ladder/seasons/[seasonId]/entries/route.test.ts` | partial; route test likely Wave 0 [VERIFIED: repository file scan] |
| ELIG-04 | One owner cannot enter two active counted revisions in same Season. | DB-backed persistence | `pnpm exec vitest packages/persistence/src/ladder.test.ts` | extend [VERIFIED: `packages/persistence/migrations/0004_competition_trust_beta.sql:68`] |
| ELIG-05 | Withdrawn/invalidated historical entry blocks mid-season replacement. | DB-backed persistence | `pnpm exec vitest packages/persistence/src/ladder.test.ts` | extend [VERIFIED: `packages/persistence/src/ladder.ts:562`] |
| ELIG-06 | Exhibitions remain same-user/self-play/multi-revision and non-standings isolated. | unit + web | `pnpm exec vitest packages/persistence/src/competition.test.ts apps/web/lib/public-discovery-service.test.ts` | yes, extend [VERIFIED: `packages/persistence/src/competition.test.ts`; `apps/web/lib/public-discovery-service.test.ts`] |

### Sampling Rate

- **Per task commit:** Run targeted Vitest/Go tests for touched modules. [VERIFIED: `package.json`; repository test files]
- **Per wave merge:** Run `pnpm test:fast` if dependency graph is broad; run Go readiness tests when Go category parity changes. [VERIFIED: `package.json`; `apps/go-backend/provider_readiness_test.go`]
- **Phase gate:** Run targeted Phase 250 tests plus `pnpm v1.36:competition-policy:check` and boundary monitors if public copy/categories change. [VERIFIED: `package.json`; `scripts/evaluate-v1-36-competition-policy.ts`]

### Wave 0 Gaps

- [ ] `packages/spec/src/competition-entry-eligibility.test.ts` or equivalent category contract test. [VERIFIED: no existing file in repository scan]
- [ ] `apps/web/app/api/ladder/seasons/[seasonId]/entries/route.test.ts` for public-safe category response. [VERIFIED: repository file scan]
- [ ] Persistence test cases for duplicate owner, withdrawn replacement attempt, and low-level `23505` mapping. [VERIFIED: `packages/persistence/src/ladder.test.ts`; `packages/persistence/migrations/0004_competition_trust_beta.sql:68`]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | yes | Existing signed-in session check before ladder entry. [VERIFIED: `apps/web/app/api/ladder/seasons/[seasonId]/entries/route.ts:8`] |
| V3 Session Management | yes | Existing HTTP-only SameSite session cookie helper. [VERIFIED: `apps/web/app/competitive/http.ts:5`] |
| V4 Access Control | yes | Owner match query joins Strategy Revision to Strategy owner and current user before entry. [VERIFIED: `packages/persistence/src/ladder.ts:486`] |
| V5 Input Validation | yes | Normalize route/body inputs, validate spec DTOs, and use public category schemas. [VERIFIED: `apps/web/app/competitive/server.ts:126`; `packages/spec/src/public-discovery.ts:15`] |
| V6 Cryptography | yes | Existing HMAC provider proof verification with timing-safe/constant-time compare; do not hand-roll a new proof scheme. [VERIFIED: `packages/persistence/src/ladder.ts:208`; `apps/go-backend/live_backend.go:2777`] |
| V8 Data Protection | yes | Public/default output excludes Strategy source, memory, artifact bytes, raw diagnostics, provider internals, and operator/private data. [VERIFIED: `packages/spec/src/competition-policy-v1-36.ts:92`; `.planning/REQUIREMENTS.md`] |

### Known Threat Patterns for Counted Entry

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Owner enters another Player's revision | Elevation of privilege | Query by `strategy_revision_id` and `owner_user_id`; return owner mismatch category. [VERIFIED: `packages/persistence/src/ladder.ts:486`] |
| Stale artifact or source/proof mismatch | Tampering | Bind provider proof to source hash/bytes and artifact hash/bytes; reject mismatches. [VERIFIED: `packages/persistence/src/ladder.ts:126`; `apps/go-backend/provider_readiness.go:86`] |
| TinyGo or unsupported provider appears in counted trial entry | Policy bypass | Reject with hidden unsupported provider / unsupported source format category. [VERIFIED: `apps/go-backend/provider_readiness.go:38`; `250-CONTEXT.md`] |
| Package mode or capabilities bypass | Tampering / escalation | Require package mode `none` and zero required capabilities. [VERIFIED: `apps/go-backend/provider_readiness.go:68`; `packages/spec/src/runtime.ts:1687`] |
| Duplicate active or replacement entry | Tampering | Preserve full Season owner uniqueness and map duplicate constraints safely. [VERIFIED: `packages/persistence/migrations/0004_competition_trust_beta.sql:68`] |
| Public error leaks provider/database/runtime internals | Information disclosure | Return stable public categories and remediation only; run leak-safe assertions/scans. [VERIFIED: `.planning/REQUIREMENTS.md`; `packages/spec/src/public-discovery.ts:225`] |

## Sources

### Primary (HIGH confidence)

- `AGENTS.md` - project non-negotiables, testing expectations, and boundary rules. [VERIFIED: local read]
- `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, `.planning/STATE.md`, `.planning/research/SUMMARY.md` - v1.36 scope, Phase 250 requirements, and active constraints. [VERIFIED: local read]
- `.planning/phases/250-counted-entry-and-one-active-revision-enforcement/250-CONTEXT.md` - locked decisions D-01 through D-14. [VERIFIED: local read]
- `.planning/phases/249-competition-surface-inventory-and-policy-lock/249-CONTEXT.md` and `.planning/artifacts/v1.36-competition-surface-inventory.md` - Phase 249 posture and Phase 250-owned inventory rows. [VERIFIED: local read]
- `packages/spec/src/runtime.ts`, `packages/spec/src/competition.ts`, `packages/spec/src/competition-policy-v1-36.ts`, `packages/spec/src/public-discovery.ts` - runtime eligibility, ladder DTOs, v1.36 policy vocabulary, and public DTO privacy boundary. [VERIFIED: local read]
- `packages/persistence/src/ladder.ts`, `packages/persistence/src/competition.ts`, `packages/persistence/migrations/0004_competition_trust_beta.sql` - counted entry, provider proof helpers, exhibition helper precedent, and trial ladder schema constraints. [VERIFIED: local read]
- `apps/go-backend/provider_readiness.go`, `apps/go-backend/live_backend.go`, `apps/go-backend/provider_readiness_test.go` - Go readiness categories and provider proof parity. [VERIFIED: local read]
- `apps/web/app/api/ladder/seasons/[seasonId]/entries/route.ts`, `apps/web/app/competitive/server.ts`, `apps/web/app/competitive/http.ts`, `apps/web/lib/public-discovery-service.ts`, `apps/web/app/competitions/[competitionId]/enter/page.tsx`, `apps/web/app/exhibitions/new/exhibition-client.tsx` - API, server mapping, dashboard, entry page, and exhibition UI integration points. [VERIFIED: local read]
- npm registry via `npm view` - current package versions and publish modification timestamps. [VERIFIED: npm registry]
- PostgreSQL official documentation, "5.5 Constraints" - unique/multicolumn uniqueness and partial unique index behavior. [CITED: https://www.postgresql.org/docs/current/ddl-constraints.html]

### Secondary (MEDIUM confidence)

- Local command probes: `node --version`, `pnpm --version`, `go version`, `docker info`, `docker compose version`, `psql --version`, `pg_isready`, `rustc --version`, `zig version`. [VERIFIED: local commands]

### Tertiary (LOW confidence)

- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - versions were verified against local manifests, local command probes, and npm registry where applicable. [VERIFIED: npm registry; local commands]
- Architecture: HIGH - ownership boundaries and integration points are directly present in Phase 250 context and current source files. [VERIFIED: `250-CONTEXT.md`; local source reads]
- Pitfalls: HIGH - each listed risk maps to an existing code path, migration invariant, or locked requirement. [VERIFIED: local source reads]

**Research date:** 2026-06-16  
**Valid until:** 2026-06-23 for package versions and environment availability; 2026-07-16 for repository-local architecture findings unless Phase 250/251 changes land first. [ASSUMED]
