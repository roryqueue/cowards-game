---
phase: 262-foundation-admission-measurement-custody-and-containment-con
reviewed: 2026-08-23T21:02:34Z
depth: deep
files_reviewed: 6
files_reviewed_list:
  - scripts/check-v1-38-dependency-revision-boundaries.ts
  - scripts/evaluate-v1-38-successor-route.test.ts
  - scripts/evaluate-v1-38-successor-source-complete.test.ts
  - scripts/lib/v1-38-current-matrix-reproduction.ts
  - scripts/lib/v1-38-source-completeness-review-v3.ts
  - scripts/lib/v1-38-successor-source-seal.ts
findings:
  critical: 0
  warning: 1
  info: 0
  total: 1
status: issues_found
---

# Phase 262 Plan 262-60: Code Review V4

**Reviewed:** 2026-08-23T21:02:34Z
**Depth:** deep
**Files Reviewed:** 6
**Status:** issues_found

## Summary

The V3 correction materially closes all five earlier findings: production and analyzer now share the exact `codex-plan-262-60-a9-review-fix-v3` run, the disposable integration fixture creates a real B9 and executes the readiness and route-start argv through the real handlers, observation providers can produce a genuine tool-identity mismatch, deletion custody is tied to the A9 first-parent ancestry exactly once, and normal/compile-failure/explicit helper disposal leaves no new temporary paths.

One new robustness defect remains in the helper's signal cleanup. The library removes every `SIGINT`/`SIGTERM` listener owned by the host process, not only the listener it installed.

## Narrative Findings (AI reviewer)

## Warnings

### WR-01: Native-helper signal cleanup deletes unrelated process handlers

**Classification:** WARNING
**File:** `scripts/lib/v1-38-source-completeness-review-v3.ts:504-508`
**Issue:** `installDetachedHelperFallbacks()` installs process-wide signal listeners, then calls `process.removeAllListeners(signal)` while handling `SIGINT` or `SIGTERM`. That removes handlers registered by the test runner, application, telemetry, graceful-shutdown code, or any other imported module. This is observable even without terminating the process: after compiling the helper with one unrelated `SIGTERM` listener installed, the listener count went from two to zero and the unrelated callback was no longer registered. A library cleanup hook must not take ownership of other modules' signal handlers. The focused tests exercise explicit and compile-failure cleanup but contain no signal-listener isolation assertion.

**Fix:** Keep named references to this module's handlers and remove only those handlers with `process.off(signal, handler)`. Prefer installing termination policy at the CLI entrypoint rather than from an importable library. Add a child-process test that registers an unrelated signal listener, initializes the helper, delivers the signal, and proves both helper cleanup and preservation of the unrelated listener/expected shutdown behavior. Never call `removeAllListeners` for a shared process signal.

## V3 Finding Disposition

- **V3 CR-01 — closed:** production custody, analyzer custody, validation, and tests import one shared correction-run identifier; direct production custody resolved four commits from `2296a5812f1bcad45fe32165534668eeb79caf46` through `32eef5c147dc34b1a75c936ed7a0148f8e5d748e` over exactly the six scoped paths.
- **V3 CR-02 — closed:** the static manifest is authorization metadata only. The disposable clone publishes synthetic review/authorization/seal artifacts, commits a distinct real B9, then executes the exact readiness and route-start argv through `runReceiptCli`; both outputs were non-empty and byte/hash distinct, and the route-start artifact bound the real A9/B9 pair.
- **V3 CR-03 — closed:** the sealed expected tool root is immutable and the observation-provider seam supplies only the observed root. The real authority route rejects a matching observation as a false failure and accepts a distinct observed root as `tool_identity_failed`; the terminal writer and checker propagate the same provider through `plan26257Evidence`.
- **V3 CR-04 — closed:** custody requires the historical deletion commit to be an ancestor of both sourceBase9 and sourceA9, and to occur exactly once on sourceA9's first-parent walk. The orphan/reachable-object fixture rejects a deletion outside that lineage.
- **V3 WR-01 — closed for ordinary lifecycle:** explicit disposal is idempotent, compilation failure removes its just-created directory, CLI dispatch disposes in `finally`, suite teardown disposes, and the pre/post focused-run `v138-openat-*` inventories were identical. WR-01 above is a separate signal-coexistence defect in the new fallback implementation.

## Verification Evidence

- `pnpm exec vitest run scripts/evaluate-v1-38-successor-route.test.ts scripts/evaluate-v1-38-successor-source-complete.test.ts --pool=forks --maxWorkers=1 --no-file-parallelism --testTimeout=1500000 --bail=1` — 2 files and 31 tests passed in 194.47 seconds.
- `pnpm exec tsc --noEmit --pretty false` — passed.
- `pnpm exec tsx scripts/check-v1-38-dependency-revision-boundaries.ts --check` — passed with `findingCount: 0`, `matrixAdmissionStatus: blocked`, and `downstreamAuthority: denied`.
- Direct `inspectV138SourceA9Custody` execution resolved the shared four-commit correction run, six exact paths, and deletion commit `8c3cab21d7da0d59101480e17a973e0317646622`.
- Canonical review/report, authorization/seal, route-start, preflight, calibration, reproduction, and terminal destinations remained absent.
- Signal-coexistence reproduction: after helper initialization, emitting `SIGTERM` with `process.kill` stubbed produced `{before:2,after:0,unrelatedStillRegistered:false}`.
- No source or canonical/live-state file was modified. Only this V4 report was added; pre-existing untracked review reports were preserved.

---

_Reviewed: 2026-08-23T21:02:34Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
