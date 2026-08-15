---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "54"
reviewed: 2026-08-14T23:16:33Z
depth: deep
source_base: b975f1abc958ed31d144a39fe7f765d2790e8b10
reviewed_source_commit: e0bce44383c1e9be904f863d5407468e4543d746
files_reviewed: 4
files_reviewed_list:
  - scripts/evaluate-v1-38-successor-route.test.ts
  - scripts/evaluate-v1-38-successor-source-complete.test.ts
  - scripts/lib/v1-38-current-matrix-reproduction.ts
  - scripts/lib/v1-38-successor-source-seal.ts
findings:
  critical: 8
  warning: 2
  info: 0
  total: 10
status: issues_found
---

# Phase 262 Plan 54: Code Review Report

**Reviewed:** 2026-08-14T23:16:33Z
**Depth:** deep
**Files Reviewed:** 4
**Status:** issues_found

## Summary

The exact A7 commit changes the declared four paths, but the executable custody code does not bind that four-path range and the route state machine is not complete. Authorization-v7 can be built from a fabricated review and later validated as a self-authenticated object; B7 validation does not compare the supplied authorization/seal to the bytes committed at B7; and the function named `checkV138SealedWorktreeAtA7` never checks worktree bytes. Those gaps allow unreviewed or post-seal source/evidence to be treated as route authority.

The execution surface also violates its terminal contract. A durable pre-start obstruction does not prevent a later route start, dangling-symlink destinations bypass the initial freshness test, `fresh_destination_failed` is omitted from the closed disposition set, and four terminal branches explicitly require the atomic route-start receipt to be absent. Calibration consumption is charged under v9 identities while its receipt is rewritten to v11 identities.

Independent verification of the two focused files failed on the exact clean checkout: 18 tests passed and 1 failed because the disposable fixture unconditionally applies an empty ambient worktree diff (`error: No valid patches in input`). Thus the reported source-completeness proof is not reproducible from committed A7.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01 [BLOCKER]: The committed source-completeness suite fails on clean A7

**File:** `scripts/evaluate-v1-38-successor-source-complete.test.ts:212-225`

**Issue:** The fixture clones the current repository and then obtains source bytes exclusively from `git diff --binary` with no revision range. On a clean checkout of committed A7 that diff is empty, but the test still invokes `git apply --binary -`; Git rejects the empty input before any valid route-start/preflight reachability is exercised. The exact review command produced 18 passes and this failure. The test only worked while the implementation existed as unstaged/uncommitted bytes, so it cannot serve as durable evidence for A7 or CI.

**Fix:** Build the fixture from explicit immutable revisions. For example, clone/reset to `sourceBase7`, apply `git diff --binary sourceBase7..A7 -- <four paths>`, commit that exact patch as the fixture A7, and verify its tree/path/blob identities. Alternatively clone exact A7 and use it directly as `sourceA7` without applying an ambient diff. Never make test correctness depend on worktree dirtiness.

### CR-02 [BLOCKER]: A7 custody silently reuses the three-path A6 inventory and never verifies sealed worktree bytes

**File:** `scripts/lib/v1-38-successor-source-seal.ts:5103-5120,5702-5703,5876-5882`

**Issue:** `inspectV138SourceIdentityA7` is only an alias for `inspectV138SourceIdentityA6`. The inherited `V138_PLAN_262_47_SOURCE_PATHS` contains three paths and omits `scripts/evaluate-v1-38-successor-source-complete.test.ts`, one of the four exact A7 paths. It also does not bind `sourceBase7`, enumerate the complete `sourceBase7..A7` range, constrain every range commit to the four-path allowlist, or check the implementation-author trailer. Finally, `checkV138SealedWorktreeAtA7` merely re-inspects the Git commit; unlike the v6 checker at lines 5326-5335, it never compares current source bytes with the sealed blobs. Route authority can therefore omit the proof file, point at an arbitrary full commit, or execute modified worktree source after sealing.

**Fix:** Introduce a route-7-specific four-path inventory and an A7 custody inspector that requires exact `sourceBase7`, ancestry/range commits, trees, sole-parent topology, per-commit paths/trailers, aggregate paths, and all four final blobs. During every authority check, read each worktree source through the repository-scoped no-follow helper and compare it byte-for-byte and by blob/hash to A7.

### CR-03 [BLOCKER]: Review and authorization-v7 are accepted as attacker-selected self-authenticated evidence

