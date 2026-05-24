# Phase 101: Public Evidence Delivery and Web Cutover - Research

**Researched:** 2026-05-24  
**Domain:** Web-to-Go public evidence cutover, replay data boundary, TypeScript surface labeling, privacy/no-fallback verification  
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

## Implementation Decisions

### Selected Normal Workflows

- **D-01:** Select exhibition creation, public MatchSet summary/evidence, public replay metadata, and selected public replay evidence as the normal v1.15 web workflows for Go ownership.
- **D-02:** Web calls Go-owned contracts for selected workflows when Go is selected.
- **D-03:** Go-selected failures fail closed with schema-validated public errors and must not silently fall through to TypeScript service or direct persistence.

### Replay Data Boundary

- **D-04:** The existing React replay UI may remain the rendering surface.
- **D-05:** Normal replay data access should move behind Go-owned public/evidence contracts instead of direct `@cowards/persistence` Chronicle reads.
- **D-06:** Full owner-debug replay projection remains outside normal public flow and should be labeled deferred or explicitly owner/debug-only where still present.

### TypeScript Surface Labels

- **D-07:** Remaining TypeScript service/web surfaces in product paths must be explicitly labeled `frontend`, `parity_only`, `rollback_only`, `test_only`, `runtime_only`, or `deferred`.
- **D-08:** Workshop internals, owner-debug replay projection, ladder/admin/governance mutation surfaces, and test-support routes should be labeled `deferred` or `test_only` rather than treated as normal backend ownership.
- **D-09:** TypeScript service behavior remains a parity oracle where needed, not the future normal backend path.

### Public Evidence Shape

- **D-10:** Public evidence should be projected and source-safe by default.
- **D-11:** Raw Chronicle/private projection payloads must not be exposed by default.
- **D-12:** Owner-authorized or debug-only evidence must stay outside the normal public workflow and retain explicit labels.

### Privacy Checks

- **D-13:** Privacy checks should cover public, account, workshop, replay, and evidence outputs.
- **D-14:** Public/service/Go/topology/monitor outputs must omit Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, stderr, sessions, tokens, host paths, DB DSNs, and private runtime internals by default.

### the agent's Discretion

The agent may choose exact route names, DTO names, adapter structure, and cutover flags, provided selected normal workflows are Go-owned when selected, TypeScript surfaces are labeled, and privacy/no-fallback guarantees are enforced.

### Deferred Ideas (OUT OF SCOPE)

- Full workshop internals migration.
- Owner-debug replay projection migration.
- Ladder/admin/governance mutation migration.
- Test-support routes as normal product surfaces.
- Topology monitors, rollback drills, and promotion gate — Phase 102.
- Production sandbox replacement and final TypeScript runtime retirement — v1.16 or later.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| API-01 | User can create an exhibition through the web frontend with Go selected and receive a Go-owned MatchSet queued response without TypeScript backend fallback. | Existing `/api/exhibitions` already branches to `requireSelectedGoBackendClient("exhibitions").createMatchSet(...)` when Go exhibitions are selected; Phase 101 should harden tests and labels around that path. [VERIFIED: apps/web/app/api/exhibitions/route.ts:22] |
| API-02 | User can view public MatchSet summary/evidence produced from Go-completed Matches and Go-scored MatchSets. | Go already serves `GET /public/matchsets/{matchSetId}/summary` and builds standings/evidence from `match_sets.scoring`, `competition_entrants`, `matches`, and `chronicles`; Phase 101 should wire selected web reads to this route and require evidence reflects Phase 99/100 writes. [VERIFIED: apps/go-backend/live_backend.go:238] [VERIFIED: apps/go-backend/live_backend.go:974] |
| API-03 | User can view public replay metadata and selected public replay evidence from Go-owned contracts without exposing raw Chronicle/private projection data by default. | Go already serves public replay metadata from Chronicle metadata columns only; the full replay page still reads Chronicle artifacts through TypeScript persistence, so Phase 101 must add or select a Go-owned replay-evidence contract before calling the replay cutover complete. [VERIFIED: apps/go-backend/live_backend.go:257] [VERIFIED: apps/web/app/matches/server.ts:122] |
| API-04 | Developer can verify web normal backend workflows selected for v1.15 call Go-owned contracts rather than direct persistence/service internals. | Public MatchSet and replay metadata pages use `public-service-boundary`, which delegates selected public reads to the Go client; the persisted replay page remains the direct-persistence exception to migrate or label. [VERIFIED: apps/web/lib/public-service-boundary.ts:69] [VERIFIED: apps/web/lib/public-service-adapter.ts:160] |
| API-05 | Developer can verify TypeScript service/web API surfaces left in the product are explicitly labeled test-only, parity-only, rollback-only, runtime-only, or deferred. | Current monitors track strict/report-only import offenses but do not yet encode all Phase 101 surface labels; the known report-only baseline includes exhibitions, admin/ladder/governance, replay server, and workshop internals. [VERIFIED: scripts/check-boundary-monitors.ts:165] |
| API-06 | Developer can verify public/account/workshop/replay/evidence outputs remain free of Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, stderr, sessions, tokens, host paths, DB DSNs, and private runtime internals by default. | The centralized public-output privacy contract lists these forbidden fields/markers, and both the Go writer and web Go read client invoke leak checks on public responses. [VERIFIED: packages/spec/src/public-output-privacy.ts:1] [VERIFIED: apps/go-backend/live_backend.go:1529] [VERIFIED: apps/web/lib/public-go-read-client.ts:247] |
</phase_requirements>

