# Phase 99: Go Match Completion and Chronicle Persistence - Research

**Researched:** 2026-05-24 [VERIFIED: system date]
**Domain:** Go-owned Match completion, Chronicle validation/hash persistence, replay compatibility, transaction safety [VERIFIED: .planning/phases/099-go-match-completion-and-chronicle-persistence/099-CONTEXT.md]
**Confidence:** HIGH for repo-local contracts and transaction shape; MEDIUM for exact Go hash implementation until parity fixtures are generated [VERIFIED: codebase grep and Context7 docs]

<user_constraints>
## User Constraints (from CONTEXT.md)

Source for this copied section: [VERIFIED: .planning/phases/099-go-match-completion-and-chronicle-persistence/099-CONTEXT.md]

### Locked Decisions

### Go Completion Ownership

- **D-01:** Go owns normal Match completion after a valid running lease and validated execution result.
- **D-02:** TypeScript `packages/persistence/src/complete-match.ts` remains parity oracle plus explicit rollback/test implementation only.
- **D-03:** TypeScript must not complete normal product Matches when Go completion ownership is selected.

### Atomic Persistence

- **D-04:** Completion must be one database transaction: validate lease, validate Chronicle, insert Chronicle, update `matches`, update `match_jobs`, and finish the current `match_job_attempts` row.
- **D-05:** The transaction must fail closed without completing the Match if Chronicle validation, storage, lease validation, or attempt completion fails.
- **D-06:** Go should preserve the current TypeScript contract that completion requires the job lease token and `running` job state unless safe idempotency applies.

### Idempotency And Conflicts

- **D-07:** Duplicate completion is idempotent only when the Match is already `complete` and a Chronicle row exists for that Match.
- **D-08:** Invalid lease plus no completed Chronicle must fail closed.
- **D-09:** Existing Chronicle reuse is allowed only when compatible with the requested Match completion. Hash/id drift, mismatched metadata, or storage conflict ambiguity must fail closed.

### Completion Field Parity

- **D-10:** Go derives Match completion fields from final state with TypeScript parity.
- **D-11:** Required derived fields include outcome, winner, surviving Soldier count, per-side surviving Soldier counts, survival turns, and per-side survival turns.
- **D-12:** Parity fixtures should compare Go output against `deriveMatchCompletionFields` behavior before replacing the normal completion path.

### Chronicle Validation

- **D-13:** Go validates Chronicle schema version, Match id, Strategy Revision ids, arena id, terminal outcome, event count, snapshot count, canonical metadata, and content hash before persistence.
- **D-14:** Go-completed Chronicles must remain readable by existing replay reconstruction and public projection code during migration.
- **D-15:** Invalid Chronicles, mismatched Match ids, hash drift, missing terminal outcomes, incompatible schema, and public/private projection leaks fail closed without completing the Match.

### Privacy And Public Safety

- **D-16:** Completion artifacts, service responses, topology evidence, and monitor output must not expose Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, stderr, sessions, tokens, host paths, DB DSNs, or private runtime internals by default.
- **D-17:** Public replay compatibility evidence should use projected/public-safe replay surfaces, not raw Chronicle internals.

### the agent's Discretion

The agent may choose Go package boundaries, transaction helper shapes, validation helper names, and fixture formats, provided completion remains atomic, parity-tested, idempotent only in safe cases, and source/private-data safe by default.

### Deferred Ideas (OUT OF SCOPE)

- MatchSet scoring and final failure classification — Phase 100.
- Public evidence route delivery and web route cutover — Phase 101.
- Topology monitors, rollback drills, and promotion gate — Phase 102.
- Production sandbox replacement and final TypeScript runtime retirement — v1.16 or later.
</user_constraints>

## Summary

