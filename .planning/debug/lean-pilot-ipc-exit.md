---
status: resolved
trigger: Plan265-15 child remained idle with live IPC and zero Match charges; parent recorded intentional termination
created: 2026-10-03
updated: 2026-10-03
---

## Symptoms

Expected: child success or failure closes IPC and terminates so the trusted parent records one terminal. Actual: parent86485/child86519 stayed alive, child CPU stopped advancing and journal had zero charges. Root intentionally terminated child after757571ms; parent closedexit1, statuschild_failed/SIGTERM. Unique independent terminal-only verification closed; source/HEADhold released. Original error is not recorded and remains unknown.

## Current Focus

hypothesis: main child-mode success/failure callbacks do not close IPC; setting exitCode alone leaves the IPC event loop live after an error
test: inert forked child success/failure probes, no evidence import or provider/Match
expecting: current callback reproduces live child; corrected callback exits promptly with correct code and bounded failure metadata
next_action: none; CLI child terminal regression fixed, preserve consumed route and report original cause unknown

## Scope and boundaries

Own only the child CLI terminal path in scripts/run-v1-38-lean-experiment.ts and focused inert tests/helper; do not alter route constants/allocation/accounting, which a separate worker may amend. Add only finite literal whitelisted failure codes/stages, never raw error/stdout/runtime IO/private Strategy data. No actual consumed-route resume, historical reader, allocation, provider or Match. Keep schema/rules/runtime/privacy and resource bounds fixed. Child-owned providers must cleanup before channel closure; parent must retain exactly one terminal on both success and error. You are not alone; preserve other edits. Current fixed sourcea5baa650, held docsHEAD8961bf9b nowreleased. User authorized autonomous source repairs and distinct future routes, not a budgetreset.

## Evidence

- Parent root79864 closed after intentional SIGTERM; parentterminal raw74fc7885311158e587a101fc06b7cae4b52dae6597740c150cdfaa8637c9510a.
- CLI currently emits withheld error and sets process.exitCode=1; child has open IPC. Success callback also leaves channel open.
- Independent terminal-only verification v2 proves zerocharges/noresult, closedprocesses, cumulative1323030ms; no actual original error explanation.

## Root Cause

The CLI terminal wrapper handled a rejected child action by setting `process.exitCode = 1` and handled success without a child-specific terminal step. In both cases the child kept its IPC channel connected; `exitCode` alone does not close that live handle, so the child could remain alive after its action settled. The exact exception from the original consumed run remains unknown; this finding explains the observed CLI hang mechanism, not that past exception.

## Fix and Verification

- Added a child terminal helper that waits for the action promise to settle, sets a bounded success/failure exit code, emits only the fixed `LEAN_PILOT_FAILED_DETAILS_WITHHELD` marker on failure, sends an exact-schema IPC receipt with allowlisted code/stage (unknown private errors map to `UNKNOWN_INTERNAL_FAILURE`), then disconnects. The action promise settles only after child-owned provider cleanup completes.
- Parent validates the exact receipt, treats malformed/duplicate receipts as uncertain failure, and stores a valid receipt through the existing create-exclusive bounded writer at `STORE/entry-failure.json`. The helper is included in the source manifest.
- Added forked inert success, known-failure, and private/unknown-failure probes plus tamper-schema checks. Children exit promptly; cleanup precedes receipt/disconnect, and no raw private error is emitted or retained.
- `pnpm exec vitest run scripts/run-v1-38-lean-experiment.test.ts`: 16 passed.
- `pnpm exec tsc --noEmit`: passed.
- No consumed route, historical reader, allocation, provider, or Match was opened or resumed.

## Resolution

- root_cause: CLI child success and failure handling left its IPC channel connected after the action settled, keeping the child process alive.
- fix: Await child action completion and cleanup, send only finite whitelisted failure diagnostics, persist the validated receipt exclusively in the parent, then disconnect IPC; add inert fork regression coverage.
- original_run_error: unknown