## Summary

Phase 101 should make the selected normal product path boring: web creates exhibitions through Go, web reads public MatchSet summary/evidence through Go, web reads public replay metadata through Go, and any selected public replay evidence needed by the React replay UI is delivered by a Go-owned public/evidence contract rather than a TypeScript direct Chronicle store read. [VERIFIED: .planning/phases/101-public-evidence-delivery-and-web-cutover/101-CONTEXT.md] The current repo already has most of the adapter mechanics and Go route primitives for exhibition creation, public MatchSet summary, and public replay metadata; the remaining important cutover gap is `apps/web/app/matches/server.ts`, which still opens a DB pool and reads `chronicles.artifact` through `@cowards/persistence`. [VERIFIED: apps/web/app/api/exhibitions/route.ts:22] [VERIFIED: apps/go-backend/live_backend.go:68] [VERIFIED: apps/go-backend/live_backend.go:69] [VERIFIED: apps/web/app/matches/server.ts:1]

**Primary recommendation:** Use the existing Go-selection adapters for exhibitions and public reads, add a narrow Go-owned public replay evidence DTO/route for the replay page, and update boundary manifests/monitors so every remaining TypeScript surface is labeled `frontend`, `parity_only`, `rollback_only`, `test_only`, `runtime_only`, or `deferred`; do not migrate workshop/admin/owner-debug replay in this phase. [VERIFIED: .planning/phases/101-public-evidence-delivery-and-web-cutover/101-CONTEXT.md]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|--------------|----------------|-----------|
| Exhibition create request | API / Backend (Go) | Browser / Client | The browser posts to `/api/exhibitions`, but Go is the selected backend owner for MatchSet creation and queued response when `COWARDS_GO_EXHIBITIONS` or `COWARDS_GO_BACKEND_OWNER=go` is active. [VERIFIED: apps/web/app/api/exhibitions/route.ts:22] |
| Public MatchSet summary/evidence | API / Backend (Go) | Database / Storage | Go assembles the public MatchSet DTO from stored MatchSet scoring, entrant snapshots, Match rows, and Chronicle hash availability. [VERIFIED: apps/go-backend/live_backend.go:974] |
| Public replay metadata | API / Backend (Go) | Database / Storage | Go reads only Chronicle metadata columns for `GET /public/replays/{matchId}/metadata`, avoiding raw Chronicle artifact exposure. [VERIFIED: apps/go-backend/live_backend.go:257] |
| Selected public replay evidence | API / Backend (Go) | Frontend (React renderer) | Existing React UI may remain rendering, but the normal data access boundary must become a Go-owned public/evidence contract rather than direct TypeScript persistence. [VERIFIED: .planning/phases/101-public-evidence-delivery-and-web-cutover/101-CONTEXT.md] |
| Owner-debug replay projection | Deferred / Owner Debug | TypeScript rollback/test only | Owner-debug replay migration is explicitly out of scope and must not be treated as normal public evidence. [VERIFIED: .planning/phases/101-public-evidence-delivery-and-web-cutover/101-CONTEXT.md] |
| Strategy runtime execution | TypeScript runtime service | Go orchestration caller | v1.15 keeps hostile JS/TS Strategy execution behind `strategy-runtime-abi-v1.14`; Go/web/API must not execute Strategy code. [VERIFIED: AGENTS.md] [VERIFIED: .planning/phases/098-runtime-execution-service-boundary/098-CONTEXT.md] |

## Project Constraints (from AGENTS.md)

