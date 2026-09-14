---
phase: 264-immutable-factory-independent-oracles-and-quarantined-intake
reviewed: 2026-09-14T19:06:00-04:00
initial_source_commit: 6690a360b683d2d34c0a5769dcb3f31e8a0daa1b
source_commit: f2f1486428e6e237e5a9ed5c01c2ac7fbf8ea755
parent_commit: f826b4fd79799b3c2adf729264fcbba54ce062f3
depth: deep
files_reviewed: 6
files_reviewed_list:
  - scripts/v1-38-factory-app-server-transport.ts
  - scripts/v1-38-factory-app-server-transport.test.ts
  - scripts/v1-38-factory-execution-evidence.ts
  - scripts/v1-38-factory-execution-evidence.test.ts
  - packages/strategy-oracle-model/src/bundle.ts
  - packages/strategy-oracle-model/src/model.test.ts
findings:
  critical: 0
  warning: 0
  info: 0
  total: 0
unresolved_relevant_findings: 0
status: clean
---

# Phase 264: Client Echo Review

**Reviewed:** 2026-09-14T19:06:00-04:00
**Depth:** deep
**Files Reviewed:** 6
**Status:** clean

## Summary

The final source commit accepts both historical no-echo transcripts and one exact, ordered `userMessage` started/completed lifecycle. It rejects malformed, substituted, wrong-thread, stale-turn, empty-ID, duplicate, reordered, incomplete, tool, reroute, and error cases across the live transport and retained bundle/evidence decoders. The initialization opt-out is limited to the one schema-supported upstream method `item/agentMessage/delta`; final `item/completed` evidence remains retained and no local raw filtering was introduced.

Focused mocked-process tests passed: 28 tests across the transport, execution-evidence, and model suites. Strict TypeScript checks passed for `packages/strategy-oracle-model/tsconfig.json` and the root `tsconfig.json`. No provider, auth, authored source, runtime, or Match was executed. The separate raw-transcript packaging-cap issue is outside this source review and is not an empirical pass.

## Narrative Findings (AI reviewer)

No Critical, Warning, or Info findings remain in the bounded review scope.

## Resolved Prior Critical Findings

### CR-01: Changed bundle decoder failed strict TypeScript compilation — resolved

The final decoder narrows the optional user-message ID before Set access. Both targeted strict type checks now pass.

### CR-02: A non-completed agent message could be admitted as authoritative source — resolved

`bundle.ts` now assigns a source only for `item/completed` `agentMessage` events. An `item/started` agent message is not source evidence.

### CR-03: User-message echo lifecycle could be duplicated or stale across retained evidence — resolved

All three paths now require a single non-empty ID with started-before-completed ordering, exact thread/turn/prompt identity, and reject stale-turn user messages rather than ignoring them. The final regression coverage includes duplicate, stale-turn, and empty-ID retained-evidence cases; live transport retains its exact prompt and lifecycle checks.

---

_Reviewed: 2026-09-14T19:06:00-04:00_
_Reviewer: /root/review_264_client_check_
_Depth: deep_

## Approved Two-Attempt Composition Addendum

**Reviewed:** 2026-09-14T19:10:00-04:00
**Composition:** `/private/tmp/cg-264-task04-approved-Un1gVC/dispatch.mts`
**Bound source commit:** `f2f1486428e6e237e5a9ed5c01c2ac7fbf8ea755`
**Current checkout:** `c31c043729344feded43a639d7dd431e27647914` (planning-only changes after the bound source)

Static composition recheck found no new findings. `review-binding.json`, the clean-report gate, ancestry check, non-planning diff check, and clean tracked-worktree check bind preparation to the reviewed source. The dispatch creates a new ledger and permits only `A-01`/`A-02`; it records two separately retained prior charged attempts (an unavailable 50,000-token reservation and known 9,767 tokens), caps fresh authoring at 100,000 tokens, and records a maximum accounted cumulative total of 159,767 below the original 200,000-token ceiling. The fresh ledger receives the existing 30-minute first-attempt window, and valid or fatal terminals stop further authoring.

Materialization is gated on a valid retained author bundle and `verifyFactoryAuthoringRecords`; it retains three real base ingestions, nine calibration-only controls, and the linked review/implementation/evidence roots. The fresh-calibration reopening requires exactly 12 slots and 48 canonical workloads, while the runner requires the fresh authorization and execution-evidence gate before workload supervision. The dispatch was not executed; this is a composition review, not an empirical pass.