**File:** `scripts/lib/v1-38-successor-source-seal.ts:5705-5713,5741-5804,5806-5838`

**Issue:** The review validator accepts any object containing a full OID, `findingCount: 0`, `sourceCompletenessPassed: true`, and any syntactically valid SHA-256 string. It does not enforce exact keys, canonical review bytes, reviewer separation/custody, the reviewed four-path range, or recompute `reviewRoot`. The integration test demonstrates the bypass by supplying `reviewRoot: sha256:555...` at lines 227-232. The authorization checker then validates only a few literals and a root computed over the caller-supplied body; it does not rebuild the authorization from A7/review/literal, validate the literal hash, or independently rederive `selectedRouteClosure`, protected history, all prior authorization bytes, policy/tool/privacy/formation roots, and downstream denial. A caller can manufacture a zero-finding review and arbitrary historical roots, recompute `authorizationRoot`, seal that body, and obtain accepted route authority.

**Fix:** Define and validate the complete Plan-262-55 review schema with exact keys, committed canonical bytes, independent-review Git custody, recomputed review root, and exact A7 binding. Make `checkV138Plan26256AuthorizationV7` rebuild the one valid authorization from those committed inputs and the exact approved literal, then require canonical equality. Independently derive every protected root and exact 40-ID/prior-authorization inventory instead of trusting values covered only by a caller-generated hash.

### CR-04 [BLOCKER]: B7 custody never binds authorization/seal inputs to the blobs committed at B7

**File:** `scripts/lib/v1-38-successor-source-seal.ts:5906-5950`

**Issue:** `checkV138SuccessorSealCommitV7` verifies B7's parent and changed path names and records blob metadata, but it never reads the two B7 blobs, compares them with `authorizationValue`/`sealValue`, checks canonical serialized bytes, or compares the working artifacts with the committed bytes. Consequently, a direct-child B7 containing different or malformed evidence can be paired with separately supplied self-consistent objects and pass custody. The route path reads mutable working files and passes those values to this checker, so post-B7 replacement is also accepted. This regresses the explicit v6 committed/worktree equality checks at lines 5427-5440.

**Fix:** Read both artifacts from B7, parse and validate those exact bytes, require canonical newline-terminated serialization, and compare them byte-for-byte with repository-scoped no-follow reads of the working paths. Derive authorization/seal roots from the committed objects only and reject any caller object that is not exactly identical.

### CR-05 [BLOCKER]: An expired pre-start obstruction can still be followed by a route start

**File:** `scripts/lib/v1-38-current-matrix-reproduction.ts:18990-19013,19325-19329,20546-20565`

**Issue:** The pre-start disposition declares `authorityExpired: true` and `noRetry: true`, and the readiness checker rejects its presence. The actual route-start writer never calls that checker and never checks `V138_PLAN_262_57_PRE_START_OBSTRUCTION_PATH`; `assertV138Plan26257AuthorityOpen` checks only the terminal path. After `writeV138Plan26257PreStartObstructionV1` publishes the permanent no-retry disposition, a caller can remove/fix the obstructing route destination and successfully publish route-start, reusing authority that the disposition says is expired.

**Fix:** Make route-start consume one authoritative readiness result immediately before publication and fail if the pre-start disposition exists under no-follow semantics. Centralize an `authorityOpen` check that rejects either terminal or pre-start-expiry artifacts and call it before and immediately at the exclusive publish boundary. Add a regression that writes the obstruction disposition, removes the obstruction, and proves route-start remains permanently denied.

### CR-06 [BLOCKER]: Initial route freshness misses dangling symlinks and can start the route in an obstructed state

**File:** `scripts/lib/v1-38-current-matrix-reproduction.ts:18994-19002,20160-20177`

**Issue:** Route start tests all destinations with `existsSync`. Node returns false for a dangling symlink, so a dangling symlink at any non-context route destination is treated as absent and the atomic route-start receipt is published. The same fail-open presence test is used when validating pre-observation and optional terminal evidence. This contradicts the exclusive destination resolver and the rule that initial obstructions belong only to the distinct pre-start disposition. The later lstat-based obstruction code cannot undo the already-started route.

**Fix:** Replace all security-relevant `existsSync` absence decisions with one repository-scoped lstat/no-follow resolver that validates every ancestor, distinguishes ENOENT from a symlink, and pins/rechecks the parent chain. Run it over every fresh destination plus the pre-start disposition immediately before exclusive route-start publication. Add leaf and ancestor dangling-symlink mutations for every destination and terminal evidence branch.