- Keep engine logic pure, deterministic, serializable, and side-effect free. [VERIFIED: AGENTS.md]
- Do not put game rules in React components. [VERIFIED: AGENTS.md]
- Do not execute user Strategy code in the web/API process. [VERIFIED: AGENTS.md]
- Do not use `Math.random`, `Date.now`, system time, filesystem, network, or database access inside engine logic. [VERIFIED: AGENTS.md]
- Do not use Node `vm` as a security boundary for untrusted code. [VERIFIED: AGENTS.md]
- Treat Strategy code as hostile and validate every runtime boundary with schemas. [VERIFIED: AGENTS.md]
- Preserve canonical terminology: Soldier, Match, Phase, Round, Activation, Cycle, Action, Advance, STONE, FALLEN, Chronicle. [VERIFIED: AGENTS.md]
- Strategy Revisions are immutable once submitted for Match or MatchSet play. [VERIFIED: AGENTS.md]
- Public replay output must not expose Strategy source, StrategyMemory, SoldierMemory, or objective payloads by default. [VERIFIED: AGENTS.md]
- Replay or Match creation changes require board realism checks for in-bounds visible Soldiers/terrain and plausible full Match starts. [VERIFIED: AGENTS.md]

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | repo `^16.2.6`; registry `16.2.6`, modified 2026-05-23 | Web app routes and React server rendering | Existing app framework; selected pages/routes already live under `apps/web/app`. [VERIFIED: package.json] [VERIFIED: npm registry] |
| React | repo `^19.2.6`; registry `19.2.6`, modified 2026-05-08 | Replay and web UI rendering | Existing UI runtime; React replay UI is allowed to remain rendering surface. [VERIFIED: apps/web/package.json] [VERIFIED: npm registry] |
| TypeScript | repo `^6.0.3`; registry `6.0.3`, modified 2026-04-16 | Web/spec/service/replay source language | Existing monorepo language and service contract source. [VERIFIED: package.json] [VERIFIED: npm registry] |
| Zod | repo `^4.4.3`; registry `4.4.3`, modified 2026-05-04 | DTO and public output schema validation | Public MatchSet/replay DTO schemas are already Zod-owned in `@cowards/spec`. [VERIFIED: packages/spec/package.json] [VERIFIED: npm registry] |
| Go | module `go 1.25.0`; local `go1.26.3` | Go backend public/product route owner | Existing `apps/go-backend` module and live backend route owner. [VERIFIED: apps/go-backend/go.mod] [VERIFIED: local command] |
| pgx/v5 | repo `v5.9.2`, module time 2026-04-19 | Go PostgreSQL access | Existing Go DB driver used by `LiveServer`. [VERIFIED: apps/go-backend/go.mod] [VERIFIED: go list] |
| PostgreSQL | local psql `16.14` | Persistence for MatchSets, Matches, Chronicles, jobs | Existing schema stores `chronicles.artifact` and metadata columns used by Go replay metadata. [VERIFIED: packages/persistence/migrations/0001_initial.sql] [VERIFIED: local command] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Vitest | repo `^4.1.6`; registry `4.1.7`, modified 2026-05-20 | Focused unit/adapter/monitor tests | Use for web adapter, public DTO, replay server, and monitor tests. [VERIFIED: package.json] [VERIFIED: npm registry] |
| Playwright | repo `^1.60.0`; registry `1.60.0`, modified 2026-05-23 | Browser replay validation | Use for replay board realism and selected web-through-Go smoke when Phase 101 affects replay UI data. [VERIFIED: package.json] [VERIFIED: npm registry] |
| pnpm | repo `11.1.2`; local `11.1.2` | Workspace package manager | Existing scripts and monorepo install tool. [VERIFIED: package.json] [VERIFIED: local command] |
| Turborepo | repo `^2.9.14`; registry `2.9.14`, modified 2026-05-22 | Workspace task orchestration | Existing `build`, `test`, `typecheck`, and `lint` scripts run through Turbo. [VERIFIED: package.json] [VERIFIED: npm registry] |
| @redocly/cli | repo `2.31.4`; registry `2.31.4`, modified 2026-05-22 | OpenAPI linting | Existing `contract:lint` uses Redocly against generated service API artifact. [VERIFIED: package.json] [VERIFIED: npm registry] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Existing Go HTTP routes plus Zod/Go validation | New GraphQL/BFF layer | Reject for Phase 101: selected routes and clients already exist, and adding a new protocol increases cutover surface without addressing the direct replay persistence gap. [VERIFIED: codebase grep] |
| Existing public-output privacy guard | New bespoke replay redaction scanner | Reject: `assertPublicOutputLeakSafe` already centralizes forbidden fields/markers and is used by Go/web public paths. [VERIFIED: packages/spec/src/public-output-privacy.ts:1] |
| Existing Postgres-backed Go reads | New queue/broker/read-model service | Reject for Phase 101: the phase is route/data cutover, and prior phases already own lifecycle/scoring; new infrastructure is outside selected workflow scope. [VERIFIED: .planning/ROADMAP.md] |

**Installation:**
```bash
# No new packages should be installed for Phase 101.
pnpm install
cd apps/go-backend && go mod download
```

**Version verification:** Package versions above were verified with `npm view <package> version time.modified`, local `node/pnpm/go/psql --version`, and `go list -m -json github.com/jackc/pgx/v5 golang.org/x/crypto`. [VERIFIED: npm registry] [VERIFIED: local command] [VERIFIED: go list]

## Architecture Patterns

### System Architecture Diagram

```text
Browser exhibition form
  -> Next /api/exhibitions
    -> if Go selected: Go POST /matchsets
      -> Postgres match_sets + matches + match_jobs
      -> queued response /matchsets/{id}
    -> if not selected: TypeScript rollback/deferred path only

Browser MatchSet page/API
  -> public-service-boundary
    -> public-service-adapter route selection
      -> Go GET /public/matchsets/{id}/summary
        -> Postgres match_sets.scoring + entrants + matches + chronicle hashes
        -> public-safe DTO

Browser replay metadata/API
  -> public-service-boundary
    -> Go GET /public/replays/{matchId}/metadata
      -> Postgres chronicle metadata columns only
      -> public-safe metadata DTO

Browser replay page
  -> React Replay UI remains
  -> replace direct TypeScript Chronicle store read with selected Go public replay evidence contract
    -> Go reads public evidence / projection-safe fields
    -> public-safe replay-ready DTO
    -> owner-debug stays deferred/explicit owner-only
```

### Recommended Project Structure

```text
apps/web/lib/
├── public-service-adapter.ts        # selected public Go route ownership
├── public-go-read-client.ts         # schema/privacy/no-fallback Go client
└── public-service-boundary.ts       # page/API-facing public DTO facade

apps/web/app/matches/
├── server.ts                        # migrate public replay data access off direct persistence or label owner-debug/deferred pieces
└── replay-ready.ts                  # keep rendering DTO construction and board realism checks public-safe

apps/go-backend/
├── live_backend.go                  # add selected public replay evidence route and DTO assembly
└── main_test.go                     # route/fixture/privacy/schema tests

packages/spec/src/
├── schemas.ts                       # public replay evidence DTO schema if new route is added
├── service.ts                       # service route metadata and examples
└── public-output-privacy.ts         # central privacy denylist

scripts/
├── check-service-boundary-imports.ts # strict/report-only boundary accounting
└── check-boundary-monitors.ts        # ownership/privacy/route drift gates
```