Phase 99 should implement a narrow Go completion boundary that accepts a Phase 97 claimed job plus a Phase 98 execution result, validates the Chronicle against the TypeScript replay/persistence oracle, and persists Chronicle plus Match/job/attempt completion in one `pgx` transaction. [VERIFIED: 099-CONTEXT.md; VERIFIED: packages/persistence/src/complete-match.ts:66-149; CITED: https://pkg.go.dev/github.com/jackc/pgx/v5/pgxpool]

The strongest implementation pattern is to keep Go completion separate from MatchSet scoring and public evidence route ownership: persist the Chronicle row in the existing `chronicles` schema, update `matches` completion fields, mark `match_jobs` complete, mark the current `match_job_attempts` complete, then let Phase 100 consume completed rows for scoring. [VERIFIED: packages/persistence/migrations/0001_initial.sql:64-151; VERIFIED: 099-CONTEXT.md]

**Primary recommendation:** Add a Go `CompleteMatch` service under `apps/go-backend` that uses `pgxpool.Pool.Begin`, deferred rollback, strict Chronicle metadata/hash validation, and TypeScript-generated parity fixtures before wiring it into normal orchestration. [VERIFIED: apps/go-backend/live_backend.go:21-23; CITED: https://pkg.go.dev/github.com/jackc/pgx/v5]

## Project Constraints (from AGENTS.md)

- Keep the engine pure, deterministic, serializable, and side-effect free. [VERIFIED: AGENTS.md]
- Do not put game rules in React components. [VERIFIED: AGENTS.md]
- Do not execute user Strategy code in the web/API process. [VERIFIED: AGENTS.md]
- Do not use `Math.random`, `Date.now`, system time, filesystem, network, or database access inside engine logic. [VERIFIED: AGENTS.md]
- Do not use Node `vm` as a security boundary for untrusted code. [VERIFIED: AGENTS.md]
- Treat Strategy code as hostile and validate every runtime boundary with schemas. [VERIFIED: AGENTS.md]
- Preserve canonical terminology: Soldier, Match, Phase, Round, Activation, Cycle, Action, Advance, STONE, FALLEN, Chronicle. [VERIFIED: AGENTS.md]
- Strategy Revisions are immutable once submitted for Match or MatchSet play. [VERIFIED: AGENTS.md]
- Public replay output must not expose Strategy source, StrategyMemory, SoldierMemory, or objective payloads by default. [VERIFIED: AGENTS.md]
- Replay or Match creation changes must include board realism checks for in-bounds visible Soldiers/terrain and plausible full Match starts. [VERIFIED: AGENTS.md]

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| COMP-01 | Complete a claimed Match through Go only when the lease token is valid and the job is running. [VERIFIED: .planning/REQUIREMENTS.md] | Use the TypeScript lease gate as oracle and port it to a `select ... for update` check inside the Go transaction. [VERIFIED: packages/persistence/src/complete-match.ts:73-80] |
| COMP-02 | Duplicate completion is idempotent only when the Match is already complete and a Chronicle row exists. [VERIFIED: .planning/REQUIREMENTS.md] | Preserve the existing duplicate path but strengthen compatibility checks against requested Chronicle metadata/hash. [VERIFIED: packages/persistence/src/complete-match.ts:81-97; VERIFIED: packages/persistence/src/chronicle-store.ts:172-178] |
| COMP-03 | Derive completion fields with TypeScript parity for outcome, winner, survivor counts, and survival turns. [VERIFIED: .planning/REQUIREMENTS.md] | Port `deriveMatchCompletionFields`: non-`FALLEN` Soldier counts, side-filtered counts, and `phaseNumber*16 + roundNumber*4 + activationCount`. [VERIFIED: packages/persistence/src/complete-match.ts:26-63] |
| COMP-04 | Validate Chronicle schema version, ids, arena, terminal outcome, counts, metadata, and hash before persistence. [VERIFIED: .planning/REQUIREMENTS.md] | Use `validateChronicle`, `createChronicleMetadata`, and `createChronicleContentHash` behavior as fixture oracle. [VERIFIED: packages/persistence/src/chronicle-store.ts:78-105; VERIFIED: packages/replay/src/validate.ts:16-32; VERIFIED: packages/replay/src/hash.ts:24-32] |
| COMP-05 | Chronicle persistence is atomic with Match, job, and attempt completion updates. [VERIFIED: .planning/REQUIREMENTS.md] | Use one `pgx` transaction, `defer tx.Rollback`, and explicit `Commit` only after all writes succeed. [CITED: https://pkg.go.dev/github.com/jackc/pgx/v5/pgxpool] |
| COMP-06 | Invalid Chronicle, id mismatch, hash drift, missing terminal snapshot, or privacy leak fails closed. [VERIFIED: .planning/REQUIREMENTS.md] | Validate before any write and assert public projection leak-safety as a pre-persistence guard. [VERIFIED: packages/replay/src/validate.ts:280-289; VERIFIED: packages/replay/src/project.ts:106-118; VERIFIED: packages/spec/src/public-output-privacy.ts:65-100] |
| COMP-07 | Go-completed Chronicles remain readable by existing replay reconstruction and public projection code. [VERIFIED: .planning/REQUIREMENTS.md] | Store rows in the existing `chronicles.artifact` shape and verify `createReplay` plus `buildReadyReplayFromStoredChronicle`. [VERIFIED: packages/persistence/migrations/0001_initial.sql:108-122; VERIFIED: apps/web/app/matches/replay-ready.ts:395-504] |
| COMP-08 | Go and TypeScript parity fixtures cover success, runtime violation completion, duplicate completion, invalid lease, invalid Chronicle, and storage conflict behavior. [VERIFIED: .planning/REQUIREMENTS.md] | Add generated fixture cases from the TS oracle and Go tests under `apps/go-backend`. [VERIFIED: apps/go-backend/main_test.go:16-577; VERIFIED: packages/persistence/src/complete-match.test.ts:1-75] |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|--------------|----------------|-----------|
| Lease-authorized Match completion | Go API / Backend | PostgreSQL | Go is the selected normal completion owner and PostgreSQL holds `match_jobs` state. [VERIFIED: 099-CONTEXT.md; VERIFIED: packages/persistence/migrations/0001_initial.sql:125-151] |
| Chronicle validation/hash/parity | Go API / Backend | TypeScript parity oracle | Go must enforce the contract, while TS replay/persistence code remains the oracle during migration. [VERIFIED: 099-CONTEXT.md; VERIFIED: packages/replay/src/validate.ts:47-91] |
| Atomic persistence | Database / Storage | Go API / Backend | Transactional writes must cover `chronicles`, `matches`, `match_jobs`, and `match_job_attempts`. [VERIFIED: 099-CONTEXT.md; VERIFIED: packages/persistence/migrations/0001_initial.sql:64-151] |
| Replay compatibility | Browser / Client and TypeScript replay package | Go public metadata | Existing replay reconstruction/projection reads stored Chronicles, while Go metadata already reads rows from `chronicles`. [VERIFIED: apps/web/app/matches/server.ts:91-150; VERIFIED: apps/go-backend/live_backend.go:257-300] |
| Privacy checks | Spec/replay packages | Go API / Backend | Existing public-output privacy contract and projection sanitizer define the public-safe surface Go must preserve. [VERIFIED: packages/spec/src/public-output-privacy.ts:1-100; VERIFIED: packages/replay/src/project.ts:17-118] |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Go toolchain | local `go1.26.3`; module target `go 1.25.0` | Implement Go completion and tests. | Existing Go backend is a Go module using `pgxpool`. [VERIFIED: command `go version`; VERIFIED: apps/go-backend/go.mod] |
| `github.com/jackc/pgx/v5` | `v5.9.2`, published 2026-04-19 | PostgreSQL pool, transaction, query APIs. | Existing Go backend imports `pgx/v5` and `pgxpool`; latest listed v5 release is `v5.9.2`. [VERIFIED: go list -m -json; VERIFIED: go list -m -versions; VERIFIED: apps/go-backend/live_backend.go:21-22] |
| PostgreSQL | local `psql 16.14`; server not responding on default `/tmp:5432` during audit | Store Matches, Chronicles, jobs, and attempts. | Existing schema defines all Phase 99 tables and constraints. [VERIFIED: command `psql --version`; VERIFIED: command `pg_isready`; VERIFIED: packages/persistence/migrations/0001_initial.sql:64-151] |
| TypeScript replay/persistence oracle | workspace packages `@cowards/replay`, `@cowards/persistence`, `@cowards/spec` at `0.1.0` | Generate parity fixtures and validate behavior. | Current TS code owns the oracle for completion fields, Chronicle validation, hash, and projection. [VERIFIED: pnpm list; VERIFIED: packages/persistence/src/complete-match.ts:36-63] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Vitest | installed `4.1.6`; npm latest `4.1.7` modified 2026-05-20 | TypeScript oracle fixture tests/generation. | Keep existing installed version unless a separate dependency update is planned. [VERIFIED: package.json; VERIFIED: npm view vitest version time.modified] |
| Zod | installed/latest `4.4.3` modified 2026-05-04 | TS schemas for Chronicle and public DTO validation. | Use through existing `@cowards/spec` schemas, not new Go runtime dependencies. [VERIFIED: packages/spec/package.json; VERIFIED: npm view zod version time.modified; CITED: https://zod.dev/v4] |
| `pg` | installed `8.20.0`; npm latest `8.21.0` modified 2026-05-18 | TS parity DB code. | Do not update for Phase 99 unless fixture generation requires it. [VERIFIED: pnpm list; VERIFIED: npm view pg version time.modified] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Direct Go port of Chronicle validation/hash | Shell out to TypeScript validation during completion | Reject for normal completion because Phase 99 makes Go the completion owner and Phase 98 TypeScript service is execution-only, not DB validation/persistence owner. [VERIFIED: 098-CONTEXT.md; VERIFIED: 099-CONTEXT.md] |
| One SQL transaction in Go | Separate Chronicle insert and Match/job updates | Reject because the phase requires fail-closed atomicity. [VERIFIED: 099-CONTEXT.md] |
| Conservative duplicate completion | Treat any Chronicle conflict as success | Reject because existing `on conflict do nothing` can return an existing row without checking compatibility, and Phase 99 requires hash/id drift to fail closed. [VERIFIED: packages/persistence/src/chronicle-store.ts:145-178; VERIFIED: 099-CONTEXT.md] |

**Installation:**
```bash
# No new dependencies are recommended for Phase 99. [VERIFIED: package.json; VERIFIED: apps/go-backend/go.mod]
cd apps/go-backend && go test ./...
pnpm --filter @cowards/persistence test
```

**Version verification:** `npm view vitest version time.modified`, `npm view zod version time.modified`, `npm view pg version time.modified`, `go list -m -json github.com/jackc/pgx/v5`, and `go list -m -versions github.com/jackc/pgx/v5` were run during research. [VERIFIED: command outputs]

## Architecture Patterns

### System Architecture Diagram

```text
Phase 97 claimed job + lease
        |
        v
Go CompleteMatch(input: jobId, leaseToken, execution result)
        |
        v
Begin PostgreSQL transaction
        |
        +--> lock/validate running match_jobs row by jobId + leaseToken
        |       |
        |       +--> missing lease?
        |              |
        |              +--> if matches.status='complete' AND compatible chronicle exists: return metadata
        |              +--> else rollback + fail closed
        |
        +--> validate Chronicle schema/version/events/snapshots/hash/metadata/privacy
        |
        +--> insert chronicles row, rejecting incompatible conflict
        |
        +--> derive completion fields from final state
        |
        +--> update matches.status/outcome/survivor fields/completed_at
        |
        +--> update match_jobs.status='complete'
        |
        +--> update current match_job_attempts.status='complete'
        |
        v
Commit transaction
        |
        v
Existing replay code reads chronicles.artifact and public-safe metadata
```

The diagram reflects the required data flow and rollback points for Phase 99. [VERIFIED: 099-CONTEXT.md; VERIFIED: packages/persistence/src/complete-match.ts:73-149; CITED: https://pkg.go.dev/github.com/jackc/pgx/v5]

### Recommended Project Structure

```text
apps/go-backend/
├── completion.go              # Go CompleteMatch transaction and field derivation. [VERIFIED: existing Go package location]
├── completion_test.go         # Go unit tests for lease/idempotency/transaction outcomes. [VERIFIED: apps/go-backend/main_test.go pattern]
├── chronicle_validation.go    # Go Chronicle metadata/hash/privacy validation helpers. [VERIFIED: packages/persistence/src/chronicle-store.ts oracle]
├── chronicle_validation_test.go
└── testdata/completion-fixtures/
    ├── success.json           # Generated from TypeScript oracle. [VERIFIED: scripts/generate-go-parity-fixtures.ts pattern]
    ├── runtime-violation.json
    ├── invalid-chronicle.json
    └── duplicate-complete.json
```

### Pattern 1: Transaction Helper

**What:** Use `tx, err := pool.Begin(ctx)`, `defer tx.Rollback(ctx)`, and `tx.Commit(ctx)` only after all validations and writes succeed. [CITED: https://pkg.go.dev/github.com/jackc/pgx/v5/pgxpool]

**When to use:** Every normal Match completion path in Go. [VERIFIED: 099-CONTEXT.md]

**Example:**
```go
// Source: https://pkg.go.dev/github.com/jackc/pgx/v5/pgxpool
tx, err := pool.Begin(ctx)
if err != nil {
    return CompletionResult{}, err
}
defer func() { _ = tx.Rollback(ctx) }()

// validate lease, validate Chronicle, insert Chronicle, update rows

if err := tx.Commit(ctx); err != nil {
    return CompletionResult{}, err
}
```

### Pattern 2: Completion Fields Derived From Final State

**What:** Derive `winner_player_id` only for `WIN`, count Soldiers whose status is not `FALLEN`, compute per-side counts by player side, and calculate survival turns as `phaseNumber*16 + roundNumber*4 + activationCount`. [VERIFIED: packages/persistence/src/complete-match.ts:26-63]

**When to use:** Before updating `matches`, using the Phase 98 execution final state as input. [VERIFIED: 099-CONTEXT.md]

**Example:**
```go
// Source: packages/persistence/src/complete-match.ts:36-63
survivalTurns := finalState.PhaseNumber*16 + finalState.RoundNumber*4 + finalState.ActivationCount
winnerPlayerID := (*string)(nil)
if finalState.Outcome.Type == "WIN" {
    winnerPlayerID = &finalState.Outcome.WinnerPlayerID
}
```

### Pattern 3: Chronicle Metadata Is Derived, Not Trusted

**What:** Parse and validate the Chronicle, derive `chronicle:{sha256}`, event/snapshot counts, terminal outcome, Strategy Revision ids, player ids, arena id, and hash from the artifact. [VERIFIED: packages/persistence/src/chronicle-store.ts:78-105]

**When to use:** Before inserting any `chronicles` row or accepting duplicate idempotency. [VERIFIED: 099-CONTEXT.md]

**Example:**
```go
// Source: packages/replay/src/hash.ts:24-32 and packages/replay/src/normalize.ts:3-9
// Normalize to schemaVersion, reproducibility, events, snapshots, optional private.
// Stable-sort object keys, marshal JSON, SHA-256 the normalized bytes.
```

### Pattern 4: Replay Compatibility Verification

**What:** Verify a Go-stored Chronicle can be consumed by `createReplay`, `projectPublicChronicle`, and `buildReadyReplayFromStoredChronicle`. [VERIFIED: packages/replay/src/reconstruct.ts; VERIFIED: packages/replay/src/project.ts:106-118; VERIFIED: apps/web/app/matches/replay-ready.ts:395-504]

**When to use:** In Phase 99 tests after inserting a Go-completed Chronicle. [VERIFIED: COMP-07 in .planning/REQUIREMENTS.md]

### Anti-Patterns to Avoid

- **Trusting execution-service metadata:** Completion fields and Chronicle metadata must be derived by Go and parity-checked against TypeScript, not blindly stored. [VERIFIED: 099-CONTEXT.md; VERIFIED: packages/persistence/src/complete-match.ts:36-63]
- **Insert-on-conflict as broad idempotency:** Existing TS store returns the existing Chronicle on `match_id` conflict; Go must compare existing metadata/hash against the requested completion before returning success. [VERIFIED: packages/persistence/src/chronicle-store.ts:145-178; VERIFIED: 099-CONTEXT.md]
- **Completing before privacy projection safety:** Public projection leak checks should run before committing a Chronicle that later public replay code may read. [VERIFIED: packages/replay/src/project.ts:106-118; VERIFIED: packages/spec/src/public-output-privacy.ts:65-100]
- **Mixing scoring into completion:** Phase 100 owns MatchSet scoring and final failure classification. [VERIFIED: 099-CONTEXT.md]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PostgreSQL transaction semantics | Custom in-memory lock or partial write sequence | `pgxpool.Pool.Begin`, `tx.Commit`, deferred `tx.Rollback` | The DB must atomically guard lease, Chronicle, Match, job, and attempt rows. [CITED: https://pkg.go.dev/github.com/jackc/pgx/v5/pgxpool; VERIFIED: 099-CONTEXT.md] |
| Chronicle schema grammar from scratch | A divergent Go-only grammar without fixtures | Port minimal validators plus generated TS parity fixtures | Existing TS validation covers schema, version, event order, required events/snapshots, transitions, boundaries, and integrity. [VERIFIED: packages/replay/src/validate.ts:93-289] |
| Public privacy scanning | Ad hoc string checks per endpoint | Existing `PUBLIC_OUTPUT_FORBIDDEN_FIELDS`, `PUBLIC_OUTPUT_FORBIDDEN_MARKERS`, and public projection tests | The centralized spec contract already defines forbidden public keys and markers. [VERIFIED: packages/spec/src/public-output-privacy.ts:1-100] |
| Replay reconstruction | A Go replay renderer | Existing TypeScript `createReplay` and web replay compatibility tests | Phase 99 only needs stored Chronicles compatible with existing replay code. [VERIFIED: apps/web/app/matches/replay-ready.ts:395-504; VERIFIED: 099-CONTEXT.md] |

**Key insight:** The hard part is not a new engine path; it is preserving existing TS-derived completion/Chronicle invariants while changing the persistence owner to Go. [VERIFIED: .planning/research/SUMMARY.md; VERIFIED: 099-CONTEXT.md]

## Runtime State Inventory

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | PostgreSQL stores `matches`, `chronicles`, `match_jobs`, and `match_job_attempts`, and `chronicles.match_id` is unique. [VERIFIED: packages/persistence/migrations/0001_initial.sql:64-151] | Code edit only for normal flow; no data migration unless existing incomplete Phase 97/98 jobs must be completed during a rollout. [VERIFIED: 099-CONTEXT.md] |
| Live service config | Go live backend currently registers read/auth/account/fork/create routes, including `POST /matchsets`, but no completion route or worker loop is registered. [VERIFIED: apps/go-backend/live_backend.go:62-80] | Add completion callable from Go orchestration, not a public endpoint unless Phase 97/98 architecture already created an internal route. [VERIFIED: 099-CONTEXT.md] |
| OS-registered state | None found for Phase 99 in repo scan; graphify is disabled. [VERIFIED: `rg`/graphify output] | No OS registration action in this phase. [VERIFIED: command output] |
| Secrets/env vars | `DATABASE_URL` is required by `NewLiveServer`, and Strategy source must not be exposed in logs/responses. [VERIFIED: apps/go-backend/live_backend.go:38-49; VERIFIED: AGENTS.md] | Keep using existing DB config; do not add source-bearing diagnostics. [VERIFIED: 099-CONTEXT.md] |
| Build artifacts | Go backend tests/build artifacts are not source of truth; `go test ./...` is the validation path. [VERIFIED: package.json `go:parity`; VERIFIED: apps/go-backend/go.mod] | No artifact migration; regenerate parity fixtures only if the plan introduces them. [VERIFIED: scripts/generate-go-parity-fixtures.ts grep] |

## Common Pitfalls

### Pitfall 1: Idempotency That Accepts Drift

**What goes wrong:** A duplicate completion returns success even when the existing Chronicle hash or metadata differs from the new request. [VERIFIED: 099-CONTEXT.md]

**Why it happens:** The current TS Chronicle store uses `on conflict (match_id) do nothing` and returns the existing row. [VERIFIED: packages/persistence/src/chronicle-store.ts:145-178]

**How to avoid:** On conflict or already-complete Match, compare existing `id`, `hash`, `schema_version`, `event_count`, `snapshot_count`, outcome, Strategy Revision ids, player ids, and arena id against newly derived metadata before returning success. [VERIFIED: packages/persistence/src/chronicle-store.ts:78-105]

**Warning signs:** Tests pass for duplicate completion but no fixture mutates the duplicate Chronicle hash or arena id. [VERIFIED: COMP-08 in .planning/REQUIREMENTS.md]

### Pitfall 2: Partial Completion

**What goes wrong:** A Chronicle row exists while `matches` or `match_jobs` remains running, or a Match is complete without a current attempt finish. [VERIFIED: 099-CONTEXT.md]

**Why it happens:** Writes are split or errors after Chronicle insert are not rolled back. [VERIFIED: 099-CONTEXT.md]

**How to avoid:** One transaction must cover lease validation, Chronicle insert, `matches`, `match_jobs`, and `match_job_attempts`. [CITED: https://pkg.go.dev/github.com/jackc/pgx/v5; VERIFIED: packages/persistence/src/complete-match.ts:73-149]

**Warning signs:** Tests mock separate repository methods but do not assert rollback after injected failure. [VERIFIED: apps/go-backend/main_test.go existing fixture-only pattern]

### Pitfall 3: Hash Mismatch Between Go And TypeScript

**What goes wrong:** Go stores a `hash` that existing TS replay metadata and parity fixtures do not recognize. [VERIFIED: packages/persistence/src/chronicle-store.ts:87-105]

**Why it happens:** TS hashes `normalizeChronicle(chronicle)`, recursively sorts object keys, omits `undefined`, and excludes `integrity`/`storageMetadata`. [VERIFIED: packages/replay/src/hash.ts:9-32; VERIFIED: packages/replay/src/normalize.ts:3-9]

**How to avoid:** Generate TS oracle hashes for representative Chronicles and require Go hash equality before accepting the implementation. [VERIFIED: scripts/generate-go-parity-fixtures.ts grep]

**Warning signs:** Go tests only assert a 64-character hex string. [VERIFIED: packages/persistence/src/chronicle-store.test.ts:1-132]

### Pitfall 4: Replay-Compatible Shape But Privacy-Unsafe Projection

**What goes wrong:** A Chronicle validates structurally but public replay output leaks owner/private fields. [VERIFIED: packages/replay/src/project.ts:17-118]

**Why it happens:** Raw Chronicle artifacts can contain `private.byPlayerId`; public outputs must use projection/sanitization. [VERIFIED: packages/spec/src/types.ts:471-481; VERIFIED: packages/replay/src/project.ts:121-140]

**How to avoid:** Phase 99 evidence must use `projectPublicChronicle`/public DTOs and `assertPublicOutputLeakSafe`, never raw Chronicle JSON. [VERIFIED: packages/replay/src/project.ts:106-118; VERIFIED: 099-CONTEXT.md]

**Warning signs:** Topology or test logs include `private`, `ownerDebug`, `strategyMemory`, `soldierMemory`, or `objectivePayload`. [VERIFIED: packages/spec/src/public-output-privacy.ts:1-52]

## Code Examples

### Go Completion Transaction Skeleton

```go
// Source: packages/persistence/src/complete-match.ts:73-149 and pgx docs
func (s *LiveServer) CompleteMatch(ctx context.Context, input CompleteMatchInput) (CompletionResult, error) {
    fields := deriveMatchCompletionFields(input.FinalState)
    metadata, err := validateChronicleForCompletion(input.Chronicle, fields)
    if err != nil {
        return CompletionResult{}, err
    }

    tx, err := s.pool.Begin(ctx)
    if err != nil {
        return CompletionResult{}, err
    }
    defer func() { _ = tx.Rollback(ctx) }()

    // 1. Lock job row by id + lease + running.
    // 2. If absent, allow idempotency only for complete Match + compatible Chronicle.
    // 3. Insert Chronicle; incompatible conflict is an error.
    // 4. Update matches, match_jobs, and current match_job_attempts.
    // 5. Commit.

    return CompletionResult{Status: "complete", MatchID: fields.MatchID, ChronicleID: metadata.ID}, tx.Commit(ctx)
}
```

### Chronicle Hash Parity Rules

```go
// Source: packages/replay/src/hash.ts:9-32 and packages/replay/src/normalize.ts:3-9
// Canonical hash input fields:
// - schemaVersion
// - reproducibility
// - events
// - snapshots
// - private only when present
// Excluded from hash input:
// - integrity
// - storageMetadata
```

### Duplicate Completion Compatibility Check

```go
// Source: 099-CONTEXT.md D-07 through D-09
func compatibleChronicle(existing ChronicleMetadata, requested ChronicleMetadata) bool {
    return existing.ID == requested.ID &&
        existing.MatchID == requested.MatchID &&
        existing.SchemaVersion == requested.SchemaVersion &&
        existing.Hash == requested.Hash &&
        existing.EventCount == requested.EventCount &&
        existing.SnapshotCount == requested.SnapshotCount &&
        existing.BottomStrategyRevisionID == requested.BottomStrategyRevisionID &&
        existing.TopStrategyRevisionID == requested.TopStrategyRevisionID &&
        existing.ArenaVariantID == requested.ArenaVariantID
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| TypeScript worker claims, executes, builds Chronicle, completes Match, and records failures in one process. | v1.15 target splits Go lifecycle/completion/persistence from TypeScript execution-only runtime boundary. | v1.15 planning on 2026-05-24. [VERIFIED: .planning/PROJECT.md; VERIFIED: 098-CONTEXT.md; VERIFIED: 099-CONTEXT.md] | Phase 99 must not call the old TypeScript completion path for normal product completion. [VERIFIED: 099-CONTEXT.md] |
| Go public replay metadata reads existing Chronicle rows but does not create them. | Phase 99 makes Go write validated Chronicle rows. | Phase 99 target. [VERIFIED: apps/go-backend/live_backend.go:257-300; VERIFIED: 099-CONTEXT.md] | Stored rows must preserve current public metadata shape. [VERIFIED: packages/spec/src/schemas.ts:1223-1254] |
| TS Chronicle store accepts `match_id` conflicts by returning existing row. | Phase 99 should accept duplicates only when existing row is compatible with requested completion. | Phase 99 target. [VERIFIED: packages/persistence/src/chronicle-store.ts:145-178; VERIFIED: 099-CONTEXT.md] | Go implementation needs stricter conflict checks than the current TS helper. [VERIFIED: 099-CONTEXT.md] |

**Deprecated/outdated:**
- Broad TypeScript DB-owning completion for normal product jobs is no longer the target owner after Phase 99. [VERIFIED: 096-CONTEXT.md; VERIFIED: 099-CONTEXT.md]
- Node `vm` remains prohibited as a hostile-code security boundary. [VERIFIED: AGENTS.md]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | None. | All sections | All factual claims are sourced from repo files, command output, npm/go registry output, Context7 docs, or official Go docs. [VERIFIED: research command outputs] |

## Open Questions

1. **Where will Phase 98 place the execution result DTO?** [VERIFIED: 098-CONTEXT.md]
   - What we know: Phase 98 returns either a valid execution result or a system-failure envelope. [VERIFIED: 098-CONTEXT.md]
   - What's unclear: The exact Go struct path and final state JSON shape are not present before Phase 98 implementation. [VERIFIED: codebase grep]
   - Recommendation: Make Phase 99 completion accept a small internal struct whose fixture JSON mirrors the Phase 98 response. [VERIFIED: 099-CONTEXT.md]

2. **Should Go validate every replay transition or rely on TS-generated parity fixtures for transition parity?** [VERIFIED: packages/replay/src/replay-transition.ts]
   - What we know: TypeScript validation checks grammar, boundary snapshots, transitions, and hash. [VERIFIED: packages/replay/src/validate.ts:11-14; VERIFIED: packages/replay/src/validate.ts:280-289]
   - What's unclear: A full Go replay-transition port may exceed Phase 99 scope. [VERIFIED: 099-CONTEXT.md]
   - Recommendation: For Phase 99, implement structural/integrity/metadata/privacy checks in Go and require TS parity fixtures for transition-heavy scenarios; defer a full Go replay engine unless the plan explicitly needs it. [VERIFIED: 099-CONTEXT.md]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | TypeScript parity fixtures/tests | Yes | `v24.15.0` | None needed. [VERIFIED: command output] |
| pnpm | Workspace scripts | Yes | `11.1.2` | npm scripts are not the project standard. [VERIFIED: command output; VERIFIED: package.json] |
| npm | Registry verification | Yes | `11.12.1` | pnpm for workspace execution. [VERIFIED: command output] |
| Go | Go backend tests | Yes | `go1.26.3`, module target `1.25.0` | None needed. [VERIFIED: command output; VERIFIED: apps/go-backend/go.mod] |
| PostgreSQL client/server | Integration tests and local completion topology | Client yes, default server no response | `psql 16.14`; `/tmp:5432 no response` | Use `pnpm services:up` before DB-backed tests. [VERIFIED: command output; VERIFIED: package.json] |
| Docker | Local service startup | Yes | `29.4.3` | Homebrew Postgres if project scripts support it. [VERIFIED: command output; VERIFIED: package.json] |

**Missing dependencies with no fallback:**
- None found for code-only Go unit tests. [VERIFIED: command output]

**Missing dependencies with fallback:**
- Default local PostgreSQL server was not responding; planner should include `pnpm services:up` for DB-backed integration tests. [VERIFIED: command output; VERIFIED: package.json]

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Go `testing` for Go backend; Vitest `4.1.6` for TypeScript oracle tests. [VERIFIED: apps/go-backend/main_test.go; VERIFIED: package.json; VERIFIED: npm view vitest] |
| Config file | Go: `apps/go-backend/go.mod`; Vitest: workspace package scripts. [VERIFIED: apps/go-backend/go.mod; VERIFIED: package.json] |
| Quick run command | `cd apps/go-backend && go test ./...` [VERIFIED: package.json `go:parity`] |
| Full suite command | `pnpm test:fast && pnpm go:parity` [VERIFIED: package.json] |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| COMP-01 | Valid lease and running job required for completion. [VERIFIED: .planning/REQUIREMENTS.md] | Go unit/integration | `cd apps/go-backend && go test ./... -run TestCompleteMatchRequiresRunningLease` | No, Wave 0. [VERIFIED: rg Go tests] |
| COMP-02 | Duplicate completion idempotent only with compatible existing Chronicle. [VERIFIED: .planning/REQUIREMENTS.md] | Go unit/integration | `cd apps/go-backend && go test ./... -run TestCompleteMatchDuplicateRequiresCompatibleChronicle` | No, Wave 0. [VERIFIED: rg Go tests] |
| COMP-03 | Completion field derivation matches TypeScript. [VERIFIED: .planning/REQUIREMENTS.md] | Go + TS parity fixture | `pnpm --filter @cowards/persistence test -- complete-match && cd apps/go-backend && go test ./... -run TestCompletionFieldsMatchTypeScriptFixture` | TS exists; Go missing. [VERIFIED: packages/persistence/src/complete-match.test.ts; VERIFIED: rg Go tests] |
| COMP-04 | Chronicle metadata/hash validation matches TypeScript. [VERIFIED: .planning/REQUIREMENTS.md] | Go + TS parity fixture | `cd apps/go-backend && go test ./... -run TestChronicleMetadataMatchesTypeScriptFixture` | No, Wave 0. [VERIFIED: rg Go tests] |
| COMP-05 | Chronicle insert and all completion updates are atomic. [VERIFIED: .planning/REQUIREMENTS.md] | DB integration | `pnpm services:up && cd apps/go-backend && go test ./... -run TestCompleteMatchRollsBackOnAttemptUpdateFailure` | No, Wave 0. [VERIFIED: rg Go tests] |
| COMP-06 | Invalid Chronicle/id/hash/privacy cases fail closed. [VERIFIED: .planning/REQUIREMENTS.md] | Go unit + TS projection smoke | `cd apps/go-backend && go test ./... -run TestCompleteMatchRejectsInvalidChronicle` | No, Wave 0. [VERIFIED: rg Go tests] |
| COMP-07 | Go-stored Chronicles remain replay-readable. [VERIFIED: .planning/REQUIREMENTS.md] | TS replay compatibility | `pnpm --filter @cowards/web test -- replay-ready` | Existing replay tests present; Go fixture missing. [VERIFIED: apps/web/app/matches/server.test.ts; VERIFIED: apps/web/app/matches/replay-ready.ts] |
| COMP-08 | Fixtures cover success/runtime violation/duplicate/invalid lease/invalid Chronicle/conflict. [VERIFIED: .planning/REQUIREMENTS.md] | Fixture generation + Go tests | `pnpm go:parity && cd apps/go-backend && go test ./...` | Partial existing parity; Phase 99 fixtures missing. [VERIFIED: scripts/generate-go-parity-fixtures.ts grep; VERIFIED: apps/go-backend/testdata/service-fixtures] |

### Sampling Rate

- **Per task commit:** `cd apps/go-backend && go test ./...` [VERIFIED: package.json]
- **Per wave merge:** `pnpm go:parity && pnpm --filter @cowards/persistence test && pnpm --filter @cowards/web test -- replay` [VERIFIED: package.json; VERIFIED: package scripts grep]
- **Phase gate:** `pnpm test:fast && pnpm go:parity` plus DB-backed completion transaction tests after `pnpm services:up`. [VERIFIED: package.json]

### Wave 0 Gaps

- [ ] `apps/go-backend/completion_test.go` covers COMP-01, COMP-02, COMP-03, COMP-05, COMP-06. [VERIFIED: rg Go tests]
- [ ] `apps/go-backend/chronicle_validation_test.go` covers COMP-04 and hash parity. [VERIFIED: rg Go tests]
- [ ] `apps/go-backend/testdata/completion-fixtures/*.json` generated from TS oracle covers COMP-08. [VERIFIED: scripts/generate-go-parity-fixtures.ts pattern]
- [ ] Optional TS fixture generator extension in `scripts/generate-go-parity-fixtures.ts` covers completion fields and Chronicle metadata. [VERIFIED: scripts/generate-go-parity-fixtures.ts grep]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | No direct new public auth surface in Phase 99. [VERIFIED: 099-CONTEXT.md] | Keep completion internal to Go orchestration. [VERIFIED: 099-CONTEXT.md] |
| V3 Session Management | No direct session change. [VERIFIED: 099-CONTEXT.md] | Do not log or return session/token fields. [VERIFIED: packages/spec/src/public-output-privacy.ts:21-30] |
| V4 Access Control | Yes, lease token is the authorization gate for completing a job. [VERIFIED: packages/persistence/src/complete-match.ts:73-80] | Validate `jobId`, `leaseToken`, and `status='running'` in transaction. [VERIFIED: packages/persistence/src/complete-match.ts:73-80] |
| V5 Input Validation | Yes. [VERIFIED: 099-CONTEXT.md] | Chronicle schema/hash/metadata/privacy validation before persistence. [VERIFIED: packages/replay/src/validate.ts:47-91; VERIFIED: packages/replay/src/hash.ts:24-32] |
| V6 Cryptography | Yes for SHA-256 content hash only. [VERIFIED: packages/replay/src/hash.ts:27-31] | Use standard SHA-256 libraries; do not invent a hash. [VERIFIED: packages/replay/src/hash.ts:1-32; VERIFIED: apps/go-backend/live_backend.go:5-10] |

### Known Threat Patterns for Go Completion

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Spoofed completion request with stale/mismatched lease | Spoofing / Elevation of privilege | Transactional job lookup by `id`, `lease_token`, and `status='running'`. [VERIFIED: packages/persistence/src/complete-match.ts:73-80] |
| Tampered Chronicle hash or mismatched ids | Tampering | Derive metadata/hash server-side and reject drift before insert. [VERIFIED: packages/persistence/src/chronicle-store.ts:78-105] |
| Duplicate writer race | Tampering / Denial of service | Lock job row and accept duplicate only for compatible complete Match + Chronicle row. [VERIFIED: 099-CONTEXT.md; VERIFIED: packages/persistence/src/complete-match.ts:81-97] |
| Private data leakage in evidence | Information disclosure | Project public replay and assert forbidden fields/markers before public evidence use. [VERIFIED: packages/replay/src/project.ts:106-118; VERIFIED: packages/spec/src/public-output-privacy.ts:1-100] |
| Partial database state after failure | Tampering / Repudiation | One transaction and rollback on any failure. [CITED: https://pkg.go.dev/github.com/jackc/pgx/v5; VERIFIED: 099-CONTEXT.md] |

## Sources

### Primary (HIGH confidence)

- `.planning/phases/099-go-match-completion-and-chronicle-persistence/099-CONTEXT.md` - locked Phase 99 decisions. [VERIFIED: local file]
- `.planning/REQUIREMENTS.md` - COMP-01 through COMP-08. [VERIFIED: local file]
- `AGENTS.md` - project non-negotiables and privacy/testing expectations. [VERIFIED: local file]
- `packages/persistence/src/complete-match.ts` - TypeScript completion oracle. [VERIFIED: local file]
- `packages/persistence/src/chronicle-store.ts` - Chronicle metadata/store oracle. [VERIFIED: local file]
- `packages/replay/src/validate.ts`, `hash.ts`, `normalize.ts`, `project.ts`, `reconstruct.ts` - replay validation/hash/projection compatibility. [VERIFIED: local files]
- `packages/spec/src/public-output-privacy.ts`, `versions.ts`, `schemas.ts` - privacy and compatibility versions. [VERIFIED: local files]
- `packages/persistence/migrations/0001_initial.sql` - DB schema. [VERIFIED: local file]
- Context7 `/websites/pkg_go_dev_github_com_jackc_pgx_v5` - pgx transaction docs. [CITED: https://pkg.go.dev/github.com/jackc/pgx/v5]
- Context7 `/vitest-dev/vitest/v4.1.6` - Vitest mock/assertion docs. [CITED: https://github.com/vitest-dev/vitest/blob/v4.1.6/docs/api/expect.md]
- Context7 `/websites/zod_dev_v4` - Zod parse/safeParse docs. [CITED: https://zod.dev/v4]

### Secondary (MEDIUM confidence)

- npm registry outputs for `vitest`, `typescript`, `@playwright/test`, `zod`, and `pg` current versions. [VERIFIED: npm registry]
- Go module registry output for `github.com/jackc/pgx/v5` and `golang.org/x/crypto`. [VERIFIED: go list]

### Tertiary (LOW confidence)

- None. [VERIFIED: sources list]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - versions were verified locally and against registries. [VERIFIED: command outputs]
- Architecture: HIGH - transaction and ownership boundaries are locked in Phase 99 context and existing code. [VERIFIED: 099-CONTEXT.md; VERIFIED: packages/persistence/src/complete-match.ts]
- Pitfalls: HIGH - pitfalls are directly tied to existing TS behavior and locked failure modes. [VERIFIED: packages/persistence/src/chronicle-store.ts; VERIFIED: 099-CONTEXT.md]
- Hash parity: MEDIUM - TS hash rules are clear, but Go implementation needs generated parity fixtures before promotion. [VERIFIED: packages/replay/src/hash.ts; VERIFIED: command outputs]

**Research date:** 2026-05-24 [VERIFIED: system date]
**Valid until:** 2026-06-23 for repo-local architecture; dependency versions should be rechecked within 7 days if updating packages. [VERIFIED: npm/go registry outputs]