### CR-07 [BLOCKER]: `fresh_destination_failed` is implemented but excluded from the closed terminal disposition set

**File:** `scripts/lib/v1-38-current-matrix-reproduction.ts:18877-18883,19962-19968,20402-20431`

**Issue:** The writer and evidence machinery contain a full `fresh_destination_failed` branch, but `V138_PLAN_262_57_DISPOSITIONS` omits that value. `writeV138Plan26257TerminalV1` calls `checkV138Plan26257Disposition` before deriving its obstruction proof, so this promised post-start obstruction terminal always throws `MATRIX_PLAN_262_30_DISPOSITION_INVALID`. The route cannot terminalize every reached state and may leave consumed authority without a terminal.

**Fix:** Add `fresh_destination_failed` to the canonical disposition inventory, route contract, CLI parser, manifest, and exhaustive terminal tests. Assert every disposition is reachable through the real writer/checker, not merely mentioned in branch code.

### CR-08 [BLOCKER]: Pre-observation terminal branches explicitly require the atomic route start to be absent

**File:** `scripts/lib/v1-38-current-matrix-reproduction.ts:19971-19990,20160-20166,20241-20259`

**Issue:** For `tool_identity_failed`, `protected_history_failed`, `formation_absence_failed`, and `pattern_c_ownership_failed`, `plan26257Needs` sets `context: false`; `plan26257Evidence` then requires the route-start/context destination and all markers to be absent. The terminal writer can therefore publish a Plan-262-57 terminal without the one atomic route-start receipt. This directly violates the contract that initial destination obstruction is the only pre-start disposition and all route terminal branches exist only after route start. It also makes the promised charge/expiry ordering unverifiable because these branches never consume the preflight attempt embedded in route start.

**Fix:** Redesign these checks as post-route-start, pre-live-observation failures: require and validate route-start/context plus its atomic preflight-consumption marker, bind the failure proof to its root, and terminalize from that durable state. If some failures genuinely prevent route start, represent them as explicit non-terminal pre-start dispositions rather than forging a route terminal.

## Warnings

### WR-01 [WARNING]: Calibration consumption records v9 identities while the route publishes v11 calibration identities

**File:** `scripts/lib/v1-38-current-matrix-reproduction.ts:19570-19574,19614-19620,20199-20218`

**Issue:** The calibration receipt is adapted by replacing `:v9:` identities with `:v11:`, but both the calibration consumption writer and terminal evidence derive their charged IDs directly with `deriveV138CalibrationAttemptMappings(inventory, "v9")`. Thus the durable consumption root charges `calibration:v9:*` while the checked v11 receipt exposes `calibration:v11:*`. No join proves that the consumed attempt ledger equals the published calibration attempt ledger, weakening the exact eight-attempt accounting and historical-charge chain.

**Fix:** Derive route-7 calibration charge IDs in their canonical v11 namespace (or extract them from the checked v11 receipt) and require exact equality between marker identities, receipt attempt identities, and terminal counts/roots. Add mutation tests for version drift and reordered/substituted IDs.

### WR-02 [WARNING]: The completeness test does not exercise eight of ten valid command paths or any terminal branch

**File:** `scripts/evaluate-v1-38-successor-source-complete.test.ts:75-130,159-202,204-264`

**Issue:** The manifest test finds command text with `source.includes`, checks export names, and verifies only that every allowlisted command routes to a generic `runReceipt` callback. The CLI test sends malformed arguments for all ten commands, while the sole valid fixture path invokes only route-start and preflight. Calibration, reproduction, readiness/obstruction, terminal write/check, every terminal disposition, collisions, interruption ordering, privacy/formation projections, and injected child-runner isolation are never reached through their real parser/handler/writer paths. Handler strings in the manifest are not mechanically joined to handlers. This is the same schema/string-presence proof class that Plan 262-54 was intended to eliminate.

**Fix:** Build a table-driven disposable Git scenario for every valid command and every disposition. Instrument injected observer/runner/sink dependencies, assert marker-before-effect ordering and exact destination bytes, and prove live observer/child/provider functions are unreachable. Mutate each path alias/symlink/collision and each authority/history/privacy/formation root. Make the manifest derive from actual dispatch registrations or assert dispatch-to-handler events rather than source substrings.

---

_Reviewed: 2026-08-14T23:16:33Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