### Pattern 1: Fail-Closed Selected Go Adapter

**What:** Resolve selected routes from env, require `COWARDS_GO_BACKEND_URL` when selected, and throw instead of falling back to TypeScript. [VERIFIED: apps/web/lib/public-service-adapter.ts:66]  
**When to use:** Exhibition creation and selected public MatchSet/replay/evidence reads. [VERIFIED: .planning/phases/101-public-evidence-delivery-and-web-cutover/101-CONTEXT.md]  
**Example:**
```typescript
// Source: apps/web/lib/public-service-adapter.ts
if (!isRouteGoSelected(routeOwnership, "getPublicReplayMetadata")) {
  return localService.getPublicReplayMetadata(matchId)
}
return requireGoClient(
  "getPublicReplayMetadata",
  selectedGoClient,
).getPublicReplayMetadata(matchId)
```

### Pattern 2: Public DTO Schema + Privacy Validation Before Use

**What:** Parse every Go public response with the canonical Zod DTO schema and run `assertPublicServiceDtoLeakSafe` before returning it to page/API callers. [VERIFIED: apps/web/lib/public-go-read-client.ts:227]  
**When to use:** New public replay evidence DTO and any expanded MatchSet/replay evidence route. [VERIFIED: packages/spec/src/schemas.ts:1092]  
**Example:**
```typescript
// Source: apps/web/lib/public-go-read-client.ts
try {
  assertPublicServiceDtoLeakSafe(body)
} catch (error) {
  throw new PublicGoReadError(
    "Go public read privacy validation failed",
    makeDiagnostic(routeId, "go_privacy_violation", status, startedAt, endedAt),
    { cause: error },
  )
}
```

### Pattern 3: Go Public Writes Use Public-Safe Writer

**What:** Public Go responses pass through `writeJSONValue`, which rejects private keys before serialization. [VERIFIED: apps/go-backend/live_backend.go:1529]  
**When to use:** All new public replay evidence and MatchSet evidence routes. [VERIFIED: apps/go-backend/live_backend.go:238]  
**Example:**
```go
// Source: apps/go-backend/live_backend.go
func writeJSONValue(writer http.ResponseWriter, status int, value any) {
	if err := validateNoPrivateKeys(value, "$"); err != nil {
		writeServiceError(writer, http.StatusInternalServerError, "INTERNAL", "Response failed privacy validation.")
		return
	}
	writePrivateJSONValue(writer, status, value)
}
```

### Pattern 4: Keep Replay Rendering, Move Public Data Access

**What:** Keep `ReplayClient`/React rendering, but make normal public replay page data come from a Go-owned evidence client instead of `createPostgresChronicleStore`. [VERIFIED: apps/web/app/matches/[matchId]/replay/page.tsx] [VERIFIED: apps/web/app/matches/server.ts:42]  
**When to use:** Phase 101 replay cutover; owner-debug replay remains deferred/owner-only. [VERIFIED: .planning/phases/101-public-evidence-delivery-and-web-cutover/101-CONTEXT.md]

### Anti-Patterns to Avoid

- **Raw Chronicle route:** Do not expose `chronicles.artifact` or private Chronicle projection as a public Go route; specs say public Chronicles omit Strategy source, StrategyMemory, SoldierMemory, and objective payloads by default. [VERIFIED: CowardsGameSpec_Full_Consolidated_v1.md]
- **Hidden TypeScript fallback:** Do not catch Go client failures and call `createCowardsLocalService` for selected routes; existing adapter tests expect zero TypeScript calls on Go-selected failure. [VERIFIED: apps/web/lib/public-service-adapter.test.ts]
- **Broad workshop/admin migration:** Do not migrate workshop internals, owner-debug replay, ladder/admin/governance mutation, or test-support routes in Phase 101; context explicitly defers them. [VERIFIED: .planning/phases/101-public-evidence-delivery-and-web-cutover/101-CONTEXT.md]
- **React rule logic:** Do not move game rule, Chronicle validation, or replay privacy semantics into React components; AGENTS.md forbids game rules in React and the replay-ready code already handles validation/projection before rendering. [VERIFIED: AGENTS.md] [VERIFIED: apps/web/app/matches/replay-ready.ts]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Public DTO validation | Ad hoc shape checks in routes | Zod schemas in `packages/spec/src/schemas.ts` | Existing public MatchSet/replay schemas already encode allowed status/evidence fields. [VERIFIED: packages/spec/src/schemas.ts:1092] |
| Public privacy scanning | Route-local string blacklist | `assertPublicOutputLeakSafe` / `assertPublicServiceDtoLeakSafe` | Central denylist already covers Strategy source, memories, objectives, debug, tokens, host paths, and DB DSNs. [VERIFIED: packages/spec/src/public-output-privacy.ts:1] |
| Go route selection | New env flag convention | `COWARDS_GO_BACKEND_OWNER`, `COWARDS_GO_PUBLIC_READS`, `COWARDS_GO_EXHIBITIONS`, `COWARDS_GO_BACKEND_URL` | Existing adapters and tests use these flags for selected Go ownership and fail-closed URL requirements. [VERIFIED: apps/web/lib/public-service-adapter.ts:66] [VERIFIED: apps/web/lib/account-service-adapter.ts:60] |
| Replay board validation | Canvas/browser-only visual heuristics | Existing replay-ready board realism checks plus Playwright visual tests | Replay-ready validates bounds, fallen visibility, overlapping pieces/terrain, and canonical starts before render. [VERIFIED: apps/web/app/matches/replay-ready.ts] |
| Ownership drift detection | Manual checklist only | `check-service-boundary-imports.ts` and `check-boundary-monitors.ts` | Existing monitors already gate strict/report-only imports and known public/privacy/route ownership drift. [VERIFIED: scripts/check-service-boundary-imports.ts:306] [VERIFIED: scripts/check-boundary-monitors.ts:832] |

