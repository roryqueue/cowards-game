---
phase: 256-counted-safety-and-canonical-authority
fixed_at: 2026-07-13T11:50:13Z
review_path: .planning/phases/256-counted-safety-and-canonical-authority/256-REVIEW.md
iteration: 2
findings_in_scope: 4
fixed: 4
skipped: 0
status: all_fixed
---

# Phase 256 Code Review Fixes — Iteration 2

All four iteration-2 findings were fixed. Production execution and MatchSet creation now derive executable-lane identity from mounted deployment authority, scheduling instants are language-neutral, and authority installation transitions serialize with every counted lifecycle boundary.

## Findings

### CR-01 — Production runtime execution has deployment-lane authority

- Status: fixed: requires human verification.
- Commit: `1a0ab4d`
- Production startup now requires and validates a mounted `runtime-deployment-lane-registry-v1.37`. The service-owned resolver reconstructs the exact lane identity from immutable profile data, verified artifact bytes, and toolchain identity before runtime construction.
- HTTP proof uses the same environment/configuration path as the production entrypoint. Exact execution succeeds; provider, language, runtime, toolchain, adapter, policy, corpus, artifact identity, implementation, build, and artifact-byte drift all fail closed.

### CR-02 — Go creation derives lane identity independently

- Status: fixed: requires human verification.
- Commit: `bfbb2d9`
- Go startup requires the same strict mounted deployment registry and verifies its profiles against the authority tuple before opening the database.
- Creation and claimed-job request construction derive full lane identity from the locked revision, provider proof, registry profile, runtime/toolchain data, and exact artifact bytes. Production code no longer trusts `metadata.executableLaneIdentity`.
- A normal provider-validation-to-save-to-registry-to-certified-creation test succeeds. Manifest and revision drift tests fail closed.

### CR-03 — Installed authority is monotonic and lifecycle-safe

- Status: fixed: requires human verification.
- Commit: `bf45cb6`
- Append-only terminal evidence preserves the highest generation ever installed independently of each publication's latest terminal state. The canonical installed-head view never re-enables an older generation after a higher installation and closes execution while a higher generation is uncertain.
- A database trigger makes every terminal event writer take the singleton publication-head update lock. Creation, claim, in-flight recheck, and completion take the conflicting shared lock before reading authority state or mutating lifecycle state.
- The in-flight recheck intentionally uses `READ COMMITTED`: after waiting for a writer that acquired the head first, its evidence query must observe that writer's commit.
- Real PostgreSQL tests cover lifecycle-first and writer-first lock orderings plus `G2 installed -> uncertain`, exact reconciliation, and `G2 failed before rename`.

### WR-01 — Scheduling instants are canonical across languages

- Status: fixed: requires human verification.
- Commit: `8a0d641`
- One shared TypeScript parser now requires exact `YYYY-MM-DDTHH:mm:ss.sssZ` round-trip equality at schema and persistence boundaries, matching Go.
- Shared JSON vectors cover offsets, missing or extra fractional digits, impossible dates, leap-day validity, and interval ordering; both TypeScript and Go consume the same vectors.

## Verification

- Spec: 5 files, 72 tests passed; typecheck passed.
- Persistence with real PostgreSQL: 18 files, 204 tests passed serially; typecheck passed.
- Runtime service: 6 files, 56 tests passed; typecheck passed.
- Go backend: full package tests passed with the real PostgreSQL test URL.
- Formatting and patch integrity: `gofmt -d` and `git diff --check` were clean before commit.

## Surprises

- The runtime-service production path had remained completely closed even though focused tests passed, because only tests injected the lane resolver.
- Go's expected lane field was both absent from the production validation response and unsuitable as independent authority; fixing the comparison alone would not have fixed the ownership problem.
- `REPEATABLE READ` was unsafe for the writer-first lock ordering: a transaction could wait correctly yet retain a pre-writer snapshot. The lock protocol therefore pairs with a post-lock `READ COMMITTED` evidence read.
- Parallel Vitest migration setup can race PostgreSQL system-catalog type creation; the authoritative persistence run uses one worker and passed all 204 tests. This is test-schema setup behavior, not an authority-state race.