**Key insight:** The risky part is not adding another route; it is preventing a selected Go route from quietly becoming a TypeScript DB read, a raw Chronicle leak, or an owner-debug replay path. [VERIFIED: .planning/phases/101-public-evidence-delivery-and-web-cutover/101-CONTEXT.md]

## Common Pitfalls

### Pitfall 1: Treating Replay Metadata as Replay Evidence
**What goes wrong:** Implementation declares API-03 complete because Go serves `/public/replays/{matchId}/metadata`, while the replay page still reads full Chronicle artifacts through TypeScript persistence. [VERIFIED: apps/go-backend/live_backend.go:257] [VERIFIED: apps/web/app/matches/server.ts:122]  
**Why it happens:** Existing public read adapter covers metadata, not full replay-ready public evidence. [VERIFIED: apps/web/lib/public-go-read-client.ts:450]  
**How to avoid:** Add/select a public replay evidence DTO/route or explicitly keep only metadata in scope and mark full replay projection deferred; Phase 101 context requires selected public replay evidence. [VERIFIED: .planning/phases/101-public-evidence-delivery-and-web-cutover/101-CONTEXT.md]  
**Warning signs:** `apps/web/app/matches/server.ts` still imports `@cowards/persistence` after cutover and is not labeled deferred/owner-debug/test. [VERIFIED: scripts/check-boundary-monitors.ts:189]

### Pitfall 2: Public Privacy False Positives on Safe Hash Fields
**What goes wrong:** A privacy check blocks safe `sourceHash`/`sourceBytes` fields even though current public DTOs expose hashes/byte counts. [VERIFIED: packages/spec/src/schemas.ts:1054]  
**Why it happens:** The denylist blocks `source`, `sourceText`, and `strategySource`, not every key containing the substring `source`. [VERIFIED: packages/spec/src/public-output-privacy.ts:1]  
**How to avoid:** Use the centralized privacy helper rather than broad substring checks. [VERIFIED: packages/spec/src/public-output-privacy.ts:65]  
**Warning signs:** Public MatchSet entrant DTOs fail despite only carrying `sourceHash` and `sourceBytes`. [VERIFIED: packages/spec/src/schemas.ts:1047]

### Pitfall 3: Leaving TypeScript Surface Labels Implicit
**What goes wrong:** The report-only offense baseline stays at 29, but planners cannot tell which remaining surfaces are rollback/test/runtime/deferred. [VERIFIED: local command `pnpm exec tsx scripts/check-service-boundary-imports.ts`]  
**Why it happens:** Existing monitors list import offenses but do not yet encode all Phase 101 labels. [VERIFIED: scripts/check-boundary-monitors.ts:165]  
**How to avoid:** Add machine-readable label entries for remaining TypeScript surfaces and make monitors reject unlabeled normal product paths. [VERIFIED: .planning/phases/096-boundary-baseline-and-go-ownership-contract/096-CONTEXT.md]  
**Warning signs:** `apps/web/app/api/exhibitions/route.ts` still imports `competitive/server` and appears only as a generic report-only offense after Go exhibition cutover. [VERIFIED: scripts/check-boundary-monitors.ts:173]

### Pitfall 4: Go Public Evidence Missing Phase 100 Scoring
**What goes wrong:** Public MatchSet summary reads stale or empty standings because Go public reads do not see proactive Go scoring updates. [VERIFIED: apps/go-backend/live_backend.go:1016]  
**Why it happens:** Phase 100 requires Go to update `match_sets.scoring` proactively; Phase 101 should consume stored scoring rather than call TypeScript lazy refresh. [VERIFIED: .planning/phases/100-go-matchset-scoring-and-failure-classification/100-CONTEXT.md]  
**How to avoid:** Verify public MatchSet summary with Go-completed/Go-scored fixtures or live DB rows from Phase 99/100. [VERIFIED: .planning/REQUIREMENTS.md]  
**Warning signs:** A public read test passes only after invoking TypeScript `refreshMatchSetStatus`. [VERIFIED: .planning/phases/100-go-matchset-scoring-and-failure-classification/100-CONTEXT.md]

## Code Examples

### Exhibition Go Selection
```typescript
// Source: apps/web/app/api/exhibitions/route.ts
if (isGoExhibitionsSelected()) {
  const result = await requireSelectedGoBackendClient(
    "exhibitions",
  ).createMatchSet(await getAccountSessionId(), {
    presetId: body.presetId,
    revisionIds,
  })
  return Response.json(
    { matchSetId: result.matchSetId, status: "queued", matchCount: result.matchCount ?? 0 },
    { status: 201 },
  )
}
```

### Public MatchSet Evidence Read in Go
```go
// Source: apps/go-backend/live_backend.go
rows, err := server.pool.Query(ctx, `
	select m.id, m.status, m.bottom_strategy_revision_id, m.top_strategy_revision_id,
	       c.hash
	from match_set_matches msm
	join matches m on m.id = msm.match_id
	left join chronicles c on c.match_id = m.id
	where msm.match_set_id = $1
	order by msm.matrix_index asc
`, matchSetID)
```

### Public Replay Metadata Read in Go
```go
// Source: apps/go-backend/live_backend.go
err := server.pool.QueryRow(request.Context(), `
	select id, schema_version, hash, event_count, snapshot_count,
	       bottom_player_id, top_player_id, arena_variant_id
	from chronicles
	where match_id = $1
`, matchID).Scan(...)
```

### Public Replay Projection Privacy Pattern
```typescript
// Source: packages/replay/src/project.ts
export const projectPublicChronicle = (
  chronicle: Chronicle,
): ChronicleProjection => {
  const canonical = canonicalChronicle(chronicle)
  const projection = {
    schemaVersion: canonical.schemaVersion,
    viewer: { access: "public" },
    reproducibility: cloneJson(canonical.reproducibility),
    events: canonical.events.map(projectEvent),
    snapshots: cloneJson(canonical.snapshots),
  }
  assertPublicOutputLeakSafe(projection, "Public replay projection")
  return projection
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Go public reads from generated parity fixtures only | Live PostgreSQL-backed Go public/account/exhibition routes for selected route families | v1.13/v1.14 artifacts | Phase 101 should use live Go route behavior, not fixture-only assumptions. [VERIFIED: .planning/PROJECT.md] [VERIFIED: apps/go-backend/live_backend.go] |
| TypeScript worker owns job claim/completion/scoring | v1.15 phases 97-100 move lifecycle/completion/scoring to Go before Phase 101 | v1.15 roadmap | Phase 101 public evidence should read Go-produced completion/scoring state. [VERIFIED: .planning/ROADMAP.md] |
| Replay page directly reads persisted Chronicle artifacts in TypeScript | Phase 101 target is Go-owned public/evidence contracts for normal replay data access | Phase 101 context | Direct `@cowards/persistence` replay access is the main cutover target or explicit label target. [VERIFIED: apps/web/app/matches/server.ts:1] |
| Runtime execution and backend DB ownership coupled in TypeScript worker | TypeScript runtime service is execution-only; Go owns persistence-facing lifecycle | Phase 98 context | Do not route replay/evidence cutover through a DB-owning TypeScript worker fallback. [VERIFIED: .planning/phases/098-runtime-execution-service-boundary/098-CONTEXT.md] |

**Deprecated/outdated:**
- Treating TypeScript service as the normal future backend for selected public/product workflows is outdated for v1.15; context says it remains parity oracle, rollback reference, runtime owner, test support, frontend, or deferred surface only. [VERIFIED: .planning/phases/101-public-evidence-delivery-and-web-cutover/101-CONTEXT.md]
- Treating Go replay metadata alone as full replay evidence is insufficient for API-03 because the selected public replay evidence requirement is separate from metadata. [VERIFIED: .planning/REQUIREMENTS.md]

## Assumptions Log

All claims in this research were verified or cited from repo-local files, local commands, npm registry, or Go module metadata — no `[ASSUMED]` claims are present. [VERIFIED: codebase grep]

## Open Questions

1. **Exact public replay evidence DTO name**
   - What we know: Existing DTOs cover public MatchSet summary and public replay metadata, but not a full public replay-ready evidence payload from Go. [VERIFIED: packages/spec/src/schemas.ts:1148] [VERIFIED: packages/spec/src/schemas.ts:1223]
   - What's unclear: Whether Phase 101 should name the new route `GET /public/replays/{matchId}/evidence`, `GET /public/replays/{matchId}`, or extend the existing metadata route. [VERIFIED: codebase grep]
   - Recommendation: Add a distinct `getPublicReplayEvidence` route/DTO so metadata remains small and existing clients do not accidentally receive replay projection payloads. [VERIFIED: architecture reasoning from existing route separation]

2. **How much replay-ready payload Go must assemble**
   - What we know: TypeScript currently builds `ReplayReadyDto` from stored Chronicle using `projectPublicChronicle`, timeline construction, and board realism checks. [VERIFIED: apps/web/app/matches/replay-ready.ts]
   - What's unclear: Whether prior Phase 99 gives Go enough Chronicle parsing/projection helpers to assemble the same public replay-ready DTO directly. [VERIFIED: .planning/phases/099-go-match-completion-and-chronicle-persistence/099-CONTEXT.md]
   - Recommendation: Plan for the minimum selected public evidence route that supports the React replay page without owner-debug fields; if Go cannot yet assemble full public replay-ready data, label full replay rendering as deferred and do not claim API-03 complete. [VERIFIED: .planning/phases/101-public-evidence-delivery-and-web-cutover/101-CONTEXT.md]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | pnpm/Vitest/Next scripts | yes | v24.15.0 | none needed [VERIFIED: local command] |
| pnpm | workspace scripts | yes | 11.1.2 | none needed [VERIFIED: local command] |
| Go toolchain | Go backend tests/build | yes | go1.26.3 local; module targets 1.25.0 | none needed [VERIFIED: local command] [VERIFIED: apps/go-backend/go.mod] |
| PostgreSQL client | local DB inspection/smoke | yes | psql 16.14 | Docker service script if local service is down [VERIFIED: local command] [VERIFIED: package.json] |
| Docker | optional local services/container sandbox checks | yes | 29.4.3 | local Postgres if already running [VERIFIED: local command] |
| Go backend | selected public/product routes | source present | `apps/go-backend` | none for selected Go mode; fail closed if unavailable [VERIFIED: apps/go-backend/live_backend.go] |

**Missing dependencies with no fallback:** None found during research. [VERIFIED: local command]

**Missing dependencies with fallback:** None found during research. [VERIFIED: local command]

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest repo `^4.1.6` / local run `v4.1.6`; Playwright repo `^1.60.0`; Go `testing` with local go1.26.3 [VERIFIED: package.json] [VERIFIED: local command] |
| Config file | `vitest.config.ts`, `apps/web/vitest.config.ts`, `playwright.config.ts`, `apps/go-backend/go.mod` [VERIFIED: rg --files] |
| Quick run command | `pnpm exec vitest run apps/web/lib/public-service-adapter.test.ts apps/web/lib/public-go-read-client.test.ts apps/web/app/matches/server.test.ts && cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./...` [VERIFIED: local command] |
| Full suite command | `pnpm boundary:monitors && pnpm verify` [VERIFIED: package.json] |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| API-01 | Go-selected exhibition create fails closed and returns queued MatchSet response | unit/integration | `pnpm exec vitest run apps/web/app/api/exhibitions/route.test.ts apps/web/lib/account-service-adapter.test.ts` | Partial; route test likely Wave 0 if absent [VERIFIED: rg --files] |
| API-02 | Public MatchSet summary/evidence comes from Go and reflects stored Go scoring | Go + web adapter | `cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./... && pnpm exec vitest run apps/web/lib/public-go-read-client.test.ts` | Yes for current route/client; add Go-scored fixture after Phase 100 [VERIFIED: apps/go-backend/main_test.go] |
| API-03 | Public replay metadata and selected replay evidence come from Go without raw Chronicle/private projection exposure | unit/integration | `pnpm exec vitest run apps/web/app/matches/server.test.ts apps/web/lib/public-go-read-client.test.ts` plus new Go route test | Partial; new evidence DTO/route test is Wave 0 [VERIFIED: apps/web/app/matches/server.test.ts] |
| API-04 | Selected normal web workflows call Go-owned contracts instead of direct persistence/service internals | monitor | `pnpm exec tsx scripts/check-service-boundary-imports.ts` | Yes; requires Phase 101 baseline/label update [VERIFIED: scripts/check-service-boundary-imports.ts] |
| API-05 | Remaining TypeScript surfaces are explicitly labeled | monitor | `pnpm exec vitest run scripts/check-boundary-monitors.test.ts` plus manifest test | Partial; label manifest checks are Wave 0 [VERIFIED: scripts/check-boundary-monitors.ts] |
| API-06 | Public/account/workshop/replay/evidence outputs omit private fields/markers | unit/monitor | `pnpm exec vitest run packages/spec/src/spec.test.ts apps/web/lib/public-go-read-client.test.ts apps/go-backend/main_test.go` | Yes for existing DTOs; extend for new replay evidence [VERIFIED: packages/spec/src/spec.test.ts] |

### Sampling Rate

- **Per task commit:** `pnpm exec vitest run <changed-test-files> && cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./...` [VERIFIED: local command]
- **Per wave merge:** `pnpm boundary:monitors` [VERIFIED: package.json]
- **Phase gate:** `pnpm verify` plus any new live web-through-Go smoke required by Phase 102 handoff. [VERIFIED: package.json] [VERIFIED: .planning/ROADMAP.md]

### Wave 0 Gaps

- [ ] `apps/web/app/api/exhibitions/route.test.ts` — covers API-01 no-fallback and queued Go response if not already created by prior phases. [VERIFIED: rg --files]
- [ ] `apps/web/lib/public-go-read-client.test.ts` — extend route id/failure class coverage if adding `getPublicReplayEvidence`. [VERIFIED: apps/web/lib/public-go-read-client.test.ts]
- [ ] `apps/go-backend/main_test.go` — add route/fixture/privacy/schema tests for any new public replay evidence route. [VERIFIED: apps/go-backend/main_test.go]
- [ ] `scripts/check-boundary-monitors.test.ts` — add TypeScript surface-label drift checks. [VERIFIED: scripts/check-boundary-monitors.test.ts]
- [ ] `scripts/check-service-boundary-imports.ts` or v1.15 lifecycle manifest tests — remove/move selected normal replay/exhibition surfaces from generic report-only ambiguity or require explicit labels. [VERIFIED: scripts/check-service-boundary-imports.ts]

**Research verification already run:**
- `pnpm exec tsx scripts/check-service-boundary-imports.ts` -> `strict_offenses=0 report_only_offenses=29`. [VERIFIED: local command]
- `cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./...` -> passed. [VERIFIED: local command]
- `pnpm exec vitest run apps/web/lib/public-service-adapter.test.ts apps/web/lib/public-go-read-client.test.ts apps/web/app/matches/server.test.ts` -> 3 files / 33 tests passed. [VERIFIED: local command]
- `pnpm exec vitest run scripts/check-service-boundary-imports.test.ts scripts/check-boundary-monitors.test.ts` -> 2 files / 10 tests passed. [VERIFIED: local command]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | yes | Existing session cookie/auth flows for exhibition creation; Go auth routes must keep token/password details out of public diagnostics. [VERIFIED: apps/go-backend/live_backend.go:70] |
| V3 Session Management | yes | Use existing `cowards_session` cookie path and Go/account adapter; public outputs must not expose sessions/tokens. [VERIFIED: apps/go-backend/live_backend.go:26] [VERIFIED: packages/spec/src/public-output-privacy.ts:23] |
| V4 Access Control | yes | Owner-debug replay remains owner/debug-only or deferred; public replay path must default to public projection. [VERIFIED: apps/web/app/matches/replay-ready.ts] |
| V5 Input Validation | yes | Zod public DTO schemas and Go strict JSON decoding for request bodies. [VERIFIED: packages/spec/src/schemas.ts:1148] [VERIFIED: apps/go-backend/live_backend.go:1565] |
| V6 Cryptography | yes | Session token hashing/password hashing remain in existing Go auth; Phase 101 should not add custom crypto. [VERIFIED: apps/go-backend/live_backend.go] |

### Known Threat Patterns for Web->Go Public Evidence

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Silent TypeScript backend fallback when Go is selected | Tampering / Repudiation | Require Go client for selected routes and throw on missing URL/unavailable Go. [VERIFIED: apps/web/lib/public-service-adapter.ts:126] |
| Raw Chronicle or owner projection leak in public replay route | Information Disclosure | Return projected public evidence only, run `assertPublicServiceDtoLeakSafe`, and keep owner-debug deferred/explicit owner-only. [VERIFIED: packages/replay/src/project.ts] |
| Runtime diagnostics/private internals leaking through public errors | Information Disclosure | Use stable public service error DTOs and centralized forbidden field/marker scan. [VERIFIED: apps/go-backend/live_backend.go:1548] [VERIFIED: packages/spec/src/public-output-privacy.ts:1] |
| Route ownership drift | Tampering | Extend route/lifecycle manifest and boundary monitors to reject unlabeled selected TypeScript surfaces. [VERIFIED: scripts/check-boundary-monitors.ts:832] |
| Stale scoring shown as public evidence | Integrity | Consume Phase 100 Go-updated `match_sets.scoring`; do not invoke TypeScript lazy refresh in public read path. [VERIFIED: .planning/phases/100-go-matchset-scoring-and-failure-classification/100-CONTEXT.md] |

## Sources

### Primary (HIGH confidence)

- `AGENTS.md` — project non-negotiables, privacy, testing constraints. [VERIFIED: file read]
- `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, `.planning/STATE.md`, `.planning/research/SUMMARY.md` — v1.15 milestone scope and API-01 through API-06. [VERIFIED: file read]
- `.planning/phases/096-*/096-CONTEXT.md` through `.planning/phases/101-*/101-CONTEXT.md` — ownership labels, no-fallback semantics, runtime/completion/scoring dependencies, Phase 101 locked decisions. [VERIFIED: file read]
- `apps/web/lib/public-service-adapter.ts`, `apps/web/lib/public-go-read-client.ts`, `apps/web/lib/account-service-adapter.ts`, `apps/web/lib/go-backend-service-client.ts` — selected Go adapter patterns and schema/privacy behavior. [VERIFIED: codebase grep]
- `apps/web/app/api/exhibitions/route.ts`, `apps/web/app/matches/server.ts`, `apps/web/app/matches/replay-ready.ts`, `apps/web/app/matchsets/[matchSetId]/page.tsx`, `apps/web/app/api/replays/[matchId]/metadata/route.ts` — selected web route and replay server boundaries. [VERIFIED: codebase grep]
- `apps/go-backend/live_backend.go`, `apps/go-backend/main.go`, `apps/go-backend/main_test.go` — Go live routes, public DTO assembly, privacy writer, route/fixture tests. [VERIFIED: codebase grep]
- `packages/spec/src/schemas.ts`, `packages/spec/src/public-output-privacy.ts`, `packages/spec/src/service.ts`, `packages/replay/src/project.ts`, `packages/persistence/src/chronicle-store.ts` — canonical DTO/privacy/replay projection/persistence contracts. [VERIFIED: codebase grep]
- `scripts/check-service-boundary-imports.ts`, `scripts/check-boundary-monitors.ts`, `scripts/check-local-topology.ts` — import boundary, ownership/privacy, and topology verification patterns. [VERIFIED: codebase grep]

### Secondary (MEDIUM confidence)

- npm registry via `npm view` for current package versions and modified timestamps. [VERIFIED: npm registry]
- Go module cache via `go list -m -json` for Go dependency versions/module times. [VERIFIED: go list]
- Local environment probes for Node, pnpm, Go, Docker, and psql availability. [VERIFIED: local command]

### Tertiary (LOW confidence)

- None. [VERIFIED: source review]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions verified from repo files, npm registry, Go modules, and local tools. [VERIFIED: npm registry] [VERIFIED: go list] [VERIFIED: local command]
- Architecture: HIGH — selected route/adaptor/replay/Go boundaries are directly visible in code and Phase 101 context. [VERIFIED: codebase grep]
- Pitfalls: HIGH — pitfalls map to existing direct persistence imports, tests, and locked no-fallback/privacy decisions. [VERIFIED: scripts/check-service-boundary-imports.ts] [VERIFIED: .planning/phases/101-public-evidence-delivery-and-web-cutover/101-CONTEXT.md]

**Research date:** 2026-05-24  
**Valid until:** 2026-06-07 for repo-local architecture; 2026-05-31 for npm version currency. [VERIFIED: npm registry]
